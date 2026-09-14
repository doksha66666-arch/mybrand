// Normalize Gemini configuration before the app starts.
// Railway may keep an old GEMINI_MODEL value even after the code is updated.
// Keep production on a currently supported stable Gemini Flash model.
const requested = String(process.env.GEMINI_MODEL || '').trim();
const supported = new Set([
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
]);

if (!requested || /^gemini-2\\./i.test(requested) || !supported.has(requested)) {
  process.env.GEMINI_MODEL = 'gemini-3.6-flash';
}
