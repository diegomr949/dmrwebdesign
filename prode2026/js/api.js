/* ═══════════════════════════════════════════════════════════
   api.js — ADAPTADO PARA GOOGLE APPS SCRIPT v2.1
   Prode Mundial 2026 — Predictor de partidos
   - Sin Content-Type en POST → evita preflight CORS
   - Retry con backoff exponencial
   - Deduplicación de GETs en vuelo
   - Manejo de 401 / 429
   - Login por DNI (campo "email" como identificador genérico)
═══════════════════════════════════════════════════════════ */

const _meta    = document.querySelector('meta[name="api-base"]');
const API_BASE = _meta ? _meta.getAttribute('content').replace(/\/$/, '') : '';

if (!API_BASE) console.error('[API] ⚠ Falta <meta name="api-base"> en el HTML.');

const TIMEOUT_MS       = 20_000;
const TIMEOUT_WRITE_MS = 25_000;
const MAX_RETRIES      = 2;
const RETRY_BASE_MS    = 800;

const _inflight = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function http(path, method = 'GET', body = null, retries = MAX_RETRIES) {
  const token = localStorage.getItem('PRODE_TOKEN');

  let cleanPath   = path.startsWith('/') ? path.substring(1) : path;
  let route       = cleanPath;
  let queryParams = '';

  if (cleanPath.includes('?')) {
    const idx   = cleanPath.indexOf('?');
    route       = cleanPath.substring(0, idx);
    queryParams = '&' + cleanPath.substring(idx + 1);
  } else if (cleanPath.includes('&')) {
    const idx   = cleanPath.indexOf('&');
    route       = cleanPath.substring(0, idx);
    queryParams = '&' + cleanPath.substring(idx + 1);
  }

  let url = API_BASE + '?route=' + encodeURIComponent(route) + queryParams;
  if (token) url += '&token=' + encodeURIComponent(token);

  const isWrite     = method !== 'GET';
  const fetchMethod = isWrite ? 'POST' : 'GET';
  const inflightKey = method + ':' + path;

  if (!isWrite && _inflight[inflightKey]) {
    return _inflight[inflightKey];
  }

  const doFetch = async (attempt) => {
    const ctrl    = new AbortController();
    const timeout = isWrite ? TIMEOUT_WRITE_MS : TIMEOUT_MS;
    const tid     = setTimeout(() => ctrl.abort(), timeout);

    const options = { method: fetchMethod, signal: ctrl.signal };
    if (isWrite) {
      // ── SIN Content-Type ──────────────────────────────────────────────
      // Con Content-Type: application/json el browser manda un preflight
      // OPTIONS que GAS no responde → error CORS. Sin el header, el request
      // se trata como "simple" y no hay preflight. GAS parsea el body con
      // JSON.parse() manualmente de todas formas.
      options.body = JSON.stringify({ originalMethod: method, body });
    }

    try {
      const res     = await fetch(url, options);
      clearTimeout(tid);

      const textRes = await res.text();
      let data;
      try { data = JSON.parse(textRes); }
      catch(e) {
        console.error('[API] JSON inválido:', textRes.substring(0, 200));
        return null;
      }

      if (data.error && data.code === 401) {
        Auth.logout();
        Toast.info('Tu sesión expiró. Iniciá sesión nuevamente.');
        return null;
      }

      if (data.error && data.code === 429) {
        Toast.err('Demasiadas solicitudes. Esperá un momento.');
        return null;
      }

      return { ok: !data.error, status: data.code || 200, data: data.data };

    } catch(e) {
      clearTimeout(tid);
      if (e.name === 'AbortError') {
        if (attempt < retries) {
          await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
          return doFetch(attempt + 1);
        }
        Toast.err('El servidor tardó demasiado. Intentá de nuevo.');
        return null;
      }
      if (attempt < retries) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
        return doFetch(attempt + 1);
      }
      Toast.err('Error de conexión. Verificá tu red.');
      return null;
    }
  };

  const promise = doFetch(0).finally(() => {
    delete _inflight[inflightKey];
  });

  if (!isWrite) {
    _inflight[inflightKey] = promise;
  }

  return promise;
}

/* ════════════════════════════════════════════════════════
   APIs
   Nota: el campo se sigue llamando "email" en el protocolo
   interno, pero ahora lleva el DNI como valor. Así no se
   rompe ningún otro lugar del backend.
════════════════════════════════════════════════════════ */

const ApiAuth = {
  login: async (dni, password) => {
    const r = await http('auth/login', 'POST', { email: dni, password });
    if (r?.ok && r.data?.token) localStorage.setItem('PRODE_TOKEN', r.data.token);
    return r;
  },
  registro: async (nombre, dni, password, area) => {
    const r = await http('auth/registro', 'POST', { nombre, email: dni, password, area });
    if (r?.ok && r.data?.token) localStorage.setItem('PRODE_TOKEN', r.data.token);
    return r;
  },
  me:     () => http('auth/me'),
  logout: () => localStorage.removeItem('PRODE_TOKEN'),
};

const ApiPartidos = {
  getAll: (estado = null) => {
    const path = 'partidos' + (estado ? `&estado=${encodeURIComponent(estado)}` : '');
    return http(path);
  },
};

const ApiPredicciones = {
  getMias: () => http('predicciones/mis-predicciones'),
  guardar(pid, gl, gv) {
    if (!Number.isInteger(pid) || pid <= 0)            return Promise.resolve(null);
    if (!Number.isInteger(gl)  || gl  < 0 || gl > 20) return Promise.resolve(null);
    if (!Number.isInteger(gv)  || gv  < 0 || gv > 20) return Promise.resolve(null);
    return http('predicciones', 'POST', { partidoId: pid, golesLocal: gl, golesVisitante: gv });
  },
};

const ApiRanking = {
  get:      (area = null) => http('ranking' + (area ? `&area=${encodeURIComponent(area)}` : '')),
  getAreas: ()            => http('ranking/areas'),
};

const ApiEquipos = {
  getAll:       ()   => http('equipos'),
  getJugadores: (id) => http(`equipos/${encodeURIComponent(id)}/jugadores`),
};

const ApiAdmin = {
  getUsuarios:         ()            => http('admin/usuarios'),
  getDashboardUsuario: (id)          => http(`admin/usuarios/${encodeURIComponent(id)}/dashboard`),
  resetPassword:       (id, p)       => http(`admin/usuarios/${encodeURIComponent(id)}/reset-password`, 'PUT', { nuevaPassword: p }),
  actualizarArea:      (id, area)    => http(`admin/usuarios/${encodeURIComponent(id)}/area`, 'PUT', { area: area || null }),
  getAreas:            ()            => http('ranking/areas'),
  cargarResultado:     (pid, gl, gv) => http(`admin/partidos/${encodeURIComponent(pid)}/resultado`, 'PUT', { golesLocal: gl, golesVisitante: gv }),
};

const ApiPerfil = {
  cambiarPassword: (passwordActual, nuevaPassword) =>
    http('perfil/cambiar-password', 'PUT', { passwordActual, nuevaPassword }),
};
