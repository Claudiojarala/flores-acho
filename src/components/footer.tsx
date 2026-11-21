export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-5 text-sm sm:flex-row">
        <p className="text-slate-600">© {new Date().getFullYear()} Flores de Acho · Mercado de Flores del Rímac, Lima</p>
        <p className="text-slate-500">Proyecto académico · Práctica Calificada 2 – PFC III · Pagos en modo simulado</p>
      </div>
    </footer>
  );
}
