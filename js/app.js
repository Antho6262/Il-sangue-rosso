/* ============================================================
   IL SANGUE ROSSO — app.js
   Sidebar / topbar communs + items de navigation.
   ============================================================ */

const NAV_ITEMS = [
  { page: "dashboard",    icon: "🏠", label: "Dashboard",    file: "dashboard.html" },
  { page: "tracker",      icon: "📋", label: "Tracker",      file: "tracker.html" },
  { page: "stock",        icon: "📦", label: "Stock",        file: "stock.html" },
  { page: "transactions", icon: "🔁", label: "Transactions", file: "transactions.html" },
  { page: "labo",         icon: "🧪", label: "Labo",         file: "labo.html" },
  { page: "four",         icon: "🔥", label: "Four",         file: "four.html" },
  { page: "stats",        icon: "📊", label: "Stats",        file: "stats.html" },
  { page: "quotas",       icon: "🎯", label: "Quotas",       file: "quotas.html" },
  { page: "blanchiment",  icon: "💵", label: "Blanchiment",  file: "blanchiment.html" },
  { page: "paye",         icon: "💰", label: "Paye",         file: "paye.html" },
  { page: "taxes",        icon: "🧾", label: "Taxes",        file: "taxes.html" },
  { page: "admin",        icon: "⚙️", label: "Admin",        file: "admin.html" },
  { page: "profil",       icon: "👤", label: "Profil",       file: "profil.html" }
];

/* Les 5 premières pages restent toujours visibles dans la sidebar ;
   tout le reste est regroupé dans un sous-menu repliable "Plus". */
const NAV_PRIMARY_COUNT = 5;

/* Ouvre/ferme le sous-menu "Plus" dans la sidebar. */
function toggleNavSubmenu(toggleEl) {
  const submenu = toggleEl.nextElementSibling;
  const chevron = toggleEl.querySelector(".nav-chevron");
  const ouvert = submenu.style.display !== "none";
  submenu.style.display = ouvert ? "none" : "block";
  chevron.textContent = ouvert ? "▸" : "▾";
}

/* ============================================================
   SEMAINES — dates ancrées Europe/Paris (dimanche 19h → dimanche 19h).
   Utilisées par ensureActiveWeek() ci-dessous et par Admin → Semaines.
   ============================================================ */
function getParisParts(ts) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(new Date(ts));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") === 24 ? 0 : get("hour"), minute: get("minute"), second: get("second") };
}
function ajouterJoursCivils(y, m, d, jours) {
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() + jours);
  return { year: anchor.getUTCFullYear(), month: anchor.getUTCMonth() + 1, day: anchor.getUTCDate() };
}
function parisWallToUTC(y, m, d, h, mi, s) {
  let guess = Date.UTC(y, m - 1, d, h, mi, s || 0);
  for (let i = 0; i < 2; i++) {
    const p = getParisParts(guess);
    const guessAsIfLocal = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    guess += Date.UTC(y, m - 1, d, h, mi, s || 0) - guessAsIfLocal;
  }
  return guess;
}
function fmtJJMM(ts) {
  const p = getParisParts(ts);
  return String(p.day).padStart(2, "0") + "/" + String(p.month).padStart(2, "0");
}
function nomAutoSemaine(debut, fin) { return "Semaine du " + fmtJJMM(debut) + " au " + fmtJJMM(fin); }
function prochainesBornes(derniere) {
  if (!derniere || !derniere.fin) {
    // Pas de semaine précédente : ancre sur "maintenant" (dimanche 19h le plus récent).
    const now = Date.now();
    const p = getParisParts(now);
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short" }).format(new Date(now));
    const weekday = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd];
    let dimRef = ajouterJoursCivils(p.year, p.month, p.day, -weekday);
    let debut = parisWallToUTC(dimRef.year, dimRef.month, dimRef.day, 19, 0, 0);
    if (debut > now) { dimRef = ajouterJoursCivils(dimRef.year, dimRef.month, dimRef.day, -7); debut = parisWallToUTC(dimRef.year, dimRef.month, dimRef.day, 19, 0, 0); }
    const dimSuivant = ajouterJoursCivils(dimRef.year, dimRef.month, dimRef.day, 7);
    const fin = parisWallToUTC(dimSuivant.year, dimSuivant.month, dimSuivant.day, 19, 0, 0);
    return { debut, fin, verrouAt: fin };
  }
  const debut = derniere.fin;
  const p = getParisParts(debut);
  const dimSuivant = ajouterJoursCivils(p.year, p.month, p.day, 7);
  const fin = parisWallToUTC(dimSuivant.year, dimSuivant.month, dimSuivant.day, 19, 0, 0);
  return { debut, fin, verrouAt: fin };
}
/* Ouvre la semaine suivante, enchaînée après la dernière. Protection anti-doublon
   via semaine_index/{debut} (utile si plusieurs membres déclenchent la rotation
   en même temps). */
