import React, { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  HelpCircle, 
  RefreshCw,
  Sparkles,
  Link2,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";

export const Settings: React.FC = () => {
  const { user, updateUserCalendarStatus } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedEvents, setSyncedEvents] = useState<any[]>([]);
  const [intelligenceData, setIntelligenceData] = useState<any>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  const fetchIntelligence = async () => {
    if (!user?.googleCalendarConnected) return;
    setIsLoadingEvents(true);
    const token = localStorage.getItem("dg_token");
    try {
      const res = await fetch("/api/calendar/intelligence", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSyncedEvents(data.events || []);
        setIntelligenceData(data);
      }
    } catch (e) {
      console.error("Failed to fetch calendar intelligence:", e);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  React.useEffect(() => {
    if (user?.googleCalendarConnected) {
      fetchIntelligence();
    } else {
      setSyncedEvents([]);
      setIntelligenceData(null);
    }
  }, [user?.googleCalendarConnected]);

  React.useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = localStorage.getItem("dg_token");
        try {
          const meRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            updateUserCalendarStatus(
              meData.user.googleCalendarConnected,
              meData.user.googleEmail,
              meData.user.googleLastSync
            );
            showNotification("Google Calendar connected successfully!", "success");
          }
        } catch (e) {
          console.error("Failed to check status", e);
        }
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        showNotification("Google Calendar authentication failed.", "error");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [updateUserCalendarStatus]);

  const handleConnectCalendar = async () => {
    try {
      const token = localStorage.getItem("dg_token");
      const res = await fetch("/api/calendar/auth/url", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get auth URL");
      }
      const data = await res.json();
      if (!data.url) {
        throw new Error("No URL returned from server");
      }

      const width = 600;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        "google-calendar-auth",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      // Poll to check if user has successfully connected
      const checkInterval = setInterval(async () => {
        if (popup && popup.closed) {
          clearInterval(checkInterval);
          // Refresh profile to verify connection status
          try {
            const meRes = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              updateUserCalendarStatus(
                meData.user.googleCalendarConnected,
                meData.user.googleEmail,
                meData.user.googleLastSync
              );
            }
          } catch (e) {
            console.error("Failed to check updated status", e);
          }
        }
      }, 1500);
    } catch (e: any) {
      console.error("Failed to connect calendar:", e);
      showNotification(e.message || "Failed to initiate calendar connection.", "error");
    }
  };

  const handleSwitchAccount = async () => {
    setIsSyncing(true);
    const token = localStorage.getItem("dg_token");
    try {
      const res = await fetch("/api/calendar/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        updateUserCalendarStatus(false, null, null);
        setSyncedEvents([]);
        setIntelligenceData(null);
        showNotification("Switching accounts... Please select another Google Account.", "success");
        // Wait briefly for disconnect state to register and trigger connect popup
        setTimeout(() => {
          handleConnectCalendar();
        }, 600);
      }
    } catch (e) {
      console.error(e);
      showNotification("Failed to disconnect for switching accounts.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    const token = localStorage.getItem("dg_token");
    try {
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        await fetchIntelligence();
        showNotification(`Successfully synchronized ${data.count || 0} calendar events with pacing calculations!`, "success");
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to synchronize");
      }
    } catch (e: any) {
      console.error(e);
      showNotification("Calendar synchronization failed: " + e.message, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectConfirm = async () => {
    setIsSyncing(true);
    setShowDisconnectModal(false);
    const token = localStorage.getItem("dg_token");
    try {
      const res = await fetch("/api/calendar/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        updateUserCalendarStatus(false);
        setSyncedEvents([]);
        setIntelligenceData(null);
        showNotification("Calendar successfully disconnected.", "success");
      }
    } catch (e) {
      console.error(e);
      showNotification("Failed to disconnect calendar connection.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16 text-left font-sans select-none relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
          notification.type === "success" 
            ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300" 
            : "bg-red-950/90 border-red-500/30 text-red-300"
        }`}>
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-white/10 rounded transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1 bg-gradient-to-r from-indigo-950/20 to-indigo-900/10 p-5 rounded-2xl border border-indigo-500/10">
        <h2 className="text-xl font-black text-slate-100 tracking-tight">Calendar Integrations Panel</h2>
        <p className="text-xs text-[#94A3B8]">Synchronize calendar events to calculate capacity conflicts and protect deadlines</p>
      </div>

      {/* Connection Card */}
      <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-950/20 pb-5">
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 bg-indigo-950/50 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider font-sans">Google Calendar Synchronizer</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Detect flights, vacations, exam days, and client meetings</p>
            </div>
          </div>
          
          <div>
            {user?.googleCalendarConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-950 text-slate-500 border border-slate-800">
                Disconnected
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            By connecting Google Calendar, the dynamic Pacing Engine can automatically retrieve event timelines to identify days with capacity leaks. The AI agent will skip scheduling intensive task goals on days where overlapping travel or multi-hour meetings are detected.
          </p>

          {user?.googleCalendarConnected && (
            <div className="p-4 bg-[#060A14] border border-indigo-950/40 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row justify-between gap-1 sm:items-center text-xs">
                <span className="text-[#94A3B8]">Connected Google Account:</span>
                <span className="font-mono text-slate-200 bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-500/10">
                  {user.googleEmail || "Loading..."}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-1 sm:items-center text-xs">
                <span className="text-[#94A3B8]">Last Sync Time:</span>
                <span className="font-mono text-slate-300">
                  {user.googleLastSync 
                    ? new Date(user.googleLastSync).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })
                    : "Not synchronized yet"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-1 sm:items-center text-xs">
                <span className="text-[#94A3B8]">Sync Status:</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active & Synced
                </span>
              </div>
            </div>
          )}

          <div className="p-4 bg-indigo-950/10 border border-indigo-950/40 rounded-xl">
            <div className="flex gap-2 text-xs">
              <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-[#94A3B8] leading-normal">
                <span className="font-semibold text-slate-200">Security Credentials Shield:</span> Your Google OAuth credentials are encrypted and stored securely server-side. We request write permissions to synchronize study plan tasks directly to your Google Calendar and keep them automatically aligned.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {user?.googleCalendarConnected ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleSyncCalendar}
                  disabled={isSyncing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 animate-in fade-in"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  Sync Calendar Now
                </button>
                <button
                  onClick={handleSwitchAccount}
                  disabled={isSyncing}
                  className="bg-amber-600/15 hover:bg-amber-600/30 text-amber-400 border border-amber-500/20 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all text-center animate-in fade-in"
                >
                  Switch Google Account
                </button>
                <button
                  onClick={() => setShowDisconnectModal(true)}
                  disabled={isSyncing}
                  className="bg-red-600/15 hover:bg-red-600/30 text-red-400 border border-red-500/20 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all text-center animate-in fade-in"
                >
                  Disconnect Calendar Link
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectCalendar}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 animate-in fade-in"
              >
                <Link2 className="w-4 h-4" />
                Authenticate Google Calendar
              </button>
            )}
          </div>
        </div>

        {/* Sync Status/Data Viewer */}
        {user?.googleCalendarConnected && (
          <div className="pt-6 border-t border-indigo-950/20 space-y-4">
            <h4 className="text-xs font-mono tracking-wider uppercase text-[#94A3B8]">Active Calendar Constraints (Synced)</h4>
            
            {isLoadingEvents ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                Retrieving synchronized calendar events...
              </div>
            ) : syncedEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {syncedEvents.map((event, idx) => {
                  let badgeColor = "bg-indigo-950/40 text-indigo-400 border-indigo-500/20";
                  if (event.type === "travel") badgeColor = "bg-amber-950/40 text-amber-400 border-amber-500/20";
                  if (event.type === "exam") badgeColor = "bg-red-950/40 text-red-400 border-red-500/20";
                  if (event.type === "meeting") badgeColor = "bg-sky-950/40 text-sky-400 border-sky-500/20";
                  if (event.type === "work_deadline") badgeColor = "bg-emerald-950/40 text-emerald-400 border-emerald-500/20";

                  return (
                    <div key={event.id || idx} className="p-3.5 rounded-xl bg-[#060A14] border border-indigo-950/40 flex flex-col justify-between space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-xs text-slate-200 line-clamp-1">{event.title}</span>
                        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${badgeColor} flex-shrink-0`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>{new Date(event.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span>{event.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-1">No active constraints detected in your calendar for the next 30 days.</p>
            )}

            {intelligenceData && (
              <div className="p-4 bg-indigo-950/10 border border-indigo-500/10 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-300">Pacing Capacity Impact</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{intelligenceData.impactAnalysis?.capacityReducedText || "No major capacity impact."}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono font-bold text-indigo-400">{intelligenceData.totalConflictHours || 0} hrs lost</p>
                  <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Total conflicts</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Documentation Info Panel */}
      <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 space-y-4">
        <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider font-sans border-b border-indigo-950/20 pb-2">Calendar Capacity FAQ</h4>
        
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-200">What happens on days with calendar conflicts?</span>
            <p className="text-slate-400 leading-relaxed">
              When the AI decomposes goals into phased checklists, it maps remaining effort against your daily hour limitations. 
              On days with verified conflict metadata, the AI shifts target checklist tasks forward or backward automatically, 
              protecting you from burnout and preventing deadline slips.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-200">Can I configure manual constraints?</span>
            <p className="text-slate-400 leading-relaxed">
              Yes. If you choose not to link your Google account, you can easily configure manual schedule blocks (such as exams or travel) 
              inside the Goal Configuration wizard during step-by-step commitment planning.
            </p>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0D1527] border border-indigo-950 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 border-b border-indigo-950/40 pb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider font-sans">Disconnect Calendar</h3>
                <p className="text-[11px] text-[#94A3B8] font-mono">Remove active sync integration</p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Are you sure you want to disconnect Google Calendar integration? Your synchronized events and active schedule conflicts will be removed. Manual constraints set during plan creation will still apply.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDisconnectModal(false)}
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-[#94A3B8] hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnectConfirm}
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-lg shadow-red-950/30"
              >
                {isSyncing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Disconnect
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
