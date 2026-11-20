/* ========== GEMINI AI ========== */
const GeminiAI = {
    LS_KEY:'hv_gemini_api_key', LS_MODEL:'hv_gemini_model', DEFAULT_MODEL:'gemini-1.5-flash', ENDPOINT:'https://generativelanguage.googleapis.com/v1beta/models',
    getApiKey(){return safeGetItem(this.LS_KEY,'');}, setApiKey(k){safeSetItem(this.LS_KEY,(k||'').trim());},
    getModel(){return safeGetItem(this.LS_MODEL,this.DEFAULT_MODEL);}, setModel(m){safeSetItem(this.LS_MODEL,(m||'').trim()||this.DEFAULT_MODEL);},
    hasKey(){return !!this.getApiKey();},
    async generate({prompt,systemPrompt='',temperature=0.7,maxTokens=2048}){ const key=this.getApiKey(); if(!key)throw new Error('Chưa cấu hình Gemini Key'); const url=`${this.ENDPOINT}/${this.getModel()}:generateContent?key=${encodeURIComponent(key)}`; const body={contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature,maxOutputTokens:maxTokens}}; if(systemPrompt)body.systemInstruction={parts:[{text:systemPrompt}]}; const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.error?.message||`HTTP ${res.status}`);} const d=await res.json(); return (d?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim(); },
    async chat({history=[],userMessage,systemPrompt='',temperature=0.75}){ const key=this.getApiKey(); if(!key)throw new Error('Chưa cấu hình Key'); const url=`${this.ENDPOINT}/${this.getModel()}:generateContent?key=${encodeURIComponent(key)}`; const contents=[...history.map(h=>({role:h.role,parts:[{text:h.text}]})),{role:'user',parts:[{text:userMessage}]}]; const body={contents,generationConfig:{temperature,maxOutputTokens:2500}}; if(systemPrompt)body.systemInstruction={parts:[{text:systemPrompt}]}; const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.error?.message||`HTTP ${res.status}`);} const d=await res.json(); return (d?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim(); }
};
const AIChatState = { history: [] };
const CHATBOT_SYSTEM_PROMPT = `Bạn là "Cô giáo Ngữ Văn" của trường THCS & THPT Vĩnh Hòa. Phong cách: thân thiện, học thuật, dẫn chứng cụ thể. NGUYÊN TẮC: KHÔNG viết bài hộ HS. Chỉ gợi mở, phân tích, định hướng. Trả lời Markdown có cấu trúc. Xưng "Cô", gọi HS là "em".`;
async function geminiScoreRubric({topic, answerKey, rubricGuide, essay, rubric}) {
    const sys = `Bạn là GV chấm Ngữ Văn. NHIỆM VỤ: Chấm bài HS DỰA TRÊN ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM của GV. KHÔNG được tự suy diễn ngoài đáp án.
Trả về DUY NHẤT object JSON: {"totalScore":number,"criteria":[{"name":"","score":0,"max":4,"comment":"","matchedAnswer":"yes|partial|no"}],"strengths":[],"improvements":[],"overallFeedback":"","matchWithAnswer":number}`;
    const user = `ĐỀ BÀI: ${topic}\n\n📌 ĐÁP ÁN MẪU / TIÊU CHÍ CỦA GV:\n"""\n${answerKey || '(GV chưa cung cấp đáp án)'}\n"""\n\n📌 HƯỚNG DẪN CHẤM CHI TIẾT:\n"""\n${rubricGuide || '(Chưa có)'}\n"""\n\n📌 RUBRIC 8 TIÊU CHÍ:\n${JSON.stringify(rubric)}\n\n📌 BÀI LÀM HS:\n"""\n${essay}\n"""\n\nHãy chấm THEO ĐÁP ÁN TRÊN. Trả về JSON.`;
    const raw = await GeminiAI.generate({prompt:user,systemPrompt:sys,temperature:0.3,maxTokens:3000});
    const cleaned = raw.replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```\s*$/i,'').trim();
    try{return JSON.parse(cleaned);}catch(e){const m=cleaned.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);throw new Error('AI trả về không đúng JSON');}
}
function refreshGeminiUI(){ const inp=document.getElementById('geminiApiKeyInput'),mdl=document.getElementById('geminiModelInput'),st=document.getElementById('geminiStatus'); if(inp)inp.value=GeminiAI.getApiKey(); if(mdl)mdl.value=GeminiAI.getModel(); if(st){ if(GeminiAI.hasKey())st.innerHTML=`<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check-circle"></i> Sẵn sàng • ${escapeHtml(GeminiAI.getModel())}</span>`; else st.innerHTML=`<span class="text-amber-700 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> Chưa có Key</span>`; } }
function saveGeminiConfig(){ const k=document.getElementById('geminiApiKeyInput')?.value||''; const m=document.getElementById('geminiModelInput')?.value||''; GeminiAI.setApiKey(k); GeminiAI.setModel(m); refreshGeminiUI(); showToast(k?'Đã lưu Gemini Key!':'Đã xoá Key',k?'success':'error'); }
async function testGeminiConfig(){ const st=document.getElementById('geminiStatus'); st.innerHTML='<span class="text-red-600"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang test...</span>'; try{ const r=await GeminiAI.generate({prompt:'Trả lời đúng 1 từ: OK',temperature:0,maxTokens:5}); st.innerHTML=`<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check-circle"></i> OK! "${escapeHtml(r.substring(0,30))}"</span>`; SoundEngine.play('success'); }catch(e){ st.innerHTML=`<span class="text-rose-600 font-bold">${escapeHtml(e.message)}</span>`; SoundEngine.play('error'); } }

/* ========== AUTH HELPERS ========== */
function isSuperAdmin(){return currentUser&&currentUser.role==='superadmin';}
function isTeacherRole(){return currentUser&&(currentUser.role==='teacher'||currentUser.role==='superadmin');}
function isStudentRole(){return currentUser&&currentUser.role==='student';}
function isParentRole(){return currentUser&&currentUser.role==='parent';}
function parseTeacherCode(code){code=String(code||'').toLowerCase().trim();if(!code)return{valid:false};if(code===SUPER_ADMIN_CODE)return{valid:true,role:'superadmin',teacherCode:'bogiaoduc'};const m=code.match(/^bogiaoduc(\d+)$/);if(m)return{valid:true,role:'teacher',teacherCode:code};return{valid:false};}
function getTeacherByCode(code){if(!code)return null;const r=getTeacherRegistry();return r[code]||DEFAULT_TEACHERS[code]||null;}
function getTeacherName(code){const t=getTeacherByCode(code);return t?t.name:'Giáo viên';}
function getClassById(id){return classesData.find(c=>c.id===id);}
function getClassByCode(code){return classesData.find(c=>c.code===code);}
function getVisibleClasses(){if(isSuperAdmin())return classesData;if(isTeacherRole())return classesData.filter(c=>c.teacherCode===currentUser.teacherCode);if(isStudentRole()&&currentClassIdForUser)return classesData.filter(c=>c.id===currentClassIdForUser);return[];}
function getVisibleClassIds(){return getVisibleClasses().map(c=>c.id);}
function getClassLabel(id){const c=getClassById(id);if(!c)return'—';return `${c.name} — ${getTeacherName(c.teacherCode)}`;}
function getStudentsByClass(id){return studentsData.filter(s=>s.classId===id);}
function computeTBM(tx1,tx2,tx3,tx4,gk,ck){let s=0,w=0;const add=(v,k)=>{if(v!=null&&!isNaN(v)){s+=v*k;w+=k;}};add(tx1,1);add(tx2,1);add(tx3,1);add(tx4,1);add(gk,2);add(ck,3);if(w===0)return null;return Math.round((s/w)*10)/10;}
function getUniqueClasses(){ const seen={}; return classesData.filter(function(c){ const k=String(c.teacherCode||'')+'|'+String(c.name||'').trim().toLowerCase(); if(seen[k])return false; seen[k]=1; return true; }); }
function getAllTeachers(){ const m={}; const reg=Object.assign({},DEFAULT_TEACHERS,getTeacherRegistry()); getUniqueClasses().forEach(c=>{if(!m[c.teacherCode])m[c.teacherCode]={code:c.teacherCode,name:reg[c.teacherCode]?.name||'GV',classCount:0,studentCount:0};m[c.teacherCode].classCount++;}); Object.keys(reg).forEach(code=>{if(!m[code])m[code]={code,name:reg[code].name,classCount:0,studentCount:0};}); Object.values(m).forEach(t=>{const ids=classesData.filter(c=>c.teacherCode===t.code).map(c=>c.id);t.studentCount=studentsData.filter(s=>ids.includes(s.classId)).length;}); if(isSuperAdmin())return Object.values(m); if(isTeacherRole())return Object.values(m).filter(t=>t.code===currentUser.teacherCode); return[]; }

/* ========== SINH TÀI KHOẢN HS ========== */
function generateStudentAccount(sid, name, classId, tc, extraTaken, skipExisting) {
    const cls = getClassById(classId);
    const className = cls ? removeDiacritics(String(cls.name||'')).replace(/[^A-Za-z0-9]/g,'') : 'Lop';
    const parts = (name||'').trim().split(/\s+/).filter(Boolean);
    const clean = function(p){ return removeDiacritics(p).replace(/[^A-Za-z0-9]/g,''); };
    const cap = function(p){ const c = clean(p); return c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : ''; };
    const last = parts[parts.length-1] || 'HS';
    const lastSlug = clean(last).toLowerCase() || 'hs';
    const middle = parts.length > 2 ? parts.slice(1,-1) : [];
    const midLast = middle.length ? clean(middle[middle.length-1]).toLowerCase() : '';
    const midAll = middle.map(function(p){ return clean(p).toLowerCase(); }).join('');
    const hoInit = parts.length > 1 ? clean(parts[0]).toLowerCase().charAt(0) : '';
    const taken = new Set(skipExisting ? [] : getStudentAccounts().map(function(a){ return String(a.email||'').toLowerCase(); }));
    (extraTaken||[]).forEach(function(e){ taken.add(String(e||'').toLowerCase()); });
    const cands = [lastSlug, midLast+lastSlug, midAll+lastSlug, hoInit+midAll+lastSlug].filter(function(x,i,arr){ return x && arr.indexOf(x)===i; });
    let local = cands.find(function(c){ return !taken.has(c+'@edu.vn'); });
    if (!local) { const base = cands[cands.length-1]; let n = 2; while (taken.has(base+n+'@edu.vn')) n++; local = base+n; }
    const given = parts.length > 1 ? parts.slice(1) : parts;
    const pass = (given.map(cap).join('') + className).replace(/[^A-Za-z0-9]/g,'') || randPass(8);
    const pc = 'PH-' + String(sid).replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,6) + '-' + randCode(4);
    return { studentId: sid, classId, teacherCode: tc, email: local + '@edu.vn', password: pass, parentCode: pc, parentPassword: randPass(6) };
}
async function normalizeClassAccounts(cidArg){
    if(!isTeacherRole()){showToast('Chỉ giáo viên','error');return;}
    const cid=cidArg||document.getElementById('exportClassSelect')?.value||'ALL';
    if(!cid||cid==='ALL'){showToast('Hãy chọn một lớp cụ thể','error');return;}
    if(!getVisibleClassIds().includes(cid)){showToast('Bạn không có quyền với lớp này','error');return;}
    const studs=studentsData.filter(function(s){return s.classId===cid;});
    if(!studs.length){showToast('Lớp chưa có học sinh','info');return;}
    showConfirm('Chuẩn hóa tài khoản lớp này?','Email và mật khẩu của '+studs.length+' học sinh sẽ được tạo lại theo quy tắc: email theo tên (vd thanhdat@edu.vn), mật khẩu dạng ThanhDat12B. Học sinh phải dùng thông tin mới — hãy xuất lại file gửi các em.',async function(){
        const old=getStudentAccounts();const other=old.filter(function(a){return a.classId!==cid;}).map(function(a){return String(a.email||'').toLowerCase();});
        const last=function(n){const p=String(n||'').trim().split(/\s+/);return p[p.length-1]||'';};
        const ordered=studs.slice().sort(function(a,b){return last(a.name).localeCompare(last(b.name),'vi')||a.name.localeCompare(b.name,'vi');});
        const tc=(getClassById(cid)||{}).teacherCode||'';const used=other.slice();const fresh=[];
        ordered.forEach(function(st){
            const prev=old.find(function(a){return a.studentId===st.id&&a.classId===cid;});
            const a=generateStudentAccount(st.id,st.name,cid,tc,used,true);used.push(a.email);
            if(prev){a.parentCode=prev.parentCode||a.parentCode;a.parentPassword=prev.parentPassword||a.parentPassword;}
            fresh.push(a);
        });
        const ok=await SupabaseDB.commit(async function(){
            await SupabaseDB.upsertAccounts(fresh.map(function(a){return Object.assign({},a,{email:'tmp'+Math.random().toString(36).slice(2,9)+'@tmp.edu.vn'});}));
            await SupabaseDB.upsertAccounts(fresh);
        });
        if(!ok)return;
        const keep=old.filter(function(a){return a.classId!==cid;});saveStudentAccounts(keep.concat(fresh));
        const pc=getParentCodes();Object.keys(pc).forEach(function(k){if(pc[k].classId===cid)delete pc[k];});fresh.forEach(function(a){pc[a.parentCode]={studentId:a.studentId,classId:a.classId,password:a.parentPassword};});saveParentCodes(pc);
        saveLocalData();try{renderStudentTable();}catch(_){}try{renderExportAccounts();}catch(_){}
        showToast('Đã chuẩn hóa '+fresh.length+' tài khoản — hãy xuất lại file gửi học sinh','success');
    });
}

