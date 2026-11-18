import React, { useState, useEffect, useContext } from "react";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Calendar,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Coins,
  Stethoscope,
  Users,
  Activity,
  Lock,
  Eye,
  EyeOff,
  BadgeCheck,
  Key,
} from "lucide-react";

const AdminProfile = () => {
  const { user: authUser, setUser: setGlobalUser } = useContext(AuthContext);

  const [admin, setAdmin] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    admin_fee: 50,
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(
        () => setFeedback({ type: "", message: "" }),
        4000,
      );
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchAdminProfile = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await ApiServece.getAdminProfile();
      const adminData =
        response?.data?.admin || response?.admin || response?.data || {};
      const stats = response?.data?.systemStats || {};

      setAdmin(adminData);
      setSystemStats(stats);

      setFormData((prev) => ({
        ...prev,
        name: adminData.name || "",
        email: adminData.email || "",
        phone: adminData.phone || "",
        admin_fee: adminData.admin_fee !== undefined ? adminData.admin_fee : 50,
        password: "",
        confirmPassword: "",
      }));

      if (adminData && setGlobalUser) {
        setGlobalUser((prev) => ({
          ...prev,
          ...adminData,
        }));
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
      // Fallback to authUser from context if API fails
      if (authUser) {
        setAdmin(authUser);
        setFormData((prev) => ({
          ...prev,
          name: authUser.name || "",
          email: authUser.email || "",
          phone: authUser.phone || "",
          admin_fee: authUser.admin_fee || 50,
        }));
      } else {
        setFeedback({
          type: "error",
          message:
            err.response?.data?.msg ||
            "Failed to load admin profile. Please check your admin access.",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const handleOpenEdit = () => {
    if (!admin) return;
    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      admin_fee: admin.admin_fee !== undefined ? admin.admin_fee : 50,
      password: "",
      confirmPassword: "",
    });
    setFormError("");
    setShowPassword(false);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
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

    if (formData.password) {
      if (formData.password.length < 6) {
        setFormError("New password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError("New password and confirm password do not match.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        admin_fee: parseInt(formData.admin_fee, 10) || 0,
      };

      if (formData.password) {
        payload.password = formData.password.trim();
      }

      const response = await ApiServece.updateAdminProfile(payload);
      const updatedUser = response?.data || response?.user || payload;

      setAdmin((prev) => ({
        ...prev,
        ...updatedUser,
      }));

      if (setGlobalUser) {
        setGlobalUser((prev) => ({
          ...prev,
          ...updatedUser,
        }));
      }

      setShowEditModal(false);
      setFeedback({
        type: "success",
        message: response?.msg || "Administrator profile updated successfully!",
      });
    } catch (err) {
      console.error("Error updating admin profile:", err);
      setFormError(
        err.response?.data?.msg ||
          "Failed to update profile. Please check if email is already taken.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {feedback.message && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm transition-all duration-300 ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback({ type: "", message: "" })}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Header Gradient Top Banner */}
          <div className="h-32 md:h-36 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 relative p-6 flex justify-end items-start">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAdminProfile(true)}
                disabled={refreshing || loading}
                title="Refresh Profile"
                className="p-2 rounded-xl bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={handleOpenEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-800 font-semibold text-xs hover:bg-slate-50 transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          <div className="px-6 md:px-8 pb-8 -mt-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-3xl md:text-4xl shadow-lg border-4 border-white">
                  {(admin?.name || "A").charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    {admin?.name || "Administrator"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    System Administrator
                  </span>
                </div>

                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span>ID: #ADM-{admin?.id || 1}</span>
                  <span>•</span>
                  <span>Full Platform Privileges</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Account
                  </span>
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-0.5 md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <p>
                Registered:{" "}
                <strong className="text-slate-600">
                  {formatDate(admin?.created_at)}
                </strong>
              </p>
              <p>
                Last Sync:{" "}
                <strong className="text-slate-600">
                  {formatDateTime(admin?.updated_at || admin?.created_at)}
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Platform Fee */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Platform Commission Fee
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                ₹{admin?.admin_fee !== undefined ? admin.admin_fee : 50}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Stored in user table
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Managed Doctors
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {systemStats.totalDoctors}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Medical specialists
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Registered Patients
              </p>
              <h3 className="text-2xl font-bold text-indigo-700 mt-1">
                {systemStats.totalPatients}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">User accounts</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                Total Bookings
              </p>
              <h3 className="text-2xl font-bold text-purple-700 mt-1">
                {systemStats.totalAppointments}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Platform appointments
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal & Contact Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Contact & Identity</span>
              </h3>
              <button
                onClick={handleOpenEdit}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Edit
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Full Name:
                </span>
                <span className="font-bold text-slate-800">
                  {admin?.name || "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address:
                </span>
                <span className="font-bold text-slate-800">
                  {admin?.email || "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone Number:
                </span>
                <span className="font-bold text-slate-800">
                  {admin?.phone || "Not configured"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Member Since:
                </span>
                <span className="font-bold text-slate-800">
                  {formatDate(admin?.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Permissions & Governance</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Verified Root
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  Access Tier:
                </span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                  Super Administrator
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500 flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-slate-400" />
                  Configured Platform Fee:
                </span>
                <span className="font-bold text-emerald-700">
                  ₹{admin?.admin_fee !== undefined ? admin.admin_fee : 50} per
                  booking
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Security Credential:
                </span>
                <span className="font-mono text-slate-600">••••••••••••</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  Status:
                </span>
                <span className="font-semibold text-emerald-700">
                  Active & Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Edit Administrator Profile
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update identity, contact details, and platform credentials
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Administrator"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="admin@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Platform Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.admin_fee}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        admin_fee: e.target.value,
                      }))
                    }
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">
                    Change Password (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">
                      New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
