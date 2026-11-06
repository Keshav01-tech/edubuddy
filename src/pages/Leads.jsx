import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Phone, Trash2, Search, Plus, CalendarClock, UserPlus, PhoneCall, MapPin, CheckCircle2, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO, formatDate } from '../services/classroom';
import { PageHeader, Panel, EmptyState, Initials, Meter } from '../components/ui';

const field = 'w-full h-11 px-3 text-base sm:text-sm bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-neutral-400';

const SOURCES = ['Call', 'WhatsApp', 'Walk-in', 'Reference'];

const STATUSES = [
  { id: 'new', label: 'New', chip: 'bg-neutral-100 text-neutral-900 ring-neutral-200', dot: 'bg-neutral-900', icon: UserPlus },
  { id: 'contacted', label: 'Contacted', chip: 'bg-neutral-100 text-neutral-900 ring-neutral-200', dot: 'bg-neutral-900', icon: PhoneCall },
  { id: 'visit', label: 'Visit planned', chip: 'bg-neutral-100 text-neutral-900 ring-neutral-200', dot: 'bg-neutral-900', icon: MapPin },
  { id: 'joined', label: 'Joined', chip: 'bg-neutral-950 text-white ring-neutral-950', dot: 'bg-neutral-900', icon: CheckCircle2 },
  { id: 'dropped', label: 'Not joining', chip: 'bg-neutral-200 text-neutral-600 ring-neutral-300', dot: 'bg-neutral-400', icon: Inbox },
];

const openLead = (lead) => lead.status !== 'joined' && lead.status !== 'dropped';

function LeadRow({ lead, today, onStatus, onDelete }) {
  const overdue = openLead(lead) && lead.followUp && lead.followUp <= today;
  const current = STATUSES.find((s) => s.id === (lead.status || 'new')) || STATUSES[0];
  return (
    <li className={`px-4 sm:px-5 py-4 ${overdue ? 'bg-neutral-50/40' : ''}`}>
      <div className="flex items-start gap-3">
        <Initials name={lead.name} className="h-10 w-10 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-neutral-900 truncate">{lead.name}</p>
            <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-semibold ring-1 ${current.chip}`}>{current.label}</span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 truncate">
            {[lead.phone, lead.className && (String(lead.className).startsWith('Class') ? lead.className : `Class ${lead.className}`), lead.source && `via ${lead.source}`, lead.createdAt && `added ${formatDate(lead.createdAt)}`].filter(Boolean).join(' · ')}
          </p>
          {lead.note && <p className="mt-1.5 text-sm text-neutral-700 break-words">“{lead.note}”</p>}
          {lead.followUp && (
            <p className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${overdue ? 'text-neutral-900' : 'text-neutral-500'}`}>
              <CalendarClock className="w-3.5 h-3.5" /> Follow up {formatDate(lead.followUp)}{overdue ? (lead.followUp < today ? ' · overdue' : ' · today') : ''}
            </p>
          )}
        </div>
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="h-9 px-3 shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold" aria-label={`Call ${lead.name}`}>
            <Phone className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Call</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => { if (confirm(`Delete the inquiry from ${lead.name}?`)) onDelete(lead.id); }}
          className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50"
          aria-label={`Delete inquiry from ${lead.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 ml-13 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={`Status for ${lead.name}`}>
        <span className="text-[11px] font-semibold text-neutral-400 mr-1">Move to:</span>
        {STATUSES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={(lead.status || 'new') === item.id}
            onClick={() => onStatus(lead.id, item.id)}
            className={`h-7 px-2.5 rounded-full text-xs font-semibold ring-1 transition ${(lead.status || 'new') === item.id ? item.chip : 'bg-white text-neutral-500 ring-neutral-200 hover:ring-neutral-300 hover:text-neutral-700'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </li>
  );
}

