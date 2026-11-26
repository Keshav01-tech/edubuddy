import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Settings, LogOut, FileText, CalendarCheck, Wallet, Inbox, Menu, X, Users, GraduationCap, LayoutDashboard,
  Building2, Sparkles, Plus, ChevronDown, FolderOpen, CalendarDays, ArrowRight, UserCog, Presentation, ScanLine, ConciergeBell,
  ClipboardList, BookOpen, ListChecks,
} from 'lucide-react';
import { useClassroom, todayISO } from '../services/classroom';
import { useAuth } from '../context/AuthContext';
import { describeAssignments } from '../services/teachers';
import { LogoMark } from './Logo';
import { useT, LanguageSwitch } from '../i18n';

const ICON_BUTTON = 'h-10 w-10 grid place-items-center rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';

const PAGE_TITLES = {
  '/dashboard': ['Dashboard', 'Overview'],
  '/students': ['Students', 'Institute'],
  '/classes': ['Classes & batches', 'Institute'],
  '/attendance': ['Attendance', 'Institute'],
  '/fees': ['Fees', 'Institute'],
  '/leads': ['Leads & inquiries', 'Institute'],
  '/teachers': ['Teachers & staff', 'Institute'],
  '/scan-receipt': ['Scan receipt', 'Front desk'],
  '/tests': ['Test generator', 'Teaching'],
  '/papers': ['My tests', 'Teaching'],
  '/marks': ['Test marks', 'Teaching'],
  '/quizzes': ['Practice quiz', 'Teaching'],
  '/notes': ['Notes', 'Teaching'],
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
  const teacher = b.room.isTeacher;
  if (b.room.isReceptionist) {
    // The front desk: fees first, with receipt scanning, then students and inquiries.
    return [{
      label: 'Front desk',
      items: [
        { to: '/scan-receipt', label: 'Scan receipt', icon: ScanLine, badge: 'AI' },
        { to: '/fees', label: 'Fees', icon: Wallet, count: b.owing || null, countTone: 'danger', countTitle: 'students with fees due' },
        { to: '/students', label: 'Students', icon: Users, count: b.room.students.length || null, countTone: 'muted' },
        { to: '/leads', label: 'Leads', icon: Inbox, count: b.due || null, countTone: 'warn', countTitle: 'follow-ups due' },
      ],
    }];
  }
  return [
    // Teachers have no dashboard: their panel starts at their own classes.
    ...(teacher ? [] : [{ label: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }] }]),
    {
      label: 'Institute',
      items: [
        { to: '/students', label: 'Students', icon: Users, count: b.room.students.length || null, countTone: 'muted' },
        { to: '/classes', label: teacher ? 'My batches' : 'Batches', icon: GraduationCap },
        { to: '/attendance', label: 'Attendance', icon: CalendarCheck, count: b.room.students.length && b.unmarked ? b.unmarked : null, countTone: 'warn', countTitle: 'students not marked today' },
        ...(teacher ? [] : [
          { to: '/fees', label: 'Fees', icon: Wallet, count: b.owing || null, countTone: 'danger', countTitle: 'students with fees due' },
          { to: '/scan-receipt', label: 'Scan receipt', icon: ScanLine, badge: 'AI' },
        ]),
        { to: '/leads', label: 'Leads', icon: Inbox, count: b.due || null, countTone: 'warn', countTitle: 'follow-ups due' },
        ...(teacher ? [] : [{ to: '/teachers', label: 'Teachers', icon: UserCog, count: b.room.teachers.length || null, countTone: 'muted' }]),
      ],
    },
    {
      label: 'Teaching',
      items: [
        { to: '/tests', label: 'Test generator', icon: FileText, badge: 'AI' },
        { to: '/papers', label: 'My tests', icon: FolderOpen },
        { to: '/marks', label: 'Test marks', icon: ClipboardList },
        { to: '/quizzes', label: 'Practice quiz', icon: ListChecks },
        { to: '/notes', label: 'Notes', icon: BookOpen },
      ],
    },
  ];
}

const COUNT_TONES = {
  muted: 'bg-neutral-900/[0.06] text-neutral-600',
  warn: 'bg-neutral-200 text-neutral-900',
  danger: 'bg-[#005a9c] text-white',
};