/* ========== PORTAL HS ========== */
function showPortalLink(){ showPortalPage(); }
function showPortalPage(){ showCommunityPage(); }
function showAccountPortal(){
    document.getElementById('landingPage').style.display='none';
    document.getElementById('appShell').classList.add('hidden');
    document.getElementById('appShell').classList.remove('flex');
    const pp = document.getElementById('portalPage');
    pp.classList.remove('hidden');
    pp.style.display='flex';
    portalReset();
}
function portalReset(){
    document.getElementById('portalStep1').classList.remove('hidden');
    document.getElementById('portalStep2').classList.add('hidden');
    document.getElementById('portalStep3').classList.add('hidden');
    document.getElementById('portalErr').innerText='';
    document.getElementById('portalClassCode').value='';
}
function portalExit(){
    document.getElementById('portalPage').style.display='none';
    document.getElementById('portalPage').classList.add('hidden');
    showCommunityPage();
}
function portalLookup(){
    const code = (document.getElementById('portalClassCode').value||'').trim().toUpperCase();
    const err = document.getElementById('portalErr');
    if (!code) { err.innerText = '⚠️ Nhập mã lớp!'; return; }
    const cls = getClassByCode(code);
    if (!cls) { err.innerText = '❌ Không tìm thấy lớp với mã này!'; SoundEngine.play('error'); return; }
    err.innerText = '';
    document.getElementById('portalStep1').classList.add('hidden');
    document.getElementById('portalStep2').classList.remove('hidden');
    document.getElementById('portalClassName').innerText = cls.name + ' — ' + getTeacherName(cls.teacherCode);
    const students = getStudentsByClass(cls.id);
    const accounts = getStudentAccounts();
    const takenBy = {};
    try { const map = JSON.parse(safeGetItem('hv_portal_taken')||'{}'); Object.assign(takenBy, map); } catch(e){}
    const takenList = takenBy[cls.id] || [];
    const list = document.getElementById('portalStudentList');
    if (!students.length) { list.innerHTML = '<p style="color:rgba(255,255,255,.5); font-size:12px; text-align:center; padding:20px;">Lớp chưa có học sinh.</p>'; return; }
    list.innerHTML = students.map(s => {
        const acc = accounts.find(a => a.studentId===s.id && a.classId===cls.id);
        const isTaken = takenList.includes(s.id);
        const canTake = acc && !isTaken;
        return `<button class="portal-student-btn ${isTaken?'chosen':''}" onclick="${canTake?`portalChoose('${cls.id}','${s.id}')`:''}" ${canTake?'':'disabled'}>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#dc2626,#059669); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:900;">${(s.name||'').split(' ').map(n=>n[0]).slice(-2).join('').toUpperCase()}</div>
                    <div style="text-align:left;">
                        <div style="font-size:13px; font-weight:800;">${escapeHtml(s.name)}</div>
                        <div style="font-size:10px; color:rgba(255,255,255,.5); font-family:monospace;">${s.id}</div>
                    </div>
                </div>
                ${isTaken?'<span style="font-size:10px; color:#10b981; font-weight:900;">✓ Đã lấy</span>':(acc?'<span style="font-size:10px; color:#fbbf24; font-weight:900;">Còn trống</span>':'<span style="font-size:10px; color:#f87171;">Chưa có TK</span>')}
            </div>
        </button>`;
    }).join('');
}
function portalChoose(classId, studentId) {
    const cls = getClassById(classId);
    const stu = studentsData.find(s => s.id===studentId && s.classId===classId);
    const acc = getStudentAccounts().find(a => a.studentId===studentId && a.classId===classId);
    if (!cls || !stu || !acc) { showToast('Lỗi dữ liệu!','error'); return; }
    let takenBy = {};
    try { takenBy = JSON.parse(safeGetItem('hv_portal_taken')||'{}'); } catch(e){}
    if (!takenBy[classId]) takenBy[classId] = [];
    if (takenBy[classId].includes(studentId)) { showToast('Tài khoản này đã bị lấy!','error'); return; }
    takenBy[classId].push(studentId);
    safeSetItem('hv_portal_taken', JSON.stringify(takenBy));
    document.getElementById('portalStep2').classList.add('hidden');
    document.getElementById('portalStep3').classList.remove('hidden');
    document.getElementById('portalStudentName').innerText = stu.name;
    document.getElementById('portalEmail').innerText = acc.email;
    document.getElementById('portalPass').innerText = acc.password;
    document.getElementById('portalClassCodeShow').innerText = cls.code;
    SoundEngine.play('achievement');
    if (window.confetti) confetti({particleCount:80,spread:80,origin:{y:.7}});
    broadcastRT('portal_taken', {classId, studentId});
}
function portalGoLogin(){
    const email = document.getElementById('portalEmail').innerText;
    const clsCode = document.getElementById('portalClassCodeShow').innerText;
    portalExit();
    showAuth('login');
    setTimeout(() => {
        const e = document.getElementById('loginEmail'); if (e) e.value = email;
        const c = document.getElementById('loginClassCode'); if (c) c.value = clsCode;
        const p = document.getElementById('loginPassword'); if (p) p.focus();
    }, 300);
}

