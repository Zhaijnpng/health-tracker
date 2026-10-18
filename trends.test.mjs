import assert from 'node:assert/strict';
import {buildMatrix} from './matrix.mjs';
import {trendModel,referenceBounds} from './trends.mjs';
const records=[{date:'2026-01-01',items:[{name:'A',unit:'u',value:0,reference:'0-5'}]},{date:'2026-02-01',items:[{name:'A',unit:'u',value:4,reference:'0-5'}]},{date:'2026-04-01',items:[{name:'A',unit:'u',value:2,qualifier:'<'}]}];
let r=buildMatrix(records).rows[0],m=trendModel(r,records.map(r=>r.date));assert.deepEqual(m.dates,['2026-01-01','2026-02-01','2026-04-01']);assert.equal(m.delta,null);assert.equal(m.latest.qualifier,'<');assert.ok(m.max>5);assert.equal(m.latestPoints.length,1);
r=buildMatrix(records.slice(0,2)).rows[0];m=trendModel(r,['2026-02-01','2026-01-01']);assert.equal(m.delta,4);assert.equal(m.percent,null);assert.ok(m.points[1].time-m.points[0].time===31*86400000);
const one=trendModel(buildMatrix(records.slice(1,2)).rows[0],['2026-02-01']);assert.ok(one.max>one.min);assert.equal(one.delta,null);assert.deepEqual(referenceBounds('3.5～9.5'),[3.5,9.5]);assert.equal(referenceBounds('<50'),null);
console.log('Trend tests passed: date intervals, limits, zero baseline, single record, reference bounds.');
