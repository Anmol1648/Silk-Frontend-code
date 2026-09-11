import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api/endpoints';
import { useAuth, useToast } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  Home01Icon,
  File02Icon,
  Target01Icon,
  DiscoverCircleIcon,
  Message02Icon,
  FileValidationIcon,
  Briefcase09Icon,
  PolicyIcon,
} from '@hugeicons/core-free-icons';

const COOLDOWN = 30;

function SilkMark({ className = '', size = 14, inverted = false }) {
  const logoSrc = inverted ? '/brand/silk-logo-white.svg' : '/brand/silk-logo.svg';
  return (
    <img
      src={logoSrc}
      alt="Silk"
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
    />
  );
}

function AiMark({ size = 10, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 0C9.384 0 10.576-.0002 11.495.445C12.393.881 13.119 1.607 13.555 2.505C14 3.424 14 4.616 14 7C14 9.384 14 9.576 13.555 10.495C13.119 11.393 12.393 12.119 11.495 12.555C10.576 13 9.384 13 7 13H2.845C1.849 13 1.351 13 0.971 12.807C.636 12.636.364 12.364.193 12.029-.0003 11.649 0 11.151 0 10.155V7C0 4.616-.0002 3.424.445 2.505C.881 1.607 1.607.881 2.505.445C3.424-.0002 4.616 0 7 0Z"
        fill="currentColor"
      />
      <path
        d="M7.855 3.235C7.278 2.922 6.698 2.922 6.121 3.235L6.722 6.757L3.591 5.121C3.351 5.353 3.186 5.613 3.098 5.902C3.009 6.192 2.98 6.51 3.013 6.857H3.02L6.512 7.378L4.006 9.958C4.246 10.57 4.72 10.918 5.427 11L6.992 7.85L8.582 11C9.287 10.918 9.763 10.57 10.003 9.958L7.473 7.378L10.988 6.857C11.019 6.51 10.989 6.192 10.892 5.902C10.794 5.613 10.626 5.353 10.386 5.121L7.277 6.757L7.855 3.235Z"
        fill="#18181b"
      />
    </svg>
  );
}

function AuthBrand({ inverted = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${inverted ? 'bg-white/15 text-white' : 'bg-[#f4f4f5] text-[#030712]'
          }`}
      >
        <SilkMark size={14} inverted={inverted} />
      </div>
      <span
        className={`font-medium text-[16px] tracking-[-0.02em] ${inverted ? 'text-white' : 'text-[#030712]'
          }`}
      >
        Silk
      </span>
    </div>
  );
}

const MINI_GAUGE_TICKS = Array.from({ length: 40 }, (_, i) => {
  const t = i / 40;
  const angle = Math.PI / 2 - Math.PI * 2 * t;
  const cx = 43;
  const cy = 43;
  const r = 36;
  const tick = 5;
  const n = (v) => v.toFixed(3);
  return {
    t,
    x1: n(cx + (r - tick) * Math.cos(angle)),
    y1: n(cy - (r - tick) * Math.sin(angle)),
    x2: n(cx + r * Math.cos(angle)),
    y2: n(cy - r * Math.sin(angle)),
  };
});

function MiniField({ label, value, placeholderWidth }) {
  return (
    <div className="mb-2.5">
      <div className="mb-1 text-[8px] font-medium text-foreground">{label}</div>
      {value ? (
        <div className="rounded-md bg-secondary px-2 py-1.5 text-[9.5px] font-medium text-popover-foreground truncate">
          {value}
        </div>
      ) : (
        <div className="rounded-md bg-secondary px-2 py-1.5">
          <div
            className="h-1.5 rounded-full bg-surface-focus"
            style={{ width: placeholderWidth }}
          />
        </div>
      )}
    </div>
  );
}

function MiniAvatar({ initial, filled }) {
  return (
    <div
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-full text-[7.5px] font-medium ${filled ? 'bg-surface-focus text-secondary-foreground' : 'bg-surface-focus'
        }`}
    >
      {filled ? initial : null}
    </div>
  );
}

