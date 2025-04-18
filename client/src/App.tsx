import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.scss'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>  
        <Route path="/login" element={<Login/>}/> 
        <Route path="/register" element={<Register/>}/> 
        <Route path="/dashboard" element={<Dashboard/>}/> 
      </Routes>
    </BrowserRouter>
  )
}

export default App
