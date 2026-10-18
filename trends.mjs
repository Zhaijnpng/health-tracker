export function referenceBounds(reference){
  const m=String(reference||'').trim().replace(/[～~—–至]/g,'-').match(/^([+-]?\d+(?:\.\d+)?)\s*-\s*([+-]?\d+(?:\.\d+)?)\s*%?$/);
  return m&&Number(m[1])<=Number(m[2])?[Number(m[1]),Number(m[2])]:null;
}
export function trendModel(row,dates){
  const sorted=[...dates].sort(),points=[];
  for(const date of sorted)for(const item of row.measurements.get(date)||[])points.push({...item,date,time:Date.parse(date+'T00:00:00Z')});
  const domain=points.flatMap(p=>[p.value,...(referenceBounds(p.reference)||[])]);
  let min=Math.min(...domain),max=Math.max(...domain),pad=(max-min)*.15||Math.abs(max)*.1||1;
  min-=pad;max+=pad;
  const first=points[0],latest=points.at(-1),latestPoints=points.filter(p=>p.date===latest?.date),firstPoints=points.filter(p=>p.date===first?.date);
  const delta=latest&&first&&!latest.qualifier&&!first.qualifier&&latestPoints.length===1&&firstPoints.length===1&&latest.date!==first.date?latest.value-first.value:null;
  return {dates:sorted,points,min,max,first,latest,latestPoints,delta,percent:delta!==null&&first.value!==0?delta/Math.abs(first.value)*100:null};
}
