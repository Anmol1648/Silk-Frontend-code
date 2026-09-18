import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, PlusSignIcon, UserAdd01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { useAuth, useToast } from '../context/AppContext';

const AVATAR_TONES = [
  '#2a2a2e',
  '#3f3f46',
  '#52525b',
  '#18181b',
  '#27272a'
];

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizeEmail(v) {
  return v.trim().toLowerCase();
}

function splitEmailTokens(raw) {
  return raw
    .split(/[,;\n]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function initialsFor(name, email) {
  const label = (name || '').trim() || (email || '').trim();
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }
  return (parts[0]?.[0] || email?.[0] || 'S').toUpperCase();
}

function toneFor(email) {
  let hash = 0;
  const str = email || 'user@silk.ai';
  for (let i = 0; i < str.length; i++) hash = (hash + str.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash] || AVATAR_TONES[0];
}

const MEMBERS_KEY = 'silk_members';

function getDefaultOwner(user) {
  const name = user?.displayName || (user?.email ? user.email.split('@')[0] : 'User');
  const email = user?.email || 'founder@fundos.ai';
  return {
    id: 'm_owner',
    name,
    email,
    role: 'Founder',
    status: 'owner',
  };
}

export function readMembers(user, companyId) {
  if (typeof window === 'undefined') return [];
  const owner = getDefaultOwner(user);
  const key = companyId ? `silk_company_members_${companyId}` : MEMBERS_KEY;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const invitees = parsed.filter(m => m.status !== 'owner' && m.email !== owner.email);
        return [owner, ...invitees];
      }
    }
  } catch (e) { }

  return [owner];
}

