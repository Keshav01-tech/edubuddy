import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Settings, LogOut, FileText, CalendarCheck, Wallet, Inbox, Menu, X, Users, GraduationCap, LayoutDashboard,
  Building2, Sparkles, Plus, ChevronDown, FolderOpen, CalendarDays,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClassroom, todayISO } from '../services/classroom';

const ICON_BUTTON = 'h-10 w-10 grid place-items-center rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';

const PAGE_TITLES = {
  '/dashboard': ['Dashboard', 'Overview'],
  '/students': ['Students', 'Institute'],
  '/classes': ['Classes & batches', 'Institute'],
  '/attendance': ['Attendance', 'Institute'],
  '/fees': ['Fees', 'Institute'],
  '/leads': ['Leads & inquiries', 'Institute'],
  '/tests': ['Test generator', 'Teaching'],
  '/papers': ['My tests', 'Teaching'],
  '/profile': ['Institute profile', 'Account'],
  '/settings': ['Settings', 'Account'],
};

/** Live counts shown as badges in the sidebar, so the owner sees what needs attention. */
function useNavBadges() {
  const room = useClassroom();
  const today = todayISO();
  const marks = room.attendance[today] || {};
  const unmarked = room.students.filter((s) => !marks[s.id]).length;
  const owing = room.students.filter((s) => {
    const paid = room.payments.filter((p) => p.studentId === s.id).reduce((sum, p) => sum + (p.amount || 0), 0);
    return (s.fee || 0) - paid > 0;
  }).length;
  const due = room.leads.filter((l) => l.status !== 'joined' && l.status !== 'dropped' && l.followUp && l.followUp <= today).length;
  return { room, unmarked, owing, due };
}

function navGroups(b) {
  return [
    { label: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    {
      label: 'Institute',
      items: [
        { to: '/students', label: 'Students', icon: Users, count: b.room.students.length || null, countTone: 'muted' },
        { to: '/classes', label: 'Classes', icon: GraduationCap },
        { to: '/attendance', label: 'Attendance', icon: CalendarCheck, count: b.room.students.length && b.unmarked ? b.unmarked : null, countTone: 'warn', countTitle: 'students not marked today' },
        { to: '/fees', label: 'Fees', icon: Wallet, count: b.owing || null, countTone: 'danger', countTitle: 'students with fees due' },
        { to: '/leads', label: 'Leads', icon: Inbox, count: b.due || null, countTone: 'warn', countTitle: 'follow-ups due' },
      ],
    },
    {
      label: 'Teaching',
      items: [
        { to: '/tests', label: 'Test generator', icon: FileText, badge: 'AI' },
        { to: '/papers', label: 'My tests', icon: FolderOpen },
      ],
    },
  ];
}

const COUNT_TONES = {
  muted: 'bg-white/10 text-neutral-300',
  warn: 'bg-white text-neutral-950',
  danger: 'bg-white text-neutral-950',
};

const itemClass = (isActive) => `group relative flex items-center gap-3 h-10 px-3 rounded-xl text-[13.5px] font-medium transition-all ${
  isActive ? 'bg-white/[0.09] text-white ring-1 ring-white/10' : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
}`;
const iconClass = (isActive) => `w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`;

export function BrandMark({ size = 'md', invert = false }) {
  const box = size === 'sm' ? 'h-7 w-7 text-xs rounded-lg' : 'h-9 w-9 text-sm rounded-xl';
  return (
    <span className={`${box} grid place-items-center font-black tracking-tight ${invert ? 'bg-white text-neutral-950' : 'bg-neutral-950 text-white'}`}>
      E
    </span>
  );
}

function Brand({ institute }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-3 px-5 h-[4.5rem] shrink-0">
      <BrandMark invert />
      <span className="leading-tight min-w-0">
        <span className="block text-[15px] font-bold tracking-tight text-white">EduBuddy</span>
        <span className="block text-[11px] font-medium text-neutral-400 truncate">{institute || 'Institute workspace'}</span>
      </span>
    </Link>
  );
}

