import json,sys,os
from PIL import Image, ImageDraw, ImageFont
F={k:f'/home/claude/ttf/{k}.ttf' for k in ['Anton','Bebas','Marker','Oswald']}
def fit(g,text,font,frac,W,cap):
    f=ImageFont.truetype(F[font],100); w=g.textlength(text,font=f)
    return min(int(100*W*frac/w),cap)
def render(d,W=4500,H=5400):
    im=Image.new('RGBA',(W,H),(0,0,0,0)); g=ImageDraw.Draw(im)
    mains=[l for l in d['lines'] if l[1]!='Marker']
    msz=[fit(g,t,fo,0.88,W,1500) for t,fo,_,_ in mains]
    ref=min(msz) if msz else 900
    L=[]
    for t,fo,_,col in d['lines']:
        s=fit(g,t,fo,0.88,W,1500) if fo!='Marker' else fit(g,t,fo,0.75,W,int(ref*0.6))
        f=ImageFont.truetype(F[fo],s); L.append((t,f,col,g.textbbox((0,0),t,font=f)))
    gap=120; total=sum(b[3]-b[1] for *_,b in L)+gap*(len(L)-1)
    if total>H*0.62:
        k=H*0.62/total; L=[(t,ImageFont.truetype(f.path,int(f.size*k)),c,None) for t,f,c,_ in L]; L=[(t,f,c,g.textbbox((0,0),t,font=f)) for t,f,c,_ in L]
    y=150
    for t,f,col,bb in L:
        g.text(((W-(bb[2]-bb[0]))/2-bb[0],y-bb[1]),t,font=f,fill=col); y+=bb[3]-bb[1]+gap
    return im
if __name__=='__main__':
    D=json.load(open(sys.argv[1])); out=sys.argv[2]; os.makedirs(out,exist_ok=True)
    TW,TH,cols,pad,lab=300,360,5,16,34; rows=(len(D)+cols-1)//cols
    sheet=Image.new('RGB',(cols*(TW+pad)+pad, rows*(TH+lab+pad)+pad),(246,247,249)); sg=ImageDraw.Draw(sheet); lf=ImageFont.truetype(F['Oswald'],18)
    for i,d in enumerate(D):
        im=render(d); im.save(f'{out}/design_{d["n"]:02d}.png')
        tile=Image.new('RGB',(TW,TH),(28,30,34)); pw=int(TW*0.74); ph=int(pw*1.2)
        sm=im.resize((pw,ph),Image.LANCZOS); tile.paste(sm,((TW-pw)//2,26),sm)
        x=pad+(i%cols)*(TW+pad); y=pad+(i//cols)*(TH+lab+pad); sheet.paste(tile,(x,y)); sg.text((x+4,y+TH+6),f'#{d["n"]}  {d["niche"]} · {d["mkt"]}',font=lf,fill=(40,44,52))
    sheet.save(f'{out}/preview.png')
