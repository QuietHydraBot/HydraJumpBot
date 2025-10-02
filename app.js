/*********** 
     ____.          .___      .__  /\         _________            .___             
    |    | ____   __| _/____  |  |_)/  ______ \_   ___ \  ____   __| _/____ ___  ___
    |    |/  _ \ / __ |\__  \ |  |  \ /  ___/ /    \  \/ /  _ \ / __ |/ __ \\  \/  /
/\__|    (  <_> ) /_/ | / __ \|   Y  \\___ \  \     \___(  <_> ) /_/ \  ___/ >    < 
\________|\____/\____ |(____  /___|  /____  >  \______  /\____/\____ |\___  >__/\_ \
                     \/     \/     \/     \/          \/            \/    \/      \/                
Hydra Jump Bot - JS local build by KayJ and friends*/

(()=>{
  const LS_KEY='jumpstart_collection_v1';
  const LS_FAIR='jumpstart_fair_stats_v1';
  const LS_HISTORY = 'jumpstart_draft_history_v1';
  const $=id=>document.getElementById(id);
  const on=(el,ev,fn)=>el&&el.addEventListener(ev,fn);
  const uid=()=>Math.random().toString(36).slice(2,10);
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const NO_TAGS = '__NO_TAGS__';

  const chips=(colors)=>`<div class="colors">${colors.map(c=>`<span class="c ${c}">${c}</span>`).join('')}</div>`;
  const typeOf=p=>p.colors.length===1?'Mono':(p.colors.length===2?'Two-Color':(p.colors.length===3?'Tri-Color':''));
  const typeChip=p=>{const t=typeOf(p); if(t==='Mono')return `<span class="ctype mono">Mono</span>`; if(t==='Two-Color')return `<span class="ctype bi">Two-Color</span>`; if(t==='Tri-Color')return `<span class="ctype tri">Tri-Color</span>`; return '';};

  const isMono=p=>p.colors.length===1, isBi=p=>p.colors.length===2, isTri=p=>p.colors.length===3;
  const pickRandom=(arr,n)=>{const a=arr.slice(),r=[];while(a.length&&r.length<n){r.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);}return r;};
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function weightedSample(pool,n,weightFn){const items=pool.slice(),res=[];while(items.length&&res.length<n){const w=items.map(weightFn);const tot=w.reduce((a,b)=>a+b,0);let r=Math.random()*tot,idx=0;for(;idx<items.length;idx++){r-=w[idx];if(r<=0)break;}res.push(items.splice(Math.min(idx,items.length-1),1)[0]);}return res;}

  const state={
    storageOK:true,
    collection:[],
    fair:{},
    session:{firstOptions:[],chosenFirst:null,secondOptions:[],chosenSecond:null,usedIds:new Set()},
    settings:{
      excludeUnpicked:false,
      relaxIfStuck:true,
      overlapColor:'AUTO',
      setFilter:[],
      colorFilter:[],
      optionsPerRoll:3,
      triSharePct:10,
      capOneTri:true,
      fairMode:true,
      avoidCollisions:true,
      players:2,
      view:'collection',
      sortBy:'name',
      sortDir:'asc',
      pageSize:20,
      page:1,
      search:'',
      hasDeckOnly:false,
      ctypeFilter:[],
      colorMode:'any',
      minOffered:0,
      minPicked:0,
      minPickRate:0,
      maxPickRate:100
  }};

const settingsDefaults = {
  excludeUnpicked:false,
  relaxIfStuck:true,
  overlapColor:'AUTO',
  setFilter:[],
  colorFilter:[],
  optionsPerRoll:3,
  triSharePct:10,
  capOneTri:true,
  fairMode:true,
  avoidCollisions:true,
  players:2,
  view:'collection',
  sortBy:'name',
  sortDir:'asc',
  pageSize:20,
  page:1,
  search:'',
  hasDeckOnly:false,
  ctypeFilter:[],
  colorMode:'any',
  minOffered:0,
  minPicked:0,
  minPickRate:0,
  maxPickRate:100,
  includeDeckSearch:false,
  tagFilter:[],
  themeFilter:[] 
};

// independent settings
state.settingsCollection = structuredClone(settingsDefaults);
state.settingsPlay = structuredClone(settingsDefaults);

// helper to pick a settings bag
function S(view){ return view==='play' ? state.settingsPlay : state.settingsCollection; }

state.newPackDeck = [];


const vb = document.getElementById('appVersion');
if (vb) {
  const v = (window.HYDRA_VERSION || 'dev');
  vb.textContent = 'v' + v;
  vb.setAttribute('aria-label', `Hydra Jump Bot version ${v}`);
}




/* Storage */
function setStorageStatus(level){
  const el=$('storageStatus'); 
  if(!el) return; 
  el.textContent=level==='ok'?'Storage: OK':'Storage: Limited'; 
  el.className='badge '+(level==='ok'?'ok':'warn');
}
function loadCollection(){
  try{const raw=localStorage.getItem(LS_KEY); 
    if(!raw){setStorageStatus('ok'); 
      return [];} const arr=JSON.parse(raw);
      setStorageStatus('ok'); 
      return Array.isArray(arr)?arr.filter(p=>p&&p.id&&p.name&&Array.isArray(p.colors)&&p.colors.length>=1&&p.colors.length<=3):[];}catch(e){state.storageOK=false; 
        setStorageStatus('limited'); 
        return [];
}}
function loadFair(){
  try{const raw=localStorage.getItem(LS_FAIR); 
    return raw?(JSON.parse(raw)||{}):{};}
    catch{ return {}; 
  }}
function saveAll(silent){
  try{
    if(state.storageOK){
      localStorage.setItem(LS_KEY, JSON.stringify(state.collection));
      localStorage.setItem(LS_FAIR, JSON.stringify(state.fair));
    }
    setStorageStatus('ok');
  }catch(e){
    state.storageOK=false;
    setStorageStatus('limited');
  }
  if(!silent){ renderEverything(); }
}

  /* Storage Health Thing */
  function formatBytes(n){
  if(!n) return '0 B';
  const u = ['B','KB','MB','GB'];
  let i = 0;
  while(n >= 1024 && i < u.length - 1){ n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

async function refreshStorageHealth(){
  let lsBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k) || '';
      lsBytes += (k.length + v.length) * 2;
    }
  } catch { /* ignore this */ }

  const LS_CAP = 5 * 1024 * 1024;
  const pct = Math.min(100, Math.round((lsBytes / LS_CAP) * 100));

  $('storeBar').style.width = pct + '%';
  $('storeLine').textContent = `Using ${formatBytes(lsBytes)} of 5 MB (${pct}%)`;
  $('storeHint').textContent = `Stored locally in your browser. Private/Incognito may not keep around.`;
}




function parseSearchQuery(q){
  const out = {
    text:[], notText:[],
    fields:{ type:[], tag:[], set:[], theme:[], name:[] },
    notFields:{ type:[], tag:[], set:[], theme:[], name:[] }
  };
  if(!q) return out;

  const rx = /"([^"]+)"|(\S+)/g;
  let m;
  while((m = rx.exec(q))){
    const raw = (m[1] ?? m[2] ?? '').trim();
    if(!raw) continue;

    const neg = raw.startsWith('-');
    const tok = neg ? raw.slice(1) : raw;
    const fieldMatch = tok.match(/^(\w+):(.*)$/);
    if(fieldMatch){
      const key = fieldMatch[1].toLowerCase();
      const val = fieldMatch[2].trim();
      if(!val) continue;
      if(out.fields[key] || out.notFields[key]){
        (neg ? out.notFields[key] : out.fields[key]).push(val.toLowerCase());
      }else{
        // unknown field - - treat as text
        (neg ? out.notText : out.text).push(tok.toLowerCase());
      }
    }else{
      (neg ? out.notText : out.text).push(tok.toLowerCase());
    }
  }
  return out;
}

function packHasType(p, needle){
  const deck = Array.isArray(p.deck)?p.deck:[];
  const n = needle.toLowerCase();
  return deck.some(d => String(d.type||'').toLowerCase().includes(n));
}


  /* Filters/Sort/Paging Stuff */

function matchFilters(p, settings = state.settingsCollection){
  const s = settings;

  // --- set filter ---
  if(s.setFilter.length){
    const key = p.set ? p.set : 'Unlabeled';
    if(!s.setFilter.includes(key)) return false;
  }

  // --- color filter with mode ---
  if(s.colorFilter.length){
    const want = s.colorFilter;
    const mode = s.colorMode || 'any';
    if(mode === 'all'){
      if(!want.every(c => p.colors.includes(c))) return false;
    } else if(mode === 'exact'){
      const a = [...p.colors].sort().join('');
      const b = [...want].sort().join('');
      if(a !== b) return false;
    } else { // any
      if(!p.colors.some(c => want.includes(c))) return false;
    }
  }

  // --- keyword search ---
// --- keyword search with mini syntax ---
const q = String(s.search || '').trim();
if(q){
  const parsed = parseSearchQuery(q);
  const useDeck = !!s.includeDeckSearch;

  const plainHay = [p.name||'', p.theme||'', p.set||'Unlabeled'].join(' ').toLowerCase();
  const deckHay  = useDeck && Array.isArray(p.deck) && p.deck.length
    ? p.deck.map(d => `${d.name||''} ${d.type||''}`.toLowerCase()).join(' ')
    : '';
  const hay = useDeck ? `${plainHay} ${deckHay}` : plainHay;

  // plain includes/all and excludes
  const okPlain = parsed.text.every(t => hay.includes(t))
                && parsed.notText.every(t => !hay.includes(t));
  if(!okPlain) return false;

  // fielded: type (deck types)
  if(parsed.fields.type.length && !parsed.fields.type.every(v => packHasType(p, v))) return false;
  if(parsed.notFields.type.length && parsed.notFields.type.some(v => packHasType(p, v))) return false;

  // fielded: tag (exact; case-insensitive)
  const tags = (Array.isArray(p.tags)?p.tags:[]).map(x=>x.toLowerCase());
  if(parsed.fields.tag.length && !parsed.fields.tag.every(v => tags.includes(v))) return false;
  if(parsed.notFields.tag.length && parsed.notFields.tag.some(v => tags.includes(v))) return false;

  // fielded: set/theme/name (substring match)
  const setLC   = String(p.set||'Unlabeled').toLowerCase();
  const themeLC = String(p.theme||'').toLowerCase();
  const nameLC  = String(p.name||'').toLowerCase();

  if(parsed.fields.set.length   && !parsed.fields.set.every(v => setLC.includes(v)))     return false;
  if(parsed.notFields.set.length && parsed.notFields.set.some(v => setLC.includes(v)))   return false;
  if(parsed.fields.theme.length && !parsed.fields.theme.every(v => themeLC.includes(v))) return false;
  if(parsed.notFields.theme.length && parsed.notFields.theme.some(v => themeLC.includes(v))) return false;
  if(parsed.fields.name.length  && !parsed.fields.name.every(v => nameLC.includes(v)))   return false;
  if(parsed.notFields.name.length && parsed.notFields.name.some(v => nameLC.includes(v))) return false;
  }

  // --- has deck only ---
  if(s.hasDeckOnly){
    if(!Array.isArray(p.deck) || p.deck.length === 0) return false;
  }

  // --- type filter ---
  if(Array.isArray(s.ctypeFilter) && s.ctypeFilter.length){
    if(!s.ctypeFilter.includes(p.colors.length)) return false;
  }

// --- theme filter (OR)
if(Array.isArray(s.themeFilter) && s.themeFilter.length){
  const key = p.theme ? p.theme : 'Unlabeled';
  if(!s.themeFilter.includes(key)) return false;
}

// --- tag filter (OR)
if (Array.isArray(s.tagFilter) && s.tagFilter.length) {
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const wantsNoTags = s.tagFilter.includes(NO_TAGS);
  const isUntagged  = tags.length === 0;
  const hitsReal    = tags.some(t => s.tagFilter.includes(t));

  if (!(hitsReal || (wantsNoTags && isUntagged))) {
    return false;
  }
}


  // --- numeric usage filters ---
  const off = offeredOf(p);
  const pk  = pickedOf(p);
  const pr  = pickRateOf(p);
  if(off < (s.minOffered || 0)) return false;
  if(pk  < (s.minPicked  || 0)) return false;
  if(pr  < (s.minPickRate || 0)) return false;
  if(pr  > (s.maxPickRate ?? 100)) return false;

  return true;
}


  function computeSetCounts(){const m=new Map(); for(const p of state.collection){const k=p.set?p.set:'Unlabeled'; m.set(k,(m.get(k)||0)+1);} return m;}


function renderSetFilter(seedSettings = activeSettings(), containerId = 'setFilterBox'){
  const counts = computeSetCounts();
  const all = Array.from(counts.keys()).sort((a,b)=>a.localeCompare(b));
  const box = $(containerId), eligible = $('eligibleCount');
    if(!box) return;

  // Mark which settings bag this instance represents
  const scope = (seedSettings === state.settingsPlay) ? 'play' : 'collection';
  box.dataset.scope = scope;

  if(!all.length){
    box.innerHTML = '<div class="tiny">No sets yet.</div>';
    seedSettings.setFilter = [];
    if(eligible) eligible.textContent = 'Eligible after filter: 0';
    return;
  }

  // Render chips using the provided settings bag
  box.classList.add('set-grid');
  box.innerHTML = all.map(s=>{
    const count = counts.get(s)||0;
    const on = seedSettings.setFilter.includes(s);
    const safe = esc(s);
    return `<div role="button" tabindex="0"
                 class="set-chip ${on?'active':''}"
                 data-set="${safe}"
                 aria-pressed="${on?'true':'false'}">
              <span class="name">${safe}</span>
              <span class="count">${count}</span>
            </div>`;
  }).join('');

  // Helper that always resolves the current scope on interaction
  const currentSettings = () =>
    (box.dataset.scope === 'play') ? state.settingsPlay : state.settingsCollection;

  const toggle = (el)=>{
    const s = currentSettings();
    const setKey = el?.dataset?.set; if(!setKey) return;
    const on = s.setFilter.includes(setKey);

    if(on){
      s.setFilter = s.setFilter.filter(x=>x!==setKey);
      el.classList.remove('active'); el.setAttribute('aria-pressed','false');
    }else{
      s.setFilter.push(setKey);
      el.classList.add('active'); el.setAttribute('aria-pressed','true');
    }

    if(eligible) eligible.textContent = `Eligible after filter: ${eligibleAfterFilter(s)}`;
    renderGuardrails(s);
    if(s === state.settingsCollection){
      s.page = 1;
      renderCollection();
    }
  };

  if(!box.__bound){
    box.addEventListener('click', (e)=>{
      const el = e.target.closest('.set-chip'); if(!el) return; toggle(el);
    });
    box.addEventListener('keydown', (e)=>{
      if(e.key===' ' || e.key==='Enter'){
        const el = e.target.closest('.set-chip'); if(!el) return;
        e.preventDefault(); toggle(el);
      }
    });
    box.__bound = true;
  }

  if(eligible) eligible.textContent = `Eligible after filter: ${eligibleAfterFilter(seedSettings)}`;
}



