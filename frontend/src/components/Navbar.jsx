import { LogOut, Activity, User, ShieldCheck } from "lucide-react";

export default function Navbar({ user, onLogout }) {
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

        {/* Info User & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end border-r pr-4 border-slate-200">
            <span className="text-sm font-black text-slate-800 leading-none">{user.nome}</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter flex items-center gap-1 mt-1">
              {user.role === 'admin' && <ShieldCheck size={10} />}
              {user.role}
            </span>
          </div>
          
          <button 
            onClick={onLogout}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            title="Sair do sistema"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}