// Observe the painted DOM, rather than assuming that a stylesheet link wins.
export async function inspectVisuals(page){return page.evaluate(()=>{
 const legacy=value=>{const c=String(value).match(/[\d.]+/g)?.map(Number);if(!c||c.length<3||(c.length>3&&c[3]===0))return false;const[r,g,b]=c;return(g>r*1.08&&g>b*1.035&&g-r>6)||(r>210&&g>205&&r-b>10&&g-b>6)};
 const raw=[];let inspected=0;
 for(const e of document.querySelectorAll('body *')){
  if(['SCRIPT','STYLE','LINK','META','IMG','SVG','PATH'].includes(e.tagName)||e.closest('svg'))continue;
  const box=e.getBoundingClientRect(),s=getComputedStyle(e);
  if(!box.width||!box.height||box.right<=0||box.left>=innerWidth||s.visibility==='hidden'||s.opacity==='0')continue;
  // A legacy .hidden class can be overridden by later display rules.
  // Geometry and computed ancestor paint determine actual visibility.
  let ancestor=e.parentElement,transparentAncestor=false;
  while(ancestor){if(getComputedStyle(ancestor).opacity==='0'){transparentAncestor=true;break;}ancestor=ancestor.parentElement;}
  if(transparentAncestor)continue;
  inspected++;
  if(e.matches('button')&&!e.disabled&&e.textContent.trim()){
   const rgb=v=>{const a=v.match(/[\d.]+/g)?.map(Number);return a&&a.length>=3?a:null};
   const fg=rgb(s.color);let bg=rgb(s.backgroundColor),parent=e.parentElement;
   while((!bg||bg[3]===0)&&parent){bg=rgb(getComputedStyle(parent).backgroundColor);parent=parent.parentElement;}
   const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
   if(fg&&bg){const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<4.5)raw.push({tag:e.tagName,cls:String(e.className),prop:'textContrast',value:ratio.toFixed(2),text:e.textContent.trim().slice(0,45)});}
  }
  for(const prop of ['color','backgroundColor'])if(legacy(s[prop]))raw.push({tag:e.tagName,cls:String(e.className).slice(0,100),prop,value:s[prop],text:e.textContent.trim().slice(0,45)});
  const gradients=s.backgroundImage.match(/rgba?\([^)]+\)/g)||[];
  if(gradients.some(legacy))raw.push({tag:e.tagName,cls:String(e.className).slice(0,100),prop:'backgroundImage',value:s.backgroundImage});
 }
 const dedup=new Map();for(const x of raw){const k=[x.tag,x.cls,x.prop,x.value].join('|');if(dedup.has(k))dedup.get(k).count++;else dedup.set(k,{...x,count:1});}const issues=[...dedup.values()];
 return {inspected,issues,body:getComputedStyle(document.body).backgroundColor,theme:document.querySelector('meta[name="vduckie-visual-release"]')?.content||null,styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.getAttribute('href')),mascots:[...document.querySelectorAll('.brand-logo,.home-welcome-mascot,.duckie-chat-mascot,.duckie-chat-launch img,.menu-signature,.home-resource-tile img,.home-course-art img')].map(e=>({src:e.getAttribute('src'),loaded:e.complete&&e.naturalWidth>0})),overflow:document.documentElement.scrollWidth-innerWidth};
})}
