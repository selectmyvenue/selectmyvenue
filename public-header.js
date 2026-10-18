(function(){"use strict";

var HEADER_HTML='<header class="site-header"><div class="header-inner"><a href="index.html#home" class="brand" aria-label="Select My Venue Home"><img src="logo.png" alt="Select My Venue" class="main-logo"></a><button class="menu-toggle" id="menuToggle" type="button" aria-label="Open navigation" aria-expanded="false">☰</button><nav id="mainNav"><a href="index.html#home">Home</a><a href="index.html#how">How It Works</a><a href="index.html#smart">Smart Discovery</a><a href="index.html#aiPlanner">AI Planner</a><a href="venues.html">Browse Venues</a><a href="delhi-ncr-venues.html">Delhi NCR</a><a href="index.html#enquiry" class="nav-cta">Find My Venue</a><a href="list-your-venue.html">List Your Venue</a></nav><a href="tel:+918368322256" class="header-contact" aria-label="Call Select My Venue at +91 83683 22256">☎ +91 83683 22256 <span aria-hidden="true">•</span> Contact</a></div></header>';

function ensureStyle(){
  var old=document.getElementById("smvCanonicalHeaderCss");
  if(old)old.remove();
  var link=document.createElement("link");
  link.id="smvCanonicalHeaderCss";
  link.rel="stylesheet";
  link.href="shared-home-header.css?v=20261018-phone-visible-4";
  document.head.appendChild(link);var mobile=document.createElement("link");mobile.id="smvCustomerMobileCss";mobile.rel="stylesheet";mobile.href="customer-mobile-20261001.css?v=20261001-v3";document.head.appendChild(mobile);var finalMobile=document.createElement("link");finalMobile.id="smvFinalMobileUiCss";finalMobile.rel="stylesheet";finalMobile.href="mobile-ui-final-20261001.css?v=20261001-final-3";document.head.appendChild(finalMobile);
}

function rebuildHeader(){
  var existing=document.querySelector("header.site-header, header.page-header");
  if(!existing)return;
  var wrap=document.createElement("div");
  wrap.innerHTML=HEADER_HTML;
  existing.replaceWith(wrap.firstElementChild);
}

function markActive(){
  var path=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  var nav=document.getElementById("mainNav");
  if(!nav)return;
  nav.querySelectorAll("a").forEach(function(a){a.classList.remove("active");});
  var active=null;
  if(path==="venues.html")active=nav.querySelector('a[href="venues.html"]');
  else if(path==="delhi-ncr-venues.html"||path.indexOf("venues-in-")===0)active=nav.querySelector('a[href="delhi-ncr-venues.html"]');
  else if(path==="list-your-venue.html")active=nav.querySelector('a[href="list-your-venue.html"]');
  if(active)active.classList.add("active");
}

function initMenu(){
  // One delegated owner for the menu. The mobile shell calls the same
  // installer, so a tap can never toggle the menu twice.
  if(window.__smvMenuDelegationInstalled)return;
  window.__smvMenuDelegationInstalled=true;
  function close(){
    var btn=document.getElementById("menuToggle"),nav=document.getElementById("mainNav");
    if(nav)nav.classList.remove("open");
    if(btn)btn.setAttribute("aria-expanded","false");
  }
  document.addEventListener("click",function(e){
    var target=e.target;
    if(!target||!target.closest)return;
    var btn=target.closest("#menuToggle");
    if(btn){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      var nav=document.getElementById("mainNav");
      if(!nav)return;
      var open=nav.classList.toggle("open");
      btn.setAttribute("aria-expanded",open?"true":"false");
      return;
    }
    if(target.closest(".smv-nav-more"))return;
    if(target.closest("#mainNav a")){close();return;}
    if(!target.closest(".site-header"))close();
  },true);
  document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
}

function init(){ensureStyle();rebuildHeader();markActive();initMenu();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();