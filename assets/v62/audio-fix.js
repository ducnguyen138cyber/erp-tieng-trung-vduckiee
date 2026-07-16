(function(root){
  "use strict";
  if(!root.Audio||root.__v62AdamSegmentFix)return;
  root.__v62AdamSegmentFix=true;

  var NativeAudio=root.Audio;
  var nativeSetTimeout=root.setTimeout.bind(root);
  var currentTimeDescriptor=null;
  var proto=root.HTMLMediaElement&&root.HTMLMediaElement.prototype;
  while(proto&&!currentTimeDescriptor){
    currentTimeDescriptor=Object.getOwnPropertyDescriptor(proto,"currentTime");
    proto=Object.getPrototypeOf(proto);
  }

  var segments={
    good:{
      starts:[0.050,6.738,10.854,18.401,25.188,31.079,42.971,46.211,49.955,57.484,63.325,74.318,80.669,86.733,92.457,97.222,103.661,109.459,113.091,116.462],
      lengths:[6.688,4.116,7.547,6.787,5.891,11.892,3.240,3.744,7.529,5.841,10.993,6.351,6.064,5.724,4.765,6.439,5.798,3.632,3.371,5.817]
    },
    medium:{
      starts:[0.050,5.016,10.179,20.623,26.432,36.351,46.451,52.346,58.509,61.726,64.822,68.987,71.297,76.430,82.774,88.707,94.706,100.764,107.475,110.198],
      lengths:[4.966,5.163,10.444,5.809,9.919,10.100,5.895,6.163,3.217,3.096,4.165,2.310,5.133,6.344,5.933,5.999,6.058,6.711,2.723,2.964]
    },
    bad:{
      starts:[0.050,4.417,9.446,14.972,27.245,33.975,39.018,45.237,51.967,58.641,64.146,69.290,75.776,82.288,88.130,94.185,100.268,105.404,111.646,116.447],
      lengths:[4.367,5.029,5.526,12.273,6.730,5.043,6.219,6.730,6.674,5.505,5.144,6.486,6.512,5.842,6.055,6.083,5.136,6.242,4.801,6.877]
    }
  };

  function levelFromDuration(duration){
    if(duration<118)return "medium";
    return duration>122.8?"bad":"good";
  }

  function FixedAudio(src){
    var audio=new NativeAudio(src);
    var isAdam=typeof src==="string"&&src.indexOf("data:audio/mpeg;base64,")===0;
    if(!isAdam||!currentTimeDescriptor||!currentTimeDescriptor.get||!currentTimeDescriptor.set)return audio;

    try{
      Object.defineProperty(audio,"currentTime",{
        configurable:true,
        enumerable:true,
        get:function(){return currentTimeDescriptor.get.call(audio);},
        set:function(value){
          var numeric=Number(value);
          if(Number.isInteger(numeric)&&numeric>=0&&numeric<20&&audio.duration>100){
            var level=levelFromDuration(audio.duration);
            audio.__v62AdamSegment={
              start:segments[level].starts[numeric],
              length:segments[level].lengths[numeric]
            };
            currentTimeDescriptor.set.call(audio,audio.__v62AdamSegment.start);
          }else{
            currentTimeDescriptor.set.call(audio,numeric);
          }
        }
      });
    }catch(error){return audio;}

    var nativePlay=audio.play.bind(audio);
    audio.play=function(){
      if(audio.__v62AdamSegment){
        root.__v62AdamStopDelay=Math.max(1400,Math.round((audio.__v62AdamSegment.length+0.12)*1000));
      }
      return nativePlay();
    };
    return audio;
  }

  FixedAudio.prototype=NativeAudio.prototype;
  try{Object.setPrototypeOf(FixedAudio,NativeAudio);}catch(error){}
  root.Audio=FixedAudio;

  root.setTimeout=function(callback,delay){
    var args=Array.prototype.slice.call(arguments,2);
    var actualDelay=Number(delay);
    if(actualDelay===960&&root.__v62AdamStopDelay){
      actualDelay=root.__v62AdamStopDelay;
      root.__v62AdamStopDelay=0;
    }
    return nativeSetTimeout.apply(root,[callback,actualDelay].concat(args));
  };
})(typeof window!=="undefined"?window:this);
