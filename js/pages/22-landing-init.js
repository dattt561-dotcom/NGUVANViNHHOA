/* ========== LANDING FEATURES + FAQ + ROLE DETAILS ========== */
const FEATURE_DETAILS={assign:{icon:'fa-book-open',title:'Giao bài tập + Đáp án',desc:'GV đưa đáp án mẫu, AI chấm theo đáp án đó.'},editor:{icon:'fa-pen-fancy',title:'Viết tay chống gian lận',desc:'Chặn paste/copy/drop. Revert nếu chèn >5 ký tự.'},ai:{icon:'fa-wand-magic-sparkles',title:'AI chấm theo đáp án GV',desc:'Gemini + Rubric 8 tiêu chí dựa trên đáp án.'},khbd:{icon:'fa-book-bookmark',title:'Kế hoạch bài dạy',desc:'Chuẩn Bộ GD&ĐT. Xuất PDF. AI gợi ý hoạt động.'},cloud:{icon:'fa-cloud',title:'Cloud Database',desc:'Supabase realtime sync.'},voice:{icon:'fa-microphone',title:'Luyện đọc diễn cảm',desc:'Ghi âm, sóng âm, tải file .webm.'},exam:{icon:'fa-hourglass-half',title:'Phòng thi Anti-cheat',desc:'Chặn copy/paste, vi phạm 3 lần tự nộp.'},macro:{icon:'fa-chart-line',title:'Báo cáo vĩ mô',desc:'So sánh khối, lớp, phổ điểm.'},hocba:{icon:'fa-scroll',title:'Học bạ số',desc:'Xuất PDF chuẩn Thông tư 22/2021.'},mindmap:{icon:'fa-diagram-project',title:'Sơ đồ tư duy',desc:'Mermaid tương tác.'},flashcard:{icon:'fa-clone',title:'Flashcard 3D',desc:'Thẻ lật 3D, lặp lại ngắt quãng.'},kahoot:{icon:'fa-bolt',title:'Đấu trường',desc:'Kahoot-style với âm thanh.'},gdpt:{icon:'fa-radar',title:'Năng lực GDPT 2018',desc:'Radar 5 năng lực cốt lõi.'}};
function openFeatureDetail(k){const f=FEATURE_DETAILS[k];if(!f)return;showToast(f.title+': '+f.desc,'info');}
function openRoleDetail(r){showToast({admin:'Admin: toàn quyền, báo cáo vĩ mô, quản lý GV/HS',teacher:'GV: giao bài + đáp án, chấm điểm AI, KHBD, báo cáo PH',student:'HS: làm bài, luyện đọc, hỏi AI, huy chương',parent:'PH: xem điểm con realtime, tải báo cáo PDF'}[r]||r,'info');}
const FAQ_DATA=[{q:'Gemini AI dùng thế nào?',a:'Vào Cài đặt → Cấu hình AI → dán API Key từ aistudio.google.com/app/apikey.'},{q:'AI chấm có dựa theo đáp án GV không?',a:'CÓ. GV nhập đáp án mẫu + hướng dẫn chấm trong form Giao bài. AI chỉ chấm dựa trên đáp án đó, không tự suy diễn.'},{q:'Link HS lấy tài khoản ở đâu?',a:'Vào tab "Bài nộp" → nút "Xuất TK". Copy link cho HS. HS mở link → chọn tên → thấy email/mk.'},{q:'Chống paste hoạt động thế nào?',a:'3 lớp bảo vệ: blockpaste sự kiện, beforeinput, và monitor nội dung — nếu chèn >5 ký tự 1 lần sẽ bị revert.'},{q:'Supabase là gì?',a:'Cloud database lưu bài nộp + điểm. Đồng bộ realtime giữa máy GV/HS.'},{q:'Tài khoản mặc định?',a:'Admin: tongvan@vinhhoa.edu.vn / 123456 / mã GV bogiaoduc. HS: dùng email + MK + mã lớp do GV cấp.'}];
function renderFAQ(){const c=document.getElementById('faqContainer');if(!c)return;c.innerHTML=FAQ_DATA.map((f,i)=>`<div class="glass-card rounded-2xl overflow-hidden"><button onclick="toggleFAQ(${i})" class="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-paper-50"><span class="font-bold text-sm">${escapeHtml(f.q)}</span><i id="faq-icon-${i}" class="fa-solid fa-chevron-down text-ink-400 text-xs"></i></button><div id="faq-ans-${i}" class="hidden px-4 pb-4 text-xs text-ink-600 leading-relaxed border-t border-ink-100 pt-3">${escapeHtml(f.a)}</div></div>`).join('');}
function toggleFAQ(i){const a=document.getElementById('faq-ans-'+i);const ic=document.getElementById('faq-icon-'+i);const o=!a.classList.contains('hidden');document.querySelectorAll('[id^="faq-ans-"]').forEach(el=>el.classList.add('hidden'));document.querySelectorAll('[id^="faq-icon-"]').forEach(el=>el.style.transform='');if(!o){a.classList.remove('hidden');ic.style.transform='rotate(180deg)';}}
function renderLandingFeatures(){const g=document.getElementById('landingFeaturesGrid');if(!g)return;const items=[{key:'assign',icon:'fa-book-open',bg:'linear-gradient(135deg,#fef2f2,#fecaca)',color:'#dc2626',title:'Giao bài + Đáp án',desc:'GV đưa đáp án mẫu — AI chấm theo đáp án.'},{key:'editor',icon:'fa-pen-fancy',bg:'linear-gradient(135deg,#ecfdf5,#d1fae5)',color:'#059669',title:'Viết tay chống gian lận',desc:'Chặn paste/copy/drop + revert khi chèn >5 ký tự.'},{key:'ai',icon:'fa-wand-magic-sparkles',bg:'linear-gradient(135deg,#fef3c7,#fde68a)',color:'#d97706',title:'AI chấm theo đáp án GV',desc:'Gemini chấm dựa 100% trên đáp án GV đưa.'},{key:'khbd',icon:'fa-book-bookmark',bg:'linear-gradient(135deg,#eff6ff,#dbeafe)',color:'#2563eb',title:'Kế hoạch bài dạy',desc:'Chuẩn Bộ GD&ĐT + AI gợi ý.'},{key:'cloud',icon:'fa-cloud',bg:'linear-gradient(135deg,#dbeafe,#bfdbfe)',color:'#1d4ed8',title:'Cloud Realtime',desc:'Supabase đồng bộ tức thời.'},{key:'voice',icon:'fa-microphone',bg:'linear-gradient(135deg,#fef2f2,#fee2e2)',color:'#dc2626',title:'Luyện đọc + Tải file',desc:'Ghi âm, sóng âm, tải file .webm.'},{key:'exam',icon:'fa-hourglass-half',bg:'linear-gradient(135deg,#fee2e2,#fecaca)',color:'#b91c1c',title:'Phòng thi Anti-cheat',desc:'3 lớp bảo vệ, vi phạm 3 lần tự nộp.'},{key:'macro',icon:'fa-chart-line',bg:'linear-gradient(135deg,#ecfdf5,#a7f3d0)',color:'#047857',title:'Báo cáo vĩ mô',desc:'So sánh khối, lớp, phổ điểm.'},{key:'hocba',icon:'fa-scroll',bg:'linear-gradient(135deg,#eff6ff,#bfdbfe)',color:'#1e40af',title:'Học bạ số',desc:'Xuất PDF chuẩn Thông tư 22.'},{key:'mindmap',icon:'fa-diagram-project',bg:'linear-gradient(135deg,#dbeafe,#bfdbfe)',color:'#2563eb',title:'Sơ đồ tư duy',desc:'Mermaid tương tác.'},{key:'flashcard',icon:'fa-clone',bg:'linear-gradient(135deg,#fef2f2,#fecaca)',color:'#dc2626',title:'Flashcard 3D',desc:'Thẻ lật 3D, lặp lại ngắt quãng.'},{key:'kahoot',icon:'fa-bolt',bg:'linear-gradient(135deg,#fef3c7,#fde68a)',color:'#d97706',title:'Đấu trường',desc:'Kahoot-style với âm thanh.'}];g.innerHTML=items.map(it=>`<div class="feature-card-v2" onclick="openFeatureDetail('${it.key}')"><div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style="background:${it.bg};color:${it.color}"><i class="fa-solid ${it.icon}"></i></div><h3 class="font-black text-base mt-4">${it.title}</h3><p class="text-xs text-ink-500 mt-2 leading-relaxed">${it.desc}</p><div class="mt-4 pt-3 border-t border-ink-100 flex justify-between text-[11px] font-bold" style="color:${it.color}"><span>Xem chi tiết</span><i class="fa-solid fa-arrow-right"></i></div></div>`).join('');}
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const h=a.getAttribute('href');if(h==='#'||h.length<2)return;const t=document.querySelector(h);if(!t)return;e.preventDefault();t.scrollIntoView({behavior:'smooth'});});

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded',async()=>{
    console.log('🚀 HỌC VĂN 4.8 khởi động...');
    try { loadTheme(); } catch(e) { console.error('loadTheme:', e); }
    try { await loadLocalData(); } catch(e) { console.error('loadLocalData:', e); }
    try { loadDiscussionFromStorage(); } catch(e) {}
    try { loadChatFromStorage(); } catch(e) {}
    try { SoundEngine.loadState(); updateSoundUI(); updateMusicUI(); } catch(e) {}
    try { initBgCanvas(); } catch(e) { console.error('bgCanvas:', e); }
    try { initIntroCanvas(); } catch(e) { console.error('introCanvas:', e); }
    try {
        const reg=getTeacherRegistry();
        let c=false;
        Object.keys(DEFAULT_TEACHERS).forEach(k=>{if(!reg[k]){reg[k]={...DEFAULT_TEACHERS[k]};c=true;}});
        if(c)saveTeacherRegistry(reg);
        classesData.forEach(cl=>{if(!cl.code)cl.code='LOP-'+cl.name.toUpperCase().replace(/\s/g,'')+'-'+randCode(4);if(!cl.grade)cl.grade=parseInt(cl.name.match(/\d+/)?.[0])||10;});
        saveLocalData();
    } catch(e) { console.error('init data:', e); }
    try { renderLandingFeatures(); } catch(e) {}
    try { renderFAQ(); } catch(e) {}
    try { initStatsCount(); } catch(e) {}
    try { checkAuth(); } catch(e) { console.error('checkAuth:', e); }
    try { renderRubricSliders(); } catch(e) {}
    try { switchLibTab('exam'); } catch(e) {}
    try { loadSidebarState(); } catch(e) {}
    try { if(!SupabaseDB.client) SupabaseDB.init(); SupabaseDB.startRealtime(); } catch(e) {}
    try { refreshGeminiUI(); } catch(e) {}
    try { refreshSupabaseUI(); } catch(e) {}
    try { runIntroAnimation(); } catch(e) { console.error('intro:', e); }
    setTimeout(handleUrlParams, 3400);
    window.addEventListener('online',()=>{const s=document.getElementById('pwaStatus');if(s){s.classList.remove('offline');s.classList.add('online');document.getElementById('pwaStatusText').innerText='Online';}});
    window.addEventListener('offline',()=>{const s=document.getElementById('pwaStatus');if(s){s.classList.add('offline');document.getElementById('pwaStatusText').innerText='Offline';}});
    if (!new URLSearchParams(location.search).get('portal')) {
        const pp = document.getElementById('portalPage');
        if (pp) pp.style.display = 'none';
    }
    setTimeout(()=>{ if(safeGetItem('hv_music_enabled')!=='0') playBgMusic(); }, 3500);
    console.log('✅ HỌC VĂN 4.8 đã sẵn sàng!');
});

