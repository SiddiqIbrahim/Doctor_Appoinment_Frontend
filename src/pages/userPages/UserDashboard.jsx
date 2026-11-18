import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  Stethoscope,
  ChevronRight,
  RefreshCw,
  Plus,
  ArrowUpRight,
  User,
  MapPin,
  Pill,
  Sparkles,
  HeartPulse,
  Activity,
  AlertCircle,
  Bell,
} from "lucide-react";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all user dashboard data
  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [apptRes, prescRes] = await Promise.allSettled([
        ApiServece.getMyAppointments(),
        ApiServece.getUserPrescriptions(),
      ]);

      if (apptRes.status === "fulfilled") {
        const apptList = apptRes.value?.data || [];
        setAppointments(Array.isArray(apptList) ? apptList : []);
      } else {
        console.warn(
          "Error fetching appointments for dashboard:",
          apptRes.reason,
        );
      }

      if (prescRes.status === "fulfilled") {
        const prescList = prescRes.value?.data || [];
        setPrescriptions(Array.isArray(prescList) ? prescList : []);
      } else {
        console.warn(
          "Error fetching prescriptions for dashboard:",
          prescRes.reason,
        );
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard metrics. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Statistics for Cards
  const stats = useMemo(() => {
    const totalAppointments = appointments.length;

    const upcomingAppointments = appointments.filter((apt) => {
      const isConfirmedOrRescheduled =
        apt.status === "confirmed" ||
        apt.status === "rescheduled" ||
        apt.status === "pending";

      // If slot start_time exists, check if in future or today
      if (apt.slot?.start_time) {
        const slotDate = new Date(apt.slot.start_time);
        return (
          isConfirmedOrRescheduled && slotDate >= new Date(Date.now() - 3600000)
        );
      }
      return isConfirmedOrRescheduled;
    }).length;

    const completedAppointments = appointments.filter(
      (apt) => apt.status === "completed",
    ).length;

    const totalPrescriptions = prescriptions.length;

    return {
      total: totalAppointments,
      upcoming: upcomingAppointments,
      completed: completedAppointments,
      prescriptions: totalPrescriptions,
    };
  }, [appointments, prescriptions]);

  // Next Upcoming Appointment (chronologically closest)
  const nextAppointment = useMemo(() => {
    const upcomingList = appointments.filter(
      (apt) =>
        apt.status === "confirmed" ||
        apt.status === "rescheduled" ||
        apt.status === "pending",
    );

    if (upcomingList.length === 0) return null;

    // Sort by earliest slot start_time
    const sorted = [...upcomingList].sort((a, b) => {
      const timeA = a.slot?.start_time
        ? new Date(a.slot.start_time).getTime()
        : 0;
      const timeB = b.slot?.start_time
        ? new Date(b.slot.start_time).getTime()
        : 0;
      return timeA - timeB;
    });

    return sorted[0];
  }, [appointments]);

  // Format Date & Time Helpers
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

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8 space-y-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Patient Health Overview</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Patient"}!
            </h1>
            <p className="text-xs md:text-sm text-blue-100 max-w-xl leading-relaxed">
              Track all your upcoming consultations, medical prescriptions, and
              doctor appointment histories in one place.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing || loading}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>

            <Link
              to="/userdashboard/doctors"
              className="px-5 py-3 rounded-2xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
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
              onClick={() => fetchDashboardData()}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* CARD 1: Total Appointments */}
          <Link
            to="/userdashboard/appointments"
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
              <span className="text-slate-400">All-time bookings</span>
              <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 2: Upcoming Appointments */}
          <Link
            to="/userdashboard/appointments"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-amber-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Upcoming Appointments
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-amber-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    stats.upcoming
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {stats.upcoming > 0 ? "Scheduled & active" : "None scheduled"}
              </span>
              <span className="text-amber-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Schedule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 3: Completed Appointments */}
          <Link
            to="/userdashboard/appointments"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-emerald-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Completed Appointments
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
              <span className="text-slate-400">Finished consultations</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 4: Prescriptions */}
          <Link
            to="/userdashboard/userPrescription"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-purple-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                  Prescriptions
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-purple-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    stats.prescriptions
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-xs group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Available medical advice</span>
              <span className="text-purple-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>View Rx</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Next Upcoming Appointment Highlight */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Next Scheduled Consultation
                    </h3>
                    <p className="text-xs text-slate-400">
                      Your upcoming appointment with a doctor
                    </p>
                  </div>
                </div>

                <Link
                  to="/userdashboard/appointments"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                >
                  <span>All Appointments</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Loading appointment...
                  </p>
                </div>
              ) : nextAppointment ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50 border border-blue-100/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        Dr
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-800">
                          Dr.{" "}
                          {nextAppointment.doctor?.user?.name ||
                            "Specialist Doctor"}
                        </h4>
                        <p className="text-xs font-semibold text-blue-600">
                          {nextAppointment.doctor?.specialization ||
                            "General Medicine"}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold capitalize bg-blue-100 text-blue-800 border border-blue-200">
                      {nextAppointment.status}
                    </span>
                  </div>

                  {/* Date, Time & Reason Details */}
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

                  {/* Consultation Reason & Action */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-blue-100/60">
                    <p className="text-xs text-slate-500">
                      Reason:{" "}
                      <span className="font-semibold text-slate-700">
                        {nextAppointment.reason || "General Consultation"}
                      </span>
                    </p>

                    <Link
                      to="/userdashboard/appointments"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs active:scale-95"
                    >
                      <span>Manage Booking</span>
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
                      No Upcoming Consultations
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      You do not have any pending appointments scheduled.
                    </p>
                  </div>
                  <Link
                    to="/userdashboard/doctors"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Book Your Consultation</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Prescriptions Preview */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Latest Medical Prescriptions
                    </h3>
                    <p className="text-xs text-slate-400">
                      Medication notes and diagnosis prescribed by your doctors
                    </p>
                  </div>
                </div>

                <Link
                  to="/userdashboard/userPrescription"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
                >
                  <span>View All Prescriptions</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Loading prescriptions...
                </div>
              ) : prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">
                            {item.diagnosis || "Medical Prescription"}
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            Prescribed by Dr.{" "}
                            {item.appointment?.doctor?.user?.name || "Doctor"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Link
                          to="/userdashboard/userPrescription"
                          className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  No medical prescriptions on file yet. Once a doctor issues a
                  prescription, it will appear here.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Action Shortcuts & Health Tips */}
          <div className="space-y-6">
            {/* Quick Actions Shortcuts */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                Quick Action Shortcuts
              </h3>

              <div className="space-y-2.5">
                <Link
                  to="/userdashboard/doctors"
                  className="w-full p-3 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/30 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                        Find Specialists
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Browse verified doctors & slots
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/userdashboard/appointments"
                  className="w-full p-3 rounded-2xl border border-slate-100 hover:border-amber-200 bg-slate-50/50 hover:bg-amber-50/30 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition">
                        My Appointments
                      </p>
                      <p className="text-[11px] text-slate-400">
                        View dates & rescheduling
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/userdashboard/userPrescription"
                  className="w-full p-3 rounded-2xl border border-slate-100 hover:border-purple-200 bg-slate-50/50 hover:bg-purple-50/30 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition">
                        My Prescriptions
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Download & review medicines
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/userdashboard/notification"
                  className="w-full p-3 rounded-2xl border border-slate-100 hover:border-rose-200 bg-slate-50/50 hover:bg-rose-50/30 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition">
                        Notifications
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Consultation reminders & alerts
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
                </Link>
              </div>
            </div>

            {/* Health Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-3xl border border-blue-100 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Health Reminder
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stay hydrated, keep a log of your symptoms before meeting the
                specialist, and check your notification reminders 15 minutes
                before your time slot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
