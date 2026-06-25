import { GoogleGenAI, Type } from "@google/genai";
import { Goal, Task, Constraint, CalendarEvent, AIDecisionInsight } from "./database";

// Setup Gemini AI client with standard User-Agent header
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Sleep utility for exponential backoff
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute content generation with exponential backoff and model fallbacks
 */
async function callGemini(params: {
  contents: any;
  systemInstruction?: string;
  responseSchema?: any;
  responseMimeType?: string;
}): Promise<string> {
  const models = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest"
  ];

  let lastError: any = null;
  let delay = 1000;

  for (let attempt = 0; attempt < 3; attempt++) {
    for (const model of models) {
      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not set. Please add it to your secrets in the Settings menu.");
        }
        
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: params.responseMimeType || "application/json",
            responseSchema: params.responseSchema,
            temperature: 0.2,
          },
        });

        if (response && response.text) {
          return response.text;
        }
        throw new Error("Empty response from Gemini");
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt + 1}, Model ${model} failed: ${err.message || err}`);
        await sleep(delay);
        delay *= 2; // exponential backoff
      }
    }
  }

  throw new Error(`Gemini calling failed after multiple attempts. Last error: ${lastError?.message || lastError}`);
}

/**
 * AGENT 1: Goal Analysis Agent
 */
export async function analyzeGoal(goal: Goal, calendarEvents: CalendarEvent[]): Promise<{
  feasibility: "achievable" | "challenging" | "at_risk" | "unlikely";
  riskScore: "low" | "medium" | "high";
  riskReason: string;
  coachNote: string;
}> {
  const systemInstruction = `You are the Goal Analysis Agent of Deadline Guardian AI. 
Analyze the feasibility and risk score of the following user commitment goal.
Be realistic, direct, and action-oriented. Do NOT use motivational hype or generic advice.
Evaluate how the days remaining, daily capacity, skill level, context, manual constraints, and google calendar conflicts impact success.
Return a structured JSON response matching the schema.`;

  const inputContext = {
    title: goal.title,
    category: goal.category,
    priority: goal.priority,
    dailyHours: goal.dailyHours,
    skillLevel: goal.skillLevel,
    context: goal.context,
    constraints: goal.constraints,
    deadline: goal.deadline,
    calendarEvents: calendarEvents.map(e => ({ title: e.title, start: e.start, end: e.end, type: e.type })),
    createdAt: goal.createdAt
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      feasibility: {
        type: Type.STRING,
        description: "The realistic feasibility classification",
        enum: ["achievable", "challenging", "at_risk", "unlikely"]
      },
      riskScore: {
        type: Type.STRING,
        description: "Risk score level",
        enum: ["low", "medium", "high"]
      },
      riskReason: {
        type: Type.STRING,
        description: "Detailed, realistic explanation of main risk drivers (1-2 sentences)"
      },
      coachNote: {
        type: Type.STRING,
        description: "Actionable, customized tactical advice (2-3 sentences)"
      }
    },
    required: ["feasibility", "riskScore", "riskReason", "coachNote"]
  };

  const text = await callGemini({
    contents: JSON.stringify(inputContext),
    systemInstruction,
    responseSchema,
  });

  return JSON.parse(text);
}

/**
 * AGENT 2: Task Decomposition Agent
 */
export async function decomposeTasks(goal: Goal, calendarEvents: CalendarEvent[]): Promise<{
  phases: Array<{
    name: string;
    tasks: Array<{
      title: string;
      estimatedHours: number;
      dueDate: string; // YYYY-MM-DD
    }>;
  }>;
}> {
  const systemInstruction = `You are the Task Decomposition Agent of Deadline Guardian AI.
