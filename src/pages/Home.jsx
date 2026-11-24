import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Menu, X, MessageCircle, Receipt, FileText, ShieldCheck,
  Phone, Zap, CalendarCheck, Inbox, Send, Lock, TrendingUp, Mail, MapPin, PhoneCall, Bot, Mic, Wallet, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/Logo';
import { ContactSection } from '../components/DemoForm';

/* ───────────────────────── content ───────────────────────── */
const WA_DEMO = 'https://wa.me/919876543210?text=Hi%20EduBuddy%2C%20I%20run%20a%20coaching%20center%20and%20want%20a%20demo';
// Every "start free trial" button leads to the free-trial form (on the home page and on /contact).
const DEMO_HREF = '#contact';

const NAV = [
  { href: '#problems', label: 'Why EduBuddy' },
  { href: '#features', label: 'Features' },
  { href: '#compare', label: 'Before & after' },
  { href: '#faq', label: 'FAQ' },
];

const PROBLEMS = [
  { icon: Receipt, problem: 'Parents pay fees late and you keep calling them.', fix: 'EduBuddy sends polite fee reminders on WhatsApp, with a UPI link to pay.' },
  { icon: CalendarCheck, problem: 'Attendance is on paper. Parents don’t know when a child skips class.', fix: 'Mark attendance in 15 seconds. Parents of absent students get a WhatsApp message.' },
  { icon: FileText, problem: 'Making one test paper takes your whole evening.', fix: 'Pick an NCERT chapter and get a ready paper with answers in 30 seconds.' },
  { icon: Inbox, problem: 'Inquiries are written on slips and forgotten.', fix: 'Every call and walk-in is saved, with a reminder on the day to follow up.' },
];

const COMPARE = [
  ['Attendance', 'Paper register, 10 minutes a batch', '15 seconds on your phone'],
  ['Fee collection', 'Calling parents again and again', 'Automatic WhatsApp reminders with UPI link'],
  ['Fee receipts', 'Handwritten receipt book', 'Receipt with your logo, sent on WhatsApp'],
  ['Test papers', '2–3 hours of typing', 'Ready in 30 seconds, with answers'],
  ['Parent updates', 'Parents hear only at PTM', 'Report on WhatsApp every week'],
  ['New admissions', 'Inquiries on paper slips', 'Every inquiry saved, with follow-up reminders'],
];

const FAQS = [
  { q: 'Is the free trial really free?', a: 'Yes. You get every feature free for 14 days. You don’t need a card or any payment to start.' },
  { q: 'Do I need a computer?', a: 'No. EduBuddy works on any smartphone. You can also open it on a laptop if you like.' },
  { q: 'Do parents need to install an app?', a: 'No. Parents get attendance, fee and test updates on WhatsApp, which they already use.' },
  { q: 'My teachers are not good with technology. Will they manage?', a: 'Yes. Teachers only tap Present or Absent and enter marks. Most of them learn it on the first day.' },
  { q: 'Can my teachers see my fee collection?', a: 'No. Teachers see only attendance and marks. Fees and parents’ phone numbers stay with you.' },
  { q: 'How do parents pay fees?', a: 'By UPI: GPay, PhonePe or Paytm. The money goes straight to your bank account. We take 0% commission.' },
  { q: 'Will WhatsApp messages go out without my permission?', a: 'No. EduBuddy prepares the messages, but they are sent only after you approve them.' },
  { q: 'Can my WhatsApp number get banned?', a: 'No. EduBuddy uses the official WhatsApp Business API from Meta.' },
];

/* ───────────────────────── helpers ───────────────────────── */
/** Content is shown as soon as the page loads: no fade-in on scroll. */
function Reveal({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

const Accent = ({ children }) => <span className="text-[#2457d6]">{children}</span>;

const darkBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2457d6] to-[#16306b] px-6 h-12 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_18px_-8px_rgba(0,0,0,0.55)] transition hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]';
const lightBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 h-12 text-sm font-semibold text-[#0b1b36] ring-1 ring-neutral-200 shadow-sm transition hover:-translate-y-px hover:bg-neutral-50 active:translate-y-0 active:scale-[0.98]';

function SectionHead({ title, sub }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0b1b36] leading-[1.1]">{title}</h2>
      {sub && <p className="mt-4 text-base text-neutral-500 leading-relaxed">{sub}</p>}
    </Reveal>
  );
}

function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="EduBuddy home">
      <LogoMark className="h-8 w-8 rounded-[10px] shadow-[0_4px_10px_-3px_rgba(27,43,77,0.5)]" />
      <span className="text-lg font-bold tracking-tight text-[#0b1b36]">edubuddy<span className="text-[#4d90e4]">.ai</span></span>
    </Link>
  );
}

