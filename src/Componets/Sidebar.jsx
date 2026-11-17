
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  HeartPulse,
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  Bell,
  Settings,
  UserRound,
  Clock,
  LogOut,
  UserCog,
  BadgeCheck,
  Wallet,
  ClipboardList,
} from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../authContext";

const Sidebar = ({  }) => {
 
  const {user} = useContext(AuthContext)
  const {logout} = useContext(AuthContext)

  // Different menu items for each role
  const menuItems = {
    user: [
      { name: "Dashboard", path: "dashboard", icon: LayoutDashboard },
      { name: "Find Doctors", path: "doctors", icon: Stethoscope },
      { name: "Appointments", path: "appointments", icon: CalendarDays },
      { name: "Prescriptions", path: "prescriptions", icon: FileText },
      { name: "Notifications", path: "notifications", icon: Bell },
      { name: "My Profile", path: "profile", icon: UserRound },
    ],

    doctor: [
      { name: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
      { name: "Appointments", path: "/doctor/appointments", icon: CalendarDays },
      { name: "Availability", path: "availability", icon: Clock },
      { name: "My Patients", path: "/doctor/patients", icon: Users },
      { name: "Prescriptions", path: "/doctor/prescriptions", icon: FileText },
      { name: "My Profile", path: "myprofile", icon: UserRound },
    ],

    admin: [
      { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Manage Users", path: "/admin/users", icon: Users },
      { name: "Manage Doctors", path: "/admin/doctors", icon: Stethoscope },
      { name: "Doctor Approvals", path: "approvels", icon: BadgeCheck },
      { name: "Appointments", path: "/admin/appointments", icon: CalendarDays },
      { name: "Commission", path: "/admin/commission", icon: Wallet },
      { name: "Reports", path: "/admin/reports", icon: ClipboardList },
      { name: "Settings", path: "/admin/settings", icon: Settings },
    ],
  };
 console.log(user)
 const roledata = user?.role;
  const currentMenu = menuItems[roledata] || [];


  return (
    <aside className="w-64 h-[calc(100vh-5rem)] bg-white border-r border-gray-200 flex flex-col">      
      

      {/* Navigation */}
      <div className="px-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-4">
          Main Menu
        </p>

        <nav className="space-y-2">
          {currentMenu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={19} />
          Logout
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          © 2026 MediCare
        </p>
      </div>

    </aside>
  );
};

export default Sidebar;
