/* ========== STORAGE ========== */
function loadLocalCache() {
    try { const k = safeGetItem('hv_students'); if (k) studentsData = JSON.parse(k); } catch(e){}
    try { const k = safeGetItem('hv_submissions'); if (k) submissionsData = JSON.parse(k); } catch(e){}
    try { const k = safeGetItem('hv_assignments'); if (k) assignmentsData = JSON.parse(k); } catch(e){}
    try { const k = safeGetItem('hv_classes'); if (k) classesData = JSON.parse(k); } catch(e){}
    try { const k = safeGetItem('hv_khbd'); if (k) khbdList = JSON.parse(k); } catch(e){}
    try { const k = safeGetItem('hv_grade_history'); if (k) gradeHistoryData = JSON.parse(k); } catch(e){}
    
    try { const k = safeGetItem('hv_chat_widget_history'); if (k) chatWidgetHistory = JSON.parse(k); } catch(e){}
}
async function loadLocalData() {
    // Ưu tiên kéo dữ liệu từ Supabase; chỉ khi mất mạng / lỗi mới dùng LocalStorage
    let cloudOk = false;
    try{
        if(typeof SupabaseDB!=='undefined'){
            if(!SupabaseDB.client) SupabaseDB.init();
            if(SupabaseDB.online && SupabaseDB.client && navigator.onLine!==false){
                const p = SupabaseDB._bootP || SupabaseDB.syncFromCloud(); SupabaseDB._bootP = null;
                cloudOk = await Promise.race([ p, new Promise(function(r){ setTimeout(function(){ r(false); }, 5000); }) ]);
                if(!cloudOk){ p.then(function(ok){ if(ok){ try{ SupabaseDB.renderAll(); }catch(_){} } }).catch(function(){}); }
            }
        }
    }catch(e){ console.warn('syncFromCloud', e); cloudOk = false; }
    if(!cloudOk){ loadLocalCache(); try{ await hvIdbHydrate(); }catch(_){} }
    return cloudOk;
}
function saveLocalData() {
    // Chỉ lưu bộ nhớ đệm (cache) cục bộ — KHÔNG đẩy gì lên Supabase
    safeSetItem('hv_students', JSON.stringify(studentsData));
    safeSetItem('hv_submissions', JSON.stringify(submissionsData));
    safeSetItem('hv_assignments', JSON.stringify(assignmentsData));
    safeSetItem('hv_classes', JSON.stringify(classesData));
    safeSetItem('hv_khbd', JSON.stringify(khbdList));
    safeSetItem('hv_grade_history', JSON.stringify(gradeHistoryData));
    safeSetItem('hv_online_students', JSON.stringify([...onlineStudents]));
}
function getUsers() { try { return JSON.parse(safeGetItem('hv_users')||'[]'); } catch(e) { return []; } }
function saveUsers(u) { safeSetItem('hv_users', JSON.stringify(u)); }
function getTeacherRegistry() { try { return JSON.parse(safeGetItem('hv_teachers')||'{}'); } catch(e) { return {}; } }
function saveTeacherRegistry(r) { safeSetItem('hv_teachers', JSON.stringify(r)); }
function getStudentAccounts() { try { return JSON.parse(safeGetItem('hv_student_accounts')||'[]'); } catch(e) { return []; } }
function saveStudentAccounts(a) { safeSetItem('hv_student_accounts', JSON.stringify(a)); }
function getParentCodes() { try { return JSON.parse(safeGetItem('hv_parent_codes')||'{}'); } catch(e) { return {}; } }
function saveParentCodes(p) { safeSetItem('hv_parent_codes', JSON.stringify(p)); }
function getCustomRewards() { try { return JSON.parse(safeGetItem('hv_custom_rewards')||'[]'); } catch(e) { return []; } }
function saveCustomRewards(r) { safeSetItem('hv_custom_rewards', JSON.stringify(r)); }
function getWeeklyMedals() { try { return JSON.parse(safeGetItem('hv_weekly_medals')||'{}'); } catch(e) { return {}; } }
function saveWeeklyMedals(m) { safeSetItem('hv_weekly_medals', JSON.stringify(m)); }
function getSchedule() { try { return JSON.parse(safeGetItem('hv_admin_schedule')||'[]'); } catch(e) { return []; } }
function saveSchedule(l) { safeSetItem('hv_admin_schedule', JSON.stringify(l)); }
function loadDiscussionFromStorage() { try { const r = safeGetItem('hv_discussion'); if (r) { discussionData = JSON.parse(r); return; } } catch(e){} discussionData = [{ id:'d1', title:'Cách phân tích Tây Tiến?', author:'Đặng Khánh Linh', ts:Date.now()-7200000, likes:12, likedBy:[], replies:[] }]; saveDiscussionToStorage(); }
function saveDiscussionToStorage() { safeSetItem('hv_discussion', JSON.stringify(discussionData)); }
function loadChatFromStorage() { try { chatData = JSON.parse(safeGetItem('hv_livechat')||'[]'); } catch(e) { chatData = []; } }
function saveChatToStorage() { safeSetItem('hv_livechat', JSON.stringify(chatData)); }