function renderColorFilter(seedSettings = activeSettings(), containerId = 'colorFilterBox'){
  const wrap = $(containerId);
  if(!wrap) return;
  const colors = ['W','U','B','R','G','C'];

  // Mark which settings bag this instance represents
  const scope = (seedSettings === state.settingsPlay) ? 'play' : 'collection';
  wrap.dataset.scope = scope;

  // Render using the provided settings bag
  wrap.innerHTML = colors.map(c=>{
    const on = seedSettings.colorFilter.includes(c);
    return `<button type="button"
              class="mana-btn c ${c} ${on?'selected':''}"
              data-color="${c}"
              aria-pressed="${on?'true':'false'}">${c}</button>`;
  }).join('');

  const currentSettings = () =>
    (wrap.dataset.scope === 'play') ? state.settingsPlay : state.settingsCollection;

  if(!wrap.__bound){
    wrap.addEventListener('click', (e)=>{
      const btn = e.target.closest('.mana-btn');
      if(!btn || !wrap.contains(btn)) return;

      const s = currentSettings();
      const c = btn.dataset.color;
      const list = s.colorFilter;
      const i = list.indexOf(c);
      if(i === -1) list.push(c); else list.splice(i,1);

      btn.classList.toggle('selected');
      btn.setAttribute('aria-pressed', btn.classList.contains('selected') ? 'true' : 'false');

      const eligible=$('eligibleCount');
      if(eligible) eligible.textContent = `Eligible after filter: ${eligibleAfterFilter(s)}`;
      renderGuardrails(s);

      if(s === state.settingsCollection){
        s.page = 1;
        renderCollection();
      }
    });
    wrap.__bound = true;
  }
}





  function offeredOf(p){return state.fair[p.id]?.offer||0;}
  function pickedOf(p){ return state.fair[p.id]?.pick || 0; }
function pickRateOf(p){
  const off = offeredOf(p);
  const pk  = pickedOf(p);
  return off ? Math.round((pk / off) * 100) : 0;
}


function usageTag(p, settings){
  const s = settings || activeSettings();
if(!s.fairMode) return '';
  return `<span class="usage">off: ${offeredOf(p)} · pick: ${pickedOf(p)} · ${pickRateOf(p)}%</span>`;
}
function offerTag(p, settings = state.settingsCollection){
  if(!settings.fairMode) return '';
  const c=offeredOf(p); 
  return `<span class="offer">offered: ${c}</span>`;
}



function ensureFairEntry(id){
  if(!state.fair[id]) state.fair[id] = { offer:0, pick:0 };
  if(typeof state.fair[id].offer !== 'number') state.fair[id].offer = Number(state.fair[id].offer)||0;
  if(typeof state.fair[id].pick  !== 'number') state.fair[id].pick  = Number(state.fair[id].pick)||0;
}
function incPick(p){
  if(!state.settingsPlay.fairMode) return;
  ensureFairEntry(p.id);
  state.fair[p.id].pick++;
  saveAll(true);
}

  function colorTypeRank(p){return p.colors.length;}
  
  
  
  
/**
 * 
 *
 * 
 * Sorting helpers
 * 
 
 * 
 **/
 
  
function comparePacks(a,b, settings = state.settingsCollection){
  const dir = settings.sortDir==='asc'?1:-1;
  let r=0;
  switch(settings.sortBy){
    case 'name':   r = a.name.localeCompare(b.name); break;
    case 'set':    r = (a.set||'').localeCompare(b.set||''); break;
    case 'theme':  r = (a.theme||'').localeCompare(b.theme||''); break;
    case 'ctype':  r = colorTypeRank(a)-colorTypeRank(b);
      if(r===0) r=a.colors.join('').localeCompare(b.colors.join(''));
      if(r===0) r=a.name.localeCompare(b.name); break;
    case 'offered':r = offeredOf(a)-offeredOf(b);
      if(r===0) r=a.name.localeCompare(b.name); break;
    default:       r = a.name.localeCompare(b.name);
  }
  return r*dir;
}  

function sortedFiltered(settings = state.settingsCollection){
  return state.collection.filter(p=>matchFilters(p, settings)).slice().sort((a,b)=>comparePacks(a,b,settings));
}  
 
function eligibleAfterFilter(settings = state.settingsCollection){
  return state.collection.filter(p=>matchFilters(p, settings)).length;
} 
  
 
function renderPaginationControls(total, settings = state.settingsCollection){
  const ps=settings.pageSize, pages=Math.max(1,Math.ceil(total/ps));
  if(settings.page>pages) settings.page=pages;
  $('pageInfo').textContent=`Page ${settings.page} / ${pages}`;
  $('prevPage').disabled=settings.page<=1; $('nextPage').disabled=settings.page>=pages;
  $('jumpPage').max=pages; $('jumpPage').value=settings.page;
}
  
function activeSettings(){
  return state.settingsCollection.view === 'play'
    ? state.settingsPlay
    : state.settingsCollection;
}



function packRowHtml(p, settings = state.settingsCollection){
  const tags = Array.isArray(p.tags)?p.tags:[];
  return `<div class="pack" id="row_${p.id}">
    <div class="pill">
      <strong>${esc(p.name)}</strong>
      <div class="meta">
        ${p.theme?`<span class="theme">${esc(p.theme)}</span>`:''}
        ${chips(p.colors)} ${typeChip(p)}
        ${p.set?`<span class="tag">${esc(p.set)}</span>`:'<span class="tag">Unlabeled</span>'}
        ${usageTag(p, settings)}
      </div>
      ${tags.length ? `
        <div class="meta" style="margin-top:6px">
          ${tags.map(t=>`<span class="tag" style="opacity:.85">#${esc(t)}</span>`).join(' ')}
        </div>` : ''}
    </div>
    <div class="pill">
      <button class="btn btn-gray" data-view="${p.id}">View Deck</button>
      <button class="btn btn-gray" data-edit="${p.id}">Edit</button>
      <button class="btn btn-danger" data-del="${p.id}">Delete</button>
    </div>
  </div>`;
}
 
  function colorOptions(sel){
    const all=['','W','U','B','R','G','C']; 
    return all.map(c=>`<option value="${c}" ${c===sel?'selected':''}>${c||'—'}</option>`).join('');
  }
  
function bindPackRowButtons(){
  document.querySelectorAll('button[data-del]')
    .forEach(b=> b.addEventListener('click', ()=>{ state.collection = state.collection.filter(p=>p.id!==b.dataset.del); saveAll(); }));

  document.querySelectorAll('button[data-edit]')
    .forEach(b=> b.addEventListener('click', ()=> startInlineEdit(b.dataset.edit)));

  document.querySelectorAll('button[data-view]')  // NEW
    .forEach(b=> b.addEventListener('click', ()=>{
      const p = state.collection.find(x=>x.id===b.dataset.view);
      if(!p) return;
      openModal({
        title: `Deck — ${p.name}`,
        okText: 'Close',
        bodyHTML: renderDeckColumnsHTML(Array.isArray(p.deck) ? p.deck : []),
        onOK: ()=>{}  // just close
      });
    }));
}



function startInlineEdit(id){
  const p = state.collection.find(x=>x.id===id);
  if(!p) return;
  const row = $('row_'+id);



row.innerHTML = `
  <div style="flex:1">
    <div class="inline-edit">
      <div class="row">
        <div><label>Name</label><input id="e_name_${id}" type="text" value="${esc(p.name)}"></div>
        <div><label>Theme</label><input id="e_theme_${id}" type="text" value="${esc(p.theme||'')}"></div>
        <div><label>Set / Box</label><input id="e_set_${id}" type="text" value="${esc(p.set||'')}"></div>
      </div>

      <div class="row">
        <div style="flex:1">
          <div class="tiny mana-label" id="e_hint_${id}">Select 1–3 colors.</div>
          <div id="e_grid_${id}" class="mana-grid" role="group" aria-labelledby="e_hint_${id}">
            <button type="button" class="mana-btn c W" data-color="W" aria-pressed="false">W</button>
            <button type="button" class="mana-btn c U" data-color="U" aria-pressed="false">U</button>
            <button type="button" class="mana-btn c B" data-color="B" aria-pressed="false">B</button>
            <button type="button" class="mana-btn c R" data-color="R" aria-pressed="false">R</button>
            <button type="button" class="mana-btn c G" data-color="G" aria-pressed="false">G</button>
            <button type="button" class="mana-btn c C" data-color="C" aria-pressed="false">C</button>
          </div>
          <input type="hidden" id="e_c1_${id}" value="">
          <input type="hidden" id="e_c2_${id}" value="">
          <input type="hidden" id="e_c3_${id}" value="">
        </div>
      </div>

<div class="row">
  <div style="flex:1">
    <label>Tags</label>
    <div id="e_tags_wrap_${id}" class="tiny" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px"></div>
    <div style="display:flex;gap:6px;margin-top:6px;align-items:flex-end">
      <input id="e_tag_input_${id}" type="text" placeholder="Add tag and press Enter">
      <button class="btn btn-gray" id="e_tag_add_${id}" type="button">Add</button>
    </div>
    <input type="hidden" id="e_tags_hidden_${id}" value="">
  </div>
</div>



      <div class="row">

<details open>
  <summary>Deck (optional)</summary>

  <!-- row: single-add -->
  <div class="row" style="align-items:flex-end">
    <div class="ac-wrap">
      <label>Name</label>
      <input id="d_name_${id}" type="text" placeholder="Card Name">
      <div id="d_suggest_${id}" class="ac-list" style="display:none"></div>
    </div>
    <div><label>Qty</label><input id="d_qty_${id}" type="number" min="1" step="1" value="1"></div>
    <div><label>Mana Cost</label><input id="d_mana_${id}" type="text" placeholder="e.g., {1}{G}"></div>
    <div><label>Type Line</label><input id="d_type_${id}" type="text" placeholder="e.g., Creature — Elf Druid"></div>
    <div style="flex:0 0 auto">
      <button class="btn btn-gray" id="d_add_${id}" type="button">Add</button>
    </div>
  </div>

  <!-- row: bulk paste -->
<div class="row">
  <div style="flex:0 0 auto">
    <button class="btn btn-cyan" id="d_bulk_open_${id}" type="button">Bulk Paste…</button>
  </div>
</div>

  <div id="d_list_${id}" class="tiny" style="margin-top:6px"></div>
</details>




      </div>
    </div>
  </div>
  <div class="pill" style="align-self:flex-start">
    <button class="btn btn-cyan" data-save="${id}">Save</button>
    <button class="btn btn-gray" data-cancel="${id}">Cancel</button>
  </div>`;


  // --- Tags editor (scoped to this edit row) ---
(function(){
  let editTags = Array.isArray(p.tags) ? [...p.tags] : [];
  const wrap  = $(`e_tags_wrap_${id}`);
  const input = $(`e_tag_input_${id}`);
  const hid   = $(`e_tags_hidden_${id}`);

  function normalizeTag(s){
    return s.trim().replace(/\s+/g,' ').replace(/^#+/,''); // no leading '#'
  }
  function syncHidden(){ hid.value = JSON.stringify(editTags); }
  function renderChips(){
    if(!wrap) return;
    wrap.innerHTML = editTags.length
      ? editTags.map((t,i)=>`
          <span class="tag" style="display:inline-flex;align-items:center;gap:6px">
            #${esc(t)} <button type="button" data-del-tag="${i}" class="btn btn-danger" style="padding:2px 6px">×</button>
          </span>`).join('')
      : `<span class="hint">No tags yet.</span>`;
    wrap.querySelectorAll('button[data-del-tag]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const i = parseInt(b.dataset.delTag, 10);
        editTags.splice(i,1);
        renderChips(); syncHidden();
      });
    });
  }

  $(`e_tag_add_${id}`)?.addEventListener('click', ()=>{
    const t = normalizeTag(input.value);
    if(t && !editTags.map(x=>x.toLowerCase()).includes(t.toLowerCase())){
      editTags.push(t);
      renderChips(); syncHidden();
    }
    input.value='';
  });
  input?.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); $(`e_tag_add_${id}`)?.click(); }
  });

  renderChips(); syncHidden();
})();


  // Save/Cancel listeners
  row.querySelector(`[data-save="${id}"]`).addEventListener('click',()=>saveInlineEdit(id));
  row.querySelector(`[data-cancel="${id}"]`).addEventListener('click',()=>renderCollection());




row.querySelector(`#d_bulk_open_${id}`)?.addEventListener('click', ()=>{
  openModal({
    title: 'Bulk Paste',
    okText: 'Parse & Add',
    bodyHTML: `
      <div class="tiny" style="margin-bottom:6px">One per line (e.g., “2 Llanowar Elves”, “Lightning Bolt x3”, “Forest”)</div>
      <textarea id="bulk_ta_${id}" rows="10" style="width:100%"></textarea>
    `,
    onOpen: ()=>{ $(`bulk_ta_${id}`)?.focus(); },
    onOK: async ()=>{
      const ta = $(`bulk_ta_${id}`); if(!ta) return;
      const items = parseDeckText(ta.value);
      if(!items.length) return;

      const enriched = await enrichWithScryfallMin(items);

      const pidx = state.collection.findIndex(x=>x.id===id);
      if(pidx < 0) return;
      const current = Array.isArray(state.collection[pidx].deck) ? state.collection[pidx].deck : [];
      const map = new Map(current.map(d=>[d.name.toLowerCase(), { ...d }]));

      for(const it of enriched){
        const k = it.name.toLowerCase();
        const prev = map.get(k);
        if(prev){
          prev.qty += Math.max(1, it.qty|0);
          if(!prev.mana && it.mana) prev.mana = it.mana;
          if(!prev.type && it.type) prev.type = it.type;
        }else{
          map.set(k, normalizeDeckItem(it));
        }
      }

      const merged = Array.from(map.values()).map(normalizeDeckItem).filter(Boolean);
      state.collection[pidx] = { ...state.collection[pidx], deck: merged };
      saveAll(true);
      (typeof renderDeckEditor==='function') && renderDeckEditor();
    }
  });
});



