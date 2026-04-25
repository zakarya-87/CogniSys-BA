import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, FolderPlus, Rocket, ArrowRight, Check } from 'lucide-react';
import { useCatalyst } from '../context/CatalystContext';

interface OnboardingWizardProps {
    onComplete: (action?: 'dashboard' | 'settings') => void;
}

const SLIDE_VARIANTS = {
    enter: (direction: number) => ({
        x: direction > 0 ? 60 : -60,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
        x: direction < 0 ? 60 : -60,
        opacity: 0,
    }),
};

const StepDots: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                    i === current
                        ? 'w-6 h-2 bg-indigo-500'
                        : i < current
                        ? 'w-2 h-2 bg-indigo-400'
                        : 'w-2 h-2 border border-slate-600 bg-transparent'
                }`}
            />
        ))}
    </div>
);

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
    const { addOrganization, addProject, organizations, user, setCurrentView } = useCatalyst();

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [orgName, setOrgName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

    const goTo = (next: number) => {
        setDirection(next > step ? 1 : -1);
        setStep(next);
    };

    const handleCreateOrg = async () => {
        if (orgName.trim().length < 2) return;
        setLoading(true);
        try {
            const newOrg = await addOrganization({ name: orgName.trim(), ownerId: user?.id ?? '' });
            setCreatedOrgId(newOrg.id);
            goTo(1);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (projectName.trim().length < 2) return;
        // Find the org we just created by name (last match in case of duplicates)
        const org = [...organizations].reverse().find(o => o.name === orgName.trim());
        const orgId = org?.id ?? createdOrgId ?? '';
        if (org) setCreatedOrgId(org.id);
        setLoading(true);
        try {
            await addProject(orgId, {
                name: projectName.trim(),
                description: projectDescription.trim(),
                orgId,
            });
            goTo(2);
        } finally {
            setLoading(false);
        }
    };

    const handleGetStarted = (action?: 'settings') => {
        if (action === 'settings') {
            onComplete('settings');
        } else {
            onComplete('dashboard');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="p-8">
                    {/* Branding */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow shadow-indigo-500/30">
                            <span className="text-white font-bold text-sm">C</span>
                        </div>
                        <span className="text-slate-400 text-sm font-medium tracking-wide">COGNISYS</span>
                    </div>

                    <StepDots current={step} total={3} />

                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 0 && (
                            <motion.div
                                key="step-0"
                                custom={direction}
                                variants={SLIDE_VARIANTS}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Create Your Organisation</h2>
                                </div>
                                <p className="text-slate-400 text-sm mb-6 ml-13">Your workspace for all strategic initiatives</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Organisation name <span className="text-indigo-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={orgName}
                                            onChange={e => setOrgName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !loading && orgName.trim().length >= 2 && handleCreateOrg()}
                                            placeholder="e.g. Acme Corp"
                                            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            autoFocus
                                        />
                                        {orgName.length > 0 && orgName.trim().length < 2 && (
                                            <p className="mt-1.5 text-xs text-rose-400">Minimum 2 characters required</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleCreateOrg}
                                        disabled={loading || orgName.trim().length < 2}
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    >
                                        {loading ? (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        ) : (
                                            <>Create Organisation <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                custom={direction}
                                variants={SLIDE_VARIANTS}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                        <FolderPlus className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Name Your First Project</h2>
                                </div>
                                <p className="text-slate-400 text-sm mb-6">Projects group your initiatives by theme or workstream</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Project name <span className="text-indigo-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={e => setProjectName(e.target.value)}
                                            placeholder="e.g. Growth Initiative 2025"
                                            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            autoFocus
                                        />
                                        {projectName.length > 0 && projectName.trim().length < 2 && (
                                            <p className="mt-1.5 text-xs text-rose-400">Minimum 2 characters required</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Description <span className="text-slate-500">(optional)</span>
                                        </label>
                                        <textarea
                                            value={projectDescription}
                                            onChange={e => setProjectDescription(e.target.value)}
                                            placeholder="What is this project about?"
                                            rows={3}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => goTo(0)}
                                            disabled={loading}
                                            className="flex-none px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm font-medium"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleCreateProject}
                                            disabled={loading || projectName.trim().length < 2}
                                            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        >
                                            {loading ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                            ) : (
                                                <>Create Project <ArrowRight className="w-4 h-4" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                custom={direction}
                                variants={SLIDE_VARIANTS}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                        <Rocket className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Ready to go!</h2>
                                </div>

                                <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span className="text-slate-300 text-sm">Organisation: <span className="text-white font-semibold">{orgName}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span className="text-slate-300 text-sm">Project: <span className="text-white font-semibold">{projectName}</span></span>
                                    </div>
                                </div>

                                <p className="text-slate-400 text-sm mb-4 font-medium">What would you like to do next?</p>

                                <div className="space-y-2 mb-6">
                                    <button
                                        onClick={() => { setCurrentView('initiatives'); handleGetStarted(); }}
                                        className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 rounded-xl px-4 py-3 text-left transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                            <FolderPlus className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">Create your first initiative</p>
                                            <p className="text-slate-500 text-xs">Start defining a strategic initiative</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 ml-auto transition-colors" />
                                    </button>

                                    <button
                                        onClick={() => { setCurrentView('dashboard'); handleGetStarted(); }}
                                        className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-left transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            <Rocket className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">Explore the dashboard</p>
                                            <p className="text-slate-500 text-xs">See your workspace at a glance</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 ml-auto transition-colors" />
                                    </button>

                                    <button
                                        onClick={() => handleGetStarted('settings')}
                                        className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-4 py-3 text-left transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">Invite your team</p>
                                            <p className="text-slate-500 text-xs">Add members to your organisation</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 ml-auto transition-colors" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleGetStarted()}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg shadow-indigo-500/20"
                                >
                                    Get Started <Rocket className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
