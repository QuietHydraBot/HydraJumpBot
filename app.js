/* 
    /$$$$$                                         /$$$$$$$              /$$    
   |__  $$                                        | $$__  $$            | $$    
      | $$ /$$   /$$ /$$$$$$/$$$$   /$$$$$$       | $$  \ $$  /$$$$$$  /$$$$$$  
      | $$| $$  | $$| $$_  $$_  $$ /$$__  $$      | $$$$$$$  /$$__  $$|_  $$_/  
 /$$  | $$| $$  | $$| $$ \ $$ \ $$| $$  \ $$      | $$__  $$| $$  \ $$  | $$    
| $$  | $$| $$  | $$| $$ | $$ | $$| $$  | $$      | $$  \ $$| $$  | $$  | $$ /$$
|  $$$$$$/|  $$$$$$/| $$ | $$ | $$| $$$$$$$/      | $$$$$$$/|  $$$$$$/  |  $$$$/
 \______/  \______/ |__/ |__/ |__/| $$____/       |_______/  \______/    \___/  
                                  | $$                                          
                                  | $$                                          
                                  |__/                                          */
/*
FILE: app.js — Hydra Jump Bot
SECTIONS:
  1) Boot & globals
  2) Storage (load/save/status)
  3) Scryfall helpers
  4) UI primitives (DOM $, modal)
  5) Collection view (filters, list, editor)
  6) Play/deal logic
  7) Stats view
  8) Events & shortcuts
*/
(()=>{

// === BOOT MARKER ===
window.__HYDRA_BOOT__ = 'Hydra script loaded: ' + (document.currentScript?.src || '(inline)') + ' @ ' + new Date().toISOString();
console.log(window.__HYDRA_BOOT__);

// ───────────────────────────────────────────────────────────
// 1) Boot & globals — constants, state, utils
// ───────────────────────────────────────────────────────────
  const LS_KEY='jumpstart_collection_v1';
  const LS_FAIR='jumpstart_fair_stats_v1';
  const LS_HISTORY = 'jumpstart_draft_history_v1';
  const LS_VIEW = 'jumpstart_last_view_v1';
  // [UTIL] $(id) — DOM getter
  const $=id=>document.getElementById(id);
  // [UTIL] on(el,ev,fn) — event binder
  const on=(el,ev,fn)=>el&&el.addEventListener(ev,fn);
  // [UTIL] NOOP callback used as a sentinel
  const NOOP = ()=>{};
  // [UTIL] uid() — short random id
  const uid=()=>Math.random().toString(36).slice(2,10);
  // [UTIL] esc(s) — HTML escape
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // [UTIL] showBusy(msg) / hideBusy() — global overlay for long tasks
  function showBusy(msg='Working…'){
  const el = $('busy'); if(!el) return;
  const m = $('busyMsg'); if(m) m.textContent = msg;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden','false');
  el.setAttribute('aria-busy','true');
  }
  function hideBusy(){
  const el = $('busy'); if(!el) return;
  el.classList.add('hidden');
  el.setAttribute('aria-hidden','true');
  el.setAttribute('aria-busy','false');
  }
  async function withBusy(msg, fn){
  let timer = setTimeout(()=>showBusy(msg), 120); // only show if it takes >120ms
  try { return await fn(); }
  finally { clearTimeout(timer); hideBusy(); }
  }

  // [OFFICIAL] Optional image overrides (pack id or name -> url)
window.OFFICIAL_IMAGE_MAP = {
  // 'jmp_goblins': 'img/goblins-pack.jpg',
  // 'Healing': 'img/healing.jpg'
};

  // [UTIL] $, on, uid, esc — DOM & string helpers

  const NO_TAGS = '__NO_TAGS__';

  // [UTIL] chips(colors) — render color chip spans
const chips=(colors)=>`<div class="colors">${colors.map(c=>`<span class="c ${c}">${c}</span>`).join('')}</div>`;

// New: richer type names (includes Colorless/Four/Five)
const typeOf = (p)=>{
  const cols = Array.isArray(p.colors) ? p.colors : [];
  if (cols.length === 0) return '';
  if (cols.length === 1 && cols[0] === 'C') return 'Colorless';
  if (cols.length === 1) return 'Mono';
  if (cols.length === 2) return 'Two-Color';
  if (cols.length === 3) return 'Tri-Color';
  if (cols.length === 4) return 'Four-Color';
  if (cols.length >= 5)  return 'Five-Color';
  return '';
};

const typeChip = (p)=>{
  const t = typeOf(p);
  const cls = {
    'Mono':'mono',
    'Two-Color':'bi',
    'Tri-Color':'tri',
    'Four-Color':'quad',
    'Five-Color':'penta',
    'Colorless':'colorless'
  }[t];
  return t ? `<span class="ctype ${cls}">${t}</span>` : '';
};

const isMono = p => p.colors.length===1 && p.colors[0] !== 'C';
const isBi   = p => p.colors.length===2;
const isTri  = p => p.colors.length===3;
// (4- and 5-color packs are treated as “other” for guardrails today)

  






















 
  // [UTIL] pickRandom(arr, n) — sample without replacement
  const pickRandom=(arr,n)=>{const a=arr.slice(),r=[];while(a.length&&r.length<n){r.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);}return r;};
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  
  // [UTIL] weightedSample(pool, n, weightFn) — weighted picker core
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

// [OFFICIAL] view state (filters and paging)
state.official = {
  search: '',
  colorFilter: [],
  colorMode: 'any',
  setFilter: [],
  kind: 'ALL',
  page: 1,
  pageSize: 24
};


// [UTIL] Parse tags: supports hashtags (#), commas, semicolons, and newlines.
// Spaces are allowed within a tag (e.g., "card draw").
// Examples:
//  "#graveyard #token makers"      -> ["graveyard","token makers"]
//  "graveyard, tokens; ramp\ndraw" -> ["graveyard","tokens","ramp","draw"]
function parseTags(raw){
  const norm = (s)=> s.trim().replace(/\s+/g,' ').replace(/^#+/,''); // collapse spaces; strip leading '#'
  if (!raw) return [];
  let s = String(raw).trim();
  if (!s) return [];
  // Make each '#' start a new token without splitting on spaces
  s = s.replace(/#/g, '\n#');
  const out = [];
  const seen = new Set();
  for (const part of s.split(/[,\;\r\n]+/)) {
    const t = norm(part);
    if (!t) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(t); }
  }
  return out;
}



// independent settings
state.settingsCollection = structuredClone(settingsDefaults);
state.settingsPlay = structuredClone(settingsDefaults);

// [UTIL] S(view) — pick settings bag (collection/play)
function S(view){ return view==='play' ? state.settingsPlay : state.settingsCollection; }

state.newPackDeck = [];

const vb = document.getElementById('appVersion');
if (vb) {
  const v = (window.HYDRA_VERSION || 'dev');
  vb.textContent = 'v' + v;
  vb.setAttribute('aria-label', `Hydra Jump Bot version ${v}`);
}





// ───────────────────────────────────────────────────────────
// 2) Storage — load/save/status & localStorage health
// ───────────────────────────────────────────────────────────
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
      return Array.isArray(arr)
        ? arr.filter(p =>
          p && p.id && p.name &&
          Array.isArray(p.colors) &&
          p.colors.length >= 1 && p.colors.length <= 5
        ): [];
    }catch(e){state.storageOK=false; 
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

// [UTIL] formatBytes(n) - Storage Health Thing
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
  $('storeHint').textContent = `Stored locally in your browser. Private/Incognito may send it to the graveyard.`;
}







/* ─────────────────────────────────────────────────────────
 * Magic Link Sync — collection an fair stats
 * Builds a URL-safe payload from the same data as Backup:
 *   { collection: state.collection, fair: state.fair, ts }
 * Payload format: "v1." + base64(json) OR "v1z." + base64(gzip(json))
 * Gzip is used when supported and smaller.
 * ─────────────────────────────────────────────────────────── */

function _bytesToB64Url(bytes){
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function _b64UrlToBytes(s){
  s = String(s||'').replace(/-/g,'+').replace(/_/g,'/');
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += '='.repeat(pad);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function _maybeGzip(bytes){
  if (typeof CompressionStream !== 'function') return null;
  try{
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const buf = await new Response(cs.readable).arrayBuffer();
    return new Uint8Array(buf);
  }catch{ return null; }
}
async function _maybeGunzip(bytes){
  if (typeof DecompressionStream !== 'function') return null;
  try{
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const buf = await new Response(ds.readable).arrayBuffer();
    return new Uint8Array(buf);
  }catch{ return null; }
}

function _magicPayload(){
  return {
    v: 1,
    ts: new Date().toISOString(),
    collection: Array.isArray(state.collection) ? state.collection : [],
    fair: (state.fair && typeof state.fair === 'object') ? state.fair : {}
  };
}

async function _encodeMagicLink(payload){
  const text = JSON.stringify(payload);
  const raw  = new TextEncoder().encode(text);
  const gz   = await _maybeGzip(raw);
  const use  = (gz && gz.length < raw.length) ? { bytes: gz, prefix: 'v1z.' } : { bytes: raw, prefix: 'v1.' };
  return use.prefix + _bytesToB64Url(use.bytes);
}

async function _decodeMagicLinkToken(token){
  let s = String(token||'');
  const isGz = s.startsWith('v1z.');
  const okV1 = isGz || s.startsWith('v1.');
  if (!okV1) throw new Error('Unknown Magic Link format');
  s = s.replace(/^v1z?\./,'');
  let bytes = _b64UrlToBytes(s);
  if (isGz){
    const ungz = await _maybeGunzip(bytes);
    if (ungz) bytes = ungz; // fall back to raw if ungzip unsupported
  }
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json || '{}');
}

function _baseURL(){
  const u = new URL(location.href);
  return u.origin + u.pathname;
}

function _baseURL(){
  const u = new URL(location.href);
  return u.origin + u.pathname;
}

function _baseURL(){
  const u = new URL(location.href);
  return u.origin + u.pathname;
}

async function createMagicLink(){
  const data  = _magicPayload();                     // collection + fair stats snapshot
  const token = await _encodeMagicLink(data);        // the compact ml token (starts with v1.)
  const link  = _baseURL() + '?ml=' + token + '#collection';

  openModal({
    title: 'Magic Link — Share or move your collection',
    okText: 'Close',
    bodyHTML: `
      <div class="callout" role="note" style="margin-bottom:8px">
        Opening this on another device will <strong>add missing packs</strong> (no duplicates).
        All stats are <strong>merged additively</strong>.
      </div>

      <label class="tiny">Link</label>
      <input id="mlinkField" type="text" value="${esc(link)}" style="width:100%" readonly>

      <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; align-items:center">
        <button class="btn" id="mlCopyBtn"  type="button">Copy Link</button>
        <button class="btn btn-gray" id="mlShareBtn" type="button">Share…</button>
        <span class="tiny" id="mlCopyNote" aria-live="polite"></span>
      </div>

      <hr style="margin:12px 0; opacity:.2">

      <label class="tiny">Token (shorter than full URL)</label>
      <input id="mlinkTokenField" type="text" value="${esc(token)}" style="width:100%" readonly>

      <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; align-items:center">
        <button class="btn btn-gray" id="mlCopyTokenBtn" type="button">Copy Token</button>
        <span class="tiny" id="mlCopyTokenNote" aria-live="polite"></span>
      </div>

      <div class="tiny" style="margin-top:8px; opacity:.8">
        Tip: Tokens work with <em>Paste Magic Link</em>.
      </div>
    `,
    onOpen(){
      const fLink   = $('mlinkField');
      const fToken  = $('mlinkTokenField');
      const bCopy   = $('mlCopyBtn');
      const bShare  = $('mlShareBtn');
      const bTok    = $('mlCopyTokenBtn');
      const note    = $('mlCopyNote');
      const tokNote = $('mlCopyTokenNote');

      if (fLink){ fLink.focus(); fLink.select(); }

      if (bCopy){
        bCopy.onclick = async ()=>{
          try{
            await navigator.clipboard.writeText(link);
            if (note) note.textContent = 'Copied ✔';
          }catch{
            if (note) note.textContent = 'Press Ctrl/Cmd+C to copy';
            if (fLink){ fLink.focus(); fLink.select(); }
          }
        };
      }

      if (bShare){
        if (navigator.share){
          bShare.onclick = async ()=>{
            try{
              await navigator.share({
                title: 'Hydra Jump Bot — Magic Link',
                text: 'Use this Magic Link to add my packs & fair stats:',
                url: link
              });
              if (note) note.textContent = 'Shared ✔';
            }catch(_){ /* user canceled */ }
          };
        } else {
          bShare.style.display = 'none';
        }
      }

      if (bTok){
        bTok.onclick = async ()=>{
          try{
            await navigator.clipboard.writeText(token);
            if (tokNote) tokNote.textContent = 'Token copied ✔';
          }catch{
            if (tokNote) tokNote.textContent = 'Press Ctrl/Cmd+C to copy';
            if (fToken){ fToken.focus(); fToken.select(); }
          }
        };
      }
    }
  });
}











// Extracts the ml token whether the user pastes a full URL or just the token
function _extractMagicToken(text){
  const raw = String(text||'').trim();
  if (!raw) return '';
  // Try URL first
  try {
    const u = new URL(raw);
    const t = u.searchParams.get('ml');
    if (t) return t;
  } catch(_) {}
  // Try query-like fragments
  const m = raw.match(/(?:[?&#]ml=)([A-Za-z0-9._-]+)/i);
  if (m && m[1]) return m[1];
  // Otherwise assume they pasted the token itself
  return raw.split(/\s/)[0];
}

// UI to paste a Magic Link / token and MERGE it into current device
async function openPasteMagicLink(){
  openModal({
    title: 'Import from Magic Link',
    okText: 'Merge Now',
    bodyHTML: `
      <label class="tiny">Paste link or token</label>
      <textarea id="pasteMagicField" rows="3" style="width:100%" placeholder="Paste a Magic Link URL or the token (starts with v1.)"></textarea>
      <div class="tiny" style="margin-top:8px; opacity:.8">
        This will <strong>add missing packs</strong> only (no duplicates).
        Fair stats will be <strong>merged additively</strong>.
      </div>
    `,
    async onOK(){
      const t = _extractMagicToken(($('pasteMagicField')?.value)||'');
      if (!t){ alert('Please paste a Magic Link URL or token.'); return; }

      let data;
      try {
        data = await _decodeMagicLinkToken(t);
      } catch (err){
        alert('Magic Link error: ' + (err?.message || err));
        return;
      }

      // Merge collection (ADD-ONLY)
      const incoming = Array.isArray(data?.collection) ? data.collection : [];
      const c = mergeCollectionsAddOnly(state.collection, incoming);

      // Merge fair stats additively (enabled below)
      if (ALLOW_FAIR_MERGE) {
        const f = mergeFairAdditive(state.fair, data?.fair);
        state.fair = f.merged;
      }

      state.collection = c.merged;
      saveAll();
      resetSession();
      alert(`Merge complete: +${c.added} added, ${c.skipped} duplicate${c.skipped===1?'':'s'} skipped.`);
    }
  });
}








































// === Magic Link: auto-MERGE on visit ========================================
async function checkForMagicLinkInURL(){
  const params = new URLSearchParams(location.search);
  const token  = params.get('ml');
  if (!token) return;

  // Decode payload
  let data = null;
  try {
    data = await _decodeMagicLinkToken(token);
  } catch (err){
    alert('Magic Link error: ' + (err?.message || err));
    // Clean token so it doesn't keep trying
    const u = new URL(location.href); u.searchParams.delete('ml');
    history.replaceState(null, '', u.toString());
    return;
  }

  // Merge collection: ADD only
  const incoming = Array.isArray(data?.collection) ? data.collection : [];
  const c = mergeCollectionsAddOnly(state.collection, incoming);

  // Fair stats: preserve by default; optionally additive merge
  if (ALLOW_FAIR_MERGE) {
    const f = mergeFairAdditive(state.fair, data?.fair);
    state.fair = f.merged;
  }
  // If not merging fair, leave state.fair unchanged.

  // Commit + clean URL + refresh UI
  state.collection = c.merged;
  saveAll();
  resetSession(); // if your app re-reads state on session reset
  const u = new URL(location.href); u.searchParams.delete('ml');
  history.replaceState(null, '', u.toString());

  // Friendly summary
  alert(`Magic Link imported via MERGE:\n+${c.added} new pack${c.added===1?'':'s'} added, ${c.skipped} duplicate${c.skipped===1?'':'s'} skipped.`);
}



/* ───────────────────────────────────────────────────────────
 * Magic Link — MERGE helpers
 * - We only ADD missing collection items.
 * - Fair stats are preserved by default (no changes).
 *   Toggle ALLOW_FAIR_MERGE to true if you ever want additive merging.
 * ─────────────────────────────────────────────────────────── */
const ALLOW_FAIR_MERGE = true;

// Canonical slug (folds accents, strips punctuation/whitespace, lowercases)
function _slug(s){
  return String(s||'')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

// Colors normalized to WUBRG(C) order, duplicates removed
const _WUBRG_ORDER = { W:0, U:1, B:2, R:3, G:4, C:5 };
function _canonColors(arr){
  const uniq = Array.from(new Set((Array.isArray(arr)?arr:[]).map(c=>String(c||'').toUpperCase())));
  return uniq
    .filter(c => c in _WUBRG_ORDER)
    .sort((a,b)=>_WUBRG_ORDER[a]-_WUBRG_ORDER[b])
    .join('');
}

// Stronger cross-device identity for collections
function _itemKey(x){
  if (!x || typeof x !== 'object') return JSON.stringify(x);
  const name = _slug(x.name);
  const set  = _slug(x.set || 'Unlabeled');
  const cols = _canonColors(x.colors || []);
  if (name && set && cols) return `${name}|${set}|${cols}`;
  // fallback (should rarely be needed)
  return x.id || x.packId || x.code || x.name || JSON.stringify(x);
}


function mergeCollectionsAddOnly(localArr, incomingArr){
  const base = Array.isArray(localArr) ? localArr : [];
  const inc  = Array.isArray(incomingArr) ? incomingArr : [];
  const seen = new Set(base.map(_itemKey));
  const out  = base.slice();
  let added = 0, skipped = 0;

  for (const it of inc){
    const k = _itemKey(it);
    if (seen.has(k)) { skipped++; continue; }
    seen.add(k);
    out.push(it);
    added++;
  }
  return { merged: out, added, skipped };
}

function mergeFairAdditive(localFair, incomingFair){
  // Only used if ALLOW_FAIR_MERGE === true
  const out = { ...(localFair && typeof localFair === 'object' ? localFair : {}) };
  const src = (incomingFair && typeof incomingFair === 'object') ? incomingFair : {};
  let newKeys = 0, updated = 0;

  const isPlain = v => v && typeof v === 'object' && !Array.isArray(v);
  for (const k of Object.keys(src)){
    const a = out[k], b = src[k];
    if (typeof a === 'number' && typeof b === 'number'){ out[k] = a + b; updated++; continue; }
    if (isPlain(a) && isPlain(b)){
      const m = { ...a };
      for (const sk of Object.keys(b)){
        if (typeof a[sk] === 'number' && typeof b[sk] === 'number'){ m[sk] = a[sk] + b[sk]; updated++; }
        else if (!(sk in m)){ m[sk] = b[sk]; newKeys++; }
      }
      out[k] = m; continue;
    }
    if (!(k in out)) { out[k] = b; newKeys++; }
    // else: keep local as-is (preserve)
  }
  return { merged: out, newKeys, updated };
}






















































// ───────────────────────────────────────────────────────────
// 5) Collection view — filters, sorting, rendering
// ───────────────────────────────────────────────────────────
/*
* parseSearchQuery(q)
* Mini syntax: quotes, -negation, and fields name:, theme:, set:, tag:, type:
* Returns {text, notText, fields, notFields}.
*/
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

// [UTIL] matchFilters(pack, settings) — true if a pack passes active filters
/* Filters/Sort/Paging Stuff */
function matchFilters(p, settings = state.settingsCollection){
  const s = settings;

// --- set filter ---
  if(s.setFilter.length){
    const N = x => (x||'').trim().toLowerCase();
    const key = p.set ? p.set : 'Unlabeled';
    if(!s.setFilter.some(k => N(k) === N(key))) return false;
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

function computeSetCounts(){const m=new Map(); for(const p of state.collection){const k=(p.set?p.set:'Unlabeled').trim(); m.set(k,(m.get(k)||0)+1);} return m;}



/*
* renderSetFilter(seedSettings, containerId)
* Renders set chips and binds toggles for the given settings bag (collection/play).
* Side-effects: updates eligible count/guardrails and re-renders collection when needed.
*/
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



/*
* renderColorFilter(seedSettings, containerId)
* Renders WUBRGC toggles; respects colorMode; scope-aware (collection vs. play).
*/
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
  return off ? Math.min(100, Math.round((pk / off) * 100)) : 0;
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

// [UTIL] colorTypeRank(p) — sort helper by color count
function colorTypeRank(p){return p.colors.length;}
// [UTIL] WUBRG ordering for 'color' sort (W,U,B,R,G; colorless last)
const WUBRG_INDEX = { W:0, U:1, B:2, R:3, G:4, C:5 };

function colorKeyWUBRG(p){
  const cols = Array.isArray(p.colors) ? p.colors : [];
  if (!cols.length) return [5, 99, []]; // colorless → last group
  const idxs = cols.map(c => (WUBRG_INDEX[c] ?? 6)).sort((a,b)=>a-b);
  // Sort by: primary color group (min index), then color count, then full indices tuple
  return [idxs[0], idxs.length, idxs];
}

function cmpTuple(a, b){
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++){
    const ai = a[i] ?? 0, bi = b[i] ?? 0;
    if (ai < bi) return -1;
    if (ai > bi) return 1;
  }
  return 0;
}



// [UTIL] comparePacks(a,b) — stable sort for renders
// Sorting helpers
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
          case 'color': {
      const ka = colorKeyWUBRG(a), kb = colorKeyWUBRG(b);
      r = cmpTuple(ka, kb);
      if (r === 0) r = a.name.localeCompare(b.name);
      break;
    }

    default:       r = a.name.localeCompare(b.name);
  }
  return r*dir;
}  

function sortedFiltered(settings = state.settingsCollection){
  return state.collection.filter(p=>matchFilters(p, settings)).slice().sort((a,b)=>comparePacks(a,b,settings));
}  

// [UTIL] eligibleAfterFilter(settings) — count packs passing filters
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
 
// [UTIL] activeSettings() — current settings bag for UI
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
      <button class="btn btn-danger" data-del="${p.id}">X</button>
    </div>
  </div>`;
}


function slug(s){
  return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

// Try multiple sources for the image; fallback to a guessed path in /img
function officialImageUrl(p) {
  if (p && p.image) return p.image;
  if (p && p.face)  return p.face;
  if (typeof OFFICIAL_IMAGE_MAP !== 'undefined') {
    const hit = OFFICIAL_IMAGE_MAP[p.id] || OFFICIAL_IMAGE_MAP[p.name];
    if (hit) return hit;
  }

  // 1) Slug helpers
  const slug = (s) => String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const setSlug  = slug(p?.set);
  const nameSlug = slug(p?.name);
  const idSlug   = slug(p?.id);

  // 2) Base-name heuristic (strip trailing numbers / roman numerals)
  // heroes-1, heroes-12, heroes-iv, heroes-xvi -> heroes
  const baseNameSlug = nameSlug.replace(/-(?:\d+|[ivxlcdm]+)$/i, '');

  // 3) Candidate order
  // Prefer SET+base, then base-only, then SET+full, then full, then id.
  const tries = [];
  if (setSlug && baseNameSlug)                  tries.push(`${setSlug}-${baseNameSlug}.jpg`);
  if (baseNameSlug)                              tries.push(`${baseNameSlug}.jpg`);
  if (setSlug && nameSlug !== baseNameSlug && nameSlug)
                                                tries.push(`${setSlug}-${nameSlug}.jpg`);
  if (nameSlug && nameSlug !== baseNameSlug)     tries.push(`${nameSlug}.jpg`);
  if (idSlug)                                    tries.push(`${idSlug}.jpg`);

  // 4) Return first guess (cannot check existence reliably under file://)
  return tries.length ? `img/${tries[0]}` : '';
}


// [OFFICIAL] view state (filters)
if (!state.official) state.official = { 
  search:'', 
  colorFilter:[], 
  colorMode: 'any',
  setFilter:[],
  kind: 'ALL', 
  page:1, 
  pageSize:24 };



// [OFFICIAL] — Global page-size handler (robust against duplicate renders)
// Ensures the "Page size" select always re-renders the grid.
if (!window.__OFFICIAL_SIZE_WIRED__) {
  window.__OFFICIAL_SIZE_WIRED__ = true;
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t && t.id === 'officialPageSize') {
      const n = parseInt(t.value, 10);
      if (!state.official) {
        state.official = { 
          search:'', 
          colorFilter:[], 
          colorMode: 'any',
          setFilter:[], 
          kind: 'ALL',
          page:1, 
          pageSize:24 };
      }
      state.official.pageSize = (Number.isFinite(n) && n > 0) ? n : 24;
      state.official.page = 1;
      // Re-render using the current catalog; fall back to full panel if needed.
      try {
        renderOfficialGrid(officialFlattened());
      } catch {
        renderOfficialPanel();
      }
    }
  });
}





/* [OFFICIAL] helpers — Jumpstart vs Jump In!, placeholder preview, weighted generate*/

const OFFICIAL_LAST_ROLL = new Map(); // key: officialId -> { deck: Card[], chosenBySlot: Map(slot->optionName) }

function officialFlattened(){
  const cat = (window.OFFICIAL_PACKS || {});
  const out = [];
  const norm = (p)=>({
    id: String(p.id || '').trim(),
    name: String(p.name || ''),
    theme: p.theme || null,
    colors: Array.isArray(p.colors) ? p.colors.slice(0,5) : [],
    set: p.set || null,
    tags: Array.isArray(p.tags) ? p.tags.slice() : [],
    kind: p.kind || null, // 'JUMPSTART' | 'JUMPIN'
    image: p.image || p.face || p.faceURL || p.faceUrl || null,
    deck: Array.isArray(p.deck) ? p.deck.map(d => ({
      name: String(d.name || '').trim(),
      qty:  Math.max(1, parseInt(d.qty || 1, 10)),
      type: d.type || '',
      mana: d.mana || ''
    })) : [],
    slots: Array.isArray(p.slots) ? p.slots.map(s => ({
      slot: s.slot,
      options: (s.options || []).map(o => ({
        name: String(o.name || '').trim(),
        weight: Math.max(1, parseInt(o.weight || 1, 10))
      }))
    })) : []
  });
(cat.jumpstart || []).forEach(p => out.push({ ...norm(p), source: 'JumpStart', kind: 'JUMPSTART' }));
(cat.jumpin    || []).forEach(p => out.push({ ...norm(p), source: 'Jump In!',  kind: 'JUMPIN'  }));
  return out;
}


// ---- Jump In! weighted generator ---------------------------------------

function splitNamesMaybe(nameStr){
  if (!nameStr) return [];
  return [String(nameStr).trim()];
}

function rollWeightedOption(options){
  const total = options.reduce((s,o)=>s+o.weight,0);
  let r = Math.random() * total;
  for (const o of options){
    if ((r -= o.weight) <= 0) return o;
  }
  return options[options.length-1];
}

function mapCountPush(map, name, qty=1){
  const k = name.toLowerCase();
  const prev = map.get(k);
  if (prev) { prev.qty += qty; } else { map.set(k, { name, qty, type:'', mana:'' }); }
}

// Return { deck: Card[], chosenBySlot: Map(slot -> optionName) }
function rollJumpInDeckFromTemplate(p){
  const optionNameSet = new Set();
  (p.slots || []).forEach(s => (s.options||[]).forEach(o => optionNameSet.add(String(o.name||'').trim().toLowerCase())));

  const counts = new Map();
  (p.deck || []).forEach(c=>{
    if (!optionNameSet.has(String(c.name||'').toLowerCase())) {
      mapCountPush(counts, c.name, Math.max(1, parseInt(c.qty||1,10)));
    }
  });

  const chosenBySlot = new Map();
  (p.slots || []).forEach((s, idx)=>{
    const pick = rollWeightedOption(s.options || []);
    chosenBySlot.set(String(s.slot), pick.name);
    const names = splitNamesMaybe(pick.name);
    names.forEach(n => mapCountPush(counts, n, 1));
  });

  return { deck: Array.from(counts.values()), chosenBySlot };
}

// ---- Preview helpers ----------------------------------------------------

// Build placeholder deck: fixed cards + "Random 1", "Random 2", so on
function buildPlaceholderDeck(p){
  const optionNameSet = new Set();
  (p.slots || []).forEach(s => (s.options||[]).forEach(o => optionNameSet.add(String(o.name||'').trim().toLowerCase())));

  const list = [];
  // fixed cards first
  (p.deck || []).forEach(c=>{
    if (!optionNameSet.has(String(c.name||'').toLowerCase())) {
      list.push({ name: c.name, qty: Math.max(1, parseInt(c.qty||1,10)) });
    }
  });
  // then placeholder rows in slot order
  (p.slots || []).slice().sort((a,b)=>String(a.slot).localeCompare(String(b.slot))).forEach((s, i)=>{
    list.push({ name: `Random ${i+1}`, qty: 1 });
  });
  return list;
}

// Simple deck list: "qty × name", no type grouping (NEED TO UPDATE TO MAKE IT LOOK NICE)
function renderSimpleDeckList(deck){
  const rows = deck.map(d => `<li>${Math.max(1,parseInt(d.qty||1,10))} × ${esc(d.name)}</li>`).join('');
  return `<div class="decklist"><ul style="margin:0;padding-left:18px">${rows}</ul></div>`;
}

// Slots table: rows = one per option; columns: Slot | Option | %
function slotsTableHTML(p /*, chosenBySlot (ignored here) */){
  if (!Array.isArray(p.slots) || !p.slots.length) {
    return `<div class="hint">No slots found for this template.</div>`;
  }
  const row = (s)=>{
    const total = (s.options||[]).reduce((a,b)=>a + (b.weight||0), 0) || 1;
    const optsInline = (s.options||[]).map(o=>{
      const pct = Math.round((o.weight/total)*100);
      return `${esc(o.name)} ${pct}%`;
    }).join(' — ');
    return `<tr>
      <td style="white-space:nowrap">Slot ${esc(String(s.slot))}</td>
      <td>${optsInline}</td>
    </tr>`;
  };
  const rows = (p.slots||[]).slice().sort((a,b)=>String(a.slot).localeCompare(String(b.slot))).map(row).join('');
  return `<table class="table slim"><thead><tr><th>Slot</th><th>Options</th></tr></thead><tbody>${rows}</tbody></table>`;
}



// ─────────────────────────────────────────────────────────────
// [OFFICIAL] Image Carousel Banner
// Items: { text, set?, kind?('JUMPSTART'|'JUMPIN'|'ALL'), bg? }
// Click: applies kind + set filters and opens page 1.
// ─────────────────────────────────────────────────────────────
function renderOfficialBanner(all){
  const host   = $('officialBanner');
  const slides = $('officialBannerSlides');
  const dots   = $('officialBannerDots');
  const prev   = $('officialBannerPrev');
  const next   = $('officialBannerNext');
  const notes  = $('officialNewsNotes'); // old note; we hide it if present
  if (!host || !slides) return;

  // Build items
  let items = Array.isArray(window.OFFICIAL_BANNER) ? window.OFFICIAL_BANNER.slice() : null;
  if (!items || !items.length){
    // sensible defaults
    const byKind = { JUMPSTART: new Set(), JUMPIN: new Set() };
    for (const p of all){
      const k = String(p.kind || '').toUpperCase() === 'JUMPIN' ? 'JUMPIN' : 'JUMPSTART';
      byKind[k].add(p.set || 'Unlabeled');
    }
    const js = [...byKind.JUMPSTART].sort();
    const ji = [...byKind.JUMPIN].sort();
    items = [];
    if (js[0]) items.push({ text:`JumpStart spotlight — ${js[0]}`, kind:'JUMPSTART', set:js[0] });
    if (ji[0]) items.push({ text:`Jump In! spotlight — ${ji[0]}`,   kind:'JUMPIN',    set:ji[0] });
    if (!items.length) items.push({ text:'Explore Official packs — click to filter', kind:'ALL' });
  }

  // Render slides
const mkSlide = (it, idx) => {
  const t   = String(it.text || 'Update').trim();
  const set = it.set ? ` data-set="${esc(it.set)}"` : '';
  const kind= it.kind ? ` data-kind="${String(it.kind).toUpperCase()}"` : '';
  const bg  = it.bg   ? ` style="background-image:url('${esc(it.bg)}')"` : '';
  const tagK= it.kind ? `<span class="tag">${it.kind==='JUMPIN'?'Jump In!':(it.kind==='JUMPSTART'?'JumpStart':'All')}</span>` : '';
  const tagS= it.set  ? `<span class="tag">${esc(it.set)}</span>` : '';
  // NOTE: slides start inert & unfocusable; the active one will be flipped later
  return `
    <a href="#" class="slide" role="group" aria-roledescription="slide"
       aria-label="Slide ${idx+1}" aria-hidden="true" tabindex="-1"${set}${kind}${bg}>
      <div class="banner-content">
        <div class="tags">${tagK}${tagS}</div>
        <div class="banner-title">${esc(t)}</div>
      </div>
    </a>`;
};


  slides.innerHTML = items.map(mkSlide).join('');

  if (dots){
    dots.innerHTML = items.length > 1
      ? items.map((_,i)=>`<button type="button" role="tab" aria-label="Go to slide ${i+1}" data-ix="${i}" aria-selected="false"></button>`).join('')
      : '';
  }

  // Hide legacy note
  if (notes) notes.style.display = 'none';

  // State + helpers
  const st = state.official || (state.official = { search:'', colorFilter:[], colorMode:'any', setFilter:[], kind:'ALL', page:1, pageSize:24 });
  let ix = Math.min(st.bannerIndex || 0, Math.max(0, items.length-1));
  let timer = host.__timer;
  const SLIDE_MS = 6000;

  const $slides = Array.from(slides.querySelectorAll('.slide'));
  const $dots   = Array.from(dots ? dots.querySelectorAll('button[data-ix]') : []);

const applyActive = () => {
  let needFocusMove = false;
  const focused = document.activeElement;
  if (focused) {
    const focSlide = focused.closest && focused.closest('.slide');
    if (focSlide && focSlide !== $slides[ix]) {
      needFocusMove = true;
    }
  }

  $slides.forEach((el, i) => {
    const active = (i === ix);
    el.classList.toggle('active', active);

    el.setAttribute('aria-hidden', active ? 'false' : 'true');
    if (active) {
      el.removeAttribute('inert');
      el.setAttribute('tabindex', '0');
    } else {
      el.setAttribute('inert', '');
      el.setAttribute('tabindex', '-1');
    }
  });

  $dots.forEach((d, i) => d.setAttribute('aria-selected', i === ix ? 'true' : 'false'));

  if (needFocusMove) {
    $slides[ix].focus({ preventScroll: true });
  }

  st.bannerIndex = ix;
};


  const go = (to) => {
    const n = items.length;
    if (!n) return;
    ix = ((to % n) + n) % n;
    applyActive();
  };

  const nextSlide = () => go(ix + 1);
  const prevSlide = () => go(ix - 1);

  const start = () => {
    stop();
    if (items.length > 1) timer = host.__timer = setInterval(nextSlide, SLIDE_MS);
  };
  const stop = () => {
    if (timer){ clearInterval(timer); host.__timer = null; timer = null; }
  };

slides.addEventListener('click', (e)=>{
  const el = e.target.closest('.slide.active'); // only active slide is actionable
  if (!el) return;
  e.preventDefault();
  const kind = String(el.getAttribute('data-kind')||'').toUpperCase();
  const set  = el.getAttribute('data-set') || '';
  if (kind === 'JUMPSTART' || kind === 'JUMPIN') st.kind = kind; else st.kind = 'ALL';
  st.setFilter = set ? [set] : [];
  st.page = 1;
  renderOfficialFilters(all);
  renderOfficialGrid(all);
});


  if (prev) prev.onclick = (e)=>{ e.preventDefault(); stop(); prevSlide(); start(); };
  if (next) next.onclick = (e)=>{ e.preventDefault(); stop(); nextSlide(); start(); };

  if (dots){
    dots.onclick = (e)=>{
      const b = e.target.closest('button[data-ix]'); if (!b) return;
      stop(); go(parseInt(b.getAttribute('data-ix'),10)); start();
    };
  }

  host.addEventListener('mouseenter', stop);
  host.addEventListener('mouseleave', start);

  // Init
  go(ix);
  start();
}



// ───────────────────────────────────────────────────────────
// [OFFICIAL] v2 — News + Filters + Grid + Pagination
// ───────────────────────────────────────────────────────────
function renderOfficialPanel(){
  const newsKPI = $('officialNewsKPI');
  const newsNotes = $('officialNewsNotes');
  const boxGrid = $('officialGrid');
  if (!boxGrid) return;

  // 0) Ensure catalog exists
  const all = officialFlattened(); // {id,name,theme,colors[],set,tags[],kind,deck,slots,image,source}
  if (!Array.isArray(all) || !all.length){
    boxGrid.innerHTML = `<div class="hint">Failed to load official catalog.</div>`;
    if (newsKPI) newsKPI.innerHTML = '';
    return;
  }

  // 1) KPIs top zone
  const totalJS = all.filter(x => x.source === 'JumpStart').length;
  const totalJI = all.filter(x => x.source === 'Jump In!').length;
  if (newsKPI){
    newsKPI.innerHTML = [
      `<div class="kpi"><div class="label">Jumpstart</div><div class="value">${totalJS}</div></div>`,
      `<div class="kpi"><div class="label">Jump In!</div><div class="value">${totalJI}</div></div>`,
      `<div class="kpi"><div class="label">Total</div><div class="value">${all.length}</div></div>`
    ].join('');
  }
  // rolling banner
renderOfficialBanner(all);

// Remove old filler - kept for legacy fallbacks)
  if (newsNotes && newsNotes.dataset && !newsNotes.dataset.bannerDone){
    newsNotes.innerHTML = '';
    newsNotes.dataset.bannerDone = '1';
  }

  // 2) Filters plus search
  renderOfficialFilters(all);


  // 3) Grid (applies filters and paging)
  renderOfficialGrid();
}


// Build format (kind) chips, split set lists, color chips, search, and wire events
function renderOfficialFilters(all){
  // Ensure state exists
  const st = state.official || (state.official = { search:'', colorFilter:[], colorMode: 'any', setFilter:[], kind:'ALL', page:1, pageSize:24 });

  // DOM targets
  const kindBox   = $('officialKindBox');  
  const setsJSBox = $('officialSetListJS');
  const setsJIBox = $('officialSetListJI');
  const clrBox    = $('officialColorBox');
  const search    = $('officialSearchInput');
  const clearSets = $('officialSetClear');
  const selPage   = $('officialPageSize');
  const colorModeSel = $('officialColorMode');


// Show/hide the two set wrappers based on current format (st.kind)
const updateSetWrapVisibility = () => {
  const wrapJS = $('officialSetWrapJS') || null;
  const wrapJI = $('officialSetWrapJI') || null;

  const k = String(st.kind || 'ALL').toUpperCase();
  const showJS = (k === 'ALL' || k === 'JUMPSTART');
  const showJI = (k === 'ALL' || k === 'JUMPIN');

  if (wrapJS) wrapJS.classList.toggle('is-hidden', !showJS);
  if (wrapJI) wrapJI.classList.toggle('is-hidden', !showJI);
};




  // ─────────────────────────────────────────────────────────────────────────────
  // 1) Format (kind) chips — All / JumpStart / Jump In!
  // ─────────────────────────────────────────────────────────────────────────────
  if (kindBox && !kindBox.__rendered) {
    const KINDS = [
      { key:'ALL',       label:'All' },
      { key:'JUMPSTART', label:'JumpStart' },
      { key:'JUMPIN',    label:'Jump In!' }
    ];
    kindBox.classList.add('set-grid');
    kindBox.innerHTML = KINDS.map(k=>{
      const on = (st.kind === k.key);
      return `<div role="button" tabindex="0"
                   class="set-chip kind ${on?'active':''}"
                   data-kind="${k.key}" aria-pressed="${on?'true':'false'}">
                <span class="name">${k.label}</span>
              </div>`;
    }).join('');

const setKind = (key)=>{
  if (!key) return;
  st.kind = key;
  st.page = 1;

  // Update to chip visuals
  if (kindBox) {
    kindBox.querySelectorAll('.set-chip').forEach(ch=>{
      const on = (ch.dataset.kind === key);
      ch.classList.toggle('active', on);
      ch.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // hide/show the set sections
  updateSetWrapVisibility();

  renderOfficialGrid();
};

    if (!kindBox.__bound) {
      kindBox.addEventListener('click', e=>{
        const el = e.target.closest('.set-chip');
        if (el) setKind(el.dataset.kind);
      });
      kindBox.addEventListener('keydown', e=>{
        if ((e.key === ' ' || e.key === 'Enter')) {
          const el = e.target.closest('.set-chip');
          if (el) { e.preventDefault(); setKind(el.dataset.kind); }
        }
      });
      kindBox.__bound = true;
    }
    kindBox.__rendered = true;
  }

  // Gather sets per kind
const setsJS = Array.from(new Set(
  all.filter(p => String(p.kind||'').toUpperCase() === 'JUMPSTART')
     .map(p => p.set || 'Unlabeled')
)).sort((a,b)=>a.localeCompare(b));

const setsJI = Array.from(new Set(
  all.filter(p => String(p.kind||'').toUpperCase() === 'JUMPIN')
     .map(p => p.set || 'Unlabeled')
)).sort((a,b)=>a.localeCompare(b));

  // Helper to paint a set list box
  const paintSetBox = (box, sets) => {
    if (!box || box.__rendered) return;
    box.classList.add('set-grid');
    box.innerHTML = (sets.length ? sets.map(s=>{
      const on = st.setFilter.includes(s);
      return `<div role="button" tabindex="0"
                   class="set-chip set ${on?'active':''}"
                   data-set="${esc(s)}" aria-pressed="${on?'true':'false'}">
                <span class="name">${esc(s)}</span>
              </div>`;
    }).join('') : `<div class="tiny">No sets detected.</div>`);

    const toggleSet = (el) => {
      const key = el?.dataset?.set; if (!key) return;
      const on = st.setFilter.includes(key);
      if (on) {
        st.setFilter = st.setFilter.filter(x => x !== key);
        el.classList.remove('active'); el.setAttribute('aria-pressed','false');
      } else {
        st.setFilter.push(key);
        el.classList.add('active'); el.setAttribute('aria-pressed','true');
      }
      st.page = 1;
      renderOfficialGrid();
    };

    if (!box.__bound) {
      box.addEventListener('click', e=>{
        const el = e.target.closest('.set-chip');
        if (el) toggleSet(el);
      });
      box.addEventListener('keydown', e=>{
        if (e.key === ' ' || e.key === 'Enter') {
          const el = e.target.closest('.set-chip');
          if (el) { e.preventDefault(); toggleSet(el); }
        }
      });
      box.__bound = true;
    }
    box.__rendered = true;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) Split set lists — JumpStart / Jump In!
  // ─────────────────────────────────────────────────────────────────────────────
  paintSetBox(setsJSBox, setsJS);
  paintSetBox(setsJIBox, setsJI);
  
  updateSetWrapVisibility();

  // Clear Sets button
  if (clearSets && !clearSets.__bound) {
    clearSets.addEventListener('click', ()=>{
      st.setFilter = [];
      st.page = 1;
      // Visually clear both lists
      [setsJSBox, setsJIBox].forEach(b=>{
        if (!b) return;
        b.querySelectorAll('.set-chip.active').forEach(el=>{
          el.classList.remove('active');
          el.setAttribute('aria-pressed','false');
        });
      });
      renderOfficialGrid();
    });
    clearSets.__bound = true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3) Color chips
  // ─────────────────────────────────────────────────────────────────────────────
  if (clrBox && !clrBox.__rendered){
    const COLORS = ['W','U','B','R','G','C'];
    clrBox.classList.add('set-grid');
    clrBox.innerHTML = COLORS.map(c=>{
      const on = st.colorFilter.includes(c);
      return `<div role="button" tabindex="0"
                   class="set-chip color ${on?'active':''}"
                   data-color="${c}" aria-pressed="${on?'true':'false'}">
                <span class="name">${c}</span>
              </div>`;
    }).join('');

    const toggleColor = (el)=>{
      const key = el?.dataset?.color; if(!key) return;
      const on = st.colorFilter.includes(key);
      if (on) {
        st.colorFilter = st.colorFilter.filter(x => x !== key);
        el.classList.remove('active'); el.setAttribute('aria-pressed','false');
      } else {
        st.colorFilter.push(key);
        el.classList.add('active'); el.setAttribute('aria-pressed','true');
      }
      st.page = 1;
      renderOfficialGrid();
    };

    if (!clrBox.__bound){
      clrBox.addEventListener('click', e=>{
        const el = e.target.closest('.set-chip');
        if (el) toggleColor(el);
      });
      clrBox.addEventListener('keydown', e=>{
        if (e.key === ' ' || e.key === 'Enter'){
          const el = e.target.closest('.set-chip');
          if (el){ e.preventDefault(); toggleColor(el); }
        }
      });
      // Clear colors button (if present)
      const clr = $('officialClrClear');
      if (clr && !clr.__bound){
        clr.addEventListener('click', ()=>{
          st.colorFilter = [];
          st.page = 1;
          clrBox.querySelectorAll('.set-chip.active').forEach(el=>{
            el.classList.remove('active');
            el.setAttribute('aria-pressed','false');
          });
          renderOfficialGrid();
        });
        clr.__bound = true;
      }
      clrBox.__bound = true;
    }
    clrBox.__rendered = true;
  }

  // Color mode (Any / All / Exact) for Official
if (colorModeSel && !colorModeSel.__bound) {
  colorModeSel.value = st.colorMode || 'any';
  colorModeSel.addEventListener('change', ()=>{
    st.colorMode = colorModeSel.value || 'any';
    st.page = 1;
    renderOfficialGrid();
  });
  colorModeSel.__bound = true;
}


  // ─────────────────────────────────────────────────────────────────────────────
  // 4) Search plus dat page size
  // ─────────────────────────────────────────────────────────────────────────────
  if (search && !search.__bound){
    search.value = st.search || '';
    search.addEventListener('input', ()=>{
      st.search = search.value || '';
      st.page = 1;
      renderOfficialGrid();
    });
    search.__bound = true;
  }

  if (selPage && !selPage.__bound){
    selPage.value = String(st.pageSize || 24);
    selPage.addEventListener('change', ()=>{
      const n = parseInt(selPage.value, 10);
      st.pageSize = isNaN(n) ? 24 : Math.max(1, n);
      st.page = 1;
      renderOfficialGrid();
    });
    selPage.__bound = true;
  }
}


// Apply filters and render card grid
function renderOfficialGrid(/*allIgnored*/) {
  const st = state.official || (state.official = {
    search:'', colorFilter:[], colorMode: 'any', setFilter:[], kind: 'ALL', page:1, pageSize:24
  });

  // Always pull from live catalog
  const all = officialFlattened();

  // Prefer the new grid; fall back to the legacy list container if present.
  const boxGrid = $('officialGrid') || $('officialList');
  const info    = $('officialPageInfo');
  const prev    = $('officialPrev');
  const next    = $('officialNext');

  if (!boxGrid) {
    // Gentle hint if neither container exists
    const gridParent = $('officialCard');
    if (gridParent) {
      const body = gridParent.querySelector('.body, .card-body') || gridParent;
      body.insertAdjacentHTML('beforeend', `<div class="hint">Official grid container not found. Add <code>&lt;div id="officialGrid"&gt;</code> to your HTML or keep using the legacy <code>officialList</code> id.</div>`);
    }
    return;
  }

// 1) Apply filters (kind, set, color, search)
const picks = all.filter(p => {
  // Kind filter
  if (st.kind && st.kind !== 'ALL') {
    if (String(p.kind || '').toUpperCase() !== st.kind) return false;
  }

  // Set filter
  if (Array.isArray(st.setFilter) && st.setFilter.length){
    const key = p.set || 'Unlabeled';
    if (!st.setFilter.includes(key)) return false;
  }

// Color filter (Any / All / Exact)
if (Array.isArray(st.colorFilter) && st.colorFilter.length){
  const want = st.colorFilter;
  const have = p.colors || [];
  const mode = st.colorMode || 'any';

  if (mode === 'all') {
    if (!want.every(c => have.includes(c))) return false;
  } else if (mode === 'exact') {
    const a = [...have].sort().join('');
    const b = [...want].sort().join('');
    if (a !== b) return false;
  } else { // any
    if (!want.some(c => have.includes(c))) return false;
  }
}


  // Search: name / theme / set / #tag
  if (st.search && st.search.trim()){
    const q = st.search.trim().toLowerCase();
    const hay = `${String(p.name||'')} ${String(p.theme||'')} ${String(p.set||'')} ${(p.tags||[]).map(t=>'#'+t).join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
});


  if (!picks.length){
    boxGrid.innerHTML = `<div class="hint">No results under current filters.</div>`;
    if (info) info.textContent = '0 of 0';
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    return;
  }

  // 2) Pagination math
const per        = Math.max(1, parseInt(st.pageSize || 24, 10));
const total      = picks.length;
const totalPages = Math.max(1, Math.ceil(total / per));
st.page          = Math.min(Math.max(1, st.page || 1), totalPages);

// Slice
const start     = (st.page - 1) * per;
const end       = Math.min(total, start + per);
const pageItems = picks.slice(start, end);

  // 3) Render — choose card grid (new) or row list (legacy) based on container id
  const useRowList = (boxGrid.id !== 'officialGrid');
  boxGrid.innerHTML = pageItems.map(useRowList ? officialRowHtml : officialCardHtml).join('');
  bindOfficialList(boxGrid, pageItems);

  // 4) Pager UI
  if (info) info.textContent = `${total ? start + 1 : 0}–${end} of ${total} (page ${st.page}/${totalPages})`;
  if (prev) prev.disabled = (st.page <= 1);
  if (next) next.disabled = (st.page >= totalPages);
}



// Individual card for the grid (image if provided, else placeholder)
function officialCardHtml(p){
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const actions = (p.kind === 'JUMPIN')
    ? [
        `<button class="btn btn-gray" data-preview="${p.id}">Preview</button>`,
        `<button class="btn" data-gen="${p.id}">Generate Deck</button>`
      ].join(' ')
    : [
        `<button class="btn btn-gray" data-preview="${p.id}">Preview</button>`,
        `<button class="btn btn-green" data-import="${p.id}">Import to My Collection</button>`
      ].join(' ');

  const bg = officialImageUrl(p);
  const bgStyle = bg ? `style="--bg:url('${bg}')"` : '';
  const bgClass = bg ? '' : ' noimg';

  return `<article class="off-card" id="off_${p.id}">
    <div class="imgbg${bgClass}" ${bgStyle}></div>
    <div class="body">
      <div class="name">${esc(p.name)}</div>
      <div class="meta">
        ${p.theme ? `<span class="theme">${esc(p.theme)}</span>` : ''}
        ${chips(p.colors)} ${p.kind ? `<span class="tag">${esc(p.kind)}</span>` : ''}
        ${p.set ? `<span class="tag">${esc(p.set)}</span>` : '<span class="tag">Official</span>'}
      </div>
      ${tags.length ? `<div class="meta tags">${tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join(' ')}</div>` : ''}
    </div>
    <div class="actions">${actions}</div>
  </article>`;
}




/* Import an official pack into the user's collection */
async function importOfficialPack(p, deckOverride){
  // Duplicate guard: same name , colors , set
  const dup = (state.collection || []).some(x =>
    String(x.name||'').toLowerCase() === String(p.name||'').toLowerCase() &&
    JSON.stringify(x.colors||[]) === JSON.stringify(p.colors||[]) &&
    String(x.set||'').toLowerCase() === String(p.set||'').toLowerCase()
  );
  if (dup) { alert('That pack (name + colors + set) already exists in your collection.'); return; }

  // Source deck: rolled Jump In! deck or fixed Jumpstart deck
  const deckSrc = Array.isArray(deckOverride) ? deckOverride
                 : (p.kind === 'JUMPIN'
                    ? ((OFFICIAL_LAST_ROLL.get(p.id) || {}).deck || rollJumpInDeckFromTemplate(p).deck)
                    : p.deck);

  // 1) Try from local meta (OFFICIAL_MIN_META) first
  let hydrated = hydrateWithLocalMeta(deckSrc);

  // 2) If some entries still lack type/mana and we have Scryfall helper, use them
  const needsFetch = hydrated.some(row => !(row.type && row.type.length));
  if (needsFetch && typeof enrichWithScryfallMin === 'function') {
    try {
      const fetched = await enrichWithScryfallMin(hydrated);
      hydrated = fetched.map(row => ({
        name: row.name,
        qty: Math.max(1, parseInt(row.qty || 1, 10)),
        mana: row.mana || '',
        type: row.type || row.type_line || '',
        type_line: row.type_line || row.type || ''
      }));
    } catch(e) {
      // Soft-fail, this will keep whatever is from local meta
      console.warn('[Import] Scryfall enrich failed; saving local-meta only.', e);
    }
  }

  const copy = {
    id: uid(),
    name: p.name,
    theme: p.theme || null,
    colors: (p.colors || []).slice(),
    set: p.set || null,
    tags: Array.from(new Set([...(p.tags||[]), 'official'])),
    deck: hydrated
  };

  state.collection = (state.collection || []).concat(copy);
  saveAll(); // <-- the only persistence
}



// Fills type/mana from OFFICIAL_MIN_META when available
function hydrateWithLocalMeta(deck = []) {
  const META = (window.OFFICIAL_MIN_META || {});
  return (deck || []).map(d => {
    const name = String(d.name || '').trim();
    const m = META[name] || {};
    const qty = Math.max(1, parseInt(d.qty || 1, 10));
    const type = d.type || m.type || '';
    const mana = d.mana || m.mana || '';
    return { name, qty, mana, type, type_line: d.type_line || type || '' };
  });
}

async function importOfficialPack(p, deckOverride){
  // duplicate guard
  const dup = (state.collection || []).some(x =>
    String(x.name||'').toLowerCase() === String(p.name||'').toLowerCase() &&
    JSON.stringify(x.colors||[]) === JSON.stringify(p.colors||[]) &&
    String(x.set||'').toLowerCase() === String(p.set||'').toLowerCase()
  );
  if (dup) { alert('That pack (name + colors + set) already exists in your collection.'); return; }

  // source deck
  const deckSrc = Array.isArray(deckOverride) ? deckOverride
                 : (p.kind === 'JUMPIN'
                    ? ((OFFICIAL_LAST_ROLL.get(p.id) || {}).deck || rollJumpInDeckFromTemplate(p).deck)
                    : p.deck);

  // 1) local drink
  let hydrated = hydrateWithLocalMeta(deckSrc);

  // 2) fallback enrich for any rows still missing type
  const needsFetch = hydrated.some(row => !(row.type && row.type.length));
  if (needsFetch && typeof enrichWithScryfallMin === 'function') {
    try {
      const fetched = await enrichWithScryfallMin(hydrated);
      hydrated = fetched.map(row => ({
        name: row.name,
        qty: Math.max(1, parseInt(row.qty || 1, 10)),
        mana: row.mana || '',
        type: row.type || row.type_line || '',
        type_line: row.type_line || row.type || ''
      }));
    } catch(e) {
      console.warn('[Import] Scryfall enrich failed; saving local-meta only.', e);
    }
  }

  const copy = {
    id: uid(),
    name: p.name,
    theme: p.theme || null,
    colors: (p.colors || []).slice(),
    set: p.set || null,
    tags: Array.from(new Set([...(p.tags||[]), 'official'])),
    deck: hydrated
  };

  state.collection = (state.collection || []).concat(copy);
  saveAll();
}



function bindOfficialList(hostEl, items){
  const byId = new Map(items.map(x => [x.id, x]));

  // PREVIEW
  hostEl.querySelectorAll('button[data-preview]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const p = byId.get(btn.dataset.preview);
      if (!p) return;

      if (p.kind === 'JUMPIN'){
        // No roll: show fixed cards + placeholders "Random N"
        const placeholder = buildPlaceholderDeck(p);
        const deckHTML = renderSimpleDeckList(placeholder);
        const table = slotsTableHTML(p, /*chosenBySlot*/ null);

        openModal({
          title: `Preview — ${p.name}`,
          okText: 'Close',
          bodyHTML: `
            ${deckHTML}
            <h4 style="margin-top:12px">Slots & Weights</h4>
            ${table}
          `
        });
        return;
      }

// Jumpstart preview — LOCAL meta only (no network)
const deckLocal = typeof hydrateWithLocalMeta === 'function'
  ? hydrateWithLocalMeta(p.deck || [])
  : (p.deck || []);

openModal({
  title: `Deck — ${p.name} (Official)`,
  okText: 'Close',
  bodyHTML: (typeof renderDeckColumnsHTML === 'function')
    ? renderDeckColumnsHTML(deckLocal)
    : `<pre>${esc(JSON.stringify(deckLocal, null, 2))}</pre>`
});

    });
  });

  // GENERATE (Jump In! only) — rolls concrete deck + allows import
  hostEl.querySelectorAll('button[data-gen]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
  const p = byId.get(btn.dataset.gen);
  if (!p) return;

  const roll = rollJumpInDeckFromTemplate(p);
  OFFICIAL_LAST_ROLL.set(p.id, roll);

const deckLocal = typeof hydrateWithLocalMeta === 'function'
  ? hydrateWithLocalMeta(roll.deck || [])
  : (roll.deck || []);

const deckHTML = (typeof renderDeckColumnsHTML === 'function')
  ? renderDeckColumnsHTML(deckLocal)
  : `<pre>${esc(JSON.stringify(deckLocal, null, 2))}</pre>`;


  openModal({
    title: `Generated Deck — ${p.name}`,
    okText: 'Close',
    bodyHTML: `
      ${deckHTML}
      <div style="margin-top:8px">
        <button class="btn btn-green" id="importGeneratedBtn">Import This Deck</button>
      </div>
    `,
    onOpen(){
      const imp = document.getElementById('importGeneratedBtn');
      if (imp){
imp.addEventListener('click', async ()=>{
  imp.disabled = true;
  imp.textContent = 'Importing…';
  await importOfficialPack(p, roll.deck);
  imp.textContent = 'Imported';
});

      }
    }
  });
});
  });

