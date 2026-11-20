/* =====================================================================
   v4.9.2 · HOÀN THIỆN DANH SÁCH TỐI ƯU CÒN LẠI
   ===================================================================== */
const HV_WASM_B64='AGFzbQEAAAABBgFgAX8BfwMCAQAFAwEAAQcPAgNtZW0CAAV3b3JkcwAACkMBQQEEfwJAA0AgASAATw0BIAEtAAAhBCAEQSBNBEBBACECBSACRQRAQQEhAiADQQFqIQMLCyABQQFqIQEMAAsLIAML';
/* ----- Mã kiểm tra toàn vẹn (SRI kiểu "tin lần đầu") cho thư viện nạp theo nhu cầu ----- */
async function hvIntegrity(name,url){
    const key='hv_sri_'+name;let h=null;try{h=localStorage.getItem(key);}catch(_){}
    if(h)return h;
    try{
        if(!window.crypto||!crypto.subtle)return '';
        const r=await fetch(url,{mode:'cors',cache:'force-cache'});if(!r.ok)return '';
        const d=await crypto.subtle.digest('SHA-384',await r.arrayBuffer());
        h='sha384-'+btoa(String.fromCharCode.apply(null,new Uint8Array(d)));try{localStorage.setItem(key,h);}catch(_){}return h;
    }catch(_){return '';}
}
hvEnsure=function(name){
    const L=HV_LIBS[name];if(!L)return Promise.resolve();if(window[L[0]])return Promise.resolve();if(HV_LOADING[name])return HV_LOADING[name];
    return HV_LOADING[name]=(async function(){
        const integrity=await hvIntegrity(name,L[1]);
        await new Promise(function(res,rej){
            const s=document.createElement('script');s.src=L[1];s.async=true;s.crossOrigin='anonymous';if(integrity)s.integrity=integrity;
            s.onload=function(){if(name==='mermaid'){try{window.mermaid.initialize({startOnLoad:false,theme:'neutral',securityLevel:'loose'});}catch(_){}}res();};
            s.onerror=function(){delete HV_LOADING[name];try{showToast(integrity?'Thư viện '+name+' không khớp mã kiểm tra — đã chặn để an toàn':'Không tải được thư viện '+name,'error');}catch(_){}rej(new Error('lib '+name));};
            document.head.appendChild(s);
        });
    })();
};

/* ----- WebAssembly + Web Worker + Transferable: đếm từ văn bản rất lớn ----- */
let hvWasmWorker=null,hvWasmSeq=0;const hvWasmPending={};
function hvWordCountJS(t){return t.trim()?t.trim().split(/\s+/).length:0;}
function hvWordCount(text){
    return new Promise(function(res){
        if(text.length<20000||!window.Worker||!window.WebAssembly)return res(hvWordCountJS(text));
        try{
            if(!hvWasmWorker){
                const src='let inst=null;WebAssembly.instantiate(Uint8Array.from(atob("'+HV_WASM_B64+'"),function(c){return c.charCodeAt(0);})).then(function(r){inst=r.instance;}).catch(function(){});\nonmessage=function(e){const d=e.data;if(!inst){postMessage({id:d.id,fail:true});return;}const b=new Uint8Array(d.buf);const mem=inst.exports.mem;if(b.length>mem.buffer.byteLength)mem.grow(Math.ceil((b.length-mem.buffer.byteLength)/65536));new Uint8Array(mem.buffer,0,b.length).set(b);postMessage({id:d.id,n:inst.exports.words(b.length)});};';
                hvWasmWorker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
                hvWasmWorker.onmessage=function(e){const f=hvWasmPending[e.data.id];if(!f)return;delete hvWasmPending[e.data.id];f(e.data);};
                hvWasmWorker.onerror=function(){hvWasmWorker=null;};
            }
            const buf=new TextEncoder().encode(text).buffer;const id=++hvWasmSeq;
            hvWasmPending[id]=function(d){res(d.fail?hvWordCountJS(text):d.n);};
            hvWasmWorker.postMessage({id:id,buf:buf},[buf]);
            setTimeout(function(){if(hvWasmPending[id]){delete hvWasmPending[id];res(hvWordCountJS(text));}},3000);
        }catch(_){res(hvWordCountJS(text));}
    });
}
(function(){
    const _u=updateWordCount;
    updateWordCount=function(){
        const el=document.getElementById('submitContent')||document.getElementById('submitContentNormal');
        const sv=document.getElementById('splitView');const act=document.getElementById(sv&&!sv.classList.contains('hidden')?'submitContent':'submitContentNormal')||el;
        if(act&&act.value.length>=20000){hvWordCount(act.value).then(function(n){const l=document.getElementById('wordCountLabel');if(l)l.textContent=n+' từ • '+act.value.length+' ký tự';});return;}
        return _u.apply(this,arguments);
    };
})();

