import React, { useState } from "react";
import { HeartPulse } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
const AppLogo = ({
  size = "md",
  showText = true,
  className = "",
  imgClassName = "",
  textClassName = "",
  clickable = false,
}) => {
  const { fullLogoUrl, appName } = useSettings();
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    sm: {
      box: "w-8 h-8 rounded-lg",
      icon: 16,
      text: "text-sm sm:text-base font-bold",
      img: "h-7 sm:h-8 max-w-[100px] sm:max-w-[120px]",
    },
    md: {
      box: "w-9 h-9 sm:w-10 sm:h-10 rounded-xl",
      icon: 20,
      text: "text-base sm:text-xl font-bold",
      img: "h-8 sm:h-10 max-w-[120px] sm:max-w-[160px]",
    },
    lg: {
      box: "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl",
      icon: 28,
      text: "text-xl sm:text-2xl font-bold",
      img: "h-12 sm:h-14 max-w-[160px] sm:max-w-[200px]",
    },
    xl: {
      box: "w-16 h-16 sm:w-20 sm:h-20 rounded-3xl",
      icon: 40,
      text: "text-2xl sm:text-3xl font-extrabold",
      img: "h-16 sm:h-20 max-w-[200px] sm:max-w-[240px]",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const hasCustomLogo = fullLogoUrl && !imageError;

  return (
    <div
      className={`inline-flex items-center gap-2 sm:gap-3 select-none min-w-0 ${className} ${
        clickable ? "cursor-pointer" : ""
      }`}
    >
      {hasCustomLogo ? (
        <div className="flex items-center flex-shrink-0 min-w-0">
          <img
            src={fullLogoUrl}
            alt={appName || "Application Logo"}
            onError={() => setImageError(true)}
            className={`object-contain transition-all duration-200 rounded-lg ${currentSize.img} ${imgClassName}`}
          />
        </div>
      ) : (
        <div
          className={`bg-blue-600 flex items-center justify-center text-white shadow-xs flex-shrink-0 ${currentSize.box} ${imgClassName}`}
        >
          <HeartPulse size={currentSize.icon} className="text-white" />
        </div>
      )}

      {showText && (
        <h1
          className={`tracking-tight text-gray-800 truncate ${currentSize.text} ${textClassName} ${
            hasCustomLogo ? "hidden md:inline-block" : "inline-block"
          }`}
        >
          {appName || "MediCare"}
        </h1>
      )}
    </div>
  );
};

export default AppLogo;
