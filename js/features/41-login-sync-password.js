/* =====================================================================
   v4.9.4 · ĐĂNG NHẬP ỔN ĐỊNH MỌI THIẾT BỊ · TỰ CẬP NHẬT PHIÊN BẢN · ĐỒNG BỘ TÀI KHOẢN THEO CLOUD
   ===================================================================== */
function hvCleanCred(t){return String(t==null?'':t).normalize('NFC').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').replace(/[\u00A0\u2007\u202F]/g,' ');}
function hvCredCandidates(email,pass){
    const es=[],ps=[],seen={};const out=[];
    const addE=function(x){if(x&&es.indexOf(x)===-1)es.push(x);};const addP=function(x){if(x!=null&&ps.indexOf(x)===-1)ps.push(x);};
    const eRaw=String(email||''),eClean=hvCleanCred(eRaw).trim();
    addE(eRaw.trim());addE(eClean);addE(eClean.toLowerCase());
    const pRaw=String(pass==null?'':pass),pClean=hvCleanCred(pRaw);
    addP(pRaw);addP(pClean);addP(pRaw.trim());addP(pClean.trim());
    es.forEach(function(e){ps.forEach(function(p){const k=e+'\u0000'+p;if(!seen[k]){seen[k]=1;out.push({e:e,p:p});}});});
    return out.slice(0,8);
}
async function hvSignInRobust(email,pass){
    const c=hvCredCandidates(email,pass);let last=null;
    for(const x of c){const r=await SupabaseDB.signIn(x.e,x.p);if(r&&r.ok)return r;last=r;}
    return last||{ok:false,error:'Sai thông tin'};
}
/* ----- Tự phát hiện bản mới (máy khác đang chạy mã cũ) ----- */
let hvUpdLast=0,hvUpdShown=false;
async function hvCheckUpdate(){
    try{
        if(navigator.onLine===false||Date.now()-hvUpdLast<60000)return;hvUpdLast=Date.now();
        const r=await fetch(location.pathname.replace(/\/[^\/]*$/,'/')+'index.html?v='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout?AbortSignal.timeout(10000):undefined});
        if(!r.ok)return;const t=await r.text();const m=t.match(/name="hv-version" content="([\d.]+)"/)||t.match(/const HV_VERSION='([\d.]+)'/);if(!m||m[1]===HV_VERSION)return;
        const newer=m[1].split('.').map(Number),cur=HV_VERSION.split('.').map(Number);let isNew=false;for(let i=0;i<3;i++){if((newer[i]||0)>(cur[i]||0)){isNew=true;break;}if((newer[i]||0)<(cur[i]||0))break;}
        if(!isNew)return;
        const guard='hv_reloaded_for';
        if((typeof currentUser==='undefined'||!currentUser)&&sessionStorage.getItem(guard)!==m[1]){sessionStorage.setItem(guard,m[1]);await hvReloadFresh();return;}
        hvShowUpdateBar(m[1]);
    }catch(_){}
}
async function hvReloadFresh(){
    try{if('caches' in window){const ks=await caches.keys();await Promise.all(ks.map(function(k){return caches.delete(k);}));}}catch(_){}
    try{if(navigator.serviceWorker){const regs=await navigator.serviceWorker.getRegistrations();regs.forEach(function(r){r.update();});}}catch(_){}
    location.reload();
}
function hvShowUpdateBar(v){
    if(hvUpdShown)return;hvUpdShown=true;
    const b=document.createElement('div');b.id='hvUpdateBar';b.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100080;background:linear-gradient(135deg,#059669,#2563eb);color:#fff;padding:11px 18px;border-radius:999px;font:800 13px Inter,system-ui,sans-serif;box-shadow:0 12px 34px rgba(0,0,0,.35);cursor:pointer;max-width:92vw;text-align:center';
    b.textContent='🔄 Có phiên bản mới '+v+' — bấm để cập nhật (bài đang viết đã được lưu nháp)';
    b.onclick=function(){try{hvDraftSave();}catch(_){}hvReloadFresh();};document.body.appendChild(b);
}
setTimeout(hvCheckUpdate,4000);setInterval(hvCheckUpdate,600000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)hvCheckUpdate();});
/* ----- Thuộc tính bàn phím cho ô đăng nhập (không tự viết hoa / sửa chính tả / thêm dấu cách) ----- */
(function(){
    const set=function(id,attrs){const e=document.getElementById(id);if(!e)return;Object.keys(attrs).forEach(function(k){e.setAttribute(k,attrs[k]);});};
    set('loginEmail',{autocapitalize:'off',autocorrect:'off',spellcheck:'false',autocomplete:'username',inputmode:'email'});
    set('loginPassword',{autocapitalize:'off',autocorrect:'off',spellcheck:'false',autocomplete:'current-password'});
    set('loginTeacherCode',{autocapitalize:'off',autocorrect:'off',spellcheck:'false',autocomplete:'off'});
    set('loginClassCode',{autocapitalize:'characters',autocorrect:'off',spellcheck:'false',autocomplete:'off'});
})();