/* ----- CSS Houdini Paint Worklet (chỉ chạy nơi trình duyệt hỗ trợ) ----- */
(function(){
    try{
        if(!(window.CSS&&CSS.paintWorklet&&CSS.paintWorklet.addModule))return;
        const src="registerPaint('hvDots',class{static get inputProperties(){return ['--hv-dot-color','--hv-dot-gap'];}paint(ctx,g,p){const col=(p.get('--hv-dot-color').toString()||'#fff').trim();const gap=parseInt(p.get('--hv-dot-gap').toString())||22;ctx.fillStyle=col;for(let y=gap/2,r=0;y<g.height;y+=gap,r++){for(let x=(r%2?gap:gap/2);x<g.width;x+=gap){ctx.beginPath();ctx.arc(x,y,1.4,0,6.2832);ctx.fill();}}}});";
        const u=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
        hvIdle(function(){CSS.paintWorklet.addModule(u).catch(function(){});},3000);
    }catch(_){}
})();

/* ----- Điều hướng bằng đường dẫn #/tab/... (Navigation API nếu có, hashchange nếu không) ----- */
const HV_HASH=/^#\/tab\/([\w-]+)$/;
function hvTabAllowed(id){return id==='home'||/^hub-\d+$/.test(id)||HV_HUBS.some(function(h){return h.tabs.some(function(t){return t.id===id;});});}
function hvSetHash(id){try{if(!id||id==='hub')return;const h='#/tab/'+id;if(location.hash!==h)history.replaceState(history.state,'',location.pathname+location.search+h);}catch(_){}}
function hvGoHash(hash){const m=HV_HASH.exec(hash||location.hash);if(!m||typeof currentUser==='undefined'||!currentUser)return;const id=m[1];if(id===window.__hvTab||!hvTabAllowed(id))return;try{switchTab(id);}catch(_){}}
(function(){
    const _s=switchTab;
    switchTab=function(id){const r=_s.apply(this,arguments);try{hvSetHash(id);}catch(_){}return r;};
    const _n=setupNavigationByRole;
    setupNavigationByRole=function(){const r=_n.apply(this,arguments);setTimeout(function(){hvGoHash();},60);return r;};
    if(window.navigation&&window.navigation.addEventListener){
        window.navigation.addEventListener('navigate',function(e){
            if(!e.canIntercept||!e.hashChange)return;const u=new URL(e.destination.url);if(!HV_HASH.test(u.hash))return;
            e.intercept({handler:function(){hvGoHash(u.hash);}});
        });
    }else{window.addEventListener('hashchange',function(){hvGoHash();});}
})();

/* ----- SharedWorker: biết số tab đang mở & lần đồng bộ gần nhất của tab khác ----- */
let hvShared=null;window.__hvTabs=1;window.__hvRemoteSync=0;
(function(){
    try{
        if(!window.SharedWorker)return;
        const src='const ports=new Set();function all(m){ports.forEach(function(q){q.postMessage(m);});}\nonconnect=function(e){const p=e.ports[0];ports.add(p);all({t:"n",n:ports.size});p.onmessage=function(m){const d=m.data;if(d&&d.t==="bye"){ports.delete(p);all({t:"n",n:ports.size});return;}ports.forEach(function(q){if(q!==p)q.postMessage(d);});};p.start();};';
        const w=new SharedWorker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})),{name:'hv-shared'});
        hvShared=w.port;
        hvShared.onmessage=function(e){const d=e.data||{};if(d.t==='n')window.__hvTabs=d.n;else if(d.t==='synced')window.__hvRemoteSync=d.ts;};
        window.addEventListener('pagehide',function(){try{hvShared.postMessage({t:'bye'});}catch(_){}});
        const _sy=SupabaseDB.syncFromCloud;
        SupabaseDB.syncFromCloud=function(){const p=_sy.apply(this,arguments);Promise.resolve(p).then(function(ok){if(ok)try{hvShared.postMessage({t:'synced',ts:Date.now()});}catch(_){}}).catch(function(){});return p;};
    }catch(_){}
})();

