(function (root) {
  "use strict";
  var base = root.VDuckieMascotManifest;
  if (!base) return;
  var newborn = Object.freeze({asset:"./assets/vduckie/lv1/newborn-sprite-v103.webp?v=103.0",fallback:"./assets/vduckie/lv1/v103/newborn-0.webp?v=103.0",frames:4,columns:4,rows:1,frameWidth:1920,frameHeight:1080});
  var duckling = Object.freeze({asset:"./assets/vduckie/lv2/duckling-sprite-v103.webp?v=103.0",fallback:"./assets/vduckie/lv2/v103/duckling-0.webp?v=103.0",frames:6,columns:6,rows:1,frameWidth:1920,frameHeight:1080});
  var cleaned = Object.freeze({7:"./assets/vduckie/lv7/expert-sprite-v103.webp?v=103.0",8:"./assets/vduckie/lv8/leader-sprite-v103.webp?v=103.0"});
  var cleanedFallback = Object.freeze({7:"./assets/vduckie/lv7/v103/frame-0.webp?v=103.0",8:"./assets/vduckie/lv8/v103/frame-0.webp?v=103.0"});
  function levelOf(value){return Math.max(1,Math.min(10,Math.floor(Number(value||1))))}
  function spriteResult(level,state,source){return Object.freeze({level:level,state:state,requestedState:state,resolvedState:state,asset:source.asset,fallbackAsset:source.fallback,renderMode:"sprite",frames:source.frames,columns:source.columns,rows:source.rows,fps:10,frameWidth:source.frameWidth,frameHeight:source.frameHeight,frameAspect:source.frameWidth/source.frameHeight,exactCombination:true,missingCombination:false,usedFallback:false,isValid:true,source:Object.freeze({level:level,renderMode:"sprite",asset:source.asset})})}
  function resolve(query){
    query=query||{};var level=levelOf(query.level),state=String(query.state||"idle");
    if(level===1&&query.hatched)return spriteResult(1,state,newborn);
    if(level===2)return spriteResult(2,state,duckling);
    var result=base.resolve(query);
    if((level===7||level===8)&&result.renderMode==="sprite")return Object.freeze(Object.assign({},result,{asset:cleaned[level],fallbackAsset:cleanedFallback[level],usedFallback:false,isValid:true}));
    return result;
  }
  var levels=Object.assign({},base.levels);
  levels[1]=Object.freeze(Object.assign({},levels[1],{newbornAsset:newborn.asset,newbornFallback:newborn.fallback}));
  levels[2]=Object.freeze(Object.assign({},levels[2],{defaultAsset:duckling.asset,fallbackAsset:duckling.fallback,renderMode:"sprite"}));
  [7,8].forEach(function(level){levels[level]=Object.freeze(Object.assign({},levels[level],{defaultAsset:cleaned[level],fallbackAsset:cleanedFallback[level]}))});
  levels=Object.freeze(levels);
  root.VDuckieMascotManifest=Object.freeze(Object.assign({},base,{version:"103.0",levels:levels,newbornSprite:newborn,level2Sprite:duckling,resolve:resolve,resolveMascotAsset:resolve,getLevel:function(level){return levels[levelOf(level)]}}));
})(window);
