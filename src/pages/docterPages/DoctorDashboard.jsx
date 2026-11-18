import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Stethoscope,
  ChevronRight,
  RefreshCw,
  Plus,
  ArrowUpRight,
  User,
  Phone,
  Mail,
  FileText,
  Sparkles,
  HeartPulse,
  Activity,
  CalendarCheck,
  Clock3,
} from "lucide-react";

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all appointments/patients for this doctor
  const fetchDoctorData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await ApiServece.getDoctorPatients();
      const list = response?.data || response?.appointments || [];
      setAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Doctor dashboard fetch error:", err);
      setError(
        err.response?.data?.msg ||
          "Failed to load doctor appointments. Please check your connection or active profile.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  // Helper to check if a date string is today
  const isSameDayAsToday = (dateStr) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const today = new Date();
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    } catch {
      return false;
    }
  };

  // Compute Statistics for the 4 Requested Feature Cards
  const stats = useMemo(() => {
    const totalAppointments = appointments.length;

    // Today's Appointments
    const todaysAppointments = appointments.filter((apt) => {
      const timeToCheck =
        apt.slot?.start_time || apt.appointment_date || apt.created_at;
      return isSameDayAsToday(timeToCheck);
    }).length;

    // Completed Appointments
    const completedAppointments = appointments.filter(
      (apt) => apt.status === "completed",
    ).length;

    // Pending Appointments (awaiting consultation / pending action)
    const pendingAppointments = appointments.filter(
      (apt) =>
        apt.status === "pending" ||
        apt.status === "confirmed" ||
        apt.status === "rescheduled",
    ).length;

    return {
      total: totalAppointments,
      today: todaysAppointments,
      completed: completedAppointments,
      pending: pendingAppointments,
    };
  }, [appointments]);

  // List of Today's Consultations
  const todaysList = useMemo(() => {
    return appointments.filter((apt) => {
      const timeToCheck =
        apt.slot?.start_time || apt.appointment_date || apt.created_at;
      return isSameDayAsToday(timeToCheck);
    });
  }, [appointments]);

  // Next Upcoming Consultation (Earliest scheduled)
  const nextAppointment = useMemo(() => {
    const activeList = appointments.filter(
      (apt) =>
        apt.status === "confirmed" ||
        apt.status === "rescheduled" ||
        apt.status === "pending",
    );

    if (activeList.length === 0) return null;

    const sorted = [...activeList].sort((a, b) => {
      const timeA = a.slot?.start_time
        ? new Date(a.slot.start_time).getTime()
        : new Date(a.created_at).getTime();
      const timeB = b.slot?.start_time
        ? new Date(b.slot.start_time).getTime()
        : new Date(b.created_at).getTime();
      return timeA - timeB;
    });

    return sorted[0];
  }, [appointments]);

  // Format Date & Time helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  // Doctor display name
  const doctorName = user?.name
    ? user.name.toLowerCase().startsWith("dr")
      ? user.name
      : `Dr. ${user.name}`
    : "Doctor";

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8 space-y-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/20">
              <Stethoscope className="w-3.5 h-3.5 text-blue-200" />
              <span>Doctor Practice Overview</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {doctorName}!
            </h1>
            <p className="text-xs md:text-sm text-blue-100 max-w-xl leading-relaxed">
              Monitor your daily patient consultations, manage appointment
              statuses, and write prescriptions for your patients.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={() => fetchDoctorData(true)}
              disabled={refreshing || loading}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>

            <Link
              to="/doctordashboard/availability"
              className="px-5 py-3 rounded-2xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <Clock className="w-4 h-4" />
              <span>Set Availability</span>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => fetchDoctorData()}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* CARD 1: Total Appointments */}
          <Link
            to="/doctordashboard/mypatientas"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Appointments
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-blue-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    stats.total
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs group-hover:scale-105 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">All patient bookings</span>
              <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 2: Today's Appointments */}
          <Link
            to="/doctordashboard/mypatientas"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-indigo-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Today's Appointments
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-indigo-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    stats.today
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {stats.today > 0 ? "Scheduled for today" : "No bookings today"}
              </span>
              <span className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Today's list</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 3: Completed Appointments */}
          <Link
            to="/doctordashboard/mypatientas"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-emerald-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Completed
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-emerald-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    stats.completed
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Consultations finished</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Completed</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 4: Pending Appointments */}
          <Link
            to="/doctordashboard/mypatientas"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-amber-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Pending
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-amber-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    stats.pending
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs group-hover:scale-105 transition-transform">
                <Clock3 className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Awaiting consultation</span>
              <span className="text-amber-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Review</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* ==================================================== */}
        {/* LOWER SECTION: Today's Schedule & Patient Highlights */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Today's Schedule or Next Consultation Spotlight */}
          <div className="lg:col-span-2 space-y-6">
            {/* Spotlight Card: Today's Consultations or Next Upcoming */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {todaysList.length > 0
                        ? `Today's Consultations (${todaysList.length})`
                        : "Next Scheduled Patient"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {todaysList.length > 0
                        ? "Patients scheduled to see you today"
                        : "Upcoming consultation overview"}
                    </p>
                  </div>
                </div>

                <Link
                  to="/doctordashboard/mypatientas"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                >
                  <span>My Patients</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading schedule...</p>
                </div>
              ) : todaysList.length > 0 ? (
                <div className="space-y-3">
                  {todaysList.slice(0, 3).map((apt) => {
                    const dt = formatDateTime(
                      apt.slot?.start_time || apt.appointment_date,
                    );
                    return (
                      <div
                        key={apt.id}
                        className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/30 border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                            {apt.patient?.name
                              ? apt.patient.name.charAt(0).toUpperCase()
                              : "P"}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              {apt.patient?.name || "Patient"}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                {dt.time}
                              </span>
                              <span>•</span>
                              <span>
                                {apt.reason || "General Consultation"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${
                              apt.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                            }`}
                          >
                            {apt.status}
                          </span>

                          <Link
                            to="/doctordashboard/mypatientas"
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-xs flex items-center gap-1"
                          >
                            <span>Consult</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : nextAppointment ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50 border border-blue-100/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {nextAppointment.patient?.name
                          ? nextAppointment.patient.name.charAt(0).toUpperCase()
                          : "P"}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-800">
                          {nextAppointment.patient?.name || "Patient"}
                        </h4>
                        <p className="text-xs font-semibold text-blue-600">
                          Reason: {nextAppointment.reason || "Consultation"}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold capitalize bg-blue-100 text-blue-800 border border-blue-200">
                      {nextAppointment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-100/60 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>
                        Date:{" "}
                        <strong className="text-slate-800">
                          {
                            formatDateTime(
                              nextAppointment.slot?.start_time ||
                                nextAppointment.appointment_date,
                            ).date
                          }
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        Time:{" "}
                        <strong className="text-slate-800">
                          {
                            formatDateTime(
                              nextAppointment.slot?.start_time ||
                                nextAppointment.appointment_date,
                            ).time
                          }
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end border-t border-blue-100/60">
                    <Link
                      to="/doctordashboard/mypatientas"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs active:scale-95"
                    >
                      <span>Open Patient Record</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">
                      No Scheduled Appointments Yet
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ensure your availability slots are published so patients
                      can book consultations with you.
                    </p>
                  </div>
                  <Link
                    to="/doctordashboard/availability"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Availability Slots</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Patients Table Preview */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Recent Patient Consultations
                    </h3>
                    <p className="text-xs text-slate-400">
                      Latest consultation requests and histories
                    </p>
                  </div>
                </div>

                <Link
                  to="/doctordashboard/mypatientas"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                >
                  <span>View All ({appointments.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Loading recent patients...
                </div>
              ) : appointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-3">Patient</th>
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Reason</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appointments.slice(0, 5).map((apt) => {
                        const dt = formatDateTime(
                          apt.slot?.start_time ||
                            apt.appointment_date ||
                            apt.created_at,
                        );
                        return (
                          <tr
                            key={apt.id}
                            className="hover:bg-slate-50/60 transition"
                          >
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {apt.patient?.name || "Patient"}
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              <div>{dt.date}</div>
                              <div className="text-[11px] text-blue-600">
                                {dt.time}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                              {apt.reason || "General Consultation"}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                  apt.status === "completed"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : apt.status === "cancelled"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {apt.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Link
                                to="/doctordashboard/mypatientas"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                Details
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  No patient bookings recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Action Shortcuts & Practice Tips */}
          <div className="space-y-6">
            {/* Quick Actions Shortcuts */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                Doctor Practice Shortcuts
              </h3>

              <div className="space-y-2.5">
                <Link
                  to="/doctordashboard/availability"
                  className="w-full p-3 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/30 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                        Set Availability
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Create & manage consultation slots
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/doctordashboard/mypatientas"
                  className="w-full p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/30 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                        My Patients & Rx
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Write prescriptions & manage bookings
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/doctordashboard/myprofile"
                  className="w-full p-3 rounded-2xl border border-slate-100 hover:border-purple-200 bg-slate-50/50 hover:bg-purple-50/30 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition">
                        Doctor Profile
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Specialization, fees & clinic info
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
                </Link>
              </div>
            </div>

            {/* Clinical Practice Guide */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-3xl border border-blue-100 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Practice Guidelines
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Remember to mark consultations as completed and issue
                prescriptions through the <strong>My Patients</strong> section.
                Completed appointments automatically update your patient's
                records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