/* ----- Constructable Stylesheet cho chế độ tiết kiệm + computedStyleMap ----- */
let hvLiteSheet=null;
try{if(window.CSSStyleSheet&&'adoptedStyleSheets' in document){hvLiteSheet=new CSSStyleSheet();hvLiteSheet.replaceSync('.glass-card,.cm-card,.hv-tile,.hv-hubcard,.mat-box,.fb-card{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}');}}catch(_){hvLiteSheet=null;}
(function(){const _l=hvLiteCheck;hvLiteCheck=function(){_l.apply(this,arguments);try{if(!hvLiteSheet)return;const on=document.documentElement.classList.contains('hv-lite');const cur=Array.from(document.adoptedStyleSheets).filter(function(x){return x!==hvLiteSheet;});document.adoptedStyleSheets=on?cur.concat([hvLiteSheet]):cur;}catch(_){}};try{hvLiteCheck();}catch(_){}})();
function hvPos(el){try{if(el.computedStyleMap)return String(el.computedStyleMap().get('position'));}catch(_){}return getComputedStyle(el).position;}

/* ----- Shadow DOM khai báo (Declarative Shadow DOM) cho huy hiệu phiên bản, có polyfill ----- */
(function(){
    try{
        const el=document.getElementById('hvVerBadge');if(!el)return;
        let root=el.shadowRoot;
        if(!root){const t=el.querySelector('template');root=el.attachShadow({mode:'open'});if(t)root.appendChild(t.content.cloneNode(true));}
        const v=root.getElementById('v');if(v)v.textContent='Phiên bản '+HV_VERSION+' · Supabase · HTTPS';
    }catch(_){}
})();

/* ----- IntersectionObserver đa ngưỡng: tô sáng mục menu trang chủ theo tiến trình cuộn ----- */
(function(){
    try{
        if(!('IntersectionObserver' in window))return;
        const ids=['features','roles','workflow','vanhoc','testimonials','community','trust','faq'];const ratio={};
        const links={};document.querySelectorAll('.landing-nav a[href^="#"]').forEach(function(a){links[a.getAttribute('href').slice(1)]=a;});
        const io=new IntersectionObserver(function(es){
            es.forEach(function(en){ratio[en.target.id]=en.intersectionRatio;en.target.style.setProperty('--hv-p',en.intersectionRatio.toFixed(2));});
            let best=null,bv=0;ids.forEach(function(i){if((ratio[i]||0)>bv){bv=ratio[i];best=i;}});
            Object.keys(links).forEach(function(k){links[k].classList.toggle('hv-sec-on',k===best);});
        },{threshold:[0,.25,.5,.75,1]});
        ids.forEach(function(i){const e=document.getElementById(i);if(e)io.observe(e);});
    }catch(_){}
})();

/* ----- Kết xuất bảng lớn dần dần (IntersectionObserver + DocumentFragment) ----- */
function hvWindowTable(id,first,step){
    const tb=document.getElementById(id);if(!tb)return;const rows=Array.from(tb.children);if(rows.length<=first)return;
    const rest=rows.slice(first);rest.forEach(function(r){r.remove();});
    const sen=document.createElement('tr');sen.innerHTML='<td colspan="99" style="text-align:center;padding:12px;font-size:11px;opacity:.6">Đang tải thêm… ('+rest.length+' dòng)</td>';tb.appendChild(sen);
    let i=0;const io=new IntersectionObserver(function(es){
        if(!es[0].isIntersecting)return;const frag=document.createDocumentFragment();rest.slice(i,i+step).forEach(function(r){frag.appendChild(r);});i+=step;tb.insertBefore(frag,sen);
        if(i>=rest.length){io.disconnect();sen.remove();}
    },{rootMargin:'600px 0px'});
    io.observe(sen);tb.__hvIO=io;
}
function hvWinWrap(fn,id){const f=window[fn];if(typeof f!=='function')return;window[fn]=function(){const tb=document.getElementById(id);if(tb&&tb.__hvIO){tb.__hvIO.disconnect();tb.__hvIO=null;}if(tb&&tb.__hvV){tb.__hvV.destroy();tb.__hvV=null;}const r=f.apply(this,arguments);try{if(!hvVirtualTable(id,400))hvWindowTable(id,60,60);}catch(_){}return r;};}
hvWinWrap('renderSubmissionsTable','submissionsTableBody');hvWinWrap('renderStudentTable','studentTableBody');hvWinWrap('renderGradeHistory','historyTableBody');