export default function Leads() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const [filter, setFilter] = useState('open');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', className: '', source: 'Call', note: '', followUp: '',
  });

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const add = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    room.addLead({
      name: form.name.trim(),
      phone: form.phone.trim(),
      className: form.className.trim(),
      source: form.source,
      note: form.note.trim(),
      followUp: form.followUp,
      status: 'new',
      createdAt: todayISO(),
    });
    setSaved(form.name.trim());
    setForm({ name: '', phone: '', className: form.className, source: form.source, note: '', followUp: '' });
  };

  const term = query.trim().toLowerCase();
  const today = todayISO();
  const due = room.leads.filter((lead) => openLead(lead) && lead.followUp && lead.followUp <= today);
  const counts = Object.fromEntries(STATUSES.map((item) => [item.id, room.leads.filter((lead) => (lead.status || 'new') === item.id).length]));
  const decided = counts.joined + counts.dropped;
  const conversion = decided ? Math.round((counts.joined / decided) * 100) : null;
  const bySource = SOURCES.map((s) => ({ s, n: room.leads.filter((l) => l.source === s).length })).filter((x) => x.n);
  const shown = room.leads.filter((lead) => {
    const matchesStatus = filter === 'all' || (filter === 'open' ? openLead(lead) : filter === 'due' ? due.includes(lead) : (lead.status || 'new') === filter);
    const matchesSearch = !term || [lead.name, lead.phone, lead.className, lead.note].join(' ').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const rank = (lead) => (openLead(lead) && lead.followUp && lead.followUp <= today ? 0 : 1);
    return rank(a) - rank(b) || (a.followUp || '9999').localeCompare(b.followUp || '9999');
  });

  const filters = [
    ['open', 'To follow up', room.leads.filter(openLead).length],
    ['due', 'Due today', due.length],
    ['joined', 'Joined', counts.joined],
    ['dropped', 'Not joining', counts.dropped],
    ['all', 'All', room.leads.length],
  ];

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-14">
        <PageHeader
          icon={Inbox}
          eyebrow="Institute"
          title="Leads & inquiries"
          subtitle="Save every call, message or walk-in. Set a follow-up date, and move each inquiry along until they join."
        />

        {/* Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {STATUSES.slice(0, 4).map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                className={`relative text-left rounded-2xl bg-white p-4 shadow-card ring-1 transition-all hover:-translate-y-0.5 ${filter === s.id ? 'ring-2 ring-brand-500' : 'ring-neutral-200/80'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Step {i + 1}</span>
                  <span className={`h-8 w-8 rounded-lg grid place-items-center ring-1 ${s.chip}`}><Icon className="w-4 h-4" /></span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-neutral-900 tabular-nums">{counts[s.id]}</p>
                <p className="text-sm font-semibold text-neutral-600">{s.label}</p>
                {i < 3 && <span aria-hidden className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 h-5 w-5 rounded-full bg-white ring-1 ring-neutral-200 text-neutral-400 text-xs leading-5 text-center">›</span>}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* List */}
          <section className="xl:col-span-2 bg-white rounded-2xl ring-1 ring-neutral-200/80 shadow-card overflow-hidden min-w-0">
            <div className="p-4 border-b border-neutral-100 space-y-3">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="radiogroup" aria-label="Filter inquiries">
                {filters.map(([id, label, count]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={filter === id}
                    onClick={() => setFilter(id)}
                    className={`h-8 shrink-0 px-3 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 ${filter === id ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 hover:bg-white'}`}
                  >
                    {label}
                    <span className={`min-w-5 h-5 px-1 rounded-full text-[11px] grid place-items-center ${filter === id ? 'bg-white/20' : id === 'due' && count ? 'bg-neutral-400 text-neutral-900' : 'bg-neutral-200/70'}`}>{count}</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone or note" aria-label="Search inquiries" className={`${field} pl-9 bg-neutral-50`} />
              </div>
            </div>

            {room.leads.length === 0 ? (
              <EmptyState icon={Inbox} title="No inquiries yet" text="When a parent calls, messages or walks in, save them with the form. You'll never forget a follow-up again." />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {shown.length === 0 && <li className="px-5 py-12 text-sm text-center text-neutral-500">No inquiries in this view.</li>}
                {shown.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} today={today} onStatus={(id, status) => room.updateLead(id, { status })} onDelete={room.deleteLead} />
                ))}
              </ul>
            )}
          </section>

          {/* New inquiry + insights */}
          <aside className="space-y-6">
            <Panel title="New inquiry" subtitle="Takes 10 seconds" icon={Plus} tone="brand">
              <form onSubmit={add} className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Name</span>
                  <input className={field} value={form.name} onChange={(e) => { setSaved(''); set('name')(e); }} placeholder="Student or parent" aria-label="Inquiry name" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Phone</span>
                  <input className={field} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" aria-label="Inquiry phone" inputMode="tel" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">Class</span>
                    {room.classes.length > 0 ? (
                      <select className={field} value={form.className} aria-label="Inquiry class" onChange={set('className')}>
                        <option value="">Not sure</option>
                        {room.classes.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                      </select>
                    ) : (
                      <input className={field} value={form.className} onChange={set('className')} placeholder="10" aria-label="Inquiry class" />
                    )}
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">Came from</span>
                    <select className={field} value={form.source} aria-label="Inquiry source" onChange={set('source')}>
                      {SOURCES.map((source) => <option key={source}>{source}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Follow up on</span>
                  <input type="date" className={field} value={form.followUp} onChange={set('followUp')} aria-label="Follow up date" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Note</span>
                  <input className={field} value={form.note} onChange={set('note')} placeholder="e.g. Asked about fees" aria-label="Inquiry note" />
                </label>
                <button type="submit" className="w-full h-11 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold shadow-sm">
                  Save inquiry
                </button>
                {saved && <p className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Saved {saved}. It's in “To follow up”.</p>}
              </form>
            </Panel>

            {room.leads.length > 0 && (
              <Panel title="Insights" icon={BarChart3} tone="sky">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-neutral-50 ring-1 ring-neutral-100 p-3">
                    <p className="text-[11px] font-semibold text-neutral-500">Joined rate</p>
                    <p className="text-xl font-extrabold text-neutral-900">{conversion != null ? `${conversion}%` : '—'}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 ring-1 ring-neutral-100 p-3">
                    <p className="text-[11px] font-semibold text-neutral-500">Follow-ups due</p>
                    <p className={`text-xl font-extrabold ${due.length ? 'text-neutral-900' : 'text-neutral-900'}`}>{due.length}</p>
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">Where inquiries come from</p>
                <div className="space-y-3">
                  {bySource.map(({ s, n }) => (
                    <Meter key={s} label={s} right={n} value={n} max={room.leads.length} tone="sky" />
                  ))}
                </div>
              </Panel>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
