import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { productIds, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const id = product._id || product.id;
  const liked = productIds.includes(id);
  const add = (e) => {
    e.preventDefault();
    addToCart({ id, name: product.nameAr || product.name, price: Number(product.price || 0), oldPrice: Number(product.compareAtPrice || 0), image: product.images?.[0] || '', color: '', size: '', store: product.merchant?.businessName || 'MYBRAND' }, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  };
  const wish = (e) => { e.preventDefault(); toggleWishlist(id); };
  return (
    <Link to={`/products/${product.slug || id}`} style={styles.card}>
      <div style={styles.imageWrap}>
        {product.images?.[0] ? <img src={product.images[0]} alt={product.nameAr || product.name} style={styles.image} /> : <div style={{ ...styles.image, background: colors.border }} />}
        <button type="button" onClick={wish} aria-label="المفضلة" style={styles.wish}>{liked ? '♥' : '♡'}</button>
      </div>
      <div style={styles.body}>
        <p style={styles.name}>{product.nameAr || product.name}</p>
        <p style={styles.price}>{Number(product.price || 0).toLocaleString('ar-EG')} ج.م</p>
        <button type="button" onClick={add} style={styles.cart}>{added ? 'تمت الإضافة ✓' : 'أضف للسلة'}</button>
      </div>
    </Link>
  );
}

const styles = {
  card: { display: 'block', background: colors.surface, borderRadius: 12, overflow: 'hidden', textDecoration: 'none', color: 'inherit' },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 180, objectFit: 'cover', display: 'block' },
  body: { padding: 12 },
  name: { margin: 0, fontSize: 14, color: colors.primary },
  price: { margin: '4px 0 10px', fontWeight: 700, color: colors.accent },
  cart: { width: '100%', padding: '9px 10px', border: 0, borderRadius: 8, background: colors.primary, color: '#fff', cursor: 'pointer', fontWeight: 700 },
  wish: { position: 'absolute', top: 8, left: 8, width: 34, height: 34, borderRadius: '50%', border: 0, background: '#fff', cursor: 'pointer', fontSize: 20, lineHeight: 1 },
};