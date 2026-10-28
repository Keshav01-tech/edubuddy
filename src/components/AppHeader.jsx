import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Settings, LogOut, FileText, CalendarCheck, Wallet, Inbox, Menu, X, Users, GraduationCap, LayoutDashboard, Building2 } from 'lucide-react';

const ICON_BUTTON = 'h-10 w-10 grid place-items-center rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/classes', label: 'Classes', icon: GraduationCap },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/fees', label: 'Fees', icon: Wallet },
  { to: '/leads', label: 'Leads', icon: Inbox },
  { to: '/tests', label: 'Test generator', icon: FileText },
];

const itemClass = (isActive) => `flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-colors ${
  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
}`;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-3 h-16 shrink-0">
      <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-bold grid place-items-center">E</span>
      <span className="text-[15px] font-semibold tracking-tight text-slate-900">EduBuddy</span>
    </Link>
  );
}

function SideNav({ onSignOut, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      <Brand />
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 space-y-1 border-t border-slate-200">
        <NavLink to="/profile" onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
          <Building2 className="w-[18px] h-[18px] shrink-0" />
          Institute Profile
        </NavLink>
        <NavLink to="/settings" onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
          <Settings className="w-[18px] h-[18px] shrink-0" />
          Settings
        </NavLink>
        {onSignOut && (
          <button type="button" onClick={onSignOut} className={`${itemClass(false)} w-full`}>
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            Sign out
          </button>
        )}
      </div>
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
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 pt-[env(safe-area-inset-top)]">
        <div className="h-14 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {leading}
            <p className={`items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900 shrink-0 ${title ? 'hidden sm:flex' : 'flex'}`}>
              <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold grid place-items-center">E</span>
              EduBuddy
            </p>
            {title && (
              <div className="min-w-0 sm:pl-3 sm:ml-1 sm:border-l sm:border-stone-200">
                <p className="text-sm font-medium text-stone-800 truncate">{title}</p>
                {subtitle && <p className="text-xs text-stone-400 truncate">{subtitle}</p>}
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

  return (
    <>
      <aside data-app-sidebar className="no-print hidden md:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-white border-r border-slate-200">
        <SideNav onSignOut={onSignOut} />
      </aside>

      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-2 flex items-center gap-1">
          <button type="button" onClick={() => setOpen(true)} className={ICON_BUTTON} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          {leading}
          <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{title || 'EduBuddy'}</p>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <button type="button" onClick={() => setOpen(false)} className={`${ICON_BUTTON} absolute top-2 right-2`} aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
            <SideNav onSignOut={onSignOut} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {(leading || title) && (
        <div className="no-print hidden md:flex sticky top-0 z-20 h-14 items-center gap-2 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200">
          {leading}
          {title && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
              {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
            </div>
          )}
        </div>
      )}
    </>
  );
}
