import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Upload,
  Trash2,
  Check,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom } from '../services/classroom';

const field = 'w-full h-11 px-3.5 text-sm bg-white rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400 text-slate-800 transition-shadow';

export default function Profile() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => ({
    name: room.institute?.name || '',
    tagline: room.institute?.tagline || '',
    address: room.institute?.address || '',
    city: room.institute?.city || '',
    state: room.institute?.state || '',
    pincode: room.institute?.pincode || '',
    phone: room.institute?.phone || '',
    email: room.institute?.email || '',
    website: room.institute?.website || '',
    logo: room.institute?.logo || '',
    principalName: room.institute?.principalName || '',
    receiptPrefix: room.institute?.receiptPrefix || 'REC',
  }));

  const [savedNotice, setSavedNotice] = useState(false);
  const [logoError, setLogoError] = useState('');

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedNotice(false);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo file size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        update('logo', result);
      }
    };
    reader.onerror = () => {
      setLogoError('Could not read image file.');
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    update('logo', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    room.updateInstitute(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const fullAddress = [form.address, form.city, form.state && `${form.state} ${form.pincode}`]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-4xl"
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-16">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-brand-600" /> Institute Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Configure your coaching institute branding, logo, contact, and receipt details.
            </p>
          </div>
          {savedNotice && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 animate-fade-up">
              <Check className="w-4 h-4 text-emerald-600" /> Profile saved successfully!
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo & Identity Section */}
          <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-brand-600" /> Institute Logo & Brand
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Logo Preview */}
              <div className="relative group shrink-0">
                <div className="h-24 w-24 rounded-2xl ring-2 ring-slate-200/80 bg-slate-50 overflow-hidden grid place-items-center shadow-inner">
                  {form.logo ? (
                    <img
                      src={form.logo}
                      alt="Institute logo"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto stroke-[1.5]" />
                      <span className="text-[10px] font-medium block mt-1">No Logo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="sr-only"
                  onChange={handleLogoUpload}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {form.logo ? 'Change logo' : 'Upload logo'}
                  </button>
                  {form.logo && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="h-9 px-3 rounded-xl ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  PNG, JPG, or SVG. Square recommended (min. 200×200px).
                </p>
                {logoError && <p className="text-xs text-rose-600 font-medium">{logoError}</p>}
              </div>
            </div>

            {/* Name & Tagline */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Institute / Coaching Name <span className="text-rose-500">*</span>
                </span>
                <input
                  className={field}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Apex Coaching Institute"
                  required
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Tagline / Motto
                </span>
                <input
                  className={field}
                  value={form.tagline}
                  onChange={(e) => update('tagline', e.target.value)}
                  placeholder="e.g. Excellence in CBSE & Competitive Exams"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Director / Principal Name
                </span>
                <input
                  className={field}
                  value={form.principalName}
                  onChange={(e) => update('principalName', e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Receipt Series Prefix
                </span>
                <input
                  className={field}
                  value={form.receiptPrefix}
                  onChange={(e) => update('receiptPrefix', e.target.value.toUpperCase())}
                  placeholder="e.g. REC or FEE"
                  maxLength={6}
                />
              </label>
            </div>
          </section>

          {/* Contact Details */}
          <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-600" /> Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Primary Phone / WhatsApp <span className="text-rose-500">*</span>
                </span>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className={`${field} pl-9`}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Official Email Address
                </span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    className={`${field} pl-9`}
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="contact@institute.com"
                  />
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Website / Social Page
                </span>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className={`${field} pl-9`}
                    value={form.website}
                    onChange={(e) => update('website', e.target.value)}
                    placeholder="https://www.institute.com"
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Location & Address */}
          <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" /> Location & Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block sm:col-span-3">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  Street Address (Building, Street, Landmark)
                </span>
                <input
                  className={field}
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="e.g. 2nd Floor, Sai Complex, Near Metro Pillar 114"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">City</span>
                <input
                  className={field}
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="e.g. New Delhi"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">State</span>
                <input
                  className={field}
                  value={form.state}
                  onChange={(e) => update('state', e.target.value)}
                  placeholder="e.g. Delhi"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Pincode</span>
                <input
                  className={field}
                  value={form.pincode}
                  onChange={(e) => update('pincode', e.target.value)}
                  placeholder="e.g. 110001"
                  maxLength={6}
                />
              </label>
            </div>
          </section>

          {/* Live Preview Section */}
          <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Live Receipt Header Preview
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              This is how your institute header will appear on fee receipts and printed papers.
            </p>

            <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50/50 text-center">
              {form.logo && (
                <img
                  src={form.logo}
                  alt="Logo"
                  className="h-12 w-auto mx-auto object-contain mb-2"
                />
              )}
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {form.name || 'Your Institute Name'}
              </h3>
              {form.tagline && (
                <p className="text-xs text-slate-500 font-medium italic mt-0.5">
                  {form.tagline}
                </p>
              )}
              {fullAddress && (
                <p className="text-xs text-slate-600 mt-1">
                  {fullAddress}
                </p>
              )}
              {form.phone && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Phone: {form.phone} {form.email ? `· ${form.email}` : ''}
                </p>
              )}
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
