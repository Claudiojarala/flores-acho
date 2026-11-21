'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Flower2, LoaderCircle, LogIn, ShoppingBag, Store, Truck, TriangleAlert, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/hooks/use-session';
import { api, errorMessage } from '@/lib/client-api';
import type { Role, Session } from '@/lib/ui-types';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';

const BENEFITS = [
  { icon: ShoppingBag, text: 'Compra flores, arreglos y coronas sin ir al mercado' },
  { icon: Truck, text: 'Elige recojo en Acho o delivery a tu distrito' },
  { icon: Store, text: 'Comerciantes: publica tu catálogo y recibe pedidos en línea' },
];

/** Pantalla propia de inicio de sesión / registro (ruta /login). */
export default function AuthScreen() {
  const router = useRouter();
  const { session, setSession } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('cliente');
  const [name, setName] = useState('');
  const [stallName, setStallName] = useState('');
  const [stallCode, setStallCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión (o se acaba de iniciar), se vuelve al mapa.
  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  const changeMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ token: string; user: Session['user'] }>('/api/auth', {
        method: 'POST',
        body:
          mode === 'login'
            ? { mode, email, password }
            : { mode, email, password, role, name, ...(role === 'comerciante' ? { stallName, stallCode } : {}) },
      });
      setPassword('');
      setSession({ token: data.token, user: data.user });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      {/* Panel de marca */}
      <aside className="relative flex flex-col justify-between bg-gradient-to-br from-rose-700 to-rose-900 p-6 text-white sm:p-10 lg:p-14">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25" aria-hidden>
            <Flower2 className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight">Flores de Acho</p>
            <p className="text-xs text-rose-100">Mercado de Flores · Rímac, Lima</p>
          </div>
        </div>

        <div className="my-10 hidden max-w-md space-y-6 lg:block">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">Las flores del mercado de Acho, ahora a un clic.</h2>
          <ul className="space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-rose-50">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden text-xs text-rose-100/80 lg:block">Proyecto académico · Práctica Calificada 2 – PFC III</p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-col justify-center bg-slate-50 px-4 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al mapa
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isLogin ? 'Ingresa con tu correo para comprar o gestionar tu puesto.' : 'Crea tu cuenta de cliente o de comerciante del mercado.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate={false}>
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de cuenta">
                  {([['cliente', 'Soy cliente', ShoppingBag], ['comerciante', 'Soy comerciante', Store]] as const).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={role === id}
                      onClick={() => setRole(id)}
                      className={cn('flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', role === id ? 'border-primary bg-rose-50 text-primary' : 'border-input bg-white text-slate-700 hover:bg-slate-50')}
                    >
                      <Icon className="h-4 w-4" aria-hidden /> {label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nombre completo</Label>
                  <Input id="reg-name" required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                {role === 'comerciante' && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="reg-stall">Nombre de tu puesto</Label>
                      <Input id="reg-stall" required minLength={3} maxLength={60} value={stallName} onChange={(e) => setStallName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-code">N.º de puesto</Label>
                      <Input id="reg-code" required placeholder="A-12" pattern="[A-Za-z]-?[0-9]{1,3}" maxLength={6} value={stallCode} onChange={(e) => setStallCode(e.target.value)} />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input id="login-email" type="email" autoComplete="email" required placeholder="tucorreo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  className="pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isLogin && <p className="text-xs text-slate-500">Mínimo 8 caracteres, con mayúscula, minúscula y número.</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? <LoaderCircle className="animate-spin" /> : isLogin ? <LogIn /> : <UserPlus />}
              {isLogin ? 'Entrar' : 'Crear mi cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button type="button" onClick={() => changeMode(isLogin ? 'register' : 'login')} className="font-semibold text-primary underline-offset-4 hover:underline">
              {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
