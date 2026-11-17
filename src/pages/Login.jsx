import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, GraduationCap, ArrowRight, Settings, AlertTriangle, Presentation, ShieldCheck, ConciergeBell } from 'lucide-react';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { SetupModal } from '../components/SetupModal';
import { isOpenAIConfigured } from '../services/openai';
import { homeFor } from '../services/roles';
import { Wordmark } from '../components/Logo';

const fieldClass = 'w-full h-12 pl-11 pr-4 text-base bg-white border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 placeholder:text-neutral-400';


export default function Login() {
  const { user, signIn, signInAsTeacher, signInAsReceptionist, signInAsSuperAdmin, backend } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('admin');
  const isTeacherLogin = role === 'teacher';
  const isDeskLogin = role === 'receptionist';
  const usesEmail = isTeacherLogin || isDeskLogin;
  const isSuperLogin = role === 'super';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAiSetupMissing, setIsAiSetupMissing] = useState(false);

  useEffect(() => {
    if (user) navigate(homeFor(user));
    setIsAiSetupMissing(!isOpenAIConfigured());
  }, [user, navigate]);

  const switchRole = (next) => {
    setRole(next);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const attempt = isSuperLogin ? signInAsSuperAdmin : isTeacherLogin ? signInAsTeacher : isDeskLogin ? signInAsReceptionist : signIn;
      const { data, error: signInErr } = await attempt(email, password);
      if (signInErr) throw signInErr;
      navigate(homeFor(data?.user));
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr] dash-canvas">
      <section className="hidden lg:flex flex-col justify-between px-14 py-14">
        <Wordmark markClass="h-10 w-10 rounded-2xl" textClass="text-2xl" />

        <div className="max-w-md">
          <h1 className="font-semibold text-4xl text-neutral-900 leading-tight">
            Print-ready question papers
          </h1>
          <p className="mt-4 text-base text-neutral-600 leading-relaxed">
            Pick class, chapters and marks. Get paper, worksheet and key.
          </p>
          <ul className="mt-8 space-y-3 text-[15px] text-neutral-700">
            <li className="flex gap-3">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#60c1e5] shrink-0" />
              NCERT Class 6–12
            </li>
            <li className="flex gap-3">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#60c1e5] shrink-0" />
              Any marks, 1–100
            </li>
            <li className="flex gap-3">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#60c1e5] shrink-0" />
              Fresh questions every time
            </li>
          </ul>
        </div>

        <p className="text-sm text-neutral-500">Classes 6–12 · NCERT</p>
      </section>

      <section className="relative min-h-screen bg-white/70 backdrop-blur-xl lg:border-l border-white flex items-center justify-center px-5 py-10">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-full max-w-sm">
          <Wordmark className="lg:hidden mb-8" markClass="h-9 w-9 rounded-xl" textClass="text-xl" />

          {isAiSetupMissing && (
            <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900">
              <AlertTriangle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <p>
                An OpenAI key is needed to generate tests.{' '}
                <button type="button" onClick={() => setSettingsOpen(true)} className="underline underline-offset-2 font-medium">
                  Add it in settings
                </button>
              </p>
            </div>
          )}

          {!isSuperLogin && (
          <div role="tablist" aria-label="Sign in as" className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
            {[['admin', 'Admin', GraduationCap], ['teacher', 'Teacher', Presentation], ['receptionist', 'Front desk', ConciergeBell]].map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={role === id}
                onClick={() => switchRole(id)}
                className={`h-10 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${role === id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          )}

          <h2 className="font-semibold tracking-tight text-3xl text-neutral-900">
            {isSuperLogin ? 'Super admin' : isTeacherLogin ? 'Teacher sign in' : isDeskLogin ? 'Front desk sign in' : 'Admin sign in'}
          </h2>
          <p className="text-sm text-neutral-400 mt-1 mb-6">
            {isSuperLogin ? 'Create and manage institute admin accounts.' : isTeacherLogin ? 'See the classes you teach: students, attendance and fees.' : isDeskLogin ? 'Record fees, scan receipts and add students.' : 'Use the login ID and password from your super admin.'}
          </p>

          {error && <Alert type="error" message={error} className="mb-4" onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-medium text-neutral-500 mb-1.5">{usesEmail ? 'Email' : 'Login ID'}</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-4 w-4 h-4 text-neutral-400" />
                <input
                  type={usesEmail ? 'email' : 'text'}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={usesEmail ? 'you@school.com' : 'Your login ID'}
                  className={fieldClass}
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-neutral-500 mb-1.5">Password</span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-4 w-4 h-4 text-neutral-400" />
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
              {loading ? 'Please wait…' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          {backend === 'offline' && (
            <p className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              The database is not reachable, so nobody can sign in right now. Check MONGODB_URI on the server and try again.
            </p>
          )}
          {!isSuperLogin && <p className="mt-6 text-sm text-neutral-500">{usesEmail ? 'No account? Ask your institute admin to add you.' : 'No account? Ask your super admin to create one.'}</p>}

          <button
            type="button"
            onClick={() => switchRole(isSuperLogin ? 'admin' : 'super')}
            className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-700"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isSuperLogin ? 'Back to institute sign in' : 'Super admin sign in'}
          </button>
        </div>
      </section>

      <SetupModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
