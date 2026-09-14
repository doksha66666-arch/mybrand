import React from 'react';
import { Link } from 'react-router-dom';
import { colors } from '../theme/colors';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <span style={styles.brand}>MYBRAND</span>
        <div style={styles.links}>
          <Link to="/about" style={styles.link}>من نحن</Link>
          <Link to="/contact" style={styles.link}>تواصل معنا</Link>
          <Link to="/register?type=merchant" style={styles.link}>سجّل كتاجر معنا</Link>
          <Link to="/privacy" style={styles.link}>سياسة الخصوصية</Link>
          <Link to="/terms" style={styles.link}>الشروط والأحكام</Link>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: { background: colors.primary, marginTop: 60, padding: '24px 20px' },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  brand: { color: colors.accent, fontWeight: 700 },
  links: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  link: { color: '#94A3B8', fontSize: 13, textDecoration: 'none' },
};