/* ========== AUTH FLOW ========== */
function showAuth(tab){const a=document.getElementById('authOverlay');a.classList.remove('hidden');a.style.display='flex';switchAuthTab(tab||'login');try{gsap.fromTo(a,{opacity:0},{opacity:1,duration:.3});gsap.fromTo('.glass-panel-dark',{y:30,opacity:0,scale:.96},{y:0,opacity:1,scale:1,duration:.5,ease:'back.out(1.4)'});}catch(e){}}
function hideAuth(){const a=document.getElementById('authOverlay');try{gsap.to(a,{opacity:0,duration:.25,onComplete:()=>{a.classList.add('hidden');a.style.display='';}});}catch(e){a.classList.add('hidden');a.style.display='';}}
function switchAuthTab(tab){
    const tabs={login:'authTabLoginBtn',register:'authTabRegisterBtn',parent:'authTabParentBtn'};
    Object.values(tabs).forEach(id=>{const el=document.getElementById(id);if(el)el.style.cssText='background:transparent;color:rgba(255,255,255,.6);box-shadow:none;';});
    const act=document.getElementById(tabs[tab]);
    if(act)act.style.cssText='background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;box-shadow:0 4px 12px rgba(220,38,38,.4);';
    ['loginForm','registerForm','parentForm'].forEach(id=>document.getElementById(id).classList.add('hidden'));
    const fid={login:'loginForm',register:'registerForm',parent:'parentForm'}[tab]||'loginForm';
    document.getElementById(fid).classList.remove('hidden');
}
function showApp(){try{SupabaseDB.startRealtime();}catch(_){}try{ if(!SupabaseDB._full) SupabaseDB.syncFromCloud().then(function(){ try{SupabaseDB.renderAll();}catch(_){} }); }catch(_){}document.getElementById('landingPage').style.display='none';document.getElementById('portalPage').style.display='none';const s=document.getElementById('appShell');s.classList.remove('hidden');s.classList.add('flex');try{gsap.fromTo(s,{opacity:0,y:10},{opacity:1,y:0,duration:.4});}catch(e){}}
function showLanding(){try{hideCommunity();}catch(_){}document.getElementById('landingPage').style.display='block';document.getElementById('portalPage').style.display='none';const s=document.getElementById('appShell');s.classList.add('hidden');s.classList.remove('flex');window.scrollTo({top:0,behavior:'smooth'});}

