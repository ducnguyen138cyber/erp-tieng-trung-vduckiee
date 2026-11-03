// Observe the painted DOM, rather than assuming that a stylesheet link wins.
export async function inspectVisuals(page){return page.evaluate(()=>{
 const legacy=value=>{const c=String(value).match(/[\d.]+/g)?.map(Number);if(!c||c.length<3||(c.length>3&&c[3]===0))return false;const[r,g,b]=c;return(g>r*1.08&&g>b*1.035&&g-r>6)||(r>210&&g>205&&r-b>10&&g-b>6)};
 const issues=[];let inspected=0;
 for(const e of document.querySelectorAll('body *')){
  if(['SCRIPT','STYLE','LINK','META','IMG','SVG','PATH'].includes(e.tagName)||e.closest('svg'))continue;
  const box=e.getBoundingClientRect(),s=getComputedStyle(e);
  if(!box.width||!box.height||box.right<=0||box.left>=innerWidth||s.visibility==='hidden'||s.opacity==='0'||e.closest('[hidden],.hidden'))continue;
  inspected++;
  for(const prop of ['color','backgroundColor'])if(legacy(s[prop]))issues.push({tag:e.tagName,cls:String(e.className).slice(0,100),prop,value:s[prop],text:e.textContent.trim().slice(0,45)});
  const gradients=s.backgroundImage.match(/rgba?\([^)]+\)/g)||[];
  if(gradients.some(legacy))issues.push({tag:e.tagName,cls:String(e.className).slice(0,100),prop:'backgroundImage',value:s.backgroundImage});
 }
 return {inspected,issues,body:getComputedStyle(document.body).backgroundColor,theme:document.querySelector('meta[name="vduckie-visual-release"]')?.content||null,styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.getAttribute('href')),mascots:[...document.querySelectorAll('.brand-logo,.home-welcome-mascot,.duckie-chat-mascot,.duckie-chat-launch img,.menu-signature')].map(e=>({src:e.getAttribute('src'),loaded:e.complete&&e.naturalWidth>0})),overflow:document.documentElement.scrollWidth-innerWidth};
})}
