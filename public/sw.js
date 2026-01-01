// キャッシュ名（バージョン管理用）
const CACHE_NAME = 'train-transit-v2';

// キャッシュするファイル
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/images/app-icon-192.png',
  '/manifest.json'
];

/**
 * インストール時：静的ファイルをキャッシュ
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

/**
 * アクティベート時：古いキャッシュを削除
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

/**
 * フェッチ時：リクエストタイプに応じた戦略
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // POSTリクエストはキャッシュしない
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // API呼び出しはネットワーク優先
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 静的ファイルはキャッシュ優先
  event.respondWith(handleStaticRequest(request));
});

/**
 * API リクエストの処理（ネットワーク優先）
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.error('[SW] API fetch failed:', error);
    return new Response(
      JSON.stringify({
        error: 'オフラインです。ネットワーク接続を確認してください。'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }
}

/**
 * 静的ファイルリクエストの処理（キャッシュ優先）
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleStaticRequest(request) {
  try {
    // キャッシュを確認
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // キャッシュになければネットワークから取得
    const networkResponse = await fetch(request);

    // 有効なレスポンスのみキャッシュ
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      // クローンをキャッシュに保存（レスポンスは一度しか読めないため）
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Static fetch failed:', error);

    // オフライン時はキャッシュされたindex.htmlを返す（SPA対応）
    const cachedIndex = await caches.match('/index.html');
    if (cachedIndex) {
      return cachedIndex;
    }

    // 最終手段：エラーレスポンス
    return new Response('オフラインです', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
