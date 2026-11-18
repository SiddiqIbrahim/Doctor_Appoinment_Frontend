import React, { useState, useEffect, useContext } from "react";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  Lock,
  HeartPulse,
  BadgeCheck,
} from "lucide-react";

const UserProfile = () => {
  const { setUser: setGlobalUser } = useContext(AuthContext);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Notification Banner
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [formError, setFormError] = useState("");

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await ApiServece.getUserProfile();
      const user = response?.user || response?.data || response;
      setUserData(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      showAlert(
        "error",
        error.response?.data?.msg ||
          "Failed to load user profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Open modal and prefill data
  const handleOpenEdit = () => {
    if (!userData) return;
    setFormData({
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
    });
    setFormError("");
    setShowEditModal(true);
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formError) setFormError("");
  };

  // Submit profile edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Full Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setFormError("Email Address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    try {
      setSaving(true);
      const response = await ApiServece.updateUserProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      const updated = response?.user || {
        ...userData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      setUserData(updated);
      if (setGlobalUser) {
        setGlobalUser(updated);
      }

      setShowEditModal(false);
      showAlert("success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setFormError(
        error.response?.data?.msg ||
          error.response?.data?.error ||
          "Failed to update profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Format Date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="w-full min-h-[calc(100vh-65px)] flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">
            Profile Not Found
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Unable to fetch your profile information. Please verify your login
            session.
          </p>
          <button
            onClick={fetchUserProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Dismissible Alert Banner */}
        {alert && (
          <div
            className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all duration-300 ${
              alert.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {alert.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-medium">{alert.message}</span>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="p-1 hover:bg-black/5 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Hero Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-bl-full pointer-events-none -z-0"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar circle */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md shadow-blue-200">
                {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    {userData.name}
                  </h1>
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                </div>

                <p className="text-slate-500 text-sm mt-0.5">
                  {userData.email}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                    <User className="w-3.5 h-3.5" />
                    {userData.role === "user" ? "Patient" : userData.role}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active Account
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div>
              <button
                onClick={handleOpenEdit}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <User className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-400">
                  Your identity and primary contact details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {userData.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {userData.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {userData.phone || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details & Security Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Account & Security
                </h2>
                <p className="text-xs text-slate-400">
                  System metadata and security status
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Account ID
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    #{userData.id}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Member Since
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {formatDate(userData.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Account Status
                  </p>
                  <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                    Active & Verified
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5 mt-2">
                <HeartPulse className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your personal health data and appointments are encrypted and
                  strictly shared only with the doctors you consult.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-800">Edit User Profile</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
