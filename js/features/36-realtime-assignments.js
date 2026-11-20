/* =====================================================================
   v4.7 · GIỜ THỰC · ĐỀ BÀI CHO HỌC SINH · TĂNG TỐC GPU / 60 FPS
   ===================================================================== */
const HV_TZ='Asia/Ho_Chi_Minh';
let hvClockOffset=0;
const hvDtf=new Intl.DateTimeFormat('en-GB',{timeZone:HV_TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',weekday:'short',hour12:false});
const HV_WD={Sun:'CN',Mon:'T2',Tue:'T3',Wed:'T4',Thu:'T5',Fri:'T6',Sat:'T7'};
function hvNow(){return Date.now()+hvClockOffset;}
function hvParts(ms){const o={};hvDtf.formatToParts(new Date(ms)).forEach(function(p){o[p.type]=p.value;});if(o.hour==='24')o.hour='00';return o;}
function hvParseDate(d){
    if(d==null||d==='')return NaN;
    if(typeof d==='number')return d;
    if(d instanceof Date)return d.getTime();
    const s=String(d).trim();
    if(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s))return Date.parse(s.replace(' ','T')+(s.length===16?':00':'')+'+07:00');
    return Date.parse(s);
}
function hvToInstant(date,time){return new Date(date+'T'+(time||'23:59')+':00+07:00').toISOString();}
function hvVNParts(d){const ms=hvParseDate(d);if(isNaN(ms))return {date:'',time:'23:59'};const p=hvParts(ms);return {date:p.year+'-'+p.month+'-'+p.day,time:p.hour+':'+p.minute};}
function hvFmtFull(d){const ms=hvParseDate(d);if(isNaN(ms))return '—';const p=hvParts(ms);return (HV_WD[p.weekday]||'')+', '+p.day+'/'+p.month+'/'+p.year+' · '+p.hour+':'+p.minute;}
function formatDeadline(d){return hvFmtFull(d);}
function formatCreated(d){return hvFmtFull(d);}
function nowStr(){const p=hvParts(hvNow());return p.day+'/'+p.month+'/'+p.year+' '+p.hour+':'+p.minute;}
function hvAgo(ts){const ms=hvParseDate(ts);if(isNaN(ms))return '';const m=Math.floor((hvNow()-ms)/60000);if(m<1)return 'vừa xong';if(m<60)return m+' phút trước';const h=Math.floor(m/60);if(h<24)return h+' giờ trước';return Math.floor(h/24)+' ngày trước';}
function computeDeadlineStatus(d){const ms=hvParseDate(d);if(isNaN(ms))return{code:'OPEN',label:'Đang mở'};const diff=ms-hvNow();if(diff<0)return{code:'EXPIRED',label:'Hết hạn'};if(diff<=48*3600*1000)return{code:'URGENT',label:'Sắp hết'};return{code:'OPEN',label:'Đang mở'};}
function formatCountdown(d){
    const ms=hvParseDate(d);if(isNaN(ms))return '';const diff=ms-hvNow();
    if(diff<0){const a=-diff,h=Math.floor(a/3600000),dd=Math.floor(h/24);return 'Quá hạn '+(dd>0?dd+' ngày':(h>0?h+' giờ':Math.max(1,Math.floor(a/60000))+' phút'));}
    const m=Math.floor(diff/60000),h=Math.floor(m/60),dd=Math.floor(h/24);
    if(dd>=1)return 'Còn '+dd+' ngày '+(h%24)+' giờ';if(h>=1)return 'Còn '+h+' giờ '+(m%60)+' phút';return 'Còn '+Math.max(1,m)+' phút';
}
function hvFixAssignmentDeadlines(){
    try{(assignmentsData||[]).forEach(function(a){
        if(!a||!a.deadline||a.dlv===2)return;
        const m=String(a.deadline).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]00(?::?00)?)?$/);
        if(m){a.deadline=hvToInstant(m[1],m[2]);}
        a.dlv=2;
    });}catch(e){console.warn('fix deadlines',e);}
}
async function hvSyncClock(){
    try{
        const c=SupabaseDB.client;if(!c||navigator.onLine===false)return;
        const t0=Date.now();const r=await fetch((c.supabaseUrl||'')+'/rest/v1/',{method:'HEAD',headers:{apikey:c.supabaseKey||''},cache:'no-store',signal:(AbortSignal.timeout?AbortSignal.timeout(8000):undefined)});const t1=Date.now();
        const dh=r.headers.get('date');if(!dh)return;
        const off=new Date(dh).getTime()+(t1-t0)/2-t1;hvClockOffset=Math.abs(off)>2500?off:0;
    }catch(_){}
}
(function(){
    const _l=loadLocalCache;loadLocalCache=function(){const r=_l.apply(this,arguments);hvFixAssignmentDeadlines();return r;};
    try{hvFixAssignmentDeadlines();}catch(_){}
    setTimeout(function(){hvSyncClock();},1200);
    setInterval(function(){
        if(document.hidden||typeof currentUser==='undefined'||!currentUser)return;
        document.querySelectorAll('.hv-ago').forEach(function(el){el.textContent='('+hvAgo(el.getAttribute('data-ts'))+')';});
        const t=document.getElementById('tab-assignments');
        if(t&&!t.classList.contains('hidden')){try{if(isTeacherRole())renderAssignments();else renderStudentAssignmentsFiltered();}catch(_){}}
    },30000);
})();

