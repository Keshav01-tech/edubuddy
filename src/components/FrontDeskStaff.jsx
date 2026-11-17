import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Mail, Phone, KeyRound, ConciergeBell } from 'lucide-react';
import { Initials } from './ui';
import { useClassroom } from '../services/classroom';
import { suggestPassword } from '../services/admins';

const field = 'h-11 w-full px-4 text-sm bg-white rounded-2xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#c4c4c4] placeholder:text-neutral-400';

function ReceptionistForm({ initial, onSave, onCancel }) {
  const editing = !!initial?.id;
  const [draft, setDraft] = useState(() => ({
    name: '', email: '', phone: '', ...initial, password: editing ? '' : suggestPassword(),
  }));
  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));
  const password = String(draft.password || '').trim();
  const ready = draft.name.trim() && draft.email.trim() && (editing ? !password || password.length >= 6 : password.length >= 6);

  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    const record = { name: draft.name.trim(), email: draft.email.trim().toLowerCase(), phone: String(draft.phone || '').trim() };
    if (password) record.password = password;
    onSave(record);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl shadow-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-neutral-800">{editing ? `Edit ${initial.name}` : 'Add front desk staff'}</h3>
        <button type="button" onClick={onCancel} aria-label="Close" className="h-9 w-9 grid place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Name</span>
          <input className={field} value={draft.name} onChange={set('name')} placeholder="e.g. Pooja Sharma" required autoFocus /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Email (their login)</span>
          <input className={field} type="email" value={draft.email} onChange={set('email')} placeholder="reception@institute.com" required /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Phone</span>
          <input className={field} value={draft.phone} onChange={set('phone')} placeholder="98xxxxxxxx" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Password (at least 6 characters)</span>
          <input className={`${field} font-mono`} value={draft.password} onChange={set('password')} placeholder={editing ? 'Leave blank to keep the current password' : ''} /></label>
      </div>
      <p className="mt-3 text-xs text-neutral-500">Front desk staff can add students, record fees, read receipt photos and handle inquiries. They cannot change batches, teachers or attendance.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-11 px-5 rounded-2xl bg-neutral-100 text-sm font-medium text-neutral-700 hover:bg-neutral-200">Cancel</button>
        <button type="submit" disabled={!ready} className="h-11 px-6 rounded-2xl bg-[#005a9c] text-white text-sm font-medium hover:brightness-95 disabled:opacity-40">
          {editing ? 'Save changes' : 'Add staff'}
        </button>
      </div>
    </form>
  );
}

/** The admin's list of front desk (reception) accounts, shown on the Teachers page. */
export function FrontDeskStaff() {
  const room = useClassroom();
  const [form, setForm] = useState(null);

  const save = (record) => {
    if (form?.id) room.updateReceptionist(form.id, record);
    else room.addReceptionist(record);
    setForm(null);
  };
  const remove = (r) => {
    if (confirm(`Remove ${r.name}? They will no longer be able to sign in. Fees they recorded stay.`)) room.deleteReceptionist(r.id);
  };

  return (
    <section className="mt-10" aria-labelledby="front-desk-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 id="front-desk-title" className="text-xl font-medium tracking-tight text-neutral-900">Front desk</h2>
          <p className="text-sm text-neutral-500">Reception staff sign in with “Front desk” on the sign-in page.</p>
        </div>
        <button type="button" onClick={() => setForm({})}
          className="h-11 px-4 rounded-xl bg-white ring-1 ring-neutral-200 text-neutral-800 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-50">
          <Plus className="w-4 h-4" /> Add staff
        </button>
      </div>

      {form && <div className="mb-5"><ReceptionistForm key={form.id || 'new'} initial={form} onSave={save} onCancel={() => setForm(null)} /></div>}

      {room.receptionists.length === 0 && !form ? (
        <div className="rounded-3xl bg-white p-6 shadow-card flex items-center gap-4">
          <span className="h-12 w-12 shrink-0 rounded-full grid place-items-center bg-[#eef7fc] text-[#005a9c]"><ConciergeBell className="w-5 h-5" /></span>
          <p className="text-sm text-neutral-600">No front desk staff yet. Add your receptionist so they can scan fee receipts and record payments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 items-start">
          {room.receptionists.map((r) => (
            <article key={r.id} className={`bg-white rounded-3xl shadow-card p-5 ${r.active === false ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <Initials name={r.name} className="h-12 w-12 text-sm" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium text-neutral-900 truncate">{r.name}</h3>
                  <p className="text-sm text-neutral-500">Front desk</p>
                </div>
                <button
                  type="button"
                  onClick={() => room.updateReceptionist(r.id, { active: r.active === false })}
                  className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold ${r.active === false ? 'bg-neutral-100 text-neutral-600' : 'bg-[#e6f5ee] text-[#17653a]'}`}
                  title={r.active === false ? 'Tap to let them sign in' : 'Tap to stop them signing in'}
                >
                  {r.active === false ? 'Off' : 'Active'}
                </button>
                <button type="button" onClick={() => setForm(r)} aria-label={`Edit ${r.name}`} className="h-9 w-9 grid place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => remove(r)} aria-label={`Remove ${r.name}`} className="h-9 w-9 grid place-items-center rounded-full text-neutral-500 hover:bg-neutral-900 hover:text-white"><Trash2 className="w-4 h-4" /></button>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-neutral-600">
                <li className="flex items-center gap-2 min-w-0"><Mail className="w-4 h-4 shrink-0 text-neutral-400" /><span className="truncate">{r.email}</span></li>
                {r.phone && <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0 text-neutral-400" />{r.phone}</li>}
                <li className="flex items-center gap-2"><KeyRound className="w-4 h-4 shrink-0 text-neutral-400" />Password: <span className="font-mono text-neutral-800">{r.password || (r.hasPassword ? 'set (hidden)' : 'not set')}</span></li>
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
