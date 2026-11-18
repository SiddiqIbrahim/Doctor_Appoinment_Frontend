import React, { useEffect, useState } from "react";
import ApiServece from "../../API/ApiServece";

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    specialization: "",
    qualification: "",
    experience: "",
    consultationFee: "",
    clinicAddress: "",
    bio: "",
  });

  const getDoctorData = async () => {
    try {
      const response = await ApiServece.getDoctor();
      const data = response.data ?? response;

      setDoctor(data.doctor);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDoctorData();
  }, []);

  // Open modal and populate existing data
  const handleEdit = () => {
    const profile = doctor?.doctorProfile;

    setFormData({
      specialization: profile?.specialization || "",
      qualification: profile?.qualification || "",
      experience: profile?.experience || "",
      consultationFee: profile?.consultationFee || "",
      clinicAddress: profile?.clinicAddress || "",
      bio: profile?.bio || "",
    });

    setShowModal(true);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update doctor profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await ApiServece.updateDoctor(formData);

      await getDoctorData();

      setShowModal(false);

      alert("Doctor profile updated successfully!");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading profile...</div>;
  }

  if (!doctor) {
    return <div className="text-center p-10">Doctor profile not found.</div>;
  }

  const profile = doctor.doctorProfile;

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-slate-50 p-3 sm:p-5 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Doctor Profile
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your personal and professional information
            </p>
          </div>

          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            Edit Profile
          </button>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
              {doctor.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {doctor.name}
              </h2>

              <p className="text-slate-500">{profile?.specialization}</p>

              <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                {profile?.approvalStatus}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Info label="Full Name" value={doctor.name} />
            <Info label="Email Address" value={doctor.email} />
            <Info label="Phone Number" value={doctor.phone} />
            <Info label="Account Role" value={doctor.role} />
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Professional Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Info label="Specialization" value={profile?.specialization} />
            <Info label="Qualification" value={profile?.qualification} />
            <Info
              label="Experience"
              value={`${profile?.experience ?? 0} Years`}
            />
            <Info
              label="Consultation Fee"
              value={`₹${profile?.consultationFee ?? 0}`}
            />
            <Info label="Clinic Address" value={profile?.clinicAddress} />
            <Info label="Approval Status" value={profile?.approvalStatus} />
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-slate-700 mb-2">About Doctor</h3>
            <p className="text-slate-500 leading-relaxed">
              {profile?.bio || "No bio available"}
            </p>
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-5">
            Certificates
          </h2>

          {profile?.certificates?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {certificate.certificate_name}
                      </h3>

                      <p className="text-sm text-slate-500 mt-2">
                        Certificate ID: {certificate.id}
                      </p>
                    </div>

                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                      {certificate.verification_status}
                    </span>
                  </div>

                  <a
                    href={certificate.certificate_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View Certificate →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              No certificates uploaded yet.
            </p>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Edit Doctor Profile
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Update your professional details
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-red-500 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                />

                <InputField
                  label="Qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                />

                <InputField
                  label="Experience (Years)"
                  name="experience"
                  type="number"
                  value={formData.experience}
                  onChange={handleChange}
                />

                <InputField
                  label="Consultation Fee (₹)"
                  name="consultationFee"
                  type="number"
                  value={formData.consultationFee}
                  onChange={handleChange}
                />

                <div className="md:col-span-2">
                  <InputField
                    label="Clinic Address"
                    name="clinicAddress"
                    value={formData.clinicAddress}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    About Doctor
                  </label>

                  <textarea
                    name="bio"
                    rows="4"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Write something about yourself..."
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable information component
const Info = ({ label, value }) => (
  <div>
    <p className="text-sm text-slate-500 mb-1">{label}</p>
    <p className="font-semibold text-slate-800 break-words">
      {value || "Not provided"}
    </p>
  </div>
);

// Reusable input component
const InputField = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>

    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required
      min={type === "number" ? 0 : undefined}
      className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

export default DoctorProfile;
