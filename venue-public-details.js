(function(){
  "use strict";
  const clean=v=>String(v??"").trim();
  const events=v=>{const raw=v.event_types||[];return (Array.isArray(raw)?raw:String(raw).split(/[,|]/)).map(clean).filter(Boolean)};
  const location=v=>{const area=clean(v.area),city=clean(v.city);const parts=area.split(",").map(clean).filter(Boolean);if(city&&!parts.some(x=>x.toLowerCase()===city.toLowerCase()||x.toLowerCase()==="new "+city.toLowerCase()))parts.push(city);return [...new Set(parts)].join(", ")||"Location on request"};
  window.SMVPublicDetails={events,location,photos:(cover,images)=>[...new Set([cover,...(images||[])].filter(Boolean))].slice(0,30)};
})();
