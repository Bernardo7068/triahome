import { useState, useEffect } from "react";
import api from "../services/api";
import { 
  Users, Building2, Activity, ShieldCheck, 
  UserPlus, Trash2, Edit3, Settings, Database 
} from "lucide-react";

export default function AdminDashboard() {
  const [abaAtiva, setAbaAtiva] = useState("utilizadores");
  const [utilizadores, setUtilizadores] = useState([]);
  const [hospitais, setHospitais] = useState([]);
  const [stats, setStats] = useState({ totalTriagens: 0, servidoresIA: "Online" });

  const carregarDados = async () => {
    try {
      const resUsers = await api.get('/admin/utilizadores');
      const resHosp = await api.get('/admin/hospitais');
      setUtilizadores(resUsers.data);
      setHospitais(resHosp.data);
    } catch (e) { console.error("Erro ao carregar dados administrativos"); }
  };

  useEffect(() => { carregarDados(); }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* HEADER DE STATUS DO SISTEMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Users /></div>
          <div><p className="text-xs opacity-50 uppercase font-bold">Total Utilizadores</p><p className="text-2xl font-black">{utilizadores.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border flex items-center gap-4 shadow-sm">
          <div className="bg-green-100 p-3 rounded-xl text-green-600"><Activity /></div>
          <div><p className="text-xs text-slate-400 uppercase font-bold">Status Servidor IA</p><p className="text-2xl font-black text-slate-800">Operacional</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border flex items-center gap-4 shadow-sm">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Database /></div>
          <div><p className="text-xs text-slate-400 uppercase font-bold">Base de Dados</p><p className="text-2xl font-black text-slate-800">SQLite WAL</p></div>
        </div>
      </div>

      {/* NAVEGAÇÃO ADMIN */}
      <div className="flex gap-4 bg-white p-2 rounded-3xl border shadow-sm">
        <button onClick={() => setAbaAtiva("utilizadores")} className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'utilizadores' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Users size={20}/> Utilizadores</button>
        <button onClick={() => setAbaAtiva("hospitais")} className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'hospitais' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Building2 size={20}/> Unidades</button>
        <button onClick={() => setAbaAtiva("logs")} className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'logs' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><ShieldCheck size={20}/> Segurança</button>
      </div>

      {/* CONTEÚDO DINÂMICO */}
      <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden animate-in fade-in duration-500">
        {abaAtiva === "utilizadores" && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Gestão de Staff e Utentes</h2>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"><UserPlus size={18}/> Novo Utilizador</button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr><th className="p-6">Nome</th><th className="p-6">Role</th><th className="p-6">Hospital</th><th className="p-6 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilizadores.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-slate-800">{u.nome}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        u.role === 'admin' ? 'bg-red-100 text-red-600' : 
                        u.role === 'medico' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-6 text-slate-500 font-medium">{u.hospital_nome || 'Global / Nenhum'}</td>
                    <td className="p-6 text-right space-x-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Edit3 size={18}/></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {abaAtiva === "hospitais" && (
          <div className="p-8">
            <h2 className="text-2xl font-black mb-8 italic tracking-tighter uppercase">Configuração de Unidades de Saúde</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hospitais.map((h, i) => (
                <div key={i} className="p-6 border-2 border-slate-100 rounded-[2rem] hover:border-blue-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 /></div>
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase italic">Ativo</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{h.nome}</h3>
                  <p className="text-sm text-slate-400 mb-6">{h.morada}, {h.cidade}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-slate-50 rounded-xl text-xs font-bold hover:bg-slate-100">Configurar Portas</button>
                    <button className="flex-1 py-2 bg-slate-50 rounded-xl text-xs font-bold hover:bg-slate-100">Ver Lotação</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}