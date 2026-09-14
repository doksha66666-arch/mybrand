const TITLE = 'عرض MYBRAND نيو';

function applyLiveTitle() {
  const textNodes = document.querySelectorAll('h1, h2, h3, button, label, span, div');
  textNodes.forEach((el) => {
    const text = (el.textContent || '').trim();
    if (text === 'استوديو البث المباشر') el.textContent = `استوديو ${TITLE}`;
    if (text === '📺 البث المباشر') el.textContent = `📺 ${TITLE}`;
  });

  document.querySelectorAll('input').forEach((input) => {
    if (input.value === 'بث MYBRAND المباشر' || input.placeholder === 'بث MYBRAND المباشر') {
      input.value = TITLE;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

const observer = new MutationObserver(applyLiveTitle);
observer.observe(document.documentElement, { childList: true, subtree: true });
applyLiveTitle();
