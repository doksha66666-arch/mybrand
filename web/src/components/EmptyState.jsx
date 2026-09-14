import React from 'react';
import { colors } from '../theme/colors';

export default function EmptyState({ icon = '🛍️', title, subtitle }) {
  return (
    <div style={styles.container}>
      <div style={styles.icon}>{icon}</div>
      <p style={styles.title}>{title}</p>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}

const styles = {
  container: { textAlign: 'center', padding: '60px 20px' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontWeight: 700, color: colors.primary, fontSize: 16, margin: 0 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 6 },
};
