import axios from "axios";

const APIURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getDocterList = async () => {
  try {
    const response = await axios.get(`${APIURL}/doctor/getDoctor`);
    return response.data;
  } catch (error) {
    console.error("Error in getDocterList:", error);
    throw error;
  }
};

const getApprovedDoctors = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/doctor/approvedDoctors`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getApprovedDoctors:", error);
    throw error;
  }
};

const approvelStatus = async (id, status) => {
  try {
    const response = await axios.put(`${APIURL}/approvel/status/${id}`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error("Error in approvelStatus:", error);
    throw error;
  }
};

const getDoctor = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/doctor/getDoctorData`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getDoctor:", error);
    throw error;
  }
};

const updateDoctor = async (formdata) => {
  try {
    const response = await axios.post(
      `${APIURL}/doctor/updateDoctor`,
      formdata,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in updateDoctor:", error);
    throw error;
  }
};

const getAvailability = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/doctor/availability`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getAvailability:", error);
    throw error;
  }
};

const createAvailability = async (slotData) => {
  try {
    const response = await axios.post(
      `${APIURL}/doctor/availability`,
      slotData,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in createAvailability:", error);
    throw error;
  }
};

const deleteAvailability = async (id) => {
  try {
    const response = await axios.delete(
      `${APIURL}/doctor/availability/${id}`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in deleteAvailability:", error);
    throw error;
  }
};

const getUserProfile = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/user/getUser`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    throw error;
  }
};

const updateUserProfile = async (userData) => {
  try {
    const response = await axios.put(
      `${APIURL}/user/updateUser`,
      userData,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    throw error;
  }
};

const bookAppointment = async (bookingData, idempotencyKey) => {
  try {
    const headers = getAuthHeaders().headers;
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const response = await axios.post(
      `${APIURL}/appointment/book`,
      { ...bookingData, idempotencyKey },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.error("Error in bookAppointment:", error);
    throw error;
  }
};

const getMyAppointments = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/appointment/my-appointments`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getMyAppointments:", error);
    throw error;
  }
};

const rescheduleAppointment = async (id, newSlotId) => {
  try {
    const response = await axios.put(
      `${APIURL}/appointment/reschedule/${id}`,
      { newSlotId },
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in rescheduleAppointment:", error);
    throw error;
  }
};

const getDoctorAvailableSlots = async (doctorId) => {
  try {
    const response = await axios.get(
      `${APIURL}/appointment/doctor-slots/${doctorId}`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getDoctorAvailableSlots:", error);
    throw error;
  }
};

const getDoctorPatients = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/doctor/myPatients`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getDoctorPatients:", error);
    throw error;
  }
};

const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await axios.put(
      `${APIURL}/doctor/appointment-status/${appointmentId}`,
      { status },
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in updateAppointmentStatus:", error);
    throw error;
  }
};

const createOrUpdatePrescription = async (prescriptionData) => {
  try {
    const response = await axios.post(
      `${APIURL}/prescription/add`,
      prescriptionData,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in createOrUpdatePrescription:", error);
    throw error;
  }
};

const getPrescriptionByAppointment = async (appointmentId) => {
  try {
    const response = await axios.get(
      `${APIURL}/prescription/appointment/${appointmentId}`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getPrescriptionByAppointment:", error);
    throw error;
  }
};

const getUserPrescriptions = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/prescription/my-prescriptions`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getUserPrescriptions:", error);
    throw error;
  }
};

const getAdminUsers = async () => {
  try {
    const response = await axios.get(`${APIURL}/admin/users`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error in getAdminUsers:", error);
    throw error;
  }
};

const toggleAdminUserStatus = async (userId) => {
  try {
    const response = await axios.put(
      `${APIURL}/admin/users/${userId}/status`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in toggleAdminUserStatus:", error);
    throw error;
  }
};

const deleteAdminUser = async (userId) => {
  try {
    const response = await axios.delete(
      `${APIURL}/admin/users/${userId}`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in deleteAdminUser:", error);
    throw error;
  }
};

const getAdminDoctors = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/admin/doctors`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getAdminDoctors:", error);
    throw error;
  }
};

const updateDoctorApproval = async (doctorProfileId, status) => {
  try {
    const response = await axios.put(
      `${APIURL}/admin/doctor/${doctorProfileId}/approval`,
      { status },
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in updateDoctorApproval:", error);
    throw error;
  }
};

const toggleDoctorActive = async (userId) => {
  try {
    const response = await axios.put(
      `${APIURL}/admin/doctor/${userId}/status`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in toggleDoctorActive:", error);
    throw error;
  }
};

const getAdminCommission = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/admin/commission`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getAdminCommission:", error);
    throw error;
  }
};

const updateAdminCommission = async (admin_fee) => {
  try {
    const response = await axios.post(
      `${APIURL}/admin/commission`,
      { admin_fee },
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in updateAdminCommission:", error);
    throw error;
  }
};

const getAdminProfile = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/admin/profile`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getAdminProfile:", error);
    throw error;
  }
};

