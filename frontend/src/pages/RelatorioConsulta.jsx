export default function RelatorioConsulta({ dados }) {
  // Cálculo simbólico de taxa moderadora
  const taxa = dados.cor_manchester === 'vermelho' ? "0.00" : "15.00";

  return (
    <div className="bg-white border-2 border-slate-200 p-8 rounded-none font-mono text-sm max-w-2xl mx-auto shadow-lg">
      <div className="text-center border-b-2 border-dashed pb-6 mb-6">
        <h2 className="text-xl font-black uppercase">Relatório de Atendimento</h2>
        <p>{dados.nome_hospital}</p>
        <p className="text-[10px] opacity-50">{dados.hospital_morada}</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between"><span>Data:</span> <span>{new Date(dados.data_consulta).toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Utente:</span> <span className="font-bold">{dados.nome_utente}</span></div>
        <div className="flex justify-between"><span>ID Atendimento:</span> <span>#{dados.triagem_id}</span></div>
        
        <div className="border-y border-dashed py-4 my-4">
          <p className="font-bold mb-2 uppercase text-xs">Diagnóstico:</p>
          <p className="italic mb-4">"{dados.diagnostico}"</p>
          <p className="font-bold mb-2 uppercase text-xs">Prescrição:</p>
          <p className="italic">"{dados.prescricao}"</p>
        </div>

        <div className="bg-slate-50 p-4">
          <div className="flex justify-between font-bold">
            <span>Taxa Moderadora:</span>
            <span>{taxa}€</span>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-[10px] uppercase opacity-40">
        <p>Médico Responsável: {dados.nome_medico}</p>
        <p>Documento gerado automaticamente pelo TRIA-Home</p>
      </div>
    </div>
  );
}