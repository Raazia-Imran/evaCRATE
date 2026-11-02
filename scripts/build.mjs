import {mkdir,readdir,writeFile,cp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import config from '../site.config.mjs';
import {pages} from '../pages.mjs';
import {header,footer} from '../components.mjs';
import {atmosphere} from '../motion-blocks.mjs';

const out=new URL('../dist/',import.meta.url);
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const base=new URL(config.url);
if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw new Error('SITE_URL must use HTTPS.');
if(base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw new Error('SITE_URL must be an origin without credentials, paths, queries or fragments.');
if(config.web3formsKey&&!/^[a-zA-Z0-9-]{20,100}$/.test(config.web3formsKey))throw new Error('Invalid Web3Forms access key format.');
if(config.email&&!/^[^\s<>"@]+@[^\s<>"@]+\.[^\s<>"@]+$/.test(config.email))throw new Error('Invalid CONTACT_EMAIL.');
await mkdir(out,{recursive:true});
for(const entry of await readdir(out))await rm(new URL(entry,out),{recursive:true,force:true});
await cp(new URL('../assets/',import.meta.url),new URL('assets/',out),{recursive:true});
for(const name of ['styles.css','motion.css','app.js','crate.js','motion.js'])await cp(new URL(`../${name}`,import.meta.url),new URL(name,out));
const scriptHashes=new Set();
for(const page of pages){
  const canonical=new URL(page.path,base).href;
  const body=page.body(config)
    .replace(/(<section class="(?:home-hero|page-hero[^\"]*)">)/,`$1${atmosphere(({"/technology/":"energy","/research/":"science","/partners/":"connection","/contact/":"connection","/sustainability/":"water"})[page.path]||"leaf")}`)
    .replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/g,(_,attributes,copy)=>`<h1${attributes}>${copy.split('<br>').map(line=>`<span class="headline-mask"><span class="headline-line">${line}</span></span>`).join('')}</h1>`);
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:`${page.title} | EvaCRATE`,description:page.description,url:canonical,isPartOf:{'@type':'WebSite',name:'EvaCRATE',url:base.origin},inLanguage:'en'}).replaceAll('<','\\u003c');
  scriptHashes.add(`'sha256-${createHash('sha256').update(schema).digest('base64')}'`);
  const splash=page.path==='/'?`<div class="splash" aria-label="Welcome to EvaCRATE"><div class="splash-logo"><img src="/assets/logo.png" alt="EvaCRATE. A smarter crate for a greener planet." width="600" height="600"></div><p>A FRESHER FUTURE IS TAKING SHAPE.</p><div class="splash-line" aria-hidden="true"></div><button class="splash-skip" type="button">Enter website ↗</button></div>`:'';
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#123e2e"><title>${esc(page.title)} | EvaCRATE</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="${page.noindex?'noindex,follow':'index,follow,max-image-preview:large'}"><link rel="canonical" href="${esc(canonical)}"><link rel="icon" href="/assets/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/assets/icon-192.png" sizes="192x192"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><meta property="og:site_name" content="EvaCRATE"><meta property="og:type" content="website"><meta property="og:title" content="${esc(page.title)} | EvaCRATE"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${base.origin}/assets/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="EvaCRATE. A smarter crate for a greener planet. Prototype passive thermal storage."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(page.title)} | EvaCRATE"><meta name="twitter:description" content="${esc(page.description)}"><meta name="twitter:image" content="${base.origin}/assets/social-card.png"><link rel="preload" as="font" href="/assets/sans.otf" type="font/otf" crossorigin><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/motion.css"><script type="application/ld+json">${schema}</script><script type="module" src="/app.js"></script></head><body data-page="${page.path==='/'?'home':page.path.split('/')[1]}"><div class="progress-line" aria-hidden="true"></div>${splash}${header(page.path)}<main id="main">${body}</main>${footer(config)}<button class="motion-toggle motion-quick" type="button" aria-pressed="false">Pause motion <span aria-hidden="true">Ⅱ</span></button></body></html>`;
  const relative=page.path==='/404.html'?'404.html':page.path==='/'?'index.html':page.path.slice(1)+'index.html';
  const target=new URL(relative,out);await mkdir(new URL('./',target),{recursive:true});await writeFile(target,html);
}
const urls=pages.filter(p=>!p.noindex).map(p=>`  <url><loc>${esc(new URL(p.path,base).href)}</loc></url>`).join('\n');
await writeFile(new URL('sitemap.xml',out),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
await writeFile(new URL('robots.txt',out),`User-agent: *\nAllow: /\nSitemap: ${base.origin}/sitemap.xml\n`);
const csp=`default-src 'self'; script-src 'self' ${[...scriptHashes].join(' ')}; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.web3forms.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com; frame-ancestors 'none'; upgrade-insecure-requests`;
const headers={'Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()'};
await writeFile(new URL('_headers',out),'/*\n'+Object.entries(headers).map(([k,v])=>`  ${k}: ${v}`).join('\n')+'\n');
await writeFile(new URL('../vercel.json',import.meta.url),JSON.stringify({buildCommand:'npm run build',outputDirectory:'dist',trailingSlash:true,headers:[{source:'/(.*)',headers:Object.entries(headers).map(([key,value])=>({key,value}))}]},null,2)+'\n');
console.log(`Built ${pages.length} static pages. Form delivery: ${config.web3formsKey?'configured':'not configured (copy-enquiry mode)'}.`);
