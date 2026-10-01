# 🚀 PROMPT COMPLET - CRÉATION DU DASHBOARD GÉOLOTIS

> **Ce document est un prompt complet à utiliser dans un nouveau projet pour créer le Dashboard GéoLotis.**
> Copiez ce fichier dans le nouveau projet et donnez-le à l'assistant IA.

> ⚠️ **MISE À JOUR — septembre 2026.** Le dashboard décrit ici est désormais un
> **projet séparé** : `Desktop/Geolytics Dashboard`. Trois choses ont changé par
> rapport à ce document :
> 1. Les routes `/admin`, `/admin/installations`… sont devenues `/`,
>    `/installations`… (le dashboard est servi à la racine de son propre site).
> 2. Le `BrowserRouter` est maintenant dans `src/main.jsx` du projet autonome,
>    plus dans le routeur du logiciel.
> 3. Le logiciel ne contient plus aucune ligne de code du dashboard : il se
>    contente de lui envoyer ses données via la base Maître.
> Tout le reste (design system `geo-*`, clés hors du code, tables, hooks) est
> inchangé. **Lien et règles de mise à jour : voir `CONTRAT.md`.**

---

## 📋 CONTEXTE DU PROJET

### Qu'est-ce que GéoLotis ?

**GéoLotis** est un logiciel de gestion de lotissements géo-référencés développé par **GéoLotis Studio**. C'est une application desktop (Electron) installée sur plusieurs postes clients (Windows). Chaque client installe le logiciel sur son ordinateur et se connecte à **sa propre base de données Supabase** (privée et isolée).

**Version actuelle** : 2.4.1
**Auteur** : GéoLotis Studio
**Contact** : geolotisstudio@gmail.com

### Le problème à résoudre

Chaque client a sa propre base Supabase, donc il n'existe **aucun point central** pour voir l'activité de tous les clients. Le développeur (GéoLotis Studio) ne peut pas savoir :
- Combien de clients utilisent le logiciel
- Qui utilise activement le logiciel
- Quelles versions sont installées
- Quelles fonctionnalités sont populaires
- Qui rencontre des problèmes

### La solution

Chaque installation GéoLotis enverra des **statistiques anonymes** à une **base Maître Supabase** (appartenant à GéoLotis Studio). Le dashboard est une **application web séparée** qui se connecte à cette base Maître pour afficher toutes les statistiques.

**Le dashboard est UNIQUEMENT pour le développeur/vendeur (GéoLotis Studio).** Il n'est pas destiné aux clients.

---

## 🏗️ ARCHITECTURE DE LA SOLUTION

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Installation 1     │     │  Installation 2     │     │  Installation 3     │
│  (Client A)         │     │  (Client B)         │     │  (Client C)         │
│  Base Supabase A    │     │  Base Supabase B    │     │  Base Supabase C    │
└─────────┬───────────┘     └─────────┬───────────┘     └─────────┬───────────┘
          │                           │                           │
          │  Envoi de stats anonymes  │                           │
          └──────────────┬────────────┴──────────────┬────────────┘
                         │                           │
                         ▼                           ▼
              ┌─────────────────────────────────────────────┐
              │        BASE MAÎTRE SUPABASE                 │
              │  (Appartient à GéoLotis Studio)             │
              │  URL: https://peqrlpevdxovjfudgoxq.supabase.co │
              └─────────────────────┬───────────────────────┘
                                    │
                                    ▼
              ┌─────────────────────────────────────────────┐
              │        DASHBOARD (Application Web)          │
              │  React + Vite + Chart.js + Supabase         │
              │  Accessible uniquement par l'admin          │
              └─────────────────────────────────────────────┘
