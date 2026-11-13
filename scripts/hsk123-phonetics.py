"""Read-only contextual pronunciation triage, pinned pypinyin; never a teacher verdict."""
import json, re, sys, unicodedata
from pathlib import Path
from pypinyin import pinyin, Style, __version__
from pypinyin.contrib.tone_convert import to_tone3

def plain(s):
    return ''.join(c for c in unicodedata.normalize('NFD',s.lower().replace('ü','v')) if not unicodedata.combining(c)).replace('u:', 'v')

def align(hanzi, given):
    # Align to character readings by spelling, retaining the authored tone, not a generated tone.
    chars=re.findall(r'[\u3400-\u9fff]',hanzi)
    joined=re.sub(r"[\s'’·.,!?，。！？、:：-]",'',given.lower()).replace('u:', 'ü')
    choices=[pinyin(c,style=Style.TONE,heteronym=True,neutral_tone_with_five=True)[0] for c in chars]
    paths=[([],0)]
    for readings in choices:
        nxt=[]
        bases=sorted(set(plain(r).rstrip('12345') for r in readings))
        for parts,pos in paths:
            for base in bases:
                part=joined[pos:pos+len(base)]
                if plain(part)==base:nxt.append((parts+[part],pos+len(base)))
        paths=nxt[:30]
    results={tuple(parts) for parts,pos in paths if pos==len(joined)}
    if len(results)!=1:return None,choices
    return list(next(iter(results))),choices

def scan(root):
    out=[]
    for level in (1,2,3):
        for file in sorted((Path(root)/f'data/hsk/hsk{level}').rglob('*.json')):
            doc=json.loads(file.read_text())
            for index,r in enumerate(doc.get('records',[])):
                if r.get('recordType') not in ('vocabulary','sentence'):continue
                zh=r.get('simplified') or r.get('chinese');given=r.get('pinyinTone') or r.get('pinyin')
                if not zh or not given:continue
                syllables,choices=align(zh,given)
                result={'id':r['id'],'file':str(file.relative_to(root)),'pointer':f'/records/{index}','hanzi':zh,'pinyin':given,'aligned':syllables is not None}
                if syllables:
                    numbered=[to_tone3(x,neutral_tone_with_five=True).replace('ü','v') for x in syllables]
                    result['expectedNumber']=' '.join(numbered)
                    result['numberMismatch']=bool(r.get('pinyinNumber')) and r['pinyinNumber']!=result['expectedNumber']
                    mismatches=[]
                    for i,(part,readings) in enumerate(zip(numbered,choices)):
                        allowed=[to_tone3(x,neutral_tone_with_five=True).replace('ü','v') for x in readings]
                        if part not in allowed:mismatches.append({'characterIndex':i,'given':part,'dictionaryAlternatives':allowed})
                    # Context dictionary differences remain suspects: sandhi, neutral tone and names can be valid.
                    contextual=[x[0] for x in pinyin(zh,style=Style.TONE3,neutral_tone_with_five=True,errors='ignore')]
                    result['contextDictionary']=' '.join(contextual)
                    result['readingSuspects']=mismatches
                    result['polyphoneContextSuspects']=[{'characterIndex':i,'given':part,'contextReference':contextual[i]} for i,(part,readings) in enumerate(zip(numbered,choices)) if len(contextual)==len(numbered) and len(readings)>1 and part!=contextual[i]]
                out.append(result)
    return {'tool':'pypinyin','version':__version__,'scope':'vocabulary/sentence Hanzi–Pinyin pairs only; examples lacking Pinyin need human review','pairs':out}

if __name__=='__main__':print(json.dumps(scan(Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()),ensure_ascii=False))
