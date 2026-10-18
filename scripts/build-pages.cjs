const fs=require('node:fs'),path=require('node:path');
// Publish an explicit source allowlist. Local reports and backups are never copied.
const files=['index.html','style.css','personal.css','app.js','archive.js','matrix.mjs','trends.mjs','metric-info.mjs','metric-detail.mjs','cloud.mjs','cloud-config.mjs'];
fs.mkdirSync('dist',{recursive:true});
for(const file of files)fs.copyFileSync(file,path.join('dist',file));
fs.writeFileSync('dist/.nojekyll','');
const contents=fs.readdirSync('dist');
if(contents.some(f=>!files.includes(f)&&f!=='.nojekyll'))throw Error('dist contains an unexpected file. Inspect before publishing.');
console.log('Prepared '+files.length+' application files; no reports or backups included.');
