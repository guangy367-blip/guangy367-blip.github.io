(() => {
  "use strict";
  const controls = [...document.querySelectorAll("[data-music]")];
  if (!controls.length) return;

  // Four related phrases in D gong. Each row lasts eight beats, including its rests.
  // Entries are beat, MIDI pitch and relative touch. The lower open string answers
  // the melody only at selected phrase boundaries.
  const phrases = [
    [[0,50,.62],[.08,62,.91],[1.57,64,.64],[2.25,69,.79],[4.08,66,.84],[5.55,64,.61]],
    [[0,57,.54],[.53,62,.85],[2.03,59,.73],[3.45,62,.92],[5.45,66,.62],[6.04,64,.53]],
    [[0,50,.60],[.10,69,.85],[1.50,71,.67],[2.30,74,.82],[4.15,71,.83],[5.40,69,.63]],
    [[.08,66,.85],[1.54,64,.67],[2.56,62,.96],[4.43,57,.62],[5.05,62,.58]],
    [[0,54,.52],[.24,66,.84],[1.74,69,.75],[2.54,71,.69],[4.06,69,.84],[5.64,66,.61]],
    [[0,57,.55],[.52,64,.85],[2.04,66,.80],[3.48,62,.88],[5.56,59,.61]],
    [[0,50,.61],[.10,62,.90],[1.73,64,.68],[2.47,69,.81],[3.97,66,.70],[5.53,64,.62]],
    [[.04,59,.71],[1.52,57,.70],[3.02,50,.54],[3.10,62,1],[5.68,62,.48]]
  ];
  const beat = .90;
  const cycle = phrases.length * 8 * beat;
  const score = phrases.flatMap((phrase,i) => phrase.map(([at,pitch,touch]) => [(i*8+at)*beat,pitch,touch]));
  const branchNotes = [62,64,66,69,71];
  const voices = new Set();
  const Context = window.AudioContext || window.webkitAudioContext;
  let context, output, bodyWave, brightWave, damping, timer, suspendTimer;
  let enabled = false, playing = false, generation = 0, hiddenPage = false;
  let origin = 0, resumePoint = 0, next = 0, nextCycle = 0, lastBranch = -1;

  function updateControls(error = "") {
    for (const button of controls) {
      button.setAttribute("aria-pressed",String(enabled));
      const label = error || (enabled ? "暂停背景音乐" : "播放背景音乐");
      button.setAttribute("aria-label",label);
      button.title = label;
      const copy = button.querySelector(".music-label");
      if (copy) copy.textContent = error ? "暂不可用" : enabled ? "暂停音乐" : "音乐";
    }
  }

  function makeWave(amplitudes) {
    return context.createPeriodicWave(new Float32Array(amplitudes.length),new Float32Array(amplitudes));
  }
  function prepare() {
    if (context) return;
    context = new Context();
    bodyWave = makeWave([0,1,.35,.21,.065,.041,.032,.014,.009,.005]);
    brightWave = makeWave([0,0,.43,.85,.25,.37,.09,.15,.06,.03]);
    output = context.createGain();
    output.gain.value = 0;
    damping = context.createBiquadFilter();
    damping.type = "lowpass";
    damping.frequency.value = 3000;
    damping.Q.value = .42;
    damping.connect(output);
    output.connect(context.destination);

    // A small, damped reflection gives the pluck room without a sampled impulse.
    const echo = context.createDelay(.4), returnGain = context.createGain(), tone = context.createBiquadFilter();
    echo.delayTime.value = .162;
    returnGain.gain.value = .15;
    tone.type = "lowpass";
    tone.frequency.value = 1350;
    damping.connect(echo);
    echo.connect(tone);
    tone.connect(returnGain);
    returnGain.connect(output);
    returnGain.connect(echo);
  }

  function voice(pitch, touch, time) {
    const bass = pitch < 60;
    const frequency = 440 * Math.pow(2,(pitch-69)/12);
    const duration = bass ? 2.5 : 1.85;
    const volume = touch * (bass ? .28 : .37);
    function partial(wave, gain, length, attack, bend) {
      const osc = context.createOscillator(), envelope = context.createGain();
      osc.setPeriodicWave(wave);
      osc.frequency.value = frequency;
      osc.detune.setValueAtTime(bend,time);
      osc.detune.exponentialRampToValueAtTime(.1,time+.15);
      envelope.gain.setValueAtTime(.0001,time);
      envelope.gain.exponentialRampToValueAtTime(gain,time+attack);
      envelope.gain.exponentialRampToValueAtTime(gain*.36,time+length*.22);
      envelope.gain.exponentialRampToValueAtTime(.0001,time+length);
      osc.connect(envelope);
      envelope.connect(damping);
      voices.add(osc);
      osc.addEventListener("ended",() => {voices.delete(osc);osc.disconnect();envelope.disconnect()},{once:true});
      osc.start(time);
      osc.stop(time+length+.02);
    }
    partial(bodyWave,volume,duration,.012,bass?2.4:4);
    partial(brightWave,volume*.27,.24,.004,6);
  }

  function tick() {
    if (!playing || context.state !== "running") return;
    const now = context.currentTime, horizon = now+.19;
    let time = origin+nextCycle*cycle+score[next][0];
    while (time <= horizon) {
      if (time >= now-.035) voice(score[next][1],score[next][2],Math.max(now+.004,time));
      if (++next === score.length) {next=0;nextCycle++}
      time = origin+nextCycle*cycle+score[next][0];
    }
  }
  function start() {
    if (playing || !enabled || document.hidden || hiddenPage) return;
    playing = true;
    const now = context.currentTime;
    origin = now+.055-resumePoint;
    next = score.findIndex(event => event[0]>=resumePoint-.005);
    nextCycle = next < 0 ? 1 : 0;
    if (next < 0) next=0;
    output.gain.cancelScheduledValues(now);
    output.gain.setTargetAtTime(.51,now,.023);
    tick();
    timer = setInterval(tick,100);
  }
  function pause(immediate) {
    clearInterval(timer);
    clearTimeout(suspendTimer);
    if (!context) return;
    const now = context.currentTime;
    if (playing) resumePoint=(Math.max(0,now-origin))%cycle;
    playing=false;
    output.gain.cancelScheduledValues(now);
    output.gain.setTargetAtTime(0,now,.014);
    for (const osc of voices) osc.stop(now+(immediate?0:.065));
    function suspend() {
      if (!playing && context.state === "running") context.suspend().catch(()=>{});
    }
    if (immediate) suspend();
    else suspendTimer=setTimeout(suspend,85);
  }
  async function sync() {
    const token = ++generation;
    clearTimeout(suspendTimer);
    if (!enabled || document.hidden || hiddenPage) {pause(document.hidden || hiddenPage);return}
    try {
      prepare();
      await context.resume();
      if (token===generation) start();
      else if (!enabled || document.hidden || hiddenPage) pause(true);
    } catch {
      if (token!==generation) return;
      enabled=false;
      pause(true);
      updateControls("暂时无法播放，点击重试");
    }
  }
  controls.forEach(button => button.addEventListener("click",()=>{
    if (!Context) {updateControls("当前浏览器不支持背景音乐");return}
    enabled=!enabled;
    updateControls();
    sync();
  }));
  window.addEventListener("branch-pluck",event=>{
    const index=event.detail?.note;
    if (!playing || document.hidden || context.state!=="running" || !Number.isInteger(index) || !branchNotes[index]) return;
    const now=context.currentTime;
    if (now-lastBranch<.13) return;
    lastBranch=now;
    voice(branchNotes[index],.75,now+.008);
  });
  document.addEventListener("visibilitychange",sync);
  window.addEventListener("pagehide",()=>{hiddenPage=true;sync()});
  window.addEventListener("pageshow",()=>{hiddenPage=false;sync()});
  updateControls();
})();
