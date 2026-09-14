import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../theme/theme';

export default function ProductCard({ product }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductDetails', { slug: product.slug })}
    >
      {product.images?.[0] ? (
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <Text style={styles.name} numberOfLines={1}>
        {product.nameAr}
      </Text>
      <Text style={styles.price}>{product.price} ج.م</Text>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = '48%';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  image: { width: '100%', height: 120, borderRadius: radius.sm, marginBottom: spacing.xs },
  imagePlaceholder: { backgroundColor: colors.border },
  name: { ...typography.caption, color: colors.textPrimary, textAlign: 'right' },
  price: { ...typography.body, color: colors.accent, textAlign: 'right', fontWeight: '700', marginTop: 2 },
});
