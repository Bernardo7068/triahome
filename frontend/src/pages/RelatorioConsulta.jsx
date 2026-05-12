import { X, Printer } from "lucide-react";

export default function ModalRelatorio({ dados, onClose }) {
  if (!dados) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:backdrop-blur-none">
      
      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] print:max-h-none print:h-auto print:shadow-none print:rounded-none print:block print:absolute print:inset-0">
        
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 print:hidden z-10 bg-slate-100 p-2 rounded-full transition-colors">
          <X size={24} />
        </button>
        
        {/* Mudámos de font-serif para font-sans para manter o estilo do projeto */}
        <div className="p-12 md:p-16 font-sans text-slate-800 overflow-y-auto flex-1 print:overflow-visible print:p-8">
          
          {/* CABEÇALHO */}
          <div className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-10">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Relatório Clínico</h1>
              <p className="font-bold text-xl text-blue-600 mt-1">Serviço Nacional de Saúde</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-black text-slate-800 text-lg uppercase">{dados.nome_hospital || "Hospital de Ourém"}</p>
              <p>{dados.morada_hospital || "Rua da Saúde, 123, Ourém"}</p>
              <p>Tel: {dados.telefone_hospital || "249 123 456"}</p>
            </div>
          </div>

          {/* DADOS DO UTENTE & ATENDIMENTO */}
          <div className="grid grid-cols-2 gap-12 border-b border-dashed border-slate-300 pb-10 mb-10">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Dados do Utente</h3>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="font-bold text-slate-500">Nome:</span> <span className="font-black text-base">{dados.nome_utente}</span>
                <span className="font-bold text-slate-500">Nº Utente:</span> <span>{dados.nr_utente || "Não registado"}</span>
                <span className="font-bold text-slate-500">Telefone:</span> <span>{dados.telefone_utente || "Não registado"}</span>
                <span className="font-bold text-slate-500">Morada:</span> <span>{dados.morada_utente || "Não registada"}</span>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detalhes do Atendimento</h3>
               <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="font-bold text-slate-500">Data/Hora:</span> <span className="font-black font-mono">{dados.data_consulta ? new Date(dados.data_consulta).toLocaleString() : '---'}</span>
                <span className="font-bold text-slate-500">Registo Nº:</span> <span className="font-mono font-bold">{dados.id || dados.consulta_id || "---"}</span>
                <span className="font-bold text-slate-500">Triagem ID:</span> <span className="font-mono font-bold">{dados.triagem_id || "---"}</span>
                <span className="font-bold text-slate-500">Prioridade:</span> <span className="uppercase font-black">{dados.cor_manchester || "Não definida"}</span>
              </div>
            </div>
          </div>

          {/* INFORMAÇÃO CLÍNICA */}
          <div className="space-y-10 mb-16">
            <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 print:border-none print:p-0 print:bg-transparent">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">
                Diagnóstico Clínico
              </h3>
              <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap text-slate-700">
                {dados.diagnostico}
              </p>
            </div>

            <div className="bg-green-50/50 p-8 rounded-[2rem] border border-green-100 print:border-none print:p-0 print:bg-transparent">
              <h3 className="text-xs font-black text-green-600 uppercase tracking-widest mb-4">
                Prescrição e Recomendações
              </h3>
              <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap text-slate-700">
                {dados.prescricao}
              </p>
            </div>
          </div>

          {/* ASSINATURA DO MÉDICO */}
          <div className="mt-20 pt-8 border-t-2 border-slate-800 flex justify-end">
            <div className="text-center w-72">
              <p className="border-b border-slate-400 mb-3"></p>
              <p className="font-black text-slate-800 uppercase">Dr(a). {dados.nome_medico}</p>
              <p className="text-xs text-slate-500 mt-1 font-bold">Cédula Profissional: {dados.nr_cedula_medico || "00000"}</p>
              <p className="text-[10px] text-slate-400 mt-3 italic uppercase tracking-widest">Documento Assinado Digitalmente</p>
            </div>
          </div>

        </div>

        {/* RODAPÉ E BOTÃO DE IMPRIMIR - Oculto na impressão */}
        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-200 shrink-0 print:hidden rounded-b-[3rem]">
          <p className="text-xs text-slate-400 ml-6 font-bold">Imprima este documento ou guarde como PDF.</p>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1"
          >
            <Printer size={20}/> Imprimir Relatório
          </button>
        </div>
        
      </div>
    </div>
  );
}