/* =====================================================================
   v4.9.1 · Bổ sung tối ưu: ảnh WebP + createImageBitmap, kết xuất theo lô, bộ đệm âm thanh,
   chỉ mục tìm kiếm, theo dõi rò rỉ DOM tạm
   ===================================================================== */
/* ----- Ảnh: giải mã ngoài luồng chính (createImageBitmap) + nén WebP nếu trình duyệt hỗ trợ ----- */
const hvWebp=(function(){try{const c=document.createElement('canvas');c.width=c.height=1;return c.toDataURL('image/webp').indexOf('data:image/webp')===0;}catch(_){return false;}})();
hvCompressImage=function(dataUrl,maxW){
    const limit=maxW||1280;
    const out=function(c){try{return hvWebp?c.toDataURL('image/webp',0.8):c.toDataURL('image/jpeg',0.82);}catch(_){return dataUrl;}};
    const viaImage=function(){return new Promise(function(res){const im=new Image();im.decoding='async';im.onload=function(){try{const r=Math.min(1,limit/im.width);const c=document.createElement('canvas');c.width=Math.round(im.width*r);c.height=Math.round(im.height*r);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(out(c));}catch(_){res(dataUrl);}};im.onerror=function(){res(dataUrl);};im.src=dataUrl;});};
    if(!window.createImageBitmap)return viaImage();
    return fetch(dataUrl).then(function(r){return r.blob();}).then(function(b){return createImageBitmap(b);}).then(function(bm){
        const r=Math.min(1,limit/bm.width);const c=document.createElement('canvas');c.width=Math.round(bm.width*r);c.height=Math.round(bm.height*r);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);try{bm.close();}catch(_){}return out(c);
    }).catch(viaImage);
};

