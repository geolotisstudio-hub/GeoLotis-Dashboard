# 📊 Dashboard GéoLotis — Supervision du parc

Tableau de bord **GéoLotis Studio** : il lit les données remontées par les
installations clientes (logiciel GéoLotis) depuis la **base Maître Supabase**.

Application web **autonome** : elle ne fait plus partie du code du logiciel,
qui ne la livre donc plus dans ses installateurs Windows et APK Android.

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```

Premier écran : la **clé de la base Maître**. Le dashboard démarre sans :
les données publiques (`installations`, `telemetry`) s'affichent déjà, la clé
est demandée pour lire `activites_globales`, `erreurs` et
`utilisateurs_entreprise`.

## Configuration

| Variable | Fichier | Rôle |
|---|---|---|
| `VITE_MASTER_URL` | `.env` (copier `.env.example`) | URL de la base Maître. Une valeur par défaut est codée en repli dans `src/lib/supabaseClient.js`, donc le dashboard fonctionne même sans `.env`. |

Aucune clé Supabase n'est dans le code ni dans `.env` : la clé est saisie
dans l'écran de déverrouillage puis stockée en `localStorage` sur le poste.

## Structure

```
index.html                 Point d'entrée (titre + favicon)
vite.config.js             Port 5174 (5173 = serveur du logiciel)
src/main.jsx               ReactDOM + StrictMode (routeur : BrowserRouter ici)
src/App.jsx                Gate clé maître + routes + Toaster + theme sombre
src/index.css              Design system "geo-*" + @import "tailwindcss"
src/components/            Layout, Sidebar, TopBar, DataTable, KpiCard, ...
src/pages/                 Dashboard, Installations, InstallationDetail,
                           Activites, Erreurs, Alertes, Parametres
src/hooks/                 useInstallations, useTelemetry, useActivites, useErreurs
src/lib/supabaseClient.js  URL maître, clé localStorage, cache mémoires
src/utils/                 constants.js (STATUTS, VERSIONS), format.js, supabaseErrors.js
sql/                       Scripts SQL de la base Maître (référence du contrat)
_recuperation/             Ancienne version orpheline d'InstallationDetail (.bak, non compilée)
CONTRAT.md                 Lien logiciel ↔ dashboard : ce qui ne doit pas casser
```

## Routes

| Route | Page |
|---|---|
| `/` | Vue d'ensemble |
| `/installations` | Entreprises (recherche via `?q=`) |
| `/installations/:installation_id` | Détail d'une entreprise |
| `/activites` | Journal des activités |
| `/erreurs` | Suivi des erreurs |
| `/alertes` | Anomalies détectées |
| `/parametres` | Export, clés, configuration |

Le préfixe `/admin` n'existe plus : le dashboard est servi à la racine.

## À faire à chaque nouvelle version du logiciel

Éditer `src/utils/constants.js` : `VERSION_ACTUELLE` et la clé correspondante
dans `VERSION_COLORS`. Sans quoi la nouvelle version est présentée comme
obsolète dans l'onglet Alertes.

Détail complet des dépendances de données : **`CONTRAT.md`**.
