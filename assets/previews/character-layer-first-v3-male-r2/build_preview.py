"""V3 refinement: real image edit + registered layer composition. Preview only."""
import hashlib, json, shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[2]
OLD=BASE.parent/'character-layer-first-v3-male'
sys.path.insert(0,str(ROOT/'.agents/skills/generate2dsprite/scripts'))
import forge_core, forge_matte

def clean(im,radius):
    im,_=forge_core.alpha_hygiene(im.convert('RGBA'),mode='both',floor=4)
    a=np.asarray(im).copy()
    for key in ['#FF0000','#FFFF00','#FF00FF']:
        a,_=forge_matte.despill(a,mode='edge',radius=radius,margin=8,key=key)
    a[a[:,:,3]==0]=0
    return Image.fromarray(a)

def resize(im,size):
    return im.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')

layers_dir=BASE/'layers'; layers_dir.mkdir(exist_ok=True)
old_body=Image.open(OLD/'layers/Body.png').convert('RGBA')
old_report=json.loads((OLD/'report.json').read_text())
transform=old_report['bodyTransform']
raw=clean(Image.open(BASE/'body-edit-raw.png'),3)
registered=Image.new('RGBA',(128,128))
size=tuple(transform['targetSize'])
registered.alpha_composite(resize(raw.crop(tuple(transform['rawBounds'])),size),(64-size[0]//2,14))
registered=clean(registered,1)
# Reuse original generated head/face pixels verbatim; this is composing edited Body,
# not cropping reference/composite into a supposed independent clothing/body asset.
registered.paste(old_body.crop((0,0,128,49)),(0,0))
registered.paste(old_body.crop((0,88,128,128)),(0,88))
registered.save(layers_dir/'Body.png')
shutil.copyfile(OLD/'layers/Hair.png',layers_dir/'Hair.png')
shutil.copyfile(OLD/'layers/Weapon.png',layers_dir/'Weapon.png')
plate=Image.open(OLD/'parts-raw.png').convert('RGBA')
targets={'Top':(40,48,48,42),'Bottom':(47,71,34,32),'Shoes':(45,95,39,18)}
registration={}
for name,target in targets.items():
    source=old_report['registration'][name]['sourceRect']
    part=clean(plate.crop(tuple(source)),3); bounds=part.getbbox()
    x,y,w,h=target
    im=Image.new('RGBA',(128,128)); im.alpha_composite(resize(part.crop(bounds),(w,h)),(x,y))
    clean(im,1).save(layers_dir/(name+'.png'))
    registration[name]={'sourceRect':source,'targetRect':target,
        'landmarks':'neck/shoulders y48, waist y71, ankle y95, soles y113',
        'method':'recorded manual registration; visual approval pending'}
order=['Body','Bottom','Shoes','Top','Hair','Weapon']
layers={n:Image.open(layers_dir/(n+'.png')).convert('RGBA') for n in order}
def composite(hidden=()):
    im=Image.new('RGBA',(128,128))
    for n in order:
        if n not in hidden: im.alpha_composite(layers[n])
    return im
full=composite(); full.save(BASE/'composite.png')
body_only=composite(['Hair','Top','Bottom','Shoes']); body_only.save(BASE/'body-only.png')
views=[('Full',full),('Body Only',body_only)]
for n in ['Hair','Top','Bottom','Shoes']:
    im=composite([n]); im.save(BASE/('no-'+n.lower()+'.png')); views.append(('No '+n,im))
def board(entries,path):
    im=Image.new('RGB',(256*len(entries),284),'#27313d'); draw=ImageDraw.Draw(im)
    for i,(label,entry) in enumerate(entries):
        draw.text((256*i+8,6),label,fill='white')
        zoom=entry.resize((256,256),Image.Resampling.NEAREST); im.paste(zoom,(256*i,28),zoom)
    im.save(path)
board(views,BASE/'toggle-preview.png')
board([(n,layers[n]) for n in ['Body','Hair','Top','Bottom','Shoes','Weapon']],BASE/'layer-preview.png')
metrics={}
for kind,before,after in [('full',Image.open(OLD/'composite.png').convert('RGBA'),full),('body',old_body,layers['Body'])]:
    delta=np.abs(np.asarray(before).astype(int)-np.asarray(after).astype(int)).astype(np.uint8)
    diff=Image.fromarray(np.maximum(delta[:,:,:3],delta[:,:,3,None])).convert('RGBA'); diff.putalpha(255)
    board([('V3 previous '+kind,before),('V3 revised '+kind,after),('Absolute RGBA difference',diff)],BASE/('visual-diff-'+kind+'.png'))
    metrics[kind]={'changedPixels':int(np.any(delta>0,axis=2).sum()),'noArtThreshold':True}
hair_identical=(OLD/'layers/Hair.png').read_bytes()==(layers_dir/'Hair.png').read_bytes()
face_identical=np.array_equal(np.asarray(old_body)[:49],np.asarray(layers['Body'])[:49])
assert hair_identical and face_identical
manifest={'canvas':[128,128],'origin':[64,113],'direction':'DOWN','animation':'IDLE','frame':0,
    'renderOrder':order,'productionReady':False,'status':'PENDING_USER_APPROVAL',
    'layers':{n:'layers/'+n+'.png' for n in order}}
(BASE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
report={'status':'PENDING_USER_APPROVAL','productionReady':False,'userProductionApproval':False,
    'v3DesignDirectionApproved':True,'facePixelsPreserved':face_identical,'hairFilePreserved':hair_identical,
    'bodyEditRegionRows':[49,88],'bodyRegistration':transform,'garmentRegistration':registration,
    'diffVsV3':metrics,'masterV2PixelMatchingRequired':False,
    'limitations':['single static frame only; animation fit not tested','body keeps original neutral under-shorts',
        'manual garment registration still requires final visual approval']}
(BASE/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
def artifact(path):
    return {'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
provenance={'artSource':'host_image','backend':'Codex Client native image_gen','modelId':None,
    'rawEdit':artifact(BASE/'body-edit-raw.png'),'prompt':'body-edit-prompt.txt',
    'originalGeneratedFilename':'exec-c7aabd6b-f6cc-4ff6-a4c0-62dd513cbd71.png',
    'retainedBodyFaceSource':artifact(OLD/'layers/Body.png'),'retainedHair':artifact(OLD/'layers/Hair.png'),
    'garmentSource':artifact(OLD/'parts-raw.png'),'sourceProvenance':str((OLD/'provenance.json').relative_to(ROOT)),
    'processing':'Forge edge hygiene/despill; premultiplied registration; preserve original face/lower body; composite only',
    'outputs':{n:artifact(layers_dir/(n+'.png')) for n in order},'productionReady':False}
(BASE/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
