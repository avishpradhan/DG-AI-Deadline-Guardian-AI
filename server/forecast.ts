import { Goal, Task, CalendarEvent } from "./database";

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

export function parseDateString(val: string | Date): Date {
  const d = new Date(val);
  return d;
}

// Map Google/Cached Calendar events to capacities and calculate conflict hours
export function getCalendarConflictHours(
  goal: Goal,
  events: CalendarEvent[]
): number {
  const dailyHours = goal.dailyHours || 3;
  const startStr = goal.createdAt.split("T")[0];
  const endStr = goal.deadline;

  const startDate = new Date(startStr + "T00:00:00.000");
  const endDate = new Date(endStr + "T23:59:59.999");

  const conflictMap: Record<string, number> = {};

  // Initialize dates
  const current = new Date(startDate);
  while (current <= endDate) {
    const yyyymmdd = current.toISOString().split("T")[0];
    conflictMap[yyyymmdd] = 0;
    current.setDate(current.getDate() + 1);
  }

  for (const event of events) {
    const evStart = new Date(event.start);
    const evEnd = new Date(event.end);

    // Check overlap with goal timeline
    if (evEnd < startDate || evStart > endDate) {
      continue;
    }

    // Is it an all-day event?
    const isAllDay = event.duration.toLowerCase().includes("all-day") || 
                     (evEnd.getTime() - evStart.getTime() >= 24 * 60 * 60 * 1000 - 1000 && evStart.getHours() === 0);

    // Iterate through overlapping days
    const dayWalker = new Date(Math.max(startDate.getTime(), evStart.getTime()));
    const limitDate = new Date(Math.min(endDate.getTime(), evEnd.getTime()));

    // Set times to midnight to traverse cleanly by day
    const dWalker = new Date(dayWalker.getFullYear(), dayWalker.getMonth(), dayWalker.getDate());
    const lDate = new Date(limitDate.getFullYear(), limitDate.getMonth(), limitDate.getDate());

    while (dWalker <= lDate) {
      const dayKey = dWalker.toISOString().split("T")[0];
      if (conflictMap[dayKey] !== undefined) {
        if (isAllDay) {
          conflictMap[dayKey] += dailyHours;
        } else {
          // Calculate overlap for this specific day
          const dayStart = new Date(dWalker.getFullYear(), dWalker.getMonth(), dWalker.getDate(), 0, 0, 0);
          const dayEnd = new Date(dWalker.getFullYear(), dWalker.getMonth(), dWalker.getDate(), 23, 59, 59, 999);
          
          const overlapStart = Math.max(evStart.getTime(), dayStart.getTime());
          const overlapEnd = Math.min(evEnd.getTime(), dayEnd.getTime());
          
          if (overlapEnd > overlapStart) {
            const overlapHrs = (overlapEnd - overlapStart) / (1000 * 60 * 60);
            conflictMap[dayKey] += overlapHrs;
          }
        }
      }
      dWalker.setDate(dWalker.getDate() + 1);
    }
  }

  // Cap conflict hours daily to dailyHours capacity, then sum
  let totalConflictHours = 0;
  Object.keys(conflictMap).forEach((dateKey) => {
    const hours = conflictMap[dateKey];
    totalConflictHours += Math.min(dailyHours, hours);
  });

  return Math.round(totalConflictHours * 10) / 10;
}