// --- Edit-mode mana grid wiring (mirrors the add form) ---
(function(){
  const grid = $(`e_grid_${id}`);
  const hint = $(`e_hint_${id}`);
  const h1 = $(`e_c1_${id}`);
  const h2 = $(`e_c2_${id}`);
  const h3 = $(`e_c3_${id}`);
  const ORDER = ['W','U','B','R','G','C'];

  function getSelected(){
    const sel = Array.from(grid.querySelectorAll('.mana-btn.selected')).map(b => b.dataset.color);
    return ORDER.filter(c => sel.includes(c));
  }
  function syncHidden(){
    const colors = getSelected();
    h1.value = colors[0] || '';
    h2.value = colors[1] || '';
    h3.value = colors[2] || '';
    if(hint){
      const n = colors.length;
      hint.textContent = n===0 ? 'Select 1–3 colors.'
                    : n===1 ? 'Mono color.'
                    : n===2 ? 'Two-color.'
                    : 'Tri-color.';
    }
  }

  // seed with current pack colors
  (p.colors||[]).forEach(c=>{
    const btn = grid.querySelector(`.mana-btn[data-color="${c}"]`);
    if(btn){ btn.classList.add('selected'); btn.setAttribute('aria-pressed','true'); }
  });
  syncHidden();

  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('.mana-btn'); if(!btn) return;
    const isSelected = btn.classList.contains('selected');
    const count = grid.querySelectorAll('.mana-btn.selected').length;
    if(!isSelected && count >= 3){
      if(hint) hint.textContent = 'You can select up to 3 colors.';
      return;
    }
    btn.classList.toggle('selected');
    btn.setAttribute('aria-pressed', btn.classList.contains('selected') ? 'true' : 'false');
    syncHidden();
  });
})();




// Bulk paste: Parse -> fetch mana/type -> merge into pack -> save (quiet) -> refresh list
row.querySelector(`#d_bulk_add_${id}`)?.addEventListener('click', async ()=>{
  const ta = $(`d_bulk_${id}`);
  if(!ta) return;
  const items = parseDeckText(ta.value);
  if(!items.length) return alert('Nothing to import.');

  // resolve mana/type via Scryfall (queued & rate-limited)
  const enriched = await enrichWithScryfallMin(items);

  // merge into this pack deck by name
  const pidx = state.collection.findIndex(x=>x.id===id);
  if(pidx < 0) return;
  const current = Array.isArray(state.collection[pidx].deck) ? state.collection[pidx].deck : [];
  const map = new Map(current.map(d=>[d.name.toLowerCase(), { ...d }]));
  for(const it of enriched){
    const k = it.name.toLowerCase();
    const prev = map.get(k);
    if(prev){
      prev.qty += Math.max(1, it.qty|0);
      if(!prev.mana && it.mana) prev.mana = it.mana;
      if(!prev.type && it.type) prev.type = it.type;
      map.set(k, prev);
    }else{
      map.set(k, normalizeDeckItem(it) || { name:it.name, qty:it.qty, mana:it.mana, type:it.type });
    }
  }
  const merged = Array.from(map.values()).map(normalizeDeckItem).filter(Boolean);
  state.collection[pidx] = { ...state.collection[pidx], deck: merged };

  saveAll(true);   // keep editor open
  ta.value = '';
  renderDeckEditor(); // refresh the list within the editor
});


  // --- Deck editor helpers ---
  function renderDeckEditor(){
    const pack = state.collection.find(x=>x.id===id) || {};
    const deck = Array.isArray(pack.deck) ? pack.deck : [];
    const host = $(`d_list_${id}`);
    if(!host) return;
host.innerHTML = deck.length ? `
  <ul style="list-style:none; margin:0; padding:0; display:grid; gap:6px">
    ${deck.map((it,idx)=>`
      <li style="
        display:flex; align-items:center; justify-content:space-between;
        border:1px dashed var(--line); padding:6px 8px; border-radius:8px;
        gap:10px; white-space:nowrap; overflow:hidden;
      ">
        <div style="display:flex; align-items:center; gap:10px; min-width:0;">
          <span class="tiny" style="flex:0 0 auto">${it.qty}×</span>
          <strong style="flex:0 0 auto">${esc(it.name)}</strong>
          <span style="flex:0 0 auto">${it.mana ? manaChips(it.mana) : ''}</span>
          <span class="tag" style="flex:0 0 auto">${esc(it.type||'')}</span>
        </div>
        <button class="btn btn-danger" data-del-line="${idx}" type="button">Remove</button>
      </li>`).join('')}
  </ul>` : `<div class="hint">No cards yet.</div>`;

    // delete buttons
    host.querySelectorAll('button[data-del-line]').forEach(b=>{
      b.addEventListener('click',()=>{
        const i = parseInt(b.dataset.delLine,10);
        const pidx = state.collection.findIndex(x=>x.id===id);
        if(pidx>=0){
          const cur = Array.isArray(state.collection[pidx].deck)?state.collection[pidx].deck:[];
          cur.splice(i,1);
          state.collection[pidx] = { ...state.collection[pidx], deck: cur };
          saveAll(true); renderDeckEditor();
        }
      });
    });
  }
  renderDeckEditor();

  // Autocomplete wiring
const nameInput = $(`d_name_${id}`);
const sug = $(`d_suggest_${id}`);
let acTimer;
let acToken = 0;

nameInput?.addEventListener('input', ()=>{
  const q = nameInput.value.trim();
  if(acTimer) clearTimeout(acTimer);

  if(q.length < 3){
    if(sug){ sug.style.display='none'; sug.innerHTML=''; }
    return;
  }

  acTimer = setTimeout(async ()=>{
    const token = ++acToken;

    // show loading immediately
    if(sug){ sug.innerHTML = `<div class="ac-loading">Loading…</div>`; sug.style.display = ''; }

    try{
      const items = await scryfallAutocompleteQueued(q);

      // stale? hide/ignore
      if(!sug) return;
      if(token !== acToken || nameInput.value.trim() !== q){
        sug.style.display = 'none';
        return;
      }

      if(items.length === 0){
        sug.innerHTML = `<div class="ac-empty">No matches</div>`;
        sug.style.display = '';
        return;
      }

      sug.innerHTML = items
        .map(n=>`<div class="ac-item" data-name="${esc(n)}">${esc(n)}</div>`)
        .join('');
      sug.style.display = '';
    }catch{
      if(sug){
        sug.innerHTML = `<div class="ac-empty">Couldn’t load</div>`;
        sug.style.display = '';
      }
    }
  }, 180);
});

// choose suggestion
sug?.addEventListener('click', (e)=>{
  const el = e.target.closest('.ac-item'); if(!el) return;
  nameInput.value = el.dataset.name || '';
  sug.style.display = 'none'; sug.innerHTML = '';
});

// click-away to close
document.addEventListener('click', (e)=>{
  if(!sug) return;
  if(!e.target.closest(`#d_suggest_${id}`) && !e.target.closest(`#d_name_${id}`)){
    sug.style.display = 'none';
  }
}, { once:true });



  // click-away to close
  document.addEventListener('click', (e)=>{
    if(!sug) return;
    if(!e.target.closest(`#d_suggest_${id}`) && !e.target.closest(`#d_name_${id}`)){
      sug.style.display = 'none';
    }
  }, { once:true });

  // Add card
  row.querySelector(`#d_add_${id}`)?.addEventListener('click', async ()=>{
    const nameEl = $(`d_name_${id}`);
    const qtyEl  = $(`d_qty_${id}`);
    const manaEl = $(`d_mana_${id}`);
    const typeEl = $(`d_type_${id}`);

    const name = nameEl.value.trim();
    if(!name) return alert('Enter a card name.');
    let mana = manaEl.value.trim();
    let type = typeEl.value.trim();
    const qty  = qtyEl.value;

    if(!mana || !type){
      try{
        const card = await scryfallNamedExactQueued(name);
        if(!mana) mana = card.mana_cost || '';
        if(!type) type = card.type_line || '';
      }catch{/* allow manual */}
    }

    const item = normalizeDeckItem({ name, qty, mana, type });
    if(!item) return alert('Enter a card name.');

    const pidx = state.collection.findIndex(x=>x.id===id);
    if(pidx<0) return;
    const cur = Array.isArray(state.collection[pidx].deck)?state.collection[pidx].deck:[];
    cur.push(item);
    state.collection[pidx] = { ...state.collection[pidx], deck: cur };
    saveAll(true);

    // reset mini-form
    nameEl.value=''; qtyEl.value='1'; manaEl.value=''; typeEl.value='';
    if(sug){ sug.style.display='none'; sug.innerHTML=''; }

    renderDeckEditor();
  });
}



// popup helper

function openModal({
  title='',
  bodyHTML='',
  okText='OK',
  onOK=()=>{},
  onOpen=()=>{}    // for focusing textarea etc.
}){
  const wrap = $('modal'), ttl = $('modalTitle'), body = $('modalBody');
  const ok = $('modalOK'), cancel = $('modalCancel');

  ttl.textContent = title;
  body.innerHTML  = bodyHTML;
  ok.textContent  = okText;
  wrap.classList.remove('hidden');

  // ---- close helpers (no 'close' name to avoid clashes)
  function doClose(){
    wrap.classList.add('hidden');
    document.removeEventListener('keydown', onKeydownEsc);
  }
  function onKeydownEsc(e){
    if (e.key === 'Escape') doClose();
  }
  document.addEventListener('keydown', onKeydownEsc);

  const okClick = async () => {
    try { await onOK(); }
    finally { doClose(); }
  };

  ok.onclick     = okClick;
  cancel.onclick = doClose;
  wrap.onclick   = (e)=>{ if (e.target === wrap) doClose(); };

  queueMicrotask(onOpen);
}



// Parse lines like: "2 Lightning Bolt", "Lightning Bolt x3", "Lightning Bolt (2)", "Forest"
function parseDeckText(text){
  const out = [];
  const lines = String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  for(const line of lines){
    // qty first:  ^\s*(\d+)\s+(.+)
    let m = line.match(/^\s*(\d+)\s+(.+)$/);
    if(m){ out.push({ name:m[2].trim(), qty:parseInt(m[1],10) }); continue; }

    // qty suffix: ^(.+?)\s*[xX]\s*(\d+)\s*$
    m = line.match(/^(.+?)\s*[xX]\s*(\d+)\s*$/);
    if(m){ out.push({ name:m[1].trim(), qty:parseInt(m[2],10) }); continue; }

    // qty in parens: ^(.+?)\s*\((\d+)\)\s*$
    m = line.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if(m){ out.push({ name:m[1].trim(), qty:parseInt(m[2],10) }); continue; }

    // plain name defaults to 1
    out.push({ name:line, qty:1 });
  }
  // coalesce by name
  const map = new Map();
  for(const it of out){
    const key = it.name.toLowerCase();
    map.set(key, { name:it.name, qty:(map.get(key)?.qty||0) + Math.max(1, it.qty|0) });
  }
  return Array.from(map.values());
}

// Fetch mana/type via Scryfall for any items missing those fields
async function enrichWithScryfallMin(items){
  const res = [];
  for(const it of items){
    try{
      const card = await scryfallNamedExactQueued(it.name);
      res.push({
        name: it.name,
        qty:  it.qty,
        mana: card.mana_cost || '',
        type: card.type_line || ''
      });
    }catch{
      // fall back with no mana/type; can be edited later
      res.push({ name: it.name, qty: it.qty, mana:'', type:'' });
    }
  }
  return res;
}


  function saveInlineEdit(id){
    const name=$(`e_name_${id}`).value.trim();
    const theme=$(`e_theme_${id}`).value.trim();
    const c1=$(`e_c1_${id}`).value, c2=$(`e_c2_${id}`).value, c3=$(`e_c3_${id}`).value;
    const set=$(`e_set_${id}`).value.trim();
    if(!name) return alert('Please enter a pack name.');
    if(!c1) return alert('Please choose at least Color 1.');
    const colors=Array.from(new Set([c1,c2,c3].filter(Boolean)));
    if(colors.length<1||colors.length>3) return alert('Packs must have 1 to 3 colors.');
    const tagsRaw = $(`e_tags_hidden_${id}`)?.value || '[]';
    let tags = [];
    try { tags = JSON.parse(tagsRaw); } catch {}
    if(!Array.isArray(tags)) tags = [];
    const dup=state.collection.some(p=>p.id!==id&&p.name.toLowerCase()===name.toLowerCase()&&JSON.stringify(p.colors)===JSON.stringify(colors)&&String(p.set||'').toLowerCase()===set.toLowerCase());
    if(dup) return alert('That pack (name + colors + set) already exists.');
    const idx=state.collection.findIndex(p=>p.id===id);
    if(idx>=0){state.collection[idx]={
      ...state.collection[idx],name,theme:theme||null,colors,set:set||null,tags}; 
    saveAll();}
  }



function renderCollection(){
  const settings = state.settingsCollection;
  $('collectionCount').textContent=`${state.collection.length} packs`;
  const all = sortedFiltered(settings);
  const total = all.length, ps = settings.pageSize, p = settings.page, start=(p-1)*ps;
  const slice = all.slice(start,start+ps);
  const list=$('packList');
  list.innerHTML = total ? slice.map(p => packRowHtml(p, settings)).join('') : `<div class="hint">No eligible packs. Adjust filters or add packs.</div>`;
  if(total) bindPackRowButtons();
  renderPaginationControls(total, settings);
  const eligible=$('eligibleCount'); if(eligible) eligible.textContent=`Eligible after filter: ${eligibleAfterFilter(settings)}`;
}




  /*
  
  
  
  Guardrails display
  
  
  
  */
function renderGuardrails(settings = state.settingsCollection){
  const pool = state.collection.filter(p=>matchFilters(p, settings));
  const mono=pool.filter(isMono).length, bi=pool.filter(isBi).length, tri=pool.filter(isTri).length;
  const triPct=settings.triSharePct, cap=settings.capOneTri, triExists=tri>0;
  const triChance=(triPct===0||!triExists)?0:(cap?triPct:Math.min(100,Math.round((triPct/100)*settings.optionsPerRoll*25)));
  $('guardPool').textContent=`Pool now: Mono ${mono} • Two ${bi} • Tri ${tri}`;
  $('guardMono').textContent=`If first is Mono: expect mostly 1–2 monos + 1–3 two-color; tri ~${triChance}% if allowed.`;
  $('guardBi').textContent=`If first is Two: ≥2 monos (one of each color), often exact two-color; tri ~${triChance}% if overlaps both.`;
  $('guardTri').textContent=`If first is Tri: ≥2 monos from those colors; tri ~${triChance}% if subset only.`;
  const total=mono+bi+tri||1;
  $('guardBar').innerHTML=`<div style="width:${(mono/total)*100}%; background:#0f2a16"></div><div style="width:${(bi/total)*100}%; background:#102437"></div><div style="width:${(tri/total)*100}%; background:#2a102a"></div>`;
}

