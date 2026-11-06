import React from 'react';
import './BrightFutureDocs.css';

interface InvoiceProps {
  compact?: boolean;
}

export default function BrightFutureInvoice({ compact = false }: InvoiceProps) {
  return (
    <div className={`bf-invoice-doc ${compact ? 'compact' : ''}`}>
      {/* Top Header: Logo, Name & Metadata */}
      <div className="bf-inv-top">
        <div className="bf-inv-brand">
          <svg className="bf-logo-icon" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="24,3 46,14 24,23 2,14" fill="#0a2540" />
            <path d="M10 19v6c0 3.8 6.27 7 14 7s14-3.2 14-7v-6" stroke="#0a2540" strokeWidth="2.5" fill="#2563eb" fillOpacity="0.2" />
            <path d="M42 15v11c0 1.5-1 2-2 2s-2-.5-2-2v-11" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 34c6-3 12-1 18 3 6-4 12-6 18-3" stroke="#0a2540" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M6 37c6-3 12-1 18 3 6-4 12-6 18-3" stroke="#0a2540" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
          <div className="bf-brand-info">
            <h2 className="bf-brand-name">BRIGHT FUTURE</h2>
            <span className="bf-brand-sub">INSTITUTE OF TECHNOLOGY</span>
            <p className="bf-brand-address">
              123, Education Road, Sector 15, Noida - 201301, India<br />
              Phone: +91 120 456 7890 | Email: info@brightfuture.edu.in<br />
              Website: www.brightfuture.edu.in
            </p>
          </div>
        </div>

        <div className="bf-inv-meta">
          <h1 className="bf-inv-title">INVOICE</h1>
          <span className="bf-inv-subtitle">FEE RECEIPT</span>
          <table className="bf-meta-table">
            <tbody>
              <tr>
                <td>Invoice No</td>
                <td>:</td>
                <td><strong>BFIT/2026/1048</strong></td>
              </tr>
              <tr>
                <td>Invoice Date</td>
                <td>:</td>
                <td>25 Oct 2026</td>
              </tr>
              <tr>
                <td>Due Date</td>
                <td>:</td>
                <td>10 Nov 2026</td>
              </tr>
              <tr>
                <td>Academic Year</td>
                <td>:</td>
                <td>2026 - 2027</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* BILL TO Bar */}
      <div className="bf-banner-bar">BILL TO</div>
      <div className="bf-billto-grid">
        <div className="bf-billto-col">
          <div className="bf-kv">
            <span>Student Name</span>
            <span>:</span>
            <strong>Aditya Paswan</strong>
          </div>
          <div className="bf-kv">
            <span>Enrollment No</span>
            <span>:</span>
            <span>BFIT20260124</span>
          </div>
          <div className="bf-kv">
            <span>Course</span>
            <span>:</span>
            <span>BCA (Bachelor of Computer Applications)</span>
          </div>
        </div>
        <div className="bf-billto-col">
          <div className="bf-kv">
            <span>Year / Semester</span>
            <span>:</span>
            <span>1st Year / 1st Semester</span>
          </div>
          <div className="bf-kv">
            <span>Address</span>
            <span>:</span>
            <span>House No. 45, Patel Nagar, New Delhi - 110008</span>
          </div>
        </div>
      </div>

      {/* Particulars Table */}
      <table className="bf-table">
        <thead>
          <tr>
            <th style={{ width: '8%', textAlign: 'center' }}>S.No.</th>
            <th style={{ width: '64%' }}>Particulars</th>
            <th style={{ width: '28%', textAlign: 'right' }}>Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center' }}>1</td>
            <td>Tuition Fee</td>
            <td className="num">35,000.00</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>2</td>
            <td>Registration Fee</td>
            <td className="num">2,000.00</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>3</td>
            <td>Library & Learning Resources</td>
            <td className="num">1,500.00</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>4</td>
            <td>Examination Fee</td>
            <td className="num">2,500.00</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>5</td>
            <td>Student Development Fee</td>
            <td className="num">1,000.00</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="total-lbl">Total Amount (INR)</td>
            <td className="total-val">42,000.00</td>
          </tr>
        </tfoot>
      </table>

      {/* Payment Details & QR Code / Signatory */}
      <div className="bf-inv-bottom">
        <div className="bf-bottom-left">
          <div className="bf-banner-bar sub">PAYMENT DETAILS</div>
          <div className="bf-payment-rows">
            <div className="bf-kv"><span>Payment Mode</span><span>:</span><span>Online Transfer / UPI / Card / Cash</span></div>
            <div className="bf-kv"><span>Bank Name</span><span>:</span><span>HDFC Bank</span></div>
            <div className="bf-kv"><span>Account Name</span><span>:</span><span>Bright Future Institute of Technology</span></div>
            <div className="bf-kv"><span>Account No.</span><span>:</span><span>5020 1234 5678 90</span></div>
            <div className="bf-kv"><span>IFSC Code</span><span>:</span><span>HDFC0001234</span></div>
          </div>

          {!compact && (
            <>
              <div className="bf-banner-bar sub">Terms & Conditions</div>
              <ol className="bf-terms-list">
                <li>This fee is non-refundable except as per institute policy.</li>
                <li>Please mention your Enrollment No. while making the payment.</li>
                <li>This is a computer generated invoice and does not require a physical signature.</li>
                <li>For any queries, contact our accounts department at accounts@brightfuture.edu.in.</li>
              </ol>
            </>
          )}
        </div>

        <div className="bf-bottom-right">
          <div className="bf-qr-card">
            <span className="bf-qr-label">Scan to Pay</span>
            <svg className="bf-qr-code" viewBox="0 0 100 100" fill="#000000">
              <rect x="5" y="5" width="26" height="26" rx="2" fill="none" stroke="#000" strokeWidth="4" />
              <rect x="11" y="11" width="14" height="14" rx="1" fill="#000" />
              <rect x="69" y="5" width="26" height="26" rx="2" fill="none" stroke="#000" strokeWidth="4" />
              <rect x="75" y="11" width="14" height="14" rx="1" fill="#000" />
              <rect x="5" y="69" width="26" height="26" rx="2" fill="none" stroke="#000" strokeWidth="4" />
              <rect x="11" y="75" width="14" height="14" rx="1" fill="#000" />
              <rect x="36" y="8" width="5" height="5" />
              <rect x="46" y="8" width="5" height="5" />
              <rect x="56" y="8" width="5" height="5" />
              <rect x="36" y="18" width="5" height="5" />
              <rect x="46" y="18" width="5" height="5" />
              <rect x="56" y="18" width="5" height="5" />
              <rect x="8" y="36" width="5" height="5" />
              <rect x="18" y="36" width="5" height="5" />
              <rect x="28" y="36" width="5" height="5" />
              <rect x="38" y="36" width="5" height="5" />
              <rect x="48" y="36" width="5" height="5" />
              <rect x="58" y="36" width="5" height="5" />
              <rect x="68" y="36" width="5" height="5" />
              <rect x="78" y="36" width="5" height="5" />
              <rect x="88" y="36" width="5" height="5" />
              <rect x="38" y="46" width="5" height="5" />
              <rect x="48" y="46" width="5" height="5" />
              <rect x="58" y="46" width="5" height="5" />
              <rect x="68" y="46" width="5" height="5" />
              <rect x="38" y="56" width="5" height="5" />
              <rect x="48" y="56" width="5" height="5" />
              <rect x="58" y="56" width="5" height="5" />
              <rect x="78" y="56" width="5" height="5" />
              <rect x="38" y="68" width="5" height="5" />
              <rect x="48" y="68" width="5" height="5" />
              <rect x="58" y="68" width="5" height="5" />
              <rect x="68" y="68" width="5" height="5" />
              <rect x="78" y="68" width="5" height="5" />
              <rect x="88" y="68" width="5" height="5" />
              <rect x="38" y="78" width="5" height="5" />
              <rect x="58" y="78" width="5" height="5" />
              <rect x="78" y="78" width="5" height="5" />
              <rect x="48" y="88" width="5" height="5" />
              <rect x="68" y="88" width="5" height="5" />
              <rect x="88" y="88" width="5" height="5" />
            </svg>
            <span className="bf-upi-id">UPI ID: bfit@hdfcbank</span>
          </div>

          <div className="bf-stamp-sign-row">
            <div className="bf-official-stamp">
              <div className="stamp-inner">
                <span>★ NOIDA ★</span>
                <strong>BFIT</strong>
                <span>APPROVED</span>
              </div>
            </div>
            <div className="bf-signature-box">
              <svg className="bf-sig-svg" viewBox="0 0 100 35" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 25 C 15 10, 22 30, 30 18 S 45 5, 52 22 Q 62 12, 75 19 T 92 12" />
                <path d="M15 28 L 85 24" strokeWidth="1.2" opacity="0.8" />
              </svg>
              <span className="bf-sig-label">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
