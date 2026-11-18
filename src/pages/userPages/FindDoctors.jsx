import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ApiServece from "../../API/ApiServece";
import { AuthContext } from "../../authContext";
import {
  Search,
  Stethoscope,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Briefcase,
  BadgeCheck,
  AlertCircle,
  X,
  ChevronRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const FindDoctors = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");

  // Schedule Modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Booking Flow State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingReason, setBookingReason] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch approved doctors with available slots
  const fetchDoctors = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await ApiServece.getApprovedDoctors();
      const list = response?.data || response?.doctors || [];
      setDoctors(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(
        err.response?.data?.msg ||
          "Failed to load doctors list. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
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

  const formatDateLabel = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      if (d.toDateString() === today.toDateString()) {
        return "Today";
      } else if (d.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow";
      }
      return d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatFullDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
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

  const getDuration = (start, end) => {
    try {
      const mins = Math.round((new Date(end) - new Date(start)) / (1000 * 60));
      return mins > 0 ? `${mins} mins` : null;
    } catch {
      return null;
    }
  };

  // Only show doctors who have at least 1 slot with status === "available"
  const doctorsWithAvailableSlots = useMemo(() => {
    return doctors.filter((doc) => {
      const slots = doc.doctorProfile?.availabilitySlots || [];
      return slots.some((s) => s.status === "available");
    });
  }, [doctors]);

  // Extract all unique specializations from available doctors
  const specializations = useMemo(() => {
    const set = new Set();
    doctorsWithAvailableSlots.forEach((doc) => {
      const spec = doc.doctorProfile?.specialization;
      if (spec) set.add(spec.trim());
    });
    return Array.from(set);
  }, [doctorsWithAvailableSlots]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return doctorsWithAvailableSlots.filter((doc) => {
      const profile = doc.doctorProfile || {};
      const name = doc.name || "";
      const spec = profile.specialization || "";
      const address = profile.clinicAddress || "";

      // Search match
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        spec.toLowerCase().includes(query) ||
        address.toLowerCase().includes(query);

      // Specialization match
      const matchesSpec =
        selectedSpecialization === "all" ||
        spec.toLowerCase() === selectedSpecialization.toLowerCase();

      return matchesSearch && matchesSpec;
    });
  }, [doctorsWithAvailableSlots, searchTerm, selectedSpecialization]);

  // Helper to group doctor's slots by date for modal view
  const groupSlotsByDate = (slots = []) => {
    const groups = {};
    const availableSlots = slots.filter((s) => s.status === "available");

    availableSlots.forEach((slot) => {
      const dateKey = new Date(slot.start_time).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          rawDate: slot.start_time,
          slots: [],
        };
      }
      groups[dateKey].slots.push(slot);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].slots.sort(
        (a, b) => new Date(a.start_time) - new Date(b.start_time),
      );
    });

    return groups;
  };

  // Start booking flow for a selected slot
  const handleOpenBooking = (doc, slot) => {
    setBookingDoctor(doc);
    setBookingSlot(slot);
    setBookingReason("");
    setBookingError("");
    setBookingSuccess(null);

    // Generate unique idempotency key for this booking session to avoid duplicate submissions
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36);
    const key = `book_${user?.id || "u"}_slot${slot.id}_${timePart}_${randomPart}`;
    setIdempotencyKey(key);
  };

  // Confirm and submit booking with idempotency approach
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDoctor || !bookingSlot) return;

    try {
      setBookingLoading(true);
      setBookingError("");

      const doctorProfileId =
        bookingDoctor.doctorProfile?.id || bookingDoctor.id;
      const fee =
        bookingDoctor.doctorProfile?.consultationFee !== undefined
          ? bookingDoctor.doctorProfile.consultationFee
          : 500;

      const response = await ApiServece.bookAppointment(
        {
          doctorId: doctorProfileId,
          slotId: bookingSlot.id,
          reason: bookingReason.trim() || "General Consultation",
          consultationFee: fee,
        },
        idempotencyKey,
      );

      setBookingSuccess(response?.data || response || true);

      // Silently refresh doctors to remove the now booked slot
      fetchDoctors(true);
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(
        err.response?.data?.msg ||
          "Unable to confirm booking. This slot may have already been reserved by another patient.",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Stethoscope className="w-6 h-6" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Doctors With Available Slots
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Browse approved specialists ready for consultation, view their
              open appointment times, and select a slot to book immediately.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDoctors(true)}
              disabled={refreshing || loading}
              title="Refresh Doctors"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>

            <button
              onClick={() => navigate("/userdashboard/appointments")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition"
            >
              <Calendar className="w-4 h-4" />
              My Appointments
            </button>
          </div>
        </div>

        {/* Search & Specialty Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or clinic location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
          </div>

          {/* Specialization Filter Pills */}
          {specializations.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1 flex-shrink-0 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Specialty:
              </span>

              <button
                onClick={() => setSelectedSpecialization("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex-shrink-0 ${
                  selectedSpecialization === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Specialties
              </button>

              {specializations.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialization(spec)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex-shrink-0 ${
                    selectedSpecialization.toLowerCase() === spec.toLowerCase()
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
                <div className="h-24 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">
              Unable to Load Doctors
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {error}
            </p>
            <button
              onClick={() => fetchDoctors()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No Doctors With Available Slots
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {doctorsWithAvailableSlots.length === 0
                ? "There are currently no doctors who have open availability slots. Please check back later."
                : "No available doctors match your search or specialty filters. Try clearing your search."}
            </p>
            {(searchTerm || selectedSpecialization !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSpecialization("all");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Doctor Cards Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDoctors.map((doc) => {
              const profile = doc.doctorProfile || {};
              const allSlots = profile.availabilitySlots || [];
              const availableSlots = allSlots.filter(
                (s) => s.status === "available",
              );
              const previewSlots = availableSlots.slice(0, 3);
              const remainingCount =
                availableSlots.length - previewSlots.length;

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6">
                    {/* Top Row: Avatar & Primary Info */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-blue-200 flex-shrink-0">
                          {doc.name ? doc.name.charAt(0).toUpperCase() : "D"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-800 hover:text-blue-600 transition">
                              Dr. {doc.name}
                            </h3>
                            <BadgeCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          </div>

                          <p className="text-sm font-medium text-blue-600 mt-0.5">
                            {profile.specialization || "General Physician"}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            {profile.experience && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                {profile.experience} Years Exp.
                              </span>
                            )}
                            {profile.qualification && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                {profile.qualification}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Consultation Fee Pill */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-slate-400 block font-medium">
                          Fee
                        </span>
                        <span className="text-base font-bold text-slate-800">
                          {profile.consultationFee
                            ? `₹${profile.consultationFee}`
                            : "₹500"}
                        </span>
                      </div>
                    </div>

                    {/* Clinic Address & Bio */}
                    {profile.clinicAddress && (
                      <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {profile.clinicAddress}
                        </span>
                      </div>
                    )}

                    {profile.bio && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {profile.bio}
                      </p>
                    )}

                    {/* Available Times Section */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Available Time Slots
                          </span>
                        </div>

                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {availableSlots.length} Open{" "}
                          {availableSlots.length === 1 ? "Slot" : "Slots"}
                        </span>
                      </div>

                      {/* Slots List / Preview */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {previewSlots.map((slot) => {
                            const duration = getDuration(
                              slot.start_time,
                              slot.end_time,
                            );
                            return (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/70 rounded-xl transition text-xs group"
                              >
                                <div>
                                  <span className="font-semibold text-emerald-800 block">
                                    {formatDateLabel(slot.start_time)}
                                  </span>
                                  <span className="text-slate-600 font-medium">
                                    {formatTime(slot.start_time)} -{" "}
                                    {formatTime(slot.end_time)}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleOpenBooking(doc, slot)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] shadow-xs transition"
                                >
                                  Book
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {remainingCount > 0 && (
                          <button
                            onClick={() => setSelectedDoctor(doc)}
                            className="text-xs text-blue-600 hover:underline font-medium block w-full text-center pt-1"
                          >
                            +{remainingCount} more slots available (View Full
                            Schedule)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Consultation: In-Person / Clinic
                    </span>

                    <button
                      onClick={() => setSelectedDoctor(doc)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95"
                    >
                      <span>View Schedule & Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Doctor Schedule Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  {selectedDoctor.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-800 text-base">
                      Dr. {selectedDoctor.name}
                    </h3>
                    <BadgeCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-600 font-medium">
                    {selectedDoctor.doctorProfile?.specialization ||
                      "General Physician"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">
                    Qualification
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedDoctor.doctorProfile?.qualification || "MBBS"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Experience
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedDoctor.doctorProfile?.experience
                      ? `${selectedDoctor.doctorProfile.experience} Years`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Consultation Fee
                  </span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {selectedDoctor.doctorProfile?.consultationFee
                      ? `₹${selectedDoctor.doctorProfile.consultationFee}`
                      : "₹500"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Status
                  </span>
                  <span className="font-semibold text-blue-600 mt-0.5 block">
                    Approved Specialist
                  </span>
                </div>
              </div>

              {/* Bio & Clinic */}
              <div className="space-y-3">
                {selectedDoctor.doctorProfile?.clinicAddress && (
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Clinic Address: </strong>
                      {selectedDoctor.doctorProfile.clinicAddress}
                    </span>
                  </div>
                )}

                {selectedDoctor.doctorProfile?.bio && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      About the Doctor
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-xl">
                      {selectedDoctor.doctorProfile.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Full Available Slots Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-800">
                      All Available Consultation Times
                    </h4>
                  </div>
                </div>

                {(() => {
                  const grouped = groupSlotsByDate(
                    selectedDoctor.doctorProfile?.availabilitySlots || [],
                  );
                  const dateKeys = Object.keys(grouped);

                  if (dateKeys.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">
                          No open slots currently available
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          This doctor has not opened any appointment slots at
                          this time.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {dateKeys.map((dateKey) => {
                        const group = grouped[dateKey];
                        return (
                          <div
                            key={dateKey}
                            className="border border-slate-200 rounded-xl overflow-hidden"
                          >
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                              <span>{formatFullDate(group.rawDate)}</span>
                              <span className="text-slate-400 font-normal">
                                {group.slots.length} available
                              </span>
                            </div>

                            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                              {group.slots.map((slot) => {
                                const duration = getDuration(
                                  slot.start_time,
                                  slot.end_time,
                                );
                                return (
                                  <div
                                    key={slot.id}
                                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                        <span>
                                          {formatTime(slot.start_time)} -{" "}
                                          {formatTime(slot.end_time)}
                                        </span>
                                      </div>
                                      {duration && (
                                        <span className="text-[11px] text-slate-400 ml-5 block mt-0.5">
                                          {duration} consultation
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => {
                                        setSelectedDoctor(null);
                                        handleOpenBooking(selectedDoctor, slot);
                                      }}
                                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                                    >
                                      Book Now
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal (With Idempotency Control) */}
      {bookingSlot && bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Confirm Appointment Booking
                  </h3>
                  <p className="text-xs text-slate-400">
                    Instant & duplicate-safe booking
                  </p>
                </div>
              </div>

              {!bookingLoading && (
                <button
                  onClick={() => {
                    setBookingSlot(null);
                    setBookingDoctor(null);
                    setBookingSuccess(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {bookingSuccess ? (
              /* Success State */
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Appointment Booked Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Your appointment with{" "}
                    <strong>Dr. {bookingDoctor.name}</strong> on{" "}
                    <strong>{formatFullDate(bookingSlot.start_time)}</strong> at{" "}
                    <strong>{formatTime(bookingSlot.start_time)}</strong> has
                    been confirmed.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1 text-left max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Specialist:</span>
                    <span className="font-semibold">
                      Dr. {bookingDoctor.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-emerald-700">
                      ₹{bookingDoctor.doctorProfile?.consultationFee || 500}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-semibold text-emerald-700">
                      Confirmed
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setBookingSlot(null);
                      setBookingDoctor(null);
                      setBookingSuccess(null);
                      navigate("/userdashboard/appointments");
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-200 transition"
                  >
                    <span>View in My Appointments</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setBookingSlot(null);
                      setBookingDoctor(null);
                      setBookingSuccess(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
                {bookingError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Selected Doctor & Slot Summary */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/80 space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-slate-400 block">Doctor</span>
                      <span className="font-bold text-slate-800 text-sm">
                        Dr. {bookingDoctor.name}
                      </span>
                      <span className="text-blue-600 block font-medium">
                        {bookingDoctor.doctorProfile?.specialization ||
                          "General Physician"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block">
                        Consultation Fee
                      </span>
                      <span className="text-base font-bold text-emerald-700">
                        ₹{bookingDoctor.doctorProfile?.consultationFee || 500}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {formatFullDate(bookingSlot.start_time)}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {formatTime(bookingSlot.start_time)} -{" "}
                      {formatTime(bookingSlot.end_time)}
                    </span>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Reason for Visit / Symptoms (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    placeholder="e.g., General health checkup, persistent headache, fever..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  ></textarea>
                </div>

                {/* Idempotency Safe Notice */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Secured with duplicate-prevention idempotency. You will
                    never be charged twice for this slot.
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={bookingLoading}
                    onClick={() => {
                      setBookingSlot(null);
                      setBookingDoctor(null);
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-200 transition disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Confirming Booking...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Booking</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindDoctors;
