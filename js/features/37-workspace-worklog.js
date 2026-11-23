/* =====================================================================
   v4.8 · BÀN LÀM BÀI 2 BÊN · TỰ ĐỊNH DẠNG ĐỀ · BẢN NHÁP · NHẬT KÝ LÀM BÀI · INTRO
   ===================================================================== */
/* ----- Tự định dạng đề (thơ / văn xuôi / câu hỏi) ----- */
function hvIsCap(w){return /^[“"'‘(\[]*\p{Lu}/u.test(w);}
function hvEndsSent(w){return /[.!?…”"]$/.test(w);}
function hvSplitPoem(seg,minW){
    const toks=seg.split(/\s+/).filter(Boolean);const lines=[];let cur=[];
    for(let i=0;i<toks.length;i++){
        const w=toks[i],prev=cur[cur.length-1];
        if(cur.length>=2&&hvIsCap(w)&&prev&&((hvEndsSent(prev)&&cur.length>=3)||cur.length>=minW||cur.length>=11)){lines.push(cur.join(' '));cur=[];}
        cur.push(w);
    }
    if(cur.length)lines.push(cur.join(' '));
    return lines;
}
function hvLooksPoem(seg){
    const toks=seg.split(/\s+/).filter(Boolean);if(toks.length<14||/\n/.test(seg))return false;
    let caps=0;for(let i=1;i<toks.length;i++){if(hvIsCap(toks[i])&&!hvEndsSent(toks[i-1]))caps++;}
    const punct=(seg.match(/[.,;:!?…]/g)||[]).length;
    return caps>=5&&caps/toks.length>=0.09&&punct/toks.length<=0.11;
}
const HV_HEAD_RE=/^((?:PHẦN\s+)?(?:VI|IV|V|I{1,3})\s*[.:]\s+[\p{Lu}\d\s]{3,60}?(?:\([^)]*\))?)(?=\s+\p{Lu}\p{Ll}|\s*$)/u;
function hvAutoBreakText(text){
    let t=String(text||'').replace(/\r/g,'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();if(!t)return '';
    if((t.match(/\n/g)||[]).length>=4)return t.replace(/[ \t]*\n[ \t]*/g,'\n').replace(/\n{3,}/g,'\n\n');
    t=t.replace(/\n+/g,' ');
    t=t.replace(/(^|\s)((?:PHẦN\s+)?(?:VI|IV|V|I{1,3})\s*[.:]\s+)(?=\p{Lu}{2})/gu,'$1\n\n$2');
    t=t.replace(/(\s)(Câu\s*\d+\s*[.:)])/giu,'$1\n\n$2');
    t=t.replace(/\s*(\(\s*[\p{Lu}\d][^()]{1,88}\b(?:1[5-9]\d{2}|20\d{2})\b[^()]*\))\s*/gu,'\n\n$1\n\n');
    const out=[];
    t.split(/\n\s*\n/).map(function(x){return x.trim();}).filter(Boolean).forEach(function(b){
        const hm=b.match(HV_HEAD_RE);
        if(hm){out.push(hm[1].trim());b=b.slice(hm[0].length).trim();if(!b)return;}
        const im=b.match(/^(.{8,160}?[:：])\s+(\p{Lu}[\s\S]{80,})$/u);
        if(im&&hvLooksPoem(im[2])){out.push(im[1]);out.push(hvSplitPoem(im[2],5).join('\n'));return;}
        if(hvLooksPoem(b)){out.push(hvSplitPoem(b,5).join('\n'));return;}
        out.push(b);
    });
    return out.join('\n\n');
}
function hvFormatExamHtml(text){
    const src=hvAutoBreakText(text);if(!src)return '';const E=escapeHtml;
    return src.split(/\n\s*\n/).map(function(b){
        const lines=b.split('\n').map(function(x){return x.trim();}).filter(Boolean);if(!lines.length)return '';
        if(lines.length===1){
            const l=lines[0];
            if(/^(?:PHẦN\s+)?(?:VI|IV|V|I{1,3})\s*[.:]\s+\p{Lu}{2}/u.test(l)&&l.length<90)return '<h4 class="ex-h">'+E(l)+'</h4>';
            const q=l.match(/^(Câu\s*\d+\s*[.:)])\s*([\s\S]*)$/i);if(q)return '<p class="ex-q"><b>'+E(q[1])+'</b> '+E(q[2])+'</p>';
            if(/^\([^()]+\)$/.test(l)&&/\b(?:1[5-9]\d{2}|20\d{2})\b/.test(l))return '<p class="ex-attr">'+E(l)+'</p>';
            return '<p class="ex-p">'+E(l)+'</p>';
        }
        const avg=lines.reduce(function(a,l){return a+l.length;},0)/lines.length;
        if(lines.length>=3&&avg<=72&&lines.every(function(l){return l.length<=100;})){
            let ev=0,od=0,ne=0,no=0;lines.forEach(function(l,i){if(i%2){ev+=l.length;ne++;}else{od+=l.length;no++;}});
            const alt=ne&&no&&(ev/ne)>(od/no)*1.15;
            return '<div class="ex-poem'+(alt?' alt':'')+'">'+lines.map(function(l){return '<div class="ex-v">'+E(l)+'</div>';}).join('')+'</div>';
        }
        return lines.map(function(l){return '<p class="ex-p">'+E(l)+'</p>';}).join('');
    }).join('');
}
function hvFormatField(id){
    const el=document.getElementById(id);if(!el)return;const v=el.value;if(!v.trim()){showToast('Chưa có nội dung để định dạng','error');return;}
    el.value=hvAutoBreakText(v);el.rows=Math.min(20,Math.max(6,el.value.split('\n').length+1));showToast('Đã tự định dạng thơ/văn — thầy/cô có thể chỉnh lại','success');
}

/* ----- Bàn làm bài 2 bên ----- */
function hvSetPane(p){const sv=document.getElementById('splitView');if(!sv)return;sv.dataset.pane=p;document.querySelectorAll('#hvPaneTabs button').forEach(function(b){b.classList.toggle('on',b.dataset.p===p);});if(p==='right'){const t=document.getElementById('submitContent');if(t)setTimeout(function(){t.focus({preventScroll:true});},50);}hvFitWork();}
function hvFitWork(){
    const w=document.getElementById('splitView');if(!w||w.classList.contains('hidden'))return;
    const bar=document.getElementById('hvWorkBar');const top=w.getBoundingClientRect().top;
    const barH=bar&&!bar.classList.contains('hidden')?bar.offsetHeight+18:0;
    const mobileNav=(window.innerWidth<768&&!document.body.classList.contains('hv-focus'))?80:0;
    w.style.height=Math.max(340,Math.round(window.innerHeight-Math.max(top,0)-barH-mobileNav-(document.body.classList.contains('hv-focus')?30:14)))+'px';
}
function hvScrollToWork(){
    const w=document.getElementById('splitView');if(!w||w.classList.contains('hidden'))return;
    const hdr=document.querySelector('header');const off=hdr&&hdr.offsetParent!==null&&hvPos(hdr)!=='static'?hdr.getBoundingClientRect().height:0;
    w.style.scrollMarginTop=(document.body.classList.contains('hv-focus')?72:off+10)+'px';try{w.scrollIntoView({block:'start',behavior:'auto'});}catch(_){}
}
function hvLeftPaneHtml(a){
    const E=escapeHtml;
    return '<div class="ex-title"><b>'+E(a.title||'')+'</b><div class="ex-sub">'+E(a.type||'')+(a.topic?' · Đề tài: '+E(a.topic):'')+'</div></div>'+hvAsgBrief(a,{open:true});
}
let hvWorkCtx=null;
function hvSetupWorkspace(){
    const sv=document.getElementById('splitView'),nv=document.getElementById('normalView'),bar=document.getElementById('hvWorkBar'),tabs=document.getElementById('hvPaneTabs'),panel=document.getElementById('assignmentBriefPanel');
    if(!sv||!nv)return;
    const a=(typeof isStudentRole==='function'&&isStudentRole()&&currentAssignmentContext)?assignmentsData.find(function(x){return x.id===currentAssignmentContext;}):null;
    if(!a){sv.classList.add('hidden');nv.classList.remove('hidden');if(bar)bar.classList.add('hidden');if(tabs)tabs.classList.add('hidden');sv.style.height='';hvWorkCtx=null;return;}
    const oldVal=(document.getElementById('submitContentNormal')||{}).value||'';const ta=document.getElementById('submitContent');if(ta&&oldVal&&!ta.value)ta.value=oldVal;
    document.getElementById('readingPassageContent').innerHTML=hvLeftPaneHtml(a);
    sv.classList.remove('hidden');nv.classList.add('hidden');if(bar)bar.classList.remove('hidden');if(tabs)tabs.classList.remove('hidden');if(panel)panel.classList.add('hidden');
    if(!sv.dataset.pane)sv.dataset.pane='left';
    try{updateWordCount();}catch(_){}hvUpdateBar();
    const first=hvWorkCtx!==a.id;hvWorkCtx=a.id;
    if(first){hvSetPane(window.innerWidth<=700?'left':'right');}
    setTimeout(function(){if(first)hvScrollToWork();hvFitWork();},60);
}
function hvPickAttachment(){HV_WL.mute=Date.now()+15000;const i=document.getElementById('submitAttachments');if(i)i.click();}
let hvSubmitting=false;
async function hvSubmitFromBar(){
    if(hvSubmitting)return;hvSubmitting=true;const b=document.getElementById('hvBarSubmit');if(b){b.disabled=true;b.style.opacity='.65';}
    try{await handleStudentSubmitHomework({preventDefault:function(){}});}catch(e){console.warn(e);showToast('Gửi bài chưa được — hãy thử lại','error');}
    hvSubmitting=false;if(b){b.disabled=false;b.style.opacity='';}
}
let hvLastBar='';
function hvUpdateBar(){
    const st=document.getElementById('hvBarStat');if(!st)return;
    const t=hvDraftText();const w=t.trim()?t.trim().split(/\s+/).length:0;
    const sv=HV_DRAFT.saved?(' · 💾 Đã lưu nháp lúc <b>'+hvParts(HV_DRAFT.saved).hour+':'+hvParts(HV_DRAFT.saved).minute+'</b>'):' · 💾 Bài đang viết được tự lưu';
    const html='✍️ <b>'+w+'</b> từ · '+t.length+' ký tự'+sv+'<br><span style="opacity:.8">Em có thể thoát ra vào lại thoải mái — việc rời màn hình sẽ được ghi lại cho giáo viên.</span>';
    if(html!==hvLastBar){st.innerHTML=html;hvLastBar=html;}
    const ac=document.getElementById('hvBarAtt');if(ac)ac.textContent=(typeof pendingAttachments!=='undefined'&&pendingAttachments.length)?'('+pendingAttachments.length+')':'';
}

/* ----- Bản nháp tự lưu ----- */
const HV_DRAFT={saved:0,P:'hv_draft_v1:'};
function hvDraftKey(aid){const u=currentUser;if(!u)return null;return HV_DRAFT.P+(u.studentId||u.name||'u')+':'+(aid||'free');}
function hvDraftText(){const sv=document.getElementById('splitView');const split=sv&&!sv.classList.contains('hidden');const el=document.getElementById(split?'submitContent':'submitContentNormal');return el?el.value:'';}
function hvDraftSave(){
    try{
        if(typeof isStudentRole!=='function'||!isStudentRole())return;
        const k=hvDraftKey(currentAssignmentContext);if(!k)return;const c=hvDraftText();
        if(c.trim()){localStorage.setItem(k,JSON.stringify({c:c,t:(document.getElementById('submitTopic')||{}).value||'',ts:hvNow(),aid:currentAssignmentContext||null}));HV_DRAFT.saved=hvNow();}
        else{localStorage.removeItem(k);}
    }catch(_){}
    try{hvUpdateBar();}catch(_){}
}
const hvDraftSaveSoon=hvDebounce(hvDraftSave,500);
document.addEventListener('input',function(e){const id=e.target&&e.target.id;if(id==='submitContent'||id==='submitContentNormal')hvDraftSaveSoon();},{passive:true});
document.addEventListener('visibilitychange',function(){if(document.hidden)hvDraftSave();});
window.addEventListener('pagehide',hvDraftSave);
function hvDraftRestore(aid,onlyIfEmpty){
    const k=hvDraftKey(aid);if(!k)return false;let d=null;try{d=JSON.parse(localStorage.getItem(k)||'null');}catch(_){}
    if(!d||!d.c)return false;
    const ids=['submitContent','submitContentNormal'];
    if(onlyIfEmpty&&ids.map(function(i){return (document.getElementById(i)||{}).value||'';}).join('').trim())return false;
    ids.forEach(function(i){const el=document.getElementById(i);if(el)el.value=d.c;});
    if(d.t){const tp=document.getElementById('submitTopic');if(tp&&!tp.value)tp.value=d.t;}
    HV_DRAFT.saved=d.ts||hvNow();try{updateWordCount();updateWordCount2();}catch(_){}
    showToast('Đã khôi phục bài đang viết ('+d.c.trim().split(/\s+/).length+' từ) 💾','success');return true;
}
function hvDraftClear(aid){const k=hvDraftKey(aid);try{if(k)localStorage.removeItem(k);}catch(_){}HV_DRAFT.saved=0;}
function hvDraftList(){
    const out=[];if(!currentUser)return out;const pre=HV_DRAFT.P+(currentUser.studentId||currentUser.name||'u')+':';
    try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||k.indexOf(pre)!==0)continue;const d=JSON.parse(localStorage.getItem(k)||'null');if(d&&d.c&&d.c.trim())out.push({aid:d.aid,c:d.c,ts:d.ts||0,words:d.c.trim().split(/\s+/).length});}}catch(_){}
    return out.sort(function(a,b){return b.ts-a.ts;});
}
function hvResumeHtml(){
    if(typeof hvRoleKey!=='function'||hvRoleKey()!=='s')return '';const list=hvDraftList();if(!list.length)return '';const E=escapeHtml;
    return '<div class="hv-sec">📝 Bài đang làm dở</div><div class="hv-tiles" style="margin-top:6px">'+list.map(function(d,i){
        const a=d.aid?assignmentsData.find(function(x){return x.id===d.aid;}):null;const title=a?a.title:'Bài viết nháp';
        return '<button class="hv-tile" style="animation-delay:'+i*60+'ms" onclick="'+(d.aid&&a?'startSubmitFromAssignment(\''+E(d.aid)+'\')':'switchTab(\'submit\')')+'"><div class="hv-tile-ic" style="background:linear-gradient(135deg,#f59e0b,#dc2626)"><i class="fa-solid fa-pen-nib"></i></div><div style="min-width:0;flex:1"><b>'+E(title)+'</b><p>Em đã viết <b>'+d.words+'</b> từ. Bấm để viết tiếp — nội dung đã được tự lưu.</p><div class="meta"><span class="hv-stat">Lưu '+E(hvAgo(d.ts))+'</span><span class="hv-go">Viết tiếp →</span></div></div></button>';
    }).join('')+'</div>';
}
(function(){
    const _st=startSubmitFromAssignment;
    startSubmitFromAssignment=function(id){const r=_st.apply(this,arguments);try{hvDraftRestore(id,false);hvWLStart(id);hvSetupWorkspace();}catch(e){console.warn(e);}return r;};
    const _ps=prepareStudentSubmit;
    prepareStudentSubmit=function(){const r=_ps.apply(this,arguments);try{hvSetupWorkspace();if(!currentAssignmentContext)hvDraftRestore(null,true);}catch(e){console.warn(e);}return r;};
    const _ca=cancelAssignmentContext;
    cancelAssignmentContext=function(){try{hvDraftSave();hvWLEnd(false);}catch(_){}const r=_ca.apply(this,arguments);try{hvSetupWorkspace();}catch(_){}return r;};
    const _ra=renderAttachmentList;renderAttachmentList=function(){const r=_ra.apply(this,arguments);try{hvUpdateBar();}catch(_){}return r;};
    const _uw=updateWordCount;updateWordCount=function(){_uw.apply(this,arguments);hvUpdateBar();};
    const _rr=hvReleaseSession;hvReleaseSession=function(){try{hvWLEnd(false);hvDraftSave();}catch(_){}return _rr.apply(this,arguments);};
    window.addEventListener('resize',hvFitWork,{passive:true});window.addEventListener('orientationchange',function(){setTimeout(hvFitWork,250);});
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){hvFitWork();});
})();

