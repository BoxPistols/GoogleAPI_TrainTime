/**
 * 電車乗換案内アプリ
 */

// APIエンドポイント（Cloud Functions）
const API_BASE = '/api';

// 主要駅リスト（オフラインでも検索できるように）
const STATIONS = [
  { name: '東京', reading: 'とうきょう', lines: ['JR各線', '丸ノ内線'] },
  { name: '新宿', reading: 'しんじゅく', lines: ['JR各線', '小田急線', '京王線', '丸ノ内線'] },
  { name: '渋谷', reading: 'しぶや', lines: ['JR各線', '東急各線', '銀座線', '半蔵門線'] },
  { name: '池袋', reading: 'いけぶくろ', lines: ['JR各線', '丸ノ内線', '有楽町線', '副都心線'] },
  { name: '上野', reading: 'うえの', lines: ['JR各線', '銀座線', '日比谷線'] },
  { name: '品川', reading: 'しながわ', lines: ['JR各線', '京急線'] },
  { name: '横浜', reading: 'よこはま', lines: ['JR各線', '東急東横線', '京急線', '相鉄線'] },
  { name: '大宮', reading: 'おおみや', lines: ['JR各線', 'ニューシャトル'] },
  { name: '千葉', reading: 'ちば', lines: ['JR各線', '千葉都市モノレール'] },
  { name: '川崎', reading: 'かわさき', lines: ['JR各線', '京急線'] },
  { name: '秋葉原', reading: 'あきはばら', lines: ['JR各線', '日比谷線', 'つくばエクスプレス'] },
  { name: '神田', reading: 'かんだ', lines: ['JR各線', '銀座線'] },
  { name: '有楽町', reading: 'ゆうらくちょう', lines: ['JR山手線', '有楽町線'] },
  { name: '浜松町', reading: 'はままつちょう', lines: ['JR各線', '東京モノレール'] },
  { name: '田町', reading: 'たまち', lines: ['JR山手線', '京浜東北線'] },
  { name: '目黒', reading: 'めぐろ', lines: ['JR山手線', '東急目黒線', '南北線'] },
  { name: '恵比寿', reading: 'えびす', lines: ['JR山手線', '日比谷線'] },
  { name: '原宿', reading: 'はらじゅく', lines: ['JR山手線'] },
  { name: '代々木', reading: 'よよぎ', lines: ['JR山手線', '大江戸線'] },
  { name: '高田馬場', reading: 'たかだのばば', lines: ['JR山手線', '東西線', '西武新宿線'] },
  { name: '目白', reading: 'めじろ', lines: ['JR山手線'] },
  { name: '大塚', reading: 'おおつか', lines: ['JR山手線', '都電荒川線'] },
  { name: '巣鴨', reading: 'すがも', lines: ['JR山手線', '三田線'] },
  { name: '駒込', reading: 'こまごめ', lines: ['JR山手線', '南北線'] },
  { name: '田端', reading: 'たばた', lines: ['JR山手線', '京浜東北線'] },
  { name: '西日暮里', reading: 'にしにっぽり', lines: ['JR各線', '千代田線', '日暮里舎人ライナー'] },
  { name: '日暮里', reading: 'にっぽり', lines: ['JR各線', '京成線', '日暮里舎人ライナー'] },
  { name: '鶯谷', reading: 'うぐいすだに', lines: ['JR山手線', '京浜東北線'] },
  { name: '御徒町', reading: 'おかちまち', lines: ['JR山手線', '京浜東北線'] },
  { name: '銀座', reading: 'ぎんざ', lines: ['銀座線', '丸ノ内線', '日比谷線'] },
  { name: '六本木', reading: 'ろっぽんぎ', lines: ['日比谷線', '大江戸線'] },
  { name: '表参道', reading: 'おもてさんどう', lines: ['銀座線', '千代田線', '半蔵門線'] },
  { name: '赤坂', reading: 'あかさか', lines: ['千代田線'] },
  { name: '溜池山王', reading: 'ためいけさんのう', lines: ['銀座線', '南北線'] },
  { name: '霞ケ関', reading: 'かすみがせき', lines: ['丸ノ内線', '日比谷線', '千代田線'] },
  { name: '日比谷', reading: 'ひびや', lines: ['日比谷線', '千代田線', '三田線'] },
  { name: '大手町', reading: 'おおてまち', lines: ['丸ノ内線', '東西線', '千代田線', '半蔵門線', '三田線'] },
  { name: '飯田橋', reading: 'いいだばし', lines: ['JR総武線', '東西線', '有楽町線', '南北線', '大江戸線'] },
  { name: '市ヶ谷', reading: 'いちがや', lines: ['JR総武線', '有楽町線', '南北線', '都営新宿線'] },
  { name: '四ツ谷', reading: 'よつや', lines: ['JR各線', '丸ノ内線', '南北線'] },
  { name: '御茶ノ水', reading: 'おちゃのみず', lines: ['JR各線', '丸ノ内線'] },
  { name: '水道橋', reading: 'すいどうばし', lines: ['JR総武線', '三田線'] },
  { name: '後楽園', reading: 'こうらくえん', lines: ['丸ノ内線', '南北線'] },
  { name: '中野', reading: 'なかの', lines: ['JR各線', '東西線'] },
  { name: '荻窪', reading: 'おぎくぼ', lines: ['JR中央線', '丸ノ内線'] },
  { name: '吉祥寺', reading: 'きちじょうじ', lines: ['JR各線', '京王井の頭線'] },
  { name: '三鷹', reading: 'みたか', lines: ['JR中央線'] },
  { name: '立川', reading: 'たちかわ', lines: ['JR各線', '多摩モノレール'] },
  { name: '八王子', reading: 'はちおうじ', lines: ['JR各線', '京王線'] },
  { name: '町田', reading: 'まちだ', lines: ['JR横浜線', '小田急線'] },
  { name: '藤沢', reading: 'ふじさわ', lines: ['JR各線', '小田急線', '江ノ電'] },
  { name: '大船', reading: 'おおふな', lines: ['JR各線', '湘南モノレール'] },
  { name: '鎌倉', reading: 'かまくら', lines: ['JR横須賀線', '江ノ電'] },
  { name: '武蔵小杉', reading: 'むさしこすぎ', lines: ['JR各線', '東急各線'] },
  { name: '自由が丘', reading: 'じゆうがおか', lines: ['東急東横線', '東急大井町線'] },
  { name: '二子玉川', reading: 'ふたこたまがわ', lines: ['東急田園都市線', '東急大井町線'] },
  { name: '溝の口', reading: 'みぞのくち', lines: ['東急田園都市線', 'JR南武線'] },
  { name: '登戸', reading: 'のぼりと', lines: ['小田急線', 'JR南武線'] },
  { name: '成田空港', reading: 'なりたくうこう', lines: ['JR成田エクスプレス', '京成線'] },
  { name: '羽田空港', reading: 'はねだくうこう', lines: ['東京モノレール', '京急線'] },
  { name: '舞浜', reading: 'まいはま', lines: ['JR京葉線'] },
  { name: '船橋', reading: 'ふなばし', lines: ['JR各線', '東武野田線', '京成線'] },
  { name: '柏', reading: 'かしわ', lines: ['JR常磐線', '東武野田線'] },
  { name: '松戸', reading: 'まつど', lines: ['JR常磐線', '新京成線'] },
  { name: '北千住', reading: 'きたせんじゅ', lines: ['JR常磐線', '東武スカイツリーライン', '日比谷線', '千代田線', 'つくばエクスプレス'] },
  { name: '押上', reading: 'おしあげ', lines: ['東武スカイツリーライン', '半蔵門線', '浅草線', '京成押上線'] },
  { name: '浅草', reading: 'あさくさ', lines: ['銀座線', '浅草線', '東武スカイツリーライン'] },
  { name: '錦糸町', reading: 'きんしちょう', lines: ['JR各線', '半蔵門線'] },
  { name: '亀戸', reading: 'かめいど', lines: ['JR総武線', '東武亀戸線'] },
  { name: '両国', reading: 'りょうごく', lines: ['JR総武線', '大江戸線'] },
  { name: '門前仲町', reading: 'もんぜんなかちょう', lines: ['東西線', '大江戸線'] },
  { name: '豊洲', reading: 'とよす', lines: ['有楽町線', 'ゆりかもめ'] },
  { name: 'お台場', reading: 'おだいば', lines: ['ゆりかもめ', 'りんかい線'] },
  { name: '新橋', reading: 'しんばし', lines: ['JR各線', '銀座線', '浅草線', 'ゆりかもめ'] },
  { name: '蒲田', reading: 'かまた', lines: ['JR各線', '東急池上線', '東急多摩川線'] },
  { name: '大井町', reading: 'おおいまち', lines: ['JR京浜東北線', '東急大井町線', 'りんかい線'] },
  { name: '五反田', reading: 'ごたんだ', lines: ['JR山手線', '東急池上線', '浅草線'] },
  { name: '大崎', reading: 'おおさき', lines: ['JR各線', 'りんかい線'] },
  { name: '赤羽', reading: 'あかばね', lines: ['JR各線'] },
  { name: '王子', reading: 'おうじ', lines: ['JR京浜東北線', '南北線', '都電荒川線'] },
  { name: '板橋', reading: 'いたばし', lines: ['JR埼京線'] },
  { name: '練馬', reading: 'ねりま', lines: ['西武池袋線', '大江戸線'] },
  { name: '石神井公園', reading: 'しゃくじいこうえん', lines: ['西武池袋線'] },
  { name: '所沢', reading: 'ところざわ', lines: ['西武池袋線', '西武新宿線'] },
  { name: '川越', reading: 'かわごえ', lines: ['東武東上線', 'JR川越線', '西武新宿線'] },
  { name: '浦和', reading: 'うらわ', lines: ['JR各線'] },
  { name: '南浦和', reading: 'みなみうらわ', lines: ['JR各線'] },
  { name: '蕨', reading: 'わらび', lines: ['JR京浜東北線'] },
  { name: '川口', reading: 'かわぐち', lines: ['JR京浜東北線'] },
  { name: '西船橋', reading: 'にしふなばし', lines: ['JR各線', '東西線', '東葉高速線'] },
  { name: '津田沼', reading: 'つだぬま', lines: ['JR各線', '新京成線'] },
  { name: '幕張', reading: 'まくはり', lines: ['JR総武線'] },
  { name: '海浜幕張', reading: 'かいひんまくはり', lines: ['JR京葉線'] },
  { name: '蘇我', reading: 'そが', lines: ['JR各線'] },
  { name: '稲毛', reading: 'いなげ', lines: ['JR総武線'] },
  { name: '本八幡', reading: 'もとやわた', lines: ['JR総武線', '都営新宿線', '京成線'] },
  { name: '市川', reading: 'いちかわ', lines: ['JR総武線'] },
  { name: '小岩', reading: 'こいわ', lines: ['JR総武線'] },
  { name: '新小岩', reading: 'しんこいわ', lines: ['JR総武線'] },
  { name: '葛西', reading: 'かさい', lines: ['東西線'] },
  { name: '西葛西', reading: 'にしかさい', lines: ['東西線'] },
  { name: '浦安', reading: 'うらやす', lines: ['東西線'] },
];

