# Il Sangue Rosso — Site

Même architecture que Volta (Firebase Realtime DB + GitHub Pages), palette noir/doré, sans membres pré-remplis.

## Mise en route
1. Crée un projet Firebase séparé → Realtime Database (région europe-west1) → récupère la config.
2. Remplace les valeurs dans `js/firebase-config.js` (`FIREBASE_CONFIG`).
3. Dans Firebase Console → Realtime Database → Règles, autorise explicitement chaque nœud utilisé (`membres`, `stock`, `transactions`, `actions`, `actions_dispo`, `argent`, `four_purete`, `labo_stock_commun`, `fourriere`, `taxes`, `blanchiment`, `payes`, `quotas`, `config`, `grades`).
4. Crée ton premier membre admin directement dans Firebase Console (nœud `membres`), avec `role: "admin"`.
5. Push sur `github.com/<toi>/il-sangue-rosso`, active GitHub Pages sur la branche.

## Structure
Identique à Volta : `index.html` (login), `css/style.css`, `js/app.js` (nav), `js/firebase-config.js`, `pages/` (dashboard, tracker, stock, transactions, labo, four, fourriere, stats, quotas, blanchiment, paye, taxes, admin, profil).
