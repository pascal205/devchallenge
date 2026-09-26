# DevChallenge

DevChallenge est une application web qui permet à une classe ou à un groupe d’apprenants de publier des défis de développement, de soumettre leurs projets, puis d’évaluer les travaux des autres via une logique de notation mixte : correction automatique + évaluations entre pairs.

Le projet est pensé pour être utilisé dans un cadre pédagogique : un professeur publie des challenges, les élèves déposent un dépôt Git + une démo, puis la plateforme calcule une note finale à partir de critères auto et de retours humains.

## Objectif du projet

- publier des défis avec consigne et critères d’évaluation ;
- permettre à chaque élève de soumettre un projet unique par challenge ;
- attribuer automatiquement des projets à évaluer ;
- collecter des avis et des notes sur des projets anonymisés ;
- calculer un classement final basé sur les évaluations des pairs et la correction automatique ;
- offrir une interface simple pour un usage en classe.

## Stack technique

- Frontend : React + Vite
- Routage : React Router
- Base de données et auth : Supabase (PostgreSQL + Auth)
- Gestion d’état locale : React state + context
- Script de notation : Node.js + scripts personnalisés

## Prérequis

Avant de contribuer, vérifie que tu as :

- Node.js 18+ ou une version compatible
- npm
- un compte Supabase
- Git

## Architecture du projet

```text
.
├── src/
│   ├── components/      # composants réutilisables (header, leaderboard, formulaires...)
│   ├── context/         # contextes Theme et Lang
│   ├── lib/             # utilitaires, traduction et logique de scoring
│   ├── pages/           # pages de l’application
│   ├── App.jsx          # configuration des routes et session
│   ├── main.jsx         # point d’entrée React
│   └── styles.css       # styles globaux
├── supabase/
│   ├── schema.sql       # schéma SQL de la base + fonctions métier + RLS
│   └── migration_admin_banner.sql
├── scripts/
│   └── grade.mjs        # script de correction automatique
├── .env.example         # variables d’environnement nécessaires
├── package.json         # scripts npm et dépendances
├── vite.config.js       # configuration Vite
├── index.html
└── README.md
```

## Workflow métier

Le projet suit un cycle de challenge :

```text
draft -> open -> locked -> review -> results
```

### Étapes

- `draft` : le professeur prépare le challenge.
- `open` : les étudiants peuvent soumettre leur projet.
- `locked` : les dépôts sont fermés, puis les évaluations sont attribuées aléatoirement.
- `review` : chaque participant note les projets qui lui ont été assignés.
- `results` : les résultats sont visibles par tous.

### Règles importantes

- un élève ne peut soumettre qu’un seul projet par challenge ;
- une appréciation ne peut être donnée que sur un projet qui a été attribué ;
- la note finale combine :
  - la correction automatique ;
  - la moyenne des évaluations par les pairs ;
- les notes sont calculées côté SQL dans `supabase/schema.sql` via des fonctions PostgreSQL.

## Configuration locale

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd devchallenge
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

1. Crée un projet Supabase.
2. Ouvre le SQL Editor.
3. Colle le contenu de `supabase/schema.sql` et exécute-le.
4. Récupère :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 4. Créer le fichier d’environnement

```bash
cp .env.example .env
```

Puis complète-le :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
VITE_SCHOOL_EMAIL_DOMAIN=
```

### 5. Démarrer le projet

```bash
npm run dev
```

L’application est généralement disponible sur :

```text
http://localhost:5173
```

## Premier accès / rôle professeur

La connexion est gérée par Supabase Auth via magic link.

Pour pouvoir créer des challenges, il faut qu’un compte soit promu en rôle `prof` dans la table `profiles`.

Étapes:

1. créer le compte depuis l’interface ;
2. ouvrir Supabase > Table Editor > `profiles` ;
3. modifier le rôle de l’utilisateur de `eleve` à `prof`.

## Base de données

Le schéma principal permet de gérer :

- `profiles` : utilisateur et rôle (`eleve`, `prof`)
- `challenges` : énoncé, critères, pondération, statut
- `submissions` : dépôt Git + démo + hash du commit
- `review_assignments` : attribution des évaluations
- `reviews` : retours et notes des pairs
- `auto_scores` : notes générées par le script de correction automatique

La logique métier liée au classement, au tirage au sort des évaluations et aux règles d’accès est définie dans `supabase/schema.sql`.

## Scripts disponibles

Dans `package.json`, voici les commandes principales :

```bash
npm run dev      # démarre le serveur de développement Vite
npm run build    # build de production
npm run preview  # visualise le build
npm run grade    # lance la correction automatique
```

## Correction automatique

Le script `scripts/grade.mjs` est utilisé pour noter automatiquement les projets soumis :

- Lighthouse / performance / accessibilité
- validation W3C
- ESLint
- critères métier personnalisés selon le challenge

Important : ce script doit être exécuté dans un environnement avec accès Internet et avec les bonnes variables Supabase. Il n’est pas destiné à être lancé simplement dans l’éditeur sans contexte de projet.

## Contribution

### Règles de contribution

- travaille sur une branche dédiée : `feature/...`, `fix/...`, `refactor/...`
- garde les changements ciblés et cohérents
- écris un code lisible et explicite
- évite les modifications inutiles dans des fichiers non liés
- ajoute ou mets à jour la documentation si le changement affecte le process ou l’architecture

### Bonnes pratiques

- respect le style déjà présent dans le projet ;
- utilise les composants existants quand c’est pertinent ;
- si tu ajoutes des données ou des variables, vérifie leur impact sur les tables et les politiques RLS ;
- pense à la compatibilité avec les notions pédagogiques du projet : anonymat des évaluations, rôle prof, cycle de challenge.

### Processus recommandé

1. créer une branche
2. faire les modifications
3. vérifier le build local
4. tester le comportement visible
5. ouvrir une pull request avec une description claire

## Structure fonctionnelle du front

Les pages principales sont organisées ainsi :

- `Home.jsx` : landing page + statistiques + présentation du projet
- `Challenges.jsx` : liste et filtrage des challenges
- `ChallengeDetail.jsx` : détail d’un challenge et actions liées
- `Profile.jsx` : profil utilisateur, contributions et historique
- `Settings.jsx` : options utilisateur (thème, langue)
- `Login.jsx` : connexion / authentification

Les contextes de thème et de langue sont dans :

- `src/context/ThemeContext.jsx`
- `src/context/LangContext.jsx`

La traduction est centralisée dans :

- `src/lib/i18n.js`

## Points de vigilance

- L’application dépend fortement de Supabase. Toute modification côté base doit prendre en compte les politiques RLS.
- La logique de scoring et d’assignation d’évaluations est sensible : les changements doivent être testés avec attention.
- Le script de notation automatique n’est pas un simple test local : il dépend de déploiements externes et de la disponibilité des URLs.
- La gestion des rôles et des accès est critique pour le bon fonctionnement pédagogiquement.

## Problèmes connus / améliorations possibles

- anonymat des évaluations à renforcer côté application et côté dépôt Git
- support plus avancé des groupes ou binômes
- tests Playwright plus réalistes par challenge
- meilleure séparation des responsabilités entre UI, logique métier et access layer

## Ressources utiles

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev/guide/)

## Licence

À définir selon le contexte du projet et les règles de votre organisation.

---

Merci de contribuer à DevChallenge en gardant un esprit pédagogique, lisible et robuste. Les contributions doivent servir la pédagogie, la clarté du code et la fiabilité du workflow de classe.
