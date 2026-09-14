import React from 'react';

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'حدث خطأ غير متوقع' };
  }

  componentDidCatch(error, info) {
    console.error('MYBRAND Admin UI error:', error, info);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: '#f6f8fb', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ width: 'min(520px, 100%)', background: '#fff', border: '1px solid #eaecf0', borderRadius: 20, padding: 24, boxShadow: '0 12px 35px rgba(15,23,42,.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>⚠️</div>
          <h1 style={{ margin: '0 0 10px', color: '#101828', fontSize: 22 }}>حدث خطأ في لوحة التحكم</h1>
          <p style={{ margin: '0 0 8px', color: '#667085', lineHeight: 1.7 }}>لم تتوقف لوحة التحكم بالكامل. حدث خطأ في هذه الشاشة فقط، ويمكنك إعادة تحميلها.</p>
          {this.state.message && <code style={{ display: 'block', direction: 'ltr', textAlign: 'left', overflowWrap: 'anywhere', margin: '12px 0 18px', padding: 10, borderRadius: 10, background: '#f8fafc', color: '#b42318', fontSize: 12 }}>{this.state.message}</code>}
          <button type="button" onClick={this.handleReload} style={{ border: 0, borderRadius: 11, padding: '12px 18px', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>إعادة تحميل الصفحة</button>
        </div>
      </div>
    );
  }
}
