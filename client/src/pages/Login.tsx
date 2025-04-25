import {  useContext, useState } from "react"

import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import "../styles/Login.scss"
import { API_BASE_URL } from "../config";
import { GlobalState } from "../context/GlobalState";

export default function Login() {

    const [userName, setUserName] = useState("")
    const [password, setPassword] = useState("")
    const {currentUser, setCurrentUser} = useContext(GlobalState)!;
    const navigate = useNavigate()

    //axios.defaults.withCredentials = true;

    async function loginOnline() {
      
      try{
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {userName, password});
        
        if (typeof response.data !== "object") {
          throw new Error("Invalid API response. Expected JSON but received HTML.");
        }
     
        setCurrentUser(response.data)
        //showAlert("Login scuuess", "success") 
        navigate('/')
         
      }catch(e) {
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
    //console.log(selectedMode)

    return (
      <div className="login">
       {
          currentUser? (
            <button className="init-btn" onClick={() => navigate('/')} >
            You hae already logged in! Go back to profile page?
            </button>
          ) 
          : (
          
            <div className="login-card">
            <p>Login</p>
              <input 
                  placeholder="Name" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  >
              </input>
              <input 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  >
              </input>
              <button onClick={loginOnline}>Login</button>
              <Link className="links" to='/register'>
                <button className="register">Register new account</button>
              </Link>
              </div>
          )
        }
        </div>
    )
}