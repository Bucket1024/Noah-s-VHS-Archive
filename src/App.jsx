
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STARTER_TAPES } from './data.js';
import './main.css';

const PHOTO_DB_NAME = 'vhs-archive-photo-library';
const PHOTO_STORE = 'photos';

function canUseIndexedDb(){
  return typeof indexedDB !== 'undefined';
}

function openPhotoDatabase(){
  return new Promise((resolve, reject) => {
    if(!canUseIndexedDb()){
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(PHOTO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if(!db.objectStoreNames.contains(PHOTO_STORE)){
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open photo database'));
  });
}

async function idbSavePhoto(id, src){
  const db = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put({ id, src, savedAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error('Could not save photo'));
  });
}

async function idbGetPhoto(id){
  const db = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const req = tx.objectStore(PHOTO_STORE).get(id);
    req.onsuccess = () => resolve(req.result?.src || '');
    req.onerror = () => reject(req.error || new Error('Could not read photo'));
  });
}

async function idbDeletePhoto(id){
  const db = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error('Could not delete photo'));
  });
}


const views = [
  ['home','🏠','Home'],
  ['browse','📼','Browse'],
  ['add','➕','Add'],
  ['timeline','🗓️','Timeline'],
  ['stats','📊','Stats'],
];

function normalizeTape(t){
  return {
    photos: [], cover: '', favorite:false, watched:false, dateAcquired:'', purchaseLocation:'',
    purchasePrice:'', tapeCondition:'', sleeveCondition:'', inserts:'', rating:'', tags:'', timelineNote:'',
    ...t,
    photos: (t.photos || []).map(p => typeof p === 'string' ? {src:p,label:'Photo',date:''} : p)
  };
}

function resolvePhotoSrc(photo, photoLibrary = {}){
  if(!photo) return '';
  if(typeof photo === 'string') return photo;
  if(photo.src) return photo.src;
  if(photo.photoId && photoLibrary[photo.photoId]) return photoLibrary[photo.photoId];
  return '';
}

function mainImage(t, photoLibrary = {}){
  const tape = normalizeTape(t);
  if(tape.cover && String(tape.cover).startsWith('data:')) return tape.cover;
  if(tape.cover && photoLibrary[tape.cover]) return photoLibrary[tape.cover];
  const first = tape.photos?.[0];
  if(!first) return '';
  return resolvePhotoSrc(first, photoLibrary);
}

function archiveId(t){
  return String(t?.id || '').replace('VHS-', 'VHS-');
}

function has(t, regex){
  return regex.test([t.title,t.studio,t.edition,t.packaging,t.notes,t.genre,t.tags].join(' '));
}

function badgeList(t){
  const text = [t.title,t.studio,t.edition,t.packaging,t.notes,t.genre,t.tags].join(' ');
  const badges = [];
  if(/screener/i.test(text)) badges.push('SCREENER');
  if(/collector/i.test(text)) badges.push('COLLECTOR');
  if(/special/i.test(text)) badges.push('SPECIAL');
  if(/widescreen/i.test(text)) badges.push('WIDE');
  if(/lenticular/i.test(text)) badges.push('LENTICULAR');
  if(/metallic/i.test(text)) badges.push('METALLIC');
  if(/2-tape|2 tape|double/i.test(text)) badges.push('2 TAPE');
  if(/nintendo/i.test(text)) badges.push('NINTENDO');
  if(/disney parks|vacation|disneyland|walt disney world/i.test(text)) badges.push('PARKS');
  if(/custom/i.test(text)) badges.push('CUSTOM');
  if(/clamshell/i.test(t.packaging || '')) badges.push('CLAM');
  return badges.slice(0,3);
}

function TapeCard({ tape, onOpen, mini=false, photoLibrary={} }){
  const img = mainImage(tape, photoLibrary);
  const special = /screener|collector|special|custom|nintendo|disney parks/i.test(tape.edition || '');
  const badges = badgeList(tape);
  return (
    <article className={`tape-card ${mini ? 'mini-card':''}`} onClick={() => onOpen(tape.id)}>
      <div className={`cover ${img ? 'has-img':''}`}>
        {img ? <img src={img} alt={`${tape.title} cover`} /> : <div className="cover-title"><span className="coming-soon">PHOTO NEEDED</span><br />{tape.title}</div>}
        <div className="case-shine"></div>
      </div>
      <div className="meta">
        <div className="title">{tape.title}</div>
        <div className="small">{tape.vhsYear || 'No year'} • {tape.studio || 'Unknown'}</div>
        <div className="badge-row">
          <span className={`tag ${special ? 'alt':''}`}>{tape.packaging}</span>
          {badges.map(b => <span className="mini-badge" key={b}>{b}</span>)}
        </div>
      </div>
    </article>
  );
}

