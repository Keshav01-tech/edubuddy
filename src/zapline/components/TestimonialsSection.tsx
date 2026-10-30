import React from 'react';

export const TestimonialsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Rajesh Sharma',
      role: 'Director, Sharma Classes',
      city: 'Jaipur, Rajasthan',
      students: '220 Students (CBSE & Foundation)',
      avatar: 'RS',
      gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      quote:
        'Pehle har mahine fee reminders bhejne mein 3 din lagte the. EduBuddy ke WhatsApp fee alerts se 90% fees due date par hi jama ho jaati hai. Aur NCERT question paper generator toh kamaal hai!',
      tag: '₹42,000 extra fee recovered',
    },
    {
      name: 'Dr. Anita Deshmukh',
      role: 'Founder, Apex NEET Academy',
      city: 'Pune, Maharashtra',
      students: '450 Students (NEET Medical)',
      avatar: 'AD',
      gradient: 'linear-gradient(135deg, #059669, #0d9488)',
      quote:
        'Absentee alert WhatsApp par jaate hi student bunking zero ho gayi. Parents are so impressed with our professionalism. It feels like we are running a premier national academy.',
      tag: 'Zero student bunking',
    },
    {
      name: 'Er. Vikram Patel',
      role: 'Director, Patel Science Tutorials',
      city: 'Patna, Bihar',
      students: '180 Students (Class 9-12 PCM)',
      avatar: 'VP',
      gradient: 'linear-gradient(135deg, #d97706, #ea580c)',
      quote:
        'NCERT test paper banane mein pehle 2 ghante lagte the, ab 30 seconds mein blueprint ke sath ready-to-print PDF mil jati hai. Mere teachers ka valuable time bachta hai.',
      tag: '15+ hrs saved every week',
    },
    {
      name: 'Sunil Grover',
      role: 'Center Head, Bright Future Academy',
      city: 'Delhi NCR',
      students: '310 Students (Commerce & Arts)',
      avatar: 'SG',
      gradient: 'linear-gradient(135deg, #2563eb, #38bdf8)',
      quote:
        'Multiple morning aur evening batches track karna pehle nightmare tha. EduBuddy ke clean interface se receptionist bina kisi confusion ke attendance aur admission sambhal leti hai.',
      tag: '100% staff adoption',
    },
  ];

  return (
    <section className="section-block" id="testimonials">
      <div className="section-header">
        <span className="section-badge">VERIFIED DIRECTOR REVIEWS</span>
        <h2 className="section-title">
          Loved by <span className="highlight-lime">1,200+ Coaching Institutes</span> Across Bharat.
        </h2>
        <p className="section-lede">
          From neighborhood tuition centers to premier competitive entrance academies, directors trust EduBuddy to automate daily institute operations.
        </p>
      </div>

      <div className="testimonials-grid">
        {reviews.map((r, idx) => (
          <div key={idx} className="testimonial-card">
            <div className="review-top">
              <div className="director-avatar" style={{ background: r.gradient }}>
                {r.avatar}
              </div>
              <div className="director-meta">
                <h4>{r.name}</h4>
                <p>{r.role} · <strong>{r.city}</strong></p>
                <span className="director-capacity">{r.students}</span>
              </div>
            </div>

            <p className="director-quote">“{r.quote}”</p>

            <div className="review-bottom">
              <span className="result-tag">★ {r.tag}</span>
              <span className="verified-badge">✓ Verified Director</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
