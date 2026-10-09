"""Technical frame/layer contract checks; no automatic art approval."""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image
BASE=Path(__file__).resolve().parent
male=BASE.parent/'character-layer-first-v3-male-r2'
manifest=json.loads((BASE/'manifest.json').read_text())
assert manifest['canvas']==[128,128] and manifest['origin']==[64,113]
assert (manifest['direction'],manifest['animation'],manifest['frame'])==('DOWN','IDLE',0)
assert manifest['productionReady'] is False
layers={}; checks=[]
for name,path in manifest['layers'].items():
    with Image.open(BASE/path) as im:
        im.load(); assert im.size==(128,128) and im.mode=='RGBA',name
        layers[name]=im.copy(); pixels=np.asarray(im).copy()
    a=pixels[:,:,3]
    assert a.min()==0 and a.max()==(0 if name=='Weapon' else 255),name
    assert not pixels[a==0,:3].any(),name
    checks.append({'layer':name,'fileSizeAlphaContract':'PASS','alphaRange':[int(a.min()),int(a.max())],
        'origin':[64,113],'partialAlphaPixels':int(((a>0)&(a<255)).sum()),
        'sha256':hashlib.sha256((BASE/path).read_bytes()).hexdigest()})
nonempty=[c['sha256'] for c in checks if c['layer']!='Weapon']
assert len(nonempty)==len(set(nonempty)),'duplicate nonempty layers'
assert layers['Body'].getbbox()[3]==113 and layers['Shoes'].getbbox()[3]==113
def render(hidden=()):
    im=Image.new('RGBA',(128,128))
    for name in manifest['renderOrder']:
        if name not in hidden: im.alpha_composite(layers[name])
    return np.asarray(im)
full=render(); assert np.array_equal(full,np.asarray(Image.open(BASE/'composite.png')))
body=np.asarray(layers['Body']); changes={}; coverage={}
for name in ['HairBack','HairFront','Top','Bottom','Shoes']:
    im=render([name]); count=int(np.any(im!=full,axis=2).sum()); assert count>0,name
    assert np.array_equal(im,np.asarray(Image.open(BASE/('no-'+name.lower()+'.png')))),name
    assert np.array_equal(render(),full),'restore'
    assert np.all(im[:,:,3]>=body[:,:,3]),'missing body after toggle '+name
    changes[name]=count; coverage[name]='PASS: Body alpha retained'
assert np.array_equal(render(['HairBack','HairFront','Top','Bottom','Shoes']),body),'Body-only mismatch'
assert np.array_equal(body,np.asarray(Image.open(BASE/'body-only.png')))
saved=json.loads((BASE/'male-source-sha.json').read_text())
actual={str(p.relative_to(male)):hashlib.sha256(p.read_bytes()).hexdigest() for p in male.rglob('*') if p.is_file()}
assert saved==actual,'Male was modified'
def geometry(im):
    a=np.asarray(im)[:,:,3]>16; yy,xx=np.where(a)
    return {'bounds':[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)],
        'height':int(yy.max()-yy.min()+1),'width':int(xx.max()-xx.min()+1),'baseline':int(yy.max()+1)}
comparison={'MaleBody':geometry(Image.open(male/'layers/Body.png')),'FemaleBody':geometry(layers['Body']),
    'MaleFull':geometry(Image.open(male/'composite.png')),'FemaleFull':geometry(Image.fromarray(full))}
assert comparison['MaleBody']['baseline']==comparison['FemaleBody']['baseline']==113
assert comparison['MaleBody']['height']==comparison['FemaleBody']['height']==99
report={'technicalStatus':'PASS','artStatus':'PENDING_USER_APPROVAL','productionReady':False,
    'files':checks,'toggleChangedPixels':changes,'bodyCoverageAfterToggle':coverage,'bodyOnlyEqualsBody':'PASS',
    'maleUnchanged':True,'scaleComparison':comparison,
    'registration':'recorded manual transforms; common canvas/origin and soles checked; visual fit awaiting user',
    'manualReview':['Body fully clothed, no mannequin','HairFront/Back source art contains hair only',
        'front bangs cover part of left eye','base gray high collar remains visible beneath outer top'],
    'scope':'Female DOWN IDLE frame0 only; no animation validation'}
(BASE/'validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
