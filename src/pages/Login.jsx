import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  Stethoscope,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import AppLogo from "../Componets/AppLogo";

const Login = () => {
  const navigate = useNavigate();
  const { userLogin } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState({
    email: "",
    password: "",
  });

  // Toast state: { type: 'success' | 'error' | 'warning', title: '', message: '' }
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast after 4.5 seconds
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
    setLogin((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    // Validate inputs
    const trimmedEmail = login.email.trim();
    if (!trimmedEmail || !login.password) {
      showToast(
        "error",
        "Missing Credentials",
        "Please enter both your email address and password.",
      );
      return;
    }

    try {
      setLoading(true);
      const response = await userLogin(trimmedEmail, login.password);
      console.log("Login successful response:", response);

      // 1. Successful Login Toast
      showToast(
        "success",
        "Login Successful",
        `Welcome back, ${response?.name || response?.user || "User"}! Redirecting to your dashboard...`,
      );

      // Brief delay so user sees the success toast before redirecting
      setTimeout(() => {
        if (response?.role === "user") {
          navigate("/userdashboard/dashboard");
        } else if (response?.role === "doctor") {
          navigate("/doctordashboard/myprofile");
        } else if (response?.role === "admin") {
          navigate("/admindashboard/manageusers");
        } else {
          navigate("/userdashboard");
        }
      }, 1200);
    } catch (error) {
      setLoading(false);
      console.error("Login attempt failed:", error);

      const serverMsg = error.response?.data?.msg || error.message || "";
      const isNotApproved =
        error.response?.data?.notApprovedDoctor ||
        serverMsg.toLowerCase().includes("admin approve") ||
        serverMsg.toLowerCase().includes("not approved") ||
        serverMsg.toLowerCase().includes("approval");

      const isPasswordError =
        serverMsg.toLowerCase().includes("password is not correct") ||
        serverMsg.toLowerCase().includes("invalid password") ||
        serverMsg.toLowerCase().includes("incorrect password");

      const isEmailNotFound =
        serverMsg.toLowerCase().includes("email is not exists") ||
        serverMsg.toLowerCase().includes("not exist");

      // 2. Not Approved Doctor Toast
      if (isNotApproved) {
        showToast(
          "warning",
          "Doctor Approval Pending",
          "Your doctor account is not yet approved by the administrator. You can only sign in once approval is granted.",
        );
      }
      // 3. Invalid Password Toast
      else if (isPasswordError) {
        showToast(
          "error",
          "Invalid Password",
          "This password is not correct. Please verify your password and try again.",
        );
      }
      // 4. Email not found Toast
      else if (isEmailNotFound) {
        showToast(
          "error",
          "Account Not Found",
          "This email is not registered. Please enter a valid email or sign up for a new account.",
        );
      }
      // 5. Generic Error Toast
      else {
        showToast(
          "error",
          "Login Failed",
          serverMsg ||
            "Unable to sign in. Please verify your credentials and try again.",
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative">
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

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <AppLogo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Sign In
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Access your medical dashboard, appointments, and consultations
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                name="email"
                value={login.email}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                onChange={handleChnage}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field with Toggle Eye Icon */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>

              {/* Password Input: text when showPassword is true, password when false */}
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={login.password}
                placeholder="Enter your password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                onChange={handleChnage}
                disabled={loading}
                autoComplete="current-password"
              />

              {/* Eye Icon Button on the Right to toggle visibility */}
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
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer / Create Account */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