/* ========== SOUND ENGINE ========== */
const SoundEngine = { ctx:null, enabled:true, typingEnabled:true, volume:0.85, lastTypingTime:0,
    init() { if (this.ctx) return; try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); this.loadState(); } catch(e){} },
    loadState() { this.enabled = safeGetItem('hv_sound_enabled') !== '0'; this.typingEnabled = safeGetItem('hv_typing_sound_enabled') !== '0'; const v = safeGetItem('hv_sound_volume'); this.volume = v !== null ? Math.min(1, Math.max(0, parseFloat(v))) : 0.85; },
    saveState() { safeSetItem('hv_sound_enabled', this.enabled ? '1' : '0'); safeSetItem('hv_typing_sound_enabled', this.typingEnabled ? '1' : '0'); safeSetItem('hv_sound_volume', String(this.volume)); },
    toggle() { this.enabled = !this.enabled; this.saveState(); if (this.enabled) this.play('success'); updateSoundUI(); return this.enabled; },
    toggleTyping(val) { this.typingEnabled = !!val; this.saveState(); },
    setVolume(val) { this.volume = Math.min(1, Math.max(0, val/100)); this.saveState(); },
    play(type = 'click') { if (!this.enabled || !this.ctx) return; if (this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{}); const p = { click:{f:720,e:620,d:.06,t:'sine',g:.28}, clickSoft:{f:520,e:480,d:.05,t:'sine',g:.18}, tab:{f:620,e:880,d:.10,t:'sine',g:.24}, success:{f:523,e:784,d:.22,t:'sine',g:.32}, error:{f:320,e:220,d:.20,t:'triangle',g:.28}, coin:{f:988,e:1319,d:.10,t:'square',g:.20}, achievement:{f:784,e:1976,d:.55,t:'sine',g:.38}, typing:{f:1400,e:1100,d:.018,t:'sine',g:.10}, modal:{f:440,e:660,d:.14,t:'sine',g:.22}, modalClose:{f:660,e:440,d:.12,t:'sine',g:.20}, notify:{f:880,e:1175,d:.18,t:'sine',g:.30}, correct:{f:659,e:1046,d:.28,t:'sine',g:.32}, wrong:{f:250,e:180,d:.24,t:'triangle',g:.26}, celebration:{f:523,e:2093,d:.65,t:'sine',g:.40} }[type] || {f:720,e:620,d:.06,t:'sine',g:.28}; const now = this.ctx.currentTime, vol = this.volume * p.g; try { const o = this.ctx.createOscillator(), gn = this.ctx.createGain(); o.type = p.t; o.frequency.setValueAtTime(p.f, now); if (p.e) o.frequency.exponentialRampToValueAtTime(Math.max(20,p.e), now + p.d); gn.gain.setValueAtTime(0.0001, now); gn.gain.exponentialRampToValueAtTime(Math.max(0.0001,vol), now + Math.min(0.01,p.d*0.3)); gn.gain.exponentialRampToValueAtTime(0.0001, now + p.d); o.connect(gn); gn.connect(this.ctx.destination); o.start(now); o.stop(now + p.d + 0.02); } catch(e) {} }
};
['click','touchstart','keydown'].forEach(ev => document.addEventListener(ev, () => SoundEngine.init(), { once:true, passive:true }));
document.addEventListener('click', e => { const t = e.target.closest('button, a, .nav-btn, .lib-tab-btn, .ai-mode-btn, .disc-tab-btn, .sound-toggle, .fab-btn, .tab-pill'); if (!t) return; if (t.classList.contains('nav-btn') || t.classList.contains('lib-tab-btn') || t.classList.contains('disc-tab-btn') || t.classList.contains('ai-mode-btn') || t.classList.contains('tab-pill')) SoundEngine.play('tab'); else if (t.classList.contains('btn-ghost')) SoundEngine.play('clickSoft'); else SoundEngine.play('click'); }, false);
function playTypingSound() { if (!SoundEngine.typingEnabled || !SoundEngine.enabled) return; const n = Date.now(); if (n - SoundEngine.lastTypingTime < 40) return; SoundEngine.lastTypingTime = n; SoundEngine.play('typing'); }
function toggleSound(e) { if (e) { e.stopPropagation(); e.preventDefault(); } SoundEngine.init(); const en = SoundEngine.toggle(); SoundEngine.play(en ? 'coin' : 'wrong'); showToast(en ? '🔊 Bật âm thanh' : '🔇 Tắt âm thanh', en ? 'success' : 'error'); }
function toggleTypingSound(el) { SoundEngine.toggleTyping(el.checked); }
function changeVolume(val) { SoundEngine.setVolume(val); if (bgMusic) bgMusic.volume = 0.25 * (val/100) * 2; }
function updateSoundUI() { ['soundIconApp','soundIconSettings'].forEach(id => { const el = document.getElementById(id); if (el) el.className = SoundEngine.enabled ? 'fa-solid fa-volume-high text-sm' : 'fa-solid fa-volume-xmark text-sm'; }); const lbl = document.getElementById('soundLabelApp'); if (lbl) lbl.innerText = SoundEngine.enabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'; ['soundToggleApp','soundToggleSettings'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.toggle('muted', !SoundEngine.enabled); }); const tt = document.getElementById('typingSoundToggle'); if (tt) tt.checked = SoundEngine.typingEnabled; const vs = document.getElementById('soundVolume'); if (vs) vs.value = Math.round(SoundEngine.volume * 100); }

/* ========== THEME + MUSIC ========== */
let bgMusic = null, musicPlaying = false;
function toggleTheme() { const cur = document.documentElement.getAttribute('data-theme'); const next = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); safeSetItem('hv_theme', next); SoundEngine.play(next === 'dark' ? 'coin' : 'success'); showToast(next === 'dark' ? '🌙 Chế độ Tối' : '☀️ Chế độ Sáng', 'success'); }
function loadTheme() { const saved = safeGetItem('hv_theme'); if (saved) document.documentElement.setAttribute('data-theme', saved); else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme', 'dark'); }
function toggleMusic() { const en = safeGetItem('hv_music_enabled') !== '0'; const next = !en; safeSetItem('hv_music_enabled', next ? '1' : '0'); if (next) { playBgMusic(); showToast('🎵 Bật nhạc nền', 'success'); } else { stopBgMusic(); showToast('🔇 Tắt nhạc nền', 'error'); } updateMusicUI(); }
function playBgMusic() { if (musicPlaying) return; try { if (!bgMusic) { bgMusic = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'); bgMusic.loop = true; bgMusic.volume = 0.22; bgMusic.crossOrigin = 'anonymous'; } const p = bgMusic.play(); if (p && p.then) p.then(() => { musicPlaying = true; updateMusicUI(); }).catch(() => { musicPlaying = false; updateMusicUI(); }); } catch(e) {} }
function stopBgMusic() { if (bgMusic && musicPlaying) { bgMusic.pause(); musicPlaying = false; } updateMusicUI(); }
function updateMusicUI() { const fab = document.getElementById('musicFab'); const icon = document.getElementById('musicIconSettings'); const toggle = document.getElementById('musicToggleSettings'); if (fab) { if (musicPlaying) { fab.classList.add('playing'); fab.classList.remove('muted'); fab.innerHTML = '<i class="fa-solid fa-pause"></i>'; } else { fab.classList.remove('playing'); fab.classList.add('muted'); fab.innerHTML = '<i class="fa-solid fa-music"></i>'; } } if (icon) icon.className = musicPlaying ? 'fa-solid fa-music text-sm' : 'fa-solid fa-volume-xmark text-sm'; if (toggle) toggle.classList.toggle('muted', !musicPlaying); }
function autoStartMusic() { if (audioUnlocked) return; audioUnlocked = true; if (safeGetItem('hv_music_enabled') !== '0') { setTimeout(() => { playBgMusic(); }, 300); } ['click','touchstart','keydown','scroll'].forEach(ev => document.removeEventListener(ev, autoStartMusic)); }
['click','touchstart','keydown','scroll'].forEach(ev => document.addEventListener(ev, autoStartMusic, { once:true, passive:true }));