// IMPORT — only for Jumpstart rows; await so metadata hydrates before saving
hostEl.querySelectorAll('button[data-import]').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    const pack = byId.get(btn.dataset.import);
    if (!pack) return;
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'Importing…';
    await importOfficialPack(pack);   // <-- awaits the async import
    btn.textContent = 'Imported';
  });
});

}



 
  function colorOptions(sel){
    const all=['','W','U','B','R','G','C']; 
    return all.map(c=>`<option value="${c}" ${c===sel?'selected':''}>${c||'—'}</option>`).join('');
  }
  
function bindPackRowButtons(){

document.querySelectorAll('button[data-del]').forEach((b) => {
  b.addEventListener('click', () => {
    const id   = b.dataset.del;
    const pack = state.collection.find(x => x.id === id);

    openModal({
      title: 'Delete this pack?',
      bodyHTML: `
        <div>
          <p>You're about to delete <strong>${esc(pack?.name || 'this pack')}</strong> from your collection.</p>
          <div class="callout warn" role="note" aria-live="polite" style="margin-top:8px">
            <div class="callout-title">Reminder</div>
            <div>
              Consider <strong class="backit"><a href="#" id="modalBackupNow">BACKING UP</a></strong> before making major changes.
            </div>
          </div>
        </div>
      `,
      okText: 'Delete Pack',
      cancelText: 'Cancel',
      okClass: 'btn btn-danger',
      cancelClass: 'btn btn-gray',
      onOpen() {
        const link = document.getElementById('modalBackupNow');
        link?.addEventListener('click', (e) => {
          e.preventDefault();
          document.getElementById('backupBtn')?.click();
        });
      },
      async onOK() {
        state.collection = state.collection.filter(p => p.id !== id);
        saveAll();
      }
    });
  });
});

  document.querySelectorAll('button[data-edit]')
    .forEach(b=> b.addEventListener('click', ()=> startInlineEdit(b.dataset.edit)));

  document.querySelectorAll('button[data-view]')
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

// Inject CSS once: highlight deck rows on hover
function ensureDeckHoverStyle(){
  if (document.getElementById('deckHoverStyle')) return;
  const st = document.createElement('style');
  st.id = 'deckHoverStyle';
  st.textContent = `
    [id^="d_list_"] li[data-line]{
      transition: background-color .12s ease;
    }
    @media (prefers-color-scheme: dark){
      [id^="d_list_"] li[data-line]:hover{ background-color: rgba(255,255,255,0.10); }
    }
    @media (prefers-color-scheme: light){
      [id^="d_list_"] li[data-line]:hover{ background-color: rgba(0,0,0,0.06); }
    }
  `;
  document.head.appendChild(st);
}

function startInlineEdit(id){
  window.__currentPackId = id; // remember which pack the editor is for
  beginPackDraft(id);
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
          <div class="tiny mana-label" id="e_hint_${id}">Mana Identity<span class="req">&ast;</span></div>
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
    <div><label>Type Line</label><input id="d_type_${id}" type="text" placeholder="e.g., Creature — Hydra Druid"></div>
    <div style="flex:0 0 auto">
      <button class="btn btn-gray" id="d_add_${id}" type="button">Add</button>
    </div>
  </div>

  <!-- row: bulk paste -->
<div class="row">
  <div style="flex:0 0 auto">
    <button class="btn btn-cyan" id="d_bulk_open_${id}" type="button" style="margin-top: 8px;">Bulk Paste &#x21AA;</button>
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


  // --- Tags editor ---
(function(){
  let editTags = Array.isArray(p.tags) ? [...p.tags] : [];
  const wrap  = $(`e_tags_wrap_${id}`);
  const input = $(`e_tag_input_${id}`);
  const hid   = $(`e_tags_hidden_${id}`);

  // [UTIL] normalizeTag(s) — trim/collapse spaces, strip leading '#'
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
  const parts = parseTags(input.value || '');
  const haveLC = editTags.map(x => x.toLowerCase());
  for (const t of parts) {
    if (!haveLC.includes(t.toLowerCase())) {
      editTags.push(t);
      haveLC.push(t.toLowerCase());
    }
  }
  renderChips(); syncHidden();
  input.value = '';
});


  input?.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); $(`e_tag_add_${id}`)?.click(); }
  });

  renderChips(); syncHidden();
})();


  // Save/Cancel listeners
  row.querySelector(`[data-save="${id}"]`).addEventListener('click',()=>saveInlineEdit(id));
  row.querySelector(`[data-cancel="${id}"]`).addEventListener('click',()=>{
  endPackDraft();
  renderCollection();
});
  if (typeof renderDeckEditor === 'function') renderDeckEditor();



