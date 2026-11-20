/* =====================================================================
   v4.9 · CHẾ ĐỘ TẬP TRUNG · ĐỒNG HỒ LÀM BÀI · TỐI ƯU HIỆU NĂNG NÂNG CAO
   ===================================================================== */
/* ----- Tiện ích hiệu năng ----- */
function hvIdle(fn,timeout){if('requestIdleCallback' in window)return requestIdleCallback(fn,{timeout:timeout||1500});return setTimeout(fn,60);}
function hvYield(){if(window.scheduler&&scheduler.yield)return scheduler.yield();if(window.scheduler&&scheduler.postTask)return scheduler.postTask(function(){},{priority:'user-visible'});return new Promise(function(r){setTimeout(r,0);});}
function hvMemo(fn,max){const m=new Map();return function(k){if(m.has(k)){const v=m.get(k);m.delete(k);m.set(k,v);return v;}const v=fn.apply(this,arguments);m.set(k,v);if(m.size>(max||50))m.delete(m.keys().next().value);return v;};}
const hvABT_ORIG=hvAutoBreakText;
hvFormatExamHtml=hvMemo(hvFormatExamHtml,40);
hvAutoBreakText=hvMemo(hvAutoBreakText,40);
hvParts=hvMemo(hvParts,400);
const hvTilted=new WeakSet();
const hvBlobUrls=new Set();
function hvObjUrl(blob){const u=URL.createObjectURL(blob);hvBlobUrls.add(u);setTimeout(function(){URL.revokeObjectURL(u);hvBlobUrls.delete(u);},60000);return u;}

/* ----- Thư viện nặng nạp theo nhu cầu (xlsx, mermaid, html2pdf) ----- */
const HV_LIBS={xlsx:['XLSX','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'],mermaid:['mermaid','https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'],html2pdf:['html2pdf','https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js']};
const HV_LOADING={};
function hvEnsure(name){
    const L=HV_LIBS[name];if(!L)return Promise.resolve();if(window[L[0]])return Promise.resolve();if(HV_LOADING[name])return HV_LOADING[name];
    return HV_LOADING[name]=new Promise(function(res,rej){const s=document.createElement('script');s.src=L[1];s.async=true;s.crossOrigin='anonymous';
        s.onload=function(){if(name==='mermaid'){try{window.mermaid.initialize({startOnLoad:false,theme:'neutral',securityLevel:'loose'});}catch(_){}}res();};
        s.onerror=function(){delete HV_LOADING[name];try{showToast('Không tải được thư viện '+name+' — kiểm tra mạng','error');}catch(_){}rej(new Error('lib '+name));};
        document.head.appendChild(s);});
}
function hvLazyWrap(names,lib){names.forEach(function(n){const f=window[n];if(typeof f!=='function')return;window[n]=function(){const self=this,args=arguments;return hvEnsure(lib).then(function(){return f.apply(self,args);},function(){});};});}
hvLazyWrap(['handleFileSelect', 'exportDataToCSV', 'exportAccountsExcel', 'hvWLExport'],'xlsx');
hvLazyWrap(['renderMindmap'],'mermaid');
hvLazyWrap(['exportKHBD', 'exportHocBaPDF'],'html2pdf');

