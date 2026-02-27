// Utility helpers used by pages
function qs(selector, el=document){ return el.querySelector(selector); }
function qsa(selector, el=document){ return Array.from(el.querySelectorAll(selector)); }

// no-op for now; kept for expansion
console.log('public/main.js loaded');
