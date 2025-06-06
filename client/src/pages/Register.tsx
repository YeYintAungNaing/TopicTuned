/* eslint-disable @typescript-eslint/no-explicit-any */
import {  useState } from "react"

import axios from 'axios'
import '../styles/Register.scss'
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Register() {
    const navigate = useNavigate()
    const [userName, setUserName] = useState("")
    const [password, setPassword] = useState("")
    
    
      async function onlineRegister() {
        
        try{
            const response : any = await axios.post(`${API_BASE_URL}/auth/register`, {
              userName,
              password,
            })
            console.log(response.data.message)
            //showAlert(response.data.message, 'success')
            navigate('/login')
        }
        catch(e : any) {
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

    function submitRegister() {
      if (!userName || !password) {
        //showAlert('name and password cannot be empty', 'error')
        console.log('name and password cannot be empty')
        return
      }

      if (userName.length < 4 || userName.length > 10) {
        //showAlert('UserName must be between 4 and 10 characters ', 'error')
        console.log('UserName must be between 4 and 10 characters')
        return
      }

      if (password.length < 3 || password.length > 16) {
        //showAlert('password must be between 2 and 16 characters', 'error')
        console.log('password must be between 2 and 16 characters')
        return
      }
      onlineRegister()
    }

    return (
        <div className="register">
          <div className="register-card">
          <p>Register</p>
            <input 
                placeholder="Name" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                >
            </input>
            <input 
                type="password"
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                >
            </input>
            <button onClick={submitRegister}>Register</button>
            <Link className="links" to='/login'>
              <button className="login">Login into existing account ?</button>
            </Link>
          </div>
        </div>
    )
}