/* ----- Đồng hồ giới hạn thời gian làm bài (như Azota) ----- */
const HV_T={aid:null,iv:null,warned:{},fired:null};
function hvAttemptKey(aid){const u=currentUser;return u?'hv_attempt_v1:'+(u.studentId||u.name||'u')+':'+aid:null;}
function hvAttemptGet(aid){try{return JSON.parse(localStorage.getItem(hvAttemptKey(aid))||'null');}catch(_){return null;}}
function hvAttemptSet(aid,o){try{localStorage.setItem(hvAttemptKey(aid),JSON.stringify(o));}catch(_){}}
function hvAttemptDel(aid){try{localStorage.removeItem(hvAttemptKey(aid));}catch(_){}}
function hvRemainMs(at){return at.s+at.lim*60000-hvNow();}
function hvFmtTimer(ms){ms=Math.max(0,ms);const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return (h?h+':'+String(m).padStart(2,'0'):String(m).padStart(2,'0'))+':'+String(ss).padStart(2,'0');}
function hvTimerStart(aid){if(HV_T.aid===aid&&HV_T.iv)return;HV_T.aid=aid;clearInterval(HV_T.iv);HV_T.iv=setInterval(hvTimerTick,500);hvTimerTick();}
function hvTimerStop(){clearInterval(HV_T.iv);HV_T.iv=null;HV_T.aid=null;const t=document.getElementById('hvFocusTimer');if(t)t.classList.add('hidden');}
function hvTimerTick(){
    if(!HV_T.aid)return;const at=hvAttemptGet(HV_T.aid);const box=document.getElementById('hvFocusTimer'),tx=document.getElementById('hvFocusTime');
    if(!at){hvTimerStop();return;}
    const rem=hvRemainMs(at);
    if(box&&tx){box.classList.remove('hidden');hvUi.state.timer=hvFmtTimer(rem);box.classList.toggle('warn',rem<=300000&&rem>60000);box.classList.toggle('crit',rem<=60000);}
    if(rem<=300000&&rem>299000&&!HV_T.warned[HV_T.aid+'5']){HV_T.warned[HV_T.aid+'5']=1;showToast('⏰ Còn 5 phút!','info');}
    if(rem<=60000&&rem>59000&&!HV_T.warned[HV_T.aid+'1']){HV_T.warned[HV_T.aid+'1']=1;showToast('⚠️ Còn 1 phút — hãy hoàn thành bài!','error');}
    if(rem<=0)hvTimeUp(HV_T.aid);
}
function hvStartDialog(a,onOk){
    const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;z-index:100060;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,17,23,.7);backdrop-filter:blur(8px)';
    o.innerHTML='<div class="mat-box" style="max-width:440px;text-align:center"><div style="font-size:46px">⏱</div><h3 style="font-family:Outfit,sans-serif;font-weight:900;font-size:21px;margin:6px 0">Bắt đầu làm bài?</h3><p style="font-size:13.5px;line-height:1.75;color:var(--text-sub)">Bài “<b>'+escapeHtml(a.title||'')+'</b>” giới hạn <b style="color:#dc2626">'+a.timeLimit+' phút</b>.<br>Đồng hồ bắt đầu chạy ngay khi em bấm <b>Bắt đầu</b> và <b>không dừng</b> dù em thoát ra. Hết giờ hệ thống tự nộp phần em đã viết.</p><div style="display:flex;gap:10px;justify-content:center;margin-top:18px"><button class="cm-btn" data-x="no">Để sau</button><button class="cm-go" data-x="ok">▶ Bắt đầu làm bài</button></div></div>';
    o.addEventListener('click',function(e){const x=e.target.closest&&e.target.closest('[data-x]');if(!x&&e.target!==o)return;o.remove();if(x&&x.dataset.x==='ok')onOk();});
    document.body.appendChild(o);
}
let hvStartOrig=null;
(function(){
    const _st=startSubmitFromAssignment;hvStartOrig=_st;
    startSubmitFromAssignment=function(id){
        const a=assignmentsData.find(function(x){return x.id===id;});const self=this,args=arguments;
        if(a&&a.timeLimit>0&&typeof isStudentRole==='function'&&isStudentRole()){
            const at=hvAttemptGet(id);
            if(at){if(hvRemainMs(at)<=0){hvTimeUp(id);return;}hvTimerStart(id);return _st.apply(self,args);}
            hvStartDialog(a,function(){hvAttemptSet(id,{s:hvNow(),lim:a.timeLimit});hvTimerStart(id);_st.apply(self,args);});return;
        }
        return _st.apply(this,arguments);
    };
})();
async function hvTimeUp(aid){
    if(HV_T.fired===aid)return;HV_T.fired=aid;setTimeout(function(){if(HV_T.fired===aid)HV_T.fired=null;},30000);
    const done=function(){return submissionsData.some(function(s){return s.assignmentId===aid&&s.studentName===currentUser.name;});};
    if(done()){hvAttemptDel(aid);hvTimerStop();return;}
    const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:100070;display:flex;align-items:center;justify-content:center;background:rgba(15,17,23,.82);backdrop-filter:blur(10px);color:#fff;text-align:center;padding:20px';
    ov.innerHTML='<div><div style="font-size:64px">⏰</div><h2 style="font-family:Outfit,sans-serif;font-weight:900;font-size:28px;margin:8px 0">Hết giờ làm bài!</h2><p style="opacity:.85">Đang nộp phần em đã viết…</p></div>';document.body.appendChild(ov);
    try{
        if(currentAssignmentContext!==aid)hvStartOrig(aid);
        await new Promise(function(r){setTimeout(r,500);});
        const content=hvDraftText();
        if(!content.trim()&&!(typeof pendingAttachments!=='undefined'&&pendingAttachments.length)){showToast('Hết giờ — em chưa viết nội dung nên bài chưa được nộp.','error');}
        else{window.__hvForceSubmit=true;try{await hvSubmitFromBar();}finally{window.__hvForceSubmit=false;}}
        if(done()){hvAttemptDel(aid);showToast('Đã tự nộp bài khi hết giờ ✅','success');}
        else{showToast('Chưa nộp được — bài vẫn được lưu nháp, hãy kiểm tra mạng','error');}
    }catch(e){console.warn('timeup',e);}
    ov.remove();hvTimerStop();hvFocusExit(true);
}
function hvAttemptBadge(a){
    if(!a||!(a.timeLimit>0))return '';const at=hvAttemptGet(a.id);
    return ' · ⏱ '+(at?(hvRemainMs(at)>0?'còn '+hvFmtTimer(hvRemainMs(at)):'hết giờ'):a.timeLimit+' phút');
}
function hvAttemptScan(){
    try{
        if(!currentUser||typeof isStudentRole!=='function'||!isStudentRole()||document.hidden)return;
        const pre='hv_attempt_v1:'+(currentUser.studentId||currentUser.name||'u')+':';
        for(let i=localStorage.length-1;i>=0;i--){
            const k=localStorage.key(i);if(!k||k.indexOf(pre)!==0)continue;const aid=k.slice(pre.length);let at=null;try{at=JSON.parse(localStorage.getItem(k)||'null');}catch(_){}
            if(!at){localStorage.removeItem(k);continue;}
            if(submissionsData.some(function(s){return s.assignmentId===aid&&s.studentName===currentUser.name;})){localStorage.removeItem(k);continue;}
            if(hvRemainMs(at)<=0)hvTimeUp(aid);else if(!HV_T.aid)hvTimerStart(aid);
        }
    }catch(_){}
}
setInterval(function(){hvAttemptScan();if(currentUser&&typeof isTeacherRole==='function'&&isTeacherRole()&&!window.XLSX&&!HV_LOADING.xlsx&&Date.now()-hvBoot>8000)hvEnsure('xlsx').catch(function(){});},20000);
const hvBoot=Date.now();
setTimeout(hvAttemptScan,2500);

