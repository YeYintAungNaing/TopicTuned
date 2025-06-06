import express from "express"
import cors from "cors"
import axios from 'axios'
import 'dotenv/config';
import db from './db'
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import cookieParser from "cookie-parser"
import {redis} from './redisServer'

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const GAMESPOT_API_KEY = process.env.GAMESPOT_API_KEY;

// interface YouTubeChannelsResponse {
//   items: {
//     contentDetails: {
//       relatedPlaylists: {
//         uploads: string;
//       };
//     };
//   }[];
// }

// interface YouTubePlaylistItem {
//   snippet: {
//     title: string;
//     publishedAt: string;
//     thumbnails: {
//       medium: {
//         url: string;
//       };
//     };
//     resourceId: {
//       videoId: string;
//     };
//     channelTitle: string;
//   };
// }

// interface YoutubePlaylist {
//   items : YouTubePlaylistItem[]
// }
// interface JWTDecoded extends JwtPayload {
//   userId: number;
// }

interface YOUTUBE_CHANNEL {
  channelId : string,
  title : string
  icon : string
}

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true
}))


app.post("/auth/register", async (req, res) => {
  try {
    const {userName, password} = req.body
    const duplicateUser = await db.query(  // empty array in case no matching
      'SELECT * FROM users WHERE user_name = $1',
      [userName]
    );

    if (duplicateUser.rows.length > 0) { 
      res.status(409).json({ ServerErrorMsg: "Username is already taken" });
      return
        
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const returnedData = await db.query(
      'INSERT INTO users (user_name, password) VALUES ($1, $2) RETURNING user_id',
      [userName, hashedPassword]
    )
    const user_id = returnedData?.rows[0]?.user_id
   

    if (!user_id) {
      //await db.query("DELETE from users WHERE user_id = $1", [user_id])
      throw Error("Unexpected error")
    }
   
    await db.query(
      'INSERT INTO preferences (user_id) VALUES ($1)',
      [user_id]
    )

    res.status(200).json({message : "Successfully registered"})

  }
  catch(e){
    res.status(500).json({ ServerErrorMsg: "Internal Server Error" })
    console.log(e)
  }
})


app.post("/auth/login", async (req, res) => {
  try{
  
      const userData = await db.query(  // empty array in case no matching
        'SELECT * FROM users where user_name = $1',
        [req.body.userName]
      );
      
      if (userData.rows.length === 0) { 
        res.status(409).json({ ServerErrorMsg: "User not found" });
        return  
      }

      const isCorrect = bcrypt.compareSync(req.body.password, userData.rows[0].password);

      if(!isCorrect) {
          res.status(401).json({ ServerErrorMsg: "Incorrect password" });
          return
      }

      const token = jwt.sign({userId : userData.rows[0].user_id}, "jwtkey", { expiresIn: '10h' })

      const {password, ...userDetails} =  userData.rows[0] 
      res.cookie('jwt_token', token, {    
          httpOnly:true,
          secure: true,  
          sameSite : "none",  
          maxAge: 3600 * 10 * 1000 
      }).status(200).json(userDetails)     
  }
  catch(e) {
      res.status(500).json({ ServerErrorMsg: "Internal Server Error" })
      console.log(e)
  }
})

function delay(ms : number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function fetchNewsByCategory(categories: string[]) {
  const promises = categories.map(async (category) =>
  {
    await delay(1000)
    return axios.get(`https://gnews.io/api/v4/top-headlines`, {
      params: {
        category,
        lang: 'en',
        country: 'us',
        max: 2,
        apikey: GNEWS_API_KEY,
      },
    })
  }
      
  );

  const results = await Promise.allSettled(promises);

  const newsByCategory: Record<string, any[]> = {};

  results.forEach((result : any, index) => {
    const category = categories[index];

    if (result.status === 'fulfilled') {
      newsByCategory[category] = result.value.data.articles;
    } 
    else {
      console.error(`Failed to fetch category "${category}":`, result.reason);
      newsByCategory[category] = []; 
    }
  });

  return newsByCategory;
};


async function fetchVideosByChannel(channels : YOUTUBE_CHANNEL[]) {
  //console.log(channels)
  const promises = channels.map((channel) => 
    axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
        part: 'snippet',
        channelId : channel.channelId, 
        maxResults: 4,
        order: 'date',
        type: 'video',
        videoDuration: 'any', 
        key: YOUTUBE_API_KEY,
      },
    })
  )
  
  const results = await Promise.allSettled(promises)
  const videosByChannel : Record<string, any[]> = {};
  //console.log(results)
  results.forEach((result : any, index) => {
    const channelName = channels[index].title

    if (result.status === 'fulfilled') {
      videosByChannel[channelName] = result.value.data.items.map((item: any) => ({
          channelTitle : channelName,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails.medium.url,
          videoUrl : `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));
    }
    else {
      console.error(`Failed to fetch vidoes from "${channelName}":`, result.reason);
      videosByChannel[channelName] = [];
    }
  })
  return videosByChannel;

}


app.get('/GNews', async (req, res) => {
    try{

      const token = req.cookies?.jwt_token;

      if (!token){
          res.status(401).json({ ServerErrorMsg: "Not logged in" });
          return
      }

      jwt.verify(token, "jwtkey", async (err , decoded ) => {

          if (err) {
              return res.status(403).json({ ServerErrorMsg: "Invalid token" });
          }
          

          //console.log(decoded)
          const categories = await db.query('SELECT * FROM preferences WHERE user_id = $1', [decoded.userId])

          if (categories.rows.length === 0) {
            return res.status(404).json({ ServerErrorMsg: "Corrupted user preference data" });
          }

          
          // const subRedditList : string[] = categories.rows[0].reddit 
          // const youtubeChannels : string[] = categories.rows[0].youtube

          // console.log(gnewsCategories)
          // console.log(subRedditList)
          // console.log(youtubeChannels)

          
          // const response : any = await axios.get(
          //   `https://gnews.io/api/v4/top-headlines?category=${gnewsCategories[0]}y&lang=en&country=us&max=5&apikey=${GNEWS_API_KEY}`
          // )


          const gnewsCategories : string[] = categories.rows[0].gnews 

          const cachedData = await redis.get(`${decoded.userId}gnews${JSON.stringify(gnewsCategories)}`);

          if (cachedData) {
            const parsedCachedData = JSON.parse(cachedData);
            res.status(200).json(parsedCachedData)
            console.log('used cache data')
            return 
          }
          console.log('no cache data')

          const news : any =  await fetchNewsByCategory(gnewsCategories);
          
          res.status(200).json(news)

          if (Object.keys(news).length > 0) {
            try {
              await redis.set(
                `${decoded.userId}gnews${JSON.stringify(gnewsCategories)}`, 
                JSON.stringify(news),
                'EX', 7200
              )
            }
            catch(e) {
              console.log('caching error from backend', e)
            } 
          }
      })     
    }
    catch(e) {
        res.status(500).json({ServerErrorMsg: "Internal Server Error" })
        console.log(e)
    }
})


app.put('/preferences/gnews', async (req, res) => {
  try{

    const token = req.cookies?.jwt_token;

    if (!token){
        res.status(401).json({ ServerErrorMsg: "Not logged in" });
        return
    }


    jwt.verify(token, "jwtkey", async (err, decoded) => { 

        if (err) {
          return res.status(403).json({ ServerErrorMsg: "Invalid token" });
        }

        const gnews = req.body.gnews
      
        
        await db.query(
          'UPDATE preferences set gnews = $1 WHERE user_id = $2',
          [ gnews, decoded.userId]
        );
    
        res.status(200).json({message : "Prefenece deleted successfully successful"})
      }
    )
  }
  catch(e) {
    res.status(500).json({ServerErrorMsg: "Internal Server Error" })
    console.log(e)
  }
})


app.get('/Youtube', async (req, res) => {
        try {

          const token = req.cookies?.jwt_token;

          if (!token){
              res.status(401).json({ ServerErrorMsg: "Not logged in" });
              return
          }


          jwt.verify(token, "jwtkey", async (err, decoded) => { 

            if (err) {
              return res.status(403).json({ ServerErrorMsg: "Invalid token" });
            }
            //console.log(decoded)

            const preferences = await db.query('SELECT * FROM preferences WHERE user_id = $1', [decoded.userId])

            if (preferences.rows.length === 0) {
              res.status(404).json({ ServerErrorMsg: "Corrupted user preference data" });
              return
            }
  
            //const youtubeChannels : any= preferences.rows[0].youtube
            // const response = await axios.get<any>('https://www.googleapis.com/youtube/v3/search', {
            //   params: {
            //     part: 'snippet',
            //     channelId : youtubeChannels[0].channelId, 
            //     maxResults: 5,
            //     order: 'date',
            //     type: 'video',
            //     videoDuration: 'any', 
            //     key: YOUTUBE_API_KEY,
            //   },
            // });
            // //console.log(response.data.items)
  
            // const videos =  response.data.items.map((item: any) => ({
            //   channelTitle : youtubeChannels[0].title,
            //   title: item.snippet.title,
            //   publishedAt: item.snippet.publishedAt,
            //   thumbnail: item.snippet.thumbnails.medium.url,
            //   videoUrl : `https://www.youtube.com/watch?v=${item.id.videoId}`
            // }));

           

            const youtubeChannels : YOUTUBE_CHANNEL[]= preferences.rows[0].youtube

            const channelNames = youtubeChannels.map((each)=> each.title)

            const cachedData = await redis.get(`${decoded.userId}youtube${JSON.stringify(channelNames)}`);

            if (cachedData) {
              const parsedCachedData = JSON.parse(cachedData);
              res.status(200).json(parsedCachedData)
              console.log('used cache data')
              return 
            }
             console.log('no cache data')

            const videos = await fetchVideosByChannel(youtubeChannels)
            //console.log(videos)

            res.status(200).json(videos)

            if (Object.keys(videos).length > 0) {
               try {
                   await redis.set(
                      `${decoded.userId}youtube${JSON.stringify(channelNames)}`, 
                      JSON.stringify(videos), 
                      'EX', 7200
                    )
                }
                catch(e) {
                  console.log('error from backend', e)
                } 
            }         
          })
        } 
        catch (err) {
            res.status(500).json({ServerErrorMsg: "Internal Server Error" })
            console.log(err)
        }
})


app.get('/Youtube/channnelId/:handle', async (req, res) => {
  try {

    const token = req.cookies?.jwt_token;

    if (!token){
        res.status(401).json({ ServerErrorMsg: "Not logged in" });
        return
    }


    jwt.verify(token, "jwtkey", async (err, decoded) => { 

      if (err) {
        return res.status(403).json({ ServerErrorMsg: "Invalid token" });
      }

      const handle = req.params.handle;

      const response = await axios.get<any>('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          type: 'channel',
          q: handle,
          key: YOUTUBE_API_KEY,
        },
      });

      const channel = response.data.items?.[0];
      if (channel) {
        //console.log(channel)
        res.json({
          channelId: channel.snippet.channelId,
          title: channel.snippet.title,
          icon : channel.snippet.thumbnails.default.url
        });
      } 
      else {
        res.status(404).json({ ServerErrorMsg: 'Channel not found' });
      }
    }) 
  } 
  catch (e) {
    console.error(e);
    res.status(500).json({ ServerErrorMsg: 'Internal Server Error' });
  }
})

