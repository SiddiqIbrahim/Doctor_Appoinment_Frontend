import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserLayout from "./layouts/UserLayout";
import FindDoctors from "./pages/userPages/FindDoctors";
import AuthProvider from "./authContext";
import AdminDashboard from "./pages/adminPage/AdminDashboard";
import DoctorApprovels from "./pages/adminPage/DoctorApprovels";
import DoctorProfile from "./pages/docterPages/DoctorProfile";
import Availability from "./pages/docterPages/Availability";
import UserProfile from "./pages/userPages/UserProfile";
import Appoinment from "./pages/userPages/Appoinment";
import MyPatients from "./pages/docterPages/MyPatients";
import UserPrescription from "./pages/userPages/userPrescription";
import ManageUser from "./pages/adminPage/ManageUser";
import ManageDoctors from "./pages/adminPage/ManageDoctors";
import Commision from "./pages/adminPage/Commision";
import AdminProfile from "./pages/adminPage/AdminProfile";
import NewAdmin from "./pages/adminPage/NewAdmin";
import UserNotifications from "./pages/userPages/UserNotifications";
import SettingPage from "./pages/adminPage/SettingPage";
import { SettingsProvider } from "./context/SettingsContext";
import UserDashboard from "./pages/userPages/UserDashboard";
import DoctorDashboard from "./pages/docterPages/DoctorDashboard";

const App = () => {
  return (
    <div>
      <SettingsProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/userdashboard" element={<UserLayout />}>
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="doctors" element={<FindDoctors />} />
              <Route path="userProfile" element={<UserProfile />} />
              <Route path="appointments" element={<Appoinment />} />
              <Route path="userPrescription" element={<UserPrescription />} />
              <Route path="notification" element={<UserNotifications />} />
              <Route path="notifications" element={<UserNotifications />} />
            </Route>

            <Route path="/doctordashboard" element={<UserLayout />}>
              <Route index element={<DoctorDashboard />} />
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="doctordashboard" element={<DoctorDashboard />} />
              <Route path="myprofile" element={<DoctorProfile />} />
              <Route path="availability" element={<Availability />} />
              <Route path="mypatientas" element={<MyPatients />} />
              <Route path="mypatients" element={<MyPatients />} />
              <Route path="patients" element={<MyPatients />} />
            </Route>

            <Route path="/admindashboard" element={<UserLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="admindashboard" element={<AdminDashboard />} />
              <Route path="approvels" element={<DoctorApprovels />} />
              <Route path="manageusers" element={<ManageUser />} />
              <Route path="managedoctors" element={<ManageDoctors />} />
              <Route path="commision" element={<Commision />} />
              <Route path="adminprofile" element={<AdminProfile />} />
              <Route path="newadmin" element={<NewAdmin />} />
              <Route path="settings" element={<SettingPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </SettingsProvider>
    </div>
  );
};

export default App;
