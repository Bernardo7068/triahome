import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./pages/Login";
import Layout from "./components/Layout";
import UtenteDashboard from "./pages/UtenteDashboard";
import MedicoDashboard from "./pages/MedicoDashboard";
import SecretariaDashboard from "./pages/SecretariaDashboard";
import EstatisticasClinicas from "./pages/EstatisticasClinicas";
import AdminDashboard from "./pages/AdminDashboard"; // <-- Importamos o Dashboard do Admin
import DebugLogin from "./pages/DebugLogin";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("tria_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ESTADO GLOBAL DO MODAL: Controla a abertura da Ficha Clínica / Perfil
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);

  console.log("👤 User state atual:", user); // Debug

  const handleLoginSuccess = (userData) => {
    console.log("🔐 Login bem-sucedido:", userData); // Debug
    setUser(userData);
    sessionStorage.setItem("tria_user", JSON.stringify(userData));
  };

  // Garante que, ao atualizar os dados do perfil, eles também ficam guardados no sessionStorage
  const handleUpdateUser = (updatedUserData) => {
    setUser(updatedUserData);
    sessionStorage.setItem("tria_user", JSON.stringify(updatedUserData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("tria_user");
    setModalPerfilAberto(false); // Fecha o modal se estiver aberto ao sair
  };

  return (
    <Router>
      <Routes>
        {/* ROTA DE DEBUG - Sempre acessível */}
        <Route path="/debug-login" element={<DebugLogin />} />

        {/* SE NÃO HÁ USER: Vai para o Login */}
        {!user ? (
          <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        ) : (
          /* SE HÁ USER: Entra no Layout Protegido */
          /* Injetamos a função onEditarClick no Layout para passar à Navbar */
          <Route path="*" element={
            <Layout 
              user={user} 
              onLogout={handleLogout} 
              onUpdateUser={handleUpdateUser}
              onEditarClick={() => setModalPerfilAberto(true)} 
            >
              <Routes>
                {/* ROTA PRINCIPAL: Decide o dashboard pelo Role */}
                <Route path="/" element={
                  user.role === "utente" ? (
                    <UtenteDashboard 
                      user={user} 
                      onUpdateUser={handleUpdateUser}
                      modalPerfilAberto={modalPerfilAberto}
                      setModalPerfilAberto={setModalPerfilAberto}
                    />
                  ) :
                  user.role === "medico" ? <MedicoDashboard user={user} /> :
                  user.role === "secretaria" ? <SecretariaDashboard user={user} /> :
                  user.role === "admin" ? <AdminDashboard user={user} /> :
                  <SecretariaDashboard user={user} />
                } />

                {/* ROTA DA TRIAGEM: Apenas para Utentes */}
                <Route path="/nova-triagem" element={
                  user.role === "utente" ? <TriagemIA user={user} /> : <Navigate to="/" />
                } />
                <Route
                  path="/estatisticas"
                  element={
                    user.role === "medico" || user.role === "secretaria" || user.role === "admin" ? (
                      <EstatisticasClinicas user={user} />
                    ) : (
                      <Navigate to="/" />
                    )
                  }
                />
                <Route 
                  path="/secretaria" 
                  element={user?.role === 'secretaria' || user?.role === 'admin' ? 
                    <SecretariaDashboard user={user} /> : 
                    <Navigate to="/" />
                  } 
                />

                {/* FALLBACK: Se houver erro de rota, volta ao início */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          } />
        )}
      </Routes>
    </Router>
  );
}

export default App;