async function creerSemaineSuivante(derniere) {
  const bounds = prochainesBornes(derniere);
  const idxRef = db.ref("semaine_index/" + bounds.debut);
  const existe = await idxRef.once("value");
  if (existe.exists()) { console.log("Semaine suivante déjà créée par ailleurs."); return; }
  const id = uid();
  const nom = nomAutoSemaine(bounds.debut, bounds.fin);
  await idxRef.set(id);
  await db.ref("semaines/" + id).set({ nom, bloquee: false, createdAt: Date.now(), debut: bounds.debut, fin: bounds.fin, verrouAt: bounds.verrouAt });
}

/* ============================================================
   SEMAINES — vérification / clôture / rotation automatique.
   Remplace le workflow GitHub Actions (peu fiable : les cron schedules
   de GitHub sont retardés de plusieurs heures sur les dépôts peu actifs).
   Appelée à CHAQUE chargement de page (voir initShell ci-dessous) :
   c'est donc une connexion de membre, et non un horaire fixe, qui
   déclenche la clôture — beaucoup plus fiable.
   Une transaction Firebase sur la semaine elle-même évite qu'un
   double blocage/résumé/webhook se produise si plusieurs membres
   se connectent au même moment.
   ============================================================ */
async function ensureActiveWeek() {
  const now = Date.now();
  const allSnap = await db.ref("semaines").once("value");
  const all = entries(allSnap.val()).map(([id, s]) => ({ id, ...s }));
  const active = all.find(s => s.bloquee !== true);

  if (!active) {
    // Filet de sécurité : aucune semaine du tout (première installation) → on en crée une.
    await creerSemaineSuivante(null);
    return;
  }

  if (!active.verrouAt || active.verrouAt > now) return; // semaine toujours valide, rien à faire

  // Transaction : ne verrouille que si la semaine est toujours active — évite
  // une double clôture si un autre membre se connecte au même instant.
  const result = await db.ref("semaines/" + active.id).transaction(current => {
    if (!current || current.bloquee === true) return current;
    return { ...current, bloquee: true, closedAt: now };
  });
  if (!result.committed || !result.snapshot.val() || result.snapshot.val().closedAt !== now) return; // un autre membre s'en charge déjà

  // C'est nous qui avons remporté la clôture : résumé + webhook + semaine suivante.
  try {
    await genererEtEnvoyerResumeSemaine(active.id, active.nom);
  } catch (e) {
    console.error("Résumé/webhook de semaine KO :", e);
  }
  await creerSemaineSuivante(active);
}

/* Construit le résumé texte de la semaine clôturée, l'enregistre sur
   semaines/{id}/resume (repris par Admin → Semaines), et l'envoie sur
   Discord si un webhook est configuré dans Admin → Config. */
async function genererEtEnvoyerResumeSemaine(id, nom) {
  const snap = await db.ref("actions/" + id).once("value");
  const actions = entries(snap.val()).map(([, a]) => a);
  const gainsSale = actions.reduce((acc, a) => acc + Number(a.argent_sale || 0), 0);
  const gainsPropre = actions.reduce((acc, a) => acc + Number(a.argent_propre || 0), 0);
  const reussites = actions.filter(a => a.resultat === "Réussite").length;
  const echecs = actions.filter(a => a.resultat === "Échec").length;
  const parMembre = {};
  actions.forEach(a => { parMembre[a.prenom_membre] = (parMembre[a.prenom_membre] || 0) + 1; });
  const classement = Object.entries(parMembre).sort((a, b) => b[1] - a[1])
    .map(([p, n], i) => `${i + 1}. ${p} — ${n} action(s)`).join("\n");

  const texte = `📋 RÉSUMÉ — ${nom} — Il Sangue Rosso\n` +
    `Actions : ${actions.length} (✅ ${reussites} / ❌ ${echecs})\n` +
    `Gains sale : ${formatMoney(gainsSale)}\n` +
    `Gains propre : ${formatMoney(gainsPropre)}\n\n` +
    `Classement :\n${classement || "—"}`;

  await db.ref("semaines/" + id).update({ resume: texte });

  const cfgSnap = await db.ref("config/discord_webhook_semaine").once("value");
  const webhook = cfgSnap.val();
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: `📋 RÉSUMÉ — ${nom}`,
          color: 0x6b7280,
          footer: { text: "IL SANGUE ROSSO — Famiglia · Onore · Lealtà" },
          timestamp: new Date().toISOString(),
          fields: [
            { name: "Actions", value: `${actions.length} (✅ ${reussites} / ❌ ${echecs})`, inline: true },
            { name: "Gains sale", value: formatMoney(gainsSale), inline: true },
            { name: "Gains propre", value: formatMoney(gainsPropre), inline: true },
            { name: "Classement", value: classement || "—" },
          ],
        }],
      }),
    });
  } catch (e) {
    console.error("Échec de l'envoi du webhook Discord :", e.message);
  }
}