/* ----- Chế độ tập trung: chỉ chừa mũi tên thoát + Gửi bài ----- */
let hvFocusAC=null,hvIgnorePop=false;
function hvFocusFill(a){
    const t=document.getElementById('hvFocusTitle');if(t)t.textContent=a.title||'Bài làm';
    if(a.timeLimit>0&&hvAttemptGet(a.id))hvTimerStart(a.id);else{const b=document.getElementById('hvFocusTimer');if(b)b.classList.add('hidden');}
    hvFocusUpdate();
}
function hvFocusUpdate(){
    const st=document.getElementById('hvFocusStat');if(!st)return;const t=hvDraftText();const w=t.trim()?t.trim().split(/\s+/).length:0;
    const sv=HV_DRAFT.saved?(' · 💾 '+hvParts(HV_DRAFT.saved).hour+':'+hvParts(HV_DRAFT.saved).minute):'';
    const txt=w+' từ'+sv;if(st.textContent!==txt)st.textContent=txt;
    const at=document.getElementById('hvFocusAtt');if(at)at.textContent=(typeof pendingAttachments!=='undefined'&&pendingAttachments.length)?pendingAttachments.length:'';
}
function hvFocusEnter(a){
    if(!document.body.classList.contains('hv-focus')){
        hvUi.state.focus=true;hvFocusAC=new AbortController();const sig=hvFocusAC.signal;
        try{history.pushState({hvFocus:1},'');}catch(_){}
        window.addEventListener('popstate',function(){if(hvIgnorePop){hvIgnorePop=false;return;}hvFocusExit(true,true);},{signal:sig});
        if(window.visualViewport)window.visualViewport.addEventListener('resize',function(){hvFitWork();},{signal:sig});
    }
    hvFocusFill(a);
}
function hvFocusExit(navigate,fromPop){
    if(!document.body.classList.contains('hv-focus'))return;
    hvUi.state.focus=false;
    if(hvFocusAC){hvFocusAC.abort();hvFocusAC=null;}
    if(!fromPop&&history.state&&history.state.hvFocus){hvIgnorePop=true;try{history.back();}catch(_){hvIgnorePop=false;}}
    if(navigate){try{cancelAssignmentContext();}catch(_){}try{switchTab('assignments');}catch(_){}}
}
(function(){
    const _hs=hvSetupWorkspace;
    hvSetupWorkspace=function(){
        _hs.apply(this,arguments);
        try{
            const a=(typeof isStudentRole==='function'&&isStudentRole()&&currentAssignmentContext)?assignmentsData.find(function(x){return x.id===currentAssignmentContext;}):null;
            if(a)hvFocusEnter(a);else hvFocusExit(false);
        }catch(e){console.warn('focus',e);}
    };
    const _ub=hvUpdateBar;hvUpdateBar=function(){_ub.apply(this,arguments);try{if(document.body.classList.contains('hv-focus'))hvFocusUpdate();}catch(_){}};
    const _sb=hvSubmitFromBar;
    hvSubmitFromBar=async function(){const b=document.getElementById('hvFocusSubmit');if(b)b.disabled=true;try{return await _sb.apply(this,arguments);}finally{if(b)b.disabled=false;try{if(!document.getElementById('splitView').classList.contains('hidden')&&submissionsData.some(function(s){return s.assignmentId===currentAssignmentContext&&s.studentName===currentUser.name;}))hvFocusExit(false);}catch(_){}}};
    const _fw=hvFitWork;hvFitWork=hvRafThrottle(_fw);
    try{if(window.ResizeObserver){const bar=document.getElementById('hvWorkBar');if(bar)new ResizeObserver(function(){hvFitWork();}).observe(bar);}}catch(_){}
})();

