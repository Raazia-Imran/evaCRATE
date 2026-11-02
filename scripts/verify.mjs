import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {pages} from '../pages.mjs';
const out=new URL('../dist/',import.meta.url);let links=0;
for(const p of pages){
  const rel=p.path==='/404.html'?'404.html':p.path==='/'?'index.html':p.path.slice(1)+'index.html';
  const html=await readFile(new URL(rel,out),'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`${p.path}: one h1`);
  for(const required of ['name="description"','rel="canonical"','property="og:image"','name="twitter:card"','rel="icon"','id="main"'])assert(html.includes(required),`${p.path}: ${required}`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`${p.path}: duplicate IDs`);
  for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(!href.startsWith('/')||href.startsWith('//'))continue;
    const parsed=new URL(href,'https://test.local');let target=parsed.pathname.slice(1);if(!target||target.endsWith('/'))target+='index.html';
    await stat(new URL(target,out)).catch(()=>{throw new Error(`${p.path}: broken target ${href}`);});links++;
    if(parsed.hash&&parsed.pathname===p.path)assert(ids.includes(parsed.hash.slice(1)),`missing hash ${href}`);
  }
  for(const [,href] of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(href),`${p.path}: missing hash #${href}`);
  assert(!/lorem ipsum|YOUR_ACCESS_KEY|\bundefined\b|\bNaN\b|\bTODO\b/i.test(html),`${p.path}: unfinished content`);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(schema['@type'],'WebPage');
}
for(const script of ['app.js','crate.js','motion.js']){
  const {spawnSync}=await import('node:child_process');const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL(script,out))],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
}
assert((await stat(new URL('assets/social-card.png',out))).size>1000);
assert((await readFile(new URL('sitemap.xml',out),'utf8')).includes('/technology/'));
console.log(`Verified ${pages.length} pages, ${links} local links/assets, unique headings and IDs, metadata, JSON-LD and JavaScript syntax.`);
