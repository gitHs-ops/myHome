const CACHE = 'chunjamun-v1';
const LOCAL = ['./index.html', './icon.svg', './manifest.json'];

// 설치: 로컬 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(LOCAL))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// fetch: 로컬은 캐시 우선 / CDN은 네트워크 우선
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // CDN (HanziWriter, 획순 데이터) → 네트워크 우선, 실패 시 캐시
  if (url.includes('jsdelivr.net')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 로컬 파일 → 캐시 우선, 없으면 네트워크
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
