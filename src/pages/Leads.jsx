import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Phone, Trash2, Search, Plus, CalendarClock, UserPlus, PhoneCall, MapPin, CheckCircle2, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO, formatDate } from '../services/classroom';
import { getToken } from '../services/cloud';
import { EmptyState, Chips, Picker } from '../components/ui';

const field = 'w-full h-11 px-3 text-base sm:text-sm bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-neutral-400';

const SOURCES = ['Call', 'WhatsApp', 'Walk-in', 'Reference'];

const STATUSES = [
  { id: 'new', label: 'New', chip: 'bg-[#f0f0f0] text-neutral-800 ring-[#dedede]', dot: 'bg-[#d6d6d6]', icon: UserPlus },
  { id: 'contacted', label: 'Contacted', chip: 'bg-[#e2e2e2] text-neutral-800 ring-[#c4c4c4]', dot: 'bg-[#005a9c]', icon: PhoneCall },
  { id: 'visit', label: 'Visit planned', chip: 'bg-[#005a9c] text-white ring-[#005a9c]', dot: 'bg-[#005a9c]', icon: MapPin },
  { id: 'joined', label: 'Joined', chip: 'bg-[#1b365d] text-white ring-[#1b365d]', dot: 'bg-[#1b365d]', icon: CheckCircle2 },
  { id: 'dropped', label: 'Not joining', chip: 'bg-neutral-200 text-neutral-600 ring-neutral-300', dot: 'bg-neutral-400', icon: Inbox },
];

const openLead = (lead) => lead.status !== 'joined' && lead.status !== 'dropped';
const classLabel = (name) => (name ? (String(name).startsWith('Class') ? name : `Class ${name}`) : '');

