import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: string | null; // ISO Date String
  googleCalendarConnected: boolean;
  googleId: string | null;
  googleEmail: string | null;
  googleLastSync: string | null; // ISO Date String
  createdAt: string;
  updatedAt: string;
}

export interface Constraint {
  id: string;
  type: "travel" | "exam" | "interview" | "meeting" | "family_event" | "work_deadline" | "hackathon" | "other";
  title: string;
  date: string; // YYYY-MM-DD
  duration: string;
  notes: string;
}

export interface GoalEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
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

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: "exam_prep" | "job_interview" | "project" | "skill_learning" | "work_deadline" | "personal_commitment" | "business_startup" | "event_planning" | "other";
  deadline: string; // YYYY-MM-DD
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
}

export interface Task {
  id: string;
  goalId: string;
  phase: string;
  title: string;
  estimatedHours: number;
  dueDate: string; // YYYY-MM-DD
  status: "pending" | "in_progress" | "completed" | "skipped";
  completedAt: string | null; // ISO String
  order: number;
  createdAt: string;
  updatedAt: string;
  googleEventId?: string | null;
  googleCalendarId?: string | null;
  googleSyncStatus?: "synced" | "pending" | "failed" | null;
  googleLastUpdated?: string | null;
}

export interface ProgressLog {
  id: string;
  goalId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedTaskIds: string[];
  blockerNote: string;
  aiResponse: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  googleEventId: string;
  title: string;
  start: string; // ISO String
  end: string; // ISO String
  type: "travel" | "exam" | "interview" | "meeting" | "family_event" | "work_deadline" | "hackathon" | "other";
  duration: string;
  source: string; // "google-calendar"
  createdAt: string;
  updatedAt: string;
}

export interface AIOutput {
  id: string;
  goalId: string;
  agentType: "goal_analysis" | "task_decomposition" | "accountability" | "risk_prediction" | "recovery";
  input: any;
  output: any;
  createdAt: string;
}

export interface DatabaseState {
  users: User[];
  goals: Goal[];
  tasks: Task[];
  progressLogs: ProgressLog[];
  calendarEvents: CalendarEvent[];
  aiOutputs: AIOutput[];
}