function poolRemaining(settings = state.settingsPlay){
  const used=state.session.usedIds;
  return state.collection.filter(p=>!used.has(p.id) && matchFilters(p, settings));
}
const triAllowed = (settings = state.settingsPlay)=> settings.triSharePct>0;



  /* RNG Fairness */
function incOfferCounts(packs){
  if(!state.settingsPlay.fairMode) return;
  for(const p of packs){
    ensureFairEntry(p.id);
    state.fair[p.id].offer++;
  }
  saveAll(true);
}


  const fairWeight=p=>1/(1+(state.fair[p.id]?.offer||0));





  /* Weighted drawing utility with constraints to help */
function drawWithWeights({pool,wantTotal,wantTriPct,capOneTri,constraints,allowTri,settings}){
  const result=[];
  const useFair = !!(settings && settings.fairMode);
  const take=(sub,count)=>{
    const cand=sub.filter(x=>!result.some(r=>r.id===x.id));
    if(!cand.length||count<=0) return [];
    return useFair ? weightedSample(cand,count,fairWeight)
                   : pickRandom(cand,count);
  };

  if(constraints?.require){
    for(const req of constraints.require){ result.push(...take(req.pool,req.count)); }
  }

  const remaining=Math.max(0,wantTotal-result.length);
  let triSlots=0;
  if(allowTri && remaining>0){
    if(capOneTri){
      triSlots = (Math.random()<(wantTriPct/100)) ? 1 : 0;
      triSlots = Math.min(triSlots, remaining);
    }else{
      const ideal=Math.round((wantTriPct/100)*wantTotal);
      triSlots=Math.min(ideal, remaining);
    }
  }

  const triPool=allowTri?pool.filter(isTri):[];
  const biPool=pool.filter(isBi), monoPool=pool.filter(isMono);

  result.push(...take(triPool,triSlots));
  let left=Math.max(0,wantTotal-result.length);
  result.push(...take(biPool,left)); left=Math.max(0,wantTotal-result.length);
  result.push(...take(monoPool,left)); left=Math.max(0,wantTotal-result.length);
  if(left){
    let any=pool.filter(x=>!result.some(r=>r.id===x.id));
    if(!allowTri) any=any.filter(p=>!isTri(p));
    result.push(...take(any,left));
  }
  return result.slice(0,wantTotal);
}


  /* Option card */
function renderOptionCard(p, settings){
  return `<div>
    <strong>${esc(p.name)}</strong>
    <div class="meta">
      ${p.theme?`<span class="theme">${esc(p.theme)}</span>`:''}
      ${chips(p.colors)} ${typeChip(p)}
      ${p.set?`<span class="tag">${esc(p.set)}</span>`:'<span class="tag">Unlabeled</span>'}
      ${usageTag(p, settings)}
    </div>
  </div>`;
}


function renderOptions(containerId, packs, onPick, settings = activeSettings()){
  const el=$(containerId);
el.innerHTML = packs.map(p=>{
  const hasDeck = Array.isArray(p.deck) && p.deck.length;
  return `
    <div class="option">
      ${renderOptionCard(p, settings)}
      <div class="pill">
        <button class="btn btn-pink" data-pick="${p.id}">Choose</button>
        ${hasDeck ? `<button class="btn btn-gray" type="button" data-viewdeck="${p.id}">View Deck</button>` : ''}
      </div>
    </div>`;
}).join('');
  packs.forEach(p=>{
    const b=el.querySelector(`button[data-pick="${p.id}"]`);
    on(b,'click',()=>onPick(p));
  });

  // NEW: view deck buttons
  packs.forEach(p=>{
    const vb = el.querySelector(`button[data-viewdeck="${p.id}"]`);
    if (!vb) return;
    vb.addEventListener('click', ()=>{
      openModal({
        title: `Deck — ${p.name}`,
        okText: 'Close',
        bodyHTML: renderDeckColumnsHTML(Array.isArray(p.deck) ? p.deck : [])
      });
    });
  });
}


function manaChips(mana){
  if(!mana) return '';
  const out = [];
  const re = /\{([^}]+)\}/g; // capture each {...}
  let m;
  while((m = re.exec(mana))){
    const t = String(m[1]).toUpperCase(); // e.g. "2", "R", "W/U"
    if(/^\d+$/.test(t) || t==='X'){ 
      out.push(`<span class="c C">${t}</span>`);      // numeric or X -> gray pip with text
    } else if(['W','U','B','R','G','C'].includes(t)){
      out.push(`<span class="c ${t}">${t}</span>`);   // normal color pips
    } else {
      // hybrids, phyrexian, etc. fallback
      out.push(`<span class="c C">${t}</span>`);
    }
  }
  return `<span class="colors">${out.join('')}</span>`;
}


  /* CSV helpers */
function toCSV(rows){
  const header = ['name','theme','colors','set','tags'].join(','); 
  const body = rows.map(r => [
    r.name||'',
    r.theme||'',
    (r.colors||[]).join(';'),
    r.set||'',
    (Array.isArray(r.tags)?r.tags:[]).join(';')   // tags joined by this thing ;
  ].map(v=>{
    const s=String(v);
    return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
  }).join(',')).join('\n');
  return header+'\n'+body;
}




  function parseCSV(text){
    const lines=text.replace(/\r/g,'').split('\n').filter(Boolean); if(!lines.length) return [];
    const out=[]; lines.shift();
    for(const line of lines){
      const cols=[]; let cur=''; let q=false;
      for(let i=0;i<line.length;i++){ const ch=line[i];
        if(q){ if(ch=='"'&&line[i+1]=='"'){cur+='"';i++;} else if(ch=='"'){q=false;} else cur+=ch; }
        else { if(ch===','){ cols.push(cur); cur=''; } else if(ch=='"'){ q=true; } else cur+=ch; }
      }
      cols.push(cur);
      const name=(cols[0]||'').trim(); if(!name) continue;
      const theme=(cols[1]||'').trim()||null;
      const colors=(cols[2]||'').split(/;+\s*/).map(s=>s.trim()).filter(Boolean);
const set = (cols[3]||'').trim()||null;
const tags = (cols[4]||'').split(/;+\s*/).map(s=>s.trim()).filter(Boolean); // ← maybe empty
out.push({
     id: uid(),
   name,
  theme,
   colors: colors.filter(c=>['W','U','B','R','G','C'].includes(c)).slice(0,3),
  set,
  tags
 });
    }
    return out.filter(p=>p.colors.length>=1);
  }


/* ===== Pack deck helpers ===== */
function getSection(section = '', type = '') {
  const s = String(section).toLowerCase().replace(/[^a-z]/g, ''); // "Non-Creature" -> "noncreature"
  const t = String(type).toLowerCase();

  if (s === 'land' || /\bland\b/.test(t)) return 'Land';
  if (s === 'creature' || /\bcreature\b/.test(t)) return 'Creature';
  return 'Non-Creature';
}



function normalizeDeckItem(x){
  const name = String(x.name||'').trim();
  if(!name) return null;

  const qty  = Math.max(1, parseInt(x.qty||1,10));
  const mana = String(x.mana||'').trim();
  const type = String(x.type||'').trim();

  // Single source of truth for the section
  const section = getSection(x.section, type);

  return { name, qty, mana, type, section };
}



function computeThemeCounts(){
  const m = new Map();
  for(const p of state.collection){
    const key = p.theme ? p.theme : 'Unlabeled';
    m.set(key, (m.get(key)||0)+1);
  }
  return m;
}
function computeTagCounts(){
  const m = new Map();
  for(const p of state.collection){
    const tags = Array.isArray(p.tags) ? p.tags : [];
    for(const t of tags){
      const key = t.trim();
      if(!key) continue;
      m.set(key, (m.get(key)||0)+1);
    }
  }
  return m;
}



function renderNewPackDeck(){
  const host = $('n_list'); if(!host) return;
  const deck = state.newPackDeck || [];
  host.innerHTML = deck.length ? `
    <ul style="list-style:none; margin:0; padding:0; display:grid; gap:6px">
      ${deck.map((it,idx)=>`
        <li style="display:flex; align-items:center; justify-content:space-between; border:1px dashed var(--line); padding:6px 8px; border-radius:8px; gap:10px; white-space:nowrap; overflow:hidden;">
          <div style="display:flex; align-items:center; gap:10px; min-width:0;">
            <span class="tiny">${it.qty}×</span>
            <strong>${esc(it.name)}</strong>
            <span>${it.mana ? (typeof manaChips==='function'? manaChips(it.mana) : esc(it.mana)) : ''}</span>
            <span class="tag">${esc(it.type||'')}</span>
          </div>
          <button class="btn btn-danger" data-n-del="${idx}" type="button">Remove</button>
        </li>`).join('')}
    </ul>` : `<div class="hint">No cards yet.</div>`;

  host.querySelectorAll('button[data-n-del]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const i = parseInt(b.dataset.nDel,10);
      state.newPackDeck.splice(i,1);
      renderNewPackDeck();
    });
  });
}


/* ===== Draft history and exports ===== */
function loadHistory(){
  try{ return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; }
  catch{ return []; }
}
function saveHistory(arr){
  try{ localStorage.setItem(LS_HISTORY, JSON.stringify(arr)); }catch{}
}

function combineDecks(a,b){
  const map = new Map();
  const add = (p)=> (Array.isArray(p.deck)?p.deck:[]).forEach(it=>{
    const k = it.name.toLowerCase();
    const prev = map.get(k) || { name:it.name, qty:0, mana:it.mana||'', type:it.type||'' };
    prev.qty += Math.max(1, parseInt(it.qty||1,10));
    if(!prev.mana && it.mana) prev.mana = it.mana;
    if(!prev.type && it.type) prev.type = it.type;
    map.set(k, prev);
  });
  add(a); add(b);
  return Array.from(map.values()).sort((x,y)=>x.name.localeCompare(y.name));
}

function recordDraft(firstPack, secondPack){
  const history = loadHistory();
  const entry = {
    ts: Date.now(),
    first:  { id:firstPack.id,  name:firstPack.name,  colors:firstPack.colors,  set:firstPack.set||null },
    second: { id:secondPack.id, name:secondPack.name, colors:secondPack.colors, set:secondPack.set||null },
    deck: combineDecks(firstPack, secondPack) // merged final list
  };
  history.unshift(entry);
  if(history.length > 10) history.length = 10;
  saveHistory(history);
}

function formatMTGA(deckArr, title){
  // MTGA expects "Deck" / "Sideboard" headers; names with counts
  const lines = ['Deck', ...deckArr.map(d=>`${d.qty} ${d.name}`), '', 'Sideboard'];
  if(title) lines.unshift(`// ${title}`);
  return lines.join('\n');
}
function formatMTGO(deckArr, title){
  const lines = deckArr.map(d=>`${d.qty} ${d.name}`);
  if(title) lines.unshift(`// ${title}`);
  return lines.join('\n');
}

async function copyText(s){
  try{ await navigator.clipboard.writeText(s); alert('Copied to clipboard.'); }
  catch{
    const ta=document.createElement('textarea'); ta.value=s; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    alert('Copied to clipboard.');
  }
}

/* Render history list into #historyList */
function renderHistory(){
  const host = $('historyList'); if(!host) return;
  const history = loadHistory();
  host.innerHTML = history.length ? history.map((h,i)=>`
    <div class="option">
      <div>
        <div class="tiny">${new Date(h.ts).toLocaleString()}</div>
        <div><strong>${esc(h.first.name)}</strong> + <strong>${esc(h.second.name)}</strong></div>
        <div class="tiny">${h.deck.reduce((a,c)=>a+c.qty,0)} cards merged</div>
      </div>
      <div class="pill">
        <button class="btn btn-gray" data-viewhist="${i}">🗂 View Deck</button>
        <button class="btn btn-gray" data-exp-mtga="${i}">Copy MTGA</button>
        <button class="btn btn-gray" data-exp-mtgo="${i}">Copy MTGO</button>
      </div>
    </div>
  `).join('') : `<div class="hint">No drafts yet.</div>`;

  // export bindings
  history.forEach((h,i)=>{
    const title = `${h.first.name} + ${h.second.name}`;
    host.querySelector(`button[data-exp-mtga="${i}"]`)?.addEventListener('click', ()=> copyText(formatMTGA(h.deck, title)));
    host.querySelector(`button[data-exp-mtgo="${i}"]`)?.addEventListener('click', ()=> copyText(formatMTGO(h.deck, title)));
  });

  // view merged deck
  history.forEach((h,i)=>{
    host.querySelector(`button[data-viewhist="${i}"]`)?.addEventListener('click', ()=>{
      openModal({
        title: `Draft #${i+1} — ${h.first.name} + ${h.second.name}`,
        okText: 'Close',
        bodyHTML: renderDeckColumnsHTML(h.deck || [])
      });
    });
  });
}




function setDeckForPack(packId, deckArray){
  const i = state.collection.findIndex(p=>p.id===packId);
  if(i<0) return false;
  const deck = (Array.isArray(deckArray)?deckArray:[])
    .map(normalizeDeckItem)
    .filter(Boolean);
  state.collection[i] = { ...state.collection[i], deck };
  saveAll();
  return true;
}

function getDeckSections(p){
  const deck = Array.isArray(p.deck)?p.deck:[];
  const by = { 'Creature':[], 'Non-Creature':[], 'Land':[] };
  deck.forEach(d=>{
    const s = d.section==='Creature'?'Creature':(d.section==='Land'?'Land':'Non-Creature');
    by[s].push(d);
  });
  ['Creature','Non-Creature','Land'].forEach(k=>by[k].sort((a,b)=>a.name.localeCompare(b.name)));
  return by;
}

function renderDeckBlock(p){
  const by = getDeckSections(p);
const section = (title, arr)=>`
  <details ${arr.length?'':'open'}>
    <summary>${title} (${arr.reduce((a,c)=>a+c.qty,0)})</summary>
    <ul class="tiny" style="margin:6px 0 0 0; padding-left:0; list-style:none; display:grid; gap:4px">
      ${arr.map(it=>`
        <li style="display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:hidden;">
          <span style="flex:0 0 auto">${it.qty}×</span>
          <span style="flex:0 0 auto">${esc(it.name)}</span>
          <span style="flex:0 0 auto">${it.mana ? manaChips(it.mana) : ''}</span>
          <span class="tag" style="flex:0 0 auto">${esc(it.type||'')}</span>
        </li>`).join('') || `<li class="hint">None</li>`}
    </ul>
  </details>`;

  return `
    <div class="mini-table">
      <h4>Deck List</h4>
      ${section('Creatures', by['Creature'])}
      ${section('Non-Creatures', by['Non-Creature'])}
      ${section('Lands', by['Land'])}
    </div>`;
}