/* ===== Thanh điều hướng dưới (mobile): kéo được + nảy icon ===== */
function syncMobileNavActive(id){
    const mob=document.getElementById('mobileNav');if(!mob)return;let cur=id;
    if(!cur){const a=document.querySelector('#sidebarNav .nav-btn.bg-indigo-600');cur=a?a.id.replace(/^nav-/,''):'';}
    mob.querySelectorAll('.mnav-btn').forEach(function(b){
        const on=b.dataset.tab===cur;
        if(on&&!b.classList.contains('active')){b.classList.add('active');try{b.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});}catch(_){}}
        else if(!on){b.classList.remove('active');}
    });
}
function buildMobileNav(){
    const mob=document.getElementById('mobileNav'),nav=document.getElementById('sidebarNav');if(!mob||!nav)return;
    const btns=nav.querySelectorAll('.nav-btn');if(!btns.length)return;
    mob.innerHTML='';
    btns.forEach(function(b){
        const id=(b.id||'').replace(/^nav-/,'');const ic=b.querySelector('i');const lb=b.querySelector('span');if(!id||!ic)return;
        const x=document.createElement('button');x.type='button';x.className='mnav-btn';x.dataset.tab=id;
        const label=lb?lb.textContent:id;x.setAttribute('aria-label',label);
        x.innerHTML='<i class="'+ic.className.replace(/\bw-5\b|\btext-sm\b|\btext-center\b/g,'')+'"></i><span>'+escapeHtml(label)+'</span>';
        x.onclick=function(){try{if(navigator.vibrate)navigator.vibrate(8);}catch(_){}switchTab(id);};
        mob.appendChild(x);
    });
    syncMobileNavActive();
}
(function(){
    const _setup=setupNavigationByRole;
    setupNavigationByRole=function(){const r=_setup.apply(this,arguments);try{buildMobileNav();}catch(e){console.warn(e);}return r;};
    const _sw=switchTab;
    switchTab=function(id){window.__hvTab=id;const r=_sw.apply(this,arguments);try{syncMobileNavActive(id);}catch(_){}return r;};
})();

