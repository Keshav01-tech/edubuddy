import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, MessageCircle } from 'lucide-react';

/*
 * Demo request form. Submissions go to Web3Forms, which emails them to the
 * address registered with this access key.
 */
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const WEB3FORMS_KEY = '98474fca-20d3-4e56-b11c-b5544b1b584c';
const WA_NUMBER = '919876543210';
const SIZES = ['Under 50', '50–200', '200–500', '500+'];
const NEEDS = ['Attendance', 'Fees & reminders', 'Test papers', 'Admission leads', 'AI fee calls'];

const field = 'w-full h-11 rounded-lg bg-[#f6f7f9] px-3.5 text-base sm:text-[15px] text-[#0b1b36] ring-1 ring-transparent placeholder:text-neutral-400 hover:ring-neutral-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457d6] transition';
const chip = (on) => `h-9 rounded-lg px-3 text-[13px] font-medium ring-1 transition ${on
  ? 'bg-[#eef3ff] text-[#2457d6] ring-[#2457d6]/50'
  : 'bg-white text-neutral-600 ring-neutral-200 hover:text-[#0b1b36] hover:ring-neutral-300'}`;

function Field({ title, optional, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-medium text-neutral-700">
        {title}
        {optional && <span className="text-xs font-normal text-neutral-400">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

const trackPixel = (event, data) => {
  try { if (typeof window.fbq === 'function') window.fbq('track', event, data); } catch { /* ignore */ }
};

const EMPTY = { name: '', phone: '', size: '', needs: [], message: '' };

export function DemoForm({ source = 'website', onTryDemo }) {
  const [form, setForm] = useState(EMPTY);
  const [botcheck, setBotcheck] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');

  const set = (key) => (event) => { setError(''); setForm((f) => ({ ...f, [key]: event.target.value })); };
  const toggleNeed = (need) => setForm((f) => ({
    ...f, needs: f.needs.includes(need) ? f.needs.filter((n) => n !== need) : [...f.needs, need],
  }));

  const digits = form.phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  const firstName = form.name.trim().split(/\s+/)[0] || 'there';

  const submit = async (event) => {
    event.preventDefault();
    if (botcheck) return;
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (!/^[6-9]\d{9}$/.test(digits)) { setError('Please enter a valid 10-digit WhatsApp number.'); return; }

    setStatus('sending');
    setError('');
    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `New free trial request: ${form.name.trim()} (+91 ${digits})`,
          from_name: 'EduBuddy Website',
          name: form.name.trim(),
          phone: `+91 ${digits}`,
          students: form.size || '—',
          interested_in: form.needs.join(', ') || '—',
          problem: form.message.trim() || '—',
          page: source,
          botcheck: false,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || 'Form not sent');
      setStatus('done');
      trackPixel('Lead', { content_name: 'Free trial request', content_category: source });
    } catch {
      setStatus('idle');
      setError('We could not send the form. Please try again, or message us on WhatsApp.');
    }
  };

  const waText = encodeURIComponent(
    `Hi EduBuddy, I'm ${form.name.trim() || 'a coaching institute owner'}. I just asked for a free trial on your website.`,
  );

  if (status === 'done') {
    return (
      <div className="py-8 text-center animate-fade-up" role="status">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#dff3e7]">
          <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
        </span>
        <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0b1b36]">Thanks, {firstName}!</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
          We got your request. We’ll WhatsApp you on <strong className="font-semibold text-neutral-800">+91 {digits}</strong> to set up your free trial.
        </p>
        <div className="mt-7 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${waText}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white transition hover:brightness-105"
          >
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp now
          </a>
          {onTryDemo && (
            <button type="button" onClick={onTryDemo} className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0b1b36] ring-1 ring-neutral-200 transition hover:bg-neutral-50">
              Explore the app meanwhile <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {/* honeypot: real people never see or fill this */}
      <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" className="hidden" checked={botcheck} onChange={(e) => setBotcheck(e.target.checked)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field title="Your name">
          <input className={field} name="name" value={form.name} onChange={set('name')} placeholder="Rajesh Sharma" autoComplete="name" />
        </Field>
        <Field title="WhatsApp number">
          <span className="relative block">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-neutral-400">+91</span>
            <input className={`${field} pl-12`} name="phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="98765 43210" autoComplete="tel-national" />
          </span>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-medium text-neutral-700">
          Students <span className="text-xs font-normal text-neutral-400">(optional)</span>
        </legend>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {SIZES.map((size) => (
            <button key={size} type="button" aria-pressed={form.size === size} onClick={() => setForm((f) => ({ ...f, size: f.size === size ? '' : size }))} className={`${chip(form.size === size)} px-1`}>
              {size}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-medium text-neutral-700">
          Interested in <span className="text-xs font-normal text-neutral-400">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {NEEDS.map((need) => {
            const on = form.needs.includes(need);
            return (
              <button key={need} type="button" aria-pressed={on} onClick={() => toggleNeed(need)} className={`${chip(on)} inline-flex items-center gap-1.5`}>
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}{need}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field title="Your problem" optional>
        <textarea
          name="message" rows={3} value={form.message} onChange={set('message')}
          placeholder="e.g. Parents pay fees late"
          className={`${field} h-auto py-2.5 leading-relaxed`}
        />
      </Field>

      {error && <p className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700" role="alert">{error}</p>}

      <button
        type="submit" disabled={status === 'sending'}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#2457d6] to-[#16306b] px-6 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
      >
        {status === 'sending'
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
          : <>Start my free trial <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

/** Minimal free-trial section: short heading, then the form. */
export function ContactSection({ id = 'contact', source = 'website', onTryDemo, heading = 'h2', className = '' }) {
  const Heading = heading;
  return (
    <section id={id} className={`scroll-mt-24 mx-auto max-w-xl px-5 ${className}`}>
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-[#fff3df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#b45309]">
          14-day free trial
        </span>
        <Heading className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0b1b36]">
          Start your <span className="text-[#2457d6]">free trial</span>
        </Heading>
        <p className="mt-2 text-sm text-neutral-500">No card needed. We set it up for you.</p>
      </div>

      <div id={`${id}-form`} className="scroll-mt-24 mt-8 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_20px_50px_-30px_rgba(16,24,40,0.45)] sm:p-7">
        <DemoForm source={source} onTryDemo={onTryDemo} />
      </div>

      <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-[#2457d6]">
        <MessageCircle className="h-4 w-4 text-[#25d366]" /> Or WhatsApp us: +91 98765 43210
      </a>
    </section>
  );
}

export default ContactSection;
