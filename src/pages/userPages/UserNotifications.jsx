import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Calendar,
  Clock,
  Clock3,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  X,
  CalendarCheck,
  FileText,
  ChevronRight,
  ShieldAlert,
  Zap,
} from "lucide-react";

const UserNotifications = () => {
  const { setHasUnreadNotification } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'reminders' | 'bookings'
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // Fetch notifications from server
  const fetchNotifications = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await ApiServece.getUserNotifications();
      const list = response?.data || [];
      const notifList = Array.isArray(list) ? list : [];
      setNotifications(notifList);

      // Once the user views the notifications, mark unread as read and remove red dot
      const unreadItems = notifList.filter((n) => !n.is_read);
      if (unreadItems.length > 0) {
        await ApiServece.markNotificationsRead();
        // Update local items to read
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, is_read: true })),
        );
      }

      // Immediately clear the red dot from navbar & sidebar
      setHasUnreadNotification(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      showToast(
        "error",
        "Failed to Load",
        "Unable to fetch notifications. Please check your connection.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Clear all notifications permanently
  const handleClearAll = async () => {
    try {
      setClearing(true);
      await ApiServece.clearAllNotifications();
      setNotifications([]);
      setHasUnreadNotification(false);
      setConfirmClearModal(false);
      showToast(
        "success",
        "Cleared Permanently",
        "All notifications have been permanently deleted.",
      );
    } catch (error) {
      console.error("Error clearing notifications:", error);
      showToast(
        "error",
        "Clear Failed",
        error.response?.data?.msg || "Failed to clear notifications.",
      );
    } finally {
      setClearing(false);
    }
  };

  // Delete a single notification permanently
  const handleDeleteOne = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await ApiServece.deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      showToast("success", "Deleted", "Notification permanently removed.");
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast("error", "Delete Failed", "Failed to delete notification.");
    }
  };

  // Format date helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);

      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper for notification type visuals & badge
  const getTypeConfig = (type) => {
    switch (type) {
      case "booking":
        return {
          icon: CalendarCheck,
          badgeLabel: "Booking Confirmed",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
          iconBg: "bg-blue-100 text-blue-600",
        };
      case "reminder_1day":
        return {
          icon: Clock,
          badgeLabel: "1-Day Reminder",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
          iconBg: "bg-amber-100 text-amber-600",
        };
      case "reminder_1hour":
        return {
          icon: Clock3,
          badgeLabel: "1-Hour Reminder",
          badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
          iconBg: "bg-orange-100 text-orange-600",
        };
      case "reminder_15min":
        return {
          icon: Zap,
          badgeLabel: "15-Min Reminder",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
          iconBg: "bg-rose-100 text-rose-600",
        };
      case "completion":
        return {
          icon: CheckCircle2,
          badgeLabel: "Consultation Completed",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          iconBg: "bg-emerald-100 text-emerald-600",
        };
      default:
        return {
          icon: Bell,
          badgeLabel: "General",
          badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
          iconBg: "bg-slate-100 text-slate-600",
        };
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === "unread" && item.is_read) return false;
      if (
        activeTab === "reminders" &&
        !["reminder_1day", "reminder_1hour", "reminder_15min"].includes(
          item.type,
        )
      ) {
        return false;
      }
      if (
        activeTab === "bookings" &&
        !["booking", "completion"].includes(item.type)
      ) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const msgMatch = item.message?.toLowerCase().includes(query);
        return titleMatch || msgMatch;
      }

      return true;
    });
  }, [notifications, activeTab, searchTerm]);

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

      {/* Confirmation Modal to Clear All */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Clear All Notifications?
                </h3>
                <p className="text-xs text-slate-400">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete all{" "}
              <strong>{notifications.length}</strong> notifications? All booking
              confirmations, reminders, and notices will be removed from your
              account.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearModal(false)}
                disabled={clearing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition flex items-center gap-2"
              >
                {clearing && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{clearing ? "Deleting..." : "Clear Permanently"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-start sm:items-center gap-3">
              <span className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0 mt-0.5 sm:mt-0">
                <BellRing className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  Notifications
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 sm:line-clamp-none">
                  Real-time updates on appointment bookings, reminders &
                  completion
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
            {/* Clear All Permanently Button */}
            {notifications.length > 0 && (
              <button
                onClick={() => setConfirmClearModal(true)}
                disabled={clearing || loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition text-xs font-semibold shadow-xs active:scale-95"
                title="Permanently Delete All Notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({notifications.length})
            </button>

            <button
              onClick={() => setActiveTab("reminders")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "reminders"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Reminders (1D, 1H, 15M)
            </button>

            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                activeTab === "bookings"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bookings & Completed
            </button>
          </div>

          {/* Search Input - Full width on mobile */}
          <div className="relative w-full sm:w-64 flex-shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 sm:py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-10 sm:p-16 text-center">
            <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Loading your notifications...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Checking booking confirmations and scheduled appointment reminders
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-10 sm:p-16 text-center space-y-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto border border-blue-100">
              <Bell className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No notifications found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {notifications.length === 0
                ? "You have no active notifications. When you book appointments or when reminders arrive (1 day, 1 hour, 15 min), they will appear here."
                : "No notifications match your current filter or search criteria."}
            </p>
            {notifications.length === 0 && (
              <Link
                to="/userdashboard/doctors"
                className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition"
              >
                <span>Find Doctors & Book Consultation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const config = getTypeConfig(notif.type);
              const Icon = config.icon;

              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 hover:shadow-md relative group w-full ${
                    notif.is_read
                      ? "border-slate-200/90"
                      : "border-blue-300 bg-blue-50/20 shadow-xs"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4 w-full">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6 sm:pr-8">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}
                        >
                          {config.badgeLabel}
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 tracking-tight break-words">
                        {notif.title}
                      </h4>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                        {notif.message}
                      </p>

                      {/* Action Links based on type */}
                      <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <Link
                          to="/userdashboard/appointments"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>View Appointments</span>
                        </Link>

                        {notif.type === "completion" && (
                          <Link
                            to="/userdashboard/userPrescription"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>View Prescriptions</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Individual Delete Button */}
                    <button
                      onClick={(e) => handleDeleteOne(notif.id, e)}
                      title="Permanently delete notification"
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex-shrink-0 absolute top-3 right-3 sm:static"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotifications;
