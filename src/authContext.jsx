import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { createContext } from "react";
import { useNavigate } from "react-router-dom";
export const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [authedicate, setIsAuthendicate] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);

  const checkUnreadNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(
        "http://localhost:3000/api/v1/user/notifications/unread-status",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setHasUnreadNotification(Boolean(res.data?.hasUnread));
    } catch (err) {
      // silent catch for unread check
    }
  };

  useEffect(() => {
    if (authedicate && user?.role === "user") {
      checkUnreadNotifications();
      const interval = setInterval(checkUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [authedicate, user]);

  const getProfile = async (token) => {
    const getUser = await axios.get(
      "http://localhost:3000/api/v1/user/getUser",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const profile = getUser.data.user;
    setUser(profile);
    setIsAuthendicate(true);
    console.log("profile", profile);
    return profile;
  };

  const userLogin = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/v1/user/login",
        { email: email, password: password },
      );
      console.log("response", response.data);

      if (response.data.response_code === 200) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        const profile = await getProfile(token);
        return profile;
      }
      return null;
    } catch (error) {
      console.log("Login error:", error);
      const serverMsg =
        error.response?.data?.msg || error.message || "Login failed";
      const customErr = new Error(serverMsg);
      customErr.response = error.response;
      throw customErr;
    }
  };
  const checkAuth = async () => {
    console.log("hello");

    const token = localStorage.getItem("token");

    if (!token) {
      setAuthLoading(false);
      return;
    }

    try {
      await getProfile(token);
    } catch (error) {
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthendicate(false);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthendicate(false);
    setUser(null);
    navigate("/");
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        userLogin,
        logout,
        authedicate,
        authLoading,
        getProfile,
        hasUnreadNotification,
        setHasUnreadNotification,
        checkUnreadNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
