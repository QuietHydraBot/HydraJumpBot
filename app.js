/*********** Hydra Jump Bot - local build */
(()=>{
  const LS_KEY='jumpstart_collection_v1';
  const LS_FAIR='jumpstart_fair_stats_v1';
  const $=id=>document.getElementById(id);
  const on=(el,ev,fn)=>el&&el.addEventListener(ev,fn);
  const uid=()=>Math.random().toString(36).slice(2,10);
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

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
    settings:{excludeUnpicked:false,relaxIfStuck:true,overlapColor:'AUTO',setFilter:[],colorFilter:[],optionsPerRoll:4,triSharePct:10,capOneTri:true,fairMode:true,avoidCollisions:true,players:2,view:'collection',sortBy:'name',sortDir:'asc',pageSize:20,page:1}
  };

  /* Storage */
  function setStorageStatus(level){const el=$('storageStatus'); if(!el) return; el.textContent=level==='ok'?'Storage: OK':'Storage: Limited'; el.className='badge '+(level==='ok'?'ok':'warn');}
  function loadCollection(){try{const raw=localStorage.getItem(LS_KEY); if(!raw){setStorageStatus('ok'); return [];} const arr=JSON.parse(raw); setStorageStatus('ok'); return Array.isArray(arr)?arr.filter(p=>p&&p.id&&p.name&&Array.isArray(p.colors)&&p.colors.length>=1&&p.colors.length<=3):[];}catch(e){state.storageOK=false; setStorageStatus('limited'); return [];}}
  function loadFair(){try{const raw=localStorage.getItem(LS_FAIR); return raw?(JSON.parse(raw)||{}):{};}catch{ return {}; }}
  function saveAll(){try{if(state.storageOK){localStorage.setItem(LS_KEY,JSON.stringify(state.collection));localStorage.setItem(LS_FAIR,JSON.stringify(state.fair));}setStorageStatus('ok');}catch(e){state.storageOK=false; setStorageStatus('limited');} renderEverything();}

  /* Storage Health Thing */
  async function refreshStorageHealth(){
    try{
      const est=await (navigator.storage?.estimate?.()||Promise.resolve({usage:0,quota:5*1024*1024}));
      const quota=est.quota||5*1024*1024; let lsBytes=0;
      try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); const v=localStorage.getItem(k)||''; lsBytes+=(k.length+v.length)*2; } }catch{}
      const usage=Math.max(est.usage||0,lsBytes);
      const pct=Math.min(100,Math.round((usage/quota)*100));
      $('storeBar').style.width=pct+'%';
      $('storeLine').textContent=`Approx. used ${formatBytes(usage)} of ${formatBytes(quota)} (${pct}%)`;
      $('storeHint').textContent=`Local to this device/browser. Private/Incognito may not persist.`;
    }catch{ $('storeLine').textContent='Storage estimate unavailable.'; }
  }
  const formatBytes=n=>{if(!n)return'0 B';const u=['B','KB','MB','GB'];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(n>=10||i===0?0:1)} ${u[i]}`;};

  /* Filters/Sort/Paging Stuff */
  function matchFilters(p){
    if(state.settings.setFilter.length){const key=p.set?p.set:'Unlabeled'; if(!state.settings.setFilter.includes(key)) return false;}
    if(state.settings.colorFilter.length){ if(!p.colors.some(c=>state.settings.colorFilter.includes(c))) return false; }
    return true;
  }
  function eligibleAfterFilter(){return state.collection.filter(matchFilters).length;}
  function computeSetCounts(){const m=new Map(); for(const p of state.collection){const k=p.set?p.set:'Unlabeled'; m.set(k,(m.get(k)||0)+1);} return m;}

  function renderSetFilter(){
    const counts=computeSetCounts(), all=Array.from(counts.keys()).sort((a,b)=>a.localeCompare(b));
    const box=$('setFilterBox'), eligible=$('eligibleCount');
    if(!all.length){ box.innerHTML='<div class="tiny">No sets yet.</div>'; state.settings.setFilter=[]; if(eligible) eligible.textContent='Eligible after filter: 0'; return; }
    box.innerHTML=all.map(s=>{const id='setf_'+s.replace(/\W+/g,'_'); const chk=state.settings.setFilter.includes(s)?'checked':''; const count=counts.get(s)||0; return `<label class="pill"><input type="checkbox" id="${id}" ${chk}><span>${esc(s)} (${count})</span></label>`;}).join('');
    all.forEach(s=>{const id='setf_'+s.replace(/\W+/g,'_'), el=$(id); on(el,'change',()=>{ if(el.checked){ if(!state.settings.setFilter.includes(s)) state.settings.setFilter.push(s);} else { state.settings.setFilter=state.settings.setFilter.filter(x=>x!==s);} if(eligible) eligible.textContent=`Eligible after filter: ${eligibleAfterFilter()}`; renderGuardrails(); renderCollection(); });});
    if(eligible) eligible.textContent=`Eligible after filter: ${eligibleAfterFilter()}`;
  }
  function renderColorFilter(){
    const wrap=$('colorFilterBox'), colors=['W','U','B','R','G'];
    wrap.innerHTML=colors.map(c=>{const id='cf_'+c, chk=state.settings.colorFilter.includes(c)?'checked':''; return `<label class="pill"><input type="checkbox" id="${id}" ${chk}><span>${c}</span></label>`;}).join('');
    colors.forEach(c=>{const id='cf_'+c, el=$(id); on(el,'change',()=>{ if(el.checked){ if(!state.settings.colorFilter.includes(c)) state.settings.colorFilter.push(c);} else { state.settings.colorFilter=state.settings.colorFilter.filter(x=>x!==c);} const eligible=$('eligibleCount'); if(eligible) eligible.textContent=`Eligible after filter: ${eligibleAfterFilter()}`; renderGuardrails(); state.settings.page=1; renderCollection(); });});
  }

  function offeredOf(p){return state.fair[p.id]?.offer||0;}
  function colorTypeRank(p){return p.colors.length;}
  function comparePacks(a,b){const dir=state.settings.sortDir==='asc'?1:-1; let r=0; switch(state.settings.sortBy){
    case 'name': r=a.name.localeCompare(b.name); break;
    case 'set': r=(a.set||'').localeCompare(b.set||''); break;
    case 'theme': r=(a.theme||'').localeCompare(b.theme||''); break;
    case 'ctype': r=colorTypeRank(a)-colorTypeRank(b); if(r===0) r=a.colors.join('').localeCompare(b.colors.join('')); if(r===0) r=a.name.localeCompare(b.name); break;
    case 'offered': r=offeredOf(a)-offeredOf(b); if(r===0) r=a.name.localeCompare(b.name); break;
    default: r=a.name.localeCompare(b.name);
  } return r*dir; }
  function sortedFiltered(){return state.collection.filter(matchFilters).slice().sort(comparePacks);}
  function renderPaginationControls(total){
    const ps=state.settings.pageSize, pages=Math.max(1,Math.ceil(total/ps));
    if(state.settings.page>pages) state.settings.page=pages;
    $('pageInfo').textContent=`Page ${state.settings.page} / ${pages}`;
    $('prevPage').disabled=state.settings.page<=1; $('nextPage').disabled=state.settings.page>=pages;
    $('jumpPage').max=pages; $('jumpPage').value=state.settings.page;
  }
  function offerTag(p){ if(!state.settings.fairMode) return ''; const c=offeredOf(p); return `<span class="offer">offered: ${c}</span>`; }
  function packRowHtml(p){
    return `<div class="pack" id="row_${p.id}">
      <div class="pill">
        <strong>${esc(p.name)}</strong>
        <div class="meta">
          ${p.theme?`<span class="theme">${esc(p.theme)}</span>`:''}
          ${chips(p.colors)} ${typeChip(p)}
          ${p.set?`<span class="tag">${esc(p.set)}</span>`:'<span class="tag">Unlabeled</span>'}
          ${offerTag(p)}
        </div>
      </div>
      <div class="pill">
        <button class="btn btn-gray" data-edit="${p.id}">Edit</button>
        <button class="btn btn-danger" data-del="${p.id}">Delete</button>
      </div>
    </div>`;
  }
  function colorOptions(sel){const all=['','W','U','B','R','G']; return all.map(c=>`<option value="${c}" ${c===sel?'selected':''}>${c||'—'}</option>`).join('');}
  function bindPackRowButtons(){
    document.querySelectorAll('button[data-del]').forEach(b=>b.addEventListener('click',()=>{state.collection=state.collection.filter(p=>p.id!==b.dataset.del); saveAll();}));
    document.querySelectorAll('button[data-edit]').forEach(b=>b.addEventListener('click',()=>startInlineEdit(b.dataset.edit)));
  }
  function startInlineEdit(id){
    const p=state.collection.find(x=>x.id===id); if(!p) return; const row=$('row_'+id);
    row.innerHTML=`
      <div style="flex:1">
        <div class="inline-edit">
          <div class="row">
            <div><label>Name</label><input id="e_name_${id}" type="text" value="${esc(p.name)}"></div>
            <div><label>Theme</label><input id="e_theme_${id}" type="text" value="${esc(p.theme||'')}"></div>
          </div>
          <div class="row">
            <div><label>Color 1</label><select id="e_c1_${id}">${colorOptions(p.colors[0])}</select></div>
            <div><label>Color 2 (opt)</label><select id="e_c2_${id}">${colorOptions(p.colors[1]||'')}</select></div>
            <div><label>Color 3 (opt)</label><select id="e_c3_${id}">${colorOptions(p.colors[2]||'')}</select></div>
          </div>
          <div class="row">
            <div><label>Set / Box</label><input id="e_set_${id}" type="text" value="${esc(p.set||'')}"></div>
          </div>
        </div>
      </div>
      <div class="pill" style="align-self:flex-start">
        <button class="btn btn-cyan" data-save="${id}">Save</button>
        <button class="btn btn-gray" data-cancel="${id}">Cancel</button>
      </div>`;
    row.querySelector(`[data-save="${id}"]`).addEventListener('click',()=>saveInlineEdit(id));
    row.querySelector(`[data-cancel="${id}"]`).addEventListener('click',()=>renderCollection());
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
    const dup=state.collection.some(p=>p.id!==id&&p.name.toLowerCase()===name.toLowerCase()&&JSON.stringify(p.colors)===JSON.stringify(colors)&&String(p.set||'').toLowerCase()===set.toLowerCase());
    if(dup) return alert('That pack (name + colors + set) already exists.');
    const idx=state.collection.findIndex(p=>p.id===id);
    if(idx>=0){state.collection[idx]={...state.collection[idx],name,theme:theme||null,colors,set:set||null}; saveAll();}
  }

  function renderCollection(){
    $('collectionCount').textContent=`${state.collection.length} packs`;
    const all=sortedFiltered(), total=all.length, ps=state.settings.pageSize, p=state.settings.page, start=(p-1)*ps, slice=all.slice(start,start+ps);
    const list=$('packList');
    list.innerHTML = total? slice.map(packRowHtml).join('') : `<div class="hint">No eligible packs. Adjust filters or add packs.</div>`;
    if(total) bindPackRowButtons();
    renderPaginationControls(total);
    const eligible=$('eligibleCount'); if(eligible) eligible.textContent=`Eligible after filter: ${eligibleAfterFilter()}`;
  }

  /* Guardrails display */
  function renderGuardrails(){
    const pool=state.collection.filter(matchFilters);
    const mono=pool.filter(isMono).length, bi=pool.filter(isBi).length, tri=pool.filter(isTri).length;
    const triPct=state.settings.triSharePct, cap=state.settings.capOneTri, triExists=tri>0;
    const triChance=(triPct===0||!triExists)?0:(cap?triPct:Math.min(100,Math.round((triPct/100)*state.settings.optionsPerRoll*25)));
    $('guardPool').textContent=`Pool now: Mono ${mono} • Two ${bi} • Tri ${tri}`;
    $('guardMono').textContent=`If first is Mono: expect mostly 1–2 monos + 1–3 two-color; tri ~${triChance}% if allowed.`;
    $('guardBi').textContent=`If first is Two: ≥2 monos (one of each color), often exact two-color; tri ~${triChance}% if overlaps both.`;
    $('guardTri').textContent=`If first is Tri: ≥2 monos from those colors; tri ~${triChance}% if subset only.`;
    const total=mono+bi+tri||1;
    $('guardBar').innerHTML=`<div style="width:${(mono/total)*100}%; background:#0f2a16"></div><div style="width:${(bi/total)*100}%; background:#102437"></div><div style="width:${(tri/total)*100}%; background:#2a102a"></div>`;
  }

  /* RNG Fairness */
  function incOfferCounts(packs){ if(!state.settings.fairMode) return; for(const p of packs){ if(!state.fair[p.id]) state.fair[p.id]={offer:0}; state.fair[p.id].offer++; } saveAll(); }
  const fairWeight=p=>1/(1+(state.fair[p.id]?.offer||0));

  /* Pools To Pool */
  function poolRemaining(){const used=state.session.usedIds; return state.collection.filter(p=>!used.has(p.id)&&matchFilters(p));}
  const triAllowed=()=>state.settings.triSharePct>0;

  /* Weighted drawing utility with constraints to help */
  function drawWithWeights({pool,wantTotal,wantTriPct,capOneTri,constraints,allowTri}){
    const result=[]; const take=(sub,count)=>{const cand=sub.filter(x=>!result.some(r=>r.id===x.id)); if(!cand.length||count<=0) return []; return state.settings.fairMode?weightedSample(cand,count,fairWeight):pickRandom(cand,count);};
    if(constraints?.require){ for(const req of constraints.require){ result.push(...take(req.pool,req.count)); } }
    const remaining=Math.max(0,wantTotal-result.length);
    let triSlots=0; if(allowTri&&remaining>0){ if(capOneTri){ triSlots=(Math.random()<(wantTriPct/100))?1:0; triSlots=Math.min(triSlots,remaining);} else { const ideal=Math.round((wantTriPct/100)*wantTotal); triSlots=Math.min(ideal,remaining);} }
    const triPool=allowTri?pool.filter(isTri):[], biPool=pool.filter(isBi), monoPool=pool.filter(isMono);
    result.push(...take(triPool,triSlots));
    let left=Math.max(0,wantTotal-result.length);
    result.push(...take(biPool,left)); left=Math.max(0,wantTotal-result.length);
    result.push(...take(monoPool,left)); left=Math.max(0,wantTotal-result.length);
    if(left){ let any=pool.filter(x=>!result.some(r=>r.id===x.id)); if(!allowTri) any=any.filter(p=>!isTri(p)); result.push(...take(any,left)); }
    return result.slice(0,wantTotal);
  }

  /* Option card */
  function renderOptionCard(p){
    return `<div><strong>${esc(p.name)}</strong>
      <div class="meta">
        ${p.theme?`<span class="theme">${esc(p.theme)}</span>`:''}
        ${chips(p.colors)} ${typeChip(p)}
        ${p.set?`<span class="tag">${esc(p.set)}</span>`:'<span class="tag">Unlabeled</span>'}
        ${state.settings.fairMode?`<span class="offer">offered: ${offeredOf(p)}</span>`:''}
      </div></div>`;
  }
  function renderOptions(containerId,packs,onPick){
    const el=$(containerId);
    el.innerHTML = packs.map(p=>`<div class="option">${renderOptionCard(p)}<div class="pill"><button class="btn btn-pink" data-pick="${p.id}">Choose</button></div></div>`).join('');
    packs.forEach(p=>{ const b=el.querySelector(`button[data-pick="${p.id}"]`); on(b,'click',()=>onPick(p)); });
  }

  /* CSV helpers */
  function toCSV(rows){const header=['name','theme','colors','set'].join(',');
    const body=rows.map(r=>[r.name||'',r.theme||'',(r.colors||[]).join(';'),r.set||''].map(v=>{const s=String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}).join(',')).join('\n');
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
      const set=(cols[3]||'').trim()||null;
      out.push({id:uid(), name, theme, colors:colors.filter(c=>['W','U','B','R','G'].includes(c)).slice(0,3), set});
    }
    return out.filter(p=>p.colors.length>=1);
  }

  /* Log & Session */
  function log(msg){ const li=document.createElement('li'); li.innerHTML=`<span class="tiny">${esc(msg)}</span>`; $('log').prepend(li); }
  function resetSession(){
    state.session={firstOptions:[],chosenFirst:null,secondOptions:[],chosenSecond:null,usedIds:new Set()};
    ['firstOptions','secondOptions','chosenFirst','finalPair'].forEach(id=>{const el=$(id); if(el) el.innerHTML='';});
    $('chosenFirstWrap').style.display='none'; $('finalPairWrap').style.display='none'; $('overlapWrap').style.display='none';
    $('statusLine').textContent='No session yet.'; $('log').innerHTML=''; renderGuardrails();
  }
  function updateView(){ const v=state.settings.view; $('collectionCard').classList.toggle('hidden',v!=='collection'); $('playCard').classList.toggle('hidden',v!=='play'); $('btnViewCollection').classList.toggle('active',v==='collection'); $('btnViewPlay').classList.toggle('active',v==='play'); }
  function renderEverything(){ renderCollection(); renderSetFilter(); renderColorFilter(); renderGuardrails(); refreshStorageHealth(); }

  /* DOM Ready */
  document.addEventListener('DOMContentLoaded',()=>{
    state.collection=loadCollection(); state.fair=loadFair();

    // View switch
    on($('btnViewCollection'),'click',()=>{state.settings.view='collection'; updateView();});
    on($('btnViewPlay'),'click',()=>{state.settings.view='play'; updateView();});

    // Add/manage packs
    on($('addPackBtn'),'click',()=>{
      const name=$('packName').value.trim(), theme=$('packTheme').value.trim(), c1=$('color1').value, c2=$('color2').value, c3=$('color3').value, set=$('packSet').value.trim();
      if(!name) return alert('Please enter a pack name.'); if(!c1) return alert('Please choose at least Color 1.');
      const colors=Array.from(new Set([c1,c2,c3].filter(Boolean))); if(colors.length<1||colors.length>3) return alert('Packs must have 1 to 3 colors.');
      const dup=state.collection.some(p=>p.name.toLowerCase()===name.toLowerCase()&&JSON.stringify(p.colors)===JSON.stringify(colors)&&String(p.set||'').toLowerCase()===set.toLowerCase());
      if(dup) return alert('That pack (name + colors + set) already exists.');
      state.collection.push({id:uid(),name,theme:theme||null,colors,set:set||null}); saveAll(); state.settings.page=1;
      ['packName','packTheme','packSet'].forEach(id=>$(id).value=''); ['color1','color2','color3'].forEach(id=>$(id).value='');
    });
    on($('clearFormBtn'),'click',()=>{['packName','packTheme','packSet'].forEach(id=>$(id).value=''); ['color1','color2','color3'].forEach(id=>$(id).value='');});

    // Reset Offered Counters
    on($('resetOfferedBtn'),'click',()=>{
      if(!confirm('Reset all offered counters to 0? (Your packs stay intact)')) return;
      state.fair = {};
      saveAll();
      const s=$('statusLine'); if(s) s.textContent='Offered counters reset.';
    });

    // Wipe collection (and fair stats)
    on($('wipeBtn'),'click',()=>{ if(confirm('Wipe entire collection and fair stats?')){ state.collection=[]; state.fair={}; saveAll(); resetSession(); }});

    // Export/Import/Backup
    on($('exportBtn'),'click',()=>{ const data=JSON.stringify(state.collection,null,2); const blob=new Blob([data],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='jumpstart_collection.json'; a.click(); URL.revokeObjectURL(url); });
    on($('backupBtn'),'click',()=>{ const data=JSON.stringify({collection:state.collection,fair:state.fair},null,2); const blob=new Blob([data],{type:'application/json'}); const ts=new Date().toISOString().replace(/[:.]/g,'-'); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`jumpstart_backup_${ts}.json`; a.click(); URL.revokeObjectURL(url); });
    on($('importJsonBtn'),'click',()=>$('importFileJson').click());
    on($('importFileJson'),'change',async e=>{const f=e.target.files?.[0]; if(!f) return; try{const data=JSON.parse(await f.text()); if(Array.isArray(data)) state.collection=data; else { state.collection=Array.isArray(data.collection)?data.collection:state.collection; state.fair=(data.fair&&typeof data.fair==='object')?data.fair:state.fair; } saveAll(); resetSession(); e.target.value=''; state.settings.page=1; alert('Restore complete.'); }catch(err){ alert('Import failed: '+err.message);} });
    on($('exportCsvBtn'),'click',()=>{ const csv=toCSV(state.collection); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='jumpstart_collection.csv'; a.click(); URL.revokeObjectURL(url); });
    on($('importCsvBtn'),'click',()=>$('importFileCsv').click());
    on($('importFileCsv'),'change',async e=>{const f=e.target.files?.[0]; if(!f) return; try{const text=await f.text(); const rows=parseCSV(text); if(!rows.length) return alert('No valid rows found.'); state.collection=rows; saveAll(); resetSession(); e.target.value=''; state.settings.page=1; alert(`Imported ${rows.length} packs from CSV.`);}catch(err){ alert('CSV import failed: '+err.message);} });

    // Second-roll / RNG settings
    on($('excludeUnpicked'),'change',e=>state.settings.excludeUnpicked=e.target.checked);
    on($('relaxIfStuck'),'change',e=>state.settings.relaxIfStuck=e.target.checked);
    on($('overlapColor'),'change',e=>state.settings.overlapColor=e.target.value);
    on($('optionsPerRoll'),'change',e=>{let v=parseInt(e.target.value||'4',10); v=Math.max(3,Math.min(6,v)); e.target.value=v; state.settings.optionsPerRoll=v; renderGuardrails();});
    on($('triSharePct'),'input',e=>{$('triSharePctLabel').textContent=e.target.value+'%'; state.settings.triSharePct=parseInt(e.target.value,10); renderGuardrails();});
    on($('capOneTri'),'change',e=>{state.settings.capOneTri=e.target.checked; renderGuardrails();});
    on($('fairMode'),'change',e=>{state.settings.fairMode=e.target.checked; renderCollection();});

    // Player mode
    on($('players'),'change',e=>{let v=parseInt(e.target.value||'2',10); v=Math.max(2,Math.min(6,v)); e.target.value=v; state.settings.players=v;});
    on($('avoidCollisions'),'change',e=>state.settings.avoidCollisions=e.target.checked);

    // Pagination & sort
    on($('pageSize'),'change',e=>{const v=Math.max(5,Math.min(200,parseInt(e.target.value||'20',10))); e.target.value=v; state.settings.pageSize=v; state.settings.page=1; renderCollection();});
    on($('prevPage'),'click',()=>{state.settings.page=Math.max(1,state.settings.page-1); renderCollection();});
    on($('nextPage'),'click',()=>{state.settings.page=state.settings.page+1; renderCollection();});
    on($('jumpPage'),'change',e=>{const v=Math.max(1,parseInt(e.target.value||'1',10)); state.settings.page=v; renderCollection();});
    on($('sortBy'),'change',e=>{state.settings.sortBy=e.target.value; renderCollection();});
    on($('sortDir'),'click',()=>{state.settings.sortDir=(state.settings.sortDir==='asc'?'desc':'asc'); $('sortDir').textContent=state.settings.sortDir==='asc'?'Asc':'Desc'; renderCollection();});

    // First roll
    on($('rollFirstBtn'),'click',()=>{
      const base=state.collection.filter(matchFilters); const N=state.settings.optionsPerRoll;
      if(base.length<N) return alert(`Need at least ${N} eligible packs (after filters) to roll.`);
      resetSession();
      const sample=state.settings.fairMode?weightedSample(base,N,fairWeight):pickRandom(base,N);
      state.session.firstOptions=sample; incOfferCounts(sample);
      renderOptions('firstOptions',sample,(p)=>{
        state.session.chosenFirst=p; state.session.usedIds.add(p.id);
        $('chosenFirstWrap').style.display=''; $('chosenFirst').innerHTML=`<div class="option">${renderOptionCard(p)}</div>`;
        $('statusLine').textContent='First choice locked. Now roll the second set.'; log(`Picked first: "${p.name}" [${p.colors.join('')}]`);
        const oSel=$('overlapColor'), oWrap=$('overlapWrap');
        if(p.colors.length===2){ oSel.innerHTML=`<option value="AUTO">Auto (either color)</option>`+p.colors.map(c=>`<option value="${c}">Force overlap: ${c}</option>`).join(''); oSel.value='AUTO'; state.settings.overlapColor='AUTO'; oWrap.style.display=''; }
        else { oWrap.style.display='none'; state.settings.overlapColor='AUTO'; }
        renderGuardrails();
      });
      $('statusLine').textContent=`First options rolled (${N}). Pick one.`; log(`Rolled first ${N} options.`);
    });

    // Second roll (and re-roll) — SILENT when not ready
    function doSecondRoll(){
      const first=state.session.chosenFirst;
      if(!first) return; // silent no-op (prevents alerts on stray 'r')
      const N=state.settings.optionsPerRoll; let remaining=poolRemaining();
      if(state.settings.excludeUnpicked && state.session.firstOptions.length){ const ids=new Set(state.session.firstOptions.filter(p=>p.id!==first.id).map(p=>p.id)); remaining=remaining.filter(p=>!ids.has(p.id)); log('Excluded the unpicked from first roll.'); }
      const fc=first.colors;
      if(fc.length===1){
        const C=fc[0], monoPool=remaining.filter(isMono), biOverlap=remaining.filter(p=>isBi(p)&&p.colors.includes(C));
        const picks=drawWithWeights({pool:remaining.slice(),wantTotal:N,wantTriPct:state.settings.triSharePct,capOneTri:state.settings.capOneTri,constraints:{require:[{pool:monoPool,count:1},{pool:biOverlap,count:1}]},allowTri:triAllowed()});
        finalizeSecondRoll(picks); return;
      } else if(fc.length===2){
        const [C1,C2]=fc; let monoPool=remaining.filter(isMono), biPool=remaining.filter(isBi);
        let monoC1=monoPool.filter(p=>p.colors[0]===C1), monoC2=monoPool.filter(p=>p.colors[0]===C2), twoExact=biPool.filter(p=>p.colors.includes(C1)&&p.colors.includes(C2));
        if(state.settings.overlapColor!=='AUTO') twoExact=twoExact.filter(p=>p.colors.includes(state.settings.overlapColor));
        let note=''; if(state.settings.relaxIfStuck){ if(monoC1.length<1){ monoC1=monoPool.slice(); note+=` (relaxed: missing ${C1} mono)`;} if(monoC2.length<1){ monoC2=monoPool.slice(); note+=` (relaxed: missing ${C2} mono)`;} }
        const constraints={require:[{pool:monoC1,count:1},{pool:monoC2.filter(p=>!monoC1.includes(p)),count:1}]};
        if(twoExact.length) constraints.require.push({pool:twoExact,count:1});
        const overlapPreferred=remaining.filter(p=>{ if(isBi(p)) return p.colors.includes(C1)||p.colors.includes(C2); if(isTri(p)) return p.colors.includes(C1)&&p.colors.includes(C2); return true; });
        const picks=drawWithWeights({pool:overlapPreferred,wantTotal:N,wantTriPct:state.settings.triSharePct,capOneTri:state.settings.capOneTri,constraints,allowTri:triAllowed()});
        finalizeSecondRoll(picks,note); return;
      } else {
        const setFirst=new Set(fc), monoPool=remaining.filter(p=>isMono(p)&&setFirst.has(p.colors[0]));
        const monoBy={}; for(const c of fc){ monoBy[c]=monoPool.filter(p=>p.colors[0]===c); }
        const have=Object.entries(monoBy).filter(([,arr])=>arr.length).map(([c])=>c);
        let req=[]; if(have.length>=2){ const a=have[0], b=have[1]; req.push({pool:monoBy[a],count:1}); req.push({pool:monoBy[b].filter(p=>!monoBy[a].includes(p)),count:1}); } else { req.push({pool:monoPool,count:2}); }
        const picks=drawWithWeights({pool:remaining.filter(p=>isMono(p)||isBi(p)||isTri(p)),wantTotal:N,wantTriPct:state.settings.triSharePct,capOneTri:state.settings.capOneTri,constraints:{require:req},allowTri:triAllowed()});
        finalizeSecondRoll(picks); return;
      }
    }
    on($('rollSecondBtn'),'click',()=>{ if(!state.session.chosenFirst) return; doSecondRoll(); });
    on($('rerollSecondBtn'),'click',()=>{ if(!state.session.chosenFirst) return; state.session.secondOptions.forEach(p=>state.session.usedIds.delete(p.id)); state.session.secondOptions=[]; doSecondRoll(); log('Re-rolled second options.'); });

    function finalizeSecondRoll(picks,note=''){
      const uniq=[]; for(const p of picks){ if(p && !uniq.some(x=>x.id===p.id)) uniq.push(p); }
      const N=state.settings.optionsPerRoll;
      if(uniq.length<N){
        let fill=poolRemaining().filter(p=>!uniq.some(x=>x.id===p.id)); if(!triAllowed()) fill=fill.filter(p=>!isTri(p));
        if(!fill.length && state.settings.relaxIfStuck){ fill=poolRemaining().filter(p=>!uniq.some(x=>x.id===p.id)); note=(note?note+' ':'')+'(relaxed: allowed tri to fill)'; }
        uniq.push(...(state.settings.fairMode?weightedSample(fill, N-uniq.length,fairWeight):pickRandom(fill,N-uniq.length)));
      }
      const final=shuffle(uniq).slice(0,N); state.session.secondOptions=final; final.forEach(p=>state.session.usedIds.add(p.id)); incOfferCounts(final);
      $('secondOptions').innerHTML=final.map(p=>`<div class="option">${renderOptionCard(p)}<div class="pill"><button class="btn btn-pink" data-pick="${p.id}">Choose</button></div></div>`).join('');
      final.forEach(p=>{const b=$('secondOptions').querySelector(`button[data-pick="${p.id}"]`); b?.addEventListener('click',()=>{state.session.chosenSecond=p; $('finalPairWrap').style.display=''; const a=state.session.chosenFirst; $('finalPair').innerHTML=`<div class="option">${renderOptionCard(a)}</div><div class="option">${renderOptionCard(p)}</div>`; $('statusLine').textContent='Final pair ready!'; log(`Picked second: "${p.name}" [${p.colors.join('')}]`);});});
      $('statusLine').textContent=`Second options rolled (${N}). Pick one. ${note}`; log(`Rolled second ${N} options${note?' '+note:''}.`);
    }

    // Player mode
    on($('dealBtn'),'click',()=>{
      const P=state.settings.players, out=[], tmpUsed=new Set(), avoid=state.settings.avoidCollisions;
      if(state.collection.filter(matchFilters).length < P*2) return alert('Not enough eligible packs to deal pairs for all players.');
      for(let i=1;i<=P;i++){
        let pool1=state.collection.filter(p=>(!avoid||!tmpUsed.has(p.id))&&matchFilters(p));
        if(!pool1.length){ alert('Ran out of packs.'); break; }
        const first=(state.settings.fairMode?weightedSample(pool1,1,fairWeight):pickRandom(pool1,1))[0];
        if(avoid) tmpUsed.add(first.id);
        let remaining=state.collection.filter(p=>(!avoid||!tmpUsed.has(p.id))&&p.id!==first.id&&matchFilters(p));
        const saver={...state.session}; state.session.chosenFirst=first; state.session.usedIds=new Set(avoid?tmpUsed:[]);
        const N=state.settings.optionsPerRoll;
        const genSecond=(()=>{
          const fc=first.colors;
          if(fc.length===1){ const C=fc[0], mono=remaining.filter(isMono), bi=remaining.filter(p=>isBi(p)&&p.colors.includes(C)); return drawWithWeights({pool:remaining.slice(),wantTotal:N,wantTriPct:state.settings.triSharePct,capOneTri:state.settings.capOneTri,constraints:{require:[{pool:mono,count:1},{pool:bi,count:1}]},allowTri:triAllowed()}); }
          if(fc.length===2){ const [C1,C2]=fc; let mono=remaining.filter(isMono), bi=remaining.filter(isBi); let m1=mono.filter(p=>p.colors[0]===C1), m2=mono.filter(p=>p.colors[0]===C2), two=bi.filter(p=>p.colors.includes(C1)&&p.colors.includes(C2)); if(state.settings.overlapColor!=='AUTO') two=two.filter(p=>p.colors.includes(state.settings.overlapColor)); if(state.settings.relaxIfStuck){ if(m1.length<1)m1=mono.slice(); if(m2.length<1)m2=mono.slice(); } const req=[{pool:m1,count:1},{pool:m2.filter(p=>!m1.includes(p)),count:1}]; if(two.length) req.push({pool:two,count:1}); const pref=remaining.filter(p=>isBi(p)?(p.colors.includes(C1)||p.colors.includes(C2)):isTri(p)?(p.colors.includes(C1)&&p.colors.includes(C2)):true); return drawWithWeights({pool:pref,wantTotal:N,wantTriPct:state.settings.triSharePct,capOneTri:state.settings.capOneTri,constraints:{require:req},allowTri:triAllowed()}); }
          const setFirst=new Set(fc), mono=remaining.filter(p=>isMono(p)&&setFirst.has(p.colors[0])), by={}; for(const c of fc){ by[c]=mono.filter(p=>p.colors[0]===c); } const have=Object.entries(by).filter(([,a])=>a.length).map(([c])=>c); let req=[]; if(have.length>=2){ const a=have[0], b=have[1]; req.push({pool:by[a],count:1}); req.push({pool:by[b].filter(p=>!by[a].includes(p)),count:1}); } else req.push({pool:mono,count:2}); return drawWithWeights({pool:remaining.filter(p=>isMono(p)||isBi(p)||isTri(p)),wantTotal:N,wantTriPct:state.settings.triSharePct,capOneTri:state.settings.capOneTri,constraints:{require:req},allowTri:triAllowed()});
        })();
        const second=(state.settings.fairMode?weightedSample(genSecond,1,fairWeight):pickRandom(genSecond,1))[0];
        if(!second){ alert('Could not find a valid second pick for a player.'); break; }
        if(avoid) tmpUsed.add(second.id);
        out.push({first,second}); incOfferCounts([first, ...genSecond]); incOfferCounts([second]); state.session=saver;
      }
      const wrap=$('dealtResults'); wrap.innerHTML=out.map((pair,i)=>`<div class="option"><div><strong>Player ${i+1}</strong><div style="margin-top:6px"><div>${renderOptionCard(pair.first)}</div><div style="margin-top:6px">${renderOptionCard(pair.second)}</div></div></div></div>`).join('')||`<div class="hint">No result.</div>`;
      $('dealSummary').textContent=`Dealt ${out.length} / ${state.settings.players}${state.settings.avoidCollisions?' (no pack reuse)':''}.`;
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
      state.collection=demo; state.fair={}; saveAll(); resetSession(); state.settings.page=1; $('statusLine').textContent='Demo packs loaded.'; refreshStorageHealth(); log('Demo packs loaded (12).');
    });

    // Init
    renderEverything(); resetSession(); updateView();
  });
})();
