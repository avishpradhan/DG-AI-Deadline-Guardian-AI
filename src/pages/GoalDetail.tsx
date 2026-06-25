import React, { useEffect, useState } from "react";
import { useGoalStore } from "../stores/goalStore";
import { useAuthStore } from "../stores/authStore";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  CheckCircle, 
  Activity, 
  TrendingUp, 
  Award, 
  Trash2,
  ListTodo,
  Sparkles,
  Zap,
  RefreshCw,
  Sliders,
  CalendarDays,
  Target
} from "lucide-react";
import { Task } from "../types";

interface GoalDetailProps {
  goalId: string;
  setPage: (page: string) => void;
}

export const GoalDetail: React.FC<GoalDetailProps> = ({ goalId, setPage }) => {
  const { currentGoal, tasks, fetchGoalDetail, deleteGoal, completeGoal, isLoading } = useGoalStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activePhaseCollapse, setActivePhaseCollapse] = useState<Record<string, boolean>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeSummary, setCompleteSummary] = useState<{ totalDays: number; tasksCompleted: number; totalTasks: number } | null>(null);

  useEffect(() => {
    if (goalId) {
      fetchGoalDetail(goalId);
    }
  }, [goalId, fetchGoalDetail]);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const ok = await deleteGoal(goalId);
    setIsDeleting(false);
    setShowDeleteModal(false);
    if (ok) {
      setPage("dashboard");
    }
  };

  const handleCompleteClick = async () => {
    const res = await completeGoal(goalId);
    if (res && res.summary) {
      setCompleteSummary(res.summary);
      setShowCompleteModal(true);
    }
  };

  if (isLoading && !currentGoal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-100">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs text-[#94A3B8]">Loading Goal Control Center...</p>
      </div>
    );
  }

  if (!currentGoal) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-[#94A3B8]">Goal details could not be retrieved.</p>
        <button onClick={() => setPage("dashboard")} className="text-xs text-indigo-400 font-bold underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Group tasks by Phase
  const phasesMap: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    const p = t.phase || "General Timeline";
    if (!phasesMap[p]) phasesMap[p] = [];
    phasesMap[p].push(t);
  });

  const getRelativeDaysText = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    return `${days} day${days !== 1 ? "s" : ""} left`;
  };

  const progressPercent = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100)
    : 0;

  // Determine risk level coloring
  const isHighRisk = currentGoal.riskScore === "high";
  const isMedRisk = currentGoal.riskScore === "medium";
  const riskColorClass = isHighRisk 
    ? "text-red-400 border-red-500/20 bg-red-950/35"
    : (isMedRisk ? "text-amber-400 border-amber-500/20 bg-amber-950/35" : "text-emerald-400 border-emerald-500/20 bg-emerald-950/35");

  return (
    <div className="space-y-8 pb-16 text-left font-sans select-none">
      
      {/* Back navigation & Quick status */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage("dashboard")}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <span className={`text-[10px] font-mono uppercase px-3 py-1 rounded-full border ${riskColorClass}`}>
          {currentGoal.riskScore || "Stable"} risk pacing
        </span>
      </div>

      {/* Schedule Warning Banner */}
      {currentGoal.scheduleWarning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>{currentGoal.scheduleWarning}</span>
          </div>
          <button 
            onClick={async () => {
              try {
                await fetch(`/api/goals/${currentGoal.id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("dg_token")}`
                  },
                  body: JSON.stringify({ scheduleWarning: null })
                });
                fetchGoalDetail(currentGoal.id);
              } catch (e) {
                console.error(e);
              }
            }}
            className="text-[10px] font-mono uppercase bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded text-amber-300 border border-amber-500/20 cursor-pointer transition-all flex-shrink-0"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Top Row: Title & Action CTA */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-indigo-950/20 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-100 font-sans tracking-tight">{currentGoal.title}</h2>
          <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
            <span className="capitalize px-2 py-0.5 rounded bg-[#0A0F1E] border border-indigo-950/50">{currentGoal.category.replace("_", " ")}</span>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Deadline: {currentGoal.deadline}</span>
              <span>({getRelativeDaysText(currentGoal.deadline)})</span>
            </div>
          </div>
        </div>

        {currentGoal.status !== "completed" && (
          <button
            onClick={() => setPage("daily-checkin")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-indigo-600/25"
          >
            <ListTodo className="w-4 h-4" />
            Workspace Daily Check-in
          </button>
        )}
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Health Score */}
        <div className="p-4 rounded-xl bg-[#0A0F1E]/40 border border-indigo-950/20 text-left">
          <span className="text-[9px] font-mono text-[#94A3B8] uppercase block mb-1">Timeline Health</span>
          <p className="text-2xl font-black text-slate-100">{currentGoal.intelligence?.healthScore || 100}%</p>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full ${isHighRisk ? "bg-red-500" : "bg-indigo-500"}`} 
              style={{ width: `${currentGoal.intelligence?.healthScore || 100}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Success Probability */}
        <div className="p-4 rounded-xl bg-[#0A0F1E]/40 border border-indigo-950/20 text-left">
          <span className="text-[9px] font-mono text-[#94A3B8] uppercase block mb-1">Success Probability</span>
          <p className="text-2xl font-black text-slate-100">{currentGoal.intelligence?.successProbability || 85}%</p>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-emerald-500 h-full" 
              style={{ width: `${currentGoal.intelligence?.successProbability || 85}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Projected Finish */}
        <div className="p-4 rounded-xl bg-[#0A0F1E]/40 border border-indigo-950/20 text-left">
          <span className="text-[9px] font-mono text-[#94A3B8] uppercase block mb-1">Projected Finish Date</span>
          <p className="text-sm font-bold text-indigo-400 mt-1 uppercase tracking-wider">
            {currentGoal.intelligence?.predictedCompletionDate || currentGoal.deadline}
          </p>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            {currentGoal.intelligence && currentGoal.intelligence.daysAheadOrBehind < 0
              ? `${Math.abs(currentGoal.intelligence.daysAheadOrBehind)} days behind schedule`
              : "Pacing on track"
            }
          </p>
        </div>

        {/* Metric 4: Confidence Score */}
        <div className="p-4 rounded-xl bg-[#0A0F1E]/40 border border-indigo-950/20 text-left">
          <span className="text-[9px] font-mono text-[#94A3B8] uppercase block mb-1">Intelligence Confidence</span>
          <p className="text-2xl font-black text-slate-100">{currentGoal.intelligence?.confidenceScore || 40}%</p>
          <p className="text-[10px] font-mono text-slate-500 mt-2">Based on log completeness</p>
        </div>

      </div>

      {/* Progress Bar Row */}
      <div className="p-5 rounded-xl bg-[#0A0F1E]/40 border border-indigo-950/20 space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#94A3B8]">Overall checklist completion</span>
          <span className="text-indigo-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Decision Card (Decision intelligence) */}
          {currentGoal.aiDecisionInsight && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0A0F1E]/60 to-indigo-950/10 border border-indigo-500/20 space-y-5">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider font-sans">AI Decision Engine Intelligence</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#060A14] border border-indigo-950/50 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Pacing Assessment</span>
                  <p className="text-xs text-slate-300 italic">"{currentGoal.aiDecisionInsight.goalForecast}"</p>
                </div>
                <div className="p-4 bg-[#060A14] border border-indigo-950/50 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Corrective Recommendation</span>
                  <p className="text-xs text-indigo-300 font-semibold">{currentGoal.aiDecisionInsight.highestImpactAction?.action}</p>
                </div>
              </div>

              {/* Scenarios simulator */}
              {currentGoal.aiDecisionInsight.scenarios && (
                <div className="space-y-2.5 border-t border-indigo-950/20 pt-4 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Pacing Scenarios Simulation</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentGoal.aiDecisionInsight.scenarios.map((s, idx) => (
                      <div key={idx} className="p-3 bg-[#060A14]/40 border border-indigo-950/60 rounded-lg flex items-center justify-between">
                        <span className="text-slate-300">{s.name}</span>
                        <span className="font-mono font-bold text-emerald-400">{s.successProbability}% Success</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottlenecks */}
              {currentGoal.aiDecisionInsight.bottlenecks && currentGoal.aiDecisionInsight.bottlenecks.length > 0 && (
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Identified Timeline Bottlenecks</span>
                  <div className="space-y-2">
                    {currentGoal.aiDecisionInsight.bottlenecks.slice(0, 2).map((b, idx) => (
                      <div key={idx} className="p-3 bg-red-950/15 border border-red-950/30 rounded-lg flex items-center justify-between gap-4">
                        <span className="text-slate-300 font-semibold">"{b.task}"</span>
                        <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider px-2 py-0.5 rounded bg-red-950/30 border border-red-500/10">
                          Locks {b.blockedTasks} tasks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phased tasks checklist */}
          <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-950/20 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">Timeline phased tasks checklist</h3>
                <p className="text-[11px] text-[#94A3B8]">Day-by-day action timeline generated for daily checks</p>
              </div>
            </div>

            <div className="space-y-6">
              {Object.keys(phasesMap).map((phaseName) => {
                const phaseTasks = phasesMap[phaseName];
                const isCollapsed = !!activePhaseCollapse[phaseName];
                const completedCount = phaseTasks.filter((t) => t.status === "completed").length;

                return (
                  <div key={phaseName} className="space-y-3">
                    <div className="flex items-center justify-between bg-[#060A14] p-2.5 rounded-xl border border-indigo-950/30">
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{phaseName}</h4>
                        <span className="text-[9px] font-mono text-slate-500">({completedCount} / {phaseTasks.length} Completed)</span>
                      </div>
                      <button
                        onClick={() => setActivePhaseCollapse({ ...activePhaseCollapse, [phaseName]: !isCollapsed })}
                        className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold"
                      >
                        {isCollapsed ? "Expand" : "Collapse"}
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="space-y-2 pl-2 border-l-2 border-indigo-950/30">
                        {phaseTasks.map((t) => (
                          <div 
                            key={t.id} 
                            className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              t.status === "completed"
                                ? "bg-slate-900/10 border-slate-900/30 opacity-60"
                                : "bg-[#060A14]/50 border-indigo-950/35 hover:border-indigo-500/10"
                            }`}
                          >
                            <div className="flex gap-2.5 items-center">
                              <span className={`w-1.5 h-1.5 rounded-full ${t.status === "completed" ? "bg-slate-500" : "bg-indigo-400 animate-pulse"}`} />
                              <span className={`text-xs ${t.status === "completed" ? "line-through text-slate-500" : "text-slate-200 font-semibold"}`}>
                                {t.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                              <span>Due: {t.dueDate}</span>
                              <span>•</span>
                              <span>Est: {t.estimatedHours}h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
          
          {/* Calendar Overlap/Conflict Intelligence Card */}
          <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-slate-100 font-sans uppercase tracking-tight">Calendar Intelligence</h3>
            </div>
            
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Google Calendar sync aggregates flights, trip, certifications, exams, and work constraints to prevent task overlaps.
            </p>

            {currentGoal.intelligence && (
              <div className="p-3 bg-[#060A14] rounded-xl border border-indigo-950/50 space-y-3">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-500">Conflicts Detected:</span>
                  <span className="font-mono font-bold text-red-400">{currentGoal.intelligence.conflictDays} days lost</span>
                </div>
                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${Math.min(100, currentGoal.intelligence.conflictDays * 20)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal font-mono">
                  Calendar events overlap has reduced active timelines capacity.
                </p>
              </div>
            )}

            <button
              onClick={() => setPage("settings")}
              className="w-full py-2 border border-dashed border-indigo-500/25 text-indigo-300 hover:text-white rounded-xl text-xs cursor-pointer hover:border-indigo-400 transition-all text-center block"
            >
              Configure calendar synchronizer
            </button>
          </div>

          {/* Goal control actions panel */}
          <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider font-sans border-b border-indigo-950/20 pb-2">Control Center Actions</h3>
            
            {currentGoal.status !== "completed" && (
              <button
                onClick={handleCompleteClick}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-emerald-950/30"
              >
                <Award className="w-4 h-4" />
                Mark commitment as achieved
              </button>
            )}

            {currentGoal.status === "active" && currentGoal.intelligence?.forecastStatus === "behind_schedule" && (
              <button
                onClick={() => setPage("replan")}
                className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
              >
                <Zap className="w-4 h-4" />
                Trigger rescue intervention
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl py-2.5 text-xs font-semibold cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete commitment timeline
            </button>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0D1527] border border-indigo-950 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 border-b border-indigo-950/40 pb-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider font-sans">Delete Commitment</h3>
                <p className="text-[11px] text-[#94A3B8] font-mono">This action is permanent and irreversible</p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-slate-200">"{currentGoal.title}"</span>? All associated checklist tasks, calendar event metadata, and check-in history will be removed.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-[#94A3B8] hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-lg shadow-red-950/30"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Celebration Modal */}
      {showCompleteModal && completeSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0D1527] border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200 text-center relative overflow-hidden">
            {/* Ambient emerald glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-bounce">
                <Award className="w-8 h-8" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-100 uppercase tracking-wider font-sans">Commitment Achieved!</h3>
                <p className="text-xs text-emerald-400 font-mono">"{currentGoal.title}"</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-4 rounded-xl border border-indigo-950/30">
              <div className="text-center p-2">
                <p className="text-[10px] text-[#94A3B8] font-mono uppercase">Total Days Tracked</p>
                <p className="text-lg font-black text-white mt-1">{completeSummary.totalDays}</p>
              </div>
              <div className="text-center p-2 border-l border-indigo-950/30">
                <p className="text-[10px] text-[#94A3B8] font-mono uppercase">Tasks Completed</p>
                <p className="text-lg font-black text-white mt-1">
                  {completeSummary.tasksCompleted} / {completeSummary.totalTasks}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] px-2 leading-relaxed">
              Incredible work! You have held yourself accountable, navigated external scheduling conflicts, and successfully completed your commitment.
            </p>

            <button
              onClick={() => {
                setShowCompleteModal(false);
                setPage("dashboard");
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30"
            >
              <CheckCircle className="w-4 h-4" />
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
