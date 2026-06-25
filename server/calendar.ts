import { google } from "googleapis";
import { db, CalendarEvent, Task, Goal } from "./database";

/**
 * Classifies an event title into one of the priority constraint categories
 */
export function classifyEvent(title: string): CalendarEvent["type"] {
  const t = title.toLowerCase();
  
  if (
    t.includes("travel") ||
    t.includes("trip") ||
    t.includes("flight") ||
    t.includes("vacation") ||
    t.includes("holiday") ||
    t.includes("delhi") ||
    t.includes("mumbai") ||
    t.includes("bangalore") ||
    t.includes("london") ||
    t.includes("tour")
  ) {
    return "travel";
  }

  if (
    t.includes("exam") ||
    t.includes("quiz") ||
    t.includes("test") ||
    t.includes("midterm") ||
    t.includes("final") ||
    t.includes("paper") ||
    t.includes("sem") ||
    t.includes("test prep")
  ) {
    return "exam";
  }

  if (
    t.includes("interview") ||
    t.includes("hiring") ||
    t.includes("assessment") ||
    t.includes("portfolio") ||
    t.includes("recruiting") ||
    t.includes("job application")
  ) {
    return "interview";
  }

  if (
    t.includes("hackathon") ||
    t.includes("hack") ||
    t.includes("coding contest") ||
    t.includes("jam")
  ) {
    return "hackathon";
  }

  if (
    t.includes("meeting") ||
    t.includes("sync") ||
    t.includes("call") ||
    t.includes("standup") ||
    t.includes("1:1") ||
    t.includes("one-on-one") ||
    t.includes("scrum") ||
    t.includes("discussion") ||
    t.includes("collab")
  ) {
    return "meeting";
  }

  if (
    t.includes("deadline") ||
    t.includes("due") ||
    t.includes("submission") ||
    t.includes("hand-in") ||
    t.includes("turnin") ||
    t.includes("milestone")
  ) {
    return "work_deadline";
  }

  if (
    t.includes("wedding") ||
    t.includes("birthday") ||
    t.includes("anniversary") ||
    t.includes("party") ||
    t.includes("family") ||
    t.includes("marriage") ||
    t.includes("dinner") ||
    t.includes("gathering")
  ) {
    return "family_event";
  }

  return "other";
}

