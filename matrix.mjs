export const metricKey=(name,unit)=>JSON.stringify([name,unit]);
export function assess(item){
  const labels={high:'偏高 ↑',low:'偏低 ↓',abnormal:'异常'};
  if(labels[item.flag])return {kind:item.flag,label:labels[item.flag]};
  if(item.qualifier)return {kind:'unknown',label:'界限结果，未判定'};
  const ref=String(item.reference||'').trim().replace(/[～~—–至]/g,'-').replace(/[＜]/g,'<').replace(/[＞]/g,'>').replace(/≤/g,'<=').replace(/≥/g,'>=');
  const num='([+-]?\\d+(?:\\.\\d+)?)';
  let m=ref.match(new RegExp('^'+num+'\\s*-\\s*'+num+'\\s*%?$'));
  let kind='unknown';
  if(m&&Number(m[1])<=Number(m[2]))kind=item.value<Number(m[1])?'low':item.value>Number(m[2])?'high':'normal';
  else {m=ref.match(new RegExp('^(<=|>=|<|>)\\s*'+num+'\\s*%?$'));if(m){const limit=Number(m[2]);const valid=m[1]==='<'?item.value<limit:m[1]==='<='?item.value<=limit:m[1]==='>'?item.value>limit:item.value>=limit;kind=valid?'normal':m[1].startsWith('<')?'high':'low';}}
  return {kind,label:labels[kind]||(kind==='normal'?'范围内':'未判定')};
}
export function buildMatrix(records, query='', order='asc', stars=new Set()) {
  const dates=[...new Set(records.map(r=>r.date))].sort();
  if(order==='desc')dates.reverse();
  const groups=new Map();
  for(const r of records)for(const i of r.items){
    if(!i.name.toLowerCase().includes(query.toLowerCase()))continue;
    const key=metricKey(i.name,i.unit);
    if(!groups.has(key))groups.set(key,{key,name:i.name,unit:i.unit,cells:new Map(),measurements:new Map(),starred:stars.has(key)});
    const group=groups.get(key),cells=group.cells;
    if(!cells.has(r.date))cells.set(r.date,[]);
    cells.get(r.date).push(i.value);
    if(!group.measurements.has(r.date))group.measurements.set(r.date,[]);
    group.measurements.get(r.date).push({...i,assessment:assess(i)});
  }
  const abnormal=i=>['high','low','abnormal'].includes(i.assessment.kind);
  const rows=[...groups.values()];
  const recentDates=[...dates].sort().slice(-2),latest=recentDates.at(-1);
  for(const r of rows){const current=r.measurements.get(latest)||[];r.latestDate=latest;r.hasHistoricalAbnormal=[...r.measurements.values()].flat().some(abnormal);r.stableNormal=recentDates.length===2&&recentDates.every(date=>{const measurements=r.measurements.get(date)||[];return measurements.length>0&&measurements.every(i=>i.assessment.kind==='normal');});r.abnormal=r.hasHistoricalAbnormal&&!r.stableNormal;r.latestAbnormal=current.some(abnormal);r.recovered=r.abnormal&&current.length>0&&current.every(i=>i.assessment.kind==='normal');}
  for(const r of rows)r.inactiveMissing=recentDates.length===2&&recentDates.every(date=>!(r.measurements.get(date)||[]).length);
  rows.sort((a,b)=>(a.starred?0:a.abnormal&&!a.inactiveMissing?1:2)-(b.starred?0:b.abnormal&&!b.inactiveMissing?1:2));
  return {dates,rows};
}

// Merge added metadata into the same measurements without duplicating older backups.
export function mergeRecords(current,incoming,newId){const result=structuredClone(current);const identity=r=>JSON.stringify([r.date,r.items.map(i=>[i.name,i.value,i.unit,i.qualifier||''])]);for(const r of incoming){const found=result.find(x=>identity(x)===identity(r));if(found)found.items=found.items.map((item,index)=>({...item,...r.items[index]}));else result.push({...r,id:newId()});}return result;}
