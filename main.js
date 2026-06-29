/* ═══ SUPABASE ═══ */
const SUPABASE_URL='https://nakadctpdszskvooftln.supabase.co';
const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2FkY3RwZHN6c2t2b29mdGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDExMzcsImV4cCI6MjA5Mzg3NzEzN30.iNYd01ff_TKKmGRb0pTB3fch_EIavoGaOnXAJt36jms';
let supabase;
try{supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON)}catch(e){console.warn('Supabase init failed',e)}

/* ═══ TURNSTILE ═══ */
let turnstileToken=null;
function onTurnstileSuccess(token){turnstileToken=token;}
function onTurnstileExpired(){turnstileToken=null;}

/* ═══ GUEST PORTAL ═══ */
const _guestToken=(new URLSearchParams(location.search)).get('guest');

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

    // Show banner
    const banner=document.getElementById('guest-portal-banner');
    if(banner){
      const n=document.getElementById('gp-name');
      const s=document.getElementById('gp-status');
      const c=document.getElementById('gp-countdown');
      if(n)n.textContent='Welcome, '+guest.first_name;
      if(s)s.textContent=guest.attending==='yes'?'Confirmed ✓':'Response received';
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

    injectSection('timeline-content','timeline','March 6, 2027');
    injectSection('travel-content','travel','December 20, 2026');
    injectSection('photos-content','photos','March 20, 2027');

  }catch(err){
    console.warn('Guest portal init failed',err);
  }
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

/* ═══ MUSIC ═══ */
const audio=document.getElementById('bgMusic');audio.volume=0.22;
let musicStarted=false;
function toggleMusic(){
  const btn=document.getElementById('music-btn');
  if(!musicStarted){audio.play().then(()=>{btn.classList.add('playing');musicStarted=true}).catch(()=>{});return}
  if(audio.paused){audio.play();btn.classList.add('playing')}else{audio.pause();btn.classList.remove('playing')}
}

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

/* ═══ ENVELOPE ═══ */
let opened=false;
function openEnvelope(){
  if(opened)return;opened=true;
  const scene=document.getElementById('envScene');
  document.getElementById('envTap').style.opacity='0';
  scene.classList.add('flap-open');
  const envBody=document.querySelector('.env-body');
  setTimeout(()=>{if(envBody)envBody.style.animation='none';envBody.style.transform='scale(1.7) translateY(-180px)';envBody.style.opacity='0';envBody.style.transition='all 1.1s cubic-bezier(.22,1,.36,1)'},1300);
  setTimeout(()=>{
    clearInterval(ipt);
    document.getElementById('intro').classList.add('gone');
    document.getElementById('site').classList.add('visible');
    document.body.style.overflow='';
    initSite();
    audio.play().then(()=>{document.getElementById('music-btn').classList.add('playing');musicStarted=true}).catch(()=>{});
  },2200);
}

/* ═══ TOAST ═══ */
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3500);
}

/* ═══ LIGHTBOX ═══ */
function openLightbox(cell){
  const lb=document.getElementById('lightbox');
  const content=cell.querySelector('.g-placeholder-bg');
  if(content)lb.querySelector('.lb-content').innerHTML=content.innerHTML;
  lb.classList.add('open');
}
function closeLightbox(){document.getElementById('lightbox').classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox()});

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
      if(vals[k]!==prevVals[k]){el.textContent=vals[k];el.classList.remove('flip');void el.offsetWidth;el.classList.add('flip')}
    });
    prevVals=vals;
  }
  tick();setInterval(tick,1000);

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

  // Guest portal
  initGuestPortal();
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

