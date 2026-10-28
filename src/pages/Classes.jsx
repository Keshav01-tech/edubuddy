import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Trash2,
  Pencil,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom } from '../services/classroom';

const field = 'h-11 px-3 text-base bg-white rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400';

const SUGGESTED_CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUGGESTED_BATCHES = ['Batch A', 'Batch B', 'Morning', 'Evening'];

export default function Classes() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();

  const [newClassName, setNewClassName] = useState('');
  const [showAddClass, setShowAddClass] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editClassName, setEditClassName] = useState('');

  // Per-class batch draft inputs
  const [batchDraft, setBatchDraft] = useState({});
  // Expanded class student rosters
  const [expandedRoster, setExpandedRoster] = useState({});

  const totalBatches = room.classes.reduce((sum, item) => sum + (item.sections?.length || 0), 0);

  const handleCreateClass = (e) => {
    e?.preventDefault();
    const clean = newClassName.trim();
    if (!clean) return;
    room.addClass(clean);
    setNewClassName('');
    setShowAddClass(false);
  };

  const handleAddBatch = (classId, batchName) => {
    const clean = String(batchName || '').trim();
    if (!clean) return;
    room.addSection(classId, clean);
    setBatchDraft((prev) => ({ ...prev, [classId]: '' }));
  };

  const startEditClass = (item) => {
    setEditingClassId(item.id);
    setEditClassName(item.name);
  };

  const saveEditClass = (id) => {
    if (editClassName.trim()) {
      room.updateClass(id, editClassName.trim());
    }
    setEditingClassId(null);
    setEditClassName('');
  };

  const handleRemoveClass = (item) => {
    const count = room.students.filter((s) => s.className === item.name).length;
    const warning = count
      ? ` Warning: ${count} ${count === 1 ? 'student is' : 'students are'} enrolled in this class.`
      : '';
    if (confirm(`Are you sure you want to delete ${item.name}?${warning}`)) {
      room.removeClass(item.id);
    }
  };

  const handleRemoveBatch = (classId, className, batchName) => {
    const count = room.students.filter(
      (s) => s.className === className && (s.section || '') === batchName
    ).length;
    const warning = count
      ? ` ${count} ${count === 1 ? 'student has' : 'students have'} this batch assigned.`
      : '';
    if (confirm(`Remove batch "${batchName}" from ${className}?${warning}`)) {
      room.removeSection(classId, batchName);
    }
  };

  const toggleRoster = (classId) => {
    setExpandedRoster((prev) => ({ ...prev, [classId]: !prev[classId] }));
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-3xl"
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-12">
        {/* Page Title & Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              Classes & Batches
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {room.classes.length} {room.classes.length === 1 ? 'class' : 'classes'} · {totalBatches} {totalBatches === 1 ? 'batch' : 'batches'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddClass((v) => !v)}
            className="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create class
          </button>
        </div>

        {/* Collapsible Create Class Form */}
        {showAddClass && (
          <section className="mb-6 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-slate-900">Create new class</h2>
              <button
                type="button"
                onClick={() => setShowAddClass(false)}
                className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="flex gap-2">
              <input
                className={`${field} min-w-0 flex-1`}
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class name, e.g. Class 10 or Class 12 Science"
                aria-label="New class name"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newClassName.trim()}
                className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                Create
              </button>
            </form>

            {/* Quick suggested chips */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium mr-1 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
              </span>
              {SUGGESTED_CLASSES.filter(
                (c) => !room.classes.some((item) => item.name.toLowerCase() === c.toLowerCase())
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    room.addClass(preset);
                  }}
                  className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-xs font-medium transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {room.classes.length === 0 && !showAddClass && (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-8 sm:p-12 text-center shadow-card">
            <GraduationCap className="w-12 h-12 mx-auto text-slate-300" />
            <h2 className="mt-3 text-base font-semibold text-slate-900">No classes created yet</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Create your classes (e.g. Class 9, Class 10) and then add batches (Morning, Evening, Batch A, etc.) to organize students and attendance.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddClass(true)}
                className="h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create first class
              </button>
            </div>

            {/* Quick 1-click batch setup */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400 mb-2.5">Or quick add standard CBSE classes:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => room.addClass(item)}
                    className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-brand-100 hover:text-brand-700 text-xs font-medium text-slate-700 transition-colors"
                  >
                    + Add {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Classes List */}
        {room.classes.length > 0 && (
          <div className="space-y-4">
            {room.classes.map((item) => {
              const classStudents = room.students.filter((s) => s.className === item.name);
              const isEditing = editingClassId === item.id;
              const isRosterOpen = !!expandedRoster[item.id];
              const sections = item.sections || [];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5 transition-shadow hover:shadow-md"
                >
                  {/* Class Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="h-10 w-10 shrink-0 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">
                        <GraduationCap className="w-5 h-5" />
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            className={`${field} h-9 py-1 text-sm`}
                            value={editClassName}
                            onChange={(e) => setEditClassName(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveEditClass(item.id)}
                            className="h-9 px-3 rounded-xl bg-brand-600 text-white text-xs font-semibold"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingClassId(null)}
                            className="h-9 px-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-semibold text-slate-900 truncate">
                            {item.name}
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {classStudents.length} {classStudents.length === 1 ? 'student enrolled' : 'students enrolled'} · {sections.length} {sections.length === 1 ? 'batch' : 'batches'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Class Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditClass(item)}
                        className="h-9 w-9 grid place-items-center rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                        aria-label={`Rename ${item.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(item)}
                        className="h-9 w-9 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Batches / Sections Section */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> Batches in this class
                      </h3>
                      {classStudents.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleRoster(item.id)}
                          className="text-xs font-medium text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {isRosterOpen ? 'Hide students' : 'View enrolled students'}
                          {isRosterOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Existing Batches Chips */}
                    <div className="flex flex-wrap gap-2">
                      {sections.map((batch) => {
                        const batchCount = classStudents.filter(
                          (s) => (s.section || '') === batch
                        ).length;

                        return (
                          <div
                            key={batch}
                            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 transition-colors"
                          >
                            <span className="font-semibold text-slate-900">{batch}</span>
                            <span className="text-[11px] text-slate-500 bg-white/80 px-1.5 py-0.5 rounded-md font-mono">
                              {batchCount} {batchCount === 1 ? 'student' : 'students'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBatch(item.id, item.name, batch)}
                              className="h-4 w-4 grid place-items-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                              aria-label={`Remove batch ${batch}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}

                      {sections.length === 0 && (
                        <p className="text-xs text-slate-400 py-1">
                          No batches created yet. Add a batch below (e.g. Morning, Batch A).
                        </p>
                      )}
                    </div>

                    {/* Quick Add Batch Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddBatch(item.id, batchDraft[item.id]);
                      }}
                      className="mt-3 flex items-center gap-2"
                    >
                      <input
                        className={`${field} h-9 text-xs flex-1`}
                        placeholder="Batch name, e.g. Batch A, Morning, Evening"
                        value={batchDraft[item.id] || ''}
                        onChange={(e) =>
                          setBatchDraft((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                      />
                      <button
                        type="submit"
                        disabled={!(batchDraft[item.id] || '').trim()}
                        className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add batch
                      </button>
                    </form>

                    {/* Batch Suggestions */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Quick add:</span>
                      {SUGGESTED_BATCHES.filter((b) => !sections.includes(b)).map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddBatch(item.id, suggested)}
                          className="h-6 px-2 rounded-md bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-[11px] font-medium border border-slate-200/60 transition-colors"
                        >
                          + {suggested}
                        </button>
                      ))}
                    </div>

                    {/* Expanded Enrolled Students List */}
                    {isRosterOpen && (
                      <div className="mt-4 pt-3 border-t border-slate-100 animate-fade-up">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-700">
                            Enrolled students in {item.name}:
                          </p>
                          <Link
                            to="/students"
                            className="text-xs text-brand-700 hover:underline font-medium"
                          >
                            Manage in Students →
                          </Link>
                        </div>
                        <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-100 max-h-48 overflow-y-auto">
                          {classStudents.map((student) => (
                            <li
                              key={student.id}
                              className="px-3 py-2 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 font-bold grid place-items-center text-[10px]">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-medium text-slate-900">{student.name}</span>
                              </div>
                              <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-[11px]">
                                {student.section ? `Batch ${student.section}` : 'No batch'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