/* ----- Đề bài hiển thị cho học sinh (nội dung, ảnh, file) ----- */
function hvSafeSrc(u){u=String(u||'');return /^(data:(image|application|text)\/|https?:\/\/|blob:)/i.test(u)?u:'';}
function hvLightbox(src){
    const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;z-index:100065;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:14px;cursor:zoom-out';
    o.innerHTML='<img alt="Ảnh đề bài" style="max-width:100%;max-height:100%;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.6)"><button style="position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.2);color:#fff;font-size:18px;cursor:pointer" aria-label="Đóng">✕</button>';
    const im=o.querySelector('img');im.src=src;if(im.decode)im.decode().catch(function(){});const close=function(){o.remove();document.removeEventListener('keydown',esc);};const esc=function(e){if(e.key==='Escape')close();};
    o.addEventListener('click',close);document.addEventListener('keydown',esc);document.body.appendChild(o);hvTrackNode(o);
}
function hvAsgAttCount(a){return ((a&&a.attachments)||[]).filter(function(x){return hvSafeSrc(x.dataUrl||x.url);}).length;}
function hvAsgBrief(a,opts){
    const E=escapeHtml;const atts=(a.attachments||[]).filter(function(x){return hvSafeSrc(x.dataUrl||x.url);});
    const imgs=atts.filter(function(x){return /^image\//.test(x.type||'');});const files=atts.filter(function(x){return imgs.indexOf(x)===-1;});
    const ts=hvParseDate(a.createdAt);
    let h='<div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11.5px" class="text-ink-500"><span><i class="fa-solid fa-paper-plane text-blue-500"></i> Giao lúc <b>'+E(formatCreated(a.createdAt))+'</b> <span class="hv-ago" data-ts="'+(isNaN(ts)?'':ts)+'">('+E(hvAgo(a.createdAt))+')</span></span><span><i class="fa-solid fa-calendar-day text-red-500"></i> Hạn <b>'+E(formatDeadline(a.deadline))+'</b></span><span><i class="fa-solid fa-hourglass-half text-amber-500"></i> '+E(formatCountdown(a.deadline))+'</span>'+(a.timeLimit>0?'<span><i class="fa-regular fa-clock text-emerald-600"></i> Giới hạn <b>'+a.timeLimit+' phút</b></span>':'')+'</div>';
    if(a.description)h+='<div class="ex-body">'+hvFormatExamHtml(a.description)+'</div>';
    if(a.readingPassage)h+='<details style="margin-top:12px"'+((opts&&opts.open)?' open':'')+'><summary style="cursor:pointer;font-weight:800;font-size:13px">📖 Ngữ liệu đọc hiểu</summary><div class="ex-body">'+hvFormatExamHtml(a.readingPassage)+'</div></details>';
    if(imgs.length)h+='<div class="mat-imgs">'+imgs.map(function(x){return '<img src="'+E(x.dataUrl||x.url)+'" alt="'+E(x.name||'Ảnh đề')+'" loading="lazy" decoding="async" onclick="hvLightbox(this.src)">';}).join('')+'</div>';
    if(files.length)h+='<div style="margin-top:12px">'+files.map(function(x){const u=x.dataUrl||x.url;return '<a class="mat-file" style="text-decoration:none;color:inherit" href="'+E(u)+'" download="'+E(x.name||'file')+'" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-file-arrow-down" style="color:#2563eb"></i><span class="n">'+E(x.name||'file')+'</span><span class="text-ink-400">'+(x.size?Math.max(1,Math.round(x.size/1024))+' KB':'')+'</span><b style="color:#dc2626;font-size:11px">Tải về</b></a>';}).join('')+'</div>';
    if(!a.description&&!a.readingPassage&&!atts.length)h+='<p class="text-xs text-ink-400 italic" style="margin-top:10px">Giáo viên chưa đính kèm nội dung đề — hãy xem tiêu đề, đề tài và hạn nộp.</p>';
    return h;
}
function hvRenderAssignmentBrief(id){
    const p=document.getElementById('assignmentBriefPanel');if(!p)return;
    const a=assignmentsData.find(function(x){return x.id===id;});
    if(!a){p.classList.add('hidden');p.innerHTML='';return;}
    p.innerHTML='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fa-solid fa-file-lines text-red-500"></i><b style="font-size:15px">Đề bài: '+escapeHtml(a.title||'')+'</b></div>'+hvAsgBrief(a);
    const _sv=document.getElementById('splitView');p.classList.toggle('hidden',!!(_sv&&!_sv.classList.contains('hidden')));
}
function hvOpenAssignmentView(id){
    const a=assignmentsData.find(function(x){return x.id===id;});if(!a)return;
    let m=document.getElementById('hvAsgView');
    if(!m){m=document.createElement('div');m.id='hvAsgView';m.className='mat-modal';m.onclick=function(e){if(e.target===m)hvCloseAssignmentView();};m.innerHTML='<div class="mat-box wide"><div id="hvAsgViewBody"></div></div>';document.body.appendChild(m);}
    const E=escapeHtml;const canDo=!isTeacherRole();
    document.getElementById('hvAsgViewBody').innerHTML='<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div style="min-width:0"><span class="mat-tag" style="background:rgba(220,38,38,.12);color:#dc2626">'+E(a.type||'')+'</span><h3 style="font-family:Outfit,sans-serif;font-weight:900;font-size:21px;line-height:1.25;margin-top:6px;word-break:break-word">'+E(a.title||'')+'</h3><div class="text-ink-500" style="font-size:12px;margin-top:2px">Đề tài: '+E(a.topic||'—')+'</div></div><button onclick="hvCloseAssignmentView()" aria-label="Đóng" style="background:none;border:0;font-size:18px;cursor:pointer;color:inherit"><i class="fa-solid fa-xmark"></i></button></div><div style="margin-top:12px">'+hvAsgBrief(a)+'</div>'+(canDo?'<div style="margin-top:16px;display:flex;justify-content:flex-end"><button class="cm-go" onclick="hvCloseAssignmentView();startSubmitFromAssignment(\''+E(a.id)+'\')"><i class="fa-solid fa-pen-nib"></i> Làm bài này</button></div>':'');
    m.style.display='flex';
}
function hvCloseAssignmentView(){const m=document.getElementById('hvAsgView');if(m)m.style.display='none';}
function hvAsgBadges(a){
    const n=hvAsgAttCount(a);
    return '<button type="button" onclick="hvOpenAssignmentView(\''+escapeHtml(a.id)+'\')" class="btn-ghost text-[11px] font-bold px-3 py-1.5 rounded-lg mt-2"><i class="fa-solid fa-eye mr-1"></i>Xem đề'+(n?' · '+n+' file/ảnh':'')+(a.description?' · có nội dung':'')+hvAttemptBadge(a)+'</button>';
}
(function(){
    const _st=startSubmitFromAssignment;startSubmitFromAssignment=function(id){const r=_st.apply(this,arguments);try{hvRenderAssignmentBrief(id);}catch(e){console.warn(e);}return r;};
    const _ca=cancelAssignmentContext;cancelAssignmentContext=function(){const r=_ca.apply(this,arguments);try{const p=document.getElementById('assignmentBriefPanel');if(p){p.classList.add('hidden');p.innerHTML='';}}catch(_){}return r;};
})();

/* ----- Tối ưu sự kiện gõ phím ----- */
function hvRafThrottle(fn){let q=false,args;return function(){args=arguments;if(q)return;q=true;requestAnimationFrame(function(){q=false;try{fn.apply(null,args);}catch(e){console.warn(e);}});};}
function hvDebounce(fn,ms){let t;return function(){const a=arguments,self=this;clearTimeout(t);t=setTimeout(function(){fn.apply(self,a);},ms);};}
const hvDebMap={};
function hvDeb(key,fn,ms){clearTimeout(hvDebMap[key]);hvDebMap[key]=setTimeout(fn,ms||120);}
updateWordCount=hvRafThrottle(updateWordCount);
updateWordCount2=hvRafThrottle(updateWordCount2);
hvHubQuery=hvDebounce(hvHubQuery,90);

/* ----- Canvas nền tối ưu: delta-time, gom nét vẽ, tự giảm tải để giữ 60 FPS+, tạm dừng khi ẩn tab ----- */
function hvPerfTier(){const c=navigator.hardwareConcurrency||4,m=navigator.deviceMemory||4;return (c<=4||m<=2)?1:2;}
function initBgCanvasMain(canvasArg){
    const canvas=canvasArg||document.getElementById('bgCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true})||canvas.getContext('2d');
    const fine=window.matchMedia&&matchMedia('(pointer:fine)').matches;const dpr=fine?Math.min(window.devicePixelRatio||1,1.5):1;
    let w=0,h=0;
    const resize=function(){w=window.innerWidth;h=window.innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};resize();
    const MAX=70,MIN=24;const target=hvPerfTier()===1?48:MAX;
    const mk=function(){const r=Math.random()*1.8+0.5;return {x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:r,k:Math.floor(r*3)%3};};
    const P=[];for(let i=0;i<target;i++)P.push(mk());
    let dark=document.documentElement.getAttribute('data-theme')==='dark';
    const setCols=function(){
        window.__hvCols=dark?['rgba(239,68,68,0.5)','rgba(16,185,129,0.5)','rgba(37,99,235,0.4)']:['rgba(220,38,38,0.35)','rgba(5,150,105,0.3)','rgba(37,99,235,0.25)'];
        const base=dark?0.15:0.1,rgb=dark?'239,68,68':'220,38,38';window.__hvLines=[0.8,0.45,0.15].map(function(k){return 'rgba('+rgb+','+(base*k).toFixed(3)+')';});
    };setCols();
    const mouse={x:-9999,y:-9999};
    window.addEventListener('pointermove',function(e){if(e.pointerType!=='touch'){mouse.x=e.clientX;mouse.y=e.clientY;}},{passive:true});
    let rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(resize,120);},{passive:true});
    let last=performance.now(),acc=0,frames=0,running=true;
    window.__hvCanvasN=function(){return P.length;};
    const loop=function(now){
        if(!running)return;
        const raw=now-last;last=now;const dt=Math.min(2.5,raw/16.667);
        acc+=Math.min(raw,100);frames++;
        if(frames>=45){
            const avg=acc/frames;window.__hvFps=Math.round(1000/avg);
            if(avg>21&&P.length>MIN)P.length=Math.max(MIN,P.length-8);else if(avg<15&&P.length<target){for(let i=0;i<4&&P.length<target;i++)P.push(mk());}
            acc=0;frames=0;const d=document.documentElement.getAttribute('data-theme')==='dark';if(d!==dark){dark=d;setCols();}
        }
        const n=P.length;
        for(let i=0;i<n;i++){const p=P[i];p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;const dx=mouse.x-p.x,dy=mouse.y-p.y;if(dx*dx+dy*dy<22500){p.x-=dx*0.003*dt;p.y-=dy*0.003*dt;}}
        ctx.clearRect(0,0,w,h);
        const cols=window.__hvCols;
        for(let k=0;k<3;k++){ctx.fillStyle=cols[k];ctx.beginPath();for(let i=0;i<n;i++){const p=P[i];if(p.k!==k)continue;ctx.moveTo(p.x+p.r,p.y);ctx.arc(p.x,p.y,p.r,0,6.2832);}ctx.fill();}
        ctx.lineWidth=0.6;
        for(let b=0;b<3;b++){
            ctx.strokeStyle=window.__hvLines[b];ctx.beginPath();
            for(let i=0;i<n;i++){const a=P[i];for(let j=i+1;j<n;j++){const q=P[j];const dx=a.x-q.x,dy=a.y-q.y;const d2=dx*dx+dy*dy;if(d2>=14400)continue;const bb=d2<2304?0:(d2<7056?1:2);if(bb!==b)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(q.x,q.y);}}
            ctx.stroke();
        }
        requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange',function(){if(document.hidden){running=false;}else if(!running){running=true;last=performance.now();acc=0;frames=0;requestAnimationFrame(loop);}});
    requestAnimationFrame(loop);
}
function initIntroCanvas(){
    const canvas=document.getElementById('introCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d',{desynchronized:true})||canvas.getContext('2d');
    let w=canvas.width=window.innerWidth,h=canvas.height=window.innerHeight;
    const COL=[[220,38,38],[5,150,105],[37,99,235],[245,158,11]];
    const sprites=COL.map(function(c){const s=document.createElement('canvas');s.width=s.height=48;const g=s.getContext('2d');const r=g.createRadialGradient(24,24,0,24,24,24);r.addColorStop(0,'rgba('+c.join(',')+',0.9)');r.addColorStop(0.35,'rgba('+c.join(',')+',0.35)');r.addColorStop(1,'rgba('+c.join(',')+',0)');g.fillStyle=r;g.fillRect(0,0,48,48);return s;});
    const N=hvPerfTier()===1?60:100;const P=[];
    for(let i=0;i<N;i++)P.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8,r:Math.random()*2+1,k:Math.floor(Math.random()*COL.length)});
    let last=performance.now(),n=0;
    const loop=function(now){
        if(++n%30===0){const sp=document.getElementById('introSplash');if(!sp||sp.classList.contains('hide')||getComputedStyle(sp).display==='none')return;}
        const dt=Math.min(2.5,(now-last)/16.667);last=now;
        ctx.fillStyle='rgba(10,5,20,0.15)';ctx.fillRect(0,0,w,h);
        for(let i=0;i<N;i++){const p=P[i];p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;const gs=p.r*8+10;ctx.drawImage(sprites[p.k],p.x-gs/2,p.y-gs/2,gs,gs);}
        for(let b=0;b<3;b++){
            ctx.strokeStyle='rgba(220,38,38,'+[0.16,0.09,0.03][b]+')';ctx.lineWidth=0.5;ctx.beginPath();
            for(let i=0;i<N;i++){const a=P[i];for(let j=i+1;j<N;j++){const q=P[j];const dx=a.x-q.x,dy=a.y-q.y,d2=dx*dx+dy*dy;if(d2>=10000)continue;const bb=d2<1600?0:(d2<4900?1:2);if(bb!==b)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(q.x,q.y);}}
            ctx.stroke();
        }
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    let rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){w=canvas.width=window.innerWidth;h=canvas.height=window.innerHeight;},120);},{passive:true});
}
(function(){
    if(/[?&]fps(=|&|$)/.test(location.search)){
        const d=document.createElement('div');d.style.cssText='position:fixed;left:8px;bottom:8px;z-index:10090;padding:4px 10px;border-radius:8px;background:rgba(0,0,0,.72);color:#34d399;font:700 12px monospace;pointer-events:none';document.body.appendChild(d);
        let f=0,t=performance.now();const tick=function(now){f++;if(now-t>=500){d.textContent=Math.round(f*1000/(now-t))+' FPS · '+(window.__hvCanvasN?window.__hvCanvasN():0)+' hạt nền · DOM tạm '+hvLeak.live+' · tab '+window.__hvTabs+hvCompatTxt()+' · long-task '+window.__hvPerf.lt+' (max '+window.__hvPerf.maxLt+'ms) · INP~'+window.__hvPerf.inp+'ms';f=0;t=now;}requestAnimationFrame(tick);};requestAnimationFrame(tick);
    }
})();

