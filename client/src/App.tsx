import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.scss'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import ResetPassword from './pages/ResetPassword'

function App() {

  return (
    <BrowserRouter>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Home/>}/>  
        <Route path="/login" element={<Login/>}/> 
        <Route path="/register" element={<Register/>}/> 
        <Route path="/dashboard" element={<Dashboard/>}/> 
        <Route path="/resetPassword" element={<ResetPassword/>}/> 
      </Routes>
    </BrowserRouter>
  )
}

export default App
