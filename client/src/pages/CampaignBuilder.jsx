import React, { useState } from 'react';
import { buildSegment, generateCampaignContent, launchCampaign } from '../services/api';
import { Sparkles, Send, Target, MessageSquare, AlertCircle, Edit3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const inputCls = `w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-colors`;
const inputStyle = { background:'#FFF8F4', borderColor:'#F1E3DA', color:'#2D2A26' };

const CHANNELS = ['Email','WhatsApp','SMS','RCS'];

const CampaignBuilder = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const segmentFromAudience = location.state?.segmentQuery;
  const [goal, setGoal]       = useState(location.state?.segmentPrompt || '');
  const [loading, setLoading] = useState(false);
  const [launching, setLaunch]= useState(false);
  const [campaign, setCampaign] = useState(null);
  const [error, setError]     = useState('');

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await generateCampaignContent(goal);
      setCampaign(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating campaign. Is the server running?');
    } finally { setLoading(false); }
  };

  const handleLaunch = async () => {
    setLaunch(true); setError('');
    try {
      let targetSegment = segmentFromAudience;
      if (!targetSegment) {
        const segRes = await buildSegment(campaign.targetSegmentDescription);
        targetSegment = segRes?.data?.query;
      }
      await launchCampaign({ name:campaign.name, goal, subjectLine:campaign.subjectLine,
        message:campaign.message, channel:campaign.recommendedChannel, targetSegment });
      navigate('/campaigns');
    } catch (err) {
      setError(err.response?.data?.message || 'Error launching campaign. Is the server running?');
    } finally { setLaunch(false); }
  };

  return (
    <div className="max-w-3xl space-y-6 page-enter">

      {!campaign ? (
        /* ── Goal input ── */
        <div className="rounded-2xl border p-8 text-center" style={{ background:'#fff', borderColor:'#F1E3DA' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background:'linear-gradient(135deg,#FFD6C8,#FFF1E8)' }}>
            <Target size={30} style={{ color:'#F28C6F' }} />
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color:'#2D2A26' }}>What is your campaign goal?</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color:'#7A736E' }}>
            Describe what you want to achieve — AI will write the campaign name, subject line, message, and pick the best channel.
          </p>

          <textarea rows={3}
            className="w-full text-sm px-4 py-3 rounded-xl border outline-none resize-none max-w-lg mx-auto block transition-colors"
            style={{ ...inputStyle }}
            placeholder='e.g. "Win back inactive customers with a 20% discount"'
            value={goal} onChange={e => setGoal(e.target.value)}
            onFocus={e => e.target.style.borderColor='#F28C6F'}
            onBlur={e => e.target.style.borderColor='#F1E3DA'}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
          />

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl mt-4 max-w-lg mx-auto border"
                style={{ background:'#FFF1E8', borderColor:'#FFD6C8', color:'#E07355' }}>
                <AlertCircle size={15} />{error}
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={handleGenerate} disabled={loading || !goal.trim()}
            className="mt-5 flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white mx-auto transition-all active:scale-95 disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#F28C6F,#E07355)' }}>
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> AI is crafting your campaign…</>
            ) : (
              <><Sparkles size={15} /> Generate Campaign</>
            )}
          </button>
        </div>

      ) : (
        /* ── Generated campaign ── */
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="rounded-2xl border overflow-hidden" style={{ background:'#fff', borderColor:'#F1E3DA' }}>

          {/* Header */}
          <div className="px-6 py-4 border-b flex items-start justify-between"
            style={{ borderColor:'#F1E3DA', background:'linear-gradient(135deg,#FFF8F4,#FFF1E8)' }}>
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles size={14} style={{ color:'#F28C6F' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color:'#F28C6F' }}>AI Generated</span>
            </div>
            <div className="flex items-center gap-2 border rounded-xl px-3 py-1.5"
              style={{ borderColor:'#F1E3DA', background:'#fff' }}>
              <MessageSquare size={14} style={{ color:'#7A736E' }} />
              <select value={campaign.recommendedChannel}
                onChange={e => setCampaign({ ...campaign, recommendedChannel:e.target.value })}
                className="text-sm font-medium bg-transparent border-none outline-none" style={{ color:'#2D2A26' }}>
                {CHANNELS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Campaign name */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color:'#B8AFA9' }}>Campaign Name</label>
              <div className="relative">
                <input type="text" value={campaign.name}
                  onChange={e => setCampaign({ ...campaign, name:e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-base font-bold border outline-none transition-colors pr-10"
                  style={{ ...inputStyle, fontSize:'1.1rem' }}
                  onFocus={e => e.target.style.borderColor='#F28C6F'}
                  onBlur={e => e.target.style.borderColor='#F1E3DA'} />
                <Edit3 size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'#B8AFA9' }} />
              </div>
            </div>

            {/* Subject line */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color:'#B8AFA9' }}>Subject Line</label>
              <input type="text" value={campaign.subjectLine}
                onChange={e => setCampaign({ ...campaign, subjectLine:e.target.value })}
                className={inputCls} style={inputStyle}
                onFocus={e => e.target.style.borderColor='#F28C6F'}
                onBlur={e => e.target.style.borderColor='#F1E3DA'} />
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color:'#B8AFA9' }}>Message Body</label>
              <textarea rows={5} value={campaign.message}
                onChange={e => setCampaign({ ...campaign, message:e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none transition-colors"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor='#F28C6F'}
                onBlur={e => e.target.style.borderColor='#F1E3DA'} />
              <p className="text-xs mt-1" style={{ color:'#B8AFA9' }}>Use [Name] as a placeholder for the customer's name.</p>
            </div>

            {/* Target audience */}
            <div className="p-4 rounded-xl border" style={{ background:'#F0FDF4', borderColor:'#C6E8C2' }}>
              <p className="text-xs font-semibold mb-1" style={{ color:'#5A9A52' }}>Target Audience</p>
              <p className="text-sm" style={{ color:'#2D6A2A' }}>{campaign.targetSegmentDescription}</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                  className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl border"
                  style={{ background:'#FFF1E8', borderColor:'#FFD6C8', color:'#E07355' }}>
                  <AlertCircle size={15} />{error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor:'#F1E3DA' }}>
              <button onClick={() => setCampaign(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor:'#F1E3DA', color:'#7A736E' }}
                onMouseEnter={e => e.currentTarget.style.background='#FFF8F4'}
                onMouseLeave={e => e.currentTarget.style.background=''}>
                Discard
              </button>
              <button onClick={handleLaunch} disabled={launching}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background:'linear-gradient(135deg,#F28C6F,#E07355)' }}>
                {launching ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Launching…</>
                ) : (
                  <><Send size={15} /> Launch Campaign</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CampaignBuilder;
