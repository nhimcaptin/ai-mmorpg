"""Register independently generated clothed body/hair and reused outer equipment."""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

BASE=Path(__file__).resolve().parent; ROOT=BASE.parents[2]
MALE=BASE.parent/'character-layer-first-v3-male-r2'
SOURCE=BASE.parent/'character-layer-first-v3-male'
sys.path.insert(0,str(ROOT/'.agents/skills/generate2dsprite/scripts'))
import forge_core, forge_matte
def hashes():
    return {str(p.relative_to(MALE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in MALE.rglob('*') if p.is_file()}
before=hashes()
def clean(im,radius=3):
    im,_=forge_core.alpha_hygiene(im.convert('RGBA'),mode='both',floor=4); a=np.asarray(im).copy()
    for key in ['#FF0000','#FFFF00','#FF00FF']:
        a,_=forge_matte.despill(a,mode='edge',radius=radius,margin=8,key=key)
    a[a[:,:,3]==0]=0
    return Image.fromarray(a)
def resize(im,size):
    return im.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')
out=BASE/'layers'; out.mkdir(exist_ok=True)
raw=clean(Image.open(BASE/'body-revised-raw.png')); bbox=raw.getbbox(); scale=99/(bbox[3]-bbox[1])
size=(round((bbox[2]-bbox[0])*scale),99); im=Image.new('RGBA',(128,128))
im.alpha_composite(resize(raw.crop(bbox),size),(64-size[0]//2,14)); clean(im,1).save(out/'Body.png')
hair=Image.open(BASE/'hair-parts-raw.png').convert('RGBA')
registration={}
for n,rect,target in [('HairBack',(0,0,637,1254),(39,10,50,74)),('HairFront',(637,0,1254,1254),(40,10,48,68))]:
    part=clean(hair.crop(rect)); bounds=part.getbbox(); x,y,w,h=target
    im=Image.new('RGBA',(128,128)); im.alpha_composite(resize(part.crop(bounds),(w,h)),(x,y))
    clean(im,1).save(out/(n+'.png')); registration[n]={'rawRect':rect,'alphaBounds':bounds,'targetRect':target}
plate=Image.open(SOURCE/'parts-raw.png').convert('RGBA')
old=json.loads((SOURCE/'report.json').read_text())
for n,target in [('Top',(43,53,43,40)),('Bottom',(47,77,34,30)),('Shoes',(45,101,39,12))]:
    rect=old['registration'][n]['sourceRect']; part=clean(plate.crop(tuple(rect))); bounds=part.getbbox()
    x,y,w,h=target; im=Image.new('RGBA',(128,128)); im.alpha_composite(resize(part.crop(bounds),(w,h)),(x,y))
    clean(im,1).save(out/(n+'.png')); registration[n]={'rawRect':rect,'alphaBounds':bounds,'targetRect':target,'source':'existing generated male outer-equipment art; re-registered only'}
Image.new('RGBA',(128,128)).save(out/'Weapon.png')
order=['HairBack','Body','Bottom','Shoes','Top','HairFront','Weapon']
layers={n:Image.open(out/(n+'.png')).convert('RGBA') for n in order}
def render(hidden=()):
    im=Image.new('RGBA',(128,128))
    for n in order:
        if n not in hidden: im.alpha_composite(layers[n])
    return im
full=render(); full.save(BASE/'composite.png'); layers['Body'].save(BASE/'body-only.png')
views=[('Full',full),('Body Only',layers['Body']),('No Hair',render(['HairBack','HairFront']))]
render(['HairBack','HairFront']).save(BASE/'no-hair.png')
for n in ['HairBack','HairFront','Top','Bottom','Shoes']:
    im=render([n]); im.save(BASE/('no-'+n.lower()+'.png')); views.append(('No '+n,im))
def board(entries,path,cols=4):
    rows=(len(entries)+cols-1)//cols; im=Image.new('RGB',(min(cols,len(entries))*256,rows*284),'#27313d'); draw=ImageDraw.Draw(im)
    for i,(label,entry) in enumerate(entries):
        x=(i%cols)*256; y=(i//cols)*284; draw.text((x+8,y+6),label,fill='white')
        zoom=entry.resize((256,256),Image.Resampling.NEAREST); im.paste(zoom,(x,y+28),zoom)
    im.save(path)
board(views,BASE/'toggle-preview.png')
board([(n,layers[n]) for n in ['Body','HairBack','HairFront','Top','Bottom','Shoes','Weapon']],BASE/'layer-preview.png')
male=Image.open(MALE/'composite.png').convert('RGBA'); male_body=Image.open(MALE/'layers/Body.png').convert('RGBA')
male.save(BASE/'male-comparison-only.png')
board([('Male approved art',male),('Female candidate',full)],BASE/'male-female-pair.png',2)
board([('Male Body',male_body),('Female clothed Body',layers['Body'])],BASE/'body-pair.png',2)
manifest={'status':'PENDING_USER_APPROVAL','productionReady':False,'canvas':[128,128],'origin':[64,113],
    'direction':'DOWN','animation':'IDLE','frame':0,'renderOrder':order,'layers':{n:'layers/'+n+'.png' for n in order}}
(BASE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
assert before==hashes(),'Male changed'
(BASE/'male-source-sha.json').write_text(json.dumps(before,indent=2)+'\n',encoding='utf-8')
def artifact(path):
    return {'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
provenance={'artSource':'host_image+existing_generated_art','backend':'Codex Client native image_gen','modelId':None,
    'calls':[{'raw':artifact(BASE/f),'prompt':p,'generatedFilename':g} for f,p,g in [
        ('body-raw.png','body-prompt.txt','exec-6c1be7f4-0e30-4e13-af9e-e0f34026d1c3.png'),
        ('body-revised-raw.png','body-edit-prompt.txt','exec-a5b61124-279f-4fbb-aa60-08ca75730338.png'),
        ('hair-parts-raw.png','hair-prompt.txt','exec-33d93882-c360-4b78-bf32-53d0d278f9f2.png')]],
    'equipmentSource':artifact(SOURCE/'parts-raw.png'),'maleComparisonSource':artifact(MALE/'composite.png'),
    'maleUnchanged':True,'registration':registration,'bodyTransform':{'rawBounds':bbox,'scale':scale,'targetSize':size,'top':14},
    'productionReady':False,'femaleArtApproved':False}
(BASE/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PENDING_USER_APPROVAL','bodySize':size,'maleUnchanged':True,'registration':registration}))
