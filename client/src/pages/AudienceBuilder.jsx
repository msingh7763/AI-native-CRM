import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSegment } from '../services/api';
import { Sparkles, Users, Code2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  'High value customers from Delhi',
  "Haven't ordered in 60 days",
  'Customers who spent more than ₹10000',
  'Recent buyers from Mumbai',
];

const AudienceBuilder = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt]   = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleBuild = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await buildSegment(prompt);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error building segment. Make sure the server is running.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl space-y-6 page-enter">

      {/* Input card */}
      <div className="rounded-2xl border p-6" style={{ background:'#fff', borderColor:'#F1E3DA' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'#FFD6C8' }}>
            <Sparkles size={16} style={{ color:'#F28C6F' }} />
          </div>
          <h2 className="text-base font-bold" style={{ color:'#2D2A26' }}>Describe your audience</h2>
        </div>
        <p className="text-sm mb-5 ml-10" style={{ color:'#7A736E' }}>
          Plain English — AI builds the MongoDB query.
        </p>

        <textarea
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none transition-colors"
          style={{ background:'#FFF8F4', borderColor: error ? '#F28C6F' : '#F1E3DA', color:'#2D2A26' }}
          placeholder='e.g. "Customers who spent more than ₹5000 and haven't ordered in 60 days"'
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onFocus={e => e.target.style.borderColor='#F28C6F'}
          onBlur={e => e.target.style.borderColor= error ? '#F28C6F' : '#F1E3DA'}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleBuild())}
        />

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mt-3 mb-5">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setPrompt(s)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ background:'#FFF8F4', borderColor:'#F1E3DA', color:'#7A736E' }}
              onMouseEnter={e => { e.currentTarget.style.background='#FFD6C8'; e.currentTarget.style.borderColor='#F28C6F'; e.currentTarget.style.color='#E07355'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#FFF8F4'; e.currentTarget.style.borderColor='#F1E3DA'; e.currentTarget.style.color='#7A736E'; }}
            >
              {s}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4 border"
              style={{ background:'#FFF1E8', borderColor:'#FFD6C8', color:'#E07355' }}>
              <AlertCircle size={15} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={handleBuild} disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background:'linear-gradient(135deg,#F28C6F,#E07355)' }}>
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing…</>
          ) : (
            <><Sparkles size={15} /> Generate Segment</>
          )}
        </button>
      </div>

      {/* Result card */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="rounded-2xl border overflow-hidden" style={{ background:'#fff', borderColor:'#F1E3DA' }}>

            {/* Result header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor:'#F1E3DA', background:'#FFF8F4' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#F28C6F,#A8C3A0)' }}>
                  <Users size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color:'#2D2A26' }}>{result.audienceCount.toLocaleString()} customers found</p>
                  <p className="text-xs" style={{ color:'#7A736E' }}>Ready to target</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background:'#F0FDF4', color:'#5A9A52' }}>
                ✓ Segment ready
              </span>
            </div>

            {/* MongoDB query */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Code2 size={13} style={{ color:'#B8AFA9' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color:'#B8AFA9' }}>Generated MongoDB Query</span>
              </div>
              <pre className="p-4 rounded-xl text-xs overflow-x-auto" style={{ background:'#FFF8F4', border:'1px solid #F1E3DA', color:'#2D2A26', lineHeight:1.6 }}>
                {JSON.stringify(result.query, null, 2)}
              </pre>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 flex justify-end">
              <button
                onClick={() => navigate('/campaigns/new', { state:{ segmentPrompt:prompt, segmentQuery:result.query } })}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background:'linear-gradient(135deg,#F28C6F,#E07355)' }}
              >
                Create Campaign for this Segment
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudienceBuilder;
