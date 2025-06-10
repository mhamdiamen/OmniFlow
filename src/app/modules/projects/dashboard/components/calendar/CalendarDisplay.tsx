"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { useQuery } from "convex/react"
import { format, isSameDay } from "date-fns"
import { api } from "../../../../../../../convex/_generated/api"
import { Id } from "../../../../../../../convex/_generated/dataModel"

export function CalendarDisplay() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  const currentUser = useQuery(api.users.CurrentUser)

  const tasks = useQuery(
    api.queries.tasks.fetchAllTasksByAssignee,
    currentUser?._id
      ? { assigneeId: currentUser._id as Id<"users"> }
      : "skip"
  )

  const occupiedDates = React.useMemo(() => {
    if (!tasks) return []
    return tasks
      .map(task => task.dueDate ? new Date(task.dueDate) : null)
      .filter((date): date is Date => date !== null)
  }, [tasks])

  // Custom component for each day
  const DayContent = (props: { date: Date }) => {
    const { date: day } = props
    const isOccupied = occupiedDates.some(d => isSameDay(d, day))

    return (
      <div className="flex flex-col items-center">
        <span>{day.getDate()}</span>
        {isOccupied && <span className="text-green-500 text-xs font-bold">O</span>}
      </div>
    )
  }

  return (
    <div className="scale-110 m-6 p-4 border rounded-lg">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        components={{ DayContent }}
      />
    </div>
  )
}