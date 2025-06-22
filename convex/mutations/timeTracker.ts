/* // Enhanced convex/timeTracker.ts mutations
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";

export const startSession = mutation({
    args: {
        subjectId: v.string(),
        subjectType: v.string(),
        localStartTime: v.optional(v.float64()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, { subjectId, subjectType, localStartTime, tags }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check for existing active or paused session
        const existingSession = await ctx.db.query("timeSessions")
            .withIndex("by_user_status", q => q.eq("userId", userId))
            .filter(q => q.or(
                q.eq(q.field("status"), "active"),
                q.eq(q.field("status"), "paused")
            ))
            .first();

        if (existingSession) {
            throw new Error(`You have a ${existingSession.status} session. Please complete it first.`);
        }

        const now = Date.now();
        const sessionId = await ctx.db.insert("timeSessions", {
            userId,
            subjectId,
            subjectType,
            startTime: now,
            lastPing: now,
            lastActivity: now,
            status: "active",
            localStartTime: localStartTime || now,
            pausedDuration: 0,
            tags,
        });

        return {
            sessionId,
            startedAt: now,
            localStartTime: localStartTime || now
        };
    },
});

export const pauseSession = mutation({
    args: {
        sessionId: v.id("timeSessions"),
    },
    handler: async (ctx, { sessionId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const session = await ctx.db.get(sessionId);
        if (!session) throw new Error("Session not found");
        if (session.userId !== userId) throw new Error("Not authorized");
        if (session.status !== "active") throw new Error("Session is not active");

        const now = Date.now();
        const currentPausedDuration = session.pausedDuration || 0;

        await ctx.db.patch(sessionId, {
            status: "paused",
            pausedAt: now,
            lastPing: now,
        });

        return {
            pausedAt: now,
            pauseDuration: 0 // No duration added yet, will be calculated on resume
        };
    },
});

export const resumeSession = mutation({
    args: {
        sessionId: v.id("timeSessions"),
    },
    handler: async (ctx, { sessionId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const session = await ctx.db.get(sessionId);
        if (!session) throw new Error("Session not found");
        if (session.userId !== userId) throw new Error("Not authorized");
        if (session.status !== "paused") throw new Error("Session is not paused");

        const now = Date.now();
        const pauseStartTime = session.pausedAt || now;
        const pauseDuration = now - pauseStartTime;
        const totalPausedDuration = (session.pausedDuration || 0) + pauseDuration;

        await ctx.db.patch(sessionId, {
            status: "active",
            pausedDuration: totalPausedDuration,
            lastPing: now,
            lastActivity: now,
            pausedAt: undefined, // Clear pause timestamp
        });

        return {
            resumedAt: now,
            pauseDuration,
            totalPausedDuration
        };
    },
});

export const endSession = mutation({
    args: {
        sessionId: v.id("timeSessions"),
        localEndTime: v.optional(v.float64()),
    },
    handler: async (ctx, { sessionId, localEndTime }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const session = await ctx.db.get(sessionId);
        if (!session) throw new Error("Session not found");
        if (session.userId !== userId) throw new Error("Not authorized");
        
        if (session.status === "completed") {
            return {
                status: "already_completed",
                duration: session.endTime ? session.endTime - session.startTime - (session.pausedDuration || 0) : 0,
                endedAt: session.endTime || Date.now()
            };
        }

        const now = Date.now();
        let totalPausedDuration = session.pausedDuration || 0;

        // If session was paused, add final pause duration
        if (session.status === "paused" && session.pausedAt) {
            totalPausedDuration += now - session.pausedAt;
        }

        const grossDuration = now - session.startTime;
        const netDuration = grossDuration - totalPausedDuration;

        // Validation
        if (session.startTime > now) {
            throw new Error("Invalid session time");
        }
        if (grossDuration > 24 * 60 * 60 * 1000) {
            throw new Error("Session too long (max 24 hours)");
        }
        if (netDuration < 0) {
            throw new Error("Invalid pause duration");
        }

        // Update session
        await ctx.db.patch(sessionId, {
            endTime: now,
            localEndTime: localEndTime || now,
            status: "completed",
            lastPing: now,
            pausedDuration: totalPausedDuration,
        });

        // Update time tracker with enhanced metrics
        const existingTracker = await ctx.db.query("timeTrackers")
            .withIndex("by_user_subject", q =>
                q.eq("userId", userId).eq("subjectId", session.subjectId))
            .first();

        if (existingTracker) {
            const newSessionCount = existingTracker.sessionCount + 1;
            const newTotalDuration = existingTracker.totalDuration + netDuration;
            const newAverage = newTotalDuration / newSessionCount;

            await ctx.db.patch(existingTracker._id, {
                totalDuration: newTotalDuration,
                sessionCount: newSessionCount,
                averageSessionDuration: newAverage,
                lastSessionDate: now,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("timeTrackers", {
                userId,
                subjectId: session.subjectId,
                subjectType: session.subjectType,
                totalDuration: netDuration,
                sessionCount: 1,
                averageSessionDuration: netDuration,
                lastSessionDate: now,
                updatedAt: now,
            });
        }

        // Update daily log with subject breakdown
        const today = new Date(now).toISOString().split("T")[0];
        const dailyLog = await ctx.db.query("userDailyLogs")
            .withIndex("by_user_date", q => q.eq("userId", userId).eq("date", today))
            .first();

        if (dailyLog) {
            // Parse existing breakdown or create new one
            const breakdown = dailyLog.subjectBreakdown || {};
            const currentSubjectTime = (breakdown as any)[session.subjectId] || 0;
            (breakdown as any)[session.subjectId] = currentSubjectTime + netDuration;

            await ctx.db.patch(dailyLog._id, {
                totalDuration: dailyLog.totalDuration + netDuration,
                sessionIds: [...dailyLog.sessionIds, sessionId],
                subjectBreakdown: breakdown,
            });
        } else {
            const breakdown = { [session.subjectId]: netDuration };
            await ctx.db.insert("userDailyLogs", {
                userId,
                date: today,
                totalDuration: netDuration,
                sessionIds: [sessionId],
                subjectBreakdown: breakdown,
            });
        }

        return {
            duration: netDuration,
            grossDuration,
            pausedDuration: totalPausedDuration,
            endedAt: now,
            localEndTime: localEndTime || now
        };
    },
});

export const heartbeat = mutation({
    args: {
        sessionId: v.id("timeSessions"),
        isActive: v.optional(v.boolean()),
        timeSinceActivity: v.optional(v.float64()),
    },
    handler: async (ctx, { sessionId, isActive = true, timeSinceActivity }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const session = await ctx.db.get(sessionId);
        if (!session || session.userId !== userId) {
            return { status: "invalid_session" };
        }

        if (session.status !== "active") {
            return { status: "session_not_active", currentStatus: session.status };
        }

        const now = Date.now();
        
        // Professional timing thresholds
        const IDLE_WARNING_TIME = 3 * 60 * 1000;     // 3 minutes - show warning
        const AUTO_PAUSE_TIME = 5 * 60 * 1000;       // 5 minutes - auto-pause
        const DISCONNECT_TIME = 10 * 60 * 1000;      // 10 minutes - assume disconnected
        
        // Prepare update
        const updateData: any = { lastPing: now };
        
        if (isActive) {
            updateData.lastActivity = now;
            // Clear any warning state when user becomes active again
            updateData.idleWarningShown = undefined;
        }

        // Check activity status
        const lastActivity = session.lastActivity || session.startTime;
        const inactivityDuration = now - lastActivity;

        // Handle different inactivity levels
        if (inactivityDuration > AUTO_PAUSE_TIME) {
            // Auto-pause after 5 minutes of inactivity
            const pauseTime = lastActivity + AUTO_PAUSE_TIME;
            
            await ctx.db.patch(sessionId, {
                ...updateData,
                status: "paused",
                pausedAt: pauseTime,
                inactivityEnded: true,
                autoReason: "inactivity", // Track why it was paused
            });

            return {
                status: "auto_paused",
                reason: "inactivity",
                pausedAt: pauseTime,
                inactivityDuration,
                warningTime: IDLE_WARNING_TIME,
                pauseTime: AUTO_PAUSE_TIME
            };
        } 
        
        if (inactivityDuration > IDLE_WARNING_TIME && !session.idleWarningShown) {
            // Show warning after 3 minutes, but don't pause yet
            await ctx.db.patch(sessionId, {
                ...updateData,
                idleWarningShown: now,
            });

            return {
                status: "idle_warning",
                inactivityDuration,
                timeUntilPause: AUTO_PAUSE_TIME - inactivityDuration,
                warningTime: IDLE_WARNING_TIME,
                pauseTime: AUTO_PAUSE_TIME
            };
        }

        // Regular heartbeat update
        await ctx.db.patch(sessionId, updateData);

        return {
            status: "updated",
            isActive,
            inactivityDuration,
            nextWarningIn: Math.max(0, IDLE_WARNING_TIME - inactivityDuration),
            nextPauseIn: Math.max(0, AUTO_PAUSE_TIME - inactivityDuration)
        };
    },
});

// Enhanced offline sync with better conflict resolution
export const syncOfflineSessions = mutation({
    args: {
        sessions: v.array(v.object({
            subjectId: v.string(),
            subjectType: v.string(),
            localStartTime: v.float64(),
            localEndTime: v.float64(),
            duration: v.float64(),
            tags: v.optional(v.array(v.string())),
        }))
    },
    handler: async (ctx, { sessions }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const results = [];
        const now = Date.now();

        for (const sessionData of sessions) {
            try {
                // Check for potential duplicates
                const existingSessions = await ctx.db.query("timeSessions")
                    .withIndex("by_user_subject_status", q =>
                        q.eq("userId", userId)
                         .eq("subjectId", sessionData.subjectId)
                         .eq("status", "completed"))
                    .filter(q => q.and(
                        q.gte(q.field("localStartTime"), sessionData.localStartTime - 60000), // 1 minute tolerance
                        q.lte(q.field("localStartTime"), sessionData.localStartTime + 60000)
                    ))
                    .collect();

                if (existingSessions.length > 0) {
                    results.push({
                        success: false,
                        error: "Duplicate session detected",
                        sessionData
                    });
                    continue;
                }

                // Create session with calculated server times
                const serverEndTime = now;
                const serverStartTime = serverEndTime - sessionData.duration;

                const sessionId = await ctx.db.insert("timeSessions", {
                    userId,
                    subjectId: sessionData.subjectId,
                    subjectType: sessionData.subjectType,
                    startTime: serverStartTime,
                    endTime: serverEndTime,
                    status: "completed",
                    localStartTime: sessionData.localStartTime,
                    localEndTime: sessionData.localEndTime,
                    lastPing: serverEndTime,
                    pausedDuration: 0,
                    tags: sessionData.tags,
                });

                // Update time tracker
                const existingTracker = await ctx.db.query("timeTrackers")
                    .withIndex("by_user_subject", q =>
                        q.eq("userId", userId).eq("subjectId", sessionData.subjectId))
                    .first();

                if (existingTracker) {
                    const newSessionCount = existingTracker.sessionCount + 1;
                    const newTotalDuration = existingTracker.totalDuration + sessionData.duration;
                    const newAverage = newTotalDuration / newSessionCount;

                    await ctx.db.patch(existingTracker._id, {
                        totalDuration: newTotalDuration,
                        sessionCount: newSessionCount,
                        averageSessionDuration: newAverage,
                        lastSessionDate: now,
                        updatedAt: now,
                    });
                } else {
                    await ctx.db.insert("timeTrackers", {
                        userId,
                        subjectId: sessionData.subjectId,
                        subjectType: sessionData.subjectType,
                        totalDuration: sessionData.duration,
                        sessionCount: 1,
                        averageSessionDuration: sessionData.duration,
                        lastSessionDate: now,
                        updatedAt: now,
                    });
                }

                // Update daily log
                const sessionDate = new Date(sessionData.localStartTime).toISOString().split("T")[0];
                const dailyLog = await ctx.db.query("userDailyLogs")
                    .withIndex("by_user_date", q => q.eq("userId", userId).eq("date", sessionDate))
                    .first();

                if (dailyLog) {
                    const breakdown = dailyLog.subjectBreakdown || {};
                    const currentSubjectTime = (breakdown as any)[sessionData.subjectId] || 0;
                    (breakdown as any)[sessionData.subjectId] = currentSubjectTime + sessionData.duration;

                    await ctx.db.patch(dailyLog._id, {
                        totalDuration: dailyLog.totalDuration + sessionData.duration,
                        sessionIds: [...dailyLog.sessionIds, sessionId],
                        subjectBreakdown: breakdown,
                    });
                } else {
                    const breakdown = { [sessionData.subjectId]: sessionData.duration };
                    await ctx.db.insert("userDailyLogs", {
                        userId,
                        date: sessionDate,
                        totalDuration: sessionData.duration,
                        sessionIds: [sessionId],
                        subjectBreakdown: breakdown,
                    });
                }

                results.push({
                    success: true,
                    sessionId,
                    duration: sessionData.duration,
                    date: sessionDate
                });

            } catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                    sessionData
                });
            }
        }

        return {
            processed: sessions.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    },
});

// Bulk session cleanup for maintenance
export const cleanupOldSessions = mutation({
    args: {
        daysOld: v.optional(v.float64()), // Default 90 days
    },
    handler: async (ctx, { daysOld = 90 }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        
        const oldSessions = await ctx.db.query("timeSessions")
            .withIndex("by_user_date", q => q.eq("userId", userId))
            .filter(q => q.and(
                q.eq(q.field("status"), "completed"),
                q.lt(q.field("startTime"), cutoffTime)
            ))
            .collect();

        let deletedCount = 0;
        for (const session of oldSessions) {
            await ctx.db.delete(session._id);
            deletedCount++;
        }

        return {
            deletedSessions: deletedCount,
            cutoffDate: new Date(cutoffTime).toISOString().split("T")[0]
        };
    },
}); */