import React, { useState } from "react";
import { useGoalStore } from "../stores/goalStore";
import { useAuthStore } from "../stores/authStore";
import { 
  PlusCircle, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Sliders, 
  CheckCircle, 
  AlertTriangle,
  Play,
  X,
  Target
} from "lucide-react";
import { Constraint, GoalEvent } from "../types";

interface CreateGoalProps {
  setPage: (page: string) => void;
  setSelectedGoalId: (id: string) => void;
}

export const CreateGoal: React.FC<CreateGoalProps> = ({ setPage, setSelectedGoalId }) => {
  const [step, setStep] = useState(1);
  const { createGoal, analyzeGoal, isLoading } = useGoalStore();

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<any>("project");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<any>("medium");

  // Step 2: Context & Capacity
  const [dailyHours, setDailyHours] = useState(3);
  const [skillLevel, setSkillLevel] = useState<any>("beginner");
  const [context, setContext] = useState("");
  
  // Custom manual constraints list
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [newConstraintType, setNewConstraintType] = useState<any>("travel");
  const [newConstraintTitle, setNewConstraintTitle] = useState("");
  const [newConstraintDate, setNewConstraintDate] = useState("");
  const [newConstraintNotes, setNewConstraintNotes] = useState("");

  // Goal Milestones list
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");

  // Loading phase messages
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [aiResult, setAIResult] = useState<any>(null);

  const loadingMessages = [
    "Analyzing commitment feasibility parameters...",
    "Synchronizing external calendar overlaps...",
    "Querying Gemini models for tactical decomposition...",
    "Decomposing deliverables into hourly daily checklists...",
    "Protecting gaps and configuring risk mitigation parameters...",
    "Completing final compilation...",
  ];

  const handleAddConstraint = () => {
    if (!newConstraintTitle || !newConstraintDate) return;
    const con: Constraint = {
      id: Math.random().toString(36).substr(2, 9),
      type: newConstraintType,
      title: newConstraintTitle,
      date: newConstraintDate,
      duration: "all-day",
      notes: newConstraintNotes,
    };
    setConstraints([...constraints, con]);
    setNewConstraintTitle("");
    setNewConstraintDate("");
    setNewConstraintNotes("");
  };

  const handleRemoveConstraint = (id: string) => {
    setConstraints(constraints.filter((c) => c.id !== id));
  };

  const handleAddEvent = () => {
    if (!newEventName || !newEventDate || !newEventTime) return;
    const ev: GoalEvent = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEventName,
      date: newEventDate,
      time: newEventTime,
    };
    setEvents([...events, ev]);
    setNewEventName("");
    setNewEventDate("");
    setNewEventTime("");
  };

  const handleRemoveEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const triggerAIAnalysis = async (goalId: string) => {
    setStep(4); // Enter Loading Phase
    
    // Cycle loading messages
    const timer = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 2800);

    try {
      const data = await analyzeGoal(goalId);
      clearInterval(timer);
      setAIResult(data);
      setStep(5); // Enter Success Phase!
    } catch (e) {
      clearInterval(timer);
      setStep(3); // Go back to review on failure
    }
  };

  const handleFinish = async () => {
    if (!title || !deadline) return;

    const goalId = await createGoal({
      title,
      category,
      deadline,
      priority,
      dailyHours,
      skillLevel,
      context,
      constraints,
      events,
    });

    if (goalId) {
      setSelectedGoalId(goalId);
      triggerAIAnalysis(goalId);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 font-sans">
      
      {/* Header (Hidden in step 4/5) */}
      {step < 4 && (
        <div className="space-y-1.5 text-center sm:text-left">
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Create Commitment Plan</h2>
          <p className="text-xs text-[#94A3B8]">Establish timeline parameters to activate dynamic AI shield trackers</p>
        </div>
      )}

      {/* Steps Indicator (Hidden in step 4/5) */}
      {step < 4 && (
        <div className="grid grid-cols-3 gap-3 border-b border-indigo-950/20 pb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="space-y-2">
              <div className={`h-1 rounded-full transition-all duration-300 ${s <= step ? "bg-indigo-500" : "bg-slate-900"}`} />
              <span className={`block text-[10px] font-mono tracking-wider uppercase text-center ${s === step ? "text-indigo-400 font-bold" : "text-slate-500"}`}>
                {s === 1 ? "1. Goal Basics" : s === 2 ? "2. Bandwidth & Context" : "3. Review & Launch"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: BASICS */}
      {step === 1 && (
        <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md space-y-6">
          
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-mono tracking-wider uppercase text-[#94A3B8] block">Commitment / Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build AWS Cloud Server or Prepare for UPSC Exams"
              className="w-full bg-[#060A14]/70 border border-indigo-950/50 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-mono tracking-wider uppercase text-[#94A3B8] block">Focus Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#060A14]/70 border border-indigo-950/50 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="project">Software Deliverables</option>
                <option value="exam_prep">Competitive Exams Prep</option>
                <option value="job_interview">Placement Prep / Interview</option>
                <option value="skill_learning">Self learning / Skill</option>
                <option value="work_deadline">Work Milestones</option>
                <option value="business_startup">Startup Launch / MVP</option>
                <option value="event_planning">Event coordination</option>
                <option value="personal_commitment">Personal goals</option>
                <option value="other">General Commitment</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-xs font-mono tracking-wider uppercase text-[#94A3B8] block">Pacing priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#060A14]/70 border border-indigo-950/50 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="low">Low - Relaxed pace</option>
                <option value="medium">Medium - Standard checks</option>
                <option value="high">High - Accelerated checks</option>
                <option value="critical">Critical - Strict daily constraints</option>
              </select>
            </div>

          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label className="text-xs font-mono tracking-wider uppercase text-[#94A3B8] block">Hard deadline target</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={deadline}
                min={todayStr}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#060A14]/70 border border-indigo-950/50 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-4 border-t border-indigo-950/10">
            <button
              onClick={() => {
                if (title && deadline) setStep(2);
              }}
              disabled={!title || !deadline}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-indigo-600/10"
            >
              Continue to Capacity
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: BANDWIDTH & CONTEXT */}
      {step === 2 && (
        <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md space-y-6">
          
          {/* Daily Capacity Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-mono tracking-wider uppercase text-[#94A3B8]">Daily active hours allocation</label>
              <span className="text-sm font-mono font-bold text-indigo-400">{dailyHours} hours/day</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-900 rounded-lg cursor-pointer h-2"
            />
            <p className="text-[10px] text-slate-500">The AI task decomposition engine will allocate hours matching this daily bandwidth capacity.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Skill Level */}
            <div className="space-y-2">
              <label className="text-xs font-mono tracking-wider uppercase text-[#94A3B8] block">Current knowledge level</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as any)}
                className="w-full bg-[#060A14]/70 border border-indigo-950/50 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="beginner">Beginner - Requires learning cushions</option>
                <option value="intermediate">Intermediate - Direct execution</option>
                <option value="advanced">Advanced - Compressed review blocks</option>
              </select>
            </div>

          </div>

          {/* Context Details */}
          <div className="space-y-2">
            <label className="text-xs font-mono tracking-wider uppercase text-[#94A3B8] block">Additional context / instructions</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Supply extra context parameters, e.g. 'Exclude exam dates' or 'Use specific framework references'."
              className="w-full h-24 bg-[#060A14]/70 border border-indigo-950/50 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Manual Constraints subform */}
          <div className="border-t border-indigo-950/30 pt-4 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200 font-sans uppercase tracking-wider">Manual schedule constraints</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Define vacation blocks, travel plans, or exams to lock tasks out of those dates.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Constraint Category</span>
                <select
                  value={newConstraintType}
                  onChange={(e) => setNewConstraintType(e.target.value)}
                  className="w-full bg-[#060A14] border border-indigo-950/50 rounded-lg p-2 text-xs text-slate-300"
                >
                  <option value="travel">Travel Trip</option>
                  <option value="exam">Exam Prep</option>
                  <option value="interview">Job Interview</option>
                  <option value="meeting">Project Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Title / Name</span>
                <input
                  type="text"
                  value={newConstraintTitle}
                  onChange={(e) => setNewConstraintTitle(e.target.value)}
                  placeholder="e.g. Flight to Goa"
                  className="w-full bg-[#060A14] border border-indigo-950/50 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Target Date</span>
                <input
                  type="date"
                  value={newConstraintDate}
                  onChange={(e) => setNewConstraintDate(e.target.value)}
                  className="w-full bg-[#060A14] border border-indigo-950/50 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddConstraint}
              className="bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
            >
              Add Constraint Block
            </button>

            {/* List constraints */}
            {constraints.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {constraints.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 bg-[#060A14] border border-indigo-950/50 px-2.5 py-1 rounded-full text-xs text-slate-300">
                    <span className="font-mono text-[9px] text-indigo-400 uppercase">[{c.type}]</span>
                    <span>{c.title} ({c.date})</span>
                    <button onClick={() => handleRemoveConstraint(c.id)} className="text-slate-500 hover:text-red-400 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-indigo-950/10">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Basics
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-all"
            >
              Review Commitment Parameters
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: REVIEW & LAUNCH */}
      {step === 3 && (
        <div className="p-6 rounded-2xl bg-[#0A0F1E]/45 border border-indigo-950/20 backdrop-blur-md space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-100 font-sans tracking-tight">Review Pacing Parameters</h3>
            <p className="text-xs text-slate-400">Confirm values to request AI-driven phased checklists</p>
          </div>

          <div className="p-4 bg-[#060A14]/70 rounded-xl border border-indigo-950/45 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">Goal Title:</span>
                <p className="text-slate-200 font-bold mt-0.5">{title}</p>
              </div>
              <div>
                <span className="text-slate-500">Target Category:</span>
                <p className="text-slate-200 font-bold mt-0.5 capitalize">{category.replace("_", " ")}</p>
              </div>
              <div>
                <span className="text-slate-500">Deadline Target:</span>
                <p className="text-indigo-400 font-bold mt-0.5">{deadline}</p>
              </div>
              <div>
                <span className="text-slate-500">Pacing priority:</span>
                <p className="text-slate-200 font-bold mt-0.5 capitalize">{priority}</p>
              </div>
              <div>
                <span className="text-slate-500">Daily Bandwidth limit:</span>
                <p className="text-slate-200 font-bold mt-0.5">{dailyHours} hours/day</p>
              </div>
              <div>
                <span className="text-slate-500">Knowledge profile:</span>
                <p className="text-slate-200 font-bold mt-0.5 capitalize">{skillLevel}</p>
              </div>
            </div>

            {constraints.length > 0 && (
              <div className="pt-2.5 border-t border-indigo-950/25 space-y-1 text-xs">
                <span className="text-slate-500 block">Manual Constraint Blocks ({constraints.length}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {constraints.map((c) => (
                    <span key={c.id} className="bg-indigo-950/30 border border-indigo-500/10 px-2 py-0.5 rounded-full text-[10px] text-slate-300">
                      {c.title} ({c.date})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-indigo-950/10">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Bandwidth Context
            </button>
            <button
              onClick={handleFinish}
              disabled={isLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Generate AI Pacing checklist
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* STEP 4: LOADING PHASE */}
      {step === 4 && (
        <div className="p-12 text-center rounded-2xl bg-[#0A0F1E]/50 border border-indigo-950/30 backdrop-blur-xl space-y-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-500/25 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-100 tracking-tight font-sans animate-pulse">
              {loadingMessages[loadingMsgIdx]}
            </h3>
            <p className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">Compiling checklist with Gemini Pacing Agents</p>
          </div>
        </div>
      )}

      {/* STEP 5: AI RESULT PREVIEW */}
      {step === 5 && aiResult && (
        <div className="p-8 rounded-2xl bg-[#0A0F1E]/55 border border-indigo-950/20 backdrop-blur-xl space-y-8 text-left">
          
          {/* Top Result Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-950/35 pb-6">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-100 tracking-tight">AI checklist compiled!</h3>
              <p className="text-xs text-[#94A3B8]">Goal feasibility review is complete</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/20 flex flex-col items-center">
                <span className="text-[9px] font-mono text-[#94A3B8] uppercase block">Feasibility</span>
                <span className="text-xs font-bold text-indigo-400 uppercase mt-0.5">{aiResult.feasibility}</span>
              </div>
              <div className="p-3 bg-red-950/30 rounded-xl border border-red-500/20 flex flex-col items-center">
                <span className="text-[9px] font-mono text-[#94A3B8] uppercase block">Risk score</span>
                <span className="text-xs font-bold text-red-400 uppercase mt-0.5">{aiResult.riskScore}</span>
              </div>
            </div>
          </div>

          {/* Coach notes */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/10 space-y-2">
            <span className="text-[10px] font-mono tracking-wider uppercase text-indigo-300">Guardian Coach Note</span>
            <p className="text-xs text-[#94A3B8] leading-relaxed italic">
              "{aiResult.coachNote || "Your daily capacity limits have been synchronized. Complete daily checklist tasks to guard pacing."}"
            </p>
            {aiResult.riskReason && (
              <p className="text-xs text-red-300/80 mt-1">
                Risk Assessment: {aiResult.riskReason}
              </p>
            )}
          </div>

          {/* Phased Decomposition Timeline Preview */}
          <div className="space-y-4">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#94A3B8]">Decomposition Timeline Preview</span>
            
            {aiResult.phases && aiResult.phases.length > 0 ? (
              <div className="space-y-4 border-l-2 border-indigo-950/60 pl-4 ml-2">
                {aiResult.phases.map((p: any, pIdx: number) => (
                  <div key={pIdx} className="space-y-2.5 relative">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-[#060A14]" />
                    <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide">{p.name}</h4>
                    <div className="space-y-2">
                      {p.tasks.map((t: any, tIdx: number) => (
                        <div key={tIdx} className="p-3 bg-[#060A14]/50 rounded-xl border border-indigo-950/35 flex items-center justify-between text-xs">
                          <span className="text-slate-200 font-semibold">{t.title}</span>
                          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
                            <span>Due: {t.dueDate}</span>
                            <span>•</span>
                            <span className="text-indigo-400">Est: {t.estimatedHours}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Checkpoint checklist populated.</p>
            )}
          </div>

          {/* Accept / Start plan */}
          <div className="flex justify-end pt-4 border-t border-indigo-950/20">
            <button
              onClick={() => {
                setPage("dashboard");
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-indigo-600/25"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Activate commitment checklist
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
