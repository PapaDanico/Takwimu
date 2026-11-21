const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path'); const root=process.argv[2];
const types={'.css':'text/css','.js':'text/javascript','.json':'application/json','.csv':'text/csv','.svg':'image/svg+xml','.woff2':'font/woff2','.xml':'application/xml','.webp':'image/webp','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);const f0=path.join(root,p);if(p.endsWith('/'))p+='index.html';fs.readFile(path.join(root,p),(e,d)=>{if(e){r.writeHead(404);r.end('nf');return}r.writeHead(200,{'content-type':types[path.extname(p)]||'text/html'});r.end(d)})}).listen(0,async()=>{
 const base=`http://localhost:${srv.address().port}`;const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:900}});
 const sm=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');const urls=[...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
 const titles={},issues=[];const seen=new Set();const queue=[...urls];const broken=new Set();
 for(const u of urls){const res=await pg.goto(base+u,{waitUntil:'load'});if(res.status()!==200){issues.push(u+' status '+res.status());continue}
  const d=await pg.evaluate(()=>({t:document.title,desc:(document.querySelector('meta[name=description]')||{}).content||'',h1:document.querySelectorAll('h1').length,lang:document.documentElement.lang,imgNoAlt:[...document.images].filter(i=>!i.hasAttribute('alt')).length,links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h.startsWith('/')),canon:(document.querySelector('link[rel=canonical]')||{}).href||'',emptyBtn:[...document.querySelectorAll('button,a')].filter(e=>!e.textContent.trim()&&!e.getAttribute('aria-label')&&!e.querySelector('img[alt]:not([alt=""])')).length}));
  (titles[d.t]=titles[d.t]||[]).push(u);
  if(!d.desc)issues.push(u+' no meta description');if(d.h1!==1)issues.push(u+' h1='+d.h1);if(d.lang!=='en')issues.push(u+' lang='+d.lang);if(d.imgNoAlt)issues.push(u+' img without alt '+d.imgNoAlt);if(d.emptyBtn)issues.push(u+' unnamed links/buttons '+d.emptyBtn);
  d.links.forEach(h=>seen.add(h.split('#')[0]));}
 for(const [t,us] of Object.entries(titles))if(us.length>1)issues.push('duplicate title "'+t+'" on '+us.length+' pages e.g. '+us.slice(0,3).join(','));
 for(const h of seen){if(!h||h.startsWith('//'))continue;const r=await pg.request.get(base+h);if(!r.ok())broken.add(h)}
 console.log('pages',urls.length,'unique internal links',seen.size,'broken',[...broken].join(' ')||'none');console.log(issues.slice(0,40).join('\n')||'no page issues');
 await b.close();srv.close()});
