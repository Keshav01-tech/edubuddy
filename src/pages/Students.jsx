import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Users,
  Search,
  Upload,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Phone,
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, formatMoney, formatDate } from '../services/classroom';
import { studentsFromPdf } from '../services/studentPdf';

const field = 'w-full h-11 px-3 text-base bg-white rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400';

export function StudentForm({ initial, onSave, onCancel, classes = [] }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    className: initial?.className || classes[0]?.name || '',
    section: initial?.section || '',
    phone: initial?.phone || '',
    fee: initial?.fee ?? '',
    feeDate: initial?.feeDate || '',
  });

  const chosen = classes.find((item) => item.name === form.className);
  const sections = chosen?.sections || [];
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      className: form.className.trim(),
      section: form.section.trim(),
      phone: form.phone.trim(),
      fee: Number(form.fee) || 0,
      feeDate: form.feeDate,
    });
    if (!initial) {
      setForm({ name: '', className: form.className, section: '', phone: '', fee: form.fee, feeDate: '' });
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold text-slate-700">Student name *</span>
        <input
          className={field}
          placeholder="Kartik Sharma"
          value={form.name}
          onChange={set('name')}
          aria-label="Student name"
          required
          autoFocus={!!initial}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Class</span>
        {classes.length > 0 ? (
          <select
            className={field}
            value={form.className}
            aria-label="Class"
            onChange={(event) => {
              const name = event.target.value;
              const next = classes.find((item) => item.name === name);
              setForm((current) => ({ ...current, className: name, section: next?.sections?.[0] || '' }));
            }}
          >
            {!classes.some((item) => item.name === form.className) && form.className && (
              <option value={form.className}>{form.className}</option>
            )}
            {classes.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
        ) : (
          <input
            className={field}
            placeholder="e.g. Class 10"
            value={form.className}
            onChange={set('className')}
            aria-label="Class"
          />
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Batch</span>
        {sections.length > 0 ? (
          <select className={field} value={form.section} aria-label="Batch" onChange={set('section')}>
            <option value="">Select a batch</option>
            {form.section && !sections.includes(form.section) && (
              <option value={form.section}>{form.section}</option>
            )}
            {sections.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        ) : (
          <input
            className={field}
            placeholder="e.g. Batch A, Morning"
            value={form.section}
            onChange={set('section')}
            aria-label="Batch"
          />
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Parent WhatsApp</span>
        <input
          className={field}
          placeholder="10-digit mobile number"
          value={form.phone}
          onChange={set('phone')}
          aria-label="Parent WhatsApp"
          inputMode="tel"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Total fee (₹)</span>
        <input
          className={field}
          placeholder="12000"
          value={form.fee}
          onChange={set('fee')}
          aria-label="Total fee"
          inputMode="numeric"
        />
      </label>

      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-600">Fee due date</span>
        <input
          type="date"
          className={field}
          value={form.feeDate}
          onChange={set('feeDate')}
          aria-label="Fee due date"
        />
      </label>

      <div className="sm:col-span-2 flex gap-2 justify-end pt-2 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
        >
          {initial ? 'Save changes' : (<><UserPlus className="w-4 h-4" /> Add student</>)}
        </button>
      </div>
    </form>
  );
}

export function PdfImport({ onAdd, onClose }) {
  const inputRef = useRef(null);
  const [found, setFound] = useState(null);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const read = async (file) => {
    if (!file) return;
    setBusy(true);
    setMessage('');
    setFound(null);
    try {
      const students = await studentsFromPdf(file);
      if (!students.length) {
        setMessage('No students found. The PDF needs a table with Name and Class columns, or lines like "Aarav Sharma, Class 10A".');
        return;
      }
      setFound(students);
      setPicked(students.map((_, index) => index));
    } catch {
      setMessage('Could not read that PDF. Try another file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const toggle = (index) =>
    setPicked((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );

  return (
    <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Import students from a PDF</h2>
          <p className="mt-0.5 text-sm text-slate-500">Upload a class roster. Names, classes and fees are parsed automatically.</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close PDF import"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Upload student list PDF"
        onChange={(event) => read(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mt-3 w-full h-12 rounded-xl border-2 border-dashed border-brand-200 text-sm font-medium text-brand-700 hover:bg-brand-50 inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? 'Reading PDF…' : 'Upload PDF roster'}
      </button>
      {message && <p className="mt-3 text-sm text-rose-600" role="alert">{message}</p>}

      {found && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-700 inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" /> {found.length} found · {picked.length} selected
            </p>
            <button
              type="button"
              onClick={() => setPicked(picked.length === found.length ? [] : found.map((_, index) => index))}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {picked.length === found.length ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto rounded-xl ring-1 ring-slate-200 divide-y divide-slate-100">
            {found.map((student, index) => (
              <li key={`${student.name}-${index}`}>
                <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={picked.includes(index)}
                    onChange={() => toggle(index)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900 truncate">{student.name}</span>
                    <span className="block text-xs text-slate-500 truncate">
                      {[student.className && `Class ${student.className}`, student.section && `Batch ${student.section}`, student.fee ? formatMoney(student.fee) : ''].filter(Boolean).join(' · ') || 'Class not found'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setFound(null)}
              className="h-10 px-4 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!picked.length}
              onClick={() => {
                onAdd(picked.map((index) => found[index]));
                setFound(null);
                if (onClose) onClose();
              }}
              className="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Add {picked.length} {picked.length === 1 ? 'student' : 'students'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Students() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();

  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPdfImport, setShowPdfImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const term = query.trim().toLowerCase();

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedClass]);

  // Class & Section/Batch groups
  const groups = room.classes.flatMap((item) => (
    (item.sections?.length ? item.sections : ['']).map((section) => ({
      id: `${item.name}||${section}`,
      className: item.name,
      section,
      label: section ? `${item.name}-${section}` : item.name,
    }))
  ));

  const filteredStudents = room.students.filter((student) => {
    if (selectedClass !== 'all') {
      const activeGroup = groups.find((g) => g.id === selectedClass);
      if (activeGroup) {
        if (student.className !== activeGroup.className) return false;
        if ((student.section || '') !== (activeGroup.section || '')) return false;
      }
    }
    if (!term) return true;
    return [student.name, student.className, student.section, student.phone]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  // Pagination slicing
  const totalFiltered = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const rateOf = (id) => {
    let total = 0;
    let here = 0;
    for (const day of Object.values(room.attendance)) {
      if (day[id]) {
        total += 1;
        if (day[id] === 'P') here += 1;
      }
    }
    const pct = total ? Math.round((here / total) * 100) : null;
    return { pct, total, here };
  };

  const remove = (student) => {
    if (confirm(`Delete ${student.name}? Their attendance and fee records will be removed too.`)) {
      room.deleteStudent(student.id);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-5xl"
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-12">
        {/* Title & Top Actions */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Students</h1>
            <p className="mt-1 text-sm text-slate-500">
              {room.students.length} {room.students.length === 1 ? 'student enrolled' : 'students enrolled'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowPdfImport((v) => !v); setShowAddForm(false); }}
              className={`h-9 px-3.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                showPdfImport
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4 text-slate-500" />
              Import PDF
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm((v) => !v); setShowPdfImport(false); }}
              className="h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add student
            </button>
          </div>
        </div>

        {/* Collapsible Add Student Form */}
        {showAddForm && (
          <section className="mb-5 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Add a new student</h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <StudentForm
              onSave={(student) => {
                room.addStudent(student);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
              classes={room.classes}
            />
          </section>
        )}

        {/* Collapsible PDF Importer */}
        {showPdfImport && (
          <div className="mb-5 animate-fade-up">
            <PdfImport
              onAdd={(students) => students.forEach((student) => room.addStudent({ phone: '', ...student }))}
              onClose={() => setShowPdfImport(false)}
            />
          </div>
        )}

        {/* Empty State */}
        {room.students.length === 0 && !showAddForm && !showPdfImport && (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-10 text-center shadow-card">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <h2 className="mt-3 text-base font-semibold text-slate-900">No students yet</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Add your students to manage attendance, track fee payments, and generate targeted tests.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-sm inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Add first student
              </button>
              <button
                type="button"
                onClick={() => setShowPdfImport(true)}
                className="h-10 px-4 rounded-xl bg-white ring-1 ring-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Upload PDF
              </button>
            </div>
          </div>
        )}

        {/* Students Table Section */}
        {room.students.length > 0 && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, class, batch or phone…"
                  aria-label="Search students"
                  className={`${field} pl-9`}
                />
              </div>

              {groups.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="radiogroup" aria-label="Filter by class">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedClass === 'all'}
                    onClick={() => setSelectedClass('all')}
                    className={`h-8 shrink-0 px-3 rounded-full text-xs font-medium transition-colors ${
                      selectedClass === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All classes ({room.students.length})
                  </button>
                  {groups.map((item) => {
                    const count = room.students.filter(
                      (s) => s.className === item.className && (s.section || '') === (item.section || '')
                    ).length;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={selectedClass === item.id}
                        onClick={() => setSelectedClass(item.id)}
                        className={`h-8 shrink-0 px-3 rounded-full text-xs font-medium transition-colors ${
                          selectedClass === item.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Class</th>
                      <th className="py-3 px-3">Batch</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Total Fee</th>
                      <th className="py-3 px-3">Attendance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                          No students match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student) => {
                        const initial = student.name.trim().charAt(0).toUpperCase() || '?';
                        const att = rateOf(student.id);

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Student Name & Avatar */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className="h-9 w-9 shrink-0 rounded-full bg-brand-100 text-brand-700 font-bold grid place-items-center text-xs">
                                  {initial}
                                </span>
                                <span className="font-semibold text-slate-900">
                                  {student.name}
                                </span>
                              </div>
                            </td>

                            {/* Class */}
                            <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                              {student.className || <span className="text-slate-400 italic">None</span>}
                            </td>

                            {/* Batch */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {student.section ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                                  {student.section}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">No batch</span>
                              )}
                            </td>

                            {/* Contact & WhatsApp */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {student.phone ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono text-slate-700">{student.phone}</span>
                                  <a
                                    href={`https://wa.me/91${student.phone.replace(/[^\d]/g, '').slice(-10)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-7 px-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                                    title={`WhatsApp parent of ${student.name}`}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    WhatsApp
                                  </a>
                                  <a
                                    href={`tel:${student.phone}`}
                                    className="h-7 w-7 grid place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                    title={`Call parent of ${student.name}`}
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs italic">No number</span>
                              )}
                            </td>

                            {/* Total Fee & Due Date */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {student.fee ? (
                                <div>
                                  <span className="font-semibold text-slate-900">
                                    {formatMoney(student.fee)}
                                  </span>
                                  {student.feeDate && (
                                    <span className="block text-[11px] text-slate-400">
                                      Due {formatDate(student.feeDate)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">Not set</span>
                              )}
                            </td>

                            {/* Attendance Rate */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {att.pct !== null ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                      att.pct >= 75
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : att.pct >= 50
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}
                                  >
                                    {att.pct}%
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    ({att.here}/{att.total}d)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs italic">No record</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingStudent(student)}
                                  className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                                  title={`Edit ${student.name}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => remove(student)}
                                  className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title={`Delete ${student.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalFiltered > 0 && (
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-8 px-2 rounded-lg ring-1 ring-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-slate-400">|</span>
                    <span>
                      Showing <strong className="text-slate-900">{startIndex + 1}</strong> to{' '}
                      <strong className="text-slate-900">{endIndex}</strong> of{' '}
                      <strong className="text-slate-900">{totalFiltered}</strong> students
                    </span>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-2.5 rounded-lg ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 font-medium transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        // Show first, last, and current +- 1 pages if totalPages is large
                        if (
                          totalPages > 6 &&
                          pageNum !== 1 &&
                          pageNum !== totalPages &&
                          Math.abs(pageNum - safePage) > 1
                        ) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return <span key={pageNum} className="text-slate-400 px-0.5">…</span>;
                          }
                          return null;
                        }

                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                              safePage === pageNum
                                ? 'bg-slate-900 text-white'
                                : 'bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 px-2.5 rounded-lg ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 font-medium transition-colors"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-up">
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Edit Student Details</h3>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <StudentForm
                initial={editingStudent}
                classes={room.classes}
                onSave={(patch) => {
                  room.updateStudent(editingStudent.id, patch);
                  setEditingStudent(null);
                }}
                onCancel={() => setEditingStudent(null)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
