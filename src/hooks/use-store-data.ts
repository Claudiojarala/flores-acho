'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/client-api';
import type { DeliveryZone, MerchantData, OrderView, ProductFilters, ProductView, Session, StallView } from '@/lib/ui-types';

type Notify = (type: 'ok' | 'error', text: string) => void;

function queryOf(f: ProductFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.category) p.set('category', f.category);
  if (f.occasion) p.set('occasion', f.occasion);
  if (f.stallId) p.set('stallId', f.stallId);
  if (f.maxPrice && Number(f.maxPrice) > 0) p.set('maxPrice', f.maxPrice);
  if (f.inStock) p.set('inStock', 'true');
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Carga catálogo, puestos, zonas y los datos del usuario (pedidos o panel del comerciante). */
export function useStoreData(session: Session | null, filters: ProductFilters, notify: Notify, onUnauthorized: () => void) {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<ProductView[]>([]);
  const [stalls, setStalls] = useState<StallView[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const token = session?.token ?? null;
  const role = session?.user.role ?? null;

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
      else notify('error', err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
    },
    [notify, onUnauthorized],
  );

  const qs = queryOf(filters);
  const refreshProducts = useCallback(async () => {
    try {
      const [filtered, all] = await Promise.all([
        api<{ products: ProductView[] }>(`/api/products${qs}`),
        api<{ products: ProductView[] }>('/api/products'),
      ]);
      setProducts(filtered.products);
      setAllProducts(all.products);
    } catch (e) {
      fail(e);
    } finally {
      setProductsLoading(false);
    }
  }, [qs, fail]);

  // Catálogo con filtros (la búsqueda por texto espera 250 ms para no saturar la API).
  useEffect(() => {
    setProductsLoading(true);
    const id = window.setTimeout(() => void refreshProducts(), 250);
    return () => window.clearTimeout(id);
  }, [refreshProducts]);

  const refreshStalls = useCallback(async () => {
    try {
      setStalls((await api<{ stalls: StallView[] }>('/api/stalls')).stalls);
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  useEffect(() => {
    void refreshStalls();
    api<{ zones: DeliveryZone[] }>('/api/delivery-zones')
      .then((d) => setZones(d.zones))
      .catch(fail);
  }, [refreshStalls, fail]);

  const refreshUserData = useCallback(async () => {
    if (!token || !role) {
      setOrders([]);
      setMerchant(null);
      return;
    }
    setOrdersLoading(true);
    try {
      if (role === 'cliente') {
        setOrders((await api<{ orders: OrderView[] }>('/api/orders', { token })).orders);
        setMerchant(null);
      } else {
        const [m, o] = await Promise.all([
          api<MerchantData>('/api/merchant/stall', { token }),
          api<{ orders: OrderView[] }>('/api/orders?scope=stall', { token }),
        ]);
        setMerchant(m);
        setOrders(o.orders);
      }
    } catch (e) {
      fail(e);
    } finally {
      setOrdersLoading(false);
    }
  }, [token, role, fail]);

  useEffect(() => {
    void refreshUserData();
  }, [refreshUserData]);

  return { products, allProducts, productsLoading, stalls, zones, orders, merchant, ordersLoading, refreshProducts, refreshStalls, refreshUserData };
}
