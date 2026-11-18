import React, { useContext } from "react";
import { UserRound, Bell, ChevronRight, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthContext } from "../authContext";
import AppLogo from "./AppLogo";

const NavBar = ({ isSidebarOpen = false, onToggleSidebar }) => {
  const { user, hasUnreadNotification } = useContext(AuthContext);
  const getProfilePath = () => {
    if (user?.role === "doctor") {
      return "/doctordashboard/myprofile";
    }
    if (user?.role === "admin") {
      return "/admindashboard/adminprofile";
    }
    return "/userdashboard/userProfile";
  };

  const displayName = user?.name
    ? user.role === "doctor" && !user.name.toLowerCase().startsWith("dr")
      ? `Dr. ${user.name}`
      : user.name
    : "My Account";

  // Role subtitle label
  const roleLabel =
    user?.role === "doctor"
      ? "Doctor"
      : user?.role === "admin"
        ? "Admin"
        : "Patient";

  return (
    <header className="border-b border-gray-200 bg-white w-full sticky top-0 z-30 shadow-2xs">
      <div className="w-full flex justify-between items-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition border border-transparent hover:border-blue-100 flex-shrink-0"
              aria-label={
                isSidebarOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={isSidebarOpen}
            >
              <Menu size={22} />
            </button>
          )}

          <AppLogo size="md" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
          {user?.role === "user" && (
            <Link
              to="/userdashboard/notification"
              className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition border border-transparent hover:border-blue-100/60 flex-shrink-0"
              title="Notifications"
              aria-label="View notifications"
            >
              <div className="relative">
                {hasUnreadNotification && (
                  <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
                <Bell className="w-5 h-5" />
              </div>
            </Link>
          )}

          <Link
            to={getProfilePath()}
            className="flex items-center gap-2 sm:gap-2.5 bg-blue-50/80 hover:bg-blue-100/80 active:scale-[0.98] border border-blue-200/70 hover:border-blue-300 px-2 sm:px-3 py-1.5 rounded-2xl transition cursor-pointer shadow-xs group flex-shrink-0"
            title={`View ${displayName}'s Profile`}
            aria-label="Navigate to user profile"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:bg-blue-700 transition flex-shrink-0">
              {user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserRound size={15} />
              )}
            </div>

            <div className="text-left max-w-[70px] min-[380px]:max-w-[100px] sm:max-w-[150px]">
              <h2 className="text-xs font-bold text-gray-800 leading-tight truncate group-hover:text-blue-700 transition">
                {displayName}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-blue-600 font-medium capitalize truncate">
                {roleLabel}
              </p>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition hidden sm:block" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
