
Mini Twitter Backend (Node.js + Express) — Firestore persistence
-------------------------------------------------------------

Structure:
 - index.js           : Express server with CRUD for 'posts' and '/metrics' endpoint
 - package.json

Setup:
1. Install Node.js (>=16) and npm.
2. Copy your Firebase service account JSON to the server and set:
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
   (or configure credentials as you prefer)
3. Install deps:
   npm install
4. Start:
   npm start

API examples:
 - Create post:
   curl -X POST http://localhost:4000/posts -H "Content-Type: application/json" -d '{"author":"ellen","text":"Hello"}'

 - Get posts:
   curl http://localhost:4000/posts

 - Send metric (page view):
   curl -X POST http://localhost:4000/metrics -H "Content-Type: application/json" -d '{"type":"page_view","page":"/home","renderTimeMs":120,"userId":"u1","variant":"A"}'

Notes:
 - This project uses Firestore. Collections used: posts, metrics_pageviews, metrics_clicks, metrics_loads.
 - For production, add authentication (Firebase Auth / JWT) and rate-limiting.
