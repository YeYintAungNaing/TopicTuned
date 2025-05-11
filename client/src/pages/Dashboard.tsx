/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { API_BASE_URL } from "../config";
import axios from 'axios'
import "../styles/Dashboard.scss"

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
  icon : string
}

interface SUBREDDIT {
  title : string,
  icon : string
}


export default function Dashboard() {

  const [selectedTopic, setSelectedTopic] = useState<string>('general')
  const [selectedYoutubeChannel, setSelectedYoutubeChannel] = useState<YOUTUBE_CHANNEL | "">("")
  const [selectedReddit, setSelectedReddit] = useState<SUBREDDIT| "">("")
  const [gnewsTopics, setGnewsTopics] = useState<string[]>([])  // stored news category ["general", "technology"]
  const [reddits, setReddits] = useState<SUBREDDIT[]>([])  // subreddit names
  const [youtubes, setYoutubes] = useState<YOUTUBE_CHANNEL[]>([])  // channelid list
  const [channelInput, setChannelInput] = useState<string>('') // 
  const [redditInput, setRedditInput] = useState<string>('')
  const [isReady, setIsReady] = useState<boolean>(false)

 
  async function addTopic() {

    let updatedTopics = [...gnewsTopics]
    let updatedChannels = [...youtubes]
    if (!gnewsTopics.includes(selectedTopic)) {
      updatedTopics = [...gnewsTopics, selectedTopic] /// just testing 
    }
    
    if (selectedYoutubeChannel) {
      updatedChannels = [...youtubes, selectedYoutubeChannel]
    }
  

    try{
      const response : any = await axios.put(`${API_BASE_URL}/preferences`, {
        gnews : updatedTopics,
        reddit : reddits,
        youtube : updatedChannels
      })
      console.log(response.data.message)
      getPreferences()
      
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


  async function getChannelInfo() {   // for getting channel id to save in db
    const handle = channelInput.split("@")[1]
    //console.log(handle)
    
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

  async function deleteChannel(channelTitle : string) {
      let updatedChannels = [...youtubes]

      updatedChannels = updatedChannels.filter((each) => each.title !== channelTitle)
      console.log(updatedChannels)

    try{
      const response : any = await axios.put(`${API_BASE_URL}/preferences/youtube`, {
        youtube : updatedChannels
      })

      console.log(response.data.message)
      getPreferences()
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

  async function deleteTopic(topic : string) {
      let updatedTopic= [...gnewsTopics]

      updatedTopic = updatedTopic.filter((each) => each !== topic)
      //console.log(updatedTopic)

    try{
      const response : any = await axios.put(`${API_BASE_URL}/preferences/gnews`, {
        gnews : updatedTopic
      })

      console.log(response.data.message)
      getPreferences()
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


  async function searchReddit() {   // for getting channel id to save in db
    const subreddit = redditInput
    //console.log(handle)
    
    try{
      const response : any = await axios.get(`${API_BASE_URL}/reddit/${subreddit}`)

      console.log(response.data.channelId, response.data.title )

      setSelectedReddit(response.data)

      
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
          <div>
              <button onClick={addTopic}>Update preferences</button>
              <div className="gnews">
                <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                      {TOPICS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
                {
                  gnewsTopics && gnewsTopics.length > 0 ? (
                    gnewsTopics.map((eachTopic, i) => (
                      <div key={i}>
                        <div>{eachTopic}</div>
                        <button onClick={() => deleteTopic(eachTopic)}>Remove</button>
                      </div>
                    ))
                  ) : (
                    <div>You have not set any topic yet</div>
                  )
                }
              </div>
              
              <div className="youtube">
                {
                  youtubes.length > 0 ? (
                    youtubes.map((eachChannel, i) => (
                      <div key={i}>
                        <h4>{eachChannel.title}</h4>
                        <img style={{width : "50px"}} src={eachChannel.icon} alt="" />
                        <button onClick={() => deleteChannel(eachChannel.title)}>Remove</button>
                      </div>
                    ))
                  ) : (
                    <div>You have not added any channel yet</div>
                  )
                }

                <input
                  value={channelInput}
                  onChange={(e) => {setChannelInput(e.target.value)}}
                  placeholder="channel link"
                >
                </input>
                <button onClick={getChannelInfo}>Search channel</button>
                {
                  selectedYoutubeChannel? (
                    <div>
                      <img style={{width : "50px"}} src={selectedYoutubeChannel.icon} alt="" />
                      <h2> {selectedYoutubeChannel.title}</h2>
                    </div>
                  ) : (
                    <div>No youtube channel selected</div>
                  )
                }
              </div>
              <div className="reddit">
                {
                  reddits.length > 0 ? (
                    reddits.map((each, i) => (
                      <div key={i}>
                        <h4>{each.title}</h4>
                        <img src={each.icon} alt="" />
                      </div>
                    ))
                  ) : (
                    <div>You have not added any subreddit yet</div>
                  )
                }

                <input
                  value={redditInput}
                  onChange={(e) => {setRedditInput(e.target.value)}}
                  placeholder="reddit name"
                >
                </input>
                <button onClick={searchReddit}>Search channel</button>
                {
                  selectedReddit? (
                    <div>
                      <img style={{width : "50px"}} src={selectedReddit.icon} alt="" />
                      <h2> {selectedReddit.title}</h2>
                    </div>
                  ) : (
                    <div>No reddit selected</div>
                  )
                }
              </div>
             
        </div>
        ) : (
          <div>Loading....</div>
        )
       }

    </div>
  )
}
