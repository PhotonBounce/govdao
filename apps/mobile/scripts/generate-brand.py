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
    """Load the user's logo-source.png, crop circular coin, transparent background, size DxD."""
    src_path = os.path.join(ASSETS, "logo-source.png")
    if not os.path.exists(src_path):
        return Image.new("RGBA", (D, D), (0,0,0,0))
    
    src = Image.open(src_path).convert("RGBA")
    
    # Create circular mask
    mask = Image.new("L", src.size, 0)
    draw = ImageDraw.Draw(mask)
    cx, cy = src.width / 2, src.height / 2
    r = src.width * 0.415
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    
    coin = Image.new("RGBA", src.size, (0, 0, 0, 0))
    coin.paste(src, (0, 0), mask)
    
    return coin.resize((D, D), Image.LANCZOS)

COIN = make_coin(1024)

def save(img, name): img.save(os.path.join(ASSETS,name)); print("wrote", name, img.size)

# logo master (transparent)
save(COIN, "logo-g.png")

# icon 1024 — use the user's original image directly for perfect lighting
src_path = os.path.join(ASSETS, "logo-source.png")
if os.path.exists(src_path):
    icon = Image.open(src_path).convert("RGBA").resize((1024, 1024), Image.LANCZOS)
else:
    icon = Image.new("RGBA",(1024,1024),TEAL+(255,)); icon.alpha_composite(COIN)
save(icon, "icon.png")

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
import tempfile
tmp = tempfile.gettempdir()
try:
    icon.resize((512,512)).save(os.path.join(tmp, "pv-icon.png"))
    fg.save(os.path.join(tmp, "pv-feature.png"))
    sp.resize((360,640)).save(os.path.join(tmp, "pv-splash.png"))
except Exception as e:
    print("Preview save skipped:", e)
print("ALL DONE")
