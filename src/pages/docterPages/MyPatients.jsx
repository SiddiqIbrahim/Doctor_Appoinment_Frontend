import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import ApiServece from "../../API/ApiServece";
import {
  Users,
  Search,
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  FileText,
  BadgeCheck,
  RotateCw,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Filter,
  UserCheck,
  Activity,
  Plus,
  Trash2,
  Pill,
  Stethoscope,
  Printer,
} from "lucide-react";

const MyPatients = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // View Mode: 'bookings' | 'patients'
  const [viewMode, setViewMode] = useState("bookings");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'confirmed' | 'rescheduled' | 'completed'
  const [searchTerm, setSearchTerm] = useState("");

  // Patient Detail Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Prescription Modal State
  const [prescriptionAppt, setPrescriptionAppt] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: "",
    medicines: [
      {
        name: "",
        dosage: "",
        frequency: "Twice a day (After food)",
        duration: "5 Days",
      },
    ],
    instructions: "",
    followUpDate: "",
  });
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");
  const [showRxPreview, setShowRxPreview] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Fetch all appointments/patients for the logged-in doctor
  const fetchDoctorPatients = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await ApiServece.getDoctorPatients();
      const list = response?.data || response?.appointments || [];
      setAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching doctor patients:", err);
      showAlert(
        "error",
        err.response?.data?.msg ||
          "Failed to load patient appointments. Please make sure your doctor profile is active.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorPatients();
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

  // Mark appointment as completed
  const handleMarkCompleted = async (appointmentId) => {
    try {
      setUpdatingId(appointmentId);
      await ApiServece.updateAppointmentStatus(appointmentId, "completed");

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: "completed" } : a,
        ),
      );

      showAlert("success", "Appointment marked as completed.");
    } catch (err) {
      console.error("Error updating appointment status:", err);
      showAlert(
        "error",
        err.response?.data?.msg || "Failed to update appointment status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Prescription Modal
  const handleOpenPrescription = (appt) => {
    setPrescriptionAppt(appt);
    setPrescriptionError("");
    setShowRxPreview(false);

    if (appt.prescription) {
      const rx = appt.prescription;
      setPrescriptionForm({
        diagnosis: rx.diagnosis || "",
        medicines:
          Array.isArray(rx.medicines) && rx.medicines.length > 0
            ? rx.medicines
            : [
                {
                  name: "",
                  dosage: "",
                  frequency: "Twice a day",
                  duration: "5 Days",
                },
              ],
        instructions: rx.instructions || "",
        followUpDate: rx.follow_up_date || "",
      });
    } else {
      setPrescriptionForm({
        diagnosis: appt.reason ? `Consultation for ${appt.reason}` : "",
        medicines: [
          {
            name: "",
            dosage: "1 Tablet",
            frequency: "Twice a day (After food)",
            duration: "5 Days",
          },
        ],
        instructions:
          "Take medicines as directed. Get adequate rest and drink plenty of water.",
        followUpDate: "",
      });
    }
  };

  // Medicine items handlers
  const handleAddMedicineRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          name: "",
          dosage: "1 Tablet",
          frequency: "Twice a day",
          duration: "5 Days",
        },
      ],
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setPrescriptionForm((prev) => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  // Submit Prescription Form
  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!prescriptionAppt) return;

    if (!prescriptionForm.diagnosis.trim()) {
      setPrescriptionError("Please provide a clinical diagnosis.");
      return;
    }

    const validMedicines = prescriptionForm.medicines.filter(
      (m) => m.name && m.name.trim(),
    );
    if (validMedicines.length === 0) {
      setPrescriptionError(
        "Please add at least one medicine with a valid name.",
      );
      return;
    }

    try {
      setPrescriptionLoading(true);
      setPrescriptionError("");

      const payload = {
        appointmentId: prescriptionAppt.id,
        diagnosis: prescriptionForm.diagnosis.trim(),
        medicines: validMedicines,
        instructions: prescriptionForm.instructions.trim(),
        followUpDate: prescriptionForm.followUpDate || null,
      };

      const res = await ApiServece.createOrUpdatePrescription(payload);
      const savedRx = res?.data;

      // Update local appointments state with the saved prescription and completed status
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === prescriptionAppt.id
            ? { ...a, status: "completed", prescription: savedRx || payload }
            : a,
        ),
      );

      showAlert(
        "success",
        "Prescription saved successfully! Consultation marked completed.",
      );
      setPrescriptionAppt(null);
    } catch (err) {
      console.error("Error saving prescription:", err);
      setPrescriptionError(
        err.response?.data?.msg ||
          "Failed to save prescription. Please try again.",
      );
    } finally {
      setPrescriptionLoading(false);
    }
  };

  // Group unique patients
  const uniquePatients = useMemo(() => {
    const map = new Map();

    appointments.forEach((appt) => {
      const patient = appt.patient;
      if (!patient) return;

      const patientId = patient.id;
      if (!map.has(patientId)) {
        map.set(patientId, {
          patientInfo: patient,
          appointments: [],
          totalVisits: 0,
          latestAppointment: appt,
        });
      }

      const record = map.get(patientId);
      record.appointments.push(appt);
      record.totalVisits += 1;

      // Keep latest
      if (
        new Date(appt.created_at || appt.slot?.start_time) >
        new Date(
          record.latestAppointment.created_at ||
            record.latestAppointment.slot?.start_time,
        )
      ) {
        record.latestAppointment = appt;
      }
    });

    return Array.from(map.values());
  }, [appointments]);

  // Metrics
  const totalBookings = appointments.length;
  const uniquePatientCount = uniquePatients.length;
  const upcomingCount = appointments.filter(
    (a) => a.status === "confirmed" || a.status === "rescheduled",
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === "completed",
  ).length;

  // Filtered Appointments (for Bookings Feed)
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (statusFilter !== "all" && appt.status !== statusFilter) {
        return false;
      }

      const patientName = appt.patient?.name || "";
      const patientEmail = appt.patient?.email || "";
      const patientPhone = appt.patient?.phone || "";
      const reason = appt.reason || "";
      const query = searchTerm.toLowerCase().trim();

      if (
        query &&
        !patientName.toLowerCase().includes(query) &&
        !patientEmail.toLowerCase().includes(query) &&
        !patientPhone.toLowerCase().includes(query) &&
        !reason.toLowerCase().includes(query) &&
        !String(appt.id).includes(query)
      ) {
        return false;
      }

      return true;
    });
  }, [appointments, statusFilter, searchTerm]);

  // Filtered Unique Patients (for Patient Directory)
  const filteredPatients = useMemo(() => {
    return uniquePatients.filter((item) => {
      const patient = item.patientInfo;
      const query = searchTerm.toLowerCase().trim();

      if (!query) return true;

      const name = patient?.name || "";
      const email = patient?.email || "";
      const phone = patient?.phone || "";

      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query)
      );
    });
  }, [uniquePatients, searchTerm]);

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
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

        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                My Patients & Bookings
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Track patients who have scheduled consultations with you, manage
              medical records, and write official prescriptions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDoctorPatients(true)}
              disabled={refreshing || loading}
              title="Refresh Patients"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>

            <Link
              to="/doctordashboard/availability"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition"
            >
              <Clock className="w-4 h-4" />
              Manage Availability
            </Link>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalBookings}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Unique Patients
            </p>
            <h3 className="text-2xl font-bold text-blue-700 mt-1">
              {uniquePatientCount}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Upcoming / Active
            </p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {upcomingCount}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Completed
            </p>
            <h3 className="text-2xl font-bold text-indigo-700 mt-1">
              {completedCount}
            </h3>
          </div>
        </div>

        {/* Filters and View Toggle Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setViewMode("bookings")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "bookings"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Bookings Feed
              </button>
              <button
                onClick={() => setViewMode("patients")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "patients"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Patient Directory
              </button>
            </div>

            {/* Status Filter (Active only in bookings view) */}
            {viewMode === "bookings" && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: "all", label: "All" },
                  { id: "confirmed", label: "Confirmed" },
                  { id: "rescheduled", label: "Rescheduled" },
                  { id: "completed", label: "Completed" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      statusFilter === tab.id
                        ? "bg-white text-blue-600 shadow-xs font-semibold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                viewMode === "bookings"
                  ? "Search by patient name, reason, phone..."
                  : "Search patient directory..."
              }
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

        {/* Content Section */}
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
                  <div className="h-5 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          /* Empty State when no appointments at all */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No Patient Bookings Yet
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
              You haven't received any patient bookings yet. Make sure your
              availability slots are open so patients can book appointments with
              you.
            </p>
            <Link
              to="/doctordashboard/availability"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-200 transition"
            >
              <Clock className="w-4 h-4" />
              Set Your Available Time Slots
            </Link>
          </div>
        ) : viewMode === "bookings" ? (
          /* Bookings Feed View */
          filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-sm">
              <p className="text-sm text-slate-600 font-medium">
                No bookings match your selected filter or search criteria.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
                className="mt-3 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appt) => {
                const patient = appt.patient || {};
                const slot = appt.slot || {};
                const isConfirmed = appt.status === "confirmed";
                const isRescheduled = appt.status === "rescheduled";
                const isCompleted = appt.status === "completed";
                const hasPrescription = !!appt.prescription;
                const duration = getDuration(slot.start_time, slot.end_time);

                return (
                  <div
                    key={appt.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    {/* Left: Patient Details & Contact */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-200 flex-shrink-0">
                        {patient.name
                          ? patient.name.charAt(0).toUpperCase()
                          : "P"}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-800 text-base">
                            {patient.name || "Patient"}
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            Booking #{appt.id}
                          </span>
                          {hasPrescription && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                              <Pill className="w-3 h-3 text-emerald-600" />
                              Rx Prescribed
                            </span>
                          )}
                        </div>

                        {/* Contact details */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                          {patient.email && (
                            <a
                              href={`mailto:${patient.email}`}
                              className="flex items-center gap-1 hover:text-blue-600 transition"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{patient.email}</span>
                            </a>
                          )}
                          {patient.phone && (
                            <>
                              <span className="text-slate-300">•</span>
                              <a
                                href={`tel:${patient.phone}`}
                                className="flex items-center gap-1 hover:text-blue-600 transition"
                              >
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{patient.phone}</span>
                              </a>
                            </>
                          )}
                        </div>

                        {/* Scheduled Time */}
                        <div className="flex items-center gap-3 text-xs text-slate-700 font-medium pt-1.5">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {slot.start_time
                              ? formatFullDate(slot.start_time)
                              : "Date not scheduled"}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {slot.start_time && slot.end_time
                              ? `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
                              : "Time not set"}
                          </span>
                          {duration && (
                            <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {duration}
                            </span>
                          )}
                        </div>

                        {/* Reason for Visit */}
                        {appt.reason && (
                          <div className="text-xs text-slate-600 italic pt-1 flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>"{appt.reason}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
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

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Add / View Prescription Button */}
                        <button
                          onClick={() => handleOpenPrescription(appt)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs ${
                            hasPrescription
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                          }`}
                        >
                          <Pill className="w-3.5 h-3.5" />
                          <span>
                            {hasPrescription
                              ? "View / Edit Rx"
                              : "+ Add Prescription"}
                          </span>
                        </button>

                        {/* Complete consultation button (if not completed) */}
                        {!isCompleted && (
                          <button
                            onClick={() => handleMarkCompleted(appt.id)}
                            disabled={updatingId === appt.id}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                          >
                            {updatingId === appt.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>Complete</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const group = uniquePatients.find(
                              (u) => u.patientInfo?.id === patient.id,
                            );
                            setSelectedPatient(
                              group || {
                                patientInfo: patient,
                                appointments: [appt],
                              },
                            );
                          }}
                          className="text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
                        >
                          History
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : /* Patient Directory View (Grouped by Patient) */
        filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-sm">
            <p className="text-sm text-slate-600 font-medium">
              No patients match your search query.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-3 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((item) => {
              const patient = item.patientInfo;
              const latest = item.latestAppointment;

              return (
                <div
                  key={patient.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Top: Avatar & Name */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                          {patient.name
                            ? patient.name.charAt(0).toUpperCase()
                            : "P"}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">
                            {patient.name || "Patient"}
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            Patient ID: #{patient.id}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {item.totalVisits}{" "}
                        {item.totalVisits === 1 ? "Visit" : "Visits"}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      {patient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Latest Visit */}
                    {latest && (
                      <div className="text-xs text-slate-600 mb-2">
                        <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">
                          Latest Consultation:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {latest.slot?.start_time
                            ? formatFullDate(latest.slot.start_time)
                            : formatFullDate(latest.created_at)}
                        </span>
                        {latest.reason && (
                          <p className="text-slate-500 italic mt-0.5 line-clamp-1">
                            "{latest.reason}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom CTA */}
                  <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenPrescription(latest)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Prescribe</span>
                    </button>

                    <button
                      onClick={() => setSelectedPatient(item)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
                    >
                      <span>History ({item.appointments.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prescription Form & Preview Modal */}
      {prescriptionAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Patient Prescription Form
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient:{" "}
                    <strong className="text-slate-700">
                      {prescriptionAppt.patient?.name || "Patient"}
                    </strong>{" "}
                    • Booking #{prescriptionAppt.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRxPreview(!showRxPreview)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    showRxPreview
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {showRxPreview ? "Edit Form" : "Preview Rx"}
                </button>

                <button
                  onClick={() => setPrescriptionAppt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {showRxPreview ? (
              /* Prescription Preview / Paper View */
              <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50">
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  {/* Doctor & Patient Strip */}
                  <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-blue-600 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4" />
                        MediCare Official Prescription
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Consultation Date:{" "}
                        {formatFullDate(
                          prescriptionAppt.slot?.start_time || new Date(),
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 block">
                        Patient: {prescriptionAppt.patient?.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {prescriptionAppt.patient?.email}
                      </span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Clinical Diagnosis:
                    </span>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {prescriptionForm.diagnosis || "No diagnosis specified"}
                    </p>
                  </div>

                  {/* Medicines List */}
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Prescribed Medications (Rx):
                    </span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-600 grid grid-cols-12 border-b border-slate-200">
                        <span className="col-span-5">Medicine Name</span>
                        <span className="col-span-2">Dosage</span>
                        <span className="col-span-3">Frequency</span>
                        <span className="col-span-2 text-right">Duration</span>
                      </div>
                      {prescriptionForm.medicines
                        .filter((m) => m.name.trim())
                        .map((med, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2.5 grid grid-cols-12 border-b border-slate-100 last:border-b-0 text-slate-700"
                          >
                            <span className="col-span-5 font-bold text-slate-800">
                              {med.name}
                            </span>
                            <span className="col-span-2">
                              {med.dosage || "-"}
                            </span>
                            <span className="col-span-3">
                              {med.frequency || "-"}
                            </span>
                            <span className="col-span-2 text-right font-medium">
                              {med.duration || "-"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  {prescriptionForm.instructions && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Special Advice & Instructions:
                      </span>
                      <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {prescriptionForm.instructions}
                      </p>
                    </div>
                  )}

                  {/* Follow-up date */}
                  {prescriptionForm.followUpDate && (
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold text-blue-700">
                        Next Follow-up Consultation:
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatFullDate(prescriptionForm.followUpDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Editable Form */
              <form
                onSubmit={handleSubmitPrescription}
                className="p-6 space-y-5 overflow-y-auto"
              >
                {prescriptionError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{prescriptionError}</span>
                  </div>
                )}

                {/* Patient / Appointment Context Banner */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block">Patient Name</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {prescriptionAppt.patient?.name || "Patient"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">
                      Consultation Time
                    </span>
                    <span className="font-semibold text-slate-700">
                      {prescriptionAppt.slot?.start_time
                        ? formatFullDate(prescriptionAppt.slot.start_time)
                        : "Today"}
                    </span>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Clinical Diagnosis <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter patient diagnosis (e.g., Acute upper respiratory tract infection, viral fever...)"
                    value={prescriptionForm.diagnosis}
                    onChange={(e) =>
                      setPrescriptionForm((prev) => ({
                        ...prev,
                        diagnosis: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  ></textarea>
                </div>

                {/* Medicines List Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Prescribed Medicines (Rx){" "}
                      <span className="text-rose-500">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddMedicineRow}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Medicine</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {prescriptionForm.medicines.map((med, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-500">
                            Medicine #{index + 1}
                          </span>
                          {prescriptionForm.medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicineRow(index)}
                              className="text-slate-400 hover:text-rose-600 transition p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                          {/* Medicine Name */}
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              required
                              placeholder="Medicine Name (e.g. Paracetamol 650mg)"
                              value={med.name}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Dosage */}
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Dosage (e.g. 1 Tab)"
                              value={med.dosage}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  "dosage",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Frequency */}
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Frequency (e.g. 1-0-1)"
                              value={med.frequency}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  "frequency",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Duration */}
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Duration (5 days)"
                              value={med.duration}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  "duration",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions / Advice */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Instructions & Advice
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Take after food with warm water, avoid dairy for 2 hours..."
                    value={prescriptionForm.instructions}
                    onChange={(e) =>
                      setPrescriptionForm((prev) => ({
                        ...prev,
                        instructions: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  ></textarea>
                </div>

                {/* Follow Up Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Next Follow-up Consultation Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={prescriptionForm.followUpDate}
                    onChange={(e) =>
                      setPrescriptionForm((prev) => ({
                        ...prev,
                        followUpDate: e.target.value,
                      }))
                    }
                    className="w-full sm:w-64 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={prescriptionLoading}
                    onClick={() => setPrescriptionAppt(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={prescriptionLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-200 transition disabled:opacity-50"
                  >
                    {prescriptionLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Prescription...</span>
                      </>
                    ) : (
                      <>
                        <Pill className="w-3.5 h-3.5" />
                        <span>Save & Complete Prescription</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Patient History & Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  {selectedPatient.patientInfo?.name
                    ? selectedPatient.patientInfo.name.charAt(0).toUpperCase()
                    : "P"}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {selectedPatient.patientInfo?.name || "Patient"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient ID #{selectedPatient.patientInfo?.id} • Total{" "}
                    {selectedPatient.appointments?.length || 1} Consultation(s)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Patient Contact Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedPatient.patientInfo?.email || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    Phone Number
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedPatient.patientInfo?.phone || "Not provided"}
                  </span>
                </div>
              </div>

              {/* Consultation History List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Consultation History With You
                </h4>

                <div className="space-y-3">
                  {(selectedPatient.appointments || []).map((appt) => {
                    const slot = appt.slot || {};
                    const isConfirmed = appt.status === "confirmed";
                    const isRescheduled = appt.status === "rescheduled";
                    const isCompleted = appt.status === "completed";
                    const rx = appt.prescription;

                    return (
                      <div
                        key={appt.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-sm">
                            Booking #{appt.id}
                          </span>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isConfirmed
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isRescheduled
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : isCompleted
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {appt.status}
                            </span>

                            <button
                              onClick={() => {
                                setSelectedPatient(null);
                                handleOpenPrescription(appt);
                              }}
                              className="text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              {rx ? "View Rx" : "+ Prescribe"}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-slate-700 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {slot.start_time
                              ? formatFullDate(slot.start_time)
                              : formatFullDate(appt.created_at)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {slot.start_time && slot.end_time
                              ? `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
                              : "Time not set"}
                          </span>
                          <span className="ml-auto font-bold text-slate-800">
                            ₹{appt.consultation_fee || 500}
                          </span>
                        </div>

                        {appt.reason && (
                          <p className="text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            Reason: "{appt.reason}"
                          </p>
                        )}

                        {/* If Prescription Attached, show summary */}
                        {rx && (
                          <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-emerald-900 space-y-1">
                            <div className="flex items-center gap-1 font-bold">
                              <Pill className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Prescription: {rx.diagnosis}</span>
                            </div>
                            {Array.isArray(rx.medicines) &&
                              rx.medicines.length > 0 && (
                                <p className="text-emerald-700">
                                  Medicines:{" "}
                                  {rx.medicines.map((m) => m.name).join(", ")}
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPatients;
