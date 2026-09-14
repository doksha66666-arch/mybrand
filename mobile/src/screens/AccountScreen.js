import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, radius } from '../theme/theme';

const MenuItem = ({ label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Text style={styles.chevron}>‹</Text>
  </TouchableOpacity>
);

export default function AccountScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestText}>سجّل الدخول للوصول إلى حسابك</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBtnText}>{t('login')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <MenuItem label={t('orders')} onPress={() => navigation.navigate('Orders')} />
      <MenuItem label={t('wishlist')} onPress={() => navigation.navigate('Wishlist')} />
      <MenuItem label={t('about')} onPress={() => navigation.navigate('About')} />
      <MenuItem label={t('contact')} onPress={() => navigation.navigate('Contact')} />
      <MenuItem label={t('privacy_policy')} onPress={() => navigation.navigate('Privacy')} />
      <MenuItem label={t('terms')} onPress={() => navigation.navigate('Terms')} />

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  guestText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  loginBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  loginBtnText: { color: colors.white, ...typography.h3 },
  header: { alignItems: 'flex-end', marginBottom: spacing.lg },
  name: { ...typography.h2, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textSecondary },
  menuItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: { ...typography.body, color: colors.textPrimary },
  chevron: { color: colors.textSecondary, fontSize: 18 },
  logoutBtn: { marginTop: spacing.xl, alignItems: 'center' },
  logoutText: { color: colors.danger, ...typography.h3 },
});
