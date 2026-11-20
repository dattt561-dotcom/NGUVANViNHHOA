/* ===== ĐÁNH GIÁ / BÁO LỖI ===== */
const FB_TYPES=[['bug','🐞','Báo lỗi'],['idea','💡','Góp ý'],['praise','👏','Khen'],['other','❓','Khác']];
const FB_RATE=['','Rất tệ 😞','Chưa tốt 😕','Bình thường 🙂','Tốt 😊','Tuyệt vời 🤩'];
let fbRating=0,fbType='bug',fbLast=0;
window.__hvLastErr=null;window.__hvTab='';
window.addEventListener('error',function(e){window.__hvLastErr=String(e.message||'')+' @'+String((e.filename||'').split('/').pop())+':'+(e.lineno||0);});
window.addEventListener('unhandledrejection',function(e){window.__hvLastErr='Promise: '+(e.reason&&e.reason.message?e.reason.message:String(e.reason));});
function fbRender(){
    document.getElementById('fbStars').innerHTML=[1,2,3,4,5].map(function(i){return '<button type="button" class="fb-star '+(i<=fbRating?'on':'')+'" onclick="fbSetRating('+i+')" aria-label="'+i+' sao">★</button>';}).join('');
    document.getElementById('fbRateText').textContent=FB_RATE[fbRating]||'';
    document.getElementById('fbTypes').innerHTML=FB_TYPES.map(function(t){return '<button type="button" class="cm-chip '+(fbType===t[0]?'on':'')+'" onclick="fbSetType(\''+t[0]+'\')">'+t[1]+' '+t[2]+'</button>';}).join('');
}
function fbSetRating(n){fbRating=n;fbRender();}
function fbSetType(t){fbType=t;fbRender();}
function openFeedback(){
    fbRating=0;fbType='bug';document.getElementById('fbText').value='';document.getElementById('fbCount').textContent='';
    document.getElementById('fbNameWrap').style.display=currentUser?'flex':'none';document.getElementById('fbName').checked=false;
    fbRender();const m=document.getElementById('feedbackModal');m.classList.remove('hidden');m.style.display='flex';
}
function closeFeedback(){const m=document.getElementById('feedbackModal');m.style.display='none';m.classList.add('hidden');}
async function submitFeedback(){
    const text=(document.getElementById('fbText').value||'').trim();
    if(!fbRating){showToast('Em chấm số sao giúp thầy cô nhé ⭐','error');return;}
    if(fbType==='bug'&&text.length<8){showToast('Hãy mô tả lỗi rõ hơn một chút (ít nhất 8 ký tự)','error');return;}
    if(text.length>0&&text.length<3){showToast('Nội dung quá ngắn','error');return;}
    if(Date.now()-fbLast<30000){showToast('Em vừa gửi xong, vui lòng chờ ít giây rồi gửi tiếp nhé','error');return;}
    if(text&&hvBlockIfBad(text))return;
    const tech=document.getElementById('fbTech').checked;const share=document.getElementById('fbName').checked&&currentUser;
    const data={id:'fb'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),rating:fbRating,type:fbType,text:text.slice(0,5000),ts:Date.now(),role:currentUser?(currentUser.role||'user'):'visitor',name:share?currentUser.name:'',status:'new',ver:HV_VERSION};
    if(tech){data.tab=window.__hvTab||'';data.ua=String(navigator.userAgent||'').slice(0,160);data.view=innerWidth+'x'+innerHeight;data.online=navigator.onLine;data.theme=document.documentElement.getAttribute('data-theme');data.err=window.__hvLastErr||'';}
    const btn=document.getElementById('fbSubmit');btn.disabled=true;
    const ok=await SupabaseDB.commit(function(){return SupabaseDB.insert('feedback',{id:data.id,data:data,updated_at:new Date().toISOString()});});
    btn.disabled=false;if(!ok)return;
    fbLast=Date.now();closeFeedback();showToast('Cảm ơn em! Ý kiến đã được gửi tới thầy cô 💚','success');try{confetti({particleCount:70,spread:70,origin:{y:.6}});}catch(_){}
}
async function fbPull(){
    try{
        if(!SupabaseDB.client)SupabaseDB.init();const c=SupabaseDB.client;if(!c)return;
        const r=await Promise.all([c.from('feedback').select('*').limit(1000),c.from('community_posts').select('*').limit(1000)]);
        if(r[0].error)showCloudStatus('Không đọc được đánh giá: '+r[0].error.message,'error');else if(r[0].data)feedbackList=r[0].data.map(function(x){return x.data;}).filter(Boolean);
        if(!r[1].error&&r[1].data){communityPosts=r[1].data.map(function(x){return x.data;}).filter(Boolean);cmPersist();}
    }catch(e){console.warn('fbPull',e);}
}
async function renderFeedbackAdmin(force){
    if(!(typeof isSuperAdmin==='function'&&isSuperAdmin()))return;
    if(force)await fbPull();
    const ft=document.getElementById('fbFilterType'),fs=document.getElementById('fbFilterStatus');if(!ft||!fs)return;
    const all=feedbackList.slice().sort(function(a,b){return (b.ts||0)-(a.ts||0);});
    const avg=all.length?(all.reduce(function(s,x){return s+(x.rating||0);},0)/all.length):0;
    const openBugs=all.filter(function(x){return x.type==='bug'&&x.status!=='done';}).length;
    const stat=function(l,v,c){return '<div class="glass-card p-4 rounded-2xl"><p class="text-[10px] font-black uppercase tracking-widest text-ink-500">'+l+'</p><p class="text-2xl font-black mt-1 '+c+'">'+v+'</p></div>';};
    document.getElementById('fbStats').innerHTML=stat('Tổng ý kiến',all.length,'text-blue-600')+stat('Điểm trung bình',all.length?avg.toFixed(1)+' ★':'—','text-amber-600')+stat('Lỗi chưa xử lý',openBugs,'text-red-600')+stat('Đã xử lý',all.filter(function(x){return x.status==='done';}).length,'text-emerald-600');
    const list=all.filter(function(x){return (ft.value==='all'||x.type===ft.value)&&(fs.value==='all'||(x.status||'new')===fs.value);});
    const tmap={bug:'🐞 Báo lỗi',idea:'💡 Góp ý',praise:'👏 Khen',other:'❓ Khác'};
    document.getElementById('fbList').innerHTML=list.length?list.map(function(x){const id=cmId(x.id);return '<div class="glass-card p-4 rounded-2xl"><div class="flex flex-wrap items-center gap-2 text-xs"><span class="font-black text-amber-500" style="letter-spacing:2px">'+'★'.repeat(x.rating||0)+'<span style="opacity:.25">'+'★'.repeat(5-(x.rating||0))+'</span></span><span class="font-bold">'+(tmap[x.type]||x.type)+'</span><span class="text-ink-500">· '+escapeHtml(x.name||'Ẩn danh')+' ('+escapeHtml(x.role||'')+') · '+new Date(x.ts||0).toLocaleString('vi-VN')+'</span><span class="ml-auto px-2 py-0.5 rounded-full font-black text-[10px] '+((x.status==='done')?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700')+'">'+((x.status==='done')?'ĐÃ XỬ LÝ':'MỚI')+'</span></div>'+(x.text?'<p class="mt-2 text-sm" style="white-space:pre-wrap;word-break:break-word">'+escapeHtml(x.text)+'</p>':'<p class="mt-2 text-xs text-ink-400 italic">(Chỉ chấm sao)</p>')+(x.ua||x.tab||x.err?'<details class="mt-2 text-[11px] text-ink-500"><summary class="cursor-pointer font-bold">Thông tin kỹ thuật</summary><div class="mt-1" style="word-break:break-word">Phiên bản: '+escapeHtml(x.ver||'')+' · Mục: '+escapeHtml(x.tab||'—')+' · Màn hình: '+escapeHtml(x.view||'')+' · Giao diện: '+escapeHtml(x.theme||'')+' · Mạng: '+(x.online===false?'offline':'online')+'<br>Thiết bị: '+escapeHtml(x.ua||'')+(x.err?'<br><b>Lỗi gần nhất:</b> '+escapeHtml(x.err):'')+'</div></details>':'')+'<div class="mt-3 flex gap-2"><button onclick="fbSetStatus(\''+id+'\',\''+(x.status==='done'?'new':'done')+'\')" class="btn-ghost text-xs font-bold px-3 py-1.5 rounded-lg">'+(x.status==='done'?'↩ Mở lại':'✅ Đã xử lý')+'</button><button onclick="fbDelete(\''+id+'\')" class="btn-ghost text-xs font-bold px-3 py-1.5 rounded-lg text-red-600"><i class="fa-solid fa-trash"></i> Xóa</button></div></div>';}).join(''):'<div class="glass-card p-8 rounded-2xl text-center text-sm text-ink-500">Chưa có ý kiến nào phù hợp bộ lọc.</div>';
    const flagged=communityPosts.filter(function(p){return p&&(p.reports||[]).length>0&&!p.deleted;}).sort(function(a,b){return (b.reports||[]).length-(a.reports||[]).length;});
    document.getElementById('fbModList').innerHTML=flagged.length?flagged.map(function(p){const id=cmId(p.id);return '<div class="glass-card p-4 rounded-2xl"><div class="text-xs"><b>'+escapeHtml(p.nick||'')+'</b> · '+new Date(p.ts||0).toLocaleString('vi-VN')+' · <span class="text-red-600 font-black">🚩 '+(p.reports||[]).length+' báo cáo</span>'+((p.reports||[]).length>=3?' · <span class="font-black text-amber-600">ĐANG BỊ ẨN</span>':'')+'</div><p class="mt-2 text-sm" style="white-space:pre-wrap;word-break:break-word">'+escapeHtml(p.text||'')+'</p><div class="mt-3 flex gap-2"><button onclick="cmModClear(\''+id+'\')" class="btn-ghost text-xs font-bold px-3 py-1.5 rounded-lg">✅ Giữ lại (xóa báo cáo)</button><button onclick="cmModDelete(\''+id+'\')" class="btn-ghost text-xs font-bold px-3 py-1.5 rounded-lg text-red-600"><i class="fa-solid fa-trash"></i> Xóa hẳn</button></div></div>';}).join(''):'<div class="glass-card p-6 rounded-2xl text-center text-sm text-ink-500">Không có bài nào bị báo cáo. 🎉</div>';
}
async function fbSetStatus(id,st){const x=feedbackList.find(function(f){return cmId(f.id)===id;});if(!x)return;const q=cmClone(x);q.status=st;const ok=await SupabaseDB.commit(function(){return SupabaseDB.upsert('feedback',SupabaseDB.row.extra(q));});if(!ok)return;Object.assign(x,q);renderFeedbackAdmin();}
function fbDelete(id){showConfirm('Xóa ý kiến?','Ý kiến này sẽ bị xóa vĩnh viễn.',async function(){const x=feedbackList.find(function(f){return cmId(f.id)===id;});if(!x)return;const ok=await SupabaseDB.commit(function(){return SupabaseDB.remove('feedback','id',String(x.id));});if(!ok)return;feedbackList=feedbackList.filter(function(f){return f!==x;});renderFeedbackAdmin();showToast('Đã xóa','success');});}
async function cmModClear(id){const p=cmFind(id);if(!p)return;const q=cmClone(p);q.reports=[];if(!(await cmSavePost(q)))return;cmApply(q);renderFeedbackAdmin();showToast('Đã giữ lại bài đăng','success');}
function cmModDelete(id){showConfirm('Xóa bài đăng?','Bài sẽ bị xóa hẳn khỏi cộng đồng.',async function(){const p=cmFind(id);if(!p)return;const ok=await SupabaseDB.commit(function(){return SupabaseDB.remove('community_posts','id',String(p.id));});if(!ok)return;communityPosts=communityPosts.filter(function(x){return x!==p;});cmPersist();renderFeedbackAdmin();showToast('Đã xóa','success');});}

/* ===== PWA · mạng · giao diện ===== */
(function(){
    try{
        const icon='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dc2626"/><stop offset=".5" stop-color="#059669"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><text x="256" y="350" font-size="300" text-anchor="middle">📚</text></svg>');
        const base=location.href.split('#')[0].split('?')[0];
        const m={name:'HỌC VĂN — THCS & THPT Vĩnh Hòa',short_name:'HỌC VĂN',description:'Nền tảng Ngữ văn của Tổ Ngữ Văn trường THCS & THPT Vĩnh Hòa',start_url:base,scope:base.replace(/[^\/]*$/,''),display:'standalone',background_color:'#fdfcf8',theme_color:'#dc2626',lang:'vi',icons:[{src:icon,sizes:'512x512',type:'image/svg+xml',purpose:'any'}]};
        const l=document.createElement('link');l.rel='manifest';l.href=URL.createObjectURL(new Blob([JSON.stringify(m)],{type:'application/manifest+json'}));document.head.appendChild(l);
    }catch(_){}
    window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();hvDeferredInstall=e;const b=document.getElementById('cmInstall');if(b)b.style.display='inline-flex';});
    window.addEventListener('appinstalled',function(){hvDeferredInstall=null;const b=document.getElementById('cmInstall');if(b)b.style.display='none';try{showToast('Đã cài ứng dụng HỌC VĂN 🎉','success');}catch(_){}});
    const bar=document.createElement('div');bar.id='hvOffline';bar.setAttribute('role','status');bar.textContent='📶 Mất kết nối — các thao tác lưu sẽ chưa thực hiện được';document.body.appendChild(bar);
    const upd=function(){bar.classList.toggle('show',navigator.onLine===false);};
    window.addEventListener('offline',upd);
    window.addEventListener('online',function(){upd();try{showToast('Đã kết nối lại — đang đồng bộ…','info');}catch(_){}try{SupabaseDB.syncFromCloud().then(function(){try{SupabaseDB.renderAll();}catch(_){}});SupabaseDB.startRealtime();}catch(_){}});
    upd();
})();
async function hvInstall(){if(!hvDeferredInstall){showToast('Dùng menu trình duyệt → “Thêm vào màn hình chính”','info');return;}hvDeferredInstall.prompt();try{await hvDeferredInstall.userChoice;}catch(_){}hvDeferredInstall=null;const b=document.getElementById('cmInstall');if(b)b.style.display='none';}
function hvApplyThemeColor(){const d=document.documentElement.getAttribute('data-theme')==='dark';const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#0f1420':'#dc2626');}
(function(){
    const _t=toggleTheme;toggleTheme=function(){const r=_t.apply(this,arguments);try{hvApplyThemeColor();}catch(_){}return r;};
    const _l=loadTheme;loadTheme=function(){const r=_l.apply(this,arguments);try{hvApplyThemeColor();}catch(_){}return r;};
    try{hvApplyThemeColor();}catch(_){}
})();

