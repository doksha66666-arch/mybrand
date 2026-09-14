import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/EmptyState';
import { colors, typography, spacing, radius } from '../theme/theme';

export default function CartScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    items,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
    discount,
    shippingFee,
    total,
  } = useCart();

  if (items.length === 0) {
    return <EmptyState icon="🛒" title={t('empty_cart')} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price} ج.م</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => decreaseQuantity(item.id)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => increaseQuantity(item.id)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.summary}>
        <SummaryRow label={t('subtotal')} value={subtotal} />
        <SummaryRow label={t('discount')} value={-discount} />
        <SummaryRow label={t('shipping')} value={shippingFee} />
        <SummaryRow label={t('total')} value={total} bold />

        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutBtnText}>{t('checkout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.bold]}>{value} ج.م</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.border },
  info: { flex: 1, marginHorizontal: spacing.sm },
  name: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  price: { ...typography.caption, color: colors.accent, textAlign: 'right', marginTop: 2 },
  qtyRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: spacing.xs },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: colors.white, fontSize: 16 },
  qty: { marginHorizontal: spacing.sm, ...typography.body },
  remove: { color: colors.danger, fontSize: 18, paddingHorizontal: spacing.sm },
  summary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: spacing.xs },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.body, color: colors.textPrimary },
  bold: { fontWeight: '700', ...typography.h3 },
  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkoutBtnText: { color: colors.white, ...typography.h3 },
});
