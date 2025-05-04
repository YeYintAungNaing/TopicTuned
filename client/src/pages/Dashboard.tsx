/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { API_BASE_URL } from "../config";
import axios from 'axios'

const TOPICS = [
  { label: "General", value: "general" },
  { label: "World", value: "world" },
  { label: "Nation", value: "nation" },
  { label: "Business", value: "business" },
  { label: "Technology", value: "technology" },
  { label: "Entertainment", value: "entertainment" },
  { label: "Sports", value: "sports" },
  { label: "Science", value: "science" },
  { label: "Health", value: "health" }
]

interface YOUTUBE_CHANNEL {
  channelId : string,
  title : string
}


export default function Dashboard() {

  const [selectedTopic, setSelectedTopic] = useState<string>('general')
  const [selectedYoutubeChannel, setSelectedYoutubeChannel] = useState<YOUTUBE_CHANNEL | "">("")
  const [gnewsTopics, setGnewsTopics] = useState<string[]>([])  // stored news category ["general", "technology"]
  const [reddits, setReddits] = useState<string[]>([])  // subreddit names
  const [youtubes, setYoutubes] = useState<string[]>([])  // channelid list
  const [channelInput, setChannelInput] = useState<string>('') // 
  const [isReady, setIsReady] = useState<boolean>(false)

 
  async function addTopic() {

    let updatedTopics = [...gnewsTopics]
    let updatedChannels = [...youtubes]
    if (!gnewsTopics.includes(selectedTopic)) {
      updatedTopics = [...gnewsTopics, selectedTopic] /// just testing 
    }
    
    if (selectedYoutubeChannel) {
      updatedChannels = [...youtubes, selectedYoutubeChannel.channelId]
    }
  

    try{
      const response : any = await axios.put(`${API_BASE_URL}/preferences`, {
        gnews : updatedTopics,
        reddit : reddits,
        youtube : updatedChannels
      })
      console.log(response.data.message)
      
    }
  
    catch(e : any) {
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


  async function getPreferences() {  

    try{
      const response : any = await axios.get(`${API_BASE_URL}/preferences`)
      setGnewsTopics(response.data.gnews)
      setReddits(response.data.reddit)
      setYoutubes(response.data.youtube)
      setIsReady(true)
    }
  
    catch(e : any) {
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

  useEffect(()=> {
    getPreferences()
  }, [])


  async function getId() {   // for getting channel id to save in db
    const handle = channelInput.split("@")[1]
    console.log(handle)
    
    try{
      const response : any = await axios.get(`${API_BASE_URL}/Youtube/channnelId/${handle}`)

      console.log(response.data.channelId, response.data.title )

      setSelectedYoutubeChannel(response.data)

      
    }

    catch(e : any) {
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


  return (
    <div>
       {
        isReady? (
        <div className="dropdown-container">
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                    {TOPICS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              <button onClick={addTopic}>Update preferences</button>
              <button onClick={getId}>Search channel</button>
              <input
                value={channelInput}
                onChange={(e) => {setChannelInput(e.target.value)}}
                placeholder="channel link"
              >
              </input>
              {
                selectedYoutubeChannel && (
                  <div>
                    <h2> {selectedYoutubeChannel.title}</h2>
                  </div>
                )
              }
        </div>
        ) : (
          <div>Loading....</div>
        )
       }

    </div>
  )
}
