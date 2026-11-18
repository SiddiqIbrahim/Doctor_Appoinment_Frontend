import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ApiServece from "../API/ApiServece";
import AppLogo from "../Componets/AppLogo";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(true);
  const [tokenErrorMsg, setTokenErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // Verify token validity on initial mount
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenValid(false);
        setTokenErrorMsg("Reset token is missing from the link.");
        setVerifying(false);
        return;
      }

      try {
        setVerifying(true);
        await ApiServece.verifyResetToken(token);
        setTokenValid(true);
      } catch (err) {
        console.warn("Token pre-check failed:", err);
        setTokenValid(false);
        setTokenErrorMsg(
          err.response?.data?.msg ||
            "This password reset link is invalid or has expired. Please request a new one.",
        );
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (loading || !tokenValid) return;

    if (!password) {
      showToast(
        "error",
        "Password Required",
        "Please enter your new password.",
      );
      return;
    }

    if (password.length < 6) {
      showToast(
        "error",
        "Password Too Short",
        "Your password must be at least 6 characters long.",
      );
      return;
    }

    if (!confirmPassword) {
      showToast(
        "error",
        "Confirmation Required",
        "Please confirm your new password.",
      );
      return;
    }

    if (password !== confirmPassword) {
      showToast(
        "error",
        "Passwords Do Not Match",
        "The new password and confirm password fields must match exactly.",
      );
      return;
    }

    try {
      setLoading(true);
      const res = await ApiServece.resetPassword(
        token,
        password,
        confirmPassword,
      );

      setIsSuccess(true);
      showToast(
        "success",
        "Password Reset Successful",
        res?.msg || "Your password has been reset! Redirecting to login...",
      );

      // Smooth auto-redirect after success
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Password reset failed:", err);
      const errorMsg =
        err.response?.data?.msg ||
        "Unable to reset your password. The link may have expired or is invalid.";
      showToast("error", "Reset Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all ${
              toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-300 text-emerald-900"
                : "bg-rose-50/95 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm font-bold capitalize">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <AppLogo size="lg" showText={false} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>Secure Password Reset</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Enter and confirm your new password to regain access to your
            account.
          </p>
        </div>

        {verifying ? (
          /* Verifying Token Skeleton Loader */
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Verifying reset token security...
            </p>
          </div>
        ) : !tokenValid ? (
          /* Invalid or Expired Token State */
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-800">
                Link Expired or Invalid
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                {tokenErrorMsg ||
                  "This password reset link is invalid, has already been used, or has expired."}
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <Link
                to="/forgot-password"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Request a New Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          /* Password Successfully Changed State */
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-800">
                Password Reset Complete!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Your password has been successfully updated. Redirecting you to
                the sign in page...
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Sign In Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Reset Password Form */
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  disabled={loading}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Password must be a minimum of 6 characters
              </p>
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
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

              {/* Real-time Match Indicator */}
              {confirmPassword && (
                <p
                  className={`text-[11px] mt-1 font-medium ${
                    password === confirmPassword
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {password === confirmPassword
                    ? "✓ Passwords match"
                    : "✕ Passwords do not match"}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading ||
                !password ||
                password.length < 6 ||
                password !== confirmPassword
              }
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back to Login Link */}
            <div className="pt-2 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}

        {/* Security Footer Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Single-use token with automatic invalidation</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
