"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function Timer({ subjectId }: { subjectId: string }) {
    const startSession = useMutation(api.mutations.timeTracker.startSession);
    const pauseSession = useMutation(api.mutations.timeTracker.pauseSession);
    const resumeSession = useMutation(api.mutations.timeTracker.resumeSession);
    const endSession = useMutation(api.mutations.timeTracker.endSession);
    const getActiveSession = useQuery(api.queries.timeTracker.getActiveSession, {
        subjectId
    });
    const heartbeat = useMutation(api.mutations.timeTracker.heartbeat);

    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionId, setSessionId] = useState<Id<"timeSessions"> | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [pausedDuration, setPausedDuration] = useState(0);

    const [isStarting, setIsStarting] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [isPausing, setIsPausing] = useState(false);

    const lastActivityTime = useRef(Date.now());
    const sessionStartRef = useRef<number>(0);
    const pauseStartRef = useRef<number>(0);

    // Enhanced activity tracking with debouncing
    const updateActivity = useCallback(() => {
        lastActivityTime.current = Date.now();
    }, []);

    // Professional idle warning system
    const [idleWarning, setIdleWarning] = useState<{
        show: boolean;
        timeLeft: number;
        countdown: number;
    } | null>(null);

    const showIdleWarning = (timeUntilPause: number | undefined) => {
        if (timeUntilPause === undefined) return;
        
        setIdleWarning({
            show: true,
            timeLeft: timeUntilPause,
            countdown: Math.ceil(timeUntilPause / 1000)
        });

        // Start countdown
        const countdownInterval = setInterval(() => {
            setIdleWarning(prev => {
                if (!prev || prev.countdown <= 1) {
                    clearInterval(countdownInterval);
                    return null;
                }
                return {
                    ...prev,
                    countdown: prev.countdown - 1
                };
            });
        }, 1000);
    };

    const clearIdleWarning = () => {
        setIdleWarning(null);
    };

    const handleStayActive = () => {
        lastActivityTime.current = Date.now();
        clearIdleWarning();
        // Trigger immediate heartbeat to update server
        if (sessionId) {
            heartbeat({ sessionId, isActive: true, timeSinceActivity: 0 });
        }
    };

    // Professional timing constants for display
    const TIMING_CONFIG = {
        activeThreshold: 30, // seconds
        idleWarning: 3,      // minutes
        autoPause: 5,        // minutes
        disconnect: 10       // minutes
    };

    // Enhanced activity status display
    const getActivityStatus = () => {
        const timeSinceActivity = Date.now() - lastActivityTime.current;
        const seconds = Math.floor(timeSinceActivity / 1000);

        if (seconds < TIMING_CONFIG.activeThreshold) return {
            status: "🟢 Active",
            color: "text-green-600"
        };

        if (seconds < TIMING_CONFIG.idleWarning * 60) return {
            status: `🟡 Idle (${seconds}s)`,
            color: "text-yellow-600"
        };

        const minutesIdle = Math.floor(seconds / 60);
        return {
            status: `🔴 Away (${minutesIdle}m)`,
            color: "text-red-600"
        };
    };
    
    useEffect(() => {
        const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
        let debounceTimer: NodeJS.Timeout;

        const debouncedActivity = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateActivity, 100); // Debounce to avoid excessive updates
        };

        events.forEach(event => {
            window.addEventListener(event, debouncedActivity, { passive: true });
        });

        return () => {
            clearTimeout(debounceTimer);
            events.forEach(event => {
                window.removeEventListener(event, debouncedActivity);
            });
        };
    }, [updateActivity]);

    // Smart heartbeat with adaptive intervals
    useEffect(() => {
        if (!isRunning || !sessionId || isPaused) return;

        // Professional activity thresholds (matching backend)
        const ACTIVE_THRESHOLD = 30 * 1000;          // 30 seconds - considered active
        const IDLE_WARNING_TIME = 3 * 60 * 1000;     // 3 minutes - show warning
        const AUTO_PAUSE_TIME = 5 * 60 * 1000;       // 5 minutes - auto-pause

        let heartbeatInterval: NodeJS.Timeout;
        let warningTimer: NodeJS.Timeout | undefined;

        const sendHeartbeat = async () => {
            try {
                const now = Date.now();
                const timeSinceActivity = now - lastActivityTime.current;
                const isActive = timeSinceActivity <= ACTIVE_THRESHOLD;

                const result = await heartbeat({
                    sessionId,
                    isActive,
                    timeSinceActivity
                });

                // Handle different server responses
                switch (result?.status) {
                    case 'auto_paused':
                        handleAutoPause();
                        break;

                    case 'idle_warning':
                        showIdleWarning(result.timeUntilPause);
                        break;

                    case 'updated':
                        // Clear any existing warnings if user became active
                        if (isActive) {
                            clearIdleWarning();
                        }
                        break;
                }
            } catch (err) {
                console.error("Heartbeat error:", err);
            }
        };

        // Dynamic heartbeat intervals for efficiency
        const getHeartbeatInterval = () => {
            const timeSinceActivity = Date.now() - lastActivityTime.current;

            if (timeSinceActivity < ACTIVE_THRESHOLD) return 15000;      // 15s when active
            if (timeSinceActivity < IDLE_WARNING_TIME) return 30000;     // 30s when idle
            if (timeSinceActivity < AUTO_PAUSE_TIME) return 10000;       // 10s near auto-pause
            return 60000; // 1m after auto-pause (cleanup)
        };

        const scheduleNextHeartbeat = () => {
            heartbeatInterval = setTimeout(() => {
                sendHeartbeat();
                scheduleNextHeartbeat();
            }, getHeartbeatInterval());
        };

        // Start heartbeat cycle
        sendHeartbeat();
        scheduleNextHeartbeat();

        return () => {
            clearTimeout(heartbeatInterval);
            if (warningTimer) {
                clearTimeout(warningTimer);
            }
        };
    }, [isRunning, sessionId, isPaused, heartbeat]);

    // Session restoration logic
    useEffect(() => {
        const restoreSession = () => {
            if (getActiveSession?.sessionId) {
                const session = getActiveSession;
                const now = Date.now();

                setSessionId(session.sessionId);

                if (session.status === 'paused') {
                    setIsPaused(true);
                    setIsRunning(false);
                    // Calculate elapsed time up to pause point
                    const pausedAt = session.pausedAt || now;
                    const elapsedAtPause = pausedAt - session.startTime - (session.pausedDuration || 0);
                    setElapsed(Math.max(0, elapsedAtPause));
                    setPausedDuration(session.pausedDuration || 0);
                } else {
                    setIsRunning(true);
                    setIsPaused(false);
                    // Calculate current elapsed time
                    const totalElapsed = now - session.startTime - (session.pausedDuration || 0);
                    setElapsed(Math.max(0, totalElapsed));
                    setPausedDuration(session.pausedDuration || 0);
                    sessionStartRef.current = session.startTime;
                }
            } else {
                // Try to restore from localStorage
                const stored = localStorage.getItem(`activeSession-${subjectId}`);
                if (stored) {
                    try {
                        const data = JSON.parse(stored);
                        const now = Date.now();

                        if (data.isPaused) {
                            setIsPaused(true);
                            setElapsed(data.elapsed || 0);
                            setPausedDuration(data.pausedDuration || 0);
                        } else {
                            const restoredElapsed = now - data.startTime - (data.pausedDuration || 0);
                            if (restoredElapsed >= 0) {
                                setSessionId(data.sessionId);
                                setElapsed(restoredElapsed);
                                setIsRunning(true);
                                sessionStartRef.current = data.startTime;
                                setPausedDuration(data.pausedDuration || 0);
                            }
                        }
                    } catch (e) {
                        console.error("Failed to restore session", e);
                        localStorage.removeItem(`activeSession-${subjectId}`);
                    }
                }
            }
        };

        restoreSession();
    }, [subjectId, getActiveSession]);

    // Persist session state
    useEffect(() => {
        const sessionData = {
            sessionId,
            startTime: sessionStartRef.current,
            elapsed,
            pausedDuration,
            isPaused,
            isRunning,
            subjectId
        };

        if (isRunning || isPaused) {
            localStorage.setItem(`activeSession-${subjectId}`, JSON.stringify(sessionData));
        } else {
            localStorage.removeItem(`activeSession-${subjectId}`);
        }
    }, [isRunning, isPaused, sessionId, elapsed, pausedDuration, subjectId]);

    // Timer update loop
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && !isPaused) {
            interval = setInterval(() => {
                setElapsed(prev => prev + 1000);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, isPaused]);

    const handleStart = async () => {
        setIsStarting(true);
        try {
            const result = await startSession({
                subjectId,
                subjectType: "subtask",
            });

            setSessionId(result.sessionId);
            setIsRunning(true);
            setIsPaused(false);
            setElapsed(0);
            setPausedDuration(0);
            sessionStartRef.current = result.startedAt;
            lastActivityTime.current = Date.now();
        } catch (err: any) {
            console.error("Start error:", err);
            alert(err.message);
        } finally {
            setIsStarting(false);
        }
    };

    const handlePause = async () => {
        if (!sessionId) return;

        setIsPausing(true);
        try {
            pauseStartRef.current = Date.now();
            const result = await pauseSession({ sessionId });

            setIsRunning(false);
            setIsPaused(true);
            setPausedDuration(prev => prev + (result.pauseDuration || 0));
        } catch (err: any) {
            console.error("Pause error:", err);
            alert(`Failed to pause: ${err.message}`);
        } finally {
            setIsPausing(false);
        }
    };

    const handleResume = async () => {
        if (!sessionId) return;

        try {
            await resumeSession({ sessionId });
            setIsRunning(true);
            setIsPaused(false);
            lastActivityTime.current = Date.now();
        } catch (err: any) {
            console.error("Resume error:", err);
            alert(`Failed to resume: ${err.message}`);
        }
    };

    const handleStop = async () => {
        if (!sessionId) return;

        setIsEnding(true);
        try {
            const result = await endSession({ sessionId });

            setIsRunning(false);
            setIsPaused(false);
            setSessionId(null);
            setElapsed(0);
            setPausedDuration(0);
            localStorage.removeItem(`activeSession-${subjectId}`);

            // Optional: Show completion message
            console.log(`Session completed: ${formatTime(result.duration)}`);
        } catch (err: any) {
            console.error("Stop error:", err);
            alert(`Failed to stop timer: ${err.message}`);
        } finally {
            setIsEnding(false);
        }
    };

    const handleAutoPause = () => {
        setIsRunning(false);
        setIsPaused(true);
        // Show notification to user
        console.log("Timer auto-paused due to inactivity");
    };

    const formatTime = (ms: number) => {
        if (ms < 0) return "0h 0m 0s";
        const seconds = Math.floor(ms / 1000) % 60;
        const minutes = Math.floor(ms / 1000 / 60) % 60;
        const hours = Math.floor(ms / 1000 / 60 / 60);

        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    return (
        <div className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">Time Tracker</h3>
                {isRunning && !isPaused && (
                    <span className={`text-sm ${getActivityStatus().color}`}>
                        {getActivityStatus().status}
                    </span>
                )}
            </div>

            <div className="text-2xl font-mono mb-4 text-center py-2">
                {formatTime(elapsed)}
            </div>

            {pausedDuration > 0 && (
                <div className="text-sm text-gray-500 text-center mb-2">
                    Paused time: {formatTime(pausedDuration)}
                </div>
            )}

            <div className="flex gap-2 justify-center">
                {!isRunning && !isPaused ? (
                    <button
                        onClick={handleStart}
                        disabled={isStarting}
                        className={`bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors ${isStarting ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {isStarting ? "Starting..." : "▶ Start"}
                    </button>
                ) : isPaused ? (
                    <>
                        <button
                            onClick={handleResume}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            ▶ Resume
                        </button>
                        <button
                            onClick={handleStop}
                            disabled={isEnding}
                            className={`bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors ${isEnding ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {isEnding ? "Stopping..." : "⏹ Stop"}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handlePause}
                            disabled={isPausing}
                            className={`bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors ${isPausing ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {isPausing ? "Pausing..." : "⏸ Pause"}
                        </button>
                        <button
                            onClick={handleStop}
                            disabled={isEnding}
                            className={`bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors ${isEnding ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {isEnding ? "Stopping..." : "⏹ Stop"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}