(() => {
  let scheduled = false;

  const normalizeTrendLayout = () => {
    scheduled = false;
    const app = document.querySelector('.trend-app');
    if (!app) return;

    const header = app.querySelector(':scope > .trend-topbar');
    const topRow = header?.querySelector('.trend-top-row');
    const tabs = header?.querySelector('.trend-seg-tabs');
    const stories = app.querySelector(':scope > .stories-row');
    if (!header || !topRow || !tabs || !stories) return;

    // Build the requested document order instead of relying on flex-order hacks.
    header.replaceChildren(topRow);
    header.style.display = 'block';
    header.style.position = 'sticky';
    header.style.top = '0';
    header.style.zIndex = '40';
    header.style.background = '#fff';

    topRow.style.position = 'relative';
    topRow.style.top = 'auto';
    topRow.style.zIndex = 'auto';

    tabs.style.position = 'relative';
    tabs.style.top = 'auto';
    tabs.style.zIndex = 'auto';
    stories.style.position = 'relative';
    stories.style.top = 'auto';
    stories.style.bottom = 'auto';
    stories.style.left = 'auto';
    stories.style.right = 'auto';
    stories.style.zIndex = 'auto';

    header.after(tabs);
    tabs.after(stories);

    // Remove the old flex ordering rules from these elements at runtime.
    header.style.order = '0';
    tabs.style.order = '0';
    stories.style.order = '0';
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(normalizeTrendLayout);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }
})();