function Shelf({ title, subtitle, tapes, onOpen, photoLibrary={} }){
  const shelfRef = useRef(null);
  const [scrollState, setScrollState] = useState({ overflow:false, left:false, right:false });

  useEffect(() => {
    const node = shelfRef.current;
    if(!node) return;

    let frame = 0;

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
      const overflow = maxScrollLeft > 8;
      const left = overflow && node.scrollLeft > 8;
      const right = overflow && node.scrollLeft < maxScrollLeft - 8;

      setScrollState(prev => (
        prev.overflow === overflow && prev.left === left && prev.right === right
          ? prev
          : { overflow, left, right }
      ));
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScrollState);
    };

    requestUpdate();
    node.addEventListener('scroll', requestUpdate, { passive:true });
    window.addEventListener('resize', requestUpdate);

    let resizeObserver = null;
    if(typeof ResizeObserver !== 'undefined'){
      resizeObserver = new ResizeObserver(requestUpdate);
      resizeObserver.observe(node);
    }

    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      resizeObserver?.disconnect();
    };
  }, [tapes.length]);

  const shelfClassName = [
    'shelf-shell',
    scrollState.overflow ? 'is-overflowing' : '',
    scrollState.left ? 'can-scroll-left' : '',
    scrollState.right ? 'can-scroll-right' : ''
  ].filter(Boolean).join(' ');

  return (
    <section className="shelf-section">
      <div className="section-head"><h3>{title}</h3><span className="small">{subtitle}</span></div>
      <div className={shelfClassName}>
        <div ref={shelfRef} className="shelf" aria-label={`${title} shelf`}>
          {tapes.length
            ? tapes.map(t => <TapeCard key={t.id} tape={t} onOpen={onOpen} mini photoLibrary={photoLibrary} />)
            : <div className="panel small shelf-empty">Nothing here yet.</div>}
        </div>
        <div className="shelf-fade shelf-fade-left" aria-hidden="true"></div>
        <div className="shelf-fade shelf-fade-right" aria-hidden="true"></div>
      </div>
    </section>
  );
}