/* =====================================================================
   v4.9.5 · CUỘN ẢO THẬT CHO BẢNG RẤT LỚN + DỰ PHÒNG SAO CHÉP
   ===================================================================== */
function hvVirtualTable(id,threshold){
    const tb=document.getElementById(id);if(!tb)return false;
    const rows=Array.from(tb.children);if(rows.length<threshold)return false;
    rows.forEach(function(r){r.remove();});
    const mk=function(){const tr=document.createElement('tr');tr.innerHTML='<td colspan="99" style="padding:0;border:0;height:0"></td>';return tr;};
    const top=mk(),bot=mk();tb.appendChild(top);tb.appendChild(bot);
    const H=new Array(rows.length).fill(0);let avg=48,s=0,e=0,raf=0;
    const hOf=function(i){return H[i]||avg;};
    const prefix=function(n){let t=0;for(let i=0;i<n;i++)t+=hOf(i);return t;};
    function render(){
        raf=0;const r=tb.getBoundingClientRect(),vh=window.innerHeight;
        const y=Math.max(0,-r.top-300);let acc=0,i=0;while(i<rows.length&&acc+hOf(i)<y){acc+=hOf(i);i++;}
        if(i>=rows.length)i=Math.max(0,rows.length-30);let j=i,span=0;const need=vh+600;while(j<rows.length&&span<need){span+=hOf(j);j++;}
        if(i===s&&j===e&&tb.children.length>2)return;
        for(let k=s;k<e;k++)if(rows[k].parentNode===tb)rows[k].remove();
        s=i;e=j;const frag=document.createDocumentFragment();for(let k=s;k<e;k++)frag.appendChild(rows[k]);tb.insertBefore(frag,bot);
        let sum=0,cnt=0;for(let k=s;k<e;k++){const h=rows[k].offsetHeight;if(h){H[k]=h;sum+=h;cnt++;}}if(cnt)avg=Math.round(sum/cnt)||avg;
        top.firstChild.style.height=prefix(s)+'px';bot.firstChild.style.height=(prefix(rows.length)-prefix(e))+'px';
        const tot=prefix(rows.length);if(Math.abs(tot-(render._tot||tot))>40&&(render._n=(render._n||0)+1)<5){render._tot=tot;onScroll();}else{render._tot=tot;render._n=0;}
    }
    const onScroll=function(){if(!raf)raf=requestAnimationFrame(render);};
    window.addEventListener('scroll',onScroll,{passive:true,capture:true});window.addEventListener('resize',onScroll,{passive:true});
    tb.__hvV={destroy:function(){window.removeEventListener('scroll',onScroll,true);window.removeEventListener('resize',onScroll);if(raf)cancelAnimationFrame(raf);}};
    render();return true;
}
function hvCopyFallback(t){return new Promise(function(res,rej){try{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:-1000px;opacity:0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();ok?res():rej(new Error('copy failed'));}catch(e){rej(e);}});}
(function(){try{if(!navigator.clipboard||!navigator.clipboard.writeText)return;const w=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=function(t){return w(t).catch(function(){return hvCopyFallback(t);});};}catch(_){}})();