/* ----- Canvas nền 2 lớp: chấm vẽ mọi khung hình, đường nối vẽ nửa tốc độ (Worker + OffscreenCanvas) ----- */
const HV_BG_WORKER2=`
let cv,cv2,ctx,ctx2,w=0,h=0,dpr=1,dark=false,P=[],target=70,MIN=24,mouse={x:-9999,y:-9999},running=true,last=0,acc=0,frames=0,fc=0,cols,lines;
function mk(){const r=Math.random()*1.8+0.5;return {x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:r,k:Math.floor(r*3)%3};}
function setCols(){cols=dark?['rgba(239,68,68,0.5)','rgba(16,185,129,0.5)','rgba(37,99,235,0.4)']:['rgba(220,38,38,0.35)','rgba(5,150,105,0.3)','rgba(37,99,235,0.25)'];const base=dark?0.15:0.1,rgb=dark?'239,68,68':'220,38,38';lines=[0.8,0.45,0.15].map(function(k){return 'rgba('+rgb+','+(base*k).toFixed(3)+')';});}
function size(){[[cv,ctx],[cv2,ctx2]].forEach(function(p){p[0].width=Math.round(w*dpr);p[0].height=Math.round(h*dpr);p[1].setTransform(dpr,0,0,dpr,0,0);});}
function loop(now){
  if(!running)return;const raw=now-last;last=now;const dt=Math.min(2.5,raw/16.667);acc+=Math.min(raw,100);frames++;fc++;
  if(frames>=45){const avg=acc/frames;if(avg>21&&P.length>MIN)P.length=Math.max(MIN,P.length-8);else if(avg<15&&P.length<target){for(let i=0;i<4&&P.length<target;i++)P.push(mk());}postMessage({t:'stat',fps:Math.round(1000/avg),n:P.length});acc=0;frames=0;}
  const n=P.length;
  for(let i=0;i<n;i++){const p=P[i];p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;const dx=mouse.x-p.x,dy=mouse.y-p.y;if(dx*dx+dy*dy<22500){p.x-=dx*0.003*dt;p.y-=dy*0.003*dt;}}
  ctx.clearRect(0,0,w,h);
  for(let k=0;k<3;k++){ctx.fillStyle=cols[k];ctx.beginPath();for(let i=0;i<n;i++){const p=P[i];if(p.k!==k)continue;ctx.moveTo(p.x+p.r,p.y);ctx.arc(p.x,p.y,p.r,0,6.2832);}ctx.fill();}
  if((fc&1)===0){
    ctx2.clearRect(0,0,w,h);ctx2.lineWidth=0.6;
    for(let b=0;b<3;b++){ctx2.strokeStyle=lines[b];ctx2.beginPath();for(let i=0;i<n;i++){const a=P[i];for(let j=i+1;j<n;j++){const q=P[j];const dx=a.x-q.x,dy=a.y-q.y;const d2=dx*dx+dy*dy;if(d2>=14400)continue;const bb=d2<2304?0:(d2<7056?1:2);if(bb!==b)continue;ctx2.moveTo(a.x,a.y);ctx2.lineTo(q.x,q.y);}}ctx2.stroke();}
  }
  requestAnimationFrame(loop);
}
onmessage=function(e){const d=e.data;
  if(d.t==='init'){try{cv=d.canvas;cv2=d.canvas2;ctx=cv.getContext('2d',{alpha:true});ctx2=cv2.getContext('2d',{alpha:true});w=d.w;h=d.h;dpr=d.dpr;dark=d.dark;target=d.target;size();for(let i=0;i<target;i++)P.push(mk());setCols();if(typeof requestAnimationFrame!=='function'){postMessage({t:'err'});return;}postMessage({t:'ready'});last=performance.now();requestAnimationFrame(loop);}catch(err){postMessage({t:'err'});}}
  else if(d.t==='size'){w=d.w;h=d.h;if(cv)size();}
  else if(d.t==='mouse'){mouse.x=d.x;mouse.y=d.y;}
  else if(d.t==='theme'){dark=d.dark;setCols();}
  else if(d.t==='vis'){running=!d.hidden;if(running){last=performance.now();acc=0;frames=0;requestAnimationFrame(loop);}}
};`;
initBgCanvas=function(){
    const canvas=document.getElementById('bgCanvas');if(!canvas)return;
    const can=!!(window.OffscreenCanvas&&canvas.transferControlToOffscreen&&window.Worker&&!window.__hvNoWorker);
    if(!can)return initBgCanvasMain(canvas);
    try{
        const fine=window.matchMedia&&matchMedia('(pointer:fine)').matches;const dpr=fine?Math.min(window.devicePixelRatio||1,1.5):1;
        const c2=document.createElement('canvas');c2.id='bgCanvasLines';c2.className=canvas.className;c2.setAttribute('aria-hidden','true');c2.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
        canvas.parentNode.insertBefore(c2,canvas.nextSibling);
        const off=canvas.transferControlToOffscreen(),off2=c2.transferControlToOffscreen();
        const url=URL.createObjectURL(new Blob([HV_BG_WORKER2],{type:'text/javascript'}));const w=new Worker(url);hvBgWorker=w;let ready=false,fell=false;
        const fallback=function(){
            if(fell)return;fell=true;try{w.terminate();}catch(_){}hvBgWorker=null;
            const nc=document.createElement('canvas');nc.id='bgCanvas';nc.className=canvas.className;nc.setAttribute('style',canvas.getAttribute('style')||'');canvas.replaceWith(nc);try{c2.remove();}catch(_){}initBgCanvasMain(nc);
        };
        w.onmessage=function(e){const d=e.data;if(d.t==='ready'){ready=true;URL.revokeObjectURL(url);}else if(d.t==='stat'){window.__hvFps=d.fps;window.__hvCanvasN=function(){return d.n;};}else if(d.t==='err'){fallback();}};
        w.onerror=fallback;
        w.postMessage({t:'init',canvas:off,canvas2:off2,w:window.innerWidth,h:window.innerHeight,dpr:dpr,dark:document.documentElement.getAttribute('data-theme')==='dark',target:hvPerfTier()===1?48:70},[off,off2]);
        setTimeout(function(){if(!ready)fallback();},2500);
        let raf=0,mx=-9999,my=-9999;
        window.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;mx=e.clientX;my=e.clientY;if(raf)return;raf=requestAnimationFrame(function(){raf=0;w.postMessage({t:'mouse',x:mx,y:my});});},{passive:true});
        let rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){w.postMessage({t:'size',w:window.innerWidth,h:window.innerHeight});},120);},{passive:true});
        document.addEventListener('visibilitychange',function(){w.postMessage({t:'vis',hidden:document.hidden});});
    }catch(e){console.warn('offscreen bg 2 layers',e);try{initBgCanvasMain(canvas);}catch(_){}}
};

