import { createClient } from "npm:@supabase/supabase-js@2";
const allowed=new Set(["https://selectmyvenue.com","https://www.selectmyvenue.com"]);
const cors=(o:string|null)=>({"Vary":"Origin","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",...(o&&allowed.has(o)?{"Access-Control-Allow-Origin":o}:{})});
const res=(b:unknown,s=200,o:string|null=null)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json",...cors(o)}});
const clean=(v:unknown,n=120)=>String(v??"").trim().slice(0,n),norm=(v:unknown)=>clean(v).toLowerCase().replace(/gurugram/g,"gurgaon").replace(/\s+/g," ");
async function hash(v:string,k:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v+":"+k));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function score(v:any,r:any){
 const c=norm(v.city),w=norm(r.city);if(!c||!w||!c.includes(w))return null;
 const max=Number(v.capacity_max||0),min=Number(v.capacity_min||0),g=Number(r.guests||0),p=Number(v.price_min_per_person||0),b=Number(r.budgetPerPerson||0);
 if((g&&max&&max<g)||(b&&p&&p>b))return null;
 let n=c&&w?30:0;const why:string[]=[];if(n)why.push("City matches");
 if(r.area&&norm(v.area).includes(norm(r.area))){n+=20;why.push("Area matches");}
 if(g&&max&&max>=g&&(!min||min<=g)){n+=20;why.push("Capacity fits");}
 if(b&&p&&p<=b){n+=15;why.push("Published price fits");}
 if(r.venueType&&norm(v.venue_type).includes(norm(r.venueType))){n+=10;why.push("Venue type matches");}
 const events=Array.isArray(v.event_types)?v.event_types.map(norm):[];
 if(events.some((x:string)=>x.includes(norm(r.eventType)))){n+=10;why.push("Event type listed");}
 const food=norm(r.food);if(food==="veg"&&v.food_veg===true){n+=5;why.push("Vegetarian option listed");}
 if(food==="non-veg"&&v.food_non_veg===true){n+=5;why.push("Non-vegetarian option listed");}
 if(food==="both"&&v.food_veg===true&&v.food_non_veg===true){n+=5;why.push("Veg and non-veg options listed");}
 const needsConfirmation=[!max?"Capacity to confirm":"",!p?"Price to confirm":"",food==="jain"?"Jain food availability to confirm":""].filter(Boolean);
 return {...v,relevanceScore:n,matchReasons:why,needsConfirmation};
}
Deno.serve(async req=>{const o=req.headers.get("origin");if(req.method==="OPTIONS")return new Response("ok",{headers:cors(o)});if(o&&!allowed.has(o))return res({error:"Origin not allowed"},403);if(req.method!=="POST")return res({error:"Method not allowed"},405,o);const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return res({error:"Search service not configured"},503,o);let b:any;try{b=await req.json();}catch{return res({error:"Invalid request"},400,o);}if(clean(b.website))return res({success:true,venues:[]},200,o);const eventType=clean(b.eventType,80),city=clean(b.city,80),area=clean(b.area,100),guests=b.guests===""||b.guests==null?null:Number(b.guests),budget=b.budgetPerPerson===""||b.budgetPerPerson==null?null:Number(b.budgetPerPerson);if(!eventType||!city)return res({error:"Select an occasion and city"},400,o);if((guests!==null&&(!Number.isInteger(guests)||guests<1||guests>100000))||(budget!==null&&(!Number.isFinite(budget)||budget<0||budget>10000000)))return res({error:"Check guest count or budget"},400,o);const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const ip=clean(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown",120),ih=await hash(ip,key),since=new Date(Date.now()-600000).toISOString();const {count,error:re}=await db.from("smv_public_search_rate_limits").select("id",{count:"exact",head:true}).eq("ip_hash",ih).gte("created_at",since);if(re)return res({error:"Search temporarily unavailable"},503,o);if((count||0)>=8)return res({error:"Too many searches. Try again in a few minutes."},429,o);const {error:le}=await db.from("smv_public_search_rate_limits").insert({ip_hash:ih});if(le)return res({error:"Search temporarily unavailable"},503,o);const {data:rows,error:ve}=await db.rpc("smv_public_venues");if(ve||!Array.isArray(rows))return res({error:"Venue list unavailable"},503,o);const r={eventType,city,area,guests,budgetPerPerson:budget,venueType:clean(b.venueType,80),food:clean(b.food,40)},venues=rows.map((x:any)=>x?.venue||x).map((v:any)=>score(v,r)).filter(Boolean).sort((a:any,b:any)=>b.relevanceScore-a.relevanceScore).slice(0,12);return res({success:true,venues,crmLeadCreated:false},200,o);});
