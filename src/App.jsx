import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import UserLayout from './layouts/UserLayout'
import Dashbord from './pages/userPages/Dashbord'
import FindDoctors from './pages/userPages/FindDoctors'
import AuthProvider from './authContext'
import AdminDashboard from './pages/adminPage/AdminDashboard'
import DoctorApprovels from './pages/adminPage/DoctorApprovels'
import DoctorProfile from './pages/docterPages/DoctorProfile'
import Availability from './pages/docterPages/Availability'


const App = () => {
  return (
    <div>    
      <AuthProvider>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/userdashboard' element={<UserLayout/>} >
           <Route path="dashboard" element={<Dashbord />} />
           <Route path="doctors" element={<FindDoctors />} />
        </Route>

        <Route path='/doctordashboard' element={<UserLayout/>} >                                  
           <Route path="myprofile" element={<DoctorProfile />} />                             
           <Route path="availability" element={<Availability />} />                             
        </Route>


        <Route path='/admindashboard' element={<UserLayout/>} >
           <Route path="dashboard" element={<AdminDashboard />} />
           <Route path="approvels" element={<DoctorApprovels />} />

        </Route>
      </Routes>
      </AuthProvider>
    </div>
  )
}

export default App