// Check if OAuth credentials are set
const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || "http://localhost:3000"}/api/calendar/auth/callback`;

export const isGoogleCalendarConfigured = !!(clientId && clientSecret);

export function getOAuth2Client(customRedirectUri?: string) {
  return new google.auth.OAuth2(clientId, clientSecret, customRedirectUri || redirectUri);
}

/**
 * Returns a list of Google Calendar events for a user
 * Fallbacks to high-fidelity simulated events if OAuth is missing, ensuring visual depth
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  refreshToken: string
): Promise<Array<Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">>> {
  if (!isGoogleCalendarConfigured) {
    return getSimulatedEvents();
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    const timeMin = new Date().toISOString();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30); // 30-day sync window

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = response.data.items || [];
    
    return items.map((item) => {
      const startStr = item.start?.dateTime || item.start?.date || new Date().toISOString();
      const endStr = item.end?.dateTime || item.end?.date || new Date().toISOString();
      
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffMs = end.getTime() - start.getTime();
      const diffHrs = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      
      const durationText = item.start?.date 
        ? "all-day" 
        : `${diffHrs} hour${diffHrs !== 1 ? "s" : ""}`;

      const title = item.summary || "Untitled Event";

      return {
        googleEventId: item.id || Math.random().toString(36).substr(2, 9),
        title,
        start: startStr,
        end: endStr,
        type: classifyEvent(title),
        duration: durationText,
        source: "google-calendar",
      };
    });
  } catch (err) {
    console.error("Google Calendar API call failed, falling back to simulated data", err);
    return getSimulatedEvents();
  }
}

/**
 * Generates highly polished simulated calendar events for demoing pacing and capacity leaks
 */
export function getSimulatedEvents(): Array<Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">> {
  const events: Array<Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">> = [];
  
  const today = new Date();
  
  // 1. A travel trip starting in 10 days, lasting 3 days
  const travelStart = new Date(today);
  travelStart.setDate(today.getDate() + 10);
  travelStart.setHours(9, 0, 0, 0);
  
  const travelEnd = new Date(travelStart);
  travelEnd.setDate(travelStart.getDate() + 3);
  travelEnd.setHours(18, 0, 0, 0);
  
  events.push({
    googleEventId: "sim_travel_1",
    title: "Weekend Trip to Bangalore",
    start: travelStart.toISOString(),
    end: travelEnd.toISOString(),
    type: "travel",
    duration: "all-day",
    source: "google-calendar",
  });

  // 2. An exam/test prep in 5 days
  const examStart = new Date(today);
  examStart.setDate(today.getDate() + 5);
  examStart.setHours(14, 0, 0, 0);
  
  const examEnd = new Date(examStart);
  examEnd.setHours(17, 0, 0, 0);
  
  events.push({
    googleEventId: "sim_exam_1",
    title: "AWS Certification Exam",
    start: examStart.toISOString(),
    end: examEnd.toISOString(),
    type: "exam",
    duration: "3 hours",
    source: "google-calendar",
  });

  // 3. Weekly Scrum Meetings
  for (let i = 1; i <= 4; i++) {
    const meetingStart = new Date(today);
    meetingStart.setDate(today.getDate() + (i * 7));
    meetingStart.setHours(10, 0, 0, 0);
    
    const meetingEnd = new Date(meetingStart);
    meetingEnd.setHours(11, 0, 0, 0);
    
    events.push({
      googleEventId: `sim_meeting_${i}`,
      title: "Q3 Sprint Planning Sync",
      start: meetingStart.toISOString(),
      end: meetingEnd.toISOString(),
      type: "meeting",
      duration: "1 hour",
      source: "google-calendar",
    });
  }

  const deadStart = new Date(today);
  deadStart.setDate(today.getDate() + 18);
  deadStart.setHours(17, 0, 0, 0);
  
  const deadEnd = new Date(deadStart);
  deadEnd.setHours(18, 0, 0, 0);

  events.push({
    googleEventId: "sim_deadline_1",
    title: "Final Q2 Report Submission Due",
    start: deadStart.toISOString(),
    end: deadEnd.toISOString(),
    type: "work_deadline",
    duration: "1 hour",
    source: "google-calendar",
  });

  return events;
}

/**
 * Retrieves a valid, refreshed OAuth2 client for a user
 */
export async function getValidOAuth2Client(userId: string) {
  const user = db.findUserById(userId);
  if (!user || !user.googleCalendarConnected) {
    throw new Error("Google Calendar is not connected for this user");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken || undefined,
    refresh_token: user.googleRefreshToken || undefined,
    expiry_date: user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : undefined,
  });

  const isExpired = user.googleTokenExpiry 
    ? (new Date(user.googleTokenExpiry).getTime() <= Date.now() + 60000) 
    : true;

  if (isExpired && user.googleRefreshToken && user.googleRefreshToken !== "mock_refresh_token") {
    try {
      console.log(`Refreshing expired Google Calendar token for user: ${userId}`);
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      db.updateUser(userId, {
        googleAccessToken: credentials.access_token || user.googleAccessToken,
        googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : user.googleTokenExpiry,
        googleRefreshToken: credentials.refresh_token || user.googleRefreshToken,
      });

      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error("Failed to refresh Google access token:", err);
      throw new Error("Failed to refresh Google Calendar authentication. Please reconnect.");
    }
  }

  return oauth2Client;
}

/**
 * Create a Google Calendar event for a task
 */
export async function createGoogleCalendarEvent(
  userId: string,
  task: any,
  goalTitle: string
): Promise<{ eventId: string; calendarId: string } | null> {
  const user = db.findUserById(userId);
  if (!user || !user.googleCalendarConnected) return null;

  if (user.googleAccessToken === "mock_access_token") {
    return {
      eventId: "mock_event_" + Math.random().toString(36).substr(2, 9),
      calendarId: "primary"
    };
  }

  try {
    const oauth2Client = await getValidOAuth2Client(userId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Set a sensible time on the due date
    const startHour = 10;
    const endHour = startHour + Math.max(1, Math.ceil(task.estimatedHours || 1));
    
    const startStr = `${task.dueDate}T${String(startHour).padStart(2, "0")}:00:00`;
    const endStr = `${task.dueDate}T${String(endHour).padStart(2, "0")}:00:00`;

    const timezone = "UTC";

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `🎯 ${task.title}`,
        description: `Task for Goal: ${goalTitle}\nEstimated Effort: ${task.estimatedHours} hour(s)\nStatus: ${task.status}`,
        start: {
          dateTime: new Date(startStr).toISOString(),
          timeZone: timezone,
        },
        end: {
          dateTime: new Date(endStr).toISOString(),
          timeZone: timezone,
        },
        colorId: task.status === "completed" ? "10" : "5", // Completed = Green (10), Pending = Blue (5)
      },
    });

    return {
      eventId: response.data.id || "",
      calendarId: "primary"
    };
  } catch (err) {
    console.error("Failed to create Google Calendar event:", err);
    return null;
  }
}

/**
 * Update an existing Google Calendar event for a task
 */
export async function updateGoogleCalendarEvent(
  userId: string,
  task: any,
  goalTitle: string
): Promise<boolean> {
  const user = db.findUserById(userId);
  if (!user || !user.googleCalendarConnected || !task.googleEventId) return false;

  if (user.googleAccessToken === "mock_access_token") {
    return true;
  }

  try {
    const oauth2Client = await getValidOAuth2Client(userId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const startHour = 10;
    const endHour = startHour + Math.max(1, Math.ceil(task.estimatedHours || 1));
    
    const startStr = `${task.dueDate}T${String(startHour).padStart(2, "0")}:00:00`;
    const endStr = `${task.dueDate}T${String(endHour).padStart(2, "0")}:00:00`;
    const timezone = "UTC";

    const prefix = task.status === "completed" ? "✅ [Completed]" : "🎯";

    await calendar.events.update({
      calendarId: "primary",
      eventId: task.googleEventId,
      requestBody: {
        summary: `${prefix} ${task.title}`,
        description: `Task for Goal: ${goalTitle}\nEstimated Effort: ${task.estimatedHours} hour(s)\nStatus: ${task.status}`,
        start: {
          dateTime: new Date(startStr).toISOString(),
          timeZone: timezone,
        },
        end: {
          dateTime: new Date(endStr).toISOString(),
          timeZone: timezone,
        },
        colorId: task.status === "completed" ? "10" : "5",
      },
    });

    return true;
  } catch (err: any) {
    console.error("Failed to update Google Calendar event:", err);
    if (err.code === 404) {
      db.updateTask(task.id, {
        googleEventId: null,
        googleCalendarId: null,
        googleSyncStatus: "failed",
      });
    }
    return false;
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleCalendarEvent(
  userId: string,
  googleEventId: string
): Promise<boolean> {
  const user = db.findUserById(userId);
  if (!user || !user.googleCalendarConnected || !googleEventId) return false;

  if (user.googleAccessToken === "mock_access_token") {
    return true;
  }

  try {
    const oauth2Client = await getValidOAuth2Client(userId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
    });

    return true;
  } catch (err: any) {
    console.error("Failed to delete Google Calendar event:", err);
    return false;
  }
}

/**
 * Push all active tasks of a user to Google Calendar
 */
export async function pushUserTasksToGoogleCalendar(userId: string): Promise<void> {
  const user = db.findUserById(userId);
  if (!user || !user.googleCalendarConnected) return;

  const goals = db.findGoalsByUserId(userId);
  for (const goal of goals) {
    if (goal.status === "active") {
      const tasks = db.getTasksByGoalId(goal.id);
      for (const task of tasks) {
        if (!task.googleEventId) {
          const res = await createGoogleCalendarEvent(userId, task, goal.title);
          if (res) {
            db.updateTask(task.id, {
              googleEventId: res.eventId,
              googleCalendarId: res.calendarId,
              googleSyncStatus: "synced",
              googleLastUpdated: new Date().toISOString(),
            });
          }
        } else {
          await updateGoogleCalendarEvent(userId, task, goal.title);
          db.updateTask(task.id, {
            googleSyncStatus: "synced",
            googleLastUpdated: new Date().toISOString(),
          });
        }
      }
    }
  }
}

/**
 * Automatically detects timeline conflicts between study tasks and external Google Calendar events,
 * and shifts the affected study tasks to the nearest available conflict-free days.
 */
export async function autoRescheduleConflicts(userId: string): Promise<{ rescheduledCount: number; affectedGoals: string[] }> {
  const user = db.findUserById(userId);
  if (!user || !user.googleCalendarConnected) return { rescheduledCount: 0, affectedGoals: [] };

  const goals = db.findGoalsByUserId(userId);
  const calendarEvents = db.getCalendarEventsByUserId(userId);

  let rescheduledCount = 0;
  const affectedGoals: string[] = [];

  for (const goal of goals) {
    if (goal.status !== "active") continue;

    const tasks = db.getTasksByGoalId(goal.id);
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    if (pendingTasks.length === 0) continue;

    // Build conflictMap of busy hours per day for this goal's range
    const dailyHours = goal.dailyHours || 3;
    const startStr = new Date().toISOString().split("T")[0]; // today onwards
    const endStr = goal.deadline;

    if (startStr > endStr) continue; // deadline is in the past

    const startDate = new Date(startStr + "T00:00:00.000");
    const endDate = new Date(endStr + "T23:59:59.999");

    const conflictMap: Record<string, number> = {};
    const current = new Date(startDate);
    while (current <= endDate) {
      const yyyymmdd = current.toISOString().split("T")[0];
      conflictMap[yyyymmdd] = 0;
      current.setDate(current.getDate() + 1);
    }

    // Populate conflictMap from calendar events
    for (const event of calendarEvents) {
      const evStart = new Date(event.start);
      const evEnd = new Date(event.end);

      if (evEnd < startDate || evStart > endDate) continue;

      const isAllDay = event.duration.toLowerCase().includes("all-day") || 
                       (evEnd.getTime() - evStart.getTime() >= 24 * 60 * 60 * 1000 - 1000 && evStart.getHours() === 0);

      const dWalker = new Date(Math.max(startDate.getTime(), evStart.getTime()));
      const lDate = new Date(Math.min(endDate.getTime(), evEnd.getTime()));
      dWalker.setHours(0,0,0,0);
      lDate.setHours(0,0,0,0);

      while (dWalker <= lDate) {
        const dayKey = dWalker.toISOString().split("T")[0];
        if (conflictMap[dayKey] !== undefined) {
          if (isAllDay) {
            conflictMap[dayKey] += dailyHours;
          } else {
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

    // Check each pending task for conflicts on its due date
    let updatedGoal = false;
    for (const task of pendingTasks) {
      const taskDate = task.dueDate;
      if (conflictMap[taskDate] && conflictMap[taskDate] >= 1.0) {
        // Find a free day with free capacity and no other tasks of the same goal
        let foundDate: string | null = null;
        const searchDate = new Date(startDate);
        while (searchDate <= endDate) {
          const checkKey = searchDate.toISOString().split("T")[0];
          const tasksOnDay = pendingTasks.filter(t => t.dueDate === checkKey && t.id !== task.id).length;
          if (conflictMap[checkKey] < 1.0 && tasksOnDay === 0) {
            foundDate = checkKey;
            break;
          }
          searchDate.setDate(searchDate.getDate() + 1);
        }

        // Fallback: minimal busy hours day
        if (!foundDate) {
          let minHours = 999;
          const searchDate2 = new Date(startDate);
          while (searchDate2 <= endDate) {
            const checkKey = searchDate2.toISOString().split("T")[0];
            const hours = conflictMap[checkKey] || 0;
            if (hours < minHours) {
              minHours = hours;
              foundDate = checkKey;
            }
            searchDate2.setDate(searchDate2.getDate() + 1);
          }
        }

        if (foundDate && foundDate !== taskDate) {
          db.updateTask(task.id, {
            dueDate: foundDate,
            googleSyncStatus: "pending"
          });
          
          rescheduledCount++;
          updatedGoal = true;

          // Push the update to Google Calendar
          if (task.googleEventId) {
            await updateGoogleCalendarEvent(userId, task, goal.title);
          } else {
            const res = await createGoogleCalendarEvent(userId, task, goal.title);
            if (res) {
              db.updateTask(task.id, {
                googleEventId: res.eventId,
                googleCalendarId: res.calendarId,
                googleSyncStatus: "synced",
                googleLastUpdated: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    if (updatedGoal) {
      db.updateGoal(goal.id, {
        scheduleWarning: "Schedule updated because a new calendar event conflicts with your study plan."
      });
      affectedGoals.push(goal.id);
    }
  }

  return { rescheduledCount, affectedGoals };
}