/* =====================================================================
   v4.9.6 · ĐỒNG BỘ TÀI KHOẢN GIÁO VIÊN GIỮA CÁC MÁY (Cloud là gốc)
   ===================================================================== */
function hvCloudErrMsg(e){
    const m=String(e&&e.message||e||'');
    if(/Email not confirmed/i.test(m))return 'Tài khoản đã có trên Cloud nhưng chưa được xác nhận email — quản trị viên cần xác nhận trong Supabase (xem hướng dẫn SQL).';
    if(/Invalid login credentials/i.test(m))return 'Email hoặc mật khẩu không khớp với tài khoản trên Cloud. Nếu tài khoản này chỉ có trên một máy, hãy đăng nhập ở máy đó một lần để hệ thống tự đồng bộ lên Cloud.';
    if(/rate limit|too many/i.test(m))return 'Thử quá nhiều lần — vui lòng chờ ít phút rồi thử lại.';
    if(/fetch|network|timeout/i.test(m))return 'Không kết nối được máy chủ — kiểm tra mạng rồi thử lại.';
    return '';
}
async function hvMigrateLocalTeacher(u,pass,tcode){
    try{
        if(!SupabaseDB.client||!SupabaseDB.online)return {ok:false,why:'offline'};
        const code=(currentUser&&currentUser.teacherCode)||u.teacherCode||(tcode?parseTeacherCode(tcode).teacherCode:'');
        const r=await SupabaseDB.signUpTeacher({email:String(u.email||'').trim().toLowerCase(),password:pass,name:u.name||'Giáo viên',teacherCode:code,school:u.school});
        if(!r||!r.ok){
            const err=String((r&&r.error)||'');
            if(/already (been )?registered|already exists/i.test(err))return {ok:false,why:'exists'};
            return {ok:false,why:'err',msg:err};
        }
        return {ok:true,session:!!(r.data&&r.data.session)||!!r.session};
    }catch(e){return {ok:false,why:'err',msg:String(e&&e.message||e)};}
}
function hvLocalOnlyBar(msg){
    let b=document.getElementById('hvLocalBar');
    if(!b){b=document.createElement('div');b.id='hvLocalBar';b.style.cssText='position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:100085;background:linear-gradient(135deg,#f59e0b,#dc2626);color:#fff;padding:9px 16px;border-radius:14px;font:800 12px Inter,system-ui,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.35);max-width:94vw;text-align:center;cursor:pointer';b.title='Bấm để ẩn';b.onclick=function(){b.remove();};document.body.appendChild(b);}
    b.textContent='⚠️ '+msg;
}
function hvMigrateToast(mg){
    if(!mg)return;
    if(mg.ok&&mg.session){showToast('Đã đồng bộ tài khoản lên Cloud ✓ — máy khác đăng nhập được với cùng email & mật khẩu.','success');return;}
    if(mg.ok&&!mg.session){hvLocalOnlyBar('Đã tạo tài khoản Cloud nhưng cần xác nhận email (Supabase → Authentication) thì máy khác mới đăng nhập được. Xem hướng dẫn SQL.');return;}
    if(mg.why==='exists'){hvLocalOnlyBar('Email này đã có trên Cloud với MẬT KHẨU KHÁC máy này. Hãy dùng mật khẩu Cloud hoặc nhờ quản trị viên đặt lại mật khẩu (xem hướng dẫn SQL).');return;}
    hvLocalOnlyBar('Đang dùng tài khoản cục bộ — chưa đăng nhập Cloud nên dữ liệu chưa lưu lên Cloud được.'+(mg.msg?' ('+mg.msg+')':''));
}

/* =====================================================================
   v4.9.7 · ĐỔI MẬT KHẨU THẬT TRÊN CLOUD (tự đổi + quản trị viên đặt lại)
   ===================================================================== */
