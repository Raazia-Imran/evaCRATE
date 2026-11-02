import {mountCrate} from './crate.js';
import {installMotion,setupTabs} from './motion.js';
document.documentElement.classList.add('js');

const $ = (selector,root=document)=>root.querySelector(selector);
const $$ = (selector,root=document)=>[...root.querySelectorAll(selector)];
const storage={get(key){try{return sessionStorage.getItem(key);}catch{return null;}},set(key,value){try{sessionStorage.setItem(key,value);}catch{/* Browsing without storage remains supported. */}}};
const preference=matchMedia('(prefers-reduced-motion: reduce)');
const motion={paused:preference.matches||storage.get('evacrate-motion')==='paused'};
function applyMotion(){
  document.documentElement.classList.toggle('motion-paused',motion.paused);
  $$('.motion-toggle').forEach(b=>{b.setAttribute('aria-pressed',String(motion.paused));const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=motion.paused?'▷':'Ⅱ';b.replaceChildren(document.createTextNode(motion.paused?'Resume motion ':'Pause motion '),icon);});
  document.dispatchEvent(new CustomEvent('evacrate:motion'));
}
$$('.motion-toggle').forEach(b=>b.addEventListener('click',()=>{motion.paused=!motion.paused;storage.set('evacrate-motion',motion.paused?'paused':'playing');applyMotion();}));
preference.addEventListener('change',e=>{motion.paused=e.matches||storage.get('evacrate-motion')==='paused';applyMotion();});applyMotion();

// The intro never blocks navigation and is skipped after its first appearance.
const splash=$('.splash');
if(splash){
  let dismissed=false;
  const dismiss=()=>{if(dismissed)return;dismissed=true;splash.classList.add('leaving');splash.inert=true;storage.set('evacrate-intro','seen');document.dispatchEvent(new CustomEvent('evacrate:intro'));setTimeout(()=>splash.remove(),600);};
  if(storage.get('evacrate-intro')||motion.paused||location.hash)dismiss();
  else{setTimeout(dismiss,1700);$('.splash-skip',splash).addEventListener('click',dismiss);document.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss();},{once:true});}
}

// Accessible menu with focus containment, Escape and outside-route navigation.
const toggle=$('.menu-toggle'),menu=$('#site-menu');
let lastFocus;
function closeMenu(){menu.hidden=true;document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');$('main').inert=false;$('.site-footer').inert=false;lastFocus?.focus();}
toggle.addEventListener('click',()=>{
  if(!menu.hidden){closeMenu();return;}
  lastFocus=document.activeElement;menu.hidden=false;document.body.classList.add('menu-open');toggle.setAttribute('aria-expanded','true');$('main').inert=true;$('.site-footer').inert=true;$('nav a',menu).focus();
});
document.addEventListener('keydown',e=>{
  if(menu.hidden)return;
  if(e.key==='Escape'){closeMenu();return;}
  if(e.key==='Tab'){
    const items=[toggle,...$$('a',menu)];const first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});

const reveals=$$('.reveal');
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');observer.unobserve(e.target);} }),{threshold:.08});reveals.forEach((e,i)=>{if(e.closest('.hero-copy'))e.style.transitionDelay=`${(i%3)*80}ms`;observer.observe(e);});}
else reveals.forEach(e=>e.classList.add('in'));
$$('[data-scene]').forEach(e=>mountCrate(e,motion));
installMotion(motion);

const topButton=$('.back-top'),progress=$('.progress-line');let scrolling=false;
function updateScroll(){const total=document.documentElement.scrollHeight-innerHeight;progress.style.scale=`${total>0?scrollY/total:0} 1`;topButton.classList.toggle('visible',scrollY>600);scrolling=false;}
addEventListener('scroll',()=>{if(!scrolling){requestAnimationFrame(updateScroll);scrolling=true;}},{passive:true});updateScroll();topButton.addEventListener('click',()=>scrollTo({top:0,behavior:motion.paused?'instant':'smooth'}));

const layers=[
 ['STRUCTURE / PROTECTION','A durable starting point.','The prototype uses moisture-resistant plywood for a locally fabricable outer structure. Seals and hardware are part of the design, with durability and cleaning to be validated.'],
 ['THERMAL BARRIER / INSULATION','Slow the incoming heat.','High-density polyurethane foam is the proposed thermal barrier. Insulation thickness, sealing quality, moisture resistance and service life need to be tested as one assembly.'],
 ['THERMAL STORAGE / PCM','Absorb heat through a phase change.','Paraffin-based PCM provides a finite thermal buffer as it melts. Aluminium fins are included to support heat distribution. Recharge conditions and actual hold time remain key validation priorities.'],
 ['SENSING / VISIBILITY','Know more about conditions.','The monitoring concept pairs an ESP32 with a temperature and relative-humidity sensor. Logging and phone-based alerts are under development and require calibration and field validation.'],
];
setupTabs('[data-layer]',i=>{const [k,t,c]=layers[i];$('#layer-kicker').textContent=k;$('#layer-title').textContent=t;$('#layer-copy').textContent=c;$$('.layer-plate').forEach((p,j)=>p.classList.toggle('active',i===j));});
const crops=[
 ['Tomato','tomato','Track firmness, ripeness, bruising and marketable quality alongside temperature and humidity. Loading and ventilation need to be assessed for the selected variety.'],
 ['Mango','mango','Evaluate variety, maturity at harvest, ripening behaviour and quality over time. A crop-specific protocol must establish whether the storage conditions are useful and appropriate.'],
 ['Leafy greens','greens','Study moisture loss, wilting, condensation and handling damage. Their requirements differ from ripening fruits, so the same storage approach cannot be assumed to work for both.'],
 ['Okra & chillies','okra','Evaluate visual quality, firmness, water loss and handling under realistic transport and holding conditions. Suitability must be established separately for each crop.'],
];
setupTabs('[data-crop]',i=>{const [name,art,copy]=crops[i];$('#crop-title').textContent=name;$('#crop-copy').textContent=copy;$('.crop-art').className=`crop-art ${art}`;});

const mass=$('#harvest-mass'),reduction=$('#loss-reduction');
if(mass){const calculate=()=>{const m=Number(mass.value),r=Number(reduction.value);$('#mass-output').value=m;$('#reduction-output').value=r;$('#saved-output').value=Number((m*r/100).toFixed(1));$('.scenario-result small').textContent=`${m} kg × ${r} / 100 = ${Number((m*r/100).toFixed(1))} kg`;};mass.addEventListener('input',calculate);reduction.addEventListener('input',calculate);calculate();}

$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{const filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));let count=0;$$('[data-category]').forEach(x=>{x.hidden=filter!=='all'&&x.dataset.category!==filter;if(!x.hidden){count++;x.classList.add('in');}});$('#news-count').textContent=`${count} update${count===1?'':'s'}`;}));
const articles={
 design:['ENGINEERING / PROJECT NOTE','A layered idea for a very real storage gap.',['The supplied EvaCRATE design brings together an outer shell, insulation, a PCM thermal battery, aluminium heat-distribution elements and a monitoring concept.','Each part has a job. The shell provides structure, insulation reduces heat ingress, and PCM absorbs heat while it changes phase. Monitoring is intended to make conditions more visible.','The next step is to assess these parts as an integrated system. Thermal hold time, recharge arrangements, cleanability and durability remain important engineering questions.']],
 recognition:['MILESTONE / TEAM UPDATE','A place among the national Top 35.',['The team’s supplied investment proposal reports selection among the Top 35 startups in the Aspire National Idea Bank startup competition.','This is presented as a team-reported milestone. An event date, official announcement and supporting media have not yet been added to this website.','Recognition supports the journey, while product performance and market adoption still require independent evidence and practical field testing.']],
 origins:['MILESTONE / ORIGINS','Engineering across disciplines, under pressure.',['The supplied proposal describes the team’s participation in a 48-hour international humanitarian engineering competition associated with Texas A&M University.','The experience connected mechanical, chemical and software engineering thinking around the post-harvest storage problem.','The exact event title, participation date and public supporting link will be confirmed before publishing a detailed competition report.']],
 testing:['RESEARCH / LOOKING AHEAD','The next milestone is evidence.',['The proposed research sequence moves from controlled bench tests to crop-specific comparisons in actual operating conditions.','A useful test records ambient and internal temperature, humidity, crop load, PCM state, lid openings and recharge requirements. A matched control is needed to understand changes in produce quality.','No test curves, measured loss reductions or fixed shelf-life extensions are presented here as established results. The aim is to make future findings traceable to their conditions.']],
};
const articleDialog=$('#article-dialog');let articleTrigger;
$$('[data-article]').forEach(b=>b.addEventListener('click',()=>{articleTrigger=b;const [category,title,paragraphs]=articles[b.dataset.article];$('#article-category').textContent=category;$('#article-title').textContent=title;const body=$('#article-body');body.replaceChildren(...paragraphs.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));articleDialog.showModal();$('.dialog-close',articleDialog).focus();}));
if(articleDialog){$('.dialog-close',articleDialog).addEventListener('click',()=>articleDialog.close());articleDialog.addEventListener('close',()=>articleTrigger?.focus());articleDialog.addEventListener('click',e=>{if(e.target===articleDialog){const r=articleDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)articleDialog.close();}});}

