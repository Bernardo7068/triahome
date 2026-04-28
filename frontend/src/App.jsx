import { useState } from "react";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import UtenteDashboard from "./pages/UtenteDashboard";
import MedicoDashboard from "./pages/MedicoDashboard";
import SecretariaDashboard from "./pages/SecretariaDashboard";

function App() {
  // 1. Inicializa o estado lendo o sessionStorage. 
  // Se houver um utilizador guardado, converte-o de volta para objeto (JSON.parse)
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("tria_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  /**
   * Função para lidar com o sucesso do login.
   */
  const handleLoginSuccess = (userData) => {
    setUser(userData); // Atualiza o estado do React
    // 2. Guarda o utilizador no sessionStorage convertido em texto (JSON.stringify)
    sessionStorage.setItem("tria_user", JSON.stringify(userData));
  };

  /**
   * Função para fazer logout.
   */
  const handleLogout = () => {
    setUser(null); // Limpa o estado do React
    // 3. Remove o utilizador do sessionStorage para garantir a segurança
    sessionStorage.removeItem("tria_user");
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      
      {user.role === "utente" && (
        <UtenteDashboard user={user} />
      )}

      {user.role === "medico" && (
        <MedicoDashboard user={user} />
      )}

      {(user.role === "secretaria" || user.role === "admin") && (
        <SecretariaDashboard user={user} />
      )}

      {!["utente", "medico", "secretaria", "admin"].includes(user.role) && (
        <div className="bg-white p-10 rounded-3xl shadow-sm text-center">
          <h2 className="text-xl font-bold text-red-500">Acesso Restrito</h2>
          <p className="text-slate-500">O seu perfil não tem permissões para aceder a esta área.</p>
        </div>
      )}

    </Layout>
  );
}

export default App;