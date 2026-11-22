# Used on 21 Nov 2026 for the re-readings recorded in data/counties-cob.json and data/conflicts.json (reread blocks).
# Needs python3 with rapidocr_onnxruntime, opencv-python, numpy, pillow, and pdftoppm (poppler). Not part of the build.
# Re-read table cells with two independent OCR passes (fixed parameters, applied to every cell alike).
# Cell geometry: within the row band, find the vertical table rules either side of the value's right edge,
# blank rule pixels (and horizontal rules), take the ink bounding box, pad with white.
# Method A: 600 dpi greyscale render, RapidOCR recogniser only (detector off, angle classifier off) on the tight greyscale cell crop.
# Method B: 400 dpi greyscale render, Otsu binarisation, 2x nearest-neighbour upscale, RapidOCR detector+recogniser (angle classifier off).
# Both use text_score 0.3 so that low-confidence readings are returned (with their confidence) rather than dropped.
# usage: reread-cells.py jobs.json out.json     (job coordinates in 300-dpi pixels: x_right = right edge of value, y = row centre)
import sys, json, os, subprocess
import numpy as np, cv2
from PIL import Image, ImageOps
from rapidocr_onnxruntime import RapidOCR
jobs=json.load(open(sys.argv[1])); outp=sys.argv[2]
# RapidOCR's 0/180-degree angle classifier flips short numbers ("91" read as "16", "90" as "06"); it is off in both methods.
engA=RapidOCR(); engA.use_angle_cls=False; engA.use_text_det=False   # recogniser only, on the whole tight crop
engB=RapidOCR(); engB.use_angle_cls=False                            # detector + recogniser
cache={}
OUT=os.environ.get('REREAD_OUT','/tmp/reread')   # renders and crops (not kept in the repository)
os.makedirs(OUT,exist_ok=True)
def render(pdf,page,dpi):
    k=(pdf,page,dpi)
    if k not in cache:
        base=f"{OUT}/{os.path.basename(pdf)[:-4]}_p{page}_{dpi}"
        if not os.path.exists(base+'.png'):
            subprocess.run(['pdftoppm','-r',str(dpi),'-gray','-f',str(page),'-l',str(page),'-png','-singlefile',pdf,base],check=True)
        cache[k]=np.array(Image.open(base+'.png').convert('L'))
    return cache[k]
def cell(im,s,xr,yc,half,box=None,textline=False):
    if box:   # explicit region (300-dpi coordinates): x0,x1,y0,y1
        y0=int(box[2]*s); y1=int(box[3]*s); band=im[y0:y1]<140; left=int(box[0]*s)-1; right=int(box[1]*s)
    else:
        y0=int((yc-half)*s); y1=int((yc+half)*s)
        band=im[y0:y1]<140
        xa=max(0,int((xr-230)*s)); xb=min(im.shape[1],int((xr+60)*s))
        frac=band[:,xa:xb].mean(axis=0)
        rules=[xa+i for i,f in enumerate(frac) if f>0.85]
        tx=int((xr-8)*s)
        left=max([r for r in rules if r<tx],default=xa); right=min([r for r in rules if r>tx],default=xb)
    c=band[:,left+1:right].copy()
    # blank residual vertical rule pixels and horizontal rules
    c[:, c.mean(axis=0)>0.85]=False
    c[c.mean(axis=1)>0.8,:]=False
    # remove anything touching left/right 3 px (rule remnants)
    c[:,:max(1,int(3*s/2))]=False; c[:,-max(1,int(3*s/2)):]=False
    # drop connected components that touch the cell edge (rule remnants) or are tiny specks
    n,lab,st,_=cv2.connectedComponentsWithStats(c.astype(np.uint8),connectivity=8)
    keep=np.zeros_like(c)
    H,W=c.shape
    for i in range(1,n):
        x,y,w,h,a=st[i]
        if not textline and (x==0 or y==0 or x+w>=W or y+h>=H): continue
        if a<int(6*s*s) or h<int(4*s): continue
        keep|=(lab==i)
    c=keep
    ys,xs=np.nonzero(c)
    if len(xs)<int(20*s): return None,(left,right,y0,y1)
    g=im[y0:y1,left+1:right]
    m=int(4*s)
    bx0=max(0,xs.min()-m); bx1=min(g.shape[1],xs.max()+m); by0=max(0,ys.min()-m); by1=min(g.shape[0],ys.max()+m)
    crop=g[by0:by1,bx0:bx1].copy()
    mask=cv2.dilate(c[by0:by1,bx0:bx1].astype(np.uint8),np.ones((3,3),np.uint8),iterations=max(1,int(s))).astype(bool)
    crop[~mask]=255   # keep only the kept ink components (and a thin edge); rules, specks and cell shading become white
    return crop,(left+1+bx0,left+1+bx1,y0+by0,y0+by1)
