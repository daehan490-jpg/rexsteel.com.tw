(function(){
  var root=document.documentElement;
  // scroll: new page always opens at the top; #section links land below the sticky bars; Back keeps its position
  var navType='navigate';
  try{var ne=performance.getEntriesByType('navigation')[0]; if(ne) navType=ne.type;}catch(e){}
  var isBack=navType==='back_forward';
  try{if('scrollRestoration' in history) history.scrollRestoration=isBack?'auto':'manual';}catch(e){}
  function barOffset(){
    var h=0, hdr=document.querySelector('.hdr'), sub=document.querySelector('.subnav');
    if(hdr) h+=hdr.offsetHeight; if(sub) h+=sub.offsetHeight;
    return h+12;
  }
  function placeScroll(){
    if(isBack) return;
    root.style.scrollPaddingTop=barOffset()+'px';
    var id=location.hash?decodeURIComponent(location.hash.slice(1)):'';
    var el=id?document.getElementById(id):null;
    if(el){var y=el.getBoundingClientRect().top+window.pageYOffset-barOffset(); window.scrollTo({top:Math.max(0,y),behavior:'instant'});}
    else window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('DOMContentLoaded',placeScroll);
  window.addEventListener('load',function(){ if(location.hash) placeScroll(); });
  window.addEventListener('resize',function(){root.style.scrollPaddingTop=barOffset()+'px';});
  var lang='zh-Hant';
  try{var s=localStorage.getItem('rx-lang'); if(s==='en'||s==='zh-Hant'||s==='ko') lang=s;}catch(e){}
  var listeners=[];
  window.RX={lang:function(){return lang}, L:function(tc,en,ko){return lang==='en'?en:(lang==='ko'&&ko!=null?ko:tc)}, onLang:function(f){listeners.push(f)}};
  function setLang(l){
    lang=l; root.lang=l;
    document.querySelectorAll('.lang button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.lang===l))});
    document.querySelectorAll('[data-tc]').forEach(function(el){el.textContent=l==='en'?el.dataset.en:(l==='ko'&&el.dataset.ko?el.dataset.ko:el.dataset.tc)});
    try{localStorage.setItem('rx-lang',l)}catch(e){}
    listeners.forEach(function(f){f(l)});
  }
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.lang button').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.lang)})});
    var bg=document.querySelector('.burger'), menu=document.querySelector('.menu');
    if(bg&&menu){
      bg.addEventListener('click',function(){var o=menu.classList.toggle('open');bg.setAttribute('aria-expanded',String(o))});
      menu.addEventListener('click',function(e){if(e.target.closest('a')){menu.classList.remove('open');bg.setAttribute('aria-expanded','false')}});
    }
    // hero video: play only when allowed
    var v=document.querySelector('.hero video');
    if(v){
      var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduce){v.removeAttribute('autoplay');v.pause();v.hidden=true}
      else{var p=v.play&&v.play(); if(p&&p.catch)p.catch(function(){v.hidden=true});}
    }
    // copy buttons
    document.querySelectorAll('[data-copy]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var txt=btn.dataset.copy, orig=btn.innerHTML;
        function done(ok){btn.textContent=ok?RX.L('已複製','Copied','복사됨'):RX.L('請手動選取','Select to copy','직접 선택해 복사하세요');setTimeout(function(){btn.innerHTML=orig},1600)}
        function sel(){var t=document.getElementById(btn.dataset.target);if(t){var r=document.createRange();r.selectNodeContents(t);var s=getSelection();s.removeAllRanges();s.addRange(r)}done(false)}
        if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true)},sel)}else sel();
      });
    });
    setLang(lang);
  });
})();

