import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ApiServece from "../API/ApiServece";
import AppLogo from "../Componets/AppLogo";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      showToast(
        "error",
        "Email Required",
        "Please enter your registered email address.",
      );
      return;
    }

    // Email format validation (must be valid email ending with .com or standard TLD)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
    if (!emailRegex.test(trimmedEmail)) {
      showToast(
        "error",
        "Invalid Email",
        "Please enter a valid email address (e.g., name@example.com).",
      );
      return;
    }

    try {
      setLoading(true);
      const res = await ApiServece.forgotPassword(trimmedEmail);

      setSubmittedEmail(trimmedEmail);
      setIsSuccess(true);
      showToast(
        "success",
        "Reset Link Sent",
        res?.msg ||
          "If an account exists with that email, a password reset link has been dispatched.",
      );
    } catch (err) {
      console.error("Forgot password request failed:", err);
      const errorMsg =
        err.response?.data?.msg ||
        "Unable to process your password reset request. Please check your connection and try again.";
      showToast("error", "Request Failed", errorMsg);
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
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <AppLogo size="lg" showText={false} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>Account Recovery</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Enter your registered email address and we will send you a secure
            link to reset your password.
          </p>
        </div>

        {isSuccess ? (
          /* Success State View */
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800">
                Check Your Email
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                If an account exists for <strong>{submittedEmail}</strong>, a
                password reset link has been dispatched.
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                ⏰ The link will expire in <strong>15 minutes</strong> for your
                security. Please check your inbox and spam folder.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Send to a different email
              </button>

              <Link
                to="/"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
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
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
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
          <span>Encrypted with SHA-256 tokens</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
