"use client";
import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronDown, Activity, Zap, CheckCircle, Clock, AlertTriangle, AlertCircle, Trash2, PauseCircle, Send, Info, Filter, MessageCircle, MessageSquare, Menu, X, ArrowLeft, Beaker, Bot } from 'lucide-react';

function MailboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAiDraft, setIsAiDraft] = useState(false);
  
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [showConfirmSend, setShowConfirmSend] = useState(false);
  
  const [alertPopup, setAlertPopup] = useState<{show: boolean, title: string, message: string, type: 'success' | 'error'} | null>(null);
  
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState("");
  const [folderToDelete, setFolderToDelete] = useState("");

  const [currentView, setCurrentView] = useState<string>('urgent');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showCentralMenu, setShowCentralMenu] = useState(false); 
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const actionStatuses = ['Question à traiter', 'Objection à traiter', 'Vidéo à tourner', 'Erreur IA', 'Erreur IA Relance', 'Erreur IA Mail', 'En conversation', 'Ghost à relancer'];

  useEffect(() => {
    if (alertPopup?.show) {
      const timer = setTimeout(() => {
        setAlertPopup(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertPopup]);

  const handleSelectLead = (lead: any) => {
    setSelectedLead(lead);
    if (lead) setIsMobileChatOpen(true);
    
    if (lead && lead.Brouillon_IA) {
      setReplyText(lead.Brouillon_IA);
      setIsAiDraft(true);
    } else {
      setReplyText("");
      setIsAiDraft(false);
    }
  };

  const handleCloseMobileChat = () => {
    setIsMobileChatOpen(false);
  };
  
  useEffect(() => {
    document.title = "LORTH - Mailbox";
    const savedFolders = localStorage.getItem('lorth_custom_folders');
    if (savedFolders) {
        setCustomFolders(JSON.parse(savedFolders).filter((f: string) => f !== 'Favoris'));
    }
    
    const q = searchParams?.get('q');
    if (q) {
      setSearchQuery(q);
      setCurrentView('all'); 
    }
    
    loadData();
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads`);
      const data = await res.json();
      
      if (data.leads) {
        const localHistory = JSON.parse(localStorage.getItem('lorth_local_history') || '{}');
        const enhancedLeads = data.leads.map((lead: any) => {
            if (localHistory[lead.id]) {
                const cloudMsgIds = lead.conversation.map((m: any) => m.id);
                const missingLocalMsgs = localHistory[lead.id].filter((m: any) => !cloudMsgIds.includes(m.id));
                lead.conversation = [...lead.conversation, ...missingLocalMsgs];
            }
            return lead;
        });

        setAllLeads(enhancedLeads);
        
        const q = searchParams?.get('q');
        if (q) {
          const matches = enhancedLeads.filter((l: any) => l.name.toLowerCase().includes(q.toLowerCase()) || l.company.toLowerCase().includes(q.toLowerCase()) || l.email.toLowerCase().includes(q.toLowerCase()));
          if (matches.length > 0 && window.innerWidth >= 768) handleSelectLead(matches[0]);
        } else {
          const urgents = enhancedLeads.filter((l: any) => actionStatuses.includes(l.status) && !l.isArchived);
          if (urgents.length > 0) {
              setCurrentView('urgent');
              if (window.innerWidth >= 768) handleSelectLead(urgents[0]);
          } else {
              setCurrentView('all');
              if (enhancedLeads.length > 0 && window.innerWidth >= 768) handleSelectLead(enhancedLeads[0]);
          }
        }
      }
    } catch (err) {
      console.error("Erreur API", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    if (isAiDraft) setIsAiDraft(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; 
    }
  };

  const executeSend = async () => {
    setShowConfirmSend(false);
    if (!selectedLead) return;
    
    const payload = {
      leadId: selectedLead.id,
      toEmail: selectedLead.email,
      fromEmail: selectedLead.sender,
      message: replyText,
      leadName: selectedLead.name,
      subject: selectedLead.subject
    };

    try {
      const response = await fetch('https://core.lorth-solutions.fr/webhook/unibox-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newMessage = { id: `msg-local-${Date.now()}`, senderName: "Kilian Lorth", isMe: true, text: replyText, date: "À l'instant", timestamp: Date.now() };
        const updatedConversation = [...selectedLead.conversation, newMessage];
        const updatedLead = { ...selectedLead, conversation: updatedConversation };
        
        handleSelectLead(updatedLead);
        setAllLeads(prevLeads => prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l));
        
        const localHistory = JSON.parse(localStorage.getItem('lorth_local_history') || '{}');
        localHistory[updatedLead.id] = localHistory[updatedLead.id] ? [...localHistory[updatedLead.id], newMessage] : [newMessage];
        localStorage.setItem('lorth_local_history', JSON.stringify(localHistory));

        fetch('/api/leads/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([
            { Id: selectedLead.id, Historique: JSON.stringify(updatedConversation) },
            { Id: selectedLead.id, Brouillon_IA: "" }
          ])
        });

        setReplyText("");
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setAlertPopup({ show: true, title: "Envoyé", message: "Le message a été transmis.", type: 'success' });
      } else {
        setAlertPopup({ show: true, title: "Échec", message: "n8n a refusé la connexion.", type: 'error' });
      }
    } catch (error) {
      setAlertPopup({ show: true, title: "Erreur", message: "Impossible de joindre le serveur.", type: 'error' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!replyText.trim()) return;
      if (e.metaKey || e.ctrlKey) executeSend();
      else setShowConfirmSend(true);
    }
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const actionSelected = async (actionType: 'archive' | 'folder' | 'restore', folderName?: string) => {
    setAllLeads(prev => prev.map(l => {
        if (!selectedIds.includes(l.id)) return l;
        if (actionType === 'archive') return { ...l, isArchived: true, folder: null };
        if (actionType === 'folder') return { ...l, folder: folderName, isArchived: false };
        if (actionType === 'restore') return { ...l, isArchived: false };
        return l;
    }));

    if (selectedLead && selectedIds.includes(selectedLead.id)) {
        handleSelectLead(null);
        setIsMobileChatOpen(false);
    }
    
    const payload = selectedIds.map(id => {
        if (actionType === 'archive') return { Id: id, Archive: true, Dossier: null };
        if (actionType === 'folder') return { Id: id, Dossier: folderName, Archive: false };
        return { Id: id, Archive: false }; 
    });
    
    setSelectedIds([]);
    setShowFolderMenu(false);

    fetch('/api/leads/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedLead || selectedLead.status === newStatus) return;

    const updatedLead = { ...selectedLead, status: newStatus };
    handleSelectLead(updatedLead);
    setAllLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setIsStatusMenuOpen(false);

    if (newStatus !== 'En conversation') {
      try {
        await fetch('/api/leads/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ Id: updatedLead.id, Statut: newStatus }])
        });
      } catch (e) {
        console.error("Erreur mise à jour statut", e);
      }
    }
  };

  const confirmCreateFolder = () => {
    if (newFolderName && newFolderName.trim() !== "" && !customFolders.includes(newFolderName.trim())) {
      const newFolders = [...customFolders, newFolderName.trim()];
      setCustomFolders(newFolders);
      localStorage.setItem('lorth_custom_folders', JSON.stringify(newFolders));
      setCurrentView(newFolderName.trim());
    }
    setNewFolderName("");
    setShowNewFolderModal(false);
  };

  const confirmRenameFolder = () => {
    if (!newFolderName.trim() || newFolderName === renameTarget || customFolders.includes(newFolderName)) {
        setShowRenameFolderModal(false);
        return;
    }
    const finalName = newFolderName.trim();
    const newFolders = customFolders.map(f => f === renameTarget ? finalName : f);
    setCustomFolders(newFolders);
    localStorage.setItem('lorth_custom_folders', JSON.stringify(newFolders));
    if (currentView === renameTarget) setCurrentView(finalName);

    const leadsToUpdate = allLeads.filter(l => l.folder === renameTarget).map(l => l.id);
    if (leadsToUpdate.length > 0) {
        setAllLeads(prev => prev.map(l => l.folder === renameTarget ? { ...l, folder: finalName } : l));
        fetch('/api/leads/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadsToUpdate.map(id => ({ Id: id, Dossier: finalName })))
        });
    }
    setShowRenameFolderModal(false);
  };

  const triggerDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToDelete(folderName);
    setShowDeleteFolderModal(true);
  };

  const confirmDeleteFolder = () => {
    const newFolders = customFolders.filter(f => f !== folderToDelete);
    setCustomFolders(newFolders);
    localStorage.setItem('lorth_custom_folders', JSON.stringify(newFolders));
    if (currentView === folderToDelete) setCurrentView('all');

    const leadsToUpdate = allLeads.filter(l => l.folder === folderToDelete).map(l => l.id);
    if (leadsToUpdate.length > 0) {
        setAllLeads(prev => prev.map(l => l.folder === folderToDelete ? { ...l, folder: null } : l));
        fetch('/api/leads/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadsToUpdate.map(id => ({ Id: id, Dossier: null })))
        });
    }
    setShowDeleteFolderModal(false);
    setFolderToDelete("");
  };


  const getVisualStatusName = (status: string) => {
    switch(status) {
      case 'Question à traiter': return 'Réponse - Question';
      case 'Objection à traiter': return 'Réponse - Objection';
      case 'Objection traitée': return 'Outreach Successful';
      case 'Mail envoyé': return '1er cold outreach';
      case 'Ghost à relancer': return 'Ghost à relancer';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Ghost à relancer') return { bg: 'bg-slate-800', text: 'text-slate-200', border: 'border-slate-600', dot: 'bg-slate-300 shadow-[0_0_8px_#cbd5e1]' };
    if (status === 'Question à traiter') return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400 shadow-[0_0_8px_#34D399]' };
    if (status === 'Objection à traiter') return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400 shadow-[0_0_8px_#FACC15]' };
    if (status === 'Objection traitée' || status === 'Outreach Successful') return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', dot: 'bg-teal-400 shadow-[0_0_8px_#2DD4BF]' };
    if (status === 'Mail envoyé') return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400 shadow-[0_0_8px_#60A5FA]' };
    if (status === 'En conversation') return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400 shadow-[0_0_8px_#FB923C]' };
    if (status === 'Vidéo à tourner') return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400 shadow-[0_0_8px_#C084FC]' };
    if (status?.includes('Erreur')) return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-400 shadow-[0_0_8px_#F43F5E]' };
    if (status === 'Bounced' || status === 'Désinscrit') return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400 shadow-[0_0_8px_#F87171]' };
    return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-400 shadow-[0_0_8px_#94A3B8]' };
  };

  const { displayLeads, uniqueStatusesInView, urgentCount } = useMemo(() => {
    let beforeFilter = allLeads;
    
    if (currentView === 'urgent') beforeFilter = allLeads.filter(l => actionStatuses.includes(l.status) && !l.isArchived);
    else if (currentView === 'all') beforeFilter = allLeads.filter(l => !l.isArchived);
    else if (currentView === 'archives') beforeFilter = allLeads.filter(l => l.isArchived);
    else beforeFilter = allLeads.filter(l => l.folder === currentView && !l.isArchived);
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      beforeFilter = beforeFilter.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.company.toLowerCase().includes(q) || 
        l.email.toLowerCase().includes(q)
      );
    }

    const unique = Array.from(new Set(beforeFilter.map(l => l.status)));
    const finalLeads = statusFilter ? beforeFilter.filter(l => l.status === statusFilter) : beforeFilter;
    const count = allLeads.filter(l => actionStatuses.includes(l.status) && !l.isArchived).length;

    return { displayLeads: finalLeads, uniqueStatusesInView: unique, urgentCount: count };
  }, [allLeads, currentView, searchQuery, statusFilter, actionStatuses]);

  const getViewTitle = () => {
      if (searchQuery.trim() !== '') return "Résultats de recherche";
      if (currentView === 'urgent') return "Action Requise";
      if (currentView === 'all') return "Boîte Globale";
      if (currentView === 'archives') return "Archives";
      if (currentView === 'favoris') return "Favoris";
      return `Dossier: ${currentView}`;
  };

  return (
    <div className="flex h-[100dvh] bg-[#020408] text-slate-100 font-sans antialiased overflow-hidden relative">
      
      <style>{`
        @keyframes appleFadeIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-apple-fade { animation: appleFadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-apple-fade-delay { opacity: 0; animation: appleFadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s forwards; }
        
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
        .fast-spin { animation: spin 0.5s linear infinite; }
      `}</style>

      {/* --- MODALES DOSSIERS --- */}
      {showNewFolderModal && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#0A0F1C] border border-white/10 p-6 rounded-2xl shadow-2xl max-sm w-full animate-apple-fade">
            <h3 className="text-lg font-extrabold text-white mb-4">Nouveau dossier</h3>
            <input 
              type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nom du dossier..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-blue-500/50 transition-colors"
              autoFocus onKeyDown={(e) => e.key === 'Enter' && confirmCreateFolder()}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => {setShowNewFolderModal(false); setNewFolderName("");}} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={confirmCreateFolder} disabled={!newFolderName.trim()} className="px-4 py-2 text-sm font-extrabold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:text-white/50 text-white rounded-lg transition-all">Créer</button>
            </div>
          </div>
        </div>
      )}

      {showRenameFolderModal && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#0A0F1C] border border-white/10 p-6 rounded-2xl shadow-2xl max-sm w-full animate-apple-fade">
            <h3 className="text-lg font-extrabold text-white mb-4">Renommer "{renameTarget}"</h3>
            <input 
              type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nouveau nom..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-blue-500/50 transition-colors"
              autoFocus onKeyDown={(e) => e.key === 'Enter' && confirmRenameFolder()}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => {setShowRenameFolderModal(false); setRenameTarget(""); setNewFolderName("");}} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={confirmRenameFolder} disabled={!newFolderName.trim()} className="px-4 py-2 text-sm font-extrabold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:text-white/50 text-white rounded-lg transition-all">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteFolderModal && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#0A0F1C] border border-rose-500/30 p-6 rounded-2xl shadow-2xl max-sm w-full animate-apple-fade">
            <h3 className="text-lg font-extrabold text-white mb-2">Supprimer le dossier ?</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le dossier <span className="text-white font-bold">"{folderToDelete}"</span> ?<br/><br/>
              Les leads à l'intérieur ne seront pas supprimés, ils retourneront simplement dans la Boîte Globale.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => {setShowDeleteFolderModal(false); setFolderToDelete("");}} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={confirmDeleteFolder} className="px-4 py-2 text-sm font-extrabold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)]">Oui, supprimer</button>
            </div>
          </div>
        </div>
      )}

      {alertPopup?.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-8 z-[200] animate-slide-up w-[90%] md:w-auto min-w-[300px]">
          <div className={`bg-[#0A0F1C] border rounded-xl shadow-2xl p-4 flex items-center gap-4 ${alertPopup.type === 'success' ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
            <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center shadow-inner ${alertPopup.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {alertPopup.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-extrabold text-white">{alertPopup.title}</h4>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{alertPopup.message}</p>
            </div>
            <button onClick={() => setAlertPopup(null)} className="text-slate-500 hover:text-white p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showConfirmSend && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="bg-[#0A0F1C] border border-white/10 p-6 rounded-2xl shadow-2xl max-md w-full animate-apple-fade">
            <h3 className="text-lg font-extrabold text-white mb-2">Confirmer l'envoi</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Envoi à <span className="text-white font-bold">{selectedLead?.email}</span> via <span className="text-white font-bold">{selectedLead?.sender}</span>.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmSend(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={executeSend} className="px-4 py-2 text-sm font-extrabold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">Oui, envoyer</button>
            </div>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <aside className={`fixed md:relative z-[100] w-64 h-[100dvh] border-r border-white/5 bg-[#03060D] flex flex-col transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        <button onClick={() => setMobileMenuOpen(false)} className="md:hidden absolute top-6 right-4 p-2 text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="py-10 flex justify-center items-center">
          <button onClick={handleLogout} className="p-2 touch-manipulation active:scale-95 transition-transform outline-none group">
            <img src="/logo-lorth.svg" alt="LORTH" className="w-24 md:w-32 h-auto object-contain group-hover:opacity-80" />
          </button>
        </div>
        
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-blue-500/50 focus-within:bg-white/10 transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              id="searchInput"
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setStatusFilter(null); }}
              className="bg-transparent border-none outline-none text-[13px] font-medium text-white placeholder-slate-500 flex-1 w-full"
            />
            <span className="hidden md:inline-block text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-slate-400">⌘K</span>
          </div>
        </div>

        <div className="px-4 flex-1 overflow-y-auto no-scrollbar pb-6">
          <nav className="space-y-2">
            <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group cursor-pointer">
              <Activity className="w-4 h-4 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
              <span className="text-sm">Dashboard</span>
            </button>
            <button onClick={() => router.push('/ab-testing')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group cursor-pointer">
              <Beaker className="w-4 h-4 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
              <span className="text-sm">A/B Testing</span>
            </button>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 font-bold border border-blue-500/10 transition-all">
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Mailbox</span>
            </div>
          </nav>

          <div className="h-px bg-white/5 my-5 mx-2"></div>

          <div className="pt-2 pb-3">
            <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Filtres & Dossiers</p>
          </div>

          <nav className="space-y-1.5">
            <button onClick={() => { setCurrentView('all'); setSelectedIds([]); setIsMobileChatOpen(false); setSearchQuery(""); setStatusFilter(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${currentView === 'all' && !searchQuery ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'}`}>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
              <span className="text-sm">Boîte Globale</span>
            </button>

            <button onClick={() => { setCurrentView('urgent'); setSelectedIds([]); setIsMobileChatOpen(false); setSearchQuery(""); setStatusFilter(null); setMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${currentView === 'urgent' && !searchQuery ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'}`}>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6] ml-1"></span>
                <span className="text-sm ml-1">Action Requise</span>
              </div>
              {urgentCount > 0 && <span className="flex bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]">{urgentCount}</span>}
            </button>

            <button onClick={() => { setCurrentView('favoris'); setSelectedIds([]); setIsMobileChatOpen(false); setSearchQuery(""); setStatusFilter(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${currentView === 'favoris' && !searchQuery ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium group'}`}>
              <span className="text-yellow-500/80 group-hover:text-yellow-400 pl-0.5">★</span>
              <span className="text-sm ml-0.5">Favoris</span>
            </button>

            {customFolders.map(folder => (
              <div key={folder} className="group relative flex items-center w-full">
                <button onClick={() => { setCurrentView(folder); setSelectedIds([]); setIsMobileChatOpen(false); setSearchQuery(""); setStatusFilter(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${currentView === folder && !searchQuery ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'}`}>
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                  <span className="text-sm truncate pr-10">{folder}</span>
                </button>
                <div className="absolute right-3 hidden group-hover:flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setRenameTarget(folder); setNewFolderName(folder); setShowRenameFolderModal(true); }} className="text-slate-400 hover:text-blue-400 transition-colors" title="Renommer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button onClick={(e) => triggerDeleteFolder(folder, e)} className="text-slate-400 hover:text-rose-400 transition-colors" title="Supprimer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => setShowNewFolderModal(true)} className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-xl transition-all font-bold text-xs mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <span>Créer un dossier</span>
            </button>

            <button onClick={() => { setCurrentView('archives'); setSelectedIds([]); setIsMobileChatOpen(false); setSearchQuery(""); setStatusFilter(null); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all mt-4 ${currentView === 'archives' && !searchQuery ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium group'}`}>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
              <span className="text-sm">Archives</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 mt-auto bg-[#03060D] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-default hover:bg-white/5 transition-colors">
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-20 animate-ping"></span>
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-300">Systèmes en ligne</span>
              <span className="text-[9px] font-medium text-slate-500">n8n & NocoDB Sync</span>
            </div>
          </div>
        </div>

      </aside>

      <main className="flex-1 flex flex-col h-[100dvh] relative overflow-hidden min-w-0">
        
        <div className="flex-1 flex overflow-hidden relative">
          
          {loading && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center bg-[#020408]/70 backdrop-blur-md animate-in fade-in duration-200">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full fast-spin"></div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Chargement</span>
              </div>
            </div>
          )}

          <div className={`w-full md:w-1/3 md:max-w-[360px] border-r border-white/5 bg-[#050811] flex-col overflow-hidden z-10 relative ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
            
            <div className="p-4 border-b border-white/5 bg-[#03060D] md:bg-[#03060D]/50 relative pt-[max(1rem,env(safe-area-inset-top))] md:pt-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors flex-shrink-0">
                  <Menu className="w-5 h-5" />
                </button>
                
                <button onClick={() => setShowCentralMenu(!showCentralMenu)} className="flex-1 flex items-center justify-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-lg px-4 py-2.5 transition-colors group cursor-pointer">
                  <span className="text-[13px] font-extrabold text-white uppercase tracking-wider truncate">{getViewTitle()}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-colors flex-shrink-0 ${currentView === 'urgent' && !searchQuery ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>{displayLeads.length}</span>
                  {searchQuery === '' && <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-300 ${showCentralMenu ? 'rotate-180' : ''}`} />}
                </button>
              </div>
              
              {showCentralMenu && searchQuery === '' && (
                  <div className="absolute top-full left-4 right-4 mt-2 bg-[#0A0F1C] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in slide-in-from-top-2">
                    <button onClick={() => {setCurrentView('all'); setShowCentralMenu(false); setSelectedIds([]); setStatusFilter(null);}} className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg> <span>Boîte Globale</span>
                    </button>
                    <button onClick={() => {setCurrentView('urgent'); setShowCentralMenu(false); setSelectedIds([]); setStatusFilter(null);}} className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]"></span> <span>Action Requise</span>
                    </button>
                    <div className="h-px bg-white/5 my-1"></div>
                    <button onClick={() => {setCurrentView('favoris'); setShowCentralMenu(false); setSelectedIds([]); setStatusFilter(null);}} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-2">
                      <span className="text-yellow-500/80">★</span> <span>Favoris</span>
                    </button>
                    {customFolders.map(f => (
                      <button key={f} onClick={() => {setCurrentView(f); setShowCentralMenu(false); setSelectedIds([]); setStatusFilter(null);}} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg> <span>{f}</span>
                      </button>
                    ))}
                    <div className="h-px bg-white/5 my-1"></div>
                    <button onClick={() => {setCurrentView('archives'); setShowCentralMenu(false); setSelectedIds([]); setStatusFilter(null);}} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg> <span>Archives</span>
                    </button>
                  </div>
              )}
            </div>

            {uniqueStatusesInView.length > 0 && !selectedIds.length && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#050811] relative">
                <button onClick={() => setStatusFilter(null)} className={`whitespace-nowrap px-3 py-1.5 rounded-md text-[11px] font-extrabold tracking-wider transition-colors border ${!statusFilter ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}`}>TOUS</button>

                <div className="relative">
                  <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-extrabold tracking-wider transition-all border ${statusFilter ? `${getStatusColor(statusFilter).bg} ${getStatusColor(statusFilter).text} ${getStatusColor(statusFilter).border}` : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}`}>
                    <Filter className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{statusFilter ? getVisualStatusName(statusFilter) : 'FILTRER'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-[#0A0F1C] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in slide-in-from-top-2">
                      <div className="px-3 py-2 border-b border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filtrer par statut</p>
                      </div>
                      {uniqueStatusesInView.map(status => {
                        const colorTheme = getStatusColor(status);
                        const isActive = statusFilter === status;
                        return (
                          <button key={status} onClick={() => { setStatusFilter(isActive ? null : status); setShowFilterDropdown(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-3 ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorTheme.dot}`}></span>
                            <span className="truncate">{getVisualStatusName(status)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className="absolute top-0 left-0 w-full px-4 py-3 bg-[#0A0F1C]/95 backdrop-blur-md border-b border-white/10 z-20 flex justify-between items-center animate-in slide-in-from-top-2 shadow-2xl pt-[max(1rem,env(safe-area-inset-top))]">
                <span className="text-xs font-bold text-white">{selectedIds.length} sélectionné(s)</span>
                <div className="flex gap-2 relative">
                  <button onClick={() => setShowFolderMenu(!showFolderMenu)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-slate-300 transition-colors">Classer</button>
                  {currentView === 'archives' ? (
                    <button onClick={() => actionSelected('restore')} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 transition-colors">Désarchiver</button>
                  ) : (
                    <button onClick={() => actionSelected('archive')} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-bold text-rose-400 transition-colors">Archiver</button>
                  )}
                  {showFolderMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-[#0A0F1C] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 w-40 max-h-48 overflow-y-auto">
                      <button onClick={() => actionSelected('folder', 'Favoris')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/5 truncate"><span className="text-yellow-500/80">★</span> Favoris</button>
                      {customFolders.map(folder => (
                        <button key={folder} onClick={() => actionSelected('folder', folder)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/5 truncate"><svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>{folder}</button>
                      ))}
                      <div className="h-px bg-white/5 my-1"></div>
                      <button onClick={() => actionSelected('folder', '')} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-slate-400">Retirer du dossier</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-2 space-y-1 mt-[2px] pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={() => setShowFilterDropdown(false)}>
              {displayLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm font-medium animate-in fade-in duration-300">
                  {searchQuery ? "Aucun résultat." : "Rien à afficher."}
                </div>
              ) : (
                displayLeads.map(lead => {
                  const theme = getStatusColor(lead.status);
                  const lastMsg = lead.conversation[lead.conversation.length - 1]; 
                  const isSelected = selectedIds.includes(lead.id);

                  let timeIndicator = null;
                  if (lastMsg && (lastMsg.timestamp || (lastMsg.id && lastMsg.id.startsWith('msg-local-'))) && actionStatuses.includes(lead.status)) {
                      const timestamp = lastMsg.timestamp || parseInt(lastMsg.id.split('-')[2], 10);
                      if (!isNaN(timestamp)) {
                          const hoursDiff = (Date.now() - timestamp) / (3600 * 1000);
                          if (hoursDiff > 24) {
                              timeIndicator = <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Plus de 24h sans réponse"></span>;
                          } else if (hoursDiff > 12) {
                              timeIndicator = <span className="w-2 h-2 rounded-full bg-orange-400" title="Plus de 12h sans réponse"></span>;
                          }
                      }
                  }

                  return (
                    <div key={lead.id} onClick={() => handleSelectLead(lead)} className={`p-4 rounded-xl cursor-pointer transition-all duration-200 flex gap-3 ${selectedLead?.id === lead.id ? 'bg-blue-600/10 border border-blue-500/20 shadow-sm' : isSelected ? 'bg-white/5 border-white/10' : 'border border-transparent hover:bg-white/[0.03]'}`}>
                      <div className="pt-0.5" onClick={(e) => toggleSelectLead(lead.id, e)}><div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 hover:border-slate-400'}`}>{isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}</div></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {timeIndicator}
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${theme.dot}`}></div>
                            <h3 className={`font-extrabold text-[14px] truncate ${lead.isArchived ? 'text-slate-400 line-through' : 'text-slate-500'}`}>{lead.name}</h3>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">{lastMsg?.date?.split(' à')[0] || "12:00"}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1.5 truncate">{lead.company}</p>
                        <p className={`text-[12px] line-clamp-2 leading-relaxed font-medium transition-colors ${selectedLead?.id === lead.id ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'}`}>"{lastMsg?.text || "Aucun message"}"</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedLead ? (
            <div key={selectedLead.id} className={`flex-1 flex-col relative bg-[#020408] animate-apple-fade ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}`}>
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none hidden md:block"></div>

              <div className="px-4 md:px-8 py-4 md:py-5 border-b border-white/5 flex justify-between items-center bg-[#03060D]/80 backdrop-blur-md z-10 pt-[max(1rem,env(safe-area-inset-top))] md:pt-4">
                <div className="flex items-center gap-3">
                  <button onClick={handleCloseMobileChat} className="md:hidden p-1.5 bg-white/5 rounded-lg text-slate-300">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col gap-1 md:gap-1.5">
                    <h2 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-3">
                      {selectedLead.name}
                      {selectedLead.folder && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm hidden sm:inline-block">{selectedLead.folder}</span>}
                      <span className="text-slate-500 font-bold text-sm truncate max-w-[150px] md:max-w-sm hidden xl:inline-block">— {selectedLead.subject}</span>
                    </h2>
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 flex items-center gap-2 truncate max-w-[200px] md:max-w-none">{selectedLead.company} <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:inline-block"></span> <span className="hidden sm:inline-block">{selectedLead.email}</span></p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 relative">
                    <button onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)} className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-full border cursor-pointer hover:brightness-110 transition-all ${getStatusColor(selectedLead.status).bg} ${getStatusColor(selectedLead.status).border}`}>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedLead.status).dot}`}></div>
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate max-w-[80px] sm:max-w-[150px] ${getStatusColor(selectedLead.status).text}`}>{getVisualStatusName(selectedLead.status)}</span>
                      <ChevronDown className={`w-3 h-3 ${getStatusColor(selectedLead.status).text}`} />
                    </button>

                    {isStatusMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-56 md:w-64 bg-[#0A0F1C] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in slide-in-from-top-2">
                        <div className="px-3 py-2 border-b border-white/5"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action Requise</p></div>
                        <button onClick={() => handleStatusChange('Question à traiter')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]"></span> <span>Réponse - Question</span></button>
                        <button onClick={() => handleStatusChange('Objection à traiter')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#FACC15]"></span> <span>Réponse - Objection</span></button>
                        <button onClick={() => handleStatusChange('En conversation')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#FB923C]"></span> <span>En conversation</span></button>
                        <button onClick={() => handleStatusChange('Ghost à relancer')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-slate-300 shadow-[0_0_8px_#cbd5e1]"></span> <span>Ghost à relancer</span></button>
                        <button onClick={() => handleStatusChange('Vidéo à tourner')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#C084FC]"></span> <span>Vidéo à tourner</span></button>

                        <div className="px-3 py-2 border-b border-t border-white/5 mt-1"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Terminé / Attente</p></div>
                        <button onClick={() => handleStatusChange('Objection traitée')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2DD4BF]"></span> <span>Outreach Successful</span></button>
                        <button onClick={() => handleStatusChange('Mail envoyé')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60A5FA]"></span> <span>1er cold outreach</span></button>
                        <button onClick={() => handleStatusChange('Désinscrit')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_#F87171]"></span> <span>Désinscrit</span></button>
                      </div>
                    )}

                    <p className="text-[9px] md:text-[10px] font-bold text-slate-500 hidden sm:block">Boîte: {selectedLead.sender}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 md:space-y-8 scroll-smooth flex flex-col" onClick={() => setIsStatusMenuOpen(false)}>
                {selectedLead.conversation.map((msg: any, index: number) => (
                  <div key={msg.id} className={`flex flex-col max-w-[90%] md:max-w-[80%] ${index > 0 ? 'animate-apple-fade-delay' : ''} ${msg.isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className="flex items-center gap-2 mb-1.5 px-1"><span className="text-[11px] font-bold text-slate-400">{msg.senderName}</span><span className="text-[10px] font-bold text-slate-600">{msg.date}</span></div>
                    <div className={`p-4 md:p-5 text-[13px] md:text-[14px] leading-relaxed shadow-lg ${msg.isMe ? 'bg-blue-600/15 border border-blue-500/20 text-slate-100 rounded-2xl rounded-tr-sm' : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-2xl rounded-tl-sm'}`}><p className="whitespace-pre-wrap font-medium">{msg.text}</p></div>
                  </div>
                ))}
              </div>

              <div className="p-4 md:p-6 pt-2 bg-gradient-to-t from-[#020408] to-transparent z-10 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={() => setIsStatusMenuOpen(false)}>
                {isAiDraft && (
                  <div className="flex items-center gap-2 text-xs text-purple-400 font-bold mb-2 px-2">
                    <Bot className="w-4 h-4" />
                    <span>Brouillon généré par IA</span>
                  </div>
                )}
                <div className="bg-[#0A0F1C] border border-white/10 rounded-xl focus-within:border-blue-500/40 focus-within:bg-white/[0.02] transition-all flex flex-col shadow-2xl">
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5"><button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors font-bold">B</button><button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors italic">I</button><div className="w-px h-4 bg-white/10 mx-1"></div><button className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg><span className="text-[10px] font-extrabold tracking-wider hidden sm:inline">JOINDRE</span></button></div>
                  <textarea ref={textareaRef} value={replyText} onChange={handleTextareaChange} onKeyDown={handleKeyDown} placeholder="Écrivez votre message..." className="w-full bg-transparent px-4 py-3 text-[14px] font-medium text-slate-100 resize-none outline-none overflow-y-auto leading-relaxed" style={{ minHeight: '48px', maxHeight: '250px' }} rows={1} />
                  <div className="px-4 py-2.5 flex justify-between items-center bg-black/20 rounded-b-xl">
                    <div className="text-[10px] font-bold text-slate-500 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2"><span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300 font-sans shadow-sm mr-1 hidden sm:inline-block">Entrée</kbd> <span className="sm:hidden">Envoyer</span></span></div>
                    <button onClick={() => setShowConfirmSend(true)} disabled={!replyText.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-600 text-white text-xs font-extrabold py-2 px-4 rounded-md transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(37,99,235,0.2)]">Envoyer<Send className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex-col items-center justify-center text-slate-600 text-sm bg-[#020408] font-bold animate-apple-fade hidden md:flex">
              <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4"><MessageSquare className="w-6 h-6 text-slate-700" /></div>
              Aucune conversation sélectionnée.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Mailbox() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#020408] text-slate-500 text-sm font-bold uppercase tracking-widest">
        Chargement de la boîte mail...
      </div>
    }>
      <MailboxContent />
    </Suspense>
  );
}