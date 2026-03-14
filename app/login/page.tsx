"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forcer le titre de l'onglet
  useEffect(() => {
    document.title = "LORTH - Connexion";
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError("Accès refusé. Clé invalide.");
        setPassword("");
      }
    } catch (err) {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // min-h-[100dvh] est crucial pour l'iPhone (gère la barre de navigation Safari qui monte/descend)
    <div className="min-h-[100dvh] bg-[#020408] flex flex-col justify-center items-center p-5 relative overflow-hidden font-sans">
      {loading && <LoadingSpinner />}
      
      {/* Grille de fond Tech */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      {/* Lueur centrale optimisée pour pas saturer l'écran mobile */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Conteneur principal avec largeur max ajustée */}
      <div className="w-full max-w-[400px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* LOGO (Taille réduite et marge ajustée) */}
        <div className="flex justify-center mb-8">
          <img 
            src="/logo-lorth.svg" 
            alt="LORTH" 
            className="w-32 md:w-38 h-auto object-contain" 
          />
        </div>

        {/* Carte de connexion */}
        {/* Sur mobile : p-6 (moins de padding interne pour laisser la place au texte) */}
        <div className="bg-[#050811]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

          <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full mb-4 shadow-[0_0_10px_rgba(37,99,235,0.1)]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-extrabold text-blue-400 tracking-widest uppercase">Accès Restreint</span>
            </div>
            {/* Titre qui tient bien sur une ligne mobile */}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1.5">Dashboard</h1>
            {/* Sous-titre légèrement réduit sur mobile */}
            <p className="text-xs sm:text-sm font-medium text-slate-400 leading-snug">
              Authentification requise pour accéder au système.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">
                Clé de sécurité administrateur
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  /* py-3.5 au lieu de py-4 pour pas être trop massif sur iPhone */
                  className="w-full bg-[#020408] border border-white/10 text-white text-[15px] rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner placeholder:text-slate-600"
                  placeholder="••••••••••••"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-rose-400 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 animate-in fade-in zoom-in-95">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs font-bold leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-500 disabled:border-white/5 disabled:shadow-none text-white text-[15px] font-extrabold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-500/50 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Déverrouiller le système
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer discret */}
        <p className="text-center text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-6 sm:mt-8">
          Lorth Solutions © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}