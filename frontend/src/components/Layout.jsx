import Navbar from "./Navbar";

export default function Layout({ children, user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar fixa no topo */}
      <Navbar user={user} onLogout={onLogout} />
      
      {/* Conteúdo da página */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Rodapé Simples */}
      <footer className="p-6 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
        &copy; 2024 TRIA-Home • Sistema Inteligente de Triagem
      </footer>
    </div>
  );
}