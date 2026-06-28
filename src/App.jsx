
import React, { useEffect, useMemo, useState } from 'react';
import { STARTER_TAPES } from './data.js';
import './main.css';

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

function mainImage(t){
  const tape = normalizeTape(t);
  return tape.cover || tape.photos?.[0]?.src || '';
}

function has(t, regex){
  return regex.test([t.title,t.studio,t.edition,t.packaging,t.notes,t.genre,t.tags].join(' '));
}

function TapeCard({ tape, onOpen, mini=false }){
  const img = mainImage(tape);
  const special = /screener|collector|special|custom|nintendo|disney parks/i.test(tape.edition || '');
  return (
    <article className={`tape-card ${mini ? 'mini-card':''}`} onClick={() => onOpen(tape.id)}>
      <div className={`cover ${img ? 'has-img':''}`}>
        {img ? <img src={img} alt={`${tape.title} cover`} /> : <div className="cover-title">{tape.title}</div>}
      </div>
      <div className="meta">
        <div className="title">{tape.title}</div>
        <div className="small">{tape.vhsYear || 'No year'} • {tape.studio || 'Unknown'}</div>
        <span className={`tag ${special ? 'alt':''}`}>{tape.packaging}</span>
      </div>
    </article>
  );
}

function Shelf({ title, subtitle, tapes, onOpen }){
  return (
    <>
      <div className="section-head"><h3>{title}</h3><span className="small">{subtitle}</span></div>
      <div className="shelf">
        {tapes.length ? tapes.map(t => <TapeCard key={t.id} tape={t} onOpen={onOpen} mini />) : <div className="panel small">Nothing here yet.</div>}
      </div>
    </>
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
  const [view,setView] = useState('home');
  const [query,setQuery] = useState('');
  const [pkg,setPkg] = useState('');
  const [edition,setEdition] = useState('');
  const [selectedId,setSelectedId] = useState(null);
  const [selectedPhoto,setSelectedPhoto] = useState(0);
  const [toast,setToast] = useState('');
  const [editOpen,setEditOpen] = useState(false);
  const [form,setForm] = useState({});

  useEffect(()=>{localStorage.setItem('noahVhs6_tapes', JSON.stringify(tapes));},[tapes]);
  useEffect(()=>{localStorage.setItem('noahVhs6_wishlist', JSON.stringify(wishlist));},[wishlist]);

  function notify(msg){ setToast(msg); setTimeout(()=>setToast(''), 2400); }
  function openTape(id){ setSelectedId(id); setSelectedPhoto(0); setEditOpen(false); setView('detail'); }
  const selected = tapes.find(t => t.id === selectedId);

  const filtered = useMemo(() => {
    let list = tapes.filter(t => [t.title,t.studio,t.edition,t.packaging,t.notes,t.genre,t.tags,t.vhsYear].join(' ').toLowerCase().includes(query.toLowerCase()));
    if(pkg) list = list.filter(t => t.packaging === pkg);
    if(edition) list = list.filter(t => has(t, new RegExp(edition,'i')));
    return list.sort((a,b)=>a.title.localeCompare(b.title));
  }, [tapes, query, pkg, edition]);

  const stats = {
    total: tapes.length,
    photos: tapes.filter(t => mainImage(t)).length,
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

  function addPhoto(label, file){
    if(!selected || !file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const photo = {src:e.target.result, label, date:new Date().toISOString().slice(0,10)};
      const photos = [...(selected.photos || []), photo];
      updateTape(selected.id, {photos, cover: selected.cover || photo.src});
      notify(`${label} added.`);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(i){
    if(!selected) return;
    const photos = [...(selected.photos || [])];
    const removed = photos.splice(i,1)[0];
    const cover = selected.cover === removed?.src ? (photos[0]?.src || '') : selected.cover;
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

  function addTape(e){
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title')?.trim();
    if(!title){ notify('Add a title first.'); return; }
    const next = 'VHS-' + String(tapes.length + 1).padStart(4,'0');
    setTapes(prev => [...prev, normalizeTape({
      id: next,
      title,
      vhsYear: fd.get('vhsYear') || '',
      studio: fd.get('studio') || 'Unknown',
      edition: fd.get('edition') || 'Standard',
      packaging: fd.get('packaging') || 'Sleeve',
      genre: fd.get('genre') || 'Other',
      tapeCondition: fd.get('tapeCondition') || '',
      notes: fd.get('notes') || '',
      dateAcquired: new Date().toISOString().slice(0,10)
    })]);
    e.currentTarget.reset();
    notify('Tape added.');
    setView('browse');
  }

  function exportBackup(){
    const blob = new Blob([JSON.stringify({version:'6.0', tapes, wishlist}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'noahs-vhs-archive-6-backup.json';
    a.click();
  }

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="ticket">VHS</div>
          <div><h1>NOAH'S VHS ARCHIVE</h1><div className="sub">Production foundation • 6.2</div></div>
        </div>
      </header>

      <main>
        {view === 'home' && (
          <>
            <section className="hero">
              <h2>Your personal video store.</h2>
              <p>Version 6.2 is the cleaner app foundation: React project structure, organized data, collector-first fields, shelves, photos, timeline, and GitHub Pages-ready PWA files.</p>
              <div className="actions">
                <button onClick={()=>setView('browse')}>Browse the Shelves</button>
                <button className="secondary" onClick={()=>setView('timeline')}>Collection Timeline</button>
              </div>
              <div className="stats">
                <div className="stat"><strong>{stats.total}</strong><span>Total Tapes</span></div>
                <div className="stat"><strong>{stats.photos}</strong><span>With Photos</span></div>
                <div className="stat"><strong>{stats.favorites}</strong><span>Favorites</span></div>
                <div className="stat"><strong>{stats.watched}</strong><span>Watched</span></div>
                <div className="stat"><strong>{stats.screeners}</strong><span>Screeners</span></div>
                <div className="stat"><strong>{stats.specials}</strong><span>Special Tapes</span></div>
                <div className="stat"><strong>{stats.clamshells}</strong><span>Clamshells</span></div>
                <div className="stat"><strong>{stats.sleeves}</strong><span>Sleeves</span></div>
              </div>
            </section>
            <Shelf title="New Arrivals" subtitle="Latest archive IDs" tapes={[...tapes].slice(-12).reverse()} onOpen={openTape}/>
            <Shelf title="Staff Picks" subtitle="Favorites" tapes={tapes.filter(t=>t.favorite).slice(0,16)} onOpen={openTape}/>
            <Shelf title="Special Shelf" subtitle="Screeners & variants" tapes={tapes.filter(t=>has(t,/screener|collector|special|nintendo|disney parks|custom|lenticular|metallic|2-tape|blue tape/i)).slice(0,16)} onOpen={openTape}/>
            <Shelf title="Photo Shelf" subtitle="Your real tape photos" tapes={tapes.filter(t=>mainImage(t)).slice(0,14)} onOpen={openTape}/>
          </>
        )}

        {view === 'browse' && (
          <>
            <div className="controls">
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title, studio, edition, notes, tags..." />
              <select value={pkg} onChange={e=>setPkg(e.target.value)}><option value="">All packaging</option><option>Sleeve</option><option>Cardboard Sleeve</option><option>Clamshell</option></select>
              <select value={edition} onChange={e=>setEdition(e.target.value)}><option value="">All editions</option><option>Standard</option><option>Screener</option><option>Collector</option><option>Special</option><option>Nintendo</option><option>Disney Parks</option><option>Custom</option><option>Widescreen</option></select>
            </div>
            <div className="small" style={{margin:'8px 2px 14px'}}>{filtered.length} tapes showing • Title A-Z</div>
            <div className="grid">{filtered.map(t => <TapeCard key={t.id} tape={t} onOpen={openTape}/>)}</div>
          </>
        )}

        {view === 'detail' && selected && (
          <section>
            <button className="secondary" onClick={()=>setView('browse')}>← Back to collection</button>
            <div className="detail-layout" style={{marginTop:14}}>
              <div>
                <div className={`bigcover ${mainImage(selected) ? 'has-img':''}`}>
                  {(() => {
                    const images = [selected.cover ? {src:selected.cover,label:'Main Cover'} : null, ...(selected.photos || [])].filter(Boolean);
                    const img = images[selectedPhoto];
                    return img ? <img src={img.src} alt={img.label}/> : <div className="bigcover-title">{selected.title}</div>;
                  })()}
                </div>
                <div className="photo-carousel">
                  {[selected.cover ? {src:selected.cover,label:'Main Cover'} : null, ...(selected.photos || [])].filter(Boolean).map((p,i)=>(
                    <div key={i} className={`carousel-thumb ${i===selectedPhoto?'active':''}`} onClick={()=>setSelectedPhoto(i)}>
                      <img src={p.src}/><span>{p.label || 'Photo'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-card">
                <h2>{selected.title}</h2>
                <div className="actions">
                  <button onClick={()=>updateTape(selected.id,{favorite:!selected.favorite})}>⭐ {selected.favorite ? 'Unfavorite':'Favorite'}</button>
                  <button className="secondary" onClick={()=>updateTape(selected.id,{watched:!selected.watched})}>▶ {selected.watched ? 'Unwatch':'Watched'}</button>
                </div>
                {[
                  ['Archive ID',selected.id],['VHS Release',selected.vhsYear || 'No year listed'],['Studio',selected.studio],['Edition',selected.edition],['Packaging',selected.packaging],['Genre',selected.genre],['Tape Condition',selected.tapeCondition || selected.condition || 'Not set'],['Sleeve Condition',selected.sleeveCondition || 'Not set'],['Inserts',selected.inserts || 'Not set'],['Rating',selected.rating ? selected.rating + '/5':'Not rated'],['Acquired',selected.dateAcquired || 'Not set'],['Found At',selected.purchaseLocation || 'Not set'],['Price',selected.purchasePrice ? '$'+selected.purchasePrice:'Not set'],['Tags',selected.tags || ''],['Notes',selected.notes || '']
                ].map(([a,b])=><div className="row" key={a}><span>{a}</span><span>{b}</span></div>)}

                <div className="panel">
                  <h3>Tape Photos</h3>
                  <p className="small">Use your camera for front cover, back cover, spine, tape label, or choose from gallery.</p>
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
                        <img src={p.src}/><div className="photo-label">{p.label}</div>
                        <button onClick={()=>removePhoto(i)}>Remove</button>
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
            <label>Title</label><input name="title"/>
            <label>VHS Release Year</label><input name="vhsYear"/>
            <label>Studio / Distributor</label><input name="studio"/>
            <label>Edition</label><select name="edition"><option>Standard</option><option>Widescreen</option><option>Screener</option><option>Collector's Edition</option><option>Special Edition</option><option>Custom Tape</option><option>Nintendo Power</option><option>Disney Parks</option></select>
            <label>Packaging</label><select name="packaging"><option>Sleeve</option><option>Cardboard Sleeve</option><option>Clamshell</option></select>
            <label>Genre</label><select name="genre"><option>Other</option><option>Action / Adventure</option><option>Comedy</option><option>Family</option><option>Sci‑Fi / Fantasy</option></select>
            <label>Tape Condition</label><select name="tapeCondition"><option></option><option>Mint</option><option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option><option>Poor</option></select>
            <label>Notes</label><textarea name="notes" rows="4"/>
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
              <button className="danger" style={{marginTop:10}} onClick={()=>{localStorage.removeItem('noahVhs6_tapes');location.reload();}}>Reset Starter Archive</button>
            </div>
          </>
        )}
      </main>

      <nav className="bottom-nav">
        {views.map(([id,ico,label]) => <button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><span className="ico">{ico}</span><span>{label}</span></button>)}
      </nav>
      <div className={`toast ${toast ? 'show':''}`}>{toast}</div>
    </>
  );
}