/* Construit le shell (sidebar + topbar) dans #shell, protège la page,
   et renvoie la session du membre connecté (ou redirige vers /index.html). */
async function initShell(activePage, pageTitle) {
  const session = requireSession();
  if (!session) return null;

  ensureActiveWeek().catch(e => console.error("ensureActiveWeek KO :", e));

  let allowed;
  try {
    allowed = await canAccess(session, activePage);
  } catch (e) {
    allowed = false;
  }
  if (!allowed) {
    document.body.innerHTML =
      '<div class="login-wrap"><div class="login-card"><div class="login-brand">ACCÈS REFUSÉ</div>' +
      '<p class="muted" style="text-align:center;margin-top:10px;">Ton compte est désactivé ou n\'a pas accès à cette page.</p>' +
      '<a href="' + pathToRoot() + 'index.html" class="btn btn-primary" style="margin-top:16px;display:block;text-align:center;" onclick="clearSession()">Retour à la connexion</a></div></div>';
    return null;
  }

  const root = pathToRoot();
  const primaryItems = NAV_ITEMS.slice(0, NAV_PRIMARY_COUNT);
  const restItems = NAV_ITEMS.slice(NAV_PRIMARY_COUNT);

  let navHtml = "";
  for (const item of primaryItems) {
    const ok = await canAccess(session, item.page);
    if (!ok) continue;
    const active = item.page === activePage ? " active" : "";
    navHtml += `<a class="nav-item${active}" href="${root}pages/${item.file}">
        <span class="ic">${item.icon}</span><span class="lbl">${item.label}</span>
      </a>`;
  }

  let restHtml = "";
  let restContainsActive = false;
  for (const item of restItems) {
    const ok = await canAccess(session, item.page);
    if (!ok) continue;
    const active = item.page === activePage ? " active" : "";
    if (active) restContainsActive = true;
    restHtml += `<a class="nav-item${active}" href="${root}pages/${item.file}">
        <span class="ic">${item.icon}</span><span class="lbl">${item.label}</span>
      </a>`;
  }

  if (restHtml) {
    navHtml += `
      <div class="nav-item nav-toggle" onclick="toggleNavSubmenu(this)">
        <span class="ic">☰</span><span class="lbl">Plus</span><span class="nav-chevron">${restContainsActive ? "▾" : "▸"}</span>
      </div>
      <div class="nav-submenu" style="display:${restContainsActive ? "block" : "none"};">${restHtml}</div>
    `;
  }

  const shellHtml = `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-head">
          <img src="${root}img/logo.png" alt="Il Sangue Rosso" class="sidebar-coin">
          <div class="sidebar-logo"><span class="full">IL SANGUE ROSSO</span></div>
        </div>
        <nav class="nav">${navHtml}</nav>
        <div class="sidebar-foot">
          <div class="who"><b>${session.prenom} ${session.nom || ""}</b><span class="grade">${session.grade || ""}</span></div>
          <div id="rtStatus" class="small muted" style="margin:6px 0;">🔄 Connexion…</div>
          <span class="logout-link" onclick="logout()">Se déconnecter</span>
        </div>
      </aside>
      <div class="main">
        <div class="topbar">
          <div class="topbar-title">${pageTitle || ""}</div>
          <div class="topbar-brand"><span class="coin">🪙</span> IL SANGUE ROSSO</div>
        </div>
        <main class="content fade-in" id="content"></main>
      </div>
    </div>
  `;
  document.getElementById("shell").outerHTML = shellHtml;

  // Indicateur temps réel : reflète l'état réel de la connexion Firebase
  // (se met à jour tout seul si la connexion tombe ou revient).
  db.ref(".info/connected").on("value", snap => {
    const el = document.getElementById("rtStatus");
    if (!el) return;
    el.textContent = snap.val() === true ? "🟢 Temps réel actif" : "🔴 Connexion perdue…";
  });

  return session;
}
