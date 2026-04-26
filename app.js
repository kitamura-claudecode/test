(function () {
  'use strict';

  var BREED_DATA = {
    'retriever/golden': {
      name: 'ゴールデン・レトリーバー',
      nameEn: 'Golden Retriever',
      description: '明るく穏やかな性格で、人を癒す天才。ストレスで疲れた心を、ふわふわの毛並みと笑顔でほぐしてくれます。どんな時も全力で寄り添ってくれる最高の癒し犬です。',
      traits: ['温厚', '賢い', '癒し系', '家族思い']
    },
    'labrador': {
      name: 'ラブラドール・レトリーバー',
      nameEn: 'Labrador Retriever',
      description: '世界で最も人気の犬種。底抜けに明るく、どんな時も全力で寄り添ってくれる、最高の心の支えです。その笑顔が疲れた心を一瞬で和らげます。',
      traits: ['フレンドリー', '忠実', '元気', '賢い']
    },
    'beagle': {
      name: 'ビーグル',
      nameEn: 'Beagle',
      description: '陽気でのんびりとした性格。愛らしい顔と丸い瞳で、じわじわとストレスを溶かしてくれます。独特の表情も含め、見ているだけで笑顔になれる犬です。',
      traits: ['陽気', '好奇心旺盛', '社交的', '可愛い']
    },
    'pug': {
      name: 'パグ',
      nameEn: 'Pug',
      description: 'くしゃっとした顔と小さな体で、あなたのそばにぴったりくっついていてくれます。孤独を一緒に埋めてくれる、最高の甘えん坊です。',
      traits: ['甘えん坊', 'ユーモラス', 'コンパクト', '愛情深い']
    },
    'corgi/pembroke': {
      name: 'ウェルシュ・コーギー',
      nameEn: 'Corgi (Pembroke)',
      description: '短い脚でちょこちょこ走る姿が最高に癒し。いつでもあなたを元気にしてくれる天然のムードメーカー。笑っているような口元が特徴的です。',
      traits: ['明るい', '賢い', '愛嬌抜群', '元気']
    },
    'pomeranian': {
      name: 'ポメラニアン',
      nameEn: 'Pomeranian',
      description: 'ふわふわの毛並みとつぶらな瞳。甘えてくる姿が寂しさをやわらげ、心の空白を埋めてくれます。まるでぬいぐるみのような愛らしさです。',
      traits: ['愛らしい', '甘えん坊', 'ふわふわ', '元気']
    },
    'collie/border': {
      name: 'ボーダー・コリー',
      nameEn: 'Border Collie',
      description: '世界一賢い犬と言われる頭脳派。あなたの旺盛なエネルギーをしっかり受け止め、知的な遊びで全力で応えてくれます。',
      traits: ['超高知能', 'アクティブ', '忠実', '俊敏']
    },
    'husky': {
      name: 'シベリアン・ハスキー',
      nameEn: 'Siberian Husky',
      description: '力強く美しい外見と、オオカミを思わせる神秘的な瞳。アクティブなあなたと一緒に大自然を駆け回りたい冒険家です。',
      traits: ['パワフル', '自由奔放', 'ビジュアル系', '遊び好き']
    },
    'shepherd/australian': {
      name: 'オーストラリアン・シェパード',
      nameEn: 'Australian Shepherd',
      description: '美しいマーブル模様の毛並みとエネルギーの塊。あなたのアクティブなライフスタイルに完璧に寄り添ってくれます。',
      traits: ['俊敏', '賢い', '活発', 'マルチカラー']
    },
    'shiba': {
      name: '柴犬',
      nameEn: 'Shiba Inu',
      description: '日本古来の愛すべき存在。独立心が強いながらも、そっとそばにいてくれます。凛々しい顔立ちを見ているだけで、自然と心が落ち着いてきます。',
      traits: ['凛々しい', '日本の魂', '独立心', '忠実']
    },
    'maltese': {
      name: 'マルチーズ',
      nameEn: 'Maltese',
      description: '真っ白でふわふわ、まるで白い雲のよう。繊細で優しい性格で、疲れた心を穏やかに癒してくれます。抱きしめたくなる愛らしさです。',
      traits: ['ふわふわ', '優しい', '白い天使', '小さい']
    },
    'samoyed': {
      name: 'サモエド',
      nameEn: 'Samoyed',
      description: '常に微笑んでいるような「サモエドスマイル」が特徴的。フワフワの白い毛並みは、抱きしめるだけで全てが癒される究極の癒し犬です。',
      traits: ['スマイル', 'ふわふわ', '純白', '穏やか']
    },
    'germanshepherd': {
      name: 'ジャーマン・シェパード',
      nameEn: 'German Shepherd',
      description: '力強く知性的な姿が、見ているだけでやる気をチャージさせてくれます。頼れる相棒として前に進む勇気をくれる存在です。',
      traits: ['頼もしい', '賢い', '勇敢', '忠実']
    },
    'boxer': {
      name: 'ボクサー',
      nameEn: 'Boxer',
      description: '元気いっぱいで遊び好き。その無邪気な笑顔とパワフルな行動力が、あなたの無気力を吹き飛ばしてくれます。子犬のような心を持つ大人の犬です。',
      traits: ['元気', '遊び好き', 'パワフル', '愛情深い']
    },
    'doberman': {
      name: 'ドーベルマン',
      nameEn: 'Doberman Pinscher',
      description: 'スマートで引き締まった体、凛々しい表情。その圧倒的な存在感があなたに「自分もやれる」という気持ちを与えてくれます。',
      traits: ['威厳', '賢い', '勇気', 'クール']
    },
    'dalmatian': {
      name: 'ダルメシアン',
      nameEn: 'Dalmatian',
      description: '白地に黒の水玉模様が個性的でユニーク。陽気で遊び好きな性格は、あなたと一緒に笑顔あふれる最高の時間を作ってくれます。',
      traits: ['個性的', '陽気', '活発', '遊び好き']
    },
    'bulldog/french': {
      name: 'フレンチ・ブルドッグ',
      nameEn: 'French Bulldog',
      description: 'コンパクトなボディと愛嬌たっぷりの顔で、見る人みんなを笑顔にする達人。一緒にいるだけで楽しい気持ちがどんどん広がります！',
      traits: ['可愛い', '面白い', 'コンパクト', '社交的']
    },
    'terrier/boston': {
      name: 'ボストン・テリア',
      nameEn: 'Boston Terrier',
      description: 'タキシードを着ているような白黒模様がおしゃれ。陽気で遊び好きな性格で、あなたとの楽しい時間を最高に演出してくれます。',
      traits: ['おしゃれ', '陽気', '賢い', '遊び好き']
    }
  };

  var MOODS = [
    {
      id: 'stressed',
      emoji: '😮‍💨',
      label: 'ストレスを感じている',
      sublabel: '疲れた・プレッシャーで辛い',
      gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
      breeds: ['retriever/golden', 'labrador', 'beagle'],
      resultTitle: 'ストレスを和らげてくれる犬たち',
      resultDesc: '穏やかで癒し系の犬たちが、疲れた心をそっとほぐしてくれます'
    },
    {
      id: 'lonely',
      emoji: '🥺',
      label: '孤独・寂しい',
      sublabel: '誰かにそばにいてほしい',
      gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
      breeds: ['pug', 'corgi/pembroke', 'pomeranian'],
      resultTitle: 'いつもそばにいてくれる犬たち',
      resultDesc: '甘えん坊で愛情深い犬たちが、あなたの孤独を埋めてくれます'
    },
    {
      id: 'energetic',
      emoji: '⚡',
      label: 'エネルギッシュ！',
      sublabel: '元気いっぱい・アクティブに動きたい',
      gradient: 'linear-gradient(135deg, #f97316, #eab308)',
      breeds: ['collie/border', 'husky', 'shepherd/australian'],
      resultTitle: 'あなたのエネルギーに応える犬たち',
      resultDesc: '活発で知的な犬たちがあなたと全力で駆け回ります'
    },
    {
      id: 'healing',
      emoji: '🌸',
      label: '癒されたい',
      sublabel: 'のんびりしたい・ほっこりしたい',
      gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      breeds: ['shiba', 'maltese', 'samoyed'],
      resultTitle: 'ふわっと癒してくれる犬たち',
      resultDesc: 'まったりとした癒しをくれる、穏やかな犬たちです'
    },
    {
      id: 'unmotivated',
      emoji: '😴',
      label: '無気力・やる気がない',
      sublabel: '前向きになりたい・元気が欲しい',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      breeds: ['germanshepherd', 'boxer', 'doberman'],
      resultTitle: 'やる気をチャージしてくれる犬たち',
      resultDesc: '頼もしくカッコいい犬たちがあなたの背中を押します'
    },
    {
      id: 'playful',
      emoji: '😆',
      label: '楽しみたい！',
      sublabel: '笑いたい・ワクワクしたい気分',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      breeds: ['dalmatian', 'bulldog/french', 'terrier/boston'],
      resultTitle: '一緒に笑顔になれる犬たち',
      resultDesc: 'ユニークで陽気な犬たちと最高に楽しい時間を過ごそう'
    }
  ];

  var app           = document.getElementById('app');
  var detailModal   = document.getElementById('detailModal');
  var modalClose    = document.getElementById('modalClose');
  var modalBackdrop = document.getElementById('modalBackdrop');
  var modalBody     = document.getElementById('modalBody');

  function fetchDogImage(breedPath) {
    return fetch('https://dog.ceo/api/breed/' + breedPath + '/images/random')
      .then(function (r) { return r.json(); })
      .then(function (d) { return d.status === 'success' ? d.message : null; })
      .catch(function () { return null; });
  }

  function fetchDogImages(breedPath, count) {
    return fetch('https://dog.ceo/api/breed/' + breedPath + '/images/random/' + (count || 3))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.status !== 'success') return [];
        return Array.isArray(d.message) ? d.message : [d.message];
      })
      .catch(function () { return []; });
  }

  function headerHtml(subtitleHtml, showBack) {
    return '<header class="header">' +
      '<div class="header-side">' +
        (showBack ? '<button class="back-btn" id="backBtn">← 戻る</button>' : '') +
      '</div>' +
      '<div class="header-center">' +
        '<span class="logo">🐕</span>' +
        '<div>' +
          '<h1>犬種図鑑</h1>' +
          '<p class="subtitle">' + subtitleHtml + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="header-side"></div>' +
    '</header>';
  }

  function renderMoodScreen() {
    app.innerHTML =
      headerHtml('今の気分に合う犬を見つけよう', false) +
      '<div class="container">' +
        '<div class="glass-card question-card">' +
          '<h2 class="question-title">今、どんな気分ですか？</h2>' +
          '<p class="question-sub">あなたの今の精神状態を選んでください</p>' +
          '<div class="mood-grid">' +
            MOODS.map(function (m) {
              return '<button class="mood-card" data-id="' + m.id + '" style="--mood-gradient:' + m.gradient + '">' +
                '<span class="mood-emoji">' + m.emoji + '</span>' +
                '<span class="mood-label">' + m.label + '</span>' +
                '<span class="mood-sublabel">' + m.sublabel + '</span>' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    document.querySelectorAll('.mood-card').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mood = MOODS.find(function (m) { return m.id === btn.dataset.id; });
        if (mood) renderResultScreen(mood);
      });
    });
  }

  function renderResultScreen(mood) {
    app.innerHTML =
      headerHtml(mood.emoji + ' ' + mood.label, true) +
      '<div class="container">' +
        '<div class="glass-card result-banner">' +
          '<h2 class="result-title">' + mood.resultTitle + '</h2>' +
          '<p class="result-desc">' + mood.resultDesc + '</p>' +
        '</div>' +
        '<div class="breeds-grid" id="breedsGrid">' +
          mood.breeds.map(function (path) {
            return '<div class="breed-card glass-card loading" data-breed="' + path + '">' +
              '<div class="breed-img-wrap skeleton-wrap"><div class="skeleton-pulse"></div></div>' +
              '<div class="breed-info-loading">' +
                '<div class="skeleton-line w80"></div>' +
                '<div class="skeleton-line w50"></div>' +
                '<div class="skeleton-line w100"></div>' +
                '<div class="skeleton-line w90"></div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    document.getElementById('backBtn').addEventListener('click', renderMoodScreen);

    mood.breeds.forEach(function (path) {
      var breed = BREED_DATA[path];
      if (!breed) return;

      fetchDogImage(path).then(function (imgUrl) {
        var card = document.querySelector('.breed-card[data-breed="' + path + '"]');
        if (!card) return;
        card.classList.remove('loading');

        card.innerHTML =
          '<div class="breed-img-wrap">' +
            (imgUrl
              ? '<img src="' + imgUrl + '" alt="' + breed.nameEn + '" class="breed-img">'
              : '<div class="breed-img-fallback">🐕</div>') +
          '</div>' +
          '<div class="breed-info">' +
            '<h3 class="breed-name">' + breed.name + '</h3>' +
            '<p class="breed-name-en">' + breed.nameEn + '</p>' +
            '<p class="breed-desc">' + breed.description + '</p>' +
            '<div class="breed-traits">' +
              breed.traits.map(function (t) { return '<span class="trait-tag">' + t + '</span>'; }).join('') +
            '</div>' +
            '<button class="detail-btn" data-path="' + path + '">詳しく見る →</button>' +
          '</div>';

        card.querySelector('.detail-btn').addEventListener('click', function () {
          openDetail(path);
        });
      });
    });
  }

  function openDetail(path) {
    var breed = BREED_DATA[path];
    if (!breed) return;

    modalBody.innerHTML =
      '<h2 class="modal-title">' + breed.name + '</h2>' +
      '<p class="modal-title-en">' + breed.nameEn + '</p>' +
      '<div class="modal-images" id="modalImages">' +
        [0, 1, 2].map(function () {
          return '<div class="skeleton-wrap modal-skeleton"><div class="skeleton-pulse"></div></div>';
        }).join('') +
      '</div>' +
      '<p class="modal-desc">' + breed.description + '</p>' +
      '<div class="breed-traits">' +
        breed.traits.map(function (t) { return '<span class="trait-tag">' + t + '</span>'; }).join('') +
      '</div>';

    detailModal.classList.remove('hidden');

    fetchDogImages(path, 3).then(function (images) {
      var container = document.getElementById('modalImages');
      if (!container) return;

      if (!images.length) {
        container.innerHTML = '<div class="modal-img-fallback">🐕</div>';
        return;
      }
      container.innerHTML = images.map(function (url) {
        return '<img src="' + url + '" alt="' + breed.nameEn + '" class="modal-img">';
      }).join('');
    });
  }

  modalClose.addEventListener('click', function () { detailModal.classList.add('hidden'); });
  modalBackdrop.addEventListener('click', function () { detailModal.classList.add('hidden'); });

  renderMoodScreen();
}());