/** One inquiry as a table row, laid out like a row of the students table. */
function LeadTableRow({ lead, today, onStatus, onDelete, onInvite, sending }) {
  const overdue = openLead(lead) && lead.followUp && lead.followUp <= today;
  const current = STATUSES.find((s) => s.id === (lead.status || 'new')) || STATUSES[0];
  const initial = lead.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <tr className={`transition-colors hover:bg-neutral-50/70 ${overdue ? 'bg-amber-50/40' : ''}`}>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3 min-w-48">
          <span className="h-9 w-9 shrink-0 rounded-full bg-brand-100 text-brand-700 font-bold grid place-items-center text-xs">{initial}</span>
          <span className="min-w-0">
            <span className="block font-semibold text-neutral-900 truncate">{lead.name}</span>
            {lead.note && <span className="block max-w-64 truncate text-xs text-neutral-500" title={lead.note}>{lead.note}</span>}
          </span>
        </div>
      </td>
      <td className="py-3.5 px-3 whitespace-nowrap text-neutral-700 font-medium">
        {classLabel(lead.className) || <span className="text-neutral-400 italic">Not sure</span>}
      </td>
      <td className="py-3.5 px-3 whitespace-nowrap">
        {lead.phone ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-neutral-700">{lead.phone}</span>
            <a href={`tel:${lead.phone}`} className="h-7 w-7 grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100" title={`Call ${lead.name}`} aria-label={`Call ${lead.name}`}>
              <Phone className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => onInvite([lead])}
              disabled={sending}
              className="h-7 px-2 rounded-lg text-neutral-900 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-medium inline-flex items-center gap-1 disabled:opacity-50"
              aria-label={`Send WhatsApp invite to ${lead.name}`}
            >
              <Send className="w-3.5 h-3.5" /> Invite
            </button>
          </div>
        ) : (
          <span className="text-neutral-400 text-xs italic">No number</span>
        )}
      </td>
      <td className="py-3.5 px-3 whitespace-nowrap text-neutral-600">{lead.source || '—'}</td>
      <td className="py-3.5 px-3 whitespace-nowrap text-neutral-600">{lead.createdAt ? formatDate(lead.createdAt) : '—'}</td>
      <td className="py-3.5 px-3 whitespace-nowrap">
        {lead.followUp && openLead(lead) ? (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${overdue ? (lead.followUp < today ? 'text-rose-600' : 'text-amber-700') : 'text-neutral-600'}`}>
            <CalendarClock className="w-3.5 h-3.5" />
            {formatDate(lead.followUp)}
            {overdue && <span className="font-medium">{lead.followUp < today ? '· overdue' : '· today'}</span>}
          </span>
        ) : <span className="text-neutral-400 text-xs">—</span>}
      </td>
      <td className="py-3.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${current.dot}`} aria-hidden />
          <Picker
            size="sm"
            label={`Status for ${lead.name}`}
            value={lead.status || 'new'}
            onChange={(status) => onStatus(lead.id, status)}
            options={STATUSES.map((item) => ({ value: item.id, label: item.label }))}
          />
        </div>
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap text-right">
        <button
          type="button"
          onClick={() => { if (confirm(`Delete the inquiry from ${lead.name}?`)) onDelete(lead.id); }}
          className="h-8 w-8 inline-grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50"
          aria-label={`Delete inquiry from ${lead.name}`}
          title={`Delete inquiry from ${lead.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

export default function Leads() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const [filter, setFilter] = useState('open');
  const [classFilter, setClassFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(() => new URLSearchParams(window.location.search).has('new'));
  const [form, setForm] = useState({
    name: '', phone: '', className: '', source: 'Call', note: '', followUp: '',
  });

  useEffect(() => { setCurrentPage(1); }, [filter, classFilter, sourceFilter, query]);

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
    setFormOpen(false);
    setForm({ name: '', phone: '', className: form.className, source: form.source, note: '', followUp: '' });
  };

  // One click sends a WhatsApp visit invite through Twilio (see api/whatsapp.js).
  const sendInvites = async (list) => {
    const withPhone = list.filter((lead) => (lead.phone || '').replace(/\D/g, '').length >= 10);
    if (!withPhone.length) {
      setNotice('None of these inquiries has a 10-digit phone number.');
      return;
    }
    if (withPhone.length > 1 && !confirm(`Send a WhatsApp invite to ${withPhone.length} inquiries?`)) return;
    setSending(true);
    setNotice('');
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          kind: 'invite',
          institute: room.institute?.name || room.school || '',
          leads: withPhone.map((lead) => ({ name: lead.name, phone: lead.phone })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.configured === false) {
        setNotice(result.error ? `WhatsApp failed: ${result.error}` : 'WhatsApp is not set up yet.');
        return;
      }
      const sent = result.sent || [];
      const failed = result.failed || [];
      // A new inquiry that got the invite moves to Contacted.
      withPhone
        .filter((lead) => (lead.status || 'new') === 'new' && sent.includes(lead.name.replace(/\s+/g, ' ').trim().slice(0, 80)))
        .forEach((lead) => room.updateLead(lead.id, { status: 'contacted' }));
      setNotice(sent.length
        ? `Invite sent to ${sent.length} inquir${sent.length > 1 ? 'ies' : 'y'}.${failed.length ? ` ${failed.length} failed: ${failed[0].error}` : ''}`
        : `No invite could be sent.${failed.length ? ` ${failed[0].error}` : ''}`);
    } catch {
      setNotice('WhatsApp is not available right now.');
    } finally {
      setSending(false);
    }
  };

  const term = query.trim().toLowerCase();
  const today = todayISO();
  const due = room.leads.filter((lead) => openLead(lead) && lead.followUp && lead.followUp <= today);
  const counts = Object.fromEntries(STATUSES.map((item) => [item.id, room.leads.filter((lead) => (lead.status || 'new') === item.id).length]));
  const decided = counts.joined + counts.dropped;
  const conversion = decided ? Math.round((counts.joined / decided) * 100) : null;
  const inStatus = (lead, id) => id === 'all' || (id === 'open' ? openLead(lead) : id === 'due' ? due.includes(lead) : (lead.status || 'new') === id);
  const shown = room.leads.filter((lead) => {
    const matchesSearch = !term || [lead.name, lead.phone, lead.className, lead.note, lead.source].join(' ').toLowerCase().includes(term);
    return inStatus(lead, filter)
      && (classFilter === 'all' || classLabel(lead.className) === classFilter)
      && (sourceFilter === 'all' || lead.source === sourceFilter)
      && matchesSearch;
  }).sort((a, b) => {
    // Newest inquiry first — a lead added today sits on top. Decided
    // inquiries (joined / not joining) sink below the active pipeline.
    const open = (lead) => (openLead(lead) ? 0 : 1);
    return open(a) - open(b)
      || (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  // Pagination, as on the Students page.
  const totalFiltered = shown.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const pageRows = shown.slice(startIndex, endIndex);

  const filters = [
    ['open', 'To follow up', room.leads.filter(openLead).length],
    ['due', 'Due today', due.length],
    ['new', 'New', counts.new],
    ['contacted', 'Contacted', counts.contacted],
    ['visit', 'Visit planned', counts.visit],
    ['joined', 'Joined', counts.joined],
    ['dropped', 'Not joining', counts.dropped],
    ['all', 'All inquiries', room.leads.length],
  ];
  const leadClasses = [...new Set(room.leads.map((l) => classLabel(l.className)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const invitable = shown.filter((lead) => lead.phone && openLead(lead));
  const filtering = filter !== 'open' || classFilter !== 'all' || sourceFilter !== 'all' || !!term;

  const topSource = SOURCES.map((s) => ({ s, n: room.leads.filter((l) => l.source === s).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n)[0];
  const tiles = [
    ['Inquiries', room.leads.length, `${room.leads.filter(openLead).length} still open`],
    ['Follow-ups due', due.length, due.length ? 'today or overdue' : 'all caught up'],
    ['Joined', counts.joined, conversion != null ? `${conversion}% of decided` : 'none decided yet'],
    ['Top source', topSource?.s || '—', topSource ? `${topSource.n} inquiries` : 'no sources yet'],
  ];

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-14">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600 mb-1">Institute</p>
            <h1 className="text-2xl sm:text-[1.7rem] font-extrabold tracking-tight text-neutral-900">Inquiries</h1>
            <p className="mt-1 text-sm text-neutral-500">Every call, walk-in and WhatsApp inquiry, with its follow-up and status.</p>
          </div>
          <div className="flex items-center gap-2">
            {invitable.length > 0 && (
              <button
                type="button"
                onClick={() => sendInvites(invitable)}
                disabled={sending}
                className="h-9 px-3.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 bg-white ring-1 ring-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-neutral-500" />
                {sending ? 'Sending…' : `Invite ${invitable.length} on WhatsApp`}
              </button>
            )}
            <button
              type="button"
              onClick={() => { setSaved(''); setFormOpen(true); }}
              className="h-9 px-4 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> New inquiry
            </button>
          </div>
        </div>

        {saved && (
          <p className="mb-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-neutral-800 shadow-card">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#17653a]" /> Saved {saved}. It's in “To follow up”.
            <button type="button" onClick={() => setSaved('')} className="ml-auto text-neutral-400" aria-label="Close"><X className="w-4 h-4" /></button>
          </p>
        )}

        {notice && (
          <p className="mb-4 flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white" role="status">
            {notice}
            <button type="button" onClick={() => setNotice('')} className="ml-auto shrink-0 text-white/70" aria-label="Close"><X className="w-4 h-4" /></button>
          </p>
        )}

        {room.leads.length > 0 && (
          <div className="mb-5 hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tiles.map(([label, value, hint]) => (
              <div key={label} className="bg-white rounded-3xl shadow-card px-4 py-3.5">
                <p className="text-xs font-semibold text-neutral-500">{label}</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-neutral-900 truncate">{value}</p>
                <p className="text-[11px] text-neutral-400">{hint}</p>
              </div>
            ))}
          </div>
        )}

        {room.leads.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card">
            <EmptyState icon={Inbox} title="No inquiries yet" text="Save every inquiry and follow up." />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters bar */}
            <div className="bg-white rounded-3xl shadow-card p-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, phone, class or note…" aria-label="Search inquiries" className={`${field} pl-9`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</span>
                  <Picker label="Show inquiries" value={filter} onChange={setFilter} options={filters.map(([id, label, count]) => ({ value: id, label, count }))} />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Class</span>
                  <Picker
                    label="Filter inquiries by class"
                    value={classFilter}
                    onChange={setClassFilter}
                    options={[
                      { value: 'all', label: 'All classes', count: room.leads.filter((l) => inStatus(l, filter)).length },
                      ...leadClasses.map((name) => ({ value: name, label: name, count: room.leads.filter((l) => inStatus(l, filter) && classLabel(l.className) === name).length })),
                    ]}
                  />
                </div>
                <div className="hidden sm:block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Came from</span>
                  <Picker
                    label="Filter inquiries by source"
                    value={sourceFilter}
                    onChange={setSourceFilter}
                    options={[
                      { value: 'all', label: 'All sources', count: room.leads.filter((l) => inStatus(l, filter)).length },
                      ...SOURCES.map((s) => ({ value: s, label: s, count: room.leads.filter((l) => inStatus(l, filter) && l.source === s).length })),
                    ]}
                  />
                </div>
              </div>
              {filtering && (
                <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                  <span>{totalFiltered} {totalFiltered === 1 ? 'inquiry' : 'inquiries'} match</span>
                  <button type="button" onClick={() => { setFilter('open'); setClassFilter('all'); setSourceFilter('all'); setQuery(''); }} className="font-semibold text-[#005a9c] hover:underline">Clear filters</button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
              <ul className="md:hidden divide-y divide-neutral-100">
                {pageRows.length === 0 ? (
                  <li className="py-12 text-center text-sm text-neutral-500">No inquiries in this view.</li>
                ) : pageRows.map((lead) => {
                  const current = STATUSES.find((s) => s.id === (lead.status || 'new')) || STATUSES[0];
                  return (
                    <li key={lead.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="h-9 w-9 shrink-0 rounded-full bg-brand-100 text-brand-700 font-bold grid place-items-center text-xs">{lead.name.trim().charAt(0).toUpperCase() || '?'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900 truncate">{lead.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{[classLabel(lead.className), lead.phone, current.label].filter(Boolean).join(' · ')}</p>
                      </div>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label={`Call ${lead.name}`}>
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button type="button" onClick={() => { if (confirm(`Delete the inquiry from ${lead.name}?`)) room.deleteLead(lead.id); }} className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100" aria-label={`Delete ${lead.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Inquiry</th>
                      <th className="py-3 px-3">Class</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Came from</th>
                      <th className="py-3 px-3">Added</th>
                      <th className="py-3 px-3">Follow up</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {pageRows.length === 0 ? (
                      <tr><td colSpan={8} className="py-12 text-center text-sm text-neutral-500">No inquiries in this view.</td></tr>
                    ) : pageRows.map((lead) => (
                      <LeadTableRow key={lead.id} lead={lead} today={today} onStatus={(id, status) => room.updateLead(id, { status })} onDelete={room.deleteLead} onInvite={sendInvites} sending={sending} />
                    ))}
                  </tbody>
                </table>
              </div>

              {totalFiltered > 0 && (
                <div className="px-4 py-3 bg-neutral-50/70 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="h-8 px-2 rounded-lg ring-1 ring-neutral-200 bg-white font-medium text-neutral-700 focus:outline-none"
                      aria-label="Rows per page"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-neutral-400">|</span>
                    <span>
                      Showing <strong className="text-neutral-900">{startIndex + 1}</strong> to{' '}
                      <strong className="text-neutral-900">{endIndex}</strong> of{' '}
                      <strong className="text-neutral-900">{totalFiltered}</strong> inquiries
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-2.5 rounded-lg ring-1 ring-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 font-medium"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <span className="px-1.5 font-medium text-neutral-700">Page {safePage} of {totalPages}</span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 px-2.5 rounded-lg ring-1 ring-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 font-medium"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 sm:p-4" onClick={() => setFormOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="New inquiry"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-base font-semibold text-neutral-900">New inquiry</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="h-10 w-10 -mr-2 grid place-items-center rounded-xl text-neutral-400 hover:bg-neutral-100" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pb-5">
              <form onSubmit={add} className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Name</span>
                  <input className={field} value={form.name} onChange={set('name')} placeholder="Student or parent" aria-label="Inquiry name" required autoFocus />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Phone</span>
                  <input className={field} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" aria-label="Inquiry phone" inputMode="tel" />
                </label>
                <div>
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Class</span>
                  {room.classes.length > 0 ? (
                    <Picker
                      label="Choose class"
                      value={form.className}
                      onChange={(name) => setForm((current) => ({ ...current, className: name }))}
                      options={[{ value: '', label: 'Not sure' }, ...room.classes.map((item) => ({ value: item.name, label: item.name }))]}
                    />
                  ) : (
                    <input className={field} value={form.className} onChange={set('className')} placeholder="10" aria-label="Inquiry class" />
                  )}
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Came from</span>
                  <Chips
                    label="Came from"
                    value={form.source}
                    onChange={(source) => setForm((current) => ({ ...current, source }))}
                    options={SOURCES.map((source) => ({ value: source, label: source }))}
                  />
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Follow up on</span>
                  <input type="date" className={field} value={form.followUp} onChange={set('followUp')} aria-label="Follow up date" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-600">Note</span>
                  <input className={field} value={form.note} onChange={set('note')} placeholder="e.g. Asked about fees" aria-label="Inquiry note" />
                </label>
                <button type="submit" className="w-full h-12 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold shadow-sm">
                  Save inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