const itemClass = (isActive) => `group relative flex items-center gap-3 h-10 px-3 rounded-xl text-[13.5px] font-medium transition-all ${
  isActive ? 'bg-[#005a9c] text-white font-semibold' : 'text-neutral-700 hover:text-neutral-900 hover:bg-white/80'
}`;
const iconClass = (isActive) => `w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`;

export function BrandMark({ size = 'md' }) {
  const box = size === 'sm' ? 'h-7 w-7 rounded-lg' : size === 'lg' ? 'h-11 w-11 rounded-2xl' : 'h-9 w-9 rounded-xl';
  return <LogoMark className={box} />;
}

function Brand({ institute, logo, teacher, reception }) {
  const { t } = useT();
  const name = institute?.trim();
  return (
    <Link to={teacher ? '/classes' : reception ? '/scan-receipt' : '/dashboard'} className="flex items-center gap-3 px-5 h-[4.5rem] shrink-0">
      {logo ? (
        <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-xl object-contain bg-white" />
      ) : name ? (
        <span className="h-9 w-9 shrink-0 rounded-full grid place-items-center bg-gradient-to-br from-[#60c1e5] to-[#005a9c] text-[15px] font-black text-white">
          {name.charAt(0).toUpperCase()}
        </span>
      ) : (
        <LogoMark className="h-9 w-9 rounded-xl" />
      )}
      <span className="leading-tight min-w-0">
        <span className="block text-[15px] font-extrabold tracking-tight text-neutral-900 truncate">{name || 'EduBuddy'}</span>
        <span className="block text-[11px] font-medium text-neutral-500 truncate">
          {t(teacher ? 'Teacher panel' : reception ? 'Front desk' : name ? 'Powered by EduBuddy' : 'Institute workspace')}
        </span>
      </span>
    </Link>
  );
}

