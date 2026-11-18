import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import {
  Users,
  Stethoscope,
  CalendarCheck,
  Wallet,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  Clock3,
  Settings,
  UserPlus,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalDoctors: 0,
    activeDoctors: 0,
    approvedDoctors: 0,
    pendingDoctors: 0,
    rejectedDoctors: 0,
    totalAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    rescheduledAppointments: 0,
    cancelledAppointments: 0,
    totalRevenue: 0,
    grossBookingVolume: 0,
    doctorNetPayouts: 0,
    activePlatformFee: 50,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [pendingDoctorsList, setPendingDoctorsList] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await ApiServece.getAdminDashboardStats();
      if (response && response.data) {
        if (response.data.metrics) {
          setMetrics(response.data.metrics);
        }
        if (Array.isArray(response.data.recentAppointments)) {
          setRecentAppointments(response.data.recentAppointments);
        }
        if (Array.isArray(response.data.pendingDoctorsList)) {
          setPendingDoctorsList(response.data.pendingDoctorsList);
        }
        if (Array.isArray(response.data.recentUsers)) {
          setRecentUsers(response.data.recentUsers);
        }
        return;
      }
    } catch (primaryErr) {
      console.warn(
        "Primary dashboard stats failed, attempting fallback to multi-endpoint sync:",
        primaryErr,
      );

      try {
        const [usersRes, doctorsRes, commissionRes] = await Promise.allSettled([
          ApiServece.getAdminUsers(),
          ApiServece.getAdminDoctors(),
          ApiServece.getAdminCommission(),
        ]);

        const userList =
          usersRes.status === "fulfilled"
            ? usersRes.value?.data || usersRes.value?.users || []
            : [];
        const doctorList =
          doctorsRes.status === "fulfilled"
            ? doctorsRes.value?.data || doctorsRes.value?.doctors || []
            : [];
        const commissionData =
          commissionRes.status === "fulfilled"
            ? commissionRes.value?.data || {}
            : {};

        const patientUsers = userList.filter((u) => u.role === "user");
        const totalUsers = patientUsers.length;
        const activeUsers = patientUsers.filter((u) => u.is_active).length;

        const totalDoctors = doctorList.length;
        const activeDoctors = doctorList.filter((d) => d.is_active).length;
        let approvedDoctors = 0;
        let pendingDoctors = 0;
        let rejectedDoctors = 0;
        const pendingList = [];

        doctorList.forEach((doc) => {
          const status = doc.doctorProfile?.approvalStatus?.toLowerCase();
          if (status === "approved") {
            approvedDoctors++;
          } else if (status === "rejected") {
            rejectedDoctors++;
          } else {
            pendingDoctors++;
            pendingList.push({
              id: doc.id,
              name: doc.name,
              email: doc.email,
              specialization: doc.doctorProfile?.specialization || "General",
              approvalStatus: doc.doctorProfile?.approvalStatus || "pending",
            });
          }
        });

        const commissionStats = commissionData.stats || {};
        const activeFee = Number(commissionData.admin_fee) || 50;
        const totalAppointments = commissionStats.totalBookings || 0;
        const totalRevenue = commissionStats.estimatedTotalCommission || 0;
        const grossBookingVolume = commissionStats.totalConsultationValue || 0;
        const doctorNetPayouts = commissionStats.doctorNetPayouts || 0;
        const recentApts = commissionData.recentAppointments || [];

        setMetrics({
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          totalDoctors,
          activeDoctors,
          approvedDoctors,
          pendingDoctors,
          rejectedDoctors,
          totalAppointments,
          confirmedAppointments: commissionStats.confirmedOrCompletedCount || 0,
          completedAppointments: 0,
          rescheduledAppointments: 0,
          cancelledAppointments: 0,
          totalRevenue,
          grossBookingVolume,
          doctorNetPayouts,
          activePlatformFee: activeFee,
        });

        setRecentAppointments(recentApts);
        setPendingDoctorsList(pendingList);
        setRecentUsers(patientUsers.slice(0, 5));
      } catch (fallbackErr) {
        console.error("Dashboard fallback error:", fallbackErr);
        setError(
          "Failed to load dashboard metrics. Please check admin permissions.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "" };
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

  const adminName = user?.name || "Administrator";

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8 space-y-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Platform Administration Command</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {adminName}!
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time platform overview of registered patients, licensed
              doctors, verification queues, consultation bookings, and
              commission revenue.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 flex-wrap">
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
              to="/admindashboard/approvels"
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>Doctor Approvals</span>
              {metrics.pendingDoctors > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-extrabold">
                  {metrics.pendingDoctors}
                </span>
              )}
            </Link>

            <Link
              to="/admindashboard/manageusers"
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Manage Users</span>
            </Link>
          </div>
        </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
          <Link
            to="/admindashboard/manageusers"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all hover:border-emerald-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Total Users
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-emerald-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    metrics.totalUsers
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {metrics.activeUsers} Active • {metrics.inactiveUsers} Inactive
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <Link
            to="/admindashboard/managedoctors"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all hover:border-blue-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Total Doctors
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-blue-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    metrics.totalDoctors
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs group-hover:scale-105 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {metrics.approvedDoctors} Approved
              </span>
              <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <Link
            to="/admindashboard/approvels"
            className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between ${
              metrics.pendingDoctors > 0
                ? "border-amber-300/80 hover:border-amber-400 bg-amber-50/20"
                : "border-slate-200/90 hover:border-amber-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Pending Doctors
                  </p>
                  {metrics.pendingDoctors > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-amber-600 transition flex items-center gap-2">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    metrics.pendingDoctors
                  )}
                  {metrics.pendingDoctors > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Action Needed
                    </span>
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs group-hover:scale-105 transition-transform">
                <Clock3 className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {metrics.pendingDoctors > 0
                  ? "Requires verification"
                  : "All applications cleared"}
              </span>
              <span className="text-amber-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Approvals</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <Link
            to="/admindashboard/manageusers"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all hover:border-indigo-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Total Appointments
                </p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-indigo-600 transition">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    metrics.totalAppointments
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {metrics.confirmedAppointments} Confirmed
              </span>
              <span className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <Link
            to="/admindashboard/commision"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all hover:border-teal-300 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                  Total Revenue
                </p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-teal-600 transition">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-slate-200 animate-pulse rounded-md" />
                  ) : (
                    formatCurrency(metrics.totalRevenue)
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs group-hover:scale-105 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Fee: ₹{metrics.activePlatformFee}/booking
              </span>
              <span className="text-teal-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Commission</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {metrics.pendingDoctors > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {metrics.pendingDoctors} Doctor Application
                  {metrics.pendingDoctors > 1 ? "s" : ""} Awaiting Verification
                </h3>
                <p className="text-xs md:text-sm text-slate-600 mt-0.5">
                  Doctors cannot accept patient bookings until their medical
                  certificates are reviewed and approved.
                </p>
              </div>
            </div>

            <Link
              to="/admindashboard/approvels"
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 self-start md:self-auto"
            >
              <span>Review Now</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Platform Financial Overview
                    </h3>
                    <p className="text-xs text-slate-400">
                      Breakdown of Gross Consultation Volume, Platform Fees, and
                      Doctor Payouts
                    </p>
                  </div>
                </div>

                <Link
                  to="/admindashboard/commision"
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
                >
                  <span>Commission Settings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Gross Booking Volume
                  </p>
                  <p className="text-xl font-extrabold text-slate-800">
                    {formatCurrency(metrics.grossBookingVolume)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Total patient payments
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-1">
                  <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                    Platform Commission
                  </p>
                  <p className="text-xl font-extrabold text-teal-800">
                    {formatCurrency(metrics.totalRevenue)}
                  </p>
                  <p className="text-[10px] text-teal-600">
                    Retained platform earnings
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Doctor Net Payouts
                  </p>
                  <p className="text-xl font-extrabold text-blue-800">
                    {formatCurrency(metrics.doctorNetPayouts)}
                  </p>
                  <p className="text-[10px] text-blue-600">
                    Disbursed to specialists
                  </p>
                </div>
              </div>

              {metrics.grossBookingVolume > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>
                      Platform Share (
                      {Math.round(
                        (metrics.totalRevenue / metrics.grossBookingVolume) *
                          100,
                      ) || 0}
                      %)
                    </span>
                    <span>
                      Doctor Share (
                      {Math.round(
                        (metrics.doctorNetPayouts /
                          metrics.grossBookingVolume) *
                          100,
                      ) || 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-blue-500 overflow-hidden flex">
                    <div
                      className="bg-teal-500 h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (metrics.totalRevenue /
                              metrics.grossBookingVolume) *
                              100,
                          ) || 10,
                        )}%`,
                      }}
                      title="Platform Share"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <CalendarDays className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Recent Appointments
                    </h3>
                    <p className="text-xs text-slate-400">
                      Live audit of patient bookings across all doctor practices
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  {recentAppointments.length} Bookings Shown
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Loading appointments queue...
                  </p>
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    No appointments recorded yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Patient bookings will appear here as consultations are
                    scheduled.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 pl-2">Patient</th>
                        <th className="pb-3">Doctor</th>
                        <th className="pb-3">Fee / Comm.</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 pr-2 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentAppointments.slice(0, 6).map((apt) => {
                        const dt = formatDateTime(apt.created_at);
                        const statusColors = {
                          confirmed: "bg-blue-50 text-blue-700 border-blue-200",
                          completed:
                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                          rescheduled:
                            "bg-purple-50 text-purple-700 border-purple-200",
                          cancelled: "bg-rose-50 text-rose-700 border-rose-200",
                        };

                        return (
                          <tr
                            key={apt.id}
                            className="hover:bg-slate-50/70 transition"
                          >
                            <td className="py-3.5 pl-2 font-medium text-slate-800">
                              {apt.patient?.name || "Patient"}
                            </td>
                            <td className="py-3.5 text-slate-600">
                              {apt.doctor?.user?.name || "Doctor"}
                            </td>
                            <td className="py-3.5">
                              <span className="font-semibold text-slate-800">
                                ₹{apt.consultation_fee || 0}
                              </span>
                              <span className="text-slate-400 text-[11px] ml-1">
                                (₹{apt.admin_fee || metrics.activePlatformFee})
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                  statusColors[apt.status] ||
                                  "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {apt.status}
                              </span>
                            </td>
                            <td className="py-3.5 pr-2 text-right text-slate-500 whitespace-nowrap">
                              {dt.date}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Administrative Shortcuts */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Admin Shortcuts
                </h3>
              </div>

              <div className="space-y-2.5">
                <Link
                  to="/admindashboard/manageusers"
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition">
                        Manage Users
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Patients list & account statuses
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/admindashboard/managedoctors"
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                        Manage Doctors
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Doctor directory & verifications
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/admindashboard/approvels"
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <BadgeCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition">
                        Doctor Approvals
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Review certificates & approve
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/admindashboard/commision"
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-teal-600 transition">
                        Commission Fee
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Update per-booking platform fee
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/admindashboard/newadmin"
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition">
                        Admin Team
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Add & manage administrator access
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/admindashboard/settings"
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition">
                        Website Settings
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Upload application logo & branding
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50/60 rounded-3xl border border-indigo-100 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Admin Compliance Note
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Regularly verify doctor credentials in the{" "}
                <strong>Doctor Approvals</strong> queue to ensure compliance
                with medical board certifications. The platform commission rate
                set under <strong>Commission</strong> automatically snapshots to
                every new patient booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
