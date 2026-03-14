"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, Legend } from 'recharts';
import Sidebar from '@/components/Sidebar';
import { Activity, Users, Video, CheckCircle, TrendingUp, AlertCircle, RefreshCcw, ArrowUpRight, ArrowDownRight, MessageCircle, Info, ExternalLink, MessageSquare, Search, Menu, X, CalendarDays, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLoading } from './contexts/LoadingContext';

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export default function Dashboard() {
  const router = useRouter();
  const { loading: globalLoading, setLoading: setGlobalLoading } = useLoading();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoadingState] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  
  // États pour le sélecteur Custom
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarView, setCalendarView] = useState(new Date());
  
  const [statInfo, setStatInfo] = useState<{title: string, description: string} | null>(null);
  const [dashSearch, setDashSearch] = useState("");

  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const loadData = async () => {
    setLoadingState(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) {
        setAllLeads(data.leads);
      }
    } catch (err) {
      console.error("Erreur API", err);
    } finally {
      setLoadingState(false); 
    }
  };

  useEffect(() => {
    setMounted(true);
    document.title = "LORTH - Dashboard";
    loadData();
  }, []);

  const handleDashSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && dashSearch.trim() !== '') {
      router.push(`/mailbox?q=${encodeURIComponent(dashSearch.trim())}`);
    }
  };

  // Raccourci ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('dashSearchInput')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- LOGIQUE DU CALENDRIER CUSTOM ---
  const handleDayClick = (dateStr: string) => {
    if (!customStartDate || (customStartDate && customEndDate)) {
      setCustomStartDate(dateStr);
      setCustomEndDate('');
    } else {
      if (dateStr < customStartDate) {
        setCustomEndDate(customStartDate);
        setCustomStartDate(dateStr);
      } else {
        setCustomEndDate(dateStr);
      }
    }
  };

  const formatDisplayDate = (d: string) => {
    if (!d) return '--';
    const [y, m, day] = d.split('-');
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${parseInt(day)} ${months[parseInt(m)-1]}`;
  };

  const getDateLabel = () => {
    if (customStartDate && customEndDate) return `Du ${formatDisplayDate(customStartDate)} au ${formatDisplayDate(customEndDate)}`;
    if (customStartDate) return `À partir du ${formatDisplayDate(customStartDate)}...`;
    return "Sélectionner les dates";
  };

  const renderCalendar = () => {
    const year = calendarView.getFullYear();
    const month = calendarView.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startDayIndex = firstDay === 0 ? 6 : firstDay - 1; // Lundi = 0

    return (
      <div className="p-5 w-[300px] sm:w-[320px]">
        <div className="flex justify-between items-center mb-5">
          <button onClick={() => setCalendarView(new Date(year, month - 1, 1))} className="p-2 hover:bg-white/10 rounded-md text-slate-400 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
          <span className="text-sm font-bold text-white capitalize"><span>{calendarView.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span></span>
          <button onClick={() => setCalendarView(new Date(year, month + 1, 1))} className="p-2 hover:bg-white/10 rounded-md text-slate-400 transition-colors"><ChevronRight className="w-5 h-5"/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => <div key={d} className="text-[10px] font-extrabold text-slate-500"><span>{d}</span></div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} className="w-full aspect-square" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
             const day = i + 1;
             const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             const isStart = dateStr === customStartDate;
             const isEnd = dateStr === customEndDate;
             const isBetween = customStartDate && customEndDate && dateStr > customStartDate && dateStr < customEndDate;
             
             let bgClass = "text-slate-300 hover:bg-white/10 rounded-lg";
             if (isStart || isEnd) bgClass = "bg-blue-600 text-white font-black rounded-lg shadow-[0_0_10px_rgba(37,99,235,0.5)]";
             else if (isBetween) bgClass = "bg-blue-500/20 text-blue-300 rounded-sm";

             return (
               <button key={day} onClick={() => handleDayClick(dateStr)} className={`w-full aspect-square text-[12px] font-bold flex items-center justify-center transition-all ${bgClass}`}>
                 <span>{day}</span>
               </button>
             );
          })}
        </div>
        <div className="mt-5 pt-4 border-t border-white/10 flex justify-between gap-3">
            <button onClick={() => {setCustomStartDate(''); setCustomEndDate('');}} className="px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">Effacer</button>
            <button onClick={() => setShowDatePicker(false)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg border border-blue-500/50 flex-1 ml-2 text-center">Appliquer</button>
        </div>
      </div>
    );
  };
  // -------------------------------------

  // OPTIMISATION CRITIQUE : Utilisation de useMemo pour calculer les stats
  const stats = useMemo(() => {
    if (allLeads.length === 0) {
      return {
        totalLeads: 0, totalReplies: 0, replyRate: 0, videosPending: 0, objectionsWon: 0, 
        ongoingConversations: 0, aiErrors: 0, aiErrorRate: 0, bounced: 0, pipelineValue: 0, 
        graphData: [], objectionTypesData: [], 
        diffs: { totalLeads: null, replyRate: null, videosPending: null, objectionsWon: null, ongoingConversations: null, aiErrors: null }
      };
    }

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let currentStart = 0, prevStart = 0, prevEnd = 0, currentEnd = now.getTime();

    switch(timeRange) {
        case 'today':
            currentStart = todayMidnight;
            prevStart = todayMidnight - 86400000;
            prevEnd = currentStart;
            break;
        case 'week':
            currentStart = now.getTime() - 7 * 86400000;
            prevStart = now.getTime() - 14 * 86400000;
            prevEnd = currentStart;
            break;
        case 'month':
            currentStart = now.getTime() - 30 * 86400000;
            prevStart = now.getTime() - 60 * 86400000;
            prevEnd = currentStart;
            break;
        case 'year':
            currentStart = now.getTime() - 365 * 86400000;
            prevStart = now.getTime() - 730 * 86400000;
            prevEnd = currentStart;
            break;
        case 'custom':
            if (customStartDate && customEndDate) {
                const startParts = customStartDate.split('-');
                currentStart = new Date(parseInt(startParts[0]), parseInt(startParts[1])-1, parseInt(startParts[2])).getTime();
                const endParts = customEndDate.split('-');
                currentEnd = new Date(parseInt(endParts[0]), parseInt(endParts[1])-1, parseInt(endParts[2]), 23, 59, 59, 999).getTime();
            } else {
                currentStart = now.getTime() - 7 * 86400000;
                currentEnd = now.getTime();
            }
            const duration = currentEnd - currentStart;
            prevStart = currentStart - duration;
            prevEnd = currentStart;
            break;
        default:
            currentStart = 0;
            prevStart = 0;
            prevEnd = 0;
    }

    const currentLeads = timeRange === 'all' ? allLeads : allLeads.filter(l => l.rawDate >= currentStart && l.rawDate <= currentEnd);
    const prevLeads = timeRange === 'all' ? [] : allLeads.filter(l => l.rawDate >= prevStart && l.rawDate < prevEnd);

    const totalLeads = currentLeads.length;
    const totalReplies = currentLeads.filter(l => l.conversation && l.conversation.length > 1).length;
    const replyRate = totalLeads > 0 ? Math.round((totalReplies / totalLeads) * 100) : 0;
    
    const videosPending = currentLeads.filter(l => l.status === 'Vidéo à tourner').length;
    const objectionsWon = currentLeads.filter(l => l.status === 'Objection traitée' || l.status === 'Outreach Successful').length;
    const ongoingConversations = currentLeads.filter(l => ['Question à traiter', 'Objection à traiter', 'En conversation'].includes(l.status)).length;
    const bounced = currentLeads.filter(l => l.status === 'Bounced').length;
    
    const pipelineStatuses = ['Vidéo à tourner', 'Question à traiter', 'En conversation'];
    const pipelineLeadsCount = currentLeads.filter(l => pipelineStatuses.includes(l.status)).length;
    const pipelineValue = pipelineLeadsCount * 2500;

    const aiErrorStatuses = ['Erreur IA', 'Erreur IA Relance', 'Erreur IA Mail'];
    const aiErrors = currentLeads.filter(l => aiErrorStatuses.includes(l.status)).length;
    const aiErrorRate = totalReplies > 0 ? Math.round((aiErrors / totalReplies) * 100) : 0;

    const objectionTypes = ['Prix', 'Timing', 'Concurrence', 'Pas le besoin', 'Autre'];
    const objectionCounts = currentLeads.reduce((acc, lead) => {
        if (lead.Type_Objection) {
            const type = objectionTypes.includes(lead.Type_Objection) ? lead.Type_Objection : 'Autre';
            acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const objectionTypesData = objectionTypes.map(type => ({
        name: type,
        value: objectionCounts[type] || 0,
    })).filter(item => item.value > 0);

    const prevTotalLeads = prevLeads.length;
    const prevTotalReplies = prevLeads.filter(l => l.conversation && l.conversation.length > 1).length;
    const prevReplyRate = prevTotalLeads > 0 ? Math.round((prevTotalReplies / prevTotalLeads) * 100) : 0;
    const prevVideosPending = prevLeads.filter(l => l.status === 'Vidéo à tourner').length;
    const prevObjectionsWon = prevLeads.filter(l => l.status === 'Objection traitée' || l.status === 'Outreach Successful').length;
    const prevOngoing = prevLeads.filter(l => ['Question à traiter', 'Objection à traiter', 'En conversation'].includes(l.status)).length;
    const prevAiErrors = prevLeads.filter(l => aiErrorStatuses.includes(l.status)).length;

    const calcDiff = (curr: number, prev: number) => {
        if (timeRange === 'all') return null;
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    };

    let graphData: any[] = [];
    if (timeRange === 'today') {
        for(let i=6; i<=22; i+=2) {
            const startH = todayMidnight + i*3600000;
            const endH = todayMidnight + (i+2)*3600000;
            const repliesInHour = currentLeads.filter(l => l.conversation && l.conversation.length > 1 && l.rawDate >= startH && l.rawDate < endH).length;
            graphData.push({ date: `${i}h`, réponses: repliesInHour });
        }
    } else if (timeRange === 'week') {
        for(let i=6; i>=0; i--) {
            const d = new Date(now.getTime() - i*86400000);
            const dStart = new Date(d.setHours(0,0,0,0)).getTime();
            const dEnd = new Date(d.setHours(23,59,59,999)).getTime();
            const rep = currentLeads.filter(l => l.conversation && l.conversation.length > 1 && l.rawDate >= dStart && l.rawDate <= dEnd).length;
            graphData.push({ date: d.toLocaleDateString('fr-FR', {weekday: 'short'}), réponses: rep });
        }
    } else if (timeRange === 'month') {
        for(let i=29; i>=0; i-=3) {
            const dStart = new Date(now.getTime() - i*86400000).getTime();
            const dEnd = new Date(now.getTime() - (i-3)*86400000).getTime();
            const dateLabel = new Date(dStart).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
            const rep = currentLeads.filter(l => l.conversation && l.conversation.length > 1 && l.rawDate >= dStart && l.rawDate <= dEnd).length;
            graphData.push({ date: dateLabel, réponses: rep });
        }
    } else if (timeRange === 'custom') {
        const start = currentStart;
        const end = currentEnd;
        const days = Math.max(1, Math.round((end - start) / 86400000));
        const step = Math.max(1, Math.ceil(days / 30));
        for(let i=0; i<=days; i+=step) {
            const dStart = start + i * 86400000;
            const dEnd = dStart + step * 86400000 - 1;
            if (dStart > end) break;
            const dateLabel = new Date(dStart).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
            const rep = currentLeads.filter(l => l.conversation && l.conversation.length > 1 && l.rawDate >= dStart && l.rawDate <= dEnd).length;
            graphData.push({ date: dateLabel, réponses: rep });
        }
    } else {
        for(let i=11; i>=0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const dStart = d.getTime();
            const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).getTime();
            const dateLabel = d.toLocaleDateString('fr-FR', {month: 'short'});
            const rep = (timeRange === 'all' ? allLeads : currentLeads).filter(l => l.conversation && l.conversation.length > 1 && l.rawDate >= dStart && l.rawDate <= dEnd).length;
            graphData.push({ date: dateLabel, réponses: rep });
        }
    }

    return {
      totalLeads, totalReplies, replyRate, videosPending, objectionsWon, ongoingConversations, aiErrors, aiErrorRate, bounced, pipelineValue, graphData, objectionTypesData,
      diffs: {
        totalLeads: calcDiff(totalLeads, prevTotalLeads),
        replyRate: timeRange === 'all' ? null : replyRate - prevReplyRate,
        videosPending: calcDiff(videosPending, prevVideosPending),
        objectionsWon: calcDiff(objectionsWon, prevObjectionsWon),
        ongoingConversations: calcDiff(ongoingConversations, prevOngoing),
        aiErrors: calcDiff(aiErrors, prevAiErrors)
      }
    };
  }, [allLeads, timeRange, customStartDate, customEndDate]);

  const DiffBadge = ({ value, isRate = false, reversedColors = false }: { value: number | null, isRate?: boolean, reversedColors?: boolean }) => {
    if (value === null) return null;
    const isPositive = value > 0;
    const isNeutral = value === 0;
    
    let color = '';
    if (isNeutral) color = 'text-slate-400 bg-slate-500/10';
    else if (reversedColors) color = isPositive ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10';
    else color = isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10';

    const Icon = isPositive ? ArrowUpRight : isNeutral ? TrendingUp : ArrowDownRight;

    return (
      <div className={`flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-bold ${color} px-1 sm:px-2 py-0.5 rounded-md sm:rounded-full border border-white/5`}>
        <Icon className="w-2 h-2 sm:w-3 sm:h-3" />
        <span>{isPositive ? '+' : ''}{value}{isRate ? '%' : '%'}</span>
      </div>
    );
  };

  const openStatInfo = (title: string, description: string) => {
    setStatInfo({ title, description });
  };

  const formatPipeline = (val: number) => {
      if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'k €';
      return val + ' €';
  };

  return (
    <div className="flex h-[100dvh] bg-[#020408] text-slate-100 font-sans antialiased overflow-hidden relative">

      {/* MODALE D'EXPLICATION DES STATS */}
      {statInfo && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setStatInfo(null)}>
          <div className="bg-[#0A0F1C] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-apple-fade text-center mx-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 bg-blue-500/10 text-blue-400">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2"><span>{statInfo.title}</span></h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed"><span>{statInfo.description}</span></p>
            <button onClick={() => setStatInfo(null)} className="w-full py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5">
              <span>J&apos;ai compris</span>
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY MOBILE POUR FERMER LE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* SIDEBAR FIXE ET RESPONSIVE */}
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
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none hidden md:block"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none md:hidden"></div>
            
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 md:px-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-8 pb-4 relative z-10 min-h-0 h-full">
                
                {/* HEADER ALIGNÉ COMME 'TO DO' */}
                <header className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-4 mb-6 md:mb-8 flex-shrink-0">
                  <div className="flex items-start gap-3">
                    <button onClick={() => setMobileMenuOpen(true)} className="md:hidden mt-1 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors flex-shrink-0">
                      <Menu size={24} />
                    </button>
                    <div className="flex gap-4 items-center">
                      <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.15)] flex-shrink-0">
                        <Activity size={32} className="text-blue-400" />
                      </div>
                      <div className="flex flex-col gap-0.5 justify-center">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
                          Dashboard Visuel
                        </h1>
                        <p className="text-slate-400 text-xs md:text-[13px] font-medium">
                          Performances d&apos;acquisition en temps réel.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
                    
                    {timeRange === 'custom' && (
                      <div className="relative flex justify-center animate-in fade-in slide-in-from-right-4 w-full sm:w-auto">
                        <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] w-full sm:w-auto">
                          <CalendarDays className="w-4 h-4" />
                          <span>{getDateLabel()}</span>
                        </button>

                        {showDatePicker && (
                          <div className="absolute top-full mt-3 right-0 sm:left-0 sm:right-auto bg-[#0A0F1C] border border-white/10 rounded-2xl shadow-2xl z-[250] animate-in slide-in-from-top-2 origin-top">
                            {renderCalendar()}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-[#0A0F1C] border border-white/10 rounded-lg p-1 shadow-sm w-full sm:w-auto overflow-x-auto no-scrollbar flex-1 sm:flex-none">
                      <button onClick={() => {setTimeRange('today'); setShowDatePicker(false);}} className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-colors text-center whitespace-nowrap ${timeRange === 'today' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}><span>24h</span></button>
                      <button onClick={() => {setTimeRange('week'); setShowDatePicker(false);}} className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-colors text-center whitespace-nowrap ${timeRange === 'week' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}><span>7J</span></button>
                      <button onClick={() => {setTimeRange('month'); setShowDatePicker(false);}} className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-colors text-center whitespace-nowrap ${timeRange === 'month' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}><span>30J</span></button>
                      <button onClick={() => {setTimeRange('year'); setShowDatePicker(false);}} className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-colors text-center whitespace-nowrap ${timeRange === 'year' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}><span>12M</span></button>
                      <button onClick={() => {setTimeRange('all'); setShowDatePicker(false);}} className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-colors text-center whitespace-nowrap ${timeRange === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}><span>Global</span></button>
                      <div className="w-px h-4 bg-white/10 mx-1 shrink-0 hidden sm:block"></div>
                      <button onClick={() => setTimeRange('custom')} className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-colors text-center whitespace-nowrap ${timeRange === 'custom' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}><span>Dates</span></button>
                    </div>
                    <button onClick={loadData} className="flex-shrink-0 hidden sm:flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                      <RefreshCcw className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </header>

                {/* ZONE SCROLLABLE ADAPTATIVE : flex-1 min-h-0 empêche le débordement */}
                <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar -mx-4 md:-mx-8 px-4 md:px-8 pb-2">
                  
                  {/* LIGNE DES 6 KPIs : margin et padding réduits */}
                  <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-6 flex-shrink-0">
                    
                    {/* Pipeline Actif */}
                    <div onClick={() => openStatInfo("Pipeline Actif", "Valeur estimée du pipeline basée sur les leads ayant un statut 'Vidéo à tourner', 'Question à traiter', ou 'En conversation'. Chaque lead est valorisé à 2500€.")} className="bg-[#0A0F1C] border border-yellow-500/20 p-3 sm:p-4 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.08)] flex flex-col justify-between aspect-square relative overflow-hidden hover:border-yellow-500/40 hover:scale-[1.02] transition-all cursor-pointer group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                      <div className="flex justify-between items-start relative z-10 w-full">
                        <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg"><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" /></div>
                      </div>
                      <div className="relative z-10 mt-auto">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none"><span>{formatPipeline(stats.pipelineValue)}</span></h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-yellow-400/80 mt-1 sm:mt-1.5 uppercase tracking-wider truncate"><span>Pipeline</span></p>
                      </div>
                    </div>

                    {/* Leads Contactés */}
                    <div onClick={() => openStatInfo("Leads Contactés", "Le nombre total de prospects uniques ayant reçu au moins un e-mail de vos séquences sur la période sélectionnée.")} className="bg-[#0A0F1C] border border-white/5 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col justify-between aspect-square hover:bg-white/[0.03] hover:border-white/10 hover:scale-[1.02] transition-all cursor-pointer group">
                      <div className="flex justify-between items-start w-full">
                        <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" /></div>
                        <DiffBadge value={stats.diffs.totalLeads} />
                      </div>
                      <div className="mt-auto">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none"><span>{stats.totalLeads}</span></h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 sm:mt-1.5 uppercase tracking-wider truncate"><span>Leads</span></p>
                      </div>
                    </div>

                    {/* Taux de Réponse */}
                    <div onClick={() => openStatInfo("Taux de Réponse", "Le pourcentage de prospects qui ont répondu à vos emails.")} className="bg-[#0A0F1C] border border-white/5 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col justify-between aspect-square hover:bg-white/[0.03] hover:border-white/10 hover:scale-[1.02] transition-all cursor-pointer group">
                      <div className="flex justify-between items-start w-full">
                        <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /></div>
                        <DiffBadge value={stats.diffs.replyRate} isRate={true} />
                      </div>
                      <div className="mt-auto">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none"><span>{stats.replyRate}%</span></h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 sm:mt-1.5 uppercase tracking-wider truncate"><span>Réponses</span></p>
                      </div>
                    </div>

                    {/* Vidéos à Tourner */}
                    <div onClick={() => openStatInfo("Vidéos à Tourner", "Leads qualifiés attendant une vidéo sur-mesure.")} className="bg-[#0A0F1C] border border-white/5 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col justify-between aspect-square hover:bg-white/[0.03] hover:border-white/10 hover:scale-[1.02] transition-all cursor-pointer group">
                      <div className="flex justify-between items-start w-full">
                        <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg"><Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" /></div>
                        <DiffBadge value={stats.diffs.videosPending} />
                      </div>
                      <div className="mt-auto">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none"><span>{stats.videosPending}</span></h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 sm:mt-1.5 uppercase tracking-wider truncate"><span>Vidéos</span></p>
                      </div>
                    </div>

                    {/* Outreach Successful */}
                    <div onClick={() => openStatInfo("Outreach Successful", "Nombre de leads convertis ou traités avec succès.")} className="bg-[#0A0F1C] border border-white/5 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col justify-between aspect-square hover:bg-white/[0.03] hover:border-white/10 hover:scale-[1.02] transition-all cursor-pointer group">
                      <div className="flex justify-between items-start w-full">
                        <div className="p-1.5 sm:p-2 bg-teal-500/10 rounded-lg"><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" /></div>
                        <DiffBadge value={stats.diffs.objectionsWon} />
                      </div>
                      <div className="mt-auto">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none"><span>{stats.objectionsWon}</span></h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 sm:mt-1.5 uppercase tracking-wider truncate"><span>Succès</span></p>
                      </div>
                    </div>

                    {/* Conversations en cours */}
                    <div onClick={() => openStatInfo("Conversations en cours", "Leads attendant une réponse humaine de votre part.")} className="bg-[#0A0F1C] border border-white/5 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col justify-between aspect-square hover:bg-white/[0.03] hover:border-white/10 hover:scale-[1.02] transition-all cursor-pointer group">
                        <div className="flex justify-between items-start w-full">
                          <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg"><MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" /></div>
                          <DiffBadge value={stats.diffs.ongoingConversations} />
                        </div>
                        <div className="mt-auto">
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none"><span>{stats.ongoingConversations}</span></h3>
                          <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 sm:mt-1.5 uppercase tracking-wider truncate"><span>En cours</span></p>
                        </div>
                    </div>

                  </div>

                  {/* ZONE GRAPHIQUES COMPRESSIBLE : prend l'espace restant */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                    
                    {/* Grand Graphique : min-height réduit et flex-1 pour absorber l'espace */}
                    <div className="lg:col-span-2 bg-[#0A0F1C] border border-white/5 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col h-full min-h-[200px]">
                      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex-shrink-0"><span>Acquisition</span></h3>
                      <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.graphData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <defs><linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickMargin={10} axisLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickMargin={10} axisLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0A0F1C', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '10px 14px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} itemStyle={{ color: '#60A5FA' }} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '5 5' }}/>
                            <Area type="monotone" dataKey="réponses" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorReplies)" activeDot={{ r: 6, fill: '#3B82F6', stroke: '#0A0F1C', strokeWidth: 3 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-4 h-full">
                      {/* Graphique Circulaire */}
                      <div className="bg-[#0A0F1C] border border-white/5 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col flex-1 min-h-[140px]">
                        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-2 flex-shrink-0"><span>Analyse des Objections</span></h3>
                        {stats.objectionTypesData.length > 0 ? (
                          <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={stats.objectionTypesData} cx="50%" cy="50%" labelLine={false} innerRadius={35} outerRadius={60} fill="#8884d8" dataKey="value" stroke="none">
                                  {stats.objectionTypesData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3b82f6', '#64748b', '#334155', '#1e293b', '#475569'][index % 5]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#03060D', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}/>
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: '600' }}/>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-sm font-medium text-slate-500"><span>Aucune donnée d&apos;objection</span></div>
                        )}
                      </div>
                      
                      {/* Santé Système */}
                      <div className="bg-[#0A0F1C] border border-white/5 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col flex-shrink-0">
                        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-3"><span>Santé Système</span></h3>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400" /><div><h4 className="text-sm font-bold text-white"><span>Bounces</span></h4></div></div>
                            <span className="text-lg font-black text-red-400"><span>{stats.bounced}</span></span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div></div><div><h4 className="text-sm font-bold text-white"><span>Serveur n8n</span></h4></div></div>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md"><span>Online</span></span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}