class Database {
  private state: DatabaseState = {
    users: [],
    goals: [],
    tasks: [],
    progressLogs: [],
    calendarEvents: [],
    aiOutputs: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.state = JSON.parse(raw);
        // Ensure arrays are initialized
        this.state.users = this.state.users || [];
        this.state.goals = this.state.goals || [];
        this.state.tasks = this.state.tasks || [];
        this.state.progressLogs = this.state.progressLogs || [];
        this.state.calendarEvents = this.state.calendarEvents || [];
        this.state.aiOutputs = this.state.aiOutputs || [];
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to initialize database, using in-memory store", e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write to database file", e);
    }
  }

  // User Actions
  public getUsers(): User[] {
    return this.state.users;
  }

  public findUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public createUser(name: string, email: string, passwordPlain: string): User {
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);
    const user: User = {
      id: "u_" + Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleCalendarConnected: false,
      googleId: null,
      googleEmail: null,
      googleLastSync: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<Omit<User, "id" | "createdAt">>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  // Goal Actions
  public getGoals(): Goal[] {
    return this.state.goals;
  }

  public findGoalById(id: string): Goal | undefined {
    return this.state.goals.find(g => g.id === id);
  }

  public findGoalsByUserId(userId: string): Goal[] {
    return this.state.goals.filter(g => g.userId === userId);
  }

  public createGoal(userId: string, goalData: Omit<Goal, "id" | "userId" | "status" | "riskScore" | "aiDecisionInsight" | "createdAt" | "updatedAt">): Goal {
    const goal: Goal = {
      ...goalData,
      id: "g_" + Math.random().toString(36).substr(2, 9),
      userId,
      status: "planning",
      riskScore: null,
      aiDecisionInsight: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.goals.push(goal);
    this.save();
    return goal;
  }

  public updateGoal(id: string, updates: Partial<Omit<Goal, "id" | "userId" | "createdAt">>): Goal | undefined {
    const goal = this.findGoalById(id);
    if (!goal) return undefined;
    Object.assign(goal, updates);
    goal.updatedAt = new Date().toISOString();
    this.save();
    return goal;
  }

  public deleteGoal(id: string) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    this.state.tasks = this.state.tasks.filter(t => t.goalId !== id);
    this.state.progressLogs = this.state.progressLogs.filter(p => p.goalId !== id);
    this.state.aiOutputs = this.state.aiOutputs.filter(a => a.goalId !== id);
    this.save();
  }

  // Task Actions
  public getTasksByGoalId(goalId: string): Task[] {
    return this.state.tasks.filter(t => t.goalId === goalId).sort((a, b) => a.order - b.order);
  }

  public findTaskById(id: string): Task | undefined {
    return this.state.tasks.find(t => t.id === id);
  }

  public createTask(goalId: string, taskData: Omit<Task, "id" | "goalId" | "status" | "completedAt" | "createdAt" | "updatedAt">): Task {
    const task: Task = {
      ...taskData,
      id: "t_" + Math.random().toString(36).substr(2, 9),
      goalId,
      status: "pending",
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.tasks.push(task);
    this.save();
    return task;
  }

  public createTasksBulk(tasks: Array<Omit<Task, "id" | "status" | "completedAt" | "createdAt" | "updatedAt">>): Task[] {
    const created: Task[] = [];
    tasks.forEach(t => {
      const task: Task = {
        ...t,
        id: "t_" + Math.random().toString(36).substr(2, 9),
        status: "pending",
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.state.tasks.push(task);
      created.push(task);
    });
    this.save();
    return created;
  }

  public updateTask(id: string, updates: Partial<Omit<Task, "id" | "goalId" | "createdAt">>): Task | undefined {
    const task = this.findTaskById(id);
    if (!task) return undefined;
    Object.assign(task, updates);
    task.updatedAt = new Date().toISOString();
    this.save();
    return task;
  }

  public deletePendingTasks(goalId: string) {
    this.state.tasks = this.state.tasks.filter(t => !(t.goalId === goalId && t.status !== "completed"));
    this.save();
  }

  // Progress Log Actions
  public getProgressLogsByGoalId(goalId: string): ProgressLog[] {
    return this.state.progressLogs
      .filter(p => p.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createProgressLog(userId: string, goalId: string, date: string, completedTaskIds: string[], blockerNote: string, aiResponse: string): ProgressLog {
    const log: ProgressLog = {
      id: "pl_" + Math.random().toString(36).substr(2, 9),
      userId,
      goalId,
      date,
      completedTaskIds,
      blockerNote,
      aiResponse,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.progressLogs.push(log);
    this.save();
    return log;
  }

  // Calendar Event Actions
  public getCalendarEventsByUserId(userId: string): CalendarEvent[] {
    return this.state.calendarEvents.filter(e => e.userId === userId);
  }

  public createCalendarEventsBulk(userId: string, events: Array<Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">>): CalendarEvent[] {
    // Filter existing googleEventIds for this user
    const existingIds = new Set(this.state.calendarEvents.filter(e => e.userId === userId).map(e => e.googleEventId));
    
    const created: CalendarEvent[] = [];
    events.forEach(e => {
      if (existingIds.has(e.googleEventId)) return; // skip duplicates
      const event: CalendarEvent = {
        ...e,
        id: "ce_" + Math.random().toString(36).substr(2, 9),
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.state.calendarEvents.push(event);
      created.push(event);
    });
    this.save();
    return created;
  }

  public clearCalendarEventsByUserId(userId: string) {
    this.state.calendarEvents = this.state.calendarEvents.filter(e => e.userId !== userId);
    this.save();
  }

  // AI Output Audit Log Actions
  public createAIOutput(goalId: string, agentType: AIOutput["agentType"], input: any, output: any): AIOutput {
    const item: AIOutput = {
      id: "ao_" + Math.random().toString(36).substr(2, 9),
      goalId,
      agentType,
      input,
      output,
      createdAt: new Date().toISOString()
    };
    this.state.aiOutputs.push(item);
    this.save();
    return item;
  }
}

export const db = new Database();
