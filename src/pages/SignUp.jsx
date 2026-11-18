import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  Stethoscope,
  ArrowRight,
  Shield,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import AppLogo from "../Componets/AppLogo";

const SignUp = () => {
  const navigate = useNavigate();

  const [signUp, setSignUp] = useState({
    userName: "",
    email: "",
    password: "",
    phone: "",
    role: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Eye toggle visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toast notification state: { type: 'success' | 'error' | 'warning', title: '', message: '' }
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast notification after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  const handleChnage = (e) => {
    const { name, value } = e.target;
    setSignUp((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCertificates = (e) => {
    setCertificates(Array.from(e.target.files));
  };

  // Email format regex: must strictly end with .com (e.g. name@example.com)
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/i;

  const isEmailEntered = signUp.email.trim().length > 0;
  const isEmailValid = isEmailEntered && EMAIL_REGEX.test(signUp.email.trim());
  const isEmailInvalid = isEmailEntered && !isEmailValid;

  // Password comparison status
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === signUp.password;
  const isPasswordMismatch =
    confirmPassword.length > 0 && confirmPassword !== signUp.password;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    const trimmedName = signUp.userName.trim();
    const trimmedEmail = signUp.email.trim();
    const trimmedPhone = signUp.phone.trim();

    // 1. Required fields validation
    if (!trimmedName) {
      showToast(
        "error",
        "Name Required",
        "Please enter your full name or username.",
      );
      return;
    }

    if (!trimmedEmail) {
      showToast("error", "Email Required", "Please enter your email address.");
      return;
    }

    // Strict email format validation - must strictly end with .com
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      showToast(
        "error",
        "Invalid Email",
        "Invalid email format. Email must fully end with .com (e.g. name@example.com).",
      );
      return;
    }

    // 2. Password length must be at least 6 characters
    if (!signUp.password) {
      showToast(
        "error",
        "Password Required",
        "Please enter a password for your account.",
      );
      return;
    }

    if (signUp.password.length < 6) {
      showToast(
        "error",
        "Password Too Short",
        "Password must be at least 6 characters long.",
      );
      return;
    }

    // 3. Re-enter password comparison validation
    if (!confirmPassword) {
      showToast(
        "error",
        "Confirm Password Required",
        "Please re-enter your password to confirm.",
      );
      return;
    }

    if (signUp.password !== confirmPassword) {
      showToast(
        "error",
        "Passwords Do Not Match",
        "The re-entered password does not match the original password. Please make sure both are identical.",
      );
      return;
    }

    // 4. Phone validation
    if (!trimmedPhone) {
      showToast(
        "error",
        "Phone Number Required",
        "Please enter your contact phone number.",
      );
      return;
    }

    // 5. Role selection validation
    if (!signUp.role) {
      showToast(
        "error",
        "Role Required",
        "Please select your account role (User, Doctor, or Admin).",
      );
      return;
    }

    // 6. Doctor certificate validation
    if (signUp.role === "doctor" && certificates.length === 0) {
      showToast(
        "error",
        "Medical Certificate Required",
        "Doctor accounts require uploading at least one medical certificate or qualification document.",
      );
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("userName", trimmedName);
      formData.append("email", trimmedEmail);
      formData.append("password", signUp.password);
      formData.append("phone", trimmedPhone);
      formData.append("role", signUp.role);

      certificates.forEach((file) => {
        formData.append("certificates", file);
      });

      const response = await axios.post(
        "http://localhost:3000/api/v1/user/signup",
        formData,
      );

      console.log("Signup response:", response.data);

      if (response.data.response_code === 200 || response.status === 200) {
        // Success Toast
        let successMsg =
          "Your account has been created successfully! Redirecting to login...";
        if (signUp.role === "doctor") {
          successMsg =
            "Your doctor registration has been submitted and is pending administrator verification. Redirecting to login...";
        } else if (signUp.role === "admin") {
          successMsg =
            "Administrator account created successfully! Redirecting to login...";
        }

        showToast("success", "Account Created Successfully!", successMsg);

        // Allow 1.5 seconds for user to see the success toast before redirecting
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (error) {
      setLoading(false);
      console.error("Signup error:", error);

      const serverMsg = error.response?.data?.msg || error.message || "";
      const isServerEmailInvalid =
        error.response?.data?.invalidEmail ||
        serverMsg.toLowerCase().includes("invalid email");

      const isEmailAlreadyExists =
        error.response?.data?.emailExists ||
        serverMsg.toLowerCase().includes("already exist") ||
        serverMsg.toLowerCase().includes("already registered") ||
        serverMsg.toLowerCase().includes("already in use");

      // Invalid email toast
      if (isServerEmailInvalid) {
        showToast(
          "error",
          "Invalid Email",
          "Invalid email format. Email must fully end with .com (e.g. name@example.com).",
        );
      }
      // Email already in database toast
      else if (isEmailAlreadyExists) {
        showToast(
          "error",
          "Email Already Exists",
          "This email is already in the database. Please sign in or use a different email address.",
        );
      } else {
        showToast(
          "error",
          "Registration Failed",
          serverMsg ||
            "Unable to complete registration. Please check your information and try again.",
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 py-8 relative">
      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all ${
              toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-500/10"
                : toast.type === "warning"
                  ? "bg-amber-50/95 border-amber-300 text-amber-900 shadow-amber-500/10"
                  : "bg-rose-50/95 border-rose-300 text-rose-900 shadow-rose-500/10"
            }`}
          >
            {/* Toast Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              {toast.type === "warning" && (
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              {toast.type === "error" && (
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Toast Content */}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm font-bold capitalize">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-black/5 flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Sign Up Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <AppLogo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Join our platform to book consultations or provide healthcare
            services
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="userName"
                value={signUp.userName}
                placeholder="Dr. John Doe / Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                onChange={handleChnage}
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              {isEmailEntered && (
                <span
                  className={`text-[11px] font-medium transition ${
                    isEmailValid ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {isEmailValid ? "✓ Valid (.com)" : "✕ Must end with .com"}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="email"
                value={signUp.email}
                placeholder="name@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                  isEmailEntered
                    ? isEmailValid
                      ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      : "border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                }`}
                onChange={handleChnage}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {isEmailInvalid && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Please fully type your email ending with .com (e.g.
                name@example.com)
              </p>
            )}
          </div>

          {/* Password Field (Must be at least 6 characters) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <span
                className={`text-[11px] font-medium transition ${
                  signUp.password.length >= 6
                    ? "text-emerald-600"
                    : signUp.password.length > 0
                      ? "text-rose-500"
                      : "text-slate-400"
                }`}
              >
                {signUp.password.length >= 6
                  ? "✓ Minimum 6 characters met"
                  : "Min. 6 characters required"}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={signUp.password}
                placeholder="Create password (at least 6 characters)"
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                  signUp.password.length > 0 && signUp.password.length < 6
                    ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                }`}
                onChange={handleChnage}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-500" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
            {signUp.password.length > 0 && signUp.password.length < 6 && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Password must be character length six (currently{" "}
                {signUp.password.length})
              </p>
            )}
          </div>

          {/* Re-enter Password Field (Comparison with original password) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Re-enter Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                placeholder="Re-enter your password"
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      : "border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                }`}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition"
                title={showConfirmPassword ? "Hide password" : "Show password"}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-500" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>

            {/* Real-time comparison feedback */}
            {confirmPassword.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
                {passwordsMatch ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    Passwords match
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Passwords do not match (invalid)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                name="phone"
                value={signUp.phone}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                onChange={handleChnage}
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Register As
            </label>
            <div className="relative">
              <select
                name="role"
                id="user"
                value={signUp.role}
                onChange={handleChnage}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                disabled={loading}
              >
                <option value="">Select Role</option>
                <option value="user">Patient / User</option>
                <option value="doctor">Doctor / Specialist</option>
                <option value="admin">Administrator / Admin</option>
              </select>
            </div>
          </div>

          {/* Admin Role Privileges Note */}
          {signUp.role === "admin" && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-indigo-950">
                  Administrator Account
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Grants full administrative privileges for platform oversight,
                  user & doctor management, commission configuration, and system
                  access.
                </p>
              </div>
            </div>
          )}

          {/* Doctor Certificates Upload */}
          {signUp.role === "doctor" && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Medical Certificates & Licenses
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload your degree certificates or medical registration
                documents for administrator verification.
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleCertificates}
                disabled={loading}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl bg-white p-1"
              />
              {certificates.length > 0 && (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {certificates.length} certificate file(s) attached
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              isEmailInvalid ||
              (confirmPassword.length > 0 && isPasswordMismatch)
            }
            className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer / Login Link */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
