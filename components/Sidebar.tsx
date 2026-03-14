"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Activity, Zap, Settings, Database, Mail, Bot, Linkedin, 
  Search, X, CheckSquare, ExternalLink, Scale, Plus, Folder, Archive,
  MoreHorizontal, Pencil, Trash2
} from 'lucide-react';
import { useLoading } from '@/app/contexts/LoadingContext';

// --- Icônes SVG Custom ---
const ClaudeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14.5 2.5h3L10 21.5H7l7.5-19z M6 21.5H3l4-10h3l-4 10z" />
  </svg>
);

const PerplexityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v3h3v2h-3v3h-2v-3H8v-2h3V7z" />
  </svg>
);

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  dashSearch?: string;
  setDashSearch?: (val: string) => void;
  handleDashSearch?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  
  // PROPS OPTIONNELS (Uniquement utilisés par la Mailbox)
  currentView?: string;
  setCurrentView?: (view: string) => void;
  customFolders?: string[];
  setShowNewFolderModal?: (show: boolean) => void;
  setShowRenameFolderModal?: (show: boolean) => void;
  setRenameTarget?: (target: string) => void;
  triggerDeleteFolder?: (folder: string, e: React.MouseEvent) => void;
}

export default function Sidebar({ 
  mobileMenuOpen, setMobileMenuOpen, dashSearch, setDashSearch, handleDashSearch,
  currentView, setCurrentView, customFolders, setShowNewFolderModal, 
  setShowRenameFolderModal, setRenameTarget, triggerDeleteFolder
}: SidebarProps) {
  
  const router = useRouter();
  const pathname = usePathname(); 
  const { setLoading } = useLoading();
  
  // INITIALISATION SYNCHRONE AVEC LE CACHE NAVIGATEUR (Fini le clignotement !)
  const [todoCount, setTodoCount] = useState(() => {
    if (typeof window !== 'undefined') return parseInt(sessionStorage.getItem('lorth_todo_cache') || '30', 10);
    return 30; // Valeur par défaut côté serveur
  });
  
  const [mailCount, setMailCount] = useState(() => {
    if (typeof window !== 'undefined') return parseInt(sessionStorage.getItem('lorth_mail_cache') || '0', 10);
    return 0; // Valeur par défaut côté serveur
  });
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    if (pathname !== path) {
      setLoading(true);
    }
    router.push(path);
  };

  useEffect(() => {
    // 1. To-Do (Simulation de mise à jour)
    setTimeout(() => {
      setTodoCount(30);
      sessionStorage.setItem('lorth_todo_cache', '30');
    }, 1000);

    // 2. Mails urgents (Récupération réelle en arrière-plan)
    const fetchMailCount = async () => {
      try {
        const res = await fetch(`/api/leads`);
        const data = await res.json();
        if (data.leads) {
          const actionStatuses = ['Question à traiter', 'Objection à traiter', 'Vidéo à tourner', 'Erreur IA', 'Erreur IA Relance', 'Erreur IA Mail', 'En conversation', 'Ghost à relancer'];
          const urgents = data.leads.filter((l: any) => actionStatuses.includes(l.status) && !l.isArchived).length;
          
          setMailCount(urgents);
          sessionStorage.setItem('lorth_mail_cache', urgents.toString()); // On sauvegarde la nouvelle valeur
        }
      } catch (err) {
        console.error("Erreur fetch mails sidebar", err);
      }
    };
    
    fetchMailCount();

    const closeDropdown = () => setActiveDropdown(null);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);

  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className={`fixed md:relative z-[100] w-64 h-[100dvh] border-r border-white/5 bg-[#03060D] flex flex-col transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex-shrink-0`}>
      
      {/* STYLE POUR LA SCROLLBAR DE LA SIDEBAR */}
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}} />

      <button onClick={() => setMobileMenuOpen(false)} className="md:hidden absolute top-6 right-4 p-2 text-slate-400 hover:text-white">
        <X size={24} className="text-current" />
      </button>

      <div className="py-10 flex justify-center items-center flex-shrink-0">
        <button onClick={handleLogout} className="p-2 touch-manipulation active:scale-95 transition-transform outline-none group">
          <img src="/logo-lorth.svg" alt="LORTH" className="w-36 md:w-40 h-auto object-contain group-hover:opacity-90 transition-opacity" />
        </button>
      </div>
      
      {/* Recherche globale */}
      {setDashSearch && handleDashSearch && (
        <div className="px-4 mb-6 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus-within:border-blue-500/50 transition-colors group cursor-text">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={dashSearch || ""}
              onChange={(e) => setDashSearch(e.target.value)}
              onKeyDown={handleDashSearch}
              className="bg-transparent border-none outline-none text-[13px] font-medium text-white placeholder-slate-500 flex-1 w-full min-w-0"
            />
            <span className="hidden md:inline-block text-[11px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-slate-400">⌘K</span>
          </div>
        </div>
      )}

      {/* ZONE DE NAVIGATION */}
      <div className="px-4 flex-1 flex flex-col justify-start min-h-0 pb-2">
        <nav className="space-y-1.5 flex-shrink-0">
          {/* Dashboard */}
          <button onClick={() => handleNavigation('/')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium group cursor-pointer ${pathname === '/' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Activity size={18} className={pathname === '/' ? 'text-blue-400' : 'group-hover:text-blue-400 transition-colors'} />
            <span className="text-sm">Dashboard</span>
          </button>

          {/* To Do */}
          <button onClick={() => handleNavigation('/todo')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium group cursor-pointer ${pathname === '/todo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <CheckSquare size={18} className={pathname === '/todo' ? 'text-emerald-400' : 'group-hover:text-emerald-400 transition-colors'} />
            <div className="flex items-center gap-2">
              <span className="text-sm">To Do</span>
              {/* Le suppressHydrationWarning empêche Next.js de signaler une erreur si le serveur et le cache diffèrent */}
              {todoCount > 0 && (
                <span suppressHydrationWarning className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                  {todoCount}
                </span>
              )}
            </div>
          </button>
          
          {/* A/B Testing */}
          <button onClick={() => handleNavigation('/ab-testing')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium group cursor-pointer ${pathname === '/ab-testing' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/10 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Scale size={18} className={pathname === '/ab-testing' ? 'text-orange-400' : 'group-hover:text-orange-400 transition-colors'} />
            <span className="text-sm">A/B Testing</span>
          </button>

          {/* Mailbox */}
          <button onClick={() => handleNavigation('/mailbox')} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all font-medium group cursor-pointer ${pathname.startsWith('/mailbox') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <div className="flex items-center gap-3">
              <Zap size={18} className={pathname.startsWith('/mailbox') ? 'text-purple-400' : 'group-hover:text-purple-400 transition-colors'} />
              <span className="text-sm">Mailbox</span>
            </div>
            {mailCount > 0 && (
              <span suppressHydrationWarning className="flex bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                {mailCount}
              </span>
            )}
          </button>
        </nav>

        {/* CONDITION : Afficher Dossiers Mailbox (SCROLLABLE) OU Outils Externes */}
        {pathname.startsWith('/mailbox') && setCurrentView ? (
          <div className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="pt-4 pb-2 border-t border-white/5 flex-shrink-0">
              <p className="px-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Dossiers</p>
            </div>
            
            <nav className="space-y-0.5 pb-4 overflow-y-auto sidebar-scrollbar flex-1 pr-1">
              <button onClick={() => setCurrentView('urgent')} className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all font-medium group ${currentView === 'urgent' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-[18px] flex justify-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span></div>
                  <span className="text-[13px]">Action Requise</span>
                </div>
              </button>

              <button onClick={() => setCurrentView('all')} className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all font-medium group ${currentView === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <Database size={18} className={currentView === 'all' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className="text-[13px]">Boîte Globale</span>
                </div>
              </button>

              <button onClick={() => setCurrentView('favoris')} className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all font-medium group ${currentView === 'favoris' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-500/80 text-[16px] w-[18px] text-center">★</span>
                  <span className="text-[13px]">Favoris</span>
                </div>
              </button>
              
              {customFolders?.map(f => (
                <div key={f} className={`relative group w-full flex items-center justify-between rounded-xl transition-all ${currentView === f ? 'bg-white/10' : ''}`}>
                  <button onClick={() => setCurrentView(f)} className={`flex-1 flex items-center gap-3 px-4 py-2 rounded-xl transition-all font-medium ${currentView === f ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <Folder size={18} className={currentView === f ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span className="text-[13px] truncate">{f}</span>
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === f ? null : f); }}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-transparent hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {activeDropdown === f && setShowRenameFolderModal && setRenameTarget && triggerDeleteFolder && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-[#1A202E] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden py-1 animate-in slide-in-from-top-2">
                        <button onClick={(e) => { e.stopPropagation(); setRenameTarget(f); setShowRenameFolderModal(true); setActiveDropdown(null); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5">
                          <Pencil size={14} /> Renommer
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); triggerDeleteFolder(f, e); setActiveDropdown(null); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10">
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button onClick={() => setCurrentView('archives')} className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all font-medium group ${currentView === 'archives' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <Archive size={18} className={currentView === 'archives' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className="text-[13px]">Archives</span>
                </div>
              </button>

              {setShowNewFolderModal && (
                <button onClick={() => setShowNewFolderModal(true)} className="w-full flex items-center justify-between px-4 py-2 mt-2 rounded-xl transition-all font-medium group text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                  <div className="flex items-center gap-3">
                    <Plus size={18} />
                    <span className="text-[13px]">Créer un dossier</span>
                  </div>
                </button>
              )}
            </nav>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="pt-4 pb-2 border-t border-white/5 flex-shrink-0">
              <p className="px-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Outils Externes</p>
            </div>
            <nav className="space-y-0.5 pb-4 overflow-y-auto sidebar-scrollbar flex-1 pr-1">
              <a href="https://core.lorth-solutions.fr/projects/Q4LLvhM8ArK2SLzv/folders/M6CDLc1Ut2vjhwtP/workflows" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group">
                <div className="flex items-center gap-3"><Settings size={18} className="text-slate-500 group-hover:text-orange-400" /><span className="text-[13px]">n8n</span></div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://crm.lorth-solutions.fr/dashboard/#/nc/pbn3gbkprxor0gd/mhoa1urs9qyy1l0/vwe9ebbcdyw4w9yy/crm-lorth-crm-complet" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group">
                <div className="flex items-center gap-3"><Database size={18} className="text-slate-500 group-hover:text-blue-400" /><span className="text-[13px]">CRM</span></div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://app.trulyinbox.com/warmup" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group">
                <div className="flex items-center gap-3"><Mail size={18} className="text-slate-500 group-hover:text-emerald-400" /><span className="text-[13px]">TrulyInbox</span></div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group">
                <div className="flex items-center gap-3"><Bot size={18} className="text-slate-500 group-hover:text-purple-400" /><span className="text-[13px]">Gemini</span></div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group">
                <div className="flex items-center gap-3"><ClaudeIcon className="w-[18px] h-[18px] text-slate-500 group-hover:text-[#D97757]" /><span className="text-[13px]">Claude</span></div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://www.perplexity.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group">
                <div className="flex items-center gap-3"><PerplexityIcon className="w-[18px] h-[18px] text-slate-500 group-hover:text-teal-400" /><span className="text-[13px]">Perplexity</span></div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://www.linkedin.com/in/lorth/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group">
                <div className="flex items-center gap-3"><Linkedin size={18} className="text-slate-500 group-hover:text-[#0A66C2]" /><span className="text-[13px]">LinkedIn</span></div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-[#03060D] pb-[calc(1rem+env(safe-area-inset-bottom))] flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-default hover:bg-white/5 transition-colors">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-20 animate-ping"></span>
            <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-slate-300">Systèmes en ligne</span>
            <span className="text-[10px] font-medium text-slate-500">n8n & NocoDB Sync</span>
          </div>
        </div>
      </div>
    </aside>
  );
}