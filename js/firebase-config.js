// ⚠️ Remplacer par la config de la NOUVELLE base Firebase créée pour Il Sangue Rosso
// (Firebase Console → Paramètres du projet → Vos applications → Config)
const FIREBASE_CONFIG = {
  apiKey: "REMPLACER_API_KEY",
  authDomain: "REMPLACER.firebaseapp.com",
  databaseURL: "https://REMPLACER-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "REMPLACER",
  storageBucket: "REMPLACER.appspot.com",
  messagingSenderId: "REMPLACER",
  appId: "REMPLACER"
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

// Liste des pages disponibles (mêmes 13 pages que Volta, sans Armurerie/Objectifs/Sanctions)
const PAGES_DISPO = [
  { id: "dashboard",    nom: "Dashboard",     fichier: "dashboard.html" },
  { id: "tracker",      nom: "Tracker",       fichier: "tracker.html" },
  { id: "stock",        nom: "Stock",         fichier: "stock.html" },
  { id: "transactions", nom: "Transactions",  fichier: "transactions.html" },
  { id: "labo",         nom: "Labo",          fichier: "labo.html" },
  { id: "four",         nom: "Four",          fichier: "four.html" },
  { id: "stats",        nom: "Stats",         fichier: "stats.html" },
  { id: "quotas",       nom: "Quotas",        fichier: "quotas.html" },
  { id: "blanchiment",  nom: "Blanchiment",   fichier: "blanchiment.html" },
  { id: "paye",         nom: "Paye",          fichier: "paye.html" },
  { id: "taxes",        nom: "Taxes",         fichier: "taxes.html" },
  { id: "admin",        nom: "Admin",         fichier: "admin.html" },
  { id: "profil",       nom: "Profil",        fichier: "profil.html" }
];

// ---- SESSION ----
function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("isr_session") || "null");
  } catch (e) { return null; }
}

function setSession(membre) {
  sessionStorage.setItem("isr_session", JSON.stringify(membre));
}

function clearSession() {
  sessionStorage.removeItem("isr_session");
}

// Résout une fois la session chargée (utilisé en tête de chaque page protégée)
function authReady() {
  return new Promise((resolve) => {
    const s = getSession();
    resolve(s);
  });
}

// Redirige vers le login si pas de session valide ; retourne le membre sinon
async function requireSession() {
  const s = await authReady();
  if (!s || !s.id) {
    window.location.href = isRootPage() ? "index.html" : "../index.html";
    return null;
  }
  return s;
}

function isRootPage() {
  return !window.location.pathname.includes("/pages/");
}

// Vérifie qu'un membre (via ses permissions/grade) peut accéder à une page
function canAccess(membre, pageId) {
  if (!membre) return false;
  if (membre.role === "admin") return true;
  const perms = membre.permissions || [];
  return perms.includes(pageId);
}
