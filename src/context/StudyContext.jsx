import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { generateTest as generateTestAI } from '../services/openai';
import { sectionsFromLegacy, stampMarks } from '../data/paperBlueprint';

const StudyContext = createContext();

export const StudyProvider = ({ children }) => {
  const { user, isDemoMode } = useAuth();

  const [sessions, setSessions]         = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [processingSession, setProcessingSession] = useState(false);

  // Test state
  const [questions, setQuestions]   = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const readMeta = (userId) => {
    try {
      return JSON.parse(localStorage.getItem(`edu_session_meta_${userId}`) || '{}');
    } catch {
      return {};
    }
  };

  const writeMeta = (userId, meta) => {
    localStorage.setItem(`edu_session_meta_${userId}`, JSON.stringify(meta));
  };

  const attachMeta = (userId, list) => {
    const meta = readMeta(userId);
    return (list || []).map((session) => (meta[session.id] ? { ...session, ...meta[session.id] } : session));
  };

  /* ── fetch all sessions ─────────────────────── */
  const fetchSessions = useCallback(async () => {
    if (!user) { setSessions([]); return; }
    setLoadingSessions(true);
    try {
      const useDb = !isDemoMode && isSupabaseConfigured();
      if (useDb) {
        const { data, error } = await supabase
          .from('study_sessions')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setSessions(attachMeta(user.id, data || []));
      } else {
        const raw = localStorage.getItem(`edu_sessions_${user.id}`);
        setSessions(attachMeta(user.id, raw ? JSON.parse(raw) : []));
      }
    } catch {
      const raw = localStorage.getItem(`edu_sessions_${user.id}`);
      setSessions(attachMeta(user.id, raw ? JSON.parse(raw) : []));
    } finally {
      setLoadingSessions(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  /* ── create session ─────────────────────────── */
  const createSession = async (className, subjectName, chapterName, opts = {}) => {
    if (!user) throw new Error('Not signed in.');
    setProcessingSession(true);
    try {
      const id = `s-${Date.now()}`;
      const payload = {
        id,
        user_id: user.id,
        class_name: className,
        subject_name: subjectName,
        chapter_name: chapterName,
        question_count: opts.count ?? 10,
        question_types: opts.types ?? ['mcq'],
        difficulty: opts.difficulty ?? 'medium',
        total_marks: opts.totalMarks ?? null,
        paper_mode: opts.mode ?? (opts.types?.length > 1 ? 'mixed' : opts.types?.[0] ?? 'mcq'),
        blueprint: opts.blueprint ?? null,
        chapters: opts.chapters ?? null,
        created_at: new Date().toISOString(),
      };

      const meta = readMeta(user.id);
      meta[id] = {
        blueprint: payload.blueprint,
        total_marks: payload.total_marks,
        paper_mode: payload.paper_mode,
        question_types: payload.question_types,
        chapters: payload.chapters,
      };
      writeMeta(user.id, meta);

      let saved = false;
      if (!isDemoMode && isSupabaseConfigured()) {
        try {
          const dbPayload = { ...payload };
          delete dbPayload.blueprint;
          delete dbPayload.total_marks;
          delete dbPayload.paper_mode;
          delete dbPayload.chapters;
          const { data, error } = await supabase
            .from('study_sessions')
            .insert([dbPayload])
            .select();
          if (!error && data?.[0]) {
            Object.assign(payload, data[0], {
              blueprint: payload.blueprint,
              total_marks: payload.total_marks,
              paper_mode: payload.paper_mode,
              question_types: payload.question_types,
              chapters: payload.chapters,
            });
            saved = true;
          }
        } catch { /* fall through */ }
      }

      if (!saved) {
        const raw = localStorage.getItem(`edu_sessions_${user.id}`);
        const list = raw ? JSON.parse(raw) : [];
        localStorage.setItem(`edu_sessions_${user.id}`, JSON.stringify([payload, ...list]));
      }

      setSessions(prev => [payload, ...prev.filter(s => s.id !== payload.id)]);
      return payload;
    } finally {
      setProcessingSession(false);
    }
  };

  /* ── delete session ─────────────────────────── */
  const deleteSession = async (id) => {
    try {
      if (!isDemoMode && isSupabaseConfigured()) {
        await supabase.from('study_sessions').delete().eq('id', id);
      }
    } catch { /* ignore */ }
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    localStorage.setItem(`edu_sessions_${user.id}`, JSON.stringify(next));
    const meta = readMeta(user.id);
    delete meta[id];
    writeMeta(user.id, meta);
    // clear cached questions
    localStorage.removeItem(`edu_questions_${id}`);
    localStorage.removeItem(`edu_asked_${id}`);
    if (activeSession?.id === id) { setActiveSession(null); setQuestions(null); }
  };

  /* ── select / load session ──────────────────── */
  const selectSession = useCallback((sess) => {
    setActiveSession(sess);
    setQuestions(null);
    if (!sess) return;
    // restore cached questions if any
    const cached = localStorage.getItem(`edu_questions_${sess.id}`);
    if (cached) setQuestions(JSON.parse(cached));
  }, []);

  /* ── generate test ──────────────────────────── */
  const chapterScope = (session) => {
    const chapters = (session?.chapters?.length ? session.chapters : [session?.chapter_name])
      .map((name) => String(name || '').trim().toLowerCase())
      .filter(Boolean)
      .sort();
    return [session?.class_name, session?.subject_name, chapters.join('~')]
      .map((part) => String(part || '').trim().toLowerCase())
      .join('|');
  };

  const readChapterAsked = (userId) => {
    try {
      const data = JSON.parse(localStorage.getItem(`edu_chapter_asked_${userId}`) || '{}');
      return data && typeof data === 'object' ? data : {};
    } catch {
      return {};
    }
  };

  const generateTest = async (session = activeSession) => {
    if (!session) return;
    setGenerating(true);
    setGenerateError('');
    setQuestions(null);
    try {
      const sections = session.blueprint?.length
        ? session.blueprint
        : sectionsFromLegacy(session.question_count ?? 10, session.question_types ?? ['mcq']);
      let asked = [];
      try {
        const stored = JSON.parse(localStorage.getItem(`edu_asked_${session.id}`) || '[]');
        if (Array.isArray(stored)) asked = stored;
      } catch { /* ignore a bad cache */ }
      const scope = chapterScope(session);
      const chapterMemory = user ? readChapterAsked(user.id) : {};
      const fromThisChapter = Array.isArray(chapterMemory[scope]) ? chapterMemory[scope] : [];
      const fromOtherPapers = sessions
        .filter((item) => item.id !== session.id && chapterScope(item) === scope)
        .flatMap((item) => {
          try {
            const paper = JSON.parse(localStorage.getItem(`edu_questions_${item.id}`) || '[]');
            return Array.isArray(paper) ? paper.map((question) => question.question) : [];
          } catch {
            return [];
          }
        });
      const currentPaper = activeSession?.id === session.id ? (questions || []) : [];
      const avoid = [...new Set(
        [...fromThisChapter, ...fromOtherPapers, ...asked, ...currentPaper.map((item) => item.question)]
          .map((text) => String(text || '').trim())
          .filter(Boolean)
      )];
      const qs = await generateTestAI(
        session.class_name,
        session.subject_name,
        session.chapter_name,
        {
          blueprint:  sections,
          chapters:   session.chapters?.length ? session.chapters : undefined,
          count:      session.question_count ?? 10,
          types:      session.question_types ?? ['mcq'],
          difficulty: session.difficulty     ?? 'medium',
          avoid,
        }
      );
      const stamped = stampMarks(qs, sections);
      const remembered = [...new Set(
        [...avoid, ...stamped.map((item) => item.question)].map((text) => String(text || '').trim()).filter(Boolean)
      )].slice(-120);
      localStorage.setItem(`edu_asked_${session.id}`, JSON.stringify(remembered));
      if (user) {
        chapterMemory[scope] = remembered.slice(-80);
        localStorage.setItem(`edu_chapter_asked_${user.id}`, JSON.stringify(chapterMemory));
      }
      setQuestions(stamped);
      localStorage.setItem(`edu_questions_${session.id}`, JSON.stringify(stamped));
    } catch (err) {
      setGenerateError(err.message || 'Could not generate this test.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <StudyContext.Provider value={{
      sessions, loadingSessions, processingSession,
      activeSession, selectSession,
      questions, generating, generateError,
      createSession, deleteSession, generateTest,
    }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => useContext(StudyContext);
