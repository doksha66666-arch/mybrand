import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);
const STORAGE_KEY = 'mybrand_cart_v1';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]); // {id, productId, variantId, name, image, price, quantity}
  const [discount, setDiscount] = useState(0); // جاهز للتفعيل مستقبلًا
  const [shippingFee, setShippingFee] = useState(0); // جاهز للتفعيل مستقبلًا
  const [loaded, setLoaded] = useState(false);

  // تحميل السلة المحفوظة عند فتح التطبيق
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setItems(parsed.items || []);
          setDiscount(parsed.discount || 0);
          setShippingFee(parsed.shippingFee || 0);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // حفظ السلة تلقائيًا عند أي تغيير (بما في ذلك إغلاق التطبيق)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items, discount, shippingFee }));
  }, [items, discount, shippingFee, loaded]);

  const addToCart = useCallback((product, variant = null, quantity = 1) => {
    setItems((prev) => {
      const lineId = `${product.id}_${variant?.id || 'default'}`;
      const existing = prev.find((i) => i.id === lineId);
      if (existing) {
        return prev.map((i) => (i.id === lineId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [
        ...prev,
        {
          id: lineId,
          productId: product.id,
          variantId: variant?.id || null,
          name: product.name,
          image: product.image,
          price: (product.price || 0) + (variant?.priceModifier || 0),
          quantity,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((lineId) => {
    setItems((prev) => prev.filter((i) => i.id !== lineId));
  }, []);

  const increaseQuantity = useCallback((lineId) => {
    setItems((prev) => prev.map((i) => (i.id === lineId ? { ...i, quantity: i.quantity + 1 } : i)));
  }, []);

  const decreaseQuantity = useCallback((lineId) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === lineId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const total = useMemo(
    () => Math.max(0, subtotal - discount + shippingFee),
    [subtotal, discount, shippingFee]
  );

  const value = {
    items,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    subtotal,
    discount,
    setDiscount, // مثال: تفعيل كود خصم مستقبلًا
    shippingFee,
    setShippingFee, // مثال: تفعيل حساب شحن مستقبلًا
    total,
    itemsCount: items.reduce((n, i) => n + i.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
