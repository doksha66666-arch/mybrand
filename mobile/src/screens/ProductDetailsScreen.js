import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { colors, typography, spacing, radius } from '../theme/theme';

export default function ProductDetailsScreen({ route }) {
  const { slug } = route.params || {};
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then(({ data }) => setProduct(data.product))
      .catch(() => setProduct(null));
  }, [slug]);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>...</Text>
      </View>
    );
  }

  const wishlisted = isWishlisted(product._id);

  return (
    <ScrollView style={styles.container}>
      {product.images?.[0] ? (
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{product.nameAr}</Text>
          <TouchableOpacity onPress={() => toggleWishlist(product._id)}>
            <Text style={styles.heart}>{wishlisted ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.price}>{product.price} ج.م</Text>
        <Text style={styles.description}>{product.descriptionAr}</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            addToCart(
              { id: product._id, name: product.nameAr, image: product.images?.[0], price: product.price },
              null,
              1
            )
          }
        >
          <Text style={styles.addButtonText}>{t('add_to_cart')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: 320 },
  imagePlaceholder: { backgroundColor: colors.surface },
  body: { padding: spacing.md },
  headerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary, flex: 1 },
  heart: { fontSize: 24 },
  price: { ...typography.h3, color: colors.accent, marginTop: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'right' },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  addButtonText: { ...typography.h3, color: colors.white },
});
