import {cloud,cloudFiles,cloudPut,cloudAttach,assertUpload} from './cloud.mjs';
let dbPromise;
function database(){return dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('blood-diary-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function transaction(mode,action){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('files',mode);let result;const r=action(tx.objectStore('files'));if(r)r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('报告保存中断'));});}
export const localArchiveAll=()=>transaction('readonly',s=>s.getAll());
export const archiveAll=()=>cloud.active?cloudFiles():localArchiveAll();
export const archivePut=file=>{assertUpload();return cloud.active?cloudPut(file):transaction('readwrite',s=>s.put(file));};
export async function archiveAttach(ids,date){assertUpload();if(cloud.active)return cloudAttach(ids,date);const all=await archiveAll();await transaction('readwrite',s=>{for(const f of all.filter(f=>ids.includes(f.id)))s.put({...f,date});});}
export async function archiveMerge(files){assertUpload();if(cloud.active){for(const file of files)await cloudPut(file);return;}await transaction('readwrite',s=>{for(const f of files)s.put(f);});}
export async function fileToBase64(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
export function base64ToBlob(value,type){return new Blob([Uint8Array.from(atob(value),c=>c.charCodeAt(0))],{type});}
