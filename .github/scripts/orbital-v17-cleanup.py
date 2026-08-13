from pathlib import Path
import re
import subprocess

PATH = Path('ui-v2.html')
BASE_COMMIT = '18bde1535fa3af41e1421ec6376d34616ede48fc'
OLD_VERSION = 'v1.8 focus-standard'
VERSION = 'v2.7 curation-final'

text = subprocess.check_output(['git','show',f'{BASE_COMMIT}:ui-v2.html'], text=True, encoding='utf-8')
if OLD_VERSION not in text:
    raise SystemExit('approved baseline marker missing')
text = text.replace(OLD_VERSION, VERSION)

integration = r'''

<!-- Orbital8 v2.7 curation-final: one-shot integration from 18bde15 -->
<style id="orbital8-v27-curation-final-style">
/* Canonical Focus chrome is reused; only curation targets/navigation are added. */
#photo-table-stacks { display:none !important; }
.curation-tag-layer { position:fixed; inset:0; z-index:12910; pointer-events:none; }
.curation-tag-target {
  position:fixed; transform:translate(-50%,-50%); min-width:86px; min-height:48px;
  padding:9px 14px; border:2px solid rgba(255,255,255,.78); border-radius:999px;
  background:rgba(15,23,42,.86); color:#fff; box-shadow:0 10px 28px rgba(0,0,0,.36);
  font:800 12px/1 system-ui,sans-serif; letter-spacing:.04em; pointer-events:auto; touch-action:none;
  display:flex; align-items:center; justify-content:center; gap:7px; user-select:none; -webkit-user-select:none;
}
.curation-tag-target strong { min-width:24px; height:24px; padding:0 6px; border-radius:999px; display:grid; place-items:center; background:rgba(255,255,255,.16); font-size:12px; }
.curation-tag-target.drop-target,.curation-tag-target.target-moving { border-color:#f59e0b; box-shadow:0 0 0 5px rgba(245,158,11,.25),0 0 30px rgba(245,158,11,.42); }
.curation-tag-target input { width:112px; border:0; outline:0; border-radius:8px; padding:6px 8px; font:700 12px/1 system-ui,sans-serif; }
#spatial-gallery > .curation-tag-layer { display:none; }
body.orbital-explore-inspecting:not(.orbital-curation-large) #spatial-gallery > .curation-tag-layer { display:block; }
#photo-table > .curation-tag-layer { display:none; }
body.orbital-table-standard:not(.orbital-table-large) #photo-table > .curation-tag-layer { display:block; }
.curation-inspection-close,.curation-nav {
  position:fixed; z-index:12980; border:1px solid rgba(255,255,255,.26); background:rgba(15,23,42,.82); color:#fff;
  width:44px; height:44px; border-radius:999px; display:grid; place-items:center; cursor:pointer; backdrop-filter:blur(10px);
}
.curation-inspection-close { top:max(76px,calc(env(safe-area-inset-top) + 64px)); left:50%; transform:translateX(-50%); font-size:26px; }
.curation-nav { top:50%; transform:translateY(-50%); font-size:30px; }
.curation-nav.prev { left:max(12px,env(safe-area-inset-left)); }
.curation-nav.next { right:max(12px,env(safe-area-inset-right)); }
#photo-table .curation-table-medium-close { display:none; }
#photo-table.examining .curation-table-medium-close { display:grid; }
#photo-table-viewer .curation-nav { display:grid; }
#photo-table-viewer[hidden] .curation-nav { display:none; }
body.orbital-table-large #photo-table .curation-table-medium-close { display:none !important; }
body.orbital-table-large #photo-table > .curation-tag-layer { display:none !important; }
@media (min-width:900px) {
  .app-container:not(.focus-mode) .pill-counter { padding:7px 18px; font-size:15px; border-radius:17px; }
  .app-container:not(.focus-mode) .pill-counter.bottom-center { bottom:44px; }
}
</style>
<script id="orbital8-v27-curation-final-script">
(() => {
'use strict';
const VERSION='v2.7 curation-final';
const TAG_STORE='orbital8:folder-curation-targets:v2';
const DEFAULT_TARGETS=[
  {name:'#YES',x:.22,y:.78},
  {name:'#MAYBE',x:.50,y:.84},
  {name:'#NO',x:.78,y:.78}
];

const CurationTargets={
  data:{},
  key(){return `${state.providerType||'provider'}:${state.currentFolder?.id||'folder'}`;},
  loadAll(){try{this.data=JSON.parse(localStorage.getItem(TAG_STORE)||'{}')||{};}catch(_){this.data={};}},
  current(){
    this.loadAll(); const key=this.key();
    if(!Array.isArray(this.data[key])||this.data[key].length!==3)this.data[key]=DEFAULT_TARGETS.map(v=>({...v}));
    return this.data[key].map((v,i)=>({name:TagService.normalizeTagValue(v?.name||DEFAULT_TARGETS[i].name),x:Number.isFinite(+v?.x)?+v.x:DEFAULT_TARGETS[i].x,y:Number.isFinite(+v?.y)?+v.y:DEFAULT_TARGETS[i].y}));
  },
  save(items){this.loadAll();this.data[this.key()]=items.map(v=>({name:TagService.normalizeTagValue(v.name),x:Math.max(.08,Math.min(.92,+v.x||.5)),y:Math.max(.12,Math.min(.90,+v.y||.75))}));try{localStorage.setItem(TAG_STORE,JSON.stringify(this.data));}catch(_){} this.refreshAll();App.persistViewContext?.();},
  display(tag){return String(tag||'').replace(/^#/,'')||'TAG';},
  count(tag){const needle=TagService.normalizeTagValue(tag).toLowerCase();return (state.stacks[state.currentStack]||[]).filter(f=>TagService.normalizeTagList(f.tags||[]).some(t=>t.toLowerCase()===needle)).length;},
  geometry(root){return [...root.querySelectorAll('.curation-tag-target')].filter(el=>el.offsetParent!==null).map(el=>{const r=el.getBoundingClientRect();return{el,index:Number(el.dataset.tagIndex),stack:`tag:${el.dataset.tagIndex}`,x:r.left+r.width/2,y:r.top+r.height/2,radius:Math.max(r.width,r.height)/2};});},
  applyPositions(root){const values=this.current();root.querySelectorAll('.curation-tag-target').forEach(el=>{const v=values[Number(el.dataset.tagIndex)];if(!v)return;el.style.left=`${v.x*innerWidth}px`;el.style.top=`${v.y*innerHeight}px`;});},
  render(root,surface){
    if(!root)return null; let layer=root.querySelector(':scope > .curation-tag-layer');
    if(!layer){layer=document.createElement('div');layer.className='curation-tag-layer';layer.dataset.surface=surface;root.appendChild(layer);for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.className='curation-tag-target';b.dataset.tagIndex=String(i);layer.appendChild(b);this.bindTarget(b,root,surface);}}
    const values=this.current();layer.querySelectorAll('.curation-tag-target').forEach(el=>{const i=Number(el.dataset.tagIndex),v=values[i];if(!el.querySelector('input'))el.innerHTML=`<span>${this.display(v.name)}</span><strong>${this.count(v.name)}</strong>`;});
    this.applyPositions(root);return layer;
  },
  bindTarget(button,root,surface){
    let drag=null,longTimer=0,longTriggered=false;
    const clearLong=()=>{if(longTimer){clearTimeout(longTimer);longTimer=0;}};
    button.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;e.preventDefault();e.stopPropagation();const r=button.getBoundingClientRect();drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,dx:e.clientX-(r.left+r.width/2),dy:e.clientY-(r.top+r.height/2),moved:false};longTriggered=false;button.setPointerCapture?.(e.pointerId);button.classList.add('target-moving');longTimer=setTimeout(()=>{longTriggered=true;this.edit(button);},560);});
    button.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>5){drag.moved=true;clearLong();const values=this.current();const i=Number(button.dataset.tagIndex);values[i].x=(e.clientX-drag.dx)/innerWidth;values[i].y=(e.clientY-drag.dy)/innerHeight;button.style.left=`${values[i].x*innerWidth}px`;button.style.top=`${values[i].y*innerHeight}px`;}});
    const end=e=>{if(!drag||drag.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();clearLong();const moved=drag.moved;drag=null;button.classList.remove('target-moving');if(moved){const values=this.current();const i=Number(button.dataset.tagIndex);const r=button.getBoundingClientRect();values[i].x=(r.left+r.width/2)/innerWidth;values[i].y=(r.top+r.height/2)/innerHeight;this.save(values);}button._suppressClick=moved||longTriggered;setTimeout(()=>button._suppressClick=false,80);};
    button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);
    button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(button._suppressClick||button.querySelector('input'))return;CurationGrid.openForTag(Number(button.dataset.tagIndex),surface);});
  },
  edit(button){
    const i=Number(button.dataset.tagIndex),values=this.current(),input=document.createElement('input');input.value=this.display(values[i].name);button.replaceChildren(input);input.focus();input.select();
    const save=()=>{if(!input.isConnected)return;const next=TagService.normalizeTagValue(input.value)||values[i].name;values[i].name=next;this.save(values);};
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();save();}else if(e.key==='Escape'){e.preventDefault();this.refreshAll();}});input.addEventListener('blur',save,{once:true});
  },
  refreshAll(){this.render(document.getElementById('spatial-gallery'),'explore');this.render(document.getElementById('photo-table'),'table');},
  async apply(index,fileId){const values=this.current(),tag=values[index]?.name;if(!tag||!fileId)return;await TagService.addTag(tag,[fileId]);this.refreshAll();Utils.showToast(`${this.display(tag)} tagged`,'success');}
};
window.CurationTargets=CurationTargets;

function inspectionFor(surface){
  if(surface==='explore'){if(window.ExploreInspectV14?.full&&!ExploreInspectV14.full.hidden)return'large';if(window.ExploreInspectV14?.preview&&!ExploreInspectV14.preview.hidden)return'medium';return'sphere';}
  if(surface==='table'){const viewer=document.getElementById('photo-table-viewer');if(viewer&&!viewer.hidden)return'large';if(PhotoTable.examining?.())return'medium';return'table';}
  return'focus';
}
function currentSurface(){if(document.body.classList.contains('orbital-table-standard'))return'table';if(SpatialGallery.elements?.root&&!SpatialGallery.elements.root.hidden)return'explore';if(state.isFocusMode)return'focus';return'sort';}
function originContext(surface=currentSurface(),tag=null){const stack=state.stacks[state.currentStack]||[],file=stack[state.currentStackPosition]||null,idx=file?stack.findIndex(f=>f.id===file.id):-1;return{surface,folderId:state.currentFolder?.id||null,stack:state.currentStack,fileId:file?.id||null,prevId:idx>0?stack[idx-1]?.id:null,nextId:idx>=0&&idx<stack.length-1?stack[idx+1]?.id:null,tag,inspection:inspectionFor(surface)};}
function reconcileOrigin(origin){const stack=state.stacks[origin.stack]||[];const ids=[origin.fileId,origin.nextId,origin.prevId].filter(Boolean);let idx=-1;for(const id of ids){idx=stack.findIndex(f=>f.id===id);if(idx>=0)break;}if(idx<0&&stack.length)idx=0;state.currentStack=origin.stack;if(idx>=0)state.currentStackPosition=idx;return idx>=0?stack[idx]:null;}

const CurationGrid={
  origin:null,
  openForTag(index,surface=currentSurface()){const target=CurationTargets.current()[index];if(!target)return;this.open({surface,tag:target.name});},
  open({surface=currentSurface(),tag=null}={}){this.origin=originContext(surface,tag);Grid._curationOrigin=this.origin;Grid.open(state.currentStack);if(tag&&Utils.elements.omniSearch){Utils.elements.omniSearch.value=TagService.normalizeTagValue(tag);Grid.performSearch();state.grid.skipReorderOnClose=true;}App.persistViewContext?.();},
  async restore(origin){if(!origin||origin.folderId!==state.currentFolder?.id)return;const file=reconcileOrigin(origin);await Core.displayCurrentImage?.();if(origin.surface==='focus'){state.isFocusMode=true;Utils.elements.appContainer?.classList.add('focus-mode');Gestures.updateGestureOverlayMode?.();ModeNavigation.show('focus');}
    else if(origin.surface==='explore'&&file){SpatialGallery.close({restoreFocus:false});SpatialGallery.open({stackName:origin.stack,fileId:file.id});if(origin.inspection==='medium'||origin.inspection==='large'){const i=SpatialGallery.files.findIndex(f=>f.id===file.id);if(i>=0)ExploreInspectV14.openPreview(i);if(origin.inspection==='large')ExploreInspectV14.openFull();}}
    else if(origin.surface==='table'){PhotoTable.close({restoreFocus:false});PhotoTable.open({stackName:origin.stack,fileId:file?.id||null});if(file&&(origin.inspection==='medium'||origin.inspection==='large')){const p=PhotoTable.ensureCurationPhoto?.(file.id);if(p)PhotoTable.examine(p);if(origin.inspection==='large'&&p)PhotoTable.openFullSize(p);}}
    Core.updateImageCounters?.();Core.updateFavoriteButton?.();CurationTargets.refreshAll();
  }
};
window.CurationGrid=CurationGrid;

const oldGridCloseV27=Grid.close.bind(Grid);
Grid.close=async function(){const origin=Grid._curationOrigin||CurationGrid.origin;const r=await oldGridCloseV27();Grid._curationOrigin=null;CurationGrid.origin=null;if(origin)await CurationGrid.restore(origin);return r;};

Modal.setupFocusStackSwitch=function(){
  const available=STACKS.filter(s=>s!==state.currentStack&&(state.stacks[s]||[]).length>0);
  let content='<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">';
  content+=`<button id="curation-grid-current" style="width:100%;text-align:left;padding:10px 16px;border-radius:8px;border:1px solid #d1d5db;background:#f9fafb;cursor:pointer;font-weight:700">Open ${STACK_NAMES[state.currentStack]||state.currentStack} in Grid</button>`;
  content+=available.map(s=>`<button class="move-option" data-stack="${s}" style="width:100%;text-align:left;padding:8px 16px;border-radius:6px;border:none;background:transparent;cursor:pointer">${STACK_NAMES[s]} (${state.stacks[s].length})</button>`).join('');
  content+='</div>';this.show('focus-stack-switch',{title:'Stack',content,confirmText:'Cancel'});
  document.getElementById('curation-grid-current')?.addEventListener('click',()=>{const surface=currentSurface();this.hide();CurationGrid.open({surface});});
  document.querySelectorAll('.move-option').forEach(option=>option.addEventListener('click',async()=>{await UI.switchToStack(option.dataset.stack);Core.updateImageCounters();this.hide();}));
};

PhotoTable.triageFilesV15=function(){const seen=new Set();return [...(state.stacks[state.currentStack]||[])].filter(file=>file?.id&&!seen.has(file.id)&&seen.add(file.id));};
PhotoTable.ensureCurationPhoto=function(fileId){let p=this.photos?.find(x=>x.fileId===fileId);if(p)return p;const stack=state.stacks[state.currentStack]||[],idx=stack.findIndex(f=>f.id===fileId);if(idx<0)return null;const limit=Math.min(32,innerWidth<700?16:24,stack.length),start=Math.max(0,Math.min(idx-Math.floor(limit/2),Math.max(0,stack.length-limit)));this.deck=stack.filter((_,i)=>i<start||i>=start+limit).map(f=>f.id);this.build(stack.slice(start,start+limit));return this.photos.find(x=>x.fileId===fileId)||null;};
const oldTableOpenV27=PhotoTable.open.bind(PhotoTable);
PhotoTable.open=function(options={}){const stackName=options.stackName||state.currentStack;state.currentStack=stackName;const stack=state.stacks[stackName]||[];const wanted=options.fileId||stack[state.currentStackPosition]?.id||stack[0]?.id||null;const r=oldTableOpenV27({...options,stackName,fileId:wanted});document.body.classList.add('orbital-table-standard');if(wanted){const idx=stack.findIndex(f=>f.id===wanted);if(idx>=0)state.currentStackPosition=idx;this.currentFileId=wanted;this.ensureCurationPhoto(wanted);}CurationTargets.render(this.elements.root,'table');Core.updateImageCounters?.();Core.updateFavoriteButton?.();return r;};
const oldTableCloseV27=PhotoTable.close.bind(PhotoTable);
PhotoTable.close=function(options={}){document.body.classList.remove('orbital-table-large');return oldTableCloseV27(options);};
PhotoTable.refreshPiles=function(){CurationTargets.render(this.elements.root,'table');};
PhotoTable.updateCount=function(){const stack=state.stacks[state.currentStack]||[],idx=stack.findIndex(f=>f.id===this.currentFileId);if(idx>=0)state.currentStackPosition=idx;Core.updateImageCounters?.();};
PhotoTable.hitTargetV13=function(photo){const targets=CurationTargets.geometry(this.elements.root),w=photo.element.offsetWidth,h=photo.element.offsetHeight,cx=photo.x+w/2,cy=photo.y+h/2;const corners=[{x:photo.x,y:photo.y},{x:photo.x+w,y:photo.y},{x:photo.x,y:photo.y+h},{x:photo.x+w,y:photo.y+h}];for(const target of targets){const centerDistance=Math.hypot(cx-target.x,cy-target.y),cornerDistance=Math.min(...corners.map(c=>Math.hypot(c.x-target.x,c.y-target.y)));if(centerDistance<target.radius*.68||cornerDistance<target.radius*.62)return{target,mode:'capture',centerDistance,cornerDistance};if(centerDistance<target.radius+Math.min(w,h)*.28||cornerDistance<target.radius+8)return{target,mode:'rim',centerDistance,cornerDistance};}return null;};
PhotoTable.commitCapturedV13=async function(photo,targetKey){try{const index=Number(String(targetKey).split(':')[1]);await CurationTargets.apply(index,photo.fileId);this.finishShotV13?.(photo,true);photo.element.getAnimations?.().forEach(a=>a.cancel());photo.state='resting';photo.x=photo.homeX;photo.y=photo.homeY;photo.rotation=photo.homeRotation;photo.scale=1;photo.velocityX=photo.velocityY=photo.angularVelocity=0;this.paint(photo);this.currentFileId=photo.fileId;this.updateCount();}catch(error){photo.state='resting';this.paint(photo);Utils.showToast(`Table tag failed: ${error.message}`,'error',true);}};
PhotoTable.animate=function(){this.frameId=null;let active=FlingFX.draw('table');for(const p of this.photos){if(p.state==='rim'){active=true;const target=CurationTargets.geometry(this.elements.root).find(t=>t.stack===p.rimTarget);if(!target){p.state='thrown';continue;}p.rimFrames++;p.rimAngle+=p.rimSpin;const cx=target.x+Math.cos(p.rimAngle)*p.rimRadius,cy=target.y+Math.sin(p.rimAngle)*p.rimRadius;p.x=cx-p.element.offsetWidth/2;p.y=cy-p.element.offsetHeight/2;p.rotation+=p.rimSpin*32;FlingFX.trail('table',cx,cy,0,0);this.paint(p);if(p.rimFrames>34){if(p.rimDrop)this.captureV13(p,target,'rim');else{const nx=Math.cos(p.rimAngle),ny=Math.sin(p.rimAngle);p.state='thrown';p.velocityX=nx*(7+Math.random()*4);p.velocityY=ny*(7+Math.random()*4);p.angularVelocity*=-.7;p.rimTarget=null;p.rimCooldown=12;}}continue;}if(p.state!=='thrown')continue;active=true;p.x+=p.velocityX;p.y+=p.velocityY;p.rotation+=p.angularVelocity;const cx=p.x+p.element.offsetWidth/2,cy=p.y+p.element.offsetHeight/2;FlingFX.trail('table',cx,cy,p.velocityX,p.velocityY);if(p.rimCooldown)p.rimCooldown--;const hit=this.hitTargetV13(p);if(hit?.mode==='capture'){this.captureV13(p,hit.target,'swish');continue;}if(hit?.mode==='rim'&&!p.rimCooldown){this.startRimV13(p,hit);continue;}const maxX=innerWidth-p.element.offsetWidth,maxY=innerHeight-p.element.offsetHeight;if(p.x<0){p.x=0;p.velocityX=Math.abs(p.velocityX)*.72;}else if(p.x>maxX){p.x=maxX;p.velocityX=-Math.abs(p.velocityX)*.72;}if(p.y<48){p.y=48;p.velocityY=Math.abs(p.velocityY)*.72;}else if(p.y>maxY){p.y=maxY;p.velocityY=-Math.abs(p.velocityY)*.72;}p.velocityX*=.975;p.velocityY*=.975;p.angularVelocity*=.965;if(Math.hypot(p.velocityX,p.velocityY)<.42){p.state='resting';p.homeX=p.x;p.homeY=p.y;this.finishShotV13?.(p,false);}this.paint(p);}if(active)this.requestFrame();};
PhotoTable.handleTap=function(photo){if(!photo)return;this.currentFileId=photo.fileId;const stack=state.stacks[state.currentStack]||[],idx=stack.findIndex(f=>f.id===photo.fileId);if(idx>=0)state.currentStackPosition=idx;if(photo.state==='examining'){this.openFullSize(photo);return;}this.examine(photo);Core.updateImageCounters?.();Core.updateFavoriteButton?.();App.persistViewContext?.();};

function ensureTableInspectionChrome(){const root=document.getElementById('photo-table');if(!root)return;if(!root.querySelector('.curation-table-medium-close')){const x=document.createElement('button');x.type='button';x.className='curation-inspection-close curation-table-medium-close';x.textContent='×';x.setAttribute('aria-label','Back to Table');x.addEventListener('click',e=>{e.preventDefault();PhotoTable.restoreExamined?.();App.persistViewContext?.();});root.appendChild(x);}if(!root.querySelector('.curation-table-prev')){for(const [cls,label,delta] of [['prev','‹',-1],['next','›',1]]){const b=document.createElement('button');b.type='button';b.className=`curation-nav ${cls} curation-table-${cls}`;b.textContent=label;b.addEventListener('click',e=>{e.preventDefault();navigateTable(delta);});root.appendChild(b);}}const viewer=document.getElementById('photo-table-viewer');if(viewer&&!viewer.querySelector('.curation-nav')){for(const [cls,label,delta] of [['prev','‹',-1],['next','›',1]]){const b=document.createElement('button');b.type='button';b.className=`curation-nav ${cls}`;b.textContent=label;b.addEventListener('click',e=>{e.preventDefault();navigateTable(delta,true);});viewer.appendChild(b);}}}
async function navigateTable(delta,keepLarge=false){const stack=state.stacks[state.currentStack]||[];if(!stack.length)return;const current=PhotoTable.currentFileId||stack[state.currentStackPosition]?.id,idx=Math.max(0,stack.findIndex(f=>f.id===current)),next=(idx+delta+stack.length)%stack.length;state.currentStackPosition=next;PhotoTable.currentFileId=stack[next].id;const p=PhotoTable.ensureCurationPhoto(stack[next].id);if(p){PhotoTable.examine(p);if(keepLarge)PhotoTable.openFullSize(p);}Core.updateImageCounters?.();Core.updateFavoriteButton?.();App.persistViewContext?.();}
const oldTableOpenFullV27=PhotoTable.openFullSize.bind(PhotoTable);
PhotoTable.openFullSize=function(photo){const r=oldTableOpenFullV27(photo);const viewer=document.getElementById('photo-table-viewer'),file=(state.imageFiles||[]).find(f=>f.id===photo?.fileId);if(viewer&&file)OrbitalImageCache.attach(viewer.querySelector('img'),file,'display');document.body.classList.add('orbital-table-large');App.persistViewContext?.();return r;};
const oldTableCloseFullV27=PhotoTable.closeFullSize.bind(PhotoTable);
PhotoTable.closeFullSize=function(){const r=oldTableCloseFullV27();document.body.classList.remove('orbital-table-large');App.persistViewContext?.();return r;};

function syncExploreToState(){const file=ExploreInspectV14.currentFile?.();if(!file)return;const stack=state.stacks[state.currentStack]||[],idx=stack.findIndex(f=>f.id===file.id);if(idx>=0)state.currentStackPosition=idx;Core.updateImageCounters?.();Core.updateFavoriteButton?.();}
function ensureExploreChrome(){ExploreInspectV14.ensure?.();const preview=ExploreInspectV14.preview;if(preview&&!preview.querySelector('.curation-explore-close')){const x=document.createElement('button');x.type='button';x.className='curation-inspection-close curation-explore-close';x.textContent='×';x.setAttribute('aria-label','Back to Explore sphere');x.addEventListener('click',e=>{e.preventDefault();ExploreInspectV14.closePreview();App.persistViewContext?.();});preview.appendChild(x);for(const [cls,label,delta] of [['prev','‹',-1],['next','›',1]]){const b=document.createElement('button');b.type='button';b.className=`curation-nav ${cls}`;b.textContent=label;b.addEventListener('click',e=>{e.preventDefault();navigateExplore(delta);});preview.appendChild(b);}installExploreFling(preview.querySelector('.orbital-explore-inspect__stage'));}CurationTargets.render(document.getElementById('spatial-gallery'),'explore');}
async function navigateExplore(delta){const stack=state.stacks[state.currentStack]||[];if(!stack.length)return;const current=ExploreInspectV14.currentFileId||stack[state.currentStackPosition]?.id,idx=Math.max(0,stack.findIndex(f=>f.id===current)),next=(idx+delta+stack.length)%stack.length;state.currentStackPosition=next;const file=stack[next];let i=SpatialGallery.files.findIndex(f=>f.id===file.id);if(i<0){SpatialGallery.close({restoreFocus:false});SpatialGallery.open({stackName:state.currentStack,fileId:file.id});i=SpatialGallery.files.findIndex(f=>f.id===file.id);}if(i>=0)ExploreInspectV14.openPreview(i);syncExploreToState();App.persistViewContext?.();}
function installExploreFling(stage){if(!stage||stage.dataset.curationFling==='1')return;stage.dataset.curationFling='1';let g=null;stage.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;const img=e.target.closest('img');if(!img||document.body.classList.contains('orbital-curation-large'))return;g={id:e.pointerId,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,moved:false,samples:[{x:e.clientX,y:e.clientY,t:performance.now()}]};img.setPointerCapture?.(e.pointerId);},true);stage.addEventListener('pointermove',e=>{if(!g||g.id!==e.pointerId)return;const d=Math.hypot(e.clientX-g.sx,e.clientY-g.sy);if(d>10)g.moved=true;if(!g.moved)return;e.preventDefault();e.stopImmediatePropagation();const dx=e.clientX-g.x,dy=e.clientY-g.y;g.x=e.clientX;g.y=e.clientY;g.samples.push({x:g.x,y:g.y,t:performance.now()});if(g.samples.length>6)g.samples.shift();e.target.style.transform=`translate(${e.clientX-g.sx}px,${e.clientY-g.sy}px)`;FlingFX.trail('explore',e.clientX,e.clientY,dx,dy);},true);const end=async e=>{if(!g||g.id!==e.pointerId)return;const wasMoved=g.moved,gesture=g;g=null;if(!wasMoved)return;e.preventDefault();e.stopImmediatePropagation();const img=stage.querySelector('img');if(img)img.style.transform='';const sample=gesture.samples[Math.max(0,gesture.samples.length-3)]||gesture.samples[0],dt=Math.max(16,performance.now()-sample.t),vx=(e.clientX-sample.x)/dt*16,vy=(e.clientY-sample.y)/dt*16,px=e.clientX+vx*9,py=e.clientY+vy*9;let hit=null,best=Infinity;for(const t of CurationTargets.geometry(document.getElementById('spatial-gallery'))){const d=Math.hypot(px-t.x,py-t.y);if(d<best){best=d;hit=t;}}if(hit&&best<hit.radius+90){FlingFX.impact('explore',hit.x,hit.y);await CurationTargets.apply(hit.index,ExploreInspectV14.currentFileId);}App.persistViewContext?.();};stage.addEventListener('pointerup',end,true);stage.addEventListener('pointercancel',end,true);}
const oldExplorePreviewV27=ExploreInspectV14.openPreview.bind(ExploreInspectV14);
ExploreInspectV14.openPreview=function(index){const r=oldExplorePreviewV27(index);document.body.classList.remove('orbital-curation-large');ensureExploreChrome();syncExploreToState();App.persistViewContext?.();return r;};
const oldExploreFullV27=ExploreInspectV14.openFull.bind(ExploreInspectV14);
ExploreInspectV14.openFull=function(){const r=oldExploreFullV27();document.body.classList.add('orbital-curation-large');syncExploreToState();App.persistViewContext?.();return r;};
const oldExploreCloseFullV27=ExploreInspectV14.closeFull.bind(ExploreInspectV14);
ExploreInspectV14.closeFull=function(){const r=oldExploreCloseFullV27();document.body.classList.remove('orbital-curation-large');App.persistViewContext?.();return r;};
const oldExploreClosePreviewV27=ExploreInspectV14.closePreview.bind(ExploreInspectV14);
ExploreInspectV14.closePreview=function(){const r=oldExploreClosePreviewV27();document.body.classList.remove('orbital-curation-large');App.persistViewContext?.();return r;};

const oldSwitchStackV27=UI.switchToStack.bind(UI);
UI.switchToStack=async function(stackName){const table=currentSurface()==='table',level=table?inspectionFor('table'):null;const r=await oldSwitchStackV27(stackName);if(table){const stack=state.stacks[state.currentStack]||[],file=stack[state.currentStackPosition]||stack[0];PhotoTable.close({restoreFocus:false});PhotoTable.open({stackName:state.currentStack,fileId:file?.id||null});if(file&&(level==='medium'||level==='large')){const p=PhotoTable.ensureCurationPhoto(file.id);if(p)PhotoTable.examine(p);if(level==='large'&&p)PhotoTable.openFullSize(p);}}CurationTargets.refreshAll();return r;};

const oldPersistV27=App.persistViewContext.bind(App);
App.persistViewContext=function(){oldPersistV27();if(!state.currentFolder?.id||!state.providerType)return;let payload={};try{payload=JSON.parse(localStorage.getItem(VIEW_CONTEXT_STORAGE_KEY)||'{}')||{};}catch(_){}const surface=currentSurface();payload.surface=surface;payload.curationInspection=inspectionFor(surface);payload.gridOrigin=Grid._curationOrigin||CurationGrid.origin||null;payload.savedAt=new Date().toISOString();state.lastViewContext=payload;try{localStorage.setItem(VIEW_CONTEXT_STORAGE_KEY,JSON.stringify(payload));}catch(_){};};
const oldRestoreV27=App.restoreExactSurfaceV13.bind(App);
App.restoreExactSurfaceV13=async function(){const r=await oldRestoreV27();let saved=state.lastViewContext;try{saved=saved||JSON.parse(localStorage.getItem(VIEW_CONTEXT_STORAGE_KEY)||'null');}catch(_){}if(!saved||saved.folderId!==state.currentFolder?.id)return r;if(saved.gridOrigin){Grid._curationOrigin=saved.gridOrigin;CurationGrid.origin=saved.gridOrigin;}const stack=state.stacks[saved.stack]||[],file=stack.find(f=>f.id===(saved.fileId||saved.exploreState?.fileId||saved.tableState?.fileId))||stack[0];if(saved.surface==='explore'&&file&&(saved.curationInspection==='medium'||saved.curationInspection==='large')){SpatialGallery.close({restoreFocus:false});SpatialGallery.open({stackName:saved.stack,fileId:file.id});const i=SpatialGallery.files.findIndex(f=>f.id===file.id);if(i>=0)ExploreInspectV14.openPreview(i);if(saved.curationInspection==='large')ExploreInspectV14.openFull();}else if(saved.surface==='table'&&file){PhotoTable.close({restoreFocus:false});PhotoTable.open({stackName:saved.stack,fileId:file.id});if(saved.curationInspection==='medium'||saved.curationInspection==='large'){const p=PhotoTable.ensureCurationPhoto(file.id);if(p)PhotoTable.examine(p);if(saved.curationInspection==='large'&&p)PhotoTable.openFullSize(p);}}return r;};

window.addEventListener('resize',()=>CurationTargets.refreshAll());
ensureTableInspectionChrome();ensureExploreChrome();CurationTargets.refreshAll();
document.querySelectorAll('.footer-baseline').forEach(el=>{el.textContent=`Orbital8 UI · ${VERSION}`;});
state.syncLog?.log?.({event:'ui:v27-curation-final',level:'info',details:'18bde15 one-shot curation contract: shared cache, progressive inspection, folder tags, exact Grid return, current-stack Table, resume integrity, Sort desktop fit.'});
})();
</script>
'''

