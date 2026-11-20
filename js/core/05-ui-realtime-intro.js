/* ========== MODAL / TOAST ========== */
function openModalShell(id){const m=document.getElementById(id);if(!m)return;m.classList.remove('hidden');m.setAttribute('data-open','true');m.style.display='flex';document.body.style.overflow='hidden';SoundEngine.play('modal');}
function closeModalShell(id){const m=document.getElementById(id);if(!m)return;m.setAttribute('data-open','false');m.style.display='none';document.body.style.overflow='';setTimeout(()=>{if(m.getAttribute('data-open')==='false')m.classList.add('hidden');},50);SoundEngine.play('modalClose');}
function showToast(msg,type='success'){const t=document.getElementById('toastNotification');const i=document.getElementById('toastIcon');const colors={success:{bg:'linear-gradient(135deg,#10b981,#059669)',icon:'fa-circle-check'},error:{bg:'linear-gradient(135deg,#ef4444,#dc2626)',icon:'fa-circle-exclamation'},info:{bg:'linear-gradient(135deg,#dc2626,#b91c1c)',icon:'fa-circle-info'}};const c=colors[type]||colors.success;t.style.background=c.bg;i.className=`fa-solid ${c.icon} text-white text-base`;document.getElementById('toastMessage').innerText=msg;try{gsap.killTweensOf(t);gsap.fromTo(t,{x:400,opacity:0,scale:.9},{x:0,opacity:1,scale:1,duration:.45,ease:'back.out(1.6)'});setTimeout(()=>gsap.to(t,{x:400,opacity:0,scale:.9,duration:.35}),3200);}catch(e){t.style.transform='translateX(0)';t.style.opacity='1';setTimeout(()=>{t.style.transform='translateX(100%)';t.style.opacity='0';},3200);}}
function showConfirm(title,msg,cb){const m=document.getElementById('confirmModal');document.getElementById('confirmTitle').innerText=title;document.getElementById('confirmMsg').innerText=msg;m.classList.add('show');m._cb=cb;}
function hideConfirm(){document.getElementById('confirmModal').classList.remove('show');}
function confirmLogout(){const m=document.getElementById('confirmModal');m.classList.remove('show');if(m._cb)m._cb();}

/* ========== REALTIME ========== */
let rtChannel=null;try{rtChannel=new BroadcastChannel('hocvan_rt');}catch(e){}
function broadcastRT(type,payload){try{if(rtChannel)rtChannel.postMessage({type,payload,ts:Date.now()});}catch(e){}}
if(rtChannel)rtChannel.onmessage=e=>{if(e.data&&e.data.type)handleRTSignal(e.data.type,e.data.payload);};
function handleRTSignal(type, payload){
    if (type==='portal_taken' && payload) showToast('🎫 Có HS vừa lấy tài khoản','info');
    if (type==='teacher_registered' && payload) showToast('👨‍🏫 GV mới đăng ký: ' + (payload.email||''),'success');
    if (type==='submission_new') { loadLocalCache(); if (isTeacherRole() && !document.getElementById('tab-submissions').classList.contains('hidden')) { renderSubmissionsTable(); showToast('🔔 Bài nộp mới!','success'); } }
    if (type==='grade_saved') { loadLocalCache(); if (isStudentRole()) renderMySubmissionsList(); if (isParentRole() && !document.getElementById('tab-parent-view').classList.contains('hidden')) refreshParentView(); }
    if (type==='discussion_update') { loadDiscussionFromStorage(); if (discTab==='topics') renderDiscussion(); }
    if (type==='live_chat') { loadChatFromStorage(); if (discTab==='livechat') renderLiveChat(); }
    if (type==='student_updated' || type==='class_updated') { loadLocalCache(); if (isTeacherRole() && !document.getElementById('tab-students').classList.contains('hidden')) renderStudentTable(); }
}

/* ========== CANVAS BG ========== */

