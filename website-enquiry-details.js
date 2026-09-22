(function(){
  const date=document.getElementById("customerEventDate"),flex=document.getElementById("customerDateFlexible");
  if(date&&flex){flex.addEventListener("change",()=>{if(flex.checked)date.value="";date.disabled=flex.checked});date.form?.addEventListener("reset",()=>{date.disabled=false})}
  const notes=document.getElementById("customerRequirements");
  if(notes)notes.placeholder="Rooms needed (e.g. 10 rooms), décor, accessibility or other requirements";
})();
