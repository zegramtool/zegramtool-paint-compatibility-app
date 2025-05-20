// キャッシュの名前とバージョン
const CACHE_NAME = 'paint-compatibility-app-v1';

// キャッシュするファイルリスト
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './塗料互換表_paint.csv',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/papaparse@5/papaparse.min.js',
  'https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js',
  'https://cdn.tailwindcss.com'
];

// インストール時のイベント処理
self.addEventListener('install', event => {
  // 既存のサービスワーカーをアクティブにする前に新しいキャッシュをインストール
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 新しいサービスワーカーをすぐにアクティブ化
  );
});

// アクティベート時のイベント処理
self.addEventListener('activate', event => {
  // 古いキャッシュの削除
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim()) // このサービスワーカーが制御していないクライアントを制御
  );
});

// フェッチ時のイベント処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュにない場合はネットワークリクエスト
        return fetch(event.request)
          .then(response => {
            // 有効なレスポンスでない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをキャッシュに追加するためにクローンを作成
            // (ストリームは一度しか使用できないため)
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(() => {
        // オフライン時などでネットワークリクエストが失敗した場合
        // 静的アセット以外のリクエストの場合、オフラインページを返すなどの対応も可能
        console.log('Fetch failed; returning offline page instead.');
      })
  );
});
