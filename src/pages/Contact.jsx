import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar, Footer } from './Home';
import { ContactSection } from '../components/DemoForm';

/**
 * /contact — a landing page built around the demo form, for ads and direct links.
 * It shares the navbar, form and footer with the home page.
 */
export default function Contact() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Start your free trial — EduBuddy';
    window.scrollTo(0, 0);
  }, []);

  const tryDemo = async () => {
    if (user) { navigate('/dashboard'); return; }
    try {
      await signIn('demo@edubuddy.ai', 'demo123');
      navigate('/dashboard');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-dvh bg-white text-[#0b1b36] antialiased">
      <Navbar base="/" />
      <main className="bg-gradient-to-b from-white via-[#f1f5ff] to-white pt-28 pb-20 sm:pt-36 sm:pb-28">
        <ContactSection id="contact" heading="h1" source="contact page" onTryDemo={tryDemo} />
      </main>
      <Footer base="/" />
    </div>
  );
}