// DOM要素
const departureInput = document.getElementById('departure');
const arrivalInput = document.getElementById('arrival');
const departureSuggestions = document.getElementById('departure-suggestions');
const arrivalSuggestions = document.getElementById('arrival-suggestions');
const swapBtn = document.getElementById('swap-btn');
const datetimeInput = document.getElementById('datetime');
const nowBtn = document.getElementById('now-btn');
const searchBtn = document.getElementById('search-btn');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// 状態
let selectedDeparture = null;
let selectedArrival = null;

/**
 * 初期化
 */
function init() {
  // 現在時刻をセット
  setCurrentTime();

  // イベントリスナー設定
  departureInput.addEventListener('input', () => handleInput(departureInput, departureSuggestions));
  arrivalInput.addEventListener('input', () => handleInput(arrivalInput, arrivalSuggestions));

  departureInput.addEventListener('focus', () => handleInput(departureInput, departureSuggestions));
  arrivalInput.addEventListener('focus', () => handleInput(arrivalInput, arrivalSuggestions));

  document.addEventListener('click', (e) => {
    if (!departureInput.contains(e.target) && !departureSuggestions.contains(e.target)) {
      departureSuggestions.classList.remove('active');
    }
    if (!arrivalInput.contains(e.target) && !arrivalSuggestions.contains(e.target)) {
      arrivalSuggestions.classList.remove('active');
    }
  });

  swapBtn.addEventListener('click', swapStations);
  nowBtn.addEventListener('click', setCurrentTime);
  searchBtn.addEventListener('click', search);

  // Service Worker登録
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('ServiceWorker registered:', reg.scope))
      .catch(err => console.error('ServiceWorker registration failed:', err));
  }
}

