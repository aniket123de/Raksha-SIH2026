import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { X, Bell, AlertCircle, CheckCircle, Info, ShieldAlert, Trash2 } from 'lucide-react';

export const NotificationCenter = ({ isOpen, onClose }) => {
  const { notifications, auditLogs } = useEmergency();
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'audit'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            <h2 className="font-bold text-base text-white">Live Emergency Dispatch Feed</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-red-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Real-Time Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-red-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Compliance Audit Log ({auditLogs.length})
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'notifications' ? (
            notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No new dispatch notifications</p>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    item.type === 'urgent'
                      ? 'bg-red-950/40 border-red-800/60 text-red-200'
                      : item.type === 'warning'
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                      : item.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {item.type === 'urgent' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    {item.type === 'warning' && <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                    {item.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    {item.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-xs mt-1 text-slate-300 leading-relaxed">{item.message}</p>
                      {item.targetRole && item.targetRole !== 'all' && (
                        <span className="inline-block mt-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-400">
                          Target: {item.targetRole}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span className="text-red-400 font-bold">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-300 font-medium">{log.details}</div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-900">
                  <span>Actor: {log.actorRole} ({log.actorId})</span>
                  <span className="font-mono">{log.id}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500">
          Encrypted Event Stream • HIPAA & DISHA Audit Compliant
        </div>

      </div>
    </div>
  );
};
