"""Process newly generated independent parts; never extract art from reference/master."""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
sys.path.insert(0, str(ROOT / '.agents/skills/generate2dsprite/scripts'))
import forge_core, forge_matte

def clean(im, radius):
    im, hygiene = forge_core.alpha_hygiene(im.convert('RGBA'), mode='both', floor=4)
    a = np.asarray(im).copy()
    for key in ['#FF0000', '#FFFF00', '#FF00FF']:
        a, _ = forge_matte.despill(a, mode='edge', radius=radius, margin=8, key=key)
    a[a[:,:,3] == 0] = 0
    return Image.fromarray(a)

def resize(im, size):
    # Pillow RGBa premultiplication prevents transparent RGB bleeding into edges.
    return im.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')

out = BASE / 'layers'
out.mkdir(exist_ok=True)
body = clean(Image.open(BASE / 'body-revised-raw.png'), 3)
bbox = body.getbbox()
scale = 99 / (bbox[3]-bbox[1])
size = (round((bbox[2]-bbox[0])*scale),99)
canvas = Image.new('RGBA',(128,128))
canvas.alpha_composite(resize(body.crop(bbox),size), (64-size[0]//2,14))
clean(canvas,1).save(out/'Body.png')
# Rectangles isolate independent objects in generated parts plate, NOT reference art.
# Registration is explicit manual approximation and requires visual acceptance.
plate = Image.open(BASE/'parts-raw.png').convert('RGBA')
rects = {
    'Hair': ((60,70,600,530),(41,10,46,39)),
    'Top': ((610,140,1254,725),(39,47,50,43)),
    'Bottom': ((75,720,600,1145),(47,71,34,32)),
    'Shoes': ((650,880,1230,1220),(44,94,41,19)),
}
registration = {}
for name,(rect,target) in rects.items():
    piece = clean(plate.crop(rect),3)
    local = piece.getbbox()
    x,y,w,h = target
    layer = Image.new('RGBA',(128,128))
    layer.alpha_composite(resize(piece.crop(local),(w,h)),(x,y))
    clean(layer,1).save(out/(name+'.png'))
    registration[name] = {'sourceRect':rect,'localAlphaBounds':local,'targetRect':target,
        'method':'explicit manual affine approximation; not approved'}
Image.new('RGBA',(128,128)).save(out/'Weapon.png')
order = ['Body','Bottom','Shoes','Top','Hair','Weapon']
images = {n: Image.open(out/(n+'.png')).convert('RGBA') for n in order}
def composite(hidden=()):
    im=Image.new('RGBA',(128,128))
    for n in order:
        if n not in hidden: im.alpha_composite(images[n])
    return im
full=composite()
full.save(BASE/'composite.png')
views=[('Full',full),('Body only',composite(['Hair','Top','Bottom','Shoes']))]
for n in ['Hair','Top','Bottom','Shoes']:
    im=composite([n]); im.save(BASE/('no-'+n.lower()+'.png')); views.append(('No '+n,im))
def board(entries,path):
    result=Image.new('RGB',(len(entries)*256,284),'#27313d')
    draw=ImageDraw.Draw(result)
    for i,(label,im) in enumerate(entries):
        draw.text((i*256+8,6),label,fill='white')
        result.paste(im.resize((256,256),Image.Resampling.NEAREST),(i*256,28),im.resize((256,256),Image.Resampling.NEAREST))
    result.save(path)
board(views,BASE/'toggle-preview.png')
board([(n,images[n]) for n in ['Body','Hair','Top','Bottom','Shoes','Weapon']],BASE/'layer-preview.png')
master=Image.open(ROOT/'assets/previews/character-bases-2026-10-09-v2/frames/male.png').convert('RGBA')
a=np.asarray(master).astype(int); b=np.asarray(full).astype(int)
delta=np.abs(a-b).astype(np.uint8)
diff=Image.fromarray(np.maximum(delta[:,:,:3],delta[:,:,3,None])).convert('RGBA'); diff.putalpha(255)
board([('Approved v2 (comparison only)',master),('V3 composite candidate',full),('Absolute RGBA diff',diff)],BASE/'visual-diff.png')
checks=[]
for n,im in images.items():
    p=np.asarray(im); alpha=p[:,:,3]
    checks.append({'layer':n,'size':list(im.size),'mode':im.mode,'alphaMin':int(alpha.min()),
        'alphaMax':int(alpha.max()),'visiblePixels':int((alpha>16).sum()),
        'hiddenRGBZero':bool((p[alpha==0,:3]==0).all()),'origin':[64,113],
        'originSource':'common metadata contract; not an embedded PNG property',
        'sha256':hashlib.sha256((out/(n+'.png')).read_bytes()).hexdigest(),
        'technicalPass':bool(im.size==(128,128) and im.mode=='RGBA' and alpha.min()==0 and
            (alpha.max()==255 if n!='Weapon' else alpha.max()==0))})
toggle_checks={n: bool(np.any(np.asarray(composite([n]))!=np.asarray(full))) for n in ['Hair','Top','Bottom','Shoes']}
report={'status':'BLOCKED','productionReady':False,'userApproval':False,
    'technicalChecks':checks,'toggleChangesComposite':toggle_checks,
    'direction':'DOWN','animation':'IDLE','frame':0,'origin':[64,113],
    'bodyBaseline':113,'bodyVisibleHeight':99,'registration':registration,
    'bodyTransform':{'rawBounds':bbox,'scale':scale,'targetSize':size,'top':14},
    'diffVsApprovedV2':{'changedPixels':int(np.any(delta>0,axis=2).sum()),
        'acceptanceThreshold':None,'note':'different original candidate; no numerical art approval'},
    'limitations':['manual garment registration not approved','body proportions and identity differ from approved v2',
        'body pelvis remains covered by neutral under-shorts; complete unclothed pelvis not proven'],
    'artSource':'host_image','backend':'Codex Client native image_gen',
    'weapon':'intentionally empty transparent layer, no weapon artwork generated'}
(BASE/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(BASE/'manifest.json').write_text(json.dumps({'direction':'DOWN','animation':'IDLE','frame':0,
    'canvas':[128,128],'origin':[64,113],'renderOrder':order,'productionReady':False,
    'layers':{n:'layers/'+n+'.png' for n in order}},indent=2)+'\n',encoding='utf-8')
sources=[]
for filename,prompt,original in [
    ('body-raw.png','body-prompt.txt','exec-252b8088-220e-42c1-8616-0d729534c160.png'),
    ('body-revised-raw.png','body-edit-prompt.txt','exec-3c657011-de34-47a6-a650-f271e79b6ade.png'),
    ('parts-raw.png','parts-prompt.txt','exec-5ca5c409-247d-454d-ad00-bf85e0471239.png')]:
    with Image.open(BASE/filename) as im:
        sources.append({'file':filename,'sha256':hashlib.sha256((BASE/filename).read_bytes()).hexdigest(),
            'size':list(im.size),'mode':im.mode,'prompt':prompt,'originalGeneratedFilename':original,
            'realGeneration':True,'route':'host_image','backend':'Codex Client native image_gen',
            'modelId':None,'estimatedUsd':None})
reference=Path('C:/Users/doanh.tran/Downloads/Chibi RPG Character Layer Reference Sheet.png')
(BASE/'provenance.json').write_text(json.dumps({'sources':sources,
    'reference':{'path':str(reference),'sha256':hashlib.sha256(reference.read_bytes()).hexdigest(),
        'usage':'style/structure reference only; no pixels extracted into layers'},
    'processing':'Forge alpha hygiene/despill, premultiplied resize, recorded affine registration',
    'productionReady':False,'priorAssetsPreserved':True},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'BLOCKED','technicalPass':all(c['technicalPass'] for c in checks),
    'toggles':toggle_checks,'changedPixels':report['diffVsApprovedV2']['changedPixels']}))
