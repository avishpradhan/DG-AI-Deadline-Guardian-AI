import React, { useEffect, useState } from "react";
import { useGoalStore } from "../stores/goalStore";
import { useAuthStore } from "../stores/authStore";
import { 
  ArrowLeft, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  Lock,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Clock
} from "lucide-react";
import { Task } from "../types";

interface RescueReplanProps {
  goalId: string;
  setPage: (page: string) => void;
}

export const RescueReplan: React.FC<RescueReplanProps> = ({ goalId, setPage }) => {
  const { currentGoal, fetchGoalDetail } = useGoalStore();
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [replanData, setReplanData] = useState<any | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const fetchRescuePlan = async () => {
    setIsLoadingPlan(true);
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch("/api/ai/replan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goalId }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplanData(data.recoveryPlan);
      }
    } catch (e) {
      console.error("Failed to load rescue recovery plan", e);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  useEffect(() => {
    if (goalId) {
      fetchGoalDetail(goalId);
      fetchRescuePlan();
    }
  }, [goalId, fetchGoalDetail]);

  const handleAcceptPlan = async () => {
    if (!replanData || !replanData.revisedTasks) return;
    
    setIsActivating(true);
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch("/api/ai/replan/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalId,
          revisedTasks: replanData.revisedTasks,
        }),
      });

      if (res.ok) {
        alert("Deadline Rescue timeline activated successfully!");
        setPage("goal-detail");
      }
    } catch (e) {
      console.error("Failed to activate rescue plan", e);
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoadingPlan || !currentGoal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs text-red-400 uppercase tracking-widest animate-pulse">Formulating Recovery Strategies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 text-left font-sans select-none">
      
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-indigo-950/20 pb-4">
        <button
          onClick={() => setPage("goal-detail")}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Control Center
        </button>
        <span className="text-[10px] font-mono text-red-400 bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-500/20">
          Rescue Workspace
        </span>
      </div>

      {/* Header and summary alert */}
      <div className="p-6 rounded-2xl bg-red-950/25 border border-red-500/35 relative overflow-hidden">
        <div className="flex gap-4 items-start relative z-10">
          <div className="p-3 bg-red-950/50 rounded-xl border border-red-500/30 text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-red-200 tracking-tight">Deadline Rescue Intervention</h2>
            <p className="text-xs text-red-300/80 leading-relaxed">
              Timelines are falling behind critical capacity levels for <span className="font-semibold text-white">"{currentGoal.title}"</span>. 
              Restructuring and compressing the remaining checklists can recover pacing and shield the deadline.
            </p>
          </div>
        </div>
      </div>

      {replanData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2/3 width) - Strategy & Proposed Timeline */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Strategy Panel */}
            <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">AI Rescue Posture & Strategy</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#060A14]/70 border border-indigo-950/45 rounded-xl space-y-1.5 text-xs">
                  <span className="text-slate-500 block font-mono text-[9px] uppercase">Salvage Posture</span>
                  <p className="text-slate-300 italic">"{replanData.message}"</p>
                </div>
                <div className="p-4 bg-[#060A14]/70 border border-[#EF4444]/15 rounded-xl space-y-1.5 text-xs">
                  <span className="text-red-400 block font-mono text-[9px] uppercase">Risk Assessment</span>
                  <p className="text-slate-300 italic">"{replanData.riskAssessment}"</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-1.5 text-xs">
                <span className="text-indigo-400 block font-mono text-[9px] uppercase">Rescue Strategy Approach</span>
                <p className="text-slate-300 leading-relaxed">{replanData.rescueStrategy}</p>
              </div>
            </div>

            {/* Revised proposed tasks */}
            <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">Proposed compressed action timeline</h3>
                <p className="text-[11px] text-[#94A3B8]">Condensed and consolidated task checklists for remaining days</p>
              </div>

              {replanData.revisedTasks && replanData.revisedTasks.length > 0 ? (
                <div className="space-y-2.5">
                  {replanData.revisedTasks.map((t: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl bg-[#060A14]/75 border border-indigo-950/30 flex items-center justify-between text-xs hover:border-red-500/20 transition-all"
                    >
                      <div className="flex gap-2.5 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-slate-200 font-bold">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
                        <span>Due: {t.dueDate}</span>
                        <span>•</span>
                        <span className="text-red-400">Est: {t.estimatedHours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#94A3B8] italic">No revised tasks found.</p>
              )}
            </div>

          </div>

          {/* Right Column (1/3 width) - Simulator & Controls */}
          <div className="space-y-8">
            
            {/* Rescue Impact Simulator */}
            <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md space-y-4 text-center">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] block text-left">Rescue Impact Simulator</h3>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                
                {/* Before */}
                <div className="p-3.5 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Pacing Odds</span>
                  <p className="text-xl font-bold text-red-400 font-mono">{replanData.successProbabilityBefore}%</p>
                  <span className="text-[9px] font-mono text-red-400 bg-red-950/30 border border-red-500/10 px-1.5 py-0.5 rounded">Lagging</span>
                </div>

                {/* After */}
                <div className="p-3.5 bg-[#060A14] border border-emerald-500/10 rounded-xl space-y-1 relative">
                  <span className="text-[9px] font-mono text-[#94A3B8] block uppercase">Recovered Odds</span>
                  <p className="text-xl font-bold text-emerald-400 font-mono">{replanData.successProbabilityAfter}%</p>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/10 px-1.5 py-0.5 rounded">Recovered</span>
                </div>

              </div>

              {/* Improvement Delta Badge */}
              <div className="p-3 bg-emerald-950/15 border border-emerald-500/10 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Restructured Improvement:</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{replanData.improvement}%
                </span>
              </div>
            </div>

            {/* Risk Drivers block */}
            {replanData.riskDrivers && (
              <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] block">Associated Pacing Drivers</h3>
                <div className="space-y-2">
                  {replanData.riskDrivers.map((d: any, idx: number) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs">
                      {d.type === "negative" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-slate-300 leading-normal">{d.factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Replan activation CTA */}
            <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md space-y-3">
              <button
                onClick={handleAcceptPlan}
                disabled={isActivating}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-red-900/30"
              >
                {isActivating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    Activate compressed timeline
                  </>
                )}
              </button>
              <button
                onClick={() => setPage("goal-detail")}
                className="w-full py-2 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                Dismiss rescue plan
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