async function handleLogin(e){
    e.preventDefault();
    const email=document.getElementById('loginEmail').value.trim();
    const pass=document.getElementById('loginPassword').value;
    const tcode=document.getElementById('loginTeacherCode').value.trim();
    const ccode=hvCleanCred(document.getElementById('loginClassCode').value).replace(/\s+/g,'').toUpperCase();
    // Học sinh: đăng nhập qua RPC (không đọc student_accounts phía client)
    if(ccode && !tcode){
        if(!SupabaseDB.online){ SoundEngine.play('error'); showToast('Cần kết nối cloud!','error'); return; }
        try{
            let row=null,lastErr=null,usedEmail=email;
            for(const cand of hvCredCandidates(email,pass)){
                const r=await SupabaseDB.client.rpc('hv_student_login',{p_class_code:ccode,p_email:cand.e,p_password:cand.p});
                if(r.error){lastErr=r.error;continue;}
                if(r.data&&r.data[0]){row=r.data[0];usedEmail=cand.e;break;}
            }
            if(!row){if(lastErr)throw lastErr;throw new Error('Sai thông tin đăng nhập — kiểm tra email, mật khẩu, mã lớp (chú ý viết hoa và khoảng trắng)');}
            currentUser = {
                name: row.student_name, email: usedEmail,
                role: 'student', classId: row.class_id,
                studentId: row.student_id, sessionToken: row.token,
                teacherCode: row.teacher_code || ''
            };
            currentClassIdForUser = row.class_id;
            try{ onlineStudents.add(row.student_id); }catch(_){}
            safeSetItem('hv_session_token', row.token);
            safeSessionSet('hv_current_user', JSON.stringify(currentUser));
            try{ SupabaseDB.startRealtime(); }catch(_){}
            hideAuth();
            setTimeout(()=>{ showApp(); setupNavigationByRole(); updateUserUI(); showToast(`Chào ${row.student_name}!`,'success'); }, 200);
        }catch(e){ SoundEngine.play('error'); showToast(e.message || 'Sai thông tin','error'); }
        return;
    }
    // Giáo viên / Admin: BẮT BUỘC nhập Mã GV
    if(!tcode){ SoundEngine.play('error'); showToast('Giáo viên vui lòng nhập Mã GV (học sinh nhập Mã lớp).','error'); return; }
    if(!parseTeacherCode(tcode).valid){ SoundEngine.play('error'); currentUser=null;showToast('Mã GV sai!','error'); return; }
    // Giáo viên / Admin: ưu tiên Supabase Auth
    let cloudErr='';
    if(SupabaseDB.online){
        const r = await hvSignInRobust(email, pass);
        if(r.ok){
            const p = r.profile || {};
            currentUser = {
                name: p.full_name || r.user.user_metadata?.full_name || email,
                email: r.user.email,
                role: p.role || r.user.user_metadata?.role || 'teacher',
                teacherCode: p.teacher_code || r.user.user_metadata?.teacher_code || tcode || '',
                school: p.school || r.user.user_metadata?.school || 'THCS & THPT Vĩnh Hòa',
                authId: r.user.id
            };
            {
                const parsed=parseTeacherCode(tcode);
                if(!parsed.valid){ SoundEngine.play('error'); currentUser=null;showToast('Mã GV sai!','error'); return; }
                const profCode=String(p.teacher_code||r.user.user_metadata?.teacher_code||'').toLowerCase();
                const profRole=String(p.role||r.user.user_metadata?.role||'').toLowerCase();
                if(profCode && profCode!==String(parsed.teacherCode).toLowerCase()){ try{ SupabaseDB.client.auth.signOut({scope:'local'}); }catch(_){} SoundEngine.play('error'); currentUser=null;showToast('Mã GV không khớp với tài khoản này!','error'); return; }
                if(!profCode && parsed.role==='superadmin' && profRole!=='superadmin' && profRole!=='admin'){ try{ SupabaseDB.client.auth.signOut({scope:'local'}); }catch(_){} SoundEngine.play('error'); currentUser=null;showToast('Tài khoản này không có quyền Admin!','error'); return; }
                currentUser.role=parsed.role;
                currentUser.teacherCode=parsed.teacherCode;
            }
            if(currentUser.teacherCode===SUPER_ADMIN_CODE) currentUser.role='superadmin';
            safeSessionSet('hv_current_user',JSON.stringify(currentUser));
            try{ await SupabaseDB.syncFromCloud(); }catch(_){}
            try{ SupabaseDB.startRealtime(); }catch(_){}
            hideAuth();
            setTimeout(()=>{showApp();setupNavigationByRole();updateUserUI();showToast(`Chào ${currentUser.name}!`,'success');},200);
            return;
        }
        // Cloud fail → fallback local
        console.warn('Supabase login fallback:', r.error); cloudErr = r.error || 'unknown';
    }
    let u=getUsers().find(x=>x.email.toLowerCase()===email.toLowerCase()&&x.password===pass);
    if(!u)u=DEFAULT_USERS.find(x=>x.email.toLowerCase()===email.toLowerCase()&&x.password===pass);
    if(!u){SoundEngine.play('error');showToast(hvCloudErrMsg(cloudErr)||'TK hoặc MK sai!','error');return;}
    currentUser={...u};
    if(tcode){
        const p=parseTeacherCode(tcode);
        if(p.valid&&u.teacherCode&&String(u.teacherCode).toLowerCase()!==String(p.teacherCode).toLowerCase()){SoundEngine.play('error');currentUser=null;showToast('Mã GV không khớp với tài khoản này!','error');return;}
        if(p.valid){currentUser.role=p.role;currentUser.teacherCode=p.teacherCode;const rt=getTeacherByCode(p.teacherCode);if(rt){if(!currentUser.name)currentUser.name=rt.name;if(!currentUser.email)currentUser.email=rt.email;if(!currentUser.school)currentUser.school=rt.school||'';}}
        else{SoundEngine.play('error');currentUser=null;showToast('Mã GV sai!','error');return;}
    }
    safeSessionSet('hv_current_user',JSON.stringify(currentUser));
    if(cloudErr&&SupabaseDB.online){ try{ hvMigrateToast(await hvMigrateLocalTeacher(u,pass,tcode)); }catch(_){} }
    if(SupabaseDB.online){ try{ await SupabaseDB.syncFromCloud(); }catch(_){} try{ SupabaseDB.startRealtime(); }catch(_){} }
    hideAuth();
    setTimeout(()=>{showApp();setupNavigationByRole();updateUserUI();showToast(`Chào ${currentUser.name}!`,'success');},200);
}
async function handleRegister(e){
    e.preventDefault();
    const name=document.getElementById('regName').value.trim();
    const email=document.getElementById('regEmail').value.trim();
    const password=document.getElementById('regPassword').value;
    const tcode=document.getElementById('regTeacherCode').value.trim();
    const school=document.getElementById('regSchool').value.trim()||'THCS & THPT Vĩnh Hòa';
    if(!name||!tcode||!email||!password){showToast('Nhập đủ!','error');return;}
    if(password.length<6){showToast('Mật khẩu tối thiểu 6 ký tự','error');return;}
    const p=parseTeacherCode(tcode);
    if(!p.valid){showToast('Mã GV sai!','error');return;}
    if(SupabaseDB.online){
        const r = await SupabaseDB.signUpTeacher({email, password, name, teacherCode:p.teacherCode, school});
        if(!r.ok){ showToast('Lỗi đăng ký: '+(r.error||''),'error'); SoundEngine.play('error'); return; }
        const newU={name,email,password,role:p.role,teacherCode:p.teacherCode,school,authId:r.data?.user?.id};
        const users=getUsers(); users.push(newU); saveUsers(users);
        const reg=getTeacherRegistry(); reg[p.teacherCode]={name,email,school}; saveTeacherRegistry(reg);
        currentUser=newU;
        safeSessionSet('hv_current_user',JSON.stringify(currentUser));
        try{ await SupabaseDB.syncFromCloud(); }catch(_){}
        hideAuth();
        setTimeout(()=>{showApp();setupNavigationByRole();updateUserUI();showToast(`ĐK thành công: ${name}`,'success');},200);
        return;
    }
    const users=getUsers();
    const allKnown = [...users, ...DEFAULT_USERS];
    if(allKnown.some(x=>x.email.toLowerCase()===email.toLowerCase())){showToast('❌ Email đã được đăng ký! Hãy đăng nhập.','error');SoundEngine.play('error');return;}
    const newU={name,email,password,role:p.role,teacherCode:p.teacherCode,school};
    users.push(newU);saveUsers(users);
    const reg=getTeacherRegistry();reg[p.teacherCode]={name,email,school};saveTeacherRegistry(reg);
    currentUser=newU;
    safeSessionSet('hv_current_user',JSON.stringify(currentUser));
    hideAuth();
    broadcastRT('teacher_registered',{email});
    setTimeout(()=>{showApp();setupNavigationByRole();updateUserUI();showToast(`ĐK thành công: ${name}`,'success');},200);
}
async function handleParentLogin(e){
    e.preventDefault();
    const code=document.getElementById('parentCode').value.trim().toUpperCase();
    const pass=document.getElementById('parentPassword').value;
    if(!SupabaseDB.online){ showToast('Cần kết nối cloud!','error'); return; }
    try{
        const { data, error } = await SupabaseDB.client.rpc('hv_parent_login', {
            p_code: code, p_password: pass
        });
        if(error) throw error;
        const row = data?.[0];
        if(!row) throw new Error('Sai mã PH');
        currentUser = {
            name: 'PH của '+row.child_name, email: 'parent@local',
            role: 'parent', parentCode: code, childId: row.child_id,
            childClassId: row.class_id, sessionToken: row.token
        };
        safeSetItem('hv_session_token', row.token);
        safeSessionSet('hv_current_user', JSON.stringify(currentUser));
        hideAuth();
        setTimeout(()=>{ showApp(); setupNavigationByRole(); updateUserUI(); showToast('Xin chào PH!','success'); }, 200);
    }catch(e){ showToast(e.message || 'Sai mã','error'); }
}
function handleLogout(){showConfirm('Xác nhận đăng xuất?','Bạn có chắc muốn đăng xuất?',async()=>{try{SupabaseDB.stopPresence();}catch(_){}try{hvReleaseSession();}catch(_){}if(typeof endCall==='function')endCall();if(isStudentRole()&&currentUser){const stu=studentsData.find(s=>s.id===currentUser.studentId);if(stu){onlineStudents.delete(stu.id);saveLocalData();}}try{await SupabaseDB.signOut();}catch(_){}currentUser=null;currentClassIdForUser=null;safeSessionRemove('hv_current_user');showLanding();showToast('Đã đăng xuất!','success');});}
function checkAuth(){const u=safeSessionGet('hv_current_user');if(u){try{currentUser=JSON.parse(u);if(isStudentRole()&&currentUser.classId)currentClassIdForUser=currentUser.classId;hideAuth();showApp();setupNavigationByRole();updateUserUI();return;}catch(e){}}showLanding();}
async function handleSaveSettings(e){e.preventDefault();if(!currentUser)return;const name=document.getElementById('settingsName').value.trim();const email=document.getElementById('settingsEmail').value.trim();const school=document.getElementById('settingsSchool').value.trim();if(currentUser.teacherCode){const reg0=getTeacherRegistry();const ok=await SupabaseDB.commit(async function(){const tid=await SupabaseDB.saveTeacherRow({id:(reg0[currentUser.teacherCode]||{}).id,email,name,teacher_code:currentUser.teacherCode,school});if(currentUser.authId){const {error}=await SupabaseDB.client.from('profiles').update({full_name:name,school:school}).eq('id',currentUser.authId);if(error)throw error;}return tid;});if(!ok)return;}currentUser.name=name;currentUser.email=email;currentUser.school=school;if(currentUser.teacherCode){const r=getTeacherRegistry();r[currentUser.teacherCode]={...(r[currentUser.teacherCode]||{}),name,email,school};saveTeacherRegistry(r);}safeSessionSet('hv_current_user',JSON.stringify(currentUser));updateUserUI();showToast('Đã lưu!','success');}

