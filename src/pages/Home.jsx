import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Menu, X, Plus, MessageCircle, Receipt, FileText, Users, ShieldCheck, Sparkles,
  Phone, Wallet, Zap, GraduationCap, CalendarCheck, Inbox, Send, BookOpen, Lock, TrendingUp, Mail, MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ───────────────────────── content ───────────────────────── */
const WA_DEMO = 'https://wa.me/919876543210?text=Hi%20EduBuddy%2C%20I%20run%20a%20coaching%20center%20and%20want%20a%20demo';
const WA_START = 'https://wa.me/919876543210?text=Hi%20EduBuddy%2C%20I%20run%20a%20coaching%20center%20and%20want%20to%20automate%20it.';

const NAV = [
  { href: '#home', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
];

const STATS = [
  { value: '98%', label: 'Parents read your update, because it lands on WhatsApp' },
  { value: '15s', label: 'Your whole batch marked present or absent' },
  { value: '30s', label: 'A board-pattern question paper on your desk' },
  { value: '0%', label: 'Commission on fees — it all stays with you' },
];

const FAQS = [
  { q: 'Who is EduBuddy for?', a: 'Coaching institutes, tuition centers and private tutors for Class 6–12, JEE, NEET or Foundation, from 30 to 2,000 students.' },
  { q: 'How is this different from old coaching ERP apps?', a: 'No heavy apps to download. Attendance, reports and fee reminders go to parents on WhatsApp.' },
  { q: 'Does it send WhatsApp messages without my permission?', a: 'No. Messages are prepared automatically, but only sent after your 1-tap approval.' },
  { q: 'Is there any risk of our institute WhatsApp number getting banned?', a: 'No. It uses the official Meta WhatsApp Business Cloud API.' },
  { q: 'How does the NCERT Test Paper generator work?', a: 'Pick a Class 6–12 chapter. Get a board-pattern paper with marking key in about 30 seconds.' },
  { q: 'Can my staff or teachers see my fee collections and financial data?', a: 'No. Teachers can only mark attendance and enter marks. Fees and contacts stay with the Director.' },
  { q: 'How does fee collection and UPI QR work?', a: 'Parents pay by UPI (GPay, PhonePe, Paytm). Money goes straight to your bank, 0% commission.' },
  { q: 'How do I get started, and is there a free trial?', a: 'Yes. 14-day free trial, no credit card. Setup takes under 15 minutes.' },
];

/* ───────────────────────── helpers ───────────────────────── */
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setOn(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setOn(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

const Accent = ({ children }) => <span className="text-[#005a9c]">{children}</span>;

const darkBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#005a9c] to-[#1b365d] px-6 h-12 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_18px_-8px_rgba(0,0,0,0.55)] transition hover:brightness-110 active:scale-[0.98]';
const lightBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 h-12 text-sm font-semibold text-neutral-900 ring-1 ring-neutral-200 shadow-sm transition hover:bg-neutral-50 active:scale-[0.98]';

function SectionHead({ title, sub }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]">{title}</h2>
      {sub && <p className="mt-4 text-base text-neutral-500 leading-relaxed">{sub}</p>}
    </Reveal>
  );
}

function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="EduBuddy home">
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-[#60c1e5] to-[#005a9c] shadow-[0_4px_10px_-3px_rgba(0,90,156,0.6)]">
        <GraduationCap className="h-4 w-4 text-white" />
      </span>
      <span className="text-lg font-bold tracking-tight text-neutral-900">EduBuddy</span>
    </Link>
  );
}

