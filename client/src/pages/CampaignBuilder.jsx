import React, { useState } from 'react';
import { buildSegment, generateCampaignContent, launchCampaign } from '../services/api';
import { Sparkles, Send, Target, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const CampaignBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const segmentFromAudience = location.state?.segmentQuery;
  const [goal, setGoal] = useState(location.state?.segmentPrompt || '');
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!goal) return;
    setLoading(true);
    setError('');
    try {
      const res = await generateCampaignContent(goal);
      setCampaign(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating campaign. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async () => {
    setLaunching(true);
    setError('');
    try {
      let targetSegment = segmentFromAudience;
      if (!targetSegment) {
        const segmentResponse = await buildSegment(campaign.targetSegmentDescription);
        targetSegment = segmentResponse?.data?.query;
      }
      await launchCampaign({
        name: campaign.name,
        goal,
        subjectLine: campaign.subjectLine,
        message: campaign.message,
        channel: campaign.recommendedChannel,
        targetSegment,
      });
      navigate('/campaigns');
    } catch (err) {
      setError(err.response?.data?.message || 'Error launching campaign. Make sure the server is running.');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-500">AI Campaign Builder</h1>
        <p className="text-sm text-amber-700 mt-1">Tell AI what you want to achieve, and it will craft the perfect campaign.</p>
      </div>

      {!campaign ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target size={32} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-black dark:text-white mb-2">What is your campaign goal?</h2>
          <p className="text-sm text-black/60 dark:text-white/70 mb-6 max-w-lg mx-auto">
            Describe what you want to achieve. E.g., "Bring back inactive customers with a 20% discount" or "Promote our new summer collection to high spenders."
          </p>

          <div className="max-w-xl mx-auto relative mb-4">
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-700 text-black dark:text-white placeholder-slate-400 dark:placeholder-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl p-4 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all min-h-[100px] resize-none"
              placeholder="Type your goal here..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>

          {error && (
            <div className="max-w-xl mx-auto mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !goal}
            className="bg-indigo-400 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium shadow-sm transition-all disabled:opacity-50 flex items-center mx-auto"
          >
            {loading ? 'AI is crafting your campaign...' : (
              <><Sparkles size={20} className="mr-2" />Generate Campaign</>
            )}
          </button>
        </div>

      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-black/50 dark:text-white/60 mb-1 flex items-center">
                  <Sparkles size={12} className="mr-1" /> AI Generated
                </p>
                <input
                  type="text"
                  value={campaign.name}
                  onChange={e => setCampaign({ ...campaign, name: e.target.value })}
                  className="text-2xl font-bold text-black dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                />
              </div>
              <div className="bg-white dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center">
                <MessageSquare size={18} className="mr-2 text-black dark:text-white" />
                <select
                  value={campaign.recommendedChannel}
                  onChange={e => setCampaign({ ...campaign, recommendedChannel: e.target.value })}
                  className="bg-transparent border-none outline-none font-medium text-black dark:text-white cursor-pointer"
                >
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="RCS">RCS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Subject Line</label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-700 text-black dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-400"
                value={campaign.subjectLine}
                onChange={e => setCampaign({ ...campaign, subjectLine: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Message Content</label>
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-700 text-black dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg p-4 outline-none focus:ring-2 focus:ring-indigo-400 min-h-[150px] resize-none"
                value={campaign.message}
                onChange={e => setCampaign({ ...campaign, message: e.target.value })}
              />
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-400/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-400/30">
              <h3 className="text-sm font-bold text-indigo-700 dark:text-white mb-1">Target Audience</h3>
              <p className="text-sm text-indigo-600 dark:text-white/80">{campaign.targetSegmentDescription}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              {error && (
                <div className="flex-1 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <AlertCircle size={16} />{error}
                </div>
              )}
              <button
                onClick={() => setCampaign(null)}
                className="px-6 py-2 rounded-lg font-medium text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="bg-indigo-400 hover:bg-indigo-500 text-white px-8 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center disabled:opacity-50"
              >
                {launching ? 'Launching...' : (
                  <><Send size={18} className="mr-2" />Launch Campaign</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignBuilder;
