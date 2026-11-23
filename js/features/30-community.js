/* =====================================================================
   v4.3 · CỘNG ĐỒNG HỌC SINH · ĐÁNH GIÁ · PWA · MINH BẠCH
   ===================================================================== */
const HV_VERSION='4.9.9';
let communityPosts=[]; let feedbackList=[];
try{ communityPosts=JSON.parse(safeGetItem('hv_cm_cache','[]'))||[]; }catch(_){ communityPosts=[]; }
const CM_CATS=[{id:'all',label:'Tất cả',icon:'🌈'},{id:'hoi',label:'Hỏi bài',icon:'🙋'},{id:'chia-se',label:'Chia sẻ',icon:'✨'},{id:'goc-van',label:'Góc văn',icon:'✍️'},{id:'huong-dan',label:'Dùng web',icon:'🧭'},{id:'tro-chuyen',label:'Trò chuyện',icon:'💬'}];
const CM_TABS=[['forum','💬','Diễn đàn'],['guide','🧭','Hướng dẫn'],['ref','📚','Tham khảo'],['faq','❓','Hỏi đáp'],['trust','🛡️','Minh bạch']];
const CM_RULES=[['🤝','Tôn trọng mọi người — đây là diễn đàn của trường, không dùng lời lẽ xúc phạm, miệt thị, đe dọa.'],['🔒','Không đăng số điện thoại, địa chỉ, mật khẩu hay thông tin riêng tư của mình và của bạn.'],['📌','Hỏi rõ ràng: nêu bài/tác phẩm, em đã thử gì, chỗ nào chưa hiểu.'],['🚫','Không đăng đáp án bài đang kiểm tra, không quảng cáo, không gửi link lạ.'],['🚩','Thấy bài không phù hợp hãy bấm “Báo cáo”. Bài bị báo cáo từ 3 lần sẽ được ẩn để thầy cô xem xét.']];
const CM_FACTS=['Truyện Kiều của Nguyễn Du gồm 3254 câu thơ lục bát.','Tiếng Việt có 6 thanh điệu: ngang, huyền, sắc, hỏi, ngã, nặng.','“Nam quốc sơn hà” thường được xem là bản tuyên ngôn độc lập đầu tiên của nước ta.','Bình Ngô đại cáo do Nguyễn Trãi viết năm 1428 sau chiến thắng quân Minh.','Nhà văn Nam Cao có tên thật là Trần Hữu Tri.','Thơ lục bát là thể thơ truyền thống: câu 6 chữ xen câu 8 chữ.','Chữ Quốc ngữ dùng chữ cái Latinh, hình thành từ thế kỷ 17 với đóng góp của nhiều giáo sĩ phương Tây, trong đó có Alexandre de Rhodes.','Từ láy giúp câu văn giàu hình ảnh và nhạc điệu — hãy thử dùng trong bài viết của em!'];
const CM_FAQ=[
{c:'Tài khoản',q:'Em chưa có tài khoản thì làm sao?',a:'Ở màn hình Đăng nhập, bấm “Lấy tài khoản học sinh” → nhập mã lớp do thầy/cô cung cấp → chọn đúng tên của em → ghi lại email và mật khẩu (chỉ hiện 1 lần). Nếu chưa có mã lớp, em hỏi giáo viên bộ môn nhé.'},
{c:'Tài khoản',q:'Em lỡ quên mật khẩu hoặc chưa kịp ghi lại thì sao?',a:'Mỗi học sinh chỉ lấy tài khoản được 1 lần để tránh người khác lấy mất. Em báo giáo viên bộ môn — thầy/cô xem được danh sách tài khoản của lớp mình để cấp lại cho em.'},
{c:'Tài khoản',q:'Đăng nhập báo sai thông tin?',a:'Kiểm tra: (1) email không thừa dấu cách; (2) mật khẩu phân biệt chữ hoa/thường; (3) đang chọn đúng vai trò (Học sinh / Giáo viên / Phụ huynh). Vẫn lỗi thì chụp màn hình gửi qua nút ⭐ Đánh giá hoặc báo giáo viên.'},
{c:'Tài khoản',q:'Em dùng điện thoại hoặc máy khác được không?',a:'Được. Mở cùng địa chỉ web và đăng nhập lại. Dữ liệu của em lưu trên hệ thống đám mây nên máy nào cũng thấy giống nhau.'},
{c:'Làm bài',q:'Hết hạn nộp rồi còn nộp được không?',a:'Tùy giáo viên: nếu bài tập bật “Cho phép nộp muộn” thì em vẫn nộp được và bài sẽ được đánh dấu là nộp muộn. Nếu không bật, em cần báo giáo viên.'},
{c:'Làm bài',q:'Em nộp nhầm bài thì sao?',a:'Sau khi nộp, bài được gửi thẳng cho giáo viên. Nếu nộp nhầm, hãy báo ngay cho giáo viên bộ môn để được hướng dẫn.'},
{c:'Làm bài',q:'Bấm nộp mà báo lỗi — bài của em có mất không?',a:'Khi báo lỗi (ví dụ “Lỗi Supabase…”), nghĩa là bài CHƯA được lưu. Em hãy sao chép nội dung bài làm ra nơi khác, kiểm tra mạng rồi nộp lại. Nếu lỗi lặp lại, gửi ý kiến qua nút ⭐ để thầy cô sửa.'},
{c:'Làm bài',q:'Phòng thi thử có chống gian lận không?',a:'Có. Khi làm bài trong phòng thi, hệ thống ghi nhận các hành vi như rời khỏi màn hình thi và báo cho giáo viên. Em nên làm bài nghiêm túc, tập trung một cửa sổ.'},
{c:'Làm bài',q:'Bài tập có file Word hoặc ảnh thì xem ở đâu?',a:'Nội dung đề do giáo viên soạn (kể cả chữ lấy từ file Word) hiện ngay trong phần hướng dẫn/nội dung đề của bài tập; ảnh đính kèm hiện cùng bài.'},
{c:'Chấm điểm',q:'Ai là người quyết định điểm — AI hay thầy cô?',a:'Giáo viên luôn là người quyết định điểm cuối cùng. AI chỉ gợi ý dựa trên đáp án và tiêu chí do giáo viên đặt ra, giáo viên có thể sửa.'},
{c:'Chấm điểm',q:'Vì sao điểm của em thay đổi?',a:'Mọi lần sửa điểm đều được ghi vào “Lịch sử điểm”: ai sửa, lúc nào, từ bao nhiêu lên bao nhiêu và bắt buộc có lý do. Em có thể hỏi giáo viên nếu chưa rõ.'},
{c:'Chấm điểm',q:'Phụ huynh xem được điểm của em không?',a:'Phụ huynh dùng mã phụ huynh do giáo viên cấp. Điểm chỉ hiển thị cho phụ huynh khi giáo viên bật quyền xem điểm cho bài đó.'},
{c:'Kỹ thuật',q:'Web chạy chậm hoặc hiển thị lạ?',a:'Tải lại trang, dùng trình duyệt mới (Chrome, Edge, Safari, Firefox). Web có thể cài như ứng dụng: mở menu trình duyệt → “Thêm vào màn hình chính” (hoặc bấm “Cài app” nếu có).'},
{c:'Kỹ thuật',q:'Mất mạng thì em làm được gì?',a:'Em vẫn mở được các trang đã tải. Nhưng mọi thao tác lưu (nộp bài, đăng bài, gửi tin nhắn) cần có mạng vì dữ liệu được lưu trên hệ thống chung. Khi có mạng lại, web tự đồng bộ.'},
{c:'Kỹ thuật',q:'Học online với thầy cô thế nào?',a:'Vào mục “Gọi thầy cô”, bấm Video/Voice. Thầy/cô tạo phòng Google Meet và chia sẻ link cho lớp; em chỉ cần bấm để vào đúng phòng.'},
{c:'Kỹ thuật',q:'Chế độ sáng/tối ở đâu?',a:'Nút tròn hình mặt trăng/mặt trời ở góc phải màn hình. Web nhớ lựa chọn của em cho lần sau.'},
{c:'Cộng đồng',q:'Có được dùng từ ngữ xấu trong diễn đàn không?',a:'Tuyệt đối không. Hệ thống tự chặn từ ngữ xúc phạm trước khi đăng. Bài bị báo cáo từ 3 lần sẽ được ẩn để giáo viên xem xét.'},
{c:'Cộng đồng',q:'Em đăng bài ở diễn đàn công khai có lộ danh tính không?',a:'Em chỉ cần một biệt danh. Đừng nhập số điện thoại, địa chỉ, mật khẩu hay thông tin riêng tư vào bài đăng.'},
{c:'Cộng đồng',q:'Em muốn xóa bài mình đã đăng?',a:'Bấm “Thu hồi” trên bài của em. Lưu ý: quyền thu hồi gắn với trình duyệt đã dùng để đăng (hệ thống không thu thập danh tính), nên hãy dùng đúng thiết bị đó.'},
{c:'Cộng đồng',q:'Em muốn báo lỗi hoặc góp ý cho web?',a:'Bấm nút ⭐ (góc phải màn hình hoặc trên thanh đầu trang) → chấm sao, chọn loại ý kiến và mô tả. Ý kiến được gửi tới quản trị viên của Tổ Ngữ Văn để sửa.'}
];
let cmTab='forum',cmCat='all',cmQuery='',cmFaqQuery='',cmDraft={text:'',cls:'',cat:'hoi'},cmReplyDraft={},cmLastPost=0,cmFactTimer=null,cmFactIdx=0,cmPresenceCh=null,hvDeferredInstall=null;

