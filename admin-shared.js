import React from 'https://esm.sh/react@18';
import htm from 'https://esm.sh/htm@3';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const html = htm.bind(React.createElement);
const { useState, useEffect, useRef, useCallback } = React;

const SUPABASE_URL = 'https://nakadctpdszskvooftln.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2FkY3RwZHN6c2t2b29mdGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDExMzcsImV4cCI6MjA5Mzg3NzEzN30.iNYd01ff_TKKmGRb0pTB3fch_EIavoGaOnXAJt36jms';
export const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ── Icons (inline SVG — no icon-font/emoji dependency) ── */
export const Icon = ({ path, className = 'w-4 h-4', strokeWidth = 1.75 }) =>
  html`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${strokeWidth} stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

export const paths = {
  search: html`<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>`,
  trash: html`<path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-.87 12.14A2 2 0 0 1 15.14 21H8.86a2 2 0 0 1-1.99-1.86L6 7"/>`,
  download: html`<path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>`,
  lock: html`<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`,
  eye: html`<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,
  eyeOff: html`<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.5A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a13.6 13.6 0 0 1-3.1 3.9M6.1 6.1C4 7.6 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3.4-.6"/>`,
  x: html`<path d="M18 6 6 18M6 6l12 12"/>`,
  users: html`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>`,
  check: html`<path d="M4 12.5 9.5 18 20 6"/>`,
  chevronUp: html`<path d="m18 15-6-6-6 6"/>`,
  chevronDown: html`<path d="m6 9 6 6 6-6"/>`,
  chevronsUpDown: html`<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>`,
  refresh: html`<path d="M3 12a9 9 0 0 1 15.3-6.3L21 8M3 12a9 9 0 0 0 15.3 6.3L21 16M21 3v5h-5M3 21v-5h5"/>`,
  logout: html`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`,
  key: html`<circle cx="8" cy="15" r="4"/><path d="m10.85 12.15 8.7-8.7M15 7l2 2M18 4l2 2"/>`,
  inbox: html`<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>`,
  alert: html`<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/>`,
  link: html`<path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8"/>`,
  clock: html`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>`,
  grid: html`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`,
  tag: html`<path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.5 3.2L4 3a1 1 0 0 0-1 1l.2 5.5a2 2 0 0 0 .63 1.5l9.58 9.59a2 2 0 0 0 2.82 0l4.36-4.36a2 2 0 0 0 0-2.82Z"/><circle cx="7.5" cy="7.5" r="1.5"/>`,
};

/* ── Toast ── */
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((message, tone = 'success') => {
    clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  return [toast, show];
}

export function Toast({ toast }) {
  if (!toast) return null;
  const tone = toast.tone === 'error' ? 'border-danger/40 text-danger' : 'border-gold/40 text-olive-pale';
  return html`
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] anim-pop" role="status" aria-live="polite">
      <div class=${`bg-charcoal border ${tone} px-6 py-3 text-sm font-serif italic shadow-xl shadow-black/20`}>
        ${toast.message}
      </div>
    </div>`;
}

/* ── Modal shell ── */
export function Modal({ open, onClose, children, labelledBy }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return html`
    <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-deep/70 backdrop-blur-sm p-4 anim-pop"
         role="dialog" aria-modal="true" aria-labelledby=${labelledBy}
         onMouseDown=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
      ${children}
    </div>`;
}

/* ── Session hook (shared auth-state wiring) ── */
export function useSession() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => sub.subscription.unsubscribe();
  }, []);
  const signOut = async () => { await sb.auth.signOut(); setSession(null); };
  return { session, signOut };
}

