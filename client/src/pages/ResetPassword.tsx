/* eslint-disable @typescript-eslint/no-explicit-any */
import {  useContext, useState } from "react";
import '../styles/ResetPass.scss'
import axios from "axios";
import { API_BASE_URL } from "../config";
import { GlobalState } from "../context/GlobalState";

export default function ResetPassword() {
   
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
    const [password, setPassword] = useState<string>('')
    const [confirmPass, setConfirmPass] = useState<string>('')
    const [secretCode, setSecretCode] = useState<string>('')
    const [toggleInput, setToggleInput] = useState<boolean>(false)
    const {currentUser} = useContext(GlobalState)!;
    //console.log(currentUser)
    
    async function sendMail() {
        try {
            const res : any = await axios.post(`${API_BASE_URL}/users/${currentUser.user_id}/generateCode`, {
                email : currentUser.email
            })
            setToggleInput(true)
            console.log(res.data.message)   
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
                console.log(e)
              } 
        }
    }

    async function verifyCode() {
        //console.log(secretCode)
        try{
            const res : any = await axios.put(`${API_BASE_URL}/users/${currentUser.user_id}/verifyCode`, {
                code : secretCode 
            })
            
            setIsAuthorized(true)
            console.log(res.data.message)
        }
        catch(e : any) {
            if(e.response) {   
                if(e.response.data.ServerErrorMsg) {  
                  console.log(e.response.data.ServerErrorMsg)
                  //showAlert(e.response.data.ServerErrorMsg, "error") 
                }
                else {
                  console.log(e.message)   
                  //showAlert(e.messag, "error")
                }
              }
              else{  
                console.log(e)
              } 
        }
    }


    async function resetPassword() {
        try{
            const res : any = await axios.put(`${API_BASE_URL}/users/${currentUser.userId}/resetPassword`, {
                password
            })
            //showAlert(res.data.message)
            console.log(res.data.message)
            
        }   
       catch(e : any) {
            if(e.response) {   
                if(e.response.data.ServerErrorMsg) {  
                    console.log(e.response.data.ServerErrorMsg)
                    //showAlert(e.response.data.ServerErrorMsg, "error") 
                }
                else{
                console.log(e.message)   
                //showAlert(e.messag, "error")
                }
            }
            else{  
            console.log(e)
            } 
       }
    }


    return (
        <div className="reset-password">
            
            { isAuthorized? (
                 <div className="card">
                 <p>Reset Password</p>
                 <input 
                       placeholder="Password" 
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       >
                   </input>
                   <input 
                       placeholder="Confirm password" 
                       value={confirmPass}
                       onChange={(e) => setConfirmPass(e.target.value)}
                       >
                   </input>
                   <button onClick={resetPassword}>Reset password</button>
                 </div>
            ) 
            : (
            <div className="card"> 
              <p>Verify Code</p>
              {toggleInput &&
                <input 
                    placeholder="Verification Code" 
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                >
                </input> }
                <button onClick={sendMail}>get coode</button>
                <button onClick={verifyCode}>Verify code</button>
            </div>  
            )}   
        </div>
    )
}