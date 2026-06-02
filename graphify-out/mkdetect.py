import json
from pathlib import Path

inc = json.loads(Path('graphify-out/.graphify_incremental.json').read_text(encoding="utf-8"))
new_files = inc.get('new_files', {})
flat = [f for files in new_files.values() for f in files]
detect = {
    'files': new_files,
    'total_files': len(flat),
    'total_words': inc.get('new_words', 0) or 0,
    'needs_graph': True,
    'warning': None,
    'skipped_sensitive': [],
}
Path('graphify-out/.graphify_detect.json').write_text(json.dumps(detect, ensure_ascii=False), encoding="utf-8")
print('changed files for extraction:', len(flat))
for k,v in new_files.items():
    if v:
        print(f'== {k} ({len(v)}) ==')
        for f in v: print('  ', f)
