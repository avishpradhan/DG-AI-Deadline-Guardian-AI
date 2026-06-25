import React, { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { Shield, Key, Mail, User as UserIcon, Lock, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface LoginProps {
  setPage: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ setPage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { login, signup, error, clearError, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    clearError();
    setValidationError(null);
  }, [isLogin, clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      setPage("dashboard");
    }
  }, [isAuthenticated, setPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !password) {
      setValidationError("All fields are required");
      return;
    }
    if (!isLogin && !name) {
      setValidationError("Name is required for registration");
      return;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    if (isLogin) {
      const success = await login(email, password);
      if (success) setPage("dashboard");
    } else {
      const success = await signup(name, email, password);
      if (success) setPage("dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#060A14] flex relative overflow-hidden font-sans select-none">
      {/* Background radial overlays */}
      <div className="absolute top-0 left-0 w-1/2 h-[600px] bg-radial from-indigo-500/10 via-transparent to-transparent opacity-80" />
      <div className="absolute right-0 bottom-0 w-1/2 h-[600px] bg-radial from-emerald-500/5 via-transparent to-transparent opacity-80" />

      {/* Split Left Column - Value Propositions (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10 border-r border-indigo-950/20 bg-[#060A14]/30">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/50 rounded-xl border border-indigo-500/30">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="font-sans font-extrabold tracking-tight text-xl text-slate-100">
            Deadline Guardian <span className="text-indigo-400 font-semibold text-xs px-1.5 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-500/20 ml-1">AI</span>
          </span>
        </div>

        {/* Feature list */}
        <div className="max-w-md my-auto space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-slate-100 font-sans">
              Shield your timelines from silent leaks.
            </h1>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Decompose critical commitments into daily, capacity-aware checklists, and let AI analyze calendars to protect your deadlines.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-1 rounded-full bg-indigo-950/50 border border-indigo-500/30">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">Timeline Capacity Guardian</h3>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                  Decomposes projects, exams, or launch schedules into targeted actions matching daily hourly bandwidth.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-1 rounded-full bg-emerald-950/50 border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">Calendar Leak Mitigation</h3>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                  Calculates lost timeline hours due to travel, meetings, and interviews, keeping forecasts 100% realistic.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-1 rounded-full bg-amber-950/50 border border-amber-500/30">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">Automated Deadline Rescue</h3>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                  When tasks lag behind, our Recovery Agent automatically restructures and compresses checklists to restore pacing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Console Footnote */}
        <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400/80" />
          Powered by Gemini 3.5 Pacing Models
        </div>
      </div>

      {/* Split Right Column - Authentication Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#0A0F1E]/50 border border-indigo-950/30 backdrop-blur-xl shadow-2xl relative">
          
          {/* Logo on mobile only */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <Shield className="w-7 h-7 text-indigo-400" />
            <span className="font-sans font-bold text-lg text-slate-100">Deadline Guardian AI</span>
          </div>

          <div className="space-y-2 mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
              {isLogin ? "Access Console" : "Create Account"}
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {isLogin 
                ? "Enter credentials to load synchronized pacing forecasts" 
                : "Register credentials to activate deadline protection engines"
              }
            </p>
          </div>

          {/* Errors display */}
          {(error || validationError) && (
            <div className="p-3 bg-red-950/30 border border-red-500/25 rounded-xl text-red-300 text-xs flex items-start gap-2.5 mb-5 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>{validationError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono tracking-wider uppercase text-[#94A3B8]">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#060A14] border border-indigo-950/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-wider uppercase text-[#94A3B8]">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#060A14] border border-indigo-950/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-wider uppercase text-[#94A3B8]">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#060A14] border border-indigo-950/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  {isLogin ? "Authenticate console" : "Generate active key"}
                </>
              )}
            </button>
          </form>

          {/* Toggle Button */}
          <div className="mt-6 text-center text-xs">
            <span className="text-[#94A3B8]">{isLogin ? "New to Deadline Guardian?" : "Already registered?"}</span>{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer ml-1 underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
