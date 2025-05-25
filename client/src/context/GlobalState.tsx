/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext } from "react";
type GlobalContextType = {
    currentUser: any;
    verifyUser : any; 
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
    isLoading : boolean;
    setIsLoading : React.Dispatch<React.SetStateAction<boolean>>
  };
  
export const GlobalState = createContext<GlobalContextType | null>(null);