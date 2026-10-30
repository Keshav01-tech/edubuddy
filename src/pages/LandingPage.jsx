import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Receipt,
  FileText,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  LayoutDashboard,
  Check,
  Download,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'attendance' | 'fees' | 'batches' | 'leads'
  const [openFaq, setOpenFaq] = useState(0);

  const handleQuickDemo = async () => {
    if (user) {
      navigate('/dashboard');
      return;
    }
    try {
      await signIn('demo@edubuddy.ai', 'demo123');
      navigate('/dashboard');
    } catch {
      navigate('/login');
    }
  };

  const faqs = [
    {
      q: 'Kya question paper generator NCERT ke latest syllabus par based hai?',
      a: 'Haan bilkul! EduBuddy mein Class 6 se 12 tak ke Mathematics, Science (Physics, Chemistry, Biology) aur Social Science ke NCERT chapters fully indexed hain. Aap chapter choose karke 30 seconds mein MCQ, Short, Long questions aur answer key ke sath printable question paper bana sakte hain.',
    },
    {
      q: 'Parents ko WhatsApp par absence message kaise jaata hai?',
      a: 'Jab aap daily roll call mein kisi student ko "Absent" mark karte hain, toh system automatically parent ke WhatsApp par message draft kar deta hai (Student ka naam, class, batch aur date ke sath). Aap ek click mein WhatsApp Web/App se ya Twilio integration se send kar sakte hain.',
    },
    {
      q: 'Kya fee receipts par hamare coaching institute ka logo aur address aayega?',
      a: 'Haan! Institute Profile section mein aap apna logo, coaching ka naam, complete address, phone number, GSTIN aur receipt prefix set kar sakte hain. Har fee payment par branded PDF receipt generate hoti hai jise aap WhatsApp par share ya print kar sakte hain.',
    },
    {
      q: 'Hamare paas morning aur evening alag alag batches hain, kya yeh handle ho jayega?',
      a: 'Aap jitne chahein utne Classes aur Batches (e.g. Class 10 Morning, Class 10 Evening, Target NEET, Foundation JEE) create kar sakte hain. Har batch ki attendance, tests aur fees alag-alag filter ho sakti hain bina kisi confusion ke.',
    },
    {
      q: 'Kya student data aur fee records completely safe hain?',
      a: '100% safe. Aapka data local-first privacy architecture par based hai jise sirf aap hi access kar sakte hain. Student details ya fee records kisi third-party ke sath share nahi hote.',
    },
    {
      q: 'Admission inquiries aur demo classes kaise track hoti hain?',
      a: 'EduBuddy mein built-in Lead CRM hai jismein aap walk-in inquiries, calling leads, demo class dates aur admission status (New Inquiry → Demo Scheduled → Enrolled) visual pipeline mein manage kar sakte hain.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Outfit','Geist',sans-serif] selection:bg-brand-500 selection:text-white antialiased">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 text-white text-xs font-medium py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
        <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[11px] font-bold">
          <Sparkles className="w-3 h-3" /> Special
        </span>
        <span className="font-medium">
          Bharat ke coaching institutes & tuition centers ke liye #1 AI Management Platform.
        </span>
        <button
          type="button"
          onClick={handleQuickDemo}
          className="ml-2 underline font-semibold text-amber-200 hover:text-white hidden sm:inline transition-colors"
        >
          Instant Free Trial Shuru Karein →
        </button>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white grid place-items-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Edu<span className="text-brand-600">Buddy</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wider">
                  Institute OS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">Smart Coaching Management</p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#interactive-preview" className="hover:text-brand-600 transition-colors">Live Preview</a>
            <a href="#modules" className="hover:text-brand-600 transition-colors">Modules</a>
            <a href="#comparison" className="hover:text-brand-600 transition-colors">Why EduBuddy</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-brand-600 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="h-10 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-10 px-4 rounded-xl text-sm font-semibold text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="h-10 px-4.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold inline-flex items-center gap-1.5 shadow-md shadow-brand-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Free Demo</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (VIBRANT & COACHING-CENTRIC) */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-slate-50">
        {/* Soft decorative background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-brand-300/20 via-indigo-200/20 to-amber-200/20 blur-3xl rounded-full -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white ring-1 ring-brand-200 shadow-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                Coaching Centers, Tutors & Academies ke liye No. 1 Software
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Apne Coaching Institute ko chalayein{' '}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Superfast & Smart.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-5 text-base sm:text-xl text-slate-600 font-normal leading-relaxed">
              Paper Haziri aur manual question typing ko alvida kahein. <strong className="text-slate-900 font-semibold">1-Tap WhatsApp Attendance</strong>, instant <strong className="text-slate-900 font-semibold">Fee Receipts</strong>, aur 30 seconds mein ready <strong className="text-slate-900 font-semibold">NCERT Question Papers</strong> — sab kuch ek hi jagah.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="h-12 px-7 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base inline-flex items-center gap-2.5 shadow-lg shadow-brand-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Live Demo Try Karein (Free)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/tests"
                className="h-12 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base inline-flex items-center gap-2 ring-1 ring-slate-300 shadow-sm transition-colors"
              >
                <FileText className="w-5 h-5 text-brand-600" />
                <span>AI Test Paper Generator</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1,200+ Institutes Trust Karte Hain
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Class 6 to 12 NCERT Syllabus
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct WhatsApp Integration
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero Credit Card Required
              </span>
            </div>
          </div>

          {/* Visual Showcase: Floating Interactive Coaching Cards Mockup */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            {/* Main Window */}
            <div className="bg-white rounded-3xl ring-1 ring-slate-200/90 shadow-2xl p-4 sm:p-7 border border-slate-100">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-3 font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
                    🏫 Sharma Coaching Institute · Kota Branch (Live Terminal)
                  </span>
                </div>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Session 2026-27 Active
                </span>
              </div>

              {/* Quick KPI Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Total Students</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">142</div>
                  <span className="text-[11px] text-emerald-600 font-bold">+18 this month</span>
                </div>
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/70">
                  <span className="text-xs text-emerald-800 font-semibold uppercase">Today Haziri</span>
                  <div className="text-2xl font-black text-emerald-800 mt-1">94.2%</div>
                  <span className="text-[11px] text-emerald-700 font-medium">134 Present · 8 Absent</span>
                </div>
                <div className="p-3.5 bg-brand-50/70 rounded-2xl border border-brand-200/70">
                  <span className="text-xs text-brand-800 font-semibold uppercase">Fee Collected</span>
                  <div className="text-2xl font-black text-brand-900 mt-1">₹2,48,500</div>
                  <span className="text-[11px] text-brand-700 font-medium">92% Due Recovered</span>
                </div>
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/70">
                  <span className="text-xs text-amber-800 font-semibold uppercase">Tests Generated</span>
                  <div className="text-2xl font-black text-amber-900 mt-1">48 Sets</div>
                  <span className="text-[11px] text-amber-700 font-medium">Class 9, 10 & 11 JEE</span>
                </div>
              </div>

              {/* 3 Live Mini Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Haziri WhatsApp Card */}
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp Absence Alert
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Instant
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px] bg-white p-2.5 rounded-xl border border-emerald-100 leading-relaxed font-mono">
                      "Namaste! Aapka bachha *Rohan Sharma* aaj Class 10 (Morning Batch) mein *ABSENT* raha hai. Kripya dhyan dein."
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
                    <span>Delivered to 98110XXXXX</span>
                    <span>✓✓ Seen</span>
                  </div>
                </div>

                {/* 2. AI Question Paper Card */}
                <div className="p-4 bg-brand-50/40 rounded-2xl border border-brand-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-brand-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-brand-600" /> Printable NCERT Paper
                      </span>
                      <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                        30 Secs
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-brand-100 text-[11px] space-y-1">
                      <div className="font-bold text-slate-800">Class 10 Science · Weekly Test</div>
                      <div className="text-slate-500">Ch 1: Chemical Reactions & Eq (25 Marks)</div>
                      <div className="text-emerald-700 font-semibold pt-1">✓ Complete Solutions & Marking Key</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-brand-100 flex items-center justify-between text-[11px] text-brand-800 font-semibold">
                    <span>Ready for A4 Xerox/Print</span>
                    <span className="underline">Download PDF</span>
                  </div>
                </div>

                {/* 3. Fee Receipt Card */}
                <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-blue-600" /> Official Fee Receipt
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        GST Enabled
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Receipt #</span>
                        <span className="font-mono font-bold text-slate-800">REC-2026-084</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount Paid</span>
                        <span className="font-bold text-emerald-700">₹3,500.00 (UPI)</span>
                      </div>
                      <div className="text-slate-500">Student: Priya Verma (Batch B)</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] text-blue-800 font-semibold">
                    <span>Sharma Classes Stamp Included</span>
                    <span className="text-emerald-700 font-bold">PAID</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE PRODUCT DEMO TABS */}
      <section id="interactive-preview" className="py-16 sm:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-brand-700 tracking-wider uppercase bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-200">
              Live Product Walkthrough
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Coaching chalana ab hua bilkul aasan.
            </h2>
            <p className="mt-2.5 text-base text-slate-600">
              Neeche diye gaye tabs par click karke dekhein ki har feature kaise aapke ghanton ka samay bachata hai.
            </p>

            {/* Tabs */}
            <div className="mt-7 inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('tests')}
                className={`h-10 px-5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all ${
                  activeTab === 'tests'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-300" />
                1. AI Test Maker
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className={`h-10 px-5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all ${
                  activeTab === 'attendance'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                2. WhatsApp Haziri
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fees')}
                className={`h-10 px-5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all ${
                  activeTab === 'fees'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-4 h-4 text-blue-300" />
                3. Fees & Invoices
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('batches')}
                className={`h-10 px-5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all ${
                  activeTab === 'batches'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-purple-300" />
                4. Batches & Students
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leads')}
                className={`h-10 px-5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all ${
                  activeTab === 'leads'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-rose-300" />
                5. New Admissions CRM
              </button>
            </div>
          </div>

          {/* Interactive Screen Container */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg max-w-5xl mx-auto">
            {/* TAB 1: AI TEST GENERATOR */}
            {activeTab === 'tests' && (
              <div className="space-y-5 animate-fade-up">
                <div className="bg-gradient-to-r from-brand-600 to-indigo-700 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-amber-200">
                      CBSE / NCERT Class 10th Mathematics
                    </span>
                    <h3 className="text-xl font-bold mt-2">
                      Weekly Assessment Paper: Quadratic Equations & Triangles
                    </h3>
                    <p className="text-xs text-brand-100 mt-1">
                      Total Marks: 50 · Time: 90 Mins · Blueprint: 10 MCQs, 5 Short Answers, 3 Long Answers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="h-10 px-5 rounded-xl bg-white text-brand-700 font-bold text-xs hover:bg-brand-50 shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download PDF with Solutions
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-brand-600">Q1. Multiple Choice Question [1 Mark]</span>
                      <span className="text-slate-400 font-mono">NCERT Ch 4</span>
                    </div>
                    <p className="font-medium text-slate-800 text-xs">
                      The roots of quadratic equation 2x² - 5x + 3 = 0 are:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">(A) 1 and 3/2</div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">(B) -1 and 3/2</div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">(C) 1 and -3/2</div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">(D) -1 and -3/2</div>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                      ✓ Answer Key: (A) 1 and 3/2 with step-by-step factorization.
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-brand-600">Q2. Long Answer Question [5 Marks]</span>
                      <span className="text-slate-400 font-mono">NCERT Ch 6</span>
                    </div>
                    <p className="font-medium text-slate-800 text-xs">
                      State and prove Basic Proportionality Theorem (Thales' Theorem) with neat diagram.
                    </p>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                      <strong>Teacher Marking Rubric:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                        <li>Given & To Prove statement: 1 Mark</li>
                        <li>Neat Construction diagram: 1 Mark</li>
                        <li>Mathematical Proof & Ratio steps: 3 Marks</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WHATSAPP ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-4 animate-fade-up">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Class 10 - Morning Batch (8:00 AM - 10:00 AM)</h4>
                    <span className="text-slate-500 font-medium">Date: 29 Oct 2026 · 42 Present · 3 Absent</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleQuickDemo}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
                    >
                      ✓ Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickDemo}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100"
                    >
                      Notify Absent Parents (3)
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold grid place-items-center text-xs">K</span>
                      <div>
                        <div className="font-bold text-slate-900">Kartik Sharma</div>
                        <div className="text-slate-400">Parent: 98110-12345 · 96% Attendance</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">Present</span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between bg-rose-50/40">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold grid place-items-center text-xs">A</span>
                      <div>
                        <div className="font-bold text-slate-900">Aarav Verma</div>
                        <div className="text-slate-400">Parent: 98765-43210 · 84% Attendance</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">Absent</span>
                      <button
                        type="button"
                        onClick={handleQuickDemo}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold inline-flex items-center gap-1 hover:bg-emerald-700"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Send WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FEES & INVOICING */}
            {activeTab === 'fees' && (
              <div className="space-y-4 animate-fade-up">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold uppercase">This Month Collection</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">₹1,94,000</div>
                    <span className="text-[11px] text-emerald-600 font-bold">94% target completed</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Pending Dues</span>
                    <div className="text-2xl font-black text-amber-700 mt-1">₹18,500</div>
                    <span className="text-[11px] text-amber-600 font-medium">6 students pending</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Receipts Issued</span>
                    <div className="text-2xl font-black text-blue-800 mt-1">54 Receipts</div>
                    <span className="text-[11px] text-slate-400 font-medium">With Institute Logo & Stamp</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 grid place-items-center font-bold">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Receipt #REC-2026-0091 · ₹4,000.00</div>
                      <div className="text-slate-500">Student: Aryan Singh (Class 11 Science) · Cash / UPI with QR Code</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download GST Receipt PDF
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: BATCHES & STUDENTS */}
            {activeTab === 'batches' && (
              <div className="space-y-4 animate-fade-up text-xs">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Active Classes & Batches</h4>
                    <p className="text-slate-500">Easily split morning, evening and target foundation batches.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 text-white font-bold"
                  >
                    + Add New Batch
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">Class 10th CBSE</span>
                      <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold">48 Students</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">Batch A (Morning 7 AM)</span>
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">Batch B (Evening 5 PM)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">Class 12th JEE / NEET</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">36 Students</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">Target Batch 2027</span>
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">Weekend Doubts Batch</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: LEADS CRM */}
            {activeTab === 'leads' && (
              <div className="space-y-4 animate-fade-up text-xs">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">New Admission Inquiries Pipeline</h4>
                    <p className="text-slate-500">Kabhi bhi koi student inquiry miss na ho.</p>
                  </div>
                  <span className="font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                    12 Active Inquiries This Week
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-medium">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center font-bold text-slate-700">
                      <span>1. New Inquiries</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">5</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">Harshita Saxena</div>
                      <div className="text-[11px] text-slate-500">Class 11 Science · Phone: 98100XXXXX</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center font-bold text-amber-700">
                      <span>2. Demo Scheduled</span>
                      <span className="bg-amber-100 px-2 py-0.5 rounded-full text-amber-800">4</span>
                    </div>
                    <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200">
                      <div className="font-bold text-slate-800">Kavya Agarwal</div>
                      <div className="text-[11px] text-amber-800">Demo Date: Tomorrow 4:00 PM</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center font-bold text-emerald-700">
                      <span>3. Enrolled 🎉</span>
                      <span className="bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-800">3</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200">
                      <div className="font-bold text-slate-800">Vikramaditya Roy</div>
                      <div className="text-[11px] text-emerald-800">Fees Paid: ₹12,000 · Enrolled</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. CORE MODULES FOR COACHING INSTITUTES */}
      <section id="modules" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-brand-700 tracking-wider uppercase bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-200">
            Coaching Superpowers
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Institute chalane ke liye har zaroori tool
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Registers, diary, aur excel sheets ke jhanjhat se azaadi. Har feature coaching director aur teachers ke dhyan mein rakh kar banaya gaya hai.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 grid place-items-center mb-5 font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">AI NCERT Exam Paper Maker</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Class 6 se 12 tak ke chapters pick karein, marks choose karein aur 30 seconds mein ready-to-print question paper aur complete answer key generate karein.
            </p>
          </div>

          {/* 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center mb-5 font-bold">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">1-Tap WhatsApp Attendance</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Daily haziri lijiye seconds mein. Absent student hote hi parent ke phone par automatic WhatsApp message trigger ho jata hai. No manual phone calls.
            </p>
          </div>

          {/* 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 grid place-items-center mb-5 font-bold">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Fee Ledger & GST Invoicing</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Kis student ki kitni fee pending hai, due date kab hai — sab transparent. Payment lete hi branded PDF receipt WhatsApp par send karein.
            </p>
          </div>

          {/* 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 grid place-items-center mb-5 font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Classes & Batches Management</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Morning batch, evening batch, foundation ya dropper batch — sabhi ko alag-alag organize karein. Student ko batch change karna ho toh 1-click mein karein.
            </p>
          </div>

          {/* 5 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 grid place-items-center mb-5 font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Admission Leads & Demo CRM</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Har phone call aur walk-in inquiry ko record karein. Demo class scheduled hai ya student enroll ho gaya, poora conversion pipeline track karein.
            </p>
          </div>

          {/* 6 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 grid place-items-center mb-5 font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Institute Branding & Logo</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Apna coaching logo, registered address, stamp aur signature upload karein. Sabhi receipts aur test papers par aapka coaching brand shine karega.
            </p>
          </div>
        </div>
      </section>

      {/* 6. COMPARISON: TRADITIONAL VS EDUBUDDY */}
      <section id="comparison" className="py-16 sm:py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
              Operational Difference
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kyun 1,200+ Coaching Founders EduBuddy use karte hain?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Way */}
            <div className="bg-slate-800/80 rounded-2xl p-6 sm:p-7 border border-slate-700">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Purana / Manual Tarika (Frustrating)
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Har test se pehle kitabon se question dhoondhna aur ghanton MS Word mein type karna.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Paper register mein haziri lagana jo phat jata hai ya kho jata hai.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Absent bachhon ke parents ko sham ko ek ek karke call karna.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Kachhe paper par raseed kaatna jisse fee ka hisaab-kitab confuse rehta hai.</span>
                </li>
              </ul>
            </div>

            {/* EduBuddy Way */}
            <div className="bg-gradient-to-br from-brand-900/90 to-indigo-900/90 rounded-2xl p-6 sm:p-7 border border-brand-500 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                EduBuddy Smart OS (Effortless)
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-100">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>30 Seconds AI Test Maker:</strong> Ready blueprint + printable PDF paper + solution key.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>1-Tap WhatsApp Haziri:</strong> Absent mark hote hi parents ko WhatsApp update automatically.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Branded GST Invoicing:</strong> Coaching ke logo aur QR code ke sath digital fee receipts.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Complete Batches & CRM:</strong> Morning/Evening batches aur new admission leads ek dashboard par.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING TIERS */}
      <section id="pricing" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-brand-700 tracking-wider uppercase bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-200">
            Affordable Plans
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Har coaching ke budget mein fit
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Koi hidden charges nahi. Free trial shuru karein aur jab institute grow kare tab upgrade karein.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Starter */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Individual Tutors</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Starter Free</h3>
              <div className="mt-4 text-3xl font-black text-slate-900">
                ₹0 <span className="text-xs text-slate-500 font-normal">/ lifetime free</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>50 Students tak manage karein</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>NCERT AI Question Paper Generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Daily Attendance & Haziri Register</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Local-first private data</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="mt-8 w-full h-11 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Start Free (No Card Needed)
            </button>
          </div>

          {/* Pro (Recommended) */}
          <div className="bg-gradient-to-b from-brand-900 to-indigo-950 text-white rounded-2xl p-7 border-2 border-brand-500 shadow-2xl relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
              Most Popular for Institutes
            </span>
            <div>
              <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">Growing Centers</span>
              <h3 className="text-xl font-bold text-white mt-1">Institute Pro</h3>
              <div className="mt-4 text-3xl font-black text-white">
                ₹999 <span className="text-xs text-brand-200 font-normal">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-brand-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Unlimited Students & Batches</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Unlimited AI Question Papers & Marking Keys</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>1-Tap WhatsApp Parent Absence Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Custom Coaching Logo & GST Receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Complete Admission Inquiry CRM</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="mt-8 w-full h-11 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
            >
              14-Day Free Trial Shuru Karein
            </button>
          </div>

          {/* Multi-Branch */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Large Academies</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Multi-Branch</h3>
              <div className="mt-4 text-3xl font-black text-slate-900">
                ₹2,499 <span className="text-xs text-slate-500 font-normal">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Multiple Institute Branches</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dedicated Twilio WhatsApp Gateway</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom Exam Blueprint Templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priority 24x7 Call & WhatsApp Support</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="mt-8 w-full h-11 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Talk to Founder
            </button>
          </div>
        </div>
      </section>

      {/* 8. DISCLOSURES / FAQ */}
      <section id="faqs" className="py-16 sm:py-20 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-brand-700 tracking-wider uppercase bg-white px-3.5 py-1 rounded-full border border-slate-200">
              Questions & Answers
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Aksar puchhe jaane wale sawal (FAQs)
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-brand-600 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-brand-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. BOTTOM CALL TO ACTION BANNER */}
      <section className="py-20 bg-gradient-to-tr from-brand-900 via-brand-800 to-indigo-900 text-white text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 text-white grid place-items-center mx-auto mb-5 backdrop-blur-xs shadow-inner">
            <GraduationCap className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Aaj hi apne coaching ko smart banayein
          </h2>
          <p className="mt-3 text-sm sm:text-base text-brand-100 max-w-xl mx-auto leading-relaxed">
            Puraani diary aur paper registers chodiye. EduBuddy ke sath har din 2 ghante bachayein aur coaching ko scale karein.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="h-12 px-8 rounded-xl bg-white hover:bg-slate-50 text-brand-900 font-extrabold text-base inline-flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-5 h-5 text-brand-600" />
              <span>Launch Free Demo Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
            <div>
              <div className="font-bold text-slate-900 mb-3 text-sm">Quick Features</div>
              <ul className="space-y-2">
                <li><Link to="/tests" className="hover:text-brand-600">AI NCERT Paper Maker</Link></li>
                <li><Link to="/attendance" className="hover:text-brand-600">WhatsApp Haziri Register</Link></li>
                <li><Link to="/fees" className="hover:text-brand-600">Fee Ledger & Receipts</Link></li>
                <li><Link to="/students" className="hover:text-brand-600">Student Directory</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-slate-900 mb-3 text-sm">Coaching Management</div>
              <ul className="space-y-2">
                <li><Link to="/classes" className="hover:text-brand-600">Morning & Evening Batches</Link></li>
                <li><Link to="/leads" className="hover:text-brand-600">Admission CRM Pipeline</Link></li>
                <li><Link to="/profile" className="hover:text-brand-600">Coaching Logo & Branding</Link></li>
                <li><Link to="/settings" className="hover:text-brand-600">Settings & API</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-slate-900 mb-3 text-sm">Syllabus Covered</div>
              <ul className="space-y-2">
                <li><span>Class 6 to 10 Mathematics</span></li>
                <li><span>Class 6 to 10 Science</span></li>
                <li><span>Class 11 & 12 Physics / Chemistry</span></li>
                <li><span>Foundation IIT-JEE & NEET</span></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-slate-900 mb-3 text-sm">Get Started</div>
              <ul className="space-y-2">
                <li><button type="button" onClick={handleQuickDemo} className="hover:text-brand-600 font-semibold text-brand-600">Open Live Demo</button></li>
                <li><Link to="/login" className="hover:text-brand-600">Director Sign In</Link></li>
                <li><span className="text-emerald-600 font-semibold">● 100% Local-First Secure</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              © 2026 EduBuddy Inc. Bharat ke coaching institutes ke liye garv se banaya gaya.
            </div>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-slate-600">Privacy & Terms</Link>
              <span>·</span>
              <span>Made with ❤️ for Educators</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
