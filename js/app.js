// 5 pages toujours visibles + sous-menu "Plus" repliable
const NAV_ITEMS = [
  { id: "dashboard",    nom: "Dashboard",    icon: "🏠", fichier: "dashboard.html" },
  { id: "tracker",      nom: "Tracker",      icon: "🎯", fichier: "tracker.html" },
  { id: "stock",        nom: "Stock",        icon: "📦", fichier: "stock.html" },
  { id: "transactions", nom: "Transactions", icon: "💰", fichier: "transactions.html" },
  { id: "labo",         nom: "Labo",         icon: "⚗️", fichier: "labo.html" }
];

const NAV_SUBMENU = [
  { id: "four",        nom: "Four",         icon: "🔥", fichier: "four.html" },
  { id: "stats",       nom: "Stats",        icon: "📊", fichier: "stats.html" },
  { id: "quotas",      nom: "Quotas",       icon: "✅", fichier: "quotas.html" },
  { id: "blanchiment", nom: "Blanchiment",  icon: "🧺", fichier: "blanchiment.html" },
  { id: "paye",        nom: "Paye",         icon: "💵", fichier: "paye.html" },
  { id: "taxes",       nom: "Taxes",        icon: "🏛️", fichier: "taxes.html" },
  { id: "admin",       nom: "Admin",        icon: "🛠️", fichier: "admin.html" },
  { id: "profil",      nom: "Profil",       icon: "👤", fichier: "profil.html" }
];

function toggleNavSubmenu() {
  const sub = document.getElementById("navSubmenu");
  const arrow = document.getElementById("navSubmenuArrow");
  const open = sub.classList.toggle("open");
  if (arrow) arrow.textContent = open ? "▾" : "▸";
}

function toggleMobileSidebar() {
  document.querySelector(".sidebar").classList.toggle("open");
}

// Construit la sidebar, marque la page active, ouvre le sous-menu si besoin
function initShell(activePageId, membre) {
  const shell = document.getElementById("app-shell");
  const isRoot = isRootPage();
  const base = isRoot ? "pages/" : "";
  const homeLink = isRoot ? "#" : "../index.html";
  const logoPath = isRoot ? "img/logo.png" : "../img/logo.png";

  const submenuHasActive = NAV_SUBMENU.some(i => i.id === activePageId);

  const navHtml = NAV_ITEMS.map(item => `
    <div class="nav-item ${item.id === activePageId ? "active" : ""}" onclick="location.href='${base}${item.fichier}'">
      <span>${item.icon}</span><span>${item.nom}</span>
    </div>`).join("");

  const submenuHtml = NAV_SUBMENU.map(item => `
    <div class="nav-item ${item.id === activePageId ? "active" : ""}" onclick="location.href='${base}${item.fichier}'">
      <span>${item.icon}</span><span>${item.nom}</span>
    </div>`).join("");

  shell.innerHTML = `
    <button class="mobile-toggle" onclick="toggleMobileSidebar()">☰ Menu</button>
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <img src="${logoPath}" alt="logo">
          <span>IL SANGUE ROSSO</span>
        </div>
        <nav>
          ${navHtml}
          <div class="nav-submenu-toggle" onclick="toggleNavSubmenu()">
            <span>☰ Plus</span><span id="navSubmenuArrow">${submenuHasActive ? "▾" : "▸"}</span>
          </div>
          <div class="nav-submenu ${submenuHasActive ? "open" : ""}" id="navSubmenu">
            ${submenuHtml}
          </div>
        </nav>
        <div class="nav-footer">
          <div style="font-size:0.78rem;color:var(--gris);">${membre ? membre.prenom : ""}</div>
          <div style="font-size:0.72rem;color:var(--or-clair);">${membre ? (membre.grade || "") : ""}</div>
          <button class="btn-logout" onclick="logout()">Déconnexion</button>
        </div>
      </aside>
      <main class="main" id="page-content"></main>
    </div>
  `;
}

function logout() {
  clearSession();
  window.location.href = isRootPage() ? "index.html" : "../index.html";
}