app.put('/preferences/youtube', async (req, res) => {
  try{

    const token = req.cookies?.jwt_token;

    if (!token){
        res.status(401).json({ ServerErrorMsg: "Not logged in" });
        return
    }


    jwt.verify(token, "jwtkey", async (err, decoded) => { 

        if (err) {
          return res.status(403).json({ ServerErrorMsg: "Invalid token" });
        }

        const youtube = req.body.youtube
      
        
        await db.query(
          'UPDATE preferences set youtube = $1 WHERE user_id = $2',
          [ youtube, decoded.userId]
        );
    
        res.status(200).json({message : "Prefenece deleted successfully successful"})
      }
    )
  }
  catch(e) {
    res.status(500).json({ServerErrorMsg: "Internal Server Error" })
    console.log(e)
  }
})


app.get('/gamespot', async (req, res) => {
    try{

      const token = req.cookies?.jwt_token;

      if (!token){
          res.status(401).json({ ServerErrorMsg: "Not logged in" });
          return
      }

      jwt.verify(token, "jwtkey", async (err , decoded ) => {

          if (err) {
              return res.status(403).json({ ServerErrorMsg: "Invalid token" });
          }
          
          const categories = await db.query('SELECT * FROM preferences WHERE user_id = $1', [decoded.userId])

          if (categories.rows.length === 0) {
            return res.status(404).json({ ServerErrorMsg: "Corrupted user preference data" });
          }

          const getGamespotNews : Boolean = categories.rows[0].gamespot
         
       
          if (getGamespotNews) {

            const cachedData = await redis.get('gamespot');

            if (cachedData) {
              const parsedCachedData = JSON.parse(cachedData);
              res.status(200).json(parsedCachedData)
              console.log('userd cache data')
              return 
            }
            
            console.log('no cache data')

            const response = await axios.get<any>(`http://www.gamespot.com/api/articles/?api_key=${GAMESPOT_API_KEY}&limit=4&format=json&sort=publish_date:desc&category=games`)

            const gamesArticles = response.data.results.map((eachArticle : any) => ({
                title : eachArticle.title,
                url : eachArticle.site_detail_url,
                date : eachArticle.publish_date,
                image : eachArticle.image.original
              }
            ))
     
            res.status(200).json(gamesArticles)

            if (gamesArticles.length > 0) {
               try {
                  await redis.set('gamespot', JSON.stringify(gamesArticles), 'EX', 7200)
                }
                catch(e) {
                  console.log('error from backend', e)
                }
            }   
          }
          else {
            res.status(200).json()
          }   
      })     
    }
    catch(e) {
        res.status(500).json({ServerErrorMsg: "Internal Server Error" })
        console.log(e)
    }
})


