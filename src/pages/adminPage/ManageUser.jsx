import React, { useState, useEffect, useMemo } from "react";
import ApiServece from "../../API/ApiServece";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Eye,
  Trash2,
  Power,
  X,
  Stethoscope,
  ArrowUpDown,
  UserCheck,
  UserX,
  Activity,
} from "lucide-react";

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'name' | 'appointments'

  // Modals
  const [selectedUser, setSelectedUser] = useState(null); // Detailed view
  const [statusConfirmUser, setStatusConfirmUser] = useState(null); // Toggle active status confirmation
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null); // Delete confirmation
  const [actionLoading, setActionLoading] = useState(false);

  // Auto-clear feedback after 4 seconds
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(
        () => setFeedback({ type: "", message: "" }),
        4000,
      );
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Fetch patient users (strictly role === 'user')
  const fetchUsers = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await ApiServece.getAdminUsers();
      const list = response?.data || response?.users || [];

      // Extra client-side safeguard: ensure only role === 'user' is shown
      const patientList = Array.isArray(list)
        ? list.filter((u) => u.role === "user")
        : [];

      setUsers(patientList);
    } catch (err) {
      console.error("Error fetching patient users:", err);
      setError(
        err.response?.data?.msg ||
          "Unable to load patient users. Please check your admin permissions.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Format Helpers
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

  // Avatar gradient generator based on user name
  const getAvatarGradient = (name = "") => {
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-teal-500 to-emerald-600",
      "from-indigo-500 to-purple-600",
      "from-sky-500 to-cyan-600",
      "from-violet-500 to-fuchsia-600",
    ];
    const charCode = name.charCodeAt(0) || 0;
    return gradients[charCode % gradients.length];
  };

  // Toggle user status (Activate / Deactivate)
  const handleToggleStatus = async () => {
    if (!statusConfirmUser) return;
    try {
      setActionLoading(true);
      const response = await ApiServece.toggleAdminUserStatus(
        statusConfirmUser.id,
      );
      const isNowActive = !statusConfirmUser.is_active;

      // Update state locally
      setUsers((prev) =>
        prev.map((u) =>
          u.id === statusConfirmUser.id ? { ...u, is_active: isNowActive } : u,
        ),
      );

      // Also update selectedUser if modal is open
      if (selectedUser?.id === statusConfirmUser.id) {
        setSelectedUser((prev) => ({ ...prev, is_active: isNowActive }));
      }

      setFeedback({
        type: "success",
        message:
          response?.msg ||
          `User ${statusConfirmUser.name} has been ${
            isNowActive ? "activated" : "deactivated"
          } successfully.`,
      });
      setStatusConfirmUser(null);
    } catch (err) {
      console.error("Error toggling status:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.msg ||
          "Failed to update user account status. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      setActionLoading(true);
      const response = await ApiServece.deleteAdminUser(deleteConfirmUser.id);

      // Remove from local list
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));

      if (selectedUser?.id === deleteConfirmUser.id) {
        setSelectedUser(null);
      }

      setFeedback({
        type: "success",
        message:
          response?.msg ||
          `Patient account for ${deleteConfirmUser.name} was successfully deleted.`,
      });
      setDeleteConfirmUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.msg ||
          "Failed to delete user account. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics Calculations
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active !== false).length;
    const inactive = total - active;
    const totalBookings = users.reduce((acc, u) => {
      return acc + (Array.isArray(u.appointments) ? u.appointments.length : 0);
    }, 0);

    return { total, active, inactive, totalBookings };
  }, [users]);

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Status filter
        if (statusFilter === "active" && u.is_active === false) return false;
        if (statusFilter === "inactive" && u.is_active !== false) return false;

        // Search query filter
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;

        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        const idStr = String(u.id);

        return (
          name.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          idStr.includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
        if (sortBy === "name") {
          return (a.name || "").localeCompare(b.name || "");
        }
        if (sortBy === "appointments") {
          const aCount = Array.isArray(a.appointments)
            ? a.appointments.length
            : 0;
          const bCount = Array.isArray(b.appointments)
            ? b.appointments.length
            : 0;
          return bCount - aCount;
        }
        return 0;
      });
  }, [users, searchTerm, statusFilter, sortBy]);

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  Manage Patient Users
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Role: Patient Only
                  </span>
                  <span className="text-xs text-slate-400">
                    Doctors & Admins are strictly excluded
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2.5 max-w-2xl leading-relaxed">
              View registered patient profiles, monitor their appointment
              activity, manage account access statuses, and maintain the patient
              directory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing || loading}
              title="Refresh User List"
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
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all duration-300 ${
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

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => fetchUsers()}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Patients */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Patients
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {stats.total}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Registered accounts
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Active Patients */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Active Patients
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {stats.active}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.total > 0
                  ? `${Math.round((stats.active / stats.total) * 100)}% active rate`
                  : "Normal status"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Inactive Patients */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Suspended / Inactive
              </p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">
                {stats.inactive}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Access disabled
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <UserX className="w-6 h-6" />
            </div>
          </div>

          {/* Total Appointments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Total Bookings
              </p>
              <h3 className="text-2xl font-bold text-indigo-700 mt-1">
                {stats.totalBookings}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Patient consultations
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient by name, email, phone number, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Status:
              </span>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Active ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === "inactive"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Inactive ({stats.inactive})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="appointments">Most Appointments</option>
              </select>
            </div>
          </div>

          {/* Active filter summary bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>
              Showing{" "}
              <strong className="text-slate-800">{filteredUsers.length}</strong>{" "}
              of <strong className="text-slate-800">{users.length}</strong>{" "}
              registered patient users
            </span>
            {(searchTerm || statusFilter !== "all" || sortBy !== "newest") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSortBy("newest");
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Main User List Section */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-9 h-9 text-blue-600 animate-spin mb-4" />
            <h3 className="text-base font-semibold text-slate-800">
              Loading Patient Directory...
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Fetching registered patient accounts and booking histories.
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No Patient Users Found
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md">
              {searchTerm || statusFilter !== "all"
                ? "No registered patient accounts match your search or filter criteria. Try adjusting your query."
                : "No users with role 'user' have registered on the platform yet."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Patient</th>
                    <th className="py-4 px-6">Contact Info</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Bookings</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Registered</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((u) => {
                    const isActive = u.is_active !== false;
                    const appointmentCount = Array.isArray(u.appointments)
                      ? u.appointments.length
                      : 0;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Patient info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                                u.name,
                              )} text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0`}
                            >
                              {(u.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 text-sm truncate">
                                {u.name}
                              </h4>
                              <p className="text-[11px] font-mono text-slate-400">
                                #USR-{u.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <a
                              href={`mailto:${u.email}`}
                              className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition truncate max-w-[200px]"
                              title={u.email}
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </a>
                            {u.phone ? (
                              <a
                                href={`tel:${u.phone}`}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition"
                              >
                                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{u.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                No phone
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            Patient
                          </span>
                        </td>

                        {/* Bookings */}
                        <td className="py-4 px-6">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{appointmentCount} Bookings</span>
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-slate-400"
                              }`}
                            />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Registration Date */}
                        <td className="py-4 px-6 text-slate-500 text-[11px]">
                          {formatDate(u.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              onClick={() => setSelectedUser(u)}
                              title="View Patient Details"
                              className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              title="Delete Patient Account"
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isActive = u.is_active !== false;
                const appointmentCount = Array.isArray(u.appointments)
                  ? u.appointments.length
                  : 0;

                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                            u.name,
                          )} text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0`}
                        >
                          {(u.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {u.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-400">
                              #USR-{u.id}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              •
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(u.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Booking Stats and Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {appointmentCount} Bookings
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => setStatusConfirmUser(u)}
                          className={`p-1.5 rounded-lg text-xs ${
                            isActive
                              ? "text-emerald-600 hover:bg-rose-50 hover:text-rose-600"
                              : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                    selectedUser.name,
                  )} text-white font-bold flex items-center justify-center text-lg shadow-sm`}
                >
                  {(selectedUser.name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-slate-400">
                      ID: #USR-{selectedUser.id}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Role: Patient
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs">
              {/* Account Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Contact Information
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">
                        {selectedUser.phone || "No phone number registered"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Account Status
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Access Status:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          selectedUser.is_active !== false
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {selectedUser.is_active !== false
                          ? "Active"
                          : "Suspended"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Member Since:</span>
                      <span className="font-medium text-slate-800">
                        {formatDateTime(selectedUser.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient's Appointment History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Appointment History (
                    {selectedUser.appointments?.length || 0})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Latest consultations booked
                  </span>
                </div>

                {!selectedUser.appointments ||
                selectedUser.appointments.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">
                      No appointments recorded
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This patient has not booked any doctor consultations yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedUser.appointments.map((apt) => {
                      const docName =
                        apt.doctor?.user?.name || "Specialist Doctor";
                      const docSpec =
                        apt.doctor?.specialization || "General Medicine";

                      const statusColors = {
                        confirmed: "bg-blue-50 text-blue-700 border-blue-200",
                        completed:
                          "bg-emerald-50 text-emerald-700 border-emerald-200",
                        pending: "bg-amber-50 text-amber-700 border-amber-200",
                        cancelled: "bg-rose-50 text-rose-700 border-rose-200",
                      };

                      return (
                        <div
                          key={apt.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">
                                {docName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {docSpec} • {formatDate(apt.appointment_date)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                                  statusColors[apt.status] ||
                                  "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {apt.status}
                              </span>
                              {apt.consultation_fee && (
                                <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                                  ₹{apt.consultation_fee}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
              <button
                onClick={() => {
                  setStatusConfirmUser(selectedUser);
                }}
                className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 ${
                  selectedUser.is_active !== false
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {selectedUser.is_active !== false
                  ? "Suspend Account"
                  : "Activate Account"}
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl font-semibold text-xs hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Toggle Status Confirmation Modal */}
      {/* ============================================================== */}
      {statusConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  statusConfirmUser.is_active !== false
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {statusConfirmUser.is_active !== false
                    ? "Deactivate Patient Account?"
                    : "Activate Patient Account?"}
                </h3>
                <p className="text-xs text-slate-400">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to{" "}
              <strong>
                {statusConfirmUser.is_active !== false
                  ? "deactivate"
                  : "activate"}
              </strong>{" "}
              the patient account for{" "}
              <strong className="text-slate-900">
                {statusConfirmUser.name}
              </strong>{" "}
              ({statusConfirmUser.email})?
              {statusConfirmUser.is_active !== false
                ? " The user will be prevented from booking appointments and logging in until re-activated."
                : " The user will immediately regain full access to their patient portal."}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusConfirmUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition flex items-center gap-1.5 ${
                  statusConfirmUser.is_active !== false
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                } disabled:opacity-50`}
              >
                {actionLoading && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {statusConfirmUser.is_active !== false
                    ? "Confirm Deactivation"
                    : "Confirm Activation"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Delete Patient Account?
                </h3>
                <p className="text-xs text-rose-500 font-medium">
                  Permanent Action
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the patient account
              for{" "}
              <strong className="text-slate-900">
                {deleteConfirmUser.name}
              </strong>{" "}
              ({deleteConfirmUser.email})? All associated personal records and
              profile data will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;
