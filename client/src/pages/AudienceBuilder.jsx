import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSegment } from '../services/api';
import { Sparkles, Users, Code, AlertCircle } from 'lucide-react';

const AudienceBuilder = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuild = async () => {
    if (!prompt) return;
    setLoading(true);
    setError('');
    try {
      const res = await buildSegment(prompt);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error building segment. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">AI Audience Builder</h1>
        <p className="text-sm text-black/60 dark:text-white/70 mt-1">Describe your target audience in plain English, and AI will build the segment.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <label className="block text-sm font-medium text-black dark:text-white mb-2">
          Who do you want to target?
        </label>
        <div className="relative">
          <textarea
            className="w-full bg-slate-50 dark:bg-slate-700 text-black dark:text-white placeholder-slate-400 dark:placeholder-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg p-4 pl-12 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all min-h-[120px] resize-none"
            placeholder="e.g., 'Customers who spent more than ₹5000 and haven't ordered in 60 days'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Sparkles className="absolute top-4 left-4 text-black/40 dark:text-white/40" size={20} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 mb-6">
          <span className="text-xs font-medium text-black dark:text-white py-1">Try:</span>
          {['High value customers from Delhi', 'Customers likely to churn', "Haven't bought in 3 months"].map(suggestion => (
            <button
              key={suggestion}
              onClick={() => setPrompt(suggestion)}
              className="text-xs text-black dark:text-white bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle size={16} />{error}
          </div>
        )}

        <button
          onClick={handleBuild}
          disabled={loading || !prompt}
          className="w-full bg-indigo-400 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? 'Analyzing data...' : (
            <>
              <Sparkles size={18} className="mr-2" />
              Generate Segment
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black dark:text-white flex items-center">
              <Users size={24} className="mr-2 text-indigo-400" />
              {result.audienceCount} Customers Found
            </h2>
            <div className="bg-indigo-400 text-white px-3 py-1 rounded-full text-sm font-medium">
              Ready to Target
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-600 font-mono text-sm overflow-x-auto text-black dark:text-white">
            <div className="flex items-center text-xs mb-2 font-sans text-black/60 dark:text-white/60">
              <Code size={14} className="mr-1" /> Generated MongoDB Query
            </div>
            {JSON.stringify(result.query, null, 2)}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => navigate('/campaigns/new', { state: { segmentPrompt: prompt, segmentQuery: result.query } })}
              className="bg-indigo-400 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              Create Campaign for this Segment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudienceBuilder;
