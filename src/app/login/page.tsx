import type { Metadata } from 'next';
import AuthScreen from '@/components/auth-screen';

export const metadata: Metadata = {
  title: 'Ingresar – Flores de Acho',
  description: 'Inicia sesión o crea tu cuenta de cliente o comerciante del Mercado de Flores de Acho.',
};

export default function LoginPage() {
  return <AuthScreen />;
}
