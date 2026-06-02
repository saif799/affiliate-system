import json
from graphify.cache import check_semantic_cache
from pathlib import Path

detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding="utf-8"))
all_files = [f for files in detect['files'].values() for f in files]
cn, ce, ch, uncached = check_semantic_cache(all_files)
if cn or ce or ch:
    Path('graphify-out/.graphify_cached.json').write_text(json.dumps({'nodes': cn, 'edges': ce, 'hyperedges': ch}, ensure_ascii=False), encoding="utf-8")
Path('graphify-out/.graphify_uncached.txt').write_text(chr(10).join(uncached), encoding="utf-8")
print(f'Cache: {len(all_files)-len(uncached)} hit, {len(uncached)} need extraction')
for u in uncached:
    print('  ', u)
