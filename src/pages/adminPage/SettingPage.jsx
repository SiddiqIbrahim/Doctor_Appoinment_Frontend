import React, { useState, useRef, useContext, useEffect } from "react";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import { useSettings } from "../../context/SettingsContext";
import {
  Settings,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Image as ImageIcon,
  Save,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Info,
  Sparkles,
  Layout,
  Sliders,
} from "lucide-react";

const SettingPage = () => {
  const { user } = useContext(AuthContext);
  const { logoUrl, appName, fullLogoUrl, updateSettings } = useSettings();

  const fileInputRef = useRef(null);

  // Form & Image states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [appNameInput, setAppNameInput] = useState(appName || "MediCare");

  // Status & Feedback states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingAppName, setSavingAppName] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync appName from context when it changes
  useEffect(() => {
    if (appName) {
      setAppNameInput(appName);
    }
  }, [appName]);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // 1. File Selection & Client-side Validation (PNG, JPG, JPEG, WEBP <= 2MB)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME types
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast(
        "error",
        "Invalid File Format",
        "Only PNG, JPG, JPEG, and WEBP formats are supported.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate File Size (2 MB = 2 * 1024 * 1024 bytes)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showToast(
        "error",
        "File Size Exceeded",
        `Selected file size is ${sizeMB} MB. Maximum allowed size is 2 MB.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Create live preview
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  // 2. Discard / Cancel selected image
  const handleCancelSelection = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Save Changes & Upload to Server
  const handleSaveLogo = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      showToast(
        "error",
        "No File Selected",
        "Please select an image file to upload.",
      );
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", selectedFile);

      const response = await ApiServece.uploadApplicationLogo(formData);
      console.log("Upload logo response:", response);

      // Immediately update global context so all website components refresh instantly
      updateSettings({
        logoUrl: response.logoUrl,
        appName: response.appName || appName,
      });

      // Clear preview state
      handleCancelSelection();

      showToast(
        "success",
        "Logo Updated Successfully!",
        "The new application logo has been saved and applied dynamically across the entire website.",
      );
    } catch (error) {
      console.error("Error uploading logo:", error);
      const serverMsg = error.response?.data?.msg || error.message || "";
      showToast(
        "error",
        "Upload Failed",
        serverMsg || "Failed to upload application logo. Please try again.",
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  // 4. Update Application Name
  const handleSaveAppName = async (e) => {
    if (e) e.preventDefault();
    if (!appNameInput.trim()) {
      showToast("error", "Required Field", "Application name cannot be empty.");
      return;
    }

    try {
      setSavingAppName(true);
      const response = await ApiServece.updateApplicationName(
        appNameInput.trim(),
      );
      updateSettings({ appName: response.appName });
      showToast(
        "success",
        "Application Name Updated",
        `Application name updated to "${response.appName}".`,
      );
    } catch (error) {
      console.error("Error updating app name:", error);
      showToast(
        "error",
        "Update Failed",
        error.response?.data?.msg || "Failed to update application name.",
      );
    } finally {
      setSavingAppName(false);
    }
  };

  // Access Control Guard: Only Admin
  if (user && user.role !== "admin") {
    return (
      <div className="w-full min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Administrator Access Required
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Only authenticated administrators have permission to access
            application settings and upload custom branding logos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all ${
              toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-300 text-emerald-900"
                : "bg-rose-50/95 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm font-bold capitalize">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Sliders className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Application Settings
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin Control
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure global branding, logo graphics & platform properties
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2.5 max-w-2xl leading-relaxed">
              Upload and manage your medical platform logo. Updating the logo
              here dynamically synchronizes in real-time across the Navbar,
              Login page, Signup page, and User/Doctor/Admin sidebars.
            </p>
          </div>
        </div>

        {/* Grid Layout: Main Upload & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Logo Upload Section (2 Columns on large) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Application Logo
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload an official brand logo for your medical consultation
                    portal
                  </p>
                </div>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </span>
              </div>

              {/* Upload Drop Area & Controls */}
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload-input"
                />

                {/* Upload Button Trigger & Drag Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all bg-blue-50/20 hover:bg-blue-50/50 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                    Click to select an image from your computer
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports <strong>PNG, JPG, JPEG, WEBP</strong> (Maximum file
                    size: <strong>2 MB</strong>)
                  </p>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition"
                    >
                      Upload New Logo
                    </button>
                  </div>
                </div>

                {/* Image Preview Box (Shown when a file is selected) */}
                {previewUrl && (
                  <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Selected Image Preview
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {selectedFile?.name} (
                        {(selectedFile?.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-center min-h-[140px] max-h-[180px]">
                      <img
                        src={previewUrl}
                        alt="Selected Logo Preview"
                        className="max-h-24 max-w-full object-contain rounded-lg"
                      />
                    </div>

                    {/* Action Buttons: Save Changes & Cancel */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelSelection}
                        disabled={uploadingLogo}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveLogo}
                        disabled={uploadingLogo}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-60"
                      >
                        {uploadingLogo ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Format & Size Requirements Checklist */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Logo Specification Guidelines
                </span>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                  <li>
                    Transparent background (PNG/WEBP) is recommended for best
                    contrast on both light and dark headers.
                  </li>
                  <li>
                    Recommended dimensions: <strong>240 × 80 pixels</strong> (or
                    similar 3:1 aspect ratio).
                  </li>
                  <li>
                    Maximum file size allowed is <strong>2 MB</strong>.
                  </li>
                </ul>
              </div>
            </div>

            {/* Application Name Setting Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Application Branding Name
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Used across browser titles, invoices, and navigation brand
                    text
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveAppName} className="flex gap-3">
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  placeholder="e.g. MediCare"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={savingAppName || appNameInput.trim() === appName}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingAppName ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Active Logo & Live Site Mockup */}
          <div className="space-y-6">
            {/* Current Active Logo Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Current Active Logo
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live in Database
                </span>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/80 flex items-center justify-center min-h-[120px]">
                {fullLogoUrl ? (
                  <img
                    src={fullLogoUrl}
                    alt={appName}
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-500">
                      Standard Default Icon
                    </p>
                    <p className="text-[11px] text-slate-400">
                      No custom logo uploaded yet. Standard MediCare icon is
                      displayed.
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                <p>
                  Active Brand Name:{" "}
                  <strong className="text-slate-700">
                    {appName || "MediCare"}
                  </strong>
                </p>
                <p className="truncate">
                  Storage Path:{" "}
                  <code className="font-mono text-slate-600">
                    {logoUrl || "Default inline"}
                  </code>
                </p>
              </div>
            </div>

            {/* Live Navigation Mockup Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layout className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Live Preview in Header
                </h3>
              </div>

              <p className="text-xs text-slate-400">
                How your active logo appears on the website navbar:
              </p>

              {/* Mini Navbar Mockup */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {fullLogoUrl ? (
                      <img
                        src={fullLogoUrl}
                        alt="Logo"
                        className="h-8 max-w-[120px] object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-sm font-bold text-slate-800">
                      {appName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100" />
                    <div className="w-12 h-3 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