/* ----- Kết xuất danh sách theo lô (DocumentFragment + <template>), nhường luồng chính giữa các lô ----- */
function hvChunkRender(box,items,toHtml,first,step){
    first=first||24;step=step||24;const token=(box.__hvTok=(box.__hvTok||0)+1);
    box.innerHTML=items.slice(0,first).map(toHtml).join('');
    let i=first;
    const next=async function(){
        if(box.__hvTok!==token||i>=items.length)return;
        const t=document.createElement('template');t.innerHTML=items.slice(i,i+step).map(toHtml).join('');
        box.appendChild(t.content);i+=step;await hvYield();hvIdle(next,400);
    };
    if(items.length>first)hvIdle(next,400);
}
(function(){
    const _r=renderCmPosts;
    renderCmPosts=function(soft){
        const box=document.getElementById('cmPosts');
        if(!box)return;
        const list=cmVisiblePosts();
        if(list.length<=30)return _r.apply(this,arguments);
        if(soft){const a=document.activeElement;if(a&&box.contains(a)&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'))return;}
        hvChunkRender(box,list,cmPostHtml,24,24);cmUpdateStats();
    };
})();

/* ----- Chỉ mục nghịch đảo cho tìm kiếm tiếng Việt (chỉ bật khi dữ liệu lớn) ----- */
const hvInv={sig:'',map:null};
function hvTokens(t){return hvStrip(String(t||'').toLowerCase()).split(/[^a-z0-9]+/).filter(Boolean);}
function hvInvBuild(posts){
    const sig=posts.length+'|'+(posts[0]&&posts[0].ts)+'|'+(posts[posts.length-1]&&posts[posts.length-1].ts);
    if(hvInv.sig===sig&&hvInv.map)return hvInv.map;
    const m=new Map();posts.forEach(function(p,i){new Set(hvTokens((p.text||'')+' '+(p.nick||''))).forEach(function(tk){let s=m.get(tk);if(!s){s=[];m.set(tk,s);}s.push(i);});});
    hvInv.sig=sig;hvInv.map=m;return m;
}
function hvInvSearch(posts,q){
    const toks=hvTokens(q);if(!toks.length)return null;const m=hvInvBuild(posts);let res=null;
    for(const tk of toks){
        const hit=new Set();m.forEach(function(arr,key){if(key.indexOf(tk)===0)arr.forEach(function(i){hit.add(i);});});
        res=res?new Set([...res].filter(function(i){return hit.has(i);})):hit;if(!res.size)break;
    }
    return res;
}
(function(){
    const _v=cmVisiblePosts;
    cmVisiblePosts=function(){
        const q=cmQuery.trim();if(!q||communityPosts.length<150)return _v.apply(this,arguments);
        const hit=hvInvSearch(communityPosts,q);if(!hit)return _v.apply(this,arguments);
        return communityPosts.filter(function(p,i){return hit.has(i)&&p&&!p.deleted&&(p.reports||[]).length<3&&(cmCat==='all'||p.cat===cmCat);}).sort(function(a,b){return (b.ts||0)-(a.ts||0);});
    };
})();

/* ----- Bộ đệm AudioBuffer cho âm thanh giao diện (không tạo oscillator mỗi lần phát) ----- */
const HV_SND={click:{f:720,e:620,d:.06,t:'sine',g:.28},clickSoft:{f:520,e:480,d:.05,t:'sine',g:.18},tab:{f:620,e:880,d:.10,t:'sine',g:.24},success:{f:523,e:784,d:.22,t:'sine',g:.32},error:{f:320,e:220,d:.20,t:'triangle',g:.28},coin:{f:988,e:1319,d:.10,t:'square',g:.20},achievement:{f:784,e:1976,d:.55,t:'sine',g:.38},typing:{f:1400,e:1100,d:.018,t:'sine',g:.10},modal:{f:440,e:660,d:.14,t:'sine',g:.22},modalClose:{f:660,e:440,d:.12,t:'sine',g:.20},notify:{f:880,e:1175,d:.18,t:'sine',g:.30},correct:{f:659,e:1046,d:.28,t:'sine',g:.32},wrong:{f:250,e:180,d:.24,t:'triangle',g:.26},celebration:{f:523,e:2093,d:.65,t:'sine',g:.40}};
const hvSndBuf={};
function hvSndBuild(type){
    const ctx=SoundEngine.ctx,p=HV_SND[type];if(!ctx||!p)return null;if(hvSndBuf[type])return hvSndBuf[type];
    const sr=ctx.sampleRate,n=Math.max(1,Math.floor((p.d+0.02)*sr)),buf=ctx.createBuffer(1,n,sr),d=buf.getChannelData(0);
    let ph=0;const att=Math.min(0.01,p.d*0.3);
    for(let i=0;i<n;i++){
        const t=i/sr;const fr=t<p.d?p.f*Math.pow(Math.max(20,p.e||p.f)/p.f,t/p.d):(p.e||p.f);ph+=2*Math.PI*fr/sr;
        let w=Math.sin(ph);if(p.t==='triangle')w=2/Math.PI*Math.asin(w);else if(p.t==='square')w=w>=0?1:-1;
        let g;if(t<att)g=0.0001*Math.pow(1/0.0001,t/att);else if(t<p.d)g=Math.pow(0.0001,(t-att)/(p.d-att));else g=0;
        d[i]=w*g;
    }
    return hvSndBuf[type]=buf;
}
(function(){
    const _p=SoundEngine.play;
    SoundEngine.play=function(type){
        type=type||'click';
        try{
            if(!this.enabled||!this.ctx)return;const p=HV_SND[type]||HV_SND.click;const buf=hvSndBuild(HV_SND[type]?type:'click');if(!buf)return _p.apply(this,arguments);
            if(this.ctx.state==='suspended')this.ctx.resume().catch(function(){});
            const src=this.ctx.createBufferSource(),gn=this.ctx.createGain();src.buffer=buf;gn.gain.value=Math.max(0.0001,this.volume*p.g);src.connect(gn);gn.connect(this.ctx.destination);src.start();
        }catch(e){return _p.apply(this,arguments);}
    };
})();

/* ----- Theo dõi rò rỉ DOM tạm bằng WeakRef + FinalizationRegistry ----- */
const hvLeak={live:0,reg:window.FinalizationRegistry?new FinalizationRegistry(function(){hvLeak.live=Math.max(0,hvLeak.live-1);}):null};
function hvTrackNode(el){if(!hvLeak.reg||!el)return el;hvLeak.live++;hvLeak.reg.register(el,1);return el;}

/* ----- Lập lịch nền ưu tiên thấp bằng scheduler.postTask khi có ----- */
hvIdle=function(fn,timeout){
    if(window.scheduler&&scheduler.postTask)return scheduler.postTask(fn,{priority:'background'});
    if('requestIdleCallback' in window)return requestIdleCallback(fn,{timeout:timeout||1500});
    return setTimeout(fn,60);
};


