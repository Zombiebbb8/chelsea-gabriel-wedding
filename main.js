/* ═══ SUPABASE ═══ */
const SUPABASE_URL='https://nakadctpdszskvooftln.supabase.co';
const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2FkY3RwZHN6c2t2b29mdGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDExMzcsImV4cCI6MjA5Mzg3NzEzN30.iNYd01ff_TKKmGRb0pTB3fch_EIavoGaOnXAJt36jms';
let supabase;
try{supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON)}catch(e){console.warn('Supabase init failed',e)}

/* ═══ TURNSTILE ═══
   Callbacks live inline in index.html so they exist before the CDN widget
   completes (main.js loads late via fetch+eval). Reading falls back to the
   widget's hidden input so a lost callback can never strand a guest. */
function getTurnstileToken(){
  if(window.__tsToken)return window.__tsToken;
  const i=document.querySelector('input[name="cf-turnstile-response"]');
  return (i&&i.value)?i.value:null;
}

/* ═══ HERO DATE TYPEWRITER ═══
   Types the wedding date after the hero copy has faded in. The <p> carries an
   aria-label so screen readers get the full date regardless of animation. */
function typeHeroDate(){
  const el=document.getElementById('heroDate');
  if(!el)return;
  const text=el.dataset.text||'03-20-2027';
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){el.textContent=text;return}
  el.textContent='';
  let i=0;
  function typing(){
    el.textContent=text.slice(0,i);
    if(i++<text.length){setTimeout(typing,120);return}
    setTimeout(erasing,2600);        // hold the finished date
  }
  function erasing(){
    el.textContent=text.slice(0,i);
    if(i-->0){setTimeout(erasing,55);return}
    i=0;
    setTimeout(typing,500);          // pause, then type it again — loops forever
  }
  setTimeout(typing,1700);           // starts just after the .h-date rise-in
}

/* ═══ COUNTDOWN LABEL SCRAMBLE ═══
   Letters churn, then resolve into the label. Re-reads the label for the
   active language each cycle so it keeps working after a language switch. */
function scrambleCountdownLabel(){
  const el=document.querySelector('.cd-label');
  if(!el)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function target(){
    const v=el.getAttribute('data-'+(typeof currentLang!=='undefined'?currentLang:'en'));
    const tmp=document.createElement('div');tmp.innerHTML=v||el.textContent;
    return tmp.textContent.trim();
  }
  function run(){
    const text=target();
    const queue=[...text].map((ch,i)=>({ch,start:Math.floor(i*1.4),end:Math.floor(i*1.4)+14}));
    let frame=0;
    (function tick(){
      let out='',done=0;
      for(const q of queue){
        if(frame>=q.end){done++;out+=q.ch}
        else if(frame>=q.start){out+=(q.ch===' ')?' ':CHARS[Math.floor(Math.random()*CHARS.length)]}
        else out+=(q.ch===' ')?' ':'';
      }
      el.textContent=out;
      if(done===queue.length){setTimeout(run,4200);return}   // settle, then loop
      frame++;setTimeout(tick,34);   // timer, not rAF — rAF is throttled in background tabs
    })();
  }
  setTimeout(run,900);
}

/* ═══ RSVP THANK-YOU STATE ═══
   After a guest responds, the whole section becomes a thank-you page —
   heading included — and persists across visits via localStorage, so they
   are never asked to RSVP again. */
function applyRsvpThanksState(){
  const sec=document.getElementById('rsvp');if(!sec)return;
  const eye=sec.querySelector('.s-eye');
  const title=sec.querySelector('.s-title');
  const intro=sec.querySelector('.rsvp-intro');
  if(eye){
    eye.setAttribute('data-en','Response received');
    eye.setAttribute('data-ig','Anatala azịza gị');
    eye.setAttribute('data-yo','A ti gba ìdáhùn rẹ');
  }
  if(title){
    title.setAttribute('data-en','Thank <em>you!</em>');
    title.setAttribute('data-ig','Daalụ <em>nke ukwuu!</em>');
    title.setAttribute('data-yo','Ẹ <em>ṣeun!</em>');
  }
  if(intro)intro.style.display='none';
  const form=document.getElementById('rsvpForm');if(form)form.style.display='none';
  const thanks=document.getElementById('rsvpThanks');
  if(thanks){thanks.style.display='block';thanks.classList.add('in')}
  sec.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
  setLang(currentLang);
  hideHeroRsvp();
}

/* The big mobile "RSVP Now" hero button only makes sense before a guest has
   responded — hide it once they have, whether that's on this same device
   (wdg_rsvp_done) or via their portal link on a different device. */
function hideHeroRsvp(){
  document.querySelectorAll('.h-rsvp').forEach(el=>{el.style.display='none'});
}

/* ═══ GUEST PORTAL ═══
   The token is now sticky across pages: a token in the URL is cached to
   localStorage, and every page (including ones reached by clicking around
   rather than via the original portal link) falls back to that cached
   value so the guest doesn't need ?guest=... threaded through every link. */
const _urlGuestToken=(new URLSearchParams(location.search)).get('guest');
if(_urlGuestToken){try{localStorage.setItem('wdg_guest_token',_urlGuestToken)}catch(e){}}
const _guestToken=_urlGuestToken||(function(){try{return localStorage.getItem('wdg_guest_token')}catch(e){return null}})();
let _attireGuest=null;

async function initGuestPortal(){
  if(!_guestToken)return;
  try{
    const res=await fetch('https://nakadctpdszskvooftln.supabase.co/functions/v1/guest-auth',{
      method:'POST',
      headers:{'Authorization':'Bearer '+SUPABASE_ANON,'Content-Type':'application/json'},
      body:JSON.stringify({token:_guestToken})
    });
    const data=await res.json();
    if(!data.valid)return;

    const {guest,unlocked,days_until_wedding:days,content}=data;

    // A guest reaching their portal has already responded — the hero's
    // mobile "RSVP Now" CTA no longer applies, regardless of this device's
    // own localStorage state.
    hideHeroRsvp();

    // Show banner
    const banner=document.getElementById('guest-portal-banner');
    if(banner){
      const n=document.getElementById('gp-name');
      const s=document.getElementById('gp-status');
      const c=document.getElementById('gp-countdown');
      if(n)n.textContent='Welcome, '+guest.first_name;
      if(s)s.textContent=guest.attending==='yes'?'Confirmed ✓':'We\'ll miss you';
      if(c)c.textContent=days>0?days+' days to go':'See you today!';
      banner.classList.add('visible');
    }

    function injectSection(containerId,contentKey,unlockedDate){
      const container=document.getElementById(containerId);
      if(!container)return;
      if(unlocked.includes(contentKey)&&content[contentKey]){
        container.innerHTML=content[contentKey];
        container.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
      }else{
        const card=container.querySelector('.locked-card');
        if(!card)return;
        const msg=card.querySelector('.locked-msg');
        const cta=card.querySelector('.locked-cta');
        if(msg)msg.textContent='Your access is confirmed — this section opens '+unlockedDate;
        if(cta)cta.style.display='none';
        card.style.cursor='default';
        card.onclick=null;
      }
    }

    // The attire announcement is built here rather than taken from the server
    // payload, so our colours are stated once — in AO_CATALOG — and cannot
    // drift from the fabric actually on sale. Access is still server-decided.
    const attireEl=document.getElementById('attire-content');
    if(attireEl&&unlocked.includes('attire')){
      attireEl.innerHTML=renderAttireCard();
      attireEl.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
    }

    injectSection('timeline-content','timeline','March 6, 2027');
    injectSection('travel-content','travel','December 20, 2026');
    injectSection('photos-content','photos','March 20, 2027');

    if(unlocked.includes('travel')&&content.travel)requestAnimationFrame(initHotelsMap);

    // Attire ordering is only offered to confirmed ("yes") guests reaching
    // this page via their private portal link — it isn't part of the
    // server-rendered attire content, so it's revealed here independently.
    if(guest.attending==='yes'){
      _attireGuest=guest;
      const orderWrap=document.getElementById('attire-order');
      if(orderWrap){
        orderWrap.style.display='';
        // Seed the details step from the RSVP so the guest retypes as little
        // as possible. Every field stays editable.
        aoState.guest.firstName=aoState.guest.firstName||guest.first_name||'';
        aoState.guest.lastName=aoState.guest.lastName||guest.last_name||'';
        aoState.guest.email=aoState.guest.email||guest.email||'';
        aoRender();
        aoInitPricing();
        aoPreloadImages();
        const done=(()=>{try{return localStorage.getItem('wdg_attire_order_done')==='1'}catch(e){return false}})();
        if(done)applyAttireOrderThanksState();
      }
    }

  }catch(err){
    console.warn('Guest portal init failed',err);
  }
}

/* ═══ HOTELS MAP + TIER FILTERS ═══
   Leaflet + OpenStreetMap — free, no API key. Loaded on demand (only when a
   guest actually reaches the unlocked Travel section) so the ~99% of public
   visitors who never see this never download it. Only hotels with a
   verified street address (data-lat/data-lon) get a pin; every hotel still
   has a working "View on Maps" button regardless, so navigation never
   depends on our own geocoding being complete. */
let _leafletPromise=null;
function loadLeaflet(){
  if(_leafletPromise)return _leafletPromise;
  _leafletPromise=new Promise((resolve,reject)=>{
    if(typeof L!=='undefined'){resolve();return}
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script=document.createElement('script');
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload=()=>resolve();
    script.onerror=()=>reject(new Error('Leaflet failed to load'));
    document.head.appendChild(script);
  });
  return _leafletPromise;
}

function initHotelsMap(){
  const mapEl=document.getElementById('hotels-map');
  const grid=document.getElementById('hotelGrid');
  if(!grid)return;

  if(mapEl){
    const cards=[...grid.querySelectorAll('.hotel-card[data-lat]')];
    if(cards.length){
      loadLeaflet().then(()=>{
        const map=L.map(mapEl,{scrollWheelZoom:false}).setView([6.451,7.503],12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
          attribution:'&copy; OpenStreetMap contributors',maxZoom:18
        }).addTo(map);
        const bounds=[];
        cards.forEach(c=>{
          const lat=parseFloat(c.dataset.lat),lon=parseFloat(c.dataset.lon);
          if(Number.isNaN(lat)||Number.isNaN(lon))return;
          L.marker([lat,lon]).addTo(map).bindPopup('<strong>'+(c.dataset.name||'')+'</strong>');
          bounds.push([lat,lon]);
        });
        if(bounds.length>1)map.fitBounds(bounds,{padding:[30,30]});
        setTimeout(()=>map.invalidateSize(),300);
      }).catch(err=>{
        console.warn('Hotels map failed to load',err);
        mapEl.style.display='none';
      });
    }else{
      mapEl.style.display='none';
    }
  }

  const filterBtns=[...document.querySelectorAll('.hf-btn')];
  filterBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      filterBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tier=btn.dataset.tier;
      grid.querySelectorAll('.hotel-card').forEach(card=>{
        card.classList.toggle('hf-hidden',tier!=='all'&&card.dataset.tier!==tier);
      });
    });
  });
}

