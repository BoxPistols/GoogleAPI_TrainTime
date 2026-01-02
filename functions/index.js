const functions = require('firebase-functions');
const axios = require('axios');

// Google Maps API Key（Firebase環境変数から取得）
// 設定方法: firebase functions:config:set google.maps_api_key="YOUR_API_KEY"
const GOOGLE_MAPS_API_KEY = functions.config().google?.maps_api_key || process.env.GOOGLE_MAPS_API_KEY;

// ODPT API Key（Firebase環境変数から取得）
// 設定方法: firebase functions:config:set odpt.api_key="YOUR_ODPT_API_KEY"
// 取得: https://developer.odpt.org/ で開発者登録
const ODPT_API_KEY = functions.config().odpt?.api_key || process.env.ODPT_API_KEY;
const ODPT_BASE_URL = 'https://api.odpt.org/api/v4';

// 許可するオリジン（本番環境では適切なドメインに変更）
const ALLOWED_ORIGINS = [
  'https://train-time-api-68860.web.app',
  'https://train-time-api-68860.firebaseapp.com',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
];

/**
 * CORS対応のヘッダーを設定
 * @param {Object} request - リクエストオブジェクト
 * @param {Object} response - レスポンスオブジェクト
 * @returns {boolean} - OPTIONSリクエストの場合true
 */
function handleCors(request, response) {
  const origin = request.headers.origin;

  // 許可されたオリジンかチェック
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // 開発環境では許容（エミュレータ対応）
    response.set('Access-Control-Allow-Origin', origin || '*');
  }

  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
  response.set('Access-Control-Max-Age', '86400');

  // OPTIONSリクエスト（プリフライト）の処理
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return true;
  }

  return false;
}

/**
 * APIキーの存在確認
 * @param {Object} response - レスポンスオブジェクト
 * @returns {boolean} - APIキーが存在しない場合true
 */
function validateApiKey(response) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key is not configured');
    response.status(500).json({
      error: 'サーバー設定エラー。管理者にお問い合わせください。'
    });
    return true;
  }
  return false;
}

/**
 * Google Maps APIレスポンスをアプリ用に整形
 * @param {Object} route - Google Maps APIのルートオブジェクト
 * @returns {Object} - 整形されたルートオブジェクト
 */
function formatRouteResponse(route) {
  const leg = route.legs[0];
  const steps = [];
  const lines = new Set();
  let transfers = -1;

  leg.steps.forEach(step => {
    if (step.travel_mode === 'TRANSIT') {
      const transit = step.transit_details;
      transfers++;

      // 出発駅
      steps.push({
        type: 'transit',
        time: transit.departure_time.text,
        station: transit.departure_stop.name,
        line: transit.line.short_name || transit.line.name,
        info: `${transit.headsign}方面`
      });

      // 到着駅
      steps.push({
        type: 'transit',
        time: transit.arrival_time.text,
        station: transit.arrival_stop.name,
        info: `${transit.num_stops}駅`
      });

      lines.add(transit.line.short_name || transit.line.name);
    } else if (step.travel_mode === 'WALKING' && step.duration.value > 60) {
      // 1分以上の徒歩
      steps.push({
        type: 'walk',
        time: '',
        station: '徒歩',
        line: '徒歩',
        info: step.duration.text
      });
    }
  });

  return {
    departureTime: leg.departure_time.text,
    arrivalTime: leg.arrival_time.text,
    duration: leg.duration.text,
    fare: leg.fare ? leg.fare.text : '料金情報なし',
    transfers: Math.max(0, transfers),
    lines: Array.from(lines).slice(0, 5), // 最大5路線まで
    steps: steps
  };
}

/**
 * ルート検索API
 * POST /route
 * Body: { origin, destination, datetime, timeType }
 */
