import React,{useEffect,useMemo,useState}from'react';
import'./CustomerChat.css';

const API=import.meta.env.VITE_API_URL||'/api';
const visitorKey='mybrand_chat_visitor_id';
const tokenKey='mybrand_token';
const serviceLabels={shipping:'مشكلة في الشحن',payment:'مشكلة في الدفع',return:'الإرجاع',exchange:'الاستبدال',complaint:'شكوى أو مشكلة'};
const getVisitorId=()=>{let id=localStorage.getItem(visitorKey);if(!id){id=`visitor-${crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;localStorage.setItem(visitorKey,id)}return id};

export default function CustomerChat({embedded=false}){
 const visitorId=useMemo(()=>getVisitorId(),[]);
 const [open,setOpen]=useState(embedded),[text,setText]=useState(''),[messages,setMessages]=useState([]),[loading,setLoading]=useState(false),[status,setStatus]=useState('bot'),[serviceDraft,setServiceDraft]=useState(null),[serviceBusy,setServiceBusy]=useState(false);
 const headers=()=>{const token=localStorage.getItem(tokenKey);return {'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}};
 const loadConversation=async()=>{try{const r=await fetch(`${API}/chat/${encodeURIComponent(visitorId)}`,{headers:headers()});const d=await r.json();if(!r.ok)throw new Error(d.message||'error');setMessages(d.conversation?.messages||[]);setStatus(d.conversation?.status||'bot');setServiceDraft(d.serviceDraft||d.conversation?.serviceDraft||null)}catch{}};
 useEffect(()=>{loadConversation();const timer=setInterval(loadConversation,5000);return()=>clearInterval(timer)},[visitorId]);
 const send=async(value=text,nextServiceDraft=null)=>{const message=String(value||'').trim();if(!message||loading)return;setText('');setLoading(true);setMessages(prev=>[...prev,{role:'customer',text:message}]);try{const r=await fetch(`${API}/chat/message`,{method:'POST',headers:headers(),body:JSON.stringify({visitorId,message,serviceDraft:nextServiceDraft})});const d=await r.json();if(!r.ok)throw new Error(d.message||'error');setMessages(d.conversation?.messages||[]);setStatus(d.status||'bot');setServiceDraft(d.serviceDraft||d.conversation?.serviceDraft||null)}catch{setMessages(prev=>[...prev,{role:'assistant',text:'حدث خطأ مؤقت. حاول مرة أخرى.'}])}finally{setLoading(false)}};
 const requestAgent=async()=>{if(loading)return;setLoading(true);try{const r=await fetch(`${API}/chat/request-agent`,{method:'POST',headers:headers(),body:JSON.stringify({visitorId,serviceDraft})});const d=await r.json();if(!r.ok)throw new Error(d.message||'error');setMessages(d.conversation?.messages||[]);setStatus('waiting_agent');setServiceDraft(d.serviceDraft||d.conversation?.serviceDraft||null)}catch{setMessages(prev=>[...prev,{role:'assistant',text:'تعذر تحويلك للموظف الآن. حاول مرة أخرى.'}])}finally{setLoading(false)}};
 const updateService=(key,value)=>setServiceDraft(prev=>({...prev||{},[key]:value}));
 const submitService=async e=>{e.preventDefault();if(!serviceDraft||serviceBusy)return;const current={...serviceDraft,orderNumber:String(serviceDraft.orderNumber||'').trim(),reason:String(serviceDraft.reason||'').trim(),note:String(serviceDraft.note||'').trim(),ready:true};if(!current.reason&&['return','exchange','shipping','payment','complaint'].includes(current.type))return;setServiceBusy(true);try{await send(`تنفيذ ${serviceLabels[current.type]||'طلب خدمة'}`,current)}finally{setServiceBusy(false)}};
 const quick=(type)=>send({shipping:'لدي مشكلة في الشحن',payment:'لدي مشكلة في الدفع',return:'أريد إرجاع طلب',exchange:'أريد استبدال طلب',complaint:'لدي شكوى أو مشكلة'}[type]);
 const chat=<section className={`mybrand-chat${embedded?' mybrand-chat-embedded':''}`} dir="rtl" aria-label="خدمة عملاء MYBRAND">
  <header><div><strong>MYBRAND CARE</strong><small>{status==='waiting_agent'?'بانتظار خدمة العملاء':status==='agent'?'مع موظف خدمة العملاء':'مساعد خدمة العملاء'}</small></div>{!embedded&&<button onClick={()=>setOpen(false)} aria-label="إغلاق">×</button>}</header>
  <div className="mybrand-chat-messages">{messages.map((m,i)=><div key={m._id||i} className={`mybrand-chat-message ${m.role}`}>{m.text}</div>)}{loading&&<div className="mybrand-chat-message assistant">جارٍ التعامل مع طلبك…</div>}</div>
  {serviceDraft?.type&&['return','exchange','shipping','payment','complaint'].includes(serviceDraft.type)&&status!=='closed'&&<form className="mybrand-chat-draft" onSubmit={submitService}>
   <div className="draft-title">⚙️ {serviceLabels[serviceDraft.type]}</div>
   <label>رقم الطلب<input value={serviceDraft.orderNumber||''} onChange={e=>updateService('orderNumber',e.target.value)} placeholder="أدخل رقم الطلب"/></label>
   <label>تفاصيل المشكلة<textarea value={serviceDraft.reason||''} onChange={e=>updateService('reason',e.target.value)} placeholder="اشرح المشكلة أو العقبة بالتفصيل"/></label>
   <label>ملاحظات إضافية<input value={serviceDraft.note||''} onChange={e=>updateService('note',e.target.value)} placeholder="اختياري"/></label>
   <div className="draft-actions"><button type="submit" disabled={serviceBusy}>{serviceBusy?'جارٍ التنفيذ...':'تنفيذ طلب الخدمة'}</button><button type="button" onClick={requestAgent} disabled={loading}>👨‍💼 موظف</button></div>
  </form>}
  <div className="mybrand-chat-actions"><button onClick={()=>quick('shipping')}>🚚 الشحن</button><button onClick={()=>quick('return')}>↩️ إرجاع</button><button onClick={()=>quick('exchange')}>🔄 استبدال</button><button onClick={()=>quick('payment')}>💳 الدفع</button><button onClick={()=>quick('complaint')}>⚠️ شكوى</button><button onClick={requestAgent}>👨‍💼 موظف</button></div>
  <form onSubmit={e=>{e.preventDefault();send()}}><input value={text} onChange={e=>setText(e.target.value)} placeholder="اكتب مشكلتك أو العقبة التي تواجهها…" disabled={loading}/><button disabled={loading||!text.trim()}>إرسال</button></form>
 </section>;
 if(embedded)return <div className="mybrand-chat-embedded-wrap">{chat}</div>;
 return <>{<button className="mybrand-chat-fab" onClick={()=>setOpen(v=>!v)} aria-label="خدمة عملاء MYBRAND">💬<span>MYBRAND CARE</span></button>}{open&&chat}</>;
}