// app.get('/reddit/:subreddit', async (req, res) => {
//   const keyword = req.params.subreddit as string

//   if (!keyword) {
//     res.status(400).json({ error: 'Missing search keyword' });
//     return
//   }

//   try {
//     const response = await axios.get(`https://www.reddit.com/subreddits/search.json`, {
//       params: {
//         q: keyword,
//         limit: 10,
//       },
//       headers: {
//         'User-Agent': 'TopicTuned/1.0',
//       },
//     });

//     const match = response.data.data.children.find((item: any) =>
//       item.data.display_name.toLowerCase() === keyword.toLowerCase()
//     );

//     if (!match) {
//        res.status(404).json({ ServerErrorMsg: 'Subreddit not found' });
//        return
//     }

//     const data = match.data;
//     // const result = {
//     //   name: data.display_name,
//     //   title: data.title,
//     //   icon: data.icon_img || data.community_icon || '',
//     //   subscribers: data.subscribers,
//     //   description: data.public_description,
//     // };

//     const result = {
//       name: data.display_name,
//       title: data.title,
//       icon: data.icon_img || data.community_icon || '',
//       subscribers: data.subscribers,
//       description: data.public_description,
//     };

//     res.json(result);
//   } 
//   catch (error: any) {
//     console.error('Reddit search failed:', error.message);
//     res.status(500).json({ ServerErrorMsg: "Internal Server Error" });
//   }
// });


