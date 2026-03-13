# Dashboard V2

Observability Dashboard avec React, TypeScript, Chart.js, D3.js et données temps réel.

## Fonctionnalités

- ✅ **4 Widgets** : HistoricalCharts, ServiceMap, SLODashboard, AIPanel
- ✅ **Dark Mode** : Toggle dans le header avec persistance localStorage
- ✅ **Données temps réel** : WebSocket pour mises à jour live (toutes les 5s)
- ✅ **API Backend** : Express + WebSocket pour données dynamiques

## Structure

```
dashboard-v2/
├── src/
│   ├── components/          # Composants React
│   ├── context/            # Contexts (Theme, Realtime)
│   ├── Dashboard/          # Layout principal
│   └── App.tsx
├── api/                    # Backend Node.js
│   ├── server.js          # Express + WebSocket
│   └── package.json
└── dist/                  # Build production
```

## Démarrage rapide

### 1. Démarrer le backend

```bash
cd api
npm start
# → http://localhost:3001
```

### 2. Démarrer le frontend

```bash
npm run dev
# → http://localhost:5173
```

### 3. Build production

```bash
npm run build
# → dist/
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/metrics` | Métriques actuelles |
| `GET /api/metrics/history?period=7d\|30d\|90d` | Historique |
| `GET /api/services` | État des services |
| `GET /api/slos` | Indicateurs SLO |
| `GET /api/insights` | Insights IA |
| `WS /` | WebSocket temps réel |

## Variables d'environnement

Créer `.env` dans `dashboard-v2/` :

```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```