if '</body>' not in text:
    raise SystemExit('body close marker missing')
text=text.replace('</body>',integration+'\n</body>',1)

required=[
    VERSION,
    "const TAG_STORE='orbital8:folder-curation-targets:v2';",
    "PhotoTable.triageFilesV15=function(){const seen=new Set();return [...(state.stacks[state.currentStack]||[])]",
    "TagService.addTag(tag,[fileId])",
    "Grid._curationOrigin",
    "payload.curationInspection",
    "payload.gridOrigin",
    "OrbitalImageCache.attach",
    "FlingFX.trail('table'",
    "FlingFX.trail('explore'",
    ".app-container:not(.focus-mode) .pill-counter.bottom-center { bottom:44px; }",
    "#photo-table-stacks { display:none !important; }",
    "className='curation-tag-target'",
]
for marker in required:
    if marker not in text:
        raise SystemExit(f'missing integrated requirement marker: {marker}')
for forbidden in [
    "favorite.textContent='♥'",
    "this.resolveMovingCollisionsV14();",
    "orbital8-v16-standard-chrome-script",
    "orbital8-v161-stable-chrome-script",
]:
    if forbidden in text:
        raise SystemExit(f'forbidden legacy marker remains: {forbidden}')

scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',text,re.S)
Path('/tmp/orbital-v27.js').write_text('\n'.join(scripts),encoding='utf-8')
subprocess.run(['node','--check','/tmp/orbital-v27.js'],check=True)
PATH.write_text(text,encoding='utf-8')
print(f'Orbital8 {VERSION} rebuilt from {BASE_COMMIT}')
