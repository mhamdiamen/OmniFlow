import { useState, useEffect, useCallback } from 'react';
import { Id } from '../../convex/_generated/dataModel'; // Adjust path as needed

interface TimeEntry {
  subtaskId: Id<"subtasks">;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
}

export function useTimeTracking() {
  const [currentSession, setCurrentSession] = useState<TimeEntry | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('currentTimeSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        const restoredSession: TimeEntry = {
          ...parsed,
          subtaskId: parsed.subtaskId as Id<"subtasks">,
          startTime: new Date(parsed.startTime),
        };
        
        // Calculate current duration based on saved start time
        const now = new Date();
        const duration = Math.floor((now.getTime() - restoredSession.startTime.getTime()) / 1000);
        restoredSession.duration = duration;
        
        setCurrentSession(restoredSession);
        setIsTracking(parsed.isTracking !== false); // Default to true if not specified
        
        console.log('Restored time session:', {
          subtaskId: restoredSession.subtaskId,
          duration: duration,
          startTime: restoredSession.startTime
        });
      } catch (error) {
        console.error('Failed to restore time session:', error);
        localStorage.removeItem('currentTimeSession');
      }
    }
    setIsInitialized(true);
  }, []);

  const startTracking = useCallback((subtaskId: Id<"subtasks">) => {
    // Don't start new session if we already have one for the same subtask
    if (currentSession && currentSession.subtaskId === subtaskId) {
      setIsTracking(true);
      return;
    }

    const newSession: TimeEntry = {
      subtaskId,
      startTime: new Date(),
      duration: 0,
    };
    
    setCurrentSession(newSession);
    setIsTracking(true);
    
    // Save to localStorage as backup
    localStorage.setItem('currentTimeSession', JSON.stringify({
      ...newSession,
      subtaskId: subtaskId as string,
      startTime: newSession.startTime.toISOString(),
      isTracking: true,
    }));
    
    console.log('Started tracking for subtask:', subtaskId);
  }, [currentSession]);

  const stopTracking = useCallback(async () => {
    if (!currentSession) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);
    
    const completedSession: TimeEntry = {
      ...currentSession,
      endTime,
      duration,
    };

    console.log('Stopped tracking. Total duration:', duration, 'seconds');

    // Note: Database saving removed as requested
    // This would be where you'd save to the database:
    // await saveTimeEntry(completedSession);

    setCurrentSession(null);
    setIsTracking(false);
    
    // Clear localStorage
    localStorage.removeItem('currentTimeSession');
    
    return completedSession;
  }, [currentSession]);

  const pauseTracking = useCallback(() => {
    setIsTracking(false);
    
    // Update localStorage to reflect paused state
    if (currentSession) {
      localStorage.setItem('currentTimeSession', JSON.stringify({
        ...currentSession,
        subtaskId: currentSession.subtaskId as string,
        startTime: currentSession.startTime.toISOString(),
        duration: currentSession.duration,
        isTracking: false,
      }));
    }
  }, [currentSession]);

  const resumeTracking = useCallback(() => {
    if (currentSession) {
      setIsTracking(true);
      
      // Update localStorage to reflect resumed state
      localStorage.setItem('currentTimeSession', JSON.stringify({
        ...currentSession,
        subtaskId: currentSession.subtaskId as string,
        startTime: currentSession.startTime.toISOString(),
        duration: currentSession.duration,
        isTracking: true,
      }));
    }
  }, [currentSession]);

  // Update duration every second when tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && currentSession) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000);
        
        setCurrentSession(prev => prev ? { ...prev, duration } : null);
        
        // Update localStorage
        localStorage.setItem('currentTimeSession', JSON.stringify({
          ...currentSession,
          subtaskId: currentSession.subtaskId as string,
          startTime: currentSession.startTime.toISOString(),
          duration,
          isTracking: true,
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, currentSession]);

  return {
    currentSession,
    isTracking,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    isInitialized, // Export this so TimerProvider can wait for initialization
  };
}