/* ── Login ── */
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message);
  };

  return html`
    <div class="min-h-screen flex items-center justify-center px-4"
         style=${{ background: 'radial-gradient(ellipse at 40% 35%, #3a3e18, #0e0c04 70%)' }}>
      <form onSubmit=${submit}
            class="anim-in text-center px-10 py-14 sm:px-12 border border-gold/20 max-w-sm w-full bg-deep/60 backdrop-blur-xl">
        <span class="font-serif italic text-5xl text-olive-pale block mb-1">C & G</span>
        <span class="text-[.56rem] tracking-[.3em] uppercase text-olive-pale/40 block mb-10">Admin Dashboard</span>

        <div class="flex flex-col gap-1.5 mb-4 text-left">
          <label for="admin-email" class="text-[.54rem] tracking-[.24em] uppercase text-olive-pale/50">Email</label>
          <input id="admin-email" type="email" autoComplete="email" required
                 value=${email} onInput=${(e) => setEmail(e.target.value)}
                 placeholder="admin@email.com"
                 class="bg-transparent border-0 border-b border-gold/30 py-2 font-serif text-base text-cream placeholder:text-olive-pale/20 placeholder:italic outline-none focus:border-gold transition-colors"/>
        </div>

        <div class="flex flex-col gap-1.5 mb-2 text-left">
          <label for="admin-pass" class="text-[.54rem] tracking-[.24em] uppercase text-olive-pale/50">Password</label>
          <div class="relative">
            <input id="admin-pass" type=${showPw ? 'text' : 'password'} autoComplete="current-password" required
                   value=${password} onInput=${(e) => setPassword(e.target.value)}
                   placeholder="••••••••"
                   class="w-full bg-transparent border-0 border-b border-gold/30 py-2 pr-8 font-serif text-base text-cream placeholder:text-olive-pale/20 placeholder:italic outline-none focus:border-gold transition-colors"/>
            <button type="button" onClick=${() => setShowPw((s) => !s)}
                    aria-label=${showPw ? 'Hide password' : 'Show password'}
                    class="absolute right-0 top-1/2 -translate-y-1/2 text-olive-pale/40 hover:text-gold transition-colors cursor-pointer p-1">
              <${Icon} path=${showPw ? paths.eyeOff : paths.eye} className="w-4 h-4"/>
            </button>
          </div>
        </div>

        <div class="min-h-[18px] text-[.7rem] text-danger/80 font-serif italic mt-2" role="alert">${err}</div>

        <button type="submit" disabled=${busy}
                class="w-full mt-3 py-3.5 bg-olive-dk text-ivory text-[.58rem] tracking-[.32em] uppercase transition-colors hover:bg-olive disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-deep">
          ${busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>`;
}

/* ── Change Password Modal ── */
export function PasswordModal({ open, onClose, notify }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    if (open) { setPw(''); setConfirm(''); setErr(''); setTimeout(() => firstRef.current?.focus(), 50); }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (pw !== confirm) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onClose();
    notify('Password updated.');
  };

  return html`
    <${Modal} open=${open} onClose=${onClose} labelledBy="pw-modal-title">
      <form onSubmit=${submit} class="anim-pop bg-charcoal border border-gold/20 p-9 max-w-sm w-full">
        <div id="pw-modal-title" class="font-serif italic text-2xl text-olive-pale mb-6">Change Password</div>
        <div class="flex flex-col gap-1.5 mb-4 text-left">
          <label for="pw-new" class="text-[.54rem] tracking-[.24em] uppercase text-olive-pale/50">New Password</label>
          <input ref=${firstRef} id="pw-new" type="password" autoComplete="new-password"
                 value=${pw} onInput=${(e) => setPw(e.target.value)}
                 placeholder="At least 8 characters"
                 class="bg-transparent border-0 border-b border-gold/30 py-2 font-serif text-base text-cream placeholder:text-olive-pale/20 placeholder:italic outline-none focus:border-gold transition-colors"/>
        </div>
        <div class="flex flex-col gap-1.5 mb-2 text-left">
          <label for="pw-confirm" class="text-[.54rem] tracking-[.24em] uppercase text-olive-pale/50">Confirm Password</label>
          <input id="pw-confirm" type="password" autoComplete="new-password"
                 value=${confirm} onInput=${(e) => setConfirm(e.target.value)}
                 placeholder="••••••••"
                 class="bg-transparent border-0 border-b border-gold/30 py-2 font-serif text-base text-cream placeholder:text-olive-pale/20 placeholder:italic outline-none focus:border-gold transition-colors"/>
        </div>
        <div class="min-h-[18px] text-[.7rem] text-danger/80 font-serif italic mt-2" role="alert">${err}</div>
        <div class="flex gap-2.5 mt-6">
          <button type="button" onClick=${onClose}
                  class="flex-1 py-3 border border-olive-pale/20 text-olive-pale/60 text-[.56rem] tracking-[.2em] uppercase cursor-pointer hover:border-olive-pale/40 transition-colors">Cancel</button>
          <button type="submit" disabled=${busy}
                  class="flex-1 py-3 bg-olive-dk text-ivory text-[.56rem] tracking-[.2em] uppercase cursor-pointer hover:bg-olive transition-colors disabled:opacity-50">
            ${busy ? 'Updating…' : 'Update'}
          </button>
        </div>
      </form>
    <//>`;
}