row.querySelector(`#d_bulk_open_${id}`)?.addEventListener('click', ()=>{
  openModal({
    title: 'Bulk Paste',
    okText: 'Add',
    bodyHTML: `
      <div class="tiny" style="margin-bottom:6px">One per line (e.g., “2 Llanowar Elves”, “Lightning Bolt x3”, “Forest”)</div>
      <textarea id="bulk_ta_${id}" rows="10" style="width:100%"></textarea>
    `,
    onOpen: ()=>{ $(`bulk_ta_${id}`)?.focus(); },
onOK: async ()=>{
  const ta = $(`bulk_ta_${id}`); if(!ta) return;
  const items = parseDeckText(ta.value);
  if(!items.length) return;

  const enriched = await withBusy('Attuning Mana channels', () => enrichWithScryfallMin(items));

  // merge into the EDIT DRAFT (no persistence yet)
  const base = (draftPackFor(id)?.deck && Array.isArray(draftPackFor(id).deck))
    ? draftPackFor(id).deck.slice()
    : (Array.isArray((state.collection.find(x=>x.id===id)||{}).deck)
       ? state.collection.find(x=>x.id===id).deck.slice()
       : []);

  const map = new Map(base.map(d => [String(d.name||'').toLowerCase(), { ...d }]));
  for (const it of enriched){
    const k = String(it.name||'').toLowerCase();
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
  setDeckForPackSilent(id, merged);

  if (typeof renderDeckEditor==='function') renderDeckEditor();
}

  });
});



// [UTIL] DOM-ready shim — edit-mode mana grid IIFE
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
  hint.textContent = n===0 ? 'Mana Idenity'
                : ['','Mono color.','Two-color.','Tri-color.','Four-color.','Five-color.'][n] || `${n}-color.`;
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
    if(!isSelected && count >= 5){
      if(hint) hint.textContent = 'You can select up to 5 colors.';
      return;
    }

    btn.classList.toggle('selected');
    btn.setAttribute('aria-pressed', btn.classList.contains('selected') ? 'true' : 'false');
    syncHidden();
  });
})();


