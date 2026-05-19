import { useState, useEffect, useRef } from "react";
import { LogOut, Activity, ShieldCheck, ChevronDown, User } from "lucide-react";

export default function Navbar({ user, onLogout, onEditarClick }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha a dropdown se o utilizador clicar fora dela
  useEffect(() => {
    const cliqueFora = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", cliqueFora);
    return () => document.removeEventListener("mousedown", cliqueFora);
  }, []);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <div className="flex items-center gap-2 group cursor-default">
          <div className="bg-blue-600 p-2 rounded-xl text-white group-hover:rotate-12 transition-transform">
            <Activity size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800">
            TRIA<span className="text-blue-600 italic">Home</span>
          </h1>
        </div>

        {/* Menu Interativo de Utilizador (Dropdown) */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          <button 
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-3 hover:bg-slate-50 px-4 py-2 rounded-2xl border border-transparent hover:border-slate-100 transition-all text-left"
          >
            {/* Avatar Círculo com Letra Inicial */}
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black uppercase shadow-sm">
              {user?.nome?.charAt(0)}
            </div>

            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-black text-slate-800 leading-none">{user?.nome}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter flex items-center gap-1 mt-1">
                {user?.role === 'admin' && <ShieldCheck size={10} />}
                {user?.role}
              </span>
            </div>
            
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${menuAberto ? "rotate-180" : ""}`} />
          </button>
          
          {/* Menu Dropdown Suspenso */}
          {menuAberto && (
            <div className="absolute right-6 top-16 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              {user?.role === 'utente' && (
                <button 
                  onClick={() => {
                    onEditarClick(); // <-- AVISA O DASHBOARD PARA ABRIR O MODAL!
                    setMenuAberto(false);
                  }}
                  className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 text-xs font-black transition-colors"
                >
                  <User size={14} className="text-slate-400" /> Ficha Clínica / Perfil
                </button>
              )}
              {user?.role !== 'utente' && (
                <div className="px-4 py-2 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50 mb-1">
                  Trabalhador ID: {user?.nr_funcionario || "---"}
                </div>
              )}
              <hr className="border-slate-100 my-1" />
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2.5 text-xs font-black transition-colors"
              >
                <LogOut size={14} /> Terminar Sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}