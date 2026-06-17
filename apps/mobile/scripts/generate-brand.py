#!/usr/bin/env python3
"""GOVDAO brand asset generator (Pillow).
Produces the G-coin logo, app icons, splash, and Play/App Store feature graphic
with an elegant serif wordmark. Single source of truth for brand visuals."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.abspath(os.path.join(HERE, "..", "assets"))
os.makedirs(ASSETS, exist_ok=True)

# ── palette ───────────────────────────────────────────────────────────────
TEAL    = (46, 196, 198)
TEAL_DK = (24, 150, 154)
OBSID   = (13, 13, 26)
OBSID2  = (10, 26, 20)
RING_DK = (28, 34, 41)
RING_BV = (46, 54, 64)
GOLD_HI = (238, 184, 86)
GOLD    = (206, 146, 46)
GOLD_DK = (150, 98, 28)
DIMWHITE= (224, 219, 208)

def serif(size, bold=True):
    names = (["LiberationSerif-Bold","DejaVuSerif-Bold","FreeSerifBold"] if bold
             else ["LiberationSerif-Regular","DejaVuSerif","FreeSerif"])
    roots = ["/usr/share/fonts/truetype/liberation/","/usr/share/fonts/truetype/dejavu/",
             "/usr/share/fonts/truetype/freefont/"]
    for n in names:
        for r in roots:
            p = r+n+".ttf"
            if os.path.exists(p):
                try: return ImageFont.truetype(p, size)
                except: pass
    return ImageFont.load_default()

def vgrad(w, h, top, bot, horizontal=False):
    n = w if horizontal else h
    strip = Image.new("RGB",(1,n)) if not horizontal else Image.new("RGB",(n,1))
    for i in range(n):
        t=i/max(1,n-1)
        c=tuple(int(top[k]*(1-t)+bot[k]*t) for k in range(3))
        strip.putpixel((0,i) if not horizontal else (i,0), c)
    return strip.resize((w,h)).convert("RGBA")

def make_coin(D):
    """Master G coin, transparent background, size DxD."""
    SS=2; W=D*SS
    img=Image.new("RGBA",(W,W),(0,0,0,0)); d=ImageDraw.Draw(img)
    cx=cy=W/2
    # drop shadow
    sh=Image.new("RGBA",(W,W),(0,0,0,0)); sd=ImageDraw.Draw(sh)
    r=W*0.40; sd.ellipse([cx-r,cy-r+W*0.028,cx+r,cy+r+W*0.028],fill=(0,0,0,90))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(W*0.025)))
    # dark coin body
    r_out=W*0.40; r_bodin=W*0.305
    d.ellipse([cx-r_out,cy-r_out,cx+r_out,cy+r_out],fill=RING_DK+(255,))
    d.arc([cx-r_out,cy-r_out,cx+r_out,cy+r_out],195,345,fill=RING_BV+(255,),width=int(W*0.005))
    # notch ticks
    rt=(r_out+r_bodin)/2
    for k in range(8):
        a=math.radians(k*45); nx,ny=cx+math.cos(a)*rt,cy+math.sin(a)*rt; nb=W*0.020
        d.rectangle([nx-nb,ny-nb*0.42,nx+nb,ny+nb*0.42],fill=RING_BV+(255,))
    for k in range(60):
        a=math.radians(k*6); nx,ny=cx+math.cos(a)*(r_out-W*0.010),cy+math.sin(a)*(r_out-W*0.010)
        d.ellipse([nx-W*0.0035,ny-W*0.0035,nx+W*0.0035,ny+W*0.0035],fill=(18,22,28,255))
    # gold ring
    r_in=int(W*0.255); r_o=int(r_bodin)
    for i in range(r_o-r_in):
        t=i/max(1,r_o-r_in-1); col=tuple(int(GOLD_DK[k]*(1-t)+GOLD_HI[k]*t) for k in range(3))
        rr=r_in+i; d.ellipse([cx-rr,cy-rr,cx+rr,cy+rr],outline=col+(255,),width=2)
    # teal inner field (brand disc — seamless on teal, pops on dark)
    rin=W*0.250
    d.ellipse([cx-rin,cy-rin,cx+rin,cy+rin],fill=TEAL+(255,))
    # gold serif G
    f=serif(int(W*0.46)); txt="G"
    bb=d.textbbox((0,0),txt,font=f); tw,th=bb[2]-bb[0],bb[3]-bb[1]
    tx,ty=int(cx-tw/2-bb[0]),int(cy-th/2-bb[1])
    d.text((tx+W*0.007,ty+W*0.007),txt,font=f,fill=(110,72,18,200))
    mask=Image.new("L",(W,W),0); md=ImageDraw.Draw(mask); md.text((tx,ty),txt,font=f,fill=255)
    img.paste(vgrad(W,W,GOLD_HI,GOLD_DK),(0,0),mask)
    d.text((tx,ty),txt,font=f,fill=None,stroke_width=max(1,int(W*0.004)),stroke_fill=GOLD_DK+(220,))
    img.paste(vgrad(W,W,GOLD_HI,GOLD_DK),(0,0),mask)
    return img.resize((D,D),Image.LANCZOS)

COIN = make_coin(1024)

def save(img, name): img.save(os.path.join(ASSETS,name)); print("wrote", name, img.size)

# logo master (transparent)
save(COIN, "logo-g.png")

# icon 1024 — teal field, coin fills frame
icon=Image.new("RGBA",(1024,1024),TEAL+(255,)); icon.alpha_composite(COIN); save(icon,"icon.png")

# adaptive icon 1024 — teal field, coin inset to survive Android circular mask
adapt=Image.new("RGBA",(1024,1024),TEAL+(255,))
c2=COIN.resize((760,760),Image.LANCZOS); adapt.alpha_composite(c2,(132,132)); save(adapt,"adaptive-icon.png")

# splash 1080x1920 — teal vertical gradient, coin centered
sp=vgrad(1080,1920,TEAL,TEAL_DK); cs=COIN.resize((620,620),Image.LANCZOS)
sp.alpha_composite(cs,((1080-620)//2,(1920-620)//2-80))
spd=ImageDraw.Draw(sp); wf=serif(120)
bb=spd.textbbox((0,0),"GOVDAO",font=wf); tw=bb[2]-bb[0]
spd.text(((1080-tw)//2,1180),"GOVDAO",font=wf,fill=(255,255,255,235))
save(sp,"splash.png")

# feature graphic 1024x500 — dark gradient, coin left (teal glow), elegant serif wordmark
fg=vgrad(1024,500,OBSID,OBSID2)
glow=Image.new("RGBA",(1024,500),(0,0,0,0)); gd=ImageDraw.Draw(glow)
gd.ellipse([40,90,360,410],fill=TEAL+(70,)); fg.alpha_composite(glow.filter(ImageFilter.GaussianBlur(40)))
cf=COIN.resize((330,330),Image.LANCZOS); fg.alpha_composite(cf,(55,85))
fd=ImageDraw.Draw(fg)
def fit(draw,text,maxw,start,bold=True):
    sz=180
    while sz>20:
        f=serif(sz,bold); bb=draw.textbbox((0,0),text,font=f)
        if bb[2]-bb[0]<=maxw: return f,bb
        sz-=2
    return serif(20,bold),draw.textbbox((0,0),text,font=serif(20,bold))
wf,wbb=fit(fd,"GOVDAO",564,430); wh=wbb[3]-wbb[1]
fd.text((430,250-wh//2-wbb[1]),"GOVDAO",font=wf,fill=GOLD_HI+(255,))
sf=serif(34,bold=False)
fd.text((434,348),"On-chain governance, in your pocket.",font=sf,fill=DIMWHITE+(220,))
save(fg,"feature-graphic.png")

# previews
icon.resize((512,512)).save("/tmp/pv-icon.png")
fg.save("/tmp/pv-feature.png")
sp.resize((360,640)).save("/tmp/pv-splash.png")
print("ALL DONE")
