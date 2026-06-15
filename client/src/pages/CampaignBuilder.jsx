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
        targetSegment
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
        <h1 className="text-2xl font-bold dark:text-black">AI Campaign Builder</h1>
        <p className="dark:text-black-800">Tell AI what you want to achieve, and it will craft the perfect campaign.</p>
      </div>

      {!campaign ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-red-100 dark:border-gray-700 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-white">
            <Target size={32} className="dark:" />
          </div>
          <h2 className="text-xl font-bold dark: mb-2">What is your campaign goal?</h2>
          <p className="dark: mb-6 max-w-lg mx-auto">
            Describe what you want to achieve. E.g., "Bring back inactive customers with a 20% discount" or "Promote our new summer collection to high spenders."
          </p>
          
          <div className="max-w-xl mx-auto relative mb-4">
            <textarea
              className="w-full bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all min-h-25 resize-none"
              placeholder='Type your goal here...'
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            ></textarea>
          </div>

          {error && (
            <div className="max-w-xl mx-auto mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading || !goal}
            className="bg-red-600 hover:bg-red-700   px-8 py-3 rounded-xl font-medium shadow-sm transition-all disabled:opacity-50 flex items-center mx-auto text-white"
          >
            {loading ? 'AI is crafting your campaign...' : (
              <>
                <Sparkles size={20} className="mr-2" />
                Generate Campaign
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-red-200 dark:border-gray-700 bg-linear-to-r from-red-50 to-indigo-50 dark:from-red-800 dark:to-red-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium dark: mb-1 flex items-center">
                  <Sparkles size={14} className="mr-1" /> AI Generated
                </p>
                <h2 className="text-2xl font-bold dark:">
                  <input 
                    type="text" 
                    value={campaign.name} 
                    onChange={e => setCampaign({...campaign, name: e.target.value})}
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                  />
                </h2>
              </div>
              <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-lg border border-red-200 dark:border-red-600 flex items-center">
                <MessageSquare size={18} className="mr-2" />
                <select 
                  value={campaign.recommendedChannel}
                  onChange={e => setCampaign({...campaign, recommendedChannel: e.target.value})}
                  className="bg-transparent border-none outline-none font-medium dark:"
                >
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="RCS">RCS</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium dark: mb-2">Subject Line</label>
              <input 
                type="text"
                className="w-full bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 rounded-lg p-3   dark: text-white"
                value={campaign.subjectLine}
                onChange={e => setCampaign({...campaign, subjectLine: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium dark: mb-2">Message Content</label>
              <textarea 
                className="w-full bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 rounded-lg p-4   dark:  min-h-37.5 text-white"
                value={campaign.message}
                onChange={e => setCampaign({...campaign, message: e.target.value})}
              ></textarea>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
              <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-1">Target Audience</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">{campaign.targetSegmentDescription}</p>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-red-200 dark:border-gray-700">
              {error && (
                <div className="flex-1 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <AlertCircle size={16} />{error}
                </div>
              )}
              <button 
                onClick={() => setCampaign(null)}
                className="px-6 py-2 rounded-lg font-medium hover:bg-red-100 dark: dark:hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleLaunch}
                disabled={launching}
                className="bg-red-600 hover:bg-red-700   px-8 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center disabled:opacity-50 text-white"
              >
                {launching ? 'Launching...' : (
                  <>
                    <Send size={18} className="mr-2" />
                    Launch Campaign
                  </>
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
