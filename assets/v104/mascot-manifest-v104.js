(function (root) {
  "use strict";
  var base = root.VDuckieMascotManifest;
  if (!base) return;
  var sprites = Object.freeze({
    9:Object.freeze({asset:"./assets/vduckie/lv9/master-sprite-v104.webp?v=104.0",fallback:"./assets/vduckie/lv9/v104/frame-0.webp?v=104.0"}),
    10:Object.freeze({asset:"./assets/vduckie/lv10/grandmaster-sprite-v104.webp?v=104.0",fallback:"./assets/vduckie/lv10/v104/frame-0.webp?v=104.0"})
  });
  function levelOf(value){return Math.max(1,Math.min(10,Math.floor(Number(value||1))))}
  function spriteResult(level,state,source){return Object.freeze({level:level,state:state,requestedState:state,resolvedState:state,asset:source.asset,fallbackAsset:source.fallback,renderMode:"sprite",frames:9,columns:9,rows:1,fps:9,frameWidth:512,frameHeight:512,frameAspect:1,exactCombination:true,missingCombination:false,usedFallback:false,isValid:true,source:Object.freeze({level:level,renderMode:"sprite",asset:source.asset})})}
  function resolve(query){
    query=query||{};var level=levelOf(query.level),state=String(query.state||"idle");
    if(level===9||level===10)return spriteResult(level,state,sprites[level]);
    return base.resolve(query);
  }
  var levels=Object.assign({},base.levels);
  [9,10].forEach(function(level){levels[level]=Object.freeze(Object.assign({},levels[level],{defaultAsset:sprites[level].asset,fallbackAsset:sprites[level].fallback,renderMode:"sprite"}))});
  levels=Object.freeze(levels);
  root.VDuckieMascotManifest=Object.freeze(Object.assign({},base,{version:"104.0",levels:levels,level9Sprite:sprites[9],level10Sprite:sprites[10],resolve:resolve,resolveMascotAsset:resolve,getLevel:function(level){return levels[levelOf(level)]}}));
})(window);
