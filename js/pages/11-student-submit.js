/* ========== STUDENT SUBMIT ========== */
function prepareStudentSubmit(){
    if(!isStudentRole())return;
    const cls=getClassById(currentClassIdForUser);
    document.getElementById('submitStudentName').value=currentUser.name||'';
    document.getElementById('submitStudentClassText').value=cls?cls.name:'—';
    document.getElementById('submitTypeText').value=currentAssignmentContext?(assignmentsData.find(a=>a.id===currentAssignmentContext)?.type||'Tự luận'):'Tự luận';
    document.getElementById('mcqArea').classList.add('hidden');
    document.getElementById('tfArea').classList.add('hidden');
    if(currentAssignmentContext){
        const a=assignmentsData.find(x=>x.id===currentAssignmentContext);
        if(a?.mcqs?.length)renderMCQForStudent(a.mcqs);
        if(a?.tfs?.length)renderTFForStudent(a.tfs);
        if(a?.readingPassage && a.readingPassage.trim()){
            document.getElementById('splitView').classList.remove('hidden');
            document.getElementById('normalView').classList.add('hidden');
            document.getElementById('readingPassageContent').textContent = a.readingPassage;
            const oldVal = document.getElementById('submitContentNormal')?.value || '';
            const newTA = document.getElementById('submitContent');
            if (newTA && oldVal) newTA.value = oldVal;
        } else { document.getElementById('splitView').classList.add('hidden'); document.getElementById('normalView').classList.remove('hidden'); }
    } else { document.getElementById('splitView').classList.add('hidden'); document.getElementById('normalView').classList.remove('hidden'); }
    renderMySubmissionsList();renderAttachmentList();
}
function handleAttachmentSelect(e){Array.from(e.target.files||[]).forEach(f=>{const r=new FileReader();r.onload=()=>{pendingAttachments.push({name:f.name,type:f.type||'application/octet-stream',size:f.size,dataUrl:r.result});renderAttachmentList();};r.readAsDataURL(f);});e.target.value='';}
function renderAttachmentList(){const c=document.getElementById('attachmentList');if(!c)return;if(!pendingAttachments.length){c.innerHTML='<p class="text-[10px] text-ink-400 italic">Chưa có tệp.</p>';return;}c.innerHTML=pendingAttachments.map((a,i)=>{const img=(a.type||'').startsWith('image/');return `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,.8);border:1px solid rgba(31,29,26,.08);border-radius:10px;font-size:11px;"><img src="${img?a.dataUrl:''}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;${img?'':'display:none'}"><div style="${img?'display:none':''};width:40px;height:40px;border-radius:8px;background:#fee2e2;display:flex;align-items:center;justify-content:center;color:#dc2626;"><i class="fa-solid fa-file"></i></div><div style="flex:1;min-width:0;"><p style="font-weight:700;" class="truncate">${escapeHtml(a.name)}</p><p style="font-size:10px;color:#b8b3ab;">${(a.size/1024).toFixed(1)} KB</p></div><button onclick="removeAttachment(${i})" style="color:#b8b3ab;padding:4px;background:none;border:none;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button></div>`;}).join('');}
function removeAttachment(i){pendingAttachments.splice(i,1);renderAttachmentList();}
function updateWordCount(){const ta=document.getElementById('submitContent');if(!ta)return;const c=ta.value;const w=c.trim()?c.trim().split(/\s+/).length:0;const el=document.getElementById('wordCountLabel');if(el)el.innerText=`${w} từ • ${c.length} ký tự`;}
function updateWordCount2(){const ta=document.getElementById('submitContentNormal');if(!ta)return;const c=ta.value;const w=c.trim()?c.trim().split(/\s+/).length:0;const el=document.getElementById('wordCountLabel2');if(el)el.innerText=`${w} từ • ${c.length} ký tự`;}
function renderMCQForStudent(mcqs){const a=document.getElementById('mcqArea');a.classList.remove('hidden');a.innerHTML=`<h3 class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-list-check text-red-600"></i> Trắc nghiệm</h3>`+mcqs.map((q,i)=>`<div class="bg-paper-50 rounded-xl p-4 border border-ink-100 space-y-2"><p class="font-bold text-sm">Câu ${i+1}: ${escapeHtml(q.text)}</p><div class="grid grid-cols-1 md:grid-cols-2 gap-2">${q.options.map((o,j)=>`<label class="flex items-center gap-2 p-2 bg-white border border-ink-100 rounded-lg cursor-pointer"><input type="radio" name="mcq-${i}" value="${j}" class="accent-red-600"><span class="text-xs">${String.fromCharCode(65+j)}. ${escapeHtml(o)}</span></label>`).join('')}</div></div>`).join('');}
function renderTFForStudent(tfs){const a=document.getElementById('tfArea');a.classList.remove('hidden');a.innerHTML=`<h3 class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-circle-check text-amber-600"></i> Đúng / Sai</h3>`+tfs.map((q,i)=>`<div class="bg-amber-50/60 rounded-xl p-4 border border-amber-100 space-y-2"><p class="font-bold text-sm">Câu ${i+1}: ${escapeHtml(q.text)}</p><div class="flex gap-3"><label class="flex items-center gap-2 p-2 bg-white border border-ink-100 rounded-lg cursor-pointer"><input type="radio" name="tf-${i}" value="true" class="accent-emerald-600"><span class="text-xs font-bold text-emerald-700">Đúng</span></label><label class="flex items-center gap-2 p-2 bg-white border border-ink-100 rounded-lg cursor-pointer"><input type="radio" name="tf-${i}" value="false" class="accent-rose-600"><span class="text-xs font-bold text-rose-700">Sai</span></label></div></div>`).join('');}
async function handleStudentSubmitHomework(e){
    e.preventDefault();
    if(!isStudentRole())return;
    const name=currentUser.name,classId=currentClassIdForUser;
    const type=document.getElementById('submitTypeText').value;
    const topic=document.getElementById('submitTopic').value.trim();
    const splitActive = !document.getElementById('splitView').classList.contains('hidden');
    const content = splitActive ? (document.getElementById('submitContent')?.value||'').trim() : (document.getElementById('submitContentNormal')?.value||'').trim();
    const needText=!currentAssignmentContext||['Nghị luận văn học','Nghị luận xã hội','Tự luận','Đọc hiểu'].includes(type);
    if(needText&&content.length<30&&pendingAttachments.length===0&&!window.__hvForceSubmit){showToast('Bài quá ngắn!','error');return;}
    const mcqAnswers={};
    if(currentAssignmentContext){
        const a=assignmentsData.find(x=>x.id===currentAssignmentContext);
        if(a?.mcqs)a.mcqs.forEach((q,i)=>{const el=document.querySelector(`input[name="mcq-${i}"]:checked`);mcqAnswers[i]=el?parseInt(el.value):null;});
        if(a?.tfs)a.tfs.forEach((q,i)=>{const el=document.querySelector(`input[name="tf-${i}"]:checked`);mcqAnswers['tf_'+i]=el?(el.value==='true'):null;});
    }
    const newSub={id:'SUB_'+Date.now(),studentName:name,classId,type,topic,content,attachments:pendingAttachments.slice(),mcqAnswers,time:nowStr(),status:'UNGRADED',score:null,comment:'',assignmentId:currentAssignmentContext,isLate:false,parentViewScore:false};
    if (typeof submitActivityLog!=='undefined') { submitActivityLog.endTime=Date.now(); newSub.antiCheatLog=JSON.parse(JSON.stringify(submitActivityLog)); newSub.plagiarism=checkPlagiarism(newSub); }
    const okSub = await SupabaseDB.commit(async function(){
        if(currentUser?.sessionToken){
            const { error } = await SupabaseDB.client.rpc('hv_student_submit', {
                p_token: currentUser.sessionToken,
                p_payload: {
                    id: newSub.id, assignment_id: newSub.assignmentId,
                    content: newSub.content, type: newSub.type,
                    topic: newSub.topic, attachments: newSub.attachments,
                    student_id: currentUser.studentId,
                    student_name: currentUser.name,
                    class_id: currentClassIdForUser
                }
            });
            if(error) throw error;
        } else {
            await SupabaseDB.upsert('submissions', SupabaseDB.row.submissions(newSub));
        }
    });
    if(!okSub) return;
    submissionsData.unshift(newSub);saveLocalData();
    broadcastRT('submission_new',{id:newSub.id});
    try{hvDraftClear(currentAssignmentContext);hvWLEnd(true);}catch(_){}
    pendingAttachments=[];
    if(document.getElementById('submitContent'))document.getElementById('submitContent').value='';
    if(document.getElementById('submitContentNormal'))document.getElementById('submitContentNormal').value='';
    document.getElementById('submitTopic').value='';
    renderAttachmentList();updateWordCount();updateWordCount2();
    if(currentAssignmentContext)cancelAssignmentContext();
    renderMySubmissionsList();
    showToast('Nộp thành công!','success');
    if(window.confetti)confetti({particleCount:80,spread:80,origin:{y:.7}});
}
function renderMySubmissionsList(){const c=document.getElementById('mySubmissionsList');if(!c||!isStudentRole())return;const mine=submissionsData.filter(s=>s.studentName===currentUser.name);document.getElementById('mySubmissionCount').innerText=`${mine.length} bài`;if(!mine.length){c.innerHTML='<p class="text-xs text-ink-400 italic py-4 text-center">Chưa có bài nộp.</p>';return;}c.innerHTML=mine.map(s=>{const b=s.status==='GRADED'?`<span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded">Đã chấm: ${s.score}/10</span>`:`<span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded">Chờ chấm</span>`;return `<div class="p-3 bg-paper-50 rounded-xl border border-ink-100 space-y-1.5"><div class="flex justify-between"><span class="text-[10px] font-bold text-red-600">${s.type}</span>${b}</div><h5 class="font-bold text-xs truncate">${escapeHtml(s.topic)}</h5><p class="text-[10px] text-ink-400">${s.time}</p>${s.comment?`<p class="text-[11px] text-emerald-700 italic bg-emerald-50 p-2 rounded">"${escapeHtml(s.comment)}"</p>`:''}</div>`;}).join('');}
function cancelAssignmentContext(){currentAssignmentContext=null;document.getElementById('currentAssignmentBanner').classList.add('hidden');document.getElementById('submitTopic').value='';if(document.getElementById('submitContent'))document.getElementById('submitContent').value='';if(document.getElementById('submitContentNormal'))document.getElementById('submitContentNormal').value='';pendingAttachments=[];renderAttachmentList();updateWordCount();updateWordCount2();if (typeof resetAntiCheatLog==='function') resetAntiCheatLog();}
function startSubmitFromAssignment(id){const a=assignmentsData.find(x=>x.id===id);if(!a)return;if (typeof resetAntiCheatLog==='function') resetAntiCheatLog();currentAssignmentContext=id;document.getElementById('submitTypeText').value=a.type;document.getElementById('submitTopic').value=a.topic;if(document.getElementById('submitContent'))document.getElementById('submitContent').value='';if(document.getElementById('submitContentNormal'))document.getElementById('submitContentNormal').value='';document.getElementById('currentAssignmentBanner').classList.remove('hidden');document.getElementById('bannerAssignmentTitle').innerText=a.title;document.getElementById('bannerAssignmentDeadline').innerText=`Hạn: ${formatDeadline(a.deadline)}`;switchTab('submit');showToast('Đã mở trang giấy!','success');}
function renderStudentAssignmentsFiltered(){ const clsId=currentClassIdForUser; const hero=document.getElementById('studentHomeHero'); if(hero){hero.classList.toggle('hidden',!isStudentRole());if(isStudentRole()){const st=studentsData.find(s=>s.id===currentUser.studentId);const cl=getClassById(currentClassIdForUser);const subs=submissionsData.filter(s=>s.studentName===currentUser.name);const pending=assignmentsData.filter(a=>a.classId===currentClassIdForUser&&!subs.some(sub=>sub.assignmentId===a.id)).length;const tbm=st?.tbm||0;document.getElementById('studentHeroName').innerText=currentUser.name;document.getElementById('studentHeroMeta').innerText=`Lớp ${cl?.name||'—'} • ${pending} bài chưa làm.`;document.getElementById('studentProgressScore').innerText=tbm.toFixed(1);document.getElementById('studentProgressRing').style.strokeDashoffset=(364.4*(1-Math.min(tbm/10,1))).toFixed(1);}} if(!clsId){document.getElementById('assignmentsGrid').innerHTML='<div class="col-span-full glass-card rounded-3xl p-12 text-center"><h3 class="font-bold">Chưa vào lớp.</h3></div>';return;} const cls=getClassById(clsId); document.getElementById('assignmentsSubtitleText').innerText=`Bài tập lớp ${cls?.name||''} — GV ${getTeacherName(cls?.teacherCode||'')}`; document.getElementById('assignmentsTitleText').innerText='Bài tập lớp em'; document.getElementById('teacherAssignmentActions').style.display='none'; document.getElementById('assignmentStatsRow').style.display='none'; document.getElementById('teacherAssignmentsView').classList.add('hidden'); const filtered=assignmentsData.filter(a=>a.classId===clsId).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)); const grid=document.getElementById('assignmentsGrid'); if(!filtered.length){grid.innerHTML='<div class="col-span-full glass-card rounded-3xl p-12 text-center"><h3 class="font-bold">Lớp em chưa có bài tập.</h3></div>';return;} grid.innerHTML=filtered.map(a=>{const st=computeDeadlineStatus(a.deadline);const mine=submissionsData.find(s=>s.assignmentId===a.id&&s.studentName===currentUser.name);return `<div class="profile-card p-5 space-y-3 flex flex-col ${st.code==='URGENT'?'urgent-deadline':''}"><div class="flex justify-between items-start gap-2"><span class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase">${a.type}</span><span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${st.code==='EXPIRED'?'bg-paper-100 text-ink-500 border-ink-100':st.code==='URGENT'?'bg-rose-100 text-rose-700 border-rose-200':'bg-emerald-100 text-emerald-700 border-emerald-200'}">${st.label}</span></div><h3 class="font-black text-base leading-tight">${escapeHtml(a.title)}</h3><p class="text-xs text-ink-600 italic">${escapeHtml(a.topic)}</p>${a.answerKey?'<p class="text-[10px] font-bold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded-full"><i class="fa-solid fa-key mr-1"></i>GV đã đưa đáp án</p>':''}<div class="space-y-1 pt-2 border-t border-ink-100 text-[11px]"><div><i class="fa-solid fa-calendar-day text-red-500 w-4"></i> ${formatDeadline(a.deadline)}</div><div><i class="fa-solid fa-hourglass-half text-amber-500 w-4"></i> ${formatCountdown(a.deadline)}</div><div><i class="fa-solid fa-paper-plane text-blue-500 w-4"></i> Giao lúc ${formatCreated(a.createdAt)} <span class="hv-ago" data-ts="${hvParseDate(a.createdAt)||''}">(${hvAgo(a.createdAt)})</span></div></div>${hvAsgBadges(a)}${mine?`<div class="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-2 mt-2"><i class="fa-solid fa-check-circle text-emerald-600"></i><div class="text-[11px] font-bold text-emerald-700">Đã nộp — ${mine.status==='GRADED'?'Điểm: '+mine.score:'Chờ chấm'}</div></div>`:`<button onclick="startSubmitFromAssignment('${a.id}')" class="btn-primary text-xs font-bold py-2 rounded-lg mt-2"><i class="fa-solid fa-pen-fancy mr-1"></i>${a.timeLimit>0?'Bắt đầu làm bài':'Làm bài'}</button>`}</div>`;}).join(''); }

