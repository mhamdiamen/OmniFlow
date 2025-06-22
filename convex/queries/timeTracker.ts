/* // Enhanced convex/queries/timeTracker.ts
import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActiveSession = query({
  args: { subjectId: v.string() },
  handler: async (ctx, { subjectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
      .query("timeSessions")
      .withIndex("by_user_subject_status", (q) =>
        q.eq("userId", userId).eq("subjectId", subjectId)
      )
      .filter(q => q.or(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("status"), "paused")
      ))
      .first();

    return session
      ? {
          sessionId: session._id,
          subjectId: session.subjectId,
          subjectType: session.subjectType,
          startTime: session.startTime,
          lastPing: session.lastPing,
          status: session.status,
          pausedAt: session.pausedAt,
          pausedDuration: session.pausedDuration || 0,
        }
      : null;
  },
});

export const getSubjectStats = query({
  args: { subjectId: v.string() },
  handler: async (ctx, { subjectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get tracker data
    const tracker = await ctx.db
      .query("timeTrackers")
      .withIndex("by_user_subject", q =>
        q.eq("userId", userId).eq("subjectId", subjectId)
      )
      .first();

    if (!tracker) {
      return {
        totalTime: 0,
        sessionCount: 0,
        averageSession: 0,
        lastSession: null,
        todayTime: 0,
        weekTime: 0,
      };
    }

    // Get today's time
    const today = new Date().toISOString().split("T")[0];
    const todayLog = await ctx.db
      .query("userDailyLogs")
      .withIndex("by_user_date", q => q.eq("userId", userId).eq("date", today))
      .first();

    // Type-safe access with proper fallback
    const todayTime = (todayLog?.subjectBreakdown as Record<string, number>)?.[subjectId] || 0;

    // Get this week's time
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoString = weekAgo.toISOString().split("T")[0];
        
    const weekLogs = await ctx.db
      .query("userDailyLogs")
      .withIndex("by_user_date", q => q.eq("userId", userId))
      .filter(q => q.gte(q.field("date"), weekAgoString))
      .collect();

    const weekTime = weekLogs.reduce((total, log) => {
      const breakdown = log.subjectBreakdown as Record<string, number>;
      return total + (breakdown?.[subjectId] || 0);
    }, 0);

    return {
      totalTime: tracker.totalDuration,
      sessionCount: tracker.sessionCount,
      averageSession: tracker.averageSessionDuration,
      lastSession: tracker.lastSessionDate,
      todayTime,
      weekTime,
    };
  },
});
export const getDailyStats = query({
  args: { 
    date: v.optional(v.string()), // "YYYY-MM-DD", defaults to today
    days: v.optional(v.float64()), // Number of days to fetch, defaults to 1
  },
  handler: async (ctx, { date, days = 1 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const targetDate = date || new Date().toISOString().split("T")[0];
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - days + 1);
    const startDateString = startDate.toISOString().split("T")[0];

    const logs = await ctx.db
      .query("userDailyLogs")
      .withIndex("by_user_date", q => q.eq("userId", userId))
      .filter(q => q.and(
        q.gte(q.field("date"), startDateString),
        q.lte(q.field("date"), targetDate)
      ))
      .collect();

    return logs.map(log => ({
      date: log.date,
      totalDuration: log.totalDuration,
      sessionCount: log.sessionIds.length,
      subjectBreakdown: log.subjectBreakdown || {},
    }));
  },
});

export const getRecentSessions = query({
  args: { 
    subjectId: v.optional(v.string()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, { subjectId, limit = 10 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db.query("timeSessions")
      .withIndex("by_user_date", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "completed"));

    if (subjectId) {
      query = query.filter(q => q.eq(q.field("subjectId"), subjectId));
    }

    const sessions = await query
      .order("desc")
      .take(limit);

    return sessions.map(session => ({
      id: session._id,
      subjectId: session.subjectId,
      subjectType: session.subjectType,
      startTime: session.startTime,
      endTime: session.endTime!,
      duration: (session.endTime! - session.startTime) - (session.pausedDuration || 0),
      grossDuration: session.endTime! - session.startTime,
      pausedDuration: session.pausedDuration || 0,
      tags: session.tags || [],
      inactivityEnded: session.inactivityEnded || false,
    }));
  },
});

export const getProductivityInsights = query({
  args: { days: v.optional(v.float64()) },
  handler: async (ctx, { days = 30 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split("T")[0];

    // Get daily logs for the period
    const logs = await ctx.db
      .query("userDailyLogs")
      .withIndex("by_user_date", q => q.eq("userId", userId))
      .filter(q => q.gte(q.field("date"), startDateString))
      .collect();

    if (logs.length === 0) {
      return {
        totalTime: 0,
        averageDaily: 0,
        activeDays: 0,
        longestStreak: 0,
        currentStreak: 0,
        topSubjects: [],
        dailyTrend: [],
      };
    }

    const totalTime = logs.reduce((sum, log) => sum + log.totalDuration, 0);
    const averageDaily = totalTime / Math.max(logs.length, 1);
    const activeDays = logs.length;

    // Calculate streaks
    const sortedLogs = logs.sort((a, b) => b.date.localeCompare(a.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split("T")[0];
    let checkDate = new Date(today);

    // Check current streak
    for (let i = 0; i < days; i++) {
      const dateString = checkDate.toISOString().split("T")[0];
      const hasActivity = logs.some(log => log.date === dateString);
      
      if (hasActivity) {
        if (i === 0 || currentStreak > 0) currentStreak++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate top subjects
    const subjectTotals: { [key: string]: number } = {};
    logs.forEach(log => {
      const breakdown = log.subjectBreakdown || {};
      Object.entries(breakdown).forEach(([subjectId, duration]) => {
        subjectTotals[subjectId] = (subjectTotals[subjectId] || 0) + duration;
      });
    });

    const topSubjects = Object.entries(subjectTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subjectId, duration]) => ({ subjectId, duration }));

    // Daily trend (last 7 days)
    const last7Days = logs
      .filter(log => {
        const logDate = new Date(log.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return logDate >= sevenDaysAgo;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(log => ({
        date: log.date,
        duration: log.totalDuration,
        sessions: log.sessionIds.length,
      }));

    return {
      totalTime,
      averageDaily,
      activeDays,
      longestStreak,
      currentStreak,
      topSubjects,
      dailyTrend: last7Days,
    };
  },
});

export const getAllActiveSession = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Find any active or paused session for this user
    const session = await ctx.db
      .query("timeSessions")
      .withIndex("by_user_status", q => q.eq("userId", userId))
      .filter(q => q.or(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("status"), "paused")
      ))
      .first();

    return session
      ? {
          sessionId: session._id,
          subjectId: session.subjectId,
          subjectType: session.subjectType,
          startTime: session.startTime,
          status: session.status,
          pausedAt: session.pausedAt,
          pausedDuration: session.pausedDuration || 0,
        }
      : null;
  },
}); */