/* ═══ LANGUAGE ═══ */
let currentLang='en';
function setLang(lang){
  currentLang=lang;
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector('.lang-btn[onclick="setLang(\''+lang+'\')"]').classList.add('active');
  document.querySelectorAll('[data-'+lang+']').forEach(el=>{const v=el.getAttribute('data-'+lang);if(v)el.innerHTML=v});
  const hints={en:"Hint: the bride's name",ig:'Ọtụtụ: aha nwunye',yo:'Ìtọ́kasí: orúkọ ìyàwó'};
  const h=document.querySelector('.gate-hint');if(h)h.textContent=hints[lang]||hints.en;
}

/* ═══ NAV DROPDOWN ═══
   Lives here (rather than only in index.html's isolated gate script) since
   every page's nav needs it, not just the homepage. */
function toggleNavDD(){
  const wrap=document.getElementById('navDDWrap');
  const btn=document.getElementById('navDDBtn');
  if(!wrap)return;
  const isOpen=wrap.classList.toggle('open');
  if(btn)btn.setAttribute('aria-expanded',String(isOpen));
}
document.addEventListener('click',e=>{
  const wrap=document.getElementById('navDDWrap');
  if(wrap&&wrap.classList.contains('open')&&!wrap.contains(e.target)){
    wrap.classList.remove('open');
    const btn=document.getElementById('navDDBtn');
    if(btn)btn.setAttribute('aria-expanded','false');
  }
});

/* ═══ MUSIC + BEAT-SYNCED DANCE ENGINE ═══
   All timing is derived live from the loaded track via the Web Audio API —
   replace africa.mp3 with any song and the choreography adapts automatically. */
const audio=document.getElementById('bgMusic');audio.volume=0.22;
let musicStarted=false;

function toggleMusic(){
  const btn=document.getElementById('music-btn');
  if(audio.paused){
    audio.play().then(()=>{btn.classList.add('playing');musicStarted=true}).catch(()=>{});
  }else{audio.pause();btn.classList.remove('playing')}
}
function startMusicFromPill(){
  hideMusicPill();
  audio.play().then(()=>{musicStarted=true}).catch(()=>{});
}
function showMusicPill(){const p=document.getElementById('music-pill');if(p)p.classList.add('show')}
function hideMusicPill(){const p=document.getElementById('music-pill');if(p)p.classList.remove('show')}

/* Autoplay attempt for returning guests who skip the envelope.
   The envelope-tap path is a user gesture so it always plays;
   this path may be blocked by the browser → show the play pill instead. */
function attemptAutoplay(){
  if(!audio.paused)return;
  audio.play().then(()=>{musicStarted=true}).catch(()=>{showMusicPill()});
}

const dance=(()=>{
  const REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ctx=null,analyser=null,freq=null,raf=0,running=false;
  let energyHist=[],lastBeatAt=0,beatIvals=[],beatPeriod=500,beatCount=0,phase=0,lastFrame=0,level=0,beatFlash=0;
  let scene,fem,mal,femBody,malBody,femSvg,fx,limbs=null;

  function nodes(){
    scene=document.getElementById('couple-scene');
    fem=document.getElementById('fig-female-mover');
    mal=document.getElementById('fig-male-mover');
    if(!scene||!fem||!mal)return false;
    femSvg=fem.querySelector('svg');
    femBody=fem.querySelector('.fig-body');malBody=mal.querySelector('.fig-body');
    limbs={
      fLegL:fem.querySelector('.leg-l'),fLegR:fem.querySelector('.leg-r'),
      fArmI:fem.querySelector('.arm-inner'),fArmO:fem.querySelector('.arm-outer'),
      mLegL:mal.querySelector('.leg-l'),mLegR:mal.querySelector('.leg-r'),
      mArmI:mal.querySelector('.arm-inner'),mArmO:mal.querySelector('.arm-outer')
    };
    fx=document.getElementById('dance-fx');
    return !!(femBody&&malBody);
  }

  function ensureAudioGraph(){
    if(ctx){ctx.resume().catch(()=>{});return}
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      ctx=new AC();
      const src=ctx.createMediaElementSource(audio);
      analyser=ctx.createAnalyser();
      analyser.fftSize=1024;
      analyser.smoothingTimeConstant=.55;
      src.connect(analyser);analyser.connect(ctx.destination);
      freq=new Uint8Array(analyser.frequencyBinCount);
      ctx.resume().catch(()=>{});
    }catch(e){ctx=null}
  }
  // If the context was created suspended (strict autoplay policy), any first tap unlocks it
  document.addEventListener('pointerdown',()=>{if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{})},{passive:true});

  function bassEnergy(){
    analyser.getByteFrequencyData(freq);
    const binHz=ctx.sampleRate/analyser.fftSize;
    const n=Math.max(3,Math.round(140/binHz));   // ≈0–140 Hz kick band
    let s=0;for(let i=0;i<n;i++)s+=freq[i];
    return s/(n*255);
  }

  function detectBeat(e,now){
    energyHist.push(e);if(energyHist.length>50)energyHist.shift();
    const avg=energyHist.reduce((a,b)=>a+b,0)/energyHist.length;
    if(!(e>0.08&&e>avg*1.28&&(now-lastBeatAt)>240))return false;
    if(lastBeatAt){
      const iv=now-lastBeatAt;
      if(iv>270&&iv<1100){                        // 55–220 BPM window
        beatIvals.push(iv);if(beatIvals.length>16)beatIvals.shift();
        const sorted=[...beatIvals].sort((a,b)=>a-b);
        beatPeriod=sorted[Math.floor(sorted.length/2)];   // median interval = stable tempo
      }
    }
    lastBeatAt=now;beatCount++;
    return true;
  }

  function spawnHearts(strong){
    if(!fx||fx.childElementCount>14)return;       // pool cap keeps 60fps
    const n=strong?3:1;
    for(let i=0;i<n;i++){
      const h=document.createElement('div');h.className='dance-heart';
      const sz=8+Math.random()*8;
      h.style.left=(30+Math.random()*40)+'%';
      h.style.setProperty('--h-dur',(2.1+Math.random()*1.4)+'s');
      h.style.setProperty('--h-drift',((Math.random()-.5)*46)+'px');
      h.style.setProperty('--h-rot',((Math.random()-.5)*30)+'deg');
      h.innerHTML='<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24"><path d="M12 21C5 15 2 11 2 7.5 2 4.5 4.5 2 7.5 2 9.24 2 11 3 12 4.5 13 3 14.76 2 16.5 2 19.5 2 22 4.5 22 7.5 22 11 19 15 12 21Z" fill="'+(Math.random()>.5?'rgba(216,90,72,.85)':'rgba(226,200,122,.9)')+'"/></svg>';
      fx.appendChild(h);
      setTimeout(()=>h.remove(),3600);
    }
    if(strong){
      for(let i=0;i<5;i++){
        const s=document.createElement('div');s.className='dance-spark';
        s.style.left=(38+Math.random()*24)+'%';s.style.bottom='34%';
        s.style.setProperty('--s-dx',((Math.random()-.5)*70)+'px');
        s.style.setProperty('--s-dy',(-(20+Math.random()*50))+'px');
        s.style.setProperty('--s-dur',(.7+Math.random()*.5)+'s');
        fx.appendChild(s);setTimeout(()=>s.remove(),1300);
      }
    }
  }

  function pose(){
    // phase counts beats; one full sway = 2 beats — a slow romantic rock, not a robot tick.
    // Fast songs (>~140 BPM) fold to half-time so the sway stays graceful.
    const fold=beatPeriod<430?2:1;
    const p=phase*Math.PI/fold;
    const sway=Math.sin(p);
    const lift=Math.abs(Math.sin(p));
    const amp=.6+level*1.4;                       // louder music → bigger movement
    const bounce=(1.5+beatFlash*2.5)*amp;
    const rock=3.2*amp*sway;
    femBody.style.transform='translateY('+(-lift*bounce)+'px) rotate('+rock+'deg)';
    malBody.style.transform='translateY('+(-lift*bounce)+'px) rotate('+(-rock)+'deg)';   // mirrored = facing each other
    const arm=10*amp;
    limbs.fArmI.style.transform='rotate('+(sway*arm)+'deg)';
    limbs.fArmO.style.transform='rotate('+(-sway*arm*1.4)+'deg)';
    limbs.mArmI.style.transform='rotate('+(-sway*arm)+'deg)';
    limbs.mArmO.style.transform='rotate('+(sway*arm*1.4)+'deg)';
    const step=2.4*amp;
    const stepA=Math.max(0,sway)*step,stepB=Math.max(0,-sway)*step;
    limbs.fLegL.style.transform='translateY('+(-stepA)+'px)';
    limbs.fLegR.style.transform='translateY('+(-stepB)+'px)';
    limbs.mLegL.style.transform='translateY('+(-stepB)+'px)';
    limbs.mLegR.style.transform='translateY('+(-stepA)+'px)';
  }

  function loop(t){
    if(!running)return;
    raf=requestAnimationFrame(loop);
    if(!lastFrame)lastFrame=t;
    const dt=Math.min(64,t-lastFrame);lastFrame=t;
    if(ctx.state!=='running'){pose();return}
    const e=bassEnergy();
    level+=(e-level)*.12;
    beatFlash*=Math.pow(.94,dt/16);
    if(detectBeat(e,t)){
      beatFlash=Math.min(1,e/(level||.1)-.6);
      const strong=e>level*1.6;
      if(strong||beatCount%2===0)spawnHearts(strong);
      // Bride twirls every 16 beats; the twirl lasts exactly 2 beats of the current tempo
      if(beatCount%16===0&&femSvg){
        femSvg.style.setProperty('--twirl-dur',Math.round(beatPeriod*2*(beatPeriod<430?2:1))+'ms');
        femSvg.classList.remove('twirl');void femSvg.offsetWidth;femSvg.classList.add('twirl');
      }
      // Re-anchor the phase to the detected beat — keeps the dance locked to the song
      phase+=(Math.round(phase)-phase)*.35;
    }
    phase+=dt/beatPeriod;
    pose();
  }

  function start(){
    if(REDUCE||running)return;
    if(!nodes())return;
    ensureAudioGraph();
    if(!ctx)return;
    scene.classList.add('dancing');
    running=true;lastFrame=0;
    raf=requestAnimationFrame(loop);
  }
  function stop(){
    if(!running&&!scene)return;
    running=false;cancelAnimationFrame(raf);
    if(scene){
      scene.classList.remove('dancing');
      [femBody,malBody].concat(limbs?Object.values(limbs):[]).forEach(el=>{if(el)el.style.transform=''});
    }
  }
  return {start,stop};
})();

audio.addEventListener('play',()=>{
  hideMusicPill();
  const btn=document.getElementById('music-btn');if(btn)btn.classList.add('playing');
  dance.start();
});
audio.addEventListener('pause',()=>{
  const btn=document.getElementById('music-btn');if(btn)btn.classList.remove('playing');
  dance.stop();
});

