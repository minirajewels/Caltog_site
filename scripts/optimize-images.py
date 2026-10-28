"""Generate website-only WebP copies; never modify source artwork."""
from pathlib import Path
from PIL import Image
import concurrent.futures, hashlib, json, re

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'images' / 'optimized'
OUTPUT.mkdir(parents=True, exist_ok=True)
PRODUCTS = json.loads((ROOT / 'products.json').read_text())

def generate(product):
    source = ROOT / 'images' / 'products' / product['image']
    variants = []
    with Image.open(source) as original:
        # Retain aspect ratio, transparency and the source ICC colour profile.
        original.load()
        for width in (400, 640):
            height = round(original.height * width / original.width)
            image = original.resize((width, height), Image.Resampling.LANCZOS)
            options = {'quality': 88, 'method': 6}
            if original.info.get('icc_profile'):
                options['icc_profile'] = original.info['icc_profile']
            import io
            buffer = io.BytesIO()
            image.save(buffer, 'WEBP', **options)
            data = buffer.getvalue()
            digest = hashlib.sha256(data).hexdigest()[:12]
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', product['code']).strip('-')
            path = OUTPUT / f'{slug}-{width}-{digest}.webp'
            path.write_bytes(data)
            variants.append({'src': str(path.relative_to(ROOT)), 'width': width, 'height': height, 'bytes': len(data)})
    return product['image'], variants

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    images = dict(pool.map(generate, PRODUCTS))
logo_source = ROOT / 'images' / 'brand' / 'Minira PNG Full Logo.png'
with Image.open(logo_source) as image:
    image.thumbnail((336,336), Image.Resampling.LANCZOS)
    import io
    buffer=io.BytesIO()
    options={'quality':92,'method':6}
    if image.info.get('icc_profile'):options['icc_profile']=image.info['icc_profile']
    image.save(buffer,'WEBP',**options)
    data=buffer.getvalue()
    logo=OUTPUT / ('minira-logo-'+hashlib.sha256(data).hexdigest()[:12]+'.webp')
    logo.write_bytes(data)
manifest={'products': images, 'logo': str(logo.relative_to(ROOT))}
(ROOT / 'optimized-images.json').write_text(json.dumps(manifest,indent=2)+'\n')
client={name:{'src': variants[0]['src'], 'srcset': ', '.join(f"{v['src']} {v['width']}w" for v in variants)} for name, variants in images.items()}
(ROOT / 'image-assets.js').write_text('window.MiniraImages = '+json.dumps(client,separators=(',',':'))+';\n')
print('Generated',len(images)*2,'product variants. Product WebP total:',sum(v['bytes'] for variants in images.values() for v in variants),'bytes')
print('Logo:',manifest['logo'],len(data),'bytes')