// === Render an deck into 3 columns (Creatures / Non-Creatures / Lands) ===
// Accepts: deck = [{ name, qty, type, mana, section? }]
function renderDeckColumnsHTML(deck = []) {
  const bucket = { creatures: [], noncreatures: [], lands: [] };

  for (const it of (deck||[])) {
    const name = String(it.name||'').trim();
    if (!name) continue;

    const qty = Math.max(1, parseInt(it.qty||1,10));
    const secName = getSection(it.section, it.type); // ← unified logic

    let dest = 'noncreatures';
    if (secName === 'Creature') dest = 'creatures';
    else if (secName === 'Land') dest = 'lands';

    bucket[dest].push({ ...it, qty, name });
  }

  const ct = arr => arr.reduce((n,x)=>n+(parseInt(x.qty||1,10)||1),0);
  const ul = arr => arr.length
    ? `<ul style="margin:0;padding-left:18px">${arr.sort((a,b)=>a.name.localeCompare(b.name))
        .map(c=>`<li>${c.qty>1?`${c.qty}× `:''}${esc(c.name)}</li>`).join('')}</ul>`
    : `<p class="tiny" style="opacity:.75">— none —</p>`;

  return `
    <div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      <section class="deckcol" style="border:1px solid var(--line,#2a2d31);border-radius:10px;padding:12px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;opacity:.9">Creatures (${ct(bucket.creatures)})</h3>
        ${ul(bucket.creatures)}
      </section>
      <section class="deckcol" style="border:1px solid var(--line,#2a2d31);border-radius:10px;padding:12px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;opacity:.9">Non-Creatures (${ct(bucket.noncreatures)})</h3>
        ${ul(bucket.noncreatures)}
      </section>
      <section class="deckcol" style="border:1px solid var(--line,#2a2d31);border-radius:10px;padding:12px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;opacity:.9">Lands (${ct(bucket.lands)})</h3>
        ${ul(bucket.lands)}
      </section>
    </div>
  `;
}



/* Scryfall queue cache API)  */
const SCRY_RATE_MS = 120; // ~8–10 req/sec
const scry_q = [];
let scry_busy = false;
const scry_cache = new Map();

function enqueueScryfall(fn){
  return new Promise((resolve,reject)=>{
    scry_q.push({ fn, resolve, reject });
    scry_pump();
  });
}
function scry_pump(){
  if(scry_busy || !scry_q.length) return;
  scry_busy = true;
  const { fn, resolve, reject } = scry_q.shift();
  Promise.resolve()
    .then(fn)
    .then(resolve, reject)
    .finally(()=> setTimeout(()=>{ scry_busy = false; scry_pump(); }, SCRY_RATE_MS));
}

async function scryfallAutocomplete(q){
  const k = 'ac:'+q.toLowerCase();
  if(scry_cache.has(k)) return scry_cache.get(k);
  const url = 'https://api.scryfall.com/cards/autocomplete?q='+encodeURIComponent(q);
  const res = await fetch(url, { headers:{ 'Accept':'application/json' }});
  if(!res.ok) throw new Error('autocomplete '+res.status);
  const data = await res.json();
  const arr = Array.isArray(data.data) ? data.data.slice(0,20) : [];
  scry_cache.set(k, arr);
  return arr;
}
async function scryfallNamedExact(name){
  const k = 'exact:'+name.toLowerCase();
  if(scry_cache.has(k)) return scry_cache.get(k);
  const url = 'https://api.scryfall.com/cards/named?exact='+encodeURIComponent(name);
  const res = await fetch(url, { headers:{ 'Accept':'application/json' }});
  if(!res.ok) throw new Error('named '+res.status);
  const card = await res.json();
  scry_cache.set(k, card);
  return card;
}
const scryfallAutocompleteQueued = (q)=> enqueueScryfall(()=> scryfallAutocomplete(q));
const scryfallNamedExactQueued  = (n)=> enqueueScryfall(()=> scryfallNamedExact(n));



  /* Log & Session */
  function log(msg){ const li=document.createElement('li'); li.innerHTML=`<span class="tiny">${esc(msg)}</span>`; $('log').prepend(li); }
  function resetSession(){
    state.session={firstOptions:[],chosenFirst:null,secondOptions:[],chosenSecond:null,usedIds:new Set()};
    ['firstOptions','secondOptions','chosenFirst','finalPair'].forEach(id=>{const el=$(id); if(el) el.innerHTML='';});
    $('chosenFirstWrap').style.display='none'; $('finalPairWrap').style.display='none'; $('overlapWrap').style.display='none';
    $('statusLine').textContent='No session yet.'; $('log').innerHTML=''; renderGuardrails(activeSettings());
  }

function updateView(){
  const v = state.settingsCollection.view;

  $('collectionCard').classList.toggle('hidden', v!=='collection');
  $('playCard').classList.toggle('hidden', v!=='play');
  $('statsCard').classList.toggle('hidden', v!=='stats');

  $('btnViewCollection').classList.toggle('active', v==='collection');
  $('btnViewPlay').classList.toggle('active', v==='play');
  $('btnViewStats').classList.toggle('active', v==='stats');

  if(v==='stats'){ renderStatsPanel(); return; }

  if(v==='collection'){
    // render collection chips into collection containers
    renderSetFilter(state.settingsCollection, 'colSetFilterBox');
    renderColorFilter(state.settingsCollection, 'colColorFilterBox');
    renderThemeFilter(state.settingsCollection);
    renderTagFilter(state.settingsCollection);
    renderGuardrails(state.settingsCollection);
    renderCollection();
    return;
  }

  // play view
  renderSetFilter(state.settingsPlay, 'setFilterBox');
  renderColorFilter(state.settingsPlay, 'colorFilterBox');
  renderGuardrails(state.settingsPlay);
}


function renderEverything(){
  const v = state.settingsCollection.view;
  const s = activeSettings();

  if (v === 'collection') {
    renderCollection();
  }

  renderSetFilter(s, 'colSetFilterBox');
  renderColorFilter(s, 'colColorFilterBox');
  renderThemeFilter(state.settingsCollection);
  renderTagFilter(state.settingsCollection);   
  renderGuardrails(s);
  refreshStorageHealth();
}




function renderThemeFilter(seedSettings = activeSettings()){
  const box = $('themeFilterBox'); if(!box) return;
  const counts = computeThemeCounts();
  const all = Array.from(counts.keys()).sort((a,b)=>a.localeCompare(b));
  const scope = (seedSettings === state.settingsPlay) ? 'play' : 'collection';
  box.dataset.scope = scope;

  if(!all.length){
    box.innerHTML = '<div class="tiny">No themes yet.</div>';
    seedSettings.themeFilter = [];
    return;
  }

  box.classList.add('set-grid');
  box.innerHTML = all.map(s=>{
    const count = counts.get(s)||0;
    const on = seedSettings.themeFilter.includes(s);
    const safe = esc(s);
    return `<div role="button" tabindex="0"
                 class="set-chip ${on?'active':''}"
                 data-theme="${safe}"
                 aria-pressed="${on?'true':'false'}">
              <span class="name">${safe}</span>
              <span class="count">${count}</span>
            </div>`;
  }).join('');

  const currentSettings = () =>
    (box.dataset.scope === 'play') ? state.settingsPlay : state.settingsCollection;

  const toggle = (el)=>{
    const s = currentSettings();
    const key = el?.dataset?.theme; if(!key) return;
    const on = s.themeFilter.includes(key);
    if(on){
      s.themeFilter = s.themeFilter.filter(x=>x!==key);
      el.classList.remove('active'); el.setAttribute('aria-pressed','false');
    }else{
      s.themeFilter.push(key);
      el.classList.add('active'); el.setAttribute('aria-pressed','true');
    }
    if(s === state.settingsCollection){ s.page=1; renderCollection(); }
  };

  if(!box.__bound){
    box.addEventListener('click', e=>{
      const el = e.target.closest('.set-chip'); if(!el) return; toggle(el);
    });
    box.addEventListener('keydown', e=>{
      if(e.key===' ' || e.key==='Enter'){
        const el = e.target.closest('.set-chip'); if(!el) return; e.preventDefault(); toggle(el);
      }
    });
    box.__bound = true;
  }
}

function renderTagFilter(seedSettings = activeSettings()){
  const box = $('tagFilterBox'); if(!box) return;

  // counts of actual tags
  const counts = computeTagCounts();

  // count untagged packs to decide whether to show the special chip
  const noneCount = state.collection.reduce((n,p) =>
    n + (Array.isArray(p.tags) && p.tags.length ? 0 : 1), 0);

  // Build the full list of filter keys: existing tags and optional NO_TAGS sentinel
  const tagKeys = Array.from(counts.keys()).sort((a,b)=>a.localeCompare(b));
  if (noneCount > 0) tagKeys.unshift(NO_TAGS); // show it first if present

  const scope = (seedSettings === state.settingsPlay) ? 'play' : 'collection';
  box.dataset.scope = scope;

  if(!tagKeys.length){
    box.innerHTML = '<div class="tiny">No tags yet.</div>';
    seedSettings.tagFilter = [];
    return;
  }

  box.classList.add('set-grid');
  box.innerHTML = tagKeys.map(k=>{
    const isNone = (k === NO_TAGS);
    const count  = isNone ? noneCount : (counts.get(k) || 0);
    const on     = seedSettings.tagFilter.includes(k);
    const label  = isNone ? 'No tags' : '#'+esc(k);
    const data   = isNone ? NO_TAGS : esc(k);
    return `<div role="button" tabindex="0"
                 class="set-chip ${on?'active':''}"
                 data-tag="${data}"
                 aria-pressed="${on?'true':'false'}">
              <span class="name">${label}</span>
              <span class="count">${count}</span>
            </div>`;
  }).join('');

  const currentSettings = () =>
    (box.dataset.scope === 'play') ? state.settingsPlay : state.settingsCollection;

  const toggle = (el)=>{
    const s = currentSettings();
    const key = el?.dataset?.tag; if(!key) return;
    const on = s.tagFilter.includes(key);
    if(on){
      s.tagFilter = s.tagFilter.filter(x=>x!==key);
      el.classList.remove('active'); el.setAttribute('aria-pressed','false');
    }else{
      s.tagFilter.push(key);
      el.classList.add('active'); el.setAttribute('aria-pressed','true');
    }
    if(s === state.settingsCollection){ s.page=1; renderCollection(); }
  };

  if(!box.__bound){
    box.addEventListener('click', e=>{
      const el = e.target.closest('.set-chip'); if(!el) return; toggle(el);
    });
    box.addEventListener('keydown', e=>{
      if(e.key===' ' || e.key==='Enter'){
        const el = e.target.closest('.set-chip'); if(!el) return; e.preventDefault(); toggle(el);
      }
    });
    box.__bound = true;
  }
}



  /* DOM Ready */
  document.addEventListener('DOMContentLoaded',()=>{
    state.collection=loadCollection(); state.fair=loadFair();
for(const id of Object.keys(state.fair||{})){
  ensureFairEntry(id);
}



    // View switch
on($('btnViewCollection'),'click',()=>{ 
    state.settingsCollection.view='collection'; 
    updateView(); 
  });
on($('btnViewPlay'),'click',()=>{
    state.settingsCollection.view='play';
    updateView();
  });
on($('btnViewStats'),'click',()=>{
    state.settingsCollection.view='stats';
    updateView();
  });


    // Add/manage packs
 on($('addPackBtn'),'click',()=>{
  const name=$('packName').value.trim(),
        theme=$('packTheme').value.trim(),
        c1=$('color1').value, c2=$('color2').value, c3=$('color3').value,
        set=$('packSet').value.trim();

  if(!name) return alert('Please enter a pack name.');
  if(!c1)   return alert('Please choose at least Color 1.');

  const colors = Array.from(new Set([c1,c2,c3].filter(Boolean)));
  if(colors.length<1||colors.length>3) return alert('Packs must have 1 to 3 colors.');

  const dup = state.collection.some(p =>
    p.name.toLowerCase()===name.toLowerCase() &&
    JSON.stringify(p.colors)===JSON.stringify(colors) &&
    String(p.set||'').toLowerCase()===set.toLowerCase()
  );
  if(dup) return alert('That pack (name + colors + set) already exists.');

  const deck = (state.newPackDeck||[]).map(normalizeDeckItem).filter(Boolean);

  state.collection.push({
    id: uid(),
    name,
    theme: theme || null,
    colors,
    set: set || null,
    deck,
    tags: []
  });

  saveAll();
  state.settingsCollection.page = 1;

  // clear the add-pack form
  ['packName','packTheme','packSet'].forEach(id=>$(id).value='');
  window.resetManaSelection?.();

  state.newPackDeck = [];
  ['n_name','n_qty','n_mana','n_type'].forEach(id=>{
    const el=$(id);
    if(!el) return;
    el.value = (id==='n_qty') ? '1' : '';
  });
  (function(){ const s=$('n_suggest'); if(s){ s.style.display='none'; s.innerHTML=''; } })();
  renderNewPackDeck();
});



on($('clearFormBtn'),'click',()=>{
  ['packName','packTheme','packSet'].forEach(id=>$(id).value='');
  window.resetManaSelection?.();

  // reset the new-pack deck area !!!!!!!!!!!!!! >>>
  state.newPackDeck = [];
  ['n_name','n_qty','n_mana','n_type'].forEach(id=>{
    const el=$(id);
    if(!el) return;
    el.value = (id==='n_qty') ? '1' : '';
  });
  (function(){ const s=$('n_suggest'); if(s){ s.style.display='none'; s.innerHTML=''; } })();
  renderNewPackDeck();
});



    // Reset Offered Counters
on($('resetOfferedBtn'),'click',()=>{
  if(!confirm('Reset all OFFERED counters to 0? (Picked counters unchanged)')) return;
  for(const id of Object.keys(state.fair||{})){
    if(!state.fair[id]) state.fair[id] = { offer:0, pick:0 };
    state.fair[id].offer = 0;
  }
  saveAll();
  const s=$('statusLine'); if(s) s.textContent='Offered counters reset.';
  renderStatsPanel?.();
});

    // Wipe collection (and fair stats)
    on($('wipeBtn'),'click',()=>{ if(confirm('Wipe entire collection and fair stats?')){ state.collection=[]; state.fair={}; saveAll(); resetSession(); }});

    // Export/Import/Backup
    on($('exportBtn'),'click',()=>{ const data=JSON.stringify(state.collection,null,2); const blob=new Blob([data],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='jumpstart_collection.json'; a.click(); URL.revokeObjectURL(url); });
    on($('backupBtn'),'click',()=>{ const data=JSON.stringify({collection:state.collection,fair:state.fair},null,2); const blob=new Blob([data],{type:'application/json'}); const ts=new Date().toISOString().replace(/[:.]/g,'-'); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`jumpstart_backup_${ts}.json`; a.click(); URL.revokeObjectURL(url); });
    on($('importJsonBtn'),'click',()=>$('importFileJson').click());
    on($('importFileJson'),'change',async e=>{const f=e.target.files?.[0]; if(!f) return; try{const data=JSON.parse(await f.text()); if(Array.isArray(data)) state.collection=data; else { state.collection=Array.isArray(data.collection)?data.collection:state.collection; state.fair=(data.fair&&typeof data.fair==='object')?data.fair:state.fair; } saveAll(); resetSession(); e.target.value=''; state.settingsCollection.page = 1; alert('Restore complete.'); }catch(err){ alert('Import failed: '+err.message);} });
    on($('exportCsvBtn'),'click',()=>{ const csv=toCSV(state.collection); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='jumpstart_collection.csv'; a.click(); URL.revokeObjectURL(url); });
    on($('importCsvBtn'),'click',()=>$('importFileCsv').click());
    on($('importFileCsv'),'change',async e=>{const f=e.target.files?.[0]; if(!f) return; try{const text=await f.text(); const rows=parseCSV(text); if(!rows.length) return alert('No valid rows found.'); state.collection=rows; saveAll(); resetSession(); e.target.value=''; state.settingsCollection.page = 1; alert(`Imported ${rows.length} packs from CSV.`);}catch(err){ alert('CSV import failed: '+err.message);} });
    on($('exportUsageCsvBtn'),'click',()=>{
  const csv = usageToCSV();
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'jumpstart_usage.csv'; a.click();
  URL.revokeObjectURL(url);
});

on($('resetPicksBtn'),'click',()=>{
  if(!confirm('Reset all PICK counters to 0? (Offered counters unchanged)')) return;
  for(const id of Object.keys(state.fair||{})){
    if(!state.fair[id]) state.fair[id] = { offer:0, pick:0 };
    state.fair[id].pick = 0;
  }
  saveAll();
  const s=$('statusLine'); if(s) s.textContent='Pick counters reset.';
  renderStatsPanel();
});


    // Second-roll / RNG settings
// Second-roll / RNG settings (Play)
on($('excludeUnpicked'),'change',e=>state.settingsPlay.excludeUnpicked=e.target.checked);
on($('relaxIfStuck'),'change',e=>state.settingsPlay.relaxIfStuck=e.target.checked);
on($('overlapColor'),'change',e=>state.settingsPlay.overlapColor=e.target.value);
on($('optionsPerRoll'),'change',e=>{
  let v=parseInt(e.target.value||'4',10);
  v=Math.max(3,Math.min(6,v));
  e.target.value=v;
  state.settingsPlay.optionsPerRoll=v;
  renderGuardrails(state.settingsPlay);
});
on($('triSharePct'),'input',e=>{
  $('triSharePctLabel').textContent=e.target.value+'%';
  state.settingsPlay.triSharePct=parseInt(e.target.value,10);
  renderGuardrails(state.settingsPlay);
});
on($('capOneTri'),'change',e=>{
  state.settingsPlay.capOneTri=e.target.checked;
  renderGuardrails(state.settingsPlay);
});
on($('fairMode'),'change',e=>{
  state.settingsPlay.fairMode=e.target.checked;
});

// Player mode
on($('players'),'change',e=>{
  let v=parseInt(e.target.value||'2',10);
  v=Math.max(2,Math.min(6,v));
  e.target.value=v;
  state.settingsPlay.players=v;
});
on($('avoidCollisions'),'change',e=>state.settingsPlay.avoidCollisions=e.target.checked);
   
  

   // Clear Filters button
on($('clearFiltersBtn'),'click',()=>{
  const s = activeSettings();
  s.setFilter = [];
  s.colorFilter = [];
  s.tagFilter = [];
  s.themeFilter = [];
  renderSetFilter(s, 'colSetFilterBox');
  renderColorFilter(s, 'colColorFilterBox');
  renderTagFilter(s);
  renderThemeFilter(s);
  renderGuardrails(s);
  if(s === state.settingsCollection){
    s.page = 1;
    renderCollection();
  }
});



on($('clearHistoryBtn'),'click', ()=>{
  if(!confirm('Clear the saved draft history (last 10)?')) return;
  saveHistory([]);
  renderHistory();
});




on($('includeDeckSearch'),'change', e=>{
  state.settingsCollection.includeDeckSearch = !!e.target.checked;
  state.settingsCollection.page = 1;
  renderCollection();
});



// Initial render on load
renderHistory();



// === New-pack autosuggest (with Loading) ===
(() => {
  const input = $('n_name');
  if (!input) return;

  // create suggest box if it's not in the HTML
  let sug = document.getElementById('n_suggest');
  if (!sug) {
    sug = document.createElement('div');
    sug.id = 'n_suggest';
    sug.className = 'ac-list';
    sug.style.display = 'none';
    input.insertAdjacentElement('afterend', sug);
  }

  let acTimer, acToken = 0;
  const closeSug = () => { sug.style.display = 'none'; sug.innerHTML = ''; };

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (acTimer) clearTimeout(acTimer);

    if (q.length < 3) { closeSug(); return; }

    acTimer = setTimeout(async () => {
      const token = ++acToken;

      sug.innerHTML = `<div class="ac-loading">Loading…</div>`;
      sug.style.display = '';

      try {
        const items = await scryfallAutocompleteQueued(q);

        if (token !== acToken || input.value.trim() !== q) { closeSug(); return; }

        if (!items.length) {
          sug.innerHTML = `<div class="ac-empty">No matches</div>`;
          return;
        }

        sug.innerHTML = items
          .map(n => `<div class="ac-item" data-name="${esc(n)}">${esc(n)}</div>`)
          .join('');
      } catch {
        sug.innerHTML = `<div class="ac-empty">Couldn’t load</div>`;
      }
    }, 180);
  });

  // click to choose
  sug.addEventListener('click', (e) => {
    const el = e.target.closest('.ac-item'); if (!el) return;
    input.value = el.dataset.name || el.textContent.trim();
    closeSug();
  });

  // basic keyboard helpers
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSug(); return; }
    if (e.key === 'Enter' && sug.style.display !== 'none') {
      const first = sug.querySelector('.ac-item');
      if (first) {
        input.value = first.dataset.name || first.textContent.trim();
        closeSug();
        e.preventDefault();
      }
    }
  });

  // click-away to close
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#n_suggest') && !e.target.closest('#n_name')) {
      closeSug();
    }
  });
})();


