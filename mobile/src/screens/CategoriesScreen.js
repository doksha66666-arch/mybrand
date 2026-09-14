import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/theme';

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get('/categories')
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <View style={styles.container}>
      {categories.length === 0 ? (
        <EmptyState icon="🗂️" title={t('no_categories_yet')} />
      ) : (
        <View>{/* عرض قائمة الأقسام هنا عند إضافتها */}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
