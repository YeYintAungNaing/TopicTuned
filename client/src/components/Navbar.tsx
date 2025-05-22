import { Link } from "react-router-dom";
import { GlobalState } from "../context/GlobalState";
import { useContext } from "react";
import "../styles/Navbar.scss"

export default function Navbar() {

  const {currentUser} = useContext(GlobalState)!;

  function logout() {
    console.log('s')
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
