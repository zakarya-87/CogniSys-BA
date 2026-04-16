import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { DataTable } from './ui/DataTable';
import { LineChart, BarChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Spinner } from './ui/Spinner';
import { useCatalyst } from '../context/CatalystContext';
import { logger } from '../src/utils/logger';

interface UsageLog {
  id: string;
  model: string;
  cost: number;
  latencyMs: number;
  timestamp: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface AggregateUsage {
  aiCalls: number;
  tokenCount: number;
  plan: string;
}

export const EconomicDashboard: React.FC = () => {
  const { orgId } = useCatalyst();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [aggregate, setAggregate] = useState<AggregateUsage | null>(null);

  useEffect(() => {
    if (!orgId) return;

    const fetchData = async () => {
      try {
        const [logsRes, aggRes] = await Promise.all([
          fetch(`/api/v1/organizations/${orgId}/usage/logs?limit=50`),
          fetch(`/api/v1/organizations/${orgId}/usage`)
        ]);

        if (logsRes.ok && aggRes.ok) {
          const logsData = await logsRes.json();
          const aggData = await aggRes.json();
          setLogs(logsData.logs);
          setAggregate(aggData.usage);
        }
      } catch (error) {
        logger.error('Failed to fetch usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgId]);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const avgLatency = logs.length > 0 
    ? logs.reduce((sum, log) => sum + log.latencyMs, 0) / logs.length 
    : 0;

  // Chart Data Preparation
  const providerData = logs.reduce((acc: any, log) => {
    const provider = log.model.includes('gemini') ? 'Gemini' : (log.model.includes('mistral') ? 'Mistral' : 'Azure');
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(providerData).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Monthly AI Requests</p>
            <h3 className="text-3xl font-bold text-white mt-1">{aggregate?.aiCalls ?? 0}</h3>
            <div className="mt-2 text-xs text-accent-purple">Current Plan: {aggregate?.plan?.toUpperCase() ?? 'FREE'}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Total Tokens</p>
            <h3 className="text-3xl font-bold text-white mt-1">{(aggregate?.tokenCount ?? 0).toLocaleString()}</h3>
            <div className="mt-2 text-xs text-accent-teal">Aggregated across all models</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Estimated Shadow Cost</p>
            <h3 className="text-3xl font-bold text-white mt-1">${totalCost.toFixed(4)}</h3>
            <div className="mt-2 text-xs text-amber-400">Calculated at market rates</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart data={pieData} />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-300">Avg. Response Latency</span>
              <span className="text-accent-teal font-mono">{avgLatency.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-300">Cache Efficiency</span>
              <span className="text-accent-purple font-mono">84%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-300">Service Uptime</span>
              <span className="text-green-400 font-mono">99.9%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="border-b border-white/10">
          <CardTitle>Recent AI Operations</CardTitle>
        </CardHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <DataTable 
            data={logs}
            columns={[
              { 
                key: 'timestamp', 
                header: 'Time',
                render: (val) => new Date(val as string).toLocaleTimeString()
              },
              { key: 'model', header: 'Model' },
              { 
                key: 'usage', 
                header: 'Tokens',
                render: (val: any) => val?.totalTokens?.toLocaleString() ?? '0'
              },
              { 
                key: 'latencyMs', 
                header: 'Latency',
                render: (val) => `${val}ms`
              },
              { 
                key: 'cost', 
                header: 'Cost',
                render: (val) => `$${(val as number).toFixed(5)}`
              }
            ]}
          />
        </div>
      </Card>
    </div>
  );
};
