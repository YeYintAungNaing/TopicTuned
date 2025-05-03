/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
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

export default function Dashboard() {

  const [selectedTopic, setSelectedTopic] = useState('general')
  const [selectedYoutubeChannel, setSelectedYoutubeChannel] = useState("")
  const [gnewsTopics, setGnewsTopics] = useState([])
  const [reddits, setReddits] = useState([])
  const [youtubes, setYoutubes] = useState([])
  const [channelInput, setChannelInput] = useState<string>('')

 
  async function addTopic() {
    const updatedTopics = [...gnewsTopics, selectedTopic] /// just testing 
    const updatedChannels = [...youtubes, selectedYoutubeChannel.channelId]

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


  async function getPreferences() {  // should be in useeffect eventually

    try{
      const response : any = await axios.get(`${API_BASE_URL}/preferences`)
      setGnewsTopics(response.data.gnews)
      setReddits(response.data.reddit)
      setYoutubes(response.data.youtube)
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


  async function getId() {
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
       <div className="dropdown-container">
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                    {TOPICS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              <button onClick={addTopic}>add topic</button>
              <button onClick={getPreferences}>get preferences</button>
              <button onClick={getId}>Get id</button>
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
        {}
    </div>
  )
}
