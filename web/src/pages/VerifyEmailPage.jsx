import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      const data = await verifyEmail(email, code);
      if (data?.user?.role === 'merchant') {
        setInfo('تم تأكيد بريدك بنجاح. طلب انضمامك كتاجر الآن قيد المراجعة من الإدارة، سيتم إعلامك فور الموافقة.');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تأكيد الكود');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      const data = await resendVerificationCode(email);
      setInfo(data?.message || 'تم إرسال كود جديد');
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إرسال كود جديد');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.page} dir="rtl">
      <div style={styles.card}>
        <div style={styles.hero}>
          <p style={styles.heroLogo}>
            MY<span style={{ color: colors.accent }}>BRAND</span>
          </p>
          <p style={styles.heroSubtitle}>تأكيد البريد الإلكتروني</p>
        </div>

        {info ? (
          <div style={styles.form}>
            <p style={styles.successText}>{info}</p>
            <Link to="/login" style={{ ...styles.button, display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
              الذهاب لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} style={styles.form}>
            <p style={styles.helper}>أدخل الكود المكوّن من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني.</p>
            {error && <p style={styles.error}>{error}</p>}

            <label style={styles.label}>البريد الإلكتروني</label>
            <input
              style={styles.input}
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label style={styles.label}>كود التحقق</label>
            <input
              style={{ ...styles.input, letterSpacing: 6, textAlign: 'center', fontSize: 20, fontWeight: 700 }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="------"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />

            <button type="submit" style={styles.button} disabled={submitting}>
              {submitting ? 'جارٍ التأكيد...' : 'تأكيد الكود'}
            </button>

            <p style={styles.linkRow}>
              لم يصلك الكود؟{' '}
              <button type="button" onClick={resend} disabled={resending} style={styles.linkButton}>
                {resending ? 'جارٍ الإرسال...' : 'إعادة الإرسال'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100dvh - 140px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 14px',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 10px 34px rgba(15,23,42,.08)',
  },
  hero: {
    background: colors.primary,
    padding: '36px 20px 30px',
    textAlign: 'center',
  },
  heroLogo: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 1,
    margin: '0 0 4px',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,.75)',
    fontSize: 13,
    margin: 0,
  },
  form: { padding: '22px 20px 26px' },
  helper: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 1.7,
    margin: '0 0 16px',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    marginBottom: 16,
    fontSize: 14,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  button: {
    width: '100%',
    padding: 13,
    borderRadius: 10,
    border: 'none',
    background: colors.primary,
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  linkRow: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    margin: '14px 0 0',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: colors.primary,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
  },
  successText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 1.8,
    marginBottom: 16,
  },
  error: {
    background: '#FEF2F2',
    color: colors.danger,
    fontSize: 13,
    padding: '10px 12px',
    borderRadius: 8,
    marginBottom: 14,
    textAlign: 'center',
  },
};