const updateAdminProfile = async (profileData) => {
  try {
    const response = await axios.put(
      `${APIURL}/admin/profile`,
      profileData,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in updateAdminProfile:", error);
    throw error;
  }
};

const getAllAdmins = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/admin/admins`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getAllAdmins:", error);
    throw error;
  }
};

const createAdmin = async (adminData) => {
  try {
    const response = await axios.post(
      `${APIURL}/admin/add-admin`,
      adminData,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in createAdmin:", error);
    throw error;
  }
};

const toggleAdminStatus = async (adminId) => {
  try {
    const response = await axios.put(
      `${APIURL}/admin/admin-status/${adminId}`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in toggleAdminStatus:", error);
    throw error;
  }
};

const getAdminDashboardStats = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/admin/dashboard-stats`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getAdminDashboardStats:", error);
    throw error;
  }
};

const getUserNotifications = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/user/notifications`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    throw error;
  }
};

const getUnreadNotificationStatus = async () => {
  try {
    const response = await axios.get(
      `${APIURL}/user/notifications/unread-status`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in getUnreadNotificationStatus:", error);
    throw error;
  }
};

const markNotificationsRead = async (id = null) => {
  try {
    const response = await axios.put(
      `${APIURL}/user/notifications/mark-read`,
      id ? { id } : {},
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in markNotificationsRead:", error);
    throw error;
  }
};

const clearAllNotifications = async () => {
  try {
    const response = await axios.delete(
      `${APIURL}/user/notifications`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in clearAllNotifications:", error);
    throw error;
  }
};

const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(
      `${APIURL}/user/notifications/${notificationId}`,
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    throw error;
  }
};

const getApplicationSettings = async () => {
  try {
    const response = await axios.get(`${APIURL}/settings`);
    return response.data;
  } catch (error) {
    console.error("Error in getApplicationSettings:", error);
    throw error;
  }
};

const uploadApplicationLogo = async (formData) => {
  try {
    const headers = getAuthHeaders().headers;
    const response = await axios.post(`${APIURL}/admin/upload-logo`, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in uploadApplicationLogo:", error);
    throw error;
  }
};

const updateApplicationName = async (appName) => {
  try {
    const response = await axios.put(
      `${APIURL}/admin/settings/app-name`,
      { appName },
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error in updateApplicationName:", error);
    throw error;
  }
};

const forgotPassword = async (email) => {
  const baseAuthUrl = APIURL.replace(/\/v1$/, "") + "/auth";
  try {
    const response = await axios.post(`${baseAuthUrl}/forgot-password`, {
      email,
    });
    return response.data;
  } catch (error) {
    try {
      const response = await axios.post(`${APIURL}/auth/forgot-password`, {
        email,
      });
      return response.data;
    } catch (fallbackError) {
      console.error("Error in forgotPassword:", fallbackError);
      throw fallbackError;
    }
  }
};

const verifyResetToken = async (token) => {
  const baseAuthUrl = APIURL.replace(/\/v1$/, "") + "/auth";
  try {
    const response = await axios.get(
      `${baseAuthUrl}/verify-reset-token/${token}`,
    );
    return response.data;
  } catch (error) {
    try {
      const response = await axios.get(
        `${APIURL}/auth/verify-reset-token/${token}`,
      );
      return response.data;
    } catch (fallbackError) {
      console.error("Error in verifyResetToken:", fallbackError);
      throw fallbackError;
    }
  }
};

const resetPassword = async (token, password, confirmPassword) => {
  const baseAuthUrl = APIURL.replace(/\/v1$/, "") + "/auth";
  try {
    const response = await axios.post(
      `${baseAuthUrl}/reset-password/${token}`,
      {
        password,
        confirmPassword,
      },
    );
    return response.data;
  } catch (error) {
    try {
      const response = await axios.post(
        `${APIURL}/auth/reset-password/${token}`,
        {
          password,
          confirmPassword,
        },
      );
      return response.data;
    } catch (fallbackError) {
      console.error("Error in resetPassword:", fallbackError);
      throw fallbackError;
    }
  }
};

const ApiServece = {
  getDocterList,
  getApprovedDoctors,
  approvelStatus,
  updateDoctor,
  getDoctor,
  doctorAvailble: createAvailability,
  getAvailability,
  createAvailability,
  deleteAvailability,
  getUserProfile,
  updateUserProfile,
  getUser: getUserProfile,
  updateUser: updateUserProfile,
  bookAppointment,
  getMyAppointments,
  rescheduleAppointment,
  getDoctorAvailableSlots,
  getDoctorPatients,
  updateAppointmentStatus,
  createOrUpdatePrescription,
  getPrescriptionByAppointment,
  getUserPrescriptions,
  getAdminUsers,
  toggleAdminUserStatus,
  deleteAdminUser,
  getAdminDoctors,
  updateDoctorApproval,
  toggleDoctorActive,
  getAdminCommission,
  updateAdminCommission,
  getAdminProfile,
  updateAdminProfile,
  getAllAdmins,
  createAdmin,
  toggleAdminStatus,
  getAdminDashboardStats,
  getUserNotifications,
  getUnreadNotificationStatus,
  markNotificationsRead,
  clearAllNotifications,
  deleteNotification,
  getApplicationSettings,
  uploadApplicationLogo,
  updateApplicationName,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};

export default ApiServece;