/* ========== INTRO ANIMATION + FALLBACK ========== */
function runIntroAnimation(){
    const texts=['Đang khởi tạo nền tảng...','Đang tải AI Gemini...','Đang kết nối Cloud...','Đang đồng bộ dữ liệu...','Đang chuẩn bị phòng thi...','Sẵn sàng!'];
    let idx=0;
    const el=document.getElementById('introLoadingText');
    const iv=setInterval(()=>{idx++;if(idx<texts.length&&el&&!window.__hvBootDone)el.textContent=texts[idx];},520);
    const qs=['"Văn học là tấm gương soi chiếu tâm hồn con người"','"Có thực mới vực được đạo" — mỗi ngày một trang văn, một bước tiến bộ','"Đọc sách là cách đi xa nhất mà không cần rời khỏi chỗ ngồi"','"Học, học nữa, học mãi" — V. I. Lênin'];let qi=0;const qel=document.querySelector('.intro-cinematic .quote-box p');
    const qv=setInterval(()=>{if(!qel)return;qi=(qi+1)%qs.length;qel.style.transition='opacity .35s';qel.style.opacity=0;setTimeout(()=>{qel.textContent=qs[qi];qel.style.opacity=1;},350);},1500);setTimeout(()=>clearInterval(qv),3300);
    setTimeout(()=>clearInterval(iv),3000);
    document.querySelectorAll('.intro-stat .num').forEach(num=>{
        const target=parseInt(num.dataset.count)||0;
        const duration=2200;
        const startTime=Date.now();
        const tick=()=>{
            const t=Math.min(1,(Date.now()-startTime)/duration);
            const easeOutQuart=1-Math.pow(1-t,4);
            num.textContent=Math.floor(target*easeOutQuart)+'+';
            if(t<1)requestAnimationFrame(tick);else num.textContent=target+'+';
        };
        setTimeout(tick,1200);
    });
    hvHideIntroWhenReady(3200,4800);
}

/* Fallback cứng — sau 6s dù có lỗi gì cũng ẩn intro */
window.addEventListener('error', function(e) {
    console.error('❌ JS Error:', e.message, '| Line:', e.lineno);
    const s = document.getElementById('introSplash');
    if (s && !s.classList.contains('hide')) s.classList.add('hide');
});
window.addEventListener('unhandledrejection', function(e) { console.error('❌ Promise Rejection:', e.reason); });
setTimeout(function() {
    const s = document.getElementById('introSplash');
    if (s && !s.classList.contains('hide')) {
        console.warn('⚠️ Fallback: ẩn intro sau 6s');
        s.classList.add('hide');
        const lp = document.getElementById('landingPage');
        if (lp) lp.style.display = 'block';
    }
}, 6000);

/* ========== STATS COUNT-UP ========== */
function initStatsCount(){
    const nums=document.querySelectorAll('#landingPage .stat-num[data-count]');
    const io=new IntersectionObserver(entries=>{
        entries.forEach(en=>{
            if(!en.isIntersecting)return;
            const el=en.target;const target=parseInt(el.dataset.count)||0;
            const start=Date.now();const dur=1800;
            const tick=()=>{const t=Math.min(1,(Date.now()-start)/dur);const ease=1-Math.pow(1-t,4);el.textContent=Math.floor(target*ease).toLocaleString('vi-VN')+'+';if(t<1)requestAnimationFrame(tick);};
            tick();io.unobserve(el);
        });
    },{threshold:0.4});
    nums.forEach(n=>io.observe(n));
}

/* ========== URL PARAMS (Portal link) ========== */
function handleUrlParams(){
    const params = new URLSearchParams(location.search);
    if (params.get('portal') === '1') {
        showPortalPage();
        const clsCode = params.get('class');
        const hsId = params.get('hs');
        if (clsCode) {
            document.getElementById('portalClassCode').value = clsCode;
            setTimeout(() => {
                portalLookup();
                if (hsId) {
                    setTimeout(() => {
                        const cls = getClassByCode(clsCode);
                        if (cls) portalChoose(cls.id, hsId);
                    }, 200);
                }
            }, 300);
        }
    }
}

/* ========== SIDEBAR ========== */
function toggleSidebar(){const sb=document.getElementById('appSidebar');if(!sb)return;sb.classList.toggle('collapsed');safeSetItem('hv_sidebar_collapsed',sb.classList.contains('collapsed')?'1':'0');SoundEngine.play('tab');}
function loadSidebarState(){if(safeGetItem('hv_sidebar_collapsed')==='1'){const sb=document.getElementById('appSidebar');if(sb)sb.classList.add('collapsed');}}
