/* HSK5–6 learner material. Archival course records and review gates stay intact. */
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VDuckieHSKAdvanced=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function list(v){return Array.isArray(v)?v:[];}
  function byId(rows){return Object.fromEntries(rows.map(function(x){return [x.id,x];}));}
  function prepare(input,source){
    if(!source||source.version!==1||!source.cases)throw new Error('Chưa tải được học liệu HSK5–6.');
    var data=copy(input),level=Number(data.manifest.level);
    if(level!==5&&level!==6)throw new Error('Sai cấp độ học liệu nâng cao.');
    var lessons=byId(data.lessons),grammar=byId(data.grammar),vocab=byId(data.vocabulary);
    var caseSentences=[];
    data.units.forEach(function(unit){
      var c=source.cases[unit.id];
      if(!c||c.zh.length!==3||c.vi.length!==3||!c.zh.every(Boolean)||!c.vi.every(Boolean))throw new Error('Thiếu tình huống cho '+unit.id);
      c.zh.forEach(function(zh,i){caseSentences.push({zh:zh,vi:c.vi[i]});});
    });
    data.vocabulary.forEach(function(word){
      word.reviewStatus='unreviewed';
      if(source.definitionOverrides&&source.definitionOverrides[word.id])word.meaningVi=source.definitionOverrides[word.id].meaningVi;
      // The old corpus inserted arbitrary headwords into sentence templates and
      // labelled unrelated words as confusable. Only grounded case examples are shown.
      word.collocations=caseSentences.filter(function(s){return s.zh.indexOf(word.simplified)>=0;}).slice(0,2);
      word.examples=word.collocations.slice();word.confusables=[];word.commonErrorsVi=[];word.usageNoteVi='';
    });
    data.enrichment.forEach(function(word){
      word.collocations=[];word.confusables=[];word.commonErrorsVi=[];word.usageNoteVi='';word.reviewStatus='unreviewed';
    });
    data.lessons.forEach(function(lesson){
      var c=source.cases[lesson.unitId];
      var script=c.zh.join('\n');
      var questions=['Tình huống ban đầu là gì?','Thông tin hoặc khó khăn nào được làm rõ?','Những người trong tình huống quyết định làm gì tiếp theo?'];
      var keys=c.zh.map(function(zh,i){return {answer:zh,answerVi:c.vi[i],evidenceZh:zh};});
      lesson.reviewStatus='unreviewed';
      lesson.sections=lesson.sections.map(function(section){
        var type=section.type,content;
        if(type==='vocabulary'){
          content=copy(section.content);content.focusWords=list(content.focusWords).map(function(focus){return {canonicalId:focus.canonicalId||focus.canonicalLookup&&focus.canonicalLookup.value,lexicalStatus:'canonical',assessmentEligible:false};});
        }else if(type==='grammar'||type==='character')return section;
        else if(type==='situation')content={promptVi:c.vi[0],successCriterionVi:'Luyện chủ đề “'+lesson.titleVi+'”: hiểu dữ kiện, giải thích bằng chứng và đề xuất bước tiếp theo.'};
        else if(type==='dialogue')content={scriptZh:'甲：发生了什么情况？\n乙：'+c.zh[0]+'\n甲：后来发现了什么？\n乙：'+c.zh[1]+'\n甲：接下来怎么办？\n乙：'+c.zh[2],registerNoteVi:'Hội thoại luyện thuật lại tình huống. Chú ý phân biệt câu hỏi làm rõ và câu hỏi về hành động tiếp theo.',tasks:['Đóng hai vai, thuật lại bằng lời của mình.','Nêu một câu hỏi cần làm rõ trước khi quyết định.']};
        else if(type==='listening')content={scriptZh:script,questionsVi:questions,answerKey:keys,audioStatus:'tts',listeningNoteVi:'Nghe bằng TTS trước, ghi lại ba ý chính rồi mới xem transcript để đối chiếu.'};
        else if(type==='reading')content={textZh:script,translationVi:c.vi.join('\n'),pinyin:list(c.py).join('\n'),questionsVi:questions,answerKey:keys,readingStrategyVi:'Tìm câu nêu tình huống, câu giải thích và câu nêu hành động. Dẫn nguyên văn phần làm căn cứ cho câu trả lời.'};
        else if(type==='independent-practice')content={speakingVi:'Trình bày tình huống trong ba ý, sau đó giải thích bạn đồng ý hoặc muốn thay đổi điều gì.',writingVi:'Viết một đoạn tiếng Trung tóm tắt tình huống và đề xuất một bước tiếp theo. Phân biệt dữ kiện có sẵn với đề xuất của bạn.',realWorldTaskVi:'Thử đặt tình huống tương tự trong học tập hoặc công việc; không đưa thông tin cá nhân của người khác vào bài.',selfCheck:['Đã nêu đủ dữ kiện chính?','Có dẫn chứng cho cách giải thích?','Đề xuất có liên quan đến tình huống?','Đã đọc lại cách dùng từ và quan hệ giữa các câu?']};
        else if(type==='review')content={spacingDays:[1,3,7,14,30],vocabularyRefs:lesson.vocabularyRefs,reviewPolicyVi:'Tự nhớ nghĩa trước khi xem đáp án; ôn lại từ khó và thuật lại tình huống sau một khoảng thời gian.'};
        else content={promptVi:'Dùng tình huống trong chương để luyện chủ đề “'+lesson.titleVi+'”.',steps:['Tự nhớ lại từ vựng.','Nghe và đọc tình huống, chỉ ra câu làm bằng chứng.','Viết câu trả lời trước khi xem mẫu tham khảo.']};
        return Object.assign({},section,{content:content,titleVi:({dialogue:'Hội thoại theo tình huống',listening:'Nghe tình huống và ghi ý chính',reading:'Đọc hiểu và dẫn chứng'})[type]||section.titleVi});
      });
    });
    data.exercises.forEach(function(exercise,index){
      var id=exercise.id.split('-exercise-')[0],lesson=lessons[id];
      if(!lesson)throw new Error('Không tìm thấy bài cho '+exercise.id);
      var c=source.cases[lesson.unitId],script=c.zh.join('\n'),slot=list(lesson.practiceRefs).indexOf(exercise.id);
      var model=script,meaning=c.vi.join('\n'),prompt='',stimulus={textZh:script};
      exercise.reviewStatus='unreviewed';exercise.options=[];
      if(exercise.skill==='vocabulary'){
        var word=vocab[list(exercise.vocabularyFocus)[0]]||vocab[lesson.vocabularyRefs[0]];
        if(!word||!word.meaningVi)throw new Error('Thiếu nghĩa từ cho '+exercise.id);
        var choices=[word.simplified];
        lesson.vocabularyRefs.forEach(function(ref){var w=vocab[ref];if(w&&choices.length<4&&choices.indexOf(w.simplified)<0)choices.push(w.simplified);});
        var rotate=index%choices.length;choices=choices.slice(rotate).concat(choices.slice(0,rotate));
        exercise.prompt='['+lesson.titleZh+'] Chọn từ có nghĩa: '+word.meaningVi+'. Pinyin: '+(word.pinyinTone||word.pinyin)+'.';
        exercise.stimulus=null;exercise.options=choices;exercise.answer=word.simplified;exercise.acceptedAnswers=[word.simplified];
        exercise.explanationVi=word.simplified+' · '+(word.pinyinTone||word.pinyin)+' · '+word.meaningVi+'. Nghĩa tham khảo từ danh mục từ vựng; đây không phải câu kiểm định trình độ.';
        return;
      }
      if(exercise.skill==='grammar'){
        var g=grammar[list(exercise.grammarFocus)[0]]||grammar[lesson.grammarRefs[0]],example=g&&list(g.correctExamples)[0];
        if(!example||!example.zh||!example.vi)throw new Error('Thiếu ví dụ ngữ pháp cho '+exercise.id);
        prompt='Diễn đạt ý “'+example.vi+'” bằng tiếng Trung, vận dụng '+g.nameZh+'. Có thể dùng cách diễn đạt tương đương.';
        stimulus={meaningVi:example.vi,targetStructureVi:g.formula};model=example.zh;meaning=example.vi;
      }else if(exercise.skill==='listening'){
        prompt='Nghe tình huống và ghi lại vấn đề ban đầu cùng hành động được lựa chọn sau khi làm rõ thông tin.';
        stimulus={scriptZh:script,transcriptVisibility:'after-answer'};model=c.zh[0]+'\n'+c.zh[2];meaning=c.vi[0]+'\n'+c.vi[2];
      }else if(exercise.skill==='reading')prompt='Đọc tình huống. Giải thích thông tin ở câu thứ hai ảnh hưởng thế nào đến hành động ở câu cuối. Dẫn một câu làm bằng chứng.';
      else if(exercise.skill==='translation'){
        var sentence=(slot+index)%3;prompt='Dịch sang tiếng Trung: “'+c.vi[sentence]+'”';stimulus={meaningVi:c.vi[sentence]};model=c.zh[sentence];meaning=c.vi[sentence];
      }else if(exercise.skill==='speaking')prompt='Dựa vào tình huống, viết dàn ý rồi thuật lại bằng tiếng Trung. Nêu vấn đề, điều được làm rõ và bước tiếp theo; có thể bổ sung ý kiến cá nhân.';
      else if(exercise.skill==='writing')prompt='Viết một đoạn tiếng Trung về tình huống: tóm tắt dữ kiện, giải thích lựa chọn và đề xuất một thay đổi. Mẫu chỉ minh họa phần tóm tắt; ý kiến cá nhân không có một đáp án duy nhất.';
      else if(exercise.format==='self-review')prompt='Đọc lại phần tóm tắt của chính bạn, chọn một câu cần diễn đạt rõ hơn và viết lại. Giải thích điều bạn thay đổi so với dữ kiện trong tình huống.';
      else if(exercise.format==='real-communication-task')prompt='Đóng vai người tham gia tình huống, viết một lời đề nghị lịch sự và một câu hỏi làm rõ. Giải thích mục đích giao tiếp của từng câu.';
      else prompt='Tổng hợp ba ý chính trong tình huống bằng lời của bạn. Tách phần đã biết và đề xuất; dẫn một câu làm bằng chứng cho nhận định.';
      exercise.prompt='['+lesson.titleZh+' · '+(slot+1)+'] '+prompt;
      exercise.stimulus=stimulus;
      exercise.answer={referenceAnswer:model,answerVi:meaning,rubric:{meaning:'Bám đúng dữ kiện và mục tiêu câu hỏi; không cần trùng từng chữ với mẫu.',language:'Câu rõ nghĩa, dùng từ và liên kết ý phù hợp.',evidence:'Đối chiếu với phần tình huống hoặc ý tiếng Việt đã cho.',review:'Tự đối chiếu; hệ thống không xác nhận đúng/sai hay đã nắm vững.'}};
      exercise.acceptedAnswers=[model];
      exercise.explanationVi='Mẫu tham khảo giúp đối chiếu nội dung. Bài trả lời mở có nhiều cách diễn đạt; phần ý kiến và đề xuất do người học tự kiểm tra theo tiêu chí.';
    });
    data.selfStudyNotice='HSK '+level+' · Học liệu tự luyện. Audio bằng TTS; bài trả lời mở dùng mẫu tham khảo và tiêu chí tự đối chiếu. Hoàn thành bài không xác nhận đã đạt trình độ HSK.';
    return data;
  }
  return Object.freeze({prepare:prepare});
});
