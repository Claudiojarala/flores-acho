import { CircleDot, Flower, Flower2, Gift, Sprout, Sun } from 'lucide-react';
import type { Category } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';

const STYLE: Record<Category, { icon: typeof Flower; bg: string; fg: string }> = {
  rosas: { icon: Flower2, bg: 'from-rose-200 to-rose-400', fg: 'text-rose-900' },
  girasoles: { icon: Sun, bg: 'from-amber-200 to-yellow-400', fg: 'text-amber-900' },
  claveles: { icon: Flower, bg: 'from-fuchsia-200 to-pink-400', fg: 'text-fuchsia-900' },
  crisantemos: { icon: Flower2, bg: 'from-violet-200 to-purple-400', fg: 'text-violet-900' },
  arreglos: { icon: Gift, bg: 'from-pink-200 to-orange-300', fg: 'text-pink-900' },
  coronas: { icon: CircleDot, bg: 'from-slate-200 to-slate-400', fg: 'text-slate-900' },
  plantas: { icon: Sprout, bg: 'from-emerald-200 to-lime-400', fg: 'text-emerald-900' },
};

/** Ilustración de categoría (degradado + ícono): evita depender de imágenes externas. */
export function CategoryArt({ category, className }: { category: Category; className?: string }) {
  const s = STYLE[category];
  const Icon = s.icon;
  return (
    <div className={cn('grid place-items-center bg-gradient-to-br', s.bg, className)} aria-hidden>
      <Icon className={cn('h-10 w-10', s.fg)} strokeWidth={1.5} />
    </div>
  );
}
