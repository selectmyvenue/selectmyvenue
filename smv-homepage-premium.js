(function(){
"use strict";
function arrange(){
 var main=document.querySelector("main");if(!main||main.dataset.smvPremiumOrder==="1")return;
 var by=function(sel){return main.querySelector(sel)||document.querySelector(sel);};
 var featured=by("#featuredVenues"),celebrations=by(".smv-celebrations-section"),locations=by(".smv-locations-section"),discovery=by(".smv-discovery-section"),inspiration=by(".smv-inspiration-section"),owner=by(".smv-owner-cta"),upgrade=by("#smvMarketplaceUpgrade"),enquiry=by("#enquiry"),trust=by(".trust-strip"),popular=by(".smv-popular-searches"),events=by(".popular-section"),features=by(".feature-row"),planner=by(".ai-planner-section"),about=by(".about-section"),contact=by(".contact-section");
 var difference=upgrade&&upgrade.querySelector(".smv-difference"),ownerShowcase=upgrade&&upgrade.querySelector(".smv-owner-showcase"),faq=upgrade&&upgrade.querySelector(".smv-home-faq");
 var ordered=[featured,celebrations,locations,discovery,difference,enquiry,trust,popular,events,features,planner,inspiration,owner,ownerShowcase,faq,about,contact];
 var anchor=featured&&featured.parentNode===main?featured.nextSibling:main.firstChild;
 ordered.forEach(function(node){if(!node||node===main||node.parentNode===null)return;if(node.parentNode!==main){main.appendChild(node);}main.insertBefore(node,anchor);anchor=node.nextSibling;});
 if(upgrade&&upgrade.parentNode)upgrade.remove();
 main.dataset.smvPremiumOrder="1";
}
var link=document.createElement("link");link.rel="stylesheet";link.href="smv-homepage-premium.css?v=20261116-1";document.head.appendChild(link);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrange,{once:true});else arrange();
})();