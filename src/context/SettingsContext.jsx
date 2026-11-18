import React, { createContext, useContext, useState, useEffect } from "react";
import ApiServece from "../API/ApiServece";

export const SettingsContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const getFullLogoUrl = (url) => {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const SettingsProvider = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [appName, setAppName] = useState("MediCare");
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await ApiServece.getApplicationSettings();
      if (res?.logoUrl !== undefined) {
        setLogoUrl(res.logoUrl);
      }
      if (res?.appName) {
        setAppName(res.appName);
      }
    } catch (error) {
      console.warn(
        "Could not fetch application settings, using defaults:",
        error,
      );
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = (newSettings = {}) => {
    if (newSettings.logoUrl !== undefined) {
      setLogoUrl(newSettings.logoUrl);
    }
    if (newSettings.appName !== undefined) {
      setAppName(newSettings.appName);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        logoUrl,
        appName,
        loadingSettings,
        updateSettings,
        refreshSettings: fetchSettings,
        fullLogoUrl: getFullLogoUrl(logoUrl),
        getFullLogoUrl,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      logoUrl: null,
      appName: "MediCare",
      loadingSettings: false,
      updateSettings: () => {},
      refreshSettings: () => {},
      fullLogoUrl: null,
      getFullLogoUrl: (u) => u,
    };
  }
  return context;
};

export default SettingsContext;