Decompose the user's complex commitment goal into a chronological, phased, day-by-day action item list.
Rules:
1. Divide the plan into 2 to 4 logical progress phases.
2. Estimated hours for tasks assigned to any day must NOT exceed the user's dailyHours capacity: ${goal.dailyHours} hours.
3. Keep task estimatedHours reasonable, ranging from 0.5 to 3 hours.
4. Each task title MUST start with a strong action verb (e.g. 'Draft presentation outline', 'Implement router logic').
5. Chronologically sequence task due dates starting from today until the goal deadline: ${goal.deadline}.
6. CRITICAL: Completely avoid scheduling tasks on dates that overlap with user travel, exams, or major meetings listed in constraints or calendar events. Skip those days, push scheduled tasks to adjacent active days.
Return a structured JSON response matching the schema.`;

  const inputContext = {
    title: goal.title,
    category: goal.category,
    priority: goal.priority,
    dailyHours: goal.dailyHours,
    skillLevel: goal.skillLevel,
    context: goal.context,
    constraints: goal.constraints,
    deadline: goal.deadline,
    createdAt: goal.createdAt,
    calendarEvents: calendarEvents.map(e => ({ title: e.title, start: e.start, end: e.end, type: e.type }))
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      phases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Logical phase name (e.g. 'Phase 1: Setup')" },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Action-oriented task title starting with a verb" },
                  estimatedHours: { type: Type.NUMBER, description: "Estimated active working hours (0.5 to 3)" },
                  dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD format" }
                },
                required: ["title", "estimatedHours", "dueDate"]
              }
            }
          },
          required: ["name", "tasks"]
        }
      }
    },
    required: ["phases"]
  };

  const text = await callGemini({
    contents: JSON.stringify(inputContext),
    systemInstruction,
    responseSchema,
  });

  return JSON.parse(text);
}

/**
 * AGENT 3: Accountability Coach Agent
 */
export async function generateAccountabilityFeedback(params: {
  title: string;
  category: string;
  completedCount: number;
  totalCount: number;
  blockerNote: string;
  daysRemaining: number;
  overallProgress: number;
}): Promise<{ message: string }> {
  const systemInstruction = `You are the Accountability Coach Agent of Deadline Guardian AI.
Your job is to provide direct, specific, and highly customized tactical advice based on today's check-in.
Do NOT output generic motivational quotes.
Customize feedback based on category:
- Work/Project: Focus on milestones, quality deliverables, project speed.
- Startup: Launching MVP fast, validating assumptions, keeping things lightweight.
- Exam/Prep/Learning: Testing understanding, recall practice, resolving gaps.
If the user logged a blocker note, provide 1 specific, immediate solution or alternative approach for that blocker.
Keep response concise (exactly 2-3 sentences).
Return a structured JSON response matching the schema.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      message: { type: Type.STRING, description: "Tactical coaching advice (2-3 sentences)" }
    },
    required: ["message"]
  };

  const text = await callGemini({
    contents: JSON.stringify(params),
    systemInstruction,
    responseSchema
  });

  return JSON.parse(text);
}

/**
 * AGENT 4: Risk Prediction Agent
 */
export async function predictRisk(params: {
  title: string;
  completedTasks: number;
  totalTasks: number;
  daysRemaining: number;
  daysElapsed: number;
  currentVelocity: number;
  requiredVelocity: number;
}): Promise<{
  riskScore: "low" | "medium" | "high";
  reason: string;
}> {
  const systemInstruction = `You are the Risk Prediction Agent of Deadline Guardian AI.
Examine the current completion pacing metrics and output the deadline slippage risk level (low, medium, or high) alongside a single concise sentence explanation.
Return a structured JSON response matching the schema.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      riskScore: {
        type: Type.STRING,
        enum: ["low", "medium", "high"],
        description: "Evaluated risk score"
      },
      reason: {
        type: Type.STRING,
        description: "1-sentence description explaining the velocity-based risk assessment"
      }
    },
    required: ["riskScore", "reason"]
  };

  const text = await callGemini({
    contents: JSON.stringify(params),
    systemInstruction,
    responseSchema
  });

  return JSON.parse(text);
}

/**
 * AGENT 5: Decision Coach Agent
 */
export async function generateDecisionInsight(params: {
  goal: Goal;
  tasks: Task[];
  calendarConflicts: CalendarEvent[];
  forecast: any;
  previousInsight?: AIDecisionInsight | null;
  history?: any[];
}): Promise<AIDecisionInsight> {
  const systemInstruction = `You are the strategic Decision Coach Agent of Deadline Guardian AI.
You evaluate the user's commitments, timelines, capacity leak calendar conflicts, and performance history.
Perform detailed calculations to return high-fidelity intelligence, scenario modeling, bottlenecks, and the highest-impact adjustment actions.
If previousInsight is available, compute the change delta adjustments (e.g. success probability change, health score shifts, predicted completion shifts) and explain why pacing has changed.
Always be realistic, mathematical, and objective.
Return a structured JSON response matching the schema.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      goalForecast: { type: Type.STRING, description: "Summarized text forecast e.g. 'Projected to miss by 3.5 days.'" },
      insightDelta: {
        type: Type.OBJECT,
        properties: {
          probabilityChange: { type: Type.NUMBER, description: "Shift in probability percentage" },
          healthScoreChange: { type: Type.NUMBER, description: "Shift in health score points" },
          forecastDateChange: { type: Type.NUMBER, description: "Shift in predicted completion date in days (positive means delayed)" },
          explanation: { type: Type.STRING, description: "Tactical, detailed explanation of what drove the pacing shift" }
        },
        required: ["probabilityChange", "healthScoreChange", "forecastDateChange", "explanation"]
      },
      changeDrivers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            factor: { type: Type.STRING, description: "Direct pacing catalyst (e.g. 'Calendar travel conflicts', 'Low weekly check-in rate')" },
            impact: { type: Type.NUMBER, description: "Quantitative percentage impact (-100 to 100)" }
          },
          required: ["factor", "impact"]
        }
      },
      riskDrivers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["positive", "negative"] },
            factor: { type: Type.STRING, description: "Risk accelerator or mitigating behavior" }
          },
          required: ["type", "factor"]
        }
      },
      highestImpactAction: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, description: "The single highest leverage change the user can make today to salvage the timeline" },
          beforeProbability: { type: Type.NUMBER, description: "Current success probability" },
          afterProbability: { type: Type.NUMBER, description: "Projected success probability after this action" }
        },
        required: ["action", "beforeProbability", "afterProbability"]
      },
      scenarios: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Scenario description (e.g. 'Increasing capacity by 1hr/day', 'Skipping Phase 3 testing')" },
            successProbability: { type: Type.NUMBER, description: "Model-computed success probability (5 to 99)" }
          },
          required: ["name", "successProbability"]
        }
      },
      bottlenecks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            task: { type: Type.STRING, description: "Specific impending high-impact or blocking task title" },
            blockedTasks: { type: Type.NUMBER, description: "Number of subsequent tasks logically dependent on this item" },
            impact: { type: Type.STRING, description: "Description of chronological impact e.g. 'High - freezes active phase progress'" }
          },
          required: ["task", "blockedTasks", "impact"]
        }
      },
      reasoning: { type: Type.STRING, description: "Mathematical context explaining equations, parameters, and variable dependencies" },
      confidenceScore: { type: Type.NUMBER, description: "Intelligence model's confidence scoring" },
      confidenceReasons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Evidence list substantiating the confidence score" }
    },
    required: [
      "goalForecast",
      "insightDelta",
      "changeDrivers",
      "riskDrivers",
      "highestImpactAction",
      "scenarios",
      "bottlenecks",
      "reasoning",
      "confidenceScore",
      "confidenceReasons"
    ]
  };

  const text = await callGemini({
    contents: JSON.stringify(params),
    systemInstruction,
    responseSchema
  });

  return JSON.parse(text);
}

