'use client';

import { useCallback, useRef, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { useStoreData } from '@/hooks/use-store-data';
import { useSystemHealth } from '@/hooks/use-system-health';
import { api, errorMessage } from '@/lib/client-api';
import { money } from '@/lib/format';
import type { Product } from '@/lib/repo/types';
import { EMPTY_FILTERS, type CheckoutForm, type OrderView, type ProductFilters, type ProductView, type TabId } from '@/lib/ui-types';
import { CartView } from './cart-view';
import { CatalogView } from './catalog-view';
import { Footer } from './footer';
import { MerchantPanel, type NewProductForm } from './merchant-panel';
import { NavBar } from './nav-bar';
import { OrdersView } from './orders-view';
import { ProductDialog } from './product-dialog';
import { StallsView } from './stalls-view';
import { Toast, type ToastMessage } from './toast';

interface Confirmation {
  orders: OrderView[];
  total: number;
  method: string;
  reference: string | null;
}

/** Contenedor principal: estado de la aplicación y acciones que escriben en la API. */
export default function FloresApp() {
  const [tab, setTab] = useState<TabId>('catalogo');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const notify = useCallback((type: 'ok' | 'error', text: string) => {
    setToast({ type, text });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  const { session, logout } = useSession();
  const health = useSystemHealth();
  const cart = useCart();
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [detail, setDetail] = useState<ProductView | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const handleUnauthorized = useCallback(() => {
    logout();
    notify('error', 'Tu sesión expiró. Vuelve a iniciar sesión.');
  }, [logout, notify]);
  const data = useStoreData(session, filters, notify, handleUnauthorized);

  const token = session?.token ?? null;
  const isMerchant = session?.user.role === 'comerciante';
  // Si cierra sesión estando en una pestaña privada, vuelve al catálogo.
  const activeTab: TabId = isMerchant ? (tab === 'carrito' || tab === 'pedidos' ? 'panel' : tab) : tab === 'panel' || (!session && tab === 'pedidos') ? 'catalogo' : tab;

  const addToCart = (productId: string, quantity: number) => {
    const p = data.allProducts.find((x) => x.id === productId) ?? data.products.find((x) => x.id === productId);
    if (isMerchant) return notify('error', 'Las cuentas de comerciante no pueden comprar. Ingresa como cliente.');
    if (!p) return;
    const inCart = cart.lines.find((l) => l.productId === productId)?.quantity ?? 0;
    if (inCart + quantity > p.stock) return notify('error', `Solo hay ${p.stock} de «${p.name}» disponibles`);
    cart.add(productId, quantity);
    notify('ok', `${p.name} agregado al carrito`);
  };

  const checkout = async (form: CheckoutForm) => {
    if (!token) return;
    setCheckoutBusy(true);
    try {
      const res = await api<{ orders: OrderView[]; payment: { method: string; status: string; reference: string | null; total: number } }>('/api/orders', {
        method: 'POST',
        token,
        body: {
          items: cart.lines,
          fulfillment: form.fulfillment,
          ...(form.fulfillment === 'delivery' ? { district: form.district, address: form.address } : {}),
          contactName: form.contactName,
          phone: form.phone,
          payment: form.payment,
        },
      });
      cart.clear();
      setConfirmation({ orders: res.orders, total: res.payment.total, method: res.payment.method, reference: res.payment.reference });
      await Promise.all([data.refreshUserData(), data.refreshProducts(), data.refreshStalls()]);
    } catch (e) {
      notify('error', errorMessage(e));
      await data.refreshProducts();
    } finally {
      setCheckoutBusy(false);
    }
  };

  const orderAction = async (id: string, action: 'cancel' | 'advance', okText: string) => {
    if (!token) return;
    setBusyId(id);
    try {
      await api(`/api/orders/${id}`, { method: 'PATCH', token, body: { action } });
      notify('ok', okText);
      await Promise.all([data.refreshUserData(), data.refreshProducts()]);
    } catch (e) {
      notify('error', errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const saveProduct = async (id: string, patch: Partial<Pick<Product, 'priceRetail' | 'priceWholesale' | 'stock' | 'active'>>) => {
    if (!token) return;
    setBusyId(id);
    try {
      await api(`/api/merchant/products/${id}`, { method: 'PATCH', token, body: patch });
      notify('ok', 'Producto actualizado');
      await Promise.all([data.refreshUserData(), data.refreshProducts()]);
    } catch (e) {
      notify('error', errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const addProduct = async (form: NewProductForm): Promise<boolean> => {
    if (!token) return false;
    try {
      await api('/api/merchant/products', { method: 'POST', token, body: form });
      notify('ok', 'Producto publicado en el catálogo');
      await Promise.all([data.refreshUserData(), data.refreshProducts(), data.refreshStalls()]);
      return true;
    } catch (e) {
      notify('error', errorMessage(e));
      return false;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar tab={activeTab} onTabChange={setTab} health={health} session={session} cartCount={cart.count} onLogout={logout} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6">
        {activeTab === 'catalogo' && (
          <CatalogView
            products={data.products}
            loading={data.productsLoading}
            filters={filters}
            onFilters={setFilters}
            stalls={data.stalls}
            onAdd={addToCart}
            onDetail={setDetail}
          />
        )}

        {activeTab === 'puestos' && (
          <StallsView
            stalls={data.stalls}
            onViewProducts={(stallId) => {
              setFilters({ ...EMPTY_FILTERS, stallId });
              setTab('catalogo');
            }}
          />
        )}

        {activeTab === 'carrito' &&
          (confirmation ? (
            <section className="mx-auto max-w-lg space-y-4 rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm" aria-label="Pedido confirmado">
              <CircleCheck className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
              <h2 className="text-xl font-bold text-slate-900">¡Pedido confirmado!</h2>
              <p className="text-sm text-slate-700">
                Se generaron {confirmation.orders.length} pedido{confirmation.orders.length === 1 ? '' : 's'} (uno por puesto) por <strong>{money(confirmation.total)}</strong>.
                {confirmation.reference && <> Operación <strong>{confirmation.reference}</strong> (simulada).</>}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => { setConfirmation(null); setTab('pedidos'); }}>Ver mis pedidos</Button>
                <Button variant="outline" onClick={() => { setConfirmation(null); setTab('catalogo'); }}>Seguir comprando</Button>
              </div>
            </section>
          ) : (
            <CartView
              lines={cart.lines}
              products={data.allProducts}
              zones={data.zones}
              session={session}
              busy={checkoutBusy}
              onQty={cart.setQuantity}
              onRemove={cart.remove}
              onCheckout={(f) => void checkout(f)}
              onBrowse={() => setTab('catalogo')}
            />
          ))}

        {activeTab === 'pedidos' && (
          <section aria-label="Mis pedidos" className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Mis pedidos</h2>
            <OrdersView
              orders={data.orders}
              loading={data.ordersLoading}
              mode="cliente"
              busyId={busyId}
              onCancel={(id) => void orderAction(id, 'cancel', 'Pedido cancelado. Repusimos el stock y se reembolsó el pago.')}
              onBrowse={() => setTab('catalogo')}
            />
          </section>
        )}

        {activeTab === 'panel' && isMerchant && (
          <MerchantPanel
            data={data.merchant}
            orders={data.orders}
            loading={data.ordersLoading}
            busyId={busyId}
            onSaveProduct={(id, patch) => void saveProduct(id, patch)}
            onAddProduct={addProduct}
            onAdvance={(id) => void orderAction(id, 'advance', 'Estado del pedido actualizado')}
          />
        )}
      </main>

      <Footer />
      <ProductDialog product={detail} onClose={() => setDetail(null)} onAdd={addToCart} />
      <Toast toast={toast} />
    </div>
  );
}
