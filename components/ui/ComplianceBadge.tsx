import React from 'react';
import { Shield, Building2, Heart, Landmark, Globe, Cpu } from 'lucide-react';

const COMPLIANCE_MAP: Record<string, { standard: string; icon: React.ElementType; color: string }> = {
  fintech: { standard: 'PCI-DSS', icon: Landmark, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  finance: { standard: 'SOX', icon: Landmark, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  biotech: { standard: 'HIPAA', icon: Heart, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  healthcare: { standard: 'HIPAA', icon: Heart, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  government: { standard: 'FedRAMP', icon: Building2, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  defense: { standard: 'CMMC', icon: Shield, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
  technology: { standard: 'SOC 2', icon: Cpu, color: 'text-accent-teal bg-accent-teal/10 border-accent-teal/20' },
  retail: { standard: 'PCI-DSS', icon: Globe, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
  energy: { standard: 'NERC CIP', icon: Globe, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
};

const DEFAULT_COMPLIANCE = { standard: 'ISO 27001', icon: Shield, color: 'text-silver bg-silver/10 border-silver/20' };

interface ComplianceBadgeProps {
  sector: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({
  sector,
  size = 'sm',
  className = '',
}) => {
  const key = sector.toLowerCase().trim();
  const config = COMPLIANCE_MAP[key] || DEFAULT_COMPLIANCE;
  const Icon = config.icon;

  const sizeStyles = size === 'sm'
    ? 'text-[10px] px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.color} ${sizeStyles} ${className}`}
      title={`${sector} — ${config.standard} compliance`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.standard}
    </span>
  );
};
