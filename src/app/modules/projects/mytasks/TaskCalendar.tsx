"use client"

import { useState, useEffect } from "react"
import { fromUnixTime, addHours } from "date-fns"
import { CalendarEvent, EventColor } from "@/types/types" // Import EventColor if it exists
import { EventCalendar } from "../../../../components/event-calendar"
import { useQuery } from 'convex/react'
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { Skeleton } from "@/components/ui/skeleton"
import { ViewTaskSheet } from "../tasks/components/ViewTaskSheet"

// Define a type guard for EventColor
const isEventColor = (color: string): color is EventColor => {
  return ['rose', 'red', 'amber', 'emerald', 'sky', 'orange', 'violet'].includes(color)
}

export default function TaskCalendar() {
  const currentUser = useQuery(api.users.CurrentUser)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const tasks = useQuery(
    api.queries.tasks.fetchAllTasksByAssignee,
    currentUser?._id
      ? { assigneeId: currentUser._id as Id<"users"> }
      : "skip"
  )

  useEffect(() => {
    if (tasks && currentUser) {
      const calendarEvents: CalendarEvent[] = tasks
        .filter(task => task.dueDate)
        .map(task => {
          const priorityColor = getColorForPriority(task.priority)
          const color: EventColor = isEventColor(priorityColor) ? priorityColor : 'sky'

          const startDate = new Date(task.dueDate!)
          const endDate = addHours(startDate, 1)

          return {
            id: task._id,
            title: task.name,
            description: task.description || "",
            start: startDate,
            end: endDate,
            allDay: true,
            color,
            status: task.status,
            priority: task.priority,
            projectDetails: task.projectDetails,
            assigneeDetails: task.assigneeDetails,
            location: task.projectDetails?.name || '',
          }
        })

      setEvents(calendarEvents)
    }
  }, [tasks, currentUser])

  // Handle when a task is selected from the calendar
  const handleTaskSelect = (event: CalendarEvent) => {
    setSelectedTaskId(event.id as Id<"tasks">)
    setIsSheetOpen(true)
  }

  const getColorForPriority = (priority: string): string => {
    switch (priority) {
      case "urgent": return "rose"
      case "high": return "red"
      case "medium": return "amber"
      case "low": return "emerald"
      default: return "sky"
    }
  }

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents([...events, event])
  }

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(events.map(event => event.id === updatedEvent.id ? updatedEvent : event))
  }

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId))
  }

  if (!currentUser) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  return (
    <div>
    

      <EventCalendar
        events={events}
        onEventSelect={handleTaskSelect} // Pass the select handler

      />
      {/* Add the ViewTaskSheet component */}
      <ViewTaskSheet
        taskId={selectedTaskId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  )
}