/**
 * AGENT 6: Recovery / Rescue Agent
 */
export async function generateRecoveryPlan(params: {
  title: string;
  category: string;
  missedTasks: Task[];
  daysRemaining: number;
  dailyHours: number;
  skillLevel: string;
  calendarConflicts: CalendarEvent[];
}): Promise<{
  recoveryPlan: {
    message: string;
    currentProgress: string;
    riskAssessment: string;
    rescueStrategy: string;
    recoveredTimeline: string;
    revisedTasks: Array<{
      title: string;
      estimatedHours: number;
      dueDate: string; // YYYY-MM-DD
    }>;
  };
}> {
  const systemInstruction = `You are the specialized Recovery / Rescue Agent of Deadline Guardian AI.
Your job is to salvage an active goal commitment that is currently failing, behind schedule, or at critical risk.
Analyze remaining capacity constraints, calendar events, and overdue/pending tasks.
Formulate a highly dense, restructured, and compressed action plan.
Rescue Guidelines:
1. Streamline and consolidate pending tasks into highly efficient action blocks.
2. If absolutely necessary, recommend skipping low-leverage or optional tasks (make it clear in titles, e.g. "[OPTIONAL] Skip secondary review" or simplify tasks).
3. Recalculate daily workloads so that daily totals strictly fit within the dailyHours: ${params.dailyHours} capacity.
4. Distribute the revisedTasks chronologically over the remaining ${params.daysRemaining} days.
5. All task titles MUST start with an action verb.
Return a structured JSON response matching the schema.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      recoveryPlan: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING, description: "Candid, direct recovery message summarizing the rescue posture" },
          currentProgress: { type: Type.STRING, description: "State of progress before salvage" },
          riskAssessment: { type: Type.STRING, description: "Realistic assessment of what would have happened without rescue" },
          rescueStrategy: { type: Type.STRING, description: "The architectural approach taken to salvage this timeline" },
          recoveredTimeline: { type: Type.STRING, description: "Detailed explanation of the newly recovered pacing timeline" },
          revisedTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Action-oriented condensed task title" },
                estimatedHours: { type: Type.NUMBER, description: "Estimated active working hours (0.5 to 3)" },
                dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD format" }
              },
              required: ["title", "estimatedHours", "dueDate"]
            }
          }
        },
        required: ["message", "currentProgress", "riskAssessment", "rescueStrategy", "recoveredTimeline", "revisedTasks"]
      }
    },
    required: ["recoveryPlan"]
  };

  const text = await callGemini({
    contents: JSON.stringify(params),
    systemInstruction,
    responseSchema
  });

  return JSON.parse(text);
}
