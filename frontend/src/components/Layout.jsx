import Navbar from "./Navbar";

export default function Layout({ children, user, onLogout, onUpdateUser, onEditarClick }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* O Layout recebe os dados do App.jsx e entrega-os à Navbar */}
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        onUpdateUser={onUpdateUser} 
        onEditarClick={onEditarClick} 
      />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}