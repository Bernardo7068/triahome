import { useState, useEffect } from "react";
import api from "../services/api";
import { Users, Building, PlusCircle, UserPlus, Stethoscope, Briefcase, Mail, Lock, FileText, Edit2, X, Save, ShieldAlert } from "lucide-react";

export default function AdminDashboard({ user }) {
  const [hospitais, setHospitais] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado do formulário de criação
  const [form, setForm] = useState({
    nome: "", email: "", password: "", role: "medico", hospital_id: "", nr_funcionario: "", Blackespecialidade: ""
  });

  // ESTADOS PARA EDIÇÃO DE UTILIZADORES
  const [userEmEdicao, setUserEmEdicao] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});

  const fetchDados = async () => {
    try {
      const resHospitais = await api.get('/admin/hospitais');
      setHospitais(resHospitais.data || []);

      const resUsers = await api.get('/admin/utilizadores');
      setUtilizadores(resUsers.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados do admin", error);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleCriarStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/utilizadores/novo", form);
      alert("Utilizador adicionado com sucesso!");
      setForm({ nome: "", email: "", password: "", role: "medico", hospital_id: "", nr_funcionario: "", especialidade: "" });
      fetchDados();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao criar utilizador.");
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicao = (u) => {
    setUserEmEdicao(u);
    setFormEdicao({
      nome: u.nome || "",
      email: u.email || "",
      role: u.role || "utente",
      hospital_id: u.hospital_id || "",
      nr_funcionario: u.nr_funcionario || "",
      especialidade: u.especialidade || "",
      nr_utente: u.nr_utente || "",
      idade: u.idade || "",
      altura: u.altura || "",
      morada: u.morada || "",
      descricao: u.descricao || "",
      password: "" // Deixar em branco se não quiser alterar
    });
  };

  const handleGravarEdicao = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/utilizadores/editar/${userEmEdicao.id}`, formEdicao);
      alert("Utilizador atualizado com sucesso!");
      setUserEmEdicao(null);
      fetchDados();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao atualizar dados.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 pb-20">
      
      {/* CABEÇALHO */}
      <div className="pt-4 pb-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Painel de Administração Geral</h1>
        <p className="text-slate-500 font-medium text-lg mt-1">Gestão global de utilizadores, equipas clínicas e infraestruturas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* FORMULÁRIO DE CRIAÇÃO (Ocupa 1/3) */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl"><UserPlus size={24} /></div>
            <h2 className="text-xl font-black tracking-tighter text-slate-900">Novo Utilizador</h2>
          </div>

          <form onSubmit={handleCriarStaff} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Cargo / Nível de Acesso</label>
              <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 text-sm outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="medico">👨‍⚕️ Médico(a)</option>
                <option value="secretaria">👩‍💻 Secretaria / Triagem</option>
                <option value="admin">🔑 Administrador Geral</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Hospital Alocado</label>
              <select required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})}>
                <option value="">Selecione...</option>
                {hospitais.map(h => (<option key={h.id} value={h.id}>{h.nome}</option>))}
              </select>
            </div>

            <div className="space-y-3">
              <input required type="text" placeholder="Nome Completo" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              <input required type="email" placeholder="E-mail de Acesso" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <input required type="password" placeholder="Palavra-passe Inicial" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              
              {form.role !== 'admin' && (
                <input required type="text" placeholder="Nº de Funcionário (Ex: SEC003)" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none" value={form.nr_funcionario} onChange={e => setForm({...form, nr_funcionario: e.target.value})} />
              )}
            </div>

            {form.role === 'medico' && (
              <div className="animate-in fade-in zoom-in-95">
                <input required type="text" placeholder="Especialidade Médica" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none" value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})} />
              </div>
            )}

            <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              Adicionar à Rede <PlusCircle size={16} />
            </button>
          </form>
        </div>

        {/* TABELA DE GESTÃO E LISTAGEM DE UTILIZADORES (Ocupa 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="text-slate-400" size={24} />
            <h2 className="text-xl font-black text-slate-800 tracking-tighter">Lista Geral de Utilizadores</h2>
          </div>

          <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  <tr>
                    <th className="p-5">Nome / Email</th>
                    <th className="p-5">Cargo</th>
                    <th className="p-5">Hospital</th>
                    <th className="p-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {utilizadores.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5">
                        <p className="font-black text-slate-800">{u.nome}</p>
                        <p className="text-xs text-slate-400 font-medium font-mono">{u.email}</p>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                          u.role === 'medico' ? 'bg-blue-50 text-blue-600' :
                          u.role === 'secretaria' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-slate-500 text-xs uppercase">{u.hospital_nome || "Sem Hospital"}</td>
                      <td className="p-5 text-right">
                        <button onClick={() => iniciarEdicao(u)} className="p-2.5 bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm">
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* ==============================================================
         MODAL INDUSTRIAL DE EDIÇÃO: SE ADAPTA CONSOANTE A ROLE
         ============================================================== */}
      {userEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-8 md:p-10 rounded-[3rem] w-full max-w-2xl relative shadow-2xl my-8 text-left animate-in zoom-in-95 duration-200">
            <button onClick={() => setUserEmEdicao(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-100 p-2 rounded-full"><X size={18} /></button>
            
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Modificar Cadastro</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Estás a editar o perfil de {userEmEdicao.nome} ({userEmEdicao.role})</p>
            </div>

            <form onSubmit={handleGravarEdicao} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Nome Completo</label>
                  <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500" value={formEdicao.nome} onChange={e => setFormEdicao({...formEdicao, nome: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">E-mail</label>
                  <input required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500" value={formEdicao.email} onChange={e => setFormEdicao({...formEdicao, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Nível de Role (Alterar com cuidado)</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:border-blue-500" value={formEdicao.role} onChange={e => setFormEdicao({...formEdicao, role: e.target.value})}>
                    <option value="utente">Utente</option>
                    <option value="secretaria">Secretaria</option>
                    <option value="medico">Médico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Hospital Afiliado</label>
                  <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500" value={formEdicao.hospital_id} onChange={e => setFormEdicao({...formEdicao, hospital_id: e.target.value})}>
                    {hospitais.map(h => (<option key={h.id} value={h.id}>{h.nome}</option>))}
                  </select>
                </div>
              </div>

              {/* BLOCO SE FOR UTENTE: MOSTRA OS CAMPOS CLÍNICOS */}
              {formEdicao.role === 'utente' && (
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3 animate-in border-dashed">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Dados Clínicos / Ficha de Utente</p>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" placeholder="Nº Utente SNS" className="w-full p-3 bg-white border rounded-xl text-sm font-mono font-bold outline-none" value={formEdicao.nr_utente} onChange={e => setFormEdicao({...formEdicao, nr_utente: e.target.value})} />
                    <input type="number" placeholder="Idade" className="w-full p-3 bg-white border rounded-xl text-sm font-medium outline-none" value={formEdicao.idade} onChange={e => setFormEdicao({...formEdicao, idade: e.target.value})} />
                    <input type="number" placeholder="Altura (cm)" className="w-full p-3 bg-white border rounded-xl text-sm font-medium outline-none" value={formEdicao.altura} onChange={e => setFormEdicao({...formEdicao, altura: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Morada Completa" className="w-full p-3 bg-white border rounded-xl text-sm font-medium outline-none" value={formEdicao.morada} onChange={e => setFormEdicao({...formEdicao, morada: e.target.value})} />
                  <textarea placeholder="Histórico, Alergias, Doenças Crónicas..." rows={2} className="w-full p-3 bg-white border rounded-xl text-sm font-medium outline-none" value={formEdicao.descricao} onChange={e => setFormEdicao({...formEdicao, descricao: e.target.value})} />
                </div>
              )}

              {/* BLOCO SE FOR MÉDICO OU SECRETARIA: MOSTRA O STAFF ID */}
              {(formEdicao.role === 'medico' || formEdicao.role === 'secretaria') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-amber-50/50 border border-amber-100 rounded-2xl border-dashed animate-in">
                  <div>
                    <label className="text-[10px] uppercase font-black text-amber-700 ml-1">Nº Funcionário</label>
                    <input required type="text" className="w-full p-3 bg-white border rounded-xl text-sm font-mono font-bold outline-none" value={formEdicao.nr_funcionario} onChange={e => setFormEdicao({...formEdicao, nr_funcionario: e.target.value})} />
                  </div>
                  {formEdicao.role === 'medico' && (
                    <div>
                      <label className="text-[10px] uppercase font-black text-amber-700 ml-1">Especialidade Médica</label>
                      <input required type="text" className="w-full p-3 bg-white border rounded-xl text-sm font-medium outline-none" value={formEdicao.especialidade} onChange={e => setFormEdicao({...formEdicao, especialidade: e.target.value})} />
                    </div>
                  )}
                </div>
              )}

              {/* RE-DEFINIR PASSWORD */}
              <div className="border-t pt-4">
                <label className="text-[10px] uppercase font-black text-red-500 ml-1">Forçar Nova Palavra-passe (Opcional)</label>
                <input type="password" placeholder="Deixe vazio para manter a atual" minLength={6} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-red-500" value={formEdicao.password} onChange={e => setFormEdicao({...formEdicao, password: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-colors">
                <Save size={16} /> Gravar Alterações Críticas
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}