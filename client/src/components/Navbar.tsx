/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { GlobalState } from "../context/GlobalState";
import { useContext } from "react";
import "../styles/Navbar.scss"
import { API_BASE_URL } from "../config";
import axios from "axios"

export default function Navbar() {

  const {currentUser, verifyUser} = useContext(GlobalState)!;

  async function logout() {
    try {
      const response : any = await axios.post(`${API_BASE_URL}/auth/logout`)
      console.log(response.data.message)
      verifyUser()
    }
    catch(e : any) {
      if(e.response) {   
        if(e.response.data.ServerErrorMsg) {  
          console.log(e.response.data.ServerErrorMsg)
          //showAlert(e.response.data.ServerErrorMsg, "error") 
        }
        else {
          console.log(e.message)   
          /// showAlert(e.message, "error")
        }
      }
      else{  
        console.log(e)
      }
    }
     
  }

  return (
    <div className="navbar">
      <Link className='link title' to='/'>TopicTuned</Link>
      <div className="navlinks">
         <Link className='link ' to='/'>Home</Link>
         <Link className='link' to='/dashboard'>Profile</Link>
         <Link className='link' to='/dashboard'>Setting</Link>
      </div>
        {
          currentUser? (
              <button onClick={logout} className="submit-button">Logout</button>           
          ) : (
            <Link className="link" to='/register'>
              <button className="submit-button">Login</button>
            </Link>
          )
        }   
    </div>
  )
}
