/**
 * 電車乗換案内アプリ
 * セキュリティ・アクセシビリティ対応版
 */

// APIエンドポイント（Cloud Functions）
const API_BASE = '/api';

// 線路バッジの最大表示数
const MAX_LINE_BADGES = 3;

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

// DOM要素 - ルート検索
const searchForm = document.getElementById('search-form');
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

// DOM要素 - タブ
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

// DOM要素 - 時刻表
const railwaySelect = document.getElementById('railway-select');
const stationSelect = document.getElementById('station-select');
const calendarTabs = document.querySelectorAll('.calendar-tab');
const timetableBtn = document.getElementById('timetable-btn');
const timetableResults = document.getElementById('timetable-results');
const timetableLoading = document.getElementById('timetable-loading');

// DOM要素 - 運行情報
const traininfoBtn = document.getElementById('traininfo-btn');
const traininfoResults = document.getElementById('traininfo-results');
const traininfoLoading = document.getElementById('traininfo-loading');

// 状態
let selectedDeparture = null;
let selectedArrival = null;
let currentRouteIndex = 0;
let totalRoutes = 0;
let selectedCalendar = 'weekday';
let selectedRailway = null;
let selectedStation = null;

/**
 * テキストをエスケープ（XSS対策）
 * @param {string} text - エスケープするテキスト
 * @returns {string} - エスケープ済みテキスト
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 初期化
 */
function init() {
  // 現在時刻をセット
  setCurrentTime();

  // フォームのsubmitイベント
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    search();
  });

  // イベントリスナー設定
  departureInput.addEventListener('input', () => handleInput(departureInput, departureSuggestions));
  arrivalInput.addEventListener('input', () => handleInput(arrivalInput, arrivalSuggestions));

  departureInput.addEventListener('focus', () => handleInput(departureInput, departureSuggestions));
  arrivalInput.addEventListener('focus', () => handleInput(arrivalInput, arrivalSuggestions));

  // クリック外でサジェストを閉じる
  document.addEventListener('click', (e) => {
    if (!departureInput.contains(e.target) && !departureSuggestions.contains(e.target)) {
      closeSuggestions(departureInput, departureSuggestions);
    }
    if (!arrivalInput.contains(e.target) && !arrivalSuggestions.contains(e.target)) {
      closeSuggestions(arrivalInput, arrivalSuggestions);
    }
  });

  // タッチ操作でもサジェストを閉じる
  document.addEventListener('touchstart', (e) => {
    if (!departureInput.contains(e.target) && !departureSuggestions.contains(e.target)) {
      closeSuggestions(departureInput, departureSuggestions);
    }
    if (!arrivalInput.contains(e.target) && !arrivalSuggestions.contains(e.target)) {
      closeSuggestions(arrivalInput, arrivalSuggestions);
    }
  }, { passive: true });

  swapBtn.addEventListener('click', swapStations);
  nowBtn.addEventListener('click', setCurrentTime);

  // キーボードナビゲーション
  departureInput.addEventListener('keydown', (e) => handleKeyboardNavigation(e, departureSuggestions));
  arrivalInput.addEventListener('keydown', (e) => handleKeyboardNavigation(e, arrivalSuggestions));

  // タブ切り替え
  initTabs();

  // 時刻表機能
  initTimetable();

  // 運行情報機能
  initTraininfo();

  // Service Worker登録
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('ServiceWorker registered:', reg.scope))
      .catch(err => console.error('ServiceWorker registration failed:', err));
  }
}

/**
 * タブ切り替え初期化
 */
function initTabs() {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('aria-controls');

      // タブの状態更新
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // パネルの表示切替
      panels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    });
  });
}

/**
 * 時刻表機能初期化
 */
