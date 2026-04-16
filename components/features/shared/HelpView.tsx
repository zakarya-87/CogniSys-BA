
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Book, MessageSquare, Zap, ExternalLink, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../ui/Button';

export const HelpView: React.FC = () => {
    const { t } = useTranslation(['dashboard']);

    const resources = [
        { title: 'Platform Basics', desc: 'Core concepts and interface guide.', icon: Book, color: 'text-accent-blue' },
        { title: 'AI Engineering', desc: 'Understanding the Hive and Oracle.', icon: Zap, color: 'text-accent-purple' },
        { title: 'Strategic Analysis', desc: 'Running Monte Carlo and Risk audits.', icon: HelpCircle, color: 'text-accent-emerald' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20">
                    <span className="text-[10px] font-black text-accent-purple uppercase tracking-[0.2em]">Support Centre</span>
                </div>
                <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">How can we assist?</h1>
                <p className="text-lg text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto font-medium">
                    Explore our documentation or connect with our AI-native support engineering team.
                </p>
                <div className="max-w-xl mx-auto relative mt-8 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted-light/40 group-focus-within:text-accent-purple transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search for guides, articles, or components..." 
                        className="w-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl pl-14 pr-6 py-5 text-base focus:ring-4 focus:ring-accent-purple/10 outline-none transition-all shadow-xl"
                    />
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resources.map(res => (
                    <div key={res.title} className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer group">
                        <div className={`p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 w-fit mb-6 group-hover:bg-accent-purple/10 transition-colors`}>
                            <res.icon className={`h-6 w-6 ${res.color}`} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{res.title}</h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-6">{res.desc}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-accent-purple uppercase tracking-widest">
                            READ GUIDE
                            <ChevronRight className="h-3 w-3" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Support Channels */}
            <div className="bg-gradient-to-br from-indigo-600 to-accent-purple rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl shadow-accent-purple/30">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <MessageSquare className="h-64 w-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-black mb-4">Direct Engineering Support</h2>
                        <p className="text-white/80 leading-relaxed mb-8">
                            Need technical assistance? Our engineers are available for architecture reviews and deep-dives into your analysis results.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button className="bg-white text-accent-purple hover:bg-white/90 font-black px-8 h-14 rounded-2xl shadow-xl">
                                START LIVE CHAT
                            </Button>
                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-black px-8 h-14 rounded-2xl bg-white/5">
                                VIEW SYSTEM STATUS
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Discord Community', link: 'Join 2k members' },
                            { label: 'GitHub Repository', link: 'Report a bug' },
                            { label: 'Documentation', link: 'API References' },
                            { label: 'Video Tutorials', link: 'Watch on YouTube' },
                        ].map(item => (
                            <div key={item.label} className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl hover:bg-white/20 transition-all cursor-pointer group">
                                <h4 className="text-xs font-black uppercase tracking-widest mb-1">{item.label}</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/60">{item.link}</span>
                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Preview */}
            <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase text-text-muted-light dark:text-text-muted-dark tracking-[0.3em] text-center">Frequently Asked Questions</h3>
                <div className="space-y-3">
                    {[
                        'How safe is my data with CogniSys?',
                        'Can I export my strategic artifacts?',
                        'Does the AI have access to my local files?',
                        'How do I invite my investment board?',
                    ].map(q => (
                        <div key={q} className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl flex items-center justify-between group hover:border-accent-purple/50 cursor-pointer transition-all">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{q}</span>
                            <ChevronRight className="h-4 w-4 text-text-muted-light group-hover:text-accent-purple transition-colors" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center pt-8">
                <p className="text-xs text-text-muted-light/60 font-medium">
                    CogniSys BA Version 4.2.1-stable. Build 2025.04.10.
                </p>
            </div>
        </div>
    );
};
