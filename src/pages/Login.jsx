import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, GraduationCap, ArrowRight, Settings, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { SetupModal } from '../components/SetupModal';
import { isOpenAIConfigured } from '../services/openai';

const fieldClass = 'w-full h-12 pl-11 pr-4 text-base bg-white border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-400';

export default function Login() {
  const { user, signIn, signUp, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAiSetupMissing, setIsAiSetupMissing] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
    setIsAiSetupMissing(!isOpenAIConfigured());
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpErr } = await signUp(email, password, fullName);
        if (signUpErr) throw signUpErr;
        setSuccess('Account created. Sign in below.');
        setIsSignUp(false);
      } else {
        const { error: signInErr } = await signIn(email, password);
        if (signInErr) throw signInErr;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr] bg-canvas">
      <section className="hidden lg:flex flex-col justify-between px-14 py-14">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-700 text-white grid place-items-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-semibold text-xl text-slate-900">EduBuddy</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-semibold text-4xl text-slate-900 leading-tight">
            Question papers for your class, ready to print.
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Pick a class, the chapters, and the marks. EduBuddy writes the questions, the worksheet, and the answer key.
          </p>
          <ul className="mt-8 space-y-3 text-[15px] text-slate-700">
            <li className="flex gap-3">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
              NCERT chapters for classes 6 to 12
            </li>
            <li className="flex gap-3">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
              Any total from 1 to 100 marks
            </li>
            <li className="flex gap-3">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
              A fresh set of questions every time
            </li>
          </ul>
        </div>

        <p className="text-sm text-slate-500">Classes 6–12 · NCERT</p>
      </section>

      <section className="relative min-h-screen bg-white lg:border-l border-slate-200 flex items-center justify-center px-5 py-10">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-700 text-white grid place-items-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-semibold text-xl text-slate-900">EduBuddy</span>
          </div>

          {isAiSetupMissing && (
            <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                An OpenAI key is needed to generate tests.{' '}
                <button type="button" onClick={() => setSettingsOpen(true)} className="underline underline-offset-2 font-medium">
                  Add it in settings
                </button>
              </p>
            </div>
          )}

          <h2 className="font-semibold tracking-tight text-3xl text-slate-900">
            {isSignUp ? 'Create an account' : 'Sign in'}
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            {isSignUp ? 'Your papers are saved to your account.' : 'Welcome back. Your papers are waiting.'}
          </p>

          {error && <Alert type="error" message={error} className="mb-4" onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} className="mb-4" onClose={() => setSuccess('')} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <label className="block">
                <span className="block text-xs font-medium text-slate-500 mb-1.5">Name</span>
                <div className="relative">
                  <User className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className={fieldClass}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Email</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.com"
                  className={fieldClass}
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Password</span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={fieldClass}
                />
              </div>
            </label>

            <Button type="submit" variant="primary" className="w-full h-11 mt-2" disabled={loading}>
              {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
            className="mt-6 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>

          {isDemoMode && (
            <div className="mt-8 flex items-start gap-2.5 p-3.5 bg-brand-50 border border-brand-100 rounded-xl text-xs text-brand-900 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Demo mode is on. Sign in with any email and password. Tests stay in this browser.</p>
            </div>
          )}
        </div>
      </section>

      <SetupModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
