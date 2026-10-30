import React, { useState } from 'react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Kya question paper generator latest NCERT aur CBSE syllabus follow karta hai?',
      a: 'Haan bilkul! EduBuddy mein Class 6 se 12 tak ke Mathematics, Science (Physics, Chemistry, Biology) ke NCERT chapters fully indexed hain. Aap chapter choose karke 30 seconds mein MCQ, Short Answer, Long Answer aur answer key ke sath branded printable PDF bana sakte hain.',
    },
    {
      q: 'Parents ko WhatsApp par absence message kaise jaata hai?',
      a: 'Jab aap daily roll call mein kisi student ko "Absent" mark karte hain, toh system automatically parent ke WhatsApp par message draft kar deta hai (Student ka naam, class, batch aur date ke sath). Aap 1 tap mein WhatsApp Web ya direct gateway se send kar sakte hain.',
    },
    {
      q: 'Kya fee receipts par hamari coaching ka logo aur address aayega?',
      a: 'Haan! Institute Profile section mein aap apna logo, coaching ka naam, complete address, phone number, GSTIN aur receipt prefix set kar sakte hain. Har fee payment par branded PDF receipt generate hoti hai jise aap WhatsApp par share ya print kar sakte hain.',
    },
    {
      q: 'Hamare paas morning aur evening alag alag batches hain, kya yeh handle ho jayega?',
      a: 'Aap jitne chahein utne Classes aur Batches (e.g. Class 10 Morning, Class 10 Evening, Target NEET, Foundation JEE) create kar sakte hain. Har batch ki attendance, tests aur fees alag-alag filter hoti hain bina kisi confusion ke.',
    },
    {
      q: 'Kya hum Excel ya PDF se apne existing students import kar sakte hain?',
      a: 'Haan! Students page par "Import PDF" aur Excel upload option hai. Aap apni existing student list ek click mein upload kar sakte hain jisse aapka pura institute 5 minutes mein live ho jata hai.',
    },
    {
      q: 'Kya student data aur fee records completely safe hain?',
      a: '100% safe. Aapka data local-first privacy architecture par based hai jise sirf aap hi access kar sakte hain. Student details ya fee records kisi third-party ke sath share nahi hote.',
    },
    {
      q: 'Kya EduBuddy use karne ke liye computer zaroori hai ya phone se chalega?',
      a: 'EduBuddy fully responsive hai aur mobile phones, tablets, laptops sab par smoothly chalta hai. Teachers apne phone se 15 seconds mein attendance le sakte hain aur papers download kar sakte hain.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="section-block" id="faq">
      <div className="section-header">
        <span className="section-badge">FREQUENTLY ASKED QUESTIONS</span>
        <h2 className="section-title">
          Got Questions? <span className="highlight-lime">We’ve Got Answers.</span>
        </h2>
        <p className="section-lede">
          Here are direct answers to the most common questions coaching directors ask about EduBuddy.
        </p>
      </div>

      <div className="faq-accordion-list">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`faq-item ${isOpen ? 'open' : ''}`}
              onClick={() => toggle(idx)}
            >
              <button
                type="button"
                className="faq-question-btn"
                aria-expanded={isOpen}
              >
                <span className="faq-q-text">{faq.q}</span>
                <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="faq-answer-pane">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
