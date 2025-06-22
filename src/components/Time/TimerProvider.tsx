"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';

interface TimerSubtask {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed" | "on_hold" | "canceled";
  priority?: "low" | "medium" | "high" | "urgent";
  progress?: number;
  type?: string;
  parentTask?: {
    name: string;
    projectId: Id<"projects">;
  };
  projectDetails?: {
    name: string;
  };
}

interface TimerContextType {
  activeSubtask: TimerSubtask | null;
  isTimerVisible: boolean;
  startTimer: (subtask: TimerSubtask) => void;
  stopTimer: () => void;
  updateSubtaskStatus: (status: "todo" | "in_progress" | "completed" | "on_hold" | "canceled") => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}

interface TimerProviderProps {
  children: React.ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
  const [activeSubtask, setActiveSubtask] = useState<TimerSubtask | null>(null);
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current user to fetch their in-progress subtasks
  const currentUser = useQuery(api.users.CurrentUser);
  
  // Fetch all in-progress subtasks for the current user
  const inProgressSubtasks = useQuery(
    api.queries.tasks.fetchAllSubtasksByAssignee,
    currentUser?._id
      ? {
          assigneeId: currentUser._id as Id<"users">,
          status: "in_progress",
        }
      : "skip"
  );

  // Check for restored session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('currentTimeSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        const subtaskId = parsed.subtaskId;
        
        // We need to wait for the subtasks to load to get the full subtask data
        if (inProgressSubtasks && inProgressSubtasks.length > 0) {
          const matchingSubtask = inProgressSubtasks.find(st => st._id === subtaskId);
          
          if (matchingSubtask) {
            const timerSubtask: TimerSubtask = {
              id: matchingSubtask._id,
              title: matchingSubtask.label,
              description: undefined,
              status: matchingSubtask.status,
              priority: matchingSubtask.parentTask?.priority,
              progress: matchingSubtask.parentTask?.progress,
              type: matchingSubtask.parentTask?.name ? `Task: ${matchingSubtask.parentTask.name}` : 'Subtask',
              parentTask: matchingSubtask.parentTask ? {
                name: matchingSubtask.parentTask.name,
                projectId: matchingSubtask.parentTask.projectId,
              } : undefined,
              projectDetails: matchingSubtask.projectDetails ? {
                name: matchingSubtask.projectDetails.name,
              } : undefined,
            };

            setActiveSubtask(timerSubtask);
            setIsTimerVisible(true);
            
            console.log('Restored timer for subtask:', timerSubtask.title);
          } else {
            // Subtask not found in in-progress list, clean up localStorage
            localStorage.removeItem('currentTimeSession');
          }
        }
      } catch (error) {
        console.error('Failed to restore timer state:', error);
        localStorage.removeItem('currentTimeSession');
      }
    }
    setIsInitialized(true);
  }, [inProgressSubtasks]);

  // Auto-start timer when user has in-progress subtasks (only if no restored session)
  useEffect(() => {
    if (!isInitialized) return;
    
    const savedSession = localStorage.getItem('currentTimeSession');
    if (savedSession) return; // Don't auto-start if we have a saved session
    
    if (inProgressSubtasks && inProgressSubtasks.length > 0 && !activeSubtask) {
      // Get the most recently created in-progress subtask
      const mostRecentSubtask = inProgressSubtasks.reduce((latest, current) => {
        return current.createdAt > latest.createdAt ? current : latest;
      });

      const timerSubtask: TimerSubtask = {
        id: mostRecentSubtask._id,
        title: mostRecentSubtask.label,
        description: undefined,
        status: mostRecentSubtask.status,
        priority: mostRecentSubtask.parentTask?.priority,
        progress: mostRecentSubtask.parentTask?.progress,
        type: mostRecentSubtask.parentTask?.name ? `Task: ${mostRecentSubtask.parentTask.name}` : 'Subtask',
        parentTask: mostRecentSubtask.parentTask ? {
          name: mostRecentSubtask.parentTask.name,
          projectId: mostRecentSubtask.parentTask.projectId,
        } : undefined,
        projectDetails: mostRecentSubtask.projectDetails ? {
          name: mostRecentSubtask.projectDetails.name,
        } : undefined,
      };

      setActiveSubtask(timerSubtask);
      setIsTimerVisible(true);
    }
  }, [inProgressSubtasks, activeSubtask, isInitialized]);

  // Hide timer when no in-progress subtasks
  useEffect(() => {
    if (inProgressSubtasks && inProgressSubtasks.length === 0 && activeSubtask) {
      setActiveSubtask(null);
      setIsTimerVisible(false);
      // Also clear any saved session since there are no in-progress subtasks
      localStorage.removeItem('currentTimeSession');
    }
  }, [inProgressSubtasks, activeSubtask]);

  const startTimer = useCallback((subtask: TimerSubtask) => {
    setActiveSubtask(subtask);
    setIsTimerVisible(true);
  }, []);

  const stopTimer = useCallback(() => {
    setActiveSubtask(null);
    setIsTimerVisible(false);
    // Clear saved session when timer is stopped
    localStorage.removeItem('currentTimeSession');
  }, []);

  const updateSubtaskStatus = useCallback((status: "todo" | "in_progress" | "completed" | "on_hold" | "canceled") => {
    if (activeSubtask) {
      setActiveSubtask(prev => prev ? { ...prev, status } : null);
      
      // If status is no longer in_progress, hide the timer
      if (status !== "in_progress") {
        // Small delay to allow the status update to complete
        setTimeout(() => {
          setIsTimerVisible(false);
          setActiveSubtask(null);
          localStorage.removeItem('currentTimeSession');
        }, 1000);
      }
    }
  }, [activeSubtask]);

  const contextValue: TimerContextType = {
    activeSubtask,
    isTimerVisible,
    startTimer,
    stopTimer,
    updateSubtaskStatus,
  };

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
}