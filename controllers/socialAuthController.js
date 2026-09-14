const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const storeUrl = () => String(process.env.PUBLIC_STORE_URL || 'https://luminous-adaptation-production-3f56.up.railway.app').replace(/\/$/, '');
const backendUrl = () => String(process.env.BACKEND_PUBLIC_URL || 'https://mybrand-app-production-e260.up.railway.app').replace(/\/$/, '');
const redirectUri = (provider) => String(process.env[provider === 'google' ? 'GOOGLE_REDIRECT_URI' : 'FACEBOOK_REDIRECT_URI'] || `${backendUrl()}/api/auth/${provider}/callback`);

function oauthState(provider) {
  return jwt.sign({ provider, nonce: crypto.randomBytes(18).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '10m' });
}

function providerConfig(provider) {
  if (provider === 'google') return { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET };
  return { id: process.env.FACEBOOK_APP_ID, secret: process.env.FACEBOOK_APP_SECRET };
}

function fail(res, message) {
  return res.redirect(`${storeUrl()}/login?social_error=${encodeURIComponent(message)}`);
}

exports.start = (provider) => (req, res) => {
  const config = providerConfig(provider);
  if (!config.id || !config.secret) return fail(res, `تسجيل الدخول عبر ${provider === 'google' ? 'جوجل' : 'فيسبوك'} غير مهيأ حاليًا`);
  const state = oauthState(provider);
  const redirect = redirectUri(provider);
  let url;
  if (provider === 'google') {
    const params = new URLSearchParams({ client_id: config.id, redirect_uri: redirect, response_type: 'code', scope: 'openid email profile', state, access_type: 'online', prompt: 'select_account' });
    url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  } else {
    const params = new URLSearchParams({ client_id: config.id, redirect_uri: redirect, response_type: 'code', scope: 'email,public_profile', state });
    url = `https://www.facebook.com/v23.0/dialog/oauth?${params}`;
  }
  res.redirect(url);
};

async function exchangeGoogle(code) {
  const config = providerConfig('google');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: config.id, client_secret: config.secret, redirect_uri: redirectUri('google'), grant_type: 'authorization_code' }) });
  if (!tokenResponse.ok) throw new Error('تعذر إتمام تسجيل الدخول بجوجل');
  const tokens = await tokenResponse.json();
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profileResponse.ok) throw new Error('تعذر قراءة بيانات حساب جوجل');
  const profile = await profileResponse.json();
  return { id: profile.sub, name: profile.name, email: profile.email ? String(profile.email).toLowerCase() : '', emailVerified: profile.email_verified !== false };
}

async function exchangeFacebook(code) {
  const config = providerConfig('facebook');
  const tokenParams = new URLSearchParams({ client_id: config.id, client_secret: config.secret, redirect_uri: redirectUri('facebook'), code });
  const tokenResponse = await fetch(`https://graph.facebook.com/v23.0/oauth/access_token?${tokenParams}`);
  if (!tokenResponse.ok) throw new Error('تعذر إتمام تسجيل الدخول بفيسبوك');
  const tokens = await tokenResponse.json();
  const profileResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(tokens.access_token)}`);
  if (!profileResponse.ok) throw new Error('تعذر قراءة بيانات حساب فيسبوك');
  const profile = await profileResponse.json();
  return { id: profile.id, name: profile.name, email: profile.email ? String(profile.email).toLowerCase() : '', emailVerified: Boolean(profile.email) };
}

exports.callback = (provider) => async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) return fail(res, 'تم إلغاء تسجيل الدخول الاجتماعي');
    const payload = jwt.verify(String(state || ''), process.env.JWT_SECRET);
    if (payload.provider !== provider || !code) return fail(res, 'جلسة تسجيل الدخول غير صالحة أو انتهت صلاحيتها');

    const profile = provider === 'google' ? await exchangeGoogle(String(code)) : await exchangeFacebook(String(code));
    if (!profile.id || !profile.name) return fail(res, 'تعذر الحصول على بيانات الحساب');

    const providerField = provider === 'google' ? 'googleId' : 'facebookId';
    let user = await User.findOne({ [providerField]: profile.id }).select('+password');
    if (!user && profile.email) user = await User.findOne({ email: profile.email }).select('+password');

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({ name: profile.name.trim(), email: profile.email || undefined, password: randomPassword, [providerField]: profile.id, isEmailVerified: true });
    } else {
      user[providerField] = profile.id;
      if (!user.email && profile.email) user.email = profile.email;
      if (profile.emailVerified) user.isEmailVerified = true;
      await user.save();
    }

    if (!user.isActive) return fail(res, 'هذا الحساب معطّل');
    const token = signToken(user._id);
    return res.redirect(`${storeUrl()}/auth/social-callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Social auth error:', err.message);
    return fail(res, err.message || 'تعذر تسجيل الدخول');
  }
};
