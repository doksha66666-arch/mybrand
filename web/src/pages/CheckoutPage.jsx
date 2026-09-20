import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './CheckoutPage.css';
import { useStoreLayout } from '../context/StoreLayoutContext';

const money = (value) => Number(value || 0).toLocaleString('ar-EG');
const getOptions = (item) => {
  if (item?.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions)) return item.selectedOptions;
  const out = {};
  if (item?.color != null && String(item.color).trim()) out.color = item.color;
  if (item?.size != null && String(item.size).trim()) out.size = item.size;
  return out;
};
const getOption = (item, key) => {
  const options = getOptions(item);
  const wanted = key === 'color' ? ['color', 'colour', 'اللون', 'لون'] : ['size', 'المقاس', 'مقاس'];
  const entry = Object.entries(options).find(([name]) => wanted.includes(String(name).trim().toLowerCase()));
  return entry ? entry[1] : '';
};
const lineKey = (item) => {
  const options = getOptions(item);
  const optionKey = Object.keys(options).sort().map((name) => `${name}:${options[name]}`).join('|');
  return `${item?.id || item?._id || ''}:${item?.variantId || 'default'}:${optionKey || 'default'}`;
};
const paymentConfig = (methods) => ({
  cod: methods.find((m) => m?.key === 'cod'),
  card: methods.find((m) => m?.key === 'cards'),
  vodafone: methods.find((m) => m?.key === 'vodafone'),
  instapay: methods.find((m) => m?.key === 'instapay'),
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { getStyle } = useStoreLayout('checkout');
  const location = useLocation();
  const {
    items,
    discount,
    shippingFee,
    clearCart,
    removeItems,
    setShippingFee,
    coupon: cartCoupon,
    applyCoupon: applyCartCoupon,
    removeCoupon: removeCartCoupon,
  } = useCart();
  const { user } = useAuth();
  const buyNow = location.state?.buyNow || null;
  const selectedItems = Array.isArray(location.state?.selectedItems) ? location.state.selectedItems : null;
  const checkoutItems = useMemo(() => {
    if (buyNow) return [{ ...buyNow, quantity: Number(buyNow.quantity || 1) }];
    if (selectedItems) return selectedItems.map(item => ({ ...item, quantity: Number(item.quantity || 1) }));
    return items;
  }, [buyNow, selectedItems, items]);
  const checkoutSubtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [checkoutItems],
  );
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState('مصر');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [vodafoneNumber, setVodafoneNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [promoCode, setPromoCode] = useState(cartCoupon?.code || '');
  const [coupon, setCoupon] = useState(buyNow || selectedItems ? null : cartCoupon || null);
  const [couponDiscount, setCouponDiscount] = useState(buyNow || selectedItems ? 0 : Number(discount || 0));
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyConfig, setLoyaltyConfig] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyPreview, setLoyaltyPreview] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [loyaltyPreviewLoading, setLoyaltyPreviewLoading] = useState(false);
  const [loyaltyMessage, setLoyaltyMessage] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shipping, setShipping] = useState(buyNow ? 'standard' : (shippingFee === 45 ? 'express' : 'standard'));

  const selectedAddress = useMemo(() => savedAddresses.find((address) => String(address?._id || '') === String(selectedAddressId)) || null, [savedAddresses, selectedAddressId]);

  const loyaltyMerchandiseAmount = Math.max(0, checkoutSubtotal - checkoutDiscount);
  const loyaltyDiscount = Math.min(loyaltyMerchandiseAmount, Math.max(0, Number(loyaltyPreview?.discount) || 0));
  useEffect(() => {
    let mounted = true;
    if (!user) {
      setLoyaltyBalance(0); setLoyaltyConfig(null); setLoyaltyPoints(0); setLoyaltyPreview(null); setLoyaltyLoading(false);
      return () => { mounted = false; };
    }
    setLoyaltyLoading(true);
    api.get('/loyalty').then(({ data }) => {
      if (!mounted) return;
      setLoyaltyBalance(Math.max(0, Number(data?.points || 0)));
      setLoyaltyConfig(data?.config || null);
    }).catch(() => {
      if (!mounted) return;
      setLoyaltyBalance(0); setLoyaltyConfig(null);
    }).finally(() => { if (mounted) setLoyaltyLoading(false); });
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    let timer;
    const requested = Math.max(0, Math.floor(Number(loyaltyPoints) || 0));
    if (!user || loyaltyLoading || !loyaltyConfig?.enabled || !requested || !loyaltyBalance || loyaltyMerchandiseAmount <= 0) {
      setLoyaltyPreview(null); setLoyaltyPreviewLoading(false);
      return undefined;
    }
    timer = setTimeout(async () => {
      setLoyaltyPreviewLoading(true); setLoyaltyMessage('');
      try {
        const { data } = await api.post('/loyalty/preview', { points: requested, merchandiseAmount: loyaltyMerchandiseAmount });
        setLoyaltyPreview(data || null);
        setLoyaltyPoints(Math.max(0, Math.floor(Number(data?.acceptedPoints ?? requested) || 0)));
      } catch (err) {
        setLoyaltyPreview(null);
        setLoyaltyMessage(err?.response?.data?.message || 'تعذر احتساب خصم النقاط');
      } finally { setLoyaltyPreviewLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [user, loyaltyLoading, loyaltyConfig, loyaltyBalance, loyaltyPoints, loyaltyMerchandiseAmount]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/config').catch(() => ({ data: {} })),
      api.get('/payment-methods').catch(() => ({ data: { paymentMethods: [] } })),
    ]).then(([configResponse, paymentResponse]) => {
      if (!mounted) return;
      setVodafoneNumber(configResponse?.data?.vodafoneCashNumber || '');
      setPaymentMethods(Array.isArray(paymentResponse?.data?.paymentMethods) ? paymentResponse.data.paymentMethods : []);
    }).finally(() => {
      if (mounted) setPaymentMethodsLoading(false);
    });
    if (user) {
      api.get('/coupons/mine').then(({ data }) => setAvailableCoupons(Array.isArray(data?.coupons) ? data.coupons : [])).catch(() => {});
      api.get('/account').then(({ data }) => {
        const addresses = Array.isArray(data?.user?.addresses) ? data.user.addresses.filter(Boolean) : [];
        setSavedAddresses(addresses);
        const preferred = addresses.find((address) => address?.isDefault) || addresses[0];
        if (preferred && mounted) {
          setSelectedAddressId(String(preferred._id || ''));
          setName(preferred.fullName || data?.user?.name || '');
          setPhone(preferred.phone || data?.user?.phone || '');
          setCountry(preferred.country || data?.user?.country || 'مصر');
          setCity(preferred.city || '');
          setStreet(preferred.street || '');
          setBuilding(preferred.building || '');
        }
      }).catch(() => {});
    }
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    if (buyNow || selectedItems) {
      setCoupon(null);
      setPromoCode('');
      setCouponDiscount(0);
      return;
    }
    setCoupon(cartCoupon || null);
    setPromoCode(cartCoupon?.code || '');
    setCouponDiscount(Number(discount || 0));
  }, [buyNow, selectedItems, cartCoupon, discount]);

  const configured = paymentConfig(paymentMethods);
  const availablePaymentOptions = [configured.cod, configured.card, configured.vodafone, configured.instapay].filter(Boolean);
  const currentMethodAvailable = availablePaymentOptions.some((method) => {
    const normalized = method.key === 'cards' ? 'card' : method.key === 'vodafone' ? 'vodafone_cash' : method.key === 'instapay' ? 'wallet' : method.key;
    return normalized === paymentMethod;
  });

  useEffect(() => {
    if (paymentMethodsLoading) return;
    if (!availablePaymentOptions.length) return;
    if (currentMethodAvailable) return;
    const first = availablePaymentOptions[0];
    if (first.key === 'cards') setPaymentMethod('card');
    else if (first.key === 'vodafone') setPaymentMethod('vodafone_cash');
    else if (first.key === 'instapay') setPaymentMethod('wallet');
    else setPaymentMethod('cod');
  }, [paymentMethodsLoading, availablePaymentOptions.length, currentMethodAvailable, paymentMethods]);

  const checkoutDiscount = Math.min(checkoutSubtotal, Math.max(0, Number(couponDiscount) || 0));
  const checkoutShipping = shipping === 'express' ? 45 : 0;
  const checkoutTotal = Math.max(0, checkoutSubtotal - checkoutDiscount - loyaltyDiscount + checkoutShipping);
  const chooseShipping = (value) => { setShipping(value); setShippingFee(value === 'express' ? 45 : 0); };

  const applyCoupon = async (code = promoCode) => {
    const value = String(code || '').trim().toUpperCase();
    if (!value) return setCouponMessage('اكتب رمز الترويج أولاً');
    setCouponLoading(true); setCouponMessage('');
    try {
      if (!buyNow && !selectedItems) {
        const data = await applyCartCoupon(value);
        setCoupon(data?.coupon || cartCoupon || null);
        setCouponDiscount(Math.max(0, Number(data?.discount || 0)));
        setPromoCode(data?.coupon?.code || value);
        setCouponMessage(`تم تطبيق ${data?.coupon?.code || value} — خصم ${money(data?.discount)} ج.م`);
      } else {
        const { data } = await api.post('/coupons/validate', { code: value, orderAmount: checkoutSubtotal });
        setCoupon(data?.coupon || null);
        setCouponDiscount(Math.max(0, Number(data?.discount || 0)));
        setPromoCode(data?.coupon?.code || value);
        setCouponMessage(`تم تطبيق ${data?.coupon?.code || value} — خصم ${money(data?.discount)} ج.م`);
      }
    } catch (err) {
      setCoupon(null);
      setCouponDiscount(0);
      setCouponMessage(err?.response?.data?.message || 'رمز الترويج غير صالح');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    if (!buyNow && !selectedItems) removeCartCoupon();
    setCoupon(null);
    setCouponDiscount(0);
    setPromoCode('');
    setCouponMessage('تم إلغاء الكوبون');
  };

  const submitOrder = async (e) => {
    e.preventDefault(); setError('');
    if (!user) return navigate('/login', { state: { returnTo: '/checkout', checkoutState: location.state || null } });
    if (!name || !phone || !city || !street) return setError('يرجى تعبئة كل بيانات التوصيل');
    if (paymentMethod === 'vodafone_cash' && !senderPhone) return setError('يرجى إدخال رقم الهاتف الذي حوّلت منه');
    if (!checkoutItems.length) return setError('لا يوجد منتج لإتمام الطلب');
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        items: checkoutItems.map((i) => ({ productId: i.id || i._id, variantId: i.variantId || null, selectedOptions: getOptions(i), quantity: Number(i.quantity || 1) })),
        customer: { name, phone, email: user?.email },
        shippingAddress: { country: country.trim(), city: city.trim(), street: street.trim(), building: building.trim() },
        paymentMethod,
        couponCode: coupon?.code || null,
        shippingMethod: shipping,
        loyaltyPoints: Math.max(0, Math.floor(Number(loyaltyPreview?.acceptedPoints || 0))),
        vodafoneCashInfo: paymentMethod === 'vodafone_cash' ? { senderPhone, transactionRef } : undefined,
      });
      if (buyNow) {} else if (selectedItems) removeItems(selectedItems); else clearCart();
      const createdOrder = data?.order || data?.data?.order || data?.data || data;
      const createdId = createdOrder?._id || createdOrder?.id || data?.orderId || data?.data?.orderId || '';
      const createdNumber = createdOrder?.orderNumber || data?.orderNumber || data?.data?.orderNumber || '';
      const query = new URLSearchParams();
      if (createdId) query.set('orderId', createdId);
      if (createdNumber) query.set('orderNumber', createdNumber);
      navigate(`/track${query.toString() ? `?${query.toString()}` : ''}`, { replace: true, state: { orderId: createdId || undefined, orderNumber: createdNumber || undefined, order: createdOrder || undefined } });
    } catch (err) { setError(err?.response?.data?.message || 'تعذر إتمام الطلب، حاول لاحقًا'); }
    finally { setSubmitting(false); }
  };

  return (
    <form className="checkout-page" onSubmit={submitOrder} dir="rtl">
      <div className="checkout-app">
        <header className="topbar" style={getStyle('header')}><button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="رجوع">‹</button><h1 className="display">إتمام الدفع</h1></header>
        <div className="steps" aria-label="مراحل الطلب" style={getStyle('steps')}><div className="step"><div className="dot">✓</div><span className="lbl">السلة</span></div><div className="step-line" /><div className="step"><div className="dot">2</div><span className="lbl">الدفع</span></div><div className="step-line" /><div className="step todo"><div className="dot">3</div><span className="lbl">تأكيد</span></div></div>
        <section className="block address-block" style={getStyle('address')}><div className="addr-row"><div className="addr-body"><div className="addr-name-row"><b>{name || 'بيانات العميل'}</b><span className="addr-tag">{selectedAddress?.label || 'عنوان الشحن'}</span></div><div className="addr-phone">{phone || '01xxxxxxxxx'}</div><div className="addr-text">{street || 'أدخل عنوان التوصيل'}{building ? ` — ${building}` : ''}{city ? ` — ${city}` : ''}{country ? ` — ${country}` : ''}</div></div></div>{savedAddresses.length > 0 && <div className="saved-address-row"><label>استخدم عنوانًا محفوظًا<select value={selectedAddressId} onChange={(e) => { const id = e.target.value; setSelectedAddressId(id); const address = savedAddresses.find((item) => String(item?._id || '') === String(id)); if (!address) return; setName(address.fullName || ''); setPhone(address.phone || ''); setCountry(address.country || 'مصر'); setCity(address.city || ''); setStreet(address.street || ''); setBuilding(address.building || ''); }}><option value="">اختيار عنوان محفوظ</option>{savedAddresses.map((address) => <option key={address._id} value={address._id}>{address.label || 'عنوان'} — {address.city || 'مدينة غير محددة'}{address.isDefault ? ' (افتراضي)' : ''}</option>)}</select></label></div>}<div className="address-fields"><label>الاسم الكامل<input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" autoComplete="name" /></label><label>رقم الهاتف<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" autoComplete="tel" /></label><label>الدولة<input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="الدولة" autoComplete="country-name" /></label><label>المدينة<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="المدينة" autoComplete="address-level2" /></label><label>العنوان بالتفصيل<input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="الشارع" autoComplete="address-line1" /></label><label>رقم المبنى / الدور<input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="رقم المنزل، الدور، الشقة" autoComplete="address-line2" /></label></div></section>
        <section className="block" style={getStyle('delivery')}><div className="block-title">طريقة الشحن</div><button type="button" className={`delivery-opt ${shipping === 'standard' ? 'selected' : ''}`} onClick={() => chooseShipping('standard')}><div className="delivery-left"><div className={`radio ${shipping === 'standard' ? 'on' : ''}`} /><div className="delivery-info"><b>شحن قياسي</b><span>يصل خلال 3-5 أيام عمل</span></div></div><span className="delivery-price free">مجاني</span></button><button type="button" className={`delivery-opt ${shipping === 'express' ? 'selected' : ''}`} onClick={() => chooseShipping('express')}><div className="delivery-left"><div className={`radio ${shipping === 'express' ? 'on' : ''}`} /><div className="delivery-info"><b>شحن سريع</b><span>يصل خلال 24-48 ساعة</span></div></div><span className="delivery-price">٤٥ج</span></button></section>
        <section className="block" style={getStyle('payment')}><div className="block-title">طريقة الدفع</div>{paymentMethodsLoading ? <div className="coupon-message">جارٍ تحميل طرق الدفع...</div> : availablePaymentOptions.length === 0 ? <div className="coupon-message">لا توجد طرق دفع مفعّلة حاليًا</div> : availablePaymentOptions.map((method) => { const target = method.key === 'cards' ? 'card' : method.key === 'vodafone' ? 'vodafone_cash' : method.key === 'instapay' ? 'wallet' : method.key; const selected = paymentMethod === target; const icon = method.key === 'cod' ? 'CASH' : method.key === 'cards' ? 'VISA' : method.key === 'vodafone' ? '💳' : method.key === 'instapay' ? 'IP' : 'PAY'; return <button type="button" className="pay-opt" key={method._id || method.key} onClick={() => setPaymentMethod(target)}><div className={`radio ${selected ? 'on' : ''}`} /><div className="pay-icon">{icon}</div><div className="pay-label">{method.nameAr}<span>{method.descriptionAr || method.nameEn}</span></div></button>; })}{paymentMethod === 'vodafone_cash' && configured.vodafone && <div className="vodafone-fields"><div className="vodafone-number"><span>حوّل المبلغ إلى</span><b>{configured.vodafone.displayValue || vodafoneNumber}</b></div><input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="رقم الهاتف الذي حوّلت منه" inputMode="tel" /><input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="رقم العملية (اختياري)" /><small>{configured.vodafone.instructionsAr || 'سيتم تأكيد الطلب بعد مراجعة التحويل.'}</small></div>}{paymentMethod === 'wallet' && configured.instapay && <div className="vodafone-fields"><div className="vodafone-number"><span>{configured.instapay.nameAr}</span><b>{configured.instapay.displayValue}</b></div><input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="رقم العملية (اختياري)" /><small>{configured.instapay.instructionsAr || 'سيتم تأكيد الطلب بعد مراجعة التحويل.'}</small></div>}</section>
        <section className="block" style={getStyle('products')}><div className="block-title">المنتجات ({checkoutItems.length.toLocaleString('ar-EG')})</div>{checkoutItems.slice(0, 10).map((item, index) => { const color = getOption(item, 'color'); const size = getOption(item, 'size'); return <div className="order-item" key={`${lineKey(item)}-${index}`}><div className="oi-img">{item.image && <img src={item.image} alt="" />}</div><div className="oi-body"><div className="oi-title">{item.nameAr || item.name || item.nameEn || 'منتج'}</div><div className="oi-attrs">{color ? `اللون: ${color}` : 'متنوع'}{size ? ` · المقاس: ${size}` : ''}</div><div className="oi-price">{money(Number(item.price || 0) * Number(item.quantity || 0))}ج</div></div><div className="oi-qty">×{item.quantity}</div></div>; })}</section>
        <section className="block" style={getStyle('coupon')}><div className="block-title">كود الخصم</div>{coupon ? <div className="applied-coupon"><span>{coupon.code} — خصم {money(couponDiscount)}ج</span><button type="button" onClick={removeCoupon}>إلغاء</button></div> : <><div className="promo-row"><input className="promo-input" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="أدخل كود الخصم" /><button type="button" className="promo-apply" onClick={() => applyCoupon()} disabled={couponLoading}>{couponLoading ? '...' : 'تطبيق'}</button></div>{availableCoupons.slice(0, 4).map((c) => <button type="button" key={c._id} onClick={() => { setPromoCode(c.code); applyCoupon(c.code); }}>{c.code}</button>)}</>}{couponMessage && <div className="coupon-message">{couponMessage}</div>}</section>
        {user && !loyaltyLoading && loyaltyConfig?.enabled && loyaltyBalance > 0 && <section className="block" style={getStyle('loyalty')}>
          <div className="block-title">نقاط الولاء</div>
          <div style={{display:'grid',gap:8}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><span>رصيدك المتاح</span><b>{loyaltyBalance.toLocaleString('ar-EG')} نقطة</b></div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}><input value={loyaltyPoints || ''} onChange={(e)=>{setLoyaltyPoints(Math.min(loyaltyBalance,Math.max(0,Math.floor(Number(e.target.value.replace(/\\D/g,''))||0))));setLoyaltyMessage('')}} inputMode="numeric" min="0" max={loyaltyBalance} placeholder="عدد النقاط" aria-label="عدد نقاط الولاء" style={{flex:1,padding:'11px 12px',border:'1px solid #dbe1e8',borderRadius:9,fontSize:13}}/><button type="button" onClick={()=>{const percent=Math.min(100,Math.max(0,Number(loyaltyConfig.maxRedeemPercent||0)));const value=Math.max(0,Number(loyaltyConfig.pointValue||0));const max=value?Math.min(loyaltyBalance,Math.floor((loyaltyMerchandiseAmount*percent/100)/value)):0;setLoyaltyPoints(max)}} style={{padding:'11px 12px',border:0,borderRadius:9,background:'#111',color:'#fff',fontWeight:800}}>الحد الأقصى</button></div>
            <small style={{color:'#64748b'}}>كل نقطة = {Number(loyaltyConfig.pointValue || 0).toLocaleString('ar-EG')} ج.م — الحد الأقصى للاستبدال {Number(loyaltyConfig.maxRedeemPercent || 0).toLocaleString('ar-EG')}% من قيمة المنتجات بعد الخصم.</small>
            {loyaltyPreviewLoading&&<div className="coupon-message">جارٍ احتساب خصم النقاط...</div>}
            {loyaltyPreview?.acceptedPoints > 0&&<div className="applied-coupon"><span>{Number(loyaltyPreview.acceptedPoints).toLocaleString('ar-EG')} نقطة — خصم {money(loyaltyDiscount)}ج</span><button type="button" onClick={()=>{setLoyaltyPoints(0);setLoyaltyPreview(null);setLoyaltyMessage('تم إلغاء استخدام النقاط')}}>إلغاء</button></div>}
            {loyaltyMessage&&<div className="coupon-message">{loyaltyMessage}</div>}
          </div>
        </section>}
        <section className="block" style={getStyle('summary')}><div className="block-title">ملخص الطلب</div><div className="sum-row"><span>سعر المنتجات</span><span>{money(checkoutSubtotal)}ج</span></div><div className="sum-row"><span>الخصم</span><span>-{money(checkoutDiscount)}ج</span></div><div className="sum-row"><span>خصم نقاط الولاء</span><span>-{money(loyaltyDiscount)}ج</span></div><div className="sum-row"><span>الشحن</span><span>{checkoutShipping ? `${money(checkoutShipping)}ج` : 'مجاني'}</span></div><div className="sum-row total"><span>الإجمالي</span><b>{money(checkoutTotal)}ج</b></div></section>
        {error && <div className="checkout-error">⚠️ {error}</div>}
        <div className="checkout-bar" style={getStyle('actions')}><button className="place-order" type="submit" disabled={submitting || !checkoutItems.length || paymentMethodsLoading || availablePaymentOptions.length === 0}>{submitting ? 'جارٍ تأكيد الطلب...' : `تأكيد الطلب — ${money(checkoutTotal)}ج`}</button><div className="secure-note">🔒 بيانات الطلب محمية أثناء الإرسال</div></div>
      </div>
    </form>
  );
}
