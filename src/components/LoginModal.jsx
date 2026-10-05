import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  X,
  Lock,
  User,
  Stethoscope,
  Ambulance,
  Building2,
  Radio,
  Activity,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertCircle
} from 'lucide-react';

export const LoginModal = () => {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    loginTargetRole,
    users,
    login
  } = useEmergency();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [paramedicTrack, setParamedicTrack] = useState('paramedic'); // 'paramedic' | 'emt'

  // Target role metadata
  const roleMeta = {
    patient: {
      title: 'Patient Portal Login',
      roleKey: 'PATIENT',
      icon: User,
      color: 'text-red-400',
      bgColor: 'bg-red-600 text-white',
      glowColor: 'bg-red-600/10',
      buttonBg: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30',
      borderColor: 'focus:border-red-500',
      activeItemBorder: 'bg-slate-800 border-red-500/50 text-white font-medium shadow-sm',
      defaultUser: 'patient.rahul',
      description: 'Sign in to request emergency assistance and track medical response.'
    },
    doctor: {
      title: 'Doctor Portal Login',
      roleKey: 'DOCTOR',
      icon: Stethoscope,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600 text-white',
      glowColor: 'bg-blue-600/10',
      buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30',
      borderColor: 'focus:border-blue-500',
      activeItemBorder: 'bg-slate-800 border-blue-500/50 text-white font-medium shadow-sm',
      defaultUser: 'doctor.ananya',
      description: 'Sign in with your verified medical credentials to triage incoming trauma cases.'
    },
    ambulance: {
      title: 'Ambulance Portal Login',
      roleKey: 'AMBULANCE',
      icon: Ambulance,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400 text-slate-950 font-bold shadow-md shadow-yellow-400/25',
      glowColor: 'bg-yellow-400/15',
      buttonBg: 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold shadow-md shadow-yellow-400/25 transition-all',
      borderColor: 'focus:border-yellow-400',
      activeItemBorder: 'bg-yellow-950/50 border-yellow-400/50 text-yellow-300 font-semibold shadow-sm',
      defaultUser: 'ambulance.vikram',
      description: 'Sign in to receive dispatch orders, turn-by-turn navigation and Green Wave clearance.'
    },
    paramedic: {
      title: paramedicTrack === 'emt' ? 'Emergency Medical Technician (EMT) Login' : 'Paramedic (ALS) Login',
      roleKey: 'PARAMEDIC',
      icon: paramedicTrack === 'emt' ? Ambulance : Activity,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/25',
      glowColor: 'bg-teal-400/15',
      buttonBg: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/25 transition-all',
      borderColor: 'focus:border-teal-400',
      activeItemBorder: 'bg-teal-950/50 border-teal-400/50 text-teal-300 font-semibold shadow-sm',
      defaultUser: paramedicTrack === 'emt' ? 'emt.amit' : 'paramedic.rajesh',
      description: paramedicTrack === 'emt'
        ? 'Sign in as an Emergency Medical Technician (EMT) for pre-hospital trauma assessment, START triage, and patient stabilization.'
        : 'Sign in as a certified Paramedic (ALS) with advanced resuscitation, clinical pharmacology, and live tele-doctor link.'
    },
    hospital: {
      title: 'Hospital Management Login',
      roleKey: 'HOSPITAL',
      icon: Building2,
      color: 'text-green-400',
      bgColor: 'bg-green-400 text-slate-950 font-bold shadow-md shadow-green-400/25',
      glowColor: 'bg-green-400/15',
      buttonBg: 'bg-green-400 hover:bg-green-300 text-slate-950 font-bold shadow-md shadow-green-400/25 transition-all',
      borderColor: 'focus:border-green-400',
      activeItemBorder: 'bg-green-950/50 border-green-400/50 text-green-300 font-semibold shadow-sm',
      defaultUser: 'hospital.apollo',
      description: 'Sign in to manage ER incoming trauma queues, bed telemetry, ICU units, blood banks, and oxygen reserves.'
    },
    'control-room': {
      title: 'Control Room Command Login',
      roleKey: 'CONTROL_ROOM',
      icon: Radio,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30',
      glowColor: 'bg-indigo-600/20',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30',
      borderColor: 'focus:border-indigo-500',
      activeItemBorder: 'bg-slate-800 border-indigo-500/50 text-white font-medium shadow-sm',
      defaultUser: 'control.operator',
      description: 'Sign in to access unified central dispatch, citywide fleet oversight, green corridor control, and inter-agency coordination.'
    }
  };

  const currentMeta = roleMeta[loginTargetRole] || roleMeta.patient;
  const RoleIcon = currentMeta.icon;

  // Filter users matching this portal
  const roleUsers = users.filter(u => {
    if (loginTargetRole === 'control-room') {
      return u.role === 'CONTROL_ROOM';
    }
    if (loginTargetRole === 'hospital') {
      return u.role === 'HOSPITAL';
    }
    if (loginTargetRole === 'paramedic') {
      if (paramedicTrack === 'emt') {
        return u.role === 'PARAMEDIC' && (u.username === 'emt.amit' || u.designation?.toLowerCase().includes('technician'));
      }
      return u.role === 'PARAMEDIC' && (u.username === 'paramedic.rajesh' || !u.designation || u.designation.toLowerCase().includes('paramedic'));
    }
    return u.role === currentMeta.roleKey;
  });

  useEffect(() => {
    if (isLoginModalOpen) {
      if (loginTargetRole === 'paramedic') {
        if (paramedicTrack === 'emt') {
          setUsername('emt.amit');
        } else {
          setUsername('paramedic.rajesh');
        }
        setPassword('password123');
      } else if (currentMeta.defaultUser) {
        setUsername(currentMeta.defaultUser);
        setPassword('password123');
      }
      setError('');
    }
  }, [isLoginModalOpen, loginTargetRole, paramedicTrack]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const res = login({
      username,
      password,
      role: currentMeta.roleKey
    });

    if (!res.success) {
      setError('Invalid username or password for this portal.');
    }
  };

  const handleSelectDemoUser = (user) => {
    setUsername(user.username);
    setPassword('password123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className={`absolute -top-20 -left-20 w-40 h-40 ${currentMeta.glowColor || 'bg-red-600/10'} rounded-full blur-3xl pointer-events-none transition-all duration-300`} />

        {/* Close Button */}
        <button
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className={`w-12 h-12 rounded-2xl ${currentMeta.bgColor} flex items-center justify-center shadow-lg shrink-0`}>
            <RoleIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {currentMeta.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-Based Access Control Gate
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
          {currentMeta.description}
        </p>

        {/* PARAMEDIC VS EMERGENCY MEDICAL TECHNICIAN (EMT) TRACK SELECTOR */}
        {loginTargetRole === 'paramedic' && (
          <div className="mb-5 bg-slate-950 p-2.5 rounded-2xl border border-teal-500/40 shadow-inner">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              Select Designation / Professional Track:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setParamedicTrack('paramedic');
                  setUsername('paramedic.rajesh');
                  setPassword('password123');
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paramedicTrack === 'paramedic'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>Paramedic</span>
                </div>
                <span className={`text-[10px] font-mono ${paramedicTrack === 'paramedic' ? 'text-teal-950 font-bold' : 'text-slate-500'}`}>
                  Advanced Life Support (ALS)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setParamedicTrack('emt');
                  setUsername('emt.amit');
                  setPassword('password123');
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paramedicTrack === 'emt'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Ambulance className="w-4 h-4" />
                  <span>Emergency Medical Tech</span>
                </div>
                <span className={`text-[10px] font-mono ${paramedicTrack === 'emt' ? 'text-teal-950 font-bold' : 'text-slate-500'}`}>
                  EMT Provider
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Demo User Selector */}
        {roleUsers.length > 0 && (
          <div className="mb-5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select Demo Identity:
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {roleUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    handleSelectDemoUser(u);
                    if (u.designation?.toLowerCase().includes('technician') || u.username === 'emt.amit') {
                      setParamedicTrack('emt');
                    } else if (u.role === 'PARAMEDIC') {
                      setParamedicTrack('paramedic');
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                    username === u.username
                      ? (currentMeta.activeItemBorder || 'bg-slate-800 border-red-500/50 text-white font-medium shadow-sm')
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-bold">{u.name}</span>
                    {u.designation && (
                      <span className="text-[10px] text-teal-400 font-mono">{u.designation}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">{u.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* DYNAMIC CREDENTIALS SUMMARY BADGE FOR PARAMEDIC / EMT */}
        {loginTargetRole === 'paramedic' && (
          <div className="mb-4 p-3 bg-slate-950/90 border border-teal-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-black text-xs">
                {paramedicTrack === 'emt' ? 'EMT' : 'ALS'}
              </div>
              <div>
                <div className="text-white font-bold text-xs flex items-center gap-2">
                  <span>{paramedicTrack === 'emt' ? 'EMT Amit Verma' : 'Paramedic Rajesh Sharma'}</span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-teal-300/80 font-mono">
                  {paramedicTrack === 'emt' ? 'Emergency Medical Technician' : 'Paramedic (ALS Lead)'}
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-[11px] bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
              <div className="text-teal-400 font-bold">{paramedicTrack === 'emt' ? 'emt.amit' : 'paramedic.rajesh'}</div>
              <div className="text-slate-500 text-[10px]">password123</div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Username / Identifier
              </label>
              {loginTargetRole === 'paramedic' && (
                <span className="text-[10px] font-mono text-teal-300 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                  {paramedicTrack === 'emt' ? 'EMT Active' : 'Paramedic Active'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={loginTargetRole === 'paramedic' ? (paramedicTrack === 'emt' ? 'emt.amit' : 'paramedic.rajesh') : 'e.g. patient.rahul'}
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors ${currentMeta.borderColor || 'focus:border-red-500'}`}
              />
              <KeyRound className="w-4 h-4 text-slate-600 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors ${currentMeta.borderColor || 'focus:border-red-500'}`}
              />
              <Lock className="w-4 h-4 text-slate-600 absolute right-3 top-3" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Default demo password: <code className="text-slate-400">password123</code></span>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 ${currentMeta.buttonBg || 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold'} text-sm font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer`}
          >
            <span>
              {loginTargetRole === 'paramedic'
                ? (paramedicTrack === 'emt' ? 'Authenticate as EMT & Enter Portal' : 'Authenticate as Paramedic & Enter Portal')
                : 'Authenticate & Enter Portal'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Encrypted RBAC Session
          </span>
          <span>Raksha Secure Auth</span>
        </div>

      </div>
    </div>
  );
};
