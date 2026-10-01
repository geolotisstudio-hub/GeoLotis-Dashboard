# 🔗 CONTRAT — Logiciel GéoLotis ↔ Dashboard de supervision

> À lire **avant** toute modification des tables de la base Maître, de la
> télémétrie ou de la version du logiciel.
> Ce fichier existe à l'identique dans les **deux** projets.

## Ce qui a changé

Le tableau de bord d'administration ne fait **plus partie de ce dépôt**.
C'est une application web autonome, créée en septembre 2026 :

| | Projet | Rôle |
|---|---|---|
| **Logiciel** | `Mobile 3 Programme GéoLotis MàJ 2.4.1 - WEB` | Desktop Windows (Electron), mobile (Capacitor/Android), web. Installé chez les clients. |
| **Dashboard** | ce dossier | Supervision du parc (GéoLotis Studio uniquement). Ne contient **aucune** ligne de code du logiciel. |

Aucun des deux projets n'importe de fichier de l'autre. Ils ne partagent
**que la base Maître Supabase**.

## Les 3 liens à préserver (ne jamais casser)

### 1. La télémétrie (logiciel → base Maître)
Fichiers du logiciel, **intouchables** :
- `src/services/telemetryService.jsx` — collecte et envoie les données.
- `src/services/masterConfig.js` — URL + clé `anon` de la base Maître.

### 2. Le schéma de la base Maître (interface officielle)
Le dashboard (via `src/hooks/*.js`) **lit** ce que le logiciel **écrit** :

| Table | Écrit par (logiciel) | Lu par (dashboard) |
|---|---|---|
| `installations` | `telemetryService.jsx` | `useInstallations.js` |
| `telemetry` | `telemetryService.jsx` | `useTelemetry.js` |
| `activites_globales` | `telemetryService.jsx` | `useActivites.js` |
| `erreurs` | `telemetryService.jsx` | `useErreurs.js` |
| `utilisateurs_entreprise` | `telemetryService.jsx` (via `userManagementService.jsx`) | `useInstallations.js` |

➡️ **Renommer, supprimer ou ajouter une colonne utilisée ici oblige à mettre
à jour les deux projets.** Les scripts de référence sont copiés dans
`Geolytics Dashboard/sql/` : `SCRIPT_SQL_DASHBOARD.sql`,
`PATCH SECU BASE MAÎTRE.sql`, `PATCH SECU ACCES CLIENT.sql`.

### 3. Le numéro de version
- Logiciel : `package.json` → `"version": "2.4.1"` (et l'`App.jsx` affiché).
- Dashboard : `src/utils/constants.js` → `VERSION_ACTUELLE` + clé de
  `VERSION_COLORS`.

➡️ **À chaque nouvelle version du logiciel, mettre à jour le dashboard**
(sinon la dernière version apparaît comme « obsolète » dans les alertes).

## Identité d'une installation (à ne pas casser non plus)

- `installation_id` de la forme `INST-CORP-XXXX` est un **hash de l'URL
  Supabase du client** (`hashUrlToCorpId` dans `telemetryService.jsx`).
- Le dashboard regroupe les appareils d'une même entreprise à partir de cet
  `installation_id`, de l'URL et de l'email (`useInstallations.js`).

➡️ Changer l'algorithme de hash **scinde en deux** une entreprise existante
dans le dashboard.

## Sécurité

- La clé `service_role` de la base Maître n'existe **ni dans un projet, ni
  dans l'autre** : elle est saisie par GéoLotis Studio dans l'écran de
  déverrouillage du dashboard et stockée uniquement en `localStorage` sur son
  appareil.
- Bénéfice de la séparation : l'installateur Windows et l'APK Android ne
  contiennent **plus** le code du dashboard (avant, il était compilé dans
  `dist/` et donc livré à chaque client).
- Vérifié après la séparation : 0 occurrence de `geo-kpi-card`,
  `MasterKeyGate`, `useInstallations` dans `dist/` et dans
  `android/app/src/main/assets/public/`.

## Lancer le dashboard

```bash
cd "Desktop/Geolytics Dashboard"
npm install
npm run dev        # http://localhost:5174 (le logiciel tourne sur 5173)
```