// [UTIL] renderDeckEditor() — inline deck row editor inside the pack row
// --- Deck editor helpers ---
function renderDeckEditor(){
const id = window.__currentPackId;
const pack = draftPackFor(id) || state.collection.find(x=>x.id===id) || {};
const deck = Array.isArray(pack.deck) ? pack.deck : [];

  const host = $(`d_list_${id}`);
  if(!host) return;

  ensureDeckHoverStyle();
  host.innerHTML = deck.length ? `
    <ul style="list-style:none; margin:0; padding:0; display:grid; gap:6px">
      ${deck.map((it,idx)=>`
        <li data-line="${idx}" style="
          display:flex; align-items:center; justify-content:space-between;
          border:1px dashed var(--line); padding:6px 8px; border-radius:8px;
          gap:10px; white-space:nowrap; overflow:hidden; transition:background .12s;
        ">
          <div style="display:flex; align-items:center; gap:10px; min-width:0;">
            <span class="tiny" style="flex:0 0 auto">${it.qty}×</span>
            <strong class="card-name" data-cardname="${esc(it.name)}" style="flex:0 0 auto">${esc(it.name)}</strong>
            <span style="flex:0 0 auto">${it.mana ? manaChips(it.mana) : ''}</span>
            <span class="tag" style="flex:0 0 auto">${esc(it.type||'')}</span>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn xs" data-edit-line="${idx}" type="button" title="Edit this card">✎</button>
            <button class="btn btn-danger" data-del-line="${idx}" type="button">X</button>
          </div>
        </li>`).join('')}
    </ul>` : `<div class="hint">No cards yet.</div>`;

  // Delete buttons
host.querySelectorAll('button[data-del-line]').forEach(b=>{
  b.addEventListener('click',()=>{
    const i = parseInt(b.dataset.delLine,10);
    const base = (draftPackFor(id)?.deck && Array.isArray(draftPackFor(id).deck))
      ? draftPackFor(id).deck.slice()
      : (Array.isArray((state.collection.find(x=>x.id===id)||{}).deck)
         ? state.collection.find(x=>x.id===id).deck.slice()
         : []);
    base.splice(i,1);
    setDeckForPackSilent(id, base);
    renderDeckEditor();
  });
});

  // Inline edit buttons
  host.querySelectorAll('button[data-edit-line]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = parseInt(btn.dataset.editLine,10);
const base = (draftPackFor(id)?.deck && Array.isArray(draftPackFor(id).deck))
  ? draftPackFor(id).deck
  : (Array.isArray((state.collection.find(x=>x.id===id)||{}).deck)
     ? state.collection.find(x=>x.id===id).deck
     : []);
const it = base[i]; if(!it) return;


      const li = host.querySelector(`li[data-line="${i}"]`);
      if (!li) return;
      li.innerHTML = `
        <div class="card-ed" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <label class="tiny">Qty</label>
          <input id="line_qty_${id}_${i}" type="number" min="1" value="${it.qty||1}" style="width:64px">
          <label class="tiny">Name</label>
          <input id="line_name_${id}_${i}" type="text" value="${esc(it.name)}" style="min-width:180px">
          <label class="tiny">Mana</label>
          <input id="line_mana_${id}_${i}" type="text" value="${esc(it.mana||'')}" placeholder="{1}{G}{G}" style="width:140px">
          <label class="tiny">Type</label>
          <input id="line_type_${id}_${i}" type="text" value="${esc(it.type||'')}" placeholder="Creature — Hydra" style="min-width:200px">
        </div>
        <div style="display:flex; gap:6px; align-items:center; margin-top:6px;">
          <button class="btn" data-save-line="${i}" type="button">Save</button>
          <button class="btn" data-cancel-line="${i}" type="button">Cancel</button>
        </div>`;

      // Save edited row
li.querySelector('button[data-save-line]')?.addEventListener('click', ()=>{
  const name = $(`line_name_${id}_${i}`).value.trim();
  const qty  = Math.max(1, parseInt($(`line_qty_${id}_${i}`).value||1,10));
  const mana = $(`line_mana_${id}_${i}`).value.trim();
  const type = $(`line_type_${id}_${i}`).value.trim();
  if(!name) return alert('Enter a card name.');
  const item = normalizeDeckItem({ name, qty, mana, type });
  if(!item) return alert('Invalid row.');

  const base = (draftPackFor(id)?.deck && Array.isArray(draftPackFor(id).deck))
    ? draftPackFor(id).deck.slice()
    : (Array.isArray((state.collection.find(x=>x.id===id)||{}).deck)
       ? state.collection.find(x=>x.id===id).deck.slice()
       : []);
  base[i] = item;
  setDeckForPackSilent(id, base);
  renderDeckEditor();
});

li.querySelector('button[data-cancel-line]')?.addEventListener('click', ()=>{
  // Discard inline row edits and redraw from the current draft
  renderDeckEditor();
});


    });
  });
}