/* ═══ GRAIN TEXTURE ═══ */
(function initGrain(){
  const c=document.getElementById('grain'),x=c.getContext('2d');
  let w,h;function resize(){w=c.width=innerWidth;h=c.height=innerHeight}resize();
  function draw(){const d=x.createImageData(w,h);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=v;d.data[i+1]=v;d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);requestAnimationFrame(draw)}
  // Only redraw grain every 100ms to save performance
  let last=0;function drawThrottled(t){if(t-last>100){const d=x.createImageData(w,h);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=v;d.data[i+1]=v;d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);last=t}requestAnimationFrame(drawThrottled)}
  addEventListener('resize',resize);requestAnimationFrame(drawThrottled);
})();

/* ═══ SCROLL PROGRESS ═══ */
function updateScrollProgress(){
  const h=document.documentElement.scrollHeight-innerHeight;
  const p=h>0?scrollY/h:0;
  document.getElementById('scroll-progress').style.transform='scaleX('+p+')';
}
addEventListener('scroll',updateScrollProgress,{passive:true});

/* ═══ CURSOR SPARKLE TRAIL ═══ */
let sparkThrottle=0;
document.addEventListener('mousemove',e=>{
  const now=Date.now();if(now-sparkThrottle<60)return;sparkThrottle=now;
  const s=document.createElement('div');s.className='cursor-spark';
  s.style.left=(e.clientX-2+Math.random()*8-4)+'px';
  s.style.top=(e.clientY-2+Math.random()*8-4)+'px';
  s.style.width=s.style.height=(2+Math.random()*3)+'px';
  document.body.appendChild(s);setTimeout(()=>s.remove(),800);
});

/* ═══ GOLD DUST CANVAS (Intro) ═══ */
const ec=document.getElementById('env-canvas'),ex=ec.getContext('2d');
let EW,EH,EP=[];
function rsz(){EW=ec.width=innerWidth;EH=ec.height=innerHeight}rsz();addEventListener('resize',rsz);
for(let i=0;i<120;i++)EP.push({x:Math.random()*2000,y:Math.random()*1200,r:Math.random()*1.3+.2,vx:(Math.random()-.5)*.16,vy:(Math.random()-.5)*.13,a:Math.random()*6.28});
(function drawDust(){
  ex.clearRect(0,0,EW,EH);
  EP.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.a+=.007;if(p.x<0)p.x=EW;if(p.x>EW)p.x=0;if(p.y<0)p.y=EH;if(p.y>EH)p.y=0;
  ex.beginPath();ex.arc(p.x,p.y,p.r,0,Math.PI*2);ex.fillStyle='rgba(160,164,96,'+((.18+.2*Math.sin(p.a)).toFixed(2))+')';ex.fill()});
  // Stars
  EP.slice(0,30).forEach((p,i)=>{ex.beginPath();ex.arc(p.x+100,p.y+50,0.5+Math.sin(p.a*2+i)*0.3,0,Math.PI*2);ex.fillStyle='rgba(201,168,76,'+((.1+.15*Math.sin(p.a*1.5+i)).toFixed(2))+')';ex.fill()});
  requestAnimationFrame(drawDust);
})();

/* ═══ PETALS ═══ */
const PETAL_SVG='<svg viewBox="0 0 12 16" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M6 0C3 4 0 8 6 16C12 8 9 4 6 0Z" fill="rgba(200,204,154,0.3)"/></svg>';
function spawnPetal(parent,cls){
  const el=document.createElement('div');el.className=cls;
  el.innerHTML=PETAL_SVG;el.style.position='fixed';
  const sz=.6+Math.random()*.8,dur=9+Math.random()*10,dl=Math.random()*5;
  el.style.cssText+='left:'+Math.random()*100+'%;top:-20px;font-size:'+sz+'rem;animation-duration:'+dur+'s;animation-delay:'+dl+'s;opacity:0;pointer-events:none;z-index:10;animation-name:spfall;animation-timing-function:linear;animation-iteration-count:1;animation-fill-mode:forwards';
  (parent||document.body).appendChild(el);setTimeout(()=>el.remove(),(dur+dl+1)*1000);
}
for(let i=0;i<6;i++)spawnPetal(null,'ipetal');
const ipt=setInterval(()=>spawnPetal(null,'ipetal'),1500);

/* ═══ ENVELOPE ═══
   Opening the envelope itself (setting localStorage, revealing #site,
   calling initSite()) is owned entirely by index.html's isolated gate
   script (window.openEnvelope=openEnv) — that copy also knows how to
   continue to a subpage via ?next=. A near-duplicate implementation used
   to live here too; since main.js loads after the gate script and both
   declare a top-level `openEnvelope`, this one would silently win the
   race and clobber window.openEnvelope, skipping the ?next= continuation
   (and never marking the envelope as opened in localStorage). Removed —
   single source of truth now. */

/* ═══ TOAST ═══ */
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3500);
}

/* ═══ LIGHTBOX — swipeable gallery viewer ═══ */
let _lbPhotos=[],_lbIndex=0,_lbTimer=null;

function _lbCollect(){
  _lbPhotos=[...document.querySelectorAll('#galleryMosaic .g-cell[data-full]:not([aria-hidden="true"])')].map(c=>c.dataset.full);
}
function _lbShow(i,instant){
  if(!_lbPhotos.length)return;
  _lbIndex=(i+_lbPhotos.length)%_lbPhotos.length;
  const img=document.getElementById('lbImg');
  const counter=document.getElementById('lbCounter');
  if(counter)counter.textContent=(_lbIndex+1)+' of '+_lbPhotos.length;
  if(instant){img.src=_lbPhotos[_lbIndex];return;}
  img.classList.add('switching');
  const next=new Image();
  next.onload=()=>{img.src=next.src;img.classList.remove('switching');};
  next.src=_lbPhotos[_lbIndex];
  // Preload neighbours for instant swiping
  [_lbIndex+1,_lbIndex-1].forEach(n=>{
    const p=new Image();p.src=_lbPhotos[(n+_lbPhotos.length)%_lbPhotos.length];
  });
}
function openLightbox(cell){
  _lbCollect();
  if(!_lbPhotos.length)return;
  const idx=cell&&cell.dataset&&cell.dataset.full?_lbPhotos.indexOf(cell.dataset.full):0;
  document.getElementById('lightbox').classList.add('open');
  _lbShow(idx<0?0:idx,true);
  [_lbIndex+1,_lbIndex-1].forEach(n=>{
    const p=new Image();p.src=_lbPhotos[(n+_lbPhotos.length)%_lbPhotos.length];
  });
}
function lbStep(dir){_lbShow(_lbIndex+dir)}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  _lbStopSlideshow();
}
function lbToggleSlideshow(){
  if(_lbTimer){_lbStopSlideshow();return;}
  const btn=document.getElementById('lbPlay');
  if(btn){btn.classList.add('on');btn.textContent='Pause';}
  _lbTimer=setInterval(()=>lbStep(1),3200);
}
function _lbStopSlideshow(){
  if(_lbTimer){clearInterval(_lbTimer);_lbTimer=null;}
  const btn=document.getElementById('lbPlay');
  if(btn){btn.classList.remove('on');btn.textContent='Slideshow';}
}
document.addEventListener('keydown',e=>{
  const lb=document.getElementById('lightbox');
  if(!lb||!lb.classList.contains('open'))return;
  if(e.key==='Escape')closeLightbox();
  else if(e.key==='ArrowRight')lbStep(1);
  else if(e.key==='ArrowLeft')lbStep(-1);
});
// Touch swipe left/right
(function(){
  const lb=document.getElementById('lightbox');
  if(!lb)return;
  let sx=0,sy=0,swiping=false;
  lb.addEventListener('touchstart',e=>{
    if(e.touches.length!==1)return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;swiping=true;
  },{passive:true});
  lb.addEventListener('touchend',e=>{
    if(!swiping)return;swiping=false;
    const dx=e.changedTouches[0].clientX-sx;
    const dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.4)lbStep(dx<0?1:-1);
  },{passive:true});
})();

/* ═══ CONFETTI ═══ */
function launchConfetti(){
  const colors=['#6b7045','#c9a84c','#e2c87a','#6b2030','#d8c8a0','#8a9058','#c8cc9a'];
  for(let i=0;i<80;i++){
    const el=document.createElement('div');el.className='confetti';
    const c=colors[Math.floor(Math.random()*colors.length)];
    const x=Math.random()*100,dl=Math.random()*1.5,dur=2+Math.random()*2.5,sz=4+Math.random()*8;
    el.style.cssText='left:'+x+'vw;background:'+c+';width:'+sz+'px;height:'+(sz*.5)+'px;animation-duration:'+dur+'s;animation-delay:'+dl+'s;border-radius:'+(Math.random()>.5?'50%':'2px');
    document.body.appendChild(el);setTimeout(()=>el.remove(),(dl+dur+.5)*1000);
  }
}

/* ═══ FIREFLIES ═══ */
function spawnFireflies(container,count){
  for(let i=0;i<count;i++){
    const f=document.createElement('div');f.className='firefly';
    f.style.left=Math.random()*100+'%';f.style.top=Math.random()*100+'%';
    f.style.animationDelay=(-Math.random()*8)+'s';f.style.animationDuration=(6+Math.random()*6)+'s';
    container.appendChild(f);
  }
}

/* ═══ SITE INIT ═══ */
function initSite(){
  // Stop the envelope-intro petal shower — the intro is gone by now
  // regardless of which path revealed the site.
  clearInterval(ipt);

  // Countdown with flip
  const target=new Date('2027-03-20T11:00:00');
  let prevVals={d:'',h:'',m:'',s:''};
  function tick(){
    const diff=target-new Date();if(diff<=0)return;
    const vals={
      d:String(Math.floor(diff/86400000)).padStart(3,'0'),
      h:String(Math.floor((diff%86400000)/3600000)).padStart(2,'0'),
      m:String(Math.floor((diff%3600000)/60000)).padStart(2,'0'),
      s:String(Math.floor((diff%60000)/1000)).padStart(2,'0')
    };
    ['d','h','m','s'].forEach(k=>{
      const el=document.getElementById('cd-'+k);
      if(el&&vals[k]!==prevVals[k]){el.textContent=vals[k];el.classList.remove('flip');void el.offsetWidth;el.classList.add('flip')}
    });
    prevVals=vals;
  }
  // Countdown only exists in the hero section — skip entirely on other pages
  if(document.getElementById('cd-d')){tick();setInterval(tick,1000)}

  // Scroll reveal
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target)}})},{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

  // Nav
  const nav=document.getElementById('mainNav');
  const secs=[...document.querySelectorAll('section[id]')];
  addEventListener('scroll',()=>{
    nav.classList.toggle('compact',scrollY>60);
    const y=scrollY+120;
    secs.forEach(s=>{const a=nav.querySelector('a[href="#'+s.id+'"]');if(a)a.classList.toggle('active',y>=s.offsetTop&&y<s.offsetTop+s.offsetHeight)});
    updateScrollProgress();
  },{passive:true});

  // Petals
  const pl=document.getElementById('petalLayer');
  function spawnSP(){spawnPetal(pl,'sp')}
  for(let i=0;i<5;i++)spawnSP();setInterval(spawnSP,2000);

  // Photo slideshow
  const slides=document.querySelectorAll('.slide');
  const dotsC=document.getElementById('slideDots');
  let curSlide=0;
  slides.forEach((_,i)=>{const d=document.createElement('button');d.className='slide-dot'+(i===0?' active':'');d.setAttribute('aria-label','Slide '+(i+1));d.onclick=()=>goSlide(i);dotsC.appendChild(d)});
  function goSlide(n){slides[curSlide].classList.remove('active');document.querySelectorAll('.slide-dot')[curSlide].classList.remove('active');curSlide=n;slides[curSlide].classList.add('active');document.querySelectorAll('.slide-dot')[curSlide].classList.add('active')}
  if(slides.length>1)setInterval(()=>goSlide((curSlide+1)%slides.length),4500);

  // 3D Particle Names
  setTimeout(initNames3D, 400);

  // Fireflies in dark sections
  ['story','countdown','gallery'].forEach(id=>{const el=document.getElementById(id);if(el){el.style.position='relative';spawnFireflies(el,6)}});

  // Gallery 3D tilt
  document.querySelectorAll('.g-cell').forEach(cell=>{
    cell.addEventListener('mousemove',e=>{const r=cell.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;cell.style.transform='scale(1.02) perspective(600px) rotateY('+(x*8)+'deg) rotateX('+(-y*8)+'deg)'});
    cell.addEventListener('mouseleave',()=>{cell.style.transform=''});
  });

  // Hero date typewriter + countdown label scramble (both loop)
  typeHeroDate();
  scrambleCountdownLabel();

  // Guest portal
  initGuestPortal();

  // Returning guest who already responded → thank-you state, not the form again
  try{if(localStorage.getItem('wdg_rsvp_done')==='1')applyRsvpThanksState()}catch(e){}

  // Music: try to start automatically; if the browser blocks it, offer the play pill
  setTimeout(attemptAutoplay,900);
}

