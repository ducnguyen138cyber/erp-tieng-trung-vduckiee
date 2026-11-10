// Token presence is a smoke check; it never certifies teaching accuracy.
export function classify(item,status,body,requireCandidate=false){
 if(status===422)return 'safe-rejected';
 if(status!==200)return 'unavailable';
 const reply=String(body.reply||'').normalize('NFC').toLowerCase();
 if(!item.expect.every(token=>reply.includes(token.toLowerCase())))return 'incorrect-or-incomplete';
 if(requireCandidate&&item.glossary&&body.source!=='verified-glossary')return 'wrong-deployment';
 if(requireCandidate&&item.referenceSource&&body.source!==item.referenceSource)return 'wrong-deployment';
 if(item.generated&&body.source)return 'wrong-deployment';
 return item.glossary?'glossary-spot-check':item.referenceSource?'reference-spot-check':'pedagogy-review-needed';
}