export function calculateGoalForecast(
  goal: Goal,
  tasks: Task[],
  calendarConflictHours: number = 0
): GoalForecast {
  const dailyHours = goal.dailyHours || 3;
  
  // Set times to compare days cleanly
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(goal.deadline + "T23:59:59.999");
  const createdDate = new Date(goal.createdAt);
  createdDate.setHours(0, 0, 0, 0);

  // 1. Days Remaining
  const msRem = deadlineDate.getTime() - today.getTime();
  const daysRemaining = Math.max(1, Math.ceil(msRem / (1000 * 60 * 60 * 24)));

  // 2. Days Elapsed
  const msElapsed = today.getTime() - createdDate.getTime();
  const daysElapsed = Math.max(1, Math.ceil(msElapsed / (1000 * 60 * 60 * 24)));

  // Task lists
  const totalTasks = tasks.length;
  const completedTasksList = tasks.filter(t => t.status === "completed");
  const completedTasks = completedTasksList.length;
  const remainingTasks = totalTasks - completedTasks;

  // 3. Remaining Effort
  const remTasksEstimatedHours = tasks.filter(t => t.status !== "completed").reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const remainingEffort = remTasksEstimatedHours > 0 ? remTasksEstimatedHours : remainingTasks * 2;

  // 4. Completed Effort
  const compTasksEstimatedHours = completedTasksList.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedEffort = compTasksEstimatedHours > 0 ? compTasksEstimatedHours : completedTasks * 2;

  // 5. Historical Pace (hours per day)
  const historicalPace = completedEffort / daysElapsed;

  // 6. Effective Velocity
  let effectiveVelocity = dailyHours;
  if (completedTasks > 0) {
    effectiveVelocity = (historicalPace * 0.7) + (dailyHours * 0.3);
  }
  // Clamp effective velocity between 0.5 and 16
  effectiveVelocity = Math.max(0.5, Math.min(16, effectiveVelocity));

  // 7. Expected Days Needed
  const daysNeeded = Math.ceil(remainingEffort / effectiveVelocity);

  // 8. Predicted Completion Date
  const predictedDate = new Date(today.getTime());
  predictedDate.setDate(predictedDate.getDate() + daysNeeded);
  const predictedCompletionDate = predictedDate.toISOString().split("T")[0];

  // 9. Conflict Days
  const conflictDays = Math.round((calendarConflictHours / dailyHours) * 10) / 10;

  // 10. Days Ahead or Behind
  const daysAheadOrBehind = Math.round((daysRemaining - daysNeeded - conflictDays) * 10) / 10;

  // 11. Forecast Status
  let forecastStatus: GoalForecast["forecastStatus"] = "on_track";
  if (daysAheadOrBehind < 0) {
    forecastStatus = "behind_schedule";
  } else if (daysAheadOrBehind > 3) {
    forecastStatus = "ahead_of_schedule";
  }

  // 12. Confidence Score (based on data richness)
  const progressPercent = totalTasks > 0 ? completedTasks / totalTasks : 0;
  let confidenceScore = Math.round(40 + (progressPercent * 40) + Math.min(20, daysElapsed * 1.5));
  confidenceScore = Math.max(30, Math.min(98, confidenceScore));

  // 13. Success Probability
  let successProbability = 50;
  if (daysAheadOrBehind >= 0) {
    successProbability = Math.round(75 + (daysAheadOrBehind * 5));
  } else {
    successProbability = Math.round(70 + (daysAheadOrBehind * 10));
  }
  successProbability = Math.max(5, Math.min(99, successProbability));

  // 14. Deadline Health Score
  const wProg = progressPercent * 25;
  const wProb = successProbability * 0.5;
  
  // Workload component
  const availableCapacity = (daysRemaining * dailyHours) - calendarConflictHours;
  const rWorkload = remainingEffort / Math.max(1, availableCapacity);
  let wWork = 25;
  if (rWorkload > 1.2) {
    wWork = Math.max(0, 25 - (rWorkload - 1.2) * 20);
  }

  const healthScore = Math.max(0, Math.min(100, Math.round(wProg + wProb + wWork)));

  return {
    daysRemaining,
    daysElapsed,
    remainingEffort,
    completedEffort,
    historicalPace: Math.round(historicalPace * 10) / 10,
    effectiveVelocity: Math.round(effectiveVelocity * 10) / 10,
    daysNeeded,
    predictedCompletionDate,
    conflictDays,
    daysAheadOrBehind,
    forecastStatus,
    confidenceScore,
    successProbability,
    healthScore
  };
}

export interface GoalPriorityScore {
  goal: Goal;
  score: number;
  urgency: number;
  risk: number;
  priorityWeight: number;
  effort: number;
}

export function rankGoalsPriority(
  goals: Goal[],
  tasksMap: Record<string, Task[]>,
  conflictHoursMap: Record<string, number>
): GoalPriorityScore[] {
  const ranked = goals.map((goal) => {
    const tasks = tasksMap[goal.id] || [];
    const conflicts = conflictHoursMap[goal.id] || 0;
    const fc = calculateGoalForecast(goal, tasks, conflicts);

    // 1. Priority Weight
    const weights = { critical: 50, high: 35, medium: 20, low: 5 };
    const priorityWeight = weights[goal.priority] || 20;

    // 2. Urgency Score
    const urgency = Math.max(0, 100 - (fc.daysRemaining * 3));

    // 3. Risk Score
    const risk = (100 - fc.successProbability) * 0.8 + (100 - fc.healthScore) * 0.4;

    // 4. Effort Score
    const effort = Math.min(15, fc.remainingEffort * 0.2);

    const score = urgency + risk + priorityWeight + effort;

    return {
      goal,
      score: Math.round(score * 10) / 10,
      urgency: Math.round(urgency),
      risk: Math.round(risk),
      priorityWeight,
      effort: Math.round(effort)
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
