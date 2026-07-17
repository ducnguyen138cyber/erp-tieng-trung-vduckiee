(function(root){
  "use strict";
  var api=root.VDuckieERPTermsV77;
  var pool=root.__ERP_V77_CANDIDATES__||[];
  var target=1600;
  if(!api||typeof api.addText!=="function"){
    console.error("Không tìm thấy bộ gộp từ vựng ERP v77.");
    return;
  }

  var preferred=["Tài chính","Giá thành","Ngân sách","Chất lượng","Bảo trì","Logistics","Xuất nhập khẩu","Nhân sự","Tiền lương","Dự án","Dịch vụ","Dữ liệu","Hệ thống"];
  var groups=Object.create(null),categoryOrder=[];
  for(var i=0;i<pool.length;i++){
    var row=pool[i],category=row[2]||"Hệ thống";
    if(!groups[category]){groups[category]=[];categoryOrder.push(category);}
    groups[category].push(row);
  }
  for(var c=0;c<categoryOrder.length;c++){
    groups[categoryOrder[c]].sort(function(a,b){
      var ap=/^Thuật ngữ nghiệp vụ chuẩn/.test(a[3]||"")?0:1;
      var bp=/^Thuật ngữ nghiệp vụ chuẩn/.test(b[3]||"")?0:1;
      return ap-bp;
    });
  }
  categoryOrder.sort(function(a,b){
    var ai=preferred.indexOf(a),bi=preferred.indexOf(b);
    if(ai<0)ai=999;if(bi<0)bi=999;
    return ai-bi;
  });

  var positions=Object.create(null),rounds=0,progress=true;
  while(api.terms.length<target&&progress){
    progress=false;rounds++;
    for(var j=0;j<categoryOrder.length&&api.terms.length<target;j++){
      var name=categoryOrder[j],index=positions[name]||0,list=groups[name];
      if(index>=list.length)continue;
      var before=api.terms.length,row=list[index];
      positions[name]=index+1;
      api.addText([row[0],row[1],row[2],row[3]||""].join("\t"));
      if(api.terms.length>before)progress=true;
    }
    if(rounds>pool.length+5)break;
  }

  var present=Object.create(null),categories=[];
  for(var k=0;k<api.terms.length;k++){
    var cat=api.terms[k][4]||"Chứng từ";
    if(!present[cat]){present[cat]=true;categories.push(cat);}
  }
  categories.sort(function(a,b){
    var ai=preferred.indexOf(a),bi=preferred.indexOf(b);
    if(ai<0)ai=999;if(bi<0)bi=999;
    return ai-bi||a.localeCompare(b,"vi");
  });

  var sources=["Tài liệu iGP/Workflow ERP của doanh nghiệp","SAP S/4HANA","Microsoft Dynamics 365","Oracle Fusion Cloud ERP/SCM","Odoo ERP","Thuật ngữ ERP phổ biến quốc tế"];
  api.finish(categories,527+pool.length,sources);
  root.ERP_TERMS_V77.version="77.1";
  root.ERP_TERMS_V77.targetCount=target;
  root.ERP_TERMS_V77.candidateCount=pool.length;
  root.ERP_TERMS_V77.targetReached=api.terms.length>=target;
  root.ERP_TERMS_V77.totalCount=api.terms.length;
  if(api.terms.length<target)console.error("Bộ từ ERP v77.1 chưa đạt mục tiêu:",api.terms.length,"/",target);
})(typeof globalThis!=="undefined"?globalThis:this);
