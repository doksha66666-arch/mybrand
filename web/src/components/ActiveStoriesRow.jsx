import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';

export default function ActiveStoriesRow() {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [index, setIndex] = useState(0);

  const load = async () => {
    try {
      const { data } = await api.get('/stories');
      setGroups(Array.isArray(data?.groups) ? data.groups.filter(g => Array.isArray(g.stories) && g.stories.length) : []);
    } catch (_) { setGroups([]); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!activeGroup) return;
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = current + 1;
        if (next >= activeGroup.stories.length) { setActiveGroup(null); return 0; }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [activeGroup]);

  const currentStory = useMemo(() => activeGroup?.stories?.[index] || null, [activeGroup, index]);
  if (!groups.length) return null;

  return (
    <>
      <div className="active-stories-row" dir="rtl">
        {groups.map((group) => {
          const story = group.stories?.[0];
          if (!story) return null;
          return (
            <button key={group.id} type="button" className="active-story" onClick={() => { setActiveGroup(group); setIndex(0); }} aria-label={`فتح قصص ${group.ownerName}`}>
              <span className="active-story-ring">
                {story.mediaType === 'video' ? <video src={story.mediaUrl} muted playsInline preload="metadata" /> : <img src={story.mediaUrl} alt={group.ownerName} />}
              </span>
              <span>{group.ownerName}</span>
            </button>
          );
        })}
      </div>

      {currentStory && (
        <div className="story-viewer-backdrop" onClick={() => setActiveGroup(null)}>
          <section className="story-viewer" onClick={(event) => event.stopPropagation()} dir="rtl">
            <div className="story-progress">{activeGroup.stories.map((_, storyIndex) => <span key={storyIndex} className={storyIndex <= index ? 'done' : ''} />)}</div>
            <header className="story-viewer-head">
              <strong>{activeGroup.ownerName}</strong>
              <button type="button" onClick={() => setActiveGroup(null)} aria-label="إغلاق">×</button>
            </header>
            <div className="story-viewer-media">
              {currentStory.mediaType === 'video' ? <video src={currentStory.mediaUrl} autoPlay controls playsInline /> : <img src={currentStory.mediaUrl} alt={currentStory.caption || activeGroup.ownerName} />}
              {currentStory.caption && <div className="story-viewer-caption">{currentStory.caption}</div>}
            </div>
            <div className="story-viewer-actions">
              <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>السابق</button>
              {currentStory.productSlug && <Link to={`/products/${encodeURIComponent(currentStory.productSlug)}`} onClick={() => setActiveGroup(null)}>🛒 اشترِ الآن</Link>}
              <button type="button" onClick={() => { if (index + 1 >= activeGroup.stories.length) setActiveGroup(null); else setIndex((value) => value + 1); }}>التالي</button>
            </div>
          </section>
        </div>
      )}

      <style>{`
        .active-stories-row{display:flex;gap:14px;overflow-x:auto;padding:14px 6px 18px;scrollbar-width:none}.active-stories-row::-webkit-scrollbar{display:none}
        .active-story{border:0;background:transparent;padding:0;display:grid;gap:6px;justify-items:center;min-width:72px;color:inherit;cursor:pointer;font:inherit}.active-story>span:last-child{max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:800}
        .active-story-ring{width:64px;height:64px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#E60023,#F59E0B,#7C3AED);box-sizing:border-box;display:block}.active-story-ring img,.active-story-ring video{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;background:#111}
        .story-viewer-backdrop{position:fixed!important;inset:0!important;z-index:1200!important;background:rgba(2,6,23,.88)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:10px!important}
        .story-viewer{width:min(430px,100%)!important;height:min(820px,calc(100dvh - 20px))!important;min-height:0!important;background:#000!important;border-radius:20px!important;overflow:hidden!important;position:relative!important;display:flex!important;flex-direction:column!important;box-shadow:0 30px 90px rgba(0,0,0,.55)!important}
        .story-progress{position:absolute!important;top:0!important;left:0!important;right:0!important;z-index:10!important;display:flex!important;gap:4px!important;padding:10px!important;background:transparent!important}.story-progress span{height:3px!important;flex:1!important;border-radius:999px!important;background:rgba(255,255,255,.35)!important}.story-progress span.done{background:#fff!important}
        .story-viewer-head{position:absolute!important;top:22px!important;left:12px!important;right:12px!important;z-index:11!important;height:42px!important;padding:0!important;margin:0!important;background:transparent!important;color:#fff!important;display:flex!important;justify-content:space-between!important;align-items:center!important;border:0!important;box-shadow:none!important}
        .story-viewer-head strong{color:#fff!important;font-size:14px!important;text-shadow:0 1px 5px rgba(0,0,0,.7)!important}.story-viewer-head button{width:38px!important;height:38px!important;border:0!important;border-radius:50%!important;background:rgba(0,0,0,.5)!important;color:#fff!important;font-size:28px!important;line-height:1!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;cursor:pointer!important}
        .story-viewer-media{flex:1!important;min-height:0!important;position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#000!important;overflow:hidden!important}.story-viewer-media img,.story-viewer-media video{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important;background:#000!important}
        .story-viewer-caption{position:absolute!important;bottom:0!important;left:0!important;right:0!important;padding:44px 16px 90px!important;color:#fff!important;background:linear-gradient(transparent,rgba(0,0,0,.8))!important;font-size:14px!important;line-height:1.7!important;text-shadow:0 1px 3px rgba(0,0,0,.7)!important}
        .story-viewer-actions{position:absolute!important;left:10px!important;right:10px!important;bottom:12px!important;z-index:12!important;display:flex!important;gap:8px!important;padding:0!important;background:transparent!important}.story-viewer-actions button,.story-viewer-actions a{flex:1!important;text-align:center!important;padding:12px 8px!important;min-height:48px!important;border-radius:13px!important;text-decoration:none!important;border:1px solid rgba(255,255,255,.22)!important;background:rgba(15,23,42,.92)!important;color:#fff!important;font:inherit!important;font-weight:800!important;cursor:pointer!important;box-shadow:0 6px 20px rgba(0,0,0,.28)!important;backdrop-filter:blur(6px)!important}.story-viewer-actions a{background:#E60023!important;border-color:#E60023!important}.story-viewer-actions button:disabled{opacity:.45!important;cursor:not-allowed!important}
        @media(max-width:600px){.story-viewer-backdrop{padding:0!important;background:#000!important}.story-viewer{width:100%!important;height:100dvh!important;max-height:none!important;border-radius:0!important}.story-viewer-actions{bottom:calc(12px + env(safe-area-inset-bottom))!important}}
      `}</style>
    </>
  );
}
