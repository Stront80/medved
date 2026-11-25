/* Оригинальный синтез: тихий минорный пульс, мелодия, шаги и низкое рычание. */
(function(root){
  'use strict';
  class BearAudio {
    constructor(onError){this.onError=onError;this.ctx=null;this.active=false;this.timer=null;this.sources=new Set();this.settings={music:true,effects:true,volume:.45};this.beat=0;this.next=0;}
    async unlock(){
      try {
        if(!this.ctx){
          const AC=root.AudioContext||root.webkitAudioContext;
          if(!AC) throw new Error('audio unavailable');
          this.ctx=new AC();this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.effects=this.ctx.createGain();
          this.music.connect(this.master);this.effects.connect(this.master);this.master.connect(this.ctx.destination);this.apply(this.settings);
        }
        if(this.ctx.state!=='running') await this.ctx.resume();
        return this.ctx.state==='running';
      }catch(e){this.onError();return false;}
    }
    apply(settings){
      this.settings={...settings};if(!this.ctx)return;
      const now=this.ctx.currentTime;
      this.master.gain.setTargetAtTime(settings.volume,now,.03);
      this.music.gain.setTargetAtTime(settings.music?.6:0,now,.02);
      this.effects.gain.setTargetAtTime(settings.effects?.7:0,now,.02);
    }
    tone(freq,at,duration,volume,type,channel,endFreq){
      if(!this.ctx||this.ctx.state!=='running')return;
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);
      if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(1,endFreq),at+duration);
      g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),at+.015);
      g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(channel);this.sources.add(o);
      o.onended=()=>{this.sources.delete(o);o.disconnect();g.disconnect();};o.start(at);o.stop(at+duration+.03);
    }
    noise(at,duration,volume,cutoff,endCutoff){
      if(!this.ctx||this.ctx.state!=='running')return;
      const count=Math.ceil(this.ctx.sampleRate*duration),b=this.ctx.createBuffer(1,count,this.ctx.sampleRate),data=b.getChannelData(0);
      // Сглаженный шум даёт шорох/рык, а не резкий белый шум.
      let prev=0;for(let i=0;i<count;i++){prev=(prev+(Math.random()*2-1)*.22)/1.15;data[i]=prev;}
      const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=b;
      filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,at);filter.frequency.exponentialRampToValueAtTime(endCutoff||cutoff,at+duration);
      g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.02);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
      src.connect(filter);filter.connect(g);g.connect(this.effects);this.sources.add(src);src.onended=()=>{this.sources.delete(src);src.disconnect();filter.disconnect();g.disconnect();};src.start(at);src.stop(at+duration+.03);
    }
    schedule(){
      if(!this.active||!this.ctx||this.ctx.state!=='running')return;
      const c=this.ctx;
      if(this.next<c.currentTime-.2)this.next=c.currentTime+.03;
      while(this.next<c.currentTime+.16){
        const at=this.next,b=this.beat%32;
        if(this.settings.music){
          const bass=[55,55,49,51.913][Math.floor(b/8)];
          if(b%2===0)this.tone(bass,at,.5,.12,'sine',this.music);
          if(b%4===0)this.tone(bass*2,at,1.1,.045,'triangle',this.music);
          const melody=[220,0,261.626,246.942,0,196,164.814,0];
          if(b%2===0&&melody[b/2%8])this.tone(melody[b/2%8],at,.42,.065,'triangle',this.music);
        }
        if(this.settings.effects){this.noise(at,.075,.13,320);if(b%16===8)this.growl(at);}
        this.next+=60/96/2;this.beat++;
      }
    }
    growl(at){
      if(!this.settings.effects||!this.ctx)return;
      this.noise(at,1.0,.48,500,100);this.tone(68,at,.95,.12,'sawtooth',this.effects,34);this.tone(91,at,.7,.06,'triangle',this.effects,46);
    }
    start(){
      if(!this.ctx||this.ctx.state!=='running')return;
      this.stop();this.active=true;this.next=this.ctx.currentTime+.04;this.beat=0;this.schedule();
      this.timer=setInterval(()=>this.schedule(),70);
    }
    stop(){
      this.active=false;if(this.timer!==null)clearInterval(this.timer);this.timer=null;
      for(const src of this.sources){try{src.stop();}catch(e){/* Уже завершившийся источник. */}}this.sources.clear();
    }
    effect(name){
      if(!this.ctx||this.ctx.state!=='running'||!this.settings.effects)return;
      const at=this.ctx.currentTime+.015;
      if(name==='hit'){this.noise(at,.24,.6,750,170);this.growl(at+.05);}
      if(name==='move')this.noise(at,.09,.13,1100,300);
      if(name==='lost')this.growl(at);
      if(name==='won')[220,261.626,329.628,440].forEach((f,i)=>this.tone(f,at+i*.15,.7,.14,'triangle',this.effects));
    }
  }
  root.BearAudio=BearAudio;
})(globalThis);
