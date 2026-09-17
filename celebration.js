'use strict';
(function(){
 const disclosure=document.getElementById('plannerTools');
 function openPlanner(){if(disclosure&&location.hash==='#aiPlanner')disclosure.open=true;}
 window.addEventListener('hashchange',openPlanner);openPlanner();
 document.querySelectorAll('a[href="#aiPlanner"]').forEach(link=>link.addEventListener('click',()=>{if(disclosure)disclosure.open=true}));
 document.querySelectorAll('.visit-checklist input').forEach(input=>{
  const key='smv_visit_checklist_v1';
  try{input.checked=JSON.parse(localStorage.getItem(key)||'{}')[input.id]===true}catch(_){}
  input.addEventListener('change',()=>{try{let saved=JSON.parse(localStorage.getItem(key)||'{}');saved[input.id]=input.checked;localStorage.setItem(key,JSON.stringify(saved))}catch(_){}updateProgress()});
 });
 function updateProgress(){const inputs=[...document.querySelectorAll('.visit-checklist input')];const target=document.getElementById('checklistCompletion');if(target)target.textContent=inputs.filter(x=>x.checked).length+' of '+inputs.length+' checks complete';}
 document.getElementById('resetVisitChecklist')?.addEventListener('click',()=>{document.querySelectorAll('.visit-checklist input').forEach(x=>x.checked=false);try{localStorage.removeItem('smv_visit_checklist_v1')}catch(_){}updateProgress()});
 updateProgress();
})();
