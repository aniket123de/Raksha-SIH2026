import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  Smartphone,
  Radio,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Stethoscope,
  Activity,
  Ambulance,
  Building2,
  AlertTriangle,
  ArrowDownLeft,
  Sparkles
} from 'lucide-react';

export const InboundSmsFeed = ({
  filterRole = null,
  compact = false,
  showAllowedSenders = true,
  maxItems = null
}) => {
  const {
    currentRole,
    receivedSms,
    getReceivedSmsForRole,
    getAllowedSendersForRole,
    SMS_ROUTING_MATRIX,
    triggerEmergencySmsFallback
  } = useEmergency();

  const activeRole = filterRole || currentRole || 'ambulance';
  const normRole = (activeRole === 'control_room' ? 'control-room' : activeRole).toLowerCase();

  // Retrieve received SMS matching the routing matrix for this role
  const inboundList = filterRole ? getReceivedSmsForRole(filterRole) : (receivedSms || []);
  const displayedList = maxItems ? inboundList.slice(0, maxItems) : inboundList;
  const allowedSenders = getAllowedSendersForRole ? getAllowedSendersForRole(normRole) : [];

  // Helper for role metadata
  const getRoleMeta = (role) => {
    const r = (role === 'control_room' ? 'control-room' : role || '').toLowerCase();
    switch (r) {
      case 'patient':
        return {
          label: 'Patient (SOS)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: User,
          textColor: 'text-emerald-400'
        };
      case 'doctor':
        return {
          label: 'Attending Doctor',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: Stethoscope,
          textColor: 'text-purple-400'
        };
      case 'paramedic':
        return {
          label: 'Paramedic / EMT',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: Activity,
          textColor: 'text-cyan-400'
        };
      case 'ambulance':
        return {
          label: 'Smart Ambulance',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: Ambulance,
          textColor: 'text-rose-400'
        };
      case 'hospital':
        return {
          label: 'Hospital Trauma ER',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: Building2,
          textColor: 'text-blue-400'
        };
      case 'control-room':
      default:
        return {
          label: 'Control Room (SEOC)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: Radio,
          textColor: 'text-amber-400'
        };
    }
  };

  const currentRoleMeta = getRoleMeta(normRole);

  return (
    <div className="space-y-4">
      
      {/* HEADER / ALLOWED SENDERS SUMMARY */}
      {showAllowedSenders && (
        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Inbound GSM Telemetry Receiver
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    {displayedList.length} Messages
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Recipient Portal: <strong className={currentRoleMeta.textColor}>{currentRoleMeta.label}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">Radio RX Live</span>
            </div>
          </div>

          {/* Permitted Senders Badges for this Role */}
          <div className="pt-1.5 border-t border-slate-900 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono mr-1">
              Authorized Inbound Senders:
            </span>
            {allowedSenders.length > 0 ? (
              allowedSenders.map(sRole => {
                const sMeta = getRoleMeta(sRole);
                const IconComponent = sMeta.icon;
                return (
                  <span
                    key={sRole}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${sMeta.color}`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{sMeta.label}</span>
                  </span>
                );
              })
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">None configured</span>
            )}
          </div>
        </div>
      )}

      {/* INBOUND MESSAGES LIST */}
      <div className="space-y-3">
        {displayedList.length > 0 ? (
          displayedList.map((sms) => {
            const senderMeta = getRoleMeta(sms.senderRole);
            const SenderIcon = senderMeta.icon;

            return (
              <div
                key={sms.id}
                className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 shadow-md hover:border-indigo-400/50 transition-all"
              >
                {/* Top: Sender info & status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase font-mono border flex items-center gap-1.5 ${senderMeta.color}`}>
                      <SenderIcon className="w-3.5 h-3.5" />
                      <span>{senderMeta.label}</span>
                    </span>

                    <span className="text-xs font-mono font-bold text-white">
                      {sms.senderName || 'Authorized Unit'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      ({sms.recipientPhone || 'GSM-TX'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                      sms.deliveryConfirmed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {sms.deliveryConfirmed ? 'DELIVERED (CONFIRMED ✓)' : `STATUS: ${sms.status?.toUpperCase() || 'RECEIVED'}`}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(sms.deliveredAt || sms.storedAt || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* SMS Text Payload */}
                <pre className="p-3 rounded-xl bg-slate-900 font-mono text-[11px] text-indigo-100 border border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {sms.payload}
                </pre>

                {/* Telemetry Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Packet: {sms.id} • Ref: {sms.deliveryReport?.messageReference || sms.networkReference || 'SMSC-ACK'}</span>
                  </span>

                  <span>
                    GSM Latency: <strong className="text-emerald-400">{sms.deliveryReport?.deliveryLatencyMs || 1800} ms</strong>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
            <Radio className="w-6 h-6 text-slate-600 mx-auto animate-pulse" />
            <p className="text-xs font-bold text-slate-300">
              No Inbound SMS Received Yet for {currentRoleMeta.label}
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
              Monitoring cellular GSM channels. Messages from authorized senders ({allowedSenders.map(s => getRoleMeta(s).label).join(', ') || 'None'}) will appear here automatically with tower-verified delivery receipts.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
