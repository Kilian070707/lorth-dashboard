"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Users, CheckCircle, TrendingUp, RefreshCcw, MessageCircle, AlertTriangle, Info, ExternalLink, Search, Menu, X, CalendarDays, ChevronLeft, ChevronRight, Scale, Trophy, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatToYMD } from '@/lib/utils';
import { useLoading } from '@/app/contexts/LoadingContext';

const today = new Date();
const defaultAStart = new Date(today.getFullYear(), today.getMonth(), 1);
const defaultAEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const defaultBStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const defaultBEnd = new Date(today.getFullYear(), today.getMonth(), 0);

export default function ABTesting() {
  const router = useRouter();
  const { loading: globalLoading, setLoading: setGlobalLoading } = useLoading();
  const [loading, setLoadingState] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [dashSearch, setDashSearch] = useState("");

  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

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
    setLoadingState(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) setAllLeads(data.leads);
    } catch (err) {
      console.error("Erreur API", err);
    } finally {
      setLoadingState(false);
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
      <div className="p-4 w-[280px] sm:w-[300px]">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCalView(new Date(year, month - 1, 1))} className="p-2 hover:bg-white/10 rounded-md text-slate-400 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
          <span className="text-sm font-bold text-white capitalize">{calView.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCalView(new Date(year, month + 1, 1))} className="p-2 hover:bg-white/10 rounded-md text-slate-400 transition-colors"><ChevronRight className="w-5 h-5"/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => <div key={d} className="text-[10px] font-extrabold text-slate-500">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} className="w-full aspect-square" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
             const day = i + 1;
             const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             const isStart = dateStr === start;
             const isEnd = dateStr === end;
             const isBetween = start && end && dateStr > start && dateStr < end;
             
             let bgClass = "text-slate-300 hover:bg-white/10 rounded-lg";
             if (isStart || isEnd) bgClass = "bg-blue-600 text-white font-black rounded-lg shadow-[0_0_10px_rgba(37,99,235,0.5)]";
             else if (isBetween) bgClass = "bg-blue-500/20 text-blue-300 rounded-sm";

             return (<button key={day} onClick={() => handleDayClick(dateStr)} className={`w-full aspect-square text-[11px] font-bold flex items-center justify-center transition-all ${bgClass}`}>{day}</button>);
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between gap-2">
            <button onClick={() => {setStart(''); setEnd('');}} className="px-3 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Effacer</button>
            <button onClick={close} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors border border-blue-500/50 flex-1 ml-2 text-center">Appliquer</button>
        </div>
      </div>
    );
  };

  const StatCard = ({ period, title, value, details, isWinner, icon: Icon, onClickInfo }: any) => {
      const color = period === 'A' ? 'blue' : 'purple';
      const baseClasses = "bg-[#0A0F1C] border p-4 sm:p-5 rounded-2xl transition-all duration-300 relative group cursor-pointer hover:scale-[1.02] flex-1 flex flex-col justify-center";
      const winnerClasses = `border-${color}-500/40 shadow-lg shadow-${color}-500/10`;
      const normalClasses = `border-white/5 hover:border-${color}-500/50`;
      
      const trophyGlowClass = color === 'blue' 
        ? 'drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' 
        : 'drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]';

      return (
          <div className={`${baseClasses} ${isWinner ? winnerClasses : normalClasses}`} onClick={onClickInfo}>
              <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-${color}-500/10`}><Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${color}-400`} /></div>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors"><span>{title}</span></p>
                  </div>
                  {isWinner ? <Trophy className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${color}-400 ${trophyGlowClass}`} /> : <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
              <p className={`text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mt-1 mb-0.5`}><span>{value}</span></p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium"><span>{details}</span></p>
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


      {/* MODALE D'EXPLICATION DES STATS */}
      {statInfo && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 px-4" onClick={() => setStatInfo(null)}>
          <div className="bg-[#0A0F1C] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-apple-fade text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 bg-blue-500/10 text-blue-400">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2"><span>{statInfo.title}</span></h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed"><span>{statInfo.description}</span></p>
            <button onClick={() => setStatInfo(null)} className="w-full py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5">
              <span>J'ai compris</span>
            </button>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        dashSearch={dashSearch}
        setDashSearch={setDashSearch}
        handleDashSearch={handleDashSearch}
      />

      <main className="flex-1 flex flex-col h-[100dvh] relative overflow-hidden min-w-0">
        {globalLoading ? <LoadingSpinner /> : (
          <>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none hidden md:block"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none md:hidden"></div>
            
            <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-10 flex-1 flex flex-col h-full min-h-0">
              
              {/* HEADER ALIGNÉ COMME 'TO DO' & 'DASHBOARD' */}
              <header className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-4 mb-6 md:mb-8 flex-shrink-0">
                <div className="flex items-start gap-3">
                  <button onClick={() => setMobileMenuOpen(true)} className="md:hidden mt-1 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors flex-shrink-0">
                    <Menu size={24} />
                  </button>
                  <div className="flex gap-4 items-center">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.15)] flex-shrink-0">
                      <Scale size={32} className="text-blue-400" />
                    </div>
                    <div className="flex flex-col gap-0.5 justify-center">
                      <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
                        A/B Testing
                      </h1>
                      <p className="text-slate-400 text-xs md:text-[13px] font-medium">
                        Comparez l'efficacité de deux périodes d'acquisition.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
                  <button onClick={loadData} className="flex-shrink-0 flex items-center justify-center w-full sm:w-10 sm:h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-lg transition-colors py-2 sm:py-0">
                    <RefreshCcw size={18} className="text-slate-300 mr-2 sm:mr-0" />
                    <span className="sm:hidden text-sm font-bold text-slate-300">Rafraîchir</span>
                  </button>
                </div>
              </header>

              {loading ? (
                <LoadingSpinner />
              ) : (
                <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-6 min-h-0">
                    
                    <div className="bg-[#0A0F1C]/80 border border-white/5 rounded-[2rem] shadow-xl flex flex-col lg:flex-row overflow-hidden flex-1 min-h-0">
                        
                        {/* --- COLUMN A --- */}
                        <div className="flex-1 p-5 md:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent relative flex flex-col min-h-0">
                            <h3 className="text-xs sm:text-sm font-extrabold text-blue-400 uppercase tracking-widest mb-4 sm:mb-5 flex items-center gap-2 flex-shrink-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span> <span>Période A</span>
                            </h3>
                            <div className="relative mb-5 sm:mb-6 flex-shrink-0">
                                <button onClick={() => {setShowPickerA(!showPickerA); setShowPickerB(false);}} className="w-full flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm md:text-base font-bold transition-all border border-white/10 hover:border-blue-500/50 shadow-sm group">
                                    <div className="flex items-center gap-3"><CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:scale-110 transition-transform" /> <span>{startA && endA ? `Du ${formatDisplayDate(startA)} au ${formatDisplayDate(endA)}` : 'Sélectionner une période'}</span></div>
                                </button>
                                {showPickerA && (<div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 md:left-0 md:right-auto bg-[#0A0F1C] border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-[300] animate-in slide-in-from-top-2 origin-top">{renderCalendar(startA, endA, setStartA, setEndA, calViewA, setCalViewA, () => setShowPickerA(false))}</div>)}
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-3 min-h-0">
                                <StatCard onClickInfo={() => setStatInfo({title: 'Leads Contactés', description: statDescriptions['Leads Contactés']})} period="A" icon={Users} title="Leads Contactés" value={statsA.total} details={`${statsA.total} prospects contactés`} isWinner={statsA.total > statsB.total} />
                                <StatCard onClickInfo={() => setStatInfo({title: 'Taux de Réponse', description: statDescriptions['Taux de Réponse']})} period="A" icon={TrendingUp} title="Taux de Réponse" value={`${statsA.replyRate}%`} details={`${statsA.replies} réponses reçues`} isWinner={statsA.replyRate > statsB.replyRate} />
                                <StatCard onClickInfo={() => setStatInfo({title: 'Ratio de Positivité', description: statDescriptions['Ratio de Positivité']})} period="A" icon={CheckCircle} title="Ratio de Positivité" value={`${statsA.posRate}%`} details={`${statsA.positives} réponses positives`} isWinner={statsA.posRate > statsB.posRate} />
                            </div>
                        </div>

                        {/* --- COLUMN B --- */}
                        <div className="flex-1 p-5 md:p-6 lg:p-8 bg-gradient-to-br from-purple-500/5 to-transparent relative flex flex-col min-h-0">
                            <h3 className="text-xs sm:text-sm font-extrabold text-purple-400 uppercase tracking-widest mb-4 sm:mb-5 flex items-center gap-2 flex-shrink-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span> <span>Période B</span>
                            </h3>
                            <div className="relative mb-5 sm:mb-6 flex-shrink-0">
                                <button onClick={() => {setShowPickerB(!showPickerB); setShowPickerA(false);}} className="w-full flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm md:text-base font-bold transition-all border border-white/10 hover:border-purple-500/50 shadow-sm group">
                                    <div className="flex items-center gap-3"><CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:scale-110 transition-transform" /> <span>{startB && endB ? `Du ${formatDisplayDate(startB)} au ${formatDisplayDate(endB)}` : 'Sélectionner une période'}</span></div>
                                </button>
                                {showPickerB && (<div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 bg-[#0A0F1C] border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-[300] animate-in slide-in-from-top-2 origin-top">{renderCalendar(startB, endB, setStartB, setEndB, calViewB, setCalViewB, () => setShowPickerB(false))}</div>)}
                            </div>

                            <div className="flex-1 flex flex-col gap-3 min-h-0">
                                <StatCard onClickInfo={() => setStatInfo({title: 'Leads Contactés', description: statDescriptions['Leads Contactés']})} period="B" icon={Users} title="Leads Contactés" value={statsB.total} details={`${statsB.total} prospects contactés`} isWinner={statsB.total > statsA.total} />
                                <StatCard onClickInfo={() => setStatInfo({title: 'Taux de Réponse', description: statDescriptions['Taux de Réponse']})} period="B" icon={TrendingUp} title="Taux de Réponse" value={`${statsB.replyRate}%`} details={`${statsB.replies} réponses reçues`} isWinner={statsB.replyRate > statsA.replyRate} />
                                <StatCard onClickInfo={() => setStatInfo({title: 'Ratio de Positivité', description: statDescriptions['Ratio de Positivité']})} period="B" icon={CheckCircle} title="Ratio de Positivité" value={`${statsB.posRate}%`} details={`${statsB.positives} réponses positives`} isWinner={statsB.posRate > statsA.posRate} />
                            </div>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}