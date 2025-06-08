"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageInput } from "@/components/ui/message-input"
import { ChatForm } from "@/components/ui/chat"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"

interface TeamMember {
  _id: string
  name: string
  email: string
  image?: string
}

interface InputWithActionsProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  userAvatarUrl?: string | null
  userName?: string | null
  isLoadingUser?: boolean
  showAvatar?: boolean
  onSend?: () => void
  targetId?: Id<any>;
  targetType?: string;
}

export function InputWithActions({
  value,
  onChange,
  placeholder = "Write something...",
  userAvatarUrl,
  userName,
  isLoadingUser = false,
  showAvatar = true,
  onSend = () => { },
  targetId,
  targetType,
}: InputWithActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const timeout = useRef<number | null>(null)
  const [files, setFiles] = useState<File[] | null>([])
  const [mentionSuggestions, setMentionSuggestions] = useState<TeamMember[]>([])
  const [cursorPosition, setCursorPosition] = useState<number | null>(null)

  const teamMembers = useQuery(
    api.queries.teams.fetchTeamMembersByProject,
    targetType === "project" ? { projectId: targetId as Id<"projects"> } : "skip"
  );
  
  const cancelTimeout = () => {
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
  }

  const setNewTimeout = (callback: () => void, ms: number) => {
    cancelTimeout()
    timeout.current = window.setTimeout(callback, ms)
  }

  const handleInputChange = (text: string) => {
    onChange(text)
    const input = document.activeElement as HTMLInputElement
    const cursor = input?.selectionStart ?? 0
    setCursorPosition(cursor)

    const lastAt = text.lastIndexOf("@", cursor - 1)
    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(text[lastAt - 1]))) {
      const typed = text.slice(lastAt + 1, cursor)
      const filtered =
        teamMembers?.filter(
          (user) =>
            user.name?.toLowerCase().includes(typed.toLowerCase()) ||
            user.email?.toLowerCase().includes(typed.toLowerCase())
        ) ?? []
      setMentionSuggestions(filtered)
    } else {
      setMentionSuggestions([])
    }
  }

  const handleMentionSelect = (member: TeamMember) => {
    if (cursorPosition === null) return

    const before = value.slice(0, cursorPosition)
    const after = value.slice(cursorPosition)
    const atIndex = before.lastIndexOf("@")
    const newText = before.slice(0, atIndex + 1) + member.name + " " + after

    onChange(newText)
    setMentionSuggestions([])
  }

  return (
    <ChatForm
      className="w-full"
      isPending={false}
      handleSubmit={(event) => {
        event?.preventDefault?.()
        onSend?.()
        setIsGenerating(true)
        setNewTimeout(() => setIsGenerating(false), 2000)
      }}
    >
      {() => (
        <div className="flex items-start gap-3 w-full">
          {showAvatar && (
            <div>
              {isLoadingUser ? (
                <div className="size-6 animate-spin">🌀</div>
              ) : (
                <Avatar className="h-10 w-10">
                  <AvatarImage alt={userName ?? "User"} src={userAvatarUrl ?? ""} />
                  <AvatarFallback>{userName?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
              )}
            </div>
          )}

          <div className="relative flex-1">
            <MessageInput
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              allowAttachments
              files={files}
              setFiles={setFiles}
              isGenerating={isGenerating}
            />

            {mentionSuggestions.length > 0 && (
              <ul className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-muted shadow-xl bg-popover text-popover-foreground text-sm">
                {mentionSuggestions.map((member) => (
                  <li
                    key={member._id}
                    className="px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleMentionSelect(member)}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={member.image ?? ""} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{member.name}</span>
                  </li>
                ))}
              </ul>
            )}

          </div>
        </div>
      )}
    </ChatForm>
  )
}
