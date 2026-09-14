import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import EmptyState from '../components/EmptyState';
import ProductCard from '../components/ProductCard';
import { colors, typography, spacing } from '../theme/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products', { params: { featured: true } });
      setProducts(data.products || []);
    } catch {
      setProducts([]); // لا توجد منتجات بعد - وضع طبيعي في هذه المرحلة
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('welcome_title')}</Text>
        <Text style={styles.heroSubtitle}>{t('welcome_subtitle')}</Text>
      </View>

      {products.length === 0 ? (
        <EmptyState icon="🛒" title={t('no_products_yet')} />
      ) : (
        <View style={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.primary, padding: spacing.xl, alignItems: 'center' },
  heroTitle: { ...typography.h1, color: colors.white, textAlign: 'center' },
  heroSubtitle: {
    ...typography.body,
    color: colors.accent,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  grid: {
    padding: spacing.md,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
