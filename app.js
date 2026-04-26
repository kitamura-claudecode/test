(function () {
  'use strict';

  const clockEl     = document.getElementById('clock');
  const alarmTimeEl = document.getElementById('alarmTime');
  const alarmLabelEl= document.getElementById('alarmLabel');
  const addBtn      = document.getElementById('addBtn');
  const alarmsEl    = document.getElementById('alarms');
  const noAlarmsEl  = document.getElementById('noAlarms');
  const ringOverlay = document.getElementById('ringOverlay');
  const ringLabelEl = document.getElementById('ringLabel');
  const ringTimeEl  = document.getElementById('ringTime');
  const stopBtn     = document.getElementById('stopBtn');

  let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
  let audioCtx = null;
  let ringingNodes = [];
  let ringingId = null;

  // ── Clock ──────────────────────────────────────────────
  function pad(n) { return String(n).padStart(2, '0'); }

  function updateClock() {
    const now = new Date();
    clockEl.textContent =
      pad(now.getHours()) + ':' +
      pad(now.getMinutes()) + ':' +
      pad(now.getSeconds());
    checkAlarms(now);
  }

  setInterval(updateClock, 1000);
  updateClock();

  // ── Alarm check ────────────────────────────────────────
  function checkAlarms(now) {
    if (ringingId !== null) return;
    const hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());
    if (now.getSeconds() !== 0) return;

    alarms.forEach(function (alarm) {
      if (alarm.enabled && alarm.time === hhmm) {
        startRinging(alarm);
      }
    });
  }

  // ── Web Audio beep ─────────────────────────────────────
  function startRinging(alarm) {
    ringingId = alarm.id;
    ringLabelEl.textContent = alarm.label || '';
    ringTimeEl.textContent  = alarm.time;
    ringOverlay.classList.remove('hidden');
    playBeep();
  }

  function playBeep() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    function beepOnce() {
      if (ringingId === null) return;
      var osc  = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.6);
      ringingNodes.push(osc);
      setTimeout(beepOnce, 900);
    }
    beepOnce();
  }

  function stopRinging() {
    ringingId = null;
    ringOverlay.classList.add('hidden');
    ringingNodes.forEach(function (n) {
      try { n.stop(); } catch (e) {}
    });
    ringingNodes = [];
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
  }

  stopBtn.addEventListener('click', stopRinging);

  // ── Add alarm ──────────────────────────────────────────
  addBtn.addEventListener('click', function () {
    var time = alarmTimeEl.value;
    if (!time) { alert('時刻を選択してください'); return; }
    var alarm = {
      id:      Date.now(),
      time:    time,
      label:   alarmLabelEl.value.trim(),
      enabled: true
    };
    alarms.push(alarm);
    saveAndRender();
    alarmTimeEl.value  = '';
    alarmLabelEl.value = '';
  });

  // ── Render ─────────────────────────────────────────────
  function render() {
    alarmsEl.innerHTML = '';
    noAlarmsEl.style.display = alarms.length === 0 ? 'block' : 'none';

    alarms
      .slice()
      .sort(function (a, b) { return a.time.localeCompare(b.time); })
      .forEach(function (alarm) {
        var li = document.createElement('li');
        li.className = 'alarm-item' + (alarm.enabled ? '' : ' disabled');
        li.dataset.id = alarm.id;

        li.innerHTML =
          '<span class="alarm-time">' + alarm.time + '</span>' +
          '<span class="alarm-label">' + escHtml(alarm.label) + '</span>' +
          '<div class="alarm-actions">' +
            '<label class="toggle-switch">' +
              '<input type="checkbox" ' + (alarm.enabled ? 'checked' : '') + ' data-id="' + alarm.id + '" class="toggle-input" />' +
              '<span class="slider"></span>' +
            '</label>' +
            '<button class="delete-btn" data-id="' + alarm.id + '">削除</button>' +
          '</div>';

        alarmsEl.appendChild(li);
      });

    document.querySelectorAll('.toggle-input').forEach(function (el) {
      el.addEventListener('change', function () {
        var id = Number(this.dataset.id);
        var alarm = alarms.find(function (a) { return a.id === id; });
        if (alarm) { alarm.enabled = this.checked; saveAndRender(); }
      });
    });

    document.querySelectorAll('.delete-btn').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = Number(this.dataset.id);
        alarms = alarms.filter(function (a) { return a.id !== id; });
        saveAndRender();
      });
    });
  }

  function saveAndRender() {
    localStorage.setItem('alarms', JSON.stringify(alarms));
    render();
  }

  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  render();
}());