// New pack: add single card
on($('n_add'),'click', async ()=>{
  const name = $('n_name').value.trim();
  if(!name) return alert('Enter a card name.');

  // close autosuggest if open
  const sug = document.getElementById('n_suggest');
  if (sug) { sug.style.display = 'none'; sug.innerHTML = ''; }
  
  let qty  = Math.max(1, parseInt($('n_qty').value||'1',10));
  let mana = $('n_mana').value.trim();
  let type = $('n_type').value.trim();

  if(!mana || !type){
    try{
      const card = await scryfallNamedExactQueued(name);
      mana = mana || (card.mana_cost||'');
      type = type || (card.type_line||'');
    }catch{/* ok */}
  }

  const item = normalizeDeckItem({ name, qty, mana, type });
  if(!item) return;

  // merge by name
  const key = item.name.toLowerCase();
  const idx = state.newPackDeck.findIndex(d=>d.name.toLowerCase()===key);
  if(idx>=0){
    const prev = state.newPackDeck[idx];
    prev.qty += item.qty;
    if(!prev.mana && item.mana) prev.mana = item.mana;
    if(!prev.type && item.type) prev.type = item.type;
  }else{
    state.newPackDeck.push(item);
  }

  $('n_name').value=''; $('n_qty').value='1'; $('n_mana').value=''; $('n_type').value='';
  renderNewPackDeck();
});



// New pack: bulk paste popup
on($('n_bulk_open'),'click', ()=>{
  openModal({
    title:'Bulk Paste for New Pack',
    okText:'Parse & Add',
    bodyHTML:`<textarea id="n_bulk_ta" rows="10" style="width:100%"></textarea>`,
    onOpen: ()=> $('n_bulk_ta')?.focus(),
    onOK: async ()=>{
      const ta = $('n_bulk_ta'); if(!ta) return;
      const items = parseDeckText(ta.value);
      if(!items.length) return;
      const enriched = await enrichWithScryfallMin(items);

      // merge into staging deck
      const map = new Map(state.newPackDeck.map(d=>[d.name.toLowerCase(), { ...d }]));
      for(const it of enriched){
        const k = it.name.toLowerCase();
        const prev = map.get(k);
        if(prev){
          prev.qty += Math.max(1, it.qty|0);
          if(!prev.mana && it.mana) prev.mana = it.mana;
          if(!prev.type && it.type) prev.type = it.type;
        }else{
          map.set(k, normalizeDeckItem(it));
        }
      }
      state.newPackDeck = Array.from(map.values()).map(normalizeDeckItem).filter(Boolean);
      renderNewPackDeck();
    }
  });
});




function renderTagFilter(seedSettings = activeSettings()){
  const box = $('tagFilterBox'); if(!box) return;
  const counts = computeTagCounts();
  const all = Array.from(counts.keys()).sort((a,b)=>a.localeCompare(b));
  const scope = (seedSettings === state.settingsPlay) ? 'play' : 'collection';
  box.dataset.scope = scope;

  if(!all.length){
    box.innerHTML = '<div class="tiny">No tags yet.</div>';
    seedSettings.tagFilter = [];
    return;
  }

  box.classList.add('set-grid');
  box.innerHTML = all.map(t=>{
    const count = counts.get(t)||0;
    const on = seedSettings.tagFilter.includes(t);
    const safe = esc(t);
    return `<div role="button" tabindex="0"
                 class="set-chip ${on?'active':''}"
                 data-tag="${safe}"
                 aria-pressed="${on?'true':'false'}">
              <span class="name">#${safe}</span>
              <span class="count">${count}</span>
            </div>`;
  }).join('');

  const currentSettings = () =>
    (box.dataset.scope === 'play') ? state.settingsPlay : state.settingsCollection;

  const toggle = (el)=>{
    const s = currentSettings();
    const key = el?.dataset?.tag; if(!key) return;
    const on = s.tagFilter.includes(key);
    if(on){
      s.tagFilter = s.tagFilter.filter(x=>x!==key);
      el.classList.remove('active'); el.setAttribute('aria-pressed','false');
    }else{
      s.tagFilter.push(key);
      el.classList.add('active'); el.setAttribute('aria-pressed','true');
    }
    if(s === state.settingsCollection){ s.page=1; renderCollection(); }
  };

  if(!box.__bound){
    box.addEventListener('click', e=>{
      const el = e.target.closest('.set-chip'); if(!el) return; toggle(el);
    });
    box.addEventListener('keydown', e=>{
      if(e.key===' ' || e.key==='Enter'){
        const el = e.target.closest('.set-chip'); if(!el) return; e.preventDefault(); toggle(el);
      }
    });
    box.__bound = true;
  }
}







// Keyword search
on($('searchPacks'),'input', e=>{
  state.settingsCollection.search = (e.target.value||'').toLowerCase();
  state.settingsCollection.page = 1; renderCollection();
});

// Has deck only
on($('hasDeckOnly'),'change', e=>{
  state.settingsCollection.hasDeckOnly = !!e.target.checked;
  state.settingsCollection.page = 1; renderCollection();
});

// Color mode (any/all/exact)
on($('colorMode'),'change', e=>{
  state.settingsCollection.colorMode = e.target.value || 'any';
  state.settingsCollection.page = 1; renderCollection();
});

// Type checkboxes
function syncCtypeFromUI(){
  const arr = [];
  if($('ctypeMono')?.checked) arr.push(1);
  if($('ctypeBi')?.checked)   arr.push(2);
  if($('ctypeTri')?.checked)  arr.push(3);
  state.settingsCollection.ctypeFilter = arr;
}
['ctypeMono','ctypeBi','ctypeTri'].forEach(id=>{
  on($(id),'change', ()=>{ syncCtypeFromUI(); state.settingsCollection.page=1; renderCollection(); });
});

// Numeric usage filters
function wireNum(id, key, clamp){
  on($(id),'input', e=>{
    let v = parseInt(e.target.value||'0',10);
    if(Number.isNaN(v)) v = 0;
    if(clamp) v = clamp(v);
    state.settingsCollection[key] = v;
    state.settingsCollection.page = 1;
    renderCollection();
  });
}
wireNum('minOffered','minOffered', v=>Math.max(0,v));
wireNum('minPicked','minPicked',   v=>Math.max(0,v));
wireNum('minPickRate','minPickRate', v=>Math.min(100,Math.max(0,v)));
wireNum('maxPickRate','maxPickRate', v=>Math.min(100,Math.max(0,v)));

// Initialize defaults in UI (optional for now)
$('colorMode').value = state.settingsCollection.colorMode;
['ctypeMono','ctypeBi','ctypeTri'].forEach(id=>{ if($(id)) $(id).checked = false; });
$('minOffered').value   = state.settingsCollection.minOffered;
$('minPicked').value    = state.settingsCollection.minPicked;
$('minPickRate').value  = state.settingsCollection.minPickRate;
$('maxPickRate').value  = state.settingsCollection.maxPickRate;

const inc = $('includeDeckSearch');
if (inc) inc.checked = !!state.settingsCollection.includeDeckSearch;



    // Pagination & sort
on($('pageSize'),'change',e=>{
  const v=Math.max(5,Math.min(200,parseInt(e.target.value||'20',10)));
  e.target.value=v;
  state.settingsCollection.pageSize=v;
  state.settingsCollection.page=1;
  renderCollection();
});
on($('prevPage'),'click',()=>{ state.settingsCollection.page=Math.max(1,state.settingsCollection.page-1); renderCollection(); });
on($('nextPage'),'click',()=>{ state.settingsCollection.page=state.settingsCollection.page+1; renderCollection(); });
on($('jumpPage'),'change',e=>{ const v=Math.max(1,parseInt(e.target.value||'1',10)); state.settingsCollection.page=v; renderCollection(); });
on($('sortBy'),'change',e=>{ state.settingsCollection.sortBy=e.target.value; renderCollection(); });
on($('sortDir'),'click',()=>{
  state.settingsCollection.sortDir=(state.settingsCollection.sortDir==='asc'?'desc':'asc');
  $('sortDir').textContent=state.settingsCollection.sortDir==='asc'?'Asc':'Desc';
  renderCollection();
});


    // First roll