/* ───────────────────────── navbar ───────────────────────── */
function Navbar({ onStart }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4">
      <div className={`mx-auto flex items-center justify-between transition-all duration-300 ${
        scrolled
          ? 'mt-3 max-w-3xl rounded-full bg-white/90 px-4 py-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.18)] backdrop-blur-xl'
          : 'mt-0 max-w-6xl px-2 py-5'
      }`}
      >
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-800" aria-label="Primary">
          {NAV.map((item) => <a key={item.href} href={item.href} className="hover:text-[#005a9c] transition-colors">{item.label}</a>)}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login" className="h-9 px-4 grid place-items-center rounded-lg bg-white text-sm font-semibold text-neutral-900 ring-1 ring-neutral-200 hover:bg-neutral-50 transition">Login</Link>
          <button type="button" onClick={onStart} className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#005a9c] to-[#1b365d] text-sm font-semibold text-white hover:brightness-110 transition">Sign up</button>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle menu" className="md:hidden h-10 w-10 grid place-items-center rounded-full text-neutral-900 hover:bg-neutral-100">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden mx-auto mt-2 max-w-sm rounded-3xl bg-white p-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-fade-up">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50">{item.label}</a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link to="/login" className={`${lightBtn} h-11`}>Login</Link>
            <button type="button" onClick={onStart} className={`${darkBtn} h-11`}>Sign up</button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ───────────────────────── hero ───────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[290px] sm:w-[310px] rounded-t-[3rem] border-[10px] border-b-0 border-neutral-950 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]">
      <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-neutral-950" />
      <div className="px-4 pt-12">
        <div className="flex items-center justify-between text-sm text-neutral-800">
          <span className="inline-flex items-center gap-2 font-medium"><CalendarCheck className="h-4 w-4" /> Today’s Haziri</span>
          <span className="inline-flex items-center gap-0.5 text-neutral-600">See all <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-[#d9f2f9] p-3.5 text-[#1b365d]">
            <div className="flex items-start justify-between"><p className="text-sm font-medium">Class 10 Foundation</p><span className="text-neutral-400">···</span></div>
            <p className="text-xs opacity-70">9:00 AM · Batch A</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-2">
                {['#60c1e5', '#d4ecf7', '#a0e0ef'].map((c, i) => <span key={c} className="h-7 w-7 rounded-full ring-2 ring-[#d9f2f9] grid place-items-center text-[10px] font-bold text-neutral-800" style={{ background: c }}>{['K', 'A', 'R'][i]}</span>)}
                <span className="h-7 w-7 rounded-full bg-white/80 ring-2 ring-[#d9f2f9] grid place-items-center text-[10px] font-semibold">+39</span>
              </div>
              <span className="rounded-full bg-[#bfe6f4] px-3 py-1 text-xs font-medium">140 present</span>
            </div>
            <p className="mt-2 text-[11px] opacity-70">2 parents alerted on WhatsApp</p>
          </div>

          <div className="rounded-2xl bg-[#e4f3fb] p-3.5 text-[#1b365d]">
            <div className="flex items-start justify-between"><p className="text-sm font-medium">NCERT Science Unit Test</p><span className="text-neutral-400">···</span></div>
            <p className="text-xs opacity-70">20 marks · Light: Reflection</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium">Paper ready</span>
              <span className="text-xs font-medium">30 sec</span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#cfe9f5] p-3.5 text-[#1b365d]">
            <div className="flex items-start justify-between"><p className="text-sm font-medium">Fee receipt sent</p><span className="text-neutral-400">···</span></div>
            <p className="text-xs opacity-70">Aman Verma · UPI QR</p>
            <p className="mt-2 text-lg font-bold">₹1,200 <span className="text-xs font-medium opacity-70">received</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ onStart }) {
  return (
    <section id="home" className="relative overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3.5rem] bg-gradient-to-b from-white via-[#eef9fc] to-[#60c1e5]">
      <svg aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2" width="1500" height="1500" viewBox="0 0 1500 1500" fill="none">
        {[540, 680, 820].map((r) => <circle key={r} cx="750" cy="750" r={r} stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />)}
      </svg>

      <div className="relative mx-auto max-w-4xl px-5 pt-32 sm:pt-40 text-center">
        <h1 className="text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900">
          You teach. <Accent>We do the rest.</Accent>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base leading-relaxed text-neutral-600">
          Haziri, fees, test papers and parent updates — off your plate, in one app.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={onStart} className={darkBtn}>Get Started <ArrowRight className="h-4 w-4" /></button>
          <a href={WA_DEMO} target="_blank" rel="noopener noreferrer" className={lightBtn}><MessageCircle className="h-4 w-4" /> WhatsApp demo</a>
        </div>
        <p className="mt-3 text-xs text-neutral-500">No credit card required · Free 14-day trial</p>
      </div>

      <div className="relative mt-12 h-[330px] sm:h-[400px] overflow-hidden px-4">
        <PhoneMockup />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#60c1e5]/60 to-transparent" />
      </div>
    </section>
  );
}

/* ───────────────────────── trusted + stats ───────────────────────── */
function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-20 pb-20 sm:pt-28 sm:pb-28">
      <SectionHead title={<>Less paperwork, <Accent>more teaching</Accent></>} sub="What teachers notice in the first week." />
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <Reveal key={s.value} delay={i * 80}>
            <div className="h-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm [background-image:linear-gradient(#f4f4f5_1px,transparent_1px),linear-gradient(90deg,#f4f4f5_1px,transparent_1px)] [background-size:22px_22px]">
              <p className="text-4xl font-extrabold tracking-tight text-neutral-900">{s.value}</p>
              <p className="mt-3 text-sm leading-snug text-neutral-500">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── features ───────────────────────── */
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setInView(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const on = (e) => setReduce(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
}

function useStep(max, ms, run, loop = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!run) { setI(0); return undefined; }
    const id = setInterval(() => setI((v) => (v >= max ? (loop ? 0 : max) : v + 1)), ms);
    return () => clearInterval(id);
  }, [max, ms, run, loop]);
  return i;
}

function useCountUp(target, run, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) { setValue(0); return undefined; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return value;
}

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(min-width: 768px)');
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return isDesktop;
}

