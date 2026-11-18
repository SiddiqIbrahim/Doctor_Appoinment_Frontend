import React, { useState, useEffect, useMemo } from "react";
import ApiServece from "../../API/ApiServece";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  RefreshCw,
  Sparkles,
  CalendarDays,
  Check,
} from "lucide-react";

const Availability = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Notifications
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    date: todayStr,
    startTime: "09:00",
    endTime: "10:00",
  });
  const [formError, setFormError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'available' | 'booked'
  const [dateFilter, setDateFilter] = useState("all"); // 'all' | 'today' | 'upcoming' | specific date

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Fetch slots from API
  const fetchAvailability = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await ApiServece.getAvailability();
      const slotList = response?.data || response?.slots || [];
      setSlots(Array.isArray(slotList) ? slotList : []);
    } catch (error) {
      console.error("Error fetching availability:", error);
      showAlert(
        "error",
        error.response?.data?.msg ||
          "Failed to load availability slots. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  // Quick duration helper (adds minutes to start time)
  const setQuickDuration = (minutes) => {
    if (!formData.startTime) return;
    const [h, m] = formData.startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(h, m, 0, 0);

    const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);
    const endH = String(endDate.getHours()).padStart(2, "0");
    const endM = String(endDate.getMinutes()).padStart(2, "0");
    setFormData((prev) => ({ ...prev, endTime: `${endH}:${endM}` }));
    setFormError("");
  };

  // Create Slot Submission
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.date || !formData.startTime || !formData.endTime) {
      setFormError("All fields are required.");
      return;
    }

    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setFormError("Please enter valid date and time.");
      return;
    }

    if (endDateTime <= startDateTime) {
      setFormError("End time must be later than start time.");
      return;
    }

    // Check if slot starts in the past
    const now = new Date();
    if (startDateTime < now) {
      setFormError("Cannot create availability slots in the past.");
      return;
    }

    try {
      setSubmitting(true);
      await ApiServece.createAvailability({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      showAlert("success", "Availability slot created successfully!");
      setShowModal(false);
      fetchAvailability(true);
    } catch (error) {
      console.error("Error creating slot:", error);
      setFormError(
        error.response?.data?.msg ||
          error.response?.data?.error ||
          "Failed to create slot. Please check your doctor profile and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Slot Handler
  const handleDeleteSlot = async (slotId) => {
    if (
      !window.confirm("Are you sure you want to remove this availability slot?")
    ) {
      return;
    }

    try {
      setDeletingId(slotId);
      await ApiServece.deleteAvailability(slotId);
      showAlert("success", "Availability slot removed.");
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (error) {
      console.error("Error deleting slot:", error);
      showAlert(
        "error",
        error.response?.data?.msg ||
          "Failed to delete slot. It may already be booked.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Format Helpers
  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTitle = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      if (d.toDateString() === today.toDateString()) {
        return `Today - ${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}`;
      } else if (d.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow - ${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}`;
      }
      return d.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDurationMinutes = (start, end) => {
    try {
      const diffMs = new Date(end) - new Date(start);
      const mins = Math.round(diffMs / (1000 * 60));
      return mins > 0 ? `${mins} min` : null;
    } catch {
      return null;
    }
  };

  // Statistics
  const totalSlotsCount = slots.length;
  const availableSlotsCount = slots.filter(
    (s) => s.status === "available",
  ).length;
  const bookedSlotsCount = slots.filter((s) => s.status === "booked").length;

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return slots.filter((slot) => {
      // Status filter
      if (statusFilter !== "all" && slot.status !== statusFilter) {
        return false;
      }

      // Date filter
      const slotDate = new Date(slot.start_time);
      slotDate.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        return slotDate.getTime() === today.getTime();
      }
      if (dateFilter === "upcoming") {
        return slotDate.getTime() >= today.getTime();
      }
      if (dateFilter !== "all") {
        const selected = new Date(dateFilter);
        selected.setHours(0, 0, 0, 0);
        return slotDate.getTime() === selected.getTime();
      }

      return true;
    });
  }, [slots, statusFilter, dateFilter]);

  // Group filtered slots by date
  const groupedSlots = useMemo(() => {
    const groups = {};
    filteredSlots.forEach((slot) => {
      const dateKey = new Date(slot.start_time).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          rawDate: slot.start_time,
          slots: [],
        };
      }
      groups[dateKey].slots.push(slot);
    });

    // Sort each group's slots chronologically
    Object.keys(groups).forEach((key) => {
      groups[key].slots.sort(
        (a, b) => new Date(a.start_time) - new Date(b.start_time),
      );
    });

    return groups;
  }, [filteredSlots]);

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Top Notification Alert */}
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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-800">
                Doctor Availability
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure and manage your consultation hours and appointment slots
              for patients.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAvailability(true)}
              disabled={refreshing || loading}
              title="Refresh slots"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>

            <button
              onClick={() => {
                setFormError("");
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all hover:shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Available Slot
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Slots
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {totalSlotsCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Available Slots
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {availableSlotsCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Check className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Booked Slots
              </p>
              <h3 className="text-2xl font-bold text-blue-700 mt-1">
                {bookedSlotsCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            {[
              { id: "all", label: "All Slots" },
              { id: "available", label: "Available" },
              { id: "booked", label: "Booked" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Filter & Date Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-400 mr-1">
              <Filter className="w-4 h-4" />
              <span className="text-xs font-medium">Date:</span>
            </div>

            <button
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                dateFilter === "all"
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Dates
            </button>

            <button
              onClick={() => setDateFilter("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                dateFilter === "today"
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Today
            </button>

            <button
              onClick={() => setDateFilter("upcoming")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                dateFilter === "upcoming"
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Upcoming
            </button>

            {/* Custom Date Input */}
            <input
              type="date"
              value={
                !["all", "today", "upcoming"].includes(dateFilter)
                  ? dateFilter
                  : ""
              }
              onChange={(e) => setDateFilter(e.target.value || "all")}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          /* Loading Skeleton */
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-4"
              >
                <div className="h-5 w-48 bg-slate-200 rounded"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-20 bg-slate-100 rounded-xl"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedSlots).length === 0 ? (
          /* Empty State */
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No Availability Slots Found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {totalSlotsCount === 0
                ? "You haven't set up any consultation hours yet. Add slots so patients can book appointments with you."
                : "No slots match your selected filters. Try changing or clearing the filters above."}
            </p>
            {totalSlotsCount === 0 ? (
              <button
                onClick={() => {
                  setFormError("");
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-200 transition"
              >
                <Plus className="w-4 h-4" />
                Add Your First Slot
              </button>
            ) : (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Slots Grouped by Date */
          <div className="space-y-6">
            {Object.keys(groupedSlots).map((dateKey) => {
              const group = groupedSlots[dateKey];
              return (
                <div
                  key={dateKey}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <CalendarIcon className="w-4 h-4" />
                      </span>
                      <h2 className="text-sm font-bold text-slate-800">
                        {formatDateTitle(group.rawDate)}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                      {group.slots.length}{" "}
                      {group.slots.length === 1 ? "Slot" : "Slots"}
                    </span>
                  </div>

                  {/* Slot Cards Grid */}
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.slots.map((slot) => {
                      const isAvailable = slot.status === "available";
                      const duration = getDurationMinutes(
                        slot.start_time,
                        slot.end_time,
                      );

                      return (
                        <div
                          key={slot.id}
                          className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                            isAvailable
                              ? "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
                              : "bg-blue-50/40 border-blue-200"
                          }`}
                        >
                          <div>
                            {/* Card Top: Status & Duration */}
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                                  isAvailable
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                    : "bg-blue-100 text-blue-700 border border-blue-200"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isAvailable
                                      ? "bg-emerald-500"
                                      : "bg-blue-500"
                                  }`}
                                />
                                {isAvailable ? "Available" : "Booked"}
                              </span>

                              {duration && (
                                <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                                  {duration}
                                </span>
                              )}
                            </div>

                            {/* Card Body: Time Range */}
                            <div className="flex items-center gap-2 text-slate-800 my-2">
                              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="font-semibold text-sm">
                                {formatTime(slot.start_time)} -{" "}
                                {formatTime(slot.end_time)}
                              </span>
                            </div>
                          </div>

                          {/* Card Footer: Actions */}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              Slot ID: #{slot.id}
                            </span>

                            {isAvailable ? (
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                disabled={deletingId === slot.id}
                                className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 disabled:opacity-50"
                              >
                                {deletingId === slot.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                Remove
                              </button>
                            ) : (
                              <span className="text-xs text-blue-600 font-medium">
                                Reserved
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-800">Add Available Slot</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Date Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Slot Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={todayStr}
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Start & End Time Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quick Duration Preset Buttons */}
              <div>
                <p className="text-xs text-slate-400 mb-1.5">
                  Quick Duration Presets:
                </p>
                <div className="flex items-center gap-2">
                  {[
                    { label: "+30 min", mins: 30 },
                    { label: "+45 min", mins: 45 },
                    { label: "+60 min", mins: 60 },
                    { label: "+90 min", mins: 90 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setQuickDuration(preset.mins)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Slot
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

export default Availability;
