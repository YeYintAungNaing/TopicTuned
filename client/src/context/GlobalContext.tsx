/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { GlobalState } from "./GlobalState";


export const GlobalContext = ({ children }: { children: React.ReactNode }) => {
  
  const [currentUser, setCurrentUser] = useState<any>("test")

  return (
    <GlobalState.Provider 
      value={{
        currentUser, 
        setCurrentUser
      }}>
      {children}
    </GlobalState.Provider>
  );
};