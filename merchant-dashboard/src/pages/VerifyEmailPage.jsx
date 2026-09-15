import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMerchantAuth } from '../context/MerchantAuthContext';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationCode } = useMerchantAuth();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setEmail(searchParams.get('email') || '');
  }, [searchParams]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await verifyEmail(email.trim().toLowerCase(), code);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر تأكيد البريد الإلكتروني');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError('');
    setMessage('');
    setResending(true);
    try {
      const data = await resendVerificationCode(email.trim().toLowerCase());
      setMessage(data?.message || 'تم إرسال كود تحقق جديد.');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إرسال كود جديد');
    } finally {
      setResending(false);
    }
  };

  return (
    <div dir="rtl" style={styles.wrapper}>
      <form onSubmit={submit} style={styles.form}>
        <div style={styles.icon}>✓</div>
        <h1 style={styles.title}>تأكيد البريد الإلكتروني</h1>
        <p style={styles.subtitle}>أدخل الكود المكوّن من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني.</p>

        {error && <p role="alert" style={styles.error}>{error}</p>}
        {message && <p role="status" style={styles.success}>{message}</p>}

        <label style={styles.label}>البريد الإلكتروني</label>
        <input
          autoComplete="email"
          inputMode="email"
          type="email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label style={styles.label}>كود التحقق</label>
        <input
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          pattern="[0-9]{6}"
          style={{ ...styles.input, ...styles.code }}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          required
        />

        <button type="submit" disabled={submitting || code.length !== 6} style={{ ...styles.button, opacity: submitting || code.length !== 6 ? 0.65 : 1 }}>
          {submitting ? 'جارٍ التأكيد...' : 'تأكيد البريد والدخول'}
        </button>

        <button type="button" disabled={resending || !email.trim()} onClick={resend} style={styles.secondary}>
          {resending ? 'جارٍ إرسال كود جديد...' : 'إعادة إرسال الكود'}
        </button>

        <p style={styles.linkRow}><Link to="/login" style={styles.link}>العودة لتسجيل الدخول</Link></p>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', boxSizing: 'border-box', background: '#F8FAFC' },
  form: { width: '100%', maxWidth: 420, boxSizing: 'border-box', background: '#fff', padding: 32, borderRadius: 18, boxShadow: '0 8px 28px rgba(15,23,42,.08)' },
  icon: { width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px', background: '#DCFCE7', color: '#16A34A', fontWeight: 900, fontSize: 22 },
  title: { margin: 0, textAlign: 'center', color: '#0F172A', fontSize: 22 },
  subtitle: { color: '#64748B', fontSize: 13, lineHeight: 1.7, textAlign: 'center', margin: '8px 0 20px' },
  label: { display: 'block', color: '#334155', fontSize: 12, fontWeight: 700, marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', padding: 12, marginBottom: 14, borderRadius: 9, border: '1px solid #CBD5E1', outline: 'none' },
  code: { direction: 'ltr', textAlign: 'center', letterSpacing: 5, fontSize: 20, fontWeight: 800 },
  button: { width: '100%', padding: 12, border: 0, borderRadius: 9, background: '#0F172A', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  secondary: { width: '100%', padding: 11, marginTop: 9, border: '1px solid #CBD5E1', borderRadius: 9, background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer' },
  error: { color: '#B91C1C', background: '#FEF2F2', padding: 10, borderRadius: 8, fontSize: 13 },
  success: { color: '#166534', background: '#F0FDF4', padding: 10, borderRadius: 8, fontSize: 13 },
  linkRow: { textAlign: 'center', margin: '16px 0 0', fontSize: 13 },
  link: { color: '#B8860B', fontWeight: 700, textDecoration: 'none' },
};
