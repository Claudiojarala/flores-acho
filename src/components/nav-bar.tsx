'use client';

import Link from 'next/link';
import { Flower2, LogOut, Package, Receipt, ShoppingCart, Store, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HealthState } from '@/hooks/use-system-health';
import type { Session, TabId } from '@/lib/ui-types';
import { cn } from '@/lib/utils';

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof Package;
}

function tabsFor(session: Session | null): TabDef[] {
  const base: TabDef[] = [
    { id: 'catalogo', label: 'Catálogo', icon: Flower2 },
    { id: 'puestos', label: 'Puestos', icon: Store },
  ];
  if (session?.user.role === 'comerciante') return [...base, { id: 'panel', label: 'Mi puesto', icon: Store }];
  return [...base, { id: 'carrito', label: 'Carrito', icon: ShoppingCart }, { id: 'pedidos', label: 'Mis pedidos', icon: Receipt }];
}

interface NavBarProps {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  health: HealthState;
  session: Session | null;
  cartCount: number;
  onLogout: () => void;
}

function HealthIndicator({ health }: { health: HealthState }) {
  const map = {
    checking: { dot: 'bg-amber-400 animate-pulse', text: 'Verificando sistema…' },
    ok: { dot: 'bg-emerald-500', text: `Sistema operativo${health.latencyMs !== null ? ` · ${health.latencyMs} ms` : ''}` },
    down: { dot: 'bg-rose-500', text: 'Sistema sin conexión' },
  }[health.status];
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700" role="status" aria-label={map.text}>
      <span className={cn('h-2.5 w-2.5 rounded-full', map.dot)} />
      <span className="hidden sm:inline">{map.text}</span>
    </div>
  );
}

export function NavBar({ tab, onTabChange, health, session, cartCount, onLogout }: NavBarProps) {
  const tabs = tabsFor(session);
  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow" aria-hidden>
            <Flower2 className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Flores de Acho</h1>
            <p className="hidden text-xs text-slate-600 sm:block">Mercado de Flores · Rímac, Lima</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HealthIndicator health={health} />
          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[200px] truncate text-sm text-slate-800 md:inline">{session.user.name}</span>
              <Badge variant="secondary" className="hidden capitalize sm:inline-flex">{session.user.role}</Badge>
              <Button variant="outline" size="sm" onClick={onLogout} aria-label="Cerrar sesión">
                <LogOut />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">
                <User />
                Ingresar
              </Link>
            </Button>
          )}
        </div>
      </div>

      <nav aria-label="Secciones" className="mx-auto max-w-[1400px] px-4 pb-2">
        <Tabs value={tab} onValueChange={(v) => onTabChange(v as TabId)}>
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="h-10 shrink-0 rounded-full px-4 text-slate-700 hover:bg-slate-100 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
              >
                <Icon />
                {label}
                {id === 'carrito' && cartCount > 0 && (
                  <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-bold text-primary ring-1 ring-primary/30" aria-label={`${cartCount} en el carrito`}>
                    {cartCount}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </nav>
    </header>
  );
}
