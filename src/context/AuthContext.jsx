import React, { createContext, useContext, useState, useEffect } from 'react';
import { cloudEnabled, callDb, getToken, setToken } from '../services/cloud';
import { resetClassroomStores } from '../services/classroom';

const AuthContext = createContext();

// Keys older versions used to keep accounts and institute data in the browser. Everything lives in
// MongoDB now, so they are removed on start-up and never read.
const LEGACY_KEY = /^edu_(classroom_|admin_accounts$|admin_session$|super_session$|teacher_session$|demo_user$|owner_password$|sessions_|questions_|asked_|chapter_asked_|session_meta_)/;
function forgetLegacyStorage() {
  try {
    Object.keys(localStorage).filter((key) => LEGACY_KEY.test(key)).forEach((key) => localStorage.removeItem(key));
  } catch { /* storage blocked: nothing to remove */ }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // 'checking' while asking the server, 'cloud' when MongoDB is reachable, 'offline' when it is not.
  const [backend, setBackend] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    let timer;
    forgetLegacyStorage();
    const run = async () => {
      const ready = await cloudEnabled();
      if (cancelled) return;
      if (!ready) {
        setBackend('offline');
        setLoading(false);
        timer = setTimeout(run, 5000); // keep asking; sign-in opens as soon as the server is back
        return;
      }
      setBackend('cloud');
      if (getToken()) {
        try {
          const { user: fresh } = await callDb('me');
          if (!cancelled) setUser(fresh);
        } catch (err) {
          // Only a refused session signs out; a network blip keeps the token for the next visit.
          if (err.status === 401) setToken('');
        }
      }
      if (!cancelled) setLoading(false);
    };
    run();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const signInAs = async (role, loginId, password) => {
    if (!(await cloudEnabled())) {
      return { data: null, error: new Error('The database is not reachable. Try again in a moment.') };
    }
    try {
      const { token, user: nextUser } = await callDb('login', { role, loginId, password });
      setToken(token);
      resetClassroomStores();
      setBackend('cloud');
      setUser(nextUser);
      return { data: { user: nextUser }, error: null };
    } catch (err) {
      return { data: null, error: new Error(err.message) };
    }
  };

  const signIn = (loginId, password) => signInAs('admin', loginId, password);
  const signInAsTeacher = (email, password) => signInAs('teacher', email, password);
  const signInAsReceptionist = (email, password) => signInAs('receptionist', email, password);
  const signInAsSuperAdmin = (loginId, password) => signInAs('superadmin', loginId, password);
  // Parents sign in with their child's phone number and the 6-digit PIN the institute gave them.
  const signInAsParent = (phone, pin) => signInAs('parent', phone, pin);

  const signOut = async () => {
    resetClassroomStores(); // sends anything still waiting before the token goes
    setToken('');
    setUser(null);
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode: false, backend, signIn, signInAsTeacher, signInAsReceptionist, signInAsSuperAdmin, signInAsParent, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
