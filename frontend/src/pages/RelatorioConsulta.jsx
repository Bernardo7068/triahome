import { X, Printer } from "lucide-react";

export default function ModalRelatorio({ dados, onClose }) {
  if (!dados) return null;

  const getPrioridadeCor = (cor) => {
    const mapa = {
      'vermelho': 'text-red-600',
      'laranja': 'text-orange-500',
      'amarelo': 'text-yellow-500',
      'verde': 'text-green-600',
      'azul': 'text-blue-600'
    };
    return mapa[cor?.toLowerCase()] || 'text-slate-800';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:backdrop-blur-none print:static print:block">
      
      {/* Estilo Industrial para travar a paginação estritamente em uma folha A4 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #fff;
            color: #000;
          }
          body * { 
            visibility: hidden; 
          }
          .print-container, .print-container * { 
            visibility: visible; 
          }
          .print-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            height: 100%;
            max-height: 100%;
            overflow: hidden !important;
            padding: 20mm !important;
          }
        }
      `}} />

      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] print:max-h-none print:h-full print:shadow-none print:rounded-none print:block print:static print-container">
        
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 print:hidden z-10 bg-slate-100 p-2 rounded-full transition-colors">
          <X size={24} />
        </button>
        
        {/* PAI DO CONTEÚDO: Ajustado com paddings e margens menores em impressão */}
        <div className="p-12 md:p-14 font-sans text-slate-800 overflow-y-auto flex-1 print:overflow-hidden print:p-0 print:text-xs">
          
          {/* CABEÇALHO */}
          <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none print:text-2xl">Relatório Clínico</h1>
              <p className="font-bold text-lg text-blue-600 mt-0.5 print:text-sm">Serviço Nacional de Saúde</p>
            </div>
            <div className="text-right text-xs text-slate-500 print:text-[10px]">
              <p className="font-black text-slate-800 text-base uppercase leading-tight print:text-xs">{dados.nome_hospital || "Hospital de Ourém"}</p>
              <p>{dados.morada_hospital || "Rua da Saúde, 123, Ourém"}</p>
              <p>Tel: {dados.telefone_hospital || "249 123 456"}</p>
            </div>
          </div>

          {/* DADOS DO UTENTE & ATENDIMENTO (Transformado em grid real de 2 colunas para o papel) */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-6 border-b border-dashed border-slate-300 pb-6 mb-6 print:mb-4 print:pb-4">
            
            {/* COLUNA 1: DADOS DO UTENTE */}
            <div className="space-y-4 print:space-y-3">
              <div className="space-y-2">
                <h3 className="text-[10px] print:text-[9px] font-black text-slate-400 uppercase tracking-widest">Dados do Utente</h3>
                <div className="grid grid-cols-[120px_1fr] gap-1 text-sm print:text-xs">
                  <span className="font-bold text-slate-500">Nome:</span> <span className="font-black text-slate-800">{dados.nome_utente}</span>
                  <span className="font-bold text-slate-500">Nº Utente:</span> <span className="font-mono">{dados.nr_utente || "Não registado"}</span>
                  <span className="font-bold text-slate-500">Idade:</span> <span>{dados.idade ? `${dados.idade} anos` : "N/D"}</span>
                  <span className="font-bold text-slate-500">Altura:</span> <span>{dados.altura ? `${dados.altura} cm` : "N/D"}</span>
                  <span className="font-bold text-slate-500">Morada:</span> <span className="truncate">{dados.morada_utente || dados.morada || "Não registada"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-[10px] print:text-[9px] font-black text-slate-400 uppercase tracking-widest">Sintomatologia / Queixa</h3>
                <p className="text-sm print:text-xs font-medium italic text-slate-600 bg-slate-50 p-4 print:p-3 rounded-2xl border border-slate-100 print:bg-transparent print:border-none leading-relaxed">
                  "{dados.resumo_ia || "Nenhuma queixa específica registada."}"
                </p>
              </div>
            </div>

            {/* COLUNA 2: DETALHES DO ATENDIMENTO */}
            <div className="space-y-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 print:bg-transparent print:border-none print:p-0 h-fit">
               <h3 className="text-[10px] print:text-[9px] font-black text-slate-400 uppercase tracking-widest">Detalhes do Atendimento</h3>
               <div className="grid grid-cols-[120px_1fr] gap-2 text-sm print:text-xs">
                <span className="font-bold text-slate-500">Data/Hora:</span> <span className="font-black font-mono">{dados.data_consulta ? new Date(dados.data_consulta).toLocaleString('pt-PT') : '---'}</span>
                <span className="font-bold text-slate-500">Registo Nº:</span> <span className="font-mono font-bold">#{String(dados.id || dados.consulta_id || "0").padStart(5, '0')}</span>
                <span className="font-bold text-slate-500">Especialidade:</span> <span className="font-bold uppercase text-xs">{dados.especialidade || "Clínica Geral"}</span>
                <span className="font-bold text-slate-500">Prioridade:</span> <span className={`uppercase font-black ${getPrioridadeCor(dados.cor_manchester)}`}>{dados.cor_manchester || "Não definida"}</span>
              </div>
              {dados.descricao_utente && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Antecedentes Clínicos</span>
                  <p className="text-[11px] print:text-xs text-slate-500 leading-snug italic">{dados.descricao_utente}</p>
                </div>
              )}
            </div>

          </div>

          {/* INFORMAÇÃO CLÍNICA DIRECTA */}
          <div className="space-y-4 mb-6 print:mb-4 print:space-y-3">
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 print:border-b print:border-slate-200 print:p-0 print:bg-transparent print:rounded-none">
              <h3 className="text-[10px] print:text-[9px] font-black text-blue-600 print:text-slate-900 uppercase tracking-widest mb-1.5 font-bold">
                Diagnóstico Clínico
              </h3>
              <p className="text-base print:text-xs font-bold leading-relaxed whitespace-pre-wrap text-slate-800">
                {dados.diagnostico || "Aguardando validação."}
              </p>
            </div>

            <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100 print:border-b print:border-slate-200 print:p-0 print:bg-transparent print:rounded-none">
              <h3 className="text-[10px] print:text-[9px] font-black text-green-600 print:text-slate-900 uppercase tracking-widest mb-1.5 font-bold">
                Prescrição e Recomendações
              </h3>
              <p className="text-sm print:text-xs font-medium leading-relaxed whitespace-pre-wrap text-slate-700">
                {dados.prescricao || "Sem prescrição registada."}
              </p>
            </div>

            {dados.conselhos_autocuidado && (
              <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 print:p-0 print:bg-transparent print:rounded-none">
                <h3 className="text-[10px] print:text-[9px] font-black text-amber-600 print:text-slate-900 uppercase tracking-widest mb-1">
                  Conselhos de Autocuidado
                </h3>
                <p className="text-xs font-medium leading-relaxed text-slate-600 italic">
                  {dados.conselhos_autocuidado}
                </p>
              </div>
            )}
          </div>

          {/* ASSINATURA DO MÉDICO: Puxada mais para cima no papel */}
          <div className="mt-8 pt-4 border-t-2 border-slate-800 flex justify-end print:mt-12">
            <div className="text-center w-64 flex flex-col items-center">
              <div className="h-10 flex items-center justify-center font-serif italic text-slate-400 text-xl select-none opacity-40 print:opacity-100 print:text-slate-300">
                {dados.nome_medico}
              </div>
              <div className="w-full border-b border-slate-400 mb-2 print:border-slate-500"></div>
              <p className="font-black text-slate-800 uppercase tracking-tighter text-sm">Dr(a). {dados.nome_medico}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cédula: {dados.nr_cedula_medico || "00000"}</p>
              <p className="text-[9px] text-slate-400 mt-2 italic uppercase tracking-widest hidden print:block">Assinado Digitalmente</p>
            </div>
          </div>

        </div>

        {/* RODAPÉ E BOTÃO DE IMPRIMIR - Totalmente omitido na folha A4 real */}
        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-200 shrink-0 print:hidden rounded-b-[3rem]">
          <p className="text-[10px] text-slate-400 ml-6 font-black uppercase tracking-[0.2em]">Sistema Nacional de Saúde • Documento Oficial</p>
          <div className="flex gap-4">
             <button 
              onClick={onClose} 
              className="px-6 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all text-xs uppercase"
            >
              Fechar
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1"
            >
              <Printer size={20}/> Imprimir Relatório
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}