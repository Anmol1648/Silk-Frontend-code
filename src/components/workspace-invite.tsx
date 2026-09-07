'use client'

import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, PlusSignIcon, UserAdd01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, formatPersonName } from '@/lib/utils'
import {
  inviteMember,
  readMembers,
  type SessionMember,
} from '@/lib/demo-session'

const AVATAR_TONES = ['var(--brand-tone-1)', 'var(--brand-tone-2)', 'var(--brand-tone-3)', 'var(--brand-tone-4)', 'var(--brand-tone-5)'] as const

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function normalizeEmail(v: string) {
  return v.trim().toLowerCase()
}

/** Split pasted or typed text on commas / newlines / semicolons into tokens. */
function splitEmailTokens(raw: string) {
  return raw
    .split(/[,;\n]+/)
    .map(normalizeEmail)
    .filter(Boolean)
}

function initialsFor(name: string, email: string) {
  const label = name.trim() || email.trim()
  const parts = label.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
  }
  return (parts[0]?.[0] || email[0] || '?').toUpperCase()
}

function toneFor(email: string) {
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = (hash + email.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0]
}

function statusLabel(status: SessionMember['status']) {
  if (status === 'owner') return 'Owner'
  if (status === 'active') return 'Member'
  return 'Invited'
}

function MemberAvatar({
  member,
  size = 'default',
  className,
}: {
  member: SessionMember
  size?: 'default' | 'sm'
  className?: string
}) {
  const label = formatPersonName(member.name) || member.email
  return (
    <Avatar size={size} className={className} title={label}>
      <AvatarFallback
        className="text-white font-medium"
        style={{ backgroundColor: toneFor(member.email) }}
      >
        {initialsFor(member.name, member.email)}
      </AvatarFallback>
    </Avatar>
  )
}