export function inviteMember(input, companyId, user) {
  if (typeof window === 'undefined') return { ok: false, error: 'Unavailable' };
  const email = (input.email || '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'Enter an email address.' };
  if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' };

  const members = readMembers(user, companyId);
  if (members.some(m => m.email.toLowerCase() === email)) {
    return { ok: false, error: 'That person is already in this workspace.' };
  }

  const next = [
    ...members,
    {
      id: `m_${email}`,
      name: input.name?.trim() || email.split('@')[0] || 'Invitee',
      email,
      role: input.role?.trim() || 'Member',
      status: 'invited',
    },
  ];
  const key = companyId ? `silk_company_members_${companyId}` : MEMBERS_KEY;
  sessionStorage.setItem(key, JSON.stringify(next));
  return { ok: true, members: next };
}

function MemberAvatar({ member, size = 'default', className = '' }) {
  const initials = initialsFor(member.name, member.email);
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-[12px]';

  return (
    <div
      title={member.name || member.email}
      style={{ backgroundColor: toneFor(member.email) }}
      className={`rounded-full flex items-center justify-center font-medium text-white shrink-0 ${sizeClasses} ${className}`}
    >
      {initials}
    </div>
  );
}

export function InviteModal({
  open,
  onClose,
  members: propMembers,
  onMembersChange,
  title = 'Invite to workspace',
  description = 'Onboard co-founders or team members to collaborate in this workspace.',
  company,
  sectionTitle,
  submitButtonText,
}) {
  const { user } = useAuth();
  const { toast } = useToast?.() || {};
  const [internalMembers, setInternalMembers] = useState([]);
  const [chips, setChips] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (!propMembers) {
        setInternalMembers(readMembers(user, company?.companyId));
      }
    } else {
      setChips([]);
      setDraft('');
      setError('');
      setSending(false);
    }
  }, [open, propMembers, company?.companyId, user]);

  const members = propMembers || internalMembers;

  const existingEmails = useMemo(
    () => new Set((members || []).map(m => m.email.toLowerCase())),
    [members]
  );

  if (!open) return null;

  const removeChip = (email) => {
    setChips(prev => prev.filter(c => c !== email));
    setError('');
  };

  const applyCommit = (raw) => {
    const tokens = splitEmailTokens(raw);
    const next = [...chips];
    const invalid = [];
    const duplicates = [];

    for (const token of tokens) {
      if (!isValidEmail(token)) {
        invalid.push(token);
        continue;
      }
      if (existingEmails.has(token) || next.includes(token)) {
        duplicates.push(token);
        continue;
      }
      next.push(token);
    }

    if (invalid.length > 0) {
      setError(invalid.length === 1 ? `"${invalid[0]}" is not a valid email.` : 'One or more addresses are not valid emails.');
      return false;
    }

    if (tokens.length > 0 && next.length === chips.length && duplicates.length > 0) {
      setError('That email is already invited or in this workspace.');
      return false;
    }

    setChips(next);
    setError('');
    return true;
  };

  const onDraftChange = (value) => {
    if (/[,;\n]/.test(value)) {
      const parts = value.split(/[,;\n]/);
      const complete = parts.slice(0, -1).join(',');
      const rest = parts[parts.length - 1] || '';
      if (complete.trim()) applyCommit(complete);
      setDraft(rest);
      return;
    }
    setError('');
    setDraft(value);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (draft.trim()) {
        e.preventDefault();
        if (applyCommit(draft)) setDraft('');
      }
    } else if (e.key === 'Backspace' && !draft && chips.length > 0) {
      removeChip(chips[chips.length - 1]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    let pending = [...chips];
    if (draft.trim()) {
      const tokens = splitEmailTokens(draft);
      const invalid = tokens.filter(t => !isValidEmail(t));
      if (invalid.length > 0) {
        setError('One or more addresses are not valid emails.');
        return;
      }
      for (const token of tokens) {
        if (!existingEmails.has(token) && !pending.includes(token)) pending.push(token);
      }
    }

    if (pending.length === 0) {
      setError('Add at least one email address.');
      return;
    }

    setSending(true);
    await new Promise(r => setTimeout(r, 280));

    let latest = members;
    for (const email of pending) {
      const result = inviteMember({ email }, company?.companyId, user);
      if (result.ok) latest = result.members || readMembers(user, company?.companyId);
    }

    setSending(false);
    if (onMembersChange) {
      onMembersChange(latest);
    } else {
      setInternalMembers(latest);
    }
    if (toast) {
      toast(pending.length === 1 ? `Invitation sent to ${pending[0]}` : `Invitations sent to ${pending.length} people`);
    }
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden border border-[#e5e7eb] animate-in fade-in zoom-in-95 duration-150 relative"
      >
        <div className="px-5 pt-5 pb-4 border-b border-[#f3f4f6] relative pr-12">
          <h3 className="font-sans text-[16px] font-semibold text-[#030712]">{title}</h3>
          <p className="text-[14px] text-[#6b7280] mt-1 leading-snug">
            {description}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 size-7 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#030712] hover:bg-[#f3f4f6] transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="px-5 pt-4 pb-2">
            <div
              role="group"
              onClick={() => inputRef.current?.focus()}
              className={`w-full min-h-10 px-2 py-1.5 rounded-lg border bg-white flex flex-wrap items-center gap-1.5 cursor-text transition-all duration-150 ${error
                ? 'border-red-400'
                : 'border-[#e5e7eb] focus-within:border-[#030712] focus-within:ring-4 focus-within:ring-[#030712]/[0.08]'
                }`}
            >
              {chips.map(email => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 max-w-full h-7 pl-2.5 pr-1 rounded-md bg-[#f4f4f5] text-[12.5px] text-[#030712]"
                >
                  <span className="truncate">{email}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChip(email);
                    }}
                    className="size-5 rounded-md flex items-center justify-center text-[#9ca3af] hover:text-[#030712] transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={e => onDraftChange(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => {
                  if (draft.trim() && applyCommit(draft)) setDraft('');
                }}
                placeholder={chips.length === 0 ? 'Email addresses, separated by commas' : 'Add another'}
                className="flex-1 min-w-[140px] h-7 px-1 bg-transparent text-[14px] text-[#030712] placeholder:text-[#9ca3af] outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none"
                style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
              />
            </div>
            {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}
          </div>

          <div className="px-5 pt-3 pb-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2.5">
              {sectionTitle || 'In this workspace'}
            </div>
            <ul className="space-y-1 max-h-64 overflow-y-auto -mx-1">
              {(members || []).map(member => {
                const isPending = member.status === 'invited';
                return (
                  <li key={member.id || member.email} className="flex items-center gap-3 px-1 py-2 rounded-lg">
                    <MemberAvatar member={member} size="sm" />
                    <div className="min-w-0 flex-1 text-[13.5px] font-medium text-[#030712] truncate">
                      {member.name || member.email}
                    </div>
                    {isPending ? (
                      <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-md bg-amber-50 text-[11.5px] font-medium text-amber-800">
                        Pending invite
                      </span>
                    ) : (
                      <span className="text-[11.5px] font-medium text-[#9ca3af] shrink-0">
                        {member.role || 'Owner'}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="px-5 py-4 border-t border-[#f3f4f6]">
            <button
              type="submit"
              disabled={sending || (chips.length === 0 && !draft.trim())}
              className="w-full h-11 rounded-xl text-[14px] font-medium text-white bg-[#030712] hover:bg-[#18181b] active:bg-[#27272a] transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {sending
                ? 'Sending…'
                : chips.length > 1
                  ? `${submitButtonText || 'Invite'} ${chips.length}`
                  : (submitButtonText || 'Invite')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function WorkspaceInviteControl({ collapsed = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    setMembers(readMembers(user));
  }, [user]);

  useEffect(() => {
    if (open) setMembers(readMembers(user));
  }, [open, user]);

  const stack = members.slice(0, 2);

  return (
    <>
      {collapsed ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Invite team"
          className="flex size-10 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f4f4f5] hover:text-[#030712]"
        >
          <HugeiconsIcon icon={UserAdd01Icon} size={17} strokeWidth={1.7} />
        </button>
      ) : (
        <div className="rounded-xl bg-[#fafafa] p-2.5 px-3 ring-1 ring-black/[0.04]">
          <div className="flex items-center justify-between gap-2">
            <p
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              className="min-w-0 text-[16.5px] font-normal leading-[1.15] tracking-[-0.03em] text-[#9ca3af]"
            >
              Invite
            </p>
            <div className="flex items-center -space-x-2 shrink-0">
              {stack.map((member) => (
                <MemberAvatar key={member.id || member.email} member={member} size="sm" className="ring-2 ring-white" />
              ))}
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Invite"
                className="relative z-10 flex size-5.5 shrink-0 items-center justify-center rounded-full bg-white text-[#6b7280] ring-2 ring-white hover:bg-[#f4f4f5] hover:text-[#030712] transition-colors"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={10} strokeWidth={2.2} />
              </button>
            </div>
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-[#6b7280]">
            It&apos;s good to onboard your co-founders or team members to collaborate.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 inline-flex h-7.5 w-full items-center justify-center gap-1.5 rounded-lg bg-[#030712] text-[12px] font-medium text-white transition-colors hover:bg-[#18181b] active:bg-[#27272a]"
          >
            <HugeiconsIcon icon={UserAdd01Icon} size={13} strokeWidth={2} />
            Invite
          </button>
        </div>
      )}

      <InviteModal
        open={open}
        onClose={() => setOpen(false)}
        members={members}
        onMembersChange={setMembers}
      />
    </>
  );
}

export function ShareCompanyModal({ open, onClose, company, onMembersChange }) {
  return (
    <InviteModal
      open={open}
      onClose={onClose}
      company={company}
      title={`Share ${company?.companyName}`}
      description={
        company?.companyName
          ? `Onboard co-founders or team members to collaborate on ${company.companyName}.`
          : 'Onboard co-founders or team members to collaborate in this workspace.'
      }
      sectionTitle={company?.companyName ? `In ${company.companyName}` : 'In this workspace'}
      submitButtonText="Share"
      onMembersChange={onMembersChange}
    />
  );
}

