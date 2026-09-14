import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { colors, typography, spacing, radius } from '../theme/theme';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { items, subtotal, discount, shippingFee, total, clearCart } = useCart();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod | vodafone_cash
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [vodafoneNumber, setVodafoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/config')
      .then(({ data }) => setVodafoneNumber(data.vodafoneCashNumber || ''))
      .catch(() => setVodafoneNumber(''));
  }, []);

  const copyNumber = () => {
    Clipboard.setString(vodafoneNumber);
    Alert.alert('تم النسخ', 'تم نسخ الرقم');
  };

  // ملاحظة: هذا يرسل الطلب مباشرة عبر الـ Backend وفق ما هو موجود بالسلة المحلية.
  const submitOrder = async () => {
    if (!name || !phone || !city || !street) {
      Alert.alert('تنبيه', 'يرجى تعبئة كل بيانات التوصيل');
      return;
    }
    if (paymentMethod === 'vodafone_cash' && !senderPhone) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف الذي حوّلت منه');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        customer: { name, phone, email: user?.email },
        shippingAddress: { city, street },
        paymentMethod,
        discount,
        shippingFee,
        vodafoneCashInfo: paymentMethod === 'vodafone_cash' ? { senderPhone, transactionRef } : undefined,
      });
      clearCart();
      Alert.alert(
        'تم',
        paymentMethod === 'vodafone_cash'
          ? `تم إنشاء طلبك رقم ${data.order.orderNumber} — سيتم تأكيد الدفع بعد مراجعة التحويل`
          : `تم إنشاء طلبك رقم ${data.order.orderNumber}`
      );
      navigation.navigate('Orders');
    } catch (err) {
      Alert.alert('خطأ', err?.response?.data?.message || 'تعذر إتمام الطلب، حاول لاحقًا');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={styles.sectionTitle}>{t('delivery_address')}</Text>
      <TextInput style={styles.input} placeholder={t('full_name')} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder={t('phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="المدينة" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="الشارع / تفاصيل العنوان" value={street} onChangeText={setStreet} />

      <Text style={styles.sectionTitle}>{t('payment_method')}</Text>

      <TouchableOpacity
        style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionActive]}
        onPress={() => setPaymentMethod('cod')}
      >
        <Text style={styles.paymentText}>💵 {t('cash_on_delivery')}</Text>
        <View style={[styles.radio, paymentMethod === 'cod' && styles.radioActive]} />
      </TouchableOpacity>

      {!!vodafoneNumber && (
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'vodafone_cash' && styles.paymentOptionActive]}
          onPress={() => setPaymentMethod('vodafone_cash')}
        >
          <Text style={styles.paymentText}>📱 فودافون كاش</Text>
          <View style={[styles.radio, paymentMethod === 'vodafone_cash' && styles.radioActive]} />
        </TouchableOpacity>
      )}

      {paymentMethod === 'vodafone_cash' && (
        <View style={styles.vodafoneBox}>
          <Text style={styles.vodafoneLabel}>حوّل المبلغ إلى الرقم التالي:</Text>
          <TouchableOpacity onPress={copyNumber} style={styles.numberRow}>
            <Text style={styles.copyHint}>نسخ</Text>
            <Text style={styles.numberText}>{vodafoneNumber}</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="رقم الهاتف الذي حوّلت منه"
            value={senderPhone}
            onChangeText={setSenderPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="رقم العملية (اختياري)"
            value={transactionRef}
            onChangeText={setTransactionRef}
          />
          <Text style={styles.vodafoneNote}>
            سيتم تأكيد طلبك بعد مراجعة التحويل من فريقنا خلال وقت قصير.
          </Text>
        </View>
      )}

      <View style={styles.summaryBox}>
        <SummaryRow label={t('subtotal')} value={subtotal} />
        <SummaryRow label={t('discount')} value={-discount} />
        <SummaryRow label={t('shipping')} value={shippingFee} />
        <SummaryRow label={t('total')} value={total} bold />
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
        onPress={submitOrder}
        disabled={submitting || items.length === 0}
      >
        <Text style={styles.confirmBtnText}>{t('confirm_order')}</Text>
      </TouchableOpacity>
    </ScrollView>
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
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm, textAlign: 'right' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  paymentOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentOptionActive: { borderColor: colors.primary },
  paymentText: { ...typography.body, textAlign: 'right' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  vodafoneBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  vodafoneLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'right', marginBottom: spacing.xs },
  numberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  numberText: { ...typography.h3, color: colors.primary, letterSpacing: 1 },
  copyHint: { ...typography.caption, color: colors.accent },
  vodafoneNote: { ...typography.caption, color: colors.textSecondary, textAlign: 'right', marginTop: spacing.xs },
  summaryBox: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: spacing.xs },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.body, color: colors.textPrimary },
  bold: { fontWeight: '700', ...typography.h3 },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  confirmBtnText: { color: colors.white, ...typography.h3 },
});
