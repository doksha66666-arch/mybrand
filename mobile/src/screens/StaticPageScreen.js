import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme/theme';

export default function StaticPageScreen({ route }) {
  const { title = '', content = '' } = route.params || {};
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.md },
  content: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 24 },
});