/* ----- Đọc tệp văn bản lớn bằng Web Streams ----- */
async function hvReadTextStream(file){
    if(!file.stream||typeof TextDecoderStream==='undefined'||file.size<300000)return file.text();
    const reader=file.stream().pipeThrough(new TextDecoderStream()).getReader();let out='';
    for(;;){const r=await reader.read();if(r.done)break;out+=r.value;if(out.length>2000000){try{reader.cancel();}catch(_){}break;}await hvYield();}
    return out;
}

/* ----- Hồ chứa đối tượng (Object Pooling) cho hiệu ứng gợn sóng / tia sáng ----- */
const HV_POOL={};
function hvPool(cls){const a=HV_POOL[cls]||(HV_POOL[cls]=[]);const e=a.pop()||document.createElement('span');e.className=cls;e.style.cssText='';e.textContent='';return e;}
function hvPoolRel(el){try{el.remove();const a=HV_POOL[el.className]||(HV_POOL[el.className]=[]);if(a.length<40)a.push(el);}catch(_){}}

/* ----- Hệ thống phản ứng siêu nhẹ bằng Proxy (Micro-Observable) ----- */
function hvObservable(obj){
    const subs={};
    const state=new Proxy(obj,{set:function(t,k,v){if(t[k]===v)return true;const old=t[k];t[k]=v;(subs[k]||[]).forEach(function(f){try{f(v,old);}catch(e){console.warn(e);}});return true;}});
    return {state:state,watch:function(k,f){(subs[k]||(subs[k]=[])).push(f);f(state[k]);}};
}
const hvUi=hvObservable({focus:false,timer:''});
hvUi.watch('focus',function(v){document.body.classList.toggle('hv-focus',!!v);});
hvUi.watch('timer',function(v){const e=document.getElementById('hvFocusTime');if(e&&v)e.textContent=v;});

