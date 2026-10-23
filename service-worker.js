const VERSAO_CACHE = "roleta-v1";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo-amado-maker.png",
  "./roleta.mp3",
  "./icone-192.png",
  "./icone-512.png"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(caches.open(VERSAO_CACHE).then(function (cache) { return cache.addAll(ARQUIVOS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.filter(function (nome) { return nome !== VERSAO_CACHE; })
        .map(function (nome) { return caches.delete(nome); }));
    }).then(function () { return self.clients.claim(); })
  );
});

async function responderComFaixa(requisicao, resposta) {
  const faixa = /bytes=(\d*)-(\d*)/.exec(requisicao.headers.get("range"));
  const dados = await resposta.arrayBuffer();
  const inicio = faixa[1] ? parseInt(faixa[1], 10) : 0;
  const fim = faixa[2] ? parseInt(faixa[2], 10) : dados.byteLength - 1;
  return new Response(dados.slice(inicio, fim + 1), {
    status: 206,
    headers: {
      "Content-Type": resposta.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": "bytes " + inicio + "-" + fim + "/" + dados.byteLength,
      "Content-Length": String(fim - inicio + 1)
    }
  });
}

self.addEventListener("fetch", function (evento) {
  const requisicao = evento.request;
  if (requisicao.method !== "GET") return;
  evento.respondWith(
    caches.match(requisicao, { ignoreSearch: true }).then(function (guardado) {
      if (!guardado) return fetch(requisicao);
      if (requisicao.headers.get("range")) return responderComFaixa(requisicao, guardado);
      return guardado;
    })
  );
});