on($('rollFirstBtn'),'click',()=>{
  const settings = state.settingsPlay;
  const base = state.collection.filter(p=>matchFilters(p, settings));
  const N = settings.optionsPerRoll;
  if(base.length<N) return alert(`Need at least ${N} eligible packs (after filters) to roll.`);
  resetSession();
  const sample = settings.fairMode ? weightedSample(base,N,fairWeight) : pickRandom(base,N);
  state.session.firstOptions = sample; incOfferCounts(sample);
  renderOptions('firstOptions', sample, (p)=>{
    state.session.chosenFirst=p;
    incPick(p);
    state.session.usedIds.add(p.id);
    $('chosenFirstWrap').style.display='';
    $('chosenFirst').innerHTML=`<div class="option">${renderOptionCard(p, settings)}</div>`;
    $('statusLine').textContent='First choice locked. Now roll the second set.'; log(`Picked first: "${p.name}" [${p.colors.join('')}]`);
    const oSel=$('overlapColor'), oWrap=$('overlapWrap');
    if(p.colors.length===2){
      oSel.innerHTML = ` <option value="AUTO">Auto (either color)</option>`+p.colors.map(c=>`<option value="${c}">Force overlap: ${c}</option>`).join('');
      oSel.value = settings.overlapColor = 'AUTO';
      oWrap.style.display='';
    } else {
      oWrap.style.display='none';
      settings.overlapColor='AUTO';
    }
    renderGuardrails(settings);
  }, state.settingsPlay);
  $('statusLine').textContent=`First options rolled (${N}). Pick one.`; log(`Rolled first ${N} options.`);
});




    // Second roll (and re-roll) — hide when not ready
function doSecondRoll(){
  const settings = state.settingsPlay; 
  const first = state.session.chosenFirst;
  if(!first) return;

  const N = settings.optionsPerRoll; 
  let remaining = poolRemaining(settings); 
  if(settings.excludeUnpicked && state.session.firstOptions.length){
    const ids = new Set(state.session.firstOptions.filter(p=>p.id!==first.id).map(p=>p.id));
    remaining = remaining.filter(p=>!ids.has(p.id));
    log('Excluded the unpicked from first roll.');
  }

  const fc = first.colors;

  if(fc.length===1){
    const C = fc[0];
    const monoPool = remaining.filter(isMono);
    const biOverlap = remaining.filter(p=>isBi(p) && p.colors.includes(C));
    const picks = drawWithWeights({
      pool: remaining.slice(),
      wantTotal: N,
      wantTriPct: settings.triSharePct,
      capOneTri: settings.capOneTri,
      constraints: { require:[
        { pool: monoPool,  count:1 },
        { pool: biOverlap, count:1 }
      ]},
      allowTri: triAllowed(settings)
    });
    finalizeSecondRoll(picks, '', settings);
    return;
  }

  if(fc.length===2){
    const [C1,C2] = fc;
    const monoPool = remaining.filter(isMono);
    const biPool   = remaining.filter(isBi);

    let monoC1    = monoPool.filter(p=>p.colors[0]===C1);
    let monoC2    = monoPool.filter(p=>p.colors[0]===C2);
    let twoExact  = biPool.filter(p=>p.colors.includes(C1)&&p.colors.includes(C2));

    if(settings.overlapColor!=='AUTO'){
      twoExact = twoExact.filter(p=>p.colors.includes(settings.overlapColor));
    }

    let note = '';
    if(settings.relaxIfStuck){
      if(monoC1.length<1){ monoC1 = monoPool.slice(); note += ` (relaxed: missing ${C1} mono)`; }
      if(monoC2.length<1){ monoC2 = monoPool.slice(); note += ` (relaxed: missing ${C2} mono)`; }
    }

    const constraints = { require:[
      { pool: monoC1,                          count:1 },
      { pool: monoC2.filter(p=>!monoC1.includes(p)), count:1 }
    ]};
    if(twoExact.length) constraints.require.push({ pool: twoExact, count:1 });

    const overlapPreferred = remaining.filter(p=>{
      if(isBi(p))  return p.colors.includes(C1)||p.colors.includes(C2);
      if(isTri(p)) return p.colors.includes(C1)&&p.colors.includes(C2);
      return true;
    });

    const picks = drawWithWeights({
      pool: overlapPreferred,
      wantTotal: N,
      wantTriPct: settings.triSharePct,
      capOneTri: settings.capOneTri,
      constraints,
      allowTri: triAllowed(settings)
    });

    finalizeSecondRoll(picks, note, settings);
    return;
  }

  // fc.length === 3
  {
    const firstSet = new Set(fc);
    const monoPool = remaining.filter(p=>isMono(p)&&firstSet.has(p.colors[0]));
    const monoBy = {};
    for(const c of fc){ monoBy[c] = monoPool.filter(p=>p.colors[0]===c); }

    const have = Object.entries(monoBy).filter(([,arr])=>arr.length).map(([c])=>c);
    let req = [];
    if(have.length>=2){
      const a = have[0], b = have[1];
      req.push({ pool: monoBy[a], count:1 });
      req.push({ pool: monoBy[b].filter(p=>!monoBy[a].includes(p)), count:1 });
    } else {
      req.push({ pool: monoPool, count:2 });
    }

    const picks = drawWithWeights({
      pool: remaining.filter(p=>isMono(p)||isBi(p)||isTri(p)),
      wantTotal: N,
      wantTriPct: settings.triSharePct,
      capOneTri: settings.capOneTri,
      constraints: { require: req },
      allowTri: triAllowed(settings)
    });

    finalizeSecondRoll(picks, '', settings);
  }
}



    on($('rollSecondBtn'),'click',()=>{ if(!state.session.chosenFirst) return; doSecondRoll(); });
    on($('rerollSecondBtn'),'click',()=>{ if(!state.session.chosenFirst) return; state.session.secondOptions.forEach(p=>state.session.usedIds.delete(p.id)); state.session.secondOptions=[]; doSecondRoll(); log('Re-rolled second options.'); });




    function finalizeSecondRoll(picks, note = '', settings = state.settingsPlay){
      const uniq=[]; 
      for(const p of picks){ if(p && !uniq.some(x=>x.id===p.id)) uniq.push(p); }
      const N=settings.optionsPerRoll;
      if (uniq.length < N) {
        let fill = poolRemaining(settings).filter(p=>!uniq.some(x=>x.id===p.id)); 
        if (!triAllowed(settings)) fill = fill.filter(p=>!isTri(p));
        if (!fill.length && settings.relaxIfStuck){ 
          fill = poolRemaining(settings).filter(p=>!uniq.some(x=>x.id===p.id)); 
          note=(note?note+' ':'')+'(relaxed: allowed tri to fill)'; }
     const takeMore = settings.fairMode
      ? (arr,k)=>weightedSample(arr,k,fairWeight)
      : (arr,k)=>pickRandom(arr,k);
    uniq.push(...takeMore(fill, N-uniq.length));      }
      const final=shuffle(uniq).slice(0,N); state.session.secondOptions=final; final.forEach(p=>state.session.usedIds.add(p.id)); incOfferCounts(final);
$('secondOptions').innerHTML = final.map(p=>{
  const hasDeck = Array.isArray(p.deck) && p.deck.length;
  return `
    <div class="option">
      ${renderOptionCard(p, settings)}
      <div class="pill">
        <button class="btn btn-pink" data-pick="${p.id}">Choose</button>
        ${hasDeck ? `<button class="btn btn-gray" type="button" data-viewdeck="${p.id}">View Deck</button>` : ''}
      </div>
    </div>`;
}).join('');

// Wire up BOTH buttons (no undefined variables)
final.forEach(p=>{
  // Choose
  const pickBtn = $('secondOptions').querySelector(`button[data-pick="${p.id}"]`);
  pickBtn?.addEventListener('click', ()=>{
    state.session.chosenSecond = p;
    $('finalPairWrap').style.display='';
    const a = state.session.chosenFirst;

    $('finalPair').innerHTML = `
      <div class="option">${renderOptionCard(a)}</div>
      <div class="option">${renderOptionCard(p, settings)}</div>`;

    // View Combined Deck on the final pair
    const merged = combineDecks(a, p);
    $('finalPair').insertAdjacentHTML('beforeend', `
      <div class="pill" style="margin-top:8px">
        <button id="btnViewFinalCombinedDeck" class="btn btn-cyan" type="button">View Combined Deck</button>
      </div>
    `);
    $('btnViewFinalCombinedDeck')?.addEventListener('click', ()=>{
      openModal({
        title: `Combined Deck — ${a.name} + ${p.name}`,
        okText: 'Close',
        bodyHTML: (typeof renderDeckColumnsHTML === 'function')
          ? renderDeckColumnsHTML(merged)
          : renderDeckBlock({ deck: merged })
      });
    });

    $('statusLine').textContent='Final pair ready!';
    log(`Picked second: "${p.name}" [${p.colors.join('')}]`);
    recordDraft(a, p);
    renderHistory();
  });

  // View Deck (for the candidate second pack)
  const viewBtn = $('secondOptions').querySelector(`button[data-viewdeck="${p.id}"]`);
  viewBtn?.addEventListener('click', ()=>{
    openModal({
      title: `Deck — ${p.name}`,
      okText: 'Close',
      bodyHTML: renderDeckColumnsHTML(Array.isArray(p.deck) ? p.deck : [])
    });
  });
});



      $('statusLine').textContent = `Second options rolled (${N}). Pick one. ${note}`; log(`Rolled second ${N} options${note?' '+note:''}.`);
    }



    // Player mode
