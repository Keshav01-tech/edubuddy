import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Phone, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO, formatDate } from '../services/classroom';

const field = 'w-full h-11 px-3 text-base bg-white rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400';

const SOURCES = ['Call', 'WhatsApp', 'Walk-in', 'Reference'];

const STATUSES = [
  { id: 'new', label: 'New', chip: 'bg-sky-50 text-sky-800' },
  { id: 'contacted', label: 'Contacted', chip: 'bg-amber-50 text-amber-800' },
  { id: 'visit', label: 'Visit planned', chip: 'bg-violet-50 text-violet-800' },
  { id: 'joined', label: 'Joined', chip: 'bg-emerald-50 text-emerald-800' },
  { id: 'dropped', label: 'Not joining', chip: 'bg-slate-100 text-slate-500' },
];

const openLead = (lead) => lead.status !== 'joined' && lead.status !== 'dropped';
const isNew = (lead) => (lead.status || 'new') === 'new';

function LeadRow({ lead, today, onStatus, onDelete }) {
  const overdue = openLead(lead) && lead.followUp && lead.followUp <= today;
  return (
    <li className="px-4 sm:px-5 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{lead.name}</p>
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            {[lead.phone, lead.className && `Class ${lead.className}`, lead.source, formatDate(lead.createdAt)].filter(Boolean).join(' · ')}
          </p>
          {lead.note && <p className="mt-1 text-sm text-slate-600 break-words">{lead.note}</p>}
          {lead.followUp && (
            <p className={`mt-1 text-xs font-medium ${overdue ? 'text-amber-800' : 'text-slate-400'}`}>
              Follow up {formatDate(lead.followUp)}{overdue ? ' · due' : ''}
            </p>
          )}
        </div>
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50" aria-label={`Call ${lead.name}`}>
            <Phone className="w-4 h-4" />
          </a>
        )}
        <button
          type="button"
          onClick={() => { if (confirm(`Delete the inquiry from ${lead.name}?`)) onDelete(lead.id); }}
          className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          aria-label={`Delete inquiry from ${lead.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Status for ${lead.name}`}>
        {STATUSES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={(lead.status || 'new') === item.id}
            onClick={() => onStatus(lead.id, item.id)}
            className={`h-7 px-2.5 rounded-full text-xs font-medium ${(lead.status || 'new') === item.id ? item.chip : 'bg-white text-slate-400 ring-1 ring-slate-200'}`}
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
  const [section, setSection] = useState('new');
  const [filter, setFilter] = useState('open');
  const [query, setQuery] = useState('');
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
    setForm({ name: '', phone: '', className: form.className, source: form.source, note: '', followUp: '' });
  };

  const term = query.trim().toLowerCase();
  const today = todayISO();
  const due = room.leads.filter((lead) => openLead(lead) && lead.followUp && lead.followUp <= today);
  const counts = Object.fromEntries(STATUSES.map((item) => [item.id, room.leads.filter((lead) => lead.status === item.id).length]));
  const shown = room.leads.filter((lead) => {
    const matchesStatus = filter === 'all' || (filter === 'open' ? openLead(lead) : (lead.status || 'new') === filter);
    const matchesSearch = !term || [lead.name, lead.phone, lead.className, lead.note].join(' ').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const rank = (lead) => (openLead(lead) && lead.followUp && lead.followUp <= today ? 0 : 1);
    return rank(a) - rank(b) || (a.followUp || '9999').localeCompare(b.followUp || '9999');
  });

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-3xl"
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Leads</h1>
            <p className="mt-1 text-sm text-slate-500">
              {section === 'new' ? 'Write down a new call or message.' : 'Follow up the inquiries you already have.'}
            </p>
          </div>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl" role="tablist">
            {[['new', 'New inquiry'], ['inquiries', 'Inquiries']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={section === id}
                onClick={() => setSection(id)}
                className={`h-9 px-3 rounded-lg text-sm font-medium ${section === id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
              >
                {label}{id === 'inquiries' && room.leads.length > 0 ? ` ${room.leads.length}` : ''}
              </button>
            ))}
          </div>
        </div>

        {section === 'new' && (
        <>
        <form onSubmit={add} className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Name</span>
              <input className={field} value={form.name} onChange={set('name')} placeholder="Student or parent" aria-label="Inquiry name" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Phone</span>
              <input className={field} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" aria-label="Inquiry phone" inputMode="tel" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Class</span>
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
              <span className="mb-1 block text-xs font-medium text-slate-500">Came from</span>
              <select className={field} value={form.source} aria-label="Inquiry source" onChange={set('source')}>
                {SOURCES.map((source) => <option key={source}>{source}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Follow up on</span>
              <input type="date" className={field} value={form.followUp} onChange={set('followUp')} aria-label="Follow up date" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Note</span>
              <input className={field} value={form.note} onChange={set('note')} placeholder="Asked about fees" aria-label="Inquiry note" />
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="submit" className="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
              Save inquiry
            </button>
          </div>
        </form>
        {room.leads.some(isNew) && (
          <ul className="mt-4 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card divide-y divide-slate-100">
            {room.leads.filter(isNew).map((lead) => (
              <LeadRow key={lead.id} lead={lead} today={today} onStatus={(id, status) => room.updateLead(id, { status })} onDelete={room.deleteLead} />
            ))}
          </ul>
        )}
        </>
        )}

        {section === 'inquiries' && (
        <section>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="radiogroup" aria-label="Filter inquiries">
            {[
              ['open', 'To follow', room.leads.filter(openLead).length],
              ['new', 'New', counts.new],
              ['contacted', 'Contacted', counts.contacted],
              ['visit', 'Visit', counts.visit],
              ['joined', 'Joined', counts.joined],
              ['all', 'All', room.leads.length],
            ].map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={filter === id}
                onClick={() => setFilter(id)}
                className={`h-8 shrink-0 px-3 rounded-full text-sm font-medium ${filter === id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
              >
                {label} {count}
              </button>
            ))}
          </div>

          {due.length > 0 && filter === 'open' && (
            <p className="mt-3 text-sm font-medium text-amber-800">{due.length} {due.length === 1 ? 'follow-up is' : 'follow-ups are'} due.</p>
          )}

          {room.leads.length > 4 && (
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or phone"
              aria-label="Search inquiries"
              className={`${field} mt-3`}
            />
          )}

          {room.leads.length === 0 ? (
            <div className="mt-3 bg-white rounded-2xl ring-1 ring-slate-200/70 px-6 py-12 text-center">
              <Inbox className="w-8 h-8 mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-900">No inquiries yet</p>
              <p className="mt-1 text-sm text-slate-500">When someone calls or messages, add them under New inquiry.</p>
              <button type="button" onClick={() => setSection('new')} className="mt-4 h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
                New inquiry
              </button>
            </div>
          ) : (
            <ul className="mt-3 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card divide-y divide-slate-100">
              {shown.length === 0 && <li className="px-5 py-8 text-sm text-center text-slate-500">No inquiries in this view.</li>}
              {shown.map((lead) => (
                <LeadRow key={lead.id} lead={lead} today={today} onStatus={(id, status) => room.updateLead(id, { status })} onDelete={room.deleteLead} />
              ))}
            </ul>
          )}
        </section>
        )}
      </main>
    </div>
  );
}
