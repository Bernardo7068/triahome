export default function BadgePrioridade({ cor }) {
  const estilos = {
    vermelho: "bg-red-600 text-white shadow-red-200",
    laranja: "bg-orange-500 text-white shadow-orange-200",
    amarelo: "bg-yellow-400 text-slate-800 shadow-yellow-100",
    verde: "bg-green-500 text-white shadow-green-100",
    azul: "bg-blue-500 text-white shadow-blue-100",
    branco: "bg-slate-100 text-slate-400 shadow-none border border-slate-200"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg ${estilos[cor] || estilos.branco}`}>
      {cor}
    </span>
  );
}