app.get('/auth/verifyToken' , (req, res) => {

  try{
      const token = req.cookies?.jwt_token;

      if (!token){
          res.status(401).json({ ServerErrorMsg: "Not logged in" });
          return
      }

      jwt.verify(token, "jwtkey", async (err, decoded) => {
          if (err) return res.status(403).json({ ServerErrorMsg: "Invalid token" });
      
          const userData = await db.query(`SELECT * FROM users where user_id = $1`, [decoded.userId])  //  userId when the token is first created 
        
          if (userData.rows.length === 0) { 
            res.status(409).json({ ServerErrorMsg: "no valid user data" });
            return  
          }

          // eslint-disable-next-line no-unused-vars
          const {password, ...other} = userData.rows[0]
          res.status(200).json(other)
          return
      });
  }

  catch(e) {
      res.status(500).json({ ServerErrorMsg: "Internal Server Error" })
      console.log(e)
  }
})


app.get('/preferences', async (req, res) => {
  try{

    const token = req.cookies?.jwt_token;

    if (!token){
        res.status(401).json({ ServerErrorMsg: "Not logged in" });
        return
    }


    jwt.verify(token, "jwtkey", async (err, decoded) => { 

      if (err) {
        return res.status(403).json({ ServerErrorMsg: "Invalid token" });
      }
   
      const response = await db.query(
        'SELECT * FROM preferences WHERE user_id = $1',
        [decoded.userId]
      );
     
      res.status(200).json(response.rows[0])
    })
    
  }
  catch(e) {
    res.status(500).json({ServerErrorMsg: "Internal Server Error" })
    console.log(e)
  }
})


