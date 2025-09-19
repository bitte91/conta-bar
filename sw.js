// File: sw.js
// Service Worker para PWA Meu Bar - Controle de Fiado
// Implementa estratégia Cache First para funcionamento offline completo

/* ==========================================================================
   CONFIGURAÇÕES DO CACHE
   ========================================================================== */

// Nome e versão do cache - incrementar versão para forçar atualizações
const CACHE_NAME = 'meu-bar-pwa-v1.0.0';

// Lista de arquivos essenciais para cachear (todos os assets da aplicação)
const ESSENTIAL_FILES = [
    // Página principal
    '/',
    '/index.html',
    
    // Estilos
    '/css/style.css',
    
    // Scripts
    '/js/main.js',
    '/js/store.js', 
    '/js/ui.js',
    '/js/utils.js',
    
    // Manifesto
    '/manifest.json',
    
    // Ícones
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    
    // CDN do Dexie.js (importante para funcionamento offline)
    'https://unpkg.com/dexie/dist/dexie.js'
];

// URLs que devem sempre tentar a rede primeiro
const NETWORK_FIRST_URLS = [];

// URLs que devem ser ignoradas pelo Service Worker
const IGNORED_URLS = [
    '/sw.js', // O próprio service worker
    'chrome-extension://',
    'moz-extension://',
    'ms-browser-extension://'
];

/* ==========================================================================
   EVENTO DE INSTALAÇÃO
   ========================================================================== */

self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Instalando...');
    
    // Forçar ativação imediata (pular waiting)
    self.skipWaiting();
    
    event.waitUntil(
        cacheEssentialFiles()
            .then(() => {
                console.log('✅ Service Worker: Instalação completa');
            })
            .catch((error) => {
                console.error('❌ Service Worker: Erro na instalação:', error);
            })
    );
});

/**
 * Cacheia todos os arquivos essenciais para funcionamento offline
 */
async function cacheEssentialFiles() {
    try {
        console.log('📦 Service Worker: Cacheando arquivos essenciais...');
        
        const cache = await caches.open(CACHE_NAME);
        
        // Cachear arquivos essenciais
        await cache.addAll(ESSENTIAL_FILES);
        
        console.log(`✅ Service Worker: ${ESSENTIAL_FILES.length} arquivos cacheados`);
        
        return true;
    } catch (error) {
        console.error('❌ Service Worker: Erro ao cachear arquivos:', error);
        throw error;
    }
}

/* ==========================================================================
   EVENTO DE ATIVAÇÃO
   ========================================================================== */

self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker: Ativando...');
    
    // Tomar controle imediato de todos os clientes
    self.clients.claim();
    
    event.waitUntil(
        cleanupOldCaches()
            .then(() => {
                console.log('✅ Service Worker: Ativação completa');
            })
            .catch((error) => {
                console.error('❌ Service Worker: Erro na ativação:', error);
            })
    );
});

/**
 * Remove caches antigos quando uma nova versão é ativada
 */
async function cleanupOldCaches() {
    try {
        const cacheNames = await caches.keys();
        
        const deletionPromises = cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
                console.log(`🗑️ Service Worker: Removendo cache antigo: ${cacheName}`);
                return caches.delete(cacheName);
            });
        
        await Promise.all(deletionPromises);
        
        console.log('✅ Service Worker: Limpeza de caches concluída');
        return true;
    } catch (error) {
        console.error('❌ Service Worker: Erro na limpeza de caches:', error);
        throw error;
    }
}

/* ==========================================================================
   INTERCEPTAÇÃO DE REQUISIÇÕES (EVENTO FETCH)
   ========================================================================== */

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Ignorar certas URLs
    if (shouldIgnoreRequest(request, url)) {
        return;
    }
    
    // Aplicar estratégia baseada no tipo de recurso
    if (isNetworkFirstUrl(url)) {
        event.respondWith(handleNetworkFirst(request));
    } else {
        event.respondWith(handleCacheFirst(request));
    }
});

/**
 * Verifica se uma requisição deve ser ignorada
 * @param {Request} request - Objeto da requisição
 * @param {URL} url - URL da requisição
 * @returns {boolean} true se deve ignorar
 */
function shouldIgnoreRequest(request, url) {
    // Ignorar requisições que não são GET
    if (request.method !== 'GET') {
        return true;
    }
    
    // Ignorar URLs específicas
    return IGNORED_URLS.some(ignoredUrl => 
        url.href.startsWith(ignoredUrl) || url.pathname.includes(ignoredUrl)
    );
}

/**
 * Verifica se uma URL deve usar estratégia Network First
 * @param {URL} url - URL da requisição
 * @returns {boolean} true se deve usar network first
 */
function isNetworkFirstUrl(url) {
    return NETWORK_FIRST_URLS.some(networkUrl => 
        url.href.includes(networkUrl)
    );
}

/* ==========================================================================
   ESTRATÉGIAS DE CACHE
   ========================================================================== */

/**
 * Estratégia Cache First - Prioriza o cache, fallback para rede
 * Ideal para recursos estáticos que raramente mudam
 * @param {Request} request - Requisição
 * @returns {Promise<Response>} Resposta
 */
