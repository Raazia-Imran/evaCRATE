/** Small, dependency-free 3D concept renderer. No product dimensions are implied. */
export function mountCrate(host, motion) {
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let width = 600, height = 500, frame = 0, visible = false;
  let yaw = -.64, targetYaw = -.64, dragging = false, lastX = 0, lastTime = 0, time = 0;
  const exploded = host.dataset.mode === 'explode';
  let opening = 1, targetOpening = 1, separation = exploded ? 1 : 0, targetSeparation = separation;
  const shapes = [];
  const box = (x,y,z,w,h,d,color,part='shell') => shapes.push({kind:'box',x,y,z,w,h,d,color,part});
  const sphere = (x,y,z,r,color) => shapes.push({kind:'sphere',x,y,z,r,color});
  const leaf = (x,y,z,r,angle=0) => shapes.push({kind:'leaf',x,y,z,r,angle});
  const wood = '#a77b4e', green = '#3b6943', trim = '#1c4833', foam = '#c8d8b2';
  // Open crate shell and feet.
  box(0,-.8,0,3.08,.19,2.1,trim);
  for (const x of [-1.3,1.3]) for (const z of [-.83,.83]) box(x,-.99,z,.28,.22,.26,'#224a33');
  for(let j=0;j<4;j++){
    const y=-.55+j*.30;
    for(const z of [-1,1])box(0,y,z,3.0,.26,.10,j%2?wood:'#ad8356');
    for(const x of [-1.49,1.49])box(x,y,0,.10,.26,1.9,j%2?'#54734a':green);
  }
  for(const x of [-1.48,1.48])for(const z of [-1,1])box(x,-.12,z,.15,1.42,.15,trim);
  // Top frame, thermal liner and aluminium / PCM highlights.
  for(const z of [-1,1])box(0,.61,z,3.18,.13,.16,green);
  for(const x of [-1.52,1.52])box(x,.61,0,.15,.13,2.14,green);
  for(const z of [-.85,.85])box(0,.48,z,2.8,.22,.14,foam,'liner');
  for(const x of [-1.33,1.33])box(x,.48,0,.14,.22,1.7,foam,'liner');
  box(0,-.66,0,2.72,.06,1.65,'#91bdb1','pcm');
  for(let i=0;i<10;i++)box(-1.18+i*.26,.56,-.76,.08,.13,.06,'#cadcd0','fins');
  // Produce makes the concept tangible, without implying a validated crop load.
  [[-.88,.55,-.35],[-.22,.57,-.36],[.47,.56,-.4],[.99,.55,-.1],[-.71,.55,.33],[-.04,.61,.31],[.66,.57,.38]].forEach(([x,y,z],i)=>{
    sphere(x,y,z,.31+(i%2)*.025,i%3===0?'#d99542':'#cf5c35');
    leaf(x,y+.29,z,.14,i*.8);
  });
  leaf(-1.04,.8,.39,.47,-.6);leaf(-1.15,.74,.13,.38,.7);leaf(.93,.82,-.53,.42,.8);
  // Suspended lid: the offset visually explains the construction.
  const lidY=1.62;
  box(0,lidY,0,3.2,.14,2.16,trim,'lid');
  for(let i=0;i<8;i++)box(-1.36+i*.39,lidY+.095,0,.34,.06,2.05,i%2?'#426f43':'#4c7b49','lid');
  box(0,lidY-.12,0,2.83,.12,1.82,foam,'lid');
  box(0,lidY+.145,0,1.17,.014,.54,'#cbd999','lid');
  // Handles and corner hardware.
  for(const x of [-1.61,1.61]){
    box(x,-.02,0,.11,.13,.65,'#b8c9b7');
    box(x,-.02,-.28,.16,.20,.08,'#9dab98');box(x,-.02,.28,.16,.20,.08,'#9dab98');
  }
  box(0,-.08,1.075,1.47,.45,.018,trim);
  const rgb = hex=>hex.match(/\w\w/g).map(v=>parseInt(v,16));
  const shade = (hex,f) => {const c=rgb(hex.slice(1));return `rgb(${c.map(v=>Math.min(255,Math.round(v*f))).join(',')})`;};
  function transform(x,y,z){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),p=.34;
    const xx=x*cy+z*sy,zz=-x*sy+z*cy;
    return {x:xx,y:y*Math.cos(p)-zz*Math.sin(p),z:y*Math.sin(p)+zz*Math.cos(p)};
  }
  function project(p){
    const scale=Math.min(width/(5.3+separation*.55),height/(4.9+separation*.8)),pers=7/(7-p.z);
    return {x:width*.5+p.x*scale*pers,y:height*(.53+separation*.025)-p.y*scale*pers,z:p.z,s:scale*pers};
  }
  const point=(x,y,z)=>project(transform(x,y,z));
  function render(){
    ctx.clearRect(0,0,width,height);
    ctx.save();ctx.translate(width*.5,height*.82);ctx.scale(1,.2);
    const shadow=ctx.createRadialGradient(0,0,0,0,0,width*.33);
    shadow.addColorStop(0,'#00000036');shadow.addColorStop(1,'#00000000');
    ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,width*.33,0,Math.PI*2);ctx.fill();ctx.restore();
    // A faint animated airflow path is illustrative, not a simulation.
    if(!motion.paused){
      ctx.strokeStyle=host.closest('.blue-hero')?'#37694f25':'#bfdfb224';ctx.lineWidth=1;
      for(let j=0;j<3;j++){
        ctx.beginPath();for(let i=0;i<=60;i++){
          const t=i/60,px=width*(.06+t*.88),py=height*(.38+j*.13)+Math.sin(t*6+time*.3+j)*18;
          i?ctx.lineTo(px,py):ctx.moveTo(px,py);
        }ctx.stroke();
      }
    }
    const drawables=[];
    for(const s of shapes){
      let x=s.x,y=s.y,z=s.z;
      if(s.part==='lid')y+=(opening-1)*.88+separation*.58;
      else if(s.part==='liner')y+=separation*.28;
      else if(s.part==='pcm')y+=separation*1.9;
      else if(s.part==='fins')y+=separation*.6;
      if(s.kind!=='box')y-=(1-opening)*.4;
      if(s.kind==='box'){
        const v=[];for(const dy of [-1,1])for(const dz of [-1,1])for(const dx of [-1,1])v.push(point(x+dx*s.w/2,y+dy*s.h/2,z+dz*s.d/2));
        // Winding is irrelevant: all faces are depth sorted, letting nearer faces occlude.
        const faces=[[[0,1,3,2],.65],[[4,6,7,5],1.22],[[0,4,5,1],.92],[[2,3,7,6],1.04],[[0,2,6,4],.76],[[1,5,7,3],1.10]];
        for(const [inds,light] of faces){const p=inds.map(i=>v[i]);drawables.push({kind:'face',p,z:p.reduce((a,b)=>a+b.z,0)/4,color:shade(s.color,light)});}
      }else{const p=point(x,y,z);drawables.push({...s,p,z:p.z});}
    }
    drawables.sort((a,b)=>a.z-b.z);
    for(const s of drawables){
      if(s.kind==='face'){
        ctx.beginPath();s.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=s.color;ctx.fill();ctx.lineWidth=.55;ctx.strokeStyle='#152e1925';ctx.stroke();
      }else if(s.kind==='sphere'){
        const r=s.r*s.p.s,g=ctx.createRadialGradient(s.p.x-r*.35,s.p.y-r*.4,0,s.p.x,s.p.y,r);
        g.addColorStop(0,shade(s.color,1.4));g.addColorStop(.6,s.color);g.addColorStop(1,shade(s.color,.63));ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.p.x,s.p.y,r,0,Math.PI*2);ctx.fill();
      }else if(s.kind==='leaf'){
        const r=s.r*s.p.s;ctx.save();ctx.translate(s.p.x,s.p.y);ctx.rotate(s.angle+Math.sin(time*.5)*.05);const g=ctx.createLinearGradient(-r,0,r,0);g.addColorStop(0,'#547b34');g.addColorStop(.45,'#a8c566');g.addColorStop(1,'#426c39');ctx.fillStyle=g;
        ctx.beginPath();ctx.moveTo(-r,0);ctx.bezierCurveTo(-r*.2,-r*.9,r*.7,-r*.8,r,0);ctx.bezierCurveTo(r*.3,r*.7,-r*.4,r*.6,-r,0);ctx.fill();ctx.strokeStyle='#d3e58b88';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.stroke();ctx.restore();
      }
    }
    // Project a wordmark onto the near wall. Hide it when that face turns away.
    const p1=point(-.65,-.08,1.09),p2=point(.65,-.08,1.09);
    if(Math.cos(yaw)>0){ctx.save();ctx.translate((p1.x+p2.x)/2,(p1.y+p2.y)/2);ctx.rotate(Math.atan2(p2.y-p1.y,p2.x-p1.x));ctx.fillStyle='#e0e8b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${Math.max(9,width*.025)}px Arial`;ctx.fillText('EvaCRATE',0,0);ctx.restore();}
    // Floating seed-like particles around the model.
    for(let i=0;i<7;i++){
      const angle=time*.12+i*.9,x=width*(.5+Math.cos(angle)*(.36+(i%2)*.04)),y=height*(.45+Math.sin(angle)*.3);
      ctx.fillStyle=i%3===0?'#e8a06a99':'#bddb8b66';ctx.beginPath();ctx.arc(x,y,i%3===0?3:1.5,0,7);ctx.fill();
    }
  }
  function tick(now){
    frame=0;if(!visible||document.hidden)return;
    const delta=Math.min((now-lastTime)/1000,.05);lastTime=now;
    if(!motion.paused){time+=delta;const auto=dragging?0:Math.sin(time*.35)*.1;yaw+=(targetYaw+auto-yaw)*.06;opening+=(targetOpening-opening)*.065;separation+=(targetSeparation-separation)*.055;}
    else{yaw=targetYaw;opening=targetOpening;separation=targetSeparation;}
    render();if(!motion.paused)frame=requestAnimationFrame(tick);
  }
  const start=()=>{if(!frame&&visible&&!document.hidden){lastTime=performance.now();frame=requestAnimationFrame(tick);}};
  const resize=new ResizeObserver(()=>{const r=host.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render();start();});resize.observe(host);
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'30px'});observer.observe(host);
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;targetYaw+=(e.clientX-lastX)*.008;lastX=e.clientX;if(motion.paused){yaw=targetYaw;render();}});
  for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>{dragging=false;});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();targetYaw+=e.key==='ArrowLeft'?-.3:.3;start();});
  host.querySelectorAll('[data-rotate]').forEach(b=>b.addEventListener('click',()=>{targetYaw+=Number(b.dataset.rotate)*.35;start();}));
  host.querySelectorAll('[data-product-view]').forEach(button=>button.addEventListener('click',()=>{
    const view=button.dataset.productView;
    targetOpening=view==='closed'?0:1;targetSeparation=view==='layers'?1:0;
    host.querySelectorAll('[data-product-view]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    if(motion.paused){opening=targetOpening;separation=targetSeparation;render();}else start();
  }));
  host.addEventListener('evacrate:pose',event=>{
    const progress=Math.max(0,Math.min(2,Number(event.detail?.progress)||0));
    targetYaw=-.64+progress*.42;
    targetSeparation=Math.max(0,1-Math.abs(progress-1))*.85;
    targetOpening=progress>1?2-progress:1;
    if(motion.paused){yaw=targetYaw;opening=targetOpening;separation=targetSeparation;render();}else start();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
  document.addEventListener('evacrate:motion',()=>{if(motion.paused){cancelAnimationFrame(frame);frame=0;yaw=targetYaw;opening=targetOpening;separation=targetSeparation;render();}else start();});
}