```

---

## 🗄️ BASE MAÎTRE SUPABASE

### Informations de connexion

```
URL: https://peqrlpevdxovjfudgoxq.supabase.co
Clé Anon: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcXJscGV2ZHhvdmpmdWRnb3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDI4NDAsImV4cCI6MjEwMjI3ODg0MH0.ArpF7ogA7dsTzsDeLnXGyHLQA5HzXLEgiNRaHD7PZB8
```

### Tables à créer (Script SQL complet)

Le script SQL complet est fourni dans le fichier séparé : **`SCRIPT_SQL_DASHBOARD.sql`**

Ce fichier contient :
- La création des 5 tables (installations, telemetry, activites_globales, erreurs, admin_users)
- Les index de performance
- Les policies RLS
- Les données d'exemple pour tester

**Pour l'exécuter :**
1. Connectez-vous à [Supabase](https://supabase.com)
2. Ouvrez votre projet `peqrlpevdxovjfudgoxq`
3. Allez dans **SQL Editor** → **New query**
4. Copiez le contenu du fichier `SCRIPT_SQL_DASHBOARD.sql`
5. Exécutez

---

## 📊 FONCTIONNALITÉS DU DASHBOARD

### Page 1 : Vue d'ensemble (Dashboard principal)

**KPIs en haut (6 cartes) :**
1. **Total installations** : nombre total d'installations enregistrées
2. **Installations actives** : installations avec dernière connexion < 7 jours
3. **Installations inactives** : installations avec dernière connexion > 30 jours
4. **Total lots** : somme de tous les lots de toutes les installations
5. **Total prospects** : somme de tous les prospects
6. **Total utilisateurs** : somme de tous les utilisateurs

**Graphiques :**
1. **Activité des installations** (graphique en ligne) : nombre d'ouvertures par jour/semaine/mois
2. **Croissance des installations** (graphique en barres) : nouvelles installations par mois
3. **Répartition des versions** (graphique en secteurs/donut) : quelle version est installée
4. **Top 5 clients par volume de lots** (graphique en barres horizontales)

**Tableau récent :**
- Dernières 10 activités globales (qui a fait quoi, quand)

### Page 2 : Installations

**Tableau complet avec filtres :**
| Colonne | Description |
|---|---|
| Nom du client | Nom de l'entreprise |
| Version | Version du logiciel |
| OS | Système d'exploitation |
| Date installation | Date de première installation |
| Dernière connexion | Date de dernière ouverture |
| Nb lots | Nombre de lots |
| Nb prospects | Nombre de prospects |
| Nb utilisateurs | Nombre d'utilisateurs |
| Statut | Actif / Inactif / Désinstallé |

**Filtres :**
- Par statut (actif/inactif)
- Par version
- Par période de dernière connexion
- Recherche par nom de client

**Action au clic sur une installation :**
- Voir le détail complet (toutes les stats de télémétrie dans le temps)
- Voir les activités de cette installation
- Voir les erreurs de cette installation

### Page 3 : Activités

**Journal d'activités global :**
- Tableau avec : Date, Client, Utilisateur, Action, Détails
- Filtres par client, par action, par période
- Pagination

### Page 4 : Erreurs

**Liste des erreurs :**
- Tableau avec : Date, Client, Version, Message d'erreur, Contexte
- Filtres par client, par version, par période
- Badge de gravité (critique, moyenne, mineure)

### Page 5 : Alertes

**Alertes automatiques :**
- Installations inactives depuis 30+ jours (risque d'abandon)
- Installations avec version obsolète (mise à jour disponible)
- Erreurs récurrentes (même erreur 3+ fois)
- Volume de données anormal (client avec beaucoup plus de données que la moyenne)

### Page 6 : Paramètres

- Gestion des comptes admin (ajouter/supprimer)
- Configuration du dashboard (nom, logo, couleurs)
- Export des données (CSV/Excel)

---

## 🛠️ TECHNOLOGIES À UTILISER

### Stack recommandée

```
- React 18 (avec hooks)
- Vite (build tool)
- Chart.js + react-chartjs-2 (graphiques)
- @supabase/supabase-js (client Supabase)
- Tailwind CSS (styles)
- Framer Motion (animations)
- Sonner (notifications toast)
- lucide-react (icônes)
- react-router-dom (navigation)
- date-fns (gestion des dates)
```

### Structure du projet

```
src/
├── main.jsx
├── App.jsx
├── index.css
├── lib/
│   └── supabaseClient.js       # Client Supabase
├── components/
│   ├── Layout.jsx              # Layout principal avec sidebar
│   ├── Sidebar.jsx             # Navigation latérale
│   ├── TopBar.jsx              # Barre supérieure
│   ├── KpiCard.jsx             # Carte KPI réutilisable
│   ├── StatCard.jsx            # Carte statistique
│   ├── DataTable.jsx           # Tableau de données réutilisable
│   ├── FilterBar.jsx           # Barre de filtres
│   ├── AlertBadge.jsx          # Badge d'alerte
│   ├── LoadingSpinner.jsx      # Spinner de chargement
│   └── EmptyState.jsx          # État vide
├── pages/
│   ├── Dashboard.jsx           # Vue d'ensemble
│   ├── Installations.jsx       # Liste des installations
│   ├── InstallationDetail.jsx  # Détail d'une installation
│   ├── Activites.jsx           # Journal d'activités
│   ├── Erreurs.jsx             # Liste des erreurs
│   ├── Alertes.jsx             # Alertes automatiques
│   └── Parametres.jsx          # Paramètres
├── hooks/
│   ├── useInstallations.js     # Hook pour les installations
│   ├── useTelemetry.js         # Hook pour la télémétrie
│   ├── useActivites.js         # Hook pour les activités
│   └── useErreurs.js           # Hook pour les erreurs
└── utils/
    ├── format.js               # Formatage (dates, nombres, FCFA)
    └── constants.js            # Constantes (couleurs, statuts)
