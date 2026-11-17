import React from "react";
import { Outlet ,Navigate } from "react-router-dom";
import NavBar from "../Componets/NavBar";
import Sidebar from "../Componets/Sidebar";
import { useContext } from "react";
import { AuthContext } from "../authContext";

const UserLayout = () => {
  const { user, authLoading, authedicate } = useContext(AuthContext);

  if (authLoading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!authedicate) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar at the top */}
      <NavBar />

      {/* Sidebar and page content below Navbar */}
      <div className="flex">
        <Sidebar role="user" />

        {/* Dynamic content */}
        <main className="flex-1 p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
