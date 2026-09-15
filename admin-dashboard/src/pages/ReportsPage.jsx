import React from 'react';

export default function ReportsPage() {
  return (
    <section className="reports-admin" dir="rtl">
      <style>{css}</style>
      <div className="crumb">النظام <b>التقارير</b></div>
      <header className="header">
        <div>
          <div className="eyebrow">MYBRAND INSIGHTS</div>
          <h1>التقارير</h1>
          <p>مركز التقارير والتحليلات الفعلية للمنصة.</p>
        </div>
        <span className="status">● جاهز للربط بالبيانات الحقيقية</span>
      </header>
      <div className="notice">
        هذه الشاشة لا تعرض أرقامًا تجريبية. عند توفر مصدر التقارير في الـBackend سيتم عرض المبيعات والطلبات والعملاء من البيانات الفعلية مباشرة.
      </div>
      <div className="cards">
        <div><b>المبيعات</b><strong>—</strong><span>بانتظار مصدر التقارير</span></div>
        <div><b>الطلبات</b><strong>—</strong><span>بانتظار مصدر التقارير</span></div>
        <div><b>العملاء</b><strong>—</strong><span>بانتظار مصدر التقارير</span></div>
      </div>
      <div className="empty">
        <div className="icon">📊</div>
        <h2>التقارير الحية قيد الربط</h2>
        <p>لن يتم احتساب أو اختلاق أي مؤشرات من الواجهة. الأرقام ستأتي من API تقارير موحد وقابل للتحقق.</p>
      </div>
    </section>
  );
}

const css = `
.reports-admin{padding:28px;min-height:100%;background:#F6F7FB;color:#111827;font-family:Tajawal}
.crumb{font-size:12px;color:#98A2B3}.crumb b{color:#111827;margin-right:7px}
.header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin:10px 0 20px}
.eyebrow{font-size:11px;font-weight:900;letter-spacing:2px;color:#E60023}.header h1{margin:6px 0 5px;font:900 30px Cairo}.header p{margin:0;color:#667085}
.status{padding:9px 12px;border-radius:999px;background:#ECFDF3;color:#027A48;font-size:12px;font-weight:800;border:1px solid #D1FADF}
.notice{padding:14px 16px;border-radius:14px;background:#FFF8E7;color:#8A4B08;border:1px solid #FEDF89;line-height:1.7;margin-bottom:18px}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.cards div{background:#fff;border:1px solid #EAECF0;border-radius:18px;padding:20px;box-shadow:0 8px 24px rgba(16,24,40,.05)}
.cards b{display:block;color:#667085;font-size:13px}.cards strong{display:block;font:900 28px Cairo;margin:8px 0 2px}.cards span{font-size:11px;color:#98A2B3}
.empty{margin-top:18px;padding:50px 24px;text-align:center;background:#fff;border:1px dashed #D0D5DD;border-radius:20px}.icon{font-size:38px}.empty h2{margin:12px 0 6px;font-size:20px}.empty p{margin:0;color:#667085;line-height:1.7}
@media(max-width:800px){.header{display:block}.status{display:inline-block;margin-top:12px}.cards{grid-template-columns:1fr}}
`;