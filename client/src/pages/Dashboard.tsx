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
  const [gnewsTopics, setGnewsTopics] = useState([])
  const [reddits, setReddits] = useState([])
  const [youtubes, setYoutubes] = useState([])

 
  async function addTopic() {
    const updatedTopics = [...gnewsTopics, selectedTopic] /// just testing 

    try{
      const response = await axios.put(`${API_BASE_URL}/preferences`, {
        gnews : updatedTopics,
        reddit : reddits,
        youtube : youtubes
      })
      console.log(response.data.message)
      
    }
  
    catch(e) {
      if(e.response.data.ServerErrorMsg) {
        console.log(e.response.data.ServerErrorMsg)
        //showAlert(e.response.data.ServerErrorMsg, 'error')
      }
      else {
        console.log(e.message)
        //showAlert(e.message, 'error')
      }
    }


    
  }


  async function getPreferences() {  // should be in useeffect eventually

    
    try{
      const response = await axios.get(`${API_BASE_URL}/preferences`)
      setGnewsTopics(response.data.gnews || [])
      console.log(response.data)
      setReddits(response.data.reddit || [])
      setYoutubes(response.data.youtube || [])
    }
  
    catch(e) {
      if(e.response.data.ServerErrorMsg) {
        console.log(e.response.data.ServerErrorMsg)
        //showAlert(e.response.data.ServerErrorMsg, 'error')
      }
      else {
        console.log(e.message)
        //showAlert(e.message, 'error')
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
        </div>
        {}
    </div>
  )
}
