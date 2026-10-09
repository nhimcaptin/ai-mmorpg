"""File/contract validation only. Does not approve artwork or anatomy."""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
manifest = json.loads((BASE/'manifest.json').read_text())
checks = []
assert manifest['canvas']==[128,128] and manifest['origin']==[64,113]
assert (manifest['direction'],manifest['animation'],manifest['frame'])==('DOWN','IDLE',0)
assert manifest['productionReady'] is False
layers={}
for name,path in manifest['layers'].items():
    with Image.open(BASE/path) as im:
        im.load()
        assert im.mode=='RGBA' and im.size==(128,128),name
        pixels=np.asarray(im).copy(); layers[name]=im.copy()
    a=pixels[:,:,3]
    assert a.min()==0,name
    assert a.max()==(0 if name=='Weapon' else 255),name
    assert not pixels[a==0,:3].any(),name
    assert manifest['origin']==[64,113],name
    checks.append({'name':name,'sizeAlphaOrigin':'PASS','partialAlphaPixels':int(((a>0)&(a<255)).sum()),
        'opaquePixels':int((a==255).sum())})
hashes=[hashlib.sha256((BASE/path).read_bytes()).hexdigest() for n,path in manifest['layers'].items() if n!='Weapon']
assert len(hashes)==len(set(hashes)),'duplicate layers'
assert layers['Body'].getbbox()[3]==113,'body foot baseline'
assert layers['Shoes'].getbbox()[3]==113,'shoe sole baseline'
old=BASE.parent/'character-layer-first-v3-male'
assert (old/'layers/Hair.png').read_bytes()==(BASE/'layers/Hair.png').read_bytes(),'hair changed'
assert np.array_equal(np.asarray(layers['Body'])[:49],np.asarray(Image.open(old/'layers/Body.png'))[:49]),'face changed'
def render(hidden=None):
    out=Image.new('RGBA',(128,128))
    for n in manifest['renderOrder']:
        if n!=hidden: out.alpha_composite(layers[n])
    return out
full=np.asarray(render())
assert np.array_equal(full,np.asarray(Image.open(BASE/'composite.png')))
toggle={}
body_alpha=np.asarray(layers['Body'])[:,:,3]>16
overlap={}
for n in ['Hair','Top','Bottom','Shoes']:
    pixels=np.asarray(render(n))
    assert not np.array_equal(pixels,full),n
    assert np.array_equal(pixels,np.asarray(Image.open(BASE/('no-'+n.lower()+'.png')))),n
    assert np.array_equal(np.asarray(render()),full),'restore'
    toggle[n]='PASS'
    overlap[n]=int((body_alpha & (np.asarray(layers[n])[:,:,3]>16)).sum())
assert all(overlap[n]>0 for n in ['Top','Bottom','Shoes'])
report={'technicalStatus':'PASS','assetStatus':'PENDING_USER_APPROVAL','productionReady':False,'files':checks,
    'facePixelsPreserved':True,'hairFilePreserved':True,'shoeBaseline':113,
    'uniqueNonemptyLayers':'PASS','bodyBaseline':113,'toggleRestore':toggle,
    'bodyPixelsPresentUnderOverlays':overlap,
    'semanticValidation':'PENDING_USER_REVIEW; overlaps do not prove correct anatomy/alignment',
    'weapon':'EMPTY_BY_DESIGN','scope':'Male DOWN IDLE frame0 only'}
(BASE/'validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
