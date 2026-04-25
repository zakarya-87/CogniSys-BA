
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { CreditCard, Zap, Check, ExternalLink } from 'lucide-react';

export const BillingView: React.FC = () => {
    const { t } = useTranslation(['settings', 'common']);

    const plans = [
        {
            name: 'Growth',
            price: '$49',
            description: 'Perfect for small teams and early stage startups.',
            features: ['Up to 10 members', 'Standard AI models', '5GB storage', 'Community support'],
            current: true,
        },
        {
            name: 'Enterprise',
            price: '$199',
            description: 'Advanced features for scaling corporations.',
            features: ['Unlimited members', 'Advanced AI (GPT-4o/Claude)', 'Priority RAG processing', '24/7 Dedicated support', 'Custom governance'],
            current: false,
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings:subscriptionPlan')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings:planDesc')}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Growth Plan Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map((plan) => (
                    <div 
                        key={plan.name} 
                        className={`relative p-8 rounded-2xl border transition-all ${
                            plan.current 
                                ? 'bg-accent-purple/5 border-accent-purple shadow-xl shadow-accent-purple/10' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-accent-purple/40'
                        }`}
                    >
                        {plan.current && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-purple text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                Current Plan
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">/month</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            {plan.description}
                        </p>
                        <ul className="space-y-3 mb-8">
                            {plan.features.map(f => (
                                <li key={f} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                    <Check className="h-5 w-5 text-accent-purple shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <Button 
                            variant={plan.current ? 'outline' : 'primary'} 
                            className={`w-full font-bold ${plan.current ? 'border-accent-purple text-accent-purple hover:bg-accent-purple/10' : ''}`}
                        >
                            {plan.current ? 'MANAGE SUBSCRIPTION' : 'UPGRADE NOW'}
                        </Button>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl">
                            <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Method</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Mastercard ending in 4242</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-accent-purple hover:text-accent-purple/80 font-bold text-xs uppercase tracking-widest">
                        UPDATE
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-accent-amber" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Next billing date: <span className="font-bold">May 12, 2026</span></span>
                    </div>
                    <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 uppercase tracking-widest transition-colors">
                        View Billing History
                        <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
