import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Search, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { AppHeader } from '../components/AppHeader';
import { SetupModal } from '../components/SetupModal';
import { Spinner } from '../components/Spinner';
import { sessionKind } from '../data/paperBlueprint';

function paperTitle(sess) {
  const list = Array.isArray(sess.chapters) ? sess.chapters.filter(Boolean) : [];
  if (list.length > 1 && /^\d+ chapters$/.test(sess.chapter_name || '')) {
    return `${list[0]} + ${list.length - 1} more`;
  }
  return sess.chapter_name || 'Untitled paper';
}

function paperDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Papers() {
  const { signOut } = useAuth();
  const { sessions, loadingSessions, deleteSession } = useStudy();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const term = query.trim().toLowerCase();
  const shown = sessions.filter((sess) => {
    if (!term) return true;
    const text = [paperTitle(sess), ...(sess.chapters || []), sess.class_name, sess.subject_name].join(' ').toLowerCase();
    return text.includes(term);
  });

  const handleDelete = async (sess) => {
    if (!confirm(`Delete “${paperTitle(sess)}”?`)) return;
    setError('');
    try {
      await deleteSession(sess.id);
    } catch {
      setError('Could not delete that test.');
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-3xl"
        leading={(
          <Link
            to="/tests"
            className="h-10 w-10 -ml-2 grid place-items-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Back to new test"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
          </Link>
        )}
        onSettings={() => setSettingsOpen(true)}
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My tests</h1>
            <p className="mt-1 text-[15px] text-slate-600">
              {sessions.length ? `${sessions.length} saved ${sessions.length === 1 ? 'test' : 'tests'}` : 'Tests you create are saved here.'}
            </p>
          </div>
          <Link
            to="/tests"
            className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            New paper
          </Link>
        </div>

        {sessions.length > 3 && (
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by chapter, class or subject"
              aria-label="Search tests"
              className="w-full h-11 pl-9 pr-3 text-[15px] bg-white border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-400"
            />
          </div>
        )}

        {error && <p className="mb-3 text-sm text-rose-700" role="alert">{error}</p>}

        {loadingSessions && sessions.length === 0 && (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        )}

        {!loadingSessions && sessions.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl px-6 py-12 text-center">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 text-[15px] font-medium text-slate-900">No tests yet</p>
            <p className="mt-1 text-sm text-slate-500">Your first test will appear here.</p>
            <Link to="/tests" className="mt-4 inline-flex h-10 px-4 items-center rounded-lg bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800">
              Make a test
            </Link>
          </div>
        )}

        {sessions.length > 0 && (
          <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {shown.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">No tests match “{query}”.</li>
            )}
            {shown.map((sess) => {
              const title = paperTitle(sess);
              const date = paperDate(sess.created_at);
              return (
                <li key={sess.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => navigate(`/test?id=${sess.id}`)}
                    className="group min-w-0 flex-1 flex items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50 rounded-l-xl"
                  >
                    <FileText className="mt-0.5 w-5 h-5 shrink-0 text-slate-400 group-hover:text-brand-700" />
                    <span className="min-w-0 flex-1">
                      <span className="text-[15px] font-medium leading-6 text-slate-900 line-clamp-2 break-words group-hover:text-brand-800" title={title}>
                        {title}
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-slate-500">
                        <span>{sess.class_name} · {sess.subject_name}</span>
                        <span>{sessionKind(sess)}{sess.total_marks ? ` · ${sess.total_marks} marks` : ''}</span>
                        {date && <span className="text-slate-400">{date}</span>}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sess)}
                    className="h-11 w-11 mr-2 shrink-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 grid place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                    aria-label={`Delete ${title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <SetupModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
