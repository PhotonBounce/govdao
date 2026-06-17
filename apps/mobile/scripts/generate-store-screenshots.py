#!/usr/bin/env python3
"""GOVDAO store screenshots — elegant serif, brand-consistent, multi-device.
Renders marketing screenshots for Play phone, iPhone, 7" and 10" tablets."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.abspath(os.path.join(HERE, "..", "assets"))
OUTROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "config", "play-store"))

# palette
OBSID=(13,13,26); OBSID2=(18,16,34); TEAL=(46,196,198); TEAL_DK=(24,150,154)
GOLD_HI=(238,184,86); GOLD=(206,146,46); GOLD_DK=(150,98,28)
DIM=(214,209,198); MUTE=(138,134,124); CARD=(24,24,42); CARD_BD=(58,46,34)
MOSS=(105,154,122); ROSE=(192,100,100); AMBER=(201,160,64)

def font(size,bold=True):
    names=(["LiberationSerif-Bold","DejaVuSerif-Bold","FreeSerifBold"] if bold
           else ["LiberationSerif-Regular","DejaVuSerif","FreeSerif"])
    for n in names:
        for r in ["/usr/share/fonts/truetype/liberation/","/usr/share/fonts/truetype/dejavu/","/usr/share/fonts/truetype/freefont/"]:
            p=r+n+".ttf"
            if os.path.exists(p):
                try: return ImageFont.truetype(p,size)
                except: pass
    return ImageFont.load_default()

def sans(size,bold=False):
    names=(["DejaVuSans-Bold","LiberationSans-Bold"] if bold else ["DejaVuSans","LiberationSans-Regular"])
    for n in names:
        for r in ["/usr/share/fonts/truetype/dejavu/","/usr/share/fonts/truetype/liberation/"]:
            p=r+n+".ttf"
            if os.path.exists(p):
                try: return ImageFont.truetype(p,size)
                except: pass
    return ImageFont.load_default()

COIN = Image.open(os.path.join(ASSETS,"logo-g.png")).convert("RGBA")

def vgrad(w,h,top,bot):
    s=Image.new("RGB",(1,h))
    for y in range(h):
        t=y/max(1,h-1); s.putpixel((0,y),tuple(int(top[k]*(1-t)+bot[k]*t) for k in range(3)))
    return s.resize((w,h)).convert("RGBA")

def rrect(d,box,r,fill=None,outline=None,width=1):
    d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=width)

def meter(d,x,y,w,h,frac,col):
    rrect(d,[x,y,x+w,y+h],h//2,fill=(255,255,255,20))
    rrect(d,[x,y,x+int(w*frac),y+h],h//2,fill=col+(255,))

# ── feature definitions: title, subtitle, card widgets ──
FEATURES = [
 ("01-overview","Your DAO,\nat a glance","Live treasury, quorum, and proposals in one view.",
   [("metric","Treasury","$2.4M"),("metric","Active proposals","7"),("metric","Quorum","68%"),("bar","Participation",0.68,MOSS)]),
 ("02-proposals","Vote on-chain,\nin seconds","Binding votes with a verifiable receipt.",
   [("chip","PROPOSAL #128 · ACTIVE",GOLD),("text","Fund Q3 contributor grants"),("bar","For",0.72,MOSS),("bar","Against",0.18,ROSE),("bar","Abstain",0.10,AMBER)]),
 ("04-treasury","Treasury you\ncan audit","Balances, caps, and timelocked spend.",
   [("metric","Balance","$2.41M"),("metric","Monthly cap","$120K"),("metric","Pending spend","$38K"),("bar","Cap used",0.32,TEAL)]),
 ("20-risk-analyzer","Know the risk\nbefore you vote","A 0–100 score across five factors.",
   [("score","RISK","41","MEDIUM",AMBER),("bar","Treasury impact",0.26,AMBER),("bar","Quorum shortfall",0.24,AMBER),("bar","Upgrade risk",0.0,MOSS)]),
 ("19-delegate-map","See where\npower flows","Map the delegation network at a glance.",
   [("bubbles",None)]),
 ("21-sentiment","Read the room","Live community reactions on every proposal.",
   [("react","🔥 Let's go","42",MOSS),("react","👍 Supports","31",MOSS),("react","🤔 Unsure","8",AMBER),("react","⚠️ Concern","4",ROSE),("bar","Sentiment",0.71,MOSS)]),
 ("11-analytics","Governance,\nmeasured","Participation, pass rate, and top delegates.",
   [("metric","Pass rate","81%"),("metric","Avg. turnout","64%"),("metric","Proposals","142"),("bar","This quarter",0.81,TEAL)]),
 ("12-deploy","Launch a DAO\nin minutes","A guided wizard for the full contract set.",
   [("step","1 · MemberRegistry","done"),("step","2 · Timelock","done"),("step","3 · Governor","active"),("step","4 · Treasury","todo"),("step","5 · Guardian","todo")]),
]

def draw_card(img,d,S,cx,cw,top,widgets):
    pad=int(40*S); x=cx-cw//2; y=top
    HMAP={"metric":66,"text":60,"chip":74,"bar":86,"score":150,"react":58,"step":66,"bubbles":560}
    ch=2*pad+sum(int(HMAP.get(w[0],60)*S) for w in widgets)
    rrect(d,[x,y,x+cw,y+ch],int(34*S),fill=CARD+(255,),outline=CARD_BD+(255,),width=max(1,int(2*S)))
    iy=y+pad
    fl=font(int(30*S)); fb=font(int(40*S),True); fs=sans(int(26*S)); fsb=sans(int(30*S),True)
    for w in widgets:
        kind=w[0]
        if kind=="metric":
            d.text((x+pad,iy),w[1],font=fl,fill=MUTE+(255,))
            vb=d.textbbox((0,0),w[2],font=fb); 
            d.text((x+cw-pad-(vb[2]-vb[0]),iy-int(6*S)),w[2],font=fb,fill=GOLD_HI+(255,))
            iy+=int(66*S)
        elif kind=="text":
            d.text((x+pad,iy),w[1],font=font(int(34*S),True),fill=DIM+(255,)); iy+=int(60*S)
        elif kind=="chip":
            tb=d.textbbox((0,0),w[1],font=fsb); tw=tb[2]-tb[0]
            rrect(d,[x+pad,iy,x+pad+tw+int(36*S),iy+int(48*S)],int(24*S),fill=(w[2][0],w[2][1],w[2][2],40),outline=w[2]+(255,),width=max(1,int(S)))
            d.text((x+pad+int(18*S),iy+int(10*S)),w[1],font=fsb,fill=(250,242,224,255)); iy+=int(74*S)
        elif kind=="bar":
            d.text((x+pad,iy),w[1],font=fs,fill=DIM+(255,))
            d.text((x+cw-pad-int(80*S),iy),f"{int(w[2]*100)}%",font=fs,fill=MUTE+(255,))
            meter(d,x+pad,iy+int(40*S),cw-2*pad,int(18*S),w[2],w[3]); iy+=int(86*S)
        elif kind=="score":
            d.text((x+pad,iy),w[1],font=fs,fill=MUTE+(255,))
            d.text((x+pad,iy+int(28*S)),w[2],font=font(int(96*S),True),fill=w[4]+(255,))
            rrect(d,[x+cw-pad-int(220*S),iy+int(40*S),x+cw-pad,iy+int(96*S)],int(28*S),fill=(w[4][0],w[4][1],w[4][2],40),outline=w[4]+(255,),width=max(1,int(S)))
            d.text((x+cw-pad-int(200*S),iy+int(52*S)),w[3],font=fsb,fill=(250,242,224,255)); iy+=int(150*S)
        elif kind=="react":
            d.text((x+pad,iy),w[1],font=fsb,fill=DIM+(255,))
            d.text((x+cw-pad-int(70*S),iy),w[2],font=fsb,fill=w[3]+(255,)); iy+=int(58*S)
        elif kind=="step":
            col={"done":MOSS,"active":GOLD_HI,"todo":MUTE}[w[2]]
            d.ellipse([x+pad,iy+int(6*S),x+pad+int(26*S),iy+int(32*S)],fill=col+(255,))
            d.text((x+pad+int(44*S),iy),w[1],font=fsb,fill=(DIM if w[2]!="todo" else MUTE)+(255,)); iy+=int(66*S)
        elif kind=="bubbles":
            import math
            nodes=[(0.5,0.30,0.16,GOLD_HI),(0.26,0.55,0.11,TEAL),(0.74,0.56,0.12,MOSS),(0.40,0.78,0.08,AMBER),(0.66,0.80,0.07,TEAL_DK),(0.18,0.30,0.06,MUTE)]
            ccx=x+cw//2; ccy=iy+int(250*S); rad=int(230*S)
            for nx,ny,nr,ncol in nodes:
                px=int(x+pad+(cw-2*pad)*nx); py=int(iy+int(60*S)+int(440*S)*ny)
                d.line([ccx,ccy,px,py],fill=(255,255,255,40),width=max(1,int(2*S)))
            for nx,ny,nr,ncol in nodes:
                px=int(x+pad+(cw-2*pad)*nx); py=int(iy+int(60*S)+int(440*S)*ny); rr=int(nr*cw)
                d.ellipse([px-rr,py-rr,px+rr,py+rr],fill=(ncol[0],ncol[1],ncol[2],210),outline=ncol+(255,),width=max(1,int(2*S)))
            iy+=int(560*S)

def render(feat, W, H, outdir):
    name,title,sub,widgets=feat
    S=W/1080.0
    img=vgrad(W,H,OBSID,OBSID2)
    glow=Image.new("RGBA",(W,H),(0,0,0,0)); gd=ImageDraw.Draw(glow)
    gd.ellipse([int(W*0.2),-int(H*0.12),int(W*0.95),int(H*0.20)],fill=TEAL+(46,))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(int(70*S))))
    d=ImageDraw.Draw(img)
    # brand bar
    cm=COIN.resize((int(96*S),int(96*S)),Image.LANCZOS); img.alpha_composite(cm,(int(70*S),int(80*S)))
    d.text((int(185*S),int(104*S)),"GOVDAO",font=font(int(54*S),True),fill=GOLD_HI+(255,))
    # headline
    hy=int(250*S)
    for line in title.split("\n"):
        d.text((int(72*S),hy),line,font=font(int(96*S),True),fill=DIM+(255,)); hy+=int(108*S)
    d.text((int(74*S),hy+int(6*S)),sub,font=sans(int(34*S)),fill=MUTE+(255,))
    # card
    draw_card(img,d,S,W//2,int(W-144*S),int(hy+int(110*S)),widgets)
    # footer
    d.line([(int(72*S),H-int(150*S)),(int(72*S+90*S),H-int(150*S))],fill=GOLD+(255,),width=max(1,int(4*S)))
    d.text((int(72*S),H-int(130*S)),"On-chain governance, in your pocket.",font=font(int(34*S),False),fill=DIM+(255,))
    os.makedirs(outdir,exist_ok=True)
    img.convert("RGB").save(os.path.join(outdir,name+".png"))
    return img

DEVICES={
 "screenshots":(1080,1920),
 "screenshots-iphone":(1290,2796),
 "screenshots-tablet7":(1206,2144),
 "screenshots-tablet10":(1600,2560),
}
if __name__=="__main__":
    import sys
    if "--preview" in sys.argv:
        render(FEATURES[1],1080,1920,"/tmp/ss").convert("RGB").resize((405,720)).save("/tmp/pv-ss.png")
        print("preview done"); sys.exit(0)
    total=0
    for sub,(W,H) in DEVICES.items():
        outdir=os.path.join(OUTROOT,sub)
        for feat in FEATURES:
            render(feat,W,H,outdir); total+=1
    print(f"generated {total} screenshots across {len(DEVICES)} device sizes")
