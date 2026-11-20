/* ========== SUPABASE ========== */
/* ===== Supabase config (hardcoded — không cần nhập tay) ===== */
const HV_SUPABASE_URL = 'https://nehjwjmgmxkgxujcpric.supabase.co';
const HV_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGp3am1nbXhrZ3h1amNwcmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDc3MDEsImV4cCI6MjEwNzYyMzcwMX0.3tgfX26YiEqGhmDkKjESxfLizCnTlaXKFtLmVCzS5sw';

const SupabaseDB = {
    LS_URL:'hv_supabase_url', LS_KEY:'hv_supabase_anon_key', client:null, online:false, authUser:null,
    getUrl(){ return HV_SUPABASE_URL || safeGetItem(this.LS_URL,'') || ''; },
    getKey(){ return HV_SUPABASE_ANON_KEY || safeGetItem(this.LS_KEY,'') || ''; },
    isConfigured(){ return !!(this.getUrl() && this.getKey()); },
    configure(u,k){
        if(u) safeSetItem(this.LS_URL, String(u).trim());
        if(k) safeSetItem(this.LS_KEY, String(k).trim());
        this.init();
    },
    init(){
        if(!this.isConfigured()){ this.online=false; return false; }
        if(typeof supabase==='undefined'){ this.online=false; return false; }
        try{
            this.client = supabase.createClient(this.getUrl(), this.getKey(), {
                auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
            });
            this.online = true;
            this.client.auth.getSession().then(({data})=>{ this.authUser = data?.session?.user || null; }).catch(()=>{});
            return true;
        }catch(e){ console.warn('Supabase init', e); this.online=false; return false; }
    },
    async signIn(email, password){
        if(!this.client) this.init();
        if(!this.client) return {ok:false, error:'Chưa cấu hình Supabase'};
        try{
            const { data, error } = await this.client.auth.signInWithPassword({ email, password });
            if(error) throw error;
            this.authUser = data.user;
            let profile=null;
            try{
                const { data:p } = await this.client.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
                profile = p;
            }catch(_){}
            return { ok:true, user:data.user, session:data.session, profile };
        }catch(e){ return { ok:false, error:e.message }; }
    },
    async signUpTeacher({email, password, name, teacherCode, school}){
        if(!this.client) this.init();
        if(!this.client) return {ok:false, error:'Chưa cấu hình Supabase'};
        try{
            const { data, error } = await this.client.auth.signUp({
                email, password,
                options:{ data:{ full_name:name, role:'teacher', teacher_code:teacherCode, school:school||'THCS & THPT Vĩnh Hòa' } }
            });
            if(error) throw error;
            try{
                await this.saveTeacherRow({ email, name, teacher_code:teacherCode, school:school||'THCS & THPT Vĩnh Hòa', auth_user_id: data.user?.id || null });
            }catch(te){ console.warn('teachers row', te); }
            if(data.user){
                await this.client.from('profiles').upsert([{
                    id:data.user.id, email, full_name:name,
                    role: teacherCode===SUPER_ADMIN_CODE ? 'superadmin' : 'teacher',
                    teacher_code:teacherCode, school:school||'THCS & THPT Vĩnh Hòa'
                }], { onConflict:'id' });
            }
            return { ok:true, data };
        }catch(e){ return { ok:false, error:e.message }; }
    },
    async signOut(){
        if(!this.client) return;
        try{ await this.client.auth.signOut(); }catch(_){}
        this.authUser=null;
    },
    TABLES_X:['discussions','chat_messages','khbd','rewards','schedule','grade_history','community_posts','feedback','materials'],
    uid(){
        try{ if(crypto && crypto.randomUUID) return crypto.randomUUID(); }catch(_){}
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){ const r=Math.random()*16|0; return (c==='x'?r:(r&3|8)).toString(16); });
    },
    ready(){
        if(!this.client) this.init();
        if(!this.client || !this.online){ showToast('Cần kết nối Supabase để lưu dữ liệu!','error'); return false; }
        return true;
    },
    async upsert(table, rows){
        rows = Array.isArray(rows) ? rows : [rows];
        for(let i=0;i<rows.length;i+=200){
            const { error } = await this.client.from(table).upsert(rows.slice(i,i+200), { onConflict:'id' });
            if(error) throw error;
        }
    },
    async upsertAccounts(list, ignore){
        list = Array.isArray(list) ? list : [list];
        if(!list.length) return;
        const dup = function(e){ return e && (e.code==='23505' || /duplicate|unique/i.test(e.message||'')); };
        const r = await this.client.from('student_accounts').upsert(list.map(function(a){ return SupabaseDB.row.accounts(a); }), { onConflict:'id', ignoreDuplicates: !!ignore });
        if(!r.error) return;
        if(!dup(r.error)) throw r.error;
        for(const a of list){
            for(let t=0;t<10;t++){
                const e = await this.client.from('student_accounts').upsert([this.row.accounts(a)], { onConflict:'id', ignoreDuplicates: !!ignore });
                if(!e.error) break;
                if(!dup(e.error) || t===9) throw e.error;
                const m = e.error.message || '';
                if(/email/i.test(m)){ const p = String(a.email).split('@'); a.email = p[0].replace(/\d{2,3}$/,'') + (Math.floor(Math.random()*900)+100) + '@' + (p[1]||'edu.vn'); }
                else if(/parent/i.test(m)){ a.parentCode = 'PH-' + String(a.studentId).replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,6) + '-' + Math.random().toString(36).slice(2,6).toUpperCase(); }
                else throw e.error;
            }
        }
    },
    _healT:null, _healBusy:false, _healLast:0,
    _scheduleHeal(){
        if(typeof currentUser==='undefined' || !currentUser || typeof isTeacherRole!=='function' || !isTeacherRole()) return;
        clearTimeout(this._healT);
        const self = this;
        this._healT = setTimeout(function(){
            if(self._healBusy || Date.now()-self._healLast < 45000) return;
            self.healAccounts().then(function(r){ if(r && (r.pushed||r.adopted)){ try{ showToast(r.adopted?('Đã đồng bộ '+r.adopted+' tài khoản học sinh theo Cloud ✓'):('Đã tự lưu '+r.pushed+' tài khoản học sinh lên Cloud ✓'),'success'); renderStudentTable(); }catch(_){} } }).catch(function(e){ console.warn('heal accounts', e); });
        }, 2500);
    },
    async healAccounts(force){
        if(this._healBusy || !this.client || !this.online) return {created:0,pushed:0,adopted:0};
        this._healBusy = true;
        try{
            const vis = getVisibleClassIds();
            const studs = studentsData.filter(function(s){ return vis.indexOf(s.classId)!==-1; });
            if(!studs.length) return {created:0,pushed:0,adopted:0};
            const accounts = getStudentAccounts().slice();
            const cloud = {};
            const classIds = Array.from(new Set(studs.map(function(s){ return s.classId; })));
            for(const cid of classIds){
                const r = await this.client.from('student_accounts').select('id,student_id,class_id,teacher_code,email,password_plain,parent_code,parent_password').eq('class_id', cid).limit(5000);
                if(!r.error && r.data) r.data.forEach(function(x){ cloud[x.id] = x; });
            }
            // 1) Cloud là nguồn đúng: nhận lại tài khoản đã có trên Cloud (không tạo mới đè lên, tránh lệch giữa các máy)
            let adopted = 0;
            studs.forEach(function(st){
                const c = cloud[st.id+'__'+st.classId];if(!c) return;
                const acc = { studentId:st.id, classId:st.classId, teacherCode:c.teacher_code||'', email:c.email, password:c.password_plain, parentCode:c.parent_code, parentPassword:c.parent_password };
                const i = accounts.findIndex(function(a){ return a.studentId===st.id && a.classId===st.classId; });
                if(i<0){ accounts.push(acc); adopted++; }
                else if(accounts[i].email!==acc.email || accounts[i].password!==acc.password){ accounts[i] = Object.assign({}, accounts[i], acc); adopted++; }
            });
            // 2) Chỉ tạo mới cho học sinh chưa có tài khoản ở cả máy lẫn Cloud
            const created = [];
            studs.forEach(function(st){
                if(!accounts.some(function(a){ return a.studentId===st.id && a.classId===st.classId; })){
                    const tc = (getClassById(st.classId)||{}).teacherCode || '';
                    const taken = accounts.concat(created).map(function(x){ return x.email; });
                    created.push(generateStudentAccount(st.id, st.name, st.classId, tc, taken));
                }
            });
            const mine = accounts.concat(created).filter(function(a){ return studs.some(function(st){ return st.id===a.studentId && st.classId===a.classId; }); });
            const missing = mine.filter(function(a){ return !cloud[a.studentId+'__'+a.classId]; });
            if(missing.length) await this.upsertAccounts(missing, true);
            if(created.length || adopted || missing.length){
                const all = accounts.concat(created);
                saveStudentAccounts(all);
                const pc = getParentCodes();
                all.forEach(function(a){ if(a.parentCode) pc[a.parentCode] = { studentId:a.studentId, classId:a.classId, password:a.parentPassword }; });
                saveParentCodes(pc);
            }
            return {created:created.length, pushed:missing.length, adopted:adopted};
        }catch(e){
            showCloudStatus('Không đồng bộ được tài khoản HS với Cloud: '+(e && e.message ? e.message : e),'error');
            return {created:0,pushed:0,adopted:0};
        }finally{ this._healBusy=false; this._healLast=Date.now(); }
    },
    async insert(table, row){
        const { error } = await this.client.from(table).insert([row]);
        if(error) throw error;
    },
    async remove(table, col, val){
        const { error } = await this.client.from(table).delete().eq(col, val);
        if(error) throw error;
    },
    async removeAll(table){
        const { error } = await this.client.from(table).delete().not('id','is',null);
        if(error) throw error;
    },
    async commit(fn){
        if(!this.ready()) return false;
        try{ await fn(); return true; }
        catch(e){
            console.warn('Supabase write failed', e);
            showCloudStatus('Lỗi Supabase: '+(e && e.message ? e.message : e),'error');
            try{ SoundEngine.play('error'); }catch(_){}
            return false;
        }
    },
    async saveTeacherRow(t){
        let id = t.id || null;
        if(!id && t.email){
            const r = await this.client.from('teachers').select('id').eq('email', t.email).limit(1);
            if(r.error) throw r.error;
            if(r.data && r.data[0]) id = r.data[0].id;
        }
        if(!id && t.teacher_code){
            const r = await this.client.from('teachers').select('id').eq('teacher_code', t.teacher_code).limit(1);
            if(r.error) throw r.error;
            if(r.data && r.data[0]) id = r.data[0].id;
        }
        if(!id) id = this.uid();
        const row = { id:id, email:t.email, name:t.name, teacher_code:t.teacher_code, school:t.school || 'THCS & THPT Vĩnh Hòa' };
        if(t.auth_user_id) row.auth_user_id = t.auth_user_id;
        const { error } = await this.client.from('teachers').upsert([row], { onConflict:'id' });
        if(error) throw error;
        return id;
    },
    row:{
        classes(c){ return { id:c.id, name:c.name, code:c.code, teacher_code:c.teacherCode, grade:c.grade, created_at:c.createdAt || new Date().toISOString() }; },
        students(s){ return {
            id:s.id, name:s.name, class_id:s.classId,
            tx1:s.tx1, tx2:s.tx2, tx3:s.tx3, tx4:s.tx4, gk:s.gk, ck:s.ck, tbm:s.tbm,
            nhan_xet:s.nhanXet, rubric_scores:s.rubricScores || [3,3,3,3,3,3,3,3],
            target:s.target, b1:s.b1, b2:s.b2, b3:s.b3, b4:s.b4, b5:s.b5,
            updated_at:new Date().toISOString()
        }; },
        assignments(a){
            const rest = Object.assign({}, a);
            ['id','title','topic','type','classId','teacherCode','answerKey','rubricGuide','deadline','attachments','createdBy','createdAt'].forEach(function(k){ delete rest[k]; });
            return {
                id:a.id, title:a.title, topic:a.topic, type:a.type, class_id:a.classId,
                teacher_code:a.teacherCode || (typeof getClassById==='function' && getClassById(a.classId) ? getClassById(a.classId).teacherCode : null) || (currentUser && currentUser.teacherCode) || null,
                answer_key:a.answerKey, rubric_guide:a.rubricGuide, deadline:a.deadline || null,
                attachments:a.attachments || [], created_by:a.createdBy, created_at:a.createdAt || new Date().toISOString(),
                data:rest
            };
        },
        submissions(s){
            const rest = Object.assign({}, s);
            ['id','studentId','studentName','assignmentId','classId','content','type','topic','score','comment','gradedBy','gradedAt','attachments','status','createdAt'].forEach(function(k){ delete rest[k]; });
            return {
                id:s.id, student_id:s.studentId || null, student_name:s.studentName || 'unknown',
                assignment_id:s.assignmentId || null, class_id:s.classId || null,
                content:s.content || '', type:s.type || '', topic:s.topic || '',
                score:(s.score===undefined?null:s.score), comment:s.comment || null,
                graded_by:s.gradedBy || null, graded_at:s.gradedAt || null,
                status:s.status || 'UNGRADED', attachments:s.attachments || [],
                created_at:s.createdAt || new Date().toISOString(), data:rest
            };
        },
        accounts(a){ return {
            id:a.studentId+'__'+a.classId, student_id:a.studentId, class_id:a.classId, teacher_code:a.teacherCode || null,
            email:a.email, password_plain:a.password, parent_code:a.parentCode, parent_password:a.parentPassword
        }; },
        extra(o, id){ return { id:String(id!=null ? id : o.id), data:o, updated_at:new Date().toISOString() }; }
    },
    _needFull(){
        try{
            if(typeof currentUser!=='undefined' && currentUser) return true;
            if(safeSessionGet('hv_current_user')) return true;
            for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.indexOf('sb-')===0 && k.indexOf('auth-token')!==-1) return true; }
        }catch(_){}
        return false;
    },
    async pullAll(only){
        if(!this.client) this.init();
        if(!this.client) return {ok:false};
        const out = {}; let any = false;
        const full = !only && this._needFull();
        const names = only || (full ? ['classes','students','assignments','submissions','teachers','student_accounts'].concat(this.TABLES_X) : ['community_posts']);
        await Promise.all(names.map(async function(t){
            try{
                const q = SupabaseDB.client.from(t).select('*'); const { data, error } = await q.abortSignal(hvPullSignal(t));
                if(!error){ out[t] = data || []; any = true; }
            }catch(_){}
        }));
        if(any && full) this._full = true;
        return { ok:any, data:out };
    },
    _syncP:null, _syncAgain:false,
    syncFromCloud(){
        if(this._syncP){ this._syncAgain = true; return this._syncP; }
        const self = this;
        this._syncP = (async function(){
            let ok = false;
            try{ hvSyncBar(true); }catch(_){}
            try{ do{ self._syncAgain = false; ok = await self._doSync(); }while(self._syncAgain); }
            finally{ self._syncP = null; try{ hvSyncBar(false); }catch(_){} }
            return ok;
        })();
        return this._syncP;
    },
    async _doSync(only){
        const r = await this.pullAll(only);
        if(!r.ok || !r.data) return false;
        return this._applyPulled(r.data);
    },
    async syncTable(tb){
        const r = await this.pullAll([tb]);
        if(!r.ok || !r.data) return false;
        return this._applyPulled(r.data);
    },
    _saveT:null,
    _saveSoon(){
        clearTimeout(this._saveT);
        this._saveT = setTimeout(function(){ hvIdle(function(){ try{ saveLocalData(); saveDiscussionToStorage(); saveChatToStorage(); }catch(_){} }, 1500); }, 350);
    },
    _applyPayload(tb, p){
        const ev = p.eventType, row = (ev==='DELETE') ? p.old : p.new;
        if(!row || row.id==null) return false;
        const id = String(row.id), D = row.data;
        const put = function(arr, obj){ const i = arr.findIndex(function(x){ return String(x.id)===id; }); if(i>=0) arr[i]=obj; else arr.push(obj); return arr; };
        const drop = function(arr){ return arr.filter(function(x){ return String(x.id)!==id; }); };
        if(tb==='chat_messages'){ if(ev==='DELETE') chatData = drop(chatData); else if(D){ put(chatData,D); chatData.sort(function(a,b){ return (a.ts||0)-(b.ts||0); }); } else return false; }
        else if(tb==='discussions'){ if(ev==='DELETE') discussionData = drop(discussionData); else if(D){ put(discussionData,D); discussionData.sort(function(a,b){ return (b.ts||0)-(a.ts||0); }); } else return false; }
        else if(tb==='community_posts'){ if(ev==='DELETE') communityPosts = drop(communityPosts); else if(D) put(communityPosts,D); else return false; try{ cmPersist(); }catch(_){} }
        else if(tb==='khbd'){ if(ev==='DELETE') khbdList = drop(khbdList); else if(D) put(khbdList,D); else return false; }
        else if(tb==='materials'){ if(ev==='DELETE') materialsData = drop(materialsData); else if(D) put(materialsData,D); else return false; hvSaveMaterials(); }
        else return false;
        this._saveSoon();
        return true;
    },
    _applyPulled(d){
        const byTs = function(k, dir){ return function(a,b){ return dir*((a[k]||0)-(b[k]||0)); }; };
        if(d.classes && (d.classes.length || currentUser)) classesData = d.classes.map(function(c){ return { id:c.id, name:c.name, code:c.code, teacherCode:c.teacher_code, grade:c.grade, createdAt:c.created_at }; });
        if(d.students && (d.students.length || currentUser)) studentsData = d.students.map(function(s){ return {
            id:s.id, name:s.name, classId:s.class_id,
            tx1:s.tx1, tx2:s.tx2, tx3:s.tx3, tx4:s.tx4, gk:s.gk, ck:s.ck, tbm:s.tbm,
            nhanXet:s.nhan_xet, rubricScores:s.rubric_scores || [3,3,3,3,3,3,3,3],
            target:s.target, b1:s.b1, b2:s.b2, b3:s.b3, b4:s.b4, b5:s.b5
        }; });
        if(d.assignments && (d.assignments.length || currentUser)) assignmentsData = d.assignments.map(function(a){ return Object.assign({}, a.data || {}, {
            id:a.id, title:a.title, topic:a.topic, type:a.type, classId:a.class_id,
            teacherCode:a.teacher_code, answerKey:a.answer_key, rubricGuide:a.rubric_guide,
            deadline:a.deadline, attachments:a.attachments || [], createdBy:a.created_by, createdAt:a.created_at
        }); }).sort(function(a,b){ return String(b.createdAt||'').localeCompare(String(a.createdAt||'')); });
        if(d.submissions && (d.submissions.length || currentUser)) submissionsData = d.submissions.map(function(s){ return Object.assign({}, s.data || {}, {
            id:s.id, studentId:s.student_id, studentName:s.student_name, assignmentId:s.assignment_id,
            classId:s.class_id, content:s.content, type:s.type, topic:s.topic, score:s.score,
            comment:s.comment, gradedBy:s.graded_by, gradedAt:s.graded_at,
            attachments:s.attachments || [],
            status:(s.status==='GRADED' || (s.score!==null && s.score!==undefined)) ? 'GRADED' : 'UNGRADED',
            createdAt:s.created_at,
            time:(s.data && s.data.time) || (s.created_at ? new Date(s.created_at).toLocaleString('vi-VN') : '')
        }); }).sort(function(a,b){ return String(b.createdAt||'').localeCompare(String(a.createdAt||'')); });
        if(d.teachers && (d.teachers.length || currentUser)){
            const reg = {};
            d.teachers.forEach(function(t){ if(t.teacher_code) reg[t.teacher_code] = { id:t.id, name:t.name, email:t.email, school:t.school || '' }; });
            saveTeacherRegistry(reg);
        }
        if(d.student_accounts && (d.student_accounts.length || currentUser)){
            const acc = d.student_accounts.map(function(a){ return {
                studentId:a.student_id, classId:a.class_id, teacherCode:a.teacher_code,
                email:a.email, password:a.password_plain, parentCode:a.parent_code,
                parentPassword:a.parent_password, taken:!!a.taken
            }; });
            saveStudentAccounts(acc);
            const pc = {};
            acc.forEach(function(a){ if(a.parentCode) pc[a.parentCode] = { studentId:a.studentId, classId:a.classId, password:a.parentPassword }; });
            saveParentCodes(pc);
        }
        const dat = function(rows){ return rows.map(function(x){ return x.data; }).filter(Boolean); };
        if(d.discussions) discussionData = dat(d.discussions).sort(byTs('ts',-1));
        if(d.chat_messages) chatData = dat(d.chat_messages).sort(byTs('ts',1));
        if(d.khbd) khbdList = dat(d.khbd);
        if(d.rewards) saveCustomRewards(dat(d.rewards));
        if(d.schedule) saveSchedule(dat(d.schedule));
        if(d.grade_history) gradeHistoryData = dat(d.grade_history).sort(byTs('ts',-1));
        if(d.community_posts){ communityPosts = dat(d.community_posts); cmPersist(); }
        if(d.feedback) feedbackList = dat(d.feedback);
        if(d.materials){ materialsData = dat(d.materials).sort(function(a,b){ return (b.ts||0)-(a.ts||0); }); hvSaveMaterials(); }
        try{ hvFixAssignmentDeadlines(); }catch(_){}
        try{ hvPruneOrphanSubs(); }catch(_){}
        this._saveSoon();
        this.lastSync = Date.now();
        try{ this._scheduleHeal(); }catch(_){}
        try{ updateCloudStatusBadge(); }catch(_){}
        return true;
    },
    renderers:{
        _safe(fn){ try{ if(typeof fn==='function') fn(); }catch(e){ console.warn('realtime render', e); } },
        _visible(id){ const t=document.getElementById(id); return !!(t && !t.classList.contains('hidden')); },
        teachers(payload){
            try{
                const row = payload && payload.new;
                if(row && currentUser && row.email && currentUser.email && String(row.email).toLowerCase()===String(currentUser.email).toLowerCase() && row.name){
                    currentUser.name = row.name;
                    safeSessionSet('hv_current_user', JSON.stringify(currentUser));
                }
            }catch(_){}
            const self=this;
            this._safe(function(){ if(isSuperAdmin() && self._visible('tab-teachers')) renderTeachersManagement(); });
            this._safe(updateUserUI);
        },
        students(){ const self=this; this._safe(renderStudentTable); this._safe(function(){ if(self._visible('tab-dashboard')) renderDashboard(); }); this._safe(function(){ if(isTeacherRole()) renderClasses(); }); },
        classes(){ this._safe(function(){ if(isTeacherRole()) renderClasses(); }); this._safe(populateClassFilterDropdowns); },
        submissions(){ this._safe(renderSubmissionsTable); this._safe(renderMySubmissionsList); },
        assignments(){ this._safe(function(){ if(isTeacherRole()) renderAssignments(); else renderStudentAssignmentsFiltered(); }); },
        discussions(){ const self=this; this._safe(function(){ if(self._visible('tab-discussion') && discTab==='topics') renderDiscussion(); }); },
        chat_messages(){ this._safe(function(){ const sl=document.getElementById('callClassSelect'); if(sl&&sl.value) updateCallRoomId(); }); this._safe(function(){ if(typeof discTab!=='undefined' && discTab==='livechat' && document.getElementById('chatInput')){ const el=document.getElementById('chatInput'); const keep=el.value; renderLiveChat(); const n=document.getElementById('chatInput'); if(n) n.value=keep; } }); },
        khbd(){ this._safe(renderKHBDList); },
        rewards(){ this._safe(renderRewards); },
        schedule(){ this._safe(renderAdminSchedule); },
        grade_history(){ this._safe(renderGradeHistory); },
        community_posts(){ this._safe(function(){ const p=document.getElementById('communityPage'); if(p&&p.style.display==='block'&&cmTab==='forum') renderCmPosts(true); cmUpdateStats(); }); },
        feedback(){ this._safe(function(){ const t=document.getElementById('tab-feedback'); if(t&&!t.classList.contains('hidden')&&isSuperAdmin()) renderFeedbackAdmin(); }); },
        materials(){ this._safe(function(){ const t=document.getElementById('tab-materials'); if(t&&!t.classList.contains('hidden')) renderMaterials(); }); }
    },
    renderAll(){
        if(!currentUser) return;
        const self = this;
        Object.keys(this.renderers).forEach(function(k){ if(k.charAt(0)!=='_'){ try{ self.renderers[k](); }catch(_){} } });
    },
    _rt:{}, _rtRetry:0,
    startRealtime(){
        if(!this.client) this.init();
        if(!this.client || !this.online) return false;
        const self = this;
        const groups = [
            ['hv-realtime', ['teachers','students','classes','submissions','assignments','discussions','chat_messages','khbd']],
            ['hv-realtime-extra', ['rewards','schedule','grade_history']],
            ['hv-realtime-community', ['community_posts','feedback']],
            ['hv-realtime-materials', ['materials']]
        ];
        groups.forEach(function(g){
            if(self._rt[g[0]]) return;
            try{
                let ch = self.client.channel(g[0]);
                g[1].forEach(function(tb){
                    ch = ch.on('postgres_changes', { event:'*', schema:'public', table:tb }, function(payload){
                        let fast = false;
                        try{ fast = self._applyPayload(tb, payload); }catch(e){ fast = false; }
                        if(fast && (currentUser || tb==='community_posts')){ try{ self.renderers[tb](payload); }catch(e){ console.warn('realtime ui', e); } }
                        clearTimeout(self._rtTimers[tb]);
                        self._rtTimers[tb] = setTimeout(async function(){
                            try{ await self.syncTable(tb); }catch(e){ console.warn('realtime sync', e); }
                            if(!currentUser && tb!=='community_posts') return;
                            try{ self.renderers[tb](payload); }catch(e){ console.warn('realtime ui', e); }
                        }, fast ? 900 : 60);
                    });
                });
                ch.subscribe(function(status){
                    if(status==='SUBSCRIBED') self._rtRetry = 0;
                    if(status==='CHANNEL_ERROR' || status==='TIMED_OUT' || status==='CLOSED'){
                        try{ self.client.removeChannel(ch); }catch(_){}
                        delete self._rt[g[0]];
                        if(self._rtRetry < 6){ self._rtRetry++; setTimeout(function(){ try{ self.startRealtime(); }catch(_){} }, 5000); }
                    }
                });
                self._rt[g[0]] = ch;
            }catch(e){ console.warn('startRealtime', e); }
        });
        try{ this.startPresence(); }catch(_){}
        return true;
    },
    _pres:null, _presKey:null,
    startPresence(){
        if(!this.client || !this.online) return false;
        const me = currentUser;
        const isStu = !!(me && me.role==='student' && me.studentId);
        const key = isStu ? 'S:'+me.studentId : 'T:'+((me && (me.teacherCode||me.email)) || ('v'+Math.random().toString(36).slice(2,8)));
        if(this._pres && this._presKey===key){ this._trackPresence(); return true; }
        this.stopPresence();
        const self = this;
        const ch = this.client.channel('hv-presence', { config:{ presence:{ key:key } } });
        ch.on('presence', { event:'sync' }, function(){
            try{
                const st = ch.presenceState(); const ids = new Set();
                Object.keys(st).forEach(function(k){ (st[k]||[]).forEach(function(m){ if(m && m.studentId) ids.add(m.studentId); }); });
                onlineStudents = ids;
                try{ renderTeacherStudentStatus(); }catch(_){}
            }catch(e){ console.warn('presence sync', e); }
        });
        ch.subscribe(function(status){ if(status==='SUBSCRIBED') self._trackPresence(); });
        this._pres = ch; this._presKey = key;
        return true;
    },
    async _trackPresence(){
        const me = currentUser;
        if(!this._pres || !me) return;
        try{
            if(me.role==='student' && me.studentId) await this._pres.track({ studentId:me.studentId, name:me.name, classId:me.classId||null, t:Date.now() });
            else await this._pres.untrack();
        }catch(_){}
    },
    stopPresence(){
        if(this._pres){ try{ this._pres.untrack(); this.client.removeChannel(this._pres); }catch(_){} }
        this._pres = null; this._presKey = null;
    },
    _rtTimers:{},
    async registerTeacher(user){
        if(!this.client) this.init();
        if(!this.client) return {ok:false,error:'Chưa cấu hình'};
        try{
            const id = await this.saveTeacherRow({ email:user.email, name:user.name, teacher_code:user.teacher_code||user.teacherCode, school:user.school });
            return {ok:true,id};
        }catch(e){ return {ok:false,error:e.message}; }
    }
};