/* ═══ WEATHER WIDGET ═══ */
(function fetchWeather(){
  const WX_URL='https://api.open-meteo.com/v1/forecast?latitude=6.4584&longitude=7.5464&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature&timezone=Africa%2FLagos';
  const CODE_MAP={
    0:['Clear Sky','sun'],1:['Mainly Clear','sun'],2:['Partly Cloudy','cloud-sun'],3:['Overcast','cloud'],
    45:['Foggy','cloud'],48:['Icy Fog','cloud'],
    51:['Light Drizzle','drizzle'],53:['Drizzle','drizzle'],55:['Heavy Drizzle','drizzle'],
    61:['Light Rain','rain'],63:['Rain','rain'],65:['Heavy Rain','rain'],
    80:['Rain Showers','rain'],81:['Showers','rain'],82:['Heavy Showers','rain'],
    95:['Thunderstorm','storm'],96:['Thunderstorm','storm'],99:['Thunderstorm','storm']
  };
  const ICONS={
    sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    'cloud-sun':'<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="3"/><path d="M5 19a5 5 0 0 1 0-10 5.5 5.5 0 0 1 11 .5A4.5 4.5 0 0 1 17.5 19z"/></svg>',
    cloud:'<svg viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></svg>',
    drizzle:'<svg viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/><line x1="8" y1="22" x2="8" y2="24" stroke-width="2"/><line x1="12" y1="22" x2="12" y2="24" stroke-width="2"/><line x1="16" y1="22" x2="16" y2="24" stroke-width="2"/></svg>',
    rain:'<svg viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/><polyline points="8 22 8 28" stroke-width="1.5"/><polyline points="12 22 12 28" stroke-width="1.5"/><polyline points="16 22 16 28" stroke-width="1.5"/></svg>',
    storm:'<svg viewBox="0 0 24 24"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>'
  };
  fetch(WX_URL)
    .then(r=>r.json())
    .then(d=>{
      const c=d.current;
      const code=c.weather_code;
      const [desc,iconKey]=CODE_MAP[code]||['Partly Cloudy','cloud-sun'];
      document.getElementById('wx-temp').textContent=Math.round(c.temperature_2m);
      document.getElementById('wx-cond').textContent=desc;
      document.getElementById('wx-feels').textContent=Math.round(c.apparent_temperature)+'°';
      document.getElementById('wx-hum').textContent=c.relative_humidity_2m;
      document.getElementById('wx-wind').textContent=c.wind_speed_10m;
      document.getElementById('wx-icon').innerHTML=ICONS[iconKey]||ICONS.sun;
      document.getElementById('weather-widget').classList.add('wx-loaded');
      // Refresh every 15 minutes
      setTimeout(fetchWeather,15*60*1000);
    })
    .catch(()=>{
      document.getElementById('wx-cond').textContent='Unavailable';
      document.getElementById('weather-widget').classList.add('wx-loaded');
    });
})();

/* ═══ 3D PARTICLE NAMES (lightweight 2D canvas — no libraries) ═══ */
async function initNames3D(){
  const oldCanvas=document.getElementById('names-3d-canvas');
  if(oldCanvas)oldCanvas.remove();
  // On portrait mobile the horizontal FOV is too narrow for the wide particle canvas —
  // restore the CSS shimmer text fallback which is fully visible on small screens.
  if(window.innerWidth<600){
    document.getElementById('hero')?.classList.remove('has-3d-names');
    return;
  }

  const hero=document.getElementById('hero');
  if(!hero)return; // hero only exists on the homepage
  const namesEl=hero.querySelector('.h-names');
  if(!namesEl)return;

  try{await document.fonts.load('italic 80px "Great Vibes"')}catch(e){}
  await new Promise(r=>setTimeout(r,200));

  const W=hero.offsetWidth, H=hero.offsetHeight;
  if(W<1||H<1)return;

  // ── Scale sampling canvas to viewport so names look consistent on any screen ──
  const OW=Math.max(680, Math.min(Math.round(W*1.18), 1350));
  const OH=Math.round(OW/3.4);
  const fontPx=Math.round(OW/6.2);    // bigger, bolder strokes
  const GAP=3;                        // CPU renderer: 3px sampling keeps particle count comfortable
  const scaleFactor=0.90;

  const off=document.createElement('canvas');
  off.width=OW; off.height=OH;
  const ox=off.getContext('2d');
  ox.font=`italic ${fontPx}px "Great Vibes"`;
  ox.fillStyle='#fff';
  ox.textAlign='center';
  ox.textBaseline='middle';
  ox.fillText('Chelsea & Gabriel', OW/2, OH/2);

  const imgData=ox.getImageData(0,0,OW,OH);
  const particles=[];
  for(let y=0;y<OH;y+=GAP){
    for(let x=0;x<OW;x+=GAP){
      const idx=(y*OW+x)*4;
      if(imgData.data[idx+3]>50){
        particles.push({
          ox:(x-OW/2)*scaleFactor,
          oy:-(y-OH/2)*scaleFactor,
          oz:(Math.random()-.5)*50,
          ph:Math.random()*Math.PI*2,
          str:imgData.data[idx+3]/255
        });
      }
    }
  }
  if(particles.length<20)return;

  const canvas=document.createElement('canvas');
  canvas.id='names-3d-canvas';
  hero.appendChild(canvas);
  hero.classList.add('has-3d-names');

  const dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');
  ctx.scale(dpr,dpr);

  // ── Pre-tinted sprite atlas: 8 gradient discs along the olive→gold ramp ──
  const SPR=24, LEVELS=8;
  const atlas=document.createElement('canvas');
  atlas.width=SPR*LEVELS; atlas.height=SPR;
  const ax=atlas.getContext('2d');
  for(let l=0;l<LEVELS;l++){
    const tt=l/(LEVELS-1);
    // Bright gold-to-champagne ramp — dark olive stops disappear against the hero photo
    const r=Math.round((0.76+tt*0.22)*255), g=Math.round((0.63+tt*0.26)*255), b=Math.round((0.26+tt*0.38)*255);
    const grd=ax.createRadialGradient(l*SPR+SPR/2,SPR/2,0,l*SPR+SPR/2,SPR/2,SPR/2);
    grd.addColorStop(0,'rgba('+r+','+g+','+b+',1)');
    grd.addColorStop(0.82,'rgba('+r+','+g+','+b+',1)');
    grd.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
    ax.fillStyle=grd; ax.fillRect(l*SPR,0,SPR,SPR);
  }
  particles.forEach(p=>{p.lvl=Math.min(LEVELS-1,Math.floor(p.str*LEVELS)+2)});

  const F=1400;                       // focal length for perspective projection
  const cx=W/2, cy=H/2;
  // Fit the sampled text into the hero width (the old THREE camera did this via FOV)
  const fit=Math.min(1,(W*0.84)/(OW*scaleFactor));
  // Mid-size "gold dust" particles — big enough to shimmer, small enough that the script stays legible
  const pSize=Math.max(5, OW/120)*fit;

  // Mouse / touch parallax
  let mx=0, my=0;
  window.addEventListener('mousemove',e=>{
    mx=(e.clientX/window.innerWidth-.5)*2;
    my=(e.clientY/window.innerHeight-.5)*2;
  });
  window.addEventListener('touchmove',e=>{
    if(e.touches.length>0){
      mx=(e.touches[0].clientX/window.innerWidth-.5)*2;
      my=(e.touches[0].clientY/window.innerHeight-.5)*2;
    }
  },{passive:true});

  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t=0, fade=0, animRunning=true, camX=0, camY=0;
  const fadeStart=performance.now();

  function draw(){
    ctx.clearRect(0,0,W,H);
    // Gentle forward-facing sway (no full spin — letters stay readable)
    const ry=Math.sin(t*0.22)*0.13, rx=Math.sin(t*0.28)*0.07;
    const cosY=Math.cos(ry), sinY=Math.sin(ry), cosX=Math.cos(rx), sinX=Math.sin(rx);
    camX+=(mx*18-camX)*.04;
    camY+=(-my*12-camY)*.04;
    ctx.globalAlpha=fade;
    for(let i=0;i<particles.length;i++){
      const p=particles[i];
      // Per-particle ripple (living shimmer)
      const px=p.ox+Math.sin(t+p.ph)*1.8;
      const py=p.oy+Math.cos(t*.72+p.ph)*1.2;
      const pz=p.oz+Math.sin(t*.55+p.ph*.7)*14;
      // Rotate around Y then X, project with perspective
      const x1=px*cosY - pz*sinY, z1=px*sinY + pz*cosY;
      const y1=py*cosX - z1*sinX, z2=py*sinX + z1*cosX;
      const s=F/(F+z2), sz=pSize*s;
      ctx.drawImage(atlas, p.lvl*SPR,0,SPR,SPR, cx+(x1*fit-camX)*s-sz/2, cy-(y1*fit+camY)*s-sz/2, sz,sz);
    }
    ctx.globalAlpha=1;
  }
  function animate(){
    if(!animRunning)return;
    requestAnimationFrame(animate);
    t+=0.006;
    fade=Math.min((performance.now()-fadeStart)/1800,1)*0.96;
    draw();
  }
  if(reduceMotion){fade=.96;draw();}
  else animate();

  // Full reinit on resize (debounced) → keeps names sized consistently
  let rszTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(rszTimer);
    rszTimer=setTimeout(()=>{
      animRunning=false;
      initNames3D();
    },450);
  });
}

/* ═══ RSVP COUNTER ═══ */