/* ----- Nhật ký làm bài (ghi lại thoát màn hình, như Azota) ----- */
const HV_WL={aid:null,sid:null,start:0,leaves:0,away:0,since:null,events:[],sent:0,seq:0,title:'',mute:0,lastLen:-1};
function hvWLQueue(){try{return JSON.parse(localStorage.getItem('hv_wl_q')||'[]');}catch(_){return [];}}
function hvWLSetQueue(q){try{localStorage.setItem('hv_wl_q',JSON.stringify(q.slice(-30)));}catch(_){}}
function hvWLStart(aid){
    if(typeof isStudentRole!=='function'||!isStudentRole()||!aid)return;
    if(HV_WL.aid===aid&&HV_WL.sid)return;hvWLEnd(false);
    const a=assignmentsData.find(function(x){return x.id===aid;});const now=hvNow();
    Object.assign(HV_WL,{aid:aid,sid:'s'+now.toString(36)+Math.random().toString(36).slice(2,6),start:now,leaves:0,away:0,since:null,events:[{t:now,k:'start'}],sent:0,seq:0,title:a?a.title:'',lastLen:-1});
    hvWLFlush(false);
}
function hvWLActive(){return HV_WL.aid&&(!window.__hvTab||window.__hvTab==='submit');}
function hvWLLeave(why){if(!hvWLActive()||HV_WL.since)return;if(Date.now()<HV_WL.mute&&why==='blur')return;HV_WL.since=hvNow();HV_WL.events.push({t:HV_WL.since,k:why||'hide'});hvWLFlush(true);}
function hvWLBack(){
    if(!HV_WL.aid||!HV_WL.since)return;const now=hvNow(),d=now-HV_WL.since;HV_WL.since=null;
    if(d>=1000){HV_WL.leaves++;HV_WL.away+=d;HV_WL.events.push({t:now,k:'back',d:d});}
    else{const last=HV_WL.events[HV_WL.events.length-1];if(last&&last.k!=='back'&&last.k!=='start'){HV_WL.events.pop();if(HV_WL.sent>HV_WL.events.length)HV_WL.sent=HV_WL.events.length;}}
    hvWLFlush(false);
}
function hvWLRow(final){
    const now=hvNow();const open=HV_WL.since;
    const d={aid:HV_WL.aid,title:HV_WL.title,sid:(currentUser&&currentUser.studentId)||'',name:currentUser?currentUser.name:'',cls:currentClassIdForUser||'',ses:HV_WL.sid,leaves:HV_WL.leaves+(open?1:0),away:HV_WL.away+(open?now-open:0),open:!!open,events:HV_WL.events.slice(HV_WL.sent),len:hvDraftText().length,start:HV_WL.start,ts:now,fin:!!final,lim:(hvAttemptGet(HV_WL.aid)||{}).lim||0,to:!!window.__hvForceSubmit};
    HV_WL.sent=HV_WL.events.length;return {id:'wl_'+HV_WL.sid+'_'+(HV_WL.seq++),data:d};
}
async function hvWLSend(rows){
    const c=SupabaseDB.client;const all=hvWLQueue().concat(rows).slice(-30);
    if(!c||!SupabaseDB.online||navigator.onLine===false){hvWLSetQueue(all);return;}
    try{
        const r=await fetch((c.supabaseUrl||'')+'/rest/v1/work_logs',{method:'POST',keepalive:true,signal:(AbortSignal.timeout?AbortSignal.timeout(10000):undefined),headers:{apikey:c.supabaseKey||'',Authorization:'Bearer '+(c.supabaseKey||''),'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(all.map(function(x){return {id:x.id,data:x.data};}))});
        if(r.ok||[400,401,403,404,409].indexOf(r.status)!==-1)hvWLSetQueue([]);else hvWLSetQueue(all);
    }catch(e){hvWLSetQueue(all);}
}
function hvWLFlush(keep,final){if(!HV_WL.aid||!currentUser)return;hvWLSend([hvWLRow(final)]);}
function hvWLEnd(final){
    if(!HV_WL.aid)return;if(HV_WL.since)hvWLBack();
    if(currentUser)hvWLSend([hvWLRow(final)]);
    HV_WL.aid=null;HV_WL.sid=null;HV_WL.since=null;
}
document.addEventListener('visibilitychange',function(){if(!HV_WL.aid)return;if(document.hidden)hvWLLeave('hide');else hvWLBack();});
window.addEventListener('blur',function(){if(!HV_WL.aid||document.hidden)return;setTimeout(function(){if(!document.hasFocus())hvWLLeave('blur');},250);});
window.addEventListener('focus',function(){if(HV_WL.aid&&HV_WL.since&&!document.hidden)hvWLBack();});
window.addEventListener('pagehide',function(){if(HV_WL.aid&&currentUser){HV_WL.events.push({t:hvNow(),k:'close'});hvWLSend([hvWLRow(false)]);}});
document.addEventListener('click',function(e){const t=e.target;if(t&&t.closest&&t.closest('input[type=file],label.btn-ghost,#hvBarAtt'))HV_WL.mute=Date.now()+15000;},true);
setInterval(function(){if(!HV_WL.aid||document.hidden)return;const len=hvDraftText().length;if(len!==HV_WL.lastLen){HV_WL.lastLen=len;hvWLFlush(false);}},45000);
setTimeout(function(){if(hvWLQueue().length)hvWLSend([]);},4000);

/* ----- Giáo viên xem nhật ký ----- */
let wlRows=[],wlAid='',wlTimer=null,wlAgg=[];
function wlPickClass(){const sel=document.getElementById('wlAsg');if(sel)sel.value='';renderWorkLog(true);}
function hvWLPopulate(){
    const cs=document.getElementById('wlClass'),as=document.getElementById('wlAsg');if(!cs||!as)return;
    const vis=isSuperAdmin()?classesData.map(function(c){return c.id;}):getVisibleClassIds();
    const cur=cs.value;cs.innerHTML=vis.map(function(id){return '<option value="'+escapeHtml(id)+'">'+escapeHtml(getClassLabel(id))+'</option>';}).join('');cs.value=vis.indexOf(cur)!==-1?cur:(vis[0]||'');
    const list=assignmentsData.filter(function(a){return a.classId===cs.value;}).sort(function(a,b){return String(b.createdAt||'').localeCompare(String(a.createdAt||''));});
    const ca=as.value;as.innerHTML=list.length?list.map(function(a){return '<option value="'+escapeHtml(a.id)+'">'+escapeHtml(a.title||'')+'</option>'; }).join(''):'<option value="">Lớp chưa có bài tập</option>';
    as.value=list.some(function(a){return a.id===ca;})?ca:(list[0]?list[0].id:'');
}
async function renderWorkLog(force){
    if(typeof isTeacherRole!=='function'||!isTeacherRole())return;
    hvWLPopulate();const aid=(document.getElementById('wlAsg')||{}).value||'';
    if(!aid){const t=document.getElementById('wlTable');if(t)t.innerHTML='<tbody><tr><td class="cm-empty">Chọn lớp và bài tập để xem nhật ký làm bài.</td></tr></tbody>';document.getElementById('wlSummary').innerHTML='';return;}
    if(force||wlAid!==aid)await hvWLLoad(aid);
    hvWLDraw(aid);
    clearInterval(wlTimer);wlTimer=setInterval(function(){const t=document.getElementById('tab-worklog');if(!t||t.classList.contains('hidden')||document.hidden){return;}hvWLLoad(wlAid).then(function(){hvWLDraw(wlAid);});},15000);
}
async function hvWLLoad(aid){
    wlAid=aid;const c=SupabaseDB.client;
    if(!c){wlRows=[];return;}
    try{const qq=c.from('work_logs').select('id,data').eq('data->>aid',aid).limit(3000);const r=await ((typeof AbortSignal!=='undefined'&&AbortSignal.timeout)?qq.abortSignal(AbortSignal.timeout(15000)):qq);
        if(r.error){wlRows=[];window.__wlErr=r.error.message;return;}
        window.__wlErr='';wlRows=(r.data||[]).map(function(x){return x.data;}).filter(Boolean);
    }catch(e){wlRows=[];window.__wlErr=String(e&&e.message||e);}
}
function hvWLAggregate(){
    const by={};
    wlRows.forEach(function(d){
        const key=d.sid||d.name;const o=by[key]=by[key]||{sid:d.sid,name:d.name,ses:{},events:[],start:d.start,ts:0,len:0,fin:false};
        const s=o.ses[d.ses]=o.ses[d.ses]||{leaves:0,away:0,ts:0,open:false};
        if(d.ts>=s.ts){s.leaves=d.leaves;s.away=d.away;s.ts=d.ts;s.open=d.open;}
        (d.events||[]).forEach(function(ev){o.events.push(ev);});
        if(d.ts>=o.ts){o.ts=d.ts;o.len=d.len;}if(d.start<o.start)o.start=d.start;if(d.fin)o.fin=true;if(d.lim)o.lim=d.lim;if(d.to)o.to=true;
    });
    return Object.keys(by).map(function(k){
        const o=by[k];const ses=Object.keys(o.ses).map(function(x){return o.ses[x];});
        o.leaves=ses.reduce(function(a,s){return a+s.leaves;},0);o.away=ses.reduce(function(a,s){return a+s.away;},0);o.open=ses.some(function(s){return s.open;});
        const seen={};o.events=o.events.filter(function(e){const kk=e.t+'|'+e.k;if(seen[kk])return false;seen[kk]=1;return true;}).sort(function(a,b){return a.t-b.t;});
        o.events=o.events.filter(function(e,i,ev){if(e.k==='hide'||e.k==='blur'){const n=ev[i+1];if(n&&(n.k==='hide'||n.k==='blur'||n.k==='start'))return false;}return true;});
        return o;
    });
}
function hvFmtDur(ms){const s=Math.round(ms/1000);if(s<60)return s+' giây';const m=Math.floor(s/60);if(m<60)return m+' phút '+(s%60)+' giây';return Math.floor(m/60)+' giờ '+(m%60)+' phút';}
function hvFmtClock(ms){const p=hvParts(ms);return p.hour+':'+p.minute+':'+p.second;}
function hvWLDraw(aid){
    const tb=document.getElementById('wlTable'),sm=document.getElementById('wlSummary');if(!tb||!sm)return;
    const clsId=(document.getElementById('wlClass')||{}).value;const E=escapeHtml;
    wlAgg=hvWLAggregate();const studs=studentsData.filter(function(s){return s.classId===clsId;});
    const subOf=function(st){return submissionsData.some(function(s){return s.assignmentId===aid&&((s.studentId&&s.studentId===st.id)||s.studentName===st.name);});};
    const rows=studs.map(function(st){
        const ag=wlAgg.find(function(o){return (o.sid&&o.sid===st.id)||o.name===st.name;});
        let status='none';if(subOf(st)||(ag&&ag.fin))status='done';else if(ag)status=(hvNow()-ag.ts<240000)?'doing':'abandon';
        return {st:st,ag:ag,status:status};
    });
    const ord={doing:0,abandon:1,done:2,none:3};
    rows.sort(function(a,b){return ord[a.status]-ord[b.status]||((b.ag?b.ag.leaves:0)-(a.ag?a.ag.leaves:0))||a.st.name.localeCompare(b.st.name,'vi');});
    const cnt=function(s){return rows.filter(function(r){return r.status===s;}).length;};
    const totalLeaves=rows.reduce(function(a,r){return a+(r.ag?r.ag.leaves:0);},0);const risky=rows.filter(function(r){return r.ag&&r.ag.leaves>=3;}).length;
    const card=function(l,v,c){return '<div class="glass-card p-4 rounded-2xl"><p class="text-[10px] font-black uppercase tracking-widest text-ink-500">'+l+'</p><p class="text-2xl font-black mt-1 '+c+'">'+v+'</p></div>';};
    sm.innerHTML=card('Đang làm',cnt('doing'),'text-blue-600')+card('Đã nộp',cnt('done'),'text-emerald-600')+card('Chưa vào',cnt('none'),'text-ink-500')+card('Tổng lượt thoát',totalLeaves,'text-amber-600')+card('HS thoát ≥ 3 lần',risky,'text-red-600');
    const stl={doing:['wl-ok','🟢 Đang làm'],abandon:['wl-warn','🟠 Bỏ dở'],done:['wl-ok','✅ Đã nộp'],none:['wl-mute','⚪ Chưa vào']};
    if(window.__wlErr){tb.innerHTML='<tbody><tr><td class="cm-empty">⚠️ Chưa đọc được nhật ký: '+E(window.__wlErr)+'<br>Hãy chạy SQL tạo bảng <b>work_logs</b> trong Supabase.</td></tr></tbody>';return;}
    tb.innerHTML='<thead><tr><th>#</th><th>Học sinh</th><th>Trạng thái</th><th>Số lần thoát</th><th>Tổng thời gian ngoài màn hình</th><th>Lần thoát gần nhất</th><th>Đã viết</th><th></th></tr></thead><tbody>'+(rows.length?rows.map(function(r,i){
        const ag=r.ag;const lv=ag?ag.leaves:0;const fl=lv>=3?'wl-bad':(lv>=1?'wl-warn':'wl-ok');
        const lastLeave=ag?ag.events.filter(function(e){return e.k!=='back'&&e.k!=='start'&&e.k!=='close';}).pop():null;
        return '<tr><td>'+(i+1)+'</td><td><b>'+E(r.st.name)+'</b></td><td><span class="wl-badge '+stl[r.status][0]+'">'+stl[r.status][1]+'</span></td><td>'+(ag?'<span class="wl-badge '+fl+'">'+lv+' lần</span>':'—')+'</td><td>'+(ag?(ag.away?hvFmtDur(ag.away):'0 giây'):'—')+'</td><td>'+(lastLeave?E(hvFmtClock(lastLeave.t)):'—')+'</td><td>'+(ag?ag.len+' ký tự':'—')+'</td><td>'+(ag?'<button class="cm-btn" onclick="hvWLDetail(\''+E(String(r.st.id))+'\')">Chi tiết</button>':'')+'</td></tr>';
    }).join(''):'<tr><td colspan="8" class="cm-empty">Lớp chưa có học sinh.</td></tr>')+'</tbody>';
}
function hvWLDetail(sid){
    const st=studentsData.find(function(s){return String(s.id)===String(sid);});const ag=wlAgg.find(function(o){return String(o.sid)===String(sid)||(st&&o.name===st.name);});if(!ag)return;
    let m=document.getElementById('hvWLView');
    if(!m){m=document.createElement('div');m.id='hvWLView';m.className='mat-modal';m.onclick=function(e){if(e.target===m)m.style.display='none';};m.innerHTML='<div class="mat-box"><div id="hvWLViewBody"></div></div>';document.body.appendChild(m);}
    const E=escapeHtml;const lab={start:'🚀 Bắt đầu làm bài',hide:'🚪 Rời màn hình / chuyển tab',blur:'🪟 Chuyển sang cửa sổ khác',back:'↩️ Quay lại màn hình',close:'❌ Đóng trang'};
    document.getElementById('hvWLViewBody').innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><h3 style="font-family:Outfit,sans-serif;font-weight:900;font-size:19px">🕒 Nhật ký: '+E(ag.name)+'</h3><button onclick="document.getElementById(\'hvWLView\').style.display=\'none\'" style="background:none;border:0;font-size:18px;cursor:pointer;color:inherit"><i class="fa-solid fa-xmark"></i></button></div><p class="text-xs text-ink-500" style="margin:6px 0 10px">Thoát <b>'+ag.leaves+'</b> lần · tổng <b>'+hvFmtDur(ag.away)+'</b> ngoài màn hình · đã viết '+ag.len+' ký tự'+(ag.lim?' · giới hạn <b>'+ag.lim+' phút</b>'+(ag.to?' · <b style="color:#dc2626">hết giờ, hệ thống tự nộp</b>':''):'')+'</p>'+ag.events.map(function(e){return '<div class="wl-tl"><span class="tm">'+E(hvFmtClock(e.t))+'</span><span>'+(lab[e.k]||E(e.k))+(e.k==='back'?' <b>(vắng '+hvFmtDur(e.d||0)+')</b>':'')+'</span></div>';}).join('');
    m.style.display='flex';
}
function hvWLExport(){
    if(!wlAgg.length&&!wlRows.length){showToast('Chưa có dữ liệu để xuất','error');return;}
    const asg=assignmentsData.find(function(a){return a.id===wlAid;});const clsId=(document.getElementById('wlClass')||{}).value;
    const data=studentsData.filter(function(s){return s.classId===clsId;}).map(function(st,i){const ag=wlAgg.find(function(o){return (o.sid&&o.sid===st.id)||o.name===st.name;});return {'STT':i+1,'Học sinh':st.name,'Số lần thoát':ag?ag.leaves:0,'Tổng thời gian ngoài màn hình (giây)':ag?Math.round(ag.away/1000):0,'Ký tự đã viết':ag?ag.len:0,'Chi tiết':ag?ag.events.filter(function(e){return e.k!=='start';}).map(function(e){return hvFmtClock(e.t)+' '+e.k+(e.k==='back'?' ('+Math.round((e.d||0)/1000)+'s)':'');}).join(' | '):''};});
    const ws=XLSX.utils.json_to_sheet(data);ws['!cols']=[{wch:5},{wch:26},{wch:14},{wch:30},{wch:14},{wch:80}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Nhật ký làm bài');
    XLSX.writeFile(wb,'HOCVAN_NhatKyLamBai_'+hvSlug(asg?asg.title:'bai')+'_'+hvParts(hvNow()).year+'-'+hvParts(hvNow()).month+'-'+hvParts(hvNow()).day+'.xlsx');
}
HV_INFO.worklog={d:['Nhật ký làm bài: xem học sinh nào rời màn hình, bao nhiêu lần, bao lâu khi làm bài — như Azota.','Dùng khi: muốn kiểm tra tính trung thực lúc làm bài']};

/* ----- Intro siêu mượt: thêm lớp hiệu ứng, giữ nguyên toàn bộ nội dung cũ ----- */
function hvEnhanceIntro(){
    const sp=document.getElementById('introSplash');if(!sp||sp.dataset.v49)return;sp.dataset.v49='1';
    const vb=sp.querySelector('.badge-version');if(vb&&typeof HV_VERSION==='string')vb.textContent='VERSION '+HV_VERSION.split('.').slice(0,2).join('.')+' · AI POWERED · 2026';
    const track=sp.querySelector('.loader-track'),bar=sp.querySelector('.loader-bar');if(!track||!bar)return;
    const pct=document.createElement('p');pct.className='loader-pct';pct.textContent='0%';track.parentNode.insertBefore(pct,track.nextSibling);
    const t0=performance.now();let shown=0,last=t0,shownInt=0;
    const step=function(now){
        if(sp.classList.contains('hide'))return;
        const el=now-t0,dt=Math.min(64,now-last);last=now;
        let target=el<350?0:Math.min(92,((el-350)/1750)*92);
        if((window.__hvBootDone||(!SupabaseDB._bootP&&el>1900))&&el>=1900)target=100;
        shown+=(target-shown)*(1-Math.pow(0.002,dt/1000));if(target>=100&&shown>99.5)shown=100;
        bar.style.transform='scaleX('+(shown/100).toFixed(3)+')';
        const n=Math.round(shown);if(n!==shownInt){shownInt=n;pct.textContent=n+'%';}
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
function hvHideIntro(sp){
    sp.classList.add('hide');
    setTimeout(function(){sp.style.display='none';const ic=document.getElementById('introCanvas');if(ic)ic.remove();},650);
}
function hvHideIntroWhenReady(min,max){
    const t0=performance.now();
    const tick=function(){
        const sp=document.getElementById('introSplash');if(!sp||sp.classList.contains('hide'))return;
        const el=performance.now()-t0;const booting=SupabaseDB._bootP&&!window.__hvBootDone;
        if(el>=min&&(!booting||el>=max)){hvHideIntro(sp);return;}
        setTimeout(tick,100);
    };
    setTimeout(tick,min);
}
(function(){const _ri=runIntroAnimation;runIntroAnimation=function(){const r=_ri.apply(this,arguments);try{hvEnhanceIntro();}catch(e){console.warn('intro',e);}return r;};})();