/* ----- Dọn bộ nhớ khi rời mục ----- */
let hvPrevTab=null;
function hvClr(id){const e=document.getElementById(id);if(e)e.innerHTML='';}
function hvTabLeave(next){
    const prev=hvPrevTab;hvPrevTab=next;if(prev===next)return;
    if(next!=='submit')hvFocusExit(false);
    if(prev==='worklog'){clearInterval(wlTimer);wlRows=[];wlAgg=[];hvClr('wlTable');hvClr('wlSummary');}
    else if(prev==='materials'){hvClr('matGrid');}
    else if(prev==='feedback'){hvClr('fbList');hvClr('fbModList');}
    else if(prev==='hub'){hvClr('hvTiles');}
}

/* ----- IndexedDB (nén gzip) cho dữ liệu lớn: dự phòng khi localStorage đầy / ngoại tuyến ----- */
const hvIdb={db:null,
    open(){return this.db||(this.db=new Promise(function(res,rej){const r=indexedDB.open('hv-cache',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv');};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};}));},
    async get(k){const db=await this.open();return new Promise(function(res,rej){const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=function(){res(q.result);};q.onerror=function(){rej(q.error);};});},
    async setMany(o){const db=await this.open();return new Promise(function(res,rej){const tx=db.transaction('kv','readwrite'),st=tx.objectStore('kv');Object.keys(o).forEach(function(k){st.put(o[k],k);});tx.oncomplete=function(){res();};tx.onerror=function(){rej(tx.error);};});}
};
async function hvPack(str){if(str.length<40000||typeof CompressionStream==='undefined')return {z:0,s:str};const cs=new CompressionStream('gzip');const w=cs.writable.getWriter();w.write(new TextEncoder().encode(str));w.close();return {z:1,b:await new Response(cs.readable).arrayBuffer()};}
async function hvUnpack(o){if(!o)return null;if(!o.z)return o.s;const ds=new DecompressionStream('gzip');const w=ds.writable.getWriter();w.write(new Uint8Array(o.b));w.close();return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());}
async function hvIdbSave(){
    try{const map={students:studentsData,submissions:submissionsData,assignments:assignmentsData,classes:classesData,khbd:khbdList,gradeHistory:gradeHistoryData,materials:materialsData};const out={};
        for(const k of Object.keys(map)){out[k]=await hvPack(JSON.stringify(map[k]));await hvYield();}
        await hvIdb.setMany(out);}catch(_){}
}
async function hvIdbHydrate(){
    try{const set={students:function(v){studentsData=v;},submissions:function(v){submissionsData=v;},assignments:function(v){assignmentsData=v;},classes:function(v){classesData=v;},khbd:function(v){khbdList=v;},gradeHistory:function(v){gradeHistoryData=v;},materials:function(v){materialsData=v;}};
        const cur={students:studentsData,submissions:submissionsData,assignments:assignmentsData,classes:classesData,khbd:khbdList,gradeHistory:gradeHistoryData,materials:materialsData};
        for(const k of Object.keys(set)){if(cur[k]&&cur[k].length)continue;const s=await hvUnpack(await hvIdb.get(k));if(!s)continue;const v=JSON.parse(s);if(Array.isArray(v)&&v.length)set[k](v);}
        try{hvFixAssignmentDeadlines();}catch(_){}
    }catch(_){}
}
(function(){const _sld=saveLocalData;const soon=hvDebounce(function(){hvIdle(hvIdbSave,5000);},3000);saveLocalData=function(){_sld.apply(this,arguments);soon();};})();

/* ----- Dọn dữ liệu cũ + theo dõi dung lượng (StorageManager) ----- */
function hvStoragePrune(){
    try{
        const now=Date.now();
        for(let i=localStorage.length-1;i>=0;i--){
            const k=localStorage.key(i);if(!k)continue;
            if(k.indexOf('hv_draft_v1:')===0){let d=null;try{d=JSON.parse(localStorage.getItem(k)||'null');}catch(_){}if(!d||!d.c||now-(d.ts||0)>30*864e5)localStorage.removeItem(k);}
            else if(k.indexOf('hv_attempt_v1:')===0){let d=null;try{d=JSON.parse(localStorage.getItem(k)||'null');}catch(_){}if(!d||now-(d.s||0)>3*864e5)localStorage.removeItem(k);}
        }
        if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(function(e){window.__hvStorage=e;if(e.quota&&e.usage/e.quota>0.8){try{localStorage.removeItem('hv_cm_cache');}catch(_){}}}).catch(function(){});
        if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});
    }catch(_){}
}
setTimeout(function(){hvIdle(hvStoragePrune,5000);},6000);

/* ----- Vòng đời trang, mạng, đo hiệu năng ----- */
document.addEventListener('freeze',function(){try{hvDraftSave();if(HV_WL.aid)hvWLFlush(true);}catch(_){}});
document.addEventListener('resume',function(){try{SupabaseDB.syncFromCloud();SupabaseDB.startRealtime();}catch(_){}});
function hvLiteCheck(){const c=navigator.connection;const lite=!!(c&&(c.saveData||/(^|-)2g$/.test(c.effectiveType||'')));document.documentElement.classList.toggle('hv-lite',lite);}
hvLiteCheck();if(navigator.connection&&navigator.connection.addEventListener)navigator.connection.addEventListener('change',hvLiteCheck);
window.__hvPerf={lt:0,maxLt:0,inp:0};
try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){window.__hvPerf.lt++;if(e.duration>window.__hvPerf.maxLt)window.__hvPerf.maxLt=Math.round(e.duration);});}).observe({type:'longtask',buffered:true});}catch(_){}
try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.interactionId&&e.duration>window.__hvPerf.inp)window.__hvPerf.inp=Math.round(e.duration);});}).observe({type:'event',durationThreshold:40,buffered:true});}catch(_){}
setTimeout(function(){hvIdle(function(){try{if(document.fonts&&document.fonts.load){document.fonts.load('900 1em Outfit');document.fonts.load('italic 1em Lora');}}catch(_){}},3000);},2500);
/* gợi ý tải trước khi rê chuột lên ô chức năng */
const hvPref={t:{}};
document.addEventListener('pointerover',function(e){
    const el=e.target.closest&&e.target.closest('.hv-tile,.hv-pill');if(!el||el.__hvp)return;const m=(el.getAttribute('onclick')||'').match(/switchTab\('([\w-]+)'\)/);if(!m)return;el.__hvp=1;const id=m[1];
    const lib={import:'xlsx',mindmap:'mermaid',hocba:'html2pdf',khbd:'html2pdf'}[id];if(lib)hvEnsure(lib).catch(function(){});
    const tb={submissions:'submissions',materials:'materials',discussion:'discussions',assignments:'assignments'}[id];
    if(tb&&currentUser&&Date.now()-(hvPref.t[tb]||0)>20000){hvPref.t[tb]=Date.now();try{SupabaseDB.syncTable(tb);}catch(_){}}
},{passive:true});
/* điều hướng mượt như "một trang": View Transitions cho thao tác bấm của người dùng */
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('.hv-tile,.hv-pill,.hv-step,.hv-hubcard .top,#sidebarNav .nav-btn,.mnav-btn,.hv-crumb button')){window.__hvVTok=true;setTimeout(function(){window.__hvVTok=false;},0);}},true);
(function(){
    const _s=switchTab;
    switchTab=function(id){
        if(window.__hvVTok&&document.startViewTransition&&!document.body.classList.contains('hv-focus')&&!document.hidden&&!window.__hvVTbusy&&hvPerfTier()===2){
            window.__hvVTok=false;window.__hvVTbusy=true;const self=this,args=arguments;
            try{const vt=document.startViewTransition(function(){_s.apply(self,args);});vt.finished.finally(function(){window.__hvVTbusy=false;});}catch(e){window.__hvVTbusy=false;return _s.apply(this,arguments);}
            return;
        }
        window.__hvVTok=false;return _s.apply(this,arguments);
    };
})();
/* tin nhắn từ Service Worker (Background Sync): đẩy hàng đợi nhật ký */
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',function(e){if(e.data&&e.data.t==='flush'){try{hvWLSend([]);}catch(_){}}});
(function(){
    const _w=hvWLSend;
    hvWLSend=function(rows){
        const run=function(){return _w(rows).then(function(){if(hvWLQueue().length&&'serviceWorker' in navigator){navigator.serviceWorker.ready.then(function(r){if(r.sync)r.sync.register('hv-wl').catch(function(){});}).catch(function(){});}});};
        return navigator.locks?navigator.locks.request('hv-wl-send',run):run();
    };
})();