/* ═══ PHOTO UPLOAD ═══ */
function previewPhoto(input){
  const file=input.files[0];if(!file)return;
  const preview=document.getElementById('uploadPreview');
  const img=document.getElementById('previewImg');
  const name=document.getElementById('previewName');
  img.src=URL.createObjectURL(file);
  name.textContent=file.name+' ('+Math.round(file.size/1024)+'KB)';
  preview.style.display='block';
}

// Drag-over highlight
document.addEventListener('DOMContentLoaded',()=>{
  const zone=document.getElementById('uploadZone');
  if(!zone)return;
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag')});
  zone.addEventListener('dragleave',()=>zone.classList.remove('drag'));
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag');const f=e.dataTransfer.files[0];if(f){document.getElementById('photoFile').files=e.dataTransfer.files;previewPhoto(document.getElementById('photoFile'))}});
});

async function uploadPhoto(){
  const file=document.getElementById('photoFile').files[0];
  if(!file){showToast('Please choose a photo first.');return}
  if(file.size>10*1024*1024){showToast('File too large. Max 10MB.');return}
  const name=document.getElementById('up-name').value.trim();
  const caption=document.getElementById('up-caption').value.trim();
  const btn=document.getElementById('uploadBtn');
  const bar=document.getElementById('uploadProgressBar');
  const prog=document.getElementById('uploadProgress');
  btn.disabled=true;btn.querySelector('span').textContent='Uploading…';
  prog.style.display='block';bar.style.width='30%';
  const ext=file.name.split('.').pop();
  const path='guest-photos/'+Date.now()+'-'+(name||'guest').replace(/\s+/g,'-').toLowerCase()+'.'+ext;
  const {error:upErr}=await supabase.storage.from('wedding-photos').upload(path,file,{contentType:file.type,upsert:false});
  if(upErr){btn.disabled=false;btn.querySelector('span').textContent='Share This Photo';prog.style.display='none';showToast('Upload failed. Please try again.');return}
  bar.style.width='80%';
  await supabase.from('photos').insert({uploader_name:name||'A guest',file_path:path,caption:caption||null});
  bar.style.width='100%';
  setTimeout(()=>{
    btn.disabled=false;btn.querySelector('span').textContent='Share This Photo';
    prog.style.display='none';bar.style.width='0%';
    document.getElementById('uploadPreview').style.display='none';
    document.getElementById('photoFile').value='';
    document.getElementById('up-name').value='';
    document.getElementById('up-caption').value='';
    showToast('Photo shared — thank you! 💛');
    launchConfetti();
  },500);
}

/* ═══ CALENDAR FUNCTIONS ═══ */
function addToGoogleCalendar(){
  const p=[
    'action=TEMPLATE',
    'text='+encodeURIComponent("Chelsea & Gabriel's Wedding"),
    'dates=20270320T100000Z/20270320T220000Z',
    'details='+encodeURIComponent('You are invited to celebrate the wedding of Chelsea & Gabriel in Enugu, Nigeria. Traditional ceremony at 11:00 AM · Reception from 12:00 PM.'),
    'location='+encodeURIComponent('Enugu, Nigeria')
  ].join('&');
  window.open('https://calendar.google.com/calendar/render?'+p,'_blank');
  showToast('Opening Google Calendar…');
}

function addToAppleCalendar(){
  // webcal:// is handled natively by Calendar.app on iOS and macOS — no download needed
  window.open('webcal://gabfoundhisangel2027.netlify.app/event.ics');
  showToast('Opening Calendar app… tap Add Event to save 💛');
}

function addToOutlookCalendar(){
  const p=[
    'path=/calendar/action/compose',
    'rru=addevent',
    'subject='+encodeURIComponent("Chelsea & Gabriel's Wedding"),
    'startdt=2027-03-20T11:00:00',
    'enddt=2027-03-20T22:00:00',
    'body='+encodeURIComponent('You are invited to celebrate the wedding of Chelsea & Gabriel in Enugu, Nigeria. Traditional ceremony at 11:00 AM.'),
    'location='+encodeURIComponent('Enugu, Nigeria')
  ].join('&');
  window.open('https://outlook.live.com/calendar/0/deeplink/compose?'+p,'_blank');
  showToast('Opening Outlook Calendar…');
}

/* ═══ WHATSAPP SHARE ═══ */
function shareWhatsApp(){
  const msg=encodeURIComponent('You\'re invited to Chelsea & Gabriel\'s Wedding 💛\n📅 March 20, 2027\n📍 Enugu, Nigeria\n\nOpen the invitation: '+window.location.href);
  window.open('https://wa.me/?text='+msg,'_blank');
}

/* ═══ FAQ TOGGLE ═══ */
/* The answer height is measured rather than capped at a fixed value — a long
   answer (the dress code, for one) was being clipped mid-sentence by the old
   300px ceiling. */
function faqFit(item){
  const a=item.querySelector('.faq-a');
  if(a)a.style.maxHeight=item.classList.contains('open')?a.scrollHeight+'px':'';
}

function toggleFaq(btn){
  const item=btn.closest('.faq-item');
  const isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el=>{
    el.classList.remove('open');
    faqFit(el);
  });
  if(!isOpen){
    item.classList.add('open');
    faqFit(item);
  }
}

/* Re-measure on resize so a rotation or width change cannot leave an open
   answer clipped at its old height. */
window.addEventListener('resize',()=>{
  document.querySelectorAll('.faq-item.open').forEach(faqFit);
});

/* ═══ COPY TO CLIPBOARD ═══ */
function copyText(text,btnId){
  if(!text||text==='Coming soon')return;
  navigator.clipboard.writeText(text).then(()=>{
    const btn=document.getElementById(btnId);
    const orig=btn.textContent;btn.textContent='Copied!';btn.classList.add('copied');
    showToast('Copied to clipboard!');
    setTimeout(()=>{btn.textContent=orig;btn.classList.remove('copied')},2500);
  }).catch(()=>showToast('Please copy manually: '+text));
}

/* ═══ RSVP SUBMIT ═══ */
async function submitRSVP(e){
  e.preventDefault();
  // Honeypot — silently reject if a bot filled the hidden field
  const hp=document.getElementById('f-website');
  if(hp&&hp.value.trim()){return;}

  const first=document.getElementById('f-first').value.trim();
  const last=document.getElementById('f-last').value.trim();
  const email=document.getElementById('f-email').value.trim();
  const attending=document.querySelector('input[name="attend"]:checked').value;
  const guests=parseInt(document.getElementById('f-guests').value,10);
  const meal=document.getElementById('f-meal').value;
  const msg=document.getElementById('f-msg').value.trim();
  const phone=(document.getElementById('f-phone')?.value||'').trim()||null;
  const song=(document.getElementById('f-song')?.value||'').trim()||null;

  // Basic validation
  if(!first||!email){showToast('Please fill in your name and email.');return}
  const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRe.test(email)){showToast('Please enter a valid email address.');return}

  // Turnstile check
  const tsToken=getTurnstileToken();
  if(!tsToken){
    showToast('Please complete the verification check above.');
    return;
  }

  const btn=document.getElementById('rsvpBtn');
  btn.classList.add('saving');
  btn.querySelector('span').textContent='Saving…';

  // ── All-in-one: verify Turnstile + save to DB + notify Gabriel (edge function) ──
  const {data:fnData,error:fnErr}=await supabase.functions.invoke('rsvp-notify',{
    body:{
      turnstile_token:tsToken,
      record:{first_name:first,last_name:last,email:email,attending:attending,guests:guests,meal_preference:meal,message:msg,phone:phone,song_request:song}
    }
  });
  const apiError=fnErr?.message||fnData?.error;
  if(apiError){
    btn.classList.remove('saving');
    btn.querySelector('span').textContent='Confirm My Attendance';
    if(apiError.includes('Verification')){
      showToast('Verification expired. Please try again.');
      if(window.turnstile)window.turnstile.reset();
      window.__tsToken=null;
    }else{
      showToast(apiError||'Something went wrong. Please try again.');
    }
    return;
  }
  applyRsvpThanksState();
  try{localStorage.setItem('wdg_rsvp_done','1')}catch(e){}
  document.getElementById('rsvp').scrollIntoView({behavior:'smooth',block:'start'});
  launchConfetti();
  showToast(attending==='yes'?'We can\'t wait to see you! 💛':'We\'ll miss you!');
}

/* ═══ ASO-EBI ORDER PORTAL ═══
   A guided, step-by-step ordering flow. Everything below is driven by
   AO_CATALOG and AO_PAYMENT — adding a family, a gender variant, an
   accessory or a payment method is a data change, not a markup change.

   AO_CATALOG here is presentation only (images, copy). The attire-order
   edge function keeps its own authoritative copy and re-derives every name
   it stores from that, so a new entry must be added on the server too
   before it can actually be ordered. */
const AO_CATALOG={
  groom:{
    id:'groom',
    label:"Groom's Family / Friends",
    blurb:'Standing with Gabriel — emerald green, worn by his family and friends.',
    image:'photos/asoebi-groom.jpg',
    swatch:['#3f5c22','#dcd9b0'],
    askGender:true,
    variants:{
      male:{
        fabric:{name:'Pale Mint',colour:'Soft mint green, woven texture',image:'photos/asoebi-groom-male.jpg',
          detail:'A soft mint green with a subtle woven damask, cut for kaftans, senators and agbada.'},
        accessory:{type:'cap',name:'Matching Cap',image:'photos/asoebi-gele-cap.jpg',
          blurb:'The matching cap, cut from the same run of cloth.'}
      },
      female:{
        fabric:{name:'Emerald Green',colour:'Emerald green sequinned lace',image:'photos/asoebi-groom-female.jpg',
          detail:'A deep emerald lace under a wash of sequins, cut for iro and buba or a fitted gown.'},
        accessory:{type:'gele',name:'Matching Gele',image:'photos/asoebi-gele-cap.jpg',
          blurb:'The matching gele, cut from the same run of cloth.'}
      }
    }
  },
  bride:{
    id:'bride',
    label:"Bride's Family / Friends",
    blurb:"Standing with Chelsea — burgundy and gold, worn by her family and friends.",
    image:'photos/asoebi-bride.jpg',
    swatch:['#6b1f3a','#c9a84c'],
    askGender:false,
    implicitGender:'female',
    variants:{
      female:{
        fabric:{name:'Burgundy & Gold',colour:'Burgundy and gold floral lace',image:'photos/asoebi-bride.jpg',
          detail:'A burgundy and gold sequinned floral lace, cut for iro and buba or a fitted gown.'},
        accessory:null
      }
    }
  }
};

/* Each region declares the currencies it serves, so choosing naira shows the
   Nigerian account and nothing else. `mark`/`brand` render a small brand tile
   beside each method — drawn from letterforms and brand colours rather than
   the providers' own artwork. */
const AO_PAYMENT=[
  {region:'United States',flag:'🇺🇸',currencies:['USD','GBP','EUR','CAD'],methods:[
    {id:'paypal',name:'PayPal',mark:'P',brand:'linear-gradient(135deg,#009CDE,#002F86)',
     fields:[{label:'PayPal',value:'gabriell778'}]},
    {id:'zelle',name:'Zelle',mark:'Z',brand:'linear-gradient(135deg,#8A47E0,#6D1ED4)',
     fields:[{label:'Zelle',value:'adeyinkaaladegbemi@gmail.com'}]}
  ]},
  {region:'Nigeria',flag:'🇳🇬',currencies:['NGN'],methods:[
    {id:'wema',name:'Wema Bank',mark:'W',brand:'linear-gradient(135deg,#8E3B8E,#5B1F55)',
     fields:[
      {label:'Bank',value:'Wema Bank',copy:false},
      {label:'Account Name',value:'Gbolahan Sodiq Badejo'},
      {label:'Account Number',value:'0253637011'}
    ]}
  ]}
];