/* ═══ 3D PARTICLE NAMES (Three.js) ═══ */
async function initNames3D(){
  if(typeof THREE==='undefined')return;
  const oldCanvas=document.getElementById('names-3d-canvas');
  if(oldCanvas)oldCanvas.remove();
  // On portrait mobile the horizontal FOV is too narrow for the wide particle canvas —
  // restore the CSS shimmer text fallback which is fully visible on small screens.
  if(window.innerWidth<600){
    document.getElementById('hero')?.classList.remove('has-3d-names');
    return;
  }

  const hero=document.getElementById('hero');
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
  const GAP=W<600 ? 3 : 2;
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

  const FOV=60;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(FOV, W/H, 1, 5000);
  const halfFOVrad=(FOV/2)*Math.PI/180;
  camera.position.z=Math.ceil((OW/2*scaleFactor)/Math.tan(halfFOVrad)*1.22);

  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W,H);

  // ── Particle sprite (ink→gold gradient disc) ──
  const tc=document.createElement('canvas');
  tc.width=tc.height=32;
  const tx=tc.getContext('2d');
  const grd=tx.createRadialGradient(16,16,0,16,16,16);
  grd.addColorStop(0,'rgba(226,200,122,1)');
  grd.addColorStop(0.45,'rgba(201,168,76,1)');
  grd.addColorStop(0.8,'rgba(138,144,88,0.7)');
  grd.addColorStop(1,'rgba(107,112,69,0)');
  tx.fillStyle=grd; tx.fillRect(0,0,32,32);
  const tex=new THREE.CanvasTexture(tc);

  const N=particles.length;
  const pos=new Float32Array(N*3);
  const col=new Float32Array(N*3);
  const opx=new Float32Array(N*3);

  particles.forEach((p,i)=>{
    pos[i*3]=opx[i*3]=p.ox;
    pos[i*3+1]=opx[i*3+1]=p.oy;
    pos[i*3+2]=opx[i*3+2]=p.oz;
    const t=p.str;
    // Gold→olive palette — reads well on cream background
    col[i*3]  =0.44+t*0.45;   // R: 0.44 (olive) → 0.89 (gold-lt)
    col[i*3+1]=0.38+t*0.40;   // G: 0.38 (olive) → 0.78 (gold-lt)
    col[i*3+2]=0.08+t*0.20;   // B: 0.08 → 0.28
  });

  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));

  // Bigger particles — proportional to sampling canvas (not raw W)
  const pSize=Math.max(5.5, OW/100);
  const mat=new THREE.PointsMaterial({
    size:pSize, vertexColors:true, transparent:true, opacity:0,
    map:tex, blending:THREE.NormalBlending, depthWrite:false,
    sizeAttenuation:true, alphaTest:0.01
  });
  const pts=new THREE.Points(geo,mat);
  scene.add(pts);

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

  let t=0, fade=0, animRunning=true;
  function animate(){
    if(!animRunning)return;
    requestAnimationFrame(animate);
    t+=0.006;

    // ── Fade in ──
    if(fade<0.96){fade=Math.min(fade+0.008,0.96);mat.opacity=fade;}

    // ── Gentle forward-facing sway (no full spin — letters stay readable) ──
    pts.rotation.y = Math.sin(t * 0.22) * 0.13;    // ±7° gentle rock, always faces forward
    pts.rotation.x = Math.sin(t * 0.28) * 0.07;    // subtle tilt for depth

    // ── Per-particle ripple (gives the letters a living shimmer) ──
    const pa=geo.attributes.position;
    particles.forEach((p,i)=>{
      pa.array[i*3]  =opx[i*3]  +Math.sin(t+p.ph)*1.8;
      pa.array[i*3+1]=opx[i*3+1]+Math.cos(t*.72+p.ph)*1.2;
      pa.array[i*3+2]=opx[i*3+2]+Math.sin(t*.55+p.ph*.7)*14;
    });
    pa.needsUpdate=true;

    // ── Mouse / touch parallax on camera (adds extra perspective) ──
    camera.position.x+=(mx*18-camera.position.x)*.04;
    camera.position.y+=(-my*12-camera.position.y)*.04;
    camera.lookAt(0,0,0);

    renderer.render(scene,camera);
  }
  animate();

  // Full reinit on resize (debounced) → keeps names sized consistently
  let rszTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(rszTimer);
    rszTimer=setTimeout(()=>{
      animRunning=false;
      try{renderer.dispose();}catch(e){}
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
function toggleFaq(btn){
  const item=btn.closest('.faq-item');
  const isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el=>el.classList.remove('open'));
  if(!isOpen)item.classList.add('open');
}

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
  if(!turnstileToken){
    showToast('Please complete the verification check above.');
    return;
  }

  const btn=document.getElementById('rsvpBtn');
  btn.classList.add('saving');
  btn.querySelector('span').textContent='Saving…';

  // ── All-in-one: verify Turnstile + save to DB + notify Gabriel (edge function) ──
  const {data:fnData,error:fnErr}=await supabase.functions.invoke('rsvp-notify',{
    body:{
      turnstile_token:turnstileToken,
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
      turnstileToken=null;
    }else{
      showToast(apiError||'Something went wrong. Please try again.');
    }
    return;
  }
  document.getElementById('rsvpForm').style.display='none';
  document.getElementById('rsvpThanks').style.display='block';
  setLang(currentLang);
  launchConfetti();
  showToast(attending==='yes'?'We can\'t wait to see you! 💛':'We\'ll miss you!');
}

document.body.style.overflow='hidden';

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
