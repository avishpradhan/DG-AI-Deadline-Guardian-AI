import React, { useEffect, useState } from "react";
import { useGoalStore } from "../stores/goalStore";
import { useAuthStore } from "../stores/authStore";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  Target, 
  PlusCircle, 
  X,
  Award
} from "lucide-react";
import { Task } from "../types";

interface DailyCheckinProps {
  goalId: string;
  setPage: (page: string) => void;
}

export const DailyCheckin: React.FC<DailyCheckinProps> = ({ goalId, setPage }) => {
  const { currentGoal, tasks, fetchGoalDetail, checkIn, isLoading } = useGoalStore();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [blockerNote, setBlockerNote] = useState("");
  const [successResponse, setSuccessResponse] = useState<string | null>(null);

  useEffect(() => {
    if (goalId) {
      fetchGoalDetail(goalId);
    }
  }, [goalId, fetchGoalDetail]);

  if (isLoading && !currentGoal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-100">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs text-[#94A3B8]">Loading active check-in workspace...</p>
      </div>
    );
  }

  if (!currentGoal) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-[#94A3B8]">Commitment details could not be found.</p>
        <button onClick={() => setPage("dashboard")} className="text-xs text-indigo-400 font-bold underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Pending/active tasks due today or earlier
  const todayStr = new Date().toISOString().split("T")[0];
  const checkInTasks = tasks.filter((t) => t.status !== "completed");

  const handleToggleTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((tId) => tId !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split("T")[0];
    
    const data = await checkIn({
      goalId,
      date: todayStr,
      completedTasks: selectedTaskIds,
      blockerNote,
    });

    if (data && data.log) {
      setSuccessResponse(data.log.aiResponse || "Check-in logged! Continue checking off daily checklists to guard pacing.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16 font-sans text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-950/20 pb-4">
        <button
          onClick={() => setPage("goal-detail")}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Control Center
        </button>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          Daily Check-in
        </span>
      </div>

      {!successResponse ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-100 tracking-tight">Today's Workspace Logging</h2>
            <p className="text-xs text-[#94A3B8]">
              Register completed action items and impediments for <span className="font-semibold text-slate-200">"{currentGoal.title}"</span>.
            </p>
          </div>

          {/* Checklist Area */}
          <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">Identify Completed Actions</h3>
            
            {checkInTasks.length > 0 ? (
              <div className="space-y-2.5">
                {checkInTasks.slice(0, 8).map((t) => {
                  const isChecked = selectedTaskIds.includes(t.id);
                  return (
                    <div 
                      key={t.id}
                      onClick={() => handleToggleTask(t.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-indigo-950/20 border-indigo-500/30" 
                          : "bg-[#060A14]/70 border-indigo-950/40 hover:border-indigo-500/10"
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isChecked 
                            ? "border-indigo-400 bg-indigo-600 text-white" 
                            : "border-indigo-950 bg-[#060A14] text-transparent"
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className={`text-xs ${isChecked ? "line-through text-slate-400 font-medium" : "text-slate-200 font-bold"}`}>
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500">
                        <span>Due: {t.dueDate}</span>
                        <span>•</span>
                        <span>Est: {t.estimatedHours}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#94A3B8] text-center py-6 italic">No pending tasks found for check-in. Pacing is completely clear!</p>
            )}
          </div>

          {/* Impediments block */}
          <div className="p-5 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] block">Log Impediments / Blockers (Optional)</label>
            <p className="text-[10px] text-slate-500 leading-normal">
              Did you encounter any roadblocks or delays? Log them here so the AI Accountability Coach can formulate strategic solutions.
            </p>
            <textarea
              value={blockerNote}
              onChange={(e) => setBlockerNote(e.target.value)}
              placeholder="e.g. Server hosting down, or required APIs are failing."
              className="w-full h-24 bg-[#060A14]/70 border border-indigo-950/50 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Submit btn */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Log Workspace progress
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Checkin Success Feedback screen */
        <div className="p-8 rounded-2xl bg-[#0A0F1E]/50 border border-indigo-950/20 space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-950/45 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-100 tracking-tight">Check-in successfully registered!</h3>
            <p className="text-xs text-[#94A3B8]">The AI Accountability engine has compiled feedback on your progress</p>
          </div>

          {/* Coach Advice */}
          <div className="p-5 bg-indigo-950/25 border border-indigo-500/10 rounded-xl text-left space-y-2 max-w-lg mx-auto">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-wider uppercase font-bold">Accountability coach</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed italic">
              "{successResponse}"
            </p>
          </div>

          {/* Action CTA */}
          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => setPage("goal-detail")}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-all"
            >
              Return to Control Center
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
