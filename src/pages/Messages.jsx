import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Users, Check, X, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom } from '../services/classroom';
import { getToken } from '../services/cloud';
import { Picker } from '../components/ui';
import { inBatch, batchKey, describeTime, narrowBatches } from '../services/teachers';

// The server sends at most this many messages per request, so bigger lists go in rounds.
const PER_REQUEST = 40;
const MAX_TEXT = 1000;

const PRESETS = [
  { label: 'Holiday', text: 'The institute will remain closed tomorrow. Classes will resume as usual the day after.' },
  { label: 'Test reminder', text: 'There is a test in the next class. Please make sure your child revises the chapter and comes on time.' },
  { label: 'Parent meeting', text: 'You are invited to a parent-teacher meeting this Sunday at 11 AM at the institute.' },
  { label: 'Timing change', text: 'Class timing has changed from tomorrow. Please check the new time with the institute.' },
];
const FEE_PRESET = { label: 'Fee reminder', text: 'This is a gentle reminder that the fee for this month is due. Please pay at the front desk at the earliest.' };

const initialsOf = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function Messages() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();

  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [batchId, setBatchId] = useState('');
  const [skipped, setSkipped] = useState(() => new Set());
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const groups = room.classes.flatMap((item) => {
    const sects = item.sections?.length ? item.sections : [''];
    return sects.map((section) => {
      const timing = item.timings?.[section] || {};
      return { id: batchKey(item.name, section), className: item.name, section, subject: timing.subject || '', timing };
    });
  });
  const { subjects, inClass, inSubject, active } = narrowBatches(groups, classFilter, subjectFilter, batchId);
  const countIn = (list) => room.students.filter((s) => list.some((g) => inBatch(s, g.className, g.section))).length;

  // Everyone in the chosen batch, or in every batch the filters leave.
  const reach = active ? [active] : inSubject;
  const students = useMemo(() => room.students
    .filter((s) => (classFilter === 'all' && subjectFilter === 'all' && !active) || reach.some((g) => inBatch(s, g.className, g.section)))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [room.students, classFilter, subjectFilter, active?.id, inSubject.length]);

  const withPhone = students.filter((s) => s.hasPhone);
  const chosen = withPhone.filter((s) => !skipped.has(s.id));
  const noPhone = students.length - withPhone.length;

  const resetPick = () => { setSkipped(new Set()); setResult(null); };
  const pickClass = (value) => { setClassFilter(value); setSubjectFilter('all'); setBatchId(''); resetPick(); };
  const pickSubject = (value) => { setSubjectFilter(value); setBatchId(''); resetPick(); };
  const pickBatch = (value) => { setBatchId(value); resetPick(); };
  const toggle = (id) => setSkipped((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allOn = chosen.length === withPhone.length;
  const toggleAll = () => setSkipped(allOn ? new Set(withPhone.map((s) => s.id)) : new Set());

  const presets = room.isTeacher ? PRESETS : [...PRESETS, FEE_PRESET];
  const institute = room.institute?.name || room.school || '';
  const preview = `Dear parent of ${chosen[0]?.name || 'Aarav'},\n\n${text.trim() || 'Your message appears here.'}${institute ? `\n\n- ${institute}` : ''}`;

  const send = async () => {
    const body = text.trim();
    if (!body || !chosen.length || sending) return;
    if (!window.confirm(`Send this WhatsApp message to ${chosen.length} parent${chosen.length === 1 ? '' : 's'}?`)) return;
    setSending(true);
    setResult(null);
    const sent = [];
    const failed = [];
    let error = '';
    try {
      for (let i = 0; i < chosen.length; i += PER_REQUEST) {
        const part = chosen.slice(i, i + PER_REQUEST);
        const response = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ kind: 'message', text: body, institute, studentIds: part.map((s) => s.id) }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.configured === false) {
          error = data.configured === false ? 'WhatsApp is not set up yet. Ask the admin to add the Twilio keys.' : (data.error || 'Could not send.');
          break;
        }
        sent.push(...(data.sent || []));
        failed.push(...(data.failed || []));
      }
    } catch {
      error = 'WhatsApp is not available right now. Check your internet and try again.';
    }
    setResult({ sent, failed, error });
    setSending(false);
  };

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-28 lg:pb-12">
        <div className="mb-4 lg:mb-5">
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">WhatsApp parents</h1>
          <p className="mt-1 text-sm text-neutral-500">Messages go straight from the institute's WhatsApp number. You don't need to open WhatsApp.</p>
        </div>

        {room.students.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-card">
            <Users className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="mt-3 text-sm text-neutral-500">Add students first, with a parent phone number.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 bg-white rounded-3xl shadow-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">1 · Class</span>
                <Picker label="Filter by class" countLabel="students" value={classFilter} onChange={pickClass}
                  options={[
                    { value: 'all', label: 'All classes', count: room.students.length },
                    ...room.classes.map((item) => ({ value: item.name, label: item.name, count: room.students.filter((s) => s.className === item.name).length })),
                  ]} />
              </div>
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">2 · Subject</span>
                <Picker label="Filter by subject" countLabel="students" value={subjectFilter} onChange={pickSubject}
                  options={[
                    { value: 'all', label: 'All subjects', count: countIn(inClass) },
                    ...subjects.map((subject) => ({ value: subject, label: subject, count: countIn(inClass.filter((g) => g.subject === subject)) })),
                  ]} />
              </div>
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">3 · Batch</span>
                <Picker label="Choose batch" countLabel="students" value={active ? active.id : 'all'} onChange={(v) => pickBatch(v === 'all' ? '' : v)}
                  options={[
                    { value: 'all', label: 'All batches', count: countIn(inSubject) },
                    ...inSubject.map((g) => ({
                      value: g.id,
                      label: [classFilter === 'all' && g.className, g.section ? `Batch ${g.section}` : 'Whole class', subjectFilter === 'all' && g.subject, describeTime({ start: g.timing.start })].filter(Boolean).join(' · '),
                      count: countIn([g]),
                    })),
                  ]} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              {/* Who gets it */}
              <section className="bg-white rounded-3xl shadow-card overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100">
                  <div>
                    <h2 className="font-semibold text-neutral-900">Parents</h2>
                    <p className="text-xs text-neutral-500">
                      {chosen.length} of {withPhone.length} selected{noPhone ? ` · ${noPhone} without a number` : ''}
                    </p>
                  </div>
                  {withPhone.length > 0 && (
                    <button type="button" onClick={toggleAll} className="h-9 px-3 rounded-lg text-sm font-medium text-[#005a9c] hover:bg-[#eef6fc]">
                      {allOn ? 'Clear all' : 'Select all'}
                    </button>
                  )}
                </div>
                {students.length === 0 ? (
                  <p className="py-12 text-center text-sm text-neutral-500">No students here.</p>
                ) : (
                  <ul className="max-h-[26rem] overflow-y-auto divide-y divide-neutral-100">
                    {students.map((s) => {
                      const on = s.hasPhone && !skipped.has(s.id);
                      return (
                        <li key={s.id}>
                          <button type="button" disabled={!s.hasPhone} onClick={() => toggle(s.id)} aria-pressed={on}
                            className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-neutral-50 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                            <span className={`h-5 w-5 shrink-0 rounded-md grid place-items-center ${on ? 'bg-[#005a9c] text-white' : 'ring-1 ring-neutral-300'}`}>
                              {on && <Check className="w-3.5 h-3.5" />}
                            </span>
                            <span className="h-8 w-8 shrink-0 rounded-full grid place-items-center text-[11px] font-bold bg-[#eef6fc] text-[#005a9c]">{initialsOf(s.name)}</span>
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate text-sm font-medium ${s.hasPhone ? 'text-neutral-900' : 'text-neutral-400'}`}>{s.name}</span>
                              <span className="block truncate text-xs text-neutral-500">{s.hasPhone ? s.className : 'No parent number'}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* What they get */}
              <section className="bg-white rounded-3xl shadow-card p-5 space-y-4">
                <div>
                  <h2 className="font-semibold text-neutral-900">Message</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <button key={p.label} type="button" onClick={() => { setText(p.text); setResult(null); }}
                        className="h-8 px-3 rounded-full bg-neutral-100 text-xs font-medium text-neutral-700 hover:bg-neutral-200">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <textarea value={text} onChange={(e) => { setText(e.target.value.slice(0, MAX_TEXT)); setResult(null); }} rows={6}
                    placeholder="Type the message for parents…" aria-label="Message"
                    className="w-full rounded-xl p-3 text-sm bg-neutral-50 ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-y" />
                  <p className="mt-1 text-right text-xs text-neutral-400 tabular-nums">{text.length}/{MAX_TEXT}</p>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Preview</p>
                  <div className="rounded-2xl bg-[#e7f6e1] p-3">
                    <div className="ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-white px-3 py-2 text-sm text-neutral-800 whitespace-pre-wrap shadow-sm">
                      <MessageCircle className="inline w-3.5 h-3.5 mr-1 text-[#17784a] align-[-2px]" />{preview}
                    </div>
                  </div>
                </div>

                {result && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${result.error && !result.sent.length ? 'bg-rose-50 text-rose-800' : 'bg-neutral-900 text-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        {result.sent.length > 0 && <p>Sent to {result.sent.length} parent{result.sent.length === 1 ? '' : 's'}.</p>}
                        {result.error && <p>{result.error}</p>}
                        {result.failed.length > 0 && (
                          <details>
                            <summary className="cursor-pointer">{result.failed.length} could not be sent</summary>
                            <ul className="mt-1 space-y-1 text-xs opacity-90">
                              {result.failed.map((f, i) => <li key={i}><strong>{f.name}:</strong> {f.error}</li>)}
                            </ul>
                          </details>
                        )}
                      </div>
                      <button type="button" onClick={() => setResult(null)} aria-label="Close" className="shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                <button type="button" onClick={send} disabled={sending || !text.trim() || !chosen.length}
                  className="w-full h-12 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40">
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending…' : chosen.length ? `Send to ${chosen.length} parent${chosen.length === 1 ? '' : 's'}` : 'Select parents'}
                </button>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
