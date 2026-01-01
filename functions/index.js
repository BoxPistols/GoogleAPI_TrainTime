const functions = require('firebase-functions');
const axios = require('axios');

// Google Maps API Key（Firebase環境変数から取得）
// 設定方法: firebase functions:config:set google.maps_api_key="YOUR_API_KEY"
const GOOGLE_MAPS_API_KEY = functions.config().google?.maps_api_key || process.env.GOOGLE_MAPS_API_KEY || '';

// CORS対応のヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * ルート検索API
 * POST /route
 * Body: { origin, destination, datetime, timeType }
 */
exports.route = functions.https.onRequest(async (request, response) => {
  // CORS対応
  if (request.method === 'OPTIONS') {
    response.set(corsHeaders);
    response.status(204).send('');
    return;
  }

  response.set(corsHeaders);

  try {
    const { origin, destination, datetime, timeType } = request.body;

    if (!origin || !destination) {
      response.status(400).json({ error: '出発駅と到着駅を指定してください' });
      return;
    }

    // Google Maps Directions API呼び出し
    const apiUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = {
      origin: origin + ', Japan',
      destination: destination + ', Japan',
      mode: 'transit',
      transit_mode: 'rail',
      language: 'ja',
      alternatives: true,
      key: GOOGLE_MAPS_API_KEY,
    };

    // 時刻指定
    if (datetime) {
      const timestamp = Math.floor(new Date(datetime).getTime() / 1000);
      if (timeType === 'arrival') {
        params.arrival_time = timestamp;
      } else {
        params.departure_time = timestamp;
      }
    } else {
      params.departure_time = 'now';
    }

    const apiResponse = await axios.get(apiUrl, { params });
    const data = apiResponse.data;

    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data.status, data.error_message);
      response.status(400).json({
        error: 'ルートが見つかりませんでした',
        details: data.status
      });
      return;
    }

    // レスポンスを整形
    const routes = data.routes.map(route => {
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
        lines: Array.from(lines),
        steps: steps
      };
    });

    response.json({ routes });

  } catch (error) {
    console.error('Route search error:', error);
    response.status(500).json({ error: '検索中にエラーが発生しました' });
  }
});

/**
 * ヘルスチェック
 */
exports.health = functions.https.onRequest((request, response) => {
  response.set(corsHeaders);
  response.json({ status: 'ok', timestamp: new Date().toISOString() });
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