```

---

## 🎨 DESIGN ET COULEURS

### Palette de couleurs (cohérente avec GéoLotis)

```css
:root {
  --primary: #0C8E37;        /* Vert forêt - couleur principale */
  --primary-dark: #0A6B29;   /* Vert foncé */
  --danger: #e53e3e;         /* Rouge - danger */
  --warning: #F39200;        /* Orange - avertissement */
  --info: #3182ce;           /* Bleu - information */
  --success: #38a169;        /* Vert succès */
  --bg-light: #f7fafc;       /* Fond clair */
  --bg-dark: #1a202c;        /* Fond sombre */
  --text-primary: #2d3748;   /* Texte principal */
  --text-muted: #718096;     /* Texte secondaire */
  --border: #e2e8f0;         /* Bordure */
  --card-bg: #ffffff;        /* Fond des cartes */
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}
```

### Thème clair/sombre
- Support du mode sombre (toggle dans la TopBar)
- Utiliser CSS variables pour les couleurs

### Typographie
- Police : Inter ou system-ui
- Titres : bold, 1.5rem - 2rem
- Corps : 0.875rem - 1rem

### Layout
- **Sidebar** à gauche (icônes + libellés) : Dashboard, Installations, Activités, Erreurs, Alertes, Paramètres
- **TopBar** en haut : titre de la page, recherche globale, toggle thème, avatar admin
- **Contenu** au centre : cartes KPI, graphiques, tableaux

---

## 📦 DONNÉES D'EXEMPLE (pour tester)

Les données d'exemple (5 installations fictives, télémétrie, activités et erreurs) sont incluses dans le fichier **`SCRIPT_SQL_DASHBOARD.sql`** (section "DONNÉES D'EXEMPLE").

Ces données permettent de tester le dashboard immédiatement après la création des tables.

---

## 📝 INSTRUCTIONS POUR L'ASSISTANT

### Ce que l'assistant doit créer :

1. **Un projet React + Vite complet** avec la structure décrite ci-dessus
2. **Le script SQL** pour créer les tables de la base Maître (fourni dans le fichier séparé `SCRIPT_SQL_DASHBOARD.sql`)
3. **Toutes les pages** : Dashboard, Installations, InstallationDetail, Activites, Erreurs, Alertes, Parametres
4. **Tous les composants réutilisables** : KpiCard, DataTable, FilterBar, etc.
5. **Le client Supabase** configuré avec l'URL et la clé anon fournies
6. **Les hooks personnalisés** pour interroger les données
7. **Le design** conforme à la palette de couleurs GéoLotis
8. **Le mode sombre/clair**
9. **Les données d'exemple** pour tester

### Règles de développement :

- Utiliser **React 18** avec des **composants fonctionnels** et des **hooks**
- Utiliser **Chart.js** pour tous les graphiques
- Utiliser **Tailwind CSS** pour les styles (avec les couleurs personnalisées)
- Utiliser **@supabase/supabase-js** pour les requêtes
- Les requêtes Supabase doivent être **optimisées** (sélectionner uniquement les colonnes nécessaires)
- Le dashboard doit être **responsive** (fonctionner sur mobile et desktop)
- Les graphiques doivent être **interactifs** (tooltips, légendes)
- Les tableaux doivent avoir **tri, filtres et pagination**
- Les dates doivent être formatées en **français** (fr-FR)
- Les montants doivent être formatés en **FCFA**
- Le code doit être **propre, commenté et organisé**

### Livrables :

1. Le code source complet du projet
2. Le script SQL de création des tables
3. Les instructions d'installation et de lancement
4. Les instructions de déploiement (Vercel recommandé)

---

## 🔑 INFORMATIONS DE CONNEXION SUPABASE (Base Maître)

```
URL: https://peqrlpevdxovjfudgoxq.supabase.co
Clé Anon: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcXJscGV2ZHhvdmpmdWRnb3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDI4NDAsImV4cCI6MjEwMjI3ODg0MH0.ArpF7ogA7dsTzsDeLnXGyHLQA5HzXLEgiNRaHD7PZB8
```

---

## ✅ RÉSUMÉ DES EXIGENCES

| Exigence | Détail |
|---|---|
| **Type d'application** | Application web (dashboard) |
| **Public** | Uniquement GéoLotis Studio (développeur) |
| **Base de données** | Supabase (base Maître) |
| **Technologies** | React 18, Vite, Chart.js, Tailwind CSS, Supabase |
| **Pages** | Dashboard, Installations, Activités, Erreurs, Alertes, Paramètres |
| **Langue** | Français |
| **Devise** | FCFA |
| **Design** | Palette GéoLotis (vert #0C8E37, rouge, orange, bleu) |
| **Thème** | Clair + Sombre |
| **Responsive** | Oui |

---

*Document généré le 14 Août 2026 par GéoLotis Studio*