async function handleCacheFirst(request) {
    try {
        // Tentar buscar no cache primeiro
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log(`📋 Service Worker: Cache hit: ${request.url}`);
            return cachedResponse;
        }
        
        // Se não estiver no cache, buscar na rede
        console.log(`🌐 Service Worker: Cache miss, buscando na rede: ${request.url}`);
        const networkResponse = await fetch(request);
        
        // Se a resposta for válida, adicionar ao cache
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            
            // Clonar resposta para cachear (response só pode ser usado uma vez)
            const responseToCache = networkResponse.clone();
            cache.put(request, responseToCache);
            
            console.log(`💾 Service Worker: Adicionado ao cache: ${request.url}`);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error(`❌ Service Worker: Erro ao processar requisição ${request.url}:`, error);
        
        // Fallback para cache se rede falhou
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log(`📋 Service Worker: Fallback para cache: ${request.url}`);
            return cachedResponse;
        }
        
        // Se for uma requisição de navegação e não conseguimos atender,
        // retornar a página principal (SPA)
        if (request.mode === 'navigate') {
            const indexResponse = await caches.match('/index.html');
            if (indexResponse) {
                console.log('📋 Service Worker: Fallback para index.html');
                return indexResponse;
            }
        }
        
        // Último recurso: retornar erro
        return new Response('Conteúdo não disponível offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

/**
 * Estratégia Network First - Prioriza a rede, fallback para cache
 * Ideal para conteúdo dinâmico que precisa estar sempre atualizado
 * @param {Request} request - Requisição
 * @returns {Promise<Response>} Resposta
 */
async function handleNetworkFirst(request) {
    try {
        // Tentar buscar na rede primeiro com timeout
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Network timeout')), 3000)
            )
        ]);
        
        if (networkResponse && networkResponse.status === 200) {
            // Cachear resposta bem-sucedida
            const cache = await caches.open(CACHE_NAME);
            const responseToCache = networkResponse.clone();
            cache.put(request, responseToCache);
            
            console.log(`🌐 Service Worker: Network first success: ${request.url}`);
            return networkResponse;
        }
        
        throw new Error('Invalid network response');
        
    } catch (error) {
        console.log(`📋 Service Worker: Network failed, fallback para cache: ${request.url}`);
        
        // Fallback para cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Se não há cache, retornar erro
        return new Response('Conteúdo não disponível', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/* ==========================================================================
   EVENTOS DE MENSAGEM (COMUNICAÇÃO COM A APLICAÇÃO)
   ========================================================================== */

self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            // Forçar ativação de nova versão
            self.skipWaiting();
            break;
            
        case 'CACHE_STATUS':
            // Retornar status do cache
            getCacheStatus().then(status => {
                event.ports[0].postMessage({ type: 'CACHE_STATUS_RESPONSE', data: status });
            });
            break;
            
        case 'CLEAR_CACHE':
            // Limpar cache (útil para debugging)
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;
            
        default:
            console.log('Service Worker: Mensagem não reconhecida:', type);
    }
});

/**
 * Obtém informações sobre o status do cache
 */
async function getCacheStatus() {
    try {
        const cacheNames = await caches.keys();
        const currentCache = await caches.open(CACHE_NAME);
        const cachedRequests = await currentCache.keys();
        
        return {
            cacheName: CACHE_NAME,
            totalCaches: cacheNames.length,
            cachedFiles: cachedRequests.length,
            cacheNames: cacheNames
        };
    } catch (error) {
        console.error('Erro ao obter status do cache:', error);
        return null;
    }
}

/**
 * Limpa todos os caches (útil para debugging)
 */
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('Todos os caches foram limpos');
        return true;
    } catch (error) {
        console.error('Erro ao limpar caches:', error);
        return false;
    }
}

/* ==========================================================================
   EVENTOS DE SINCRONIZAÇÃO EM BACKGROUND
   ========================================================================== */

// Evento para sincronização em background (se suportado)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Service Worker: Sincronização em background');
        event.waitUntil(handleBackgroundSync());
    }
});

/**
 * Manipula sincronização em background
 */
async function handleBackgroundSync() {
    try {
        // Aqui poderíamos implementar sincronização de dados
        // Por exemplo, enviar transações pendentes para um servidor
        // quando a conectividade for restaurada
        
        console.log('✅ Service Worker: Sincronização em background completa');
        return true;
    } catch (error) {
        console.error('❌ Service Worker: Erro na sincronização:', error);
        return false;
    }
}

/* ==========================================================================
   LOG DE INICIALIZAÇÃO
   ========================================================================== */

console.log('🚀 Service Worker: Meu Bar PWA carregado e pronto');
console.log(`📋 Cache: ${CACHE_NAME}`);
console.log(`📦 Arquivos essenciais: ${ESSENTIAL_FILES.length}`);

// Verificar se está executando em localhost para desenvolvimento
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log('🛠️ Service Worker: Modo de desenvolvimento detectado');
}