/**
 * 現在時刻をセット
 */
function setCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  datetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 入力ハンドラ
 */
function handleInput(input, suggestionsEl) {
  const query = input.value.trim().toLowerCase();

  if (query.length === 0) {
    // 空の場合は人気駅を表示
    const popular = STATIONS.slice(0, 10);
    showSuggestions(popular, input, suggestionsEl);
    return;
  }

  // 駅名検索
  const matches = STATIONS.filter(station =>
    station.name.includes(query) ||
    station.reading.includes(query)
  ).slice(0, 8);

  showSuggestions(matches, input, suggestionsEl);
}

/**
 * サジェスト表示
 */
function showSuggestions(stations, input, suggestionsEl) {
  suggestionsEl.innerHTML = '';

  if (stations.length === 0) {
    suggestionsEl.classList.remove('active');
    return;
  }

  stations.forEach(station => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="station-name">${station.name}駅</div>
      <div class="line-info">${station.lines.slice(0, 3).join('・')}</div>
    `;
    li.addEventListener('click', () => {
      input.value = station.name + '駅';
      if (input === departureInput) {
        selectedDeparture = station;
      } else {
        selectedArrival = station;
      }
      suggestionsEl.classList.remove('active');
    });
    suggestionsEl.appendChild(li);
  });

  suggestionsEl.classList.add('active');
}

/**
 * 出発・到着を入れ替え
 */
function swapStations() {
  const temp = departureInput.value;
  departureInput.value = arrivalInput.value;
  arrivalInput.value = temp;

  const tempStation = selectedDeparture;
  selectedDeparture = selectedArrival;
  selectedArrival = tempStation;
}

/**
 * 検索実行
 */
async function search() {
  const departure = departureInput.value.trim();
  const arrival = arrivalInput.value.trim();
  const datetime = datetimeInput.value;
  const timeType = document.querySelector('input[name="time-type"]:checked').value;

  // バリデーション
  if (!departure) {
    showError('出発駅を入力してください');
    return;
  }
  if (!arrival) {
    showError('到着駅を入力してください');
    return;
  }

  // UI更新
  hideError();
  showLoading();
  searchBtn.disabled = true;
  resultsDiv.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: departure,
        destination: arrival,
        datetime: datetime,
        timeType: timeType
      })
    });

    if (!response.ok) {
      throw new Error('検索に失敗しました');
    }

    const data = await response.json();
    displayResults(data);

  } catch (error) {
    console.error('Search error:', error);
    showError(error.message || '検索中にエラーが発生しました');
  } finally {
    hideLoading();
    searchBtn.disabled = false;
  }
}

/**
 * 検索結果を表示
 */
function displayResults(data) {
  if (!data.routes || data.routes.length === 0) {
    showError('ルートが見つかりませんでした');
    return;
  }

  resultsDiv.innerHTML = data.routes.map((route, index) => `
    <div class="route-card">
      <div class="route-header">
        <div>
          <div class="route-time">${route.departureTime} → ${route.arrivalTime}</div>
          <div class="route-duration">${route.duration}</div>
        </div>
        <div class="route-fare">${route.fare}</div>
      </div>
      <div class="route-summary">
        ${route.transfers > 0
          ? `<span class="route-badge transfer">乗換 ${route.transfers}回</span>`
          : '<span class="route-badge">直通</span>'}
        ${route.lines.map(line => `<span class="route-badge">${line}</span>`).join('')}
      </div>
      <div class="route-steps">
        ${route.steps.map(step => `
          <div class="route-step ${step.type}">
            <div class="step-time">${step.time}</div>
            <div class="step-station">${step.station}</div>
            ${step.line ? `<div class="step-line ${step.type}">${step.line}</div>` : ''}
            ${step.info ? `<div class="step-info">${step.info}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/**
 * ローディング表示
 */
function showLoading() {
  loadingDiv.classList.remove('hidden');
}

function hideLoading() {
  loadingDiv.classList.add('hidden');
}

/**
 * エラー表示
 */
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  errorDiv.classList.add('hidden');
}

// 初期化実行
document.addEventListener('DOMContentLoaded', init);