// Explicit renderer that doesn't depend on a global 'id'
function renderDeckEditorFor(id){
  const pack = draftPackFor(id) || state.collection.find(x=>x.id===id) || {};
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

          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn xs"
                    data-qedit="${esc(pack.id || id || '')}"
                    data-card="${esc(it.name)}"
                    type="button"
                    title="Edit this card"
                    aria-label="Edit ${esc(it.name)}">✎</button>

            <button class="btn btn-danger" data-del-line="${idx}" type="button">Remove</button>
          </div>
        </li>`).join('')}
    </ul>` : `<div class="hint">No cards yet.</div>`;

  // delete buttons
host.querySelectorAll('button[data-del-line]').forEach(b=>{
  b.addEventListener('click',()=>{
    const i = parseInt(b.dataset.delLine,10);
    const base = (draftPackFor(id)?.deck && Array.isArray(draftPackFor(id).deck))
      ? draftPackFor(id).deck.slice()
      : (Array.isArray((state.collection.find(x=>x.id===id)||{}).deck)
         ? (state.collection.find(x=>x.id===id).deck.slice())
         : []);
    base.splice(i,1);
    setDeckForPackSilent(id, base);
    renderDeckEditorFor(id);
  });
});
}


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

// click away to close
document.addEventListener('click', (e)=>{
  if(!sug) return;
  if(!e.target.closest(`#d_suggest_${id}`) && !e.target.closest(`#d_name_${id}`)){
    sug.style.display = 'none';
  }
}, { once:true });



// Add  card
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

  // write to DRAFT (not a persisted yet)
  const base = (draftPackFor(id)?.deck && Array.isArray(draftPackFor(id).deck))
    ? draftPackFor(id).deck.slice()
    : (Array.isArray((state.collection.find(x=>x.id===id)||{}).deck)
       ? state.collection.find(x=>x.id===id).deck.slice()
       : []);
  base.push(item);
  setDeckForPackSilent(id, base);

  // reset mini-form
  nameEl.value=''; qtyEl.value='1'; manaEl.value=''; typeEl.value='';
  if (typeof renderDeckEditor === 'function') renderDeckEditor();

  // close suggestions if open
  const sugBox = $(`d_suggest_${id}`);
  if (sugBox){ sugBox.style.display='none'; sugBox.innerHTML=''; }
});


}


// ───────────────────────────────────────────────────────────
// 4) UI primitives — modal
// ───────────────────────────────────────────────────────────

function openModal({
  title='',
  bodyHTML='',
  okText='OK',
  cancelText='Cancel',
  okClass=null,
  cancelClass=null,
  showCancel=true,
  onOK=NOOP,
  onOpen=NOOP
}){

  const wrap = $('modal'), ttl = $('modalTitle'), body = $('modalBody');
  const ok = $('modalOK'), cancel = $('modalCancel');


const _okPrevClass = ok.className;
const _cancelPrevClass = cancel.className;
if (okClass) ok.className = okClass;
if (cancelClass) cancel.className = cancelClass;


  ttl.textContent = title;
  body.innerHTML  = bodyHTML;
  ok.textContent  = okText;
  wrap.classList.remove('hidden');
cancel.textContent = cancelText;

const hideCancel = (String(okText).toLowerCase() === 'close') || !showCancel;
cancel.style.display = hideCancel ? 'none' : '';
function doClose(){
  ok.className = _okPrevClass;
  cancel.className = _cancelPrevClass;

  cancel.style.display = '';
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



// [UTIL] parseDeckText() — tolerant parser: "2 Name", "Name x3", "Name (2)", "Name"
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
// Fetch mana/type for items using a single batched call per ≤75 names.
// Returns [{ name, mana, type, qty? }] — same shape the rest of the app expects.
async function enrichWithScryfallMin(items){
  const list = Array.isArray(items) ? items : [];
  const names = [...new Set(
    list.map(it => String(it?.name || '').trim()).filter(Boolean).map(s => s.toLowerCase())
  )];

  if (!names.length) return [];

  // Batch resolve
  const cards = await scryfallCollectionByNames(names);
  const byName = new Map(cards.map(c => [String(c.name || '').toLowerCase(), c]));

  const out = [];
  for (const it of list) {
    const key  = String(it?.name || '').trim().toLowerCase();
    const card = byName.get(key);
    out.push({
      name: it.name,
      qty : it.qty,
      mana: card?.mana_cost || '',
      type: card?.type_line || ''
    });
  }
  return out;
}


// Save pack edits (supports 1–5 colors including 'C', works with grid or legacy c1/c2/c3)
// Save pack edits (supports 1–5 colors including 'C', works with grid or legacy c1/c2/c3)
function saveInlineEdit(id){
  const name  = $(`e_name_${id}`).value.trim();
  const theme = $(`e_theme_${id}`).value.trim();
  const set   = $(`e_set_${id}`).value.trim();

  // Preferred: from the 1–5 color grid (buttons with .mana-btn.selected and data-color)
  const gridEl = $(`e_grid_${id}`);
  let colors = [];
  if (gridEl){
    colors = Array.from(gridEl.querySelectorAll('.mana-btn.selected')).map(b => b.dataset.color);
  } else {
    // Fallback: legacy selects (c1/c2/c3)
    const c1 = $(`e_c1_${id}`)?.value;
    const c2 = $(`e_c2_${id}`)?.value;
    const c3 = $(`e_c3_${id}`)?.value;
    colors = [c1,c2,c3].filter(Boolean);
  }

  // Normalize: valid symbols only, dedupe, WUBRG + C order for stable identity
  const VALID = new Set(['W','U','B','R','G','C']);
  const WUBRG_ORDER = { W:0, U:1, B:2, R:3, G:4, C:5 };
  colors = Array.from(new Set(colors.filter(c => VALID.has(String(c)))))
                .sort((a,b)=>WUBRG_ORDER[a]-WUBRG_ORDER[b]);

  if (!name) return alert('Please enter a pack name.');
  if (colors.length < 1) return alert('Please choose at least one color.');
  if (colors.length > 5) return alert('Packs can have at most 5 colors.');

  // Tags (unchanged)
  const tagsRaw = $(`e_tags_hidden_${id}`)?.value || '[]';
  let tags = [];
  try { tags = JSON.parse(tagsRaw); } catch {}
  if (!Array.isArray(tags)) tags = [];

  // Duplicate check: same name + set + same normalized colors (order-insensitive)
  const norm = (arr)=>Array.from(new Set((Array.isArray(arr)?arr:[]).filter(c=>VALID.has(c))))
                           .sort((a,b)=>WUBRG_ORDER[a]-WUBRG_ORDER[b]);
  const colorsKey = JSON.stringify(colors);
  const dup = state.collection.some(p => {
    if (p.id === id) return false;
    const sameName = String(p.name||'').trim().toLowerCase() === name.toLowerCase();
    const sameSet  = String(p.set||'').trim().toLowerCase()  === set.toLowerCase();
    const sameCols = JSON.stringify(norm(p.colors)) === colorsKey;
    return sameName && sameSet && sameCols;
  });
  if (dup) return alert('That pack (name + colors + set) already exists.');

  // Commit: preserve draft deck if present
  const idx = state.collection.findIndex(p => p.id === id);
  if (idx === -1) { alert('Could not find this pack in your collection.'); return; }

  const draft = draftPackFor(id);
  const deckFromDraft = Array.isArray(draft?.deck)
    ? draft.deck
    : (Array.isArray(state.collection[idx].deck) ? state.collection[idx].deck : []);

  state.collection[idx] = {
    ...state.collection[idx],
    name,
    theme: theme || null,
    colors,          // now 1–5 symbols (W/U/B/R/G/C), normalized
    set: set || null,
    tags,
    deck: deckFromDraft
  };

  endPackDraft();
  saveAll();
}




/*
* renderCollection()
* Applies filters/sort/paging from state.settingsCollection and renders #packList.
* Also updates pagination controls and eligible counting and all
*/
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

//Guardrails display
function renderGuardrails(settings = state.settingsCollection){
  const pool = state.collection.filter(p=>matchFilters(p, settings));
  const eligibleEl = $('eligibleCount'); if (eligibleEl) eligibleEl.textContent = `Eligible after filter: ${pool.length}`;
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



// ───────────────────────────────────────────────────────────
// 6) Play/deal logic — fairness, rolling, dealing
// ───────────────────────────────────────────────────────────
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



/*
* renderOptions(containerId, packs, onPick, settings)
* Renders choose buttons and optional “View Deck” per option; wires handlers.
*/
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
on(b,'click',(ev)=>{
  // clear previous highlight in this options grid
  el.querySelectorAll('.option.chosen').forEach(n=>n.classList.remove('chosen'));
  // mark this card as chosen
  b.closest('.option')?.classList.add('chosen');
  onPick(p);
});
  });

  // view deck buttons
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



// [UTIL] manaChips() — render mana cost as inline color pips
// Hybrid-aware mana renderer: {W/U} shows as a half-and-half gradient pip
function manaChips(mana){
  if(!mana) return '';
  const HYB_COL = { W:'#efe4a8', U:'#9cc7ff', B:'#cfcfcf', R:'#ff9f90', G:'#aee6b2' };
  const out = [];
  const re = /\{([^}]+)\}/g;
  let m;
  while((m = re.exec(mana))){
    const t = String(m[1]).toUpperCase(); // "2", "R", "W/U", "2/W", "W/P", etc.

    // Numbers, X, or explicit colorless
    if(/^\d+$/.test(t) || t === 'X' || t === 'C'){
      out.push(`<span class="c C">${t}</span>`);
      continue;
    }

    // Simple single-color pip
    if(['W','U','B','R','G'].includes(t)){
      out.push(`<span class="c ${t}">${t}</span>`);
      continue;
    }

    // Two-color hybrid like W/U, U/B, etc.
    const mhy = t.match(/^([WUBRG])\/([WUBRG])$/);
    if(mhy){
      const a = mhy[1], b = mhy[2];
      const aCol = HYB_COL[a] || '#bbb';
      const bCol = HYB_COL[b] || '#888';
      out.push(`<span class="c hyb" style="--hybA:${aCol};--hybB:${bCol}" title="{${a}/${b}}"></span>`);
      continue;
    }

    // Fallback (phyrexian, snow, 2/W, etc.)
    out.push(`<span class="c C">${t}</span>`);
  }
  return `<span class="colors">${out.join('')}</span>`;
}


