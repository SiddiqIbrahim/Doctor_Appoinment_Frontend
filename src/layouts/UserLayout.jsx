import React, { useState, useContext } from "react";
import { Outlet, Navigate } from "react-router-dom";
import NavBar from "../Componets/NavBar";
import Sidebar from "../Componets/Sidebar";
import { AuthContext } from "../authContext";

const UserLayout = () => {
  const { user, authLoading, authedicate } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (authLoading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!authedicate) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full">
      <NavBar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      <div className="flex flex-1 w-full min-w-0 relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
