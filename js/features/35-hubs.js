/* =====================================================================
   v4.6 · CHIA NHỎ CHỨC NĂNG: Trang chủ → Nhóm → Ô chức năng
   ===================================================================== */
let HV_HUBS=[],hvHubQ='';
const HV_HUB_COLORS=[['#dc2626','#f97316'],['#059669','#14b8a6'],['#2563eb','#6366f1'],['#7c3aed','#db2777'],['#d97706','#eab308'],['#0891b2','#2563eb']];
const HV_HUB_DESC={'Dạy học':'Soạn, giao và chấm bài cho học sinh','Lớp & HS':'Quản lý lớp, học sinh, điểm số và học bạ','Tương tác':'Trao đổi, học online và khen thưởng','Hệ thống':'Công cụ, lịch sử, nhập file và cài đặt','Tổng quan':'Bức tranh toàn trường bằng số liệu','Quản lý':'Giáo viên, học sinh, lớp, lịch và học liệu','Học vụ':'Lịch sử điểm và học bạ số','Học tập':'Làm bài, ôn kiến thức và đọc tài liệu','Luyện tập':'Thi đua, thi thử và rèn kỹ năng','Cá nhân':'Năng lực và thành tích của riêng em','Kết nối':'Hỏi thầy cô, trò chuyện và nhờ trợ lý AI','Chức năng':'Các chức năng của tài khoản'};
/* mô tả: d = chung, t = giáo viên, s = học sinh, a = admin; mỗi mục [mô tả, "Dùng khi…"] */
const HV_INFO={
assignments:{t:['Giao bài tập mới cho lớp: nhập đề, thêm file Word/ảnh, nhờ AI tạo câu hỏi, đặt hạn nộp.','Dùng khi: cần giao bài mới hoặc sửa đề đã giao'],s:['Xem bài thầy cô giao: đề, hạn nộp, file/ảnh đính kèm.','Dùng khi: muốn biết hôm nay có bài gì cần làm']},
submissions:{d:['Xem bài học sinh đã nộp, chấm điểm, viết nhận xét; xuất tài khoản lớp (Xuất TK).','Dùng khi: cần chấm bài hoặc xem ai đã nộp']},
rubric:{d:['Chấm theo tiêu chí (Rubric) cho từng học sinh để đánh giá năng lực chi tiết.','Dùng khi: muốn chấm kỹ theo từng tiêu chí']},
khbd:{d:['Soạn và lưu kế hoạch bài dạy (giáo án) của thầy/cô.','Dùng khi: chuẩn bị tiết dạy mới']},
materials:{t:['Đăng bài giảng, tiết dạy online, tác phẩm, video, hình ảnh minh họa cho học sinh tham khảo.','Dùng khi: muốn chia sẻ tài liệu cho lớp'],s:['Học liệu thầy cô đăng: bài giảng, tiết dạy online, tác phẩm, video, hình ảnh.','Dùng khi: cần tài liệu để học hoặc xem lại bài'],a:['Xem và quản lý học liệu mà các giáo viên đã đăng.','Dùng khi: kiểm tra học liệu của trường']},
classes:{t:['Tạo lớp, xem mã lớp, xem danh sách và tài khoản học sinh từng lớp.','Dùng khi: tạo lớp mới hoặc thêm học sinh'],a:['Xem và quản lý tất cả các lớp trong trường.','Dùng khi: cần kiểm tra lớp của giáo viên']},
students:{t:['Sổ điểm & tài khoản học sinh: nhập điểm TX/GK/CK, xuất tài khoản theo lớp, xóa danh sách lớp.','Dùng khi: nhập điểm hoặc phát tài khoản cho lớp'],a:['Danh sách học sinh toàn trường theo lớp.','Dùng khi: tra cứu hoặc chỉnh thông tin học sinh']},
dashboard:{d:['Thống kê điểm số và tiến độ nộp bài theo lớp bằng biểu đồ.','Dùng khi: muốn nắm tình hình cả lớp']},
hocba:{d:['Học bạ số: tổng hợp kết quả và nhận xét của từng học sinh.','Dùng khi: cần xem hoặc in kết quả tổng hợp']},
discussion:{d:['Trao đổi theo lớp: chủ đề thảo luận và chat thầy trò (có thu hồi, lọc từ ngữ xúc phạm).','Dùng khi: muốn hỏi, trả lời hoặc thảo luận']},
call:{t:['Học online: tạo phòng Google Meet và chia sẻ link cho cả lớp.','Dùng khi: dạy trực tuyến hoặc họp lớp'],s:['Học online: bấm để vào phòng Google Meet mà thầy cô đã mở.','Dùng khi: có tiết học trực tuyến'],a:['Phòng họp trực tuyến qua Google Meet.','Dùng khi: họp tổ hoặc dạy online']},
rewards:{t:['Huy hiệu & phụ huynh: tặng khen thưởng cho học sinh và theo dõi mã phụ huynh.','Dùng khi: muốn khen thưởng, động viên học sinh'],s:['Huy chương và thành tích em đã đạt được.','Dùng khi: muốn xem mình đã được khen những gì']},
advanced:{d:['Các công cụ nâng cao hỗ trợ giáo viên.','Dùng khi: cần tiện ích ngoài các chức năng thường dùng']},
history:{d:['Lịch sử điểm: ai sửa, lúc nào, giá trị cũ – mới và lý do — để điểm số minh bạch.','Dùng khi: cần kiểm tra việc thay đổi điểm']},
import:{d:['Nhập danh sách học sinh từ file Excel; tài khoản được tạo tự động.','Dùng khi: thêm nhiều học sinh cùng lúc']},
settings:{d:['Thông tin tài khoản, âm thanh, đổi mật khẩu, cấu hình AI và giao diện.','Dùng khi: muốn đổi thông tin hoặc cài đặt']},
overview:{d:['Dashboard toàn trường: số lớp, học sinh, bài nộp và điểm trung bình.','Dùng khi: cần cái nhìn tổng quát']},
macro:{d:['Báo cáo vĩ mô: so sánh kết quả giữa các lớp và giáo viên.','Dùng khi: cần báo cáo cho nhà trường']},
teachers:{d:['Quản lý tài khoản giáo viên: thêm, sửa tên, xóa.','Dùng khi: có giáo viên mới hoặc cần chỉnh thông tin']},
schedule:{d:['Lịch trình: sự kiện, kiểm tra, hạn chót của trường.','Dùng khi: cần xem hoặc thêm lịch']},
feedback:{d:['Đánh giá & báo lỗi do người dùng gửi; kiểm duyệt bài cộng đồng bị báo cáo.','Dùng khi: muốn biết lỗi ở đâu để sửa']},
backup:{d:['Sao lưu và khôi phục dữ liệu hệ thống.','Dùng khi: muốn lưu bản dự phòng hoặc khôi phục']},
submit:{d:['Viết hoặc dán bài làm rồi nộp cho giáo viên. Thấy thông báo thành công mới là đã nộp.','Dùng khi: đã làm xong và muốn nộp bài']},
mindmap:{d:['Vẽ sơ đồ tư duy để hệ thống kiến thức tác phẩm.','Dùng khi: ôn bài hoặc lập dàn ý']},
flashcards:{d:['Thẻ ghi nhớ 3D để ôn tác giả, tác phẩm, từ ngữ.','Dùng khi: cần học thuộc nhanh']},
creative:{d:['Gợi ý và luyện viết mở bài sáng tạo.','Dùng khi: bí ý khi viết bài']},
library:{d:['Thư viện tác phẩm và tài liệu tham khảo có sẵn.','Dùng khi: muốn đọc thêm tác phẩm']},
kahoot:{d:['Đấu trường: thi đua trả lời câu hỏi và xem bảng xếp hạng.','Dùng khi: muốn thi đua vui cùng bạn']},
examroom:{d:['Phòng thi thử tính giờ, có giám sát chống gian lận.','Dùng khi: muốn thử sức như thi thật']},
voice:{d:['Luyện đọc diễn cảm bằng giọng nói.','Dùng khi: luyện đọc thơ, văn']},
annotation:{d:['Bình giảng: ghi chú, đánh dấu và phân tích đoạn văn.','Dùng khi: phân tích đoạn trích']},
trends:{d:['Xu hướng đề: thống kê dạng đề thường gặp.','Dùng khi: định hướng ôn thi']},
gdpt:{d:['Năng lực GDPT: biểu đồ radar năng lực của em.','Dùng khi: muốn biết điểm mạnh, điểm yếu']},
companion:{d:['Trợ lý AI: gợi ý ý tưởng, soát lỗi, chấm thử, hỏi đáp (cần cấu hình AI).','Dùng khi: cần người hỗ trợ khi tự học']},
'parent-view':{d:['Theo dõi tiến độ học tập của con.','Dùng khi: muốn xem bài tập và kết quả của con']}
};
const HV_QUICK={
t:[['Tạo lớp','classes'],['Thêm học sinh','import'],['Giao bài','assignments'],['Chấm bài','submissions'],['Xem thống kê','dashboard']],
s:[['Xem bài tập','assignments'],['Nộp bài','submit'],['Luyện tập','kahoot'],['Hỏi thầy cô','discussion']],
a:[['Dashboard','overview'],['Giáo viên','teachers'],['Học sinh','students'],['Đánh giá','feedback']],
p:[['Theo dõi con','parent-view']]
};
const HV_STAT={
assignments:function(){const v=getVisibleClassIds();return assignmentsData.filter(function(a){return v.indexOf(a.classId)!==-1&&(!a.deadline||new Date(a.deadline)>new Date());}).length+' bài đang mở';},
submissions:function(){const v=getVisibleClassIds();return submissionsData.filter(function(s){return v.indexOf(s.classId)!==-1&&s.status!=='GRADED';}).length+' bài chờ chấm';},
classes:function(){return getVisibleClassIds().length+' lớp';},
students:function(){const v=getVisibleClassIds();return studentsData.filter(function(s){return v.indexOf(s.classId)!==-1;}).length+' học sinh';},
materials:function(){return materialsData.filter(matVisible).length+' học liệu';},
khbd:function(){return khbdList.length+' giáo án';},
history:function(){return gradeHistoryData.length+' lần sửa điểm';},
discussion:function(){return discussionData.length+' chủ đề';},
teachers:function(){return Object.keys(getTeacherRegistry()).length+' giáo viên';},
feedback:function(){return feedbackList.filter(function(f){return f.status!=='done';}).length+' ý kiến mới';},
rewards:function(){return getCustomRewards().length+' lượt khen';}
};
function hvRoleKey(){return isSuperAdmin()?'a':isTeacherRole()?'t':isParentRole()?'p':'s';}
function hvInfo(id){const o=HV_INFO[id]||{d:['Mở chức năng này để sử dụng.','']};const k=hvRoleKey();return o[k]||o.d||o.t||o.s||o.a||['Mở chức năng này để sử dụng.',''];}
function hvStat(id){try{return HV_STAT[id]?HV_STAT[id]():'';}catch(_){return '';}}
function hvFindHubOfTab(id){return HV_HUBS.find(function(h){return h.tabs.some(function(t){return t.id===id;});});}
function hvIc(c){return String(c||'').replace(/\btext-(red|rose|emerald|green|blue|indigo|amber|violet|ink|cyan)-\d+\b/g,'').replace(/\s+/g,' ').trim();}
function hvBuildHubs(){
    const nav=document.getElementById('sidebarNav');if(!nav)return;
    let stash=document.getElementById('hvNavStash');if(!stash){stash=document.createElement('div');stash.id='hvNavStash';stash.style.display='none';document.body.appendChild(stash);}stash.innerHTML='';
    const groups=Array.from(nav.querySelectorAll(':scope > .nav-group'));
    const grab=function(btns){return btns.map(function(b){const ic=b.querySelector('i'),sp=b.querySelector('span');return {id:(b.id||'').replace(/^nav-/,''),icon:ic?ic.className.replace(/\bw-5\b|\btext-sm\b|\btext-center\b/g,'').trim():'fa-solid fa-circle',label:sp?sp.textContent.trim():''};}).filter(function(x){return x.id;});};
    HV_HUBS=[];
    if(groups.length){groups.forEach(function(g){const tt=g.querySelector('.nav-group-title'),gi=tt&&tt.querySelector('i');HV_HUBS.push({title:(tt?tt.textContent:'').trim(),icon:gi?gi.className:'fa-solid fa-folder',tabs:grab(Array.from(g.querySelectorAll('.nav-btn')))});stash.appendChild(g);});}
    else{const btns=Array.from(nav.querySelectorAll('.nav-btn'));HV_HUBS.push({title:'Chức năng',icon:'fa-solid fa-table-cells-large',tabs:grab(btns)});btns.forEach(function(b){stash.appendChild(b);});}
    HV_HUBS=HV_HUBS.filter(function(h){return h.tabs.length;});
    const cols=['red','emerald','blue','violet','amber','cyan'];
    HV_HUBS.forEach(function(h,i){h.id='hub-'+i;h.color=HV_HUB_COLORS[i%HV_HUB_COLORS.length];});
    nav.innerHTML=navBtn('home','fa-house','Trang chủ','text-red-500')+HV_HUBS.map(function(h,i){return navBtn(h.id,h.icon.replace(/^fa-solid\s+/,''),h.title,'text-'+cols[i%6]+'-500');}).join('');
}
function hvSetCrumb(html){const c=document.getElementById('hvCrumb');if(!c)return;if(!html){c.classList.add('hidden');c.innerHTML='';return;}c.classList.remove('hidden');c.innerHTML=html;}
function hvCrumbFor(id){
    if(id==='home'||!id){hvSetCrumb('');return;}
    const E=escapeHtml;
    if(/^hub-\d+$/.test(id)){const h=HV_HUBS.find(function(x){return x.id===id;});if(!h){hvSetCrumb('');return;}hvSetCrumb('<button class="back" onclick="switchTab(\'home\')"><i class="fa-solid fa-arrow-left"></i> Trang chủ</button><span class="sep">›</span><span class="cur">'+E(h.title)+'</span>');return;}
    const h=hvFindHubOfTab(id);if(!h){hvSetCrumb('');return;}const t=h.tabs.find(function(x){return x.id===id;});
    hvSetCrumb('<button class="back" onclick="switchTab(\''+h.id+'\')"><i class="fa-solid fa-arrow-left"></i> '+E(h.title)+'</button><span class="sep">›</span><button onclick="switchTab(\'home\')">Trang chủ</button><span class="sep">›</span><button onclick="switchTab(\''+h.id+'\')">'+E(h.title)+'</button><span class="sep">›</span><span class="cur">'+E(t?t.label:id)+'</span>');
}
function hvHighlightHub(hubId){
    document.querySelectorAll('#sidebarNav .nav-btn').forEach(function(b){b.classList.remove('bg-indigo-600','text-white');});
    const b=document.getElementById('nav-'+hubId);if(b)b.classList.add('bg-indigo-600','text-white');
    try{syncMobileNavActive(hubId);}catch(_){}
}
function hvTile(t,hub,i){
    const info=hvInfo(t.id),st=hvStat(t.id),c=hub?hub.color:HV_HUB_COLORS[i%HV_HUB_COLORS.length],E=escapeHtml;
    return '<button class="hv-tile" style="animation-delay:'+Math.min(i,12)*50+'ms" onclick="switchTab(\''+E(t.id)+'\')"><div class="hv-tile-ic" style="background:linear-gradient(135deg,'+c[0]+','+c[1]+')"><i class="'+E(hvIc(t.icon))+'"></i></div><div style="min-width:0;flex:1"><b>'+E(t.label)+'</b><p>'+E(info[0])+'</p>'+(info[1]?'<div class="use">'+E(info[1])+'</div>':'')+'<div class="meta">'+(st?'<span class="hv-stat">'+E(st)+'</span>':'')+'<span class="hv-go">Mở →</span></div></div></button>';
}
function hvAllTabs(){const out=[];HV_HUBS.forEach(function(h){h.tabs.forEach(function(t){out.push({t:t,h:h});});});return out;}
function hvHubQuery(v){hvHubQ=v||'';hvRenderTiles();}
function hvRenderTiles(){
    const box=document.getElementById('hvTiles');if(!box)return;const cur=window.__hvHubCur;
    const q=hvStrip(String(hvHubQ).toLowerCase().trim());
    if(q){box.className='hv-tiles';const list=hvAllTabs().filter(function(x){const i=hvInfo(x.t.id);const hay=hvStrip((x.t.label+' '+i[0]+' '+i[1]+' '+x.h.title).toLowerCase());return q.split(/\s+/).every(function(w){return hay.indexOf(w)!==-1;});});box.innerHTML=list.length?list.map(function(x,i){return hvTile(x.t,x.h,i);}).join(''):'<div class="cm-empty" style="grid-column:1/-1"><div style="font-size:38px">🔍</div>Không tìm thấy chức năng phù hợp với “'+escapeHtml(hvHubQ)+'”.</div>';return;}
    if(cur==='home'){
        box.className='';box.innerHTML='<div class="hv-tiles" style="margin-top:0">'+HV_HUBS.map(function(h,i){return '<div class="hv-hubcard" style="animation-delay:'+i*70+'ms"><div class="top" onclick="switchTab(\''+h.id+'\')"><div class="hic" style="background:linear-gradient(135deg,'+h.color[0]+','+h.color[1]+')"><i class="'+escapeHtml(h.icon)+'"></i></div><div style="flex:1;min-width:0"><h3>'+escapeHtml(h.title)+'</h3><div class="d">'+escapeHtml(HV_HUB_DESC[h.title]||'')+' · '+h.tabs.length+' chức năng</div></div><span class="hv-go">Mở nhóm →</span></div><div class="pills">'+h.tabs.map(function(t){return '<button class="hv-pill" onclick="switchTab(\''+escapeHtml(t.id)+'\')"><i class="'+escapeHtml(hvIc(t.icon))+'"></i> '+escapeHtml(t.label)+'</button>';}).join('')+'</div></div>';}).join('')+'</div>';return;
    }
    const h=HV_HUBS.find(function(x){return x.id===cur;});if(!h){box.innerHTML='';return;}
    box.className='hv-tiles';box.innerHTML=h.tabs.map(function(t,i){return hvTile(t,h,i);}).join('');
}
function hvRenderHub(id){
    window.__hvHubCur=id;const body=document.getElementById('hvHubBody');if(!body)return;const E=escapeHtml;hvHubQ='';
    const role={a:'Quản trị viên',t:'Giáo viên',s:'Học sinh',p:'Phụ huynh'}[hvRoleKey()];
    let head;
    if(id==='home'){
        const hr=new Date().getHours();const greet=hr<11?'Chào buổi sáng':hr<14?'Chào buổi trưa':hr<18?'Chào buổi chiều':'Chào buổi tối';
        const quick=(HV_QUICK[hvRoleKey()]||[]).filter(function(q){return hvAllTabs().some(function(x){return x.t.id===q[1];});});
        head='<div class="hv-hero" style="background-image:linear-gradient(120deg,#dc2626,#db2777 35%,#7c3aed 65%,#2563eb)"><span class="big">📚</span><h2>'+greet+', '+E(currentUser?currentUser.name:'')+'! 👋</h2><p>Chọn một <b>nhóm chức năng</b> bên dưới. Mỗi nhóm có các ô nhỏ — bấm vào ô để dùng ngay. Mỗi ô đều ghi rõ <b>làm được gì</b> và <b>dùng khi nào</b>.</p><div class="chips"><span>👤 '+E(role)+'</span><span>🧩 '+HV_HUBS.length+' nhóm</span><span>🔧 '+hvAllTabs().length+' chức năng</span></div></div>'+hvResumeHtml()+
        (quick.length?'<div class="hv-sec">🚀 Bắt đầu nhanh</div><div class="hv-steps">'+quick.map(function(q,i){return '<button class="hv-step" onclick="switchTab(\''+E(q[1])+'\')"><span class="n">'+(i+1)+'</span><span class="t">'+E(q[0])+'</span></button>';}).join('')+'</div>':'')+
        '<div class="hv-sec">🗂️ Tất cả nhóm chức năng</div>';
    }else{
        const h=HV_HUBS.find(function(x){return x.id===id;});if(!h){body.innerHTML='';return;}
        head='<div class="hv-hero" style="background-image:linear-gradient(120deg,'+h.color[0]+','+h.color[1]+')"><span class="big"><i class="'+E(h.icon)+'"></i></span><h2>'+E(h.title)+'</h2><p>'+E(HV_HUB_DESC[h.title]||'')+'. Bấm vào một ô bên dưới để dùng chức năng đó.</p><div class="chips"><span>🔧 '+h.tabs.length+' chức năng</span><span>👤 '+E(role)+'</span></div></div>';
    }
    body.innerHTML=head+'<div class="hv-find"><i class="fa-solid fa-magnifying-glass"></i><input id="hvHubSearch" type="search" placeholder="Tìm nhanh chức năng… (vd: nộp bài, điểm, học liệu)" oninput="hvHubQuery(this.value)" autocomplete="off"></div><div id="hvTiles" class="hv-tiles"></div><div class="hv-tip">💡 <b>Mẹo:</b> bấm nút <b>← Quay lại</b> ở thanh phía trên để về nhóm hoặc Trang chủ bất cứ lúc nào.</div>';
    hvRenderTiles();
}
function hvShowHub(id){
    const r=hvOrigSwitch('hub');
    try{hvTabLeave('hub');}catch(_){}
    window.__hvTab=id;hvRenderHub(id);hvHighlightHub(id);hvCrumbFor(id);
    try{document.querySelector('main').scrollTo({top:0,behavior:'smooth'});window.scrollTo({top:0,behavior:'smooth'});}catch(_){}
    return r;
}
let hvOrigSwitch=null;
(function(){
    const _s=switchTab;hvOrigSwitch=_s;
    switchTab=function(id){
        if(id==='home'||/^hub-\d+$/.test(String(id)))return hvShowHub(id);
        let r;
        try{r=_s.apply(this,arguments);}catch(e){console.error('switchTab',id,e);window.__hvLastErr='Mục '+id+': '+(e&&e.message?e.message:e);try{showToast('Mục này gặp lỗi nhỏ: '+(e&&e.message?e.message:e),'error');}catch(_){}}
        try{const h=hvFindHubOfTab(id);if(h){hvHighlightHub(h.id);hvCrumbFor(id);}else hvSetCrumb('');}catch(_){}
        try{hvTabLeave(id);}catch(_){}
        return r;
    };
    const _n=setupNavigationByRole;
    setupNavigationByRole=function(){
        const r=_n.apply(this,arguments);
        try{hvBuildHubs();buildMobileNav();switchTab('home');}catch(e){console.warn('hubs',e);}
        return r;
    };
})();

