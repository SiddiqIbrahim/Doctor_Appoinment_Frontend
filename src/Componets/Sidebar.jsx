import React, { useContext, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
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
  X,
} from "lucide-react";
import { AuthContext } from "../authContext";
import { useSettings } from "../context/SettingsContext";

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout, hasUnreadNotification } = useContext(AuthContext);
  const { appName } = useSettings();

  const menuItems = {
    user: [
      { name: "Dashboard", path: "dashboard", icon: LayoutDashboard },
      { name: "Find Doctors", path: "doctors", icon: Stethoscope },
      { name: "Appointments", path: "appointments", icon: CalendarDays },
      { name: "Prescriptions", path: "userPrescription", icon: FileText },
      { name: "Notifications", path: "notification", icon: Bell },
      { name: "My Profile", path: "userProfile", icon: UserRound },
    ],

    doctor: [
      { name: "Dashboard", path: "doctordashboard", icon: LayoutDashboard },
      { name: "Availability", path: "availability", icon: Clock },
      { name: "My Patients", path: "mypatientas", icon: Users },
      { name: "My Profile", path: "myprofile", icon: UserRound },
    ],

    admin: [
      { name: "Dashboard", path: "admindashboard", icon: LayoutDashboard },
      { name: "Manage Users", path: "manageusers", icon: Users },
      { name: "Manage Doctors", path: "managedoctors", icon: Stethoscope },
      { name: "Doctor Approvals", path: "approvels", icon: BadgeCheck },
      { name: "Commission", path: "commision", icon: Wallet },
      { name: "MyProfile", path: "adminprofile", icon: UserRound },
      { name: "Add New Admin", path: "newadmin", icon: UserCog },
      { name: "Settings", path: "settings", icon: Settings },
    ],
  };

  const roledata = user?.role;
  const currentMenu = menuItems[roledata] || [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        onClose();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, onClose]);

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-4">
          Main Menu
        </p>

        <nav className="space-y-1.5 sm:space-y-2">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            const isNotification =
              item.path === "notification" || item.path === "notifications";

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (isMobile) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  }`
                }
              >
                <div className="relative flex-shrink-0">
                  {isNotification && hasUnreadNotification && (
                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                  <Icon size={19} />
                </div>
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={() => {
            if (isMobile) onClose();
            logout();
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          © {new Date().getFullYear()} {appName || "MediCare"}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 h-[calc(100vh-65px)] bg-white border-r border-gray-200 flex-col flex-shrink-0 sticky top-[65px]">
        {renderNavContent(false)}
      </aside>

      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity duration-300 lg:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation Menu"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Navigation Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition active:scale-95"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{renderNavContent(true)}</div>
      </aside>
    </>
  );
};

export default Sidebar;
