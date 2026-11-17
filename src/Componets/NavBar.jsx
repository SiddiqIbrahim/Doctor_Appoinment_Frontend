import { HeartPulse, UserRound } from 'lucide-react'
import React from 'react'

const NavBar = () => {
  return (
    <div>
        <div className='border border-b-gray-300 w-full flex justify-between'>
            <div>
               {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="bg-blue-600 p-2 rounded-xl">
          <HeartPulse size={15} className="text-white" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-800">
            MediCare
          </h1>
        </div>
      </div>
            </div>
           {/* Profile */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <UserRound className="text-white" size={21} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              Welcome Back
            </h2>
            <p className="text-xs text-blue-600 capitalize">
              {/* {roleNames[role] || "Patient"} */}
            </p>
          </div>
        </div>
      </div>
        </div>
    </div>
  )
}

export default NavBar