function cmId(x){return String(x).replace(/[^\w-]/g,'');}
function cmEsc(t){return escapeHtml(String(t==null?'':t));}
function cmUid(){let u=safeGetItem('hv_cm_uid');if(!u){u='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);safeSetItem('hv_cm_uid',u);}return u;}
function cmNick(){return safeGetItem('hv_cm_nick','')||'';}
function cmSaveNick(v){safeSetItem('hv_cm_nick',String(v||'').trim());}
function cmAvatar(name,small){const n=String(name||'?').trim();const init=(n.split(/\s+/).map(function(w){return w.charAt(0);}).slice(-2).join('')||'?').toUpperCase();let h=0;for(const ch of n)h=(h*31+ch.charCodeAt(0))%360;return '<span class="cm-av'+(small?' sm':'')+'" style="background:linear-gradient(135deg,hsl('+h+',75%,52%),hsl('+((h+50)%360)+',75%,42%))">'+cmEsc(init)+'</span>';}
function cmPersist(){try{safeSetItem('hv_cm_cache',JSON.stringify(communityPosts.slice(0,200)));}catch(_){}}
function cmFind(id){return communityPosts.find(function(p){return cmId(p.id)===id;});}
function cmApply(post){const i=communityPosts.findIndex(function(x){return x.id===post.id;});if(i>=0)communityPosts[i]=post;else communityPosts.unshift(post);cmPersist();}
function cmClone(o){return JSON.parse(JSON.stringify(o));}
function cmSavePost(post){return SupabaseDB.commit(function(){return SupabaseDB.upsert('community_posts',SupabaseDB.row.extra(post));});}
async function cmPullPosts(){try{if(!SupabaseDB.client)SupabaseDB.init();if(!SupabaseDB.client)return;const r=await SupabaseDB.client.from('community_posts').select('*').limit(1000);if(!r.error&&r.data){communityPosts=r.data.map(function(x){return x.data;}).filter(Boolean);cmPersist();}}catch(_){}}
function cmVisiblePosts(){const q=cmQuery.trim().toLowerCase();return communityPosts.filter(function(p){return p&&!p.deleted&&(p.reports||[]).length<3&&(cmCat==='all'||p.cat===cmCat)&&(!q||((p.text||'')+' '+(p.nick||'')).toLowerCase().indexOf(q)!==-1);}).sort(function(a,b){return (b.ts||0)-(a.ts||0);});}

/* ----- mở / đóng trang ----- */
function showCommunityPage(tab){
    ['landingPage','portalPage'].forEach(function(id){const e=document.getElementById(id);if(e){e.style.display='none';}});
    const sh=document.getElementById('appShell');if(sh){sh.classList.add('hidden');sh.classList.remove('flex');}
    const p=document.getElementById('communityPage');p.classList.remove('hidden');p.style.display='block';p.scrollTop=0;
    if(tab)cmTab=tab;
    renderCommunity();startCommunityPresence();
    cmPullPosts().then(function(){if(cmTab==='forum')renderCmPosts(true);cmUpdateStats();});
    clearInterval(cmFactTimer);cmRotateFact(true);cmFactTimer=setInterval(cmRotateFact,6500);
    if(hvDeferredInstall){const b=document.getElementById('cmInstall');if(b)b.style.display='inline-flex';}
}
function hideCommunity(){const p=document.getElementById('communityPage');if(p){p.classList.add('hidden');p.style.display='none';}clearInterval(cmFactTimer);stopCommunityPresence();const _cc=document.getElementById('cmContent');if(_cc)_cc.innerHTML='';}
function communityExit(){hideCommunity();showLanding();}
function communityGoLogin(){hideCommunity();showLanding();showAuth('login');}
function openAccountPortal(){hideCommunity();showAccountPortal();}
function cmRotateFact(first){const el=document.getElementById('cmFact');if(!el)return;if(!first)cmFactIdx=(cmFactIdx+1)%CM_FACTS.length;else cmFactIdx=Math.floor(Math.random()*CM_FACTS.length);el.style.opacity=0;setTimeout(function(){el.textContent='Bạn có biết? '+CM_FACTS[cmFactIdx];el.style.opacity=1;},200);}
function startCommunityPresence(){try{if(!SupabaseDB.client)SupabaseDB.init();if(!SupabaseDB.client||!SupabaseDB.online||cmPresenceCh)return;const ch=SupabaseDB.client.channel('hv-community',{config:{presence:{key:cmUid()}}});ch.on('presence',{event:'sync'},function(){const n=Math.max(1,Object.keys(ch.presenceState()).length);const el=document.getElementById('cmOnline');if(el)el.textContent=n;});ch.subscribe(function(st){if(st==='SUBSCRIBED')ch.track({t:Date.now()});});cmPresenceCh=ch;}catch(_){}}
function stopCommunityPresence(){if(cmPresenceCh){try{SupabaseDB.client.removeChannel(cmPresenceCh);}catch(_){}cmPresenceCh=null;}}
function cmUpdateStats(){const _lp=document.getElementById('hvCmPosts');if(_lp)_lp.textContent=communityPosts.filter(function(p){return p&&!p.deleted;}).length;const a=document.getElementById('cmPostCount');if(a)a.textContent=communityPosts.filter(function(p){return p&&!p.deleted;}).length;const b=document.getElementById('cmFaqCount');if(b)b.textContent=CM_FAQ.length;}

/* ----- khung & tab ----- */
function renderCommunity(){
    const tabs=document.getElementById('cmpTabs');if(!tabs)return;
    tabs.innerHTML=CM_TABS.map(function(t){return '<button class="cm-tab '+(cmTab===t[0]?'on':'')+'" onclick="cmSetTab(\''+t[0]+'\')">'+t[1]+' '+t[2]+'</button>';}).join('');
    const fn={forum:cmForumHtml,guide:cmGuideHtml,ref:cmRefHtml,faq:cmFaqHtml,trust:cmTrustHtml,account:cmAccountHtml}[cmTab]||cmForumHtml;
    document.getElementById('cmContent').innerHTML=fn();
    if(cmTab==='forum')renderCmPosts();
    if(cmTab==='faq')renderCmFaq();
    cmUpdateStats();
}
function cmSetTab(t){cmTab=t;renderCommunity();try{const p=document.getElementById('communityPage');const bar=p.querySelector('.cm-tabs');p.scrollTo({top:Math.max(0,bar.offsetTop-64),behavior:'smooth'});}catch(_){}}
function cmPickCat(id){cmDraft.cat=id;renderCommunity();}
function cmPickFilter(id){cmCat=id;renderCommunity();}
function cmAskFromFaq(){cmDraft.text=cmFaqQuery||'';cmDraft.cat='hoi';cmSetTab('forum');setTimeout(function(){const t=document.getElementById('cmText');if(t)t.focus();},300);}

/* ----- Diễn đàn ----- */
function cmForumHtml(){
    return '<div class="cm-grid side"><div style="display:flex;flex-direction:column;gap:14px">'+
    '<div class="cm-card"><div class="cm-h">✏️ Đặt câu hỏi / chia sẻ</div>'+
    '<input id="cmNick" class="cm-in" style="margin-bottom:8px" placeholder="Biệt danh của em (2–30 ký tự)" maxlength="30" value="'+cmEsc(cmNick())+'" oninput="hvDeb(\'nick\',function(){cmSaveNick(document.getElementById(\'cmNick\').value)},300)">'+
    '<input id="cmCls" class="cm-in" style="margin-bottom:8px" placeholder="Lớp (không bắt buộc, vd 12B)" maxlength="12" value="'+cmEsc(cmDraft.cls)+'" oninput="cmDraft.cls=this.value">'+
    '<div class="cm-chips" style="margin-bottom:8px">'+CM_CATS.filter(function(c){return c.id!=='all';}).map(function(c){return '<button class="cm-chip '+(cmDraft.cat===c.id?'on':'')+'" onclick="cmPickCat(\''+c.id+'\')">'+c.icon+' '+c.label+'</button>';}).join('')+'</div>'+
    '<textarea id="cmText" class="cm-in" placeholder="Em đang thắc mắc điều gì? Cứ hỏi nhé — bạn bè và thầy cô sẽ giúp 💪" oninput="cmDraft.text=this.value">'+cmEsc(cmDraft.text)+'</textarea>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px"><span class="cm-meta">🔒 Không nhập SĐT, địa chỉ, mật khẩu.</span><button class="cm-go" id="cmPostBtn" onclick="cmPost()"><i class="fa-solid fa-paper-plane"></i> Đăng</button></div></div>'+
    '<div class="cm-card"><div class="cm-h">📜 Nội quy diễn đàn</div>'+CM_RULES.map(function(r){return '<div class="cm-rule"><span>'+r[0]+'</span><span>'+r[1]+'</span></div>';}).join('')+'</div></div>'+
    '<div><div class="cm-card" style="margin-bottom:12px"><input id="cmSearch" class="cm-in" placeholder="🔎 Tìm bài thảo luận…" value="'+cmEsc(cmQuery)+'" oninput="cmQuery=this.value;hvDeb(\'cmq\',renderCmPosts,120)">'+
    '<div class="cm-chips" style="margin-top:10px">'+CM_CATS.map(function(c){return '<button class="cm-chip '+(cmCat===c.id?'on':'')+'" onclick="cmPickFilter(\''+c.id+'\')">'+c.icon+' '+c.label+'</button>';}).join('')+'</div></div><div id="cmPosts"></div></div></div>';
}
function cmPostHtml(p){
    const uid=cmUid(),mine=p.uid===uid,id=cmId(p.id),rx=p.reactions||{},cat=CM_CATS.find(function(c){return c.id===p.cat;});
    const rb=function(k,e){const a=rx[k]||[];return '<button class="cm-rx '+(a.indexOf(uid)!==-1?'on':'')+'" onclick="cmReact(\''+id+'\',\''+k+'\')" aria-label="'+k+'">'+e+' <b>'+(a.length||'')+'</b></button>';};
    const replies=(p.replies||[]).map(function(r){return '<div class="cm-reply">'+cmAvatar(r.nick,true)+'<div style="min-width:0;flex:1"><div style="font-size:12px;font-weight:800">'+cmEsc(r.nick)+' <span class="cm-meta">· '+timeAgo(r.ts)+'</span>'+(r.uid===uid?'<button class="cm-link" onclick="cmRecallReply(\''+id+'\',\''+cmId(r.id)+'\')">↩ Thu hồi</button>':'')+'</div><div class="cm-text" style="margin-top:3px;font-size:13px">'+cmEsc(r.text)+'</div></div></div>';}).join('');
    return '<article class="cm-card cm-post" id="cmp-'+id+'"><div style="display:flex;gap:10px;align-items:center">'+cmAvatar(p.nick)+'<div style="min-width:0;flex:1"><div style="font-weight:900;font-size:14px">'+cmEsc(p.nick)+(p.cls?' <span class="cm-meta">· '+cmEsc(p.cls)+'</span>':'')+'</div><div class="cm-meta">'+timeAgo(p.ts)+(cat?' · <span class="cm-tag">'+cat.icon+' '+cat.label+'</span>':'')+'</div></div></div>'+
    '<div class="cm-text">'+cmEsc(p.text)+'</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:12px">'+rb('like','👍')+rb('love','❤️')+rb('idea','💡')+rb('wow','🤩')+'<span style="flex:1"></span>'+(mine?'<button class="cm-link" onclick="cmRecall(\''+id+'\')">↩ Thu hồi</button>':'<button class="cm-link" onclick="cmReport(\''+id+'\')">🚩 Báo cáo</button>')+'</div>'+replies+
    '<div style="display:flex;gap:8px;margin-top:10px"><input class="cm-in" id="cmr-'+id+'" placeholder="Viết bình luận…" value="'+cmEsc(cmReplyDraft[id]||'')+'" oninput="cmReplyDraft[\''+id+'\']=this.value" onkeydown="if(event.key===\'Enter\'){cmReply(\''+id+'\')}"><button class="cm-go" style="padding:9px 14px" onclick="cmReply(\''+id+'\')" aria-label="Gửi bình luận"><i class="fa-solid fa-paper-plane"></i></button></div></article>';
}
function renderCmPosts(soft){
    const box=document.getElementById('cmPosts');if(!box)return;
    if(soft){const a=document.activeElement;if(a&&box.contains(a)&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'))return;}
    const list=cmVisiblePosts();
    box.innerHTML=list.length?list.map(cmPostHtml).join(''):'<div class="cm-card cm-empty"><div style="font-size:38px">🌱</div><b>Chưa có bài nào ở mục này.</b><br>Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ nhé!</div>';
    cmUpdateStats();
}
async function cmPost(){
    const nick=(document.getElementById('cmNick').value||'').trim().replace(/\s+/g,' ');
    const text=(document.getElementById('cmText').value||'').trim();
    const cls=(document.getElementById('cmCls').value||'').trim();
    if(nick.length<2){showToast('Nhập biệt danh (ít nhất 2 ký tự)','error');document.getElementById('cmNick').focus();return;}
    if(text.length<3){showToast('Nội dung quá ngắn','error');return;}
    if(Date.now()-cmLastPost<8000){showToast('Chậm lại một chút nhé 🙂 (chờ vài giây)','error');return;}
    if(hvBlockIfBad(nick)||hvBlockIfBad(text)||hvBlockIfBad(cls))return;
    cmSaveNick(nick);
    const post={id:'cp'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),nick:nick,cls:cls,cat:cmDraft.cat||'hoi',text:text.slice(0,20000),ts:Date.now(),uid:cmUid(),reactions:{},replies:[],reports:[],deleted:false};
    const btn=document.getElementById('cmPostBtn');if(btn)btn.disabled=true;
    const ok=await cmSavePost(post);if(btn)btn.disabled=false;if(!ok)return;
    cmLastPost=Date.now();cmApply(post);cmDraft.text='';const t=document.getElementById('cmText');if(t)t.value='';
    renderCmPosts();showToast('Đã đăng! 🎉','success');try{confetti({particleCount:60,spread:65,origin:{y:.7}});}catch(_){}
}
async function cmReact(id,k){const p=cmFind(id);if(!p)return;const q=cmClone(p);q.reactions=q.reactions||{};const a=q.reactions[k]||[];const u=cmUid();q.reactions[k]=a.indexOf(u)!==-1?a.filter(function(x){return x!==u;}):a.concat([u]);if(!(await cmSavePost(q)))return;cmApply(q);renderCmPosts();}
async function cmReply(id){
    const p=cmFind(id);if(!p)return;const inp=document.getElementById('cmr-'+id);const text=(inp&&inp.value||'').trim();if(text.length<1)return;
    let nick=cmNick();if(!nick){nick=(prompt('Biệt danh của em là gì? (2–30 ký tự)')||'').trim();if(nick.length<2)return;}
    if(hvBlockIfBad(nick)||hvBlockIfBad(text))return;cmSaveNick(nick);
    const q=cmClone(p);q.replies=(q.replies||[]).concat([{id:'cr'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),nick:nick,text:text.slice(0,5000),ts:Date.now(),uid:cmUid()}]);
    if(!(await cmSavePost(q)))return;cmApply(q);delete cmReplyDraft[id];renderCmPosts();
}
async function cmRecall(id){const p=cmFind(id);if(!p||p.uid!==cmUid())return;const q=cmClone(p);q.deleted=true;if(!(await cmSavePost(q)))return;cmApply(q);renderCmPosts();showToast('Đã thu hồi bài đăng','success');}
async function cmRecallReply(id,rid){const p=cmFind(id);if(!p)return;const q=cmClone(p);q.replies=(q.replies||[]).filter(function(r){return !(cmId(r.id)===rid&&r.uid===cmUid());});if(!(await cmSavePost(q)))return;cmApply(q);renderCmPosts();showToast('Đã thu hồi bình luận','success');}
async function cmReport(id){const p=cmFind(id);if(!p)return;const u=cmUid();if((p.reports||[]).indexOf(u)!==-1){showToast('Em đã báo cáo bài này rồi','info');return;}const q=cmClone(p);q.reports=(q.reports||[]).concat([u]);if(!(await cmSavePost(q)))return;cmApply(q);renderCmPosts();showToast('Đã báo cáo — cảm ơn em đã giúp diễn đàn sạch đẹp 💚','success');}

/* ----- Hướng dẫn ----- */
function cmSteps(list){return list.map(function(s,i){return '<div class="cm-step"><div class="cm-num">'+(i+1)+'</div><div><b>'+s[0]+'</b><span>'+s[1]+'</span></div></div>';}).join('');}
function cmGuideHtml(){
    return '<div class="cm-grid two">'+
    '<div class="cm-card"><div class="cm-h">🎒 Dành cho học sinh</div>'+cmSteps([
    ['Lấy tài khoản','Ở màn hình Đăng nhập bấm “Lấy tài khoản học sinh”, nhập mã lớp của thầy/cô, chọn đúng tên. Ghi lại email + mật khẩu (chỉ hiện 1 lần).'],
    ['Đăng nhập','Bấm “Đăng nhập”, nhập email và mật khẩu vừa lấy.'],
    ['Xem bài tập','Mục “Bài tập lớp em”: xem đề, hạn nộp, file/ảnh đính kèm của thầy cô.'],
    ['Nộp bài','Mục “Nộp bài”: viết hoặc dán bài làm (hoặc chọn đáp án trắc nghiệm) rồi bấm nộp. Thấy thông báo thành công mới là đã nộp.'],
    ['Xem điểm & nhận xét','Điểm và lời nhận xét hiện sau khi giáo viên chấm. Lịch sử thay đổi điểm được ghi lại minh bạch.'],
    ['Luyện tập thêm','Đấu trường, Phòng thi thử, Luyện đọc, Flashcard 3D, Sơ đồ tư duy, Bình giảng, Xu hướng đề, Trợ lý AI, Diễn đàn lớp.']
    ])+'</div>'+
    '<div class="cm-card"><div class="cm-h">👩‍🏫 Dành cho giáo viên</div>'+cmSteps([
    ['Đăng ký / đăng nhập','Bấm “Tham gia” để tạo tài khoản giáo viên hoặc “Đăng nhập” nếu đã có.'],
    ['Tạo lớp','Mục “Quản lý lớp”: tạo lớp, hệ thống sinh mã lớp để phát cho học sinh.'],
    ['Thêm học sinh','Thêm từng em hoặc nhập danh sách từ file Excel (mục “Nhập file”). Tài khoản học sinh được tạo tự động.'],
    ['Giao bài','Mục “Giao bài”: thêm file Word/ảnh để hiện thẳng vào đề, nhờ AI tạo câu hỏi rồi chỉnh sửa, đặt hạn nộp.'],
    ['Chấm bài','Mục “Bài nộp” / “Chấm Rubric”: chấm thủ công hoặc tham khảo gợi ý AI. Sửa điểm phải ghi lý do.'],
    ['Theo dõi & kết nối','Tổng quan, Sổ điểm, Học bạ số; gọi lớp qua Google Meet; trao đổi ở Diễn đàn.']
    ])+'</div>'+
    '<div class="cm-card"><div class="cm-h">👨‍👩‍👧 Dành cho phụ huynh</div>'+cmSteps([
    ['Nhận mã phụ huynh','Giáo viên cung cấp mã phụ huynh và mật khẩu cho từng học sinh.'],
    ['Đăng nhập cổng Phụ huynh','Chọn vai trò Phụ huynh khi đăng nhập và nhập mã được cấp.'],
    ['Theo dõi tiến độ','Xem bài tập và kết quả của con. Điểm chỉ hiện khi giáo viên bật quyền xem điểm.']
    ])+'</div>'+
    '<div class="cm-card"><div class="cm-h">⚡ Mẹo nhanh</div>'+
    ['🌙 Bấm nút mặt trăng/mặt trời để đổi sáng/tối.','📲 Cài web như ứng dụng: “Thêm vào màn hình chính”.','📶 Bấm nộp mà báo lỗi nghĩa là CHƯA nộp — hãy chép bài ra chỗ khác rồi thử lại.','⭐ Gặp lỗi? Bấm nút ⭐ để báo cho thầy cô.','💬 Chưa hiểu chỗ nào? Hỏi ở tab Diễn đàn hoặc tìm trong tab Hỏi đáp.'].map(function(t){return '<div class="cm-rule"><span>'+t+'</span></div>';}).join('')+
    '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="cm-go" onclick="cmSetTab(\'faq\')">❓ Xem hỏi đáp</button><button class="cm-btn" onclick="cmSetTab(\'forum\')">💬 Hỏi diễn đàn</button></div></div></div>';
}

/* ----- Tham khảo ----- */
function cmAcc(items,open){return items.map(function(it,i){return '<details class="cm-acc"'+(open&&i===0?' open':'')+'><summary><span>'+it[0]+'</span></summary><div class="cm-ans">'+it[1]+'</div></details>';}).join('');}
function cmRefHtml(){
    const tu=HV_TU;
    return '<div class="cm-grid two"><div>'+
    cmAcc([
    ['📝 Cấu trúc bài nghị luận văn học','• Mở bài: dẫn dắt → giới thiệu tác giả, tác phẩm → nêu vấn đề nghị luận.\n• Thân bài: mỗi luận điểm gồm câu chủ đề → dẫn chứng → phân tích → bình luận, đánh giá.\n• Kết bài: khẳng định giá trị vấn đề → mở rộng, liên hệ.\nMẹo: lập dàn ý 5 phút trước khi viết để bài không lạc ý.'],
    ['🌍 Nghị luận xã hội (tư tưởng, đạo lí / hiện tượng đời sống)','1) Giải thích vấn đề (nghĩa đen, nghĩa bóng).\n2) Phân tích, chứng minh: biểu hiện, nguyên nhân, dẫn chứng thực tế.\n3) Bàn luận: mặt đúng, mặt cần lưu ý, phản đề.\n4) Bài học nhận thức và hành động của bản thân.'],
    ['📖 Đọc hiểu: nhận diện nhanh','• Phương thức biểu đạt: tự sự, miêu tả, biểu cảm, thuyết minh, nghị luận, hành chính – công vụ.\n• Thao tác lập luận: giải thích, phân tích, chứng minh, bình luận, so sánh, bác bỏ.\n• Câu hỏi thường gặp: nêu nội dung chính, chỉ ra biện pháp tu từ và tác dụng, nêu thông điệp rút ra. Luôn trả lời đủ ý: gọi tên – chỉ ra dấu hiệu – nêu tác dụng.'],
    ['🧩 Công thức đoạn văn','Câu chủ đề → giải thích/nêu luận điểm → dẫn chứng → phân tích dẫn chứng → câu chốt (liên hệ, đánh giá). Một đoạn nên có đủ 5 phần này, tránh liệt kê dẫn chứng mà không phân tích.'],
    ['⚠️ Lỗi thường gặp','• Lạc đề, thiếu luận điểm rõ ràng.\n• Dẫn chứng sơ sài hoặc không phân tích.\n• Mở bài/kết bài kể lể, dài dòng.\n• Sai chính tả (s/x, ch/tr, d/gi/r), câu quá dài, lặp từ.\n• Diễn đạt chung chung, thiếu cảm xúc và dấu ấn cá nhân.'],
    ['🎯 Cách ôn hiệu quả','1) Đọc kĩ đề, gạch chân 3 yêu cầu: vấn đề – thao tác – phạm vi dẫn chứng.\n2) Học theo sơ đồ tư duy (có sẵn trong web).\n3) Viết đoạn ngắn mỗi ngày, nhờ bạn/thầy cô góp ý.\n4) Luyện đọc diễn cảm để cảm thụ nhịp điệu của thơ, văn.'],
    ['📌 Lưu ý về nguồn','Nội dung trên tổng hợp kiến thức phổ thông theo chương trình Ngữ văn hiện hành để em tham khảo, không thay thế bài giảng và sách giáo khoa. Khi có khác biệt, hãy theo hướng dẫn của giáo viên bộ môn.']
    ],true)+'</div>'+
    '<div class="cm-card"><div class="cm-h">🎨 Biện pháp tu từ thường gặp</div><div class="cm-scroll"><table class="cm-table"><thead><tr><th>Biện pháp</th><th>Nội dung</th><th>Ví dụ</th></tr></thead><tbody>'+tu.map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td><i>'+r[2]+'</i></td></tr>';}).join('')+'</tbody></table></div><p class="cm-meta" style="margin-top:10px">Khi làm đọc hiểu, nhớ nêu <b>tác dụng</b>: làm câu văn thêm gợi hình, gợi cảm, nhấn mạnh ý, thể hiện thái độ của tác giả.</p></div></div>';
}

/* ----- Hỏi đáp ----- */
function cmFaqHtml(){return '<div class="cm-card"><input id="cmFaqSearch" class="cm-in" placeholder="🔎 Gõ từ khóa: tài khoản, nộp bài, điểm, lỗi…" value="'+cmEsc(cmFaqQuery)+'" oninput="cmFaqQuery=this.value;hvDeb(\'cmf\',renderCmFaq,120)"><div id="cmFaqList" style="margin-top:12px"></div></div>';}
function renderCmFaq(){
    const box=document.getElementById('cmFaqList');if(!box)return;const q=hvStrip(cmFaqQuery.toLowerCase().trim());
    const list=CM_FAQ.filter(function(f){return !q||hvStrip((f.q+' '+f.a+' '+f.c).toLowerCase()).indexOf(q)!==-1;});
    if(!list.length){box.innerHTML='<div class="cm-empty"><div style="font-size:36px">🔍</div>Chưa có câu trả lời cho “'+cmEsc(cmFaqQuery)+'”.<br><button class="cm-go" style="margin-top:12px" onclick="cmAskFromFaq()">💬 Hỏi cộng đồng</button></div>';return;}
    const cats=[];list.forEach(function(f){if(cats.indexOf(f.c)===-1)cats.push(f.c);});
    box.innerHTML=cats.map(function(c){return '<p style="font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#dc2626;margin:12px 0 6px">'+cmEsc(c)+'</p>'+list.filter(function(f){return f.c===c;}).map(function(f){return '<details class="cm-acc"'+(q?' open':'')+'><summary><span>'+cmEsc(f.q)+'</span></summary><div class="cm-ans">'+cmEsc(f.a)+'</div></details>';}).join('');}).join('')+'<div style="text-align:center;margin-top:16px"><span class="cm-meta">Chưa thấy câu trả lời? </span><button class="cm-btn" onclick="cmAskFromFaq()">💬 Hỏi cộng đồng</button></div>';
}

/* ----- Minh bạch ----- */
function cmTrustHtml(){
    return '<div class="cm-grid two"><div>'+cmAcc([
    ['📦 Web thu thập những dữ liệu nào?','• Tài khoản: họ tên, lớp, email đăng nhập do giáo viên/nhà trường tạo.\n• Học tập: bài nộp, điểm, nhận xét, lịch sử thay đổi điểm, nhật ký phòng thi.\n• Tương tác: tin nhắn lớp, thảo luận, bài đăng cộng đồng (chỉ biệt danh).\n• Đánh giá/báo lỗi: nội dung em gửi, số sao và (nếu em đồng ý) thông tin kỹ thuật thiết bị.\nWeb KHÔNG thu thập: số điện thoại, địa chỉ nhà, vị trí GPS, danh bạ.'],
    ['👀 Ai xem được dữ liệu của em?','• Giáo viên chỉ xem dữ liệu lớp mình phụ trách; quản trị viên Tổ Ngữ Văn xem toàn trường để hỗ trợ.\n• Phụ huynh chỉ xem thông tin của con và điểm khi giáo viên cho phép.\n• Bài đăng ở diễn đàn công khai ai cũng đọc được — đừng viết thông tin riêng tư.'],
    ['☁️ Dữ liệu lưu ở đâu?','Dữ liệu chính lưu trên dịch vụ đám mây Supabase để đồng bộ giữa các thiết bị. Trình duyệt chỉ giữ một bản nhớ tạm (cache) để tải nhanh và dùng khi mất mạng. Khi lưu không thành công, web sẽ báo lỗi rõ ràng thay vì âm thầm bỏ qua.'],
    ['🤖 AI được dùng thế nào?','Khi giáo viên dùng tính năng AI (tạo câu hỏi, gợi ý chấm, Trợ lý AI), nội dung cần xử lý được gửi tới dịch vụ AI đã cấu hình (ví dụ Google Gemini). AI chỉ gợi ý; điểm cuối cùng do giáo viên quyết định. Em đừng nhập thông tin cá nhân vào khung hỏi AI.'],
    ['⚖️ Điểm số có minh bạch không?','Mọi lần sửa điểm đều được ghi lại: ai sửa, lúc nào, giá trị cũ – mới và lý do (bắt buộc). Học sinh có thể hỏi giáo viên để được giải thích.'],
    ['🛡️ Quy tắc ứng xử & kiểm duyệt','Đây là ứng dụng của nhà trường: cấm tuyệt đối lời lẽ xúc phạm, miệt thị, đe dọa. Hệ thống tự chặn từ ngữ không phù hợp; bài bị báo cáo từ 3 lần sẽ bị ẩn và quản trị viên xem xét, có thể xóa.'],
    ['✋ Quyền của em','Em có thể yêu cầu xem, sửa hoặc xóa dữ liệu của mình thông qua giáo viên bộ môn hoặc nhà trường. Em có thể thu hồi bài đăng/bình luận của mình bất cứ lúc nào.']
    ],true)+'</div><div class="cm-card"><div class="cm-h">🆕 Phiên bản '+HV_VERSION+'</div>'+
    ['Hoàn thiện tối ưu: WebAssembly đếm từ, canvas 2 lớp trong Worker, bảng lớn tải dần, điều hướng #/tab/..., Container Queries, Paint Worklet, SharedWorker, kiểm tra toàn vẹn thư viện.','Chế độ tập trung khi làm bài (chỉ còn mũi tên thoát và nút Gửi bài), đồng hồ giới hạn thời gian do giáo viên đặt và tự nộp khi hết giờ, ô đăng nhập dễ nhìn, nhiều tối ưu hiệu năng (Worker, IndexedDB, Service Worker mới).','Bàn làm bài 2 bên (đề | bài làm) vừa khít màn hình, có nút Gửi bài luôn hiện; tự định dạng thơ/văn; tự lưu bản nháp; Nhật ký làm bài ghi lại học sinh rời màn hình như Azota; intro mượt hơn.','Đề bài hiển thị cho học sinh (nội dung, ảnh, file); thời gian giao bài theo giờ Việt Nam; đăng nhập giáo viên bắt buộc Mã GV khớp tài khoản; tăng tốc GPU và canvas tự giữ 60 FPS.','Chia nhỏ chức năng: Trang chủ → Nhóm → Ô chức năng, mỗi ô ghi rõ làm được gì, dùng khi nào; có tìm nhanh và thanh quay lại.','Học liệu mới: giáo viên tải bài giảng, tiết dạy online, tác phẩm, video, hình ảnh cho học sinh tham khảo.','Bài nộp luôn khớp với tài khoản đang có; email/mật khẩu tạo theo tên (vd thanhdat@edu.vn, ThanhDat12B).','Trang chủ & intro nâng cấp: băng chuyền tính năng, thử thách Ngữ văn, thẻ biện pháp tu từ, cộng đồng, mục Minh bạch.','Hiệu ứng mới: đèn rọi theo chuột, nghiêng 3D, gợn sóng khi bấm, hiện dần khi cuộn, chuyển mục mượt.','Cloud nhanh hơn: bắt đầu đồng bộ ngay khi mở web, realtime chỉ tải đúng bảng thay đổi, thanh tiến trình đồng bộ.','Cổng học sinh mới: diễn đàn, hướng dẫn, tài liệu tham khảo, hỏi đáp.','Chế độ sáng/tối được thiết kế lại, dễ nhìn hơn.','Mục Đánh giá & báo lỗi dành cho mọi người dùng (có lọc từ ngữ).','Dữ liệu lấy từ Supabase làm gốc, đồng bộ thời gian thực; hiển thị giờ cập nhật gần nhất.','Hỗ trợ cài như ứng dụng, thông báo mất kết nối, tự báo khi có bản mới.','Giao bài: thêm Word/ảnh hiện thẳng vào đề, câu hỏi AI tự điền để chỉnh sửa.'].map(function(t){return '<div class="cm-rule"><span>✅</span><span>'+t+'</span></div>';}).join('')+
    '<p class="cm-meta" style="margin-top:12px">Phát triển cho Tổ Ngữ Văn — Trường THCS &amp; THPT Vĩnh Hòa. Góp ý: bấm nút ⭐.</p><button class="cm-go" style="margin-top:10px" onclick="openFeedback()">⭐ Gửi đánh giá</button></div></div>';
}

/* ----- Lấy tài khoản ----- */
function cmAccountHtml(){return '<div class="cm-card" style="text-align:center;padding:28px 16px"><div style="font-size:48px">🎫</div><div class="cm-h" style="justify-content:center;margin-top:8px">Lấy tài khoản đăng nhập</div><p style="font-size:13px;color:var(--text-sub);max-width:460px;margin:0 auto 16px;line-height:1.7">Nhập <b>mã lớp</b> do thầy/cô cung cấp, chọn tên của em để nhận email và mật khẩu. Mỗi học sinh chỉ lấy được <b>1 lần</b> — hãy ghi lại hoặc chụp màn hình.</p><button class="cm-go" onclick="openAccountPortal()"><i class="fa-solid fa-id-card"></i> Mở tra cứu tài khoản</button></div>';}

