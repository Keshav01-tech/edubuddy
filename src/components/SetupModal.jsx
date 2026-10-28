import React, { useState, useEffect } from 'react';
import { getSupabaseConfig, updateSupabaseCredentials, clearSupabaseCredentials } from '../services/supabase';
import { getOpenAIConfig, updateOpenAIKey, clearOpenAIKey } from '../services/openai';
import { Key, Database, RefreshCw, Check, AlertCircle, X } from 'lucide-react';
import { Button } from './Button';
import { Alert } from './Alert';

export const SetupModal = ({ isOpen, onClose }) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  
  const [sbConfig, setSbConfig] = useState({ url: '', key: '', isEnv: false });
  const [openaiConfig, setOpenaiConfig] = useState({ key: '', isEnv: false });
  
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sb = getSupabaseConfig();
    const ai = getOpenAIConfig();
    
    setSbConfig(sb);
    setOpenaiConfig(ai);
    
    setSupabaseUrl(sb.url || '');
    setSupabaseKey(sb.key || '');
    setOpenaiKey(ai.key || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        throw new Error('Supabase URL must start with https://');
      }
      
      // Save local credentials
      if (!sbConfig.isEnv) {
        updateSupabaseCredentials(supabaseUrl, supabaseKey);
      }
      if (!openaiConfig.isEnv) {
        updateOpenAIKey(openaiKey);
      }
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your saved credentials? This will sign you out and clean your local study files.')) {
      clearSupabaseCredentials();
      clearOpenAIKey();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] p-5 sm:p-6 overflow-y-auto overscroll-contain bg-white border border-stone-200 rounded-2xl shadow-card">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-stone-400" />
              Settings
            </h3>
            <p className="text-stone-400 text-xs mt-1">API credentials for generating tests</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="h-10 w-10 -mr-2 grid place-items-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && <Alert type="error" message={error} className="mt-4" onClose={() => setError('')} />}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          
          {/* Supabase Section */}
          <div className="p-4 border border-slate-100 bg-slate-50 rounded-2xl">
            <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-emerald-500" />
              1. Supabase Database Configuration
            </h4>
            
            {sbConfig.isEnv ? (
              <p className="text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                Database keys loaded securely from env (.env file)
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 text-xs font-semibold mb-1">SUPABASE URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://yourproject.supabase.co"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs font-semibold mb-1">SUPABASE ANON KEY</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  * If left blank, the app runs in <strong>offline demo mode</strong>. Your files and chats are saved locally in the browser!
                </p>
              </div>
            )}
          </div>

          {/* OpenAI Section */}
          <div className="p-4 border border-slate-100 bg-slate-50 rounded-2xl">
            <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-amber-500" />
              2. OpenAI (GPT-6 Luna) Configuration
            </h4>
            
            {openaiConfig.isEnv ? (
              <p className="text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                OpenAI API Key loaded securely from env (.env file)
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 text-xs font-semibold mb-1">OPENAI API KEY</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  * An OpenAI API key is required to generate tests from the NCERT textbooks. Create one on the{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 font-medium underline"
                  >
                    OpenAI platform
                  </a>.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {(!sbConfig.isEnv || !openaiConfig.isEnv) && (
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={saved}
              >
                {saved ? <Check className="w-4 h-4 mr-1 animate-ping" /> : null}
                {saved ? 'Saved!' : 'Save Credentials'}
              </Button>
            )}
            
            {!sbConfig.isEnv && !openaiConfig.isEnv && (supabaseUrl || supabaseKey || openaiKey) && (
              <Button
                onClick={handleClear}
                variant="secondary"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                Reset
              </Button>
            )}
            
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
