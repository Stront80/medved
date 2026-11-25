/* Вся иллюстрация рисуется локально: никаких изображений, шрифтов и сетевых загрузок. */
(function (root) {
  'use strict';
  class ForestRenderer {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.w = 0; this.h = 0;
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.resize();
    }
    resize() {
      const box = this.canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2);
      this.w = box.width; this.h = box.height;
      this.canvas.width = Math.round(box.width * ratio); this.canvas.height = Math.round(box.height * ratio);
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    path(points, fill, stroke, width = 1) {
      const c = this.ctx; c.beginPath();
      points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
    }
    ellipse(x, y, rx, ry, fill) {
      const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
    }
    project(lane, depth) {
      const h = this.h, w = this.w;
      return { x: w / 2 + (lane - 1) * w * (.045 + .255 * depth), y: h * (.19 + .81 * depth), scale: .15 + 1.6 * depth };
    }
    tree(x, y, scale, shade, seed) {
      const c = this.ctx; c.save(); c.translate(x, y); c.scale(scale, scale);
      this.path([[-7, 0],[-4,-118],[1,-250],[9,0]], shade);
      for (let i=0; i<5; i++) {
        const yy = -210 + i*34, spread = 18+i*12;
        this.path([[0,yy-38],[-spread,yy+20],[-spread*.35,yy+12],[-spread*1.2,yy+44],[0,yy+22],[spread,yy+36],[spread*.5,yy+8],[spread*.8,yy+15]],shade);
      }
      c.strokeStyle='#9aafa10a'; c.lineWidth=2; c.beginPath(); c.moveTo(0,-190); c.lineTo(3,-10); c.stroke();
      c.restore();
    }
    bear(x, y, scale, t, portrait = false) {
      const c = this.ctx; c.save(); c.translate(x,y); c.scale(scale,scale);
      const sway = this.reduced.matches ? 0 : Math.sin(t * 9) * 3;
      if (!portrait) {
        this.ellipse(0,48,67,52,'#070e0f66');
        this.ellipse(0,7,54,66,'#201e1a');
        for (const side of [-1,1]) {
          const step = Math.sin(t*9 + (side===1 ? Math.PI : 0))*8;
          this.ellipse(side*45,37+step,19,37,'#2b261f');
          for(let j=0;j<3;j++) this.path([[side*45-10+j*8,62+step],[side*45-7+j*8,76+step],[side*45-3+j*8,61+step]],'#b5ae93');
        }
      }
      c.translate(sway,portrait ? 0 : -29);
      this.ellipse(-38,-49,20,22,'#392f25'); this.ellipse(38,-49,20,22,'#392f25');
      this.ellipse(-38,-49,11,13,'#151918'); this.ellipse(38,-49,11,13,'#151918');
      const fur=c.createLinearGradient(-45,-50,35,67); fur.addColorStop(0,'#655040');fur.addColorStop(.45,'#3c3026');fur.addColorStop(1,'#201e1b');
      this.path([[-42,-53],[-21,-65],[0,-61],[23,-65],[43,-52],[52,-29],[48,-11],[55,10],[43,44],[25,66],[0,72],[-26,64],[-44,43],[-54,8],[-47,-13],[-52,-31]],fur,'#84705a',.6);
      // Неровные штрихи меха сохраняют силуэт зверя вместо круглой игрушечной морды.
      for(let i=0;i<36;i++) {
        const side=i%2 ? 1 : -1, yy=-46+Math.floor(i/2)*5.1;
        c.strokeStyle=i%3 ? '#aa8a6025' : '#100e0c66'; c.lineWidth=1.5;
        c.beginPath(); c.moveTo(side*(27+Math.sin(i*3)*7),yy); c.lineTo(side*(37+Math.sin(i*3)*6),yy+12); c.stroke();
      }
      this.path([[-39,-24],[-13,-20],[-7,-8],[-34,-11]],'#101413');
      this.path([[39,-24],[13,-20],[7,-8],[34,-11]],'#101413');
      for(const side of [-1,1]) {
        this.ellipse(side*23,-13,8,3.5,'#e8a352'); this.ellipse(side*23,-13,1.5,4,'#171511');
        this.path([[side*40,-32],[side*10,-23],[side*11,-15],[side*38,-22]],'#705a41');
      }
      this.ellipse(0,17,28,26,'#8b795e');
      this.path([[-19,1],[-10,-4],[10,-4],[19,1],[13,12],[0,17],[-13,12]],'#111817','#a38c67',.6);
      this.ellipse(0,43,29,23,'#100f0e');
      this.path([[-27,35],[-14,28],[0,33],[14,28],[27,35],[19,40],[0,38],[-20,40]],'#aa8c65');
      this.path([[-22,34],[-13,37],[-17,57]],'#f0dfb6'); this.path([[22,34],[13,37],[17,57]],'#f0dfb6');
      this.path([[-20,59],[-13,51],[-8,60],[0,54],[8,60],[13,51],[20,59],[13,65],[-13,65]],'#cec29b');
      c.strokeStyle='#c5aa743b'; c.lineWidth=1;
      for(const side of [-1,1]) for(let i=0;i<3;i++) {c.beginPath();c.moveTo(side*20,20+i*5);c.lineTo(side*43,17+i*7);c.stroke();}
      c.restore();
    }
    hero(x,y,scale,t,immune) {
      const c=this.ctx;c.save();c.translate(x,y);c.scale(scale,scale);
      if(immune>0) {c.globalAlpha=.75;this.ellipse(0,10,23,35,'#efbd7c25');}
      this.ellipse(0,25,18,6,'#06120d88');
      const step=this.reduced.matches?0:Math.sin(t*15)*7;
      c.lineCap='round';c.lineWidth=8;c.strokeStyle='#1c2b28';
      for(const side of [-1,1]) {c.beginPath();c.moveTo(side*6,8);c.lineTo(side*9,23+step*side);c.stroke();}
      c.strokeStyle='#d2a66e';c.lineWidth=7;
      for(const side of [-1,1]) {c.beginPath();c.moveTo(side*10,-8);c.lineTo(side*17,5-step*side*.5);c.stroke();}
      this.ellipse(0,-3,13,18,'#c48d51');this.ellipse(0,0,9,12,'#584f35');
      this.ellipse(0,-24,10,11,'#b99568');this.ellipse(0,-29,10,6,'#302f25');
      c.restore();
    }
    obstacle(row,t) {
      const depth=(t-(row.at-2.8))/2.8*.58+.09;
      for (const lane of row.blocked) {
        const p=this.project(lane,depth),c=this.ctx;c.save();c.translate(p.x,p.y);c.scale(p.scale,p.scale);
        this.ellipse(0,9,26,7,'#07130e80');
        if(row.kind==='rock') {
          this.path([[-25,6],[-23,-9],[-10,-25],[9,-28],[24,-14],[28,6],[8,13]],'#7e8981','#bac4b5',1);
          this.path([[-23,-9],[-10,-25],[9,-28],[2,-9]],'#a2ada0');
          this.path([[2,-9],[9,-28],[24,-14],[28,6],[8,13]],'#58675f');
        } else {
          this.path([[-30,-8],[21,-19],[31,-9],[29,6],[-23,17]],'#5c4430','#af8a54',1.2);
          this.ellipse(-25,5,9,13,'#c4a06b');this.ellipse(-25,5,5,9,'#795b39');
          c.strokeStyle='#b994613e';c.beginPath();c.moveTo(-17,-1);c.lineTo(22,-11);c.moveTo(-15,10);c.lineTo(26,0);c.stroke();
        }
        c.restore();
      }
    }
    draw(s, now) {
      const c=this.ctx,w=this.w,h=this.h,home=s.status==='ready',t=s.time;
      c.clearRect(0,0,w,h);
      const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#253d3d');sky.addColorStop(.45,'#40574b');sky.addColorStop(1,'#152c23');c.fillStyle=sky;c.fillRect(0,0,w,h);
      const moon=c.createRadialGradient(w*.73,h*.19,1,w*.73,h*.19,w*.4);moon.addColorStop(0,'#d2dbbc35');moon.addColorStop(1,'#d2dbbc00');c.fillStyle=moon;c.fillRect(0,0,w,h*.6);
      this.ellipse(w*.73,h*.17,17,17,'#d3d7bb80');
      for(let i=0;i<24;i++){const x=(i/23)*w, y=h*(.25+(i%4)*.025);this.tree(x,y,.35+(i%3)*.08,'#243c36',i);}
      this.path([[w*.46,h*.19],[w*.54,h*.19],[w*1.08,h],[w*-.08,h]],'#65715a');
      this.path([[w*.47,h*.19],[w*.53,h*.19],[w*.9,h],[w*.1,h]],'#748064');
      // Две тонкие колеи разделяют три игровые полосы, не маскируя препятствия.
      for(const side of [-1,1]) this.path([[w*(.5+side*.022),h*.2],[w*(.5+side*.027),h*.2],[w*(.5+side*.158),h],[w*(.5+side*.145),h]],'#c4cb9b25');
      const sceneryTime = home ? 0 : t;
      for(let i=0;i<25;i++) {
        const d=((i/25+sceneryTime*.07)%1), yy=h*(.2+.8*d),xx=w*.5+(i%2?1:-1)*w*(.08+.55*d);
        this.tree(xx,yy,.25+d*1.6,i%3?'#112b24':'#1b332a',i);
      }
      // Листва и светлые вкрапления показывают движение земли, не отвлекая от полос.
      for(let i=0;i<35;i++) {
        const d=(i*.137+sceneryTime*.13)%1, lane=(i*17%29)/14-1;
        const p=this.project(1+lane,d);
        c.fillStyle=i%3?'#d5cf8b1a':'#182e1e40';c.fillRect(p.x,p.y,2+d*3,1+d*2);
      }
      if(s.time>63) {
        const d=Math.min(.38,.04+(s.time-63)*.028),p=this.project(1,d);c.save();c.translate(p.x,p.y);c.scale(p.scale,p.scale);
        this.path([[-39,4],[-39,-46],[39,-46],[39,4]],'#65533c');this.path([[-51,-43],[0,-79],[51,-43]],'#263a30');c.fillStyle='#efd295';c.fillRect(-10,-28,20,32);c.restore();
      }
      if(home) {
        this.bear(w*.5,h*.24,Math.min(w/190,h/245),0,true);
      } else {
        const player=this.project(s.lane,.65);
        const bearDepth=.84-(100-s.gap)*.00155;
        const bear=this.project(s.lane*.6+.4,bearDepth);
        // Ограничение высотой не даёт зверю перекрывать героя на широкой сцене.
        this.bear(bear.x,bear.y,Math.min(w/560,h/1200)*(1.1+(100-s.gap)*.003),t);
        s.rows.filter(r=>r.at>=t).sort((a,b)=>b.at-a.at).forEach(r=>this.obstacle(r,t));
        this.hero(player.x,player.y,Math.min(w/290,h/440),t,s.immune);
        s.rows.filter(r=>r.at<t).forEach(r=>this.obstacle(r,t));
      }
      // Мягкая дымка; reduced-motion исключает декоративную анимацию.
      for(let i=0;i<3;i++) {
        const yy=h*(.23+i*.22), g=c.createLinearGradient(0,yy-25,0,yy+55);
        g.addColorStop(0,'#bdd2b900');g.addColorStop(.5,'#bdd2b90b');g.addColorStop(1,'#bdd2b900');c.fillStyle=g;c.fillRect(0,yy-25,w,80);
      }
      if(!this.reduced.matches) for(let i=0;i<15;i++){const xx=(i*83+Math.sin(now*.0003+i)*16)%w,yy=(i*59+now*.008)%h;this.ellipse(xx,yy,1,1,'#e6d5a030');}
    }
  }
  root.ForestRenderer=ForestRenderer;
})(globalThis);
