"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function Timer({ subjectId }: { subjectId: string }) {
    const startSession = useMutation(api.mutations.timeTracker.startSession);
    const endSession = useMutation(api.mutations.timeTracker.endSession);
    const getActiveSession = useQuery(api.queries.timeTracker.getActiveSession, {
        subjectId
    });

    const [isRunning, setIsRunning] = useState(false);
    const [sessionId, setSessionId] = useState<Id<"timeSessions"> | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const heartbeat = useMutation(api.mutations.timeTracker.heartbeat);

    const [isStarting, setIsStarting] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [lastActivityTime, setLastActivityTime] = useState(Date.now());

    // Track user activity
    useEffect(() => {
        const handleActivity = () => {
            setLastActivityTime(Date.now());
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, []);

    // Enhanced heartbeat with activity check
    useEffect(() => {
        if (!isRunning || !sessionId) return;
    
        const ACTIVITY_THRESHOLD = 1 * 60 * 1000; // 5 minutes
        let heartbeatInterval: NodeJS.Timeout;
        let activityCheckInterval: NodeJS.Timeout;
    
        const sendHeartbeat = async () => {
            try {
                const now = Date.now();
                const timeSinceLastActivity = now - lastActivityTime;
                const isActive = timeSinceLastActivity <= ACTIVITY_THRESHOLD;
                
                await heartbeat({ 
                    sessionId, 
                    isActive 
                });
            } catch (err) {
                console.error("Heartbeat error:", err);
            }
        };
    
        // Initial heartbeat
        sendHeartbeat();
    
        // Regular heartbeat interval (every minute)
        heartbeatInterval = setInterval(sendHeartbeat, 60_000);
    
        // Activity check interval (every 30 seconds)
        activityCheckInterval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivityTime;
            
            // If inactive beyond threshold, pause the session
            if (timeSinceLastActivity > ACTIVITY_THRESHOLD * 2) {
                handlePause();
            }
        }, 30_000);
    
        return () => {
            clearInterval(heartbeatInterval);
            clearInterval(activityCheckInterval);
        };
    }, [isRunning, sessionId, heartbeat, lastActivityTime]);
    // Restore session - now properly scoped to this subjectId
    useEffect(() => {
        const stored = localStorage.getItem(`activeSession-${subjectId}`);
        const now = Date.now();

        if (getActiveSession?.sessionId) {
            // If server has an active session for this subject
            const serverElapsed = now - getActiveSession.startTime;
            setSessionId(getActiveSession.sessionId);
            setElapsed(serverElapsed >= 0 ? serverElapsed : 0);
            setIsRunning(true);
        } else if (stored) {
            // If no server session but we have local storage for this subject
            try {
                const { sessionId, startTime } = JSON.parse(stored);
                const restoredElapsed = now - startTime;
                if (restoredElapsed >= 0) {
                    setSessionId(sessionId);
                    setElapsed(restoredElapsed);
                    setIsRunning(true);
                } else {
                    localStorage.removeItem(`activeSession-${subjectId}`);
                }
            } catch (e) {
                console.error("Failed to restore session", e);
                localStorage.removeItem(`activeSession-${subjectId}`);
            }
        }
    }, [subjectId, getActiveSession]);

    // Save session to localStorage - now using subjectId-specific key
    useEffect(() => {
        if (isRunning && sessionId) {
            localStorage.setItem(
                `activeSession-${subjectId}`,
                JSON.stringify({ 
                    sessionId, 
                    startTime: Date.now() - elapsed, 
                    subjectId 
                })
            );
        } else {
            localStorage.removeItem(`activeSession-${subjectId}`);
        }
    }, [isRunning, sessionId, elapsed, subjectId]);

    // Update elapsed time every second
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning) {
            interval = setInterval(() => {
                setElapsed((prev) => prev + 1000);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning]);

    const handleStart = async () => {
        setIsStarting(true);
        try {
            const result = await startSession({
                subjectId,
                subjectType: "subtask",
            });
            setSessionId(result.sessionId);
            setIsRunning(true);
            setElapsed(0);
            setLastActivityTime(Date.now()); // Set initial activity time
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsStarting(false);
        }
    };

    const handlePause = async () => {
        if (!sessionId) return;
      
        setIsEnding(true);
        try {
            const localEndTime = Date.now();
            const result = await endSession({ 
                sessionId,
                localEndTime 
            });
        
            if (result.status === "already_completed") {
                console.warn("Session was already completed");
            }
        
            setIsRunning(false);
            setSessionId(null);
            setElapsed(0);
            localStorage.removeItem(`activeSession-${subjectId}`);
        } catch (err: any) {
            console.error("Error ending session:", err);
            alert(`Failed to pause timer: ${err.message}`);
            // Reset state anyway to prevent UI lock
            setIsRunning(false);
            setSessionId(null);
            setElapsed(0);
            localStorage.removeItem(`activeSession-${subjectId}`);
        } finally {
            setIsEnding(false);
        }
    };

    const formatTime = (ms: number) => { 
        if (ms < 0) return "0h 0m 0s"; 
        const seconds = Math.floor(ms / 1000) % 60; 
        const minutes = Math.floor(ms / 1000 / 60) % 60; 
        const hours = Math.floor(ms / 1000 / 60 / 60); 
        return `${hours}h ${minutes}m ${seconds}s`; 
    };

    return (
        <div className="border rounded p-4">
            <h3 className="font-bold mb-2">Time Tracker</h3>
            <p className="text-lg">{formatTime(elapsed)}</p>
            {isRunning ? (
                <button
                    onClick={handlePause}
                    disabled={isEnding}
                    className={`mt-2 bg-red-500 text-white px-4 py-1 rounded ${
                        isEnding ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                    {isEnding ? "Ending..." : "Pause"}
                </button>
            ) : (
                <button
                    onClick={handleStart}
                    disabled={isStarting}
                    className={`mt-2 bg-green-500 text-white px-4 py-1 rounded ${
                        isStarting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                    {isStarting ? "Starting..." : "Start"}
                </button>
            )}
        </div>
    );
}