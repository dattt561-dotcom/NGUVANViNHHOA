/* ========== LIBRARY + AI FALLBACK ========== */
let libTab='exam';
const LIB_DATA={exam:[{id:'ex1',title:'Đề minh họa 2026 — Ngữ Văn',tag:'Kết nối',type:'Đề thi thử',content:`<h2>PHẦN I. ĐỌC HIỂU (4.0đ)</h2><p>Câu 1: Xác định thể thơ.</p><p>Câu 2: Chỉ ra biện pháp tu từ.</p><h2>PHẦN II. VIẾT (6.0đ)</h2><p>Câu 1: NLXH ~200 chữ.</p><p>Câu 2: NLVH ~600 chữ.</p>`}],essay:[{id:'es1',title:'Cảm nhận Tây Tiến',author:'HS Vĩnh Hòa',score:'9.0',topic:'NLVH',content:`<p>Quang Dũng viết "Tây Tiến" năm 1948...</p>`}],evidence:[{id:'ev1',person:'Nguyễn Ngọc Mạnh',story:'Cứu bé gái rơi tầng 12 (2021)',topic:'Lòng tốt',content:`<p>Chiều 28/2/2021...</p>`}]};
function switchLibTab(t){libTab=t;document.querySelectorAll('.lib-tab-btn').forEach(b=>{b.classList.remove('bg-red-600','text-white');b.classList.add('btn-ghost','text-ink-700');});const b=document.getElementById('libTab-'+t);if(b){b.classList.add('bg-red-600','text-white');b.classList.remove('btn-ghost','text-ink-700');}renderLibrary();}
function renderLibrary(){const c=document.getElementById('libContent');if(!c)return;if(libTab==='exam')c.innerHTML=LIB_DATA.exam.map(e=>`<div class="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-red-300" onclick="openDocViewer('exam','${e.id}')"><div class="flex items-center gap-3"><div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-100 to-emerald-100 text-red-700 flex items-center justify-center"><i class="fa-solid fa-file-pdf"></i></div><div><h4 class="font-bold text-sm">${escapeHtml(e.title)}</h4><p class="text-[11px] text-ink-500">${e.tag} • ${e.type}</p></div></div><button class="btn-primary text-[11px] font-bold px-3 py-1.5 rounded-lg">Mở</button></div>`).join('');else if(libTab==='essay')c.innerHTML=LIB_DATA.essay.map(e=>`<div class="glass-card rounded-2xl p-4 cursor-pointer hover:border-red-300" onclick="openDocViewer('essay','${e.id}')"><div class="flex justify-between"><div><h4 class="font-bold">${escapeHtml(e.title)}</h4><p class="text-[11px] text-ink-500">${e.author} • ${e.topic}</p></div><span class="text-xs font-black text-emerald-700">${e.score}</span></div></div>`).join('');else if(libTab==='evidence')c.innerHTML=LIB_DATA.evidence.map(e=>`<div class="glass-card rounded-2xl p-4 cursor-pointer hover:border-amber-300" onclick="openDocViewer('evidence','${e.id}')"><h4 class="font-bold">${escapeHtml(e.person)}</h4><p class="text-xs italic">"${escapeHtml(e.story)}"</p></div>`).join('');else if(libTab==='dict')c.innerHTML=`<div class="glass-card rounded-3xl p-5 space-y-3"><div class="modern-search"><span class="search-icon"><i class="fa-solid fa-magnifying-glass"></i></span><input type="text" id="dictSearch" onkeydown="if(event.key==='Enter'){event.preventDefault();searchDict()}"><button onclick="searchDict()" class="btn-primary text-[11px] font-bold px-3 py-2 rounded-lg mr-2">Tra</button></div><div id="dictResult" class="text-sm italic min-h-[80px]">Nhập từ khóa.</div></div>`;else if(libTab==='ai')c.innerHTML=`<div class="glass-card rounded-3xl p-5 space-y-3"><input type="text" id="libAiInput" placeholder="Câu hỏi..." class="input-editorial w-full px-3 py-3 rounded-xl text-sm" onkeydown="if(event.key==='Enter'){event.preventDefault();runLibraryAI()}"><button onclick="runLibraryAI()" class="btn-primary text-xs font-bold px-5 py-2.5 rounded-xl w-full">Hỏi AI</button><div id="libAiResult" class="letter-note text-xs p-4 rounded-xl min-h-[200px] whitespace-pre-line">Kết quả...</div></div>`;}
async function searchDict(){const q=(document.getElementById('dictSearch')?.value||'').trim();const out=document.getElementById('dictResult');if(!q)return;setAILoading(out,'🔍 Tra...');try{let a;if(GeminiAI.hasKey())a=await GeminiAI.generate({prompt:`Tra: "${q}"`,systemPrompt:'Từ điển Hán-Việt.',temperature:0.25,maxTokens:1200});else a=await callAI('Từ điển Hán-Việt.',`Tra: "${q}"`,{temperature:0.25,maxTokens:1200});out.innerText=a;}catch(e){setAIError(out,'Lỗi: '+e.message);}}
async function runLibraryAI(){const inp=(document.getElementById('libAiInput').value||'').trim();const out=document.getElementById('libAiResult');if(!inp)return;if(detectCheatingRequest(inp)){out.innerText='🚫 Không viết hộ.';return;}setAILoading(out,'🤖 Tra cứu...');try{let a;if(GeminiAI.hasKey())a=await GeminiAI.generate({prompt:inp,systemPrompt:'Chuyên gia Ngữ Văn THPT.',temperature:0.5,maxTokens:2200});else a=await callAI('Chuyên gia Ngữ Văn THPT.',inp,{temperature:0.5,maxTokens:2200});out.innerText=a;}catch(e){setAIError(out,'Lỗi: '+e.message);}}
function openDocViewer(type,id){let d=null;if(type==='exam')d=LIB_DATA.exam.find(e=>e.id===id);else if(type==='essay')d=LIB_DATA.essay.find(e=>e.id===id);else if(type==='evidence')d=LIB_DATA.evidence.find(e=>e.id===id);if(!d)return;document.getElementById('docViewerTitle').innerText=d.title||d.person;document.getElementById('docViewerBody').innerHTML=`<div style="background:linear-gradient(180deg,#fdfcf8,#faf7f0); border:1px solid #e8dcc0; border-radius:16px; padding:24px; line-height:1.85;">${d.content}</div>`;openModalShell('docViewerModal');}
let aiCompanionMode='brainstorm';
function aiMode(m,ev){aiCompanionMode=m;document.querySelectorAll('.ai-mode-btn').forEach(b=>{b.classList.remove('bg-red-600','text-white');b.classList.add('btn-ghost','text-ink-700');});if(ev?.target){ev.target.classList.add('bg-red-600','text-white');ev.target.classList.remove('btn-ghost','text-ink-700');}}
function clearAIChat(){document.getElementById('aiInput').value='';document.getElementById('aiCompanionOutput').innerText='Chọn chế độ và gửi.';}
async function aiChatSend(){ const input=document.getElementById('aiInput'); const out=document.getElementById('aiCompanionOutput'); const text=(input?.value||'').trim(); if(!text){showToast('Nhập câu hỏi!','error');return;} if(!GeminiAI.hasKey()){out.innerHTML='<div class="letter-note p-4 rounded-xl text-xs text-rose-700">⚠️ Chưa cấu hình Gemini API Key.</div>';SoundEngine.play('error');return;} if(detectCheatingRequest(text)){out.innerHTML='<div class="letter-note p-4 rounded-xl text-xs">🚫 Cô không viết hộ em được. Nhưng cô có thể gợi ý dàn ý.</div>';SoundEngine.play('error');return;} const userBlock=document.createElement('div'); userBlock.className='mb-3 p-3 bg-red-50 rounded-xl border border-red-100'; userBlock.innerHTML=`<p class="text-[10px] font-bold text-red-700 uppercase mb-1">Bạn hỏi</p><p class="text-sm">${escapeHtml(text)}</p>`; out.innerHTML=''; out.appendChild(userBlock); const aiBlock=document.createElement('div'); aiBlock.className='letter-note p-4 rounded-xl'; aiBlock.id='aiChatReply'; aiBlock.innerHTML='<span class="text-red-600"><i class="fa-solid fa-circle-notch fa-spin"></i> Cô đang soạn...</span>'; out.appendChild(aiBlock); input.value=''; SoundEngine.play('notify'); try{ const reply=await GeminiAI.chat({history:AIChatState.history.slice(-6),userMessage:text,systemPrompt:CHATBOT_SYSTEM_PROMPT}); AIChatState.history.push({role:'user',text},{role:'model',text:reply}); aiBlock.innerHTML=renderMarkdown(reply); SoundEngine.play('success'); }catch(e){ aiBlock.innerHTML=`<span class="text-rose-600">⚠️ ${escapeHtml(e.message)}</span>`; SoundEngine.play('error'); } }
function renderMarkdown(md){ if(window.marked){try{marked.setOptions({breaks:true,gfm:true});return `<div class="prose prose-sm max-w-none">${marked.parse(md)}</div>`;}catch(e){}} return String(md).replace(/^### (.*)$/gm,'<h3 class="font-black text-sm mt-3 mb-1">$1</h3>').replace(/^## (.*)$/gm,'<h2 class="font-black text-base mt-3 mb-1">$1</h2>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>').replace(/^- (.*)$/gm,'<li class="ml-4">$1</li>').replace(/\n/g,'<br>'); }

/* ========== CHAT WIDGET ========== */
function toggleChatWidget(){chatWidgetOpen = !chatWidgetOpen;document.getElementById('chatPanel').classList.toggle('open', chatWidgetOpen);}
function quickChat(text){document.getElementById('chatWidgetInput').value = text;sendChatWidget();}
async function sendChatWidget(){
    const inp = document.getElementById('chatWidgetInput');
    const box = document.getElementById('chatMessagesWidget');
    const text = (inp.value||'').trim();
    if (!text) return;
    inp.value = '';
    box.innerHTML += `<div class="chat-msg user">${escapeHtml(text)}</div>`;
    box.scrollTop = box.scrollHeight;
    chatWidgetHistory.push({role:'user', text});
    const lowerText = text.toLowerCase();
    let answer = '';
    const routeMap = [
        {kw:['chấm bài','chấm điểm'], role:['teacher','superadmin'], tab:'submissions', ans:'Vào menu bên trái → <b>Bài nộp</b>, hoặc bấm nút "Chấm" trên từng bài.'},
        {kw:['giao bài','tạo bài','đăng bài'], role:['teacher','superadmin'], tab:'assignments', ans:'Vào menu → <b>Giao bài</b>. Nhấn "Giao bài mới" → nhập đề + <b>đáp án</b> cho AI chấm.'},
        {kw:['học bạ'], role:['teacher','superadmin'], tab:'hocba', ans:'Vào menu → <b>Học bạ số</b>. Chọn HS → xuất PDF theo TT22.'},
        {kw:['luyện đọc','ghi âm'], role:['student'], tab:'voice', ans:'Vào menu → <b>Luyện đọc</b>. Chọn bài → nhấn mic → ghi âm → tải về.'},
        {kw:['phòng thi','thi thử'], role:['student'], tab:'examroom', ans:'Vào menu → <b>Phòng thi thử</b>. Nhấn "Bắt đầu" và làm bài.'},
        {kw:['năng lực','gdpt'], role:['student'], tab:'gdpt', ans:'Vào menu → <b>Năng lực GDPT</b>. Xem radar 5 năng lực cốt lõi.'},
        {kw:['sổ điểm','điểm'], role:['teacher','superadmin'], tab:'students', ans:'Vào menu → <b>Sổ điểm</b>. Có thể chỉnh điểm + email + MK HS.'},
        {kw:['lớp','quản lý lớp'], role:['teacher','superadmin'], tab:'classes', ans:'Vào menu → <b>Quản lý lớp</b>. Nhấn vào GV → Lớp → HS bằng tab pills.'},
        {kw:['link','cổng hs','tài khoản'], role:['teacher','superadmin'], tab:'submissions', ans:'Vào <b>Bài nộp</b> → nút "Xuất TK" → xem/copy link HS.'},
        {kw:['hỏi bài','cô ơi','giúp em'], role:['student'], tab:'companion', ans:'Vào menu → <b>Trợ lý AI</b> để hỏi Cô giáo ảo.'},
        {kw:['nhạc'], role:['student','teacher','superadmin'], tab:null, ans:'Nhấn nút 🎵 góc trên phải để bật/tắt nhạc nền.'},
        {kw:['đổi màu','theme','tối','sáng'], role:['student','teacher','superadmin'], tab:null, ans:'Nhấn nút mặt trăng/mặt trời góc trên phải.'}
    ];
    let found = null;
    for (const r of routeMap) { if (r.kw.some(k=>lowerText.includes(k)) && r.role.includes(currentUser?.role)) { found = r; break; } }
    if (found) { answer = found.ans; if (found.tab) answer += ` <br><a href="javascript:switchTab('${found.tab}')" class="text-red-600 underline font-bold">Mở ngay →</a>`; }
    else if (GeminiAI.hasKey()) { try { const sys = `Bạn là trợ lý ảo HỌC VĂN 4.8 của trường THCS & THPT Vĩnh Hòa. Trả lời ngắn gọn (2-4 câu), thân thiện. Vai trò user: ${currentUser?.role||'khách'}.`; answer = await GeminiAI.generate({prompt:text, systemPrompt:sys, temperature:0.6, maxTokens:400}); } catch(e){ answer = 'Xin lỗi, tôi không kết nối được AI. Bạn có thể thử lại sau.'; } }
    else { answer = 'Xin lỗi, tôi chưa được cấu hình AI. Hãy hỏi GV hoặc thử các từ khoá: "chấm bài", "giao bài", "luyện đọc"...'; }
    setTimeout(()=>{box.innerHTML += `<div class="chat-msg bot">${answer}</div>`;box.scrollTop = box.scrollHeight;chatWidgetHistory.push({role:'model', text:answer});safeSetItem('hv_chat_widget_history', JSON.stringify(chatWidgetHistory.slice(-30)));}, 400);
}
function startVoiceChat(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Browser không hỗ trợ giọng nói','error'); return; }
    const rec = new SR();
    rec.lang = 'vi-VN'; rec.continuous = false; rec.interimResults = false;
    const btn = document.getElementById('voiceChatBtn');
    btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    showToast('🎤 Đang nghe...', 'info');
    rec.onresult = e => { const text = e.results[0][0].transcript; document.getElementById('chatWidgetInput').value = text; btn.style.background = ''; btn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; sendChatWidget(); };
    rec.onerror = () => { btn.style.background = ''; btn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; showToast('Không nghe được', 'error'); };
    rec.onend = () => { btn.style.background = ''; btn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; };
    rec.start();
}

