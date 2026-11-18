import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ApiServece from "../../API/ApiServece";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Stethoscope,
  ChevronRight,
  Filter,
  DollarSign,
  CalendarDays,
  Sparkles,
  Phone,
  Mail,
  User,
  Plus,
  ShieldCheck,
  FileText,
  BadgeCheck,
  RotateCw,
  Zap,
} from "lucide-react";

const Appoinment = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Filters
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'confirmed' | 'rescheduled' | 'completed'
  const [searchTerm, setSearchTerm] = useState("");

  // Reschedule Modal State
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedNewSlotId, setSelectedNewSlotId] = useState(null);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Fetch user appointments
  const fetchAppointments = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await ApiServece.getMyAppointments();
      const list = response?.data || response?.appointments || [];
      setAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      showAlert(
        "error",
        err.response?.data?.msg ||
          "Failed to load appointment history. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

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

  const formatFullDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDuration = (start, end) => {
    try {
      const mins = Math.round((new Date(end) - new Date(start)) / (1000 * 60));
      return mins > 0 ? `${mins} mins` : null;
    } catch {
      return null;
    }
  };

  // Check if a time slot is within the next 24 hours
  const isWithinNext24Hours = (slotDateStr) => {
    try {
      const slotTime = new Date(slotDateStr).getTime();
      const now = Date.now();
      const twentyFourHoursLater = now + 24 * 60 * 60 * 1000;
      return slotTime >= now && slotTime <= twentyFourHoursLater;
    } catch {
      return false;
    }
  };

  // Open Reschedule Modal and fetch doctor's open slots
  const handleOpenReschedule = async (appt) => {
    setReschedulingAppt(appt);
    setSelectedNewSlotId(null);
    setRescheduleError("");
    setLoadingSlots(true);

    try {
      const docId = appt.doctor?.id || appt.doctor_id;
      const res = await ApiServece.getDoctorAvailableSlots(docId);
      const slots = res?.data || [];
      // Exclude current slot
      const filtered = slots.filter((s) => s.id !== appt.slot_id);
      setDoctorSlots(filtered);
    } catch (err) {
      console.error("Error loading doctor slots:", err);
      setRescheduleError(
        "Failed to load doctor's available time slots. Please try again.",
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  // Submit Reschedule
  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!reschedulingAppt || !selectedNewSlotId) {
      setRescheduleError("Please select a new time slot.");
      return;
    }

    try {
      setSubmittingReschedule(true);
      setRescheduleError("");

      const res = await ApiServece.rescheduleAppointment(
        reschedulingAppt.id,
        selectedNewSlotId,
      );

      const updated = res?.data;

      // Update appointments list with the updated appointment
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === reschedulingAppt.id
            ? updated || { ...a, status: "rescheduled" }
            : a,
        ),
      );

      showAlert(
        "success",
        "Appointment successfully rescheduled within the 24-hour timeline!",
      );
      setReschedulingAppt(null);
    } catch (err) {
      console.error("Error rescheduling:", err);
      setRescheduleError(
        err.response?.data?.msg ||
          "Unable to reschedule appointment. The selected slot may no longer be available.",
      );
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // Metrics
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const rescheduledCount = appointments.filter(
    (a) => a.status === "rescheduled",
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === "completed",
  ).length;

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Status filter
      if (statusFilter !== "all" && appt.status !== statusFilter) {
        return false;
      }

      // Search match
      const docName = appt.doctor?.user?.name || "";
      const spec = appt.doctor?.specialization || "";
      const reason = appt.reason || "";
      const query = searchTerm.toLowerCase().trim();

      if (
        query &&
        !docName.toLowerCase().includes(query) &&
        !spec.toLowerCase().includes(query) &&
        !reason.toLowerCase().includes(query) &&
        !String(appt.id).includes(query)
      ) {
        return false;
      }

      return true;
    });
  }, [appointments, statusFilter, searchTerm]);

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Top Dismissible Alert */}
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

        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <CalendarDays className="w-6 h-6" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                My Appointments History
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Track upcoming consultations, doctor details, and reschedule
              appointments with the 24-hour timeline schedule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAppointments(true)}
              disabled={refreshing || loading}
              title="Refresh"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>

            <button
              onClick={() => navigate("/userdashboard/doctors")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-xs hover:bg-blue-700 shadow-md shadow-blue-200 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Book New Appointment
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalCount}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Confirmed
            </p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {confirmedCount}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Rescheduled
            </p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">
              {rescheduledCount}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Completed
            </p>
            <h3 className="text-2xl font-bold text-blue-700 mt-1">
              {completedCount}
            </h3>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            {[
              { id: "all", label: "All" },
              { id: "confirmed", label: "Confirmed" },
              { id: "rescheduled", label: "Rescheduled" },
              { id: "completed", label: "Completed" },
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

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by doctor, reason, #ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Appointment Cards List */}
        {loading ? (
          /* Loading Skeletons */
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex justify-between">
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-5 bg-slate-200 rounded w-20"></div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No Appointments Found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {appointments.length === 0
                ? "You haven't booked any doctor appointments yet. Find certified specialists and book your visit easily."
                : "No appointments match your search or status filter. Try clearing your filters."}
            </p>
            {appointments.length === 0 ? (
              <button
                onClick={() => navigate("/userdashboard/doctors")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-200 transition"
              >
                <Plus className="w-4 h-4" />
                Find a Doctor & Book Now
              </button>
            ) : (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Appointments List */
          <div className="space-y-4">
            {filteredAppointments.map((appt) => {
              const docName = appt.doctor?.user?.name || "Specialist";
              const spec = appt.doctor?.specialization || "Physician";
              const clinic =
                appt.doctor?.clinicAddress || "Clinic Consultation";
              const isConfirmed = appt.status === "confirmed";
              const isRescheduled = appt.status === "rescheduled";
              const isCompleted = appt.status === "completed";
              const canReschedule = isConfirmed || isRescheduled;

              const startTime = appt.slot?.start_time;
              const endTime = appt.slot?.end_time;
              const duration =
                startTime && endTime ? getDuration(startTime, endTime) : null;

              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left: Doctor & Appointment Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-200 flex-shrink-0">
                      {docName.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-base">
                          Dr. {docName}
                        </h3>
                        <BadgeCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                          {spec}
                        </span>
                      </div>

                      {/* Date & Time Highlight */}
                      <div className="flex items-center gap-3 text-xs text-slate-700 font-medium pt-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {startTime
                            ? formatFullDate(startTime)
                            : "Date to be confirmed"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {startTime && endTime
                            ? `${formatTime(startTime)} - ${formatTime(endTime)}`
                            : "Scheduled"}
                        </span>
                        {duration && (
                          <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {duration}
                          </span>
                        )}
                      </div>

                      {/* Clinic Address & Reason */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500 pt-1">
                        {clinic && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            {clinic}
                          </span>
                        )}
                        {appt.reason && (
                          <>
                            <span className="hidden sm:inline text-slate-300">
                              •
                            </span>
                            <span className="flex items-center gap-1 text-slate-600 italic">
                              <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              "{appt.reason}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status, Fee & Reschedule Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          isConfirmed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isRescheduled
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isCompleted
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isConfirmed
                              ? "bg-emerald-500"
                              : isRescheduled
                                ? "bg-amber-500"
                                : isCompleted
                                  ? "bg-blue-500"
                                  : "bg-slate-400"
                          }`}
                        />
                        {isConfirmed
                          ? "Confirmed"
                          : isRescheduled
                            ? "Rescheduled"
                            : isCompleted
                              ? "Completed"
                              : appt.status}
                      </span>

                      <span className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        ₹{appt.consultation_fee || 500}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        ID: #{appt.id}
                      </span>

                      {canReschedule && (
                        <button
                          onClick={() => handleOpenReschedule(appt)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition flex items-center gap-1.5"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Reschedule Visit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal (With 24-Hour Timeline Notice) */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <RotateCw className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Reschedule Appointment
                  </h3>
                  <p className="text-xs text-slate-400">
                    24-hour timeline schedule selection
                  </p>
                </div>
              </div>

              {!submittingReschedule && (
                <button
                  onClick={() => setReschedulingAppt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleConfirmReschedule}
              className="p-6 space-y-4 overflow-y-auto"
            >
              {rescheduleError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{rescheduleError}</span>
                </div>
              )}

              {/* Current Appointment Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <span className="text-slate-400 font-medium block">
                  Current Booking:
                </span>
                <p className="font-bold text-slate-800 text-sm">
                  Dr. {reschedulingAppt.doctor?.user?.name || "Specialist"}
                </p>
                <div className="flex items-center gap-2 text-slate-600 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {formatFullDate(reschedulingAppt.slot?.start_time)}
                  </span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {formatTime(reschedulingAppt.slot?.start_time)} -{" "}
                    {formatTime(reschedulingAppt.slot?.end_time)}
                  </span>
                </div>
              </div>

              {/* 24-Hour Timeline Notice Banner */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">
                    24-Hour Timeline Notice:
                  </span>
                  <span className="text-amber-700 leading-relaxed block mt-0.5">
                    You can select an upcoming slot within the next 24 hours or
                    upcoming dates. Your previous slot will be automatically
                    freed for other patients upon confirmation.
                  </span>
                </div>
              </div>

              {/* Doctor's Available Slots Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Choose New Time Slot:
                </label>

                {loadingSlots ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                    <p>Loading available slots from doctor...</p>
                  </div>
                ) : doctorSlots.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">
                      No other available slots
                    </p>
                    <p className="mt-1">
                      Dr. {reschedulingAppt.doctor?.user?.name || "Specialist"}{" "}
                      does not currently have any other open slots.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {doctorSlots.map((slot) => {
                      const isNext24 = isWithinNext24Hours(slot.start_time);
                      const isSelected = selectedNewSlotId === slot.id;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedNewSlotId(slot.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                            isSelected
                              ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="rescheduleSlot"
                              checked={isSelected}
                              onChange={() => setSelectedNewSlotId(slot.id)}
                              className="text-blue-600 focus:ring-blue-500"
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">
                                  {formatFullDate(slot.start_time)}
                                </span>
                                {isNext24 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    <Zap className="w-3 h-3 text-amber-600" />
                                    Next 24h
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 font-medium mt-0.5 block">
                                {formatTime(slot.start_time)} -{" "}
                                {formatTime(slot.end_time)}
                              </span>
                            </div>
                          </div>

                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                            Available
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={submittingReschedule}
                  onClick={() => setReschedulingAppt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingReschedule || !selectedNewSlotId}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-200 transition disabled:opacity-50"
                >
                  {submittingReschedule ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Rescheduling...</span>
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Confirm Reschedule</span>
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

export default Appoinment;
