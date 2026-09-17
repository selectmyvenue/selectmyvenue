const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');const assert=require('node:assert/strict');
const path=require('path');const root=path.join(__dirname,'..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const tick=(n=40)=>new Promise(r=>setTimeout(r,n));
const rows=[{id:'a',venue_name:'Garden Venue',city:'Delhi',venue_type:'Banquet Hall',capacity_max:300,price_min_per_person:1200,food_veg:true,parking_available:true},{id:'b',venue_name:'Small Venue',city:'Delhi',venue_type:'Hotel',capacity_max:80,price_min_per_person:800},{id:'c',venue_name:'Gurgaon Venue',city:'Gurgaon',venue_type:'Hotel',capacity_max:500,price_min_per_person:1800}];
let inserts=[];const client={rpc:async()=>({data:rows,error:null}),from(table){return {insert:async payload=>{inserts.push({table,payload});return {error:null}}}}};
function dom(file,url){const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const x=new JSDOM(read(file),{url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=x.window;w.supabase={createClient:()=>client};w.HTMLElement.prototype.scrollIntoView=function(){};w.alert=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});x.errors=errors;return x;}
(async()=>{
 const home=dom('index.html','https://selectmyvenue.com/');const w=home.window,d=w.document;
 ['script.js','homepage-venues.js','celebration.js'].forEach(f=>w.eval(read(f)));
 await tick(650);assert.equal(d.querySelectorAll('.home-venue-card').length,3);
 assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.querySelector('.celebrate-search').action,'https://selectmyvenue.com/venues.html');
 assert.equal(d.querySelector('#smvTopVenueFinder'),null);
 d.querySelector('a[href="#aiPlanner"]').click();assert(d.getElementById('plannerTools').open);
 d.getElementById('customerName').value='Test Customer';d.getElementById('customerMobile').value='9876543210';d.getElementById('customerLocation').value='Delhi';d.getElementById('customerEventType').value='Wedding';
 d.getElementById('customerEnquiryForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await tick(100);assert.equal(inserts.length,1);assert.equal(inserts[0].table,'customer_enquiries');assert.equal(inserts[0].payload.customer_name,'Test Customer');
 const message=d.getElementById('customerEnquiryMessage');assert(message.textContent.includes('Requirement received'));
 let mutations=0;const observer=new w.MutationObserver(x=>mutations+=x.length);observer.observe(message,{subtree:true,childList:true,attributes:true});await tick(100);assert.equal(mutations,0,'confirmation observer must settle');observer.disconnect();
 assert.equal(home.errors.length,0,home.errors.join('\n'));home.window.close();console.log('PASS homepage listings, planner, CRM enquiry payload and stable confirmation');
 const directory=dom('venues.html','https://selectmyvenue.com/venues.html?city=Delhi&minGuests=200&maxPrice=1500');const dw=directory.window,dd=dw.document;dw.eval(read('venues.js'));await tick();
 assert.equal(dd.querySelectorAll('.venue-card').length,1);assert(dd.querySelector('.venue-card').textContent.includes('Garden Venue'));assert(dw.location.search.includes('minGuests=200'));
 dd.querySelector('[data-shortlist]').click();assert(JSON.parse(dw.localStorage.getItem('smv_venue_shortlist_v2')).includes('a'));
 dd.querySelector('[data-compare]').click();assert(JSON.parse(dw.localStorage.getItem('smv_venue_compare_v2')).includes('a'));
 dd.querySelector('[data-clear-filters]').click();assert.equal(dd.querySelectorAll('.venue-card').length,3);assert(!dw.location.search.includes('minGuests'));
 dd.querySelector('#smvBrowseSearch').value='Small';dd.querySelector('#smvBrowseSearch').dispatchEvent(new dw.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(dd.querySelectorAll('.venue-card').length,1);assert(dw.location.search.includes('q=small'));
 assert.equal(directory.errors.length,0,directory.errors.join('\n'));directory.window.close();console.log('PASS capacity/budget filtering, clear filters, shortlist, comparison and shareable search');
 const guide=dom('venue-booking-checklist.html','https://selectmyvenue.com/venue-booking-checklist.html');const gw=guide.window;gw.eval(read('celebration.js'));gw.document.querySelector('.visit-checklist input').click();assert(gw.document.getElementById('checklistCompletion').textContent.startsWith('1 of'));assert(JSON.parse(gw.localStorage.getItem('smv_visit_checklist_v1'))['venue-check-0']);gw.document.getElementById('resetVisitChecklist').click();assert(gw.document.getElementById('checklistCompletion').textContent.startsWith('0 of'));guide.window.close();console.log('PASS saved venue checklist and reset');
 for(const file of ['index.html','venues.html','venue-booking-checklist.html','wedding-venue-budget-guide.html']){const page=new JSDOM(read(file));const doc=page.window.document;assert.equal(doc.querySelectorAll('h1').length,1,file);const ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,'duplicate ids '+file);for(const script of doc.querySelectorAll('script[type="application/ld+json"]'))JSON.parse(script.textContent);for(const a of doc.querySelectorAll('a[href]')){const href=a.getAttribute('href');if(href.startsWith('#')&&href.length>1)assert(doc.getElementById(href.slice(1)),'broken anchor '+file+href);}page.window.close();}console.log('PASS headings, unique IDs, local anchors and structured data');
})().catch(e=>{console.error(e);process.exitCode=1});
