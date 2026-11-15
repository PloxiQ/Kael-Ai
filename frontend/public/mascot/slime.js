/*
 * Slime mascot: vanilla JS, no dependencies.
 * Usage: Slime.mount(containerElement, options) -> controller
 * Requires slime.css on the page.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Slime = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var MARKUP = `<svg class="slime" data-mood="idle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 340" role="img" aria-label="KAEL slime mascot">
<ellipse class="shadow" cx="200" cy="303" rx="95" ry="9" fill="#17181b" opacity=".5"/>
<g transform="translate(200,205)">
<g class="slime-bounce">
<g transform="translate(-92,16)"><g class="arm l"><ellipse cx="-8" cy="0" rx="12" ry="8" fill="#10B981" fill-opacity=".55" stroke="#34D399" stroke-opacity=".7" stroke-width="1.5"/></g></g>
<g transform="translate(92,16)"><g class="arm r"><ellipse cx="8" cy="0" rx="12" ry="8" fill="#10B981" fill-opacity=".55" stroke="#34D399" stroke-opacity=".7" stroke-width="1.5"/></g></g>
<path d="M-80,40 C-80,-40 -45,-75 0,-75 C45,-75 80,-40 80,40 C80,52 100,58 105,70 C108,82 70,86 0,86 C-70,86 -108,82 -105,70 C-100,58 -80,52 -80,40Z" fill="#10B981" fill-opacity=".55" stroke="#34D399" stroke-opacity=".7" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="0" cy="62" rx="62" ry="16" fill="#047857" fill-opacity=".35"/>
<circle cx="-50" cy="45" r="8" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
<circle cx="56" cy="30" r="5" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
<circle cx="40" cy="55" r="3" fill="#fff" fill-opacity=".4"/>
<ellipse cx="-44" cy="-50" rx="24" ry="10" transform="rotate(-28 -44 -50)" fill="#fff" fill-opacity=".5"/>
<circle cx="-16" cy="-64" r="3.5" fill="#fff" fill-opacity=".5"/>
<path d="M104,74 C108,84 98,98 104,104 C110,98 112,86 104,74Z" fill="#10B981" fill-opacity=".5"/>
<g class="slime-face">
<g class="f eyes-n"><g class="blink">
<ellipse cx="-28" cy="-6" rx="16" ry="20" fill="#052E1C"/><ellipse cx="28" cy="-6" rx="16" ry="20" fill="#052E1C"/>
<circle cx="-22" cy="-14" r="6.5" fill="#fff"/><circle cx="-33" cy="2" r="3" fill="#fff"/>
<circle cx="34" cy="-14" r="6.5" fill="#fff"/><circle cx="23" cy="2" r="3" fill="#fff"/>
</g></g>
<g class="f eyes-h" fill="none" stroke="#052E1C" stroke-width="5" stroke-linecap="round"><path d="M-46,-2 Q-28,-24 -10,-2"/><path d="M10,-2 Q28,-24 46,-2"/></g>
<g class="f eyes-l"><path transform="translate(-28,-4) scale(1.5)" d="M0,10 C-18,-4 -14,-22 0,-14 C14,-22 18,-4 0,10Z" fill="#34D399"/><path transform="translate(28,-4) scale(1.5)" d="M0,10 C-18,-4 -14,-22 0,-14 C14,-22 18,-4 0,10Z" fill="#34D399"/><circle cx="-36" cy="-14" r="4" fill="#fff"/><circle cx="20" cy="-14" r="4" fill="#fff"/></g>
<g class="f eyes-s" fill="none" stroke="#052E1C" stroke-width="4.5" stroke-linecap="round"><path d="M-44,-4 Q-28,6 -12,-4"/><path d="M12,-4 Q28,6 44,-4"/></g>
<g class="f brows" fill="none" stroke="#052E1C" stroke-width="4" stroke-linecap="round"><path d="M-48,-26 L-14,-38"/><path d="M48,-26 L14,-38"/></g>
<g class="f brows-a" fill="none" stroke="#052E1C" stroke-width="4.5" stroke-linecap="round"><path d="M-48,-36 L-12,-22"/><path d="M48,-36 L12,-22"/></g>
<g class="f brows-t" fill="none" stroke="#052E1C" stroke-width="4" stroke-linecap="round"><path d="M-46,-30 L-14,-30"/><path d="M14,-38 Q30,-46 46,-36"/></g>
<g class="f eyes-w"><path d="M-44,-4 Q-28,-24 -12,-4" fill="none" stroke="#052E1C" stroke-width="5" stroke-linecap="round"/><ellipse cx="28" cy="-6" rx="16" ry="20" fill="#052E1C"/><circle cx="34" cy="-14" r="6.5" fill="#fff"/><circle cx="23" cy="2" r="3" fill="#fff"/></g>
<g class="f eyes-d" fill="none" stroke="#052E1C" stroke-width="3.5" stroke-linecap="round"><g transform="translate(-28,-6)"><path class="spin" d="M0,0 C0,-3 5,-3 5,0 C5,6 -7,6 -7,-1 C-7,-10 9,-10 9,0 C9,13 -12,13 -12,-2 C-12,-16 14,-16 14,0"/></g><g transform="translate(28,-6)"><path class="spin" d="M0,0 C0,-3 5,-3 5,0 C5,6 -7,6 -7,-1 C-7,-10 9,-10 9,0 C9,13 -12,13 -12,-2 C-12,-16 14,-16 14,0"/></g></g>
<g class="f eyes-c"><path d="M-48,-16 H-8 V4 Q-8,18 -28,18 Q-48,18 -48,4Z" fill="#052E1C"/><path d="M48,-16 H8 V4 Q8,18 28,18 Q48,18 48,4Z" fill="#052E1C"/><path d="M-8,-12 H8" stroke="#052E1C" stroke-width="4"/><path d="M-40,-8 L-30,-8 M-42,-2 L-38,-2 M16,-8 L26,-8 M14,-2 L18,-2" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/></g>
<g class="f eyes-sc"><ellipse cx="-28" cy="-6" rx="17" ry="21" fill="#fff" stroke="#052E1C" stroke-width="3"/><ellipse cx="28" cy="-6" rx="17" ry="21" fill="#fff" stroke="#052E1C" stroke-width="3"/><circle cx="-28" cy="-4" r="4.5" fill="#052E1C"/><circle cx="28" cy="-4" r="4.5" fill="#052E1C"/></g>
<g class="f eyes-b"><path d="M-44,-6 C-44,6 -38,14 -28,14 C-18,14 -12,6 -12,-6Z" fill="#052E1C"/><path d="M12,-6 C12,6 18,14 28,14 C38,14 44,6 44,-6Z" fill="#052E1C"/><circle cx="-32" cy="4" r="3" fill="#fff"/><circle cx="24" cy="4" r="3" fill="#fff"/></g>
<g class="f eyes-x"><path transform="translate(-28,-6)" d="M0,-18 L5.3,-6 L18,-5.6 L8.2,2.8 L11,15 L0,8.3 L-11,15 L-8.2,2.8 L-18,-5.6 L-5.3,-6Z" fill="#052E1C"/><path transform="translate(28,-6)" d="M0,-18 L5.3,-6 L18,-5.6 L8.2,2.8 L11,15 L0,8.3 L-11,15 L-8.2,2.8 L-18,-5.6 L-5.3,-6Z" fill="#052E1C"/><circle cx="-32" cy="-12" r="3" fill="#fff"/><circle cx="24" cy="-12" r="3" fill="#fff"/></g>
<g class="f eyes-cr" fill="none" stroke="#052E1C" stroke-width="5" stroke-linecap="round"><path d="M-44,-6 Q-28,6 -12,-6"/><path d="M12,-6 Q28,6 44,-6"/></g>
<g class="f stream" fill="none" stroke="#A7F3D0" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 8"><path d="M-28,2 Q-32,22 -34,44"/><path d="M28,2 Q32,22 34,44"/></g>
<path class="f sweat" d="M52,-34 Q58,-24 52,-20 Q46,-24 52,-34Z" fill="#A7F3D0"/>
<g class="f sigh"><circle cx="16" cy="30" r="3.5" fill="#fff" fill-opacity=".7"/><circle cx="23" cy="27" r="2.5" fill="#fff" fill-opacity=".7"/></g>
<ellipse class="cheek" cx="-56" cy="18" rx="9" ry="5" fill="#6EE7B7"/><ellipse class="cheek" cx="56" cy="18" rx="9" ry="5" fill="#6EE7B7"/>
<ellipse class="f m-dot" cx="0" cy="20" rx="4" ry="5" fill="#052E1C"/>
<g class="f m-open"><path d="M-11,15 Q0,40 11,15Z" fill="#052E1C"/><ellipse cx="0" cy="26" rx="5.5" ry="3.2" fill="#34D399"/></g>
<path class="f m-sad" d="M-9,28 Q0,17 9,28" fill="none" stroke="#052E1C" stroke-width="3.5" stroke-linecap="round"/>
<ellipse class="f m-o" cx="0" cy="24" rx="5.5" ry="8" fill="#052E1C"/>
<path class="f m-sleep" d="M-6,22 Q0,26 6,22" fill="none" stroke="#052E1C" stroke-width="3.5" stroke-linecap="round"/>
<ellipse class="f tear" cx="-40" cy="14" rx="4" ry="6" fill="#A7F3D0"/>
<path class="f m-zig" d="M-10,28 L-5,22 L0,28 L5,22 L10,28" fill="none" stroke="#052E1C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<path class="f m-wavy" d="M-9,24 Q-4.5,18 0,24 Q4.5,30 9,24" fill="none" stroke="#052E1C" stroke-width="3.5" stroke-linecap="round"/>
<g class="f m-laugh"><path d="M-17,10 Q0,52 17,10Z" fill="#052E1C"/><ellipse cx="0" cy="30" rx="8" ry="5" fill="#34D399"/></g>
<path class="f m-flat" d="M-7,25 L7,22" fill="none" stroke="#052E1C" stroke-width="3.5" stroke-linecap="round"/>
<path class="f m-smirk" d="M-8,29 Q4,37 14,25" fill="none" stroke="#052E1C" stroke-width="3.5" stroke-linecap="round"/>
<g class="f joy"><ellipse cx="-54" cy="2" rx="4" ry="6" fill="#A7F3D0"/><ellipse cx="54" cy="2" rx="4" ry="6" fill="#A7F3D0"/></g>
</g>
</g>
<g class="f zzz"><g transform="translate(60,-70)"><text class="z" font-size="18" font-weight="500" fill="#6EE7B7">z</text></g><g transform="translate(74,-88)"><text class="z" font-size="24" font-weight="500" fill="#6EE7B7">z</text></g><g transform="translate(90,-108)"><text class="z" font-size="30" font-weight="500" fill="#6EE7B7">Z</text></g></g>
<g class="f excl" transform="translate(0,-102)"><rect x="-3.5" y="-16" width="7" height="17" rx="3.5" fill="#F5F5F0"/><circle cy="8" r="4.2" fill="#F5F5F0"/></g>
<g class="f hearts"><g transform="translate(-55,-70)"><path class="hr" d="M0,8 C-14,-4 -10,-17 0,-10 C10,-17 14,-4 0,8Z" fill="#34D399"/></g><g transform="translate(5,-84)"><path class="hr b" d="M0,8 C-14,-4 -10,-17 0,-10 C10,-17 14,-4 0,8Z" fill="#34D399"/></g><g transform="translate(62,-66)"><path class="hr c" d="M0,8 C-14,-4 -10,-17 0,-10 C10,-17 14,-4 0,8Z" fill="#34D399"/></g></g>
<g class="f qm" transform="translate(40,-92)"><text class="bob" font-size="34" font-weight="500" fill="#F5F5F0">?</text></g>
<g class="f vein" transform="translate(64,-62)"><path class="pul" d="M-8,-4 Q-4,-4 -4,-8 M8,-4 Q4,-4 4,-8 M-8,4 Q-4,4 -4,8 M8,4 Q4,4 4,8" fill="none" stroke="#8E8E8A" stroke-width="3.5" stroke-linecap="round"/></g>
<g class="f spark"><g transform="translate(-112,-60)"><path class="sp" d="M0,-10 L3,-3 L10,0 L3,3 L0,10 L-3,3 L-10,0 L-3,-3Z" fill="#6EE7B7"/></g><g transform="translate(116,-40)"><path class="sp" style="animation-delay:.4s" d="M0,-8 L2.5,-2.5 L8,0 L2.5,2.5 L0,8 L-2.5,2.5 L-8,0 L-2.5,-2.5Z" fill="#6EE7B7"/></g></g>
</g>
</svg>`;

  var MOODS = ['idle','happy','jump','sad','surprised','sleepy','love','wink','laugh','shy','angry','think','dizzy','cool','scared','bored','excited','cry','sneaky'];

  var LINES = {
    idle: ['Привет! Я слайм-помощник.', 'Буль-буль…', 'Чем могу помочь?'],
    happy: ['Ура! Всё получилось!', 'Хи-хи!'],
    jump: ['Прыг-скок!', 'Выше, выше!'],
    sad: ['Что-то пошло не так…', 'Ой, ошибка…'],
    surprised: ['Ого! Это новая фича?', 'Ай!'],
    sleepy: ['Zzz… я просто моргаю…'],
    love: ['Ты мой любимый пользователь!'],
    wink: ['Это будет наш секрет!', 'Подмигиваю тебе!'],
    laugh: ['Ха-ха-ха!', 'Не могу, так смешно!'],
    shy: ['Ой, ты меня смущаешь…', 'Не смотри так…'],
    angry: ['Грр! Мне не нравится эта ошибка!', 'Я не сержусь… почти.'],
    think: ['Хм… дай подумать…', 'Так, а что если…'],
    dizzy: ['Всё кружится…', 'Ой-ой, слишком много данных…'],
    cool: ['Я крутой слайм.', 'Всё под контролем.'],
    scared: ['Ай! Что это было?!', 'Мне страшно…'],
    bored: ['Скучно…', 'Ну когда уже что-нибудь случится?'],
    excited: ['Ух ты! Ух ты! Ух ты!', 'Это лучший день!'],
    cry: ['Уа-а-а…', 'Я не плачу, это дождь…'],
    sneaky: ['Хе-хе… у меня есть план.', 'Тсс… никому не говори.']
  };

  var POKES = ['Ой!', 'Хихи, щекотно!', 'Бульк!', 'Не дави так сильно!'];

  var EVENTS = {
    success: 'happy', done: 'jump', error: 'sad', warning: 'surprised',
    loading: 'think', thinking: 'think', praise: 'love', thanks: 'shy',
    joke: 'laugh', secret: 'wink', confused: 'dizzy', bug: 'angry',
    cool: 'cool', sleep: 'sleepy', idle: 'idle'
  };
  var HOLD = { loading: 1, thinking: 1, sleep: 1, idle: 1 };

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clamp(v) { return Math.max(-1, Math.min(1, v)); }

  function mount(container, opts) {
    opts = opts || {};
    var idleMs = opts.idleSleepMs === undefined ? 20000 : opts.idleSleepMs;
    var lines = Object.assign({}, LINES, opts.lines || {});
    container.innerHTML = MARKUP;
    var svg = container.querySelector('.slime');
    var bounce = svg.querySelector('.slime-bounce');
    var face = svg.querySelector('.slime-face');
    var mood = 'idle', idleT, revertT, tmpT;

    function say(text) {
      if (!text) return;
      if (opts.speechEl) opts.speechEl.textContent = text;
      if (typeof opts.onSay === 'function') opts.onSay(text);
    }

    function resetIdle() {
      clearTimeout(idleT);
      if (idleMs > 0 && mood !== 'sleepy') idleT = setTimeout(function () { setMood('sleepy'); }, idleMs);
    }

    function setMood(m, o) {
      o = o || {};
      if (MOODS.indexOf(m) < 0) return mood;
      clearTimeout(revertT); clearTimeout(tmpT);
      mood = m;
      svg.setAttribute('data-mood', m);
      if (!o.silent) say(pick(lines[m] || LINES.idle));
      if (o.duration > 0) revertT = setTimeout(function () { setMood(o.revertTo || 'idle', { silent: true }); }, o.duration);
      resetIdle();
      if (typeof opts.onMoodChange === 'function') opts.onMoodChange(m);
      container.dispatchEvent(new CustomEvent('slime:mood', { detail: { mood: m } }));
      return m;
    }

    function react(name, o) {
      o = Object.assign({ duration: HOLD[name] ? 0 : 2500 }, o || {});
      return setMood(EVENTS[name] || name, o);
    }

    function poke() {
      bounce.classList.remove('poke');
      void bounce.getBoundingClientRect();
      bounce.classList.add('poke');
      if (mood === 'sleepy') {
        setMood('surprised', { silent: true });
        say('Ой! Я не спал!');
        tmpT = setTimeout(function () { setMood('idle', { silent: true }); }, 1400);
      } else {
        say(pick(POKES));
        if (mood === 'idle') {
          setMood('happy', { silent: true });
          tmpT = setTimeout(function () { setMood('idle', { silent: true }); }, 1300);
        }
      }
      resetIdle();
      container.dispatchEvent(new CustomEvent('slime:poke'));
    }

    function onAnimEnd(e) { if (e.animationName === 'slime-squish') bounce.classList.remove('poke'); }
    function onMove(e) {
      var r = svg.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height * 0.6;
      face.style.transform = 'translate(' + (clamp((e.clientX - cx) / (r.width / 2)) * 6) + 'px,' + (clamp((e.clientY - cy) / (r.height / 2)) * 4) + 'px)';
    }
    function onLeave() { face.style.transform = 'translate(0,0)'; }

    bounce.addEventListener('pointerdown', poke);
    bounce.addEventListener('animationend', onAnimEnd);
    if (opts.trackPointer !== false) {
      window.addEventListener('pointermove', onMove);
      document.addEventListener('pointerleave', onLeave);
    }

    if (opts.mood) setMood(opts.mood, { silent: opts.greet === false });
    else { resetIdle(); if (opts.greet !== false) say(pick(lines.idle)); }

    return {
      el: svg,
      moods: MOODS.slice(),
      setMood: setMood,
      getMood: function () { return mood; },
      react: react,
      poke: poke,
      say: say,
      destroy: function () {
        clearTimeout(idleT); clearTimeout(revertT); clearTimeout(tmpT);
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerleave', onLeave);
        container.innerHTML = '';
      }
    };
  }

  return { mount: mount, MOODS: MOODS, EVENTS: EVENTS, LINES: LINES, MARKUP: MARKUP };
});
