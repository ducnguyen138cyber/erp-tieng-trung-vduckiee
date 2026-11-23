import gzip
import json
import sys
from pathlib import Path

base = Path(__file__).resolve().parents[1] / 'data/hsk/hsk1'

def read(name):
    return json.loads((base / name).read_text(encoding='utf8'))

parts = [read(name + '.json') for name in (
    'course-manifest', 'units', 'lessons', 'grammar', 'characters',
    'exercises', 'assessments', 'vocabulary-enrichment')]
index = read('vocabulary/index.json')
vocabulary = []
for shard in index['shards']:
    collection = read('vocabulary/' + shard['file'])
    assert collection['collectionType'] == 'vocabulary'
    vocabulary.extend(collection['records'])
assert len(vocabulary) == index['expectedCount']
parts.extend([vocabulary, None])
target = base / 'learner-course-v1.gz'
if '--check' in sys.argv:
    assert json.loads(gzip.decompress(target.read_bytes())) == parts
else:
    target.write_bytes(gzip.compress(json.dumps(parts, ensure_ascii=False,
        separators=(',', ':')).encode(), mtime=0))
