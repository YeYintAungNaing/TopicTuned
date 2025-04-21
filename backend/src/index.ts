import express from "express"
import cors from "cors"
import axios from 'axios'
import 'dotenv/config';
import db from './db'
import bcrypt from "bcrypt"

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

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Authorization", "Content-Type"],
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


app.get('/GNews', async (req, res) => {
    try{
        const response : any = await axios.get(`https://gnews.io/api/v4/top-headlines?category=technology&lang=en&country=us&max=3&apikey=${GNEWS_API_KEY}`)
        //console.log(response.data.articles)
        res.status(200).json(response.data.articles)
        
    }
    catch(e) {
        res.status(500).json({ServerErrorMsg: "Internal Server Error" })
        console.log(e)
    }
})


app.get('/Youtube', async (req, res) => {
        try {
          
          const channelRes  = await axios.get<YouTubeChannelsResponse>(
            `https://www.googleapis.com/youtube/v3/channels`,
            {
              params: {
                part: 'contentDetails',
                id: CHANNEL_ID,
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
                maxResults: 10,
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
          console.log(videos)
          res.status(200).json(videos)
        } 
        catch (err) {
            res.status(500).json({ServerErrorMsg: "Internal Server Error" })
            console.log(err)
        }
})

app.get('/preferences', async (req, res) => {
  try{
    
    const user_id = 8
   
    const response = await db.query(
      'SELECT * FROM preferences WHERE user_id = $1',
      [user_id]
    );
    console.log(response)
    res.status(200).json(response.rows[0])
    
  }
  catch(e) {
    res.status(500).json({ServerErrorMsg: "Internal Server Error" })
    console.log(e)
}
})


app.put('/preferences', async (req, res) => {
  try{
    
    const {gnews, youtube, reddit} = req.body
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