import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShieldCheck, LogOut, X, Trash2, Copy, Check, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { suggestPassword } from '../services/admins';
import { callDb } from '../services/cloud';

const field = 'w-full h-12 px-4 text-base bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#005a9c] placeholder:text-neutral-400';

function AdminForm({ onDone, onCancel }) {
  const [draft, setDraft] = useState(() => ({ name: '', institute: '', loginId: '', password: suggestPassword() }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => { setError(''); setDraft((d) => ({ ...d, [key]: e.target.value })); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { admin } = await callDb('admins.create', draft);
      onDone(admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-neutral-600">Institute name</span>
        <input className={field} value={draft.institute} onChange={set('institute')} placeholder="e.g. Bright Future Coaching" autoFocus />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-neutral-600">Owner name</span>
        <input className={field} value={draft.name} onChange={set('name')} placeholder="e.g. Rakesh Gupta" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-neutral-600">Login ID *</span>
        <input className={field} value={draft.loginId} onChange={set('loginId')} placeholder="e.g. brightfuture" autoCapitalize="none" autoCorrect="off" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-neutral-600">Password *</span>
        <div className="flex gap-2">
          <input className={`${field} font-mono`} value={draft.password} onChange={set('password')} required minLength={6} />
          <button type="button" onClick={() => setDraft((d) => ({ ...d, password: suggestPassword() }))} className="h-12 w-12 shrink-0 grid place-items-center rounded-xl ring-1 ring-neutral-200 text-neutral-600 hover:bg-neutral-50" aria-label="New random password" title="New random password">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </label>
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="h-12 px-5 rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-700 hover:bg-neutral-200">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 h-12 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold disabled:opacity-60">Create admin</button>
      </div>
    </form>
  );
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }); }}
      className="h-8 w-8 shrink-0 grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
      aria-label="Copy"
    >
      {done ? <Check className="w-4 h-4 text-[#17653a]" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function SuperAdmin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [created, setCreated] = useState(null);
  const [loadError, setLoadError] = useState('');

  const refresh = async () => {
    const { admins: next } = await callDb('admins.list');
    setAdmins(next);
  };

  useEffect(() => {
    let cancelled = false;
    callDb('admins.list')
      .then(({ admins: list }) => { if (!cancelled) setAdmins(list); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); });
    return () => { cancelled = true; };
  }, []);

  const active = admins.filter((a) => a.active).length;

  const run = async (fn) => {
    try {
      setLoadError('');
      await fn();
    } catch (err) {
      setLoadError(err.message);
    }
  };

  const resetPassword = (admin) => run(async () => {
    const next = suggestPassword();
    if (!confirm(`Give ${admin.loginId} a new password? The old one will stop working.`)) return;
    await callDb('admins.update', { id: admin.id, password: next });
    setCreated({ ...admin, password: next });
    await refresh();
  });

  const setActive = (admin) => run(async () => {
    await callDb('admins.update', { id: admin.id, active: !admin.active });
    await refresh();
  });

  const remove = (admin) => run(async () => {
    if (!confirm(`Delete the admin "${admin.loginId}"? They will not be able to sign in. Their institute data stays in the database.`)) return;
    await callDb('admins.delete', { id: admin.id });
    await refresh();
  });

  return (
    <div className="min-h-dvh bg-[#f4f4f5]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-neutral-200/70 pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-semibold text-neutral-900">
            <ShieldCheck className="w-5 h-5 text-[#005a9c]" /> Super admin
          </span>
          <button type="button" onClick={async () => { await signOut(); navigate('/login'); }} className="h-10 px-3 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 inline-flex items-center gap-1.5">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-5 sm:pt-8 pb-14">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Admins</h1>
          <button type="button" onClick={() => { setCreated(null); setFormOpen(true); }} className="h-11 px-4 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> New admin
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
          <div className="rounded-2xl bg-white p-3 sm:p-4 shadow-card">
            <p className="text-xs font-semibold text-neutral-500">Admins</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">{admins.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-3 sm:p-4 shadow-card">
            <p className="text-xs font-semibold text-neutral-500">Active</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">{active}</p>
          </div>
        </div>

        {loadError && <p className="mb-4 text-sm font-medium text-rose-600">{loadError}</p>}

        {created && (
          <div className="mb-4 rounded-2xl bg-[#e6f5ee] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-[#17653a]">Admin created. Share these details with {created.name || created.institute || 'the owner'}:</p>
              <button type="button" onClick={() => setCreated(null)} className="text-[#17653a]/70" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <p className="mt-2 text-sm text-neutral-800">Login ID: <span className="font-mono font-semibold">{created.loginId}</span></p>
            <p className="text-sm text-neutral-800">Password: <span className="font-mono font-semibold">{created.password}</span></p>
          </div>
        )}

        {admins.length === 0 ? (
          <section className="bg-white rounded-2xl p-10 text-center shadow-card">
            <ShieldCheck className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="mt-3 text-sm text-neutral-500">No admins yet. Create one for each institute.</p>
          </section>
        ) : (
          <ul className="space-y-2">
            {admins.map((admin) => (
              <li key={admin.id} className={`bg-white rounded-2xl shadow-card p-4 ${admin.active ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{admin.institute || admin.loginId}</p>
                    <p className="text-xs text-neutral-500 truncate">{[admin.name, admin.createdAt && `added ${admin.createdAt}`].filter(Boolean).join(' · ')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(admin)}
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold ${admin.active ? 'bg-[#e6f5ee] text-[#17653a]' : 'bg-neutral-100 text-neutral-600'}`}
                    title={admin.active ? 'Tap to turn off' : 'Tap to turn on'}
                  >
                    {admin.active ? 'Active' : 'Off'}
                  </button>
                </div>

                <dl className="mt-3 rounded-xl bg-neutral-50 px-3 py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <dt className="w-20 shrink-0 text-xs text-neutral-500">Login ID</dt>
                    <dd className="flex-1 min-w-0 truncate font-mono text-neutral-900">{admin.loginId}</dd>
                    <CopyButton text={admin.loginId} />
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="w-20 shrink-0 text-xs text-neutral-500">Password</dt>
                    <dd className="flex-1 min-w-0 truncate font-mono text-neutral-900">{admin.password || 'Saved in the database'}</dd>
                    <CopyButton text={admin.password || ''} />
                  </div>
                </dl>

                <div className="mt-2 flex justify-end gap-1">
                  <button type="button" onClick={() => resetPassword(admin)} className="h-9 px-3 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 inline-flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> New password
                  </button>
                  <button type="button" onClick={() => remove(admin)} className="h-9 px-3 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-900 hover:text-white inline-flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 sm:p-4" onClick={() => setFormOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="New admin" onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-base font-semibold text-neutral-900">New admin</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="h-10 w-10 -mr-2 grid place-items-center rounded-xl text-neutral-400 hover:bg-neutral-100" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 pb-5">
              <AdminForm
                onCancel={() => setFormOpen(false)}
                onDone={(admin) => { setFormOpen(false); setCreated(admin); refresh(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
