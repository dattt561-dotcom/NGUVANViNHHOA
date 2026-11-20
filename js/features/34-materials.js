/* =====================================================================
   v4.5 · HỌC LIỆU (bài giảng · tiết dạy online · tác phẩm · video · hình ảnh)
   ===================================================================== */
let materialsData=[];
try{materialsData=JSON.parse(safeGetItem('hv_materials','[]'))||[];}catch(_){materialsData=[];}
const MAT_TYPES={lesson:{l:'Bài giảng',i:'fa-person-chalkboard',c:'linear-gradient(135deg,#2563eb,#6366f1)'},online:{l:'Tiết dạy online',i:'fa-video',c:'linear-gradient(135deg,#dc2626,#f97316)'},work:{l:'Tác phẩm',i:'fa-book-open',c:'linear-gradient(135deg,#059669,#14b8a6)'},video:{l:'Video',i:'fa-circle-play',c:'linear-gradient(135deg,#7c3aed,#db2777)'},image:{l:'Hình ảnh minh họa',i:'fa-image',c:'linear-gradient(135deg,#d97706,#eab308)'},other:{l:'Khác',i:'fa-folder-open',c:'linear-gradient(135deg,#475569,#64748b)'}};
let matFilter='all',matEditId=null,matPending=[],matExisting=[],matRemoved=[],matType='lesson';
function hvSaveMaterials(){try{safeSetItem('hv_materials',JSON.stringify(materialsData));}catch(_){}}
function matVisible(m){
    if(!currentUser||!m)return false;if(isSuperAdmin())return true;
    const vis=getVisibleClassIds();const ids=m.classIds||[];
    if(isTeacherRole())return m.byCode===(currentUser.teacherCode||'')||ids.some(function(id){return vis.indexOf(id)!==-1;});
    return ids.some(function(id){return vis.indexOf(id)!==-1;});
}
function matSafeUrl(u){return /^https?:\/\//i.test(String(u||''))?String(u):'';}
function matEmbed(url){
    try{
        const u=new URL(url);const h=u.hostname.replace(/^www\./,'');const id=function(x){return String(x||'').replace(/[^\w-]/g,'');};
        if(h==='youtu.be')return 'https://www.youtube-nocookie.com/embed/'+id(u.pathname.slice(1).split('/')[0]);
        if(h.slice(-11)==='youtube.com'){if(u.pathname==='/watch'&&u.searchParams.get('v'))return 'https://www.youtube-nocookie.com/embed/'+id(u.searchParams.get('v'));const m=u.pathname.match(/^\/(shorts|embed|live)\/([\w-]+)/);if(m)return 'https://www.youtube-nocookie.com/embed/'+id(m[2]);}
        if(h==='drive.google.com'){const m=u.pathname.match(/\/file\/d\/([^/]+)/);if(m)return 'https://drive.google.com/file/d/'+id(m[1])+'/preview';}
        if(h==='vimeo.com'){const m=u.pathname.match(/\/(\d+)/);if(m)return 'https://player.vimeo.com/video/'+m[1];}
    }catch(_){}
    return '';
}
function matFmtSize(b){if(!b)return '';return b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';}
function renderMaterials(){
    const grid=document.getElementById('matGrid');if(!grid)return;
    const teacher=isTeacherRole();const add=document.getElementById('matAddBtn');if(add)add.style.display=teacher?'':'none';
    const sel=document.getElementById('matClass');
    if(sel){const vis=isSuperAdmin()?classesData.map(function(c){return c.id;}):getVisibleClassIds();const cur=sel.value||'ALL';sel.innerHTML='<option value="ALL">Tất cả lớp</option>'+vis.map(function(id){return '<option value="'+escapeHtml(id)+'">'+escapeHtml(getClassLabel(id))+'</option>';}).join('');sel.value=vis.indexOf(cur)!==-1?cur:'ALL';sel.style.display=vis.length>1?'':'none';}
    const q=(document.getElementById('matSearch')?.value||'').trim().toLowerCase();const cf=sel?sel.value:'ALL';
    const all=materialsData.filter(matVisible).filter(function(m){return cf==='ALL'||(m.classIds||[]).indexOf(cf)!==-1;}).filter(function(m){return !q||((m.title||'')+' '+(m.desc||'')+' '+(m.by||'')).toLowerCase().indexOf(q)!==-1;}).sort(function(a,b){return (b.ts||0)-(a.ts||0);});
    const chips=document.getElementById('matChips');
    if(chips){const cnt={};all.forEach(function(m){cnt[m.type]=(cnt[m.type]||0)+1;});chips.innerHTML='<button class="cm-chip '+(matFilter==='all'?'on':'')+'" onclick="matSetFilter(\'all\')">🌈 Tất cả ('+all.length+')</button>'+Object.keys(MAT_TYPES).filter(function(k){return cnt[k];}).map(function(k){return '<button class="cm-chip '+(matFilter===k?'on':'')+'" onclick="matSetFilter(\''+k+'\')">'+MAT_TYPES[k].l+' ('+cnt[k]+')</button>';}).join('');}
    const list=all.filter(function(m){return matFilter==='all'||m.type===matFilter;});
    if(!list.length){grid.innerHTML='<div class="glass-card p-10 rounded-3xl text-center text-sm text-ink-500" style="grid-column:1/-1"><div style="font-size:42px">📚</div><b>Chưa có học liệu nào.</b><br>'+(teacher?'Bấm “Thêm học liệu” để chia sẻ bài giảng, video, tác phẩm cho học sinh.':'Khi thầy cô đăng học liệu, em sẽ thấy ở đây.')+'</div>';return;}
    grid.innerHTML=list.map(function(m){
        const t=MAT_TYPES[m.type]||MAT_TYPES.other;const nf=(m.files||[]).length;
        const cls=(m.classIds||[]).slice(0,3).map(function(id){return '<span class="mat-tag" style="background:rgba(37,99,235,.12);color:#2563eb">'+escapeHtml(getClassLabel(id))+'</span>';}).join(' ');
        const mine=teacher&&(isSuperAdmin()||m.byCode===(currentUser.teacherCode||''));
        return '<article class="glass-card mat-card p-4 rounded-3xl" onclick="viewMaterial(\''+cmId(m.id)+'\')"><div style="display:flex;gap:12px;align-items:flex-start"><div class="mat-ic" style="background:'+t.c+'"><i class="fa-solid '+t.i+'"></i></div><div style="min-width:0;flex:1"><div class="mat-tag" style="background:rgba(124,58,237,.12);color:#7c3aed">'+t.l+'</div><h3 style="font-weight:900;font-size:15px;margin-top:6px;line-height:1.3;word-break:break-word">'+escapeHtml(m.title)+'</h3></div></div>'+
        (m.desc?'<p class="text-xs text-ink-500" style="margin-top:10px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">'+escapeHtml(m.desc)+'</p>':'')+
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:11px" class="text-ink-500">'+(m.url?'<span><i class="fa-solid fa-link"></i> Link</span>':'')+(nf?'<span><i class="fa-solid fa-paperclip"></i> '+nf+' file</span>':'')+(m.text?'<span><i class="fa-solid fa-align-left"></i> Văn bản</span>':'')+'</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">'+cls+'</div>'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:11px" class="text-ink-400"><span>'+escapeHtml(m.by||'')+' · '+new Date(m.ts||0).toLocaleDateString('vi-VN')+'</span>'+(mine?'<span onclick="event.stopPropagation()"><button class="cm-link" onclick="openMaterialModal(\''+cmId(m.id)+'\')">✏️ Sửa</button><button class="cm-link" style="color:#dc2626" onclick="deleteMaterial(\''+cmId(m.id)+'\')">🗑 Xóa</button></span>':'')+'</div></article>';
    }).join('');
}
function matSetFilter(k){matFilter=k;renderMaterials();}
function matFind(id){return materialsData.find(function(m){return cmId(m.id)===id;});}
function viewMaterial(id){
    const m=matFind(id);if(!m)return;const t=MAT_TYPES[m.type]||MAT_TYPES.other;const E=escapeHtml;
    let h='<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div style="display:flex;gap:12px;align-items:center;min-width:0"><div class="mat-ic" style="background:'+t.c+'"><i class="fa-solid '+t.i+'"></i></div><div style="min-width:0"><span class="mat-tag" style="background:rgba(124,58,237,.12);color:#7c3aed">'+t.l+'</span><h3 style="font-family:Outfit,sans-serif;font-weight:900;font-size:21px;line-height:1.25;margin-top:4px;word-break:break-word">'+E(m.title)+'</h3><div class="text-ink-500" style="font-size:11px">'+E(m.by||'')+' · '+new Date(m.ts||0).toLocaleDateString('vi-VN')+'</div></div></div><button onclick="closeMaterialView()" aria-label="Đóng" style="background:none;border:0;font-size:18px;cursor:pointer;color:inherit"><i class="fa-solid fa-xmark"></i></button></div>';
    if(m.desc)h+='<p style="margin-top:14px;font-size:13.5px;line-height:1.7">'+E(m.desc)+'</p>';
    const url=matSafeUrl(m.url);
    if(url){const em=matEmbed(url);h+=em?'<div style="margin-top:14px"><iframe class="mat-view-media" src="'+E(em)+'" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen loading="lazy" decoding="async" referrerpolicy="no-referrer"></iframe></div><div style="margin-top:8px"><a class="cm-btn" href="'+E(url)+'" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở trong tab mới</a></div>':'<div style="margin-top:14px"><a class="cm-go" href="'+E(url)+'" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở liên kết</a><div class="text-ink-400" style="font-size:11px;margin-top:6px;word-break:break-all">'+E(url)+'</div></div>';}
    const files=m.files||[];const imgs=files.filter(function(f){return /^image\//.test(f.mime||'');});const vids=files.filter(function(f){return /^video\//.test(f.mime||'')&&f.url;});const aud=files.filter(function(f){return /^audio\//.test(f.mime||'')&&f.url;});const docs=files.filter(function(f){return imgs.indexOf(f)===-1&&vids.indexOf(f)===-1&&aud.indexOf(f)===-1;});
    vids.forEach(function(f){h+='<video controls playsinline preload="metadata" class="mat-view-media" style="margin-top:14px" src="'+E(f.url)+'"></video>';});
    aud.forEach(function(f){h+='<audio controls style="width:100%;margin-top:14px" src="'+E(f.url)+'"></audio>';});
    if(imgs.length)h+='<div class="mat-imgs">'+imgs.map(function(f){const src=f.url||f.dataUrl||'';return '<img src="'+E(src)+'" alt="'+E(f.name||'')+'" loading="lazy" decoding="async" onclick="window.open(this.src,\'_blank\',\'noopener\')">';}).join('')+'</div>';
    if(m.text)h+='<div class="mat-text">'+E(m.text)+'</div>';
    if(docs.length)h+='<div style="margin-top:14px">'+docs.map(function(f){const u=f.url||f.dataUrl||'';return '<a class="mat-file" style="text-decoration:none;color:inherit" href="'+E(u)+'" target="_blank" rel="noopener noreferrer" download="'+E(f.name||'file')+'"><i class="fa-solid fa-file-arrow-down" style="color:#2563eb"></i><span class="n">'+E(f.name||'file')+'</span><span class="text-ink-400">'+matFmtSize(f.size)+'</span><b style="color:#dc2626;font-size:11px">Tải về</b></a>';}).join('')+'</div>';
    document.getElementById('matViewBody').innerHTML=h;const md=document.getElementById('materialViewModal');md.style.display='flex';
}
function closeMaterialView(){const md=document.getElementById('materialViewModal');md.style.display='none';document.getElementById('matViewBody').innerHTML='';}
/* ----- thêm / sửa ----- */
function matRenderTypeChips(){document.getElementById('matTypeChips').innerHTML=Object.keys(MAT_TYPES).map(function(k){return '<button type="button" class="cm-chip '+(matType===k?'on':'')+'" onclick="matType=\''+k+'\';matRenderTypeChips()"><i class="fa-solid '+MAT_TYPES[k].i+'"></i> '+MAT_TYPES[k].l+'</button>';}).join('');}
function matRenderFiles(){
    const E=escapeHtml;let h='';
    matExisting.forEach(function(f,i){h+='<div class="mat-file"><i class="fa-solid fa-paperclip"></i><span class="n">'+E(f.name||'file')+'</span><span class="text-ink-400">'+matFmtSize(f.size)+'</span><button type="button" class="cm-link" onclick="matRemoveExisting('+i+')">✕</button></div>';});
    matPending.forEach(function(f,i){h+='<div class="mat-file"><i class="fa-solid fa-cloud-arrow-up" style="color:#7c3aed"></i><span class="n">'+E(f.name)+'</span><span class="text-ink-400">'+matFmtSize(f.size)+'</span><button type="button" class="cm-link" onclick="matPending.splice('+i+',1);matRenderFiles()">✕</button></div>';});
    document.getElementById('matFileList').innerHTML=h;
}
function matRemoveExisting(i){const f=matExisting.splice(i,1)[0];if(f&&f.path)matRemoved.push(f.path);matRenderFiles();}
function matAddFiles(inp){Array.from(inp.files||[]).forEach(function(f){if(f.size>50*1024*1024){showToast('"'+f.name+'" quá lớn (tối đa 50MB) — hãy dùng link YouTube/Drive','error');return;}matPending.push(f);});inp.value='';matRenderFiles();}
function openMaterialModal(id){
    if(!isTeacherRole()){showToast('Chỉ giáo viên mới thêm học liệu','error');return;}
    const m=id?matFind(id):null;matEditId=m?m.id:null;matPending=[];matExisting=m?(m.files||[]).slice():[];matRemoved=[];matType=m?m.type:'lesson';
    document.getElementById('matModalTitle').textContent=m?'✏️ Sửa học liệu':'📚 Thêm học liệu';
    document.getElementById('matTitle').value=m?m.title:'';document.getElementById('matDesc').value=m?(m.desc||''):'';document.getElementById('matLink').value=m?(m.url||''):'';document.getElementById('matText').value=m?(m.text||''):'';
    const vis=isSuperAdmin()?classesData.map(function(c){return c.id;}):getVisibleClassIds();const chosen=m?(m.classIds||[]):vis;
    document.getElementById('matClassesBox').innerHTML=vis.length?vis.map(function(cid){return '<label class="mat-tag" style="cursor:pointer;background:rgba(37,99,235,.1);padding:6px 12px;font-size:12px"><input type="checkbox" value="'+escapeHtml(cid)+'" '+(chosen.indexOf(cid)!==-1?'checked':'')+' style="margin-right:6px">'+escapeHtml(getClassLabel(cid))+'</label>';}).join(''):'<span class="text-ink-400" style="font-size:12px">Bạn chưa có lớp nào — hãy tạo lớp trước.</span>';
    document.getElementById('matStatus').textContent='';matRenderTypeChips();matRenderFiles();
    document.getElementById('materialModal').style.display='flex';
}
function closeMaterialModal(){document.getElementById('materialModal').style.display='none';}
async function hvUploadMaterialFile(file,folder){
    const c=SupabaseDB.client;const ext=((file.name.split('.').pop()||'bin')+'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'bin';
    const path=folder+'/'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)+'.'+ext;
    const r=await c.storage.from('materials').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
    if(r.error)throw r.error;
    return {path:path,url:c.storage.from('materials').getPublicUrl(path).data.publicUrl};
}
async function saveMaterial(){
    const title=document.getElementById('matTitle').value.trim();const desc=document.getElementById('matDesc').value.trim();const url=document.getElementById('matLink').value.trim();const text=document.getElementById('matText').value.trim();
    const classIds=Array.from(document.querySelectorAll('#matClassesBox input:checked')).map(function(i){return i.value;});
    if(!title){showToast('Nhập tiêu đề học liệu','error');return;}
    if(!classIds.length){showToast('Chọn ít nhất một lớp','error');return;}
    if(url&&!matSafeUrl(url)){showToast('Link phải bắt đầu bằng http:// hoặc https://','error');return;}
    if(!text&&!url&&!matPending.length&&!matExisting.length){showToast('Hãy thêm nội dung, link hoặc file','error');return;}
    if(!SupabaseDB.ready())return;
    const btn=document.getElementById('matSaveBtn'),st=document.getElementById('matStatus');btn.disabled=true;
    const files=matExisting.slice();
    try{
        for(let i=0;i<matPending.length;i++){
            const f=matPending[i];st.textContent='⏳ Đang tải lên '+(i+1)+'/'+matPending.length+': '+f.name+'…';
            try{const up=await hvUploadMaterialFile(f,'m');files.push({name:f.name,mime:f.type||'',size:f.size,url:up.url,path:up.path});}
            catch(err){
                if(/^image\//.test(f.type||'')){const du=await hvCompressImage(await hvReadAsDataUrl(f),1280);if(du.length<900000){files.push({name:f.name,mime:'image/jpeg',size:Math.round(du.length*.75),dataUrl:du});continue;}}
                throw new Error('Không tải được "'+f.name+'": '+(err&&err.message?err.message:err)+' — hãy tạo kho lưu trữ “materials” trong Supabase (chạy SQL hướng dẫn).');
            }
        }
    }catch(e){st.textContent='';btn.disabled=false;showToast(e.message,'error');showCloudStatus(e.message,'error');return;}
    st.textContent='💾 Đang lưu lên Cloud…';
    const old=matEditId?materialsData.find(function(m){return m.id===matEditId;}):null;
    const obj={id:matEditId||('mat'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)),title:title,type:matType,desc:desc,text:text,url:url,files:files,classIds:classIds,by:old?old.by:currentUser.name,byCode:old?old.byCode:(currentUser.teacherCode||''),ts:old?old.ts:Date.now(),upd:Date.now()};
    const ok=await SupabaseDB.commit(function(){return SupabaseDB.upsert('materials',SupabaseDB.row.extra(obj));});
    btn.disabled=false;st.textContent='';if(!ok)return;
    const i=materialsData.findIndex(function(m){return m.id===obj.id;});if(i>=0)materialsData[i]=obj;else materialsData.unshift(obj);hvSaveMaterials();
    if(matRemoved.length){try{SupabaseDB.client.storage.from('materials').remove(matRemoved);}catch(_){}}
    closeMaterialModal();renderMaterials();showToast('Đã lưu học liệu!','success');try{confetti({particleCount:50,spread:60,origin:{y:.7}});}catch(_){}
}
function deleteMaterial(id){
    const m=matFind(id);if(!m)return;
    showConfirm('Xóa học liệu?','“'+m.title+'” sẽ bị xóa khỏi tất cả các lớp.',async function(){
        const ok=await SupabaseDB.commit(function(){return SupabaseDB.remove('materials','id',String(m.id));});if(!ok)return;
        materialsData=materialsData.filter(function(x){return x!==m;});hvSaveMaterials();
        const paths=(m.files||[]).map(function(f){return f.path;}).filter(Boolean);if(paths.length){try{SupabaseDB.client.storage.from('materials').remove(paths);}catch(_){}}
        renderMaterials();showToast('Đã xóa học liệu','success');
    });
}