function NavItem({ to, label, icon: Icon, end, badge, count, countTone, countTitle, onNavigate }) {
  return (
    <NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-white" />}
          <Icon className={iconClass(isActive)} />
          <span className="flex-1 truncate">{label}</span>
          {count != null && (
            <span title={countTitle ? `${count} ${countTitle}` : undefined} className={`min-w-5 h-5 px-1.5 rounded-full text-[10.5px] font-bold grid place-items-center tabular-nums ${COUNT_TONES[countTone]}`}>
              {count}
            </span>
          )}
          {badge && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r from-brand-500 to-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
              <Sparkles className="w-2.5 h-2.5" />{badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function userName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Teacher';
}

function Avatar({ user, className = 'h-9 w-9 text-[13px]', invert = false }) {
  const initial = userName(user).trim().charAt(0).toUpperCase() || 'T';
  return (
    <span className={`${className} shrink-0 rounded-full grid place-items-center font-bold ${invert ? 'bg-white text-neutral-950' : 'bg-neutral-950 text-white'}`}>
      {initial}
    </span>
  );
}

function SideNav({ onSignOut, onNavigate }) {
  const { user } = useAuth() || {};
  const badges = useNavBadges();
  const groups = navGroups(badges);
  return (
    <div className="flex flex-col h-full">
      <Brand institute={badges.room.institute?.name} />
      <nav className="flex-1 px-3 pt-1 overflow-y-auto" aria-label="Main">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-neutral-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => <NavItem key={item.to} {...item} onNavigate={onNavigate} />)}
            </div>
          </div>
        ))}
      </nav>
      {badges.room.students.length > 0 && (
        <Link to="/attendance" onClick={onNavigate} className="mx-3 mb-3 block rounded-2xl bg-gradient-to-br from-brand-600/30 to-neutral-900/10 ring-1 ring-white/10 p-3.5 hover:ring-white/20 transition">
          <p className="flex items-center justify-between text-[12px] font-semibold text-white">
            <span className="flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-white" /> Today's roll call</span>
            <span className="tabular-nums text-neutral-300">{badges.room.students.length - badges.unmarked}/{badges.room.students.length}</span>
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-white" style={{ width: `${((badges.room.students.length - badges.unmarked) / badges.room.students.length) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-neutral-400">{badges.unmarked ? `${badges.unmarked} still to mark` : 'Everyone is marked'}</p>
        </Link>
      )}
      <div className="p-3 border-t border-white/[0.07]">
        {user && (
          <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 mb-1">
            <Avatar user={user} className="h-8 w-8 text-[13px]" invert />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-semibold text-white">{userName(user)}</span>
              {user.email && <span className="block truncate text-[11px] text-neutral-500">{user.email}</span>}
            </span>
          </div>
        )}
        <div className="space-y-0.5">
          <NavLink to="/profile" onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (<><Building2 className={iconClass(isActive)} />Institute profile</>)}
          </NavLink>
          <NavLink to="/settings" onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (<><Settings className={iconClass(isActive)} />Settings</>)}
          </NavLink>
          {onSignOut && (
            <button type="button" onClick={onSignOut} className={`${itemClass(false)} w-full hover:!text-neutral-300`}>
              <LogOut className="w-[18px] h-[18px] shrink-0 text-neutral-500 group-hover:text-neutral-300" />
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const QUICK = [
  { to: '/attendance', label: 'Mark attendance', hint: "Today's roll call", icon: CalendarCheck, tone: 'text-neutral-900 bg-neutral-50' },
  { to: '/students', label: 'Add student', hint: 'Enrol a new student', icon: Users, tone: 'text-brand-600 bg-brand-50' },
  { to: '/fees', label: 'Record fee payment', hint: 'And print a receipt', icon: Wallet, tone: 'text-neutral-900 bg-neutral-50' },
  { to: '/leads', label: 'New inquiry', hint: 'Save a call or walk-in', icon: Inbox, tone: 'text-neutral-900 bg-neutral-50' },
  { to: '/tests', label: 'Create test paper', hint: 'From NCERT chapters', icon: FileText, tone: 'text-neutral-900 bg-neutral-50' },
];

function QuickMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="h-10 pl-3 pr-2.5 rounded-xl bg-neutral-950 text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.6)] hover:bg-neutral-800 transition-colors"
      >
        <Plus className="w-4 h-4" /> New <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white ring-1 ring-neutral-200 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.3)] p-2 z-50 animate-fade-up">
          <p className="px-2.5 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">What do you want to do?</p>
          {QUICK.map(({ to, label, hint, icon: Icon, tone }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-neutral-50">
              <span className={`h-9 w-9 rounded-xl grid place-items-center ${tone}`}><Icon className="w-[18px] h-[18px]" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-800">{label}</span>
                <span className="block text-xs text-neutral-500">{hint}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TopBar({ leading, title, subtitle }) {
  const { pathname } = useLocation();
  const { user } = useAuth() || {};
  const [routeTitle, section] = PAGE_TITLES[pathname] || ['EduBuddy', ''];
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className="no-print hidden md:flex sticky top-0 z-30 h-16 items-center gap-3 px-6 lg:px-8 bg-white/80 backdrop-blur-xl border-b border-neutral-200/70">
      {leading}
      <div className="min-w-0 flex-1">
        {title ? (
          <>
            <p className="text-sm font-bold text-neutral-900 truncate">{title}</p>
            {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
          </>
        ) : (
          <p className="text-sm text-neutral-500 truncate">
            {section && <><span>{section}</span><span className="mx-2 text-neutral-300">/</span></>}
            <span className="font-bold text-neutral-900">{routeTitle}</span>
          </p>
        )}
      </div>
      <span className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-neutral-50 ring-1 ring-neutral-200 text-xs font-semibold text-neutral-600">
        <CalendarDays className="w-3.5 h-3.5 text-neutral-400" /> {date}
      </span>
      <QuickMenu />
      {user && (
        <Link to="/profile" className="rounded-full ring-2 ring-white shadow-sm hover:ring-brand-100" title={userName(user)}>
          <Avatar user={user} />
        </Link>
      )}
    </div>
  );
}

export function AppHeader({ leading, title, subtitle, onSignOut, nav = false }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!nav) {
    return (
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/70 pt-[env(safe-area-inset-top)]">
        <div className="h-14 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {leading}
            <p className={`items-center gap-2 text-[15px] font-bold tracking-tight text-neutral-900 shrink-0 ${title ? 'hidden sm:flex' : 'flex'}`}>
              <BrandMark size="sm" />
              EduBuddy
            </p>
            {title && (
              <div className="min-w-0 sm:pl-3 sm:ml-1 sm:border-l sm:border-neutral-200">
                <p className="text-sm font-semibold text-neutral-800 truncate">{title}</p>
                {subtitle && <p className="text-xs text-neutral-400 truncate">{subtitle}</p>}
              </div>
            )}
          </div>
          {onSignOut && (
            <button type="button" onClick={onSignOut} className={ICON_BUTTON} aria-label="Sign out">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </header>
    );
  }

  const sidebarBg = 'bg-[#0a0a0a] bg-[radial-gradient(28rem_20rem_at_0%_0%,rgba(0,0,0,0.22),transparent_70%),radial-gradient(20rem_16rem_at_100%_100%,rgba(0,0,0,0.08),transparent_70%)]';

  return (
    <>
      <aside data-app-sidebar className={`no-print hidden md:flex fixed inset-y-0 left-0 z-40 w-62 flex-col ${sidebarBg}`}>
        <SideNav onSignOut={onSignOut} />
      </aside>

      <header className="no-print md:hidden sticky top-0 z-30 bg-[#0a0a0a] text-white pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-2 flex items-center gap-1.5">
          <button type="button" onClick={() => setOpen(true)} className="h-10 w-10 grid place-items-center rounded-xl text-neutral-300 hover:bg-white/10" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          {leading}
          {!title && <BrandMark size="sm" invert />}
          <p className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight">{title || PAGE_TITLES[pathname]?.[0] || 'EduBuddy'}</p>
          <Link to="/attendance" className="h-9 px-3 rounded-xl bg-white/10 text-xs font-semibold inline-flex items-center gap-1.5" aria-label="Mark attendance">
            <CalendarCheck className="w-4 h-4" /> Attendance
          </Link>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-neutral-900/50 backdrop-blur-[2px] animate-fade-up" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] ${sidebarBg}`}>
            <button type="button" onClick={() => setOpen(false)} className="h-10 w-10 grid place-items-center rounded-xl text-neutral-400 hover:bg-white/10 absolute top-3 right-2" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
            <SideNav onSignOut={onSignOut} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <TopBar leading={leading} title={title} subtitle={subtitle} />
    </>
  );
}
