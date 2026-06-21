import { Outlet } from 'react-router-dom'
import Navbar from "../pages/user/Navbar"
import Footer from '../pages/user/Footer'
import AIChat from '../AI/AIChat'

function UserLayout() {
  return (
    <>
      <Navbar/>
      <main className=''>
        <Outlet />
        
      </main>
      <Footer/>
    </>
  )
}

export default UserLayout
