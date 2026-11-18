import React, { useState, useEffect, useMemo } from "react";
import ApiServece from "../../API/ApiServece";
import {
  Stethoscope,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  ExternalLink,
  ShieldCheck,
  Eye,
  Power,
  X,
  ArrowUpDown,
  Check,
} from "lucide-react";

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [approvalConfirm, setApprovalConfirm] = useState(null);
  const [activeToggleConfirm, setActiveToggleConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(
        () => setFeedback({ type: "", message: "" }),
        4000,
      );
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchDoctors = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await ApiServece.getAdminDoctors();
      const list = response?.data || response?.doctors || [];
      setDoctors(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(
        err.response?.data?.msg ||
          "Unable to load doctors directory. Please check your admin permissions.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

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

  const getAvatarGradient = (name = "") => {
    const gradients = [
      "from-blue-600 to-indigo-700",
      "from-teal-600 to-emerald-700",
      "from-indigo-600 to-violet-700",
      "from-sky-600 to-cyan-700",
      "from-emerald-600 to-teal-800",
    ];
    const charCode = name.charCodeAt(0) || 0;
    return gradients[charCode % gradients.length];
  };

  const getCertificateUrl = (rawUrl) => {
    if (!rawUrl) return "#";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
    const apiUrl =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
    const serverHost = apiUrl.replace(/\/api\/v1\/?$/, "");
    return `${serverHost}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  };

  const handleConfirmApproval = async () => {
    if (!approvalConfirm) return;
    const { doc, newStatus } = approvalConfirm;
    const doctorProfileId = doc?.doctorProfile?.id;

    if (!doctorProfileId) {
      setFeedback({
        type: "error",
        message: "Doctor profile record not found for this user.",
      });
      setApprovalConfirm(null);
      return;
    }

    try {
      setActionLoading(true);
      const response = await ApiServece.updateDoctorApproval(
        doctorProfileId,
        newStatus,
      );

      setDoctors((prev) =>
        prev.map((d) => {
          if (d.doctorProfile?.id === doctorProfileId) {
            return {
              ...d,
              doctorProfile: {
                ...d.doctorProfile,
                approvalStatus: newStatus,
              },
            };
          }
          return d;
        }),
      );

      if (selectedDoctor?.doctorProfile?.id === doctorProfileId) {
        setSelectedDoctor((prev) => ({
          ...prev,
          doctorProfile: {
            ...prev.doctorProfile,
            approvalStatus: newStatus,
          },
        }));
      }

      setFeedback({
        type: "success",
        message:
          response?.msg ||
          `Dr. ${doc.name}'s status has been updated to "${newStatus}".`,
      });
      setApprovalConfirm(null);
    } catch (err) {
      console.error("Error updating approval status:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.msg ||
          "Failed to update doctor approval status. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmActiveToggle = async () => {
    if (!activeToggleConfirm) return;
    const doc = activeToggleConfirm;

    try {
      setActionLoading(true);
      const response = await ApiServece.toggleDoctorActive(doc.id);
      const isNowActive = !doc.is_active;

      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, is_active: isNowActive } : d,
        ),
      );

      if (selectedDoctor?.id === doc.id) {
        setSelectedDoctor((prev) => ({ ...prev, is_active: isNowActive }));
      }

      setFeedback({
        type: "success",
        message:
          response?.msg ||
          `Dr. ${doc.name}'s account has been ${
            isNowActive ? "activated" : "deactivated"
          } successfully.`,
      });
      setActiveToggleConfirm(null);
    } catch (err) {
      console.error("Error toggling doctor active status:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.msg ||
          "Failed to update doctor account status. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const allSpecializations = useMemo(() => {
    const specs = new Set();
    doctors.forEach((d) => {
      const spec = d.doctorProfile?.specialization;
      if (spec && spec.trim()) {
        specs.add(spec.trim());
      }
    });
    return Array.from(specs).sort();
  }, [doctors]);

  const stats = useMemo(() => {
    const total = doctors.length;
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    doctors.forEach((d) => {
      const status = d.doctorProfile?.approvalStatus || "pending";
      if (status === "approved") approved++;
      else if (status === "rejected") rejected++;
      else pending++;
    });

    return { total, approved, pending, rejected };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors
      .filter((d) => {
        const profile = d.doctorProfile || {};
        const approvalStatus = profile.approvalStatus || "pending";

        if (statusFilter !== "all" && approvalStatus !== statusFilter) {
          return false;
        }

        if (specialtyFilter !== "all") {
          const spec = (profile.specialization || "").toLowerCase();
          if (spec !== specialtyFilter.toLowerCase()) return false;
        }

        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;

        const name = (d.name || "").toLowerCase();
        const email = (d.email || "").toLowerCase();
        const phone = (d.phone || "").toLowerCase();
        const spec = (profile.specialization || "").toLowerCase();
        const qual = (profile.qualification || "").toLowerCase();
        const clinic = (profile.clinicAddress || "").toLowerCase();

        return (
          name.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          spec.includes(query) ||
          qual.includes(query) ||
          clinic.includes(query) ||
          String(d.id).includes(query)
        );
      })
      .sort((a, b) => {
        const aProf = a.doctorProfile || {};
        const bProf = b.doctorProfile || {};

        if (sortBy === "newest") {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
        if (sortBy === "name") {
          return (a.name || "").localeCompare(b.name || "");
        }
        if (sortBy === "experience") {
          return (
            (Number(bProf.experience) || 0) - (Number(aProf.experience) || 0)
          );
        }
        if (sortBy === "fee-low") {
          return (
            (Number(aProf.consultationFee) || 0) -
            (Number(bProf.consultationFee) || 0)
          );
        }
        if (sortBy === "fee-high") {
          return (
            (Number(bProf.consultationFee) || 0) -
            (Number(aProf.consultationFee) || 0)
          );
        }
        if (sortBy === "appointments") {
          const aCount = aProf.appointments?.length || 0;
          const bCount = bProf.appointments?.length || 0;
          return bCount - aCount;
        }
        return 0;
      });
  }, [doctors, searchTerm, statusFilter, specialtyFilter, sortBy]);

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Stethoscope className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  Manage Doctors
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full directory of registered specialists, approval statuses,
                  and credentials
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2.5 max-w-2xl leading-relaxed">
              Verify doctor applications, review uploaded medical certificates,
              manage consultation fees and specialties, and regulate practice
              approval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {stats.pending > 0 && (
              <button
                onClick={() => setStatusFilter("pending")}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-semibold text-xs transition hover:bg-amber-100 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{stats.pending} Pending Review</span>
              </button>
            )}

            <button
              onClick={() => fetchDoctors(true)}
              disabled={refreshing || loading}
              title="Refresh Doctors"
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
              onClick={() => fetchDoctors()}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Doctors
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {stats.total}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Registered practitioners
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Approved
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {stats.approved}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verified & active practitioners
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Pending Approval
              </p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">
                {stats.pending}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Awaiting credential review
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Rejected
              </p>
              <h3 className="text-2xl font-bold text-rose-700 mt-1">
                {stats.rejected}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Declined doctor applications
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, clinic location, or qualification..."
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

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
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
                All ({doctors.length})
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === "approved"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === "pending"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter("rejected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === "rejected"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Rejected ({stats.rejected})
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {allSpecializations.length > 0 && (
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">
                    All Specialties ({allSpecializations.length})
                  </option>
                  {allSpecializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="newest">Newest Registered</option>
                  <option value="oldest">Oldest Registered</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="experience">Highest Experience</option>
                  <option value="fee-low">Fee (Low to High)</option>
                  <option value="fee-high">Fee (High to Low)</option>
                  <option value="appointments">Most Appointments</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>
              Showing{" "}
              <strong className="text-slate-800">
                {filteredDoctors.length}
              </strong>{" "}
              of <strong className="text-slate-800">{doctors.length}</strong>{" "}
              registered doctors
            </span>
            {(searchTerm ||
              statusFilter !== "all" ||
              specialtyFilter !== "all" ||
              sortBy !== "newest") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSpecialtyFilter("all");
                  setSortBy("newest");
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-9 h-9 text-blue-600 animate-spin mb-4" />
            <h3 className="text-base font-semibold text-slate-800">
              Loading Doctors Directory...
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Retrieving doctor profiles, credentials, certificates, and
              approval statuses.
            </p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No Doctors Found
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md">
              {searchTerm || statusFilter !== "all" || specialtyFilter !== "all"
                ? "No medical practitioners matched your search or filter options. Try resetting your filters."
                : "No doctors have registered in the system yet."}
            </p>
            {(searchTerm ||
              statusFilter !== "all" ||
              specialtyFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSpecialtyFilter("all");
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => {
              const profile = doc.doctorProfile || {};
              const approval = profile.approvalStatus || "pending";
              const certificates = Array.isArray(profile.certificates)
                ? profile.certificates
                : [];
              const appointmentCount = Array.isArray(profile.appointments)
                ? profile.appointments.length
                : 0;
              const slotsCount = Array.isArray(profile.availabilitySlots)
                ? profile.availabilitySlots.length
                : 0;
              const isActive = doc.is_active !== false;

              const statusBadgeConfig = {
                approved: {
                  bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  icon: CheckCircle2,
                  label: "Approved",
                },
                pending: {
                  bg: "bg-amber-50 text-amber-700 border-amber-200",
                  icon: Clock,
                  label: "Pending Review",
                },
                rejected: {
                  bg: "bg-rose-50 text-rose-700 border-rose-200",
                  icon: XCircle,
                  label: "Rejected",
                },
              };

              const currentStatusConfig =
                statusBadgeConfig[approval] || statusBadgeConfig.pending;
              const StatusIcon = currentStatusConfig.icon;

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                            doc.name,
                          )} text-white font-bold flex items-center justify-center text-base shadow-sm flex-shrink-0`}
                        >
                          {(doc.name || "D").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-800 text-sm truncate">
                              Dr. {doc.name}
                            </h3>
                            {approval === "approved" && (
                              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-blue-600 font-semibold truncate mt-0.5">
                            {profile.specialization || "General Specialist"}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            ID: #DOC-{doc.id}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${currentStatusConfig.bg} flex-shrink-0`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{currentStatusConfig.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-3.5 text-[11px]">
                      {profile.qualification && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                          {profile.qualification}
                        </span>
                      )}
                      {profile.experience && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                          {profile.experience} Yrs Exp
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-3.5 text-xs flex-1">
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Consultation
                        </p>
                        <p className="font-bold text-slate-800 text-xs mt-0.5">
                          ₹{profile.consultationFee || 500}
                        </p>
                      </div>
                      <div className="border-x border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Bookings
                        </p>
                        <p className="font-bold text-indigo-600 text-xs mt-0.5">
                          {appointmentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Slots
                        </p>
                        <p className="font-bold text-emerald-600 text-xs mt-0.5">
                          {slotsCount}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{doc.email}</span>
                      </div>
                      {doc.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{doc.phone}</span>
                        </div>
                      )}
                      {profile.clinicAddress && (
                        <div className="flex items-start gap-2 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            {profile.clinicAddress}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">
                        Verification Docs:
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        <FileText className="w-3 h-3" />
                        {certificates.length} Document
                        {certificates.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedDoctor(doc)}
                      className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Details</span>
                    </button>

                    {approval !== "approved" ? (
                      <button
                        onClick={() =>
                          setApprovalConfirm({ doc, newStatus: "approved" })
                        }
                        title="Approve Doctor Application"
                        className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs shadow-emerald-200"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setApprovalConfirm({ doc, newStatus: "rejected" })
                        }
                        title="Reject / Revoke Doctor Approval"
                        className="p-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Toggle Active Switch */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                    selectedDoctor.name,
                  )} text-white font-bold flex items-center justify-center text-xl shadow-sm`}
                >
                  {(selectedDoctor.name || "D").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-800">
                      Dr. {selectedDoctor.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                        selectedDoctor.doctorProfile?.approvalStatus ===
                        "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : selectedDoctor.doctorProfile?.approvalStatus ===
                              "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {selectedDoctor.doctorProfile?.approvalStatus ||
                        "pending"}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    {selectedDoctor.doctorProfile?.specialization ||
                      "General Medicine"}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    User ID: #DOC-{selectedDoctor.id} • Registered on{" "}
                    {formatDate(selectedDoctor.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs">
              {/* Credentials & Clinic Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Information */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Contact & Professional Details
                  </p>
                  <div className="space-y-1.5 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">
                        {selectedDoctor.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">
                        {selectedDoctor.phone || "No phone number provided"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">
                        {selectedDoctor.doctorProfile?.qualification ||
                          "Qualifications pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">
                        {selectedDoctor.doctorProfile?.experience || 0} Years
                        Experience
                      </span>
                    </div>
                  </div>
                </div>

                {/* Practice & Location */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Consultation & Clinic
                  </p>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Consultation Fee:</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹{selectedDoctor.doctorProfile?.consultationFee || 500}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Account Access:</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          selectedDoctor.is_active !== false
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {selectedDoctor.is_active !== false
                          ? "Active"
                          : "Suspended"}
                      </span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-500 block mb-0.5">
                        Clinic Address:
                      </span>
                      <p className="font-medium text-slate-800 leading-relaxed">
                        {selectedDoctor.doctorProfile?.clinicAddress ||
                          "Clinic address not updated"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Bio */}
              {selectedDoctor.doctorProfile?.bio && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Doctor Biography
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedDoctor.doctorProfile.bio}
                  </p>
                </div>
              )}

              {/* Uploaded Certificates Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Uploaded Verification Certificates (
                    {selectedDoctor.doctorProfile?.certificates?.length || 0})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Review official credentials & medical licenses
                  </span>
                </div>

                {!selectedDoctor.doctorProfile?.certificates ||
                selectedDoctor.doctorProfile.certificates.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">
                      No certificates uploaded
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Doctor has not provided verification files during
                      registration.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDoctor.doctorProfile.certificates.map((cert) => {
                      const fullCertUrl = getCertificateUrl(
                        cert.certificate_url,
                      );

                      return (
                        <div
                          key={cert.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p
                              className="font-bold text-slate-800 truncate"
                              title={cert.certificate_name}
                            >
                              {cert.certificate_name || "Doctor Certificate"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Status:{" "}
                              <span className="font-semibold capitalize text-slate-600">
                                {cert.verification_status || "pending"}
                              </span>
                            </p>
                          </div>

                          <a
                            href={fullCertUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition flex items-center gap-1 flex-shrink-0"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Consultation & Slot Stats */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-800">
                    Practice Activity Summary
                  </h5>
                  <p className="text-slate-500 text-[11px]">
                    Total patient bookings:{" "}
                    <strong className="text-slate-800">
                      {selectedDoctor.doctorProfile?.appointments?.length || 0}
                    </strong>{" "}
                    • Availability slots created:{" "}
                    <strong className="text-slate-800">
                      {selectedDoctor.doctorProfile?.availabilitySlots
                        ?.length || 0}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer: Action Control Bar */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedDoctor.doctorProfile?.approvalStatus !==
                  "approved" && (
                  <button
                    onClick={() => {
                      setApprovalConfirm({
                        doc: selectedDoctor,
                        newStatus: "approved",
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Doctor</span>
                  </button>
                )}

                {selectedDoctor.doctorProfile?.approvalStatus !==
                  "rejected" && (
                  <button
                    onClick={() => {
                      setApprovalConfirm({
                        doc: selectedDoctor,
                        newStatus: "rejected",
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Application</span>
                  </button>
                )}

                {selectedDoctor.doctorProfile?.approvalStatus !== "pending" && (
                  <button
                    onClick={() => {
                      setApprovalConfirm({
                        doc: selectedDoctor,
                        newStatus: "pending",
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Set to Pending</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveToggleConfirm(selectedDoctor);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200/80 text-slate-700 hover:bg-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>
                    {selectedDoctor.is_active !== false
                      ? "Suspend Access"
                      : "Activate Access"}
                  </span>
                </button>
              </div>

              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl font-semibold text-xs hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {approvalConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  approvalConfirm.newStatus === "approved"
                    ? "bg-emerald-50 text-emerald-600"
                    : approvalConfirm.newStatus === "rejected"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-amber-50 text-amber-600"
                }`}
              >
                {approvalConfirm.newStatus === "approved" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : approvalConfirm.newStatus === "rejected" ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 capitalize">
                  {approvalConfirm.newStatus === "approved"
                    ? "Approve Doctor Application?"
                    : approvalConfirm.newStatus === "rejected"
                      ? "Reject Doctor Application?"
                      : "Mark Application as Pending?"}
                </h3>
                <p className="text-xs text-slate-400">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to change the status of{" "}
              <strong className="text-slate-900">
                Dr. {approvalConfirm.doc.name}
              </strong>{" "}
              to{" "}
              <strong className="capitalize text-slate-900">
                "{approvalConfirm.newStatus}"
              </strong>
              ?
              {approvalConfirm.newStatus === "approved"
                ? " The doctor will immediately appear in the patient 'Find Doctors' directory and can start accepting patient appointments."
                : approvalConfirm.newStatus === "rejected"
                  ? " The doctor will be notified that their registration was rejected and will not be listed for booking."
                  : " The application will be moved back to the review queue."}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovalConfirm(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition flex items-center gap-1.5 ${
                  approvalConfirm.newStatus === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    : approvalConfirm.newStatus === "rejected"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                      : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                } disabled:opacity-50`}
              >
                {actionLoading && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span className="capitalize">
                  Confirm {approvalConfirm.newStatus}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeToggleConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  activeToggleConfirm.is_active !== false
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {activeToggleConfirm.is_active !== false
                    ? "Suspend Doctor Account?"
                    : "Activate Doctor Account?"}
                </h3>
                <p className="text-xs text-slate-400">Account Access Control</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to{" "}
              <strong>
                {activeToggleConfirm.is_active !== false
                  ? "deactivate"
                  : "activate"}
              </strong>{" "}
              the doctor account for{" "}
              <strong className="text-slate-900">
                Dr. {activeToggleConfirm.name}
              </strong>{" "}
              ({activeToggleConfirm.email})?
              {activeToggleConfirm.is_active !== false
                ? " The doctor will be unable to log in and their open slots will be paused."
                : " The doctor will regain full access to their dashboard and appointments."}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveToggleConfirm(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActiveToggle}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition flex items-center gap-1.5 ${
                  activeToggleConfirm.is_active !== false
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                } disabled:opacity-50`}
              >
                {actionLoading && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {activeToggleConfirm.is_active !== false
                    ? "Confirm Suspension"
                    : "Confirm Activation"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDoctors;
