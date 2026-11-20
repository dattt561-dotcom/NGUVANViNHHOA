#!/usr/bin/env python3
"""Cập nhật mã băm ?v=... của css/js trong index.html và danh sách tiền lưu (precache) trong sw.js.
Chạy sau mỗi lần sửa tệp css/js:   python3 tools/restamp.py [số-phiên-bản-mới]"""
import hashlib,os,re,sys
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def sha(p): return hashlib.sha1(open(p,'rb').read().decode('utf-8').encode('utf-8')).hexdigest()[:8]
idx=os.path.join(root,'index.html'); html=open(idx,encoding='utf-8').read(); sw_p=os.path.join(root,'sw.js'); sw=open(sw_p,encoding='utf-8').read()
new_ver=sys.argv[1] if len(sys.argv)>1 else None
ver={}
def repl(m):
    path=m.group(2); p=os.path.join(root,path)
    if not os.path.exists(p): raise SystemExit('Thiếu tệp: '+path)
    ver[path]=sha(p); return m.group(1)+path+'?v='+ver[path]+'"'
html=re.sub(r'((?:href|src)=")((?:css|js)/[^"?]+)(?:\?v=[0-9a-f]*)?"',repl,html)
if new_ver:
    html=re.sub(r'(name="hv-version" content=")[\d.]+(")',r'\g<1>'+new_ver+r'\2',html)
    html=re.sub(r'(<title>HỌC VĂN )[\d.]+',r'\g<1>'+new_ver,html)
    html=re.sub(r"(hv-compat: const HV_VERSION=')[\d.]+(')",r'\g<1>'+new_ver+r'\2',html)
    for dp,_,fs in os.walk(os.path.join(root,'js')):
        for f in fs:
            p=os.path.join(dp,f); c=open(p,encoding='utf-8').read(); c2=re.sub(r"const HV_VERSION='[\d.]+';","const HV_VERSION='"+new_ver+"';",c)
            if c2!=c: open(p,'w',encoding='utf-8').write(c2)
    sw=re.sub(r"const VERSION = 'hv-[\d.]+';","const VERSION = 'hv-"+new_ver+"';",sw)
    # sau khi đổi HV_VERSION trong js, mã băm của tệp đó đổi → tính lại
    html=re.sub(r'((?:href|src)=")((?:css|js)/[^"?]+)(?:\?v=[0-9a-f]*)?"',repl,html)
lst=",\n  ".join("'./%s?v=%s'"%(k,v) for k,v in ver.items())
sw=re.sub(r"const SHELL = \[.*?\];","const SHELL = [\n  './', './index.html',\n  "+lst+"\n];",sw,count=1,flags=re.S)
open(idx,'w',encoding='utf-8').write(html); open(sw_p,'w',encoding='utf-8').write(sw)
print('Đã cập nhật',len(ver),'tệp css/js trong index.html và sw.js')
