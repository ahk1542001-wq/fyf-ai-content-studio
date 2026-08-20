'use client';

import { useState } from 'react';
import { PenSquare, Send, Zap, MessageSquare, Briefcase, FileText } from 'lucide-react';

export default function CreateContentPage() {
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [format, setFormat] = useState('');
  const [tone, setTone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple alert for now before API integration
    alert(`Draft generated for: ${topic}\nGoal: ${goal}\nFormat: ${format}\nTone: ${tone}`);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 sm:p-8 font-sans text-neutral-900">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 sm:p-10">

        {/* Header */}
        <div className="mb-10 flex items-start gap-4">
          <div className="p-3 bg-neutral-900 rounded-xl text-white shrink-0">
            <PenSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Create New Content</h1>
            <p className="text-neutral-500 text-sm mt-1.5 leading-relaxed">
              Define your brief below. The Maker Agent will generate a draft based on these parameters, and the Checker Agent will review it.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Topic / Brief */}
          <div className="space-y-2">
            <label htmlFor="topic" className="block text-sm font-medium text-neutral-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              What are we writing about?
            </label>
            <textarea
              id="topic"
              rows={4}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all resize-none shadow-sm placeholder:text-neutral-400"
              placeholder="e.g., A post about how AI can automate customer support for e-commerce businesses in Myanmar..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label htmlFor="goal" className="block text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-neutral-400" />
                Primary Goal
              </label>
              <div className="relative">
                <select
                  id="goal"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all shadow-sm appearance-none cursor-pointer"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a goal...</option>
                  <option value="engagement">Drive Engagement</option>
                  <option value="education">Educate Audience</option>
                  <option value="sales">Generate Leads</option>
                  <option value="brand_awareness">Brand Awareness</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="format" className="block text-sm font-medium text-neutral-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                Content Format
              </label>
              <div className="relative">
                <select
                  id="format"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all shadow-sm appearance-none cursor-pointer"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a format...</option>
                  <option value="short_post">Short Facebook Post</option>
                  <option value="long_post">Long Facebook Post</option>
                  <option value="thread">Thread / Carousel Concept</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="tone" className="block text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-neutral-400" />
                Tone of Voice
              </label>
              <div className="relative">
                <select
                  id="tone"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all shadow-sm appearance-none cursor-pointer"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  required
                >
                  <option value="" disabled>Select tone...</option>
                  <option value="professional">Professional & Authoritative</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="conversational">Conversational & Engaging</option>
                  <option value="direct">Direct & Punchy</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 shadow-sm ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initializing Agents...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Draft
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
