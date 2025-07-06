const prometheus = require('prom-client');

// Configuration du registre Prometheus
const register = prometheus.register;

// Métriques HTTP de base
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Métriques spécifiques à l'authentification
const authAttemptsTotal = new prometheus.Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'success', 'provider']
});

const authDurationSeconds = new prometheus.Histogram({
  name: 'auth_duration_seconds',
  help: 'Duration of authentication operations in seconds',
  labelNames: ['method', 'provider'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeUsers = new prometheus.Gauge({
  name: 'active_users_total',
  help: 'Total number of active users'
});

// Métriques système
const processCpuUsage = new prometheus.Gauge({
  name: 'process_cpu_usage_percent',
  help: 'CPU usage percentage'
});

const processMemoryUsage = new prometheus.Gauge({
  name: 'process_memory_usage_bytes',
  help: 'Memory usage in bytes'
});

// Middleware pour collecter les métriques HTTP
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Intercepter la fin de la réponse
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convertir en secondes
    const route = req.route ? req.route.path : req.path;
    
    // Enregistrer les métriques HTTP
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Fonction pour mettre à jour les métriques système
const updateSystemMetrics = () => {
  const usage = process.cpuUsage();
  const memUsage = process.memoryUsage();
  
  // CPU usage (approximation)
  processCpuUsage.set(usage.user / 1000000); // Convertir en pourcentage approximatif
  
  // Memory usage
  processMemoryUsage.set(memUsage.heapUsed);
};

// Mettre à jour les métriques système toutes les 30 secondes
setInterval(updateSystemMetrics, 30000);

// Fonction pour enregistrer les tentatives d'authentification
const recordAuthAttempt = (method, success, provider = 'local') => {
  authAttemptsTotal
    .labels(method, success.toString(), provider)
    .inc();
};

// Fonction pour mesurer la durée d'authentification
const recordAuthDuration = (method, provider = 'local', duration) => {
  authDurationSeconds
    .labels(method, provider)
    .observe(duration);
};

// Fonction pour mettre à jour le nombre d'utilisateurs actifs
const updateActiveUsers = (count) => {
  activeUsers.set(count);
};

module.exports = {
  register,
  metricsMiddleware,
  recordAuthAttempt,
  recordAuthDuration,
  updateActiveUsers,
  httpRequestDurationMicroseconds,
  httpRequestTotal,
  authAttemptsTotal,
  authDurationSeconds,
  activeUsers
}; 