/* Regions valid for the chosen currency. Falls back to showing everything if
   a currency has no dedicated account, so a guest is never left with none. */
/* Colour names come from AO_CATALOG, so this card can never contradict the
   fabric shown in the order form directly beneath it. */
function renderAttireCard(){
  const g=AO_CATALOG.groom.variants, b=AO_CATALOG.bride.variants;
  const groomColours=`${aoEsc(g.male.fabric.name)} and ${aoEsc(g.female.fabric.name)}`;
  return `
  <p class="dc-note reveal in">Thank you for confirming — as one of our confirmed guests, this is your space for attire details.</p>
  <div class="locked-card reveal in" onclick="document.getElementById('attire-order').scrollIntoView({behavior:'smooth',block:'start'})">
    <span class="locked-icon">🧵</span>
    <div class="locked-title">Our Fabrics Are In!</div>
    <span class="locked-unlock">You already have access</span>
    <p class="locked-msg">Our aso-ebi is here — <strong>${groomColours}</strong> for the groom's side, <strong>${aoEsc(b.female.fabric.name)}</strong> for the bride's. Choose your side below to see the cloth and place your order.</p>
    <div class="locked-cta">Place My Order</div>
  </div>`;
}

function aoPaymentRegions(){
  const matched=AO_PAYMENT.filter(r=>r.currencies.includes(aoState.currency));
  return matched.length?matched:AO_PAYMENT;
}

function aoVisiblePaymentIds(){
  return aoPaymentRegions().reduce((ids,r)=>ids.concat(r.methods.map(m=>m.id)),[]);
}

const AO_FIELDS=[
  {id:'firstName',label:'First Name',type:'text',auto:'given-name',required:true,half:true},
  {id:'lastName',label:'Last Name',type:'text',auto:'family-name',required:true,half:true},
  {id:'email',label:'Email Address',type:'email',auto:'email',required:true,
    hint:'Your order confirmation is sent here.'},
  {id:'phone',label:'Phone Number',type:'tel',auto:'tel',required:true},
  {id:'shippingAddress',label:'Shipping Address',type:'text',auto:'street-address',required:true},
  {id:'city',label:'City',type:'text',auto:'address-level2',required:true,half:true},
  {id:'state',label:'State / Region',type:'text',auto:'address-level1',required:false,half:true},
  {id:'postalCode',label:'ZIP / Postal Code',type:'text',auto:'postal-code',required:false,half:true},
  {id:'country',label:'Country',type:'text',auto:'country-name',required:true,half:true}
];

/* Pricing. USD is the currency of record — every other figure shown is a
   live conversion for the guest's convenience, and the server recomputes the
   total from its own copy of these numbers rather than trusting the client. */
const AO_PRICE_PER_YARD_USD=9;      // $45 for the standard 5 yards
const AO_DEFAULT_YARDS=5;
const AO_MIN_YARDS=1;
const AO_MAX_YARDS=20;
const AO_ACCESSORY_PRICE_USD=5;     // flat, regardless of yardage

/* Stated wherever a guest is deciding or about to pay, so the cutoff is never
   something they only learn from the announcement email. */
const AO_ORDER_DEADLINE='30 November 2026';

function aoDeadlineBanner(){
  return `<div class="ao-deadline">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/></svg>
      <span>Orders close <strong>${AO_ORDER_DEADLINE}</strong> — the cloth has to be cut, shipped and sewn in time for the day.</span>
    </div>`;
}

const AO_CURRENCIES=[
  {code:'USD',label:'US Dollar',flag:'🇺🇸'},
  {code:'NGN',label:'Nigerian Naira',flag:'🇳🇬'},
  {code:'GBP',label:'British Pound',flag:'🇬🇧'},
  {code:'EUR',label:'Euro',flag:'🇪🇺'},
  {code:'CAD',label:'Canadian Dollar',flag:'🇨🇦'}
];

/* Country → currency for the initial guess. Anywhere not listed falls back to
   USD, and the guest can always override with the selector. */
const AO_COUNTRY_CURRENCY={NG:'NGN',GB:'GBP',CA:'CAD',
  IE:'EUR',FR:'EUR',DE:'EUR',ES:'EUR',IT:'EUR',NL:'EUR',BE:'EUR',PT:'EUR',AT:'EUR'};

let _aoRates=null,_aoRatesTried=false;

async function aoLoadRates(){
  if(_aoRates||_aoRatesTried)return _aoRates;
  _aoRatesTried=true;
  try{
    const r=await fetch('https://open.er-api.com/v6/latest/USD');
    const d=await r.json();
    if(d&&d.rates)_aoRates=d.rates;
  }catch(e){/* offline or blocked — prices simply stay in USD */}
  return _aoRates;
}

async function aoDetectCurrency(){
  try{
    const r=await fetch('https://ipapi.co/json/');
    const d=await r.json();
    const guess=AO_COUNTRY_CURRENCY[d&&d.country_code];
    if(guess&&guess!==aoState.currency&&!aoState.currencyTouched){
      aoState.currency=guess;
      if(document.getElementById('ao-price-card'))aoRender();
    }
  }catch(e){/* detection is best-effort; the selector remains authoritative */}
}

/* Warm every fabric and accessory image while the guest is still choosing a
   side, so the cloth is on screen the instant they get to it rather than
   arriving at an empty frame. */
function aoPreloadImages(){
  const urls=new Set();
  Object.values(AO_CATALOG).forEach(fam=>{
    Object.values(fam.variants).forEach(v=>{
      if(v.fabric&&v.fabric.image)urls.add(v.fabric.image);
      if(v.accessory&&v.accessory.image)urls.add(v.accessory.image);
    });
  });
  urls.forEach(src=>{const img=new Image();img.decoding='async';img.src=src});
}

/* Rates first so converted prices appear immediately, then the IP guess —
   which only applies if the guest has not already picked a currency. */
async function aoInitPricing(){
  await aoLoadRates();
  if(document.getElementById('ao-price-card'))aoRender();
  aoDetectCurrency();
}

function aoSetCurrency(code){
  aoState.currency=code;
  aoState.currencyTouched=true;   // stop IP detection from overriding a choice
  // Switching currency can withdraw the account a guest already picked; drop
  // it rather than letting a hidden method stay selected.
  if(aoState.paymentMethod&&aoVisiblePaymentIds().indexOf(aoState.paymentMethod)===-1){
    aoState.paymentMethod=null;
  }
  aoRender();
}

/* Formats a USD amount in the guest's chosen currency. Falls back to USD if
   the rate table has not loaded, so a price is never blank or wrong. */
function aoMoney(usd){
  const cur=aoState.currency;
  if(cur==='USD'||!_aoRates||!_aoRates[cur]){
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(usd);
  }
  const amount=usd*_aoRates[cur];
  // narrowSymbol only for NGN — it renders the bare code otherwise. Leaving
  // the other currencies on the default keeps CA$ distinct from US $.
  const opts={style:'currency',currency:cur,maximumFractionDigits:cur==='NGN'?0:2};
  if(cur==='NGN')opts.currencyDisplay='narrowSymbol';
  try{
    return new Intl.NumberFormat('en-US',opts).format(amount);
  }catch(e){
    return `${cur} ${amount.toFixed(2)}`;
  }
}

function aoTotals(){
  const v=aoVariant();
  const accessory=v&&v.accessory?AO_ACCESSORY_PRICE_USD:0;
  const fabric=aoState.yards*AO_PRICE_PER_YARD_USD;
  return {fabric,accessory,total:fabric+accessory};
}

function aoAdjustYards(delta){
  const next=Math.min(AO_MAX_YARDS,Math.max(AO_MIN_YARDS,aoState.yards+delta));
  if(next===aoState.yards)return;
  aoState.yards=next;
  aoRender();
}

function aoYardsPicker(){
  const y=aoState.yards;
  return `<div class="ao-yards">
      <div class="ao-yards-head">
        <span class="ao-sum-title">How Many Yards?</span>
        <span class="ao-yards-rate">${aoMoney(AO_PRICE_PER_YARD_USD)} per yard</span>
      </div>
      <div class="ao-stepper">
        <button type="button" class="ao-step-btn" onclick="aoAdjustYards(-1)"
                ${y<=AO_MIN_YARDS?'disabled':''} aria-label="Fewer yards">&minus;</button>
        <span class="ao-stepper-val"><span class="ao-stepper-n">${y}</span><span class="ao-stepper-u">yards</span></span>
        <button type="button" class="ao-step-btn" onclick="aoAdjustYards(1)"
                ${y>=AO_MAX_YARDS?'disabled':''} aria-label="More yards">+</button>
      </div>
      <p class="ao-yards-hint">Most guests order ${AO_DEFAULT_YARDS} yards — enough for iro and buba, a gown, or a kaftan. Ask your tailor if you are unsure.</p>
    </div>`;
}

function aoPriceCard(){
  const v=aoVariant();
  if(!v)return '';
  const t=aoTotals();
  const chips=AO_CURRENCIES.map(c=>{
    const on=aoState.currency===c.code;
    return `<button type="button" class="ao-cur-chip${on?' is-selected':''}" title="${aoEsc(c.label)}"
              onclick="aoSetCurrency('${c.code}')" aria-pressed="${on}">
        <span class="ao-cur-flag" aria-hidden="true">${c.flag}</span>
        <span class="ao-cur-code">${c.code}</span>
      </button>`;
  }).join('');
  const usdNote=aoState.currency!=='USD'
    ? `<p class="ao-price-note">Charged in US dollars (${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(t.total)}). Converted amounts are indicative and move with the exchange rate.</p>`
    : '';
  return `<div class="ao-price-card" id="ao-price-card">
      <span class="ao-sum-title">Your Order</span>
      <div class="ao-cur">
        <span class="ao-cur-lbl">Show prices in</span>
        <div class="ao-cur-chips" role="group" aria-label="Display currency">${chips}</div>
      </div>
      <div class="ao-sum-row"><span>${aoEsc(v.fabric.name)} · ${aoState.yards} ${aoState.yards===1?'yard':'yards'}</span><span>${aoMoney(t.fabric)}</span></div>
      ${v.accessory?`<div class="ao-sum-row"><span>${aoEsc(v.accessory.name)}</span><span>${aoMoney(t.accessory)}</span></div>`:''}
      <div class="ao-sum-row ao-sum-row--total"><span>Total</span><span>${aoMoney(t.total)}</span></div>
      ${usdNote}
    </div>`;
}

const AO_MAX_PROOF_BYTES=10*1024*1024;
const AO_PROOF_TYPES=['image/jpeg','image/png','image/webp','image/heic','application/pdf'];

const aoState={
  step:1,
  family:null,
  gender:null,
  guest:{},
  yards:AO_DEFAULT_YARDS,
  currency:'USD',
  currencyTouched:false,
  paymentMethod:null,
  proofFile:null,
  submitting:false,
  order:null
};

