/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from "react";
import { GlobalState } from "../context/GlobalState";
import axios from 'axios'
import { API_BASE_URL } from "../config";
import {  useNavigate } from "react-router-dom";
import '../styles/Home.scss'


export default function Home() {

  const {currentUser, isLoading} = useContext(GlobalState)!;
  const [news, setNews] = useState([])
  const [topic, setTopic] = useState<string>("") 
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


    <div>
      {
        currentUser && !isLoading ? (
          <div>
          <input value={topic} placeholder="Enter your topic" onChange={(e) => {setTopic(e.target.value)}} type="text" />
          <button onClick={fetchNews}>fetchGnews</button>
          <button onClick={fetchYoutube}>fetchYt</button>
          
          {
            news &&  (
              Object.keys(news).map((eachCategory : string, i)=> (
                <div key={i}>
                  <h1>{eachCategory}</h1>
                  {news[eachCategory].map((subNews : any, j) => (
                    <div key={j}>
                      <h3>{subNews.title}</h3>
                      <img src={subNews.image} alt=""></img>
                      <a href={subNews.url}> read more</a> 
                    </div>  
                  ))}
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