app.put('/preferences', async (req, res) => {
  try{

    const token = req.cookies?.jwt_token;

    if (!token){
        res.status(401).json({ ServerErrorMsg: "Not logged in" });
        return
    }


    jwt.verify(token, "jwtkey", async (err, decoded) => { 

        if (err) {
          return res.status(403).json({ ServerErrorMsg: "Invalid token" });
        }

        const { gnews, youtube, devNews, gamespot } = req.body
        
        // console.log(gnews)
        // console.log(devNews)
        // console.log(gamespot)

        await db.query(
          'UPDATE preferences set gnews = $1, youtube = $2, dev_news = $3, gamespot = $4 WHERE user_id = $5',
          [gnews, youtube, devNews, gamespot ,decoded.userId]
        );
    
        res.status(200).json({message : "Topic added successful"})
      }
    )
  }

  catch(e) {
    res.status(500).json({ServerErrorMsg: "Internal Server Error" })
    console.log(e)
  }
})


app.put('/users', async (req, res) => {
  try{

    const token = req.cookies?.jwt_token;

    if (!token){
        res.status(401).json({ ServerErrorMsg: "Not logged in" });
        return
    }


    jwt.verify(token, "jwtkey", async (err, decoded) => { 

        if (err) {
          return res.status(403).json({ ServerErrorMsg: "Invalid token" });
        }

        const { email, userName } = req.body
        

        await db.query(
          'UPDATE users set user_name = $1, email = $2  WHERE user_id = $3',
          [userName, email ,decoded.userId]
        );
    
        res.status(200).json({message : "Profile changed successful"})
      }
    )
  }

  catch(e) {
    res.status(500).json({ServerErrorMsg: "Internal Server Error" })
    console.log(e)
  }
})



app.post('/auth/logout', (req, res) => {

    try{
        res.clearCookie("jwt_token",{
            sameSite:"none",
            secure:true
          }).status(200).json({message : "User has been logged out"})
    }
    catch(e) {
        res.status(500).json({ServerErrorMsg : "Internal Server Error"})
        console.log(e)
    } 
})


app.listen(8800, ()=> {
    console.log('connected to port 8800')
})



  // dont delete this (might need later in case if i need additional metadata)
          // const channelRes  = await axios.get<YouTubeChannelsResponse>(
          //   `https://www.googleapis.com/youtube/v3/channels`,
          //   {
          //     params: {
          //       part: 'contentDetails',
          //       id: youtubeChannels[0].channelId,
          //       key:YOUTUBE_API_KEY,
          //     },
          //   }
          // );
      
          // const uploadsPlaylistId = channelRes.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
          // if (!uploadsPlaylistId) {
          //   throw new Error('Unable to retrieve uploads playlist ID');
          // }
        
          // const videosRes = await axios.get<YoutubePlaylist>(
          //   `https://www.googleapis.com/youtube/v3/playlistItems`,
          //   {
          //     params: {
          //       part: 'snippet',
          //       playlistId: uploadsPlaylistId,
          //       maxResults: 6,
          //       order: 'date',
          //       type: 'video',
          //       videoDuration: 'medium', 
          //       key: YOUTUBE_API_KEY,
          //     },
          //   }
          // );
          // const videos = response.data.items.map((item: YouTubePlaylistItem) => {
          //   const snippet = item.snippet;
          //   return {
          //     title: snippet.title,
          //     publishedAt: snippet.publishedAt,
          //     thumbnail: snippet.thumbnails.medium.url,
          //     videoUrl: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
          //     channelTitle: snippet.channelTitle,
          //   };
          // });
          //console.log(videos)
          // jwt.verify(token, "jwtkey", async (err, decoded) => { 
            
         // })
         