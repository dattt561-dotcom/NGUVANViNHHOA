/* =====================================================================
   v4.4 · HIỆU ỨNG · TRANG CHỦ · INTRO · TỐC ĐỘ CLOUD
   ===================================================================== */
const HV_TU=[['So sánh','Đối chiếu hai sự vật có nét tương đồng.','“Trẻ em như búp trên cành” (Hồ Chí Minh)'],['Ẩn dụ','Gọi tên sự vật này bằng tên sự vật khác có nét tương đồng (ngầm).','“Thuyền về có nhớ bến chăng / Bến thì một dạ khăng khăng đợi thuyền” (ca dao)'],['Nhân hóa','Gán đặc điểm, hoạt động của con người cho vật.','“Tre xung phong vào xe tăng, đại bác…” (Thép Mới)'],['Hoán dụ','Gọi sự vật bằng tên của sự vật có quan hệ gần gũi.','“Áo nâu liền với áo xanh / Nông thôn cùng với thị thành đứng lên” (Tố Hữu)'],['Điệp ngữ','Lặp từ/cụm từ để nhấn mạnh, tạo nhịp điệu.','“Còn trời còn nước còn non / Còn cô bán rượu anh còn say sưa” (Nguyễn Công Trứ)'],['Nói quá','Phóng đại mức độ để nhấn mạnh, gây ấn tượng.','“Lỗ mũi mười tám gánh lông / Chồng yêu chồng bảo râu rồng trời cho” (ca dao)'],['Nói giảm nói tránh','Diễn đạt tế nhị để giảm nhẹ nỗi đau, sự nặng nề.','“Bác đã đi rồi sao Bác ơi!” (Tố Hữu)'],['Câu hỏi tu từ','Hỏi nhưng không cần trả lời, nhằm nhấn mạnh cảm xúc, ý nghĩ.','“Ai làm cho bể kia đầy / Cho ao kia cạn cho gầy cò con” (ca dao)']];
const HV_MARQ=['🤖 AI chấm theo đáp án giáo viên','📝 Giao bài từ file Word &amp; ảnh','🛡️ Phòng thi chống gian lận','☁️ Đồng bộ Cloud thời gian thực','💬 Diễn đàn học sinh','📹 Học online qua Google Meet','📚 Giáo án KHBD','🏆 Đấu trường &amp; Huy chương','👨‍👩‍👧 Cổng phụ huynh','🌙 Chế độ sáng / tối','📲 Cài như ứng dụng','⭐ Đánh giá &amp; báo lỗi','⚖️ Lịch sử điểm minh bạch'];
const HV_QUIZ=[
{q:'Tác giả của “Truyện Kiều” là ai?',o:['Nguyễn Trãi','Nguyễn Du','Nguyễn Khuyến','Hồ Xuân Hương'],a:1,e:'Nguyễn Du (1765–1820) viết Truyện Kiều bằng thể lục bát.'},
{q:'“Trẻ em như búp trên cành” dùng biện pháp tu từ nào?',o:['Nhân hóa','Hoán dụ','So sánh','Nói quá'],a:2,e:'Có từ so sánh “như” nối hai sự vật có nét tương đồng.'},
{q:'“Lão Hạc” là tác phẩm của nhà văn nào?',o:['Nam Cao','Ngô Tất Tố','Nguyên Hồng','Kim Lân'],a:0,e:'Nam Cao viết “Lão Hạc” — truyện ngắn hiện thực nổi tiếng.'},
{q:'Thể thơ lục bát gồm các câu có số chữ thế nào?',o:['5 và 7 chữ','6 và 8 chữ','7 và 7 chữ','4 và 4 chữ'],a:1,e:'Câu 6 chữ (lục) xen câu 8 chữ (bát).'},
{q:'“Bình Ngô đại cáo” do ai viết?',o:['Lý Thường Kiệt','Trần Hưng Đạo','Nguyễn Trãi','Lê Lợi'],a:2,e:'Nguyễn Trãi soạn năm 1428 sau chiến thắng quân Minh.'},
{q:'“Chiếc thuyền ngoài xa” là truyện ngắn của ai?',o:['Nguyễn Minh Châu','Nguyễn Thi','Tô Hoài','Vũ Trọng Phụng'],a:0,e:'Nguyễn Minh Châu — tác phẩm tiêu biểu thời kỳ đổi mới.'}
];
let hvQi=0,hvQs=0,hvQlock=false,hvSyncN=0;
function hvSyncBar(on){const b=document.getElementById('hvSyncBar');if(!b)return;hvSyncN=Math.max(0,hvSyncN+(on?1:-1));b.classList.toggle('run',hvSyncN>0);}
function hvQuizRender(){
    const box=document.getElementById('hvQuiz');if(!box)return;
    if(hvQi>=HV_QUIZ.length){
        const pct=Math.round(hvQs/HV_QUIZ.length*100);const msg=pct===100?'Xuất sắc! Em là “thánh Văn” rồi 🏆':pct>=60?'Giỏi lắm! Ôn thêm chút nữa là hoàn hảo 💪':'Đừng lo, đọc phần Tham khảo rồi thử lại nhé 📚';
        box.innerHTML='<div class="hv-qbar"><span style="width:100%"></span></div><div class="hv-score"><b>'+hvQs+'/'+HV_QUIZ.length+'</b><p style="font-weight:800;margin-top:6px">'+msg+'</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="cm-go" onclick="hvQuizReset()">🔄 Chơi lại</button><button class="cm-btn" onclick="showCommunityPage(\'ref\')">📚 Xem tham khảo</button></div>';
        if(pct>=60){try{confetti({particleCount:90,spread:80,origin:{y:.6}});}catch(_){}}
        return;
    }
    const q=HV_QUIZ[hvQi];
    box.innerHTML='<div class="hv-qbar"><span style="width:'+(hvQi/HV_QUIZ.length*100)+'%"></span></div><p class="hv-qn">Câu '+(hvQi+1)+' / '+HV_QUIZ.length+'</p><h3 class="hv-qq">'+q.q+'</h3><div class="hv-qopts">'+q.o.map(function(o,i){return '<button class="hv-qo" onclick="hvQuizPick('+i+')">'+o+'</button>';}).join('')+'</div><p class="hv-qe" id="hvQe"></p>';
}
function hvQuizPick(i){
    if(hvQlock)return;hvQlock=true;const q=HV_QUIZ[hvQi];
    document.querySelectorAll('#hvQuiz .hv-qo').forEach(function(b,j){b.disabled=true;if(j===q.a)b.classList.add('ok');else if(j===i)b.classList.add('bad');});
    if(i===q.a){hvQs++;try{confetti({particleCount:30,spread:50,origin:{y:.7}});}catch(_){}}
    const e=document.getElementById('hvQe');if(e)e.textContent=(i===q.a?'✅ Chính xác! ':'❌ Chưa đúng. ')+q.e;
    setTimeout(function(){hvQi++;hvQlock=false;hvQuizRender();},2000);
}
function hvQuizReset(){hvQi=0;hvQs=0;hvQlock=false;hvQuizRender();}
function hvRenderTu(){
    const g=document.getElementById('hvTuGrid');if(!g)return;
    const pal=[['#dc2626','#f97316'],['#059669','#14b8a6'],['#2563eb','#6366f1'],['#7c3aed','#db2777'],['#d97706','#eab308'],['#0891b2','#2563eb'],['#be123c','#dc2626'],['#4f46e5','#7c3aed']];
    const ic=['fa-scale-balanced','fa-masks-theater','fa-person-walking','fa-hand-pointer','fa-repeat','fa-mountain','fa-feather','fa-circle-question'];
    g.innerHTML=HV_TU.map(function(t,i){const c=pal[i%pal.length];return '<div class="hv-flip" onclick="this.classList.toggle(\'flip\')" tabindex="0" onkeydown="if(event.key===\'Enter\')this.classList.toggle(\'flip\')"><div class="hv-flip-in"><div class="hv-face hv-front" style="--c1:'+c[0]+';--c2:'+c[1]+'"><i class="fa-solid '+ic[i%ic.length]+'"></i>'+t[0]+'</div><div class="hv-face hv-back"><b>'+t[0]+'</b>'+t[1]+'<i class="ex">'+t[2]+'</i></div></div></div>';}).join('');
}
function hvRenderMarquee(){const t=document.getElementById('hvTrack');if(!t)return;const html=HV_MARQ.map(function(x){return '<span class="hv-chip">'+x+'</span>';}).join('');t.innerHTML=html+html;}

