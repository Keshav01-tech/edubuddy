import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Plus, Trash2, Pencil, Users, Layers, ChevronDown, ChevronUp, X, Check, Sparkles, AlertCircle, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { StatCard, Initials } from '../components/ui';
import { useClassroom } from '../services/classroom';

const field = 'h-11 px-4 text-sm bg-white rounded-2xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#c4c4c4] placeholder:text-neutral-400';

const SUGGESTED_CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUGGESTED_BATCHES = ['Batch A', 'Batch B', 'Morning', 'Evening'];

// Each class card gets its own pastel header, in the same palette as the dashboard.
const TINTS = ['#60c1e5', '#d6d6d6', '#c4c4c4', '#ededed'];
const SEGMENT = ['bg-neutral-900/80', 'bg-neutral-900/55', 'bg-neutral-900/35', 'bg-neutral-900/20'];

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export default function Classes() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const createRef = useRef(null);

  const [newClassName, setNewClassName] = useState('');
  const [editingClassId, setEditingClassId] = useState(null);
  const [editClassName, setEditClassName] = useState('');
  const [batchDraft, setBatchDraft] = useState({});
  const [expandedRoster, setExpandedRoster] = useState({});

  const totalBatches = room.classes.reduce((sum, item) => sum + (item.sections?.length || 0), 0);
  const sectionsOf = (name) => room.classes.find((c) => c.name === name)?.sections || [];
  const unplaced = room.students.filter((s) => {
    if (!s.className || !room.classes.some((c) => c.name === s.className)) return true;
    return sectionsOf(s.className).length > 0 && !s.section;
  });

  const focusCreate = () => {
    createRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    createRef.current?.focus();
  };

  const handleCreateClass = (e) => {
    e?.preventDefault();
    const clean = newClassName.trim();
    if (!clean) return;
    room.addClass(clean);
    setNewClassName('');
  };

  const handleAddBatch = (classId, batchName) => {
    const clean = String(batchName || '').trim();
    if (!clean) return;
    room.addSection(classId, clean);
    setBatchDraft((prev) => ({ ...prev, [classId]: '' }));
  };

  const startEditClass = (item) => { setEditingClassId(item.id); setEditClassName(item.name); };
  const saveEditClass = (id) => {
    if (editClassName.trim()) room.updateClass(id, editClassName.trim());
    setEditingClassId(null);
    setEditClassName('');
  };

  const handleRemoveClass = (item) => {
    const count = room.students.filter((s) => s.className === item.name).length;
    const warning = count ? ` Warning: ${count} ${count === 1 ? 'student is' : 'students are'} enrolled in this class.` : '';
    if (confirm(`Are you sure you want to delete ${item.name}?${warning}`)) room.removeClass(item.id);
  };

  const handleRemoveBatch = (classId, className, batchName) => {
    const count = room.students.filter((s) => s.className === className && (s.section || '') === batchName).length;
    const warning = count ? ` ${count} ${count === 1 ? 'student has' : 'students have'} this batch assigned.` : '';
    if (confirm(`Remove batch "${batchName}" from ${className}?${warning}`)) room.removeSection(classId, batchName);
  };

  const toggleRoster = (classId) => setExpandedRoster((prev) => ({ ...prev, [classId]: !prev[classId] }));

  const freeSuggestions = SUGGESTED_CLASSES.filter((c) => !room.classes.some((item) => item.name.toLowerCase() === c.toLowerCase()));

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-neutral-600">
            Create classes, then add batches.
          </p>
          <button
            type="button"
            onClick={focusCreate}
            className="h-11 px-5 rounded-2xl bg-[#005a9c] text-white text-sm font-medium inline-flex items-center gap-2 hover:brightness-95 transition"
          >
            <Plus className="w-4 h-4" /> Create class
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          {/* ───────── left: summary + classes ───────── */}
          <div className="min-w-0 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Classes" value={room.classes.length} icon={GraduationCap} tone="rose" hint={room.classes.length ? 'Active' : 'Create your first class'} />
              <StatCard label="Batches" value={totalBatches} icon={Layers} tone="amber" hint={totalBatches ? `${(totalBatches / Math.max(room.classes.length, 1)).toFixed(1)} per class` : 'No batches yet'} />
              <StatCard
                label="Students enrolled" value={room.students.length} icon={Users} tone="emerald"
                hint={unplaced.length ? `${unplaced.length} not placed yet` : room.students.length ? 'Everyone is placed' : 'No students yet'}
                hintTone={unplaced.length ? 'rose' : undefined}
                to="/students"
              />
            </div>

            {room.classes.length === 0 && (
              <section className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-card">
                <span className="mx-auto h-16 w-16 rounded-full grid place-items-center bg-[#f1f1f1] text-[#005a9c]">
                  <GraduationCap className="w-7 h-7" />
                </span>
                <h2 className="mt-4 text-lg font-medium text-neutral-900">No classes created yet</h2>
                <p className="mt-1.5 text-sm text-neutral-500 max-w-md mx-auto">
                  Add a class, then its batches.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map((name) => (
                    <button key={name} type="button" onClick={() => room.addClass(name)}
                      className="h-10 px-4 rounded-full bg-[#f8f8f8] hover:bg-[#f1f1f1] text-sm font-medium text-[#005a9c] transition-colors">
                      + {name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {room.classes.length > 0 && (
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5 items-start">
                {room.classes.map((item, idx) => {
                  const classStudents = room.students.filter((s) => s.className === item.name);
                  const isEditing = editingClassId === item.id;
                  const isRosterOpen = !!expandedRoster[item.id];
                  const sections = item.sections || [];
                  const counts = sections.map((b) => classStudents.filter((s) => (s.section || '') === b).length);
                  const unassigned = classStudents.length - counts.reduce((a, b) => a + b, 0);
                  const tint = TINTS[idx % TINTS.length];

                  return (
                    <article key={item.id} className="bg-white rounded-3xl shadow-card overflow-hidden transition-shadow hover:shadow-lift">
                      {/* tinted header */}
                      <div className="p-5" style={{ background: tint }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="h-11 w-11 shrink-0 rounded-full bg-white grid place-items-center text-neutral-900">
                              <GraduationCap className="w-5 h-5" />
                            </span>
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1 max-w-xs">
                                <input className={`${field} h-10 flex-1 min-w-0`} value={editClassName} onChange={(e) => setEditClassName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveEditClass(item.id); if (e.key === 'Escape') setEditingClassId(null); }} autoFocus />
                                <button type="button" onClick={() => saveEditClass(item.id)} aria-label="Save name" className="h-10 w-10 shrink-0 rounded-full bg-white grid place-items-center text-neutral-900 hover:shadow-md"><Check className="w-4 h-4" /></button>
                                <button type="button" onClick={() => setEditingClassId(null)} aria-label="Cancel" className="h-10 w-10 shrink-0 rounded-full bg-white/60 grid place-items-center text-neutral-700 hover:bg-white"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <div className="min-w-0">
                                <h2 className="text-lg font-medium text-neutral-900 truncate">{item.name}</h2>
                                <p className="text-xs text-neutral-700">{plural(sections.length, 'batch', 'batches')}</p>
                              </div>
                            )}
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button type="button" onClick={() => startEditClass(item)} aria-label={`Rename ${item.name}`} className="h-9 w-9 rounded-full bg-white/70 hover:bg-white grid place-items-center text-neutral-800 transition-colors"><Pencil className="w-4 h-4" /></button>
                              <button type="button" onClick={() => handleRemoveClass(item)} aria-label={`Delete ${item.name}`} className="h-9 w-9 rounded-full bg-white/70 hover:bg-white grid place-items-center text-neutral-800 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[2rem] leading-none font-medium tracking-tight text-neutral-900 tabular-nums">{classStudents.length}</p>
                            <p className="mt-1 text-xs text-neutral-700">{classStudents.length === 1 ? 'student enrolled' : 'students enrolled'}</p>
                          </div>
                          {classStudents.length > 0 && (
                            <div className="flex items-center -space-x-2">
                              {classStudents.slice(0, 4).map((s) => <Initials key={s.id} name={s.name} className="h-8 w-8 text-[11px] ring-2 ring-white" />)}
                              {classStudents.length > 4 && <span className="h-8 w-8 rounded-full bg-white grid place-items-center text-[11px] font-semibold text-neutral-700 ring-2 ring-white">+{classStudents.length - 4}</span>}
                            </div>
                          )}
                        </div>

                        {/* distribution across batches */}
                        <div className="mt-4 h-2 rounded-full bg-white/50 overflow-hidden flex" aria-hidden="true">
                          {counts.map((c, i) => c > 0 && (
                            <div key={sections[i]} className={SEGMENT[i % SEGMENT.length]} style={{ width: `${(c / classStudents.length) * 100}%` }} title={`${sections[i]}: ${c}`} />
                          ))}
                        </div>
                      </div>

                      {/* body */}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" /> Batches
                          </h3>
                          {unassigned > 0 && sections.length > 0 && (
                            <span className="text-[11px] font-medium text-neutral-800 bg-[#f4f4f4] rounded-full px-2.5 py-0.5">{unassigned} without batch</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {sections.map((batch, i) => (
                            <div key={batch} className="inline-flex items-center gap-2 bg-[#f7f7f7] rounded-full pl-3 pr-1.5 py-1.5 text-sm text-neutral-900">
                              <span className={`h-2 w-2 rounded-full ${SEGMENT[i % SEGMENT.length]}`} />
                              <span className="font-medium">{batch}</span>
                              <span className="text-xs text-neutral-500 bg-white rounded-full px-2 py-0.5 tabular-nums">{counts[i]}</span>
                              <button type="button" onClick={() => handleRemoveBatch(item.id, item.name, batch)} aria-label={`Remove batch ${batch}`}
                                className="h-5 w-5 grid place-items-center rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-white transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {sections.length === 0 && <p className="text-sm text-neutral-500 py-1">No batches yet.</p>}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddBatch(item.id, batchDraft[item.id]); }} className="mt-4 flex items-center gap-2">
                          <input className={`${field} h-10 flex-1 min-w-0`} placeholder="New batch name" value={batchDraft[item.id] || ''}
                            onChange={(e) => setBatchDraft((prev) => ({ ...prev, [item.id]: e.target.value }))} aria-label={`New batch for ${item.name}`} />
                          <button type="submit" disabled={!(batchDraft[item.id] || '').trim()}
                            className="h-10 px-4 rounded-2xl bg-[#ededed] hover:brightness-95 text-neutral-900 text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-40 transition">
                            <Plus className="w-4 h-4" /> Add
                          </button>
                        </form>

                        {SUGGESTED_BATCHES.some((b) => !sections.includes(b)) && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-neutral-400 mr-0.5">Quick add</span>
                            {SUGGESTED_BATCHES.filter((b) => !sections.includes(b)).map((suggested) => (
                              <button key={suggested} type="button" onClick={() => handleAddBatch(item.id, suggested)}
                                className="h-7 px-3 rounded-full bg-white ring-1 ring-neutral-200 hover:bg-[#f8f8f8] hover:ring-[#dedede] text-neutral-700 text-xs font-medium transition-colors">
                                + {suggested}
                              </button>
                            ))}
                          </div>
                        )}

                        {classStudents.length > 0 && (
                          <>
                            <button type="button" onClick={() => toggleRoster(item.id)} aria-expanded={isRosterOpen}
                              className="mt-5 w-full h-10 rounded-2xl bg-[#f7f7f7] hover:bg-[#efefef] text-sm font-medium text-neutral-800 inline-flex items-center justify-center gap-2 transition-colors">
                              <Users className="w-4 h-4" />
                              {isRosterOpen ? 'Hide students' : `View ${plural(classStudents.length, 'student', 'students')}`}
                              {isRosterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {isRosterOpen && (
                              <div className="mt-3 animate-fade-up">
                                <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 max-h-60 overflow-y-auto">
                                  {classStudents.map((student) => (
                                    <li key={student.id} className="px-3 py-2.5 flex items-center justify-between gap-3 text-sm">
                                      <span className="flex items-center gap-2.5 min-w-0">
                                        <Initials name={student.name} className="h-8 w-8 text-[11px]" />
                                        <span className="font-medium text-neutral-900 truncate">{student.name}</span>
                                      </span>
                                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${student.section ? 'bg-[#f1f1f1] text-[#005a9c]' : 'bg-neutral-100 text-neutral-500'}`}>
                                        {student.section || 'No batch'}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                                <Link to="/students" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#005a9c] hover:underline">
                                  Manage in Students <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* ───────── right rail ───────── */}
          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="bg-white rounded-3xl shadow-card p-5">
              <h2 className="text-base font-medium text-neutral-800">Add a class</h2>
                            <form onSubmit={handleCreateClass} className="mt-4 space-y-3">
                <input ref={createRef} className={`${field} w-full`} value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Class 10 or Class 12 Science" aria-label="New class name" />
                <button type="submit" disabled={!newClassName.trim()}
                  className="w-full h-11 rounded-2xl bg-[#005a9c] text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:brightness-95 disabled:opacity-40 transition">
                  <Plus className="w-4 h-4" /> Create class
                </button>
              </form>

              {freeSuggestions.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium text-neutral-500 inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> One-tap suggestions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {freeSuggestions.map((preset) => (
                      <button key={preset} type="button" onClick={() => room.addClass(preset)}
                        className="h-8 px-3 rounded-full bg-[#f8f8f8] hover:bg-[#f1f1f1] text-[#005a9c] text-xs font-medium transition-colors">
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {room.students.length > 0 && (
              unplaced.length > 0 ? (
                <Link to="/students" className="block rounded-3xl bg-[#d6d6d6] p-5 hover:brightness-95 transition">
                  <span className="h-9 w-9 rounded-full bg-white grid place-items-center text-neutral-900"><AlertCircle className="w-[18px] h-[18px]" /></span>
                  <p className="mt-3 text-base font-medium text-neutral-900">{plural(unplaced.length, 'student needs', 'students need')} a class or batch</p>
                  <p className="mt-1 text-sm text-neutral-800/80">Needed for attendance and fees.</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900">Assign in Students <ArrowRight className="w-4 h-4" /></span>
                </Link>
              ) : (
                <div className="rounded-3xl bg-[#dff3e7] p-5">
                  <span className="h-9 w-9 rounded-full bg-white grid place-items-center text-[#005a9c]"><CheckCircle2 className="w-[18px] h-[18px]" /></span>
                  <p className="mt-3 text-base font-medium text-neutral-900">All students are placed</p>
                  <p className="mt-1 text-sm text-neutral-700">Every student has a class.</p>
                </div>
              )
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
