import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { colors, typography, spacing, radius } from '../theme/theme';

const statusLabels = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    if (!user) return setOrders([]);
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [user])
  );

  if (!user) {
    return <EmptyState icon="🔒" title={t('login')} subtitle="سجّل الدخول لعرض طلباتك" />;
  }

  if (orders.length === 0) {
    return <EmptyState icon="📦" title={t('empty_orders')} />;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md }}
      data={orders}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.status}>{statusLabels[item.status] || item.status}</Text>
          <Text style={styles.total}>{item.total} ج.م</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: { ...typography.body, color: colors.textPrimary },
  status: { ...typography.caption, color: colors.accent },
  total: { ...typography.h3, color: colors.textPrimary },
});
