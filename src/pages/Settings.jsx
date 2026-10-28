import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { SetupModal } from '../components/SetupModal';
import { useClassroom } from '../services/classroom';

const field = 'h-11 px-3 text-base bg-white rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400';

export default function SettingsPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const [className, setClassName] = useState('');
  const [sectionDraft, setSectionDraft] = useState({});
  const [aiOpen, setAiOpen] = useState(false);

  const addClass = (event) => {
    event.preventDefault();
    room.addClass(className);
    setClassName('');
  };

  const addSection = (event, classId) => {
    event.preventDefault();
    room.addSection(classId, sectionDraft[classId] || '');
    setSectionDraft((current) => ({ ...current, [classId]: '' }));
  };

  const removeClass = (item) => {
    const count = room.students.filter((student) => student.className === item.name).length;
    const note = count ? ` ${count} ${count === 1 ? 'student stays' : 'students stay'} on the list, but this class will disappear from attendance.` : '';
    if (confirm(`Remove Class ${item.name}?${note}`)) room.removeClass(item.id);
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-3xl"
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-12">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Add a class, then its sections. Attendance uses these to show one list at a time.</p>

        <section className="mt-5 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Classes and sections</h2>
          <form onSubmit={addClass} className="mt-3 flex gap-2">
            <input
              className={`${field} min-w-0 flex-1`}
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Class name, e.g. 10"
              aria-label="Class name"
            />
            <button type="submit" className="h-11 px-4 shrink-0 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add class
            </button>
          </form>

          {room.classes.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">No classes yet. Add Class 10, then sections A and B.</p>
          )}

          <ul className="mt-4 space-y-3">
            {room.classes.map((item) => {
              const count = room.students.filter((student) => student.className === item.name).length;
              return (
                <li key={item.id} className="rounded-xl ring-1 ring-slate-200 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 font-semibold text-slate-900">Class {item.name}</p>
                    <span className="text-xs text-slate-400">{count} {count === 1 ? 'student' : 'students'}</span>
                    <button type="button" onClick={() => removeClass(item)} className="h-9 w-9 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" aria-label={`Remove class ${item.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(item.sections || []).map((section) => (
                      <span key={section} className="h-8 pl-3 pr-1 inline-flex items-center gap-1 rounded-full bg-brand-50 text-sm font-medium text-brand-800">
                        Section {section}
                        <button
                          type="button"
                          onClick={() => room.removeSection(item.id, section)}
                          className="h-6 w-6 grid place-items-center rounded-full text-brand-700 hover:bg-brand-100"
                          aria-label={`Remove section ${section}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(item.sections || []).length === 0 && <span className="text-sm text-slate-400">No sections yet</span>}
                  </div>
                  <form onSubmit={(event) => addSection(event, item.id)} className="mt-3 flex gap-2">
                    <input
                      className={`${field} min-w-0 flex-1`}
                      value={sectionDraft[item.id] || ''}
                      onChange={(event) => setSectionDraft((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Section, e.g. A"
                      aria-label={`Section for class ${item.name}`}
                    />
                    <button type="submit" className="h-11 px-3 shrink-0 rounded-xl ring-1 ring-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Add section
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-4 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-slate-900">Question papers</h2>
            <p className="mt-0.5 text-sm text-slate-500">The key used to write tests.</p>
          </div>
          <button type="button" onClick={() => setAiOpen(true)} className="h-10 px-3 shrink-0 rounded-xl ring-1 ring-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" /> AI key
          </button>
        </section>
      </main>

      <SetupModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
