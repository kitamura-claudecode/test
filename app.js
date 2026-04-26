(function () {
  'use strict';

  const TOTAL_POKEMON = 1025;

  const STAT_LABELS = {
    'hp':              'HP',
    'attack':          'ATK',
    'defense':         'DEF',
    'special-attack':  'SpA',
    'special-defense': 'SpD',
    'speed':           'SPD',
  };

  // Per-stat visual maximum for bar scaling
  const STAT_MAX = {
    'hp':              255,
    'attack':          190,
    'defense':         230,
    'special-attack':  194,
    'special-defense': 230,
    'speed':           200,
  };

  // Gradient color per stat
  const STAT_COLORS = {
    'hp':              ['#f87171', '#ef4444'],
    'attack':          ['#fb923c', '#f97316'],
    'defense':         ['#facc15', '#eab308'],
    'special-attack':  ['#60a5fa', '#3b82f6'],
    'special-defense': ['#34d399', '#10b981'],
    'speed':           ['#c084fc', '#a855f7'],
  };

  const card        = document.getElementById('card');
  const initialState = document.getElementById('initialState');
  const loading     = document.getElementById('loading');
  const display     = document.getElementById('pokemonDisplay');
  const rollBtn     = document.getElementById('rollBtn');

  const idEl       = document.getElementById('pokemonId');
  const imgEl      = document.getElementById('pokemonImg');
  const nameEl     = document.getElementById('pokemonName');
  const badgesEl   = document.getElementById('typeBadges');
  const heightEl   = document.getElementById('pokemonHeight');
  const weightEl   = document.getElementById('pokemonWeight');
  const abilityEl  = document.getElementById('pokemonAbility');
  const statsGrid  = document.getElementById('statsGrid');

  function showState(state) {
    initialState.classList.add('hidden');
    loading.classList.add('hidden');
    display.classList.add('hidden');
    if (state === 'initial') initialState.classList.remove('hidden');
    if (state === 'loading') loading.classList.remove('hidden');
    if (state === 'display') display.classList.remove('hidden');
  }

  function randomId() {
    return Math.floor(Math.random() * TOTAL_POKEMON) + 1;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Format hyphenated name nicely (e.g. "mr-mime" → "Mr. Mime")
  function formatName(name) {
    return name.split('-').map(capitalize).join(' ');
  }

  function buildTypeBadges(types) {
    badgesEl.innerHTML = '';
    types.forEach(function (t) {
      var span = document.createElement('span');
      span.className = 'type-badge type-' + t.type.name;
      span.textContent = t.type.name;
      badgesEl.appendChild(span);
    });
  }

  function buildStats(stats) {
    statsGrid.innerHTML = '';
    stats.forEach(function (s) {
      var name  = s.stat.name;
      var value = s.base_stat;
      var max   = STAT_MAX[name] || 255;
      var pct   = Math.min(100, Math.round((value / max) * 100));
      var colors = STAT_COLORS[name] || ['#a78bfa', '#7c3aed'];

      var row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML =
        '<span class="stat-name">' + (STAT_LABELS[name] || name) + '</span>' +
        '<span class="stat-val">' + value + '</span>' +
        '<div class="stat-bar-bg">' +
          '<div class="stat-bar" style="width:0%;background:linear-gradient(90deg,' + colors[0] + ',' + colors[1] + ')"></div>' +
        '</div>';
      statsGrid.appendChild(row);

      // Animate bar width on next frame
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          row.querySelector('.stat-bar').style.width = pct + '%';
        });
      });
    });
  }

  function getAbilityLabel(abilities) {
    var main = abilities.find(function (a) { return !a.is_hidden; });
    if (!main) main = abilities[0];
    return main ? formatName(main.ability.name) : '-';
  }

  function applyTypeAccent(primaryType) {
    // Tint the card border with the primary type color
    var typeColorMap = {
      normal: '#7a7a6a', fire: '#d45c0a', water: '#3a72e8',
      electric: '#c9aa0a', grass: '#4a9c30', ice: '#4daaaa',
      fighting: '#a02020', poison: '#8a30a0', ground: '#b08020',
      flying: '#7060d0', psychic: '#d03070', bug: '#7a8a10',
      rock: '#8a7020', ghost: '#503878', dragon: '#4020c8',
      dark: '#4a3828', steel: '#7a7a9a', fairy: '#c04878',
    };
    var color = typeColorMap[primaryType] || '#7c3aed';
    card.style.borderColor = color + '66';
    card.style.boxShadow = '0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px ' + color + '33';
  }

  function renderPokemon(data) {
    idEl.textContent  = '#' + String(data.id).padStart(3, '0');
    nameEl.textContent = formatName(data.name);

    var artwork = data.sprites.other['official-artwork'].front_default
                  || data.sprites.front_default
                  || '';
    imgEl.src = artwork;
    imgEl.alt = data.name;

    buildTypeBadges(data.types);
    heightEl.textContent = (data.height / 10).toFixed(1) + ' m';
    weightEl.textContent = (data.weight / 10).toFixed(1) + ' kg';
    abilityEl.textContent = getAbilityLabel(data.abilities);
    buildStats(data.stats);

    applyTypeAccent(data.types[0].type.name);
    showState('display');
  }

  async function fetchRandom() {
    rollBtn.disabled = true;
    showState('loading');

    try {
      var id = randomId();
      var res = await fetch('https://pokeapi.co/api/v2/pokemon/' + id);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      renderPokemon(data);
    } catch (err) {
      showState('initial');
      alert('ポケモンの取得に失敗しました。もう一度お試しください。');
    } finally {
      rollBtn.disabled = false;
    }
  }

  rollBtn.addEventListener('click', fetchRandom);
}());
