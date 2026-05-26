import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import ModalRelatorio from "./RelatorioConsulta";
import { Stethoscope, Eye, History, LayoutDashboard, Timer, BarChart3, ShieldCheck, Activity, Play, Send, AlertCircle, User, X, Users, Building, PlusCircle, Edit2, Save, Search, UserPlus, Briefcase, Lock, ChevronLeft, ChevronRight } from "lucide-react";

export default function DiretorDashboard({ user }) {
  const navigate = useNavigate();
  const [fila, setFila] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("geral");
  const [relatorioParaVer, setRelatorioParaVer] = useState(null);
  const [agora, setAgora] = useState(new Date());

  // ESTADOS DE CONSULTA MÉDICA
  const [consultaAtiva, setConsultaAtiva] = useState(null);
  const [pacientePopup, setPacientePopup] = useState(null);
  const [relatorio, setRelatorio] = useState({ diagnostico: "", prescricao: "", notas_clinicas: "" });
  const [finalizando, setFinalizando] = useState(false);

  // ESTADOS DE GESTÃO DE PESSOAL
  const [utilizadores, setUtilizadores] = useState([]);
  const [filtroGestao, setFiltroGestao] = useState("");
  const [abaGestao, setAbaGestao] = useState("medicos"); // Nova aba interna para gestão
  const hospitalId = user?.hospital_id || 1;
  const [formGestao, setFormGestao] = useState({
    nome: "", email: "", password: "", role: "medico", hospital_id: hospitalId, nr_funcionario: "", especialidade: ""
  });
  const [userEmEdicao, setUserEmEdicao] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});
  const [loadingGestao, setLoadingGestao] = useState(false);
  
  // Paginação da Gestão de Pessoal
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUtilizadores, setTotalUtilizadores] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const especialidades = [
    "Clínica Geral", "Pediatria", "Cardiologia", "Ortopedia", "Neurologia", 
    "Psiquiatria", "Ginecologia", "Dermatologia", "Oftalmologia", "Outra"
  ];

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarDadosClinicos = async () => {
    try {
      const resFila = await api.get(`/medico/fila?hospital_id=${hospitalId}`);
      const dadosFila = resFila.data || [];
      setFila(dadosFila);
      
      const pacienteEmConsulta = dadosFila.find(p => p.estado_fila === 'em_consulta');
      if (pacienteEmConsulta) {
          setConsultaAtiva(pacienteEmConsulta);
      } else {
          setConsultaAtiva(null);
      }
      
      const resHist = await api.get(`/historico/${user.id}/diretor?hospital_id=${hospitalId}`);
      setHistorico(resHist.data?.data || resHist.data || []);
    } catch (e) { 
      console.error("Erro ao carregar dados do diretor:", e); 
    }
  };

  const fetchUtilizadores = async (page = 1, tab = abaGestao, search = filtroGestao) => {
    try {
      let roleDb = tab;
      if (tab === 'medicos') roleDb = 'medico';
      if (tab === 'utentes') roleDb = 'utente';
      
      const res = await api.get(`/admin/utilizadores?hospital_id=${hospitalId}&page=${page}&role=${roleDb}&search=${search}`);
      setUtilizadores(res.data.data || []);
      setPaginaAtual(res.data.current_page);
      setTotalPaginas(res.data.last_page);
      setTotalUtilizadores(res.data.total);
    } catch (error) {
      console.error("Erro ao carregar utilizadores", error);
    }
  };

  useEffect(() => { 
      carregarDadosClinicos(); 
  }, [user]);

  // Gestão de Paginação e Filtros para o Pessoal
  useEffect(() => {
    if (abaAtiva === 'gestao') {
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        fetchUtilizadores(paginaAtual, abaGestao, filtroGestao);
      }, 300);
      setSearchTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtiva, abaGestao, paginaAtual, filtroGestao]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [abaGestao]);

  // FUNÇÕES DE CONSULTA MÉDICA
  const chamarProximo = async () => {
    try {
      const medicoId = user?.id || 1;
      const res = await api.get(`/medico/proximo?hospital_id=${hospitalId}&medico_id=${medicoId}`);
      
      if (res.data && res.data.nome_utente) {
        setConsultaAtiva(res.data);
        setAbaAtiva("consulta"); 
        carregarDadosClinicos();
      }
    } catch (e) {
      const erro = e.response?.data?.message || "Sem pacientes na fila";
      alert(erro);
    }
  };

  const finalizarConsulta = async () => {
    if (!relatorio.diagnostico || !relatorio.prescricao) {
      alert("Por favor, preencha o diagnóstico e a prescrição.");
      return;
    }
    setFinalizando(true);
    try {
      await api.post(`/consultas/finalizar`, {
        triagem_id: consultaAtiva.triagem_id,
        medico_id: user?.id || 1,
        utente_id: consultaAtiva.utente_id,
        diagnostico: relatorio.diagnostico,
        prescricao: relatorio.prescricao,
        notas_clinicas: relatorio.notas_clinicas
      });
      
      alert("Consulta finalizada!");
      setConsultaAtiva(null);
      setRelatorio({ diagnostico: "", prescricao: "", notas_clinicas: "" });
      setAbaAtiva("geral"); 
      carregarDadosClinicos();
    } catch (e) { 
      const msg = e.response?.data?.message || e.message || 'Erro ao finalizar consulta.';
      alert(msg);
    } finally {
      setFinalizando(false);
    }
  };

  // FUNÇÕES DE GESTÃO DE PESSOAL
  const handleCriarStaff = async (e) => {
    e.preventDefault();
    setLoadingGestao(true);
    try {
      const payload = { ...formGestao, hospital_id: hospitalId };
      await api.post("/admin/utilizadores/novo", payload);
      alert("Utilizador adicionado com sucesso!");
      setFormGestao({ ...formGestao, nome: "", email: "", password: "", nr_funcionario: "", especialidade: "" });
      fetchUtilizadores(1);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao criar utilizador.");
    } finally {
      setLoadingGestao(false);
    }
  };

  const iniciarEdicao = (u) => {
    setUserEmEdicao(u);
    setFormEdicao({
      nome: u.nome || "",
      email: u.email || "",
      role: u.role || "utente",
      hospital_id: hospitalId,
      nr_funcionario: u.nr_funcionario || "",
      especialidade: u.especialidade || "",
      nr_utente: u.nr_utente || "",
      idade: u.idade || "",
      altura: u.altura || "",
      morada: u.morada || "",
      descricao: u.descricao || "",
      password: ""
    });
  };

  const handleGravarEdicao = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/utilizadores/editar/${userEmEdicao.id}`, formEdicao);
      alert("Utilizador atualizado com sucesso!");
      setUserEmEdicao(null);
      fetchUtilizadores(paginaAtual);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao atualizar dados.");
    }
  };

  const calcularTempoEspera = (dataEntrada) => {
    if (!dataEntrada) return "--";
    const entrada = new Date(dataEntrada);
    const diferencaMs = agora - entrada;
    if (diferencaMs < 0) return "Agora";
    const minutosTotais = Math.floor(diferencaMs / (1000 * 60));
    if (minutosTotais < 60) return `${minutosTotais} min`;
    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;
    return `${horas}h ${minutos}m`;
  };

  const listaEspera = fila.filter(p => p.estado_fila === 'aguardar');
  const emEspera = listaEspera.length;
  const emConsulta = fila.filter(p => p.estado_fila === 'em_consulta').length;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 text-left">
      
      {/* CABEÇALHO COMPACTO E PROFISSIONAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-[3rem] border shadow-sm mt-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Direção Clínica</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Supervisão Hospitalar & Atendimento</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl text-center flex-1 md:flex-none">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Em Espera</p>
            <p className="text-xl font-black text-blue-600">{emEspera}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl text-center flex-1 md:flex-none">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Em Consulta</p>
            <p className="text-xl font-black text-amber-500">{emConsulta}</p>
          </div>
        </div>
      </div>

      {/* MENU UNIFICADO HÍBRIDO (Gestão + Médico) */}
      <div className="flex flex-wrap gap-3 bg-white p-2 rounded-2xl shadow-sm border">
        {/* FUNÇÕES DE GESTÃO */}
        <button onClick={() => setAbaAtiva("geral")} className={`flex-1 min-w-[150px] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${abaAtiva === 'geral' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <LayoutDashboard size={18}/> Visão Global
        </button>
        <button onClick={() => setAbaAtiva("auditoria")} className={`flex-1 min-w-[150px] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${abaAtiva === 'auditoria' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <History size={18}/> Auditoria Clínica
        </button>
        <button onClick={() => setAbaAtiva("gestao")} className={`flex-1 min-w-[150px] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${abaAtiva === 'gestao' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Users size={18}/> Gestão de Pessoal
        </button>
        
        {/* FUNÇÕES MÉDICAS */}
        <button onClick={() => setAbaAtiva("espera")} className={`flex-1 min-w-[150px] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${abaAtiva === 'espera' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'}`}>
          <Stethoscope size={18}/> Atender Urgências
        </button>
        
        {consultaAtiva && (
          <button onClick={() => setAbaAtiva("consulta")} className={`flex-1 min-w-[150px] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${abaAtiva === 'consulta' ? 'bg-red-500 text-white shadow-md' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'}`}>
            <AlertCircle size={18} className={abaAtiva !== 'consulta' ? "animate-pulse" : ""}/> Em Consulta
          </button>
        )}
      </div>

      {/* --------------------------------------------------------- */}
      {/* 1. VISÃO GERAL (SUPERVISÃO) */}
      {/* --------------------------------------------------------- */}
      {abaAtiva === "geral" && (
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <Activity size={18} />
                <h2 className="font-black text-lg uppercase tracking-tight">Atividade em Tempo Real</h2>
              </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b">
                    <tr>
                      <th className="p-4 pl-6">Prioridade</th>
                      <th className="p-4">Paciente</th>
                      <th className="p-4">Especialidade</th>
                      <th className="p-4">Tempo Espera</th>
                      <th className="p-4 text-center">Ficha IA</th>
                      <th className="p-4 text-right pr-6">Estado Atual</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {fila.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                            <td className="p-4 pl-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                            <td className="p-4 font-bold text-slate-800">{p.nome_utente}</td>
                            <td className="p-4 text-slate-600 font-medium">{p.especialidade || 'Clínica Geral'}</td>
                            <td className="p-4 font-mono text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Timer size={14} className="opacity-50" /> {calcularTempoEspera(p.hora_entrada)}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                                <button onClick={() => setPacientePopup(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg">
                                    <Eye size={16}/>
                                </button>
                            </td>
                            <td className="p-4 text-right pr-6">
                              {p.estado_fila === 'aguardar' ? <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg text-xs">Espera</span> :
                               p.estado_fila === 'em_consulta' ? <span className="text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-lg text-xs">Consulta (Gab. {p.gabinete || 1})</span> :
                               <span className="text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-lg text-xs">Triagem</span>}
                            </td>
                        </tr>
                    ))}
                    {fila.length === 0 && (
                        <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-medium italic">Sem pacientes no momento.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* 2. AUDITORIA CLÍNICA (SUPERVISÃO) */}
      {/* --------------------------------------------------------- */}
      {abaAtiva === "auditoria" && (
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b bg-slate-50 flex items-center gap-2 text-slate-800">
            <History size={18} />
            <h2 className="font-black text-lg uppercase tracking-tight">Histórico Hospitalar (Auditoria)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
                <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b">
                  <tr>
                    <th className="p-4 pl-6">Data</th>
                    <th className="p-4">Paciente</th>
                    <th className="p-4">Médico Responsável</th>
                    <th className="p-4 text-right pr-6">Ver Relatório</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {historico.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                            <td className="p-4 pl-6 font-mono text-slate-500">{new Date(h.data_consulta).toLocaleString('pt-PT')}</td>
                            <td className="p-4 font-bold text-slate-800">{h.nome_utente}</td>
                            <td className="p-4 text-slate-600 font-medium">{h.nome_medico || "N/D"}</td>
                            <td className="p-4 text-right pr-6">
                              <button onClick={() => setRelatorioParaVer(h)} className="text-slate-600 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-all font-black text-xs uppercase tracking-wider">
                                Inspecionar
                              </button>
                            </td>
                        </tr>
                    ))}
                    {historico.length === 0 && (
                        <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium italic">Nenhum atendimento registado para auditoria.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* GESTÃO DE PESSOAL (SUPERVISÃO - NOVO) */}
      {/* --------------------------------------------------------- */}
      {abaAtiva === "gestao" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start text-left animate-in fade-in duration-300 mt-8">
          
          {/* Formulário Criação Rápida */}
          <div className="xl:col-span-4 bg-white rounded-[3rem] border shadow-sm p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg shadow-slate-200"><UserPlus size={28} /></div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-slate-900">Novo Cadastro</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Adicionar ao seu Hospital</p>
              </div>
            </div>

            <form onSubmit={handleCriarStaff} className="space-y-5 text-left">
              <div>
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Cargo / Nível de Acesso</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 text-sm outline-none focus:border-blue-500 transition-all" value={formGestao.role} onChange={e => setFormGestao({...formGestao, role: e.target.value})}>
                  <option value="medico">👨‍⚕️ Médico(a)</option>
                  <option value="secretaria">👩‍💻 Secretaria / Triagem</option>
                  <option value="utente">👤 Utente / Paciente</option>
                </select>
              </div>

              <div className="space-y-4 text-left">
                <input required type="text" placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={formGestao.nome} onChange={e => setFormGestao({...formGestao, nome: e.target.value})} />
                <input required type="email" placeholder="E-mail de Acesso" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={formGestao.email} onChange={e => setFormGestao({...formGestao, email: e.target.value})} />
                <input required type="password" placeholder="Palavra-passe Inicial" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={formGestao.password} onChange={e => setFormGestao({...formGestao, password: e.target.value})} />
                
                {formGestao.role !== 'utente' && (
                  <input required type="text" placeholder="Nº de Funcionário (Ex: SEC001)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black outline-none focus:border-blue-500 transition-all" value={formGestao.nr_funcionario} onChange={e => setFormGestao({...formGestao, nr_funcionario: e.target.value})} />
                )}
              </div>

              {formGestao.role === 'medico' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Especialidade Médica</label>
                  <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formGestao.especialidade} onChange={e => setFormGestao({...formGestao, especialidade: e.target.value})}>
                    <option value="">Selecione Especialidade...</option>
                    {especialidades.map(esp => (<option key={esp} value={esp}>{esp}</option>))}
                  </select>
                </div>
              )}

              <button disabled={loadingGestao} type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50 shadow-xl shadow-slate-100 mt-4">
                Adicionar<PlusCircle size={20} />
              </button>
            </form>
          </div>

          {/* Lista de Utilizadores */}
          <div className="xl:col-span-8 space-y-6 text-left">
            
            {/* MENU DE ABAS E PESQUISA DA GESTÃO */}
            <div className="bg-white p-3 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row items-center gap-4">
              <div className="flex flex-1 w-full gap-2">
                <button onClick={() => setAbaGestao("medicos")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${abaGestao === 'medicos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Stethoscope size={18} /> Médicos
                </button>
                <button onClick={() => setAbaGestao("secretaria")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${abaGestao === 'secretaria' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Briefcase size={18} /> Secretaria
                </button>
                <button onClick={() => setAbaGestao("utentes")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${abaGestao === 'utentes' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Users size={18} /> Utentes
                </button>
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={`Pesquisar na base de dados de ${abaGestao}...`}
                className="w-full pl-14 pr-6 py-5 bg-white border shadow-sm rounded-[2.5rem] text-sm font-medium outline-none focus:border-blue-500 transition-all"
                value={filtroGestao}
                onChange={e => {
                  setFiltroGestao(e.target.value);
                  setPaginaAtual(1);
                }}
              />
            </div>
            
            <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden h-[600px] flex flex-col justify-between">
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] sticky top-0 z-10">
                    <tr>
                      <th className="p-8 pl-10">Identificação</th>
                      <th className="p-8">Hospital</th>
                      <th className="p-8">Detalhes</th>
                      <th className="p-8 text-right pr-10">Gerir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {utilizadores.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 pl-10">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                              (u.role === 'medico' || u.role === 'diretor') ? 'bg-blue-50 text-blue-600' :
                              u.role === 'secretaria' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-base">{u.nome}</p>
                              <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl w-fit">
                            <Building size={12} /> {u.hospital_nome || "Hospital Base"}
                          </div>
                        </td>
                        <td className="p-6">
                          {(u.role === 'medico' || u.role === 'diretor') && (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Especialidade</span>
                              <span className="font-bold text-slate-700">{u.especialidade || "---"}</span>
                            </div>
                          )}
                          {u.role === 'utente' && (
                            <div className="flex gap-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Idade</span>
                                <span className="font-bold text-slate-700">{u.idade || "--"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nº Utente</span>
                                <span className="font-mono font-bold text-slate-700">{u.nr_utente || "---"}</span>
                              </div>
                            </div>
                          )}
                          {u.role === 'secretaria' && (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">ID Staff</span>
                              <span className="font-mono font-bold text-slate-700">{u.nr_funcionario || "---"}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-6 text-right pr-10">
                          <button 
                            onClick={() => iniciarEdicao(u)} 
                            className="p-3 bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {utilizadores.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-300">
                            <Users size={64} className="opacity-20" />
                            <p className="font-black uppercase tracking-[0.2em] text-sm">Nenhum registo encontrado</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* CONTROLOS DE PAGINAÇÃO (UTILIZADORES) */}
              {totalPaginas > 1 && (
                <div className="bg-slate-50 p-6 border-t flex items-center justify-between shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    A mostrar página {paginaAtual} de {totalPaginas} <span className="lowercase font-medium">({totalUtilizadores} total)</span>
                  </p>
                  <div className="flex gap-2">
                    <button 
                      disabled={paginaAtual === 1}
                      onClick={() => setPaginaAtual(p => p - 1)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      disabled={paginaAtual === totalPaginas}
                      onClick={() => setPaginaAtual(p => p + 1)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* 3. ATENDER URGÊNCIAS (FUNÇÃO MÉDICA) */}
      {/* --------------------------------------------------------- */}
      {abaAtiva === "espera" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <h2 className="text-xl font-black flex items-center gap-2 tracking-tight text-blue-600"><Stethoscope size={24}/> Chamar Próximo Paciente</h2>
            <button onClick={chamarProximo} disabled={listaEspera.length === 0 || consultaAtiva} className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-black hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
              <Play fill="currentColor" size={18}/> Chamar à Sala
            </button>
          </div>
          <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                  <tr>
                    <th className="p-6">Prioridade</th>
                    <th className="p-6">Utente</th>
                    <th className="p-6">Especialidade</th>
                    <th className="p-6">Tempo Espera</th>
                    <th className="p-6 text-right">Ficha Clínica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listaEspera.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                      <td className="p-6 font-bold text-slate-700">{p.nome_utente}</td>
                      <td className="p-6 text-slate-500 text-sm font-bold">{p.especialidade || 'Clínica Geral'}</td>
                      <td className="p-6 font-mono text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <Timer size={16} className="text-slate-400" /> 
                            {calcularTempoEspera(p.hora_entrada)}
                          </div>
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => setPacientePopup(p)} className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <Eye size={20}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {listaEspera.length === 0 && (
                    <tr><td colSpan={5} className="p-16 text-center text-slate-400 font-medium italic">A sala de espera está vazia.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* 4. EM CONSULTA (FUNÇÃO MÉDICA) */}
      {/* --------------------------------------------------------- */}
      {abaAtiva === "consulta" && consultaAtiva && (
        <div className="bg-white rounded-[2rem] shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
          <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6 w-full">
              <div className="bg-white/10 p-4 rounded-2xl hidden sm:block"><User size={32}/></div>
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight">{consultaAtiva.nome_utente}</h3>
                <div className="flex flex-wrap gap-3 mt-2">
                    <BadgePrioridade cor={consultaAtiva.cor_manchester}/>
                    <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">{consultaAtiva.idade ? `${consultaAtiva.idade} ANOS` : 'IDADE N/D'}</span>
                    <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">{consultaAtiva.altura ? `${consultaAtiva.altura} CM` : 'ALTURA N/D'}</span>
                </div>
              </div>
            </div>
            <div className="w-full md:max-w-xs text-left md:text-right">
                <p className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest">Queixa Principal (IA)</p>
                <p className="text-xs italic opacity-80 leading-relaxed font-medium">"{consultaAtiva.resumo_ia}"</p>
            </div>
          </div>
          
          {consultaAtiva.descricao_utente && (
            <div className="px-6 md:px-8 py-4 bg-amber-50/50 border-b border-amber-100">
                <p className="text-[10px] font-black uppercase text-amber-600 mb-1 tracking-widest flex items-center gap-2">
                    <AlertCircle size={14}/> Ficha Clínica / Antecedentes
                </p>
                <p className="text-xs text-amber-900 font-medium italic">"{consultaAtiva.descricao_utente}"</p>
            </div>
          )}

          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Diagnóstico Clínico</label>
              <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-28 outline-none focus:border-blue-600 transition-all text-sm font-medium" placeholder="Escreva aqui o diagnóstico..." value={relatorio.diagnostico} onChange={e => setRelatorio({...relatorio, diagnostico: e.target.value})} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Prescrição e Recomendações</label>
              <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl h-28 outline-none focus:border-green-600 transition-all text-sm font-medium" placeholder="Escreva aqui a medicação e cuidados..." value={relatorio.prescricao} onChange={e => setRelatorio({...relatorio, prescricao: e.target.value})} />
            </div>
            <button 
              onClick={finalizarConsulta} 
              disabled={finalizando}
              className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-900 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Send size={20}/> {finalizando ? "A processar..." : "Gravar e Finalizar Consulta"}
            </button>
          </div>
        </div>
      )}

      {/* POPUP DE FICHA IA */}
      {pacientePopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] w-full max-w-lg relative text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setPacientePopup(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-100 p-2 rounded-full"><X size={18} /></button>
            <div className="flex justify-center mb-4">
                <BadgePrioridade cor={pacientePopup.cor_manchester}/>
            </div>
            <h2 className="text-2xl font-black mb-1">{pacientePopup.nome_utente}</h2>
            <div className="flex justify-center gap-3 mb-6">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-3 py-1 rounded-lg italic">
                    {pacientePopup.idade ? `${pacientePopup.idade} ANOS` : 'Idade N/D'}
                </span>
            </div>
            
            <div className="text-left bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-500 mb-1 tracking-widest">Especialidade Recomendada</p>
                  <p className="text-slate-800 font-bold text-sm">{pacientePopup.especialidade || 'Clínica Geral'}</p>
                </div>
                
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-500 mb-2 tracking-widest">Resumo da Triagem IA</p>
                  <p className="text-slate-700 italic leading-relaxed text-sm">" {pacientePopup.resumo_ia || "Nenhuma informação disponível."}"</p>
                </div>

                {pacientePopup.descricao_utente && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-black uppercase text-amber-600 mb-2 tracking-widest">Ficha Clínica / Antecedentes</p>
                    <p className="text-slate-700 italic leading-relaxed text-sm font-medium">" {pacientePopup.descricao_utente}"</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO UNIFICADO */}
      {userEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 md:p-12 rounded-[4rem] w-full max-w-2xl relative shadow-2xl max-h-[90vh] overflow-y-auto text-left animate-in zoom-in-95 duration-200">
            <button onClick={() => setUserEmEdicao(null)} className="fixed md:absolute top-8 right-8 text-slate-400 hover:text-slate-900 bg-slate-100 p-3 rounded-full transition-all z-10 shadow-sm"><X size={24} /></button>
            
            <div className="mb-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Modificar Cadastro</h3>
              <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">Perfil: {userEmEdicao.nome}</p>
            </div>

            <form onSubmit={handleGravarEdicao} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Nome Completo</label>
                  <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.nome} onChange={e => setFormEdicao({...formEdicao, nome: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">E-mail</label>
                  <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.email} onChange={e => setFormEdicao({...formEdicao, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Nível de Role</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-blue-500 transition-all" value={formEdicao.role} onChange={e => setFormEdicao({...formEdicao, role: e.target.value})}>
                    <option value="utente">Utente</option>
                    <option value="secretaria">Secretaria</option>
                    <option value="medico">Médico</option>
                  </select>
                </div>
                {(formEdicao.role === 'medico' || formEdicao.role === 'secretaria' || formEdicao.role === 'diretor') && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Nº Funcionário</label>
                    <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black outline-none focus:border-blue-500 transition-all" value={formEdicao.nr_funcionario} onChange={e => setFormEdicao({...formEdicao, nr_funcionario: e.target.value})} />
                  </div>
                )}
              </div>

              {formEdicao.role === 'medico' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Especialidade Médica</label>
                  <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.especialidade} onChange={e => setFormEdicao({...formEdicao, especialidade: e.target.value})}>
                    <option value="">Selecione Especialidade...</option>
                    {especialidades.map(esp => (<option key={esp} value={esp}>{esp}</option>))}
                  </select>
                </div>
              )}

              {formEdicao.role === 'utente' && (
                <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] space-y-6 animate-in border-dashed">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Dados Clínicos / Ficha de Utente</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Nº Utente SNS</label>
                      <input type="text" placeholder="SNS" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono font-black outline-none focus:border-blue-500 transition-all" value={formEdicao.nr_utente} onChange={e => setFormEdicao({...formEdicao, nr_utente: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Idade</label>
                      <input type="number" placeholder="Anos" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.idade} onChange={e => setFormEdicao({...formEdicao, idade: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Altura</label>
                      <input type="number" placeholder="cm" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.altura} onChange={e => setFormEdicao({...formEdicao, altura: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Morada de Residência</label>
                    <input type="text" placeholder="Rua, Número, Código Postal" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.morada} onChange={e => setFormEdicao({...formEdicao, morada: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Historial Clínico Relevante</label>
                    <textarea placeholder="Histórico, Alergias, Doenças Crónicas..." rows={3} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={formEdicao.descricao} onChange={e => setFormEdicao({...formEdicao, descricao: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-8">
                <label className="text-[10px] uppercase font-black text-red-500 ml-1 tracking-widest mb-2 block">Segurança: Re-definir Password (Opcional)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="password" placeholder="Deixe vazio para manter a atual" minLength={6} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-red-500 transition-all" value={formEdicao.password} onChange={e => setFormEdicao({...formEdicao, password: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98] mb-4">
                <Save size={24} /> Gravar Alterações Críticas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RELATÓRIO MODAL */}
      {relatorioParaVer && <ModalRelatorio dados={relatorioParaVer} onClose={() => setRelatorioParaVer(null)} />}
    </div>
  );
}