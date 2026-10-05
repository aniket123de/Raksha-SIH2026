import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner = () => {
  return (
    <div className="bg-slate-900 border-b border-amber-500/30 px-4 py-2 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-amber-300 font-semibold">EMERGENCY NOTICE:</strong> Raksha is a decision-support & emergency coordination platform. For immediate life-threatening crises, dial <strong>112 / 108</strong> for government emergency services.
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          HIPAA & DISHA Simulated Privacy Shield
        </span>
        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
          v1.0.0-PROTOTYPE
        </span>
      </div>
    </div>
  );
};
