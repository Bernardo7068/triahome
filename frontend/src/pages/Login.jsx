import { useState } from "react";
import api from "../services/api";
import { Activity, Mail, Lock, User, ShieldPlus, ArrowRight, HeartPulse } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  
  const [data, setData] = useState({ 
    email: "", password: "", nome: "", nr_identificacao: "" 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(""); // Limpa erros anteriores

    try {
      if (isRegistering) {
        // Prepara os dados assumindo sempre que é um UTENTE
        const payload = {
          nome: data.nome,
          email: data.email,
          password: data.password,
          role: 'utente', // Força o registo apenas para utentes
          hospital_id: 1, 
          nr_utente: data.nr_identificacao
        };

        await api.post('/register', payload);
        alert("Conta criada com sucesso! Já pode fazer login.");
        setIsRegistering(false); // Volta para login
      } else {
        const response = await api.post('/login', { email: data.email, password: data.password });
        onLoginSuccess(response.data.user);
      }
    } catch (err) {
      setErro(err.response?.data?.message || "Credenciais inválidas ou erro de ligação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      
      {/* Contentor Principal (Duas Colunas em Ecrãs Grandes) */}
      <div className="max-w-5xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Lado Esquerdo - Branding (Escondido em Mobile) */}
        <div className="hidden md:flex md:w-5/12 bg-blue-600 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -left-24 text-blue-500/30">
            <HeartPulse size={300} strokeWidth={1} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <Activity size={32} />
              </div>
              <h1 className="text-3xl font-black tracking-tighter italic">TRIA<span className="text-blue-200">Home</span></h1>
            </div>
            
            <h2 className="text-4xl font-black leading-tight mb-6">A Saúde de Amanhã,<br/>Hoje.</h2>
            <p className="text-blue-100 font-medium text-lg leading-relaxed">
              O nosso sistema de triagem com Inteligência Artificial garante que quem precisa de ajuda urgente é atendido no momento certo.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-2">Protocolo Manchester IA</p>
            <p className="text-xs text-blue-100">Avaliação clínica em menos de 30 segundos usando o motor Llama-3 local.</p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="w-full md:w-7/12 p-10 md:p-16 animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-800 mb-2">
              {isRegistering ? "Criar Nova Conta" : "Bem-vindo de volta"}
            </h2>
            <p className="text-slate-500 font-medium">
              {isRegistering ? "Preencha os dados para aceder ao sistema de triagem." : "Insira as suas credenciais para aceder ao portal."}
            </p>
          </div>

          {/* Mensagem de Erro Visual */}
          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
              <Activity size={16} /> {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campos de Registo (Apenas Utente) */}
            {isRegistering && (
              <div className="space-y-5 animate-in slide-in-from-bottom-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" placeholder="Nome Completo" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" 
                    onChange={e => setData({...data, nome: e.target.value})} required />
                </div>

                <div className="relative">
                  <ShieldPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" placeholder="Nº Utente SNS (9 dígitos)" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" 
                    onChange={e => setData({...data, nr_identificacao: e.target.value})} required />
                </div>
              </div>
            )}

            {/* Campos Comuns (Login e Registo) */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="email" placeholder="Endereço de Email" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" 
                onChange={e => setData({...data, email: e.target.value})} required />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="password" placeholder="Palavra-passe" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" 
                onChange={e => setData({...data, password: e.target.value})} required />
            </div>

            {/* Botão de Submissão */}
            <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 hover:bg-blue-600 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 mt-4 group">
              {loading ? "A processar..." : (isRegistering ? "Concluir Registo" : "Entrar de Forma Segura")}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Alternar entre Login / Registo */}
          <div className="mt-10 text-center">
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setErro(""); }} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">
              {isRegistering ? "Já tenho uma conta. Fazer Login" : "Ainda não tem acesso? Registe-se"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}