
/* ============================================================
   HỌC VĂN 4.8 — JAVASCRIPT PHẦN 1
   ============================================================ */

/* ⚠️ Bọc try/catch chống crash khi CDN lỗi */
try { if (typeof gsap !== 'undefined') gsap.registerPlugin(ScrollTrigger); }
catch(e) { console.warn('⚠️ GSAP/ScrollTrigger chưa load'); }
try { if (typeof mermaid !== 'undefined') mermaid.initialize({ startOnLoad: false, theme:'default', securityLevel:'loose', fontFamily:'Inter' }); }
catch(e) { console.warn('⚠️ Mermaid chưa load'); }

/* ========== SKIP INTRO ========== */
function skipIntro() {
    const splash = document.getElementById('introSplash');
    if (splash) splash.classList.add('hide');
}

/* ========== HELPERS ========== */
function safeGetItem(k, d=null) { try { return localStorage.getItem(k) || d; } catch(e) { return d; } }
function safeSetItem(k, v) { try { localStorage.setItem(k, v); } catch(e) {} }
function safeSessionGet(k, d=null) { try { return sessionStorage.getItem(k) || d; } catch(e) { return d; } }
function safeSessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch(e) {} }
function safeSessionRemove(k) { try { sessionStorage.removeItem(k); } catch(e) {} }
function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function removeDiacritics(str) { return String(str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D'); }
function randPass(len=8) { const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; let s=''; for (let i=0;i<len;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
function randCode(len=6) { const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for (let i=0;i<len;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
function timeAgo(ts) { if (!ts) return 'vừa xong'; const d = Date.now() - ts; if (d<60000) return 'vừa xong'; if (d<3600000) return Math.floor(d/60000)+' phút trước'; if (d<86400000) return Math.floor(d/3600000)+' giờ trước'; return Math.floor(d/86400000)+' ngày trước'; }
function togglePasswordVisibility(id, btn) { const inp = document.getElementById(id); if (!inp) return; const isPass = inp.type === 'password'; inp.type = isPass ? 'text' : 'password'; const ic = btn.querySelector('i'); if (ic) ic.className = isPass ? 'fa-solid fa-eye-slash text-xs' : 'fa-solid fa-eye text-xs'; }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

/* ========== CONFIG ========== */
const SUPER_ADMIN_CODE = "bogiaoduc";
const TEACHER_CODE_PREFIX = "bogiaoduc";
const RUBRIC_CRITERIA = [
    { id:1, name:"1. Xác định vấn đề nghị luận" },
    { id:2, name:"2. Hệ thống luận điểm" },
    { id:3, name:"3. Lập luận logic" },
    { id:4, name:"4. Dẫn chứng" },
    { id:5, name:"5. Bàn luận mở rộng" },
    { id:6, name:"6. Bố cục & Mạch liên kết" },
    { id:7, name:"7. Diễn đạt & Chính tả" },
    { id:8, name:"8. Sáng tạo & Cảm xúc" }
];
const DEFAULT_CLASSES = [
    { id:'C_10A1', name:'10A1', code:'LOP-10A1-A3F2', teacherCode:'bogiaoduc1', grade:10, createdAt:new Date().toISOString() },
    { id:'C_10A2', name:'10A2', code:'LOP-10A2-B7C1', teacherCode:'bogiaoduc1', grade:10, createdAt:new Date().toISOString() },
    { id:'C_11A1', name:'11A1', code:'LOP-11A1-D9E4', teacherCode:'bogiaoduc1', grade:11, createdAt:new Date().toISOString() },
    { id:'C_12A1', name:'12A1', code:'LOP-12A1-G3H7', teacherCode:'bogiaoduc2', grade:12, createdAt:new Date().toISOString() }
];
const DEFAULT_USERS = [{ name:"Tổ trưởng Tổ Ngữ Văn", email:"tongvan@vinhhoa.edu.vn", password:"123456", role:"superadmin", teacherCode:"bogiaoduc", school:"THCS & THPT Vĩnh Hòa" }];
const DEFAULT_TEACHERS = {
    "bogiaoduc":{name:"Tổ trưởng", email:"tongvan@vinhhoa.edu.vn"},
    "bogiaoduc1":{name:"Cô Trần Thu Hà", email:"ha.nguvan@vinhhoa.edu.vn"},
    "bogiaoduc2":{name:"Thầy Nguyễn Đình Khoa", email:"khoa.nguvan@vinhhoa.edu.vn"}
};
const DEFAULT_STUDENTS = [
    { id:"HS001", name:"Đặng Khánh Linh", classId:"C_10A1", tx1:7.5, tx2:8.0, tx3:8.5, tx4:8.0, gk:8.5, ck:9.0, tbm:8.4, nhanXet:"Nắm chắc kiến thức", rubricScores:[4,3,4,4,3,4,4,3], target:"Rèn phản biện", b1:7.5,b2:8,b3:8.5,b4:8,b5:9 }
];

/* ========== STATE ========== */
let currentUser = null;
let studentsData = [...DEFAULT_STUDENTS];
let submissionsData = [];
let assignmentsData = [];
let classesData = [...DEFAULT_CLASSES];
let activeSubmissionId = null;
let readingViewSubId = null;
let currentAssignmentContext = null;
let currentClassIdForUser = null;
let cmView = 'teachers', cmTeacherCode = null, cmClassId = null;
let progressChartInstance = null, vpsPieChartInstance = null, rubricRadarChartInstance = null;
let macroGradeChartInstance = null, macroDistChartInstance = null;
let blindGrading = false;
let discussionData = [];
let chatData = [];
let discTab = 'topics';
let pendingStudentAccount = null;
let pendingAttachments = [];
let pendingAssignmentAttachments = [];
let mcqList = [], tfList = [];
let khbdList = [];
let currentKHBDId = null;
let gradeHistoryData = [];
let trendChartInst = null, gdptRadarInst = null;
let onlineStudents = new Set();
let audioUnlocked = false;
let chatWidgetOpen = false;
let chatWidgetHistory = [];

