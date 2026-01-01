const functions = require('firebase-functions');
const axios = require('axios');

// Google Maps API Key（Firebase環境変数から取得）
// 設定方法: firebase functions:config:set google.maps_api_key="YOUR_API_KEY"
const GOOGLE_MAPS_API_KEY = functions.config().google?.maps_api_key || process.env.GOOGLE_MAPS_API_KEY;

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
