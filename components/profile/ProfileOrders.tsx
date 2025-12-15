'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { User } from '@/lib/auth';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    products: {
      name: string;
      brands: {
        name: string;
      };
    };
  }[];
}

interface ProfileOrdersProps {
  user: User;
}

export function ProfileOrders({ user }: ProfileOrdersProps) {
  const t = useTranslations('profile.myOrders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [user.id]);

  const loadOrders = async () => {
    try {
      setOrders([]);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading orders...</p>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-lg text-muted-foreground mb-2">{t('empty')}</p>
          <p className="text-sm text-muted-foreground">
            Start shopping and your orders will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() =>
              setExpandedOrder(expandedOrder === order.id ? null : order.id)
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono text-sm">{order.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('orderDate')}</p>
                    <p className="text-sm font-medium">
                      {format(new Date(order.created_at), 'dd MMMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('total')}</p>
                    <p className="text-sm font-semibold">€{parseFloat(order.total_amount?.toString() || '0').toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('status')}</p>
                    <p className="text-sm font-medium capitalize">{order.status?.toLowerCase()}</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                {expandedOrder === order.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          {expandedOrder === order.id && (
            <CardContent className="border-t pt-6">
              <div className="space-y-4">
                <p className="font-semibold text-sm text-foreground mb-4">{t('items')}</p>
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {item.products?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.products?.brands?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t('quantity')}</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t('price')}</p>
                        <p className="font-medium">€{parseFloat(item.unit_price?.toString() || '0').toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
