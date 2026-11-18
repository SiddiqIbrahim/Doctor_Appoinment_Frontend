import React, { useState, useEffect, useContext, useMemo } from "react";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import {
  UserPlus,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Coins,
  Search,
  BadgeCheck,
  Power,
  Users,
} from "lucide-react";

const NewAdmin = () => {
  const { user: currentUser } = useContext(AuthContext);

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Search filter for admins directory
  const [searchTerm, setSearchTerm] = useState("");

  // New Admin Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    admin_fee: 50,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // Status toggle confirmation modal
  const [statusConfirmTarget, setStatusConfirmTarget] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(
        () => setFeedback({ type: "", message: "" }),
        4000,
      );
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Fetch all administrators
  const fetchAdmins = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await ApiServece.getAllAdmins();
      const list = response?.data || response?.admins || [];
      const adminList = Array.isArray(list) ? list : [];
      setAdmins(adminList);

      // Prepopulate commission fee based on existing admin
      if (adminList.length > 0 && adminList[0].admin_fee !== undefined) {
        setFormData((prev) => ({
          ...prev,
          admin_fee: adminList[0].admin_fee,
        }));
      }
    } catch (err) {
      console.error("Error fetching administrators:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.msg ||
          "Failed to load administrators directory. Please check your admin permissions.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Format Date Helper
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

  // Avatar Gradient Generator
  const getAvatarGradient = (name = "") => {
    const gradients = [
      "from-blue-600 to-indigo-700",
      "from-indigo-600 to-purple-700",
      "from-purple-600 to-pink-700",
      "from-teal-600 to-emerald-700",
      "from-sky-600 to-blue-800",
    ];
    const charCode = (name || "A").charCodeAt(0) || 0;
    return gradients[charCode % gradients.length];
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formError) setFormError("");
  };

  // Handle Submit New Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Administrator Full Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setFormError("Email Address is required.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError("Password and Confirm Password do not match.");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password.trim(),
        admin_fee: parseInt(formData.admin_fee, 10) || 50,
      };

      const response = await ApiServece.createAdmin(payload);
      const newAdminData = response?.data;

      // Add to local admin list
      if (newAdminData) {
        setAdmins((prev) => [newAdminData, ...prev]);
      } else {
        fetchAdmins(true);
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        admin_fee: formData.admin_fee,
      });
      setShowPassword(false);

      setFeedback({
        type: "success",
        message:
          response?.msg ||
          `New Administrator "${payload.name}" has been successfully provisioned!`,
      });
    } catch (err) {
      console.error("Error creating new admin:", err);
      setFormError(
        err.response?.data?.msg ||
          "Failed to create new administrator. Please verify the email is unique.",
      );
    } finally {
      setCreating(false);
    }
  };

  // Toggle Admin Status Confirmation
  const handleConfirmToggleStatus = async () => {
    if (!statusConfirmTarget) return;

    try {
      setStatusActionLoading(true);
      const response = await ApiServece.toggleAdminStatus(
        statusConfirmTarget.id,
      );
      const newActive = !statusConfirmTarget.is_active;

      // Update state locally
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === statusConfirmTarget.id ? { ...a, is_active: newActive } : a,
        ),
      );

      setFeedback({
        type: "success",
        message:
          response?.msg ||
          `Admin "${statusConfirmTarget.name}" account status updated.`,
      });
      setStatusConfirmTarget(null);
    } catch (err) {
      console.error("Error toggling admin status:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.msg ||
          "Failed to update administrator status. You cannot deactivate yourself.",
      });
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Filtered Admins
  const filteredAdmins = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return admins;

    return admins.filter((a) => {
      const name = (a.name || "").toLowerCase();
      const email = (a.email || "").toLowerCase();
      const phone = (a.phone || "").toLowerCase();
      const idStr = String(a.id);

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        idStr.includes(query)
      );
    });
  }, [admins, searchTerm]);

  // Aggregate stats
  const activeCount = admins.filter((a) => a.is_active !== false).length;
  const suspendedCount = admins.length - activeCount;

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <UserPlus className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Add New Administrator
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin Provisioning
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorized administrators can create new system admins and
                  manage access
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2.5 max-w-2xl leading-relaxed">
              Create and onboard trusted administrative accounts. New
              administrators inherit full platform governance capabilities,
              including doctor approvals, patient management, and commission
              oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAdmins(true)}
              disabled={refreshing || loading}
              title="Refresh Administrators"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition font-medium text-xs shadow-xs disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
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

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Admins */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Total Administrators
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {admins.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Provisioned admin accounts
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Active Admins */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Active System Admins
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {activeCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full access enabled
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Inactive Admins */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Suspended Accounts
              </p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">
                {suspendedCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Access disabled
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Power className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Main Content Grid: Left Form (5 Cols), Right Directory (7 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMN 1: Add New Admin Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Provision Admin Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter details to register a new administrator
                </p>
              </div>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </span>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin.colleague@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Phone Number & Commission Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                    Commission (₹)
                  </label>
                  <div className="relative">
                    <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="5"
                      name="admin_fee"
                      value={formData.admin_fee}
                      onChange={handleChange}
                      placeholder="50"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
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
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat initial password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Security Privileges Callout */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The created user will have role <strong>admin</strong> and can
                  log in immediately to manage users, doctors, and platform
                  settings.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-200 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>
                    {creating
                      ? "Provisioning Admin..."
                      : "Create Administrator Account"}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* COLUMN 2: Existing Administrators Directory (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Registered Administrators ({admins.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Directory of all accounts with administrator access
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search admin by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Admins List */}
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500">
                    Loading administrators directory...
                  </p>
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">
                    No administrators found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchTerm
                      ? "No admins match your search term."
                      : "No admin accounts found."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {filteredAdmins.map((adm) => {
                    const isSelf =
                      currentUser &&
                      parseInt(adm.id, 10) === parseInt(currentUser.id, 10);
                    const isActive = adm.is_active !== false;

                    return (
                      <div
                        key={adm.id}
                        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelf
                            ? "bg-blue-50/40 border-blue-200/80 shadow-xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Admin info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                              adm.name,
                            )} text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0`}
                          >
                            {(adm.name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-800 text-sm truncate">
                                {adm.name}
                              </h4>
                              {isSelf && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="space-y-0.5 mt-0.5 text-xs text-slate-500">
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{adm.email}</span>
                              </div>
                              {adm.phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <span>{adm.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-xs">
                          <div className="text-left sm:text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                              {isActive ? "Active" : "Suspended"}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Joined {formatDate(adm.created_at)}
                            </p>
                          </div>

                          {/* Toggle Status Button (Disabled for self) */}
                          <button
                            type="button"
                            onClick={() => setStatusConfirmTarget(adm)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "You cannot deactivate your own account"
                                : isActive
                                  ? "Suspend Admin Account"
                                  : "Activate Admin Account"
                            }
                            className={`p-2 rounded-xl transition ${
                              isSelf
                                ? "opacity-30 cursor-not-allowed text-slate-300"
                                : isActive
                                  ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                  : "text-amber-600 bg-amber-50 hover:bg-emerald-50 hover:text-emerald-600"
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom info badge */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                All administrators hold system-level access privileges.
              </span>
              <span className="font-semibold text-slate-600">
                Active: {activeCount} / {admins.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {statusConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  statusConfirmTarget.is_active !== false
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {statusConfirmTarget.is_active !== false
                    ? "Suspend Admin Account?"
                    : "Activate Admin Account?"}
                </h3>
                <p className="text-xs text-slate-400">
                  Administrative Governance
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to{" "}
              <strong>
                {statusConfirmTarget.is_active !== false
                  ? "suspend"
                  : "activate"}
              </strong>{" "}
              access for administrator{" "}
              <strong className="text-slate-900">
                {statusConfirmTarget.name}
              </strong>{" "}
              ({statusConfirmTarget.email})?
              {statusConfirmTarget.is_active !== false
                ? " This administrator will be prevented from signing in until re-activated."
                : " This administrator will immediately regain full access to the admin dashboard."}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setStatusConfirmTarget(null)}
                disabled={statusActionLoading}
                className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={statusActionLoading}
                className={`px-5 py-2 rounded-xl font-semibold text-white shadow-sm transition flex items-center gap-1.5 ${
                  statusConfirmTarget.is_active !== false
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                } disabled:opacity-50`}
              >
                {statusActionLoading && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {statusConfirmTarget.is_active !== false
                    ? "Confirm Suspension"
                    : "Confirm Activation"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAdmin;
