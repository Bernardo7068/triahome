import { useState } from "react";
import api from "../services/api";

export default function DebugLogin() {
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);

  const testarLogin = async (email, password) => {
    setLoading(true);
    setResultado(`🔄 Testando login para ${email}...`);
    
    try {
      const response = await api.post('/login', { email, password });
      const userData = response.data.user;
      
      console.log("✅ Response recebido:", response.data);
      console.log("👤 User data:", userData);
      
      setResultado(`
✅ LOGIN BEM-SUCEDIDO

User Data:
${JSON.stringify(userData, null, 2)}

Role Recebido: ${userData.role}
Dashboard esperado: 
  - utente → UtenteDashboard
  - medico → MedicoDashboard
  - secretaria → SecretariaDashboard

Salvo em sessionStorage:
${JSON.stringify(userData, null, 2)}
      `);
    } catch (error) {
      setResultado(`❌ ERRO: ${error.message}`);
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔧 Debug Login - TRIA-Home</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => testarLogin("medico@tria.pt", "password")}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded font-bold"
        >
          🏥 Testar Médico
        </button>
        
        <button
          onClick={() => testarLogin("secretaria@tria.pt", "password")}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 py-3 rounded font-bold"
        >
          👩‍💼 Testar Secretária
        </button>
        
        <button
          onClick={() => testarLogin("ana@tria.pt", "password")}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded font-bold"
        >
          👤 Testar Utilizador
        </button>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
        {resultado || "Clique num botão para testar login..."}
      </div>

      <div className="mt-8 bg-slate-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">📋 Informações do Sistema</h2>
        <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</p>
        <p><strong>Base URL (default):</strong> http://localhost:8000/api</p>
        <p><strong>SessionStorage:</strong> {sessionStorage.getItem("tria_user") ? "✅ Tem dados" : "❌ Vazio"}</p>
      </div>
    </div>
  );
}
