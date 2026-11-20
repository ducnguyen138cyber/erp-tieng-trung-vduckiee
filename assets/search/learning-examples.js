/* Shared dictionary examples from existing HSK lessons, loaded only on lookup. */
(function(root){
 'use strict';
 var requests={},entries={};
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function t(vi,zh,en){var lang=root.VDuckieInterfaceI18n&&root.VDuckieInterfaceI18n.getLanguage();return lang==='zh'?zh:lang==='en'?en:vi;}
 function bucket(word){return Array.from(word).reduce(function(hash,ch){return(hash*31+ch.codePointAt(0))>>>0;},0)%16;}
 function lookup(word){
  if(entries[word])return Promise.resolve(entries[word]);
  var shard=bucket(word).toString(16);
  if(!requests[shard])requests[shard]=root.fetch('./data/dictionary/learning-examples/'+shard+'.json?v=1').then(function(response){if(!response.ok)throw Error('HTTP '+response.status);return response.json();}).then(function(data){Object.assign(entries,data.entries||{});return data.entries||{};}).catch(function(){delete requests[shard];return {};});
  return requests[shard].then(function(){return entries[word]||null;});
 }
 function pinyin(zh){try{return root.ERPPronunciation&&root.ERPPronunciation.generate(zh).pinyin||'';}catch(e){return '';}}
 function markup(example){return '<small class="dictionary-example-label">'+esc(t('Ví dụ từ học liệu VDuckie','VDuckie 课程例句','Example from VDuckie lessons'))+'</small><strong lang="zh-CN">'+esc(example.zh)+'</strong><b class="dictionary-example-pinyin">'+esc(example.pinyin||pinyin(example.zh))+'</b><span>'+esc(example.vi)+'</span><button type="button" data-learning-example-speak="'+esc(example.zh)+'">🔊 '+esc(t('Nghe câu ví dụ','听例句','Listen to example'))+'</button>';}
 function enhance(node,word,existing,onEntry){
  if(!node)return;
  if(existing&&existing.zh&&existing.vi){node.innerHTML=markup(existing);return;}
  node.textContent=t('Đang tìm câu ví dụ…','正在查找例句…','Looking up an example…');
  lookup(word).then(function(entry){
   if(!node.isConnected)return;
   node.innerHTML=entry?markup(entry.example):esc(t('Chưa có câu ví dụ trong học liệu hiện có.','现有课程中暂无该词例句。','No example available in the current lesson content.'));
   if(entry&&onEntry)onEntry(entry);
  });
 }
 if(root.document)root.document.addEventListener('click',function(event){var button=event.target.closest&&event.target.closest('[data-learning-example-speak]');if(!button||!root.speechSynthesis)return;root.speechSynthesis.cancel();var utterance=new root.SpeechSynthesisUtterance(button.getAttribute('data-learning-example-speak'));utterance.lang='zh-CN';utterance.rate=.85;root.speechSynthesis.speak(utterance);});
 root.VDuckieLearningExamples=Object.freeze({lookup:lookup,enhance:enhance});
})(window);