/* CSV helpers */
// [UTIL] toCSV(rows) — export packs (name, theme, colors, set, tags)
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

// [UTIL] parseCSV(text) — tolerant CSV parser for imports
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
   colors: colors.filter(c => ['W','U','B','R','G','C'].includes(c)).slice(0,5),
  set,
  tags
 });
    }
    return out.filter(p=>p.colors.length>=1);
}



// [UTIL] matchFiltersWhy(pack, s) — best-effort reason if a pack is filtered out
function matchFiltersWhy(p, s){
  const N = x => (x||'').trim().toLowerCase();

  // --- set ---
  if (s.setFilter?.length){
    const key = (p.set || 'Unlabeled');
    if (!s.setFilter.some(k => N(k) === N(key))) return 'set';
  }

  // --- color ---
  if (s.colorFilter?.length){
    const want = s.colorFilter;
    const have = p.colors || [];
    const mode = s.colorMode || 'any';
    const hasAll = want.every(c => have.includes(c));
    const hasAny = want.some(c => have.includes(c));
    const exact  = hasAll && have.length === want.length;
    if (mode === 'any'   && !hasAny) return 'color:any';
    if (mode === 'all'   && !hasAll) return 'color:all';
    if (mode === 'exact' && !exact)  return 'color:exact';
  }

  // --- theme ---
  if (s.themeFilter?.length){
    const th = N(p.theme);
    if (!s.themeFilter.some(t => N(t) === th)) return 'theme';
  }

  // --- tags ---
  if (s.tagFilter?.length){
    const tags = (p.tags || []).map(N);
    if (!s.tagFilter.some(t => tags.includes(N(t)))) return 'tag';
  }

  // --- search ---
  if (s.search?.trim()){
const hay = `${String(p.name||'')} ${String(p.theme||'')} ${String(p.set||'Unlabeled')}`.toLowerCase();
  if (!hay.includes(s.search.trim().toLowerCase())) return 'search';  }

  // --- has deck only ---
  if (s.hasDeckOnly) {
    if (!Array.isArray(p.deck) || p.deck.length === 0) return 'hasDeckOnly';
  }

    // --- numeric usage filters ---
  const off = offeredOf(p), pk = pickedOf(p), pr = pickRateOf(p);
  if (off < (s.minOffered || 0))    return 'minOffered';
  if (pk  < (s.minPicked  || 0))    return 'minPicked';
  if (pr  < (s.minPickRate || 0))   return 'minPickRate';
  if (pr  > (s.maxPickRate ?? 100)) return 'maxPickRate';


  return 'PASS';
}

