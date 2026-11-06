"""Rebuild bundled Vietnamese audio (Python + edge-tts==7.3.1 + ffmpeg).
Uses fixed vi-VN-NamMinhNeural voice. No audio service is contacted at runtime.
Intermediate clips are restartable in --cache, outside the repository.
"""
import argparse,asyncio,hashlib,json,subprocess,tempfile
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
async def main(cache):
 source=json.loads((ROOT/'data/vietnamese/audio-sources.json').read_text())
 cache.mkdir(parents=True,exist_ok=True)
 semaphore=asyncio.Semaphore(4);count=0
 async def clip(text):
  nonlocal count
  key=hashlib.sha256(text.encode()).hexdigest()[:20];dest=cache/(key+'.mp3')
  if dest.exists() and dest.stat().st_size>500:return dest
  async with semaphore:
   for attempt in range(3):
    try:
     await asyncio.wait_for(edge_tts.Communicate(text,'vi-VN-NamMinhNeural',rate='-5%').save(str(dest)),timeout=45)
     if dest.stat().st_size<500:raise ValueError('Empty speech clip')
     count+=1
     if count%40==0:print(f'Generated {count} clips',flush=True)
     return dest
    except Exception:
     dest.unlink(missing_ok=True)
     if attempt==2:raise
     await asyncio.sleep(attempt+1)
 alltext=list(dict.fromkeys(t for texts in source.values() for t in texts))
 await asyncio.gather(*(clip(t) for t in alltext))
 destdir=ROOT/'assets/vietnamese/audio';destdir.mkdir(parents=True,exist_ok=True)
 manifest={'voice':'vi-VN-NamMinhNeural','locale':'vi-VN','source':'Microsoft neural speech; bundled build-time synthesis','units':{}}
 rate=24000;gap=b'\x00\x00'*int(rate*.32)
 for unit,texts in source.items():
  pcm=bytearray(gap);segments={}
  for text in texts:
   file=await clip(text)
   raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-ar',str(rate),'-ac','1','-f','s16le','-'])
   start=len(pcm)/(rate*2);pcm.extend(raw);end=len(pcm)/(rate*2);pcm.extend(gap)
   segments[text]=[round(start,3),round(end,3)]
  target=destdir/(unit+'.mp3')
  subprocess.run(['ffmpeg','-v','error','-f','s16le','-ar',str(rate),'-ac','1','-i','pipe:0','-codec:a','libmp3lame','-b:a','48k','-y',str(target)],input=pcm,check=True)
  manifest['units'][unit]={'file':f'./assets/vietnamese/audio/{unit}.mp3','segments':segments,'seconds':round(len(pcm)/(rate*2),3),'bytes':target.stat().st_size}
  print(unit,round(len(pcm)/(rate*2),1),'seconds',target.stat().st_size,'bytes',flush=True)
 (ROOT/'data/vietnamese/audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
 print('Audio complete:',len(alltext),'unique phrases',flush=True)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--cache',type=Path,default=Path(tempfile.gettempdir())/'vduckie-vi-audio');args=parser.parse_args();asyncio.run(main(args.cache))