/* ───────────────────────── navbar ───────────────────────── */
/** `base` is '' on the home page and '/' on other pages, so section links still reach the home page. */
export function Navbar({ base = '' }) {
  const [scrolled, setScrolled] = useState(false);
  const href = (item) => (item.local ? item.href : `${base}${item.href}`);
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
          {NAV.map((item) => <a key={item.href} href={href(item)} className="hover:text-[#2457d6] transition-colors">{item.label}</a>)}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login" className="h-9 px-4 grid place-items-center rounded-lg bg-white text-sm font-semibold text-[#0b1b36] ring-1 ring-neutral-200 hover:bg-neutral-50 transition">Login</Link>
          <a href={DEMO_HREF} className="h-9 px-4 grid place-items-center rounded-lg bg-gradient-to-b from-[#2457d6] to-[#16306b] text-sm font-semibold text-white hover:brightness-110 transition">Start free trial</a>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <a href={DEMO_HREF} className="h-9 px-3.5 grid place-items-center rounded-full bg-gradient-to-b from-[#2457d6] to-[#16306b] text-[13px] font-semibold text-white">Free trial</a>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle menu" className="h-10 w-10 grid place-items-center rounded-full text-[#0b1b36] hover:bg-neutral-100">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden mx-auto mt-2 max-w-sm rounded-2xl bg-white p-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-fade-up">
          {NAV.map((item) => (
            <a key={item.href} href={href(item)} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50">{item.label}</a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link to="/login" className={`${lightBtn} h-11`}>Login</Link>
            <a href={DEMO_HREF} onClick={() => setOpen(false)} className={`${darkBtn} h-11 px-3`}>Free trial</a>
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
          <div className="rounded-2xl bg-[#dfe8ff] p-3.5 text-[#16306b]">
            <div className="flex items-start justify-between"><p className="text-sm font-medium">Class 10 Foundation</p><span className="text-neutral-400">···</span></div>
            <p className="text-xs opacity-70">9:00 AM · Batch A</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-2">
                {['#6c9cff', '#dce6ff', '#b5cbff'].map((c, i) => <span key={c} className="h-7 w-7 rounded-full ring-2 ring-[#dfe8ff] grid place-items-center text-[10px] font-bold text-neutral-800" style={{ background: c }}>{['K', 'A', 'R'][i]}</span>)}
                <span className="h-7 w-7 rounded-full bg-white/80 ring-2 ring-[#dfe8ff] grid place-items-center text-[10px] font-semibold">+39</span>
              </div>
              <span className="rounded-full bg-[#c9d9ff] px-3 py-1 text-xs font-medium">140 present</span>
            </div>
            <p className="mt-2 text-[11px] opacity-70">2 parents alerted on WhatsApp</p>
          </div>

          <div className="rounded-2xl bg-[#e9effe] p-3.5 text-[#16306b]">
            <div className="flex items-start justify-between"><p className="text-sm font-medium">NCERT Science Unit Test</p><span className="text-neutral-400">···</span></div>
            <p className="text-xs opacity-70">20 marks · Light: Reflection</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium">Paper ready</span>
              <span className="text-xs font-medium">30 sec</span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#d5e2ff] p-3.5 text-[#16306b]">
            <div className="flex items-start justify-between"><p className="text-sm font-medium">Fee receipt sent</p><span className="text-neutral-400">···</span></div>
            <p className="text-xs opacity-70">Aman Verma · UPI QR</p>
            <p className="mt-2 text-lg font-bold">₹1,200 <span className="text-xs font-medium opacity-70">received</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

const HERO_POINTS = [
  [Receipt, 'Fee reminders go to parents on their own'],
  [CalendarCheck, 'Attendance in 15 seconds, absent alerts on WhatsApp'],
  [FileText, 'NCERT test papers ready in 30 seconds'],
];

/** A small "live" notification that floats around the phone in the hero. */
function HeroToast({ icon: Icon, tone, title, text, className, delay }) {
  return (
    <div
      aria-hidden
      className={`absolute z-10 hidden sm:flex items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-[0_18px_40px_-16px_rgba(16,24,40,0.45)] ring-1 ring-black/5 backdrop-blur animate-fade-up ${className}`}
      style={{ animationDelay: delay, animationDuration: '0.6s' }}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="h-[18px] w-[18px]" /></span>
      <span className="leading-tight">
        <span className="block text-[13px] font-bold text-[#0b1b36]">{title}</span>
        <span className="block text-[11px] text-neutral-500">{text}</span>
      </span>
    </div>
  );
}

function Hero({ onStart }) {
  return (
    <section id="home" className="relative overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3.5rem] bg-gradient-to-b from-white via-[#f1f5ff] to-[#dbe6ff]">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-[#6c9cff]/25 blur-[110px]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#c7d6f5_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-24 pb-0 sm:pt-36 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pb-6">
        {/* copy */}
        <div className="flex flex-col items-center text-center animate-fade-up [animation-duration:0.6s] lg:items-start lg:pb-12 lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm ring-1 ring-neutral-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Made for coaching institutes & tuition centres
          </span>
          <h1 className="mt-4 text-[2.3rem] leading-[1.06] sm:text-6xl font-extrabold tracking-tight text-[#0b1b36]">
            Run your institute <Accent>from your phone</Accent>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] sm:text-lg leading-relaxed text-neutral-600 lg:mx-0">
            Fees on time, attendance without registers, and parents updated on WhatsApp. One simple app for everything.
          </p>

          <ul className="order-last mx-auto mt-8 w-full max-w-md space-y-3 text-left lg:order-none lg:mx-0 lg:mt-7">
            {HERO_POINTS.map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-[15px] font-medium text-neutral-800">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#2457d6] shadow-sm ring-1 ring-neutral-200"><Icon className="h-4 w-4" /></span>
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex w-full flex-col items-center gap-3 lg:mt-8 sm:flex-row sm:justify-center lg:justify-start">
            <a href={DEMO_HREF} className={`${darkBtn} w-full sm:w-auto h-13 px-7 py-3.5 text-[15px]`}>Start 14-day free trial <ArrowRight className="h-4 w-4" /></a>
            <button type="button" onClick={onStart} className={`${lightBtn} w-full sm:w-auto`}>Try the live app</button>
          </div>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-neutral-500 lg:justify-start">
            {['No card needed', 'We set it up for you', 'Works on any phone'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" strokeWidth={3} /> {t}</span>
            ))}
          </p>
        </div>

        {/* product */}
        <div className="relative mx-auto h-[360px] w-full max-w-[460px] sm:h-[470px]">
          <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent)]">
            <PhoneMockup />
          </div>
          <HeroToast icon={Wallet} tone="bg-[#dff3e7] text-emerald-700" title="₹4,500 received" text="Aarav’s fee · paid by UPI" className="-left-6 top-16 lg:-left-16" delay="0.35s" />
          <HeroToast icon={MessageCircle} tone="bg-[#eef3ff] text-[#2457d6]" title="Absent alert sent" text="Diya’s parent informed on WhatsApp" className="-right-4 top-48 lg:-right-12" delay="0.5s" />
          <HeroToast icon={FileText} tone="bg-[#fff4e0] text-amber-700" title="Test paper ready" text="Class 10 Science · 30 sec" className="-left-2 bottom-16 lg:-left-10" delay="0.65s" />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── problems we solve ───────────────────────── */
function Problems() {
  return (
    <section id="problems" className="scroll-mt-24 mx-auto max-w-6xl px-5 pt-14 pb-14 sm:pt-28 sm:pb-28">
      <SectionHead title={<>Sound <Accent>familiar?</Accent></>} sub="The daily headaches of running an institute, and how EduBuddy takes them away." />
      <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
        {PROBLEMS.map(({ icon: Icon, problem, fix }, i) => (
          <Reveal key={problem} delay={i * 80}>
            <article className="h-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition sm:p-6 hover:shadow-[0_20px_40px_-24px_rgba(16,24,40,0.35)]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500"><X className="h-4 w-4" strokeWidth={2.5} /></span>
                <p className="text-base font-semibold leading-snug text-[#0b1b36] sm:text-[17px]">{problem}</p>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f3f6fe] p-3.5 sm:mt-5 sm:p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2457d6] text-white"><Icon className="h-3.5 w-3.5" /></span>
                <p className="text-sm leading-relaxed text-neutral-700">{fix}</p>
              </div>
            </article>
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

function FeatureCard({ icon: Icon, kicker, title, text, points, badge, children }) {
  return (
    <article className="grid h-full content-start items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(16,24,40,0.55)] sm:gap-7 sm:p-8 md:content-center md:shadow-[0_24px_60px_-34px_rgba(16,24,40,0.6)] md:min-h-[26rem] md:grid-cols-2">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2457d6]">
          <Icon className="h-3.5 w-3.5" /> {kicker}
        </span>
        <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0b1b36] sm:text-3xl">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">{text}</p>
        <ul className="mt-5 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#e3ebff]"><Check className="h-2.5 w-2.5 text-[#2457d6]" strokeWidth={3} /></span>
              {point}
            </li>
          ))}
        </ul>
        {badge && (
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#eef3ff] to-[#e3ebff] px-3 py-1.5 text-xs font-semibold text-[#2457d6]">
            <Zap className="h-3.5 w-3.5" /> {badge}
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-neutral-200/70 bg-[#f6f8fd] p-4">{children}</div>
    </article>
  );
}

const FEATURES = [
  {
    icon: CalendarCheck, kicker: 'Every morning', title: 'Attendance in 15 seconds', tab: 'Attendance',
    text: 'Open the batch and tap Present or Absent. Parents of absent students get a WhatsApp message on their own.',
    points: ['No paper register', 'Parents know the same day', 'Monthly report made for you'],
    badge: 'Works on any phone', demo: AttendanceDemo,
  },
  {
    icon: Receipt, kicker: 'Fee day', title: 'Know who has paid', tab: 'Fees',
    text: 'Paid, pending and late fees on one screen. No Excel sheet, no receipt book.',
    points: ['Reminders sent with one tap', 'Receipt with your logo and UPI link', 'Money goes straight to your bank'],
    badge: '0% commission on fees', demo: FeesDemo,
  },
  {
    icon: FileText, kicker: 'Test time', title: 'Test papers in 30 seconds', tab: 'Test papers',
    text: 'Pick a chapter and the marks. You get a board-pattern paper and the answer key together.',
    points: ['NCERT chapters, Class 6 to 12', 'Answer key made for you', 'Print it or send it on WhatsApp'],
    badge: 'Save hours every week', demo: PaperDemo,
  },
  {
    icon: Inbox, kicker: 'New admissions', title: 'Never lose an inquiry', tab: 'Admissions',
    text: 'Every call and walk-in is saved in one place, so you can see how many actually join.',
    points: ['Every inquiry saved', 'Reminder on the follow-up day', 'See how many join each month'],
    badge: 'More admissions', demo: LeadsDemo,
  },
  {
    icon: PhoneCall, kicker: 'Late fees', title: 'AI calls parents for you', tab: 'AI fee calls',
    text: 'When a fee is late, an AI voice assistant calls the parent, reminds them politely and notes when they will pay.',
    points: ['Calls every parent with pending fees', 'Speaks politely in Hindi or English', 'Sends the UPI link on WhatsApp'],
    badge: 'No awkward fee calls', demo: CallDemo,
  },
];

function Features() {
  const [active, setActive] = useState(0);
  const feature = FEATURES[active];
  const Demo = feature.demo;
  return (
    <section id="features" className="scroll-mt-24 mx-auto max-w-6xl px-5 pb-14 sm:pb-28">
      <SectionHead title={<>Everything your institute needs, <Accent>in one app</Accent></>} sub="Simple enough for every teacher. Works on any phone." />

      <div className="mt-10 grid gap-5 lg:mt-12 lg:grid-cols-[15rem_1fr] lg:gap-8">
        <div role="tablist" aria-label="Features" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {FEATURES.map((item, i) => {
            const on = i === active;
            const Icon = item.icon;
            return (
              <button
                key={item.title} type="button" role="tab" aria-selected={on} onClick={() => setActive(i)}
                className={`flex h-11 shrink-0 items-center gap-2.5 rounded-xl px-4 text-left text-sm font-semibold transition active:scale-[0.98] lg:h-12 ${on
                  ? 'bg-[#0b1b36] text-white shadow-sm'
                  : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:-translate-y-px hover:text-[#0b1b36] hover:ring-neutral-300'}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${on ? 'text-[#a9c2ff]' : 'text-[#2457d6]'}`} /> {item.tab}
              </button>
            );
          })}
        </div>
        <div role="tabpanel" key={active} className="animate-fade-up">
          <FeatureCard {...feature}><Demo /></FeatureCard>
        </div>
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
          <p className="text-xs font-bold text-[#0b1b36]">Class 10 · Batch A</p>
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">Today</span>
        </div>
        <ul className="mt-2.5 space-y-1">
          {ROLL.map(([name, initial, status], i) => {
            const marked = i < done;
            const isActive = i === active;
            return (
              <li key={name} className={`flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors duration-300 ${isActive ? 'bg-[#eef3ff]' : ''}`}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8efff] text-[10px] font-bold text-[#2457d6]">{initial}</span>
                <span className="flex-1 truncate text-[11px] font-medium text-neutral-700">{name}</span>
                {['p', 'a'].map((tone) => {
                  const on = marked && status === tone;
                  return (
                    <span key={tone} className="relative grid h-5 w-5 place-items-center">
                      {isActive && status === tone && (
                        <span className="absolute inset-0 animate-ping rounded-md bg-[#6c9cff]/40" />
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
        <span className="relative flex-1 overflow-hidden rounded-lg bg-gradient-to-b from-[#2457d6] to-[#16306b] px-3 py-2 text-center text-[11px] font-semibold text-white shadow-sm">
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
  { label: 'Paid', students: 38, amount: '₹2,48,500', color: '#2457d6' },
  { label: 'Pending', students: 7, amount: '₹14,000', color: '#6c9cff' },
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
        <p className="text-xs font-bold text-[#0b1b36]">Fee dashboard · November</p>
        <span className="rounded-md bg-[#eef3ff] px-2 py-0.5 text-[10px] font-semibold text-[#2457d6]">48 students</span>
      </div>

      <p className="mt-2 text-xl font-extrabold tracking-tight text-[#0b1b36] tabular-nums">{inr(shown)}</p>
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
            <span className="block text-base font-extrabold leading-none text-[#0b1b36] tabular-nums">{reduce ? 79 : paidPct}%</span>
            <span className="mt-0.5 block text-[8px] font-medium text-neutral-400">fees paid</span>
          </span>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {FEE_SLICES.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 text-[10px] font-semibold text-neutral-700">{s.label}</span>
              <span className="text-[9px] text-neutral-400">{s.students}</span>
              <span className="w-[62px] text-right text-[10px] font-bold text-[#0b1b36] tabular-nums">{s.amount}</span>
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
              className={`flex-1 rounded-t-[3px] transition-[height] duration-700 ease-out ${i === FEE_MONTHS.length - 1 ? 'bg-gradient-to-t from-[#2457d6] to-[#6c9cff]' : 'bg-[#d5e2ff]'}`}
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
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#f6f8fd] px-2.5 py-2 text-[10px] font-medium text-neutral-600">
        <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#2457d6]" />
        10 reminders ready with a UPI link
        <span className="ml-auto shrink-0 rounded-md bg-[#2457d6] px-2 py-1 text-[9px] font-semibold text-white">Send</span>
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
          <p className="text-center text-[11px] font-bold uppercase tracking-wide text-[#0b1b36]">Sharma Science Academy</p>
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
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#2457d6] px-2.5 py-1.5 text-white shadow-sm"><FileText className="h-3 w-3" /> Question paper</span>
        <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-500">Worksheet</span>
        <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-500">Answer key</span>
      </div>
    </div>
  );
}

/* ── 4. leads ── */
const STAGES = ['New', 'Contacted', 'Visit', 'Joined'];
const FUNNEL = [['New inquiries', 28, 100, '#b5cbff'], ['Contacted', 19, 68, '#6c9cff'], ['Visited', 11, 39, '#2f9fd4'], ['Joined', 7, 25, '#2457d6']];
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
        <p className="text-xs font-bold text-[#0b1b36]">Admissions · November</p>
        <span className="rounded-md bg-[#eef3ff] px-2 py-0.5 text-[10px] font-semibold text-[#2457d6]">28 inquiries</span>
      </div>

      <div className="mt-2 flex items-end gap-2">
        <p className="text-xl font-extrabold tracking-tight text-[#0b1b36] tabular-nums">{reduce ? 7 : joined} joined</p>
        <p className="inline-flex items-center gap-1 pb-1 text-[9px] font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" /> +2 vs Oct</p>
      </div>

      {/* conversion ring + funnel */}
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg viewBox="0 0 70 70" className="h-full w-full -rotate-90">
            <circle cx="35" cy="35" r={RING_R} fill="none" stroke="#edf2f7" strokeWidth="7" />
            <circle
              cx="35" cy="35" r={RING_R} fill="none" stroke="#2457d6" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={run ? RING_C * 0.75 : RING_C}
              style={{ transition: reduce ? 'none' : 'stroke-dashoffset 1200ms cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <span className="absolute inset-0 grid place-content-center text-center">
            <span className="block text-base font-extrabold leading-none text-[#0b1b36] tabular-nums">{reduce ? 25 : conv}%</span>
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
              <span className="w-4 shrink-0 text-right text-[10px] font-bold text-[#0b1b36] tabular-nums">{count}</span>
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
                <stop offset="0%" stopColor="#6c9cff" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#6c9cff" stopOpacity="0" />
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
              d={TREND_LINE} fill="none" stroke="#2457d6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
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
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2457d6] bg-white ${last ? 'h-2.5 w-2.5 bg-[#2457d6]' : 'h-2 w-2'}`}
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
            className="absolute -translate-x-1/2 rounded-md bg-[#2457d6] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm"
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
            <span key={m} className={`flex-1 text-[8px] font-medium ${i === LEAD_TREND.length - 1 ? 'text-[#2457d6]' : 'text-neutral-400'} ${i === 0 ? 'text-left' : i === LEAD_TREND.length - 1 ? 'text-right' : 'text-center'}`}>{m}</span>
          ))}
        </div>
      </div>

      {/* one lead in detail */}
      <div className="mt-3 rounded-xl border border-neutral-200 bg-[#f9fbfd] p-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-bold text-[#0b1b36]">Rohit Sharma · Class 11 Sci</span>
            <span className="block truncate text-[9px] text-neutral-400">Walk-in on 2 Nov · Tonk Road</span>
          </span>
          <span className="shrink-0 rounded-full bg-[#e3ebff] px-2 py-0.5 text-[9px] font-semibold text-[#2457d6]">Visit planned</span>
        </div>
        <div className="mt-2.5 flex items-center">
          {STAGES.map((stage, i) => (
            <React.Fragment key={stage}>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 transition-all duration-500 ${
                i <= filled ? 'scale-100 bg-[#2457d6] ring-[#d5e2ff]' : 'scale-90 bg-neutral-200 ring-white'}`}
              />
              {i < STAGES.length - 1 && (
                <span className="relative h-0.5 flex-1 bg-neutral-200">
                  <span className="absolute inset-y-0 left-0 bg-[#2457d6] transition-all duration-500" style={{ width: i < filled ? '100%' : '0%' }} />
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] font-medium">
          {STAGES.map((stage, i) => (
            <span key={stage} className={`transition-colors duration-500 ${i <= filled ? 'text-[#2457d6]' : 'text-neutral-400'}`}>{stage}</span>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <p className="flex flex-1 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-[10px] font-medium text-neutral-600">
            <CalendarCheck className="h-3 w-3 text-[#2457d6]" /> Follow-up today, 4:30 PM
          </p>
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#dff3e7] text-emerald-700"><MessageCircle className="h-3.5 w-3.5" /></span>
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eef3ff] text-[#2457d6]"><Phone className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </div>
  );
}

/* ── 5. AI fee calls ── */
const CALL_LINES = [
  { who: 'ai', text: 'Namaste! This is Bright Future Institute. Aarav’s November fee of ₹4,500 is pending.' },
  { who: 'parent', text: 'Haan ji, Friday tak kar denge.' },
  { who: 'ai', text: 'Thank you! I’ve sent the UPI link on WhatsApp.' },
];
const CALL_QUEUE = [
  ['Rohit Gupta', 'Diya · ₹3,000', 'Paid after call', 'bg-[#dff3e7] text-emerald-700'],
  ['Neha Jain', 'Kabir · ₹4,500', 'Queued', 'bg-neutral-100 text-neutral-500'],
];

function CallDemo() {
  const [ref, inView] = useInView(0.3);
  const reduce = useReducedMotion();
  const step = useStep(CALL_LINES.length + 3, 1300, inView && !reduce);
  const s = reduce ? CALL_LINES.length + 2 : step;
  const connected = s >= 1;
  const lines = Math.max(0, Math.min(CALL_LINES.length, s - 1));
  const done = s >= CALL_LINES.length + 2;
  const secs = connected ? Math.min(s, CALL_LINES.length + 1) * 9 + 4 : 0;

  return (
    <div ref={ref} className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0b1b36]"><Bot className="h-3.5 w-3.5 text-[#2457d6]" /> AI fee calls · Today</p>
        <span className="rounded-md bg-[#eef3ff] px-2 py-0.5 text-[10px] font-semibold text-[#2457d6]">4 pending</span>
      </div>

      {/* live call */}
      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-[#2457d6] to-[#16306b] p-2.5 text-white shadow-sm">
        <span className="relative grid h-9 w-9 shrink-0 place-items-center">
          {!connected && !reduce && <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />}
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xs font-bold">SS</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold">Mrs. Sunita Sharma</span>
          <span className="block truncate text-[9px] text-white/70">Aarav · Class 10 · ₹4,500 due</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[9px] font-semibold tabular-nums">
          {connected ? <><Mic className="h-3 w-3" /> 0:{String(secs).padStart(2, '0')}</> : <><PhoneCall className="h-3 w-3" /> Calling…</>}
        </span>
      </div>

      {/* transcript */}
      <ul className="mt-2.5 min-h-[116px] space-y-1.5">
        {CALL_LINES.map((line, i) => (
          <li
            key={line.text}
            className={`flex transition-all duration-500 ${line.who === 'ai' ? 'justify-start' : 'justify-end'} ${i < lines ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
          >
            <span className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[10px] leading-snug ${line.who === 'ai' ? 'rounded-tl-sm bg-[#eef3ff] text-neutral-800' : 'rounded-tr-sm bg-[#e7f6ec] text-neutral-800'}`}>
              {line.text}
            </span>
          </li>
        ))}
      </ul>

      {/* outcome */}
      <p className={`flex items-center gap-2 rounded-lg bg-[#f6f8fd] px-2.5 py-2 text-[10px] font-medium text-neutral-600 transition-all duration-500 ${done ? 'opacity-100' : 'opacity-40'}`}>
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
        {done ? 'Promise to pay · Fri, 21 Nov' : 'Waiting for reply…'}
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md bg-[#dff3e7] px-2 py-1 text-[9px] font-semibold text-emerald-700">
          <MessageCircle className="h-3 w-3" /> UPI link
        </span>
      </p>

      {/* queue */}
      <ul className="mt-2.5 space-y-1 border-t border-neutral-100 pt-2.5">
        {CALL_QUEUE.map(([name, who, status, tone]) => (
          <li key={name} className="flex items-center gap-2 px-1">
            <Phone className="h-3 w-3 shrink-0 text-neutral-400" />
            <span className="text-[10px] font-semibold text-neutral-700">{name}</span>
            <span className="truncate text-[9px] text-neutral-400">{who}</span>
            <span className={`ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${tone}`}>{status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── parent updates / receipts / roles ───────────────────────── */
function Integrations() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-14 sm:pb-28">
      <SectionHead title={<>Parents stay informed. <Accent>You don’t type a word.</Accent></>} sub="EduBuddy writes the WhatsApp message. You check it and tap send." />

      <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
        <Reveal>
          <article className="h-full rounded-2xl border border-neutral-200 bg-[#f8f9fb] p-4 shadow-sm">
            <div className="rounded-2xl bg-white p-4 h-72 overflow-hidden">
              <p className="rounded-xl bg-neutral-100 px-3 py-2 text-xs text-neutral-400 line-through decoration-neutral-300">URGENT: Fee due and absent warning</p>
              <div className="mt-4 rounded-2xl rounded-tl-sm bg-[#e7f6ec] p-3 text-xs leading-relaxed text-neutral-800">
                <p className="font-semibold">Namaste Mrs. Anita Verma!</p>
                <p className="mt-1">Kartik’s weekly haziri is 100% and he ranked #2 in the NCERT Science unit test.</p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11px] font-medium"><FileText className="h-3 w-3" /> Kartik_Class10_Scorecard.pdf</p>
              </div>
              <span className="mt-3 ml-auto block w-fit rounded-full bg-[#b5cbff] px-3 py-1 text-xs font-medium text-[#0b1b36]">Approve &amp; send</span>
            </div>
            <h3 className="mt-5 px-2 text-lg font-semibold text-[#0b1b36]">Updates parents read</h3>
            <p className="mt-1.5 px-2 pb-2 text-sm leading-relaxed text-neutral-500">Sent on WhatsApp only after you approve.</p>
          </article>
        </Reveal>

        <Reveal>
          <article className="h-full rounded-2xl border border-neutral-200 bg-[#f8f9fb] p-4 shadow-sm">
            <div className="rounded-2xl bg-white p-4 h-72 overflow-hidden text-center">
              <p className="text-4xl font-extrabold tracking-tight text-[#0b1b36]">₹42,000</p>
              <p className="text-xs text-neutral-400">Total amount paid</p>
              <div className="mx-auto mt-5 w-full max-w-[220px] rounded-2xl bg-gradient-to-br from-[#2457d6] to-[#16306b] p-4 text-left text-white shadow-xl">
                <div className="flex items-center justify-between"><span className="h-5 w-8 rounded bg-white/25" /><Receipt className="h-4 w-4 opacity-70" /></div>
                <p className="mt-5 text-[11px] tracking-widest opacity-80">BRIGHT FUTURE INSTITUTE</p>
                <p className="mt-1 text-xs opacity-70">GST Tax Invoice · BFIT/2026/1048</p>
                <p className="mt-3 text-[11px] opacity-70">Paid via UPI QR</p>
              </div>
            </div>
            <h3 className="mt-5 px-2 text-lg font-semibold text-[#0b1b36]">GST fee receipts</h3>
            <p className="mt-1.5 px-2 pb-2 text-sm leading-relaxed text-neutral-500">Your logo and UPI link. Share as PDF in one tap.</p>
          </article>
        </Reveal>

        <Reveal>
          <article className="h-full rounded-2xl border border-neutral-200 bg-[#f8f9fb] p-4 shadow-sm">
            <div className="rounded-2xl bg-white p-4 h-72 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#2457d6]">+ Invite</span>
                <div className="flex -space-x-2">
                  {['#6c9cff', '#dce6ff', '#b5cbff', '#a9c2ff'].map((c) => <span key={c} className="h-8 w-8 rounded-full ring-2 ring-white" style={{ background: c }} />)}
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-[10px] font-semibold ring-2 ring-white">+2</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-md">
                <span className="rounded-md bg-[#e8efff] px-2 py-0.5 text-[11px] font-medium text-[#16306b]">Teacher</span>
                <p className="mt-2 text-sm font-medium text-[#0b1b36]">Can mark attendance and enter test marks</p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600"><Lock className="h-3 w-3" /> Fees &amp; GST hidden</p>
              </div>
              <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                <span className="rounded-md bg-[#dff3e7] px-2 py-0.5 text-[11px] font-medium text-emerald-800">Director</span>
                <p className="mt-2 text-sm font-medium text-[#0b1b36]">Full access to ledger and contacts</p>
              </div>
            </div>
            <h3 className="mt-5 px-2 text-lg font-semibold text-[#0b1b36]">What your staff can see</h3>
            <p className="mt-1.5 px-2 pb-2 text-sm leading-relaxed text-neutral-500">Teachers see only what they need.</p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── before & after ───────────────────────── */
function Compare() {
  return (
    <section id="compare" className="scroll-mt-24 mx-auto max-w-5xl px-5 pb-14 sm:pb-28">
      <SectionHead title={<>Before and after <Accent>EduBuddy</Accent></>} sub="What changes from the first week." />
      <Reveal className="mt-12">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_60px_-34px_rgba(16,24,40,0.5)]">
          <div className="hidden grid-cols-[1fr_1.2fr_1.2fr] border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider sm:grid">
            <span className="px-6 py-4 text-neutral-400">Work</span>
            <span className="px-6 py-4 text-rose-500">Without EduBuddy</span>
            <span className="bg-[#eef3ff] px-6 py-4 text-[#2457d6]">With EduBuddy</span>
          </div>
          <ul className="divide-y divide-neutral-100">
            {COMPARE.map(([work, before, after]) => (
              <li key={work} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1.2fr_1.2fr] sm:gap-0 sm:p-0">
                <span className="text-[15px] font-bold text-[#0b1b36] sm:px-6 sm:py-5">{work}</span>
                <span className="flex items-start gap-2 text-sm text-neutral-500 sm:px-6 sm:py-5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" strokeWidth={2.5} /> {before}
                </span>
                <span className="flex items-start gap-2 text-sm font-medium text-neutral-800 sm:bg-[#f5f8ff] sm:px-6 sm:py-5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2457d6]" strokeWidth={3} /> {after}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── free trial banner ───────────────────────── */
function TrialBanner() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-14 sm:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2457d6] to-[#0b1b36] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-[#6c9cff] opacity-30 blur-[90px]" />
          <p className="relative text-xs font-bold uppercase tracking-[0.16em] text-[#ffc46b]">14-day free trial</p>
          <h2 className="relative mx-auto mt-3 max-w-3xl text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
            Try it free. Pay only if you love it.
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-base text-white/70">
            We set up your batches and students for you. No card, no commitment.
          </p>
          <a href={DEMO_HREF} className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[15px] font-semibold text-[#0b1b36] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] transition hover:bg-[#e8efff] active:scale-[0.98]">
            Start free trial <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */
function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 mx-auto max-w-6xl px-5 pb-14 sm:pb-28">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2457d6]">FAQ</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0b1b36] leading-[1.1]">
            Questions owners <Accent>ask us</Accent>
          </h2>
          <p className="mt-4 max-w-sm text-base text-neutral-500">Simple answers before you start your free trial.</p>
          <div className="mt-8 hidden rounded-2xl border border-neutral-200 bg-[#f6f8fd] p-5 lg:block">
            <p className="font-semibold text-[#0b1b36]">Still have a question?</p>
            <p className="mt-1 text-sm text-neutral-500">Talk to us on WhatsApp. We reply quickly.</p>
            <a href={WA_DEMO} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-white transition hover:brightness-105">
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="group flex w-full items-center justify-between gap-6 py-5 text-left">
                    <span className={`text-base sm:text-[17px] font-semibold transition-colors ${isOpen ? 'text-[#2457d6]' : 'text-[#0b1b36] group-hover:text-[#2457d6]'}`}>{item.q}</span>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 ${isOpen ? 'rotate-180 bg-[#2457d6] text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-[#eef3ff]'}`}>
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden"><p className="max-w-2xl pb-5 pr-12 text-[15px] leading-relaxed text-neutral-600">{item.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
          <a href={WA_DEMO} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2457d6] lg:hidden">
            <MessageCircle className="h-4 w-4" /> Still have a question? WhatsApp us
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── sticky phone CTA + footer ───────────────────────── */
/** On phones, a "Book free demo" bar follows the visitor until the form is on screen. */
export function StickyDemoBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const form = document.getElementById('contact');
    let formVisible = false;
    const update = () => setShow(window.scrollY > 500 && !formVisible);
    const io = form && 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => { formVisible = entry.isIntersecting; update(); }, { threshold: 0.05 })
      : null;
    if (io) io.observe(form);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => { window.removeEventListener('scroll', update); if (io) io.disconnect(); };
  }, []);
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0 transition-all duration-300 md:hidden ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`}>
      <a href={DEMO_HREF} className={`${darkBtn} w-full`}>Start 14-day free trial <ArrowRight className="h-4 w-4" /></a>
    </div>
  );
}

export function Footer({ base = '' }) {
  const link = 'inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:text-white';
  const head = 'mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6c9cff]';
  return (
    <footer className="relative mt-6 overflow-hidden rounded-t-[2.5rem] bg-[#0b1b36] px-5 pt-14 pb-8 sm:rounded-t-[3rem]">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-[#6c9cff] opacity-25 blur-[90px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* trust strip */}
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/10 pb-8 text-xs font-medium text-white/60">
          {[[Zap, '14-day free trial'], [ShieldCheck, 'No credit card'], [CalendarCheck, 'Set up in 15 minutes'], [MessageCircle, 'Support on WhatsApp']].map(([Icon, label]) => (
            <li key={label} className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-[#6c9cff]" /> {label}</li>
          ))}
        </ul>

        <div className="grid gap-10 pt-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="EduBuddy home">
              <LogoMark className="h-9 w-9 rounded-xl ring-1 ring-white/15" />
              <span className="text-lg font-bold tracking-tight text-white">edubuddy<span className="text-[#4d90e4]">.ai</span></span>
            </Link>
            <p className="mt-5 max-w-xs text-base leading-relaxed text-white/60">
              Haziri, fees and test papers handled, so your day goes back to teaching.
            </p>
            <a
              href={DEMO_HREF}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 h-11 text-sm font-semibold text-[#0b1b36] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)] transition hover:bg-[#e8efff] active:scale-[0.98]"
            >
              <Send className="h-4 w-4" /> Start free trial
            </a>
          </div>

          <div>
            <p className={head}>Product</p>
            <ul className="space-y-3">
              <li><a href={`${base}#features`} className={link}>Features</a></li>
              <li><a href={`${base}#faq`} className={link}>FAQ</a></li>
              <li><Link to="/dashboard" className={link}>Dashboard</Link></li>
              <li><Link to="/login" className={link}>Log in</Link></li>
            </ul>
          </div>

          <div>
            <p className={head}>For teachers</p>
            <ul className="space-y-3">
              <li><a href={`${base}#features`} className={link}>Attendance</a></li>
              <li><a href={`${base}#features`} className={link}>Fee tracking</a></li>
              <li><a href={`${base}#features`} className={link}>Test maker</a></li>
              <li><a href={`${base}#features`} className={link}>Admission leads</a></li>
            </ul>
          </div>

          <div>
            <p className={head}>Talk to us</p>
            <ul className="space-y-3">
              <li><a href={WA_DEMO} target="_blank" rel="noopener noreferrer" className={link}><MessageCircle className="h-3.5 w-3.5" /> WhatsApp helpline</a></li>
              <li><a href="mailto:hello@edubuddy.ai" className={link}><Mail className="h-3.5 w-3.5" /> hello@edubuddy.ai</a></li>
              <li><a href={DEMO_HREF} className={link}><Send className="h-3.5 w-3.5" /> Contact form</a></li>
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
    <div className="min-h-dvh bg-white text-[#0b1b36] antialiased">
      <Navbar />
      <main>
        <Hero onStart={handleStart} />
        <Problems />
        <Features />
        <Integrations />
        <Compare />
        <TrialBanner />
        <Faq />
        <ContactSection id="contact" source="home page" onTryDemo={handleStart} className="pb-24 sm:pb-32" />
      </main>
      <Footer />
      <StickyDemoBar />
    </div>
  );
}