function aoFam(){return aoState.family?AO_CATALOG[aoState.family]:null}
function aoVariant(){
  const fam=aoFam();
  return fam&&aoState.gender?fam.variants[aoState.gender]:null;
}

/* The bride's side has no gender step, so the indicator is built from the
   chosen flow rather than a fixed list. */
function aoSteps(){
  const fam=aoFam();
  const withGender=!fam||fam.askGender;
  return withGender
    ? ['Family','Attire','Fabric','Details','Payment','Confirmation']
    : ['Family','Fabric','Details','Payment','Confirmation'];
}

function aoEsc(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function aoRenderSteps(){
  const el=document.getElementById('ao-steps');
  if(!el)return;
  const steps=aoSteps();
  el.innerHTML=steps.map((label,i)=>{
    const n=i+1;
    const cls=n===aoState.step?'ao-step is-current':n<aoState.step?'ao-step is-done':'ao-step';
    return `<li class="${cls}"><span class="ao-step-n">${String(n).padStart(2,'0')}</span><span class="ao-step-l">${label}</span></li>`;
  }).join('');
  el.setAttribute('aria-label',`Step ${aoState.step} of ${steps.length}: ${steps[aoState.step-1]||''}`);
}

function aoGo(step){
  aoState.step=step;
  aoRender();
  const wrap=document.getElementById('attire-order');
  if(wrap&&step>1)wrap.scrollIntoView({behavior:'smooth',block:'start'});
}

function aoSelectFamily(id){
  if(aoState.family!==id){
    aoState.family=id;
    const fam=AO_CATALOG[id];
    // Bride's side is female-only, so the gender step is skipped entirely.
    aoState.gender=fam.askGender?null:fam.implicitGender;
  }
  aoGo(2);
}

function aoSelectGender(g){
  aoState.gender=g;
  aoGo(3);
}

/* ── Panels ───────────────────────────────────────────────────────────── */

function aoPanelFamily(){
  const cards=Object.values(AO_CATALOG).map(f=>`
    <button type="button" class="ao-card ao-card--family${aoState.family===f.id?' is-selected':''}"
            onclick="aoSelectFamily('${f.id}')" aria-pressed="${aoState.family===f.id}">
      <span class="ao-card-body">
        <span class="ao-card-swatch" style="background:linear-gradient(135deg,${f.swatch[0]},${f.swatch[1]})"></span>
        <span class="ao-card-title">${aoEsc(f.label)}</span>
        <span class="ao-card-blurb">${aoEsc(f.blurb)}</span>
      </span>
      <span class="ao-tick" aria-hidden="true">✓</span>
    </button>`).join('');
  return `<div class="ao-panel-head"><h4 class="ao-q">Who are you representing?</h4>
    <p class="ao-sub">Choose the side you are standing with — it sets your colours for the day.</p></div>
    <div class="ao-cards ao-cards--2">${cards}</div>`;
}

function aoPanelGender(){
  const fam=aoFam();
  const opt=(g,label,blurb)=>`
    <button type="button" class="ao-card ao-card--gender${aoState.gender===g?' is-selected':''}"
            onclick="aoSelectGender('${g}')" aria-pressed="${aoState.gender===g}">
      <span class="ao-card-media"><img src="${fam.variants[g].fabric.image}" alt="${aoEsc(label)} aso-ebi" decoding="async"/></span>
      <span class="ao-card-body">
        <span class="ao-card-title">${label}</span>
        <span class="ao-card-blurb">${blurb}</span>
      </span>
      <span class="ao-tick" aria-hidden="true">✓</span>
    </button>`;
  return `<div class="ao-panel-head"><h4 class="ao-q">Select Your Attire</h4>
    <p class="ao-sub">${aoEsc(fam.label)}</p></div>
    <div class="ao-cards ao-cards--2">
      ${opt('male','Male','Fabric with a matching cap.')}
      ${opt('female','Female','Fabric with a matching gele.')}
    </div>
    <div class="ao-nav"><button type="button" class="ao-back" onclick="aoGo(1)">← Change family</button></div>`;
}

function aoPanelFabric(){
  const fam=aoFam(),v=aoVariant();
  if(!v)return aoPanelFamily();
  const acc=v.accessory;

  const accBlock=acc?`
    <div class="ao-item ao-item--acc">
      <div class="ao-item-media"><img src="${acc.image}" alt="${aoEsc(acc.name)}" decoding="async"/></div>
      <div class="ao-item-body">
        <span class="ao-item-tag">Included with your attire</span>
        <h5 class="ao-item-name">${aoEsc(acc.name)}</h5>
        <p class="ao-item-desc">${aoEsc(acc.blurb)}</p>
      </div>
    </div>`:'';

  return `<div class="ao-panel-head"><h4 class="ao-q">${aoEsc(fam.label)}</h4>
      <p class="ao-sub">${fam.askGender?(aoState.gender==='male'?'Male attire':'Female attire'):'Female attire'}</p></div>
    ${aoDeadlineBanner()}
    <div class="ao-item">
      <div class="ao-item-media"><img src="${v.fabric.image}" alt="${aoEsc(v.fabric.name)} fabric" decoding="async"/></div>
      <div class="ao-item-body">
        <span class="ao-item-tag">Your fabric</span>
        <h5 class="ao-item-name">${aoEsc(v.fabric.name)}</h5>
        <p class="ao-item-colour">${aoEsc(v.fabric.colour)}</p>
        <p class="ao-item-desc">${aoEsc(v.fabric.detail)}</p>
      </div>
    </div>
    ${accBlock}
    ${aoYardsPicker()}
    ${aoSummaryCard()}
    ${aoPriceCard()}
    <div class="ao-nav">
      <button type="button" class="ao-back" onclick="aoGo(${fam.askGender?2:1})">← Change selection</button>
      <button type="button" class="ao-next" onclick="aoGo(${fam.askGender?4:3})">Continue</button>
    </div>`;
}

function aoSummaryCard(){
  const fam=aoFam(),v=aoVariant();
  if(!fam||!v)return '';
  const row=(k,val)=>`<div class="ao-sum-row"><span>${k}</span><span>${aoEsc(val)}</span></div>`;
  return `<div class="ao-summary">
    <span class="ao-sum-title">Your Attire Selection</span>
    ${row('Family',fam.label)}
    ${fam.askGender?row('Attire',aoState.gender==='male'?'Male':'Female'):''}
    ${row('Fabric',`${v.fabric.name} · ${aoState.yards} ${aoState.yards===1?'yard':'yards'}`)}
    ${v.accessory?row(v.accessory.type==='cap'?'Matching Cap':'Matching Gele',v.accessory.name):''}
  </div>`;
}

function aoPanelDetails(){
  const fam=aoFam();
  const fields=AO_FIELDS.map(f=>{
    const val=aoState.guest[f.id]||'';
    return `<div class="ao-f${f.half?' ao-f--half':''}">
      <label class="ao-f-lbl" for="aof-${f.id}">${f.label}${f.required?'':' <span class="ao-opt">(optional)</span>'}</label>
      <input class="ao-f-in" id="aof-${f.id}" type="${f.type}" autocomplete="${f.auto}"
             value="${aoEsc(val)}" oninput="aoField('${f.id}',this.value)"/>
      ${f.hint?`<span class="ao-f-hint">${f.hint}</span>`:''}
    </div>`;
  }).join('');
  return `<div class="ao-panel-head"><h4 class="ao-q">Your Details</h4>
      <p class="ao-sub">Where your aso-ebi should be sent, and how we reach you.</p></div>
    ${aoSummaryCard()}
    <div class="ao-form">${fields}</div>
    <div class="ao-err" id="ao-err-details" hidden></div>
    <div class="ao-nav">
      <button type="button" class="ao-back" onclick="aoGo(${fam.askGender?3:2})">← Back</button>
      <button type="button" class="ao-next" onclick="aoValidateDetails()">Continue to Payment</button>
    </div>`;
}

function aoField(id,val){aoState.guest[id]=val}

function aoValidateDetails(){
  const err=document.getElementById('ao-err-details');
  for(const f of AO_FIELDS){
    if(f.required&&!(aoState.guest[f.id]||'').trim()){
      if(err){err.textContent=`${f.label} is required.`;err.hidden=false}
      const el=document.getElementById('aof-'+f.id);
      if(el){el.classList.add('is-bad');el.focus()}
      return;
    }
  }
  const email=(aoState.guest.email||'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
    if(err){err.textContent='Please enter a valid email address.';err.hidden=false}
    const el=document.getElementById('aof-email');
    if(el){el.classList.add('is-bad');el.focus()}
    return;
  }
  if(err)err.hidden=true;
  aoGo(aoFam().askGender?5:4);
}

function aoPanelPayment(){
  const fam=aoFam();
  const regions=aoPaymentRegions().map(r=>`
    <div class="ao-pay-region">
      <div class="ao-pay-region-h">${r.flag} ${r.region}</div>
      ${r.methods.map(m=>`
        <label class="ao-pay-method${aoState.paymentMethod===m.id?' is-selected':''}">
          <input type="radio" name="ao_pay" value="${m.id}" ${aoState.paymentMethod===m.id?'checked':''}
                 onchange="aoSetPayment('${m.id}')"/>
          <span class="ao-pay-dot" aria-hidden="true"></span>
          <span class="ao-pay-body">
            <span class="ao-pay-head">
              <span class="ao-pay-logo" style="background:${m.brand}" aria-hidden="true">${m.mark}</span>
              <span class="ao-pay-name">${m.name}</span>
            </span>
            ${m.fields.map(f=>`
              <span class="ao-pay-row">
                <span class="ao-pay-k">${f.label}</span>
                <span class="ao-pay-v">${aoEsc(f.value)}</span>
                ${f.copy===false?'':`<button type="button" class="ao-copy" data-copy="${aoEsc(f.value)}"
                   onclick="event.preventDefault();event.stopPropagation();aoCopy(this)">Copy</button>`}
              </span>`).join('')}
          </span>
        </label>`).join('')}
    </div>`).join('');

  const file=aoState.proofFile;
  const fileBlock=file?`
    <div class="ao-file-picked">
      <span class="ao-file-name">${aoEsc(file.name)}</span>
      <span class="ao-file-size">${(file.size/1024).toFixed(0)} KB</span>
      <button type="button" class="ao-file-x" onclick="aoRemoveFile()">Remove File</button>
    </div>`:`
    <label class="ao-file">
      <input type="file" id="ao-proof" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
             onchange="aoPickFile(this)"/>
      <span class="ao-file-cta">Upload Payment Screenshot</span>
      <span class="ao-file-hint">PNG · JPG · WebP · HEIC · PDF · Max 10MB</span>
    </label>`;

  return `<div class="ao-panel-head"><h4 class="ao-q">Payment</h4>
      <p class="ao-sub">Follow the steps below, then upload your receipt to place your order.</p></div>
    ${aoSummaryCard()}
    ${aoPriceCard()}

    <div class="ao-instructions">
      <span class="ao-sum-title">Payment Instructions</span>
      <ol>
        <li>Select the payment method you will use.</li>
        <li>Send the payment to the account shown.</li>
        <li>Save a screenshot or receipt of the completed payment.</li>
        <li>Upload that screenshot below.</li>
        <li>Place your order.</li>
        <li>We review your payment before your order is prepared for shipping.</li>
      </ol>
    </div>

    <span class="ao-sum-title ao-pay-title">Payment Information</span>
    <p class="ao-pay-scope">Showing the account for <strong>${aoState.currency}</strong>. Change the currency above to see other options.</p>
    <div class="ao-pay">${regions}</div>

    <div class="ao-proof">
      <span class="ao-sum-title">Proof of Payment</span>
      ${fileBlock}
    </div>

    <div class="ao-notice">
      <strong>Important:</strong> once you place your order you will receive a confirmation email
      saying it has been placed. Your payment must be verified before your order can be processed
      for shipping, so please include a screenshot or receipt as proof of payment.
    </div>

    ${aoDeadlineBanner()}
    <div class="ao-err" id="ao-err-pay" hidden></div>
    <div class="ao-nav">
      <button type="button" class="ao-back" onclick="aoGo(${fam.askGender?4:3})">← Back</button>
      <button type="button" class="ao-next ao-next--go" id="ao-submit" onclick="aoSubmit()">Place My Order</button>
    </div>`;
}

function aoSetPayment(id){
  aoState.paymentMethod=id;
  document.querySelectorAll('.ao-pay-method').forEach(l=>{
    l.classList.toggle('is-selected',l.querySelector('input').value===id);
  });
}

/* The value is read from a data attribute rather than inlined into the
   onclick, so an apostrophe in an account name can never break out of a
   string literal. */
function aoCopy(btn){
  const text=btn.dataset.copy||'';
  const done=()=>{
    const orig=btn.textContent;
    btn.textContent='Copied!';
    btn.classList.add('is-copied');
    setTimeout(()=>{btn.textContent=orig;btn.classList.remove('is-copied')},1600);
  };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>aoCopyFallback(text,done));
  }else{
    aoCopyFallback(text,done);
  }
}

