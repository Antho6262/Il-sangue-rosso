# ⚔️ IL SANGUE ROSSO — Contexte complet (site)

> À coller en début de nouvelle conversation.

## INFORMATIONS GÉNÉRALES
- **Nom du groupe** : Il Sangue Rosso
- **Devise** : Famiglia · Onore · Lealtà
- **Base du site** : code source réel de Volta, rebrandé (pas une reconstruction à partir de zéro)
- **Palette** : noir/doré (var(--steel) et var(--gold) = #c9a24a, remplace le rouge #c41e22 de Volta)
- **Repo GitHub** : https://github.com/Antho6262/il-sangue-rosso
- **Site en ligne** : https://antho6262.github.io/il-sangue-rosso/
- **Setup initial** : https://antho6262.github.io/il-sangue-rosso/setup.html (crée le compte Fondateur, prénom/nom/mdp au choix — pas de "Tony Diaz" en dur)

## FIREBASE
- Projet Firebase séparé (pas celui de Volta) : `il-sangue-rosso`
- Realtime Database région europe-west1
- Config déjà en place dans `js/firebase-config.js`
- Règles actuelles : `.read`/`.write` = true (ouvertes, à restreindre si besoin plus tard)
- Authentification anonyme activée (Firebase Console → Authentication → Sign-in method → Anonyme)

## DIFFÉRENCES AVEC VOLTA
- Page **Fourrière retirée** du menu et des fichiers (ni dans js/app.js NAV_ITEMS, ni js/firebase-config.js PAGES_DISPO)
- **Login en liste déroulante** (comme Volta) : sélection du membre + mot de passe, pas de champ identifiant texte libre
- Logo/background : `img/logo.png` et `img/background.png` = logo Il Sangue Rosso (lion doré + couronne)

## QUOTAS — système étendu (nouveau, n'existe pas sur Volta)
En plus du quota global (par membre) et du quota par catégorie (déjà présents sur Volta), un **quota par action fixe** a été ajouté :
- Node Firebase : `quotas_action/{membreId}/{actionId}`
- Chaque action dans `actions_dispo` peut avoir un champ `quota_defaut` (défini à la création dans Admin → Actions)
- Bouton **Admin → Actions → "Importer les actions Il Sangue Rosso"** : crée Supérette (10), Go Fast (8), Fleeca (6), Armurerie (8) avec leurs quotas par défaut
- Bouton **Admin → Quotas → "Appliquer les quotas par défaut"** : applique `quota_defaut` de chaque action à tous les membres actifs (n'écrase pas les valeurs déjà personnalisées à la main)
- Affichage : nouvelle section "Quota par action" dans `pages/admin.html` (tabQuotas) et `pages/quotas.html` (vue membre), en plus des sections existantes (quota global, quota par catégorie)
- Labo : quota géré par le système **par catégorie** déjà existant sur Volta (catégorie `labo_cat`), pas par ce nouveau système — cible 15/semaine à définir dans Admin → Quotas, section catégorie Labo

## LABO — Cycle Cannabis (spécifique à Il Sangue Rosso)
Configuré via **Admin → Stock → "Importer la recette Cannabis"**. Crée dans `stock/labo_cat` :
- 4 ingrédients bruts (recipe vide, stock suivi dans `labo_stock_commun`) : Eau, Fertilisant, Graine, Pot
- 3 produits/étapes avec recette, formant un cycle en 3 temps sur la page Labo (un onglet chacun) :
  1. **Plantation Cannabis** — recette : 54× Pot + 54× Graine (une fois par cycle)
  2. **Arrosage Cannabis** — recette : 54× Eau + 54× Fertilisant (à relancer 5-6 fois par cycle)
  3. **Récolte de Branches de Cannabis** — recette vide (aucun ingrédient consommé), la quantité de branches obtenue est **saisie manuellement** par le membre à chaque récolte (variable selon le cycle)
- ⚠️ Les quantités de recette (54) sont éditables ensuite dans Admin → Stock → catégorie Labo si elles changent.
- ⚠️ Comme sur Volta : le stock affiché des ingrédients (Eau/Fertilisant/Graine/Pot) vit dans `labo_stock_commun`, PAS dans `stock/labo_cat/produits/{id}/stock` (qui reste à 0 pour ces produits-ingrédients). Ne pas confondre les deux lors d'un futur ajustement.


## ACTIONS + DÉDUCTION AUTOMATIQUE DU STOCK (Tracker)
Chaque action de `actions_dispo` peut avoir une `recipe` : `[{catId, prodId, qty}]`. À chaque saisie réussie dans le Tracker, le stock est retiré automatiquement (et remis si l'action est supprimée). Une action avec `cat_variable` (ex: Vente de Drogue) laisse le membre choisir le produit de la catégorie.
- Bouton **Admin → Actions → "Importer les actions Il Sangue Rosso"** (`importerActionsISR()` dans `pages/admin.html`) crée :
  - catégories `materiel_cat` (Boîtier de piratage, Outil de crochetage, Carte Fleeca, Perceuse, Pistolet artisanal) et `drogue_cat` nommée **"Drogue"** (Sporex, Venia, Weed, Cocaïne, Mexicana) — sans écraser un produit déjà existant
  - actions : ATM (1 boîtier, quota 10), Cambu (1 outil de crochetage), Supérette (quota 10), Go Fast (quota 8), Fleeca (1 carte + 1 perceuse, quota 6), Armurerie (1 pistolet artisanal, quota 8 — hypothèse : consommé), Vente de Drogue (`cat_variable: drogue_cat`), Labo
- ⚠️ Le panneau "Importer les actions classiques" (Plantation, Vente de Branches…) existe toujours mais ne correspond pas au cycle Labo d'Il Sangue Rosso — ne pas l'utiliser.

## QUOTAS — ventes via Four / Transactions
Les ventes saisies sur les pages **Four** et **Transactions** s'écrivent dans le nœud `transactions` (champs `type:"vente"`, `catId`, `produit_id`, `quantite`, `membre_id`, `createdAt`), pas dans `actions`. Les quotas par catégorie (ex: Drogue 500/semaine, valeur à saisir par membre dans Admin → Quotas, nœud `quotas_categorie`) additionnent désormais **actions du Tracker + transactions de vente** de la semaine active (entre `semaines/{id}/createdAt` et `closedAt`). Modifié dans `pages/quotas.html` et `pages/admin.html` (tabQuotas). Rattrape les ventes déjà saisies.

## LOGO ANIMÉ (lions qui rugissent)
- `js/logo-anim.js` : `AnimatedLogo.mount(element, {src, firstRoar, roarEvery:[min,max], embers, manual})`. Lueur dorée, flammes qui vacillent, braises, et rugissement des deux lions (mâchoire du bas = morceau de `img/logo.png` qui pivote autour d'une charnière, gorge incandescente, crocs, ondes de choc, yeux qui s'embrasent, léger zoom/secousse). Clic ou survol = rugit. Respecte `prefers-reduced-motion`.
- Géométrie des lions codée en pixels du logo d'origine (1248×832) dans `LIONS` : **si le fichier `img/logo.png` change, il faut recaler ces coordonnées**.
- Page de connexion (`index.html`) : emblème `#loginEmblem` (à gauche de la carte sur écran ≥1000px, au-dessus sinon). Fond de la page de connexion = dégradé sombre (plus l'image, pour ne pas doubler le logo).
- Menu de gauche (`js/app.js`, `initShell`) : `#sidebarEmblem`, le module est chargé à la demande (aucune page à modifier). Styles `.alogo*`, `.login-emblem`, `.sidebar-emblem` à la fin de `css/style.css`.
- Le logo est affiché en `mix-blend-mode: screen` : son fond noir se fond dans la page.

## AUTOMATISATION SEMAINE (GitHub Actions)
- Dossier `.github/workflows/semaine-check.yml` + `.github/scripts/check-semaine.js`, copiés et rebrandés depuis Volta (même mécanique : cron toutes les 10 min, clôture dimanche 19h Paris)
- Nécessite le secret GitHub `FIREBASE_SERVICE_ACCOUNT` (clé de compte de service Firebase, JSON complet) dans Settings → Secrets and variables → Actions du repo `il-sangue-rosso`
- ⚠️ Statut à vérifier : pas confirmé que le secret a été ajouté côté utilisateur.

## POINTS D'ATTENTION
1. Le code est directement dérivé du vrai code Volta (fichiers réels envoyés par l'utilisateur), pas d'une reconstruction approximative — donc toute la logique standard (permissions, visibilité par grade, semaines, tracker, paye, blanchiment, taxes, stats, audit) est identique à Volta sauf mention contraire ci-dessus.
2. Toujours vérifier qu'un fichier/texte concerne bien Il Sangue Rosso et pas Volta ou un autre projet avant de le réutiliser.
3. Le dossier `pages/armurerie.html`, `objectifs.html`, `sanctions.html` existent mais sont hors menu (comme sur Volta) — ne pas les réintégrer sans demande explicite. Le dossier `img/armes/` a été supprimé (armurerie.html a donc des images cassées si on y accède directement, sans impact car page inaccessible depuis le menu).
4. **Livraison** : à partir de maintenant, envoyer uniquement le(s) fichier(s) modifié(s) à chaque changement (pas le zip complet), sauf demande contraire.
