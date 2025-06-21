// convex/timeTracker.ts
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes auto-pause

export const startSession = mutation({
    args: {
        subjectId: v.string(),
        subjectType: v.string(),
        localStartTime: v.optional(v.float64()), // For offline sync
    },
    handler: async (ctx, { subjectId, subjectType, localStartTime }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check for existing active session using the new index
        const activeSession = await ctx.db.query("timeSessions")
            .withIndex("by_user_status", q =>
                q.eq("userId", userId).eq("status", "active"))
            .first();

        if (activeSession) {
            throw new Error("You already have an active session. Pause it before starting a new one.");
        }

        const now = Date.now();
        const sessionId = await ctx.db.insert("timeSessions", {
            userId,
            subjectId,
            subjectType,
            startTime: now,
            lastPing: now,
            status: "active",
            localStartTime: localStartTime || now, // Use provided or current time
        });

        return {
            sessionId,
            startedAt: now,
            localStartTime: localStartTime || now
        };
    },
});

export const endSession = mutation({
    args: {
        sessionId: v.id("timeSessions"),  // Add sessionId as required argument
        localEndTime: v.optional(v.float64()), // For offline sync
    },
    handler: async (ctx, { sessionId, localEndTime }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Get the session by ID instead of querying
        const session = await ctx.db.get(sessionId);

        // Validate session
        if (!session) throw new Error("Session not found");
        if (session.userId !== userId) throw new Error("Not authorized");
        if (session.status !== "active") {
            // If already completed, return current data instead of error
            return {
                status: "already_completed",
                duration: session.endTime ? session.endTime - session.startTime : 0,
                endedAt: session.endTime || Date.now()
            };
        }
        const now = Date.now();
        const duration = now - session.startTime;

        await ctx.db.patch(session._id, {
            endTime: now,
            localEndTime: localEndTime || now,
            status: "completed",
            lastPing: now,
        });

        // Validate session times
        if (session.startTime > now) {
            throw new Error("Invalid session time (startTime in future)");
        }
        if (duration > 24 * 60 * 60 * 1000) {
            throw new Error("Session too long (max 24 hours)");
        }

        // Update session
        await ctx.db.patch(session._id, {
            endTime: now,
            localEndTime: localEndTime || now,
            status: "completed",
            lastPing: now, // Update last ping on session end
        });

        // Update or create time tracker
        const existingTracker = await ctx.db.query("timeTrackers")
            .withIndex("by_user_subject", q =>
                q.eq("userId", userId).eq("subjectId", session.subjectId))
            .first();

        if (existingTracker) {
            await ctx.db.patch(existingTracker._id, {
                totalDuration: existingTracker.totalDuration + duration,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("timeTrackers", {
                userId,
                subjectId: session.subjectId,
                subjectType: session.subjectType,
                totalDuration: duration,
                updatedAt: now,
            });
        }

        // Update daily log
        const today = new Date().toISOString().split("T")[0];
        const dailyLog = await ctx.db.query("userDailyLogs")
            .withIndex("by_user_date", q => q.eq("userId", userId).eq("date", today))
            .first();

        if (dailyLog) {
            await ctx.db.patch(dailyLog._id, {
                totalDuration: dailyLog.totalDuration + duration,
                sessionIds: [...dailyLog.sessionIds, session._id],
            });
        } else {
            await ctx.db.insert("userDailyLogs", {
                userId,
                date: today,
                totalDuration: duration,
                sessionIds: [session._id],
            });
        }

        return {
            duration,
            endedAt: now,
            localEndTime: localEndTime || now
        };
    },
});

export const heartbeat = mutation({
    args: {
        sessionId: v.id("timeSessions"),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { sessionId, isActive = true }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const now = Date.now();
        const session = await ctx.db.get(sessionId);

        if (!session || session.userId !== userId || session.status !== "active") {
            return { status: "invalid_session" };
        }

        const INACTIVITY_LIMIT = 1 * 60 * 1000; // 5 minutes
        const lastActiveTime = isActive ? now : (session.lastActivity || session.lastPing || session.startTime);

        // Prepare update data
        const updateData: any = {
            lastPing: now,
        };

        // Only update lastActivity if this is an active heartbeat
        if (isActive) {
            updateData.lastActivity = now;
        }

        // Check for inactivity
        if (!isActive && now - lastActiveTime > INACTIVITY_LIMIT) {
            // End session due to inactivity
            await ctx.db.patch(session._id, {
                ...updateData,
                endTime: now,
                status: "completed",
                inactivityEnded: true,
            });

            return {
                status: "auto_paused",
                duration: now - session.startTime
            };
        }

        // Regular heartbeat update
        await ctx.db.patch(session._id, updateData);

        return { 
            status: "updated",
            isActive 
        };
    },
});
// Add a mutation for offline session recovery
export const syncOfflineSessions = mutation({
    args: {
        sessions: v.array(v.object({
            subjectId: v.string(),
            subjectType: v.string(),
            localStartTime: v.float64(),
            localEndTime: v.float64(),
            duration: v.float64(), // We'll use this for calculations but not store in session
        }))
    },
    handler: async (ctx, { sessions }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const results = [];
        const today = new Date().toISOString().split("T")[0];
        const now = Date.now();

        for (const session of sessions) {
            try {
                // Calculate approximate server timestamps based on duration
                const serverEndTime = now;
                const serverStartTime = serverEndTime - session.duration;

                // Create the session record without duration field
                const sessionId = await ctx.db.insert("timeSessions", {
                    userId,
                    subjectId: session.subjectId,
                    subjectType: session.subjectType,
                    startTime: serverStartTime,
                    endTime: serverEndTime,
                    status: "completed",
                    localStartTime: session.localStartTime,
                    localEndTime: session.localEndTime,
                    lastPing: serverEndTime, // Set last ping to end time
                });

                // Update time tracker (using the provided duration)
                const existingTracker = await ctx.db.query("timeTrackers")
                    .withIndex("by_user_subject", q =>
                        q.eq("userId", userId).eq("subjectId", session.subjectId))
                    .first();

                if (existingTracker) {
                    await ctx.db.patch(existingTracker._id, {
                        totalDuration: existingTracker.totalDuration + session.duration,
                        updatedAt: now,
                    });
                } else {
                    await ctx.db.insert("timeTrackers", {
                        userId,
                        subjectId: session.subjectId,
                        subjectType: session.subjectType,
                        totalDuration: session.duration,
                        updatedAt: now,
                    });
                }

                // Update daily log (using the provided duration)
                const dailyLog = await ctx.db.query("userDailyLogs")
                    .withIndex("by_user_date", q => q.eq("userId", userId).eq("date", today))
                    .first();

                if (dailyLog) {
                    await ctx.db.patch(dailyLog._id, {
                        totalDuration: dailyLog.totalDuration + session.duration,
                        sessionIds: [...dailyLog.sessionIds, sessionId],
                    });
                } else {
                    await ctx.db.insert("userDailyLogs", {
                        userId,
                        date: today,
                        totalDuration: session.duration,
                        sessionIds: [sessionId],
                    });
                }

                results.push({
                    success: true,
                    sessionId,
                    duration: session.duration // Return the duration in response
                });
            } catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                    sessionData: session // Include the failed session data for debugging
                });
            }
        }

        return results;
    },
});