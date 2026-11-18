import React, { useState, useEffect } from "react";
import ApiServece from "../../API/ApiServece";
import {
  Wallet,
  Coins,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Calendar,
  X,
  Lock,
} from "lucide-react";

const Commision = () => {
  const [currentFee, setCurrentFee] = useState(50);
  const [feeInput, setFeeInput] = useState("50");
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedOrCompletedCount: 0,
    totalConsultationValue: 0,
    estimatedTotalCommission: 0,
    doctorNetPayouts: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [adminUser, setAdminUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const presets = [25, 50, 75, 100, 150, 200];

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(
        () => setFeedback({ type: "", message: "" }),
        4000,
      );
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchCommissionData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await ApiServece.getAdminCommission();
      const data = response?.data || {};

      const fee = Number(data.admin_fee) || 0;
      setCurrentFee(fee);
      setFeeInput(String(fee));
      setAdminUser(data.adminUser || null);

      if (data.stats) {
        setStats(data.stats);
      }
      if (Array.isArray(data.recentAppointments)) {
        setRecentAppointments(data.recentAppointments);
      }
    } catch (err) {
      console.error("Error fetching commission data:", err);
      setError(
        err.response?.data?.msg ||
          "Failed to load commission configuration. Please check your admin access.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    const parsedFee = parseInt(feeInput, 10);

    if (isNaN(parsedFee) || parsedFee < 0) {
      setFeedback({
        type: "error",
        message: "Please enter a valid positive commission amount in rupees.",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await ApiServece.updateAdminCommission(parsedFee);
      const newFee =
        response?.data?.admin_fee !== undefined
          ? response.data.admin_fee
          : parsedFee;

      setCurrentFee(newFee);
      setFeeInput(String(newFee));

      fetchCommissionData(true);

      setFeedback({
        type: "success",
        message:
          response?.msg ||
          `Platform commission successfully updated to ₹${newFee} and saved in user table admin_fee column.`,
      });
    } catch (err) {
      console.error("Error saving commission:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.msg ||
          "Failed to save commission fee. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Wallet className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Platform Commission
                  </h1>
                  {adminUser && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Admin: {adminUser.name || "Administrator"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stored directly in User Table{" "}
                  <code className="font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                    admin_fee
                  </code>
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2.5 max-w-2xl leading-relaxed">
              Set the administrative platform fee collected per doctor
              appointment. Updating this value instantly reflects in the
              database and computes revenue sharing across all consultations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCommissionData(true)}
              disabled={refreshing || loading}
              title="Refresh Commission Data"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition font-medium text-xs shadow-xs disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

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

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => fetchCommissionData()}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Active Admin Fee */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Active Commission Fee
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                ₹{currentFee}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Per consultation booking
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Total Admin Revenue
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                ₹{stats.estimatedTotalCommission}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                From {stats.confirmedOrCompletedCount} consultations
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Update Commission Amount
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set the fixed platform fee deducted on doctor appointment
                bookings
              </p>
            </div>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </span>
          </div>

          <form onSubmit={handleSaveCommission} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Commission Fee per Consultation (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  INR / Appointment
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Updates{" "}
                <code className="font-mono text-slate-600 font-semibold">
                  users.admin_fee
                </code>{" "}
                for administrator accounts.
              </p>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-500 mb-2">
                Quick Select Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFeeInput(String(preset))}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      Number(feeInput) === preset
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-blue-900">
                  Future Booking Protection Guarantee
                </p>
                <p className="mt-0.5">
                  Submitting this form updates <strong>users.admin_fee</strong>{" "}
                  and applies exclusively to{" "}
                  <strong>future doctor appointment bookings</strong>. Past
                  consultations permanently maintain their snapshotted
                  commission rate recorded at the time of booking.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Current Database Value:{" "}
                <strong className="text-slate-700">₹{currentFee}</strong>
              </span>

              <button
                type="submit"
                disabled={saving || Number(feeInput) === currentFee}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{saving ? "Saving Fee..." : "Save Commission Fee"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Section: Recent Consultations & Commission Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Recent Consultations & Commission Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit trail of booked consultations with administrative platform
                fees
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing {recentAppointments.length} bookings
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">
                Loading consultation records...
              </p>
            </div>
          ) : recentAppointments.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">
                No consultations found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                When patients book doctor consultations, the commission
                breakdown will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Gross Fee</th>
                    <th className="py-3 px-4 text-blue-600 font-bold">
                      Admin Fee
                    </th>
                    <th className="py-3 px-4 text-emerald-600 font-bold">
                      Doctor Share
                    </th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.map((apt) => {
                    const grossFee = Number(apt.consultation_fee) || 0;
                    const lockedFee =
                      apt.admin_fee !== undefined && apt.admin_fee !== null
                        ? Number(apt.admin_fee)
                        : currentFee;
                    const adminFee = Math.min(grossFee, lockedFee);
                    const docShare = Math.max(0, grossFee - adminFee);

                    const statusColors = {
                      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
                      completed:
                        "bg-emerald-50 text-emerald-700 border-emerald-200",
                      pending: "bg-amber-50 text-amber-700 border-amber-200",
                      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
                      rescheduled:
                        "bg-purple-50 text-purple-700 border-purple-200",
                    };

                    return (
                      <tr
                        key={apt.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          #APT-{apt.id}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">
                            {apt.patient?.name || "Patient"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {apt.patient?.email || "N/A"}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">
                            Dr. {apt.doctor?.user?.name || "Specialist"}
                          </p>
                          <p className="text-[11px] text-blue-600 font-medium">
                            {apt.doctor?.specialization || "General"}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatDate(apt.appointment_date || apt.created_at)}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          ₹{grossFee}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-blue-700 bg-blue-50/30">
                          <div className="flex items-center gap-1.5">
                            <span>₹{adminFee}</span>
                            {apt.admin_fee !== null &&
                              apt.admin_fee !== undefined && (
                                <span
                                  title="Locked at booking time"
                                  className="text-blue-500"
                                >
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/30">
                          ₹{docShare}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                              statusColors[apt.status] ||
                              "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {apt.status}
                          </span>
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
    </div>
  );
};

export default Commision;