// [UTIL] diagnoseCollection() — full report (ALL vs SHOWN under NO filters)
function diagnoseCollection(){
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N = x => (x||'').trim();
  const n = x => (x||'').trim().toLowerCase();

  // Build a NO-FILTERS snapshot of collection settings
  const base = state.settingsCollection || {};
  const s0 = {
    ...base,
    setFilter:   [],
    colorFilter: [],
    themeFilter: [],
    tagFilter:   [],
    search:      '',
    colorMode:   'any',
    hasDeckOnly: false,
    minOffered:  0,
   minPicked:   0,
   minPickRate: 0,
   maxPickRate: 100,
   includeDeckSearch: false,
   ctypeFilter: [],
    page:        1
  };

  const ALL   = state.collection || [];
  const SHOWN = ALL.filter(p => matchFilters(p, s0));

  const missing = ALL.filter(p => !SHOWN.some(q => q.id === p.id));
  let out = '';
  out += `TOTAL (all): ${ALL.length}\n`;
  out += `SHOWN (no filters): ${SHOWN.length}\n`;
  out += `MISSING: ${missing.length}\n\n`;

  if (missing.length){
    out += `Missing packs (excluded even with NO filters):\n`;
    for (const p of missing){
      const why = matchFiltersWhy(p, s0);
      const off = offeredOf(p), pk = pickedOf(p), pr = pickRateOf(p);
      out += `- ${p.name}  [set="${p.set||''}", colors=${(p.colors||[]).join('')}, theme="${p.theme||''}", tags="${(p.tags||[]).join(', ')}"]  `
      + `offered=${off} picked=${pk} pr=${pr}% `
      + `reason=${why === 'PASS' ? 'OTHER' : why}\n`;

    }
    out += `\n`;
  }

  const countBy = (arr) => {
    const m = new Map();
    for (const p of arr){
      const key = (p.set ? p.set : 'Unlabeled');
      const k = N(key); // preserve case for display, trim spaces
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  };

  const allBy   = countBy(ALL);
  const shownBy = countBy(SHOWN);
  out += `Per-set counts (ALL vs SHOWN under NO filters):\n`;
  for (const k of [...new Set([...allBy.keys(), ...shownBy.keys()])].sort((a,b)=>a.localeCompare(b))){
    const a = allBy.get(k) || 0;
    const b = shownBy.get(k) || 0;
    out += `• ${k}: ${a} vs ${b}${a!==b ? '  (mismatch)' : ''}\n`;
  }

  const body = `<pre style="white-space:pre-wrap;font:12px/1.45 monospace;margin:0">${esc(out)}</pre>`;
  if (typeof openModal === 'function'){
    openModal({ title:'Collection diagnostics', bodyHTML: body, okText:'Close' });
  } else {
    alert(out); // fallback
  }
}

// Bind the existing button id
(() => {
  const btn = $('diagnoseSetMismatchBtn');
  if (!btn || btn.__bound) return;
  btn.__bound = true;
  on(btn,'click', diagnoseCollection);
})();



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

////////////// Draft history and exports ///////////////
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
  const lines = ['Deck', ...deckArr.map(d=>`${d.qty} ${d.name}`)];
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
        <button class="btn btn-gray" data-viewhist="${i}">View Deck</button>
    <button class="btn btn-gray" data-exp-mtga="${i}">Copy Arena/MTG/Forge</button>
      </div>
    </div>
  `).join('') : `<div class="hint">No drafts yet.</div>`;

  // export bindings
  history.forEach((h,i)=>{
    const title = `${h.first.name} + ${h.second.name}`;
    host.querySelector(`button[data-exp-mtga="${i}"]`)?.addEventListener('click', ()=> copyText(formatMTGA(h.deck)));
  //  host.querySelector(`button[data-exp-mtgo="${i}"]`)?.addEventListener('click', ()=> copyText(formatMTGO(h.deck, title)));
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



// [EDIT-DRAFT] ephemeral editing helpers (pack-level)
function beginPackDraft(id){
  const i = state.collection.findIndex(p => p.id === id);
  if (i < 0) return false;
  // Deep clone current pack to a draft snapshot
  const snap = JSON.parse(JSON.stringify(state.collection[i]));
  state.__draft = { id, pack: snap };
  return true;
}
function draftPackFor(id){
  return (state.__draft && state.__draft.id === id) ? state.__draft.pack : null;
}
function endPackDraft(){
  delete state.__draft;
}


function setDeckForPackSilent(packId, deckArray){
  const deck = (Array.isArray(deckArray) ? deckArray : [])
    .map(normalizeDeckItem)
    .filter(Boolean);

  // If we're editing this pack, write to the draft only (no save yet)
  const d = draftPackFor(packId);
  if (d) {
    d.deck = deck;
    return true; // do NOT persist; Save/Cancel will decide
  }

  // Normal path (not in draft): persist immediately
  const i = state.collection.findIndex(p => p.id === packId);
  if (i < 0) return false;
  state.collection[i] = { ...state.collection[i], deck };
  saveAll(true);
  return true;
}


// Per card quick edit (no Scryfall lookup?)
async function openQuickEditCard(packId, cardName){
  const pack = draftPackFor(packId) || state.collection.find(p=>p.id===packId);
if(!pack || !Array.isArray(pack.deck)) return;

const idx = pack.deck.findIndex(
    d => String(d.name||'').toLowerCase() === String(cardName||'').toLowerCase()
  );
  if(idx < 0) return alert('Card not found in this deck.');

  const it = { ...pack.deck[idx] };

  const bodyHTML = `
    <div class="qedit">
      <div class="row">
        <label>Qty</label>
        <input id="qeQty" type="number" min="1" value="${Math.max(1, parseInt(it.qty||1,10))}">
      </div>
      <div class="row">
        <label>Name</label>
        <input id="qeName" type="text" value="${esc(it.name||'')}" placeholder="Card name">
      </div>
      <div class="row">
        <label>Mana</label>
        <input id="qeMana" type="text" value="${esc(it.mana||'')}" placeholder="{1}{G}">
      </div>
      <div class="row">
        <label>Type</label>
        <input id="qeType" type="text" value="${esc(it.type||'')}" placeholder="Creature — Elf">
      </div>
    </div>
  `;

openModal({
  title: `Edit Card — ${it.name}`,
  okText: 'Save',
  cancelText: 'Cancel',
  bodyHTML,
  onOK(){
    const mod  = $('modalBody');
    const qty  = Math.max(1, parseInt(mod.querySelector('#qeQty')?.value||'1',10));
    const name = (mod.querySelector('#qeName')?.value||'').trim();
    const mana = (mod.querySelector('#qeMana')?.value||'').trim();
    const type = (mod.querySelector('#qeType')?.value||'').trim();

    // Update the in-memory state (silent save: no full app re-render)
    const base = (draftPackFor(packId)?.deck && Array.isArray(draftPackFor(packId).deck))
  ? draftPackFor(packId).deck.slice()
  : (Array.isArray(pack.deck) ? pack.deck.slice() : []);
base[idx] = { ...base[idx], qty, name, mana, type };
const ok = setDeckForPackSilent(packId, base);

    if (!ok) { alert('Could not save this pack (pack ID mismatch).'); return; }

    // --- Preferred: re-render just this editor
    if (typeof renderDeckEditorFor === 'function') {
      renderDeckEditorFor(packId);
      return;
    }

    // --- Fallback: legacy renderer that relies on global `id`
    if (typeof renderDeckEditor === 'function') {
      const prev = window.id;
      window.id = packId;
      try { renderDeckEditor(); } finally { window.id = prev; }
      return;
    }

// --- Last resort: minimal DOM-only refresh (draft will be aware)
(function domOnlyRefresh(){
  const host = $(`d_list_${packId}`);
  if (!host) return;

  // Use draft if present; otherwise current saved deck
  const freshPack = draftPackFor(packId) || state.collection.find(x=>x.id===packId) || {};
  const fresh = Array.isArray(freshPack.deck) ? freshPack.deck : [];

  host.innerHTML = fresh.length ? `
    <ul style="list-style:none; margin:0; padding:0; display:grid; gap:6px">
      ${fresh.map((it,i)=>`
        <li style="
          display:flex; align-items:center; justify-content:space-between;
          border:1px dashed var(--line); padding:6px 8px; border-radius:8px;
          gap:10px; white-space:nowrap; overflow:hidden;
        ">
          <div style="display:flex; align-items:center; gap:10px; min-width:0;">
            <span class="tiny" style="flex:0 0 auto">${it.qty}×</span>
            <strong class="card-name" data-cardname="${esc(it.name)}" style="flex:0 0 auto">${esc(it.name)}</strong>
            <span style="flex:0 0 auto">${it.mana ? manaChips(it.mana) : ''}</span>
            <span class="tag" style="flex:0 0 auto">${esc(it.type||'')}</span>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn xs" data-qedit="${esc(packId)}" data-card="${esc(it.name)}" data-card-index="${i}" type="button" title="Edit this card" aria-label="Edit ${esc(it.name)}">✎</button>
            <button class="btn btn-danger" data-del-line="${i}" type="button">Remove</button>
          </div>
        </li>`).join('')}
    </ul>` : `<div class="hint">No cards yet.</div>`;

  // Delete (draft-aware; no immediate persistence)
  host.querySelectorAll('button[data-del-line]').forEach(b=>{
    b.addEventListener('click',()=>{
      const i = parseInt(b.dataset.delLine,10);
      const base = (draftPackFor(packId)?.deck && Array.isArray(draftPackFor(packId).deck))
        ? draftPackFor(packId).deck.slice()
        : (Array.isArray((state.collection.find(x=>x.id===packId)||{}).deck)
           ? state.collection.find(x=>x.id===packId).deck.slice()
           : []);
      base.splice(i,1);
      setDeckForPackSilent(packId, base); // stays in draft if editing
      domOnlyRefresh();
    });
  });
})();

  }
});
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



// === Deck view: Scryfall type_line → display category =========================
// Display order (only non-empty shown): Planeswalkers, Creatures, Instants,
// Sorceries, Enchantments, Artifacts, Lands.
// Precedence matters for multi-type cards (e.g., "Artifact Creature" → Creatures,
// "Artifact Land" → Lands, "Enchantment Creature" → Creatures).
const DECK_GROUP_ORDER = [
  'Planeswalkers',
  'Creatures',
  'Instants',
  'Sorceries',
  'Enchantments',
  'Artifacts',
  'Lands'
];

function categorizeTypeLine(typeLine){
  const t = String(typeLine || '').toLowerCase();

  // Highest precedence first
  if (/\bland\b/.test(t))          return 'Lands';
  if (/\bplaneswalker\b/.test(t))  return 'Planeswalkers';
  if (/\bcreature\b/.test(t))      return 'Creatures';
  if (/\binstant\b/.test(t))       return 'Instants';
  if (/\bsorcery\b/.test(t))       return 'Sorceries';
  if (/\benchantment\b/.test(t))   return 'Enchantments';
  if (/\bartifact\b/.test(t))      return 'Artifacts';

  // Not part of the requested? well omit these from the render.
  return 'Other';
}
// =============================================================================




// === Render a deck into 3 columns (Creatures / Non-Creatures / Lands)
/*
* renderDeckColumnsHTML(deck)
* Returns HTML suitable for modal display.
*/
// === Render a deck grouped into 7 categories (hides empty categories) =========
function renderDeckColumnsHTML(deck = []) {
  // Build empty buckets in the required display order
  const buckets = Object.fromEntries(DECK_GROUP_ORDER.map(k => [k, []]));

  for (const row of (deck || [])) {
    const name = String(row.name || '').trim();
    if (!name) continue;

    const qty  = Math.max(1, parseInt(row.qty || 1, 10));
    // Prefer Scryfall's type_line if present; fall back to 'type' field
    const typeLine = row.type_line || row.type || '';

    const cat = categorizeTypeLine(typeLine);
    if (!buckets[cat]) continue; // skip “Other”
    buckets[cat].push({ ...row, name, qty });
  }

  // Per-category total (sum quantities)
  const totalQty = arr => arr.reduce((n, x) => n + (parseInt(x.qty || 1, 10) || 1), 0);

  // Render one visible section (skip if empty)
  const sectionHTML = (label, arr) => {
    if (!arr.length) return ''; // hide unused categories
    // Sort inside each category: Name A→Z )
    arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));

    const items = arr.map(c => `
      <li>
        ${c.qty > 1 ? `${c.qty}× ` : ''}<span class="card-name" data-cardname="${esc(c.name)}">${esc(c.name)}</span>
      </li>
    `).join('');

    return `
      <section class="deckcol" style="border:1px solid var(--line,#2a2d31);border-radius:10px;padding:12px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;opacity:.9">${label} (${totalQty(arr)})</h3>
        <ul style="margin:0;padding-left:18px">${items}</ul>
      </section>
    `;
  };

  // Only render non-empty sections in the specified order
  const sections = DECK_GROUP_ORDER
    .map(key => sectionHTML(key, buckets[key]))
    .filter(Boolean)
    .join('');

  return `
    <div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      ${sections || `<div class="hint">No cards yet.</div>`}
    </div>
  `;
}



// ───────────────────────────────────────────────────────────
// 3) Scryfall helpers — rate-limited queue and tiny cache
// ───────────────────────────────────────────────────────────
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
const data = await fetchJSON(url, 'autocomplete');
  const arr = Array.isArray(data.data) ? data.data.slice(0,20) : [];
  scry_cache.set(k, arr);
  return arr;
}
async function scryfallNamedExact(name){
  const k = 'exact:'+name.toLowerCase();
  if(scry_cache.has(k)) return scry_cache.get(k);
const url = 'https://api.scryfall.com/cards/named?exact='+encodeURIComponent(name);
const card = await fetchJSON(url, 'named');
  scry_cache.set(k, card);
  return card;
}
const scryfallAutocompleteQueued = (q)=> enqueueScryfall(()=> scryfallAutocomplete(q));
const scryfallNamedExactQueued  = (n)=> enqueueScryfall(()=> scryfallNamedExact(n));

/* ============== Scryfall batch (POST /cards/collection) =======================
   Up to 75 identifiers per request.
   queue to stay under 10 req/sec, and reuse fetchJSon’s polite retries.
============================================================================== */

function chunk(arr, size){ const out=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }

async function scryfallCollectionByNames(names = []){
  const identifiers = names
    .map(n => ({ name: String(n || '').trim() }))
    .filter(x => x.name);

  const batches = chunk(identifiers, 75);
  const all = [];

  for (const batch of batches) {
    const body = JSON.stringify({ identifiers: batch });
    const data = await enqueueScryfall(() => fetchJSON(
      'https://api.scryfall.com/cards/collection',
      'collection',
      { method: 'POST', headers: { 'Content-Type':'application/json' }, body, timeoutMs: 9000, retries: 4 }
    ));
    if (Array.isArray(data?.data)) all.push(...data.data);
  }
  return all;
}

// Card hover image (Scryfall) — works anywhere with .card-name[data-cardname]
(function initCardHoverPreview(){
  if (document.getElementById('cardPreview')) return;
  const tip = document.createElement('div');
  tip.id = 'cardPreview';
  tip.style.cssText = [
    'position:fixed','z-index:9999','pointer-events:none','display:none',
    'box-shadow:0 6px 18px rgba(0,0,0,.35)','border-radius:8px','overflow:hidden'
  ].join(';');
  document.body.appendChild(tip);

  let currentName = '';
  let token = 0;

  function position(e){
    const pad = 16;
    const w = tip.offsetWidth || 320, h = tip.offsetHeight || 440;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > window.innerWidth)  x = e.clientX - w - pad;
    if (y + h > window.innerHeight) y = e.clientY - h - pad;
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
  }

  document.addEventListener('mousemove', (e)=>{
    if (tip.style.display !== 'none') position(e);
  });

  document.addEventListener('mouseover', async (e)=>{
    const el = e.target.closest('.card-name');
    if (!el) return;
    const name = el.dataset.cardname || el.textContent.trim();
    if (!name) return;

    currentName = name;
    tip.style.display = 'block';
    tip.innerHTML = '<div style="padding:6px 8px;font-size:11px;background:#111;color:#ddd">Loading…</div>';
    position(e);
    const myToken = ++token;

    try{
      const card = await scryfallNamedExactQueued(name);
      if (myToken !== token || currentName !== name) return;

      let url = card?.image_uris?.normal || card?.image_uris?.large;
      if(!url && Array.isArray(card?.card_faces) && card.card_faces[0]?.image_uris){
        url = card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.large;
      }
      if (url){
        tip.innerHTML = `<img src="${url}" alt="${esc(name)}" style="display:block; max-width:320px; height:auto;">`;
      } else {
        tip.innerHTML = `<div style="padding:6px 8px;font-size:11px;background:#111;color:#ddd">No image</div>`;
      }
    }catch{
      if (myToken !== token) return;
      tip.innerHTML = `<div style="padding:6px 8px;font-size:11px;background:#111;color:#ddd">No image</div>`;
    }
  });

  document.addEventListener('mouseout', (e)=>{
    const el = e.target.closest('.card-name');
    if (!el) return;
    tip.style.display = 'none';
    tip.innerHTML = '';
    currentName = '';
    token++;
  });
})();



// [UTIL] fetchJSON(url,label,timeoutMs) — aborts slow requests to avoid hangs
// Robust JSON fetch with polite retries + 429 handling.
// Backward-compatible signature: fetchJSON(url, label, timeoutMsOrOptions?)
async function fetchJSON(url, label, timeoutOrOpts){
  // keep compatibility with old calls that passed a number as 3rd arg
  let opts = {};
  if (typeof timeoutOrOpts === 'number') opts.timeoutMs = timeoutOrOpts;
  else if (timeoutOrOpts && typeof timeoutOrOpts === 'object') opts = { ...timeoutOrOpts };

  const {
    method = 'GET',
    headers = {},
    body = null,
    timeoutMs = 6000,
    retries = 3,
  } = opts;

  const baseBackoff = 800;
  const capBackoff  = 5000;
  const wait = (ms)=> new Promise(r => setTimeout(r, ms));
  const backoff = (attempt)=>{
    const jitter = Math.floor(Math.random() * 300);
    return Math.min(capBackoff, baseBackoff * Math.pow(2, attempt)) + jitter;
  };

  let attempt = 0;
  while (true) {
    const ctl = new AbortController();
    const t = setTimeout(()=>ctl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Accept':'application/json', ...headers },
        body,
        signal: ctl.signal
      });

      // 429 — honor Retry-After if present, else exponential backoff
      if (res.status === 429) {
        if (attempt >= retries) throw new Error(`${label} 429 (gave up)`);
        const ra = parseInt(res.headers.get('Retry-After') || '', 10);
        await wait(!isNaN(ra) ? ra * 1000 : backoff(attempt++));
        continue;
      }

      // 5xx — transient; try again with backoff
      if (res.status >= 500 && res.status <= 599) {
        if (attempt >= retries) throw new Error(`${label} ${res.status} (gave up)`);
        await wait(backoff(attempt++));
        continue;
      }

      if (!res.ok) throw new Error(`${label} ${res.status}`);
      return await res.json();
    } catch (err) {
      // Abort/network — retry if budget left
      if (attempt < retries && (err?.name === 'AbortError' || err?.message)) {
        await wait(backoff(attempt++));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(t);
    }
  }
}


/* Log & Session */
function log(msg){ const li=document.createElement('li'); li.innerHTML=`<span class="tiny">${esc(msg)}</span>`; $('log').prepend(li); }
function resetSession(){
  state.session = {
    firstOptions: [],
    chosenFirst: null,
    secondOptions: [],
    chosenSecond: null,
    usedIds: new Set()
  };

  ['firstOptions','secondOptions','chosenFirst','finalPair'].forEach(id=>{
    const el = $(id);
    if (el) el.innerHTML = '';
  });

  // These elements might not exist if  removed/commented the blocks.
  const cf = $('chosenFirstWrap'); if (cf) cf.style.display = 'none';
  const fp = $('finalPairWrap');  if (fp) fp.style.display = 'none';
  const ow = $('overlapWrap');    if (ow) ow.style.display = 'none';

  $('statusLine').textContent = 'No session yet.';
  $('log').innerHTML = '';
  renderGuardrails(activeSettings());
}

function updateView(){
  const v = state.settingsCollection.view;

  $('collectionCard').classList.toggle('hidden', v!=='collection');
  $('playCard').classList.toggle('hidden', v!=='play');
  $('statsCard').classList.toggle('hidden', v!=='stats');
  $('officialCard').classList.toggle('hidden', v!=='official');

  $('btnViewCollection').classList.toggle('active', v==='collection');
  $('btnViewPlay').classList.toggle('active', v==='play');
  $('btnViewStats').classList.toggle('active', v==='stats');
  $('btnViewOfficial').classList.toggle('active', v==='official');

  // Stats View
  if(v==='stats'){ renderStatsPanel(); return; }

  // Collection View
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

// Offical View
if (v === 'official'){
  if (typeof window.ensureOfficialLoaded === 'function') {
    window.ensureOfficialLoaded().then(()=>renderOfficialPanel()).catch(()=>{
      // Show a friendly message 
const grid = $('officialGrid');
if (grid) grid.innerHTML = `<div class="hint">Failed to load official catalog.</div>`;
    });
    return; // render will happen above
  }
  // Fallback when we directly include official_packs.js
  renderOfficialPanel();
  return;
}









function getOfficialFiltered(all){
  const st = state.official || {};
  const q = (st.search||'').trim().toLowerCase();

  return all.filter(p=>{
    // Set
    if (Array.isArray(st.setFilter) && st.setFilter.length){
      const key = p.set || 'Unlabeled';
      if (!st.setFilter.includes(key)) return false;
    }
    // Colors ANY (WUBRG/C)
    if (Array.isArray(st.colorFilter) && st.colorFilter.length){
      const want = st.colorFilter;
      const have = Array.isArray(p.colors)? p.colors : [];
      if (!want.some(c => have.includes(c))) return false;
    }
    // Search: name/theme/set/tags
    if (q){
      const hay = `${String(p.name||'')} ${String(p.theme||'')} ${String(p.set||'')} ${(p.tags||[]).map(t=>'#'+t).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}



// Try multiple sources for the image; fallback to a guessed path in /img
function officialImageUrl(p){
  if (window.OFFICIAL_IMAGE_MAP){
  const u = OFFICIAL_IMAGE_MAP[p.id] || OFFICIAL_IMAGE_MAP[p.name];
  if (u) return u;
}
  if (p.image) return p.image;
  if (p.face) return p.face;
  // Heuristics: slug from name or id
  const slug = (s)=>String(s||'').toLowerCase()
                  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const candidates = [];
  if (p.name) candidates.push(`img/${slug(p.name)}.jpg`);
  if (p.id)   candidates.push(`img/${slug(p.id)}.jpg`);
  if (p.set && p.name) candidates.push(`img/${slug(p.set)}-${slug(p.name)}.jpg`);
  return candidates[0] || '';
}



  // play view
  renderSetFilter(state.settingsPlay, 'setFilterBox');
  renderColorFilter(state.settingsPlay, 'colorFilterBox');
  renderThemeFilter(state.settingsPlay, 'playThemeFilterBox');
  renderTagFilter(state.settingsPlay, 'playTagFilterBox');
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

function renderThemeFilter(seedSettings = activeSettings(), containerId = 'themeFilterBox'){
  const box = $(containerId); if(!box) return;
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
    const eligible = $('eligibleCount');
    if (eligible) eligible.textContent = `Eligible after filter: ${eligibleAfterFilter(s)}`;
    renderGuardrails(s);
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

function renderTagFilter(seedSettings = activeSettings(), containerId = 'tagFilterBox'){ 
  const box = $(containerId); if(!box) return;

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
    const eligible = $('eligibleCount');
    if (eligible) eligible.textContent = `Eligible after filter: ${eligibleAfterFilter(s)}`;
    renderGuardrails(s);
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


// [PREF] Restore last viewed panel (if any)
{
  const last = localStorage.getItem(LS_VIEW);
  if (last && ['collection','play','stats','official'].includes(last)) {
    state.settingsCollection.view = last;
  }
}



// View switch
on($('btnViewCollection'),'click',()=>{
  state.settingsCollection.view='collection';
  localStorage.setItem(LS_VIEW, 'collection');
  updateView();
});
on($('btnViewPlay'),'click',()=>{
  state.settingsCollection.view='play';
  localStorage.setItem(LS_VIEW, 'play');
  updateView();
});
on($('btnViewStats'),'click',()=>{
  state.settingsCollection.view='stats';
  localStorage.setItem(LS_VIEW, 'stats');
  updateView();
});
on($('btnViewOfficial'),'click',()=>{
  state.settingsCollection.view='official';
  localStorage.setItem(LS_VIEW, 'official');
  updateView();
});
// [PREF] Initial render honoring restored last view
// Runs once on load after wiring the buttons & restoring LS_VIEW.
updateView();



    // Add/manage packs
// Add/manage packs — NEW (supports 1–5 colors incl. C, reads from grid)
on($('addPackBtn'),'click',()=>{
  const name  = $('packName').value.trim();
  const theme = $('packTheme').value.trim();
  const set   = $('packSet').value.trim();
  const tags  = parseTags($('packTags')?.value || '');

  if (!name) return alert('Please enter a pack name.');

  // Read selected colors directly from the grid
  const grid   = $('manaGrid');
  const colors = grid ? Array.from(grid.querySelectorAll('.mana-btn.selected')).map(b=>b.dataset.color) : [];

  if (colors.length < 1) return alert('Please choose at least one color.');
  if (colors.length > 5) return alert('Packs can have at most 5 colors.');

  // Normalize color order for dedupe (W U B R G C)
  const ORDER    = { W:0, U:1, B:2, R:3, G:4, C:5 };
  const sortCols = arr => arr.slice().sort((a,b)=>(ORDER[a]??99)-(ORDER[b]??99));
  const cols     = sortCols(colors);

  // Stronger duplicate check (name + set + normalized colors)
  const dup = state.collection.some(p =>
    p.name.trim().toLowerCase() === name.toLowerCase() &&
    String(p.set||'').trim().toLowerCase() === set.toLowerCase() &&
    JSON.stringify(sortCols(p.colors||[])) === JSON.stringify(cols)
  );
  if (dup) return alert('That pack (name + colors + set) already exists.');

  const deck = (state.newPackDeck||[]).map(normalizeDeckItem).filter(Boolean);

  state.collection.push({
    id: uid(),
    name,
    theme: theme || null,
    colors: cols,
    set: set || null,
    deck,
    tags
  });

  saveAll();
  state.settingsCollection.page = 1;

  // clear the add-pack form
  ['packName','packTheme','packSet','packTags'].forEach(id=>$(id).value='');
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



// Press Enter in the Tags input to submit the Add Pack form
(()=>{
  const input = $('packTags');
  const btn   = $('addPackBtn');
  if (!input || !btn || input.__enterBound) return;
  input.__enterBound = true;

  input.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') {
      e.preventDefault();    // don't insert a newline / don't submit anything unintended
      btn.click();
    }
  });
})();



on($('clearFormBtn'),'click',()=>{
  ['packName','packTheme','packSet','packTags'].forEach(id=>$(id).value='');
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
    on($('wipeBtn'),'click',()=>{ if(confirm('Wipe entire collection and Stats?')){ state.collection=[]; state.fair={}; saveAll(); resetSession(); }});

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

on($('magicLinkBtn'), 'click', () => withBusy('Minting magic…', createMagicLink));
on($('pasteMagicLinkBtn'),'click',()=>withBusy('Importing via Magic Link…', openPasteMagicLink));



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


// === New-pack autosuggest with Loading ===
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
    okText:'Add',
    bodyHTML:`<textarea id="n_bulk_ta" rows="10" style="width:100%"></textarea>`,
    onOpen: ()=> $('n_bulk_ta')?.focus(),
    onOK: async ()=>{
      const ta = $('n_bulk_ta'); if(!ta) return;
const items = parseDeckText(ta.value);
if(!items.length) return;
const enriched = await withBusy('Attuning mana channels…', () => enrichWithScryfallMin(items));


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
// Play: color mode (any/all/exact)
on($('colorModePlay'),'change', e=>{
  state.settingsPlay.colorMode = e.target.value || 'any';
  renderGuardrails(state.settingsPlay);
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
const cmp = $('colorModePlay');
if (cmp) cmp.value = state.settingsPlay.colorMode;
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



/* [PATCH A] Clear Filters — bind once, context-aware (Play vs Collection) */
(() => {
  const btn = $('clearFiltersBtn');
  if (!btn || btn.__bound) return;
  btn.__bound = true;

  on(btn, 'click', () => {
    const s = activeSettings(); // Collection or Play
    s.setFilter    = [];
    s.colorFilter  = [];
    s.themeFilter  = [];
    s.tagFilter    = [];
    s.search       = '';
    s.page         = 1;
    if (s === state.settingsCollection) {
     s.minOffered = 0; s.minPicked = 0; s.minPickRate = 0; s.maxPickRate = 100;
     s.hasDeckOnly = false; s.ctypeFilter = []; s.includeDeckSearch = false;
   }

    const isPlay       = (s === state.settingsPlay);
    const setBoxId     = isPlay ? 'setFilterBox'        : 'colSetFilterBox';
    const colorBoxId   = isPlay ? 'colorFilterBox'      : 'colColorFilterBox';
    const themeBoxId   = isPlay ? 'playThemeFilterBox'  : 'themeFilterBox';
    const tagBoxId     = isPlay ? 'playTagFilterBox'    : 'tagFilterBox';

    renderSetFilter(s,   setBoxId);
    renderColorFilter(s, colorBoxId);
    renderThemeFilter(s, themeBoxId);
    renderTagFilter(s,   tagBoxId);
    renderGuardrails(s);

    const input = $('searchPacks');
    if (input) input.value = '';
    // Reset Collection-only UI widgets to reflect cleared state
   if (!isPlay) {
     ['minOffered','minPicked','minPickRate','maxPickRate'].forEach(id=>{ if($(id)) $(id).value = (id==='maxPickRate' ? '100' : '0'); });
     ['ctypeMono','ctypeBi','ctypeTri'].forEach(id=>{ if($(id)) $(id).checked = false; });
     if ($('hasDeckOnly')) $('hasDeckOnly').checked = false;
     if ($('includeDeckSearch')) $('includeDeckSearch').checked = false;
     renderCollection();
   }
  });
})();



// Clear Filters — Collection view only
(() => {
  const btn = $('clearCollectionFiltersBtn');
  if (!btn || btn.__bound) return;
  btn.__bound = true;

  on(btn, 'click', () => {
    const s = state.settingsCollection;
    s.setFilter   = [];
    s.colorFilter = [];
    s.themeFilter = [];
    s.tagFilter   = [];
    s.search      = '';
    s.page        = 1;
    s.minOffered = 0;
    s.minPicked  = 0;
    s.minPickRate= 0;
    s.maxPickRate= 100;
    s.hasDeckOnly= false;
    s.ctypeFilter= [];
    s.includeDeckSearch = false;

    // re-render the collection filter UIs
    renderSetFilter(s,   'colSetFilterBox');
    renderColorFilter(s, 'colColorFilterBox');
    renderThemeFilter(s, 'themeFilterBox');
    renderTagFilter(s,   'tagFilterBox');

    // clear the search box if present
    const input = $('searchPacks'); if (input) input.value = '';
    // reset the UI controls so they match state
   ['minOffered','minPicked','minPickRate','maxPickRate'].forEach(id=>{ if($(id)) $(id).value = (id==='maxPickRate' ? '100' : '0'); });
   ['ctypeMono','ctypeBi','ctypeTri'].forEach(id=>{ if($(id)) $(id).checked = false; });
   if ($('hasDeckOnly')) $('hasDeckOnly').checked = false;
   if ($('includeDeckSearch')) $('includeDeckSearch').checked = false;

    // repaint the list and (optionally) guardrails/eligible label if you show it here
    renderCollection();
    renderGuardrails(s);
  });
})();



/*
* finalizeSecondRoll(picks, note, settings)
* Ensures N unique options, applies fairness fills, renders #secondOptions and binds picks.
*/
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
  // highlight in the second list
  $('secondOptions')?.querySelectorAll('.option.chosen').forEach(n=>n.classList.remove('chosen'));
  pickBtn.closest('.option')?.classList.add('chosen');
  state.session.chosenSecond = p;
    $('finalPairWrap').style.display='';
    const a = state.session.chosenFirst;

    $('finalPair').innerHTML = `
      <div class="option">${renderOptionCard(a)}</div>
      <div class="option">${renderOptionCard(p, settings)}</div>`;

    // View Combined Deck on the final pair
// View + Export Combined Deck on the final pair
const merged = combineDecks(a, p);
$('finalPair').insertAdjacentHTML('beforeend', `
  <div class="pill" style="margin-top:8px">
    <button id="btnViewFinalCombinedDeck" class="btn btn-cyan"  type="button">View Combined Deck</button>
    <button id="btnExpFinalMTGA"          class="btn btn-gray"  type="button">Copy MTGA</button>
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

// NEW: export buttons
const title = `${a.name} + ${p.name}`;
$('btnExpFinalMTGA')?.addEventListener('click', ()=> copyText(formatMTGA(merged)));
// MTGO Button thing $('btnExpFinalMTGO')?.addEventListener('click', ()=> copyText(formatMTGO(merged, title)));

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
      <button class="btn btn-cyan" type="button" data-viewdeal="${i}">View Combined Deck</button>
<button class="btn btn-gray" type="button" data-expdeal-mtga="${i}">Copy Arena/MTG/Forge</button>
    </div>
  </div>
`).join('') || `<div class="hint">No result.</div>`;

state.dealtPairs = out; // used by the delegated handler



$('dealSummary').textContent=`Dealt ${out.length} / ${settings.players}${settings.avoidCollisions?' (no pack reuse)':''}.`;
    });

    on($('clearDealsBtn'),'click',()=>{$('dealtResults').innerHTML=''; $('dealSummary').textContent='';});



/* Quick Play — one delegated click handler also prevents duplicate listeners */
(()=>{
  const wrap = $('dealtResults');
  if (!wrap || wrap.__delegated) return;
  wrap.__delegated = true;

  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // latest dealt round (set in Step 2)
    const arr = state.dealtPairs || [];
    const idxFrom = (attr) => parseInt(btn.getAttribute(attr) || '-1', 10);

    // View combined deck
    if (btn.hasAttribute('data-viewdeal')) {
      const i = idxFrom('data-viewdeal'); if (!(i in arr)) return;
      const pair = arr[i], first = pair.first ?? pair[0], second = pair.second ?? pair[1];
      const merged = combineDecks(first, second);
      openModal({
        title: `Player ${i+1} — ${first.name} + ${second.name}`,
        okText: 'Close',
        bodyHTML: renderDeckColumnsHTML(merged)
      });
      return;
    }

    // Copy MTGA (no title)
    if (btn.hasAttribute('data-expdeal-mtga')) {
      const i = idxFrom('data-expdeal-mtga'); if (!(i in arr)) return;
      const pair = arr[i], first = pair.first ?? pair[0], second = pair.second ?? pair[1];
      copyText(formatMTGA(combineDecks(first, second)));
      return;
    }

    // Copy MTGO (keep title)
    // if (btn.hasAttribute('data-expdeal-mtgo')) {
    //  const i = idxFrom('data-expdeal-mtgo'); if (!(i in arr)) return;
    //  const pair = arr[i], first = pair.first ?? pair[0], second = pair.second ?? pair[1];
    //  const title  = `${first.name} + ${second.name}`;
    //  copyText(formatMTGO(combineDecks(first, second), title));
    //  return;
    // }
  });
})();




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

// Honor previously restored/saved view if valid; else default to 'collection'
const validViews = ['collection','play','stats','official'];

if (!validViews.includes(state.settingsCollection.view)) {
  const saved = (()=>{ try { return localStorage.getItem(LS_VIEW) || ''; } catch(_){ return ''; } })();
  state.settingsCollection.view = validViews.includes(saved) ? saved : 'collection';
}

// If URL hash indicates a view, prefer it (and save it)
{
  const hv = (location.hash || '').replace(/^#/, '');
  if (validViews.includes(hv)) {
    state.settingsCollection.view = hv;
    try { localStorage.setItem(LS_VIEW, hv); } catch(_){}
  }
}

updateView();
renderEverything();
checkForMagicLinkInURL();

});

// --- Mana grid wiring (row-filling buttons incl. Colorless) ---
(function initManaGrid(){
  function ready(fn){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, { once:true });
    } else { fn(); }
  }

  ready(() => {
    const grid = document.getElementById('manaGrid');
    if (!grid) return;

    const hint = document.getElementById('manaHint');
    const h1 = document.getElementById('color1');
    const h2 = document.getElementById('color2');
    const h3 = document.getElementById('color3');

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
      if (hint){
        const n = colors.length;
        hint.textContent = n===0 ? 'Mana Idenity'
                : n===1 ? 'Mono color.'
                : n===2 ? 'Two-color.'
                : n===3 ? 'Tri-color.'
                : n===4 ? 'Four-color.'
                : 'Five-color.';
      }
    }

    // Click to toggle (max 3 fo now)
// Click to toggle (max 5 now)
grid.addEventListener('click', (e)=>{
  const btn = e.target.closest('.mana-btn');
  if (!btn || !grid.contains(btn)) return;
  const isSelected = btn.classList.contains('selected');
  const count = grid.querySelectorAll('.mana-btn.selected').length;
  if (!isSelected && count >= 5){
    if (hint) hint.textContent = 'You can select up to 5 colors.';
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
      if (hint) hint.textContent = 'Mana Idenity';
    };

    // If hidden inputs already had values (edit flows), reflect in UI
    [h1.value, h2.value, h3.value].filter(Boolean).forEach(c=>{
      const btn = grid.querySelector(`.mana-btn[data-color="${c}"]`);
      if (btn){ btn.classList.add('selected'); btn.setAttribute('aria-pressed','true'); }
    });
    syncHidden();
  });
})();

// Delegated handler for quick edit buttons in deck lists
// [UTIL] lb(arr) — render top-pick list items (Stats)
document.addEventListener('click', (e)=>{
  const b = e.target.closest('button[data-qedit]');
  if(!b) return;
  const packId = b.getAttribute('data-qedit');
  const card = b.getAttribute('data-card');
  if(packId && card) openQuickEditCard(packId, card);
});

// [UTIL] safePct(n, d) — percent helper (Stats)
function safePct(n, d){ return d ? Math.round((n/d)*100) : 0; }



// ───────────────────────────────────────────────────────────
// 7) Stats view — aggregation & rendering
// ───────────────────────────────────────────────────────────
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

  // “Most ignored”: seen a lot but not picked
  const lowIgnored = rows
    .filter(r=>r.offer>=minOffers)
    .map(r=>({ ...r, snubs: r.offer - r.pick }))
    .sort((a,b)=>{
      if (b.snubs !== a.snubs) return b.snubs - a.snubs;
      if (a.pr   !== b.pr)   return a.pr   - b.pr;
      return b.offer - a.offer;
    })
    .slice(0, topN);

  return {
    totalPacks, totalOffered, totalPicked, overallPR, zeroOffered, zeroPicked,
    byColor, byCtype, bySetArr, topOffered, topPicked, topPickRate, lowIgnored
  };
}



