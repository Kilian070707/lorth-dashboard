"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Menu, CheckSquare, ExternalLink, 
  Loader2, CheckCircle2, XCircle, Check, Users, Target
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLoading } from '@/app/contexts/LoadingContext';

export default function TodoPage() {
  const router = useRouter();
  const { loading: globalLoading, setLoading: setGlobalLoading } = useLoading();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashSearch, setDashSearch] = useState("");
  const [loading, setLoadingState] = useState(true);

  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  // --- DATA STATES ---
  const [interactions, setInteractions] = useState<any[]>([]);
  const [ajouts, setAjouts] = useState<any[]>([]);

  // --- UI STATES ---
  const [manualModeInt, setManualModeInt] = useState(false);
  const [manualModeAjout, setManualModeAjout] = useState(false);
  const [intSelections, setIntSelections] = useState<Record<string, 'success' | 'error'>>({});
  const [ajoutSelections, setAjoutSelections] = useState<Record<string, 'success' | 'error'>>({});
  const [clickedProfiles, setClickedProfiles] = useState<Record<string, boolean>>({});

  const [completedInt, setCompletedInt] = useState(false);
  const [completedAjout, setCompletedAjout] = useState(false);
  const [isSubmittingInt, setIsSubmittingInt] = useState(false);
  const [isSubmittingAjout, setIsSubmittingAjout] = useState(false);

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const pendingCount = (!completedInt ? interactions.length : 0) + (!completedAjout ? ajouts.length : 0);

  // --- CHARGEMENT DATA ---
  useEffect(() => {
    // Met à jour le titre avec le nombre de tâches en attente !
    document.title = pendingCount > 0 ? `(${pendingCount}) LORTH - To Do` : "LORTH - To Do";
    
    if (!loading) return; // Évite de recharger si on a déjà les données

    setTimeout(() => {
      const intNames = ["Jean-Marc Solal", "Odile Duvaux", "Thomas Rivoire", "Marie Dubois", "Lucas Martin", "Sophie Bernard", "Antoine Petit", "Julie Robert", "Nicolas Richard", "Emilie Durand", "Pierre Moreau", "Celine Laurent", "Alexandre Simon", "Laura Michel", "Maxime Garcia"];
      setInteractions(intNames.map((name, i) => {
        const [firstName, lastName] = name.split(' ');
        return { id: `int-${i}`, firstName, lastName, linkedinUrl: 'https://linkedin.com' };
      }));

      const ajoutNames = ["Christine Heckmann", "Loïc Berthelot", "Sarah Blanc", "David Guerin", "Camille Roux", "Julien Vincent", "Alice Leroy", "Romain Fournier", "Chloe Morel", "Kevin Girard", "Manon Andre", "Guillaume Bonnet", "Marion Francois", "Florian Martinez", "Elodie Legrand"];
      setAjouts(ajoutNames.map((name, i) => {
        const [firstName, lastName] = name.split(' ');
        return { id: `aj-${i}`, firstName, lastName, linkedinUrl: 'https://linkedin.com' };
      }));
      
      setLoadingState(false);
    }, 800);
  }, [pendingCount, loading]);

  // --- Raccourci Recherche ⌘K ---
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

  const handleDashSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && dashSearch.trim() !== '') {
      router.push(`/mailbox?q=${encodeURIComponent(dashSearch.trim())}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleProfileClick = (id: string) => {
    setClickedProfiles(prev => ({ ...prev, [id]: true }));
  };

  // --- ACTIONS SIMULÉES ---
  const handleBulkValidate = async (type: 'interactions' | 'ajouts') => {
    const isInt = type === 'interactions';
    const setSubmit = isInt ? setIsSubmittingInt : setIsSubmittingAjout;
    
    setSubmit(true);
    setTimeout(() => {
      if (isInt) setCompletedInt(true);
      else setCompletedAjout(true);
      setSubmit(false);
    }, 1000);
  };

  const handleManualValidate = async (type: 'interactions' | 'ajouts') => {
    const isInt = type === 'interactions';
    const setSubmit = isInt ? setIsSubmittingInt : setIsSubmittingAjout;
    const selections = isInt ? intSelections : ajoutSelections;
    const leadsCount = isInt ? interactions.length : ajouts.length;

    if (Object.keys(selections).length < leadsCount) {
      alert("Veuillez cocher une action pour chaque profil avant de valider.");
      return;
    }

    setSubmit(true);
    setTimeout(() => {
      if (isInt) setCompletedInt(true);
      else setCompletedAjout(true);
      setSubmit(false);
    }, 1000);
  };

  const toggleSelection = (type: 'interactions' | 'ajouts', id: string, status: 'success' | 'error') => {
    if (type === 'interactions') {
      setIntSelections(prev => ({ ...prev, [id]: status }));
    } else {
      setAjoutSelections(prev => ({ ...prev, [id]: status }));
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#020408] text-slate-100 font-sans antialiased overflow-hidden relative">
      
      {/* OVERLAY MOBILE */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* --- SIDEBAR --- */}
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        dashSearch={dashSearch}
        setDashSearch={setDashSearch}
        handleDashSearch={handleDashSearch}
      />

      <main className="flex-1 flex flex-col h-[100dvh] relative overflow-hidden bg-[#020408]">
        {globalLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20 flex-1 flex flex-col h-full min-h-0">
            <header className="flex items-start w-full mb-12 gap-3 flex-shrink-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden mt-1 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors flex-shrink-0"
              >
                <Menu size={24} />
              </button>
              <div className="flex gap-4 items-center">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.15)] flex-shrink-0">
                  <CheckSquare size={32} className="text-blue-400" />
                </div>
                <div className="flex flex-col gap-1 justify-center">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
                    To Do du {today}
                  </h1>
                  <p className="text-slate-400 text-xs md:text-[13px] font-medium">
                    Les petits ruisseaux font les grandes rivières.
                  </p>
                </div>
              </div>
            </header>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 flex-1 pb-12 min-h-0">
                {/* ========================================================
                    SECTION 1 : INTERACTIONS A FAIRE (Bleu)
                ======================================================== */}
                <div className="bg-[#0A0F1C] border border-white/5 rounded-[2rem] shadow-xl flex flex-col relative overflow-hidden h-full group/card hover:border-blue-500/20 transition-all duration-300 isolate transform-gpu">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-blue-400"></div>
                  <div className="p-5 md:p-6 flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                      <Target
                        size={20}
                        className="text-blue-400 flex-shrink-0"
                      />
                      <h2 className="text-xl font-extrabold text-white">
                        Interactions à faire
                      </h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-5 font-medium flex-shrink-0">
                      Liker & commenter leur dernier post.
                    </p>

                    {completedInt ? (
                      <div className="flex flex-col items-center justify-center flex-1 text-center bg-blue-500/5 border border-blue-500/10 rounded-2xl mb-4 animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                          <Check size={24} className="text-blue-400" />
                        </div>
                        <h3 className="text-blue-400 text-lg font-bold">
                          Interactions validées !
                        </h3>
                        <p className="text-sm text-blue-400/70 mt-2">
                          Passe aux ajouts maintenant.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-2 mb-4 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                          {interactions.map((lead) => (
                            <div
                              key={lead.id}
                              className={`flex justify-between items-center px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-lg transition-all group active:scale-[0.98] ${
                                clickedProfiles[lead.id]
                                  ? "opacity-25 grayscale"
                                  : ""
                              }`}
                            >
                              <a
                                href={lead.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleProfileClick(lead.id)}
                                className="flex items-center gap-2 text-[12px] md:text-[13px] font-bold text-slate-200 hover:text-blue-400 transition-colors flex-1 truncate"
                              >
                                <span className="truncate">
                                  {lead.firstName} {lead.lastName}
                                </span>
                                <ExternalLink
                                  size={12}
                                  className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                />
                              </a>

                              {manualModeInt && (
                                <div className="flex items-center gap-1 pl-2 flex-shrink-0">
                                  <button
                                    onClick={() =>
                                      toggleSelection(
                                        "interactions",
                                        lead.id,
                                        "success"
                                      )
                                    }
                                    className={`p-1 rounded-md transition-all ${
                                      intSelections[lead.id] === "success"
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-white/5 text-slate-400 hover:text-white border border-transparent hover:bg-white/10"
                                    }`}
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      toggleSelection(
                                        "interactions",
                                        lead.id,
                                        "error"
                                      )
                                    }
                                    className={`p-1 rounded-md transition-all ${
                                      intSelections[lead.id] === "error"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-white/5 text-slate-400 hover:text-white border border-transparent hover:bg-white/10"
                                    }`}
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-3 mt-auto border-t border-white/5 pt-4 flex-shrink-0">
                          {manualModeInt ? (
                            <button
                              onClick={() =>
                                handleManualValidate("interactions")
                              }
                              disabled={isSubmittingInt}
                              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 active:scale-[0.98] text-white font-bold text-[14px] rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                              {isSubmittingInt ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                "Valider ma sélection"
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleBulkValidate("interactions")
                              }
                              disabled={isSubmittingInt}
                              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 active:scale-[0.98] text-white font-bold text-[14px] rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                              {isSubmittingInt ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                "J'ai interagi avec tout le monde"
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => setManualModeInt(!manualModeInt)}
                            className="text-[12px] md:text-[13px] font-bold text-slate-500 hover:text-slate-300 py-1 transition-colors"
                          >
                            {manualModeInt
                              ? "Annuler le mode manuel"
                              : "Un problème avec un profil ?"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ========================================================
                    SECTION 2 : LEADS A AJOUTER (Mauve)
                ======================================================== */}
                <div className="bg-[#0A0F1C] border border-white/5 rounded-[2rem] shadow-xl flex flex-col relative overflow-hidden h-full group/card hover:border-purple-500/20 transition-all duration-300 isolate transform-gpu">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-fuchsia-400"></div>
                  <div className="p-5 md:p-6 flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                      <Users
                        size={20}
                        className="text-purple-400 flex-shrink-0"
                      />
                      <h2 className="text-xl font-extrabold text-white">
                        Leads à ajouter
                      </h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-5 font-medium flex-shrink-0">
                      Demande de connexion (VIPs d'hier).
                    </p>

                    {completedAjout ? (
                      <div className="flex flex-col items-center justify-center flex-1 text-center bg-purple-500/5 border border-purple-500/10 rounded-2xl mb-4 animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                          <Check size={24} className="text-purple-400" />
                        </div>
                        <h3 className="text-purple-400 text-lg font-bold">
                          Ajouts validés !
                        </h3>
                        <p className="text-sm text-purple-400/70 mt-2">
                          La machine n8n enverra l'email dans 48h.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-2 mb-4 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                          {ajouts.map((lead) => (
                            <div
                              key={lead.id}
                              className={`flex justify-between items-center px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-lg transition-all group active:scale-[0.98] ${
                                clickedProfiles[lead.id]
                                  ? "opacity-25 grayscale"
                                  : ""
                              }`}
                            >
                              <a
                                href={lead.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleProfileClick(lead.id)}
                                className="flex items-center gap-2 text-[12px] md:text-[13px] font-bold text-slate-200 hover:text-purple-400 transition-colors flex-1 truncate"
                              >
                                <span className="truncate">
                                  {lead.firstName} {lead.lastName}
                                </span>
                                <ExternalLink
                                  size={12}
                                  className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                />
                              </a>

                              {manualModeAjout && (
                                <div className="flex items-center gap-1 pl-2 flex-shrink-0">
                                  <button
                                    onClick={() =>
                                      toggleSelection(
                                        "ajouts",
                                        lead.id,
                                        "success"
                                      )
                                    }
                                    className={`p-1 rounded-md transition-all ${
                                      ajoutSelections[lead.id] === "success"
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-white/5 text-slate-400 hover:text-white border border-transparent hover:bg-white/10"
                                    }`}
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      toggleSelection(
                                        "ajouts",
                                        lead.id,
                                        "error"
                                      )
                                    }
                                    className={`p-1 rounded-md transition-all ${
                                      ajoutSelections[lead.id] === "error"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-white/5 text-slate-400 hover:text-white border border-transparent hover:bg-white/10"
                                    }`}
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-3 mt-auto border-t border-white/5 pt-4 flex-shrink-0">
                          {manualModeAjout ? (
                            <button
                              onClick={() =>
                                handleManualValidate("ajouts")
                              }
                              disabled={isSubmittingAjout}
                              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 active:scale-[0.98] text-white font-bold text-[14px] rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                              {isSubmittingAjout ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                "Valider ma sélection"
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBulkValidate("ajouts")}
                              disabled={isSubmittingAjout}
                              className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 active:scale-[0.98] text-white font-bold text-[14px] rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                              {isSubmittingAjout ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                "J'ai ajouté tout le monde"
                              )}
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setManualModeAjout(!manualModeAjout)
                            }
                            className="text-[12px] md:text-[13px] font-bold text-slate-500 hover:text-slate-300 py-1 transition-colors"
                          >
                            {manualModeAjout
                              ? "Annuler le mode manuel"
                              : "Un problème avec un profil ?"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}