function aoCopyFallback(text,done){
  try{
    const ta=document.createElement('textarea');
    ta.value=text;ta.setAttribute('readonly','');
    ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    const ok=document.execCommand('copy');
    document.body.removeChild(ta);
    ok?done():showToast('Could not copy — please copy it manually.');
  }catch(e){showToast('Could not copy — please copy it manually.')}
}

function aoPickFile(input){
  const f=input.files&&input.files[0];
  const err=document.getElementById('ao-err-pay');
  if(!f)return;
  if(!AO_PROOF_TYPES.includes(f.type)){
    if(err){err.textContent='Please upload a PNG, JPG, WebP, HEIC or PDF.';err.hidden=false}
    input.value='';return;
  }
  if(f.size>AO_MAX_PROOF_BYTES){
    if(err){err.textContent='That file is over 10MB. Please upload a smaller one.';err.hidden=false}
    input.value='';return;
  }
  if(err)err.hidden=true;
  aoState.proofFile=f;
  aoRender();
}

function aoRemoveFile(){
  aoState.proofFile=null;
  aoRender();
}

async function aoSubmit(){
  const err=document.getElementById('ao-err-pay');
  const btn=document.getElementById('ao-submit');
  const show=m=>{if(err){err.textContent=m;err.hidden=false}};

  if(aoState.submitting)return;            // guards against a double tap
  if(!_attireGuest){show('Please open this page from your private invitation link.');return}
  if(!aoState.paymentMethod){show('Please choose a payment method.');return}
  if(!aoState.proofFile){show('Please upload a screenshot or receipt of your payment.');return}

  aoState.submitting=true;
  if(err)err.hidden=true;
  if(btn){btn.disabled=true;btn.textContent='Placing your order…'}

  try{
    const f=aoState.proofFile;
    const ext=(f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5)||'jpg';
    const path=`proofs/${Date.now()}-${Math.random().toString(36).slice(2,10)}.${ext}`;

    const up=await supabase.storage.from('payment-proofs').upload(path,f,{contentType:f.type});
    if(up.error)throw new Error('We could not upload your screenshot. Please try again.');

    const res=await fetch('https://nakadctpdszskvooftln.supabase.co/functions/v1/attire-order',{
      method:'POST',
      headers:{'Authorization':'Bearer '+SUPABASE_ANON,'Content-Type':'application/json'},
      body:JSON.stringify({
        token:_guestToken,
        family:aoState.family,
        gender:aoState.gender,
        guest:aoState.guest,
        yards:aoState.yards,
        currency:aoState.currency,
        paymentMethod:aoState.paymentMethod,
        paymentProofPath:path
      })
    });
    const data=await res.json();
    if(!data.ok)throw new Error(data.error||'We could not place your order. Please try again.');

    aoState.order=data;
    try{localStorage.setItem('wdg_attire_order_done','1')}catch(e){}
    aoGo(aoFam().askGender?6:5);
  }catch(e){
    show(e.message||'Something went wrong. Please try again.');
    if(btn){btn.disabled=false;btn.textContent='Place My Order'}
    aoState.submitting=false;
  }
}

function aoPanelDone(){
  const o=aoState.order||{};
  const g=aoState.guest;
  const row=(k,v)=>v?`<div class="ao-sum-row"><span>${k}</span><span>${aoEsc(v)}</span></div>`:'';
  return `<div class="ao-done">
      <span class="ao-done-mark" aria-hidden="true">✓</span>
      <h4 class="ao-q">Order Received</h4>
      <p class="ao-sub">Thank you — your Aso-Ebi order has been submitted.</p>
      <span class="ao-order-no">${aoEsc(o.orderNumber||'')}</span>
    </div>
    <div class="ao-summary ao-summary--final">
      ${row('Guest',`${g.firstName||''} ${g.lastName||''}`.trim())}
      ${row('Email',g.email)}
      ${row('Family',o.familyLabel)}
      ${aoFam()&&aoFam().askGender?row('Attire',aoState.gender==='male'?'Male':'Female'):''}
      ${row('Fabric',o.fabricName)}
      ${o.accessoryName?row(o.accessoryType==='cap'?'Matching Cap':'Matching Gele',o.accessoryName):''}
      ${row('Payment Method',o.paymentLabel)}
      ${row('Amount',o.amountLabel)}
      ${row('Payment Proof','Submitted')}
      ${row('Order Status','Order Placed')}
    </div>
    <div class="ao-track">
      ${['Order Placed','Payment Verification','Payment Confirmed','Preparing Order','Shipped','Delivered']
        .map((s,i)=>`<span class="ao-track-step${i===0?' is-current':''}">${s}</span>`).join('')}
    </div>
    <p class="ao-done-note">${o.emailSent
      ? `A confirmation has been sent to <strong>${aoEsc(g.email||'')}</strong>.`
      : `Your order is saved. If the confirmation email does not arrive, reply to any of our emails and we will resend it.`}
      Your payment will be verified before your order is prepared for shipping.</p>`;
}

function aoRender(){
  const panel=document.getElementById('ao-panel');
  if(!panel)return;
  const fam=aoFam();
  const gendered=!fam||fam.askGender;
  const s=aoState.step;
  let html;
  if(s===1)html=aoPanelFamily();
  else if(gendered&&s===2)html=aoPanelGender();
  else if(s===(gendered?3:2))html=aoPanelFabric();
  else if(s===(gendered?4:3))html=aoPanelDetails();
  else if(s===(gendered?5:4))html=aoPanelPayment();
  else html=aoPanelDone();
  panel.innerHTML=html;
  aoRenderSteps();
  if(aoState.paymentMethod)aoSetPayment(aoState.paymentMethod);
}

/* A guest who has ordered before gets a note, not a locked door — people
   order again for a partner, for extra yards, or to correct a mistake.
   Hiding the whole portal also meant one stale flag left nothing on screen
   but an empty card, which is exactly how this surfaced. */
function applyAttireOrderThanksState(){
  const body=document.getElementById('ao-portal-body');
  if(!body||document.getElementById('ao-prior-note'))return;
  const note=document.createElement('div');
  note.id='ao-prior-note';
  note.className='ao-prior-note';
  note.innerHTML='<strong>You have already placed an order.</strong> You are welcome to place another — for a partner, or for extra yards.';
  body.insertBefore(note,body.firstChild);
}

/* Only lock scroll if the envelope intro is still showing — for a returning
   guest (or anyone reopening their portal link), the inline gate script has
   already skipped straight to the site before this line runs, and locking
   here with nothing left to unlock it would freeze scrolling forever. */
if(!document.getElementById('site').classList.contains('visible')){
  document.body.style.overflow='hidden';
}

/* toggleNavDD / navGoTo live in the inline <script> block in index.html
   so they are available immediately (before this async eval runs). */

// Track active section via IntersectionObserver — updates button label
(function(){
  const sections=[
    {id:'story',   en:'Our Story', ig:'Akụkọ Anyị',  yo:'Ìtàn Wa'},
    {id:'details', en:'Details',   ig:'Nkọwa',        yo:'Àlàyé'},
    {id:'dresscode',en:'Dress Code',ig:'Uwe',         yo:'Aṣọ'},
    {id:'venue',   en:'Venue',     ig:'Ebe ọzọ',      yo:'Ibi'},
    {id:'timeline',en:'Timeline',  ig:'Usoro Oge',    yo:'Àkókò'},
    {id:'rsvp',    en:'RSVP',      ig:'RSVP',         yo:'RSVP'},
    {id:'photos',  en:'Photos',    ig:'Foto',         yo:'Àwòrán'},
    {id:'faq',     en:'FAQ',       ig:'Ajụjụ',        yo:'FAQ'},
    {id:'travel',  en:'Travel',    ig:'Njem',         yo:'Ìrìnàjò'},
    {id:'gifts',   en:'Gifts',     ig:'Onyinye',      yo:'Ẹbùn'},
  ];
  const labels={en:'Explore',ig:'Chọpụta',yo:'Ṣàwárí'};
  let activeSec=null;

  function updateNavLabel(){
    const lbl=document.getElementById('navDDLabel');
    if(!lbl)return;
    const lang=window.currentLang||'en';
    lbl.textContent=activeSec?activeSec[lang]:(labels[lang]||'Explore');
    // highlight active item in menu
    document.querySelectorAll('.nav-dd-item').forEach(a=>{
      const href=a.getAttribute('href')||'';
      a.classList.toggle('nav-active',activeSec&&href==='#'+activeSec.id);
    });
  }

  const obs=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const found=sections.find(s=>s.id===entry.target.id);
        if(found){activeSec=found;updateNavLabel();}
      }
    });
  },{rootMargin:'-40% 0px -50% 0px',threshold:0});

  // Run after site is revealed
  const siteEl=document.getElementById('site');
  if(siteEl){
    new MutationObserver(()=>{
      if(siteEl.classList.contains('visible')){
        sections.forEach(s=>{const el=document.getElementById(s.id);if(el)obs.observe(el);});
      }
    }).observe(siteEl,{attributes:true,attributeFilter:['class']});
  }

  // Also update label when language changes
  const _origSetLang=window.setLang;
  if(typeof _origSetLang==='function'){
    window.setLang=function(lang){_origSetLang(lang);updateNavLabel();};
  }
})();
