import { CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  type: 'ok' | 'error';
  text: string;
}

/** Aviso flotante de resultado de una acción (éxito o error). */
export function Toast({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;
  const Icon = toast.type === 'ok' ? CircleCheck : CircleAlert;
  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-4 left-1/2 z-[1200] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg',
        toast.type === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-rose-300 bg-rose-50 text-rose-950',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {toast.text}
    </div>
  );
}