/* ----- Canvas nền chạy trong Web Worker (OffscreenCanvas); tự quay về luồng chính nếu không hỗ trợ ----- */
const HV_BG_WORKER=`
let cv,ctx,w=0,h=0,dpr=1,dark=false,P=[],target=70,MIN=24,mouse={x:-9999,y:-9999},running=true,last=0,acc=0,frames=0,cols,lines;
function mk(){const r=Math.random()*1.8+0.5;return {x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:r,k:Math.floor(r*3)%3};}
function setCols(){cols=dark?['rgba(239,68,68,0.5)','rgba(16,185,129,0.5)','rgba(37,99,235,0.4)']:['rgba(220,38,38,0.35)','rgba(5,150,105,0.3)','rgba(37,99,235,0.25)'];const base=dark?0.15:0.1,rgb=dark?'239,68,68':'220,38,38';lines=[0.8,0.45,0.15].map(function(k){return 'rgba('+rgb+','+(base*k).toFixed(3)+')';});}
function size(){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
function loop(now){
  if(!running)return;const raw=now-last;last=now;const dt=Math.min(2.5,raw/16.667);acc+=Math.min(raw,100);frames++;
  if(frames>=45){const avg=acc/frames;if(avg>21&&P.length>MIN)P.length=Math.max(MIN,P.length-8);else if(avg<15&&P.length<target){for(let i=0;i<4&&P.length<target;i++)P.push(mk());}postMessage({t:'stat',fps:Math.round(1000/avg),n:P.length});acc=0;frames=0;}
  const n=P.length;
  for(let i=0;i<n;i++){const p=P[i];p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;const dx=mouse.x-p.x,dy=mouse.y-p.y;if(dx*dx+dy*dy<22500){p.x-=dx*0.003*dt;p.y-=dy*0.003*dt;}}
  ctx.clearRect(0,0,w,h);
  for(let k=0;k<3;k++){ctx.fillStyle=cols[k];ctx.beginPath();for(let i=0;i<n;i++){const p=P[i];if(p.k!==k)continue;ctx.moveTo(p.x+p.r,p.y);ctx.arc(p.x,p.y,p.r,0,6.2832);}ctx.fill();}
  ctx.lineWidth=0.6;
  for(let b=0;b<3;b++){ctx.strokeStyle=lines[b];ctx.beginPath();for(let i=0;i<n;i++){const a=P[i];for(let j=i+1;j<n;j++){const q=P[j];const dx=a.x-q.x,dy=a.y-q.y;const d2=dx*dx+dy*dy;if(d2>=14400)continue;const bb=d2<2304?0:(d2<7056?1:2);if(bb!==b)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(q.x,q.y);}}ctx.stroke();}
  requestAnimationFrame(loop);
}
onmessage=function(e){const d=e.data;
  if(d.t==='init'){try{cv=d.canvas;ctx=cv.getContext('2d',{alpha:true});w=d.w;h=d.h;dpr=d.dpr;dark=d.dark;target=d.target;size();for(let i=0;i<target;i++)P.push(mk());setCols();if(typeof requestAnimationFrame!=='function'){postMessage({t:'err'});return;}postMessage({t:'ready'});last=performance.now();requestAnimationFrame(loop);}catch(err){postMessage({t:'err'});}}
  else if(d.t==='size'){w=d.w;h=d.h;if(cv)size();}
  else if(d.t==='mouse'){mouse.x=d.x;mouse.y=d.y;}
  else if(d.t==='theme'){dark=d.dark;setCols();}
  else if(d.t==='vis'){running=!d.hidden;if(running){last=performance.now();acc=0;frames=0;requestAnimationFrame(loop);}}
};`;
let hvBgWorker=null;
function hvBgTheme(){if(hvBgWorker)hvBgWorker.postMessage({t:'theme',dark:document.documentElement.getAttribute('data-theme')==='dark'});}
function initBgCanvas(){
    const canvas=document.getElementById('bgCanvas');if(!canvas)return;
    const can=!!(window.OffscreenCanvas&&canvas.transferControlToOffscreen&&window.Worker&&!window.__hvNoWorker);
    if(!can)return initBgCanvasMain(canvas);
    try{
        const fine=window.matchMedia&&matchMedia('(pointer:fine)').matches;const dpr=fine?Math.min(window.devicePixelRatio||1,1.5):1;
        const off=canvas.transferControlToOffscreen();const url=URL.createObjectURL(new Blob([HV_BG_WORKER],{type:'text/javascript'}));
        const w=new Worker(url);hvBgWorker=w;let ready=false,fell=false;
        const fallback=function(){
            if(fell)return;fell=true;try{w.terminate();}catch(_){}hvBgWorker=null;
            const nc=document.createElement('canvas');nc.id='bgCanvas';nc.className=canvas.className;nc.setAttribute('style',canvas.getAttribute('style')||'');canvas.replaceWith(nc);initBgCanvasMain(nc);
        };
        w.onmessage=function(e){const d=e.data;if(d.t==='ready'){ready=true;URL.revokeObjectURL(url);}else if(d.t==='stat'){window.__hvFps=d.fps;window.__hvCanvasN=function(){return d.n;};}else if(d.t==='err'){fallback();}};
        w.onerror=fallback;
        w.postMessage({t:'init',canvas:off,w:window.innerWidth,h:window.innerHeight,dpr:dpr,dark:document.documentElement.getAttribute('data-theme')==='dark',target:hvPerfTier()===1?48:70},[off]);
        setTimeout(function(){if(!ready)fallback();},2500);
        let raf=0,mx=-9999,my=-9999;
        window.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;mx=e.clientX;my=e.clientY;if(raf)return;raf=requestAnimationFrame(function(){raf=0;w.postMessage({t:'mouse',x:mx,y:my});});},{passive:true});
        let rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){w.postMessage({t:'size',w:window.innerWidth,h:window.innerHeight});},120);},{passive:true});
        document.addEventListener('visibilitychange',function(){w.postMessage({t:'vis',hidden:document.hidden});});
    }catch(e){console.warn('offscreen bg',e);try{initBgCanvasMain(canvas);}catch(_){}}
}
(function(){const _t=hvApplyThemeColor;hvApplyThemeColor=function(){const r=_t.apply(this,arguments);try{hvBgTheme();}catch(_){}return r;};})();

