/* =====================================================================
   v4.4.1 · XUẤT TÀI KHOẢN THEO LỚP · XÓA DS LỚP · 1 TÀI KHOẢN = 1 THIẾT BỊ
   ===================================================================== */
function hvSlug(t){return removeDiacritics(String(t||'')).replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'Lop';}
function hvAccRows(cf){
    const accounts=getStudentAccounts();const visIds=getVisibleClassIds();const pc=getParentCodes();
    let f=accounts.filter(function(a){return visIds.indexOf(a.classId)!==-1;});
    if(cf&&cf!=='ALL')f=f.filter(function(a){return a.classId===cf;});
    const rows=f.map(function(a){
        const s=studentsData.find(function(x){return x.id===a.studentId&&x.classId===a.classId;});const c=getClassById(a.classId);
        const pk=Object.keys(pc).find(function(k){return pc[k].studentId===a.studentId&&pc[k].classId===a.classId;});
        return {name:s?s.name:'',sid:a.studentId,cls:c?c.name:'',classId:a.classId,code:c?c.code:'',email:a.email,pass:a.password,pcode:pk||'',ppass:pk?pc[pk].password:'',link:location.origin+location.pathname+'?portal=1&class='+encodeURIComponent(c?c.code:'')+'&hs='+encodeURIComponent(a.studentId)};
    });
    const last=function(n){const p=String(n||'').trim().split(/\s+/);return p[p.length-1]||'';};
    rows.sort(function(a,b){return a.cls.localeCompare(b.cls,'vi')||last(a.name).localeCompare(last(b.name),'vi')||a.name.localeCompare(b.name,'vi');});
    return rows;
}
function hvSelectedClassName(cf){if(!cf||cf==='ALL')return 'TatCaLop';const c=getClassById(cf);return hvSlug(c?c.name:'Lop');}
function exportAccountsExcel(){
    const cf=document.getElementById('exportClassSelect')?.value||'ALL';const rows=hvAccRows(cf);
    if(!rows.length){showToast('Chưa có TK!','error');return;}
    const wb=XLSX.utils.book_new();const by={};rows.forEach(function(r){(by[r.cls]=by[r.cls]||[]).push(r);});const used={};
    Object.keys(by).forEach(function(cn){
        const data=by[cn].map(function(r,i){return {'STT':i+1,'Họ và tên':r.name,'Mã HS':r.sid,'Lớp':r.cls,'Mã lớp':r.code,'Email đăng nhập':r.email,'Mật khẩu':r.pass,'Link đăng nhập':r.link};});
        const ws=XLSX.utils.json_to_sheet(data);ws['!cols']=[{wch:5},{wch:26},{wch:16},{wch:12},{wch:10},{wch:26},{wch:22},{wch:70}];
        let nm=String(cn||'Lop').replace(/[:\\\/?*\[\]]/g,'').slice(0,28)||'Lop';let k=nm,n=2;while(used[k]){k=nm.slice(0,26)+'_'+n++;}used[k]=1;
        XLSX.utils.book_append_sheet(wb,ws,k);
    });
    XLSX.writeFile(wb,'HOCVAN_TAIKHOAN_'+hvSelectedClassName(cf)+'_'+new Date().toISOString().slice(0,10)+'.xlsx');showToast('Đã xuất file Excel theo lớp!','success');
}
function exportAccountsCSV(){
    const cf=document.getElementById('exportClassSelect')?.value||'ALL';const rows=hvAccRows(cf);
    if(!rows.length){showToast('Chưa có TK!','error');return;}
    const out=[['STT','Họ và tên','Mã HS','Lớp','Mã lớp','Email đăng nhập','Mật khẩu','Link đăng nhập']];
    rows.forEach(function(r,i){out.push([i+1,r.name,r.sid,r.cls,r.code,r.email,r.pass,r.link]);});
    const csv='\uFEFF'+out.map(function(r){return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    const a=document.createElement('a');a.href=hvObjUrl(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.download='HOCVAN_TAIKHOAN_'+hvSelectedClassName(cf)+'_'+new Date().toISOString().slice(0,10)+'.csv';a.click();showToast('Đã xuất CSV!','success');
}
function exportAccountsPrint(){
    const cf=document.getElementById('exportClassSelect')?.value||'ALL';const rows=hvAccRows(cf);
    if(!rows.length){showToast('Chưa có TK!','error');return;}
    const E=escapeHtml;const by={};rows.forEach(function(r){(by[r.cls]=by[r.cls]||[]).push(r);});
    const pages=Object.keys(by).map(function(cn){return '<section><h2>Lớp '+E(cn)+' <small>— '+by[cn].length+' học sinh</small></h2><div class="grid">'+by[cn].map(function(r,i){return '<div class="card"><div class="top"><b>HỌC VĂN</b><span>THCS &amp; THPT Vĩnh Hòa</span></div><div class="nm">'+(i+1)+'. '+E(r.name)+'</div><div class="ln"><i>Lớp</i><b>'+E(r.cls)+'</b></div><div class="ln"><i>Email</i><b>'+E(r.email)+'</b></div><div class="ln"><i>Mật khẩu</i><b>'+E(r.pass)+'</b></div><div class="ft">Mỗi tài khoản chỉ đăng nhập được trên 1 thiết bị tại một thời điểm. Không chia sẻ mật khẩu.</div></div>';}).join('')+'</div></section>';}).join('');
    const html='<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Tài khoản HỌC VĂN</title><style>*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;margin:0;padding:18px;background:#f3f4f6;color:#111}h2{font-size:18px;margin:6px 0 12px}h2 small{font-weight:500;color:#666;font-size:13px}.bar{position:sticky;top:0;background:#111;color:#fff;padding:10px 16px;margin:-18px -18px 16px;display:flex;gap:10px;align-items:center;justify-content:space-between;font-size:13px}.bar button{background:#dc2626;color:#fff;border:0;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.card{background:#fff;border:1.5px dashed #9ca3af;border-radius:12px;padding:12px 14px;break-inside:avoid;page-break-inside:avoid}.top{display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#666;border-bottom:2px solid #dc2626;padding-bottom:5px;margin-bottom:8px}.top b{color:#dc2626;font-size:13px;letter-spacing:.06em}.nm{font-weight:800;font-size:14px;margin-bottom:6px}.ln{display:flex;gap:8px;font-size:12px;padding:2px 0}.ln i{font-style:normal;color:#666;width:68px;flex:none}.ln b{font-family:Consolas,monospace;word-break:break-all}.ft{margin-top:7px;font-size:9.5px;color:#888}section{page-break-after:always;margin-bottom:24px}section:last-child{page-break-after:auto}@media print{body{background:#fff;padding:0}.bar{display:none}.grid{gap:8px}}</style></head><body><div class="bar"><span>Cắt theo đường nét đứt và phát riêng cho từng em · Chọn “Lưu dưới dạng PDF” để gửi file</span><button onclick="window.print()">🖨️ In / Lưu PDF</button></div>'+pages+'</body></html>';
    const w=window.open('','_blank');if(!w){showToast('Trình duyệt chặn cửa sổ mới — hãy cho phép pop-up','error');return;}
    w.document.open();w.document.write(html);w.document.close();
}
function deleteClassStudents(cidArg){
    if(!isTeacherRole()){showToast('Chỉ giáo viên','error');return;}
    const cid=cidArg||document.getElementById('studentClassFilter')?.value||'ALL';
    if(!cid||cid==='ALL'){showToast('Hãy chọn một lớp cụ thể trước khi xóa danh sách','error');return;}
    if(!getVisibleClassIds().includes(cid)){showToast('Bạn không có quyền với lớp này','error');return;}
    const cls=getClassById(cid);const n=studentsData.filter(function(s){return s.classId===cid;}).length;
    if(!n){showToast('Lớp này chưa có học sinh','info');return;}
    showConfirm('Xóa toàn bộ danh sách lớp '+(cls?cls.name:'')+'?','Sẽ xóa '+n+' học sinh cùng tài khoản của lớp này (bài nộp của các em cũng bị xóa). Sau đó thầy/cô có thể nhập lại danh sách. Không thể hoàn tác!',async function(){
        const ok=await SupabaseDB.commit(async function(){
            const c=SupabaseDB.client;let r=await c.from('students').delete().eq('class_id',cid);if(r.error)throw r.error;
            r=await c.from('student_accounts').delete().eq('class_id',cid);if(r.error)showCloudStatus('Không xóa được tài khoản HS trên cloud: '+r.error.message,'error');
            r=await c.from('submissions').delete().eq('class_id',cid);if(r.error)showCloudStatus('Không xóa được bài nộp của lớp trên cloud: '+r.error.message,'error');
        });
        if(!ok)return;
        studentsData=studentsData.filter(function(s){return s.classId!==cid;});submissionsData=submissionsData.filter(function(x){return x.classId!==cid;});
        saveStudentAccounts(getStudentAccounts().filter(function(a){return a.classId!==cid;}));
        const pc=getParentCodes();Object.keys(pc).forEach(function(k){if(pc[k].classId===cid)delete pc[k];});saveParentCodes(pc);
        saveLocalData();try{renderStudentTable();}catch(_){}try{populateStudentDropdowns();}catch(_){}try{renderClasses();}catch(_){}try{renderExportAccounts();}catch(_){}
        broadcastRT('student_updated',{});showToast('Đã xóa danh sách lớp — có thể nhập lại danh sách mới','success');
    });
}

/* ----- Mỗi tài khoản chỉ đăng nhập trên 1 thiết bị ----- */
const HV_SESS={ch:null,acct:null};
function hvSid(){let v=safeSessionGet('hv_sid');if(!v){v='sid'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);safeSessionSet('hv_sid',v);}return v;}
function hvAcctKey(u){if(!u)return '';return String(u.role||'u')+':'+String(u.studentId||u.teacherCode||u.email||u.name||'')+(u.classId?'@'+u.classId:'');}
function hvSleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function hvOthers(acct,sid){
    const out=[];if(!HV_SESS.ch)return out;
    const st=HV_SESS.ch.presenceState();
    Object.keys(st).forEach(function(k){(st[k]||[]).forEach(function(m){if(m&&m.acct===acct&&m.sid!==sid)out.push(m);});});
    return out;
}
async function hvClaimSession(){
    try{
        if(!currentUser)return true;
        if(!SupabaseDB.client)SupabaseDB.init();const c=SupabaseDB.client;
        if(!c||!SupabaseDB.online||navigator.onLine===false)return true;
        const acct=hvAcctKey(currentUser),sid=hvSid(),t0=Date.now();
        if(!HV_SESS.ch){
            const ch=c.channel('hv-sessions',{config:{presence:{key:sid}}});HV_SESS.ch=ch;
            const ready=new Promise(function(res){let done=false;const fin=function(v){if(!done){done=true;res(v);}};ch.subscribe(function(s){if(s==='SUBSCRIBED')fin(true);else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED')fin(false);});setTimeout(function(){fin(false);},4500);});
            if(!(await ready)){try{c.removeChannel(ch);}catch(_){}HV_SESS.ch=null;return true;}
        }
        await HV_SESS.ch.track({acct:acct,sid:sid,ts:t0,name:currentUser.name||''});
        await hvSleep(900);
        const earlier=hvOthers(acct,sid).filter(function(m){return (m.ts||0)<t0||((m.ts||0)===t0&&String(m.sid)<sid);});
        if(earlier.length){try{await HV_SESS.ch.untrack();}catch(_){}return false;}
        HV_SESS.acct=acct;return true;
    }catch(e){console.warn('claim session',e);return true;}
}
function hvReleaseSession(){try{if(HV_SESS.ch)HV_SESS.ch.untrack();}catch(_){}HV_SESS.acct=null;}
function hvSessionBlocked(){
    const who=currentUser?currentUser.name:'';
    currentUser=null;currentClassIdForUser=null;safeSessionRemove('hv_current_user');
    try{if(SupabaseDB.client)SupabaseDB.client.auth.signOut({scope:'local'});}catch(_){}
    try{const sh=document.getElementById('appShell');if(sh){sh.classList.add('hidden');sh.classList.remove('flex');}}catch(_){}
    try{showLanding();}catch(_){}
    const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;z-index:100066;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,17,23,.7);backdrop-filter:blur(8px)';
    o.innerHTML='<div style="max-width:420px;width:100%;background:#fff;color:#111;border-radius:24px;padding:26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.45)"><div style="font-size:46px">🔒</div><h3 style="font-family:Outfit,sans-serif;font-weight:900;font-size:20px;margin:8px 0">Tài khoản đang được đăng nhập</h3><p style="font-size:13px;line-height:1.7;color:#555">Tài khoản'+(who?' <b>'+escapeHtml(who)+'</b>':'')+' hiện đang đăng nhập trên một thiết bị khác. Mỗi tài khoản chỉ dùng được trên <b>1 thiết bị</b> tại một thời điểm.<br><br>Hãy đăng xuất ở thiết bị đó rồi thử lại. Nếu vừa đóng trình duyệt, chờ khoảng 30 giây. Nếu không phải em đăng nhập, hãy báo giáo viên để đổi mật khẩu.</p><button style="margin-top:16px;padding:12px 26px;border:0;border-radius:14px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;font-weight:900;cursor:pointer" onclick="this.closest(\'div[style*=fixed]\').remove()">Đã hiểu</button></div>';
    document.body.appendChild(o);
}
(function(){
    const _s=showApp;
    showApp=function(){
        const self=this,args=arguments;
        hvClaimSession().then(function(ok){if(!ok){hvSessionBlocked();return;}_s.apply(self,args);});
    };
    window.addEventListener('pagehide',hvReleaseSession);
})();

function hvPruneOrphanSubs(){
    if(typeof currentUser==='undefined'||!currentUser||!isTeacherRole()||!SupabaseDB._full)return;
    const vis=isSuperAdmin()?null:getVisibleClassIds();
    submissionsData=submissionsData.filter(function(s){
        if(vis&&vis.indexOf(s.classId)===-1)return true;
        return studentsData.some(function(st){return st.classId===s.classId&&((s.studentId&&st.id===s.studentId)||st.name===s.studentName);});
    });
}