function showCloudStatus(msg,type='success'){ const color=type==='success'?'linear-gradient(135deg,#10b981,#059669)':'linear-gradient(135deg,#ef4444,#dc2626)'; const el=document.createElement('div'); el.className='fixed bottom-4 left-4 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg z-[100001] flex items-center gap-2'; el.style.background=color; el.innerHTML=`<i class="fa-solid ${type==='success'?'fa-cloud-arrow-up':'fa-cloud-circle-exclamation'}"></i> ${escapeHtml(msg)}`; document.body.appendChild(el); try { gsap.fromTo(el,{x:-300,opacity:0},{x:0,opacity:1,duration:.4}); setTimeout(()=>gsap.to(el,{x:-300,opacity:0,duration:.3,onComplete:()=>el.remove()}),3000); } catch(e) { setTimeout(()=>el.remove(),3000); } }
function updateCloudStatusBadge(){ const b=document.getElementById('cloudStatusBadge'); if(!b)return; if(SupabaseDB.online)b.innerHTML='<span class="inline-flex items-center gap-1 text-emerald-700"><span class="online-dot"></span> Cloud Online'+(SupabaseDB.lastSync?' · '+new Date(SupabaseDB.lastSync).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):'')+'</span>'; else if(SupabaseDB.isConfigured())b.innerHTML='<span class="inline-flex items-center gap-1 text-amber-700"><i class="fa-solid fa-triangle-exclamation"></i> Chưa kết nối</span>'; else b.innerHTML='<span class="inline-flex items-center gap-1 text-ink-500"><i class="fa-solid fa-hard-drive"></i> Local Only</span>'; }
function applySecretVisibility(){
    const admin = (typeof isSuperAdmin==='function') && isSuperAdmin();
    const el = document.getElementById('supabaseUrlInput');
    if(!el) return;
    const card = el.closest('.rounded-2xl');
    if(card){ card.classList.toggle('hidden', !admin); const h = card.previousElementSibling; if(h && h.tagName==='H3') h.classList.toggle('hidden', !admin); }
}
function refreshSupabaseUI(){ applySecretVisibility(); if(!((typeof isSuperAdmin==='function') && isSuperAdmin())){ const _u=document.getElementById('supabaseUrlInput'),_k=document.getElementById('supabaseKeyInput'); if(_u)_u.value=''; if(_k)_k.value=''; try{updateCloudStatusBadge();}catch(_){} return; } const u=document.getElementById('supabaseUrlInput'), k=document.getElementById('supabaseKeyInput'), st=document.getElementById('supabaseStatus'); if(u)u.value=HV_SUPABASE_URL||SupabaseDB.getUrl(); if(k)k.value=HV_SUPABASE_ANON_KEY||SupabaseDB.getKey(); if(st){ if(SupabaseDB.online)st.innerHTML='<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check-circle"></i> Đã kết nối</span>'; else if(SupabaseDB.isConfigured())st.innerHTML='<span class="text-amber-700 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> Chưa kết nối</span>'; else st.innerHTML='<span class="text-ink-500 font-bold"><i class="fa-solid fa-hard-drive"></i> Local</span>'; } updateCloudStatusBadge(); }
function saveSupabaseConfig(){ if(!((typeof isSuperAdmin==='function') && isSuperAdmin())){ showToast('Chỉ Admin được đổi cấu hình!','error'); return; } const url=document.getElementById('supabaseUrlInput')?.value||''; const key=document.getElementById('supabaseKeyInput')?.value||''; SupabaseDB.configure(url,key); refreshSupabaseUI(); showToast(SupabaseDB.online?'☁️ Đã kết nối!':'Đã lưu (chưa kết nối)',SupabaseDB.online?'success':'error'); }
async function testSupabaseConfig(){ const st=document.getElementById('supabaseStatus'); st.innerHTML='<span class="text-red-600"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang test...</span>'; if(!SupabaseDB.client)SupabaseDB.init(); if(!SupabaseDB.client){st.innerHTML='<span class="text-rose-600 font-bold">Chưa cấu hình</span>';return;} try{const {error}=await SupabaseDB.client.from('submissions').select('id').limit(1); if(error)throw error; st.innerHTML='<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check-circle"></i> OK — bảng tồn tại</span>';SoundEngine.play('success');}catch(e){st.innerHTML=`<span class="text-rose-600 font-bold">${escapeHtml(e.message)}</span>`;SoundEngine.play('error');} }