/**
 * renderStatsKPI()
 * Populates #statsKPI with quick metrics from state.collection counters.
 * Side-effects: updates innerHTML of #statsKPI (if present).
 */
function renderStatsKPI(){
  const el = $('statsKPI'); if(!el) return;
  const packs = state.collection || [];
  const total = packs.length;

  const offered = packs.reduce((a,p)=> a + offeredOf(p), 0);
  const picked  = packs.reduce((a,p)=> a + pickedOf(p), 0);
  const avgPick = safePct(picked, offered);
  const uniquePlayed = packs.filter(p=> pickedOf(p) > 0).length;

  const triPicked = packs
    .filter(p => (p.colors||[]).length === 3)
    .reduce((a,p)=> a + pickedOf(p), 0);
  const triShare = picked ? Math.round((triPicked/picked)*100) : 0;

  let mostPicked = null, mostIgnored = null;
  for (const p of packs){
    if (!mostPicked || pickedOf(p) > pickedOf(mostPicked)) mostPicked = p;
    const o = offeredOf(p), pk = pickedOf(p);
    if (o > 0 && pk === 0) {
      if (!mostIgnored || o > offeredOf(mostIgnored)) mostIgnored = p;
    }
  }

  el.innerHTML = `
    <div class="kpi"><div class="label">Total Packs</div><div class="value">${total}</div></div>
    <div class="kpi"><div class="label">Unique Played</div><div class="value">${uniquePlayed}</div></div>
    <div class="kpi"><div class="label">Avg Pick%</div><div class="value">${avgPick}%</div></div>
    <div class="kpi"><div class="label">Tri Share</div><div class="value">${triShare}%</div></div>
    <div class="kpi"><div class="label">Most Picked</div><div class="value">${esc(mostPicked?.name||'—')}</div></div>
    <div class="kpi"><div class="label">Most Ignored</div><div class="value">${esc(mostIgnored?.name||'—')}</div></div>
  `;
}


/**
 * renderLowPerformers()
 * “Most ignored” = many offers but few/no picks.
 * Uses fair stats (state.fair); configurable via data-* on #statsLowPerf:
 *   data-min-offered="5"  data-top-n="5"
 */
function renderLowPerformers(){
  const el = $('statsLowPerf'); if(!el) return;
  const minOffered = parseInt(el.dataset.minOffered || '5', 10);
  const topN       = parseInt(el.dataset.topN || '5', 10);

  const rows = (state.collection || []).map(p => {
    const offered = offeredOf(p);
    const picked  = pickedOf(p);
    return {
      name: p.name,
      offered,
      picked,
      pr: safePct(picked, offered),
      snubs: Math.max(0, offered - picked)
    };
  }).filter(r => r.offered >= minOffered);

  const worst = rows
    .sort((a,b)=>{
      if (b.snubs !== a.snubs) return b.snubs - a.snubs;
      if (a.pr   !== b.pr)     return a.pr   - b.pr;
      return b.offered - a.offered;
    })
    .slice(0, topN);

  const items = worst.map(r => `
    <li>
      <strong>${esc(r.name)}</strong>
      <span class="tiny">— ${r.pr}% pick (${r.picked}/${r.offered}), ${r.snubs} snub${r.snubs===1?'':'s'}</span>
    </li>`).join('');

  el.innerHTML = `
    <div class="callout-title">Most ignored (≥${minOffered} offers)</div>
    <ul class="minilist">
      ${items || `<li class="hint">Not enough data yet.</li>`}
    </ul>
  `;
  el.classList.remove('hidden');
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
      <div class="mini-table">
        <h4>Most Ignored (≥5 offers)</h4>
        <ul>${lb(s.lowIgnored)}</ul>
      </div>
    </div>
  `;
}

// [UTIL] usageToCSV() — export usage CSV
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
  // [UTIL] escCSV(v) — quote+escape for CSV fields
  const escCSV = (v)=> {
    const s=String(v??'');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const body = rows.map(r=> header.map(h=>escCSV(r[h])).join(',')).join('\n');
  return header.join(',')+'\n'+body;
}


// OFFICIAL PAGER — forced attach, no flag
(() => {
  if (document.__HYDRA_PAGER_V3__) return;
  document.__HYDRA_PAGER_V3__ = true;
  

  document.addEventListener('click', (e) => {
    const el = e.target && e.target.closest &&
      e.target.closest('#officialPrev, #officialNext, [data-role="official-prev"], [data-role="official-next"]');
    if (!el) return;

    const st = state.official || (state.official = {
      search: '', colorFilter: [], colorMode: 'any', setFilter: [], kind: 'ALL', page: 1, pageSize: 24
    });

    const role   = el.getAttribute && el.getAttribute('data-role');
    const isPrev = (el.id === 'officialPrev' || role === 'official-prev');
    const isNext = (el.id === 'officialNext' || role === 'official-next');

    st.page = Math.max(1, (st.page || 1) + (isNext ? 1 : (isPrev ? -1 : 0)));

    renderOfficialGrid();
  });
})();




// THE END OF THE WORLD
})();