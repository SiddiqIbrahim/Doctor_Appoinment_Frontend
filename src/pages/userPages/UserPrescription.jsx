import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ApiServece from "../../API/ApiServece";
import {
  Pill,
  FileText,
  Calendar,
  Clock,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Stethoscope,
  BadgeCheck,
  MapPin,
  Sparkles,
  ChevronRight,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";

const UserPrescription = () => {
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Selected Prescription for Print / Detailed View Modal
  const [selectedRx, setSelectedRx] = useState(null);

  // Fetch prescriptions for current user
  const fetchUserPrescriptions = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await ApiServece.getUserPrescriptions();
      const list = response?.data || response?.prescriptions || [];
      setPrescriptions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      setError(
        err.response?.data?.msg ||
          "Failed to load your medical prescriptions. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserPrescriptions();
  }, []);

  // Format Helpers
  const formatFullDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
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

  // Metrics
  const totalCount = prescriptions.length;
  const followUpCount = prescriptions.filter(
    (p) => p.follow_up_date && new Date(p.follow_up_date) >= new Date(),
  ).length;
  const totalMedsPrescribed = prescriptions.reduce((acc, p) => {
    return acc + (Array.isArray(p.medicines) ? p.medicines.length : 0);
  }, 0);

  // Filtered Prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      const query = searchTerm.toLowerCase().trim();
      if (!query) return true;

      const docName = rx.appointment?.doctor?.user?.name || "";
      const spec = rx.appointment?.doctor?.specialization || "";
      const diagnosis = rx.diagnosis || "";
      const meds = Array.isArray(rx.medicines)
        ? rx.medicines.map((m) => m.name || "").join(" ")
        : "";

      return (
        docName.toLowerCase().includes(query) ||
        spec.toLowerCase().includes(query) ||
        diagnosis.toLowerCase().includes(query) ||
        meds.toLowerCase().includes(query) ||
        String(rx.id).includes(query)
      );
    });
  }, [prescriptions, searchTerm]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                My Medical Prescriptions
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Access official clinical prescriptions issued by your doctors,
              review dosage instructions, and check follow-up dates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUserPrescriptions(true)}
              disabled={refreshing || loading}
              title="Refresh Prescriptions"
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
              Consult a Doctor
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Prescriptions
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {totalCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Medications Prescribed
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {totalMedsPrescribed}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Pill className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Upcoming Follow-ups
              </p>
              <h3 className="text-2xl font-bold text-indigo-700 mt-1">
                {followUpCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by doctor name, medicine, or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex justify-between">
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-5 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="h-20 bg-slate-100 rounded-xl"></div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">
              Unable to Load Prescriptions
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {error}
            </p>
            <button
              onClick={() => fetchUserPrescriptions()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No Prescriptions Available
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {prescriptions.length === 0
                ? "You don't have any prescriptions yet. After consulting with a doctor, their prescription and medication dosage will be available here."
                : "No prescriptions match your search keyword. Try clearing the search."}
            </p>
            {prescriptions.length === 0 ? (
              <button
                onClick={() => navigate("/userdashboard/doctors")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-200 transition"
              >
                <Plus className="w-4 h-4" />
                Find Doctors to Consult
              </button>
            ) : (
              <button
                onClick={() => setSearchTerm("")}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          /* Prescriptions List */
          <div className="space-y-6">
            {filteredPrescriptions.map((rx) => {
              const doc = rx.appointment?.doctor?.user || {};
              const docProfile = rx.appointment?.doctor || {};
              const slot = rx.appointment?.slot || {};
              const medicines = Array.isArray(rx.medicines) ? rx.medicines : [];

              return (
                <div
                  key={rx.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all duration-200 space-y-5"
                >
                  {/* Card Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-blue-200 flex-shrink-0">
                        {doc.name ? doc.name.charAt(0).toUpperCase() : "D"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-base">
                            Dr. {doc.name || "Specialist"}
                          </h3>
                          <BadgeCheck className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {docProfile.specialization || "Physician"}
                          </span>
                        </div>
                        {docProfile.clinicAddress && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {docProfile.clinicAddress}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Issued Date
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {formatFullDate(rx.created_at || slot.start_time)}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                        Rx #{rx.id}
                      </span>
                    </div>
                  </div>

                  {/* Diagnosis Strip */}
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/80 flex items-start gap-2.5 text-xs text-slate-800">
                    <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-900 block">
                        Clinical Diagnosis:
                      </span>
                      <p className="mt-0.5 text-slate-700 font-medium">
                        {rx.diagnosis || "Consultation Completed"}
                      </p>
                    </div>
                  </div>

                  {/* Prescribed Medicines (Table Layout) */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      Prescribed Medicines ({medicines.length})
                    </h4>

                    {medicines.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No specific medications listed.
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-2xs">
                        <div className="bg-slate-50 px-4 py-2.5 font-semibold text-slate-600 grid grid-cols-12 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                          <span className="col-span-5">Medicine</span>
                          <span className="col-span-2">Dosage</span>
                          <span className="col-span-3">Frequency</span>
                          <span className="col-span-2 text-right">
                            Duration
                          </span>
                        </div>

                        {medicines.map((med, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 grid grid-cols-12 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition items-center"
                          >
                            <div className="col-span-5">
                              <span className="font-bold text-slate-800 block">
                                {med.name}
                              </span>
                            </div>
                            <span className="col-span-2 text-slate-600 font-medium">
                              {med.dosage || "-"}
                            </span>
                            <span className="col-span-3 text-slate-600">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                                {med.frequency || "-"}
                              </span>
                            </span>
                            <span className="col-span-2 text-right font-semibold text-slate-700">
                              {med.duration || "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Instructions & Follow-up Row */}
                  {(rx.instructions || rx.follow_up_date) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      {rx.instructions && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Doctor's Advice & Instructions:
                          </span>
                          <p className="text-slate-600 mt-1 leading-relaxed">
                            {rx.instructions}
                          </p>
                        </div>
                      )}

                      {rx.follow_up_date && (
                        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5">
                          <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                              Recommended Follow-up:
                            </span>
                            <p className="text-xs font-bold text-indigo-700 mt-0.5">
                              {formatFullDate(rx.follow_up_date)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Appointment #{rx.appointment_id}
                    </span>

                    <button
                      onClick={() => setSelectedRx(rx)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View & Print Rx Slip</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Medical Prescription Printable Slip Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Printer className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Medical Prescription Slip
                  </h3>
                  <p className="text-xs text-slate-400">
                    Prescription #{selectedRx.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Rx</span>
                </button>

                <button
                  onClick={() => setSelectedRx(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Paper Slip View */}
            <div className="p-8 overflow-y-auto space-y-6 print:p-0">
              {/* Doctor / Clinic Letterhead */}
              <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-blue-600">
                      MediCare
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Healthcare System
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">
                    Dr.{" "}
                    {selectedRx.appointment?.doctor?.user?.name || "Specialist"}
                  </h3>
                  <p className="text-xs font-semibold text-blue-600">
                    {selectedRx.appointment?.doctor?.specialization ||
                      "General Medicine"}
                  </p>
                  {selectedRx.appointment?.doctor?.qualification && (
                    <p className="text-[11px] text-slate-500">
                      {selectedRx.appointment?.doctor?.qualification}
                    </p>
                  )}
                  {selectedRx.appointment?.doctor?.clinicAddress && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedRx.appointment?.doctor?.clinicAddress}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-slate-500 space-y-0.5">
                  <span className="text-2xl font-serif font-black text-slate-800 block">
                    ℞
                  </span>
                  <p className="font-bold text-slate-700">
                    Prescription #{selectedRx.id}
                  </p>
                  <p>Date: {formatFullDate(selectedRx.created_at)}</p>
                  <p>Appt #{selectedRx.appointment_id}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Clinical Diagnosis:
                </span>
                <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedRx.diagnosis || "General Consultation"}
                </p>
              </div>

              {/* Medicines Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Medication Plan (Rx):
                </span>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 grid grid-cols-12 border-b border-slate-200 text-[11px] uppercase">
                    <span className="col-span-5">Medicine</span>
                    <span className="col-span-2">Dosage</span>
                    <span className="col-span-3">Frequency</span>
                    <span className="col-span-2 text-right">Duration</span>
                  </div>

                  {(Array.isArray(selectedRx.medicines)
                    ? selectedRx.medicines
                    : []
                  ).map((med, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2.5 grid grid-cols-12 border-b border-slate-100 last:border-b-0 text-slate-800"
                    >
                      <span className="col-span-5 font-bold">{med.name}</span>
                      <span className="col-span-2">{med.dosage || "-"}</span>
                      <span className="col-span-3">{med.frequency || "-"}</span>
                      <span className="col-span-2 text-right font-semibold">
                        {med.duration || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              {selectedRx.instructions && (
                <div className="space-y-1 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Special Advice & Instructions:
                  </span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {selectedRx.instructions}
                  </p>
                </div>
              )}

              {/* Follow-up & Footer Sign */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
                <div>
                  {selectedRx.follow_up_date && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Next Review:
                      </span>
                      <span className="font-bold text-blue-700 text-sm">
                        {formatFullDate(selectedRx.follow_up_date)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <div className="w-36 border-b border-slate-400 pb-1 ml-auto">
                    <span className="font-serif italic text-slate-600">
                      Dr. {selectedRx.appointment?.doctor?.user?.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                    Authorized Medical Practitioner
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end no-print">
              <button
                onClick={() => setSelectedRx(null)}
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

export default UserPrescription;
