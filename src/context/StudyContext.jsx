import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { generateTest as generateTestAI } from '../services/openai';
import { sectionsFromLegacy, stampMarks } from '../data/paperBlueprint';
import { callDb } from '../services/cloud';

const StudyContext = createContext();

// Test papers are stored in MongoDB (api/db.js papers.*), one document per paper with its questions
// and the list of questions already asked, so a new paper on the same chapter does not repeat them.
export const StudyProvider = ({ children }) => {
  const { user } = useAuth();
  const signedIn = !!user && user.role !== 'superadmin';

  const [sessions, setSessions]         = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [processingSession, setProcessingSession] = useState(false);

  // Test state
  const [questions, setQuestions]   = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  // Questions of each paper, by paper id, as loaded from the database.
  const questionsById = useRef(new Map());

  /* ── fetch all papers ─────────────────────── */
  const fetchSessions = useCallback(async () => {
    questionsById.current = new Map();
    if (!signedIn) { setSessions([]); return; }
    setLoadingSessions(true);
    try {
      const { papers } = await callDb('papers.list');
      setSessions(papers.map(({ questions: qs, ...paper }) => {
        if (Array.isArray(qs)) questionsById.current.set(paper.id, qs);
        return paper;
      }));
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [signedIn, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  /* ── create paper ─────────────────────────── */
  const createSession = async (className, subjectName, chapterName, opts = {}) => {
    if (!signedIn) throw new Error('Not signed in.');
    setProcessingSession(true);
    try {
      const payload = {
        id: `s-${Date.now()}`,
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
      await callDb('papers.save', { paper: payload });
      setSessions((prev) => [payload, ...prev.filter((s) => s.id !== payload.id)]);
      return payload;
    } finally {
      setProcessingSession(false);
    }
  };

  /* ── delete paper ─────────────────────────── */
  const deleteSession = async (id) => {
    await callDb('papers.delete', { id });
    questionsById.current.delete(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) { setActiveSession(null); setQuestions(null); }
  };

  /* ── select / load paper ──────────────────── */
  const selectSession = useCallback((sess) => {
    setActiveSession(sess);
    setQuestions(sess ? questionsById.current.get(sess.id) || null : null);
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

  const generateTest = async (session = activeSession) => {
    if (!session) return;
    setGenerating(true);
    setGenerateError('');
    setQuestions(null);
    try {
      const sections = session.blueprint?.length
        ? session.blueprint
        : sectionsFromLegacy(session.question_count ?? 10, session.question_types ?? ['mcq']);
      const scope = chapterScope(session);
      // Questions already used on this chapter: in this paper and in the user's other papers.
      const sameChapter = sessions.filter((item) => chapterScope(item) === scope);
      const asked = sameChapter.flatMap((item) => [
        ...(Array.isArray(item.asked) ? item.asked : []),
        ...(questionsById.current.get(item.id) || []).map((q) => q.question),
      ]);
      const avoid = [...new Set(asked.map((text) => String(text || '').trim()).filter(Boolean))].slice(-120);
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
      const saved = { ...session, asked: remembered };
      await callDb('papers.save', { paper: { ...saved, questions: stamped } });
      questionsById.current.set(session.id, stamped);
      setSessions((prev) => prev.map((s) => (s.id === session.id ? saved : s)));
      setQuestions(stamped);
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
