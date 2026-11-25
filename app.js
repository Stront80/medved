(function(){
  'use strict';
  const E=BearEngine, $=id=>document.getElementById(id);
  const words={
    ru:{title:'Нападение медведя',shortTitle:'НАПАДЕНИЕ МЕДВЕДЯ',edition:'ЛЕС НЕ ПРОЩАЕТ ОШИБОК',shelter:'ДО УКРЫТИЯ',distance:'ДО МЕДВЕДЯ',left:'Влево',right:'Вправо',swipe:'Свайп для манёвра',
      eyebrow:'75 СЕКУНД ДО СПАСЕНИЯ',hero:'Нападение<br><span>медведя</span>',intro:'Он уже на тропе. Не оборачивайся. Доберись до лесного укрытия.',
      run:'Бежать',rule1:'Меняй дорожку свайпом или кнопками.',rule2:'Обходи камни и поваленные деревья.',rule3:'Каждый удар приближает медведя.',ruleKey1:'МАНЁВР',ruleKey2:'ПУТЬ',ruleKey3:'УГРОЗА',
      note:'Лучше играть со звуком. Музыку и эффекты можно отключить.',sound:'Звук',pause:'Пауза',paused:'Переведи дыхание',pauseNote:'Лес подождёт. Продолжи, когда будешь готов.',resume:'Продолжить',restart:'Начать заново',home:'На стартовый экран',
      music:'Музыка',effects:'Звуковые эффекты',volume:'Громкость',settings:'Звуки леса',settingsNote:'Тревожный ритм, шорох шагов и рычание позади.',back:'Готово',
      won:'Ты добрался.',wonText:'Дверь укрытия закрыта. Медведь остался в лесу.',lost:'Слишком близко.',lostText:'Медведь настиг тебя. Запомни тропу и попробуй снова.',again:'Ещё один забег',hitCount:'Столкновения',best:'Лучший забег',newBest:'НОВЫЙ РЕКОРД',result:'ЗАБЕГ ЗАВЕРШЁН',
      progress:'Пройдено',seconds:'с',audioError:'Звук недоступен в этом браузере. Можно продолжать без звука.',storageError:'Сохранение недоступно. Настройки и рекорд действуют до закрытия страницы.',
      hit:'Столкновение. Медведь ближе.',gameLabel:'Нападение медведя: браузерная игра',canvasLabel:'Лесная тропа: три дорожки, герой и преследующий медведь',toolbar:'Настройки игры',hud:'Ход забега',controls:'Управление',orientation:'Ориентация изменена. Игра на паузе.'},
    en:{title:'Bear Attack',shortTitle:'BEAR ATTACK',edition:'THE FOREST FORGIVES NOTHING',shelter:'TO SHELTER',distance:'BEAR DISTANCE',left:'Left',right:'Right',swipe:'Swipe to change lanes',
      eyebrow:'75 SECONDS TO SAFETY',hero:'Bear<br><span>Attack</span>',intro:'It’s already on the trail. Don’t look back. Reach the forest shelter.',
      run:'Run',rule1:'Change lanes with swipes or buttons.',rule2:'Avoid rocks and fallen trees.',rule3:'Every hit brings the bear closer.',ruleKey1:'MOVE',ruleKey2:'TRAIL',ruleKey3:'THREAT',
      note:'Best with sound. Music and effects can be switched off.',sound:'Sound',pause:'Pause',paused:'Catch your breath',pauseNote:'The forest can wait. Continue when you’re ready.',resume:'Continue',restart:'Start again',home:'Back to start',
      music:'Music',effects:'Sound effects',volume:'Volume',settings:'Sounds of the forest',settingsNote:'An uneasy pulse, rustling footsteps and a growl behind you.',back:'Done',
      won:'You made it.',wonText:'The shelter door is shut. The bear is still out there.',lost:'Too close.',lostText:'The bear caught you. Learn the trail and try again.',again:'Run again',hitCount:'Collisions',best:'Best run',newBest:'NEW BEST',result:'RUN COMPLETE',
      progress:'Distance covered',seconds:'s',audioError:'Audio is unavailable in this browser. You can keep playing without sound.',storageError:'Storage is unavailable. Settings and your best run last until the page is closed.',
      hit:'Collision. The bear is closer.',gameLabel:'Bear Attack: browser game',canvasLabel:'Forest trail: three lanes, runner and a pursuing bear',toolbar:'Game settings',hud:'Run progress',controls:'Controls',orientation:'Orientation changed. Game paused.'}
  };
  let language=navigator.language.toLowerCase().startsWith('ru')?'ru':'en';
  let settings={music:true,effects:true,volume:.45},best=null,storageOk=true;
  try{
    const saved=JSON.parse(localStorage.getItem('bear-attack-v1')||'null');
    if(saved&&typeof saved==='object'){
      if(['ru','en'].includes(saved.language))language=saved.language;
      if(typeof saved.music==='boolean')settings.music=saved.music;
      if(typeof saved.effects==='boolean')settings.effects=saved.effects;
      if(typeof saved.volume==='number'&&Number.isFinite(saved.volume))settings.volume=Math.max(0,Math.min(1,saved.volume));
      if(Number.isInteger(saved.best)&&saved.best>=0&&saved.best<=100)best=saved.best;
    }
  }catch(e){storageOk=false;}
  let state=E.create(),view='home',settingsReturn='home',newBest=false,last=0,accumulator=0,noticeTimer,hitTimer;
  const renderer=new ForestRenderer($('scene'));
  const audio=new BearAudio(()=>notice('audioError'));
  audio.apply(settings);
  const panel=$('panel');
  function t(key){return words[language][key];}
  function save(){try{localStorage.setItem('bear-attack-v1',JSON.stringify({...settings,language,best}));}catch(e){if(storageOk){storageOk=false;notice('storageError');}}}
  function notice(key){$('notice').textContent=t(key);$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,7000);}
  function localize(){
    document.documentElement.lang=language;document.title=t('title')+' · YaCo 2026';
    document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
    $('game').setAttribute('aria-label',t('gameLabel'));$('scene').setAttribute('aria-label',t('canvasLabel'));
    for(const [id,key] of [['sound','sound'],['pause','pause'],['toolbar','toolbar'],['hud','hud'],['controls','controls']])$(id).setAttribute('aria-label',t(key));
    $('language').textContent=language==='ru'?'EN':'RU';$('language').setAttribute('aria-label',language==='ru'?'Switch to English':'Переключить на русский');
    hud();
  }
  function button(action,label,primary=false){return `<button class="${primary?'primary':'secondary'}" data-action="${action}">${label}</button>`;}
  function extras(){return `<div class="panel-extras"><button data-action="language" aria-label="${language==='ru'?'Switch to English':'Переключить на русский'}">${language==='ru'?'English':'Русский'}</button>${view==='settings'?'':`<button data-action="settings">${t('sound')}</button>`}</div>`;}
  function show(next){
    view=next;let html='';
    document.body.className=state.status==='ready'?'home':'playing';
    $('hud').hidden=state.status==='ready';$('controls').hidden=state.status==='ready';
    $('pause').disabled=state.status!=='running';
    if(next==='home'){
      html=`<p class="eyebrow">${t('eyebrow')}</p><h1 id="panel-title" class="hero-title">${t('hero')}</h1><p class="description">${t('intro')}</p><div class="rules">${[1,2,3].map(n=>`<p><b>${t('ruleKey'+n)}</b><span>${t('rule'+n)}</span></p>`).join('')}</div>${button('start',t('run'),true)}${best===null?'':`<p class="small-note">${t('best')}: ${best} · ${t('hitCount').toLowerCase()}</p>`}<p class="small-note">${t('note')}</p>`;
    }else if(next==='pause'){
      html=`<p class="eyebrow">${t('pause')}</p><h2 class="panel-title" id="panel-title">${t('paused')}</h2><p class="description">${t('pauseNote')}</p>${button('resume',t('resume'),true)}${button('start',t('restart'))}${button('home',t('home'))}`;
    }else if(next==='settings'){
      html=`<p class="eyebrow">YaCo 2026</p><h2 class="panel-title" id="panel-title">${t('settings')}</h2><p class="description">${t('settingsNote')}</p><div class="settings"><label for="music">${t('music')}<input type="checkbox" id="music" ${settings.music?'checked':''}></label><label for="effects">${t('effects')}<input type="checkbox" id="effects" ${settings.effects?'checked':''}></label><label for="volume">${t('volume')} <output id="volume-value">${Math.round(settings.volume*100)}%</output><input id="volume" type="range" min="0" max="100" value="${Math.round(settings.volume*100)}"></label></div>${button('back',t('back'),true)}`;
    }else if(next==='result'){
      const won=state.status==='won';
      html=`<p class="eyebrow">${newBest?t('newBest'):t('result')}</p><h2 class="panel-title" id="panel-title">${t(won?'won':'lost')}</h2><p class="description">${t(won?'wonText':'lostText')}</p><div class="result-stat"><span>${t(won?'hitCount':'progress')}</span><strong>${won?state.hits:Math.floor(state.time/E.C.duration*100)+'%'}</strong></div>${best===null?'':`<p class="small-note">${t('best')}: ${best} · ${t('hitCount').toLowerCase()}</p>`}${button('start',t('again'),true)}${button('home',t('home'))}`;
    }
    if(next){
      const focusAction=document.activeElement?.dataset?.action;
      $('panel-content').innerHTML=html+extras();
      if(!panel.open)panel.showModal();
      const focus=[...panel.querySelectorAll('button')].find(b=>b.dataset.action===focusAction)||panel.querySelector('.primary');
      if (focusAction) focus?.focus({preventScroll:true});
      else {
        const title=$('panel-title');title.tabIndex=-1;title.focus({preventScroll:true});panel.scrollTop=0;
      }
    }else if(panel.open){panel.close();$('game').focus({preventScroll:true});}
    hud();
  }
  function hud(){
    $('remaining').textContent=Math.ceil(E.C.duration-state.time)+' '+t('seconds');
    $('progress').style.width=(state.time/E.C.duration*100)+'%';
    $('gap').textContent=String(Math.ceil(state.gap));$('distance').style.width=state.gap+'%';
    document.querySelector('.danger').classList.toggle('critical',state.gap<35);
    $('left').disabled=state.status!=='running'||state.target===0;
    $('right').disabled=state.status!=='running'||state.target===2;
  }
  async function begin(){
    audio.stop();clearTimeout(hitTimer);$('warning').classList.remove('hit');
    state=E.start(E.create());newBest=false;last=0;accumulator=0;show(null);
    if(await audio.unlock()){if(state.status==='running')audio.start();}
  }
  function pause(){if(state.status!=='running')return;E.pause(state);audio.stop();show('pause');}
  async function resume(){E.resume(state);last=0;accumulator=0;show(null);if(await audio.unlock()){if(state.status==='running')audio.start();}}
  function openSettings(){
    if(state.status==='running')pause();
    settingsReturn=view||'pause';audio.stop();show('settings');
  }
  function languageSwitch(){language=language==='ru'?'en':'ru';save();localize();if(view)show(view);}
  function steer(dir){if(E.move(state,dir)){audio.effect('move');hud();}}
  function finish(){
    audio.stop();
    if(state.status==='won'&&(best===null||state.hits<best)){best=state.hits;newBest=true;save();}
    audio.effect(state.status);$('announcer').textContent=t(state.status==='won'?'won':'lost');show('result');
  }
  $('panel-content').addEventListener('click',event=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='start')begin();
    if(action==='resume')resume();
    if(action==='settings')openSettings();
    if(action==='language')languageSwitch();
    if(action==='back'){show(settingsReturn);}
    if(action==='home'){audio.stop();state=E.create();show('home');}
  });
  $('panel-content').addEventListener('input',event=>{
    const el=event.target;
    if(el.id==='music'||el.id==='effects')settings[el.id]=el.checked;
    else if(el.id==='volume'){settings.volume=Number(el.value)/100;$('volume-value').textContent=el.value+'%';}
    else return;
    audio.apply(settings);save();
  });
  // Прослушивание эффекта — только явным жестом, без автозапуска в меню.
  $('panel-content').addEventListener('change',async event=>{if(event.target.id==='effects'&&settings.effects&&await audio.unlock())audio.effect('move');});
  $('language').addEventListener('click',languageSwitch);$('sound').addEventListener('click',openSettings);$('pause').addEventListener('click',pause);
  $('left').addEventListener('click',()=>steer(-1));$('right').addEventListener('click',()=>steer(1));
  panel.addEventListener('cancel',event=>{event.preventDefault();if(view==='settings')show(settingsReturn);else if(view==='pause')resume();});
  document.addEventListener('keydown',event=>{
    if(event.target.matches('input')||event.ctrlKey||event.altKey||event.metaKey)return;
    if(state.status==='running'&&!view){
      if(['ArrowLeft','KeyA','ArrowRight','KeyD'].includes(event.code)){event.preventDefault();if(!event.repeat)steer(['ArrowLeft','KeyA'].includes(event.code)?-1:1);}
      if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();pause();}
    }else if(view==='pause'&&event.code==='KeyP'){event.preventDefault();resume();}
  });
  let swipe=null;
  $('scene').addEventListener('pointerdown',event=>{if(state.status==='running'){swipe={x:event.clientX,y:event.clientY,id:event.pointerId};$('scene').setPointerCapture(event.pointerId);}});
  $('scene').addEventListener('pointerup',event=>{
    if(!swipe||swipe.id!==event.pointerId)return;
    const dx=event.clientX-swipe.x,dy=event.clientY-swipe.y;swipe=null;
    if(Math.abs(dx)>28&&Math.abs(dx)>Math.abs(dy)*1.1)steer(dx<0?-1:1);
  });
  $('scene').addEventListener('pointercancel',()=>swipe=null);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state.status==='running')pause();audio.stop();}});
  const orientation=()=>{if(state.status==='running')pause();renderer.resize();};
  if(screen.orientation?.addEventListener)screen.orientation.addEventListener('change',orientation);else window.addEventListener('orientationchange',orientation);
  window.addEventListener('resize',()=>{renderer.resize();renderer.draw(state,performance.now());});
  // Страница не догоняет потерянное время после блокировки ОС или длинного кадра.
  function frame(now){
    if(state.status==='running'){
      const dt=last?(now-last)/1000:0;
      if(dt>.3){pause();accumulator=0;}
      else{
        accumulator+=dt;
        while(accumulator>=E.C.step&&state.status==='running'){
          E.tick(state,E.C.step);accumulator-=E.C.step;
          for(const event of state.events){
            if(event==='hit'){
              audio.effect('hit');$('warning').classList.add('hit');clearTimeout(hitTimer);hitTimer=setTimeout(()=>$('warning').classList.remove('hit'),400);
              $('announcer').textContent=t('hit');
            }
          }
          if(state.status==='won'||state.status==='lost')finish();
        }
      }
      hud();
    }
    last=now;renderer.draw(state,now);requestAnimationFrame(frame);
  }
  $('game').tabIndex=-1;localize();show('home');if(!storageOk)notice('storageError');requestAnimationFrame(frame);
})();
