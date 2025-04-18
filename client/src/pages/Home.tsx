/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useState } from "react";
import { GlobalState } from "../context/GlobalState";
import axios from 'axios'
import { API_BASE_URL } from "../config";


export default function Home() {

  const {currentUser, setCurrentUser} = useContext(GlobalState)!;
  const [news, setNews] = useState([])
  const [topic, setTopic] = useState<string>("") 

  //console.log(currentUser)

  async function fetchNews() {
    try {
      const newsData : any = await axios.get(`${API_BASE_URL}/GNews`);
      console.log(newsData.data)
      setNews(newsData.data)
    }
    catch(e) {
      console.log(e)
    }   
  }


  return (

    <div>
      <input value={topic} placeholder="Enter your topic" onChange={(e) => {setTopic(e.target.value)}} type="text" />
      <button onClick={fetchNews}>fetch</button>
      
      {
        news && news.length > 0 &&  (
          news.map((each : any, i)=> (
            <div key={i}>
              <h3>{each.title}</h3>
              <img src={each.image} alt=""></img>
              <a href={each.url}> read more</a> 
            </div>
          ))
        )
      }
    </div>
  )
}