function initTimetable() {
  // 路線データをロード（オフライン用マスタデータから）
  if (typeof ODPT_RAILWAYS !== 'undefined') {
    loadRailwaysFromMaster();
  }

  // 路線選択時
  railwaySelect.addEventListener('change', () => {
    const railwayId = railwaySelect.value;
    if (railwayId) {
      selectedRailway = railwayId;
      loadStationsForRailway(railwayId);
    } else {
      selectedRailway = null;
      stationSelect.innerHTML = '<option value="">駅を選択してください</option>';
      stationSelect.disabled = true;
      timetableBtn.disabled = true;
    }
  });

  // 駅選択時
  stationSelect.addEventListener('change', () => {
    selectedStation = stationSelect.value;
    timetableBtn.disabled = !selectedStation;
  });

  // カレンダータブ
  calendarTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      calendarTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      selectedCalendar = tab.dataset.calendar;
    });
  });

  // 時刻表取得ボタン
  timetableBtn.addEventListener('click', fetchTimetable);
}

/**
 * マスタデータから路線をロード
 */
function loadRailwaysFromMaster() {
  // オペレーター別にグループ化
  const operators = {
    'TokyoMetro': '東京メトロ',
    'Toei': '都営地下鉄',
    'JR-East': 'JR東日本'
  };

  // セレクトボックスを構築
  railwaySelect.innerHTML = '<option value="">路線を選択してください</option>';

  Object.entries(operators).forEach(([operatorId, operatorName]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = operatorName;

    ODPT_RAILWAYS
      .filter(r => r.operator === operatorId)
      .forEach(railway => {
        const option = document.createElement('option');
        option.value = railway.id;
        option.textContent = railway.name;
        optgroup.appendChild(option);
      });

    if (optgroup.children.length > 0) {
      railwaySelect.appendChild(optgroup);
    }
  });
}

/**
 * 路線に紐づく駅をロード
 */
function loadStationsForRailway(railwayId) {
  const railway = ODPT_RAILWAYS.find(r => r.id === railwayId);
  if (!railway) {
    stationSelect.innerHTML = '<option value="">駅を選択してください</option>';
    stationSelect.disabled = true;
    return;
  }

  stationSelect.innerHTML = '<option value="">駅を選択してください</option>';
  railway.stations.forEach(station => {
    const option = document.createElement('option');
    option.value = station.id;
    option.textContent = station.name;
    stationSelect.appendChild(option);
  });

  stationSelect.disabled = false;
}

/**
 * 時刻表を取得
 */
