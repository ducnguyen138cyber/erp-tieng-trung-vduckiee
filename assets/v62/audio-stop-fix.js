(function(root){
  "use strict";
  if(root.__v68AdamStopTimerFix)return;
  root.__v68AdamStopTimerFix=true;
  var previousSetTimeout=root.setTimeout.bind(root);
  root.setTimeout=function(callback,delay){
    var args=Array.prototype.slice.call(arguments,2);
    var actual=Number(delay)===960?15000:delay;
    return previousSetTimeout.apply(root,[callback,actual].concat(args));
  };
})(typeof window!=="undefined"?window:this);
