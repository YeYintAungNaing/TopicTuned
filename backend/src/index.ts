import express from "express"
import cors from "cors"
import axios from 'axios'
import 'dotenv/config';
import db from './db'
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import cookieParser from "cookie-parser"

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = 'UC-lHJZR3Gqxm24_Vd_AJ5Yw'

interface YouTubeChannelsResponse {
  items: {
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }[];
}

interface YouTubePlaylistItem {
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    resourceId: {
      videoId: string;
    };
    channelTitle: string;
  };
}

interface YoutubePlaylist {
  items : YouTubePlaylistItem[]
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


async function fetchNewsByCategory(categories: string[]) {
  const promises = categories.map((category) =>
    axios.get(`https://gnews.io/api/v4/top-headlines`, {
      params: {
        category,
        lang: 'en',
        country: 'us',
        max: 2,
        apikey: GNEWS_API_KEY,
      },
    })
  );

  const results = await Promise.allSettled(promises);

  const newsByCategory: Record<string, any[]> = {};

  results.forEach((result : any, index) => {
    const category = categories[index];

    if (result.status === 'fulfilled') {
      newsByCategory[category] = result.value.data.articles;
    } else {
      console.error(`Failed to fetch category "${category}":`, result.reason);
      newsByCategory[category] = []; 
    }
  });

  return newsByCategory;
};



app.get('/GNews', async (req, res) => {
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
          const categories = await db.query('SELECT * FROM preferences WHERE user_id = $1', [decoded.userId])

          if (categories.rows.length === 0) {
            return res.status(404).json({ ServerErrorMsg: "Corrupted user preference data" });
          }

          const gnewsCategories : string[] = categories.rows[0].gnews 
          const subRedditList : string[] = categories.rows[0].reddit 
          const youtubeChannels : string[] = categories.rows[0].youtube

          console.log(gnewsCategories)
          console.log(subRedditList)
          console.log(youtubeChannels)

          
          // const response : any = await axios.get(
          //   `https://gnews.io/api/v4/top-headlines?category=${gnewsCategories[0]}y&lang=en&country=us&max=5&apikey=${GNEWS_API_KEY}`
          // )

          const news : any = await fetchNewsByCategory(gnewsCategories);

          console.log(news)
          
          res.status(200).json(news)
      })     
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

          const preferences = await db.query('SELECT * FROM preferences WHERE user_id = $1', [8])

          if (preferences.rows.length === 0) {
            res.status(404).json({ ServerErrorMsg: "Corrupted user preference data" });
            return
          }

          const youtubeChannels : any= preferences.rows[0].youtube
  
          const channelRes  = await axios.get<YouTubeChannelsResponse>(
            `https://www.googleapis.com/youtube/v3/channels`,
            {
              params: {
                part: 'contentDetails',
                id: youtubeChannels[0].channelId,
                key:YOUTUBE_API_KEY,
              },
            }
          );
      
          const uploadsPlaylistId = channelRes.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
          if (!uploadsPlaylistId) {
            throw new Error('Unable to retrieve uploads playlist ID');
          }
        
          const videosRes = await axios.get<YoutubePlaylist>(
            `https://www.googleapis.com/youtube/v3/playlistItems`,
            {
              params: {
                part: 'snippet',
                playlistId: uploadsPlaylistId,
                maxResults: 6,
                key: YOUTUBE_API_KEY,
              },
            }
          );
   

          const videos = videosRes.data.items.map((item: YouTubePlaylistItem) => {
            const snippet = item.snippet;
            return {
              title: snippet.title,
              publishedAt: snippet.publishedAt,
              thumbnail: snippet.thumbnails.medium.url,
              videoUrl: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
              channelTitle: snippet.channelTitle,
            };
          });
          //console.log(videos)
          res.status(200).json(videos)
        } 
        catch (err) {
            res.status(500).json({ServerErrorMsg: "Internal Server Error" })
            console.log(err)
        }
})


app.get('/Youtube/channnelId/:handle', async (req, res) => {
  try {
    const handle = req.params.handle;

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        type: 'channel',
        q: handle,
        key: YOUTUBE_API_KEY,
      },
    });

    const channel = response.data.items?.[0];
    if (channel) {
      res.json({
        channelId: channel.snippet.channelId,
        title: channel.snippet.title,
      });
    } else {
      res.status(404).json({ ServerErrorMsg: 'Channel not found' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ServerErrorMsg: 'Internal Server Error' });
  }
})


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
    
    const user_id = 8
   
    const response = await db.query(
      'SELECT * FROM preferences WHERE user_id = $1',
      [user_id]
    );
    //console.log(response)
    res.status(200).json(response.rows[0])
    
  }
  catch(e) {
    res.status(500).json({ServerErrorMsg: "Internal Server Error" })
    console.log(e)
  }
})


app.put('/preferences', async (req, res) => {
  try{
    
    const { gnews, youtube, reddit } = req.body
    const user_id = 8
    console.log(gnews)
    console.log(youtube)
    console.log(reddit)
   
    await db.query(
      'UPDATE preferences set gnews = $1, youtube = $2, reddit = $3 WHERE user_id = $4',
      [gnews, youtube, reddit, user_id]
    );

    res.status(200).json({message : "Topic added successful"})
    
  }
  catch(e) {
    res.status(500).json({ServerErrorMsg: "Internal Server Error" })
    console.log(e)
  }
})


app.listen(8800, ()=> {
    console.log('connected to port 8800')
})