/* ----- Worker xử lý văn bản lớn (định dạng / đếm từ) ----- */
let hvTextWorker=null,hvTextSeq=0;const hvTextPending={};
function hvRunText(op,text){
    return new Promise(function(res){
        try{
            if(!window.Worker)return res(op==='format'?hvAutoBreakText(text):hvTextStats(text));
            if(!hvTextWorker){
                const src='const HV_HEAD_RE='+HV_HEAD_RE.toString()+';'+[hvIsCap,hvEndsSent,hvSplitPoem,hvLooksPoem,hvABT_ORIG].map(function(f){return f.toString();}).join('\n')+'\nfunction stats(t){const w=t.trim()?t.trim().split(/\\s+/).length:0;return {words:w,chars:t.length};}\nonmessage=function(e){const d=e.data;postMessage({id:d.id,r:d.op==="format"?hvAutoBreakText(d.text):stats(d.text)});};';
                hvTextWorker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
                hvTextWorker.onmessage=function(e){const f=hvTextPending[e.data.id];if(f){delete hvTextPending[e.data.id];f(e.data.r);}};
                hvTextWorker.onerror=function(){hvTextWorker=null;};
            }
            const id=++hvTextSeq;hvTextPending[id]=res;hvTextWorker.postMessage({id:id,op:op,text:text});
            setTimeout(function(){if(hvTextPending[id]){delete hvTextPending[id];res(op==='format'?hvAutoBreakText(text):hvTextStats(text));}},4000);
        }catch(e){res(op==='format'?hvAutoBreakText(text):hvTextStats(text));}
    });
}
function hvTextStats(t){return {words:t.trim()?t.trim().split(/\s+/).length:0,chars:t.length};}
(function(){
    const _ff=hvFormatField;
    hvFormatField=function(id){const el=document.getElementById(id);if(!el||el.value.length<4000)return _ff.apply(this,arguments);showToast('Đang định dạng văn bản dài…','info');hvRunText('format',el.value).then(function(v){el.value=v;el.rows=Math.min(20,Math.max(6,v.split('\n').length+1));showToast('Đã tự định dạng thơ/văn','success');});};
})();

/* ----- Cập nhật giao diện lạc quan có hoàn tác (phản ứng ở cộng đồng) ----- */
cmReact=async function(id,k){
    const p=cmFind(id);if(!p)return;const q=cmClone(p);q.reactions=q.reactions||{};const a=q.reactions[k]||[];const u=cmUid();
    q.reactions[k]=a.indexOf(u)!==-1?a.filter(function(x){return x!==u;}):a.concat([u]);
    cmApply(q);renderCmPosts();
    if(!(await cmSavePost(q))){cmApply(p);renderCmPosts();}
};