async function fetchTimetable() {
  if (!selectedRailway || !selectedStation) {
    return;
  }

  // UI更新
  timetableBtn.disabled = true;
  timetableLoading.classList.remove('hidden');
  clearElement(timetableResults);

  try {
    const response = await fetch(
      `${API_BASE}/timetable?station=${encodeURIComponent(selectedStation)}&railway=${encodeURIComponent(selectedRailway)}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '時刻表の取得に失敗しました');
    }

    const data = await response.json();
    displayTimetable(data);

  } catch (error) {
    console.error('Timetable fetch error:', error);
    showTimetableError(error.message || '時刻表の取得に失敗しました');
  } finally {
    timetableBtn.disabled = false;
    timetableLoading.classList.add('hidden');
  }
}

/**
 * 時刻表を表示
 */
function displayTimetable(data) {
  clearElement(timetableResults);

  if (!data.timetables || data.timetables.length === 0) {
    showTimetableError('時刻表データがありません');
    return;
  }

  // 選択中のカレンダーに対応する時刻表をフィルタ
  const filteredTimetables = data.timetables.filter(
    tt => tt.calendar === selectedCalendar
  );

  if (filteredTimetables.length === 0) {
    showTimetableError(`${getCalendarLabel(selectedCalendar)}の時刻表データがありません`);
    return;
  }

  filteredTimetables.forEach(timetable => {
    const card = document.createElement('div');
    card.className = 'timetable-card';

    // ヘッダー
    const header = document.createElement('div');
    header.className = 'timetable-header';

    const direction = document.createElement('div');
    direction.className = 'timetable-direction';
    direction.textContent = formatDirection(timetable.direction);

    header.appendChild(direction);
    card.appendChild(header);

    // 時刻グリッド
    const grid = document.createElement('div');
    grid.className = 'timetable-grid';

    // 時刻をグループ化
    const hourGroups = groupByHour(timetable.objects);

    Object.entries(hourGroups).forEach(([hour, trains]) => {
      const hourCell = document.createElement('div');
      hourCell.className = 'timetable-hour';
      hourCell.textContent = hour;
      grid.appendChild(hourCell);

      const minutesCell = document.createElement('div');
      minutesCell.className = 'timetable-minutes';

      trains.forEach(train => {
        const minute = document.createElement('span');
        minute.className = 'timetable-minute ' + getTrainTypeClass(train.trainType);
        minute.textContent = train.time.split(':')[1];
        minute.title = `${train.trainType} → ${train.destinationName}`;
        minutesCell.appendChild(minute);
      });

      grid.appendChild(minutesCell);
    });

    card.appendChild(grid);
    timetableResults.appendChild(card);
  });
}

/**
 * 時間でグループ化
 */
function groupByHour(objects) {
  const groups = {};
  objects.forEach(obj => {
    if (!obj.time) return;
    const hour = obj.time.split(':')[0];
    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(obj);
  });
  return groups;
}

/**
 * 列車種別のCSSクラス
 */
function getTrainTypeClass(trainType) {
  if (!trainType) return 'local';
  const type = trainType.toLowerCase();
  if (type.includes('express') || type.includes('急行')) return 'express';
  if (type.includes('rapid') || type.includes('快速')) return 'rapid';
  return 'local';
}

/**
 * 方面表示フォーマット
 */
function formatDirection(direction) {
  if (!direction) return '不明方面';
  // "TokyoMetro.Ginza.Asakusa" -> "浅草方面"
  const parts = direction.split('.');
  const last = parts[parts.length - 1];
  return `${last}方面`;
}

/**
 * カレンダーラベル
 */
function getCalendarLabel(calendar) {
  const labels = {
    'weekday': '平日',
    'saturday': '土曜',
    'holiday': '休日'
  };
  return labels[calendar] || calendar;
}

/**
 * 時刻表エラー表示
 */
function showTimetableError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'error';
  errorEl.textContent = message;
  timetableResults.appendChild(errorEl);
}

/**
 * 運行情報機能初期化
 */
function initTraininfo() {
  traininfoBtn.addEventListener('click', fetchTraininfo);
}

/**
 * 運行情報を取得
 */
async function fetchTraininfo() {
  traininfoBtn.disabled = true;
  traininfoLoading.classList.remove('hidden');
  clearElement(traininfoResults);

  try {
    const response = await fetch(`${API_BASE}/traininfo`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '運行情報の取得に失敗しました');
    }

    const data = await response.json();
    displayTraininfo(data);

  } catch (error) {
    console.error('Traininfo fetch error:', error);
    showTraininfoError(error.message || '運行情報の取得に失敗しました');
  } finally {
    traininfoBtn.disabled = false;
    traininfoLoading.classList.add('hidden');
  }
}

/**
 * 運行情報を表示
 */
function displayTraininfo(data) {
  clearElement(traininfoResults);

  if (!data.trainInfos || data.trainInfos.length === 0) {
    // 運行情報なし = 平常運転
    const card = document.createElement('div');
    card.className = 'traininfo-card normal';

    const header = document.createElement('div');
    header.className = 'traininfo-header';

    const railway = document.createElement('div');
    railway.className = 'traininfo-railway';
    railway.textContent = '首都圏の鉄道';

    const status = document.createElement('span');
    status.className = 'traininfo-status normal';
    status.textContent = '平常運転';

    header.appendChild(railway);
    header.appendChild(status);
    card.appendChild(header);

    const text = document.createElement('p');
    text.className = 'traininfo-text';
    text.textContent = '現在、運行情報はありません。すべての路線が平常運転しています。';
    card.appendChild(text);

    traininfoResults.appendChild(card);
    return;
  }

  data.trainInfos.forEach(info => {
    const card = document.createElement('div');
    card.className = `traininfo-card ${info.status}`;

    // ヘッダー
    const header = document.createElement('div');
    header.className = 'traininfo-header';

    const railway = document.createElement('div');
    railway.className = 'traininfo-railway';
    railway.textContent = info.railwayName || formatRailwayId(info.railway);

    const status = document.createElement('span');
    status.className = `traininfo-status ${info.status}`;
    status.textContent = getStatusLabel(info.status);

    header.appendChild(railway);
    header.appendChild(status);
    card.appendChild(header);

    // テキスト
    if (info.text) {
      const text = document.createElement('p');
      text.className = 'traininfo-text';
      text.textContent = info.text;
      card.appendChild(text);
    }

    // 更新時刻
    if (info.updatedAt) {
      const time = document.createElement('div');
      time.className = 'traininfo-time';
      time.textContent = `更新: ${formatDateTime(info.updatedAt)}`;
      card.appendChild(time);
    }

    traininfoResults.appendChild(card);
  });
}

/**
 * ステータスラベル
 */
function getStatusLabel(status) {
  const labels = {
    'normal': '平常運転',
    'delayed': '遅延',
    'suspended': '運転見合わせ',
    'resumed': '運転再開'
  };
  return labels[status] || status;
}

/**
 * 路線ID整形
 */
function formatRailwayId(railwayId) {
  if (!railwayId) return '不明';
  const parts = railwayId.replace('odpt.Railway:', '').split('.');
  return parts.join(' ');
}

/**
 * 日時フォーマット
 */
function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 運行情報エラー表示
 */
function showTraininfoError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'error';
  errorEl.textContent = message;
  traininfoResults.appendChild(errorEl);
}

/**
 * 要素の子要素をすべて削除
 */
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * キーボードナビゲーション
 */
function handleKeyboardNavigation(e, suggestionsEl) {
  const items = suggestionsEl.querySelectorAll('li');
  const activeItem = suggestionsEl.querySelector('li.selected');
  let currentIndex = Array.from(items).indexOf(activeItem);

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      currentIndex = Math.min(currentIndex + 1, items.length - 1);
      updateSelectedItem(items, currentIndex);
      break;
    case 'ArrowUp':
      e.preventDefault();
      currentIndex = Math.max(currentIndex - 1, 0);
      updateSelectedItem(items, currentIndex);
      break;
    case 'Enter':
      if (activeItem && suggestionsEl.classList.contains('active')) {
        e.preventDefault();
        activeItem.click();
      }
      break;
    case 'Escape':
      closeSuggestions(e.target, suggestionsEl);
      break;
  }
}

/**
 * 選択アイテムの更新
 */
function updateSelectedItem(items, index) {
  items.forEach((item, i) => {
    item.classList.toggle('selected', i === index);
    item.setAttribute('aria-selected', i === index ? 'true' : 'false');
  });
  if (items[index]) {
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

/**
 * サジェストを閉じる
 */
function closeSuggestions(input, suggestionsEl) {
  suggestionsEl.classList.remove('active');
  input.setAttribute('aria-expanded', 'false');
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
 * サジェスト表示（DOM操作でXSS対策）
 */
function showSuggestions(stations, input, suggestionsEl) {
  // 既存の内容をクリア
  while (suggestionsEl.firstChild) {
    suggestionsEl.removeChild(suggestionsEl.firstChild);
  }

  if (stations.length === 0) {
    closeSuggestions(input, suggestionsEl);
    return;
  }

  stations.forEach((station, index) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.id = `${suggestionsEl.id}-option-${index}`;

    const stationName = document.createElement('div');
    stationName.className = 'station-name';
    stationName.textContent = station.name + '駅';

    const lineInfo = document.createElement('div');
    lineInfo.className = 'line-info';
    lineInfo.textContent = station.lines.slice(0, 3).join('・');

    li.appendChild(stationName);
    li.appendChild(lineInfo);

    // クリックとタッチの両方に対応
    li.addEventListener('click', () => {
      input.value = station.name + '駅';
      if (input === departureInput) {
        selectedDeparture = station;
      } else {
        selectedArrival = station;
      }
      closeSuggestions(input, suggestionsEl);
    });

    suggestionsEl.appendChild(li);
  });

  suggestionsEl.classList.add('active');
  input.setAttribute('aria-expanded', 'true');
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

  // アニメーション効果
  swapBtn.style.transform = 'rotate(180deg)';
  setTimeout(() => {
    swapBtn.style.transform = '';
  }, 200);
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
    departureInput.focus();
    return;
  }
  if (!arrival) {
    showError('到着駅を入力してください');
    arrivalInput.focus();
    return;
  }

  // UI更新
  hideError();
  showLoading();
  searchBtn.disabled = true;

  // 結果をクリア
  while (resultsDiv.firstChild) {
    resultsDiv.removeChild(resultsDiv.firstChild);
  }

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '検索に失敗しました');
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
 * 検索結果を表示（DOM操作でXSS対策・スワイプ対応）
 */
function displayResults(data) {
  if (!data.routes || data.routes.length === 0) {
    showError('ルートが見つかりませんでした');
    return;
  }

  totalRoutes = data.routes.length;
  currentRouteIndex = 0;

  // 結果をクリア
  while (resultsDiv.firstChild) {
    resultsDiv.removeChild(resultsDiv.firstChild);
  }

  // モバイルかどうかを判定
  const isMobile = window.innerWidth < 768;

  if (isMobile && totalRoutes > 1) {
    // モバイル: スワイプ可能なカルーセル表示
    const swiper = document.createElement('div');
    swiper.className = 'results-swiper';
    swiper.id = 'results-swiper';

    data.routes.forEach((route, index) => {
      swiper.appendChild(createRouteCard(route, index));
    });

    resultsDiv.appendChild(swiper);

    // インジケーター
    const indicator = document.createElement('div');
    indicator.className = 'route-indicator';
    indicator.id = 'route-indicator';

    data.routes.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.className = 'route-dot' + (index === 0 ? ' active' : '');
      dot.dataset.index = index;
      indicator.appendChild(dot);
    });

    resultsDiv.appendChild(indicator);

    // スワイプイベント設定
    setupSwipeNavigation();
  } else {
    // デスクトップ/タブレット: 通常の縦並び表示
    data.routes.forEach((route, index) => {
      resultsDiv.appendChild(createRouteCard(route, index));
    });
  }

  // 結果までスクロール
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * ルートカードのDOM要素を生成（XSS対策）
 */
function createRouteCard(route, index) {
  const card = document.createElement('article');
  card.className = 'route-card';
  card.dataset.routeIndex = index;

  // ヘッダー
  const header = document.createElement('div');
  header.className = 'route-header';

  const timeContainer = document.createElement('div');
  const routeTime = document.createElement('div');
  routeTime.className = 'route-time';
  routeTime.textContent = `${route.departureTime} → ${route.arrivalTime}`;

  const routeDuration = document.createElement('div');
  routeDuration.className = 'route-duration';
  routeDuration.textContent = route.duration;

  timeContainer.appendChild(routeTime);
  timeContainer.appendChild(routeDuration);

  const routeFare = document.createElement('div');
  routeFare.className = 'route-fare';
  routeFare.textContent = route.fare;

  header.appendChild(timeContainer);
  header.appendChild(routeFare);
  card.appendChild(header);

  // サマリー
  const summary = document.createElement('div');
  summary.className = 'route-summary';

  // 乗換バッジ
  const transferBadge = document.createElement('span');
  transferBadge.className = 'route-badge' + (route.transfers > 0 ? ' transfer' : '');
  transferBadge.textContent = route.transfers > 0 ? `乗換 ${route.transfers}回` : '直通';
  summary.appendChild(transferBadge);

  // 路線バッジ（最大数制限）
  const displayLines = route.lines.slice(0, MAX_LINE_BADGES);
  displayLines.forEach(line => {
    const lineBadge = document.createElement('span');
    lineBadge.className = 'route-badge';
    lineBadge.textContent = line;
    summary.appendChild(lineBadge);
  });

  // 省略表示
  if (route.lines.length > MAX_LINE_BADGES) {
    const moreBadge = document.createElement('span');
    moreBadge.className = 'route-badge';
    moreBadge.textContent = `+${route.lines.length - MAX_LINE_BADGES}`;
    moreBadge.title = route.lines.slice(MAX_LINE_BADGES).join('、');
    summary.appendChild(moreBadge);
  }

  card.appendChild(summary);

  // ステップ
  const steps = document.createElement('div');
  steps.className = 'route-steps';

  route.steps.forEach(step => {
    const stepEl = document.createElement('div');
    stepEl.className = 'route-step ' + step.type;

    if (step.time) {
      const stepTime = document.createElement('div');
      stepTime.className = 'step-time';
      stepTime.textContent = step.time;
      stepEl.appendChild(stepTime);
    }

    const stepStation = document.createElement('div');
    stepStation.className = 'step-station';
    stepStation.textContent = step.station;
    stepEl.appendChild(stepStation);

    if (step.line) {
      const stepLine = document.createElement('div');
      stepLine.className = 'step-line ' + step.type;
      stepLine.textContent = step.line;
      stepEl.appendChild(stepLine);
    }

    if (step.info) {
      const stepInfo = document.createElement('div');
      stepInfo.className = 'step-info';
      stepInfo.textContent = step.info;
      stepEl.appendChild(stepInfo);
    }

    steps.appendChild(stepEl);
  });

  card.appendChild(steps);

  return card;
}

/**
 * スワイプナビゲーションの設定
 */
function setupSwipeNavigation() {
  const swiper = document.getElementById('results-swiper');
  const indicator = document.getElementById('route-indicator');

  if (!swiper || !indicator) return;

  // スクロールイベントでインジケーター更新
  let scrollTimeout;
  swiper.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const card = swiper.querySelector('.route-card');
      if (!card) return;

      const cardWidth = card.offsetWidth + 12; // gap含む
      const newIndex = Math.round(swiper.scrollLeft / cardWidth);

      if (newIndex !== currentRouteIndex && newIndex >= 0 && newIndex < totalRoutes) {
        currentRouteIndex = newIndex;
        updateIndicator();
      }
    }, 50);
  }, { passive: true });

  // インジケータークリックでカードに移動
  indicator.addEventListener('click', (e) => {
    const dot = e.target.closest('.route-dot');
    if (dot) {
      const index = parseInt(dot.dataset.index, 10);
      scrollToRoute(index);
    }
  });

  // タッチジェスチャー補助（より良いスナップ動作）
  let touchStartX = 0;
  let touchStartTime = 0;

  swiper.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
  }, { passive: true });

  swiper.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndTime = Date.now();
    const diffX = touchStartX - touchEndX;
    const diffTime = touchEndTime - touchStartTime;

    // 素早いスワイプ（フリック）を検出
    if (diffTime < 300 && Math.abs(diffX) > 50) {
      if (diffX > 0 && currentRouteIndex < totalRoutes - 1) {
        // 左スワイプ → 次へ
        scrollToRoute(currentRouteIndex + 1);
      } else if (diffX < 0 && currentRouteIndex > 0) {
        // 右スワイプ → 前へ
        scrollToRoute(currentRouteIndex - 1);
      }
    }
  }, { passive: true });
}

/**
 * 指定インデックスのルートにスクロール
 */
function scrollToRoute(index) {
  const swiper = document.getElementById('results-swiper');
  if (!swiper) return;

  const cards = swiper.querySelectorAll('.route-card');
  if (cards[index]) {
    const cardWidth = cards[index].offsetWidth + 12;
    swiper.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
    currentRouteIndex = index;
    updateIndicator();
  }
}

/**
 * インジケーター更新
 */
function updateIndicator() {
  const dots = document.querySelectorAll('.route-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentRouteIndex);
  });
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

  // 振動フィードバック（対応端末のみ）
  if ('vibrate' in navigator) {
    navigator.vibrate(100);
  }
}

function hideError() {
  errorDiv.classList.add('hidden');
}

/**
 * 画面サイズ変更時の処理
 */
function handleResize() {
  // 画面サイズが変わった場合、結果の表示形式を更新
  const swiper = document.getElementById('results-swiper');
  const isMobile = window.innerWidth < 768;

  if (swiper && !isMobile) {
    // タブレット/デスクトップになった場合、スワイプをリセット
    swiper.scrollLeft = 0;
    currentRouteIndex = 0;
    updateIndicator();
  }
}

// リサイズイベント（デバウンス付き）
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 250);
});

// 初期化実行
document.addEventListener('DOMContentLoaded', init);
