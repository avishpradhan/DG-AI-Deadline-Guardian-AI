export interface User {
  id: string;
  name: string;
  email: string;
  googleCalendarConnected: boolean;
  googleEmail?: string | null;
  googleLastSync?: string | null;
}

export interface Constraint {
  id: string;
  type: "travel" | "exam" | "interview" | "meeting" | "family_event" | "work_deadline" | "hackathon" | "other";
  title: string;
  date: string;
  duration: string;
  notes: string;
}

export interface GoalEvent {
  id: string;
  name: string;
  date: string;
  time: string;
}

export interface AIDecisionInsight {
  summary: string;
  recommendation: string;
  confidence: number;
  goalForecast: string;
  insightDelta: {
    probabilityChange: number;
    healthScoreChange: number;
    forecastDateChange: number;
    explanation: string;
  };
  changeDrivers: Array<{ factor: string; impact: number }>;
  riskDrivers: Array<{ type: "positive" | "negative"; factor: string }>;
  highestImpactAction: {
    action: string;
    beforeProbability: number;
    afterProbability: number;
  };
  scenarios: Array<{ name: string; successProbability: number }>;
  bottlenecks: Array<{ task: string; blockedTasks: number; impact: string }>;
  reasoning: string;
  confidenceScore: number;
  confidenceReasons: string[];
}

export interface GoalForecast {
  daysRemaining: number;
  daysElapsed: number;
  remainingEffort: number;
  completedEffort: number;
  historicalPace: number;
  effectiveVelocity: number;
  daysNeeded: number;
  predictedCompletionDate: string;
  conflictDays: number;
  daysAheadOrBehind: number;
  forecastStatus: "behind_schedule" | "ahead_of_schedule" | "on_track";
  confidenceScore: number;
  successProbability: number;
  healthScore: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: "exam_prep" | "job_interview" | "project" | "skill_learning" | "work_deadline" | "personal_commitment" | "business_startup" | "event_planning" | "other";
  deadline: string;
  priority: "low" | "medium" | "high" | "critical";
  dailyHours: number;
  skillLevel: "beginner" | "intermediate" | "advanced";
  context: string;
  status: "planning" | "analyzing" | "active" | "completed" | "archived";
  riskScore: "low" | "medium" | "high" | null;
  constraints: Constraint[];
  events: GoalEvent[];
  aiDecisionInsight: AIDecisionInsight | null;
  scheduleWarning?: string | null;
  createdAt: string;
  updatedAt: string;
  progress?: {
    completed: number;
    total: number;
  };
  intelligence?: GoalForecast;
}

export interface Task {
  id: string;
  goalId: string;
  phase: string;
  title: string;
  estimatedHours: number;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  completedAt: string | null;
  order: number;
  googleEventId?: string | null;
  googleCalendarId?: string | null;
  googleSyncStatus?: "synced" | "pending" | "failed" | null;
  googleLastUpdated?: string | null;
}

export interface ProgressLog {
  id: string;
  goalId: string;
  userId: string;
  date: string;
  completedTaskIds: string[];
  blockerNote: string;
  aiResponse: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  googleEventId: string;
  title: string;
  start: string;
  end: string;
  type: "travel" | "exam" | "interview" | "meeting" | "family_event" | "work_deadline" | "hackathon" | "other";
  duration: string;
  source: string;
}
