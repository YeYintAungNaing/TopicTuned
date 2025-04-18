/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext } from "react";
type GlobalContextType = {
    currentUser: any; 
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  };
  
export const GlobalState = createContext<GlobalContextType | null>(null);