/* ── Shared header with cross-page nav ── */
export function AdminHeader({ active, onSignOut, onOpenPassword, refreshing, onRefresh, extraDate }) {
  const tabs = [
    { key: 'rsvps', label: 'RSVP Dashboard', href: 'admin.html', icon: paths.grid },
    { key: 'logins', label: 'Guest Logins', href: 'admin-logins.html', icon: paths.link },
    { key: 'orders', label: 'Attire Orders', href: 'admin-orders.html', icon: paths.tag },
  ];
  return html`
    <header class="bg-charcoal px-5 sm:px-9 py-5 border-b border-gold/10">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="font-serif italic text-2xl text-olive-pale">Chelsea & Gabriel · Enugu 2027</div>
          <div class="text-[.5rem] tracking-[.24em] uppercase text-olive-pale/35 mt-0.5">RSVP Management</div>
        </div>
        <div class="flex items-center gap-2 sm:gap-4">
          ${extraDate ? html`<span class="hidden md:inline text-[.52rem] tracking-[.16em] text-olive-pale/30">${extraDate}</span>` : null}
          ${onRefresh ? html`
            <button onClick=${onRefresh} aria-label="Refresh data" title="Refresh"
                    class="p-2 border border-olive-pale/20 text-olive-pale/50 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer">
              <${Icon} path=${paths.refresh} className=${`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} strokeWidth=${2}/>
            </button>` : null}
          <button onClick=${onOpenPassword}
                  class="flex items-center gap-1.5 px-4 py-2 border border-olive-pale/20 text-olive-pale/50 text-[.52rem] tracking-[.22em] uppercase cursor-pointer hover:border-gold/40 hover:text-gold transition-colors">
            <${Icon} path=${paths.key} className="w-3 h-3" strokeWidth=${2}/>
            <span class="hidden sm:inline">Change Password</span>
          </button>
          <button onClick=${onSignOut}
                  class="flex items-center gap-1.5 px-4 py-2 border border-olive-pale/20 text-olive-pale/50 text-[.52rem] tracking-[.22em] uppercase cursor-pointer hover:border-danger/50 hover:text-danger/80 transition-colors">
            <${Icon} path=${paths.logout} className="w-3 h-3" strokeWidth=${2}/>
            <span class="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
      <nav class="flex gap-1 mt-4 -mb-5">
        ${tabs.map((t) => html`
          <a key=${t.key} href=${t.href}
             class=${`flex items-center gap-1.5 px-4 py-2.5 text-[.52rem] tracking-[.18em] uppercase border-b-2 transition-colors ${active === t.key ? 'text-gold border-gold' : 'text-olive-pale/40 border-transparent hover:text-olive-pale/70'}`}>
            <${Icon} path=${t.icon} className="w-3 h-3" strokeWidth=${2}/> ${t.label}
          </a>`)}
      </nav>
    </header>`;
}
