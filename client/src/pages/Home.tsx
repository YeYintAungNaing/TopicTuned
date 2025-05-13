/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from "react";
import { GlobalState } from "../context/GlobalState";
import axios from 'axios'
import { API_BASE_URL } from "../config";
import {  useNavigate } from "react-router-dom";
import '../styles/Home.scss'


// interface YOUTUBE_VIDEO {
//   channelTitle : string,
//   publishedAt : string,
//   thumbnail : string,
//   title : string,
//   videoUrl : string
// }


interface YOUTUBE_VIDEO {
  channelTitle : string,
  title : string,
  publishedAt : string,
  thumbnail : string,
  videoUrl : string
}

interface GNewsArticle {
  title: string;
  image: string;
  url: string;
};

interface GNewsList {
  [category: string]: GNewsArticle[];
};


export default function Home() {

  const {currentUser, isLoading} = useContext(GlobalState)!;
  const [news, setNews] = useState<GNewsList>({})
  const [youtubeVideos, setYoutubeVideos]  = useState<Record<string, YOUTUBE_VIDEO[]>>({})
  const navigate = useNavigate()

  //console.log(currentUser)

  async function fetchNews() {
    try {
      const newsData : any = await axios.get(`${API_BASE_URL}/GNews`);
      setNews(newsData.data)
      //console.log(newsData.data)
    }
    catch(e  : any) {
      if(e.response) {   
        if(e.response.data.ServerErrorMsg) {  
          console.log(e.response.data.ServerErrorMsg)  
        }
        else {
          console.log(e.message)  
        }
      }
      else{  
        console.log(e.message)
      } 
    }   
  }
  

  async function fetchYoutube() {
    try {
      const newsData : any = await axios.get(`${API_BASE_URL}/Youtube`);
      console.log(newsData.data)
      setYoutubeVideos(newsData.data)
    }
    catch(e  : any) {
      if(e.response) {   
        if(e.response.data.ServerErrorMsg) {  
          console.log(e.response.data.ServerErrorMsg)  
        }
        else {
          console.log(e.message)  
        }
      }
      else{  
        console.log(e)
      } 
    }   
  }

  async function fetchGameSpot() {
    try {
      const newsData : any = await axios.get(`${API_BASE_URL}/gamespot`);
      console.log(newsData.data)
      
    }
    catch(e  : any) {
      if(e.response) {   
        if(e.response.data.ServerErrorMsg) {  
          console.log(e.response.data.ServerErrorMsg)  
        }
        else {
          console.log(e.message)  
        }
      }
      else{  
        console.log(e)
      } 
    }   
  }


  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate('/login')
    }
  }, [isLoading, currentUser])

  
  return (

    <div className="home">
      {
        currentUser && !isLoading ? (
          <div className="active-home">
          <div className="header">
            <h2>Home</h2>
            <button onClick={fetchNews}>fetchGnews</button>
            <button onClick={fetchYoutube}>fetchYt</button>
            <button onClick={fetchGameSpot}>fetchgames</button>
          </div>
           
          {
            news && Object.keys(news).length > 0 &&  (
              Object.keys(news).map((eachCategory : string, i)=> (
                <div className="eachContentCategory" key={i}>
                  <h1>{eachCategory}</h1>
                  <div className="content-section">
                    {news[eachCategory].map((subNews : any, j) => (
                    <div className="content-card" key={j}>
                      <h3>{subNews.title}</h3>
                      <img 
                        src={subNews.image} alt=""
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null; 
                          target.src = "No_image.png"; 
                        }}
                        >
                      </img>
                      <a href={subNews.url} target="_blank" rel="noopener noreferrer"> read more</a> 
                    </div>  
                  ))}
                  </div>
                 
                </div>
              ))
            )
          }
          {
            youtubeVideos && Object.keys(youtubeVideos).length > 0 && (
              Object.keys(youtubeVideos).map((channelName, i) => (
                <div className="eachContentCategory" key={i}>
                  <h1>{channelName}</h1>
                  <div className="content-section">
                  {
                    youtubeVideos[channelName].map((eachVideo, j) => (
                      <div className="content-card" key={j}>
                        <img src={eachVideo.thumbnail} alt=""></img>
                        <h3>{eachVideo.title}</h3>
                        <a href={eachVideo.videoUrl} target="_blank" rel="noopener noreferrer"> watch video</a>
                      </div>
                    ))
                  }
                  </div>
                </div>
              ))
            )
          }
         
        </div>
        ) : (
        <div>Loading ....</div>
        )
      }
    </div>
  )
}
