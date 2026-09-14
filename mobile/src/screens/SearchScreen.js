import React, { useState } from 'react';
import { View, TextInput, StyleSheet, FlatList, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import EmptyState from '../components/EmptyState';
import { colors, spacing, radius } from '../theme/theme';

export default function SearchScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const runSearch = async (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearched(true);
    try {
      const { data } = await api.get('/products', { params: { search: text } });
      setResults(data.products || []);
    } catch {
      setResults([]);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={t('search_placeholder')}
        value={query}
        onChangeText={runSearch}
      />
      {searched && results.length === 0 ? (
        <EmptyState icon="🔍" title={t('no_products_yet')} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <Text style={styles.item}>{item.nameAr}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  item: { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