/* ----- Bộ nhớ đệm regex động + báo cáo tương thích trình duyệt ----- */
const hvReCache=new Map();
function hvRe(src,flags){const k=flags+'/'+src;let r=hvReCache.get(k);if(!r){r=new RegExp(src,flags);hvReCache.set(k,r);if(hvReCache.size>100)hvReCache.delete(hvReCache.keys().next().value);}return r;}
function hvCompat(){return {'OffscreenCanvas':!!window.OffscreenCanvas,'Worker':!!window.Worker,'SharedWorker':!!window.SharedWorker,'WebAssembly':!!window.WebAssembly,'IndexedDB':!!window.indexedDB,'CompressionStream':typeof CompressionStream!=='undefined','ViewTransitions':!!document.startViewTransition,'PaintWorklet':!!(window.CSS&&CSS.paintWorklet),'NavigationAPI':!!window.navigation,'WebLocks':!!navigator.locks,'scheduler':!!window.scheduler,'IntersectionObserver':'IntersectionObserver' in window,'CreateImageBitmap':!!window.createImageBitmap};}
function hvCompatTxt(){const m=Object.keys(hvCompat()).filter(function(k){return !hvCompat()[k];});return m.length?' · thiếu: '+m.join(','):' · đủ tính năng';}
window.__hvCompat=hvCompat();

/* ----- Hủy yêu cầu cũ khi tải lại cùng một bảng (AbortController + AbortSignal.any) ----- */
const hvPullAC={};
function hvPullSignal(t){
    try{if(hvPullAC[t])hvPullAC[t].abort();}catch(_){}
    const ac=hvPullAC[t]=new AbortController();const to=(typeof AbortSignal!=='undefined'&&AbortSignal.timeout)?AbortSignal.timeout(25000):null;
    return (to&&AbortSignal.any)?AbortSignal.any([ac.signal,to]):(to||ac.signal);
}

/* ----- Chú thích nổi: CSS Anchor Positioning khi có, tự tính vị trí bằng JS khi không ----- */
const hvAnchorOK=!!(window.CSS&&CSS.supports&&CSS.supports('position-area','left center')&&CSS.supports('anchor-name','--a'));
let hvTipTarget=null;
const hvTipEl=(function(){const e=document.createElement('div');e.id='hvTip';e.setAttribute('role','tooltip');document.body.appendChild(e);return e;})();
function hvTipHide(){if(hvTipTarget&&hvAnchorOK)hvTipTarget.style.anchorName='';hvTipTarget=null;hvTipEl.classList.remove('on');}
function hvTipShow(t){
    const text=t.getAttribute('data-tip');if(!text)return;hvTipTarget=t;hvTipEl.textContent=text;
    if(hvAnchorOK){t.style.anchorName='--hv-tip';hvTipEl.classList.add('anchored');hvTipEl.style.left='';hvTipEl.style.top='';}
    else{hvTipEl.classList.remove('anchored');const r=t.getBoundingClientRect(),w=hvTipEl.offsetWidth,h=hvTipEl.offsetHeight;let x=r.left-w-8;if(x<8)x=Math.min(window.innerWidth-w-8,r.right+8);hvTipEl.style.left=Math.max(8,x)+'px';hvTipEl.style.top=Math.max(8,Math.min(window.innerHeight-h-8,r.top+r.height/2-h/2))+'px';}
    hvTipEl.classList.add('on');
}
document.addEventListener('pointerover',function(e){const t=e.target.closest&&e.target.closest('[data-tip]');if(t){if(t!==hvTipTarget){hvTipHide();hvTipShow(t);}}else if(hvTipTarget)hvTipHide();},{passive:true});
document.addEventListener('focusin',function(e){const t=e.target.closest&&e.target.closest('[data-tip]');if(t)hvTipShow(t);});
document.addEventListener('focusout',hvTipHide);
window.addEventListener('scroll',hvTipHide,{passive:true,capture:true});
document.querySelectorAll('.fab-btn[title],#hvFocusBar .fb-ic[title]').forEach(function(e){e.setAttribute('data-tip',e.getAttribute('title'));e.removeAttribute('title');});

/* ----- Hoãn khởi động canvas nền tới lúc rảnh (không chặn lần vẽ đầu) ----- */
(function(){const _ib=initBgCanvas;initBgCanvas=function(){setTimeout(function(){hvIdle(function(){try{_ib();}catch(e){console.warn('bg canvas',e);}},1200);},350);};})();
