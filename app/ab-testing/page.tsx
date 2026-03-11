"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Zap, CheckCircle, TrendingUp, AlertCircle, RefreshCcw, Activity, MessageCircle, AlertTriangle, Info, ExternalLink, Linkedin, Database, Settings, Bot, Mail, Search, Menu, X, CalendarDays, ChevronLeft, ChevronRight, Beaker, Trophy } from 'lucide-react';

const ClaudeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M14.5 2.5h3L10 21.5H7l7.5-19z M6 21.5H3l4-10h3l-4 10z" /></svg>
);

const PerplexityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v3h3v2h-3v3h-2v-3H8v-2h3V7z" /></svg>
);

// Helpers pour initialiser les dates par défaut (A: 7 derniers jours, B: les 7 jours d'avant)
const formatToYMD = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const now = new Date();
const defaultAEnd = now;
const defaultAStart = new Date(now.getTime() - 7 * 86400000);
const defaultBEnd = new Date(defaultAStart.getTime() - 86400000);
const defaultBStart = new Date(defaultBEnd.getTime() - 7 * 86400000);

export default function ABTesting() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [dashSearch, setDashSearch] = useState("");

  // Période A
  const [startA, setStartA] = useState<string>(formatToYMD(defaultAStart));
  const [endA, setEndA] = useState<string>(formatToYMD(defaultAEnd));
  const [showPickerA, setShowPickerA] = useState(false);
  const [calViewA, setCalViewA] = useState(defaultAEnd);

  // Période B
  const [startB, setStartB] = useState<string>(formatToYMD(defaultBStart));
  const [endB, setEndB] = useState<string>(formatToYMD(defaultBEnd));
  const [showPickerB, setShowPickerB] = useState(false);
  const [calViewB, setCalViewB] = useState(defaultBEnd);

  const [statInfo, setStatInfo] = useState<{title: string, description: string} | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) setAllLeads(data.leads);
    } catch (err) {
      console.error("Erreur API", err);
    } finally {
      // Retrait du setTimeout pour plus de réactivité
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "LORTH - A/B Testing";
    loadData();
  }, []);

  const handleDashSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && dashSearch.trim() !== '') {
      router.push(`/mailbox?q=${encodeURIComponent(dashSearch.trim())}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.getElementById('dashSearchInput')?.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // OPTIMISATION : Remplacement des useEffect/useState par des useMemo
  const calcForPeriod = (s: string, e: string) => {
    if (!s || !e || allLeads.length === 0) return { total: 0, replies: 0, replyRate: 0, positives: 0, posRate: 0 };
    
    const partsS = s.split('-');
    const tsStart = new Date(parseInt(partsS[0]), parseInt(partsS[1])-1, parseInt(partsS[2])).getTime();
    const partsE = e.split('-');
    const tsEnd = new Date(parseInt(partsE[0]), parseInt(partsE[1])-1, parseInt(partsE[2]), 23, 59, 59, 999).getTime();

    const subset = allLeads.filter(l => l.rawDate >= tsStart && l.rawDate <= tsEnd);
    const total = subset.length;
    const replies = subset.filter(l => l.conversation && l.conversation.length > 1).length;
    const replyRate = total > 0 ? Math.round((replies / total) * 100) : 0;
    
    // Métrique clé : "Positifs"
    const positives = subset.filter(l => ['Vidéo à tourner', 'Objection traitée', 'Outreach Successful'].includes(l.status)).length;
    const posRate = replies > 0 ? Math.round((positives / replies) * 100) : 0;

    return { total, replies, replyRate, positives, posRate };
  };

  const statsA = useMemo(() => calcForPeriod(startA, endA), [allLeads, startA, endA]);
  const statsB = useMemo(() => calcForPeriod(startB, endB), [allLeads, startB, endB]);

  const formatDisplayDate = (d: string) => {
    if (!d) return '--';
    const [y, m, day] = d.split('-');
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${parseInt(day)} ${months[parseInt(m)-1]}`;
  };

  const renderCalendar = (start: string, end: string, setStart: (s:string)=>void, setEnd: (s:string)=>void, calView: Date, setCalView: (d:Date)=>void, close: ()=>void) => {
    const year = calView.getFullYear();
    const month = calView.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startDayIndex = firstDay === 0 ? 6 : firstDay - 1;

    const handleDayClick = (dateStr: string) => {
      if (!start || (start && end)) { setStart(dateStr); setEnd(''); } 
      else { if (dateStr < start) { setEnd(start); setStart(dateStr); } else { setEnd(dateStr); } }
    };

    return (
      <div className="p-4 w-72"> {/* Élargissement pour meilleur espacement tactile */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCalView(new Date(year, month - 1, 1))} className="p-2 hover:bg-white/10 rounded-md text-slate-400 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
          <span className="text-sm font-bold text-white capitalize">{calView.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCalView(new Date(year, month + 1, 1))} className="p-2 hover:bg-white/10 rounded-md text-slate-400 transition-colors"><ChevronRight className="w-5 h-5"/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => <div key={d} className="text-[10px] font-extrabold text-slate-500">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Agrandissement des cases vides à w-9 h-9 */}
          {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} className="w-9 h-9" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
             const day = i + 1;
             const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             const isStart = dateStr === start;
             const isEnd = dateStr === end;
             const isBetween = start && end && dateStr > start && dateStr < end;
             
             let bgClass = "text-slate-300 hover:bg-white/10 rounded-lg";
             if (isStart || isEnd) bgClass = "bg-blue-600 text-white font-black rounded-lg shadow-[0_0_10px_rgba(37,99,235,0.5)]";
             else if (isBetween) bgClass = "bg-blue-500/20 text-blue-300 rounded-sm";

             // Agrandissement des boutons à w-9 h-9 pour iOS
             return (<button key={day} onClick={() => handleDayClick(dateStr)} className={`w-9 h-9 text-[11px] font-bold flex items-center justify-center transition-all ${bgClass}`}>{day}</button>);
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between gap-2">
            <button onClick={() => {setStart(''); setEnd('');}} className="px-3 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Effacer</button>
            <button onClick={close} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-lg transition-colors border border-white/5">Appliquer</button>
        </div>
      </div>
    );
  };

  const StatCard = ({ period, title, value, details, isWinner, icon: Icon, onClickInfo }) => {
      const color = period === 'A' ? 'blue' : 'purple';
      const baseClasses = "bg-white/[.02] border p-4 rounded-xl transition-all duration-300 relative group cursor-pointer";
      const winnerClasses = `border-${color}-500/50 shadow-lg shadow-${color}-500/5`;
      const normalClasses = "border-white/5 hover:border-white/20";

      return (
          <div className={`${baseClasses} ${isWinner ? winnerClasses : normalClasses}`} onClick={onClickInfo}>
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 text-slate-400 group-hover:text-white transition-colors`} />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">{title}</p>
                  </div>
                  {isWinner ? <Trophy className={`w-4 h-4 text-${color}-400`} /> : <Info className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
              <p className={`text-3xl font-black text-${color}-400 mt-3`}>{value}</p>
              <p className="text-xs text-slate-500 font-medium">{details}</p>
          </div>
      );
  };

  const statDescriptions = {
    'Leads Contactés': "Le nombre total de prospects uniques contactés sur cette période. C'est le volume de votre base.",
    'Taux de Réponse': "Pourcentage de prospects ayant répondu. Indicateur de l'efficacité de l'accroche (Réponses / Leads Contactés).",
    'Ratio de Positivité': "Pourcentage de réponses menant à une suite (Vidéo, Objection à traiter...). Indicateur de qualification (Positifs / Réponses)."
  };

  return (
    <div className="flex h-[100dvh] bg-[#020408] text-white font-sans antialiased overflow-hidden relative">
      <style>{`
        @keyframes appleFadeIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-apple-fade { animation: appleFadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .fast-spin { animation: spin 0.8s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite; }
        /* Masquer la scrollbar pour un design plus propre */
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>

      {/* MODALE D'EXPLICATION DES STATS */}
      {statInfo && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 px-4" onClick={() => setStatInfo(null)}>
          <div className="bg-[#0A0F1C] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-apple-fade text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 bg-blue-500/10 text-blue-400">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">{statInfo.title}</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{statInfo.description}</p>
            <button onClick={() => setStatInfo(null)} className="w-full py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5">
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <aside className={`fixed md:relative z-[100] w-64 h-[100dvh] border-r border-white/5 bg-[#03060D] flex flex-col transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <button onClick={() => setMobileMenuOpen(false)} className="md:hidden absolute top-6 right-4 p-2 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        <a href="https://lorth-solutions.fr" target="_blank" rel="noopener noreferrer" className="pt-10 pb-8 flex justify-center items-center">
          <img src="/logo-lorth.png" alt="LORTH" className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] block" />
        </a>
        
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-blue-500/50 transition-colors group cursor-text">
            <Search className="w-4 h-4 text-slate-400" />
            <input id="dashSearchInput" type="text" placeholder="Rechercher..." value={dashSearch} onChange={(e) => setDashSearch(e.target.value)} onKeyDown={handleDashSearch} className="bg-transparent border-none outline-none text-[13px] font-medium text-white placeholder-slate-500 flex-1 w-full" />
          </div>
        </div>

        <div className="px-4 flex-1 overflow-y-auto no-scrollbar pb-6">
          <nav className="space-y-2">
            <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group cursor-pointer"><Activity className="w-4 h-4 group-hover:text-blue-400" /><span className="text-sm">Dashboard</span></button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 font-bold border border-blue-500/10 transition-all"><Beaker className="w-4 h-4" /><span className="text-sm">A/B Testing</span></button>
            <button onClick={() => router.push('/mailbox')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group cursor-pointer"><Zap className="w-4 h-4 group-hover:text-blue-400" /><span className="text-sm">Mailbox</span></button>
          </nav>

          <div className="pt-8 pb-3 border-t border-white/5 mt-6"><p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Outils Externes</p></div>
          <nav className="space-y-1.5 pb-6">
            <a href="https://core.lorth-solutions.fr/projects/Q4LLvhM8ArK2SLzv/folders/M6CDLc1Ut2vjhwtP/workflows" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group"><div className="flex items-center gap-3"><Settings className="w-4 h-4 text-slate-500 group-hover:text-orange-400" /><span className="text-[13px]">n8n</span></div><ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a>
            <a href="https://crm.lorth-solutions.fr/dashboard/#/nc/pbn3gbkprxor0gd/mhoa1urs9qyy1l0/vwe9ebbcdyw4w9yy/crm-lorth-crm-complet" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group"><div className="flex items-center gap-3"><Database className="w-4 h-4 text-slate-500 group-hover:text-blue-400" /><span className="text-[13px]">CRM</span></div><ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a>
            <a href="https://app.trulyinbox.com/warmup" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group"><div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" /><span className="text-[13px]">TrulyInbox</span></div><ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a>
            <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group"><div className="flex items-center gap-3"><Bot className="w-4 h-4 text-slate-500 group-hover:text-purple-400" /><span className="text-[13px]">Gemini</span></div><ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a>
            <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group"><div className="flex items-center gap-3"><ClaudeIcon className="w-4 h-4 text-slate-500 group-hover:text-[#D97757]" /><span className="text-[13px]">Claude</span></div><ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a>
            <a href="https://www.perplexity.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group"><div className="flex items-center gap-3"><PerplexityIcon className="w-4 h-4 text-slate-500 group-hover:text-teal-400" /><span className="text-[13px]">Perplexity</span></div><ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a>
            <a href="https://www.linkedin.com/in/lorth/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group"><div className="flex items-center gap-3"><Linkedin className="w-4 h-4 text-slate-500 group-hover:text-[#0A66C2]" /><span className="text-[13px]">LinkedIn</span></div><ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a>
          </nav>
        </div>

        {/* AJOUT SAFE AREA */}
        <div className="p-4 border-t border-white/5 mt-auto bg-[#03060D] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-default hover:bg-white/5 transition-colors">
                <div className="relative flex items-center justify-center w-3 h-3"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-20 animate-ping"></span><span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500"></span></div>
                <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-300">Systèmes en ligne</span><span className="text-[9px] font-medium text-slate-500">n8n & NocoDB Sync</span></div>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-[100dvh] relative overflow-hidden">
        {/* Mobile Header - AJOUT SAFE AREA TOP */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#03060D] z-20 pt-[max(1rem,env(safe-area-inset-top))]">
          <img src="/logo-lorth.png" alt="LORTH" className="h-6 object-contain" />
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 bg-white/5 rounded-lg text-slate-300"><Menu className="w-5 h-5" /></button>
        </div>

        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none hidden md:block"></div>
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full fast-spin"></div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Chargement</span>
          </div>
        ) : (
          /* AJOUT DU SCROLL SUR LE MAIN (overflow-y-auto) ET DE LA SAFE AREA BOTTOM */
          <div className="flex-1 overflow-y-auto pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-col w-full max-w-5xl mx-auto animate-apple-fade px-4 md:px-8 gap-6 md:gap-8 pt-6 md:pt-12">
                
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3"><Beaker className="w-7 h-7 md:w-8 md:h-8 text-blue-500" /> A/B Testing</h1>
                    <p className="text-slate-400 text-xs md:text-[13px] font-medium mt-1">Comparez l'efficacité de deux périodes d'acquisition.</p>
                </div>
                <button onClick={loadData} className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors shadow-sm">
                    <RefreshCcw className="w-4 h-4 text-slate-300" />
                </button>
                </header>

                <div className="bg-[#0A0F1C]/50 border border-white/5 rounded-2xl shadow-2xl grid md:grid-cols-2 overflow-hidden">
                    {/* --- COLUMN A --- */}
                    <div className="p-5 lg:p-8 border-b md:border-b-0 md:border-r border-white/5 bg-blue-500/5 relative">
                        <h3 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Période A
                        </h3>
                        <div className="relative mb-6">
                            <button onClick={() => {setShowPickerA(!showPickerA); setShowPickerB(false);}} className="w-full flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 text-white rounded-lg px-4 py-3.5 text-sm md:text-base font-bold transition-all border border-white/10 focus:border-blue-400 shadow-sm">
                                <div className="flex items-center gap-3"><CalendarDays className="w-5 h-5 text-blue-400" /> {startA && endA ? `Du ${formatDisplayDate(startA)} au ${formatDisplayDate(endA)}` : 'Sélectionner une période'}</div>
                            </button>
                            {/* Z-INDEX TRÈS ÉLEVÉ POUR PASSER AU DESSUS DE LA COLONNE B SUR MOBILE */}
                            {showPickerA && (<div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 md:left-0 md:right-auto bg-[#0A0F1C] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[300] animate-in slide-in-from-top-2 origin-top">{renderCalendar(startA, endA, setStartA, setEndA, calViewA, setCalViewA, () => setShowPickerA(false))}</div>)}
                        </div>
                        
                        <div className="space-y-3 md:space-y-4">
                            <StatCard onClickInfo={() => setStatInfo({title: 'Leads Contactés', description: statDescriptions['Leads Contactés']})} period="A" icon={Users} title="Leads Contactés" value={statsA.total} details={`${statsA.total} prospects contactés`} isWinner={statsA.total > statsB.total} />
                            <StatCard onClickInfo={() => setStatInfo({title: 'Taux de Réponse', description: statDescriptions['Taux de Réponse']})} period="A" icon={TrendingUp} title="Taux de Réponse" value={`${statsA.replyRate}%`} details={`${statsA.replies} réponses reçues`} isWinner={statsA.replyRate > statsB.replyRate} />
                            <StatCard onClickInfo={() => setStatInfo({title: 'Ratio de Positivité', description: statDescriptions['Ratio de Positivité']})} period="A" icon={CheckCircle} title="Ratio de Positivité" value={`${statsA.posRate}%`} details={`${statsA.positives} réponses positives`} isWinner={statsA.posRate > statsB.posRate} />
                        </div>
                    </div>

                    {/* --- COLUMN B --- */}
                    <div className="p-5 lg:p-8 bg-purple-500/5 relative">
                        <h3 className="text-sm font-extrabold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span> Période B
                        </h3>
                        <div className="relative mb-6">
                            <button onClick={() => {setShowPickerB(!showPickerB); setShowPickerA(false);}} className="w-full flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 text-white rounded-lg px-4 py-3.5 text-sm md:text-base font-bold transition-all border border-white/10 focus:border-purple-400 shadow-sm">
                                <div className="flex items-center gap-3"><CalendarDays className="w-5 h-5 text-purple-400" /> {startB && endB ? `Du ${formatDisplayDate(startB)} au ${formatDisplayDate(endB)}` : 'Sélectionner une période'}</div>
                            </button>
                            {/* Z-INDEX TRÈS ÉLEVÉ */}
                            {showPickerB && (<div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 bg-[#0A0F1C] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[300] animate-in slide-in-from-top-2 origin-top">{renderCalendar(startB, endB, setStartB, setEndB, calViewB, setCalViewB, () => setShowPickerB(false))}</div>)}
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <StatCard onClickInfo={() => setStatInfo({title: 'Leads Contactés', description: statDescriptions['Leads Contactés']})} period="B" icon={Users} title="Leads Contactés" value={statsB.total} details={`${statsB.total} prospects contactés`} isWinner={statsB.total > statsA.total} />
                            <StatCard onClickInfo={() => setStatInfo({title: 'Taux de Réponse', description: statDescriptions['Taux de Réponse']})} period="B" icon={TrendingUp} title="Taux de Réponse" value={`${statsB.replyRate}%`} details={`${statsB.replies} réponses reçues`} isWinner={statsB.replyRate > statsA.replyRate} />
                            <StatCard onClickInfo={() => setStatInfo({title: 'Ratio de Positivité', description: statDescriptions['Ratio de Positivité']})} period="B" icon={CheckCircle} title="Ratio de Positivité" value={`${statsB.posRate}%`} details={`${statsB.positives} réponses positives`} isWinner={statsB.posRate > statsA.posRate} />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}