exports.route = functions.https.onRequest(async (request, response) => {
  // CORS対応
  if (handleCors(request, response)) {
    return;
  }

  // APIキー確認
  if (validateApiKey(response)) {
    return;
  }

  try {
    const { origin, destination, datetime, timeType } = request.body;

    // 入力バリデーション
    if (!origin || !destination) {
      response.status(400).json({ error: '出発駅と到着駅を指定してください' });
      return;
    }

    // 入力値のサニタイズ（基本的なXSS対策）
    const sanitizedOrigin = String(origin).slice(0, 100);
    const sanitizedDestination = String(destination).slice(0, 100);

    // Google Maps Directions API呼び出し
    const apiUrl = 'https://maps.googleapis.com/maps/api/directions/json';

    // 現在時刻のUNIXタイムスタンプを取得（'now'は非推奨）
    const now = Math.floor(Date.now() / 1000);

    const params = {
      origin: sanitizedOrigin + ', Japan',
      destination: sanitizedDestination + ', Japan',
      mode: 'transit',
      transit_mode: 'rail',
      language: 'ja',
      alternatives: true,
      key: GOOGLE_MAPS_API_KEY,
    };

    // 時刻指定
    if (datetime) {
      const timestamp = Math.floor(new Date(datetime).getTime() / 1000);
      // 過去の時刻は現在時刻に補正
      const validTimestamp = Math.max(timestamp, now);

      if (timeType === 'arrival') {
        params.arrival_time = validTimestamp;
      } else {
        params.departure_time = validTimestamp;
      }
    } else {
      // 'now'の代わりにUNIXタイムスタンプを使用
      params.departure_time = now;
    }

    const apiResponse = await axios.get(apiUrl, { params });
    const data = apiResponse.data;

    if (data.status !== 'OK') {
      // APIステータスはログにのみ記録し、クライアントには返さない
      console.error('Google Maps API error:', data.status, data.error_message);

      // ユーザーフレンドリーなエラーメッセージ
      let userMessage = 'ルートが見つかりませんでした';
      if (data.status === 'ZERO_RESULTS') {
        userMessage = '指定された区間のルートが見つかりませんでした。駅名を確認してください。';
      } else if (data.status === 'NOT_FOUND') {
        userMessage = '指定された駅が見つかりませんでした。駅名を確認してください。';
      }

      response.status(400).json({ error: userMessage });
      return;
    }

    // レスポンスを整形
    const routes = data.routes.map(formatRouteResponse);

    response.json({ routes });

  } catch (error) {
    // エラー詳細はログにのみ記録
    console.error('Route search error:', error.message);
    response.status(500).json({ error: '検索中にエラーが発生しました。しばらくしてからお試しください。' });
  }
});

/**
 * ヘルスチェック
 */
exports.health = functions.https.onRequest((request, response) => {
  if (handleCors(request, response)) {
    return;
  }

  response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!GOOGLE_MAPS_API_KEY
  });
});

// 既存のエンドポイント（後方互換性のため残す）
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.hello = functions.https.onRequest((request, response) => {
  if (request.query.name !== undefined) {
    response.send("Hello " + request.query.name + " !");
  } else {
    response.send("Hello from Firebase!");
  }
});

// ============================================
// ODPT（公共交通オープンデータ）API
// ============================================

/**
 * ODPT APIキーの存在確認
 * @param {Object} response - レスポンスオブジェクト
 * @returns {boolean} - APIキーが存在しない場合true
 */
function validateOdptApiKey(response) {
  if (!ODPT_API_KEY) {
    console.error('ODPT API key is not configured');
    response.status(500).json({
      error: 'ODPT APIキーが設定されていません。管理者にお問い合わせください。'
    });
    return true;
  }
  return false;
}

/**
 * ODPT駅IDから駅名を抽出
 * 例: "odpt.Station:TokyoMetro.Ginza.Shibuya" → "渋谷"
 * @param {string} stationId - ODPT形式の駅ID
 * @param {Object} stationNames - 駅名マッピング
 * @returns {string} - 駅名
 */
