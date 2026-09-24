(function(){
var q=new URLSearchParams(location.search),d=document.documentElement;
if(q.get('embed'))d.className='embed';
var m={charcoal:['#2c2d33','#ffffff','#ffffff','#ffffff'],navy:['#1d1f4d','#ffffff','#ffffff','#ffffff']}[q.get('shirt')];
if(m){['--shirt','--ink','--roundel','--mid'].forEach(function(k,i){d.style.setProperty(k,m[i]);});}
})();