async function handleChangePassword(e){
    e.preventDefault();
    const o=document.getElementById('oldPass').value,n=document.getElementById('newPass').value;
    if(!currentUser){return;}
    if(currentUser.role==='student'||currentUser.role==='parent'){showToast('Tài khoản học sinh/phụ huynh: nhờ giáo viên đổi mật khẩu giúp.','error');return;}
    if(n.length<6){showToast('Mật khẩu mới tối thiểu 6 ký tự','error');return;}
    if(n===o){showToast('Mật khẩu mới phải khác mật khẩu cũ','error');return;}
    const email=String(currentUser.email||'').trim();let cloudOk=false;
    try{
        if(SupabaseDB.online&&SupabaseDB.client){
            let verified=false;
            for(const c of hvCredCandidates(email,o)){const r=await SupabaseDB.client.auth.signInWithPassword({email:c.e,password:c.p});if(!r.error){verified=true;break;}}
            if(verified){
                const u=await SupabaseDB.client.auth.updateUser({password:n});
                if(u.error){showToast('Không đổi được mật khẩu: '+u.error.message,'error');return;}
                cloudOk=true;
            }
        }
        const users=getUsers();const lu=users.find(function(x){return String(x.email||'').toLowerCase()===email.toLowerCase();});
        const localOk=!!(lu&&(lu.password===o||hvCleanCred(lu.password).trim()===hvCleanCred(o).trim()));
        if(!cloudOk&&!localOk){showToast('MK cũ sai!','error');return;}
        if(lu){lu.password=n;saveUsers(users);}
        if(!cloudOk&&localOk&&SupabaseDB.online){try{hvMigrateToast(await hvMigrateLocalTeacher(lu,n,''));}catch(_){}}
        currentUser.password=n;safeSessionSet('hv_current_user',JSON.stringify(currentUser));
        document.getElementById('oldPass').value='';document.getElementById('newPass').value='';
        showToast(cloudOk?'Đổi MK thành công — áp dụng cho mọi máy ✓':'Đổi MK thành công (chỉ trên máy này)!','success');
    }catch(err){showToast('Lỗi đổi mật khẩu: '+(err&&err.message||err),'error');}
}
async function hvAdminTeacherAuth(o){
    if(!o.password||!SupabaseDB.client||!SupabaseDB.online)return;
    if(o.ec&&o.password===(o.orig||''))return;
    const r=await SupabaseDB.client.rpc('hv_admin_set_password',{p_email:o.email,p_password:o.password});
    if(!r.error){showToast('Đã đổi mật khẩu giáo viên trên Cloud ✓','success');return;}
    const m=String(r.error.message||'');
    if(/Không tìm thấy tài khoản/i.test(m)){
        try{
            const mk=window.supabase.createClient(SupabaseDB.client.supabaseUrl,SupabaseDB.client.supabaseKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
            const s=await mk.auth.signUp({email:o.email,password:o.password,options:{data:{full_name:o.name,role:'teacher',teacher_code:o.code,school:o.school}}});
            if(s.error){showToast('Không tạo được tài khoản Cloud: '+s.error.message,'error');return;}
            if(s.data&&s.data.user){await SupabaseDB.client.from('profiles').upsert([{id:s.data.user.id,email:o.email,full_name:o.name,role:'teacher',teacher_code:o.code,school:o.school||'THCS & THPT Vĩnh Hòa'}],{onConflict:'id'});}
            showToast('Đã tạo tài khoản Cloud cho giáo viên ✓','success');
        }catch(err){showToast('Không tạo được tài khoản Cloud: '+(err&&err.message||err),'error');}
        return;
    }
    if(/PGRST202|Could not find the function|does not exist/i.test(m)){showToast('Cloud chưa có hàm đặt lại mật khẩu — hãy chạy lại tệp supabase_setup.sql','error');return;}
    if(/quản trị viên/i.test(m)){showToast('Tài khoản admin chưa có quyền "superadmin" trên Cloud — xem hướng dẫn SQL','error');return;}
    showToast('Không đổi được mật khẩu trên Cloud: '+m,'error');
}
