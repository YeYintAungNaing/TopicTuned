/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { GlobalState } from "./GlobalState";
import axios from "axios"
import { API_BASE_URL } from "../config";


interface USER {
  created_at : string,
  display_name : string | null,
  email :  string | null,
  profile_img_url : string | null,
  user_id : number
}


export const GlobalContext = ({ children }: { children: React.ReactNode }) => {
  
  axios.defaults.withCredentials = true;
  const [currentUser, setCurrentUser] = useState<USER | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  async function verifyUser() {
    try {
      const response : any = await axios.get(`${API_BASE_URL}/auth/verifyToken`);
      if (typeof response.data !== "object") {
        throw new Error("Unexpected Error");
      }
      setCurrentUser(response.data)
      setIsLoading(false)
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
      setCurrentUser(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    verifyUser()
  }, [])

  return (
    <GlobalState.Provider 
      value={{
        currentUser, 
        setCurrentUser,
        isLoading, 
        setIsLoading,
        verifyUser
      }}>
      {children}
    </GlobalState.Provider>
  );
};