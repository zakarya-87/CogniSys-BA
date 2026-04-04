import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, Zap, Activity } from 'lucide-react';
import { AnalyticsAPI, UsageAPI } from '../../src/services/api';
import { useCatalyst } from '../../context/CatalystContext';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export const AnalyticsDashboard: React.FC = () => {
  const { organizations } = useCatalyst();
  const orgId = organizations[0]?.id;

  const [activity, setActivity] = useState<{ date: string; events: number }[]>([]);
  const [metrics, setMetrics] = useState<{ total: number; byStatus: Record<string, number>; bySector: Record<string, number> } | null>(null);
  const [aiTrend, setAiTrend] = useState<{ month: string; aiCalls: number; tokenCount: number }[]>([]);
  const [usage, setUsage] = useState<{ aiCalls: number; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    Promise.all([
      AnalyticsAPI.activity(orgId, 30),
      AnalyticsAPI.initiatives(orgId),
      AnalyticsAPI.aiUsage(orgId, 6),
      UsageAPI.get(orgId),
    ]).then(([actRes, metRes, aiRes, usageRes]) => {
      setActivity((actRes.data as any).activity ?? []);
      setMetrics((metRes.data as any).metrics ?? null);
      setAiTrend((aiRes.data as any).trend ?? []);
      setUsage((usageRes.data as any).usage ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orgId]);

  if (!orgId) return <div className="p-8 text-slate-400">No organisation selected.</div>;

  const statusData = metrics ? Object.entries(metrics.byStatus).map(([name, value]) => ({ name, value })) : [];
  const QUOTA = usage?.plan === 'free' ? 100 : Infinity;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-400" /> Analytics
      </h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Activity className="w-5 h-5"/>} label="Events (30d)" value={activity.reduce((s, d) => s + d.events, 0)} color="indigo" loading={loading} />
        <KpiCard icon={<Users className="w-5 h-5"/>} label="Initiatives" value={metrics?.total ?? 0} color="cyan" loading={loading} />
        <KpiCard icon={<Zap className="w-5 h-5"/>} label="AI Calls (month)" value={usage?.aiCalls ?? 0} color="amber" loading={loading} />
        <KpiCard icon={<TrendingUp className="w-5 h-5"/>} label="Plan" value={usage?.plan ?? 'free'} color="emerald" loading={loading} isText />
      </div>

      {/* Usage quota bar (free plan) */}
      {usage && QUOTA !== Infinity && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300 font-medium">AI Quota — Free Plan</span>
            <span className="text-slate-400">{usage.aiCalls} / {QUOTA} calls</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usage.aiCalls / QUOTA > 0.8 ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, (usage.aiCalls / QUOTA) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity area chart */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Org Activity (30 days)</h3>
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Area type="monotone" dataKey="events" stroke="#6366f1" fill="url(#actGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* AI usage bar chart */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">AI Calls (6 months)</h3>
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={aiTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="aiCalls" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Initiative status pie */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Initiatives by Status</h3>
          {loading ? <Skeleton /> : statusData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sector breakdown */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Initiatives by Sector</h3>
          {loading ? <Skeleton /> : (
            <div className="space-y-2">
              {metrics && Object.entries(metrics.bySector).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([sector, count], i) => (
                <div key={sector} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-300 flex-1 truncate">{sector}</span>
                  <span className="text-xs font-bold text-white">{count}</span>
                </div>
              ))}
              {(!metrics || Object.keys(metrics.bySector).length === 0) && (
                <div className="text-slate-500 text-sm py-4 text-center">No data</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string; loading: boolean; isText?: boolean }> = ({ icon, label, value, color, loading, isText }) => (
  <div className={`bg-slate-800 rounded-xl p-4 border border-slate-700`}>
    <div className={`text-${color}-400 mb-2`}>{icon}</div>
    <div className="text-xl font-bold text-white">{loading ? '—' : (isText ? String(value).toUpperCase() : value)}</div>
    <div className="text-xs text-slate-400 mt-1">{label}</div>
  </div>
);

const Skeleton: React.FC = () => (
  <div className="h-[180px] bg-slate-700/30 rounded-lg animate-pulse" />
);