/* ---------- cover-depth calculator (technical page) ---------- */
(function(){
  var D=[150,200,250,300,350,400,450,500,600];
  var T={
    "1.6":{h:[null,null,98.8,82.3,70.6,61.7,54.9,49.4,41.1],w:[6.4,8.6,10.7,12.9,15.0,17.2,19.3,21.5,25.7],s:[218330,104510,63980,46070,36960,31840,28750,26780,24540]},
    "2.0":{h:[null,null,null,null,88.2,77.2,68.6,61.7,51.4],w:[8.0,10.7,13.4,16.0,18.7,21.4,24.0,26.7,32.0],s:[274420,128180,76100,53080,41370,34800,30830,28290,25410]}
  };
  var MINC={road:0.3,road125:0.3,rail:0.6};
  function fmt(n){return n.toLocaleString('en-US')}
  document.addEventListener('DOMContentLoaded',function(){
    var form=document.getElementById('calc-form'); if(!form) return;
    var L=RX.L, fD=document.getElementById('f-d'), fL=document.getElementById('f-load'), fH=document.getElementById('f-h'), fR=document.getElementById('f-hr');
    var tb=document.querySelector('#coverTable tbody'), svg=document.getElementById('burial');
    fD.innerHTML=D.map(function(d){return '<option value="'+d+'"'+(d===400?' selected':'')+'>Ø'+d+' mm</option>'}).join('');
    var t="2.0";
    form.querySelectorAll('.seg button').forEach(function(b){b.addEventListener('click',function(){
      t=b.dataset.t; form.querySelectorAll('.seg button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))}); run();
    })});
    fR.addEventListener('input',function(){fH.value=(+fR.value).toFixed(1);run()});
    fH.addEventListener('input',function(){var v=parseFloat(fH.value); if(!isNaN(v)) fR.value=Math.min(10,Math.max(0,v)); run()});
    [fD,fL].forEach(function(el){el.addEventListener('change',run)});
    form.addEventListener('submit',function(e){e.preventDefault()});
    function hT(v){return v===null?L('100 以上','100+','100 이상'):v.toFixed(1)}

    function table(sel){
      var a=T["1.6"],b=T["2.0"];
      tb.innerHTML=D.map(function(d,i){
        return '<tr'+(d===sel?' class="sel"':'')+'><td>Ø'+d+'</td><td class="l">0.3</td><td>0.6</td><td class="l h">'+hT(a.h[i])+'</td><td>'+a.w[i].toFixed(1)+'</td><td>'+fmt(a.s[i])+'</td><td class="l h">'+hT(b.h[i])+'</td><td>'+b.w[i].toFixed(1)+'</td><td>'+fmt(b.s[i])+'</td></tr>';
      }).join('');
    }

    function draw(d,H,mn,mx,load){
      var W=640, Hh=380, gy=96, x0=320;
      var Dm=d/1000, Hv=isNaN(H)?mn:Math.max(H,0);
      var span=Hv+Dm+0.6;
      var s=Math.min(260, 250/span);
      var r=Math.max(Dm*s/2,7);
      var cy=gy+Hv*s+r;
      var trench=Math.max(r*2+60,140);
      var o='';
      // soil
      o+='<rect x="0" y="'+gy+'" width="'+W+'" height="'+(Hh-gy)+'" fill="var(--bg)"/>';
      o+='<rect x="'+(x0-trench/2)+'" y="'+gy+'" width="'+trench+'" height="'+(Hh-gy)+'" fill="color-mix(in srgb,var(--steel) 14%,var(--bg))"/>';
      for(var i=0;i<26;i++){o+='<line x1="'+(i*26)+'" y1="'+(gy+4)+'" x2="'+(i*26+14)+'" y2="'+(gy+18)+'" stroke="var(--line)" stroke-width="1"/>'}
      // surface
      // axle-load arrows (values from the catalogue: HS20-44 semi-trailer / Cooper E80), not to horizontal scale
      function arrow(x,yTip,label){
        return '<line x1="'+x+'" y1="'+(yTip-34)+'" x2="'+x+'" y2="'+(yTip-6)+'" stroke="var(--red)" stroke-width="2.2"/>'+
               '<path d="M'+(x-6)+' '+(yTip-10)+' L'+x+' '+yTip+' L'+(x+6)+' '+(yTip-10)+'Z" fill="var(--red)"/>'+
               (label?'<text x="'+x+'" y="'+(yTip-40)+'" text-anchor="middle" fill="var(--red)" style="font:700 12px var(--f-mono)">'+label+'</text>':'');
      }
      function dimSpan(x1,x2,y,label){
        return '<line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" stroke="var(--muted)" stroke-width="1"/>'+
               '<line x1="'+x1+'" y1="'+(y-4)+'" x2="'+x1+'" y2="'+(y+4)+'" stroke="var(--muted)"/><line x1="'+x2+'" y1="'+(y-4)+'" x2="'+x2+'" y2="'+(y+4)+'" stroke="var(--muted)"/>'+
               '<text x="'+((x1+x2)/2)+'" y="'+(y-5)+'" text-anchor="middle" fill="var(--muted)" style="font:500 11px var(--f-mono)">'+label+'</text>';
      }
      if(load==='rail'){
        o+='<rect x="40" y="'+(gy-16)+'" width="560" height="16" fill="var(--steel)" opacity=".35"/>';
        for(var k=0;k<14;k++){o+='<rect x="'+(48+k*40)+'" y="'+(gy-22)+'" width="24" height="7" fill="var(--muted)"/>'}
        o+='<rect x="40" y="'+(gy-26)+'" width="560" height="4" fill="var(--ink)"/>';
        [250,300,350,400].forEach(function(x){o+=arrow(x,gy-30,'')});
        o+='<text x="325" y="'+(gy-72)+'" text-anchor="middle" fill="var(--red)" style="font:700 12px var(--f-mono)">Cooper E80 · 36.3 tf × 4</text>';
        o+=dimSpan(250,300,gy-50,'1.52 m');
        o+='<text x="610" y="'+(gy-30)+'" text-anchor="end" fill="var(--muted)" style="font:500 11px var(--f-mono)">'+L('H 自枕木底面起算','H from sleeper base','H는 침목 하면부터')+'</text>';
      }else{
        o+='<rect x="0" y="'+(gy-8)+'" width="'+W+'" height="8" fill="var(--ink)" opacity=".85"/>';
        for(var q=0;q<16;q++){o+='<rect x="'+(8+q*40)+'" y="'+(gy-5)+'" width="18" height="2" fill="#e8c34a"/>'}
        var f=load==='road125';
        o+=arrow(170,gy-10,'14,600 kgf');
        o+=arrow(330,gy-10,'14,600 kgf');
        o+=arrow(490,gy-10,'3,650 kgf');
        o+=dimSpan(170,330,gy-26,'4.27 – 9.14 m')+dimSpan(330,490,gy-26,'4.27 m');
        o+='<text x="16" y="'+(gy-70)+'" fill="var(--muted)" style="font:600 11px var(--f-mono)">HS20-44 (MS18)'+(f?' × 1.25':'')+'</text>';
        o+='<text x="16" y="'+(gy-56)+'" fill="var(--muted)" style="font:500 11px var(--f-mono)">SEMI-TRAILER</text>';
      }
      o+='<line x1="0" y1="'+gy+'" x2="'+W+'" y2="'+gy+'" stroke="var(--ink)" stroke-width="1.5"/>';
      // min cover line
      var ym=gy+mn*s;
      if(ym<Hh-4){o+='<line x1="'+(x0-trench/2-30)+'" y1="'+ym+'" x2="'+(x0+trench/2+30)+'" y2="'+ym+'" stroke="var(--red)" stroke-width="1.2" stroke-dasharray="6 5"/>';
        o+='<text x="'+(x0+trench/2+36)+'" y="'+(ym+4)+'" fill="var(--red)" style="font:600 12px var(--f-mono)">Hmin '+mn.toFixed(1)+' m</text>'}
      // bedding
      o+='<rect x="'+(x0-trench/2)+'" y="'+(cy+r)+'" width="'+trench+'" height="10" fill="color-mix(in srgb,var(--steel) 34%,var(--bg))"/>';
      // pipe
      if(cy-r<Hh){
        o+='<circle cx="'+x0+'" cy="'+cy+'" r="'+r+'" fill="color-mix(in srgb,var(--steel) 30%,var(--bg))" stroke="var(--ink)" stroke-width="3"/>';
        o+='<circle cx="'+x0+'" cy="'+cy+'" r="'+Math.max(r-5,2)+'" fill="none" stroke="var(--steel)" stroke-width="1" stroke-dasharray="3 3"/>';
        o+='<text x="'+(x0+r+12)+'" y="'+(cy+4)+'" fill="var(--ink)" style="font:700 13px var(--f-mono)">Ø'+d+'</text>';
      }
      // H dimension
      var xd=x0-trench/2-46, yb=Math.min(cy-r,Hh-2);
      o+='<line x1="'+xd+'" y1="'+gy+'" x2="'+xd+'" y2="'+yb+'" stroke="var(--ink)" stroke-width="1.2"/>';
      o+='<line x1="'+(xd-6)+'" y1="'+gy+'" x2="'+(xd+6)+'" y2="'+gy+'" stroke="var(--ink)"/><line x1="'+(xd-6)+'" y1="'+yb+'" x2="'+(xd+6)+'" y2="'+yb+'" stroke="var(--ink)"/>';
      o+='<line x1="'+(xd+6)+'" y1="'+yb+'" x2="'+(x0-r)+'" y2="'+yb+'" stroke="var(--ink)" stroke-width=".8" stroke-dasharray="2 3"/>';
      o+='<text x="'+(xd-10)+'" y="'+((gy+yb)/2+5)+'" text-anchor="end" fill="var(--ink)" style="font:700 15px var(--f-mono)">H '+(isNaN(H)?'–':H.toFixed(1))+' m</text>';
      o+='<text x="16" y="'+(Hh-14)+'" fill="var(--muted)" style="font:500 11px var(--f-mono)">'+L('示意圖 · 比例依覆土自動調整','Schematic · scale adjusts to cover','개념도 · 축척은 토피에 따라 자동 조정')+'</text>';
      if(mx!==null) o+='<text x="'+(W-16)+'" y="'+(Hh-14)+'" text-anchor="end" fill="var(--muted)" style="font:500 11px var(--f-mono)">Hmax '+mx.toFixed(1)+' m</text>';
      svg.innerHTML=o;
    }

    function run(){
      var d=+fD.value, i=D.indexOf(d), r=T[t], load=fL.value, mn=MINC[load], mx=r.h[i], H=parseFloat(fH.value);
      document.getElementById('o-min').innerHTML=mn.toFixed(1)+'<small>m</small>';
      document.getElementById('o-max').innerHTML=hT(mx)+'<small>m</small>';
      document.getElementById('o-w').innerHTML=r.w[i].toFixed(1)+'<small>kg/m</small>';
      document.getElementById('o-s').innerHTML=fmt(r.s[i])+'<small>kg/m²</small>';
      var v=document.getElementById('verdict'), vm=document.getElementById('v-main'), vs=document.getElementById('v-sub'), spec='Ø'+d+' · t '+t+' mm';
      if(isNaN(H)){v.className='verdict bad';vm.textContent=L('請輸入設計覆土','Enter the design cover','설계 토피를 입력하세요');vs.textContent=spec}
      else if(H<mn){v.className='verdict bad';vm.textContent=L('覆土不足','Cover too shallow','토피 부족');vs.textContent=spec+L(' · 最小覆土 ',' · minimum cover ',' · 최소 토피 ')+mn.toFixed(1)+' m'}
      else if(mx!==null&&H>mx){v.className='verdict bad';vm.textContent=L('超過最大填土高度','Exceeds maximum fill','최대 성토고 초과');vs.textContent=spec+L(' · 請改用較厚板厚或洽本公司另行計算',' · use a thicker wall or ask us for a calculation',' · 더 두꺼운 판을 쓰거나 당사에 별도 계산을 요청하세요')}
      else{v.className='verdict ok';vm.textContent=L('適用','Suitable','적용 가능');vs.textContent=spec+' · '+mn.toFixed(1)+' ≦ H '+H.toFixed(1)+' ≦ '+hT(mx)+' m'}
      draw(d,H,mn,mx,load); table(d);
    }
    RX.onLang(run);
    run();
  });
})();
