import React, { useEffect, useState } from 'react';
import { CreditCard, Zap, ArrowUpCircle, ExternalLink } from 'lucide-react';
import { BillingAPI, UsageAPI } from '../src/services/api';
import { useCatalyst } from '../context/CatalystContext';

interface BillingInfo { plan: string; status: string; currentPeriodEnd?: string; }
interface UsageInfo { aiCalls: number; tokenCount: number; plan: string; month: string; }

const PLAN_QUOTAS: Record<string, number | null> = { free: 100, pro: null, enterprise: null };
const PLAN_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };
const PLAN_COLORS: Record<string, string> = { free: 'slate', pro: 'indigo', enterprise: 'amber' };

export const BillingView: React.FC = () => {
  const { organizations } = useCatalyst();
  const orgId = organizations[0]?.id;

  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    Promise.all([
      BillingAPI.get(orgId).catch(() => ({ data: null })),
      UsageAPI.get(orgId).catch(() => ({ data: null })),
    ]).then(([bRes, uRes]) => {
      setBilling((bRes.data as any)?.billing ?? null);
      setUsage((uRes.data as any)?.usage ?? null);
    }).finally(() => setLoading(false));
  }, [orgId]);

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    if (!orgId) return;
    setUpgrading(true);
    try {
      const res = await BillingAPI.checkout(
        orgId, plan,
        `${window.location.origin}/settings?billing=success`,
        `${window.location.origin}/settings?billing=cancel`,
      );
      const url = (res.data as any).url;
      if (url) window.location.href = url;
    } catch {
      alert('Billing not configured. Add STRIPE_SECRET_KEY to enable payments.');
    } finally {
      setUpgrading(false);
    }
  };

  const handlePortal = async () => {
    if (!orgId) return;
    try {
      const res = await BillingAPI.portal(orgId, window.location.href);
      const url = (res.data as any).url;
      if (url) window.open(url, '_blank');
    } catch {
      alert('Billing portal not available. Configure Stripe to enable.');
    }
  };

  const currentPlan = billing?.plan ?? 'free';
  const quota = PLAN_QUOTAS[currentPlan];
  const calls = usage?.aiCalls ?? 0;
  const usagePct = quota ? Math.min(100, (calls / quota) * 100) : 0;

  if (!orgId) return <div className="p-6 text-slate-400">No organisation found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-indigo-400" /> Billing
      </h2>

      {/* Current plan card */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-2xl font-bold text-white">{PLAN_LABELS[currentPlan] ?? currentPlan}</p>
            {billing?.currentPeriodEnd && (
              <p className="text-xs text-slate-400 mt-1">Renews {new Date(billing.currentPeriodEnd).toLocaleDateString()}</p>
            )}
          </div>
          {billing?.status && billing.status !== 'none' && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${billing.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {billing.status.toUpperCase()}
            </span>
          )}
        </div>

        {/* AI usage bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3" /> AI Calls this month</span>
            <span className="text-slate-300 font-medium">{calls}{quota ? ` / ${quota}` : ' (unlimited)'}</span>
          </div>
          {quota && (
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usagePct > 80 ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>

        {currentPlan !== 'free' && (
          <button
            onClick={handlePortal}
            className="mt-4 flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Manage subscription
          </button>
        )}
      </div>

      {/* Upgrade cards */}
      {currentPlan === 'free' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanCard
            name="Pro"
            price="$49/mo"
            features={['Unlimited AI calls', 'Priority support', 'Advanced analytics', 'Webhooks']}
            onUpgrade={() => handleUpgrade('pro')}
            loading={upgrading}
            color="indigo"
          />
          <PlanCard
            name="Enterprise"
            price="$199/mo"
            features={['Everything in Pro', 'SLA guarantee', 'Custom RBAC', 'Dedicated support', 'SSO/SAML']}
            onUpgrade={() => handleUpgrade('enterprise')}
            loading={upgrading}
            color="amber"
          />
        </div>
      )}
    </div>
  );
};

const COLOR_CLASSES: Record<string, { border: string; borderHover: string; text: string; check: string; btn: string; btnHover: string }> = {
  indigo: {
    border: 'border-indigo-500/30',
    borderHover: 'hover:border-indigo-500/60',
    text: 'text-indigo-400',
    check: 'text-indigo-400',
    btn: 'bg-indigo-600',
    btnHover: 'hover:bg-indigo-700',
  },
  amber: {
    border: 'border-amber-500/30',
    borderHover: 'hover:border-amber-500/60',
    text: 'text-amber-400',
    check: 'text-amber-400',
    btn: 'bg-amber-600',
    btnHover: 'hover:bg-amber-700',
  },
};

const PlanCard: React.FC<{
  name: string; price: string; features: string[];
  onUpgrade: () => void; loading: boolean; color: string;
}> = ({ name, price, features, onUpgrade, loading, color }) => {
  const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.indigo;
  return (
    <div className={`bg-slate-800 rounded-xl p-5 border ${c.border} ${c.borderHover} transition-colors`}>
      <p className={`text-sm font-bold ${c.text} mb-1`}>{name}</p>
      <p className="text-2xl font-bold text-white mb-3">{price}</p>
      <ul className="space-y-1.5 mb-4">
        {features.map((f) => (
          <li key={f} className="text-xs text-slate-400 flex items-center gap-2">
            <span className={c.check}>✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onUpgrade}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 ${c.btn} ${c.btnHover} disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors`}
      >
        <ArrowUpCircle className="w-4 h-4" /> {loading ? 'Redirecting…' : `Upgrade to ${name}`}
      </button>
    </div>
  );
};
