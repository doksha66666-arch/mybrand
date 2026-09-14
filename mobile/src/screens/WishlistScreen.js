import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import EmptyState from '../components/EmptyState';
import { colors, typography, spacing } from '../theme/theme';

export default function WishlistScreen() {
  const { t } = useTranslation();
  const { productIds } = useWishlist();

  if (productIds.length === 0) {
    return <EmptyState icon="❤️" title={t('empty_wishlist')} />;
  }

  // ملاحظة: عند وجود منتجات فعلية، يمكن هنا جلب تفاصيلها من الـ API عبر productIds
  return (
    <FlatList
      style={styles.container}
      data={productIds}
      keyExtractor={(id) => id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={typography.body}>{item}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  row: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