function InviteDialog({
  open,
  onOpenChange,
  members,
  onMembersChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: SessionMember[]
  onMembersChange: (members: SessionMember[]) => void
}) {
  const [chips, setChips] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setChips([])
      setDraft('')
      setError('')
      setSending(false)
    }
  }, [open])

  const existingEmails = useMemo(
    () => new Set(members.map(m => m.email.toLowerCase())),
    [members],
  )

  const planCommit = (raw: string, current: string[]) => {
    const tokens = splitEmailTokens(raw)
    const next = [...current]
    const invalid: string[] = []
    const duplicates: string[] = []
    let added = 0

    for (const token of tokens) {
      if (!isValidEmail(token)) {
        invalid.push(token)
        continue
      }
      if (existingEmails.has(token) || next.includes(token)) {
        duplicates.push(token)
        continue
      }
      next.push(token)
      added += 1
    }

    return { next, invalid, duplicates, added }
  }

  const applyCommit = (raw: string) => {
    const result = planCommit(raw, chips)
    setChips(result.next)

    if (result.invalid.length > 0) {
      setError(
        result.invalid.length === 1
          ? `"${result.invalid[0]}" is not a valid email.`
          : 'One or more addresses are not valid emails.',
      )
      return { ...result, ok: false as const }
    }

    if (result.added === 0 && result.duplicates.length > 0) {
      setError(
        result.duplicates.length === 1
          ? 'That email is already invited or in this workspace.'
          : 'Those emails are already invited or in this workspace.',
      )
      return { ...result, ok: false as const }
    }

    setError('')
    return { ...result, ok: true as const }
  }

  const removeChip = (email: string) => {
    setChips(prev => prev.filter(c => c !== email))
    setError('')
  }

  /** Turn completed addresses (before delimiters) into chips; keep trailing draft. */
  const commitFromDelimitedValue = (value: string) => {
    const parts = value.split(/[,;\n]/)
    const complete = parts.slice(0, -1).join(',')
    const rest = (parts[parts.length - 1] ?? '').replace(/^\s+/, '')

    if (!complete.trim()) {
      setDraft(rest)
      return
    }

    const result = applyCommit(complete)
    if (!result.ok && result.added === 0) {
      // Don't drop the address — leave it editable when invalid/duplicate.
      const fallback = result.invalid[result.invalid.length - 1]
        ?? result.duplicates[result.duplicates.length - 1]
        ?? complete.trim()
      setDraft(fallback)
      return
    }
    setDraft(rest)
  }

  const onDraftChange = (value: string) => {
    if (/[,;\n]/.test(value)) {
      commitFromDelimitedValue(value)
      return
    }
    setError('')
    setDraft(value)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Let comma reach onChange so chip creation is driven by the input value.
    if (e.key === 'Enter') {
      e.preventDefault()
      if (draft.trim()) {
        const result = applyCommit(draft)
        if (result.ok || result.added > 0) setDraft('')
      }
      return
    }
    if (e.key === 'Tab' && draft.trim()) {
      e.preventDefault()
      const result = applyCommit(draft)
      if (result.ok || result.added > 0) setDraft('')
      return
    }
    if (e.key === 'Backspace' && !draft && chips.length > 0) {
      e.preventDefault()
      removeChip(chips[chips.length - 1]!)
    }
  }

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (!text || !/[,;\n]/.test(text)) return
    e.preventDefault()
    commitFromDelimitedValue(`${draft}${text}`)
  }

  const onBlur = () => {
    if (!draft.trim()) return
    const result = applyCommit(draft)
    if (result.ok || result.added > 0) setDraft('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    let pending = [...chips]
    if (draft.trim()) {
      const tokens = splitEmailTokens(draft)
      const invalid = tokens.filter(t => !isValidEmail(t))
      if (invalid.length > 0) {
        setError(
          invalid.length === 1
            ? `"${invalid[0]}" is not a valid email.`
            : 'One or more addresses are not valid emails.',
        )
        return
      }
      for (const token of tokens) {
        if (!existingEmails.has(token) && !pending.includes(token)) pending.push(token)
      }
    }

    if (pending.length === 0) {
      setError('Add at least one email address.')
      return
    }

    setSending(true)
    await new Promise(r => setTimeout(r, 280))

    let latest = members
    const failed: string[] = []
    for (const email of pending) {
      const result = inviteMember({ email })
      if (!result.ok) {
        failed.push(email)
        continue
      }
      latest = result.members ?? readMembers()
    }

    setSending(false)
    onMembersChange(latest)

    if (failed.length > 0) {
      setChips(failed)
      setDraft('')
      setError(
        failed.length === 1
          ? 'Could not invite that address.'
          : 'Some invites could not be sent.',
      )
      return
    }

    setChips([])
    setDraft('')
  }

  const canInvite = chips.length > 0 || Boolean(draft.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="font-sans text-[16px] font-semibold text-foreground">
            Invite to workspace
          </DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            Onboard co-founders or team members to collaborate in this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="px-5 pt-4 pb-2">
            <div
              role="group"
              aria-label="Invite emails"
              onClick={() => inputRef.current?.focus()}
              className={cn(
                'w-full min-h-10 px-2 py-1.5 rounded-lg border bg-background',
                'flex flex-wrap items-center gap-1.5 cursor-text transition-all duration-150',
                'focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/[0.08]',
                error ? 'border-destructive/50' : 'border-input',
              )}
            >
              {chips.map(email => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 max-w-full h-7 pl-2.5 pr-1 rounded-md bg-muted text-[12.5px] text-foreground"
                >
                  <span className="truncate">{email}</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      removeChip(email)
                    }}
                    className="size-5 rounded-md flex items-center justify-center text-foreground-subtle hover:text-secondary-foreground hover:bg-input/80 transition-colors"
                    aria-label={`Remove ${email}`}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                inputMode="email"
                autoComplete="off"
                value={draft}
                onChange={e => onDraftChange(e.target.value)}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                onBlur={onBlur}
                placeholder={chips.length === 0 ? 'Email addresses, separated by commas' : 'Add another'}
                className="flex-1 min-w-[140px] h-7 px-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground-subtle outline-none"
              />
            </div>
            {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
          </div>

          <div className="px-5 pt-3 pb-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-subtle mb-2.5">
              In this workspace
            </div>
            <ul className="space-y-1 max-h-64 overflow-y-auto -mx-1">
              {members.map(member => {
                const isPending = member.status === 'invited'
                const displayName = isPending
                  ? member.email
                  : (formatPersonName(member.name) || member.email)
                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-1 py-2 rounded-lg"
                  >
                    <MemberAvatar member={member} size="sm" />
                    <div className="min-w-0 flex-1 text-[13.5px] font-medium text-foreground truncate">
                      {displayName}
                    </div>
                    {isPending ? (
                      <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-md bg-amber-50 text-[11.5px] font-medium text-amber-800">
                        Pending invite
                      </span>
                    ) : (
                      <span className="text-[11.5px] font-medium text-foreground-subtle shrink-0">
                        {member.role || statusLabel(member.status)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="px-5 py-4 border-t border-border">
            <button
              type="submit"
              disabled={sending || !canInvite}
              className={cn(
                'w-full h-11 rounded-xl text-[14px] font-medium text-primary-foreground',
                'bg-primary hover:bg-primary-hover active:bg-primary-active',
                'transition-colors disabled:opacity-55 disabled:cursor-not-allowed',
              )}
            >
              {sending
                ? 'Sending…'
                : chips.length > 1
                  ? `Invite ${chips.length}`
                  : 'Invite'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function WorkspaceInviteControl({
  collapsed = false,
}: {
  collapsed?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<SessionMember[]>([])

  useEffect(() => {
    setMembers(readMembers())
  }, [])

  useEffect(() => {
    if (open) setMembers(readMembers())
  }, [open])

  const stack = members.slice(0, 3)

  return (
    <>
      {collapsed ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Invite"
          aria-label="Invite"
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {stack[0] ? (
            <MemberAvatar member={stack[0]} size="sm" />
          ) : (
            <HugeiconsIcon icon={UserAdd01Icon} size={17} strokeWidth={1.7} />
          )}
        </button>
      ) : (
        <div className="rounded-xl bg-secondary p-3 ring-1 ring-foreground/4">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 font-heading text-[17px] font-normal leading-[1.2] tracking-[-0.03em] text-foreground-subtle">
              Invite
            </p>
            <AvatarGroup className="shrink-0 -space-x-2">
              {stack.map(member => (
                <MemberAvatar key={member.id} member={member} size="sm" />
              ))}
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Invite"
                className={cn(
                  'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full',
                  'bg-background text-muted-foreground ring-2 ring-background',
                  'transition-colors hover:bg-muted hover:text-foreground',
                )}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={11} strokeWidth={2.2} />
              </button>
            </AvatarGroup>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            It&apos;s good to onboard your co-founders or team members to collaborate.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              'mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg',
              'bg-primary text-[12.5px] font-medium text-primary-foreground',
              'transition-colors hover:bg-primary-hover active:bg-primary-active',
            )}
          >
            <HugeiconsIcon icon={UserAdd01Icon} size={14} strokeWidth={2} />
            Invite
          </button>
        </div>
      )}

      <InviteDialog
        open={open}
        onOpenChange={setOpen}
        members={members}
        onMembersChange={setMembers}
      />
    </>
  )
}
