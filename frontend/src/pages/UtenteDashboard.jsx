import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import { Clock, Stethoscope, CheckCircle, Volume2, History } from "lucide-react";

export default function UtenteDashboard({ user }) {
  const [estadoAtivo, setEstadoAtivo] = useState(null);

  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await api.get(`/triagens/estado/${user.id}`);
        setEstadoAtivo(res.data);
      } catch (e) { console.error("Erro ao ler estado"); }
    };
    verificar();
    const timer = setInterval(verificar, 4000);
    return () => clearInterval(timer);
  }, [user.id]);

  // ESTADO: CHAMADO PARA O GABINETE
  if (estadoAtivo && estadoAtivo.estado_fila === 'em_consulta') {
    return (
      <div className="bg-blue-600 text-white p-10 rounded-[3rem] shadow-2xl text-center max-w-2xl mx-auto animate-pulse">
        <Volume2 size={64} className="mx-auto mb-6" />
        <h2 className="text-4xl font-black mb-2 italic">Sua Vez!</h2>
        <p className="text-blue-100 text-xl mb-8 font-medium">Dirija-se ao <span className="bg-white text-blue-600 px-4 py-1 rounded-xl font-black tracking-tighter">GABINETE {estadoAtivo.gabinete || '3'}</span></p>
        <div className="bg-white/10 p-6 rounded-3xl border border-white/20 text-left">
          <p className="text-[10px] font-black uppercase opacity-70 mb-2">Sintomas Analisados</p>
          <p className="italic text-sm">"{estadoAtivo.resumo_ia}"</p>
        </div>
      </div>
    );
  }

  // ESTADO: VALIDADO PELA SECRETARIA (SALA DE ESPERA)
  if (estadoAtivo && (estadoAtivo.estado_triagem === 'em_espera' || estadoAtivo.estado_fila === 'aguardar')) {
    return (
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border text-center max-w-2xl mx-auto">
        <CheckCircle size={60} className="text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Entrada Validada</h2>
        <p className="text-slate-500 mt-2 mb-8">Por favor, aguarde na <strong>Sala de Espera Geral</strong>.</p>
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl text-left">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Sua Prioridade</p>
            <BadgePrioridade cor={estadoAtivo.cor_manchester} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Espera Estimada</p>
            <p className="font-black text-2xl text-slate-700">{estadoAtivo.tempo_espera_min} min</p>
          </div>
        </div>
      </div>
    );
  }

  // ESTADO: TRIAGEM FEITA, A ESPERAR PELA SECRETARIA (CHECK-IN)
  if (estadoAtivo && (estadoAtivo.estado_triagem === 'pendente' || estadoAtivo.estado_triagem === 'checkin_feito')) {
    return (
      <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl text-center max-w-2xl mx-auto">
        <Clock size={60} className="text-blue-400 mx-auto mb-6 animate-spin-slow" />
        <h2 className="text-2xl font-black mb-2">Aguarde Admissão</h2>
        <p className="text-slate-400 mb-8">Dirija-se ao balcão da <strong>Secretaria</strong> para validar a sua entrada no hospital.</p>
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-left">
          <p className="text-xs font-bold text-blue-400 uppercase mb-1">Resumo da Triagem</p>
          <p className="text-sm italic opacity-80">{estadoAtivo.resumo_ia}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center p-10 bg-white rounded-[3rem] border shadow-sm max-w-xl mx-auto">
      <h2 className="text-2xl font-black mb-4">Bem-vindo ao TRIA-Home</h2>
      <p className="text-slate-500 mb-8">Inicie uma nova triagem para ser atendido.</p>
      <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold">Nova Triagem IA</button>
    </div>
  );
}