function extractStationName(stationId, stationNames = {}) {
  if (stationNames[stationId]) {
    return stationNames[stationId];
  }
  // IDから駅名を抽出（最後のドット以降）
  const parts = stationId.split('.');
  return parts[parts.length - 1];
}

/**
 * 路線一覧取得API
 * GET /railways
 */
exports.railways = functions.https.onRequest(async (request, response) => {
  if (handleCors(request, response)) {
    return;
  }

  if (validateOdptApiKey(response)) {
    return;
  }

  try {
    // 主要事業者の路線を取得
    const operators = [
      'odpt.Operator:TokyoMetro',
      'odpt.Operator:Toei',
      'odpt.Operator:JR-East',
      'odpt.Operator:Tokyu',
      'odpt.Operator:Odakyu',
      'odpt.Operator:Keio',
      'odpt.Operator:Seibu',
      'odpt.Operator:Tobu',
      'odpt.Operator:Keikyu',
      'odpt.Operator:Keisei',
    ];

    const apiResponse = await axios.get(`${ODPT_BASE_URL}/odpt:Railway`, {
      params: {
        'acl:consumerKey': ODPT_API_KEY,
      }
    });

    // 主要事業者の路線のみフィルタリング
    const railways = apiResponse.data
      .filter(r => operators.some(op => r['odpt:operator'] === op))
      .map(r => ({
        id: r['owl:sameAs'],
        name: r['odpt:railwayTitle']?.ja || r['dc:title'] || extractStationName(r['owl:sameAs']),
        operator: r['odpt:operator']?.replace('odpt.Operator:', ''),
        color: r['odpt:color'] || '#888888',
        stations: (r['odpt:stationOrder'] || []).map(s => ({
          id: s['odpt:station'],
          name: s['odpt:stationTitle']?.ja || extractStationName(s['odpt:station']),
          index: s['odpt:index']
        }))
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    response.json({ railways });

  } catch (error) {
    console.error('Railways fetch error:', error.message);
    response.status(500).json({ error: '路線情報の取得に失敗しました。' });
  }
});

/**
 * 駅時刻表取得API
 * GET /timetable?station={stationId}&railway={railwayId}&direction={direction}
 */
exports.timetable = functions.https.onRequest(async (request, response) => {
  if (handleCors(request, response)) {
    return;
  }

  if (validateOdptApiKey(response)) {
    return;
  }

  try {
    const { station, railway } = request.query;

    if (!station || !railway) {
      response.status(400).json({
        error: '駅IDと路線IDを指定してください',
        example: '/timetable?station=odpt.Station:TokyoMetro.Ginza.Shibuya&railway=odpt.Railway:TokyoMetro.Ginza'
      });
      return;
    }

    // 駅時刻表を取得
    const apiResponse = await axios.get(`${ODPT_BASE_URL}/odpt:StationTimetable`, {
      params: {
        'odpt:station': station,
        'odpt:railway': railway,
        'acl:consumerKey': ODPT_API_KEY,
      }
    });

    if (!apiResponse.data || apiResponse.data.length === 0) {
      response.status(404).json({ error: '時刻表が見つかりませんでした。' });
      return;
    }

    // 時刻表データを整形
    const timetables = apiResponse.data.map(tt => {
      const calendar = tt['odpt:calendar'] || '';
      let calendarType = 'weekday';
      if (calendar.includes('Saturday')) calendarType = 'saturday';
      if (calendar.includes('Holiday') || calendar.includes('Sunday')) calendarType = 'holiday';

      const objects = (tt['odpt:stationTimetableObject'] || []).map(obj => ({
        time: obj['odpt:departureTime'],
        destination: obj['odpt:destinationStation']?.[0] || obj['odpt:destinationStation'],
        destinationName: extractStationName(obj['odpt:destinationStation']?.[0] || obj['odpt:destinationStation'] || ''),
        trainType: obj['odpt:trainType']?.replace('odpt.TrainType:', '').split('.').pop() || 'Local',
        notes: obj['odpt:note'] || ''
      }));

      // 時刻順にソート
      objects.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

      return {
        calendar: calendarType,
        direction: tt['odpt:railDirection']?.replace('odpt.RailDirection:', '') || '',
        objects
      };
    });

    response.json({
      station,
      railway,
      timetables
    });

  } catch (error) {
    console.error('Timetable fetch error:', error.message);
    response.status(500).json({ error: '時刻表の取得に失敗しました。' });
  }
});

/**
 * 運行情報取得API
 * GET /traininfo?railway={railwayId} または GET /traininfo（全路線）
 */
exports.traininfo = functions.https.onRequest(async (request, response) => {
  if (handleCors(request, response)) {
    return;
  }

  if (validateOdptApiKey(response)) {
    return;
  }

  try {
    const { railway } = request.query;

    const params = {
      'acl:consumerKey': ODPT_API_KEY,
    };

    if (railway) {
      params['odpt:railway'] = railway;
    }

    const apiResponse = await axios.get(`${ODPT_BASE_URL}/odpt:TrainInformation`, {
      params
    });

    // 運行情報を整形
    const trainInfos = apiResponse.data.map(info => {
      // 運行状況の判定
      let status = 'normal';
      const text = info['odpt:trainInformationText']?.ja || '';
      if (text.includes('運転見合わせ') || text.includes('運休')) {
        status = 'suspended';
      } else if (text.includes('遅延') || text.includes('遅れ')) {
        status = 'delayed';
      } else if (text.includes('運転再開')) {
        status = 'resumed';
      }

      return {
        railway: info['odpt:railway'],
        railwayName: info['odpt:railwayTitle']?.ja || extractStationName(info['odpt:railway'] || ''),
        operator: info['odpt:operator']?.replace('odpt.Operator:', ''),
        status,
        text,
        cause: info['odpt:trainInformationCause']?.ja || '',
        validFrom: info['odpt:validFrom'],
        validTo: info['odpt:validTo'],
        updatedAt: info['dc:date']
      };
    });

    // ステータス優先でソート（異常→遅延→通常）
    const statusOrder = { suspended: 0, delayed: 1, resumed: 2, normal: 3 };
    trainInfos.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    response.json({
      count: trainInfos.length,
      trainInfos
    });

  } catch (error) {
    console.error('Train info fetch error:', error.message);
    response.status(500).json({ error: '運行情報の取得に失敗しました。' });
  }
});

/**
 * 駅検索API（ODPT）
 * GET /stations?name={駅名}&railway={railwayId}
 */
exports.stations = functions.https.onRequest(async (request, response) => {
  if (handleCors(request, response)) {
    return;
  }

  if (validateOdptApiKey(response)) {
    return;
  }

  try {
    const { name, railway } = request.query;

    const params = {
      'acl:consumerKey': ODPT_API_KEY,
    };

    if (railway) {
      params['odpt:railway'] = railway;
    }

    const apiResponse = await axios.get(`${ODPT_BASE_URL}/odpt:Station`, {
      params
    });

    let stations = apiResponse.data.map(s => ({
      id: s['owl:sameAs'],
      name: s['odpt:stationTitle']?.ja || s['dc:title'] || extractStationName(s['owl:sameAs']),
      railway: s['odpt:railway'],
      railwayName: extractStationName(s['odpt:railway'] || ''),
      operator: s['odpt:operator']?.replace('odpt.Operator:', ''),
      lat: s['geo:lat'],
      lng: s['geo:long']
    }));

    // 駅名でフィルタリング
    if (name) {
      const searchName = name.toLowerCase();
      stations = stations.filter(s =>
        s.name.toLowerCase().includes(searchName)
      );
    }

    // 駅名順にソート
    stations.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    // 最大100件に制限
    stations = stations.slice(0, 100);

    response.json({
      count: stations.length,
      stations
    });

  } catch (error) {
    console.error('Stations fetch error:', error.message);
    response.status(500).json({ error: '駅情報の取得に失敗しました。' });
  }
});