function FeatureCard({ icon: Icon, kicker, title, text, points, badge, children }) {
  return (
    <article className="grid items-center gap-7 rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(16,24,40,0.6)] sm:p-8 md:min-h-[26rem] md:grid-cols-2">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eef7fc] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#005a9c]">
          <Icon className="h-3.5 w-3.5" /> {kicker}
        </span>
        <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">{text}</p>
        <ul className="mt-5 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#dff2fa]"><Check className="h-2.5 w-2.5 text-[#005a9c]" strokeWidth={3} /></span>
              {point}
            </li>
          ))}
        </ul>
        {badge && (
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#eef7fc] to-[#dff2fa] px-3 py-1.5 text-xs font-semibold text-[#005a9c]">
            <Zap className="h-3.5 w-3.5" /> {badge}
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-neutral-200/70 bg-[#f6f9fc] p-4">{children}</div>
    </article>
  );
}

const FEATURES = [
  {
    icon: CalendarCheck, kicker: 'Step 1 · Every morning', title: 'Attendance',
    text: 'Open the batch, tap P or A, done. Parents of absent students get a WhatsApp alert on their own.',
    points: ['Whole batch marked in 15 seconds', 'Absent ka alert parents ko apne aap', 'Monthly register builds itself'],
    badge: 'No paper register', demo: AttendanceDemo,
  },
  {
    icon: Receipt, kicker: 'Step 2 · Fee day', title: 'Fee Tracking',
    text: 'Paid, pending and overdue on one screen, so you never have to open an Excel sheet again.',
    points: ['Doughnut view of paid vs pending', 'Receipt with your logo and a UPI link', 'Reminders go out with one tap'],
    badge: '0% platform commission', demo: FeesDemo,
  },
  {
    icon: FileText, kicker: 'Step 3 · Test time', title: 'NCERT Test Maker',
    text: 'Pick the chapter, set the marks. A board-pattern paper, worksheet and answer key come out together.',
    points: ['NCERT chapters, Class 6 to 12', 'Marking key made for you', 'Print it or send it on WhatsApp'],
    badge: 'Paper ready in 30 seconds', demo: PaperDemo,
  },
  {
    icon: Inbox, kicker: 'Step 4 · New admissions', title: 'Admission Leads',
    text: 'Every call and walk-in in one funnel, so you can see how many inquiries actually join.',
    points: ['Har call aur walk-in saved', 'Follow-up reminder on the day', 'Conversion graph every month'],
    badge: 'No inquiry forgotten', demo: LeadsDemo,
  },
];

function Features() {
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();
  const refs = useRef([]);
  const [prog, setProg] = useState(() => FEATURES.map(() => 0));

  useEffect(() => {
    if (!isDesktop || reduce) { setProg(FEATURES.map(() => 0)); return undefined; }
    let raf = 0;
    const measure = () => {
      raf = 0;
      setProg(refs.current.map((el, i) => {
        const nextEl = refs.current[i + 1];
        if (!el || !nextEl) return 0;
        const height = el.offsetHeight || 1;
        const top = el.getBoundingClientRect().top;
        const nextTop = nextEl.getBoundingClientRect().top;
        return Math.min(1, Math.max(0, (top + height - nextTop) / height));
      }));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isDesktop, reduce]);

  return (
    <section id="features" className="mx-auto max-w-5xl px-5 pb-20 sm:pb-28">
      <SectionHead title={<>Your teaching day, <Accent>sorted</Accent></>} sub="Attendance, fees, test papers and admissions — all in one app." />

      <div className="relative mt-12">
        {FEATURES.map((feature, i) => {
          const Demo = feature.demo;
          const p = isDesktop && !reduce ? prog[i] || 0 : 0;
          return (
            <div
              key={feature.title}
              ref={(el) => { refs.current[i] = el; }}
              className="mb-6 md:sticky md:mb-8"
              style={{
                top: isDesktop ? `${90 + i * 10}px` : undefined,
                zIndex: i + 1,
                transform: p ? `translateY(${-p * 14}px) scale(${1 - p * 0.05})` : undefined,
                opacity: 1 - p * 0.3,
                willChange: isDesktop ? 'transform' : undefined,
              }}
            >
              <FeatureCard {...feature}><Demo /></FeatureCard>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── 1. attendance ── */
const ROLL = [['Kartik Jain', 'K', 'p'], ['Aman Verma', 'A', 'a'], ['Diya Singh', 'D', 'p'], ['Meera Rao', 'M', 'p']];

function AttendanceDemo() {
  const [ref, inView] = useInView(0.35);
  const reduce = useReducedMotion();
  const step = useStep(ROLL.length + 2, 700, inView && !reduce);
  const done = reduce ? ROLL.length : Math.min(step, ROLL.length);
  const active = reduce ? -1 : step - 1;

  return (
    <div ref={ref}>
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-neutral-900">Class 10 · Batch A</p>
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">Today</span>
        </div>
        <ul className="mt-2.5 space-y-1">
          {ROLL.map(([name, initial, status], i) => {
            const marked = i < done;
            const isActive = i === active;
            return (
              <li key={name} className={`flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors duration-300 ${isActive ? 'bg-[#eef7fc]' : ''}`}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e3f6fb] text-[10px] font-bold text-[#005a9c]">{initial}</span>
                <span className="flex-1 truncate text-[11px] font-medium text-neutral-700">{name}</span>
                {['p', 'a'].map((tone) => {
                  const on = marked && status === tone;
                  return (
                    <span key={tone} className="relative grid h-5 w-5 place-items-center">
                      {isActive && status === tone && (
                        <span className="absolute inset-0 animate-ping rounded-md bg-[#60c1e5]/40" />
                      )}
                      <span className={`relative grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold transition-all duration-300 ${
                        on
                          ? `scale-100 ${tone === 'p' ? 'bg-[#c9ecd6] text-emerald-800' : 'bg-[#f5c3cf] text-rose-800'}`
                          : 'scale-90 bg-neutral-100 text-neutral-300'}`}
                      >{tone === 'p' ? 'P' : 'A'}</span>
                    </span>
                  );
                })}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="relative flex-1 overflow-hidden rounded-lg bg-gradient-to-b from-[#005a9c] to-[#1b365d] px-3 py-2 text-center text-[11px] font-semibold text-white shadow-sm">
          <span className="absolute inset-y-0 left-0 bg-white/15 transition-all duration-500" style={{ width: `${(done / ROLL.length) * 100}%` }} />
          <span className="relative">Save haziri</span>
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-lg bg-[#dff3e7] px-2.5 py-2 text-[11px] font-semibold text-emerald-700 transition-all duration-500 ${
          done >= ROLL.length ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
        >
          <MessageCircle className="h-3.5 w-3.5" /> 1 parent alerted
        </span>
      </div>
    </div>
  );
}

/* ── 2. fees ── */
const FEE_SLICES = [
  { label: 'Paid', students: 38, amount: '₹2,48,500', color: '#005a9c' },
  { label: 'Pending', students: 7, amount: '₹14,000', color: '#60c1e5' },
  { label: 'Overdue', students: 3, amount: '₹7,000', color: '#ef7d91' },
];
const FEE_TOTAL = FEE_SLICES.reduce((sum, s) => sum + s.students, 0);
const FEE_MONTHS = [['Jun', 58], ['Jul', 72], ['Aug', 64], ['Sep', 86], ['Oct', 78], ['Nov', 100]];
const DONUT_R = 30;
const DONUT_C = 2 * Math.PI * DONUT_R;

function FeesDemo() {
  const [ref, inView] = useInView(0.3);
  const reduce = useReducedMotion();
  const run = inView || reduce;
  const collected = useCountUp(248500, inView && !reduce);
  const paidPct = useCountUp(79, inView && !reduce, 1100);
  const shown = reduce ? 248500 : collected;
  let acc = 0;

  return (
    <div ref={ref} className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-neutral-900">Fee dashboard · November</p>
        <span className="rounded-md bg-[#eef7fc] px-2 py-0.5 text-[10px] font-semibold text-[#005a9c]">48 students</span>
      </div>

      <p className="mt-2 text-xl font-extrabold tracking-tight text-neutral-900 tabular-nums">{inr(shown)}</p>
      <p className="text-[9px] font-medium text-neutral-400">collected out of ₹2,69,500</p>

      {/* donut + legend */}
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[86px] w-[86px] shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={DONUT_R} fill="none" stroke="#eef2f6" strokeWidth="11" />
            {FEE_SLICES.map((s, i) => {
              const frac = s.students / FEE_TOTAL;
              const offset = -DONUT_C * acc;
              acc += frac;
              return (
                <circle
                  key={s.label}
                  cx="40" cy="40" r={DONUT_R} fill="none" stroke={s.color} strokeWidth="11"
                  strokeDasharray={`${run ? DONUT_C * frac : 0} ${DONUT_C}`}
                  strokeDashoffset={offset}
                  style={{ transition: reduce ? 'none' : 'stroke-dasharray 900ms ease-out', transitionDelay: `${i * 180}ms` }}
                />
              );
            })}
          </svg>
          <span className="absolute inset-0 grid place-content-center text-center">
            <span className="block text-base font-extrabold leading-none text-neutral-900 tabular-nums">{reduce ? 79 : paidPct}%</span>
            <span className="mt-0.5 block text-[8px] font-medium text-neutral-400">fees paid</span>
          </span>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {FEE_SLICES.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 text-[10px] font-semibold text-neutral-700">{s.label}</span>
              <span className="text-[9px] text-neutral-400">{s.students}</span>
              <span className="w-[62px] text-right text-[10px] font-bold text-neutral-900 tabular-nums">{s.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* trend */}
      <div className="mt-3 border-t border-neutral-100 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-neutral-700">Collection trend</p>
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" /> +18% vs Oct</span>
        </div>
        <div className="mt-2 flex h-12 items-end gap-1.5">
          {FEE_MONTHS.map(([m, h], i) => (
            <span
              key={m}
              className={`flex-1 rounded-t-[3px] transition-[height] duration-700 ease-out ${i === FEE_MONTHS.length - 1 ? 'bg-gradient-to-t from-[#005a9c] to-[#60c1e5]' : 'bg-[#cfe9f5]'}`}
              style={{ height: run ? `${h}%` : '2%', transitionDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
        <div className="mt-1 flex gap-1.5">
          {FEE_MONTHS.map(([m]) => (
            <span key={m} className="flex-1 text-center text-[8px] font-medium text-neutral-400">{m}</span>
          ))}
        </div>
      </div>

      {/* reminder row */}
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#f6f9fc] px-2.5 py-2 text-[10px] font-medium text-neutral-600">
        <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#005a9c]" />
        10 reminders ready with a UPI link
        <span className="ml-auto shrink-0 rounded-md bg-[#005a9c] px-2 py-1 text-[9px] font-semibold text-white">Send</span>
      </p>
    </div>
  );
}

/* ── 3. test paper ── */
const PAPER = [
  { q: 'Q1.', text: 'The breakdown of pyruvate to give carbon dioxide, water and energy takes place in:', marks: 1, options: ['(a) Cytoplasm', '(b) Mitochondria', '(c) Chloroplast', '(d) Nucleus'] },
  { q: 'Q2.', text: 'Why is diffusion insufficient to meet the oxygen requirement of human beings?', marks: 2 },
  { q: 'Q3.', text: 'Draw a labelled diagram of the human excretory system.', marks: 3 },
];

function PaperDemo() {
  const [ref, inView] = useInView(0.3);
  const reduce = useReducedMotion();
  const shown = useStep(PAPER.length, 420, inView && !reduce, false);
  const visible = reduce ? PAPER.length : shown;

  return (
    <div ref={ref}>
      <div className="relative">
        <span aria-hidden className="absolute inset-x-5 -top-2 h-8 rounded-t-xl border border-b-0 border-neutral-200 bg-white/60" />
        <span aria-hidden className="absolute inset-x-3 -top-1 h-6 rounded-t-xl border border-b-0 border-neutral-200 bg-white/80" />
        <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white px-4 pt-3.5 pb-8 font-serif shadow-sm">
          <p className="text-center text-[11px] font-bold uppercase tracking-wide text-neutral-900">Sharma Science Academy</p>
          <p className="mt-0.5 text-center text-[9px] text-neutral-500">Unit Test · Class 10 · Science</p>
          <p className="text-center text-[9px] text-neutral-500">Ch 6 — Life Processes</p>
          <div className="mt-2 flex items-center justify-between border-y border-neutral-200 py-1 text-[9px] font-semibold text-neutral-600">
            <span>Time: 1 hour</span><span>Max. Marks: 20</span>
          </div>
          <p className="mt-1.5 text-[8px] italic text-neutral-400">General instructions: All questions are compulsory.</p>

          <p className="mt-2.5 text-center text-[9px] font-bold tracking-wide text-neutral-700">SECTION A</p>
          <ol className="mt-1.5 space-y-2">
            {PAPER.map((item, i) => (
              <li key={item.q} className={`transition-all duration-500 ${i < visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                <p className="flex gap-1.5 text-[9.5px] leading-snug text-neutral-800">
                  <span className="font-bold">{item.q}</span>
                  <span className="flex-1">{item.text}</span>
                  <span className="shrink-0 font-semibold text-neutral-500">[{item.marks}]</span>
                </p>
                {item.options && (
                  <div className="ml-5 mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] text-neutral-600">
                    {item.options.map((o) => <span key={o}>{o}</span>)}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
          <span className="absolute inset-x-0 bottom-1.5 text-center text-[8px] font-sans font-medium text-neutral-400">+ 7 more questions</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#005a9c] px-2.5 py-1.5 text-white shadow-sm"><FileText className="h-3 w-3" /> Question paper</span>
        <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-500">Worksheet</span>
        <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-500">Answer key</span>
      </div>
    </div>
  );
}

/* ── 4. leads ── */
const STAGES = ['New', 'Contacted', 'Visit', 'Joined'];
const FUNNEL = [['New inquiries', 28, 100, '#a0e0ef'], ['Contacted', 19, 68, '#60c1e5'], ['Visited', 11, 39, '#2f9fd4'], ['Joined', 7, 25, '#005a9c']];
const LEAD_TREND = [['Jun', 14], ['Jul', 18], ['Aug', 16], ['Sep', 22], ['Oct', 24], ['Nov', 28]];

const CH_W = 300;
const CH_H = 96;
const CH_PX = 12;
const CH_PT = 16;
const CH_PB = 12;
const TREND_PTS = LEAD_TREND.map(([, v], i) => [
  CH_PX + (i / (LEAD_TREND.length - 1)) * (CH_W - CH_PX * 2),
  CH_PT + (1 - (v - 10) / 20) * (CH_H - CH_PT - CH_PB),
]);

function smoothPath(pts) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x0, y0] = pts[i === 0 ? 0 : i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2] || pts[i + 1];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}
const TREND_LINE = smoothPath(TREND_PTS);
const TREND_AREA = `${TREND_LINE} L${CH_W - CH_PX},${CH_H} L${CH_PX},${CH_H} Z`;

const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

function LeadsDemo() {
  const [ref, inView] = useInView(0.2);
  const reduce = useReducedMotion();
  const run = inView || reduce;
  const conv = useCountUp(25, inView && !reduce, 1200);
  const joined = useCountUp(7, inView && !reduce, 1200);
  const step = useStep(2, 600, inView && !reduce, false);
  const filled = reduce ? 2 : step;

  return (
    <div ref={ref} className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-neutral-900">Admissions · November</p>
        <span className="rounded-md bg-[#eef7fc] px-2 py-0.5 text-[10px] font-semibold text-[#005a9c]">28 inquiries</span>
      </div>

      <div className="mt-2 flex items-end gap-2">
        <p className="text-xl font-extrabold tracking-tight text-neutral-900 tabular-nums">{reduce ? 7 : joined} joined</p>
        <p className="inline-flex items-center gap-1 pb-1 text-[9px] font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" /> +2 vs Oct</p>
      </div>

      {/* conversion ring + funnel */}
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg viewBox="0 0 70 70" className="h-full w-full -rotate-90">
            <circle cx="35" cy="35" r={RING_R} fill="none" stroke="#edf2f7" strokeWidth="7" />
            <circle
              cx="35" cy="35" r={RING_R} fill="none" stroke="#005a9c" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={run ? RING_C * 0.75 : RING_C}
              style={{ transition: reduce ? 'none' : 'stroke-dashoffset 1200ms cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <span className="absolute inset-0 grid place-content-center text-center">
            <span className="block text-base font-extrabold leading-none text-neutral-900 tabular-nums">{reduce ? 25 : conv}%</span>
            <span className="mt-0.5 block text-[8px] font-medium text-neutral-400">convert</span>
          </span>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {FUNNEL.map(([label, count, width, color], i) => (
            <li key={label} className="flex items-center gap-2">
              <span className="w-[62px] shrink-0 text-[9px] font-medium text-neutral-500">{label}</span>
              <span className="h-3.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: run ? `${width}%` : '0%',
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    transition: reduce ? 'none' : `width 950ms cubic-bezier(0.22,1,0.36,1) ${i * 130}ms`,
                  }}
                />
              </span>
              <span className="w-4 shrink-0 text-right text-[10px] font-bold text-neutral-900 tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* inquiry trend */}
      <div className="mt-3 border-t border-neutral-100 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-neutral-700">Inquiries per month</p>
          <span className="text-[9px] font-medium text-neutral-400">Jun – Nov</span>
        </div>

        <div className="relative mt-2 h-[88px]">
          <svg viewBox={`0 0 ${CH_W} ${CH_H}`} preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="ebLeadFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60c1e5" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#60c1e5" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((t) => {
              const y = CH_PT + t * (CH_H - CH_PT - CH_PB);
              return <line key={t} x1={CH_PX} y1={y} x2={CH_W - CH_PX} y2={y} stroke="#eef2f6" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />;
            })}
            <path
              d={TREND_AREA} fill="url(#ebLeadFill)"
              style={{ opacity: run ? 1 : 0, transition: reduce ? 'none' : 'opacity 800ms ease-out 700ms' }}
            />
            <path
              d={TREND_LINE} fill="none" stroke="#005a9c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              vectorEffect="non-scaling-stroke" pathLength="1"
              strokeDasharray="1" strokeDashoffset={run ? 0 : 1}
              style={{ transition: reduce ? 'none' : 'stroke-dashoffset 1500ms cubic-bezier(0.37,0,0.2,1) 250ms' }}
            />
          </svg>

          {/* dots sit in HTML so they stay perfectly round */}
          {TREND_PTS.map(([x, y], i) => {
            const last = i === TREND_PTS.length - 1;
            return (
              <span
                key={LEAD_TREND[i][0]}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#005a9c] bg-white ${last ? 'h-2.5 w-2.5 bg-[#005a9c]' : 'h-2 w-2'}`}
                style={{
                  left: `${(x / CH_W) * 100}%`,
                  top: `${(y / CH_H) * 100}%`,
                  opacity: run ? 1 : 0,
                  transform: `translate(-50%, -50%) scale(${run ? 1 : 0.4})`,
                  transition: reduce ? 'none' : `opacity 300ms ease-out ${500 + i * 180}ms, transform 420ms cubic-bezier(0.34,1.56,0.64,1) ${500 + i * 180}ms`,
                }}
              />
            );
          })}
          {/* value chip on the last point */}
          <span
            className="absolute -translate-x-1/2 rounded-md bg-[#005a9c] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm"
            style={{
              left: `${(TREND_PTS[TREND_PTS.length - 1][0] / CH_W) * 100}%`,
              top: `${(TREND_PTS[TREND_PTS.length - 1][1] / CH_H) * 100}%`,
              marginTop: '-26px',
              opacity: run ? 1 : 0,
              transition: reduce ? 'none' : 'opacity 400ms ease-out 1600ms',
            }}
          >
            28
          </span>
        </div>

        <div className="mt-1 flex" style={{ paddingLeft: `${(CH_PX / CH_W) * 100}%`, paddingRight: `${(CH_PX / CH_W) * 100}%` }}>
          {LEAD_TREND.map(([m], i) => (
            <span key={m} className={`flex-1 text-[8px] font-medium ${i === LEAD_TREND.length - 1 ? 'text-[#005a9c]' : 'text-neutral-400'} ${i === 0 ? 'text-left' : i === LEAD_TREND.length - 1 ? 'text-right' : 'text-center'}`}>{m}</span>
          ))}
        </div>
      </div>

      {/* one lead in detail */}
      <div className="mt-3 rounded-xl border border-neutral-200 bg-[#f9fbfd] p-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-bold text-neutral-900">Rohit Sharma · Class 11 Sci</span>
            <span className="block truncate text-[9px] text-neutral-400">Walk-in on 2 Nov · Tonk Road</span>
          </span>
          <span className="shrink-0 rounded-full bg-[#dff2fa] px-2 py-0.5 text-[9px] font-semibold text-[#005a9c]">Visit planned</span>
        </div>
        <div className="mt-2.5 flex items-center">
          {STAGES.map((stage, i) => (
            <React.Fragment key={stage}>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 transition-all duration-500 ${
                i <= filled ? 'scale-100 bg-[#005a9c] ring-[#cfe9f5]' : 'scale-90 bg-neutral-200 ring-white'}`}
              />
              {i < STAGES.length - 1 && (
                <span className="relative h-0.5 flex-1 bg-neutral-200">
                  <span className="absolute inset-y-0 left-0 bg-[#005a9c] transition-all duration-500" style={{ width: i < filled ? '100%' : '0%' }} />
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] font-medium">
          {STAGES.map((stage, i) => (
            <span key={stage} className={`transition-colors duration-500 ${i <= filled ? 'text-[#005a9c]' : 'text-neutral-400'}`}>{stage}</span>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <p className="flex flex-1 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-[10px] font-medium text-neutral-600">
            <CalendarCheck className="h-3 w-3 text-[#005a9c]" /> Follow-up today, 4:30 PM
          </p>
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#dff3e7] text-emerald-700"><MessageCircle className="h-3.5 w-3.5" /></span>
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eef7fc] text-[#005a9c]"><Phone className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── parent updates / receipts / roles ───────────────────────── */
function Integrations() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:pb-28">
      <SectionHead title={<>Parents updated, <Accent>without typing</Accent></>} sub="EduBuddy writes the message, you just tap approve." />

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
        <Reveal>
          <article className="h-full rounded-3xl border border-neutral-200 bg-[#f8f9fb] p-4 shadow-sm">
            <div className="rounded-2xl bg-white p-4 h-72 overflow-hidden">
              <p className="rounded-xl bg-neutral-100 px-3 py-2 text-xs text-neutral-400 line-through decoration-neutral-300">URGENT: Fee due and absent warning</p>
              <p className="mt-1 text-[10px] text-neutral-400">A typical automated SMS, muted by most parents</p>
              <div className="mt-4 rounded-2xl rounded-tl-sm bg-[#e7f6ec] p-3 text-xs leading-relaxed text-neutral-800">
                <p className="font-semibold">Namaste Mrs. Anita Verma!</p>
                <p className="mt-1">Kartik’s weekly haziri is 100% and he ranked #2 in the NCERT Science unit test.</p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11px] font-medium"><FileText className="h-3 w-3" /> Kartik_Class10_Scorecard.pdf</p>
              </div>
              <span className="mt-3 ml-auto block w-fit rounded-full bg-[#a0e0ef] px-3 py-1 text-xs font-medium text-neutral-900">Approve &amp; send</span>
            </div>
            <h3 className="mt-5 px-2 text-lg font-semibold text-neutral-900">Updates parents read</h3>
            <p className="mt-1.5 px-2 pb-2 text-sm leading-relaxed text-neutral-500">Sent on WhatsApp only after you approve.</p>
          </article>
        </Reveal>

        <Reveal delay={100}>
          <article className="h-full rounded-3xl border border-neutral-200 bg-[#f8f9fb] p-4 shadow-sm">
            <div className="rounded-2xl bg-white p-4 h-72 overflow-hidden text-center">
              <p className="text-4xl font-extrabold tracking-tight text-neutral-900">₹42,000</p>
              <p className="text-xs text-neutral-400">Total amount paid</p>
              <div className="mx-auto mt-5 w-full max-w-[220px] rounded-2xl bg-gradient-to-br from-[#005a9c] to-[#1b365d] p-4 text-left text-white shadow-xl">
                <div className="flex items-center justify-between"><span className="h-5 w-8 rounded bg-white/25" /><Receipt className="h-4 w-4 opacity-70" /></div>
                <p className="mt-5 text-[11px] tracking-widest opacity-80">BRIGHT FUTURE INSTITUTE</p>
                <p className="mt-1 text-xs opacity-70">GST Tax Invoice · BFIT/2026/1048</p>
                <p className="mt-3 text-[11px] opacity-70">Paid via UPI QR</p>
              </div>
            </div>
            <h3 className="mt-5 px-2 text-lg font-semibold text-neutral-900">GST fee receipts</h3>
            <p className="mt-1.5 px-2 pb-2 text-sm leading-relaxed text-neutral-500">Your logo and UPI link. Share as PDF in one tap.</p>
          </article>
        </Reveal>

        <Reveal delay={200}>
          <article className="h-full rounded-3xl border border-neutral-200 bg-[#f8f9fb] p-4 shadow-sm">
            <div className="rounded-2xl bg-white p-4 h-72 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#005a9c]">+ Invite</span>
                <div className="flex -space-x-2">
                  {['#60c1e5', '#d4ecf7', '#a0e0ef', '#9ccdf0'].map((c) => <span key={c} className="h-8 w-8 rounded-full ring-2 ring-white" style={{ background: c }} />)}
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-[10px] font-semibold ring-2 ring-white">+2</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-md">
                <span className="rounded-md bg-[#e3f6fb] px-2 py-0.5 text-[11px] font-medium text-[#1b365d]">Teacher</span>
                <p className="mt-2 text-sm font-medium text-neutral-900">Can mark attendance and enter test marks</p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600"><Lock className="h-3 w-3" /> Fees &amp; GST hidden</p>
              </div>
              <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                <span className="rounded-md bg-[#dff3e7] px-2 py-0.5 text-[11px] font-medium text-emerald-800">Director</span>
                <p className="mt-2 text-sm font-medium text-neutral-900">Full access to ledger and contacts</p>
              </div>
            </div>
            <h3 className="mt-5 px-2 text-lg font-semibold text-neutral-900">What your staff can see</h3>
            <p className="mt-1.5 px-2 pb-2 text-sm leading-relaxed text-neutral-500">Teachers see only what they need.</p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── why directors love it ───────────────────────── */
function Love({ onStart }) {
  const bubbles = [
    { s: 96, x: '8%', y: '4%', d: '0s' }, { s: 140, x: '48%', y: '0%', d: '1.2s' }, { s: 84, x: '82%', y: '14%', d: '2s' },
    { s: 110, x: '22%', y: '52%', d: '0.6s' }, { s: 70, x: '70%', y: '56%', d: '1.8s' }, { s: 120, x: '44%', y: '74%', d: '2.4s' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:pb-28">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900"><Accent>Teachers</Accent> love us</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-500">No registers, no Excel, no chasing parents for fees.</p>
          <ul className="mt-6 space-y-3 text-sm text-neutral-700">
            {['No more paper registers or Excel', '98% WhatsApp open rate', 'Fees go straight to your bank'].map((t) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#dff2fa]"><Check className="h-3 w-3 text-[#005a9c]" strokeWidth={3} /></span>{t}</li>
            ))}
          </ul>
          <button type="button" onClick={onStart} className={`${darkBtn} mt-8`}>Get Started</button>
        </Reveal>

        <div className="relative h-[380px] sm:h-[440px]" aria-hidden>
          {bubbles.map((b, i) => (
            <span key={i} className="absolute rounded-full bg-gradient-to-br from-neutral-100 to-neutral-300 shadow-[inset_0_-6px_12px_rgba(0,0,0,0.05),0_20px_30px_-18px_rgba(0,0,0,0.3)] float-soft"
              style={{ width: b.s, height: b.s, left: b.x, top: b.y, animationDelay: b.d }} />
          ))}
          {[[MessageCircle, '30%', '30%'], [Receipt, '62%', '40%'], [FileText, '14%', '72%']].map(([Icon, x, y], i) => (
            <span key={i} className="absolute grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-xl float-soft" style={{ left: x, top: y, animationDelay: `${i * 0.9}s` }}>
              <Icon className="h-6 w-6 text-[#005a9c]" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */
function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 pb-20 sm:pb-28">
      <SectionHead title={<><Accent>FAQ</Accent></>} sub="What teachers ask before they switch." />
      <Reveal className="mt-10">
        <div className="space-y-3 rounded-[2rem] bg-neutral-200/80 p-3 sm:p-4">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="rounded-2xl bg-white shadow-[0_4px_10px_-4px_rgba(0,0,0,0.15)]">
                <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                  <Plus className={`h-4 w-4 shrink-0 text-[#005a9c] transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                  <span className="text-[15px] font-medium text-neutral-900">{item.q}</span>
                </button>
                <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden"><p className="px-5 pb-5 pl-12 text-sm leading-relaxed text-neutral-500">{item.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── final CTA + footer ───────────────────────── */
function Cta({ onStart }) {
  const floaters = [
    [ShieldCheck, 'left-[4%] top-[6%]'], [Phone, 'right-[4%] top-[8%]'], [Sparkles, 'left-[16%] bottom-[10%]'],
    [Send, 'left-1/2 bottom-[2%] -translate-x-1/2'], [Wallet, 'right-[14%] bottom-[8%]'],
  ];
  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-24 sm:pb-32">
      <div className="relative px-2 py-24 sm:py-32 text-center">
        {floaters.map(([Icon, pos], i) => (
          <span key={i} aria-hidden className={`absolute hidden md:grid h-16 w-16 place-items-center rounded-full bg-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.25)] float-soft ${pos}`} style={{ animationDelay: `${i * 0.7}s` }}>
            <Icon className="h-6 w-6 text-neutral-900" />
          </span>
        ))}
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]">
            Less admin, <Accent>more teaching</Accent>
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={onStart} className={darkBtn}>Get Started <ArrowRight className="h-4 w-4" /></button>
            <a href={WA_START} target="_blank" rel="noopener noreferrer" className={lightBtn}><MessageCircle className="h-4 w-4" /> Start free on WhatsApp</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const link = 'inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:text-white';
  const head = 'mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#60c1e5]';
  return (
    <footer className="relative mt-6 overflow-hidden rounded-t-[2.5rem] bg-[#12294a] px-5 pt-14 pb-8 sm:rounded-t-[3rem]">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-[#60c1e5] opacity-25 blur-[90px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* trust strip */}
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/10 pb-8 text-xs font-medium text-white/60">
          {[[Zap, '14-day free trial'], [ShieldCheck, 'No credit card'], [CalendarCheck, 'Set up in 15 minutes'], [MessageCircle, 'Support on WhatsApp']].map(([Icon, label]) => (
            <li key={label} className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-[#60c1e5]" /> {label}</li>
          ))}
        </ul>

        <div className="grid gap-10 pt-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="EduBuddy home">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#60c1e5] to-[#a0e0ef] shadow-[0_6px_16px_-6px_rgba(96,193,229,0.9)]">
                <GraduationCap className="h-4 w-4 text-[#12294a]" />
              </span>
              <span className="text-lg font-bold tracking-tight text-white">EduBuddy</span>
            </Link>
            <p className="mt-5 max-w-xs text-base leading-relaxed text-white/60">
              Haziri, fees and test papers handled, so your day goes back to teaching.
            </p>
            <a
              href={WA_DEMO} target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 h-11 text-sm font-semibold text-[#12294a] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)] transition hover:bg-[#e3f6fb] active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" /> Book a demo
            </a>
          </div>

          <div>
            <p className={head}>Product</p>
            <ul className="space-y-3">
              <li><a href="#features" className={link}>Features</a></li>
              <li><a href="#faq" className={link}>FAQ</a></li>
              <li><Link to="/dashboard" className={link}>Dashboard</Link></li>
              <li><Link to="/login" className={link}>Log in</Link></li>
            </ul>
          </div>

          <div>
            <p className={head}>For teachers</p>
            <ul className="space-y-3">
              <li><a href="#features" className={link}>Attendance</a></li>
              <li><a href="#features" className={link}>Fee tracking</a></li>
              <li><a href="#features" className={link}>Test maker</a></li>
              <li><a href="#features" className={link}>Admission leads</a></li>
            </ul>
          </div>

          <div>
            <p className={head}>Talk to us</p>
            <ul className="space-y-3">
              <li><a href={WA_DEMO} target="_blank" rel="noopener noreferrer" className={link}><MessageCircle className="h-3.5 w-3.5" /> WhatsApp helpline</a></li>
              <li><a href="mailto:hello@edubuddy.ai" className={link}><Mail className="h-3.5 w-3.5" /> hello@edubuddy.ai</a></li>
              <li><Link to="/contact" className={link}><Send className="h-3.5 w-3.5" /> Contact form</Link></li>
              <li><span className="inline-flex items-center gap-1.5 text-sm text-white/40"><MapPin className="h-3.5 w-3.5" /> Jaipur, Rajasthan</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 EduBuddy Technologies Pvt Ltd</p>
          <p className="inline-flex items-center gap-2">Made in Bharat for Bharat’s teachers <span className="h-1 w-1 rounded-full bg-white/25" /> Built on WhatsApp</p>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────── page ───────────────────────── */
export default function Home() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const handleStart = async () => {
    if (user) { navigate('/dashboard'); return; }
    try {
      await signIn('demo@edubuddy.ai', 'demo123');
      navigate('/dashboard');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-dvh bg-white text-neutral-900 antialiased">
      <Navbar onStart={handleStart} />
      <main>
        <Hero onStart={handleStart} />
        <Stats />
        <Features />
        <Integrations />
        <Love onStart={handleStart} />
        <Faq />
        <Cta onStart={handleStart} />
      </main>
      <Footer />
    </div>
  );
}