function NavItem({ to, label, icon: Icon, end, badge, count, countTone, countTitle, onNavigate }) {
  const { t } = useT();
  return (
    <NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
      {({ isActive }) => (
        <>
          <Icon className={iconClass(isActive)} />
          <span className="flex-1 truncate">{t(label)}</span>
          {count != null && (
            <span title={countTitle ? `${count} ${t(countTitle)}` : undefined} className={`min-w-5 h-5 px-1.5 rounded-full text-[10.5px] font-bold grid place-items-center tabular-nums ${COUNT_TONES[countTone]}`}>
              {count}
            </span>
          )}
          {badge && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-[#005a9c] px-1.5 py-0.5 text-[10px] font-bold text-white">
              <Sparkles className="w-2.5 h-2.5" />{badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

/** Sidebar card for a signed-in teacher: who they are and which classes they take. */
function TeacherCard({ room }) {
  const { t: tr } = useT();
  const t = room.teacher;
  const lines = describeAssignments(t);
  return (
    <div className="mx-4 mb-4 rounded-3xl bg-[#1b365d] p-4 text-white">
      <p className="flex items-center gap-2 text-[13px] font-semibold"><Presentation className="w-4 h-4" /> {t?.name || tr('Teacher')}</p>
      {t?.subject && <p className="mt-0.5 text-xs text-white/70">{t.subject}</p>}
      <p className="mt-3 text-[10.5px] font-bold uppercase tracking-wider text-white/50">{tr('You teach')}</p>
      {lines.length === 0 ? (
        <p className="mt-1 text-xs text-white/70">{tr('No classes assigned yet. Ask your admin.')}</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {lines.map((line) => <li key={line} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs">{line}</li>)}
        </ul>
      )}
    </div>
  );
}

function SideNav({ onSignOut, onNavigate }) {
  const { t } = useT();
  const badges = useNavBadges();
  const groups = navGroups(badges);
  return (
    <div className="flex flex-col h-full">
      <Brand institute={badges.room.institute?.name} logo={badges.room.institute?.logo} teacher={badges.room.isTeacher} reception={badges.room.isReceptionist} />
      <nav className="flex-1 px-4 pt-2 overflow-y-auto" aria-label="Main">
        <div className="space-y-1">
          {groups.flatMap((group) => group.items).map((item) => <NavItem key={item.to} {...item} onNavigate={onNavigate} />)}
        </div>
      </nav>
      {badges.room.isReceptionist ? (
        <div className="mx-4 mb-4 rounded-3xl bg-[#1b365d] p-4 text-white">
          <p className="flex items-center gap-2 text-[13px] font-semibold"><ConciergeBell className="w-4 h-4" /> {t('Front desk')}</p>
          <p className="mt-1 text-xs text-white/70">{t('Scan a fee receipt, confirm the student, and the fee is updated.')}</p>
        </div>
      ) : badges.room.isTeacher ? <TeacherCard room={badges.room} /> : (
      <Link to="/tests" onClick={onNavigate} className="relative mx-4 mb-4 hidden md:block overflow-hidden rounded-3xl bg-[#1b365d] p-4 text-center">
        <span aria-hidden className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <span className="relative mb-2 flex justify-center -space-x-2">
          {[[FileText, '#a3a3a3'], [Users, '#e5e5e5'], [GraduationCap, '#737373'], [Wallet, '#ffffff']].map(([Icon, bg], i) => (
            <span key={i} className="h-8 w-8 rounded-full grid place-items-center ring-2 ring-[#1b365d]" style={{ background: bg }}><Icon className="w-4 h-4 text-neutral-800" /></span>
          ))}
        </span>
        <span className="relative flex items-center justify-center gap-1.5 text-[15px] font-semibold text-white"><Sparkles className="w-4 h-4" /> {t("What's New")}</span>
        <span className="relative mt-1.5 block text-[12.5px] leading-snug text-white/70">{t('AI test papers in a minute.')}</span>
        <span className="relative mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[13px] font-semibold text-neutral-900">{t('Try it now')} <ArrowRight className="w-4 h-4" /></span>
      </Link>
      )}
      <div className="px-4 py-3 border-t border-neutral-200/70">
        <div className="space-y-0.5">
          {!badges.room.isTeacher && !badges.room.isReceptionist && (
            <NavLink to="/profile" onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
              {({ isActive }) => (<><Building2 className={iconClass(isActive)} />{t('Institute profile')}</>)}
            </NavLink>
          )}
          <NavLink to="/settings" onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (<><Settings className={iconClass(isActive)} />{t('Settings')}</>)}
          </NavLink>
          {onSignOut && (
            <button type="button" onClick={onSignOut} className={`${itemClass(false)} w-full`}>
              <LogOut className="w-[18px] h-[18px] shrink-0 text-neutral-600 group-hover:text-neutral-900" />
              {t('Sign out')}
            </button>
          )}
          <div className="flex items-center justify-between gap-2 px-3 pt-2">
            <span className="text-xs font-medium text-neutral-500">{t('Language')}</span>
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Whether changes have reached the database: Loading / Saving / Saved / Not saved (tap to retry). */
export function SyncStatus({ compact = false }) {
  const { t } = useT();
  const room = useClassroom();
  const state = room.loading ? 'loading' : room.syncState;
  if (compact && state !== 'error') return null;
  const look = {
    loading: [t('Loading…'), 'bg-white text-neutral-500', 'bg-neutral-300'],
    saving: [t('Saving…'), 'bg-white text-neutral-600', 'bg-amber-400 animate-pulse'],
    saved: [t('Saved'), 'bg-white text-neutral-600', 'bg-[#17784a]'],
    error: [`${t('Not saved')} · ${t('Retry')}`, 'bg-rose-50 text-rose-700 hover:bg-rose-100', 'bg-rose-500'],
  }[state] || [t('Saved'), 'bg-white text-neutral-600', 'bg-[#17784a]'];
  return (
    <button
      type="button"
      onClick={state === 'error' ? room.retrySync : undefined}
      title={state === 'error' ? room.syncError : 'Changes are saved to the database'}
      className={`${compact ? 'h-9 px-3' : 'hidden md:inline-flex h-10 px-4'} inline-flex items-center gap-1.5 rounded-full text-xs font-medium ${look[1]} ${state === 'error' ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`h-2 w-2 rounded-full ${look[2]}`} /> {look[0]}
    </button>
  );
}

const QUICK = [
  { to: '/attendance', label: 'Mark attendance', hint: "Today's roll call", icon: CalendarCheck, tone: 'text-neutral-900 bg-neutral-50', only: ['teacher'] },
  { to: '/scan-receipt', label: 'Scan a fee receipt', hint: 'Read it, confirm, record', icon: ScanLine, tone: 'text-brand-600 bg-brand-50', only: ['admin', 'receptionist'] },
  { to: '/students', label: 'Add student', hint: 'Enrol a new student', icon: Users, tone: 'text-brand-600 bg-brand-50' },
  { to: '/fees', label: 'Record fee payment', hint: 'And print a receipt', icon: Wallet, tone: 'text-neutral-900 bg-neutral-50', only: ['admin', 'receptionist'] },
  { to: '/leads', label: 'New inquiry', hint: 'Save a call or walk-in', icon: Inbox, tone: 'text-neutral-900 bg-neutral-50' },
  { to: '/tests', label: 'Create test paper', hint: 'From NCERT chapters', icon: FileText, tone: 'text-neutral-900 bg-neutral-50', only: ['admin', 'teacher'] },
];

function QuickMenu() {
  const { t } = useT();
  const { user } = useAuth();
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
        className="h-10 pl-4 pr-3 rounded-2xl bg-[#005a9c] text-white text-sm font-medium inline-flex items-center gap-1.5 hover:brightness-95 transition"
      >
        <Plus className="w-4 h-4" /> {t('New')} <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.3)] p-2 z-50 animate-fade-up">
          <p className="px-2.5 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">{t('What do you want to do?')}</p>
          {QUICK.filter((q) => !q.only || q.only.includes(user?.role)).map(({ to, label, hint, icon: Icon, tone }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-neutral-50">
              <span className={`h-9 w-9 rounded-xl grid place-items-center ${tone}`}><Icon className="w-[18px] h-[18px]" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-800">{t(label)}</span>
                <span className="block text-xs text-neutral-500">{t(hint)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TopBar({ leading, title, subtitle }) {
  const { t, lang } = useT();
  const { pathname } = useLocation();
  const [routeTitle] = PAGE_TITLES[pathname] || ['EduBuddy', ''];
  const date = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className="no-print hidden md:flex sticky top-0 z-30 h-16 items-center gap-3 px-6 lg:px-8 bg-white/50 backdrop-blur-xl border-b border-white/70">
      {leading}
      <div className="min-w-0 flex-1">
        {title ? (
          <>
            <p className="text-sm font-bold text-neutral-900 truncate">{title}</p>
            {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
          </>
        ) : (
          <p className="truncate text-[1.35rem] font-medium tracking-tight text-neutral-900">{t(routeTitle)}</p>
        )}
      </div>
      <SyncStatus />
      <LanguageSwitch className="hidden md:inline-flex" />
      <span className="hidden lg:inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white text-xs font-medium text-neutral-700">
        <CalendarDays className="w-3.5 h-3.5 text-neutral-400" /> {date}
      </span>
      <QuickMenu />
    </div>
  );
}

export function AppHeader({ leading, title, subtitle, onSignOut, nav = false, topBar = true }) {
  const { user } = useAuth();
  const { t } = useT();
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

  const sidebarBg = 'bg-white/80 backdrop-blur-xl border-r border-white shadow-[1px_0_0_rgba(15,23,42,0.04)]';

  return (
    <>
      <aside data-app-sidebar className={`no-print hidden md:flex fixed inset-y-0 left-0 z-40 w-62 flex-col ${sidebarBg}`}>
        <SideNav onSignOut={onSignOut} />
      </aside>

      <header className="no-print md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-xl text-neutral-900 border-b border-neutral-200/70 pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-2 flex items-center gap-1.5">
          <button type="button" onClick={() => setOpen(true)} className="h-10 w-10 grid place-items-center rounded-xl text-neutral-600 hover:bg-neutral-100" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          {leading}
          {!title && <BrandMark size="sm" />}
          <p className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight">{title || t(PAGE_TITLES[pathname]?.[0] || 'EduBuddy')}</p>
          <SyncStatus compact />
          {user?.role === 'teacher' && (
            <Link to="/attendance" className="h-9 px-3 rounded-xl bg-neutral-100 text-xs font-semibold inline-flex items-center gap-1.5" aria-label="Mark attendance">
              <CalendarCheck className="w-4 h-4" /> Attendance
            </Link>
          )}
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-neutral-900/50 backdrop-blur-[2px] animate-fade-up" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] ${sidebarBg}`}>
            <button type="button" onClick={() => setOpen(false)} className="h-10 w-10 grid place-items-center rounded-xl text-neutral-500 hover:bg-neutral-100 absolute top-3 right-2" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
            <SideNav onSignOut={onSignOut} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {topBar && <TopBar leading={leading} title={title} subtitle={subtitle} />}
    </>
  );
}
