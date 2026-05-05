import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./pages/Login";
import Layout from "./components/Layout";
import UtenteDashboard from "./pages/UtenteDashboard";
import MedicoDashboard from "./pages/MedicoDashboard";
import SecretariaDashboard from "./pages/SecretariaDashboard";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("tria_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    sessionStorage.setItem("tria_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("tria_user");
  };

  return (
    <Router>
      <Routes>
        {/* SE NÃO HÁ USER: Vai para o Login */}
        {!user ? (
          <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        ) : (
          /* SE HÁ USER: Entra no Layout Protegido */
          <Route path="*" element={
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                {/* ROTA PRINCIPAL: Decide o dashboard pelo Role */}
                <Route path="/" element={
                  user.role === "utente" ? <UtenteDashboard user={user} /> :
                  user.role === "medico" ? <MedicoDashboard user={user} /> :
                  <SecretariaDashboard user={user} />
                } />

                {/* ROTA DA TRIAGEM: Onde o botão do utente clica */}
                <Route path="/nova-triagem" element={
                    <div className="p-10 bg-white rounded-3xl border">
                        <h1 className="text-2xl font-black">Questionário de Triagem IA</h1>
                        <p className="text-slate-500">O formulário será carregado aqui.</p>
                        {/* <QuestionarioTriagem /> */}
                    </div>
                } />
                <Route 
  path="/secretaria" 
  element={user?.role === 'secretaria' ? <SecretariaDashboard user={user} /> : <Navigate to="/" />} 
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