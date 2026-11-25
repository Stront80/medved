'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const E=require('../engine.js');
function rng(seed=42){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function advance(s,seconds,random=()=>.5){for(let i=0;i<Math.round(seconds*60);i++)E.tick(s,E.C.step,random);}
function isolated(){const s=E.start(E.create());s.nextRow=1e6;return s;}
test('старт, пауза, продолжение и новая игра',()=>{
 const s=E.create();E.tick(s);assert.equal(s.time,0);E.start(s);advance(s,1);E.pause(s);const before=JSON.stringify({...s,events:[]});advance(s,1);assert.equal(JSON.stringify(s),before);E.resume(s);E.tick(s);assert.ok(s.time>1);assert.deepEqual(E.create(),E.create());
});
test('перемещение 150 мс, запрет выхода и мгновенной повторной команды',()=>{
 const s=isolated();assert.equal(E.move(s,-1),true);assert.equal(E.move(s,1),false);advance(s,.15);assert.ok(Math.abs(s.lane)<1e-8);assert.equal(E.move(s,-1),false);assert.equal(E.move(s,1),true);advance(s,.15);assert.ok(Math.abs(s.lane-1)<1e-8);assert.equal(E.move(s,2),false);
});
test('удар −40, защита 1 с, восстановление и предел 100',()=>{
 const s=isolated();s.rows=[{at:.01,blocked:[1],checked:false},{at:.1,blocked:[1],checked:false}];E.tick(s);assert.equal(s.hits,1);assert.equal(s.gap,60);advance(s,.5);assert.equal(s.hits,1);assert.ok(s.gap>60&&s.gap<62);advance(s,24);assert.equal(s.gap,100);
});
test('столкновение использует фактическую позицию при движении',()=>{
 const s=isolated();s.rows=[{at:.01,blocked:[1],checked:false}];E.move(s,-1);E.tick(s);assert.equal(s.hits,1);
 const clear=isolated();E.move(clear,-1);advance(clear,.15);clear.rows=[{at:clear.time+.01,blocked:[1],checked:false}];E.tick(clear);assert.equal(clear.hits,0);
});
test('поражение, победа и неизменность финального результата',()=>{
 const s=isolated();for(const at of [.01,1.2,2.4])s.rows.push({at,blocked:[1],checked:false});advance(s,3);assert.equal(s.status,'lost');assert.equal(s.hits,3);const time=s.time;advance(s,10);assert.equal(s.time,time);assert.equal(E.move(s,-1),false);
 const win=isolated();advance(win,76);assert.equal(win.status,'won');assert.equal(win.time,75);assert.equal(win.hits,0);
});
test('пять безопасных секунд и минимум 2.8 с предупреждения',()=>{
 const s=E.start(E.create());advance(s,5);assert.equal(s.rows.length,0);E.tick(s);assert.equal(s.rows.length,1);assert.ok(s.rows[0].at-s.time>=2.8-1e-8);assert.equal(s.hits,0);
});
test('200 воспроизводимых трасс: проходимость каждого ряда и полный забег',()=>{
 for(let seed=1;seed<=200;seed++){
   const s=E.start(E.create()),random=rng(seed);let previous=-10;
   for(let tick=0;tick<4600&&s.status==='running';tick++){
     const row=s.rows.find(r=>!r.checked);
     if(row&&row.at-s.time>.35){
       if(row.blocked.includes(s.target)){
         const open=[0,1,2].filter(l=>!row.blocked.includes(l));
         const target=open.sort((a,b)=>Math.abs(a-s.target)-Math.abs(b-s.target))[0];
         E.move(s,Math.sign(target-s.target));
       }
     }
     const n=s.nextId;E.tick(s,E.C.step,random);
     if(s.nextId!==n){const row=s.rows.at(-1);assert.ok(row.blocked.length>=1&&row.blocked.length<=2);assert.ok(row.at-previous>=1.24);previous=row.at;}
     assert.ok(s.gap>=0&&s.gap<=100);assert.ok(s.lane>=0&&s.lane<=2);
   }
   assert.equal(s.status,'won',`seed ${seed}`);assert.equal(s.hits,0,`seed ${seed}`);
 }
});
test('случайные команды и крупный dt не нарушают границы и не пропускают удар',()=>{
 const random=rng(99);let s=E.start(E.create());
 for(let i=0;i<30000;i++){if(s.status!=='running')s=E.start(E.create());if(random()<.2)E.move(s,random()<.5?-1:1);E.tick(s,random()*.1,random);assert.ok(s.lane>=0&&s.lane<=2);assert.ok(s.gap>=0&&s.gap<=100);assert.ok(s.time<=75);}
 const hit=isolated();hit.rows=[{at:.05,blocked:[1],checked:false}];E.tick(hit,.2);assert.equal(hit.hits,1);
});
