import React, { useEffect, useState } from "react";
import { useGoalStore } from "../stores/goalStore";
import { useAuthStore } from "../stores/authStore";
import { 
  ShieldAlert, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Compass, 
  Calendar,
  Flame,
  ArrowRight,
  Activity,
  Award,
  X
} from "lucide-react";
import { Goal, Task } from "../types";

interface DashboardProps {
  setPage: (page: string) => void;
  setSelectedGoalId: (id: string) => void;
}

const formatToShortDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
};

const getCategoryEmoji = (category: string) => {
  switch (category) {
    case "exam_prep": return "📚";
    case "job_interview": return "💼";
    case "project": return "💻";
    case "skill_learning": return "🎓";
    case "work_deadline": return "🏢";
    case "personal_commitment": return "🤝";
    case "business_startup": return "🚀";
    case "event_planning": return "📅";
    default: return "🎯";
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ setPage, setSelectedGoalId }) => {
  const { goals, fetchGoals } = useGoalStore();
  const { user } = useAuthStore();
  
  const [dismissedGoals, setDismissedGoals] = useState<string[]>([]);
  const [stats, setStats] = useState<{
    healthScore: number;
    activeRisks: number;
    activeDeadlines: number;
    tasksCompleted: number;
    priorityRankings: Array<{
      goal: Goal;
      score: number;
      urgency: number;
      risk: number;
      priorityWeight: number;
      effort: number;
    }>;
  } | null>(null);

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeTabGoalId, setActiveTabGoalId] = useState<string>("");
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);

  const fetchDashboardStats = async () => {
    setIsLoadingStats(true);
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        
        // Pick first active goal as active tab
        const activeGoals = data.priorityRankings?.map((r: any) => r.goal) || [];
        if (activeGoals.length > 0) {
          setActiveTabGoalId(activeGoals[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadTodayTasks = async () => {
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch("/api/goals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const activeGoalsList: Goal[] = data.goals || [];
        const allTasks: Task[] = [];
        
        // Loop through and load tasks for active goals
        for (const g of activeGoalsList) {
          if (g.status === "active") {
            const taskRes = await fetch(`/api/goals/${g.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (taskRes.ok) {
              const taskData = await taskRes.json();
              const tasks: Task[] = taskData.tasks || [];
              
              // Get tasks due today or pending
              const todayStr = new Date().toISOString().split("T")[0];
              const todayOrPending = tasks.filter(t => t.dueDate <= todayStr && t.status !== "completed");
              allTasks.push(...todayOrPending);
            }
          }
        }
        setTodayTasks(allTasks);
      }
    } catch (e) {
      console.error("Failed to load tasks for today's workspace", e);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchDashboardStats();
    loadTodayTasks();
  }, [fetchGoals]);

  const activeGoals = goals.filter(g => g.status === "active");
  
  // Goals currently behind pacing (high priority rescue candidates)
  const rescueGoals = goals.filter(g => g.status === "active" && g.intelligence?.forecastStatus === "behind_schedule");

  const activeTabGoal = activeGoals.find(g => g.id === activeTabGoalId);

  const getRelativeDaysText = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    return `${days} day${days !== 1 ? "s" : ""} left`;
  };

  const handleTaskCheckOff = async (task: Task) => {
    const token = useAuthStore.getState().token;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/progress/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalId: task.goalId,
          date: todayStr,
          completedTasks: [task.id],
          blockerNote: "",
        }),
      });

      if (res.ok) {
        // Reload dashboard stats and checklists
        fetchDashboardStats();
        loadTodayTasks();
        fetchGoals();
      }
    } catch (e) {
      console.error("Failed to complete task", e);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Time-Aware Hello & AI Welcome Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/20 to-indigo-900/10 border border-indigo-500/10 backdrop-blur-xl">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-100 font-sans tracking-tight">
            Greetings, {user?.name || "Developer"}
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Deadline Guardian Console active. Ready to monitor capacity shifts.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-950/40 px-4 py-2.5 rounded-xl border border-indigo-500/15">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <div className="text-left">
            <span className="block text-[11px] font-mono text-indigo-300 tracking-wider uppercase">Guardian Advice</span>
            <span className="text-xs text-[#94A3B8]">
              {rescueGoals.length > 0 
                ? " Pacing leaks detected. Run Recovery Agent to restructure lag." 
                : " Timelines stable. Keep checking checklists daily to guard velocity."
              }
            </span>
          </div>
        </div>
      </div>

      {/* Immediate Rescue Panel (Behind schedule alerts) */}
      {rescueGoals
        .filter((g) => !dismissedGoals.includes(g.id))
        .map((g) => {
          const projectedDate = g.intelligence?.predictedCompletionDate || g.deadline;
          const deadlineDate = g.deadline;
          const delay = g.intelligence ? Math.max(0, -g.intelligence.daysAheadOrBehind) : 0;
          const delayText = `${Math.round(delay)} day${Math.round(delay) !== 1 ? "s" : ""}`;
          const prob = g.intelligence?.successProbability || 50;

          return (
            <div 
              key={g.id}
              className="p-5 rounded-2xl bg-[#0F1424]/60 border border-amber-500/30 flex flex-col gap-4 relative overflow-hidden backdrop-blur-md"
            >
              <button
                onClick={() => setDismissedGoals([...dismissedGoals, g.id])}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-all cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-2.5 items-center relative z-10 text-amber-500 font-sans font-extrabold tracking-tight text-xs uppercase">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse" />
                <span>Forecast Intervention Required</span>
              </div>

              <div className="relative z-10 -mt-1">
                <h4 className="text-base font-black text-slate-100 tracking-tight">{g.title}</h4>
              </div>

              {/* Metrics row inside the banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#060A14]/90 border border-[#1E293B]/40 relative z-10">
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block mb-1">Projected Completion</span>
                  <span className="text-sm font-black text-rose-400">{formatToShortDate(projectedDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block mb-1">Deadline Date</span>
                  <span className="text-sm font-black text-slate-100">{formatToShortDate(deadlineDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block mb-1">Estimated Delay</span>
                  <span className="text-sm font-black text-rose-400">{delayText}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block mb-1">Success Probability</span>
                  <span className="text-sm font-black text-amber-400">{prob}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 relative z-10 leading-relaxed max-w-2xl">
                AI recommends initiating Deadline Rescue to realign milestones and secure delivery.
              </p>

              <div className="relative z-10 flex justify-start -mt-1">
                <button
                  onClick={() => {
                    setSelectedGoalId(g.id);
                    setPage("replan");
                  }}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer group"
                >
                  Initiate AI Deadline Rescue
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}

      {/* IMMEDIATE RESCUE REQUIRED SECTION */}
      {rescueGoals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <h2 className="text-sm sm:text-base font-black text-rose-400 tracking-wider uppercase font-sans flex items-center gap-2">
              Immediate Rescue Required
            </h2>
            <span className="bg-rose-950/60 text-rose-400 border border-rose-500/20 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
              {rescueGoals.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rescueGoals.map((g) => {
              const delay = g.intelligence ? Math.max(0, -g.intelligence.daysAheadOrBehind) : 0;
              const delayText = `${Math.round(delay)} day${Math.round(delay) !== 1 ? "s" : ""} behind schedule.`;
              const prob = g.intelligence?.successProbability || 50;

              return (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl bg-[#0B0F19]/60 border border-red-500/10 flex flex-col justify-between min-h-[140px] hover:border-red-500/20 transition-all backdrop-blur-md relative"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryEmoji(g.category)}</span>
                      <h3 className="text-base font-black text-slate-100 tracking-tight">{g.title}</h3>
                    </div>
                    <div className="text-xs text-slate-400">
                      Projected delay: <span className="font-bold text-red-400">{delayText}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-900/40">
                    <span className="text-xs text-slate-500 font-mono">
                      Probability: {prob}%
                    </span>
                    <button
                      onClick={() => {
                        setSelectedGoalId(g.id);
                        setPage("replan");
                      }}
                      className="text-[#F59E0B] hover:text-amber-300 font-sans font-bold text-xs cursor-pointer transition-colors"
                    >
                      Rescue Plan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-[#0A0F1E]/40 border border-indigo-950/20 backdrop-blur-md hover:border-indigo-500/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono tracking-wider uppercase text-[#94A3B8]">Decision Health</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-sans text-slate-100">{stats?.healthScore || 100}%</span>
            <span className="text-[10px] font-mono text-emerald-400">Stable</span>
          </div>
          <div className="mt-3 w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-500" 
              style={{ width: `${stats?.healthScore || 100}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-[#0A0F1E]/40 border border-indigo-950/20 backdrop-blur-md hover:border-indigo-500/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono tracking-wider uppercase text-[#94A3B8]">Active Risks</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-sans text-slate-100">{stats?.activeRisks || 0}</span>
            <span className="text-[10px] font-mono text-amber-400">Goals Late</span>
          </div>
          <div className="mt-3 w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: stats?.activeRisks && stats.activeDeadlines ? `${(stats.activeRisks / stats.activeDeadlines) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-[#0A0F1E]/40 border border-indigo-950/20 backdrop-blur-md hover:border-indigo-500/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono tracking-wider uppercase text-[#94A3B8]">Active Deadlines</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-sans text-slate-100">{stats?.activeDeadlines || 0}</span>
            <span className="text-[10px] font-mono text-indigo-400">Active</span>
          </div>
          <div className="mt-3 w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-500" 
              style={{ width: stats?.activeDeadlines ? "100%" : "0%" }}
            />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-[#0A0F1E]/40 border border-indigo-950/20 backdrop-blur-md hover:border-indigo-500/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono tracking-wider uppercase text-[#94A3B8]">Streak Stats</span>
            <Flame className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-sans text-slate-100">{stats?.tasksCompleted || 0}</span>
            <span className="text-[10px] font-mono text-emerald-400">Completed</span>
          </div>
          <div className="mt-3 w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: "100%" }}
            />
          </div>
        </div>

      </div>

      {/* Main Grid: Focus priority advisor, checklist & strategic insight tab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2/3 Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Active Decision Insight Tab */}
          <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-950/30 pb-4 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">Active Strategic Insight</h3>
                <p className="text-[11px] text-[#94A3B8]">Strategic intelligence generated by Gemini Decision Models</p>
              </div>
              
              {/* Tab options based on active goals */}
              {activeGoals.length > 0 && (
                <div className="flex gap-2 bg-[#060A14] p-1.5 rounded-lg border border-indigo-950/50">
                  {activeGoals.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setActiveTabGoalId(g.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        activeTabGoalId === g.id 
                          ? "bg-indigo-950/80 text-indigo-300 border border-indigo-500/20" 
                          : "text-[#94A3B8] hover:text-slate-100"
                      }`}
                    >
                      {g.title.slice(0, 12)}...
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab content display */}
            {activeTabGoal ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Forecast status block */}
                  <div className="p-4 bg-[#060A14]/70 rounded-xl border border-indigo-950/35 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono tracking-wider uppercase text-[#94A3B8] block mb-1">Pacing Forecast</span>
                      <p className="text-xs text-slate-200">
                        {activeTabGoal.aiDecisionInsight?.goalForecast || "Calculating forecast metrics..."}
                      </p>
                    </div>
                    {activeTabGoal.intelligence && (
                      <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full mt-3 self-start ${
                        activeTabGoal.intelligence.forecastStatus === "behind_schedule"
                          ? "bg-red-950/40 text-red-400 border border-red-500/20"
                          : "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {activeTabGoal.intelligence.forecastStatus.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  {/* Recommendation action block */}
                  <div className="p-4 bg-[#060A14]/70 rounded-xl border border-indigo-950/35 flex flex-col justify-between col-span-2">
                    <div>
                      <span className="text-[9px] font-mono tracking-wider uppercase text-[#94A3B8] block mb-1">Recommended Action</span>
                      <p className="text-xs text-slate-200 font-medium">
                        {activeTabGoal.aiDecisionInsight?.highestImpactAction?.action || "Follow daily checklists to safeguard pacing."}
                      </p>
                    </div>
                    {activeTabGoal.aiDecisionInsight?.highestImpactAction && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-indigo-400 font-semibold font-mono">
                        <span>Odds Shift:</span>
                        <span>{activeTabGoal.aiDecisionInsight.highestImpactAction.beforeProbability}%</span>
                        <span>→</span>
                        <span className="text-emerald-400">{activeTabGoal.aiDecisionInsight.highestImpactAction.afterProbability}%</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Bullets of strategic reasons */}
                {activeTabGoal.aiDecisionInsight?.confidenceReasons && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#94A3B8]">Key Pacing Observations</span>
                    <ul className="space-y-2">
                      {activeTabGoal.aiDecisionInsight.confidenceReasons.slice(0, 3).map((r, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Link to detail */}
                <div className="flex justify-end pt-2 border-t border-indigo-950/20">
                  <button
                    onClick={() => {
                      setSelectedGoalId(activeTabGoal.id);
                      setPage("goal-detail");
                    }}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer"
                  >
                    Open Goal Control Center
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center">
                <Compass className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
                <p className="text-xs text-[#94A3B8]">No active goals analyzed. Complete a commitment plan to load insights.</p>
                <button
                  onClick={() => setPage("create-goal")}
                  className="mt-4 inline-block bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Create Commitment Plan
                </button>
              </div>
            )}

          </div>

          {/* Section: Today's Execution Checklist */}
          <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md">
            <div className="flex items-center justify-between mb-5 border-b border-indigo-950/20 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">Today's Workspace Checklist</h3>
                <p className="text-[11px] text-[#94A3B8]">Action items scheduled for today across all goals</p>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {todayTasks.length} Pending
              </span>
            </div>

            {todayTasks.length > 0 ? (
              <div className="space-y-2.5">
                {todayTasks.map((t) => {
                  const parentGoal = goals.find(g => g.id === t.goalId);
                  return (
                    <div 
                      key={t.id} 
                      className="p-3.5 rounded-xl bg-[#060A14]/65 border border-indigo-950/30 flex items-center justify-between gap-4 hover:border-indigo-500/10 transition-all"
                    >
                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => handleTaskCheckOff(t)}
                          className="w-5 h-5 rounded border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/10 flex items-center justify-center cursor-pointer flex-shrink-0"
                        >
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm opacity-0 hover:opacity-100 transition-all" />
                        </button>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-200">{t.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                            <span className="text-indigo-400 font-medium">@{parentGoal?.title.slice(0, 16)}</span>
                            <span>•</span>
                            <span>Est: {t.estimatedHours}h</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 px-2.5 py-0.5 rounded-full border border-amber-500/15">
                        Due Today
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center bg-[#060A14]/30 rounded-xl border border-dashed border-indigo-950/30">
                <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-medium">All systems clear. Checklists completely cleared!</p>
                <p className="text-[10px] text-slate-600 mt-1">Excellent work. Pacing is fully locked in.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right 1/3 Sidebar Column */}
        <div className="space-y-8">
          
          {/* Focus priority advisor */}
          <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md">
            <h3 className="text-sm font-black text-slate-100 font-sans tracking-tight mb-1">Focus priority advisor</h3>
            <p className="text-[10px] text-[#94A3B8] border-b border-indigo-950/20 pb-3 mb-4">Goals sorted by dynamic focus weight</p>
            
            {stats?.priorityRankings && stats.priorityRankings.length > 0 ? (
              <div className="space-y-3">
                {stats.priorityRankings.slice(0, 3).map((item, idx) => (
                  <div 
                    key={item.goal.id}
                    onClick={() => {
                      setSelectedGoalId(item.goal.id);
                      setPage("goal-detail");
                    }}
                    className="p-3 bg-[#060A14]/50 rounded-xl border border-indigo-950/30 hover:border-indigo-500/20 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="text-left space-y-1">
                      <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">Rank #{idx+1}</span>
                      <span className="text-xs font-semibold text-slate-200 block">{item.goal.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">Urgency: {item.urgency} | Risk: {item.risk}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-500/15">
                        {item.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#94A3B8] text-center py-6">No active timelines registered.</p>
            )}
          </div>

          {/* My Commitments List */}
          <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md">
            <h3 className="text-sm font-black text-slate-100 font-sans tracking-tight mb-1">My active commitments</h3>
            <p className="text-[10px] text-[#94A3B8] border-b border-indigo-950/20 pb-3 mb-4">Timeline tracking profiles</p>

            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((g) => (
                  <div 
                    key={g.id}
                    onClick={() => {
                      setSelectedGoalId(g.id);
                      setPage(g.status === "planning" ? "replan" : "goal-detail");
                    }}
                    className="space-y-2.5 cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-all">{g.title}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{getRelativeDaysText(g.deadline)}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full ${
                        g.riskScore === "high"
                          ? "bg-red-950/40 text-red-400 border border-red-500/20"
                          : (g.riskScore === "medium" ? "bg-amber-950/40 text-amber-400 border border-amber-500/20" : "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20")
                      }`}>
                        {g.riskScore || "stable"}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {g.progress && (
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            g.riskScore === "high" ? "bg-red-500" : "bg-indigo-500"
                          }`}
                          style={{ width: `${(g.progress.completed / (g.progress.total || 1)) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#94A3B8] text-center py-6">Commitments database is currently empty.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