def A(crop):
    img=ImageOps.expand(Image.fromarray(crop),border=30,fill=255).convert('RGB')
    res,_=engA(np.array(img),text_score=0.3)
    return [{'text':r[-2],'conf':round(float(r[-1]),3)} for r in sorted(res or [],key=lambda r:(r[0][0][0] if len(r)==3 else 0))]
def B(crop):
    _,bw=cv2.threshold(crop,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
    bw=cv2.resize(bw,(bw.shape[1]*2,bw.shape[0]*2),interpolation=cv2.INTER_NEAREST)
    img=ImageOps.expand(Image.fromarray(bw),border=80,fill=255).convert('RGB')
    res,_=engB(np.array(img),text_score=0.3,box_thresh=0.3)
    if not res:   # detector found no box: recogniser only on the same binarised crop (fixed fallback, recorded)
        res,_=engA(np.array(img),text_score=0.3)
        return [{'text':r[-2],'conf':round(float(r[-1]),3),'fallback':'no detector box; recogniser only'} for r in (res or [])]
    return [{'text':t,'conf':round(float(c),3)} for b,t,c in sorted(res,key=lambda r:r[0][0][0])]
def words(crop,s):
    # split a text-line crop into words at blank column runs of at least 9 px (300-dpi scale)
    ink=(crop<200).any(axis=0); out=[]; start=None; gap=0; G=int(9*s)
    for x,v in enumerate(list(ink)+[False]*(G+1)):
        if v:
            if start is None: start=x
            gap=0; last=x
        elif start is not None:
            gap+=1
            if gap>=G: out.append(crop[:,max(0,start-4):last+5]); start=None
    return out
def readline(crop,s,f):
    return ' '.join(''.join(t['text'] for t in f(w)) for w in words(crop,s))
res=[]
os.makedirs(OUT+'/crops2',exist_ok=True)
for j in jobs:
    half=j.get('half',24)
    ca,ga=cell(render(j['pdf'],j['page'],600),2,j.get('x_right'),j.get('y'),half,j.get('box'),j.get('text_line',False))
    cb,gb=cell(render(j['pdf'],j['page'],400),4/3,j.get('x_right'),j.get('y'),half,j.get('box'),j.get('text_line',False))
    if j.get('text_line'):
        ra=[{'text':readline(ca,2,A)}] if ca is not None else []
        rb=[{'text':readline(cb,4/3,B)}] if cb is not None else []
    else:
        ra=A(ca) if ca is not None else []
        rb=B(cb) if cb is not None else []
    if ca is not None: Image.fromarray(ca).save(f"{OUT}/crops2/{j['id']}_A.png")
    ta=''.join(t['text'] for t in ra); tb=''.join(t['text'] for t in rb)
    r=dict(j,method_a={'how':'RapidOCR recogniser only (no detector, no angle classifier) on 600 dpi greyscale cell crop, table rules removed','text':ta,'tokens':ra,'crop_px_600dpi':[int(v) for v in ga]},
             method_b={'how':'RapidOCR detector and recogniser (no angle classifier) on 400 dpi cell crop, Otsu binarised, 2x upscaled','text':tb,'tokens':rb})
    res.append(r); print(f"{j['id']:55s} first={j.get('first_reading')!s:6s} A={ta!s:8s} B={tb!s:8s}",flush=True)
json.dump(res,open(outp,'w'),indent=1)