function MiniGauge({ score = 4, done = 0, total = 12, ladder = 'Not ready' }) {
  const pct = Math.max(0.04, Math.min(1, score / 100));

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[86px]">
        <svg viewBox="0 0 86 86" className="block w-full" aria-hidden>
          {MINI_GAUGE_TICKS.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.t <= pct ? 'var(--readiness-mark)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)'}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-0.5">
          <p className="font-heading text-[15px] leading-none tracking-[-0.05em] text-foreground tabular-nums">
            {score}
          </p>
          <p className="mt-0.5 text-[6.5px] text-foreground-subtle">out of 100</p>
        </div>
      </div>
      <span className="mt-1 inline-flex items-center rounded-full bg-[var(--readiness-mark-soft)] px-1.5 py-px text-[7px] font-medium text-popover-foreground">
        {ladder}
      </span>
      <p className="mt-0.5 text-[7px] tabular-nums text-foreground-subtle">
        {done}/{total} verified
      </p>
    </div>
  );
}

function WorkspacePreview({ companyName, email, name }) {
  const displayCompany = companyName || (email ? email.split('@')[0] : '');
  const displayName = name || (email ? email.split('@')[0] : '');

  const done = [displayCompany, email, displayName].filter(Boolean).length;
  const percent = Math.min(22, Math.max(4, Math.round((done / 12) * 100)));
  const ladder = percent > 15 ? 'Early' : 'Not ready';

  return (
    <div
      className="overflow-hidden bg-background text-foreground"
      style={{
        width: 560,
        borderRadius: 14,
        boxShadow: '0 44px 90px -18px rgba(0,0,0,0.58), 0 0 0 1px rgba(255,255,255,0.08)',
        fontFamily: 'var(--font-schibsted), system-ui, sans-serif',
      }}
    >
      {/* Window Titlebar Dots */}
      <div className="flex h-8 items-center gap-1.5 border-b border-foreground/4 bg-muted px-3.5">
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} className="size-[10px] rounded-full" style={{ backgroundColor: c }} />
        ))}
      </div>

      <div className="flex" style={{ height: 400 }}>
        {/* Left Mini Sidebar */}
        <div className="flex w-[152px] shrink-0 flex-col overflow-hidden border-r border-border bg-background">
          <div className="flex h-12 shrink-0 items-center gap-2 px-3">
            <div className="flex size-[22px] shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
              <SilkMark size={13} />
            </div>
            {displayCompany ? (
              <span className="min-w-0 truncate text-[11px] font-medium tracking-[-0.02em] text-foreground">
                {displayCompany}
              </span>
            ) : (
              <div className="h-1.5 w-16 rounded-full bg-surface-focus" />
            )}
          </div>

          <nav className="min-h-0 flex-1 overflow-hidden px-2">
            <div className="mt-0.5">
              <div className="mb-1 px-2 text-[7px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                MAIN
              </div>
              <div className="flex h-[22px] items-center gap-1.5 rounded-md px-2 text-[10px] text-muted-foreground">
                <HugeiconsIcon icon={Home01Icon} size={11} strokeWidth={1.7} />
                <span>Home</span>
              </div>
            </div>

            <div className="mt-3.5">
              <div className="mb-1 px-2 text-[7px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                WORKSPACE
              </div>
              <div className="space-y-px text-[10px]">
                <div className="flex h-[22px] items-center gap-1.5 rounded-md bg-muted px-2 font-medium text-foreground">
                  <HugeiconsIcon icon={File02Icon} size={11} strokeWidth={1.7} />
                  <span className="truncate">Company Profile</span>
                </div>
                <div className="flex h-[22px] items-center gap-1.5 rounded-md px-2 text-muted-foreground">
                  <HugeiconsIcon icon={Target01Icon} size={11} strokeWidth={1.7} />
                  <span className="truncate">Fundraising Strategy</span>
                </div>
                <div className="flex h-[22px] items-center gap-1.5 rounded-md px-2 text-muted-foreground">
                  <HugeiconsIcon icon={DiscoverCircleIcon} size={11} strokeWidth={1.7} />
                  <span className="truncate">Investor Discovery</span>
                </div>
                <div className="flex h-[22px] items-center gap-1.5 rounded-md px-2 text-muted-foreground">
                  <HugeiconsIcon icon={Message02Icon} size={11} strokeWidth={1.7} />
                  <span className="truncate">Outreach</span>
                </div>
                <div className="flex h-[22px] items-center gap-1.5 rounded-md px-2 text-muted-foreground">
                  <HugeiconsIcon icon={FileValidationIcon} size={11} strokeWidth={1.7} />
                  <span className="truncate">Term sheets</span>
                </div>
                <div className="flex h-[22px] items-center gap-1.5 rounded-md px-2 text-muted-foreground">
                  <HugeiconsIcon icon={Briefcase09Icon} size={11} strokeWidth={1.7} />
                  <span className="truncate">Diligence</span>
                </div>
                <div className="flex h-[22px] items-center gap-1.5 rounded-md px-2 text-muted-foreground">
                  <HugeiconsIcon icon={PolicyIcon} size={11} strokeWidth={1.7} />
                  <span className="truncate">Documents</span>
                </div>
              </div>
            </div>
          </nav>

          <div className="px-2 pb-2.5">
            <div className="flex h-8 items-center gap-1.5 rounded-md px-1.5">
              <MiniAvatar initial={displayName[0]?.toUpperCase()} filled={Boolean(displayName)} />
              {displayName ? (
                <span className="min-w-0 truncate text-[9.5px] text-secondary-foreground">Account</span>
              ) : (
                <div className="h-1.5 w-12 rounded-full bg-surface-focus" />
              )}
            </div>
          </div>
        </div>

        {/* Right Main Area */}
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3.5">
            <span className="text-[10.5px] font-medium tracking-tight text-foreground">
              Company Profile
            </span>
            <div className="flex-1" />
            <div className="relative hidden w-[92px] sm:block">
              <HugeiconsIcon
                icon={Search01Icon}
                size={9}
                strokeWidth={1.8}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 text-foreground-subtle"
              />
              <div className="h-[22px] rounded-md bg-muted pl-5 pr-2 text-[8.5px] leading-[22px] text-foreground-subtle">
                Search
              </div>
            </div>
            <div
              className="inline-flex h-[22px] items-center gap-1 rounded-md px-1.5 text-[8px] font-medium text-primary-foreground"
              style={{
                background:
                  'linear-gradient(180deg, color-mix(in oklch, var(--primary-hover) 85%, white) 0%, var(--primary) 100%)',
              }}
            >
              <AiMark size={8} />
              Silk AI
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-3.5 pt-3">
            {/* Horizontal Sub-tabs */}
            <div className="flex items-center gap-0.5 overflow-hidden">
              {['Company', 'Market', 'Business', 'Traction', 'Fundraising', 'Legal', 'Story', 'Docs'].map((tab, i) => (
                <div
                  key={tab}
                  className={`inline-flex h-[20px] shrink-0 items-center whitespace-nowrap rounded-md px-1.5 text-[9px] ${i === 0 ? 'bg-muted font-medium text-foreground' : 'text-foreground-subtle'
                    }`}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Main Content & Gauge Dial */}
            <div className="mt-3 flex items-start gap-2.5">
              <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-background ring-1 ring-foreground/6">
                <div className="flex items-center justify-between gap-2 border-b border-foreground/4 bg-secondary px-2.5 py-1.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="grid h-4 min-w-4 place-items-center rounded font-mono text-[7px] font-medium tabular-nums text-muted-foreground ring-1 ring-foreground/6">
                      01
                    </span>
                    <span className="truncate text-[9.5px] font-medium text-foreground">
                      Company
                    </span>
                  </div>
                  <span className="text-[8px] tabular-nums text-foreground-subtle">
                    {done}/12
                  </span>
                </div>

                <div className="px-2.5 py-2">
                  <MiniField label="Company description" value={displayCompany} placeholderWidth={92} />
                  <MiniField label="Website" value="" placeholderWidth={72} />
                  <MiniField label="Headquarters" value="" placeholderWidth={56} />

                  <div className="mt-1 border-t border-foreground/4 pt-2">
                    <div className="mb-1.5 text-[8px] font-medium text-foreground">
                      Leadership
                    </div>
                    {displayName ? (
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <MiniAvatar initial={displayName[0]?.toUpperCase()} filled />
                        <span className="min-w-0 truncate text-[9.5px] font-medium text-popover-foreground">
                          {displayName}
                        </span>
                        <span className="shrink-0 rounded bg-muted px-1 py-px text-[7px] font-medium text-muted-foreground">
                          You
                        </span>
                      </div>
                    ) : (
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <MiniAvatar filled={false} />
                        <div className="h-1.5 w-[72px] rounded-full bg-surface-focus" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gauge Dial Widget */}
              <div className="w-[108px] shrink-0 rounded-lg bg-background p-2.5 ring-1 ring-foreground/6">
                <MiniGauge score={percent} done={done} total={12} ladder={ladder} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RightPanel({ companyName, email, name }) {
  return (
    <aside className="hidden lg:block lg:w-[40%] xl:w-[38%] sticky top-0 h-screen overflow-hidden bg-primary">
      {/* Background Dot Pattern (Exact silkAnkit SVG) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='white' fill-opacity='0.06'/%3E%3C/svg%3E")`,
          backgroundSize: '24px 24px',
        }}
      />
      {/* Radial Ambient Glows */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-80px',
          right: '-60px',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: '8%',
          left: '-140px',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Top Brand Logo */}
      <div className="relative z-20 px-9 xl:px-12 pt-9 xl:pt-11">
        <AuthBrand inverted />
      </div>

      {/* Main Large Headline (Exact silkAnkit 1:1) */}
      <div className="relative z-20 px-9 xl:px-12 mt-12 max-w-[470px]">
        <h2
          className="text-primary-foreground font-heading font-normal leading-[1.05] tracking-[-0.03em]"
          style={{ fontSize: 'clamp(1.75rem, 2.6vw, 2.5rem)' }}
        >
          Every founder deserves an investment banker in their&nbsp;corner.
        </h2>
      </div>

      {/* Simulated App Workspace Preview */}
      <div
        className="absolute z-10 select-none left-9 xl:left-12"
        style={{ bottom: '-22px' }}
        aria-hidden
      >
        <WorkspacePreview companyName={companyName} email={email} name={name} />
      </div>

      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(120deg, color-mix(in oklch, var(--primary) 45%, transparent) 0%, transparent 26%)',
        }}
      />
    </aside>
  );
}

export default function Login() {
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin');       // signin | signup
  const [step, setStep] = useState(1);              // 1 email → 2 code
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // 6 separate OTP slot values
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [resent, setResent] = useState(false);
  const [flowStatus, setFlowStatus] = useState('idle');
  const otpInputsRef = useRef([]);
  const signupTransitionTimerRef = useRef(null);
  const attemptedCodeRef = useRef('');

  const code = otpDigits.join('');

  useEffect(() => {
    if (step === 2) {
      attemptedCodeRef.current = '';
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    }
  }, [step]);

  useEffect(() => () => {
    if (signupTransitionTimerRef.current) clearTimeout(signupTransitionTimerRef.current);
  }, []);

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(2, b.length)) + c)
    : '';

  function moveToSignup() {
    setMode('signup');
    setStep(1);
    setOtpDigits(['', '', '', '', '', '']);
    setErr('');
    attemptedCodeRef.current = '';
    setFlowStatus('moving-to-signup');
    if (signupTransitionTimerRef.current) clearTimeout(signupTransitionTimerRef.current);
    signupTransitionTimerRef.current = setTimeout(() => {
      setFlowStatus('idle');
      signupTransitionTimerRef.current = null;
    }, 800);
  }

  async function sendCode(e) {
    e?.preventDefault();
    setErr('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) { setErr('Enter a valid email address.'); return; }
    setEmail(normalizedEmail);
    setBusy(true);
    setFlowStatus(mode === 'signup' ? 'sending-code' : 'checking-email');
    try {
      if (mode === 'signup') {
        // The email is carried over from the login check and is locked on the
        // signup form, so only the remaining account details are entered.
        await auth.signup({
          email: normalizedEmail,
          name: name.trim(),
          companyName: companyName.trim(),
        });
      } else {
        // /auth/otp/request also tells us whether this email belongs to an
        // existing user. Unknown emails must complete signup first.
        const result = await auth.requestOtp(normalizedEmail);
        if (result?.user_exists !== true) return moveToSignup();
      }
      setStep(2);
      setOtpDigits(['', '', '', '', '', '']);
      attemptedCodeRef.current = '';
      setFlowStatus('idle');
    } catch (ex) {
      const response = ex?.body || ex;
      const userDoesNotExist = response?.user_exists === false
        || (response?.user_exists == null && response?.is_registered === false);
      if (mode === 'signin' && userDoesNotExist) return moveToSignup();
      setFlowStatus('idle');
      setErr(ex.status === 429 ? 'Too many requests — wait a moment and try again.' : (ex.detail || ex.message));
    } finally { setBusy(false); }
  }

  async function handleResend() {
    setOtpDigits(['', '', '', '', '', '']);
    setErr('');
    attemptedCodeRef.current = '';
    setResent(true);
    try {
      await auth.requestOtp(email);
    } catch (_) { }
    setTimeout(() => setResent(false), 3000);
  }

  function handleOtpChange(index, val) {
    const cleanVal = val.replace(/[^0-9]/g, '');
    setErr('');
    attemptedCodeRef.current = '';

    if (!cleanVal) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    const next = [...otpDigits];
    if (cleanVal.length > 1) {
      // Pasted full OTP
      const pasted = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        next[i] = pasted[i] || '';
      }
      setOtpDigits(next);
      const targetIdx = Math.min(cleanVal.length, 5);
      otpInputsRef.current[targetIdx]?.focus();
    } else {
      next[index] = cleanVal[0];
      setOtpDigits(next);
      if (index < 5) {
        otpInputsRef.current[index + 1]?.focus();
      }
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  }

  async function verify(e) {
    e?.preventDefault();
    setErr('');
    const fullCode = otpDigits.join('').trim();
    if (fullCode.length < 6) { setErr('Please enter all 6 digits.'); return; }
    if (busy) return;

    attemptedCodeRef.current = fullCode;
    setBusy(true);
    try {
      const res = await auth.verifyOtp(email.trim(), fullCode);
      login(res);
      navigate('/dashboard', { replace: true });
    } catch (ex) {
      const errorMsg = ex?.detail || ex?.message || (typeof ex === 'string' ? ex : 'Incorrect code. Please try again.');
      setErr(errorMsg);
    } finally { setBusy(false); }
  }

  // Auto-verify as soon as 6 digits are filled (only triggers once per unique code)
  useEffect(() => {
    if (step === 2 && code.length === 6 && !busy && attemptedCodeRef.current !== code) {
      verify();
    }
  }, [code, step, busy]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#030712]">
      {/* ── Left Column: Auth Form (1:1 silkAnkit) ──────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 lg:px-12 xl:px-20 overflow-y-auto">
        <div className="w-full max-w-[400px] -translate-y-1">
          {/* Brand Header */}
          <div className="mb-12 lg:hidden">
            <AuthBrand />
          </div>

          {step === 1 ? (
            <div className="silk-enter">
              {/* Header */}
              <div className="space-y-2 mb-9">
                <h1 className="font-heading text-[2rem] font-normal text-foreground leading-[1.1] tracking-[-0.03em]">
                  {mode === 'signup' ? 'Create your account' : 'Welcome to Silk'}
                </h1>
                <p className="text-[15px] text-muted-foreground">
                  {mode === 'signup'
                    ? 'Fill in your details to get started with Silk.'
                    : 'Enter your work email to get started.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={sendCode} className="space-y-3">
                {mode === 'signup' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[13.5px] font-medium text-foreground">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Aishwary Shrivastava"
                        className="w-full h-11 px-3.5 rounded-lg border-0 bg-secondary text-[14px] text-foreground placeholder:text-foreground-subtle outline-none transition-colors focus:ring-1 focus:ring-foreground/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13.5px] font-medium text-foreground">Company Name</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="Novatech AI"
                        className="w-full h-11 px-3.5 rounded-lg border-0 bg-secondary text-[14px] text-foreground placeholder:text-foreground-subtle outline-none transition-colors focus:ring-1 focus:ring-foreground/5"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  {mode === 'signup' && (
                    <label htmlFor="email" className="block text-[13.5px] font-medium text-foreground">
                      Work Email
                    </label>
                  )}
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus={mode !== 'signup'}
                    disabled={mode === 'signup'}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErr(''); }}
                    placeholder="you@company.com"
                    className={`w-full h-11 px-3.5 rounded-lg border-0 bg-secondary text-[14px] text-foreground placeholder:text-foreground-subtle outline-none transition-colors focus:ring-1 focus:ring-foreground/5 disabled:cursor-not-allowed disabled:opacity-70 ${err ? 'ring-1 ring-destructive/30 focus:ring-destructive/40' : ''
                      }`}
                  />
                  {err && <p className="text-sm text-destructive pt-0.5">{err}</p>}
                </div>

                <button
                  type="submit"
                  disabled={busy || flowStatus === 'moving-to-signup'}
                  className="w-full h-11 rounded-lg text-[14px] font-medium text-primary-foreground bg-primary hover:bg-primary-hover active:bg-primary-active transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus:ring-foreground/10 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                >
                  {flowStatus === 'moving-to-signup'
                    ? 'Moving to signup...'
                    : busy && mode === 'signin'
                      ? 'Checking email...'
                      : busy
                        ? 'Sending code...'
                        : 'Continue'}
                </button>
              </form>

              {/* Footer Terms */}
              <p
                className="text-[12.5px] text-foreground-subtle leading-relaxed"
                style={{ margin: '32px 0 0' }}
              >
                By continuing, you agree to our{' '}
                <a href="#" className="underline underline-offset-2 text-foreground-subtle hover:text-foreground/55 transition-colors cursor-pointer">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="underline underline-offset-2 text-foreground-subtle hover:text-foreground/55 transition-colors cursor-pointer">
                  Privacy Policy
                </a>.
              </p>
            </div>
          ) : (
            /* ── Exact silkAnkit Step 2 (VerifyPage) ───────────────────────── */
            <div className="silk-enter">
              {/* Header */}
              <div className="space-y-2 mb-9">
                <h1 className="font-heading text-[2rem] font-normal text-foreground leading-[1.1] tracking-[-0.03em]">
                  Check your inbox
                </h1>
                <p className="text-[15px] text-muted-foreground">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-secondary-foreground">{maskedEmail || email}</span>.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setErr(''); }}
                    className="text-[14px] font-medium text-secondary-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Change email
                  </button>
                </div>
              </div>

              {/* 6-Digit OTP Form */}
              <form onSubmit={verify} className="space-y-5">
                <div className="flex items-center gap-2 justify-between">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      ref={(el) => (otpInputsRef.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpDigits[i] || ''}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 rounded-lg border-0 bg-secondary text-center font-medium text-[16px] text-foreground transition-colors focus:ring-1 focus:ring-foreground/5 outline-none"
                    />
                  ))}
                </div>

                {err && <p className="text-sm text-destructive">{err}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 rounded-lg text-[14px] font-medium text-primary-foreground bg-primary hover:bg-primary-hover active:bg-primary-active transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/10 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                >
                  {busy ? 'Verifying…' : 'Verify code'}
                </button>

                <p className="text-center text-[14px] text-muted-foreground">
                  {resent ? (
                    <span className="font-medium text-popover-foreground">Code resent</span>
                  ) : (
                    <>
                      Didn't receive it?{' '}
                      <button
                        type="button"
                        onClick={handleResend}
                        className="font-medium text-popover-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Resend code
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* ── Right Column: Exact 1:1 Live Workspace Preview RightPanel (silkAnkit) ─────── */}
      <RightPanel companyName={companyName} email={email} name={name} />
    </div>
  );
}