export default function App(){
  const [tapes,setTapes] = useState(() => {
    const saved = localStorage.getItem('noahVhs6_tapes');
    return saved ? JSON.parse(saved).map(normalizeTape) : STARTER_TAPES.map(normalizeTape);
  });
  const [wishlist,setWishlist] = useState(() => {
    const saved = localStorage.getItem('noahVhs6_wishlist');
    return saved ? JSON.parse(saved) : [
      {title:'Ghostbusters Big Box', notes:'Holy grail hunt', priority:'High'},
      {title:'Twister Screener', notes:'Perfect fit for the archive', priority:'High'},
      {title:'Toy Story Screener', notes:'Dream Disney/Pixar find', priority:'Medium'}
    ];
  });
  const [view,setView] = useState(() => sessionStorage.getItem('noahVhs6_lastView') || 'home');
  const [query,setQuery] = useState('');
  const [pkg,setPkg] = useState(''); // 8.0: pkg now stores genre filter
  const [edition,setEdition] = useState('');
  const [missingPhotosOnly,setMissingPhotosOnly] = useState(false);
  const [selectedId,setSelectedId] = useState(() => sessionStorage.getItem('noahVhs6_selectedTape') || null);
  const [selectedPhoto,setSelectedPhoto] = useState(0);
  const [photoLibrary,setPhotoLibrary] = useState({});
  const [viewerPhoto,setViewerPhoto] = useState(null);
  const [viewerZoom,setViewerZoom] = useState(1);
  const [viewerOffset,setViewerOffset] = useState({x:0,y:0});
  const viewerGestureRef = useRef({mode:null,startDistance:0,startZoom:1,startX:0,startY:0,startOffset:{x:0,y:0}});
  const [scrollPositions,setScrollPositions] = useState({});
  const scrollAreaRef = useRef(null);
  const importBackupRef = useRef(null);
  const [movieNight,setMovieNight] = useState(null);
  const viewHistoryRef = useRef([]);
  const touchStartRef = useRef(null);
  const [toast,setToast] = useState('');
  const [editOpen,setEditOpen] = useState(false);
  const [installPrompt,setInstallPrompt] = useState(null);
  const [isStandalone,setIsStandalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
  const [form,setForm] = useState({});
  const [quickRows,setQuickRows] = useState('');

  useEffect(()=>{localStorage.setItem('noahVhs6_tapes', JSON.stringify(tapes));},[tapes]);

  useEffect(() => {
    let cancelled = false;
    async function loadPhotoRefsFromIndexedDb(){
      const ids = [];
      tapes.forEach(t => {
        if(t.cover && !String(t.cover).startsWith('data:')) ids.push(t.cover);
        (t.photos || []).forEach(p => {
          if(p?.photoId) ids.push(p.photoId);
        });
      });
      const missing = [...new Set(ids)].filter(id => id && !photoLibrary[id]);
      if(!missing.length) return;
      const loaded = {};
      for(const id of missing){
        try{
          const src = await idbGetPhoto(id);
          if(src) loaded[id] = src;
        }catch(error){}
      }
      if(!cancelled && Object.keys(loaded).length){
        setPhotoLibrary(prev => ({...prev, ...loaded}));
      }
    }
    loadPhotoRefsFromIndexedDb();
    return () => { cancelled = true; };
  }, [tapes]);
  useEffect(()=>{localStorage.setItem('noahVhs6_wishlist', JSON.stringify(wishlist));},[wishlist]);
  useEffect(()=>{sessionStorage.setItem('noahVhs6_lastView', view);},[view]);
  useEffect(()=>{
    if(selectedId) sessionStorage.setItem('noahVhs6_selectedTape', selectedId);
  },[selectedId]);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      notify('Noah\'s VHS Archive installed.');
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function notify(msg){ setToast(msg); setTimeout(()=>setToast(''), 2400); }

  function openPhotoViewer(photo){
    setViewerZoom(1);
    setViewerOffset({x:0,y:0});
    setViewerPhoto(photo);
  }

  function closePhotoViewer(){
    setViewerPhoto(null);
    setViewerZoom(1);
    setViewerOffset({x:0,y:0});
  }

  function zoomPhoto(delta){
    setViewerZoom(z => {
      const next = Math.max(1, Math.min(4, Number((z + delta).toFixed(2))));
      if(next === 1) setViewerOffset({x:0,y:0});
      return next;
    });
  }

  function getTouchDistance(touches){
    const [a,b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function handleViewerTouchStart(e){
    if(e.touches.length === 2){
      viewerGestureRef.current = {
        mode:'pinch',
        startDistance:getTouchDistance(e.touches),
        startZoom:viewerZoom,
        startX:0,
        startY:0,
        startOffset:viewerOffset
      };
    } else if(e.touches.length === 1){
      viewerGestureRef.current = {
        mode:'pan',
        startDistance:0,
        startZoom:viewerZoom,
        startX:e.touches[0].clientX,
        startY:e.touches[0].clientY,
        startOffset:viewerOffset
      };
    }
  }

  function handleViewerTouchMove(e){
    if(!viewerPhoto) return;
    if(e.touches.length === 2 && viewerGestureRef.current.mode === 'pinch'){
      e.preventDefault();
      const dist = getTouchDistance(e.touches);
      const base = viewerGestureRef.current.startDistance || dist;
      const next = Math.max(1, Math.min(4, viewerGestureRef.current.startZoom * (dist / base)));
      setViewerZoom(Number(next.toFixed(2)));
      if(next <= 1.02) setViewerOffset({x:0,y:0});
    } else if(e.touches.length === 1 && viewerGestureRef.current.mode === 'pan' && viewerZoom > 1){
      e.preventDefault();
      const dx = e.touches[0].clientX - viewerGestureRef.current.startX;
      const dy = e.touches[0].clientY - viewerGestureRef.current.startY;
      setViewerOffset({
        x: viewerGestureRef.current.startOffset.x + dx,
        y: viewerGestureRef.current.startOffset.y + dy
      });
    }
  }

  function handleViewerTouchEnd(){
    viewerGestureRef.current = {mode:null,startDistance:0,startZoom:viewerZoom,startX:0,startY:0,startOffset:viewerOffset};
    if(viewerZoom <= 1.02){
      setViewerZoom(1);
      setViewerOffset({x:0,y:0});
    }
  }

  function resetPhotoZoom(){
    setViewerZoom(1);
    setViewerOffset({x:0,y:0});
  }
  async function installApp(){
    if (!installPrompt) {
      notify('Use Chrome menu → Install app / Add to Home screen.');
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }
  function saveScrollPosition(page = view){
    const el = scrollAreaRef.current;
    const y = el ? el.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0);
    setScrollPositions(prev => ({...prev, [page]: y}));
    sessionStorage.setItem(`noahVhs_scroll_${page}`, String(y));
  }

  function restoreScrollPosition(page){
    const saved = scrollPositions[page] ?? Number(sessionStorage.getItem(`noahVhs_scroll_${page}`) || 0);
    setTimeout(() => {
      const el = scrollAreaRef.current;
      if(el) el.scrollTo({top:saved, behavior:'auto'});
      else window.scrollTo({top:saved, behavior:'auto'});
    }, 50);
  }

  function goToView(nextView, options = {}){
    if(nextView === 'browse'){
      if(options.resetBrowse || view === 'browse'){
        setQuery('');
        setPkg('');
        setEdition('');
        setMissingPhotosOnly(false);
        sessionStorage.setItem('noahVhs_scroll_browse', '0');
      }
    }

    if(view === nextView){
      scrollAreaRef.current?.scrollTo({top:0, behavior:'smooth'});
      sessionStorage.setItem(`noahVhs_scroll_${nextView}`, '0');
      setScrollPositions(prev => ({...prev, [nextView]: 0}));
      return;
    }

    if(!options.skipHistory){
      viewHistoryRef.current.push(view);
      try{ window.history.pushState({vhsView: nextView}, '', window.location.href); }catch(error){}
    }

    saveScrollPosition(view);
    setView(nextView);
    sessionStorage.setItem('noahVhs6_lastView', nextView);
    setTimeout(() => {
      if(nextView === 'browse' && (options.resetBrowse || view === 'browse')){
        scrollAreaRef.current?.scrollTo({top:0, behavior:'smooth'});
      } else {
        restoreScrollPosition(nextView);
      }
    }, 80);
  }

  function goBackInApp(){
    if(viewerPhoto){ closePhotoViewer(); return; }
    if(view === 'detail'){ backToBrowse(); return; }
    const previous = viewHistoryRef.current.pop();
    if(previous){
      saveScrollPosition(view);
      setView(previous);
      sessionStorage.setItem('noahVhs6_lastView', previous);
      setTimeout(() => restoreScrollPosition(previous), 70);
    } else if(view !== 'home'){
      goToView('home', {skipHistory:true});
    }
  }

  function openTape(id){
    saveScrollPosition(view);
    viewHistoryRef.current.push(view);
    try{ window.history.pushState({vhsView:'detail'}, '', window.location.href); }catch(error){}
    sessionStorage.setItem('noahVhs6_selectedTape', id);
    sessionStorage.setItem('noahVhs6_lastView', 'detail');
    setSelectedId(id);
    setSelectedPhoto(0);
    setEditOpen(false);
    setView('detail');
    setTimeout(() => scrollAreaRef.current?.scrollTo({top:0, behavior:'smooth'}), 50);
  }

  function backToBrowse(){
    goToView('browse');
    restoreScrollPosition('browse');
  }

  useEffect(() => {
    const onPopState = (event) => {
      event.preventDefault?.();
      goBackInApp();
    };
    window.addEventListener('popstate', onPopState);
    try{ window.history.replaceState({vhsView:view}, '', window.location.href); }catch(error){}
    return () => window.removeEventListener('popstate', onPopState);
  }, [view, viewerPhoto]);

  useEffect(() => {
    const area = scrollAreaRef.current;
    if(!area) return;

    const onTouchStart = (e) => {
      const touch = e.touches?.[0];
      if(!touch) return;
      if(touch.clientX <= 24){
        touchStartRef.current = {x:touch.clientX, y:touch.clientY, time:Date.now()};
      } else {
        touchStartRef.current = null;
      }
    };

    const onTouchEnd = (e) => {
      const start = touchStartRef.current;
      const touch = e.changedTouches?.[0];
      touchStartRef.current = null;
      if(!start || !touch) return;
      const dx = touch.clientX - start.x;
      const dy = Math.abs(touch.clientY - start.y);
      if(dx > 70 && dy < 60 && Date.now() - start.time < 800){
        goBackInApp();
      }
    };

    area.addEventListener('touchstart', onTouchStart, {passive:true});
    area.addEventListener('touchend', onTouchEnd, {passive:true});
    return () => {
      area.removeEventListener('touchstart', onTouchStart);
      area.removeEventListener('touchend', onTouchEnd);
    };
  }, [view, viewerPhoto]);

  const selected = tapes.find(t => t.id === selectedId);

  function pickMovieNight(){
    if(!tapes.length) return;
    const choice = tapes[Math.floor(Math.random() * tapes.length)];
    const shuffled = [...tapes].sort(() => 0.5 - Math.random()).slice(0, 10);
    setMovieNight({stage:'shuffle', choice, reel: shuffled});
    setTimeout(() => {
      setMovieNight(null);
      openTape(choice.id);
    }, 2200);
  }

  const genreOptions = useMemo(() => {
    const base = ['Other','Action / Adventure','Comedy','Family','Sci‑Fi / Fantasy','Drama','Horror','Animation','Documentary','Music','Sports','Christmas','Disney'];
    const fromTapes = tapes.map(t => t.genre).filter(Boolean);
    return [...new Set([...base, ...fromTapes])].sort((a,b)=>a.localeCompare(b));
  }, [tapes]);

  const tapesMissingPhotos = useMemo(() => tapes.filter(t => !mainImage(t, photoLibrary)), [tapes, photoLibrary]);

  const filtered = useMemo(() => {
    let list = tapes.filter(t => [t.title,t.studio,t.edition,t.packaging,t.notes,t.genre,t.tags,t.vhsYear].join(' ').toLowerCase().includes(query.toLowerCase()));
    if(pkg) list = list.filter(t => (t.genre || 'Other') === pkg);
    if(edition) list = list.filter(t => has(t, new RegExp(edition,'i')));
    if(missingPhotosOnly) list = list.filter(t => !mainImage(t, photoLibrary));
    return list.sort((a,b)=>a.title.localeCompare(b.title));
  }, [tapes, query, pkg, edition, missingPhotosOnly, photoLibrary]);

  const stats = {
    total: tapes.length,
    photos: tapes.filter(t => mainImage(t, photoLibrary)).length,
    photosNeeded: tapes.filter(t => !mainImage(t, photoLibrary)).length,
    favorites: tapes.filter(t => t.favorite).length,
    watched: tapes.filter(t => t.watched).length,
    screeners: tapes.filter(t => has(t,/screener/i)).length,
    specials: tapes.filter(t => has(t,/collector|special|lenticular|metallic|2-tape|blue tape/i)).length,
    clamshells: tapes.filter(t => /clamshell/i.test(t.packaging || '')).length,
    sleeves: tapes.filter(t => /sleeve/i.test(t.packaging || '')).length,
  };

  function updateTape(id, patch){
    setTapes(prev => prev.map(t => t.id === id ? normalizeTape({...t, ...patch}) : t));
  }

  function compressImage(file, maxSize = 1100, quality = 0.74){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, maxSize / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }


  async function saveTapePhoto(tapeId, label, file){
    if(!file) return null;
    const src = await compressImage(file);
    const photoId = `${tapeId}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    try{
      await idbSavePhoto(photoId, src);
      setPhotoLibrary(prev => ({...prev, [photoId]: src}));
      return {photoId, label, date:new Date().toISOString().slice(0,10)};
    }catch(storageError){
      return {src, label, date:new Date().toISOString().slice(0,10)};
    }
  }

  async function addPhoto(label, file){
    if(!selected || !file) return;
    sessionStorage.setItem('noahVhs6_selectedTape', selected.id);
    sessionStorage.setItem('noahVhs6_lastView', 'detail');
    try{
      const photo = await saveTapePhoto(selected.id, label, file);
      if(!photo) return;
      const photos = [...(selected.photos || []), photo];
      updateTape(selected.id, {photos, cover: selected.cover || (photo.photoId || photo.src)});
      setSelectedPhoto(selected.cover ? photos.length : 0);
      setView('detail');
      notify(`${label} saved.`);
    } catch(error){
      notify('Photo could not be saved. Try a smaller photo.');
    }
  }

  function removePhoto(i){
    if(!selected) return;
    const photos = [...(selected.photos || [])];
    const removed = photos.splice(i,1)[0];
    const removedKey = removed?.photoId || removed?.src;
    if(removed?.photoId){
      idbDeletePhoto(removed.photoId).catch(()=>{});
      setPhotoLibrary(prev => {
        const next = {...prev};
        delete next[removed.photoId];
        return next;
      });
    }
    const cover = selected.cover === removedKey ? (photos[0]?.photoId || photos[0]?.src || '') : selected.cover;
    updateTape(selected.id, {photos, cover});
    notify('Photo removed.');
  }

  function beginEdit(){
    if(!selected) return;
    setForm({...selected});
    setEditOpen(true);
  }

  function saveEdit(){
    updateTape(selected.id, form);
    setEditOpen(false);
    notify('Tape details saved.');
  }

  function quickAddTapes(){
    const rows = quickRows.split('\n').map(r => r.trim()).filter(Boolean);
    if(!rows.length){ notify('Paste one tape per line first.'); return; }
    const additions = rows.map((row, idx) => {
      const parts = row.split(',').map(p => p.trim());
      const title = parts[0] || 'Untitled Tape';
      const yearMatch = row.match(/(19|20)\d{2}/);
      const packaging = /clamshell/i.test(row) ? 'Clamshell' : (/cardboard/i.test(row) ? 'Cardboard Sleeve' : 'Sleeve');
      return normalizeTape({
        id: 'VHS-' + String(tapes.length + idx + 1).padStart(4,'0'),
        title,
        vhsYear: yearMatch ? yearMatch[0] : '',
        studio: parts[2] || parts[1] || 'Unknown',
        edition: /screener/i.test(row) ? 'Screener' : (/widescreen/i.test(row) ? 'Widescreen' : 'Standard'),
        packaging,
        genre: 'Other',
        notes: row,
        dateAcquired: new Date().toISOString().slice(0,10)
      });
    });
    setTapes(prev => [...prev, ...additions]);
    setQuickRows('');
    notify(`${additions.length} tape${additions.length>1?'s':''} added.`);
    goToView('browse');
  }

  async function addTape(e){
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = fd.get('title')?.trim();
    if(!title){ notify('Add a title first.'); return; }

    const next = 'VHS-' + String(tapes.length + 1).padStart(4,'0');
    const customGenre = fd.get('customGenre')?.trim();
    const photoInputs = [
      ['Front Cover', fd.get('photoFront')],
      ['Back Cover', fd.get('photoBack')],
      ['Spine', fd.get('photoSpine')],
      ['Tape Label', fd.get('photoTape')]
    ];

    const savedPhotos = [];
    for(const [label, file] of photoInputs){
      if(file && file.size){
        const photo = await saveTapePhoto(next, label, file);
        if(photo) savedPhotos.push(photo);
      }
    }

    const newTape = normalizeTape({
      id: next,
      title,
      vhsYear: fd.get('vhsYear') || '',
      studio: fd.get('studio') || 'Unknown',
      edition: fd.get('edition') || 'Standard',
      packaging: fd.get('packaging') || 'Sleeve',
      genre: customGenre || fd.get('genre') || 'Other',
      tapeCondition: fd.get('tapeCondition') || '',
      notes: fd.get('notes') || '',
      photos: savedPhotos,
      cover: savedPhotos[0]?.photoId || savedPhotos[0]?.src || '',
      dateAcquired: new Date().toISOString().slice(0,10)
    });

    setTapes(prev => [...prev, newTape]);
    form.reset();
    notify(savedPhotos.length ? 'Tape added with photos.' : 'Tape added.');
    setSelectedId(next);
    goToView('detail');
  }

  async function exportBackup(){
    const photos = {};
    for(const tape of tapes){
      for(const p of (tape.photos || [])){
        if(p.photoId){
          photos[p.photoId] = photoLibrary[p.photoId] || await idbGetPhoto(p.photoId).catch(() => '');
        }
      }
    }
    const blob = new Blob([JSON.stringify({version:'7.5', tapes, wishlist, photos}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vhs-archive-7-5-backup.json';
    a.click();
  }

  async function importBackupFile(file){
    if(!file){
      notify('No backup file selected.');
      return;
    }

    try{
      const text = await file.text();
      const data = JSON.parse(text);

      const importedTapes = Array.isArray(data) ? data : data.tapes;
      const importedWishlist = Array.isArray(data?.wishlist) ? data.wishlist : [];
      const importedPhotos = data?.photos && typeof data.photos === 'object' ? data.photos : {};

      if(!Array.isArray(importedTapes)){
        notify('Invalid backup file.');
        return;
      }

      const confirmed = window.confirm(
        `Import backup with ${importedTapes.length} tapes? This will replace the current archive on this device.`
      );
      if(!confirmed) return;

      const newPhotoLibrary = {};

      for(const [id, src] of Object.entries(importedPhotos)){
        if(!id || !src) continue;
        newPhotoLibrary[id] = src;
        try{
          await idbSavePhoto(id, src);
        }catch(error){
          // If IndexedDB fails, the tape records can still restore;
          // old backups with embedded src photos will still display.
        }
      }

      setPhotoLibrary(prev => ({...prev, ...newPhotoLibrary}));
      setTapes(importedTapes.map(normalizeTape));
      setWishlist(importedWishlist);
      setSelectedId(null);
      setSelectedPhoto(0);
      setViewerPhoto(null);
      setView('home');
      sessionStorage.removeItem('noahVhs6_selectedTape');

      notify('Backup imported.');
    }catch(error){
      console.error(error);
      notify('Backup import failed.');
    }finally{
      if(importBackupRef.current) importBackupRef.current.value = '';
    }
  }



  return (
    <>
      <header className="app-header" onClick={() => goToView('home')} role="button" title="Back to top">
        <div className="header-inner">
          <img className="header-ticket-logo" src="./vhs-ticket-header-logo-user.png" alt="VHS Archive logo" />
          <div><h1>VHS ARCHIVE</h1><div className="sub">Catalog. Collect. Preserve.</div><div className="version-badge">v8.0</div></div>
        </div>
      </header>

      <main ref={scrollAreaRef} className="app-scroll">
        {view === 'home' && (
          <>
            <section className="hero">
              <h2>Catalog. Collect. Preserve.</h2>
              <p>Be Kind, Rewind.</p>
              <div className="actions">
                <button onClick={()=>goToView('browse')}>Browse the Shelves</button>
                <button className="secondary" onClick={()=>goToView('timeline')}>Collection Timeline</button>
                <button className="movie-night" onClick={pickMovieNight}>🎲 Movie Night</button>
                {!isStandalone && <button className="install-button" onClick={installApp}>📲 Install App</button>}
              </div>
              <div className="stats">
                <div className="stat"><strong>{stats.total}</strong><span>Total Tapes</span></div>
                <button className="stat stat-button" onClick={()=>{setMissingPhotosOnly(true); setQuery(""); setPkg(""); setEdition(""); goToView("browse", {resetBrowse:false});}}><strong>{stats.photosNeeded}</strong><span>Need Photos</span></button>
                <div className="stat"><strong>{stats.favorites}</strong><span>Favorites</span></div>
                <div className="stat"><strong>{stats.watched}</strong><span>Watched</span></div>
                <div className="stat"><strong>{stats.screeners}</strong><span>Screeners</span></div>
                <div className="stat"><strong>{stats.specials}</strong><span>Special Tapes</span></div>
                <div className="stat"><strong>{stats.clamshells}</strong><span>Clamshells</span></div>
                <div className="stat"><strong>{stats.sleeves}</strong><span>Sleeves</span></div>
              </div>
            </section>
            {!isStandalone && <section className="panel install-panel">
              <h3>Install for Fullscreen</h3>
              <p className="small">After GitHub finishes deploying 6.3, Chrome should show <b>Install app</b>. Launching from the installed home-screen icon removes the browser address bar.</p>
            </section>}
            <Shelf title="New Arrivals" subtitle="Latest archive IDs" tapes={[...tapes].slice(-12).reverse()} onOpen={openTape} photoLibrary={photoLibrary}/>
            <Shelf title="Staff Picks" subtitle="Favorites" tapes={tapes.filter(t=>t.favorite).slice(0,16)} onOpen={openTape} photoLibrary={photoLibrary}/>
            <Shelf title="Special Shelf" subtitle="Screeners & variants" tapes={tapes.filter(t=>has(t,/screener|collector|special|nintendo|disney parks|custom|lenticular|metallic|2-tape|blue tape/i)).slice(0,16)} onOpen={openTape} photoLibrary={photoLibrary}/>
            <Shelf title="Nintendo / Promo Shelf" subtitle="Game tapes & promos" tapes={tapes.filter(t=>has(t,/nintendo|donkey kong|pokemon|pokémon/i)).slice(0,16)} onOpen={openTape} photoLibrary={photoLibrary}/>
            <Shelf title="Disney Shelf" subtitle="Disney, Pixar & Parks" tapes={tapes.filter(t=>has(t,/disney|pixar|walt disney|parks|goofy|toy story/i)).slice(0,16)} onOpen={openTape} photoLibrary={photoLibrary}/>
            <Shelf title="Photo Shelf" subtitle="Your real tape photos" tapes={tapes.filter(t=>mainImage(t, photoLibrary)).slice(0,14)} onOpen={openTape} photoLibrary={photoLibrary}/>
          </>
        )}

        {view === 'browse' && (
          <>
            <div className="controls">
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title, studio, edition, notes, tags..." />
              <select value={pkg} onChange={e=>setPkg(e.target.value)}><option value="">All genres</option>{genreOptions.map(g=><option key={g} value={g}>{g}</option>)}</select>
              <select value={edition} onChange={e=>setEdition(e.target.value)}><option value="">All editions</option><option>Standard</option><option>Screener</option><option>Collector</option><option>Special</option><option>Nintendo</option><option>Disney Parks</option><option>Custom</option><option>Widescreen</option></select>
              <button type="button" className={missingPhotosOnly ? 'active-filter' : 'secondary'} onClick={()=>setMissingPhotosOnly(v=>!v)}>📸 Needs Photos</button>
            </div>
            <div className="small" style={{margin:'8px 2px 14px'}}>{filtered.length} tapes showing • Title A-Z {missingPhotosOnly ? '• Missing photos only' : ''}</div>
            {missingPhotosOnly && !filtered.length ? <div className="panel empty-state"><h3>You're up to date</h3><p className="small">Every tape currently has at least one photo.</p></div> : <div className="grid">{filtered.map(t => <TapeCard key={t.id} tape={t} onOpen={openTape} photoLibrary={photoLibrary}/>)}</div>}
          </>
        )}

        {view === 'detail' && selected && (
          <section>
            <button className="secondary" onClick={backToBrowse}>← Back to collection</button>
            <div className="detail-layout" style={{marginTop:14}}>
              <div>
                <div className={`bigcover ${mainImage(selected, photoLibrary) ? 'has-img':''}`} onClick={() => {
                  const images = [selected.cover ? {src: mainImage(selected, photoLibrary), id:selected.cover, label:'Main Cover'} : null, ...(selected.photos || []).map(p => ({...p, src: resolvePhotoSrc(p, photoLibrary)}))].filter(p => p && p.src);
                  if(images[selectedPhoto]) openPhotoViewer(images[selectedPhoto]);
                }}>
                  {(() => {
                    const images = [selected.cover ? {src: mainImage(selected, photoLibrary), id:selected.cover, label:'Main Cover'} : null, ...(selected.photos || []).map(p => ({...p, src: resolvePhotoSrc(p, photoLibrary)}))].filter(p => p && p.src);
                    const img = images[selectedPhoto];
                    return img ? <img src={img.src} alt={img.label}/> : <div className="bigcover-title">{selected.title}</div>;
                  })()}
                </div>
                <div className="photo-carousel">
                  {[selected.cover ? {src: mainImage(selected, photoLibrary), id:selected.cover, label:'Main Cover'} : null, ...(selected.photos || []).map(p => ({...p, src: resolvePhotoSrc(p, photoLibrary)}))].filter(p => p && p.src).map((p,i)=>(
                    <div key={i} className={`carousel-thumb ${i===selectedPhoto?'active':''}`} onClick={()=>setSelectedPhoto(i)}>
                      <img src={resolvePhotoSrc(p, photoLibrary)}/><span>{p.label || 'Photo'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-card">
                <div className="museum-title">
                  <h2>{selected.title}</h2>
                  <span>{archiveId(selected)}</span>
                </div>
                <div className="detail-badges">
                  {badgeList(selected).map(b => <span className="collector-sticker" key={b}>{b}</span>)}
                </div>
                <div className="actions">
                  <button onClick={()=>updateTape(selected.id,{favorite:!selected.favorite})}>⭐ {selected.favorite ? 'Unfavorite':'Favorite'}</button>
                  <button className="secondary" onClick={()=>updateTape(selected.id,{watched:!selected.watched})}>▶ {selected.watched ? 'Unwatch':'Watched'}</button>
                </div>
                {[
                  ['Archive ID',archiveId(selected)],['VHS Release',selected.vhsYear || 'No year listed'],['Studio',selected.studio],['Edition',selected.edition],['Packaging',selected.packaging],['Genre',selected.genre],['Tape Condition',selected.tapeCondition || selected.condition || 'Not set'],['Sleeve Condition',selected.sleeveCondition || 'Not set'],['Inserts',selected.inserts || 'Not set'],['Rating',selected.rating ? selected.rating + '/5':'Not rated'],['Acquired',selected.dateAcquired || 'Not set'],['Found At',selected.purchaseLocation || 'Not set'],['Price',selected.purchasePrice ? '$'+selected.purchasePrice:'Not set'],['Collector Badges',badgeList(selected).join(', ') || 'None'],['Tags',selected.tags || ''],['Notes',selected.notes || '']
                ].map(([a,b])=><div className="row" key={a}><span>{a}</span><span>{b}</span></div>)}

                <div className="panel">
                  <h3>Tape Photos</h3>
                  <p className="small">Use your camera for front cover, back cover, spine, tape label, or choose from gallery.</p>
                  <div className="photo-capture-tip">
                    <strong>Photo tip:</strong> place the tape on a plain, high-contrast background and fill the frame. New photos are stored in IndexedDB for larger collections, with compression kept on for stability.
                  </div>
                  <div className="photo-buttons">
                    {['Front Cover','Back Cover','Spine','Tape Label'].map(label => (
                      <label key={label}>
                        <button type="button" onClick={e=>e.currentTarget.nextSibling.click()}>📷 {label}</button>
                        <input hidden type="file" accept="image/*" capture="environment" onChange={e=>addPhoto(label,e.target.files[0])}/>
                      </label>
                    ))}
                    <label>
                      <button className="secondary" type="button" onClick={e=>e.currentTarget.nextSibling.click()}>🖼️ Choose From Gallery</button>
                      <input hidden type="file" accept="image/*" onChange={e=>addPhoto('Gallery Photo',e.target.files[0])}/>
                    </label>
                  </div>
                  <div className="photo-grid">
                    {(selected.photos || []).map((p,i)=>(
                      <div className="photo" key={i}>
                        <img src={resolvePhotoSrc(p, photoLibrary)}/><div className="photo-label">{p.label}</div>
                        <button onClick={()=>openPhotoViewer({...p, src: resolvePhotoSrc(p, photoLibrary)})}>View</button><button className="remove-photo" onClick={()=>removePhoto(i)}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="secondary" onClick={beginEdit}>Edit Tape Details</button>
                <div className={`panel edit-panel ${editOpen ? 'show':''}`}>
                  <h3>Edit Details</h3>
                  <div className="formgrid">
                    {['title','vhsYear','studio','edition','packaging','genre','tapeCondition','sleeveCondition','inserts','rating','dateAcquired','purchaseLocation','purchasePrice','tags'].map(f=>(
                      <React.Fragment key={f}><label>{f}</label><input type={f==='dateAcquired'?'date':'text'} value={form[f] || ''} onChange={e=>setForm({...form,[f]:e.target.value})}/></React.Fragment>
                    ))}
                    <label>notes</label><textarea rows="4" value={form.notes || ''} onChange={e=>setForm({...form,notes:e.target.value})}/>
                    <button onClick={saveEdit}>Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'add' && (
          <form className="panel formgrid" onSubmit={addTape}>
            <h3>Add a Tape</h3>
            <div className="quick-add-box">
              <h3>Quick Add Stack</h3>
              <p className="small">Paste one tape per line when you come home with a stack. You can clean up photos/details later.</p>
              <textarea rows="5" value={quickRows} onChange={e=>setQuickRows(e.target.value)} placeholder={"Ghostbusters, 1990, Columbia, sleeve\nChristmas Vacation, 1997, Warner Bros, sleeve"} />
              <button type="button" className="secondary" onClick={quickAddTapes}>Quick Add These Tapes</button>
            </div>
            <label>Title</label><input name="title"/>
            <label>VHS Release Year</label><input name="vhsYear"/>
            <label>Studio / Distributor</label><input name="studio"/>
            <label>Edition</label><select name="edition"><option>Standard</option><option>Widescreen</option><option>Screener</option><option>Collector's Edition</option><option>Special Edition</option><option>Custom Tape</option><option>Nintendo Power</option><option>Disney Parks</option></select>
            <label>Packaging</label><select name="packaging"><option>Sleeve</option><option>Cardboard Sleeve</option><option>Clamshell</option></select>
            <label>Genre</label><select name="genre">{genreOptions.map(g=><option key={g}>{g}</option>)}</select>
            <label>New Genre (optional)</label><input name="customGenre" placeholder="Add a new genre for this tape"/>
            <label>Tape Condition</label><select name="tapeCondition"><option></option><option>Mint</option><option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option><option>Poor</option></select>
            <label>Notes</label><textarea name="notes" rows="4"/>
            <div className="add-photo-box"><h3>Photos While Adding</h3><p className="small">Optional, but handy if you want the tape fully logged right away.</p><label>Front Cover</label><input name="photoFront" type="file" accept="image/*" capture="environment"/><label>Back Cover</label><input name="photoBack" type="file" accept="image/*" capture="environment"/><label>Spine</label><input name="photoSpine" type="file" accept="image/*" capture="environment"/><label>Tape Label</label><input name="photoTape" type="file" accept="image/*" capture="environment"/></div>
            <button>Add Tape</button>
          </form>
        )}

        {view === 'timeline' && (
          <section className="panel">
            <h3>Collection Timeline</h3>
            <p className="small">Add acquisition dates to tapes and your finds appear here by date.</p>
            <div className="timeline">
              {tapes.filter(t=>t.dateAcquired).sort((a,b)=>String(b.dateAcquired).localeCompare(String(a.dateAcquired))).map(t=>(
                <div className="tl-item" key={t.id} onClick={()=>openTape(t.id)}>
                  <strong>{t.dateAcquired}</strong><div>{t.title}</div>
                  <div className="small">{t.purchaseLocation || ''} {t.purchasePrice ? '• $'+t.purchasePrice : ''}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'stats' && (
          <>
            <div className="panel"><h3>Collection Stats</h3><div className="stats">
              {Object.entries(stats).map(([k,v])=><div className="stat" key={k}><strong>{v}</strong><span>{k}</span></div>)}
            </div></div>
            <div className="panel">
              <h3>Backup</h3>
              <p className="small">Back up your collection including photos, edits, added tapes, and wishlist.</p>
              <button onClick={exportBackup}>Export Backup JSON</button>
              <div className="restore-box">
                <label className="restore-label">Import JSON Backup</label>
                <input
                  ref={importBackupRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={e=>importBackupFile(e.target.files?.[0])}
                />
                <p className="small">Choose a backup JSON file to restore tapes, wishlist, and included photos.</p>
              </div>
            </div>
          </>
        )}
      </main>

      {movieNight && (
        <div className="movie-night-overlay">
          <div className="movie-night-card">
            <div className="movie-night-kicker">NOAH'S FEATURE PRESENTATION</div>
            <h2>Choosing Tonight's Tape...</h2>
            <div className="tape-reel">
              {movieNight.reel.map(t => <span key={t.id}>{t.title}</span>)}
            </div>
            <p className="movie-night-hint">Loading surprise selection...</p>
          </div>
        </div>
      )}

      {viewerPhoto && (
        <div className="photo-viewer-overlay">
          <div className="photo-viewer-card zoomable">
            <div className="photo-viewer-head">
              <strong>{viewerPhoto.label || 'Tape Photo'}</strong>
              <div className="zoom-controls">
                <button type="button" className="secondary" onClick={() => zoomPhoto(-0.5)}>−</button>
                <span>{Math.round(viewerZoom * 100)}%</span>
                <button type="button" className="secondary" onClick={() => zoomPhoto(0.5)}>+</button>
                <button type="button" className="secondary" onClick={resetPhotoZoom}>Reset</button>
                <button type="button" className="secondary close-viewer" onClick={closePhotoViewer}>Close</button>
              </div>
            </div>
            <div
              className="zoom-stage"
              onTouchStart={handleViewerTouchStart}
              onTouchMove={handleViewerTouchMove}
              onTouchEnd={handleViewerTouchEnd}
            >
              <img
                src={viewerPhoto.src}
                alt={viewerPhoto.label || 'Tape photo'}
                style={{ transform: `translate(${viewerOffset.x}px, ${viewerOffset.y}px) scale(${viewerZoom})` }}
                onDoubleClick={() => viewerZoom > 1 ? resetPhotoZoom() : setViewerZoom(2)}
              />
            </div>
            <div className="photo-viewer-note">Pinch to zoom, drag to move, or use + / −. Tap Close to return.</div>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        {views.map(([id,ico,label]) => <button key={id} className={view===id?'active':''} onClick={()=>goToView(id, id==='browse' ? {resetBrowse:true} : {})}><span className="ico">{ico}</span><span>{label}</span></button>)}
      </nav>
      <div className={`toast ${toast ? 'show':''}`}>{toast}</div>
    </>
  );
}