// No simulated success: delivery is only reported after a successful provider response.
const form=$('#contact-form');
if(form){
  let sending=false;
  const interest=new URLSearchParams(location.search).get('interest');if(interest&&[...$('#contact-interest').options].some(o=>o.value===interest))$('#contact-interest').value=interest;
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(sending||!form.reportValidity())return;if($('#botcheck').value)return;
    const data=new FormData(form),status=$('#form-status'),button=$('button[type="submit"]',form);
    const enquiry=`EvaCRATE enquiry\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nOrganisation: ${data.get('organisation')||'Not provided'}\nInterest: ${data.get('interest')}\n\n${data.get('message')}`;
    if(form.dataset.enabled!=='true'){
      $('#enquiry-copy').value=enquiry;$('#enquiry-fallback').hidden=false;
      try{await navigator.clipboard.writeText(enquiry);status.textContent='Enquiry copied. Nothing has been sent. Share the text with the team through your existing contact.';}
      catch{status.textContent='Your enquiry is ready below. Copy the text to share with the team. Nothing has been sent.';$('#enquiry-copy').focus();$('#enquiry-copy').select();}
      return;
    }
    sending=true;button.disabled=true;status.textContent='Sending your enquiry…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{
      const payload={access_key:form.dataset.accessKey,name:data.get('name'),email:data.get('email'),organisation:data.get('organisation'),interest:data.get('interest'),message:data.get('message'),subject:`EvaCRATE: ${data.get('interest')}`,from_name:'EvaCRATE website',botcheck:''};
      const response=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      const result=await response.json();
      if(!response.ok||result.success!==true)throw new Error('delivery');
      status.textContent='Your enquiry was sent successfully. Thank you for reaching out.';form.reset();$('#enquiry-fallback').hidden=true;
    }catch{status.textContent='We couldn’t confirm delivery. Please keep a copy of your enquiry and try again later.';$('#enquiry-fallback .small').textContent='Delivery could not be confirmed. Keep this copy of your enquiry.';$('#enquiry-copy').value=enquiry;$('#enquiry-fallback').hidden=false;}
    finally{clearTimeout(timer);sending=false;button.disabled=false;}
  });
}
