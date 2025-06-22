"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Clock, Minimize2, Maximize2, GripVertical, CheckCircle2, Circle, AlertCircle, PauseCircle, XCircle, X, Play, Pause } from "lucide-react";
import { useMutation } from 'convex/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatTime, formatTimeShort } from "@/lib/dateUtils";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "./ui/progress";
import { api } from "../../convex/_generated/api"; // Adjust path as needed
import { Id } from "../../convex/_generated/dataModel"; // Adjust path as needed
import { useTimer } from "./Time/TimerProvider";
import { useTimeTracking } from "@/hooks/use-time-tracker";

type SubjectStatus = "todo" | "in_progress" | "completed" | "on_hold" | "canceled";

const statusIcons = {
  todo: <Circle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  on_hold: <PauseCircle className="h-4 w-4 text-yellow-500" />,
  canceled: <XCircle className="h-4 w-4 text-red-500" />,
};

const priorityColors = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

export default function EnhancedTimeTracker() {
  const { activeSubtask, isTimerVisible, stopTimer, updateSubtaskStatus } = useTimer();

  const {
    currentSession,
    isTracking,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    isInitialized // Add this
  } = useTimeTracking();

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - (280 + 16) : 0,
    y: 65
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const dragRef = useRef<HTMLDivElement>(null);

  // Convex mutations
  const updateSubtaskStatusMutation = useMutation(api.mutations.tasks.updateSubtaskStatus);

  // Start/stop tracking when activeSubtask changes
  useEffect(() => {
    if (!isInitialized) return; // Wait for initialization to complete

    if (activeSubtask && activeSubtask.status === "in_progress") {
      if (!currentSession || currentSession.subtaskId !== activeSubtask.id) {
        startTracking(activeSubtask.id as Id<"subtasks">);
      }
    } else if (currentSession) {
      stopTracking();
    }
  }, [activeSubtask, currentSession, startTracking, stopTracking, isInitialized]); // Add isInitialized to deps
  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const rect = dragRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  }, []);

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - (isMinimized ? 60 : 300);
      const maxY = window.innerHeight - (isMinimized ? 60 : 200);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, isMinimized]);

  const handleStatusChange = useCallback(async (status: SubjectStatus) => {
    if (!activeSubtask) return;

    try {
      // Update local state first for immediate UI feedback
      updateSubtaskStatus(status);

      // Update in database
      await updateSubtaskStatusMutation({
        subtaskId: activeSubtask.id as Id<"subtasks">,
        status,
      });

      // Stop tracking if status is no longer in_progress
      if (status !== "in_progress" && currentSession) {
        const completedSession = await stopTracking();
        console.log(`Time tracking stopped. Total duration: ${completedSession?.duration} seconds`);
      }

      console.log(`Subtask status updated to: ${status}`);
    } catch (error) {
      console.error("Failed to update subtask status:", error);
      // Optionally revert local state on error
      updateSubtaskStatus(activeSubtask.status);
    }
  }, [activeSubtask, updateSubtaskStatus, updateSubtaskStatusMutation, currentSession, stopTracking]);

  const handleCloseTimer = useCallback(async () => {
    if (currentSession) {
      await stopTracking();
    }
    stopTimer();
  }, [currentSession, stopTracking, stopTimer]);

  const handlePlayPause = useCallback(() => {
    if (isTracking) {
      pauseTracking();
    } else if (currentSession) {
      resumeTracking();
    }
  }, [isTracking, currentSession, pauseTracking, resumeTracking]);

  // Don't render if no active subtask or timer not visible
  if (!activeSubtask || !isTimerVisible) {
    return null;
  }

  const displayTime = currentSession ? currentSession.duration : 0;

  // Minimized view
  if (isMinimized) {
    return (
      <div
        ref={dragRef}
        className="fixed z-[9999] pointer-events-auto cursor-move"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative">
          <div className={cn(
            "w-16 h-16 rounded-full backdrop-blur-sm shadow-2xl border-2 flex items-center justify-center transition-colors",
            isTracking
              ? "bg-primary/90 border-primary/20 hover:bg-primary"
              : "bg-muted/90 border-muted/20 hover:bg-muted"
          )}>
            {statusIcons[activeSubtask.status]}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-background border rounded-full px-1.5 py-1 text-[10px] font-mono font-bold text-foreground shadow-sm min-w-[36px] text-center">
            {formatTimeShort(displayTime)}
          </div>
          <button
            className="absolute -top-2 -right-2 bg-background border rounded-full p-1 hover:bg-muted transition-colors flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div
      ref={dragRef}
      className="fixed z-[9999] pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="relative w-fit">
        <Card className="shadow-2xl border-2 bg-background/95 backdrop-blur-sm min-w-[280px] pl-6 relative">
          {/* Drag handle */}
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-7 w-7 text-muted-foreground" />
          </div>

          {/* Control buttons */}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background hover:bg-muted p-1 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
            >
              <Minimize2 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background hover:bg-destructive hover:text-destructive-foreground p-1 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTimer();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Header */}
          <CardHeader className="pb-3 pr-20">
            <div className="flex items-start justify-between space-x-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm flex items-center gap-2 truncate">
                  {statusIcons[activeSubtask.status]}
                  {activeSubtask.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {activeSubtask.projectDetails?.name && (
                    <span className="text-primary">{activeSubtask.projectDetails.name} • </span>
                  )}
                  {isTracking ? "Tracking" : "Paused"} • {formatTime(displayTime)}
                </CardDescription>
              </div>
              {activeSubtask.priority && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full flex-shrink-0",
                  priorityColors[activeSubtask.priority],
                  "bg-opacity-20",
                  activeSubtask.priority === "low" && "bg-green-500",
                  activeSubtask.priority === "medium" && "bg-yellow-500",
                  activeSubtask.priority === "high" && "bg-orange-500",
                  activeSubtask.priority === "urgent" && "bg-red-500",
                )}>
                  {activeSubtask.priority}
                </span>
              )}
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="pt-0 pb-4">
            {activeSubtask.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {activeSubtask.description}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 mb-3">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={handlePlayPause}
                disabled={!currentSession}
              >
                {isTracking ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <div className="text-3xl font-mono font-bold tracking-widest">
                {formatTime(displayTime)}
              </div>
            </div>

            {typeof activeSubtask.progress === 'number' && (
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(activeSubtask.progress)}%</span>
                </div>
                <Progress value={activeSubtask.progress} className="h-2" />
              </div>
            )}

            {/* Status change buttons */}
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              {Object.entries(statusIcons).map(([status, icon]) => (
                <Button
                  key={status}
                  variant={activeSubtask.status === status ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleStatusChange(status as SubjectStatus)}
                  disabled={activeSubtask.status === status}
                >
                  {React.cloneElement(icon, { className: "h-4 w-4" })}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}