on($('dealBtn'),'click',()=>{
  const settings = state.settingsPlay;
  const P=settings.players, out=[], tmpUsed=new Set(), avoid=settings.avoidCollisions;
  if(state.collection.filter(p=>matchFilters(p, settings)).length < P*2) return alert('Not enough eligible packs to deal pairs for all players.');
      
      
      
      for(let i=1;i<=P;i++){
        let pool1=state.collection.filter(p=>(!avoid||!tmpUsed.has(p.id))&&matchFilters(p, settings));
        if(!pool1.length){ alert('Ran out of packs.'); break; }
        const first=(settings.fairMode?weightedSample(pool1,1,fairWeight):pickRandom(pool1,1))[0];
        if(avoid) tmpUsed.add(first.id);
        let remaining=state.collection.filter(p=>(!avoid||!tmpUsed.has(p.id))&&p.id!==first.id&&matchFilters(p, settings));
        const saver={...state.session}; state.session.chosenFirst=first; state.session.usedIds=new Set(avoid?tmpUsed:[]);
        const N=settings.optionsPerRoll;
        const genSecond=(()=>{
          const fc=first.colors;
          if(fc.length===1){ const C=fc[0], mono=remaining.filter(isMono), bi=remaining.filter(p=>isBi(p)&&p.colors.includes(C)); 
          return drawWithWeights({
            pool:remaining.slice(),
            wantTotal:N,
            wantTriPct:settings.triSharePct,
            capOneTri:settings.capOneTri,
            constraints:{require:[{pool:mono,count:1},{pool:bi,count:1}]},
            allowTri:triAllowed(settings),
            settings
          }); }
          if(fc.length===2){ const [C1,C2]=fc; let mono=remaining.filter(isMono), bi=remaining.filter(isBi); let m1=mono.filter(p=>p.colors[0]===C1), m2=mono.filter(p=>p.colors[0]===C2), two=bi.filter(p=>p.colors.includes(C1)&&p.colors.includes(C2)); if(settings.overlapColor!=='AUTO') two=two.filter(p=>p.colors.includes(settings.overlapColor)); if(settings.relaxIfStuck){ if(m1.length<1)m1=mono.slice(); if(m2.length<1)m2=mono.slice(); } const req=[{pool:m1,count:1},{pool:m2.filter(p=>!m1.includes(p)),count:1}]; if(two.length) req.push({pool:two,count:1}); const pref=remaining.filter(p=>isBi(p)?(p.colors.includes(C1)||p.colors.includes(C2)):isTri(p)?(p.colors.includes(C1)&&p.colors.includes(C2)):true); 
          return drawWithWeights({
            pool:pref,wantTotal:N,
            wantTriPct:settings.triSharePct,
            capOneTri:settings.capOneTri,
            constraints:{require:req},
            allowTri:triAllowed(settings),
            settings}); }
          const setFirst=new Set(fc), mono=remaining.filter(p=>isMono(p)&&setFirst.has(p.colors[0])), by={}; for(const c of fc){ by[c]=mono.filter(p=>p.colors[0]===c); } const have=Object.entries(by).filter(([,a])=>a.length).map(([c])=>c); let req=[]; if(have.length>=2){ const a=have[0], b=have[1]; req.push({pool:by[a],count:1}); req.push({pool:by[b].filter(p=>!by[a].includes(p)),count:1}); } else req.push({pool:mono,count:2}); 
          return drawWithWeights({
            pool:remaining.filter(p=>isMono(p)||isBi(p)||isTri(p)),
            wantTotal:N,
            wantTriPct:settings.triSharePct,
            capOneTri:settings.capOneTri,
            constraints:{require:req},
            allowTri:triAllowed(settings),
          settings
        });
        })();
        const second=(settings.fairMode?weightedSample(genSecond,1,fairWeight):pickRandom(genSecond,1))[0];
        if(!second){ alert('Could not find a valid second pick for a player.'); break; }
        incPick(first); 
        incPick(second);
        if(avoid) tmpUsed.add(second.id);
        out.push({first,second}); incOfferCounts([first, ...genSecond]); incOfferCounts([second]); state.session=saver;
      }
const wrap = $('dealtResults');
wrap.innerHTML = out.map((pair,i)=>`
  <div class="option">
    <div>
      <strong>Player ${i+1}</strong>
      <div style="margin-top:6px">
        <div>${renderOptionCard(pair.first)}</div>
        <div style="margin-top:6px">${renderOptionCard(pair.second)}</div>
      </div>
    </div>
    <div class="pill" style="margin-top:8px">
      <button class="btn btn-cyan" type="button" data-viewdeal="${i}">🗂 View Combined Deck</button>
    </div>
  </div>
`).join('') || `<div class="hint">No result.</div>`;

// per-player combined deck view
out.forEach((pair,i)=>{
  wrap.querySelector(`button[data-viewdeal="${i}"]`)?.addEventListener('click', ()=>{
    const merged = combineDecks(pair.first, pair.second);
    openModal({
      title: `Player ${i+1} — ${pair.first.name} + ${pair.second.name}`,
      okText: 'Close',
      bodyHTML: renderDeckColumnsHTML(merged)
    });
  });
});

$('dealSummary').textContent=`Dealt ${out.length} / ${settings.players}${settings.avoidCollisions?' (no pack reuse)':''}.`;
    });



    on($('clearDealsBtn'),'click',()=>{$('dealtResults').innerHTML=''; $('dealSummary').textContent='';});

    // Keyboard shortcuts — ignore modifiers, inputs, hidden state; silent when not ready
    document.addEventListener('keydown',e=>{
      if(e.ctrlKey || e.metaKey || e.altKey) return;          // block Ctrl/Cmd/Alt combos i think
      if(document.visibilityState === 'hidden') return;        // avoid during reload/blur edge cases
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return; // don't steal typing

      const k=e.key.toLowerCase();

      if('123456'.includes(k)){
        const idx=Number(k)-1;
        const container=state.session.chosenFirst?$('secondOptions'):$('firstOptions');
        const btn=container?.querySelectorAll('button[data-pick]')[idx];
        if(btn){ btn.click(); e.preventDefault(); }
      }

      if(k==='r'){
        if(state.session.chosenFirst){
          $('rerollSecondBtn')?.click();
          e.preventDefault();
        }
        return;
      }

      if(k==='f'){
        $('rollFirstBtn')?.click();
        e.preventDefault();
      }
    });

    // Reset session button
    on($('resetPlayBtn'),'click', resetSession);

    // Demo seed
    on($('seedBtn'),'click',()=>{
      const id=()=>Math.random().toString(36).slice(2,10);
      const demo=[
 // ── Mono (Hydra Demo Mono)
    { name:'Wrath of Hydras',     theme:'Big Stompy',               colors:['G'], set:'Hydra Demo Mono' },
    { name:'Hydra Hatchlings',    theme:'Tokens that Grow',         colors:['G'], set:'Hydra Demo Mono' },
    { name:'Primeval Hydra',      theme:'Ramp & Fight',             colors:['G'], set:'Hydra Demo Mono' },
    { name:'Brainstorm Hydra',    theme:'Card Draw & X-Spells',     colors:['U'], set:'Hydra Demo Mono' },
    { name:'Tidal Hydra',         theme:'Tempo & Tricks',           colors:['U'], set:'Hydra Demo Mono' },
    { name:'Necrohydra',          theme:'Graveyard Recursion',      colors:['B'], set:'Hydra Demo Mono' },
    { name:'Swamp Hydra',         theme:'Menace & Lifedrain',       colors:['B'], set:'Hydra Demo Mono' },
    { name:'Blazing Hydra',       theme:'Burn & Haste',             colors:['R'], set:'Hydra Demo Mono' },
    { name:'Ember Hydra',         theme:'Prowess & Firebreath',     colors:['R'], set:'Hydra Demo Mono' },
    { name:'Solar Hydra',         theme:'Vigilance & Lifegain',     colors:['W'], set:'Hydra Demo Mono' },
    { name:'Aegis Hydra',         theme:'Knights & Shields',        colors:['W'], set:'Hydra Demo Mono' },

    // ── Two-color (Hydra Demo Duals)
    { name:'Mystic Hydra',        theme:'Ramp & Draw (Simic)',      colors:['U','G'], set:'Hydra Demo Duals' },
    { name:'Cytogrowth Hydra',    theme:'+1/+1 Counters (Simic)',   colors:['U','G'], set:'Hydra Demo Duals' },
    { name:'Wildfire Hydra',      theme:'Stompy Aggro (Gruul)',     colors:['R','G'], set:'Hydra Demo Duals' },
    { name:'Stampede Hydra',      theme:'Bloodrush & Fight',        colors:['R','G'], set:'Hydra Demo Duals' },
    { name:'Sunbloom Hydra',      theme:'Tokens & Pump (Selesnya)', colors:['G','W'], set:'Hydra Demo Duals' },
    { name:'Garden Hydra',        theme:'Go Wide Hydras',           colors:['G','W'], set:'Hydra Demo Duals' },
    { name:'Stormscale Hydra',    theme:'Spells Matter (Izzet)',    colors:['U','R'], set:'Hydra Demo Duals' },
    { name:'Arcflash Hydra',      theme:'Instants & Tricks',        colors:['U','R'], set:'Hydra Demo Duals' },
    { name:'Venomous Hydra',      theme:'Deathtouch & Removal (Golgari)', colors:['B','G'], set:'Hydra Demo Duals' },
    { name:'Rotwood Hydra',       theme:'Graveyard & Counters',     colors:['B','G'], set:'Hydra Demo Duals' },
    { name:'Oathbound Hydra',     theme:'Aristocrats (Orzhov)',     colors:['W','B'], set:'Hydra Demo Duals' },
    { name:'Skywarden Hydra',     theme:'Flyers & Control (Azorius)', colors:['W','U'], set:'Hydra Demo Duals' },
    { name:'Sunfang Hydra',       theme:'Aggro Pump (Boros)',       colors:['W','R'], set:'Hydra Demo Duals' },
    { name:'Bloodfire Hydra',     theme:'Madness & Burn (Rakdos)',  colors:['B','R'], set:'Hydra Demo Duals' },
    { name:'Mindspore Hydra',     theme:'Sabotage & Draw (Dimir)',  colors:['U','B'], set:'Hydra Demo Duals' },

    // ── Tri-color (Hydra Demo Tri) — for future-proof testing
    { name:'Chromatic Hydra',     theme:'Ramp into Multicolor X',   colors:['G','U','R'], set:'Hydra Demo Tri' },
    { name:'Shadowcoil Hydra',    theme:'Sneak & Recur',            colors:['U','B','G'], set:'Hydra Demo Tri' },
    { name:'Pyrestorm Hydra',     theme:'Tokens & Pump Aggro',      colors:['R','W','G'], set:'Hydra Demo Tri' },
    { name:'Celestial Hydra',     theme:'Value & ETB',              colors:['W','U','G'], set:'Hydra Demo Tri' }      ].map(p=>({id:id(),...p}));
      state.collection=demo; state.fair={}; saveAll(); resetSession(); state.settingsCollection.page = 1; $('statusLine').textContent='Demo packs loaded.'; refreshStorageHealth(); log('Demo packs loaded (12).');
    });

// Init
resetSession();
state.settingsCollection.view = 'collection';
updateView();
renderEverything();
});

// --- Mana grid wiring (row-filling buttons incl. Colorless) ---
(function initManaGrid(){
  function ready(fn){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, { once:true });
    } else { fn(); }
  }

  ready(() => {
    const grid = document.getElementById('manaGrid');        // <div id="manaGrid">…</div>
    if (!grid) return;

    const hint = document.getElementById('manaHint');         // <div id="manaHint">
    const h1 = document.getElementById('color1');             // hidden inputs you already use
    const h2 = document.getElementById('color2');
    const h3 = document.getElementById('color3');

    const ORDER = ['W','U','B','R','G','C']; // include Colorless

    function getSelected(){
      const sel = Array.from(grid.querySelectorAll('.mana-btn.selected')).map(b => b.dataset.color);
      return ORDER.filter(c => sel.includes(c));
    }
    function syncHidden(){
      const colors = getSelected();
      h1.value = colors[0] || '';
      h2.value = colors[1] || '';
      h3.value = colors[2] || '';
      if (hint){
        const n = colors.length;
        hint.textContent = n===0 ? 'Select 1–3 colors.'
                      : n===1 ? 'Mono color.'
                      : n===2 ? 'Two-color.'
                      : 'Tri-color.';
      }
    }

    // Click to toggle (max 3)
    grid.addEventListener('click', (e)=>{
      const btn = e.target.closest('.mana-btn');
      if (!btn || !grid.contains(btn)) return;
      const isSelected = btn.classList.contains('selected');
      const count = grid.querySelectorAll('.mana-btn.selected').length;
      if (!isSelected && count >= 3){
        if (hint) hint.textContent = 'You can select up to 3 colors.';
        return;
      }
      btn.classList.toggle('selected');
      btn.setAttribute('aria-pressed', btn.classList.contains('selected') ? 'true' : 'false');
      syncHidden();
    });

    // Public reset used after adding/clearing the form
    window.resetManaSelection = function resetManaSelection(){
      grid.querySelectorAll('.mana-btn.selected').forEach(b=>{
        b.classList.remove('selected');
        b.setAttribute('aria-pressed','false');
      });
      h1.value = h2.value = h3.value = '';
      if (hint) hint.textContent = 'Select 1–3 colors.';
    };

    // If hidden inputs already had values (edit flows), reflect in UI
    [h1.value, h2.value, h3.value].filter(Boolean).forEach(c=>{
      const btn = grid.querySelector(`.mana-btn[data-color="${c}"]`);
      if (btn){ btn.classList.add('selected'); btn.setAttribute('aria-pressed','true'); }
    });
    syncHidden();
  });
})();




function safePct(n, d){ return d ? Math.round((n/d)*100) : 0; }

function computeUsageStats(){
  const packs = state.collection || [];
  const fair  = state.fair || {};

  const rows = packs.map(p=>{
    const f = fair[p.id] || {};
    const offer = Number(f.offer)||0;
    const pick  = Number(f.pick)||0;
    return { id:p.id, name:p.name, set:p.set||'Unlabeled', colors:p.colors.slice(), ctype:p.colors.length, offer, pick, pr:safePct(pick, offer) };
  });

  const totalPacks   = rows.length;
  const totalOffered = rows.reduce((a,r)=>a+r.offer,0);
  const totalPicked  = rows.reduce((a,r)=>a+r.pick,0);
  const overallPR    = safePct(totalPicked, totalOffered);
  const zeroOffered  = rows.filter(r=>r.offer===0).length;
  const zeroPicked   = rows.filter(r=>r.offer>0 && r.pick===0).length;

  const colorOrder = ['W','U','B','R','G','C'];
  const byColor = Object.fromEntries(colorOrder.map(c=>[c,0]));
  rows.forEach(r=> r.colors.forEach(c=>{ if(byColor[c]!==undefined) byColor[c]++; }));

  const byCtype = { mono:0, bi:0, tri:0 };
  rows.forEach(r=>{
    if(r.ctype===1) byCtype.mono++;
    else if(r.ctype===2) byCtype.bi++;
    else if(r.ctype===3) byCtype.tri++;
  });

  const bySet = new Map();
  rows.forEach(r=>{
    const key = r.set || 'Unlabeled';
    if(!bySet.has(key)) bySet.set(key, { set:key, packs:0, offer:0, pick:0 });
    const s = bySet.get(key);
    s.packs++; s.offer+=r.offer; s.pick+=r.pick;
  });
  const bySetArr = Array.from(bySet.values()).map(s=>({ ...s, pr:safePct(s.pick, s.offer)}))
                       .sort((a,b)=> b.packs - a.packs);

  const topN = 5, minOffers = 5;
  const topOffered = rows.slice().sort((a,b)=> b.offer - a.offer).slice(0, topN);
  const topPicked  = rows.slice().sort((a,b)=> b.pick  - a.pick ).slice(0, topN);
  const topPickRate = rows.filter(r=>r.offer>=minOffers)
                          .sort((a,b)=> b.pr - a.pr)
                          .slice(0, topN);

  return {
    totalPacks, totalOffered, totalPicked, overallPR, zeroOffered, zeroPicked,
    byColor, byCtype, bySetArr, topOffered, topPicked, topPickRate
  };
}

function renderStatsPanel(){
  const host = document.getElementById('statsPanel');
  if(!host) return;

  const s = computeUsageStats();
  const colorOrder = ['W','U','B','R','G','C'];
  const colorChips = colorOrder.map(c=>`<span class="c ${c}">${c}: ${s.byColor[c]||0}</span>`).join('');
  const setList = s.bySetArr.slice(0,8).map(x=>{
    return `<li><span class="lhs">${esc(x.set)} — ${x.packs} packs</span><span class="rhs">${x.pick}/${x.offer} • ${x.pr}%</span></li>`;
  }).join('') || `<li><span class="lhs">No data</span><span class="rhs">–</span></li>`;
  const lb = (arr)=> arr.map(r=>{
    const meta = `${r.colors.join('')} • ${r.set}`;
    return `<li>
      <span class="lhs"><strong>${esc(r.name)}</strong> <span class="tiny">(${esc(meta)})</span></span>
      <span class="rhs">${r.pick}/${r.offer}${r.offer?` • ${r.pr}%`:''}</span>
    </li>`;
  }).join('') || `<li><span class="lhs">No data</span><span class="rhs">–</span></li>`;

  host.innerHTML = `
    <div class="kpis">
      <div class="kpi"><div class="label">Packs</div><div class="value">${s.totalPacks}</div></div>
      <div class="kpi"><div class="label">Offered</div><div class="value">${s.totalOffered}</div></div>
      <div class="kpi"><div class="label">Picked</div><div class="value">${s.totalPicked}</div></div>
      <div class="kpi"><div class="label">Overall Pick-Rate</div><div class="value">${s.overallPR}%</div></div>
      <div class="kpi"><div class="label">Never Offered</div><div class="value">${s.zeroOffered}</div></div>
      <div class="kpi"><div class="label">Never Picked (offered)</div><div class="value">${s.zeroPicked}</div></div>
    </div>

    <div class="stats-grid">
      <div class="mini-table">
        <h4>By Color (pack count)</h4>
        <div class="colors">${colorChips}</div>
        <div class="meta" style="margin-top:6px">
          <span class="ctype mono">Mono: ${s.byCtype.mono}</span>
          <span class="ctype bi">Two-Color: ${s.byCtype.bi}</span>
          <span class="ctype tri">Tri-Color: ${s.byCtype.tri}</span>
        </div>
      </div>

      <div class="mini-table">
        <h4>By Set / Box (top 8)</h4>
        <ul>${setList}</ul>
      </div>

      <div class="mini-table">
        <h4>Top Offered</h4>
        <ul>${lb(s.topOffered)}</ul>
      </div>

      <div class="mini-table">
        <h4>Top Picked</h4>
        <ul>${lb(s.topPicked)}</ul>
      </div>

      <div class="mini-table">
        <h4>Best Pick-Rate (≥5 offers)</h4>
        <ul>${lb(s.topPickRate)}</ul>
      </div>
    </div>
  `;
}

function usageToCSV(){
  const rows = state.collection.map(p=>{
    const f = state.fair[p.id] || {};
    const offer = Number(f.offer)||0;
    const pick  = Number(f.pick)||0;
    const pr    = offer ? Math.round((pick/offer)*100) : 0;
    return {
      id:p.id, name:p.name, theme:p.theme||'', colors:(p.colors||[]).join(';'), set:p.set||'',
      offered:offer, picked:pick, pick_rate_pct:pr
    };
  });

  const header = Object.keys(rows[0]||{
    id:'',name:'',theme:'',colors:'',set:'',offered:0,picked:0,pick_rate_pct:0
  });
  const escCSV = (v)=> {
    const s=String(v??'');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const body = rows.map(r=> header.map(h=>escCSV(r[h])).join(',')).join('\n');
  return header.join(',')+'\n'+body;
}



})();