/* ----- Hiệu ứng toàn cục ----- */
(function(){
    const bar=document.createElement('div');bar.id='hvSyncBar';document.body.appendChild(bar);
    const fine=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
    let raf=0,last=null;
    document.addEventListener('pointermove',function(e){
        last=e;if(raf)return;
        raf=requestAnimationFrame(function(){
            raf=0;const ev=last;const t=ev.target;if(!t||!t.closest)return;
            const card=t.closest('.glass-card,.cm-card,.feature-card-v2,.cm-acc');
            if(card){const r=card.getBoundingClientRect();card.style.setProperty('--mx',(ev.clientX-r.left)+'px');card.style.setProperty('--my',(ev.clientY-r.top)+'px');}
            if(fine){const tl=t.closest('.feature-card-v2,.hv-trust-card');if(tl){const r=tl.getBoundingClientRect();const px=(ev.clientX-r.left)/r.width-.5,py=(ev.clientY-r.top)/r.height-.5;tl.style.transform='translateY(-8px) scale(1.02) perspective(900px) rotateX('+(-py*8).toFixed(2)+'deg) rotateY('+(px*10).toFixed(2)+'deg)';hvTilted.add(tl);}}
        });
    },{passive:true});
    document.addEventListener('pointerout',function(e){const t=e.target&&e.target.closest?e.target.closest('.feature-card-v2,.hv-trust-card'):null;if(t&&hvTilted.has(t)&&!t.contains(e.relatedTarget)){t.style.transform='';hvTilted.delete(t);}},true);
    document.addEventListener('click',function(e){
        const b=e.target.closest&&e.target.closest('.btn-neon,.btn-ghost,.cm-go,.cm-btn,.cm-tab,.cm-chip,.hv-cm-btn');if(!b)return;
        const cs=getComputedStyle(b);if(cs.position==='static')b.style.position='relative';b.style.overflow='hidden';
        const r=b.getBoundingClientRect();const s=Math.max(r.width,r.height)*2;
        const d=hvPool('hv-ripple');d.style.width=d.style.height=s+'px';d.style.left=(e.clientX-r.left-s/2)+'px';d.style.top=(e.clientY-r.top-s/2)+'px';b.appendChild(d);setTimeout(function(){hvPoolRel(d);},700);
        if(b.matches('.btn-neon,.cm-go,.hv-cm-btn')){
            const em=['✨','⭐','📖','✍️','💡','🌟'];
            for(let i=0;i<9;i++){const p=hvPool('hv-burst');p.textContent=em[i%em.length];p.style.left=e.clientX+'px';p.style.top=e.clientY+'px';const a=Math.random()*Math.PI*2,dist=40+Math.random()*60;p.style.setProperty('--dx',Math.cos(a)*dist+'px');p.style.setProperty('--dy',Math.sin(a)*dist-20+'px');p.style.setProperty('--rot',(Math.random()*180-90)+'deg');document.body.appendChild(p);setTimeout(function(){hvPoolRel(p);},1000);}
        }
    },true);
    // cuộn hiện dần cho các mục mới
    if('IntersectionObserver' in window){
        const io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('hv-in');io.unobserve(en.target);}});},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
        document.querySelectorAll('.hv-reveal').forEach(function(el,i){el.classList.add('hv-pre');el.style.setProperty('--d',((i%4)*0.08)+'s');io.observe(el);});
    }
    // từ khóa đổi liên tục ở hero
    const W=['hỏi bài','nộp bài','luyện đề','đọc hiểu','viết văn','trò chuyện cùng bạn'];let wi=0;
    setInterval(function(){const el=document.getElementById('hvRotWord');if(!el)return;el.classList.add('out');setTimeout(function(){wi=(wi+1)%W.length;el.textContent=W[wi];el.classList.remove('out');},320);},2400);
    hvRenderMarquee();hvRenderTu();hvQuizReset();
    try{cmUpdateStats();const f=document.getElementById('hvCmFaq');if(f)f.textContent=CM_FAQ.length;}catch(_){}
})();

/* ----- Tốc độ Cloud: bắt đầu đồng bộ ngay khi script chạy, song song với việc dựng giao diện ----- */
(function(){
    try{
        if(typeof SupabaseDB==='undefined')return;
        if(!SupabaseDB.client)SupabaseDB.init();
        if(SupabaseDB.online&&navigator.onLine!==false){
            window.__hvBootStart=performance.now();
            SupabaseDB._bootP=SupabaseDB.syncFromCloud().then(function(ok){
                window.__hvBootMs=Math.round(performance.now()-window.__hvBootStart);window.__hvBootDone=true;
                const el=document.getElementById('introLoadingText');const sp=document.getElementById('introSplash');
                if(el&&sp&&!sp.classList.contains('hide'))el.textContent=ok?('Đã đồng bộ Cloud ✓ '+window.__hvBootMs+' ms'):'Chế độ ngoại tuyến — dùng dữ liệu đã lưu';
                try{cmUpdateStats();}catch(_){}
                return ok;
            });
        }
    }catch(e){console.warn('boot sync',e);}
})();

