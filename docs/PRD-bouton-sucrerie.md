# Mini-PRD — Bouton « La Sucrerie » dans la modale de visualisation Caramel

> **Statut** : à valider, non démarré.
> **Date de rédaction** : 2026-05-04.
> **Projet d'implémentation** : `cara_dev2` (Caramel) — additif uniquement.
> **Endpoint consommé** : Sucrerie (workflow n8n unifié).
> **Dossier Sucrerie de référence** : `d:/Bureau/Forge/Caramel/sucrerie.forge.apps.education.fr/`
> **Dossier Amande de référence (pattern existant identique)** : `d:/Bureau/Forge/amande.forge.apps.education.fr/`

---

## 1. Goal

Permettre à l'utilisateur de Caramel de **partager dans La Sucrerie** une activité H5P/MBZ qu'il vient de générer/ouvrir, **directement depuis la modale de visualisation**, en réutilisant le pipeline de modération + génération de métadonnées IA déjà en place côté Sucrerie (le même qui s'exécute lors d'un dépôt manuel dans l'interface Sucrerie).

## 2. Why

- **Aujourd'hui** : pour partager dans La Sucrerie, l'utilisateur doit télécharger l'activité depuis Caramel, ouvrir un autre onglet sur Sucrerie, cliquer « Déposer », réuploader le fichier, et passer toute la procédure. Friction élevée → faible taux de partage observé.
- **Demain** : 1 clic dans la modale Caramel → écran d'accueil → email académique → suivi du flow de dépôt **dans la modale elle-même**, sans changer d'onglet ni télécharger localement. L'activité affichée est partagée telle quelle (binaire en mémoire).
- **Bénéfice produit** : aligne Caramel sur l'ergonomie de partage d'aManDe (déjà déployée). Le champ `provenance: 'caramel'` est déjà supporté par le workflow inter-projets de modération Grist, donc l'effort backend est minime à nul.

## 3. Référence pattern existant — aManDe

aManDe a déjà un bouton « Partager dans La Sucrerie » avec le flow demandé. Le présent PRD doit **reproduire l'UX d'aManDe à l'identique** côté Caramel, en s'adaptant aux particularités cara_dev2 (modale de visualisation, binaire H5P/MBZ vs binaire aManDe).

> **Action requise au début du dev** : ouvrir le projet aManDe (`d:/Bureau/Forge/amande.forge.apps.education.fr/`), localiser le composant qui affiche le bouton « Partager dans La Sucrerie » + l'écran d'accueil + le flow magic link, et **documenter le mapping** entre les composants aManDe et leur équivalent à créer dans cara_dev2 (mémo dans le PR).

## 4. User flow

### État A — Modale Caramel ouverte sur une activité visualisée

Le footer de la modale contient déjà :
- Boutons de **téléchargement** dans différents formats (.h5p, .mbz, etc. selon le type)
- Boutons divers (fermer, etc.)

→ **Ajout** : un bouton **« 🔗 La Sucrerie »** (icône partage + label) **rosé**, à droite des boutons de téléchargement. Le bouton n'apparaît que si le **kill switch** local le permet (cf. § 6).

### État B — Clic sur « La Sucrerie »

La zone de la modale qui affiche habituellement le visuel de l'activité (canvas / iframe / preview) est **remplacée** par un **écran d'accueil** explicatif. L'iframe / le visuel n'est PAS détruit — juste masqué pour pouvoir y revenir si l'utilisateur abandonne.

**Contenu de l'écran d'accueil** (texte d'inspiration, à harmoniser avec la formulation aManDe) :

> **Partager dans La Sucrerie**
>
> La Sucrerie est une bibliothèque publique d'activités que les utilisateurs de Caramel et aManDe ont décidé de partager.
>
> Vous souhaitez partager l'activité que vous venez de créer car elle a du sens à être réutilisée par d'autres enseignants ?
>
> Saisissez votre adresse email académique : vous recevrez un lien d'accès qui vous permettra de **modifier ou supprimer votre ressource à tout moment** depuis La Sucrerie.
>
> [📧 Email académique : __________________________]
>
> [ Annuler ] [ Continuer ]

L'écran a en footer :
- **Annuler** → revient à la visualisation (État A) sans appel réseau.
- **Continuer** → passe à l'État C.

### État C — Email saisi, flow de dépôt

À partir de là, on **réplique le flow de dépôt Sucrerie** déjà existant (`assets/js/ui/upload.js` côté Sucrerie) :
1. Validation email (regex domaine académique) — refus inline si invalide.
2. Appel `/sucrerie-enrich` avec le binaire de l'activité courante → modération passe 1 + suggestion de titre / description / objectifs / tags / discipline / niveaux.
3. Affichage des suggestions dans l'écran d'accueil (toujours dans la zone visuel masquée) — l'utilisateur peut éditer chaque champ.
4. Bouton « Déposer » → appel `/sucrerie-publish` avec :
   - `binary_base64` : binaire H5P/MBZ courant (déjà en mémoire dans Caramel)
   - `content_format` : `'h5p'` ou `'mbz'`
   - `submitted_via: 'caramel'`
   - `provenance: 'caramel'`
   - `email`, méta éditées
5. Verdict passe 2 (approuve / doute / rejete) géré comme côté Sucrerie.

### État D — Partage réussi

Écran de confirmation dans la zone visuel :
- ✅ Activité partagée
- Lien magic de gestion affiché (« Conservez ce lien pour gérer votre activité »)
- Bouton **« Revenir à la visualisation »** → ré-affiche le visuel original (État A), bouton « La Sucrerie » remplacé par un état « Déjà partagé » désactivé (sur la durée de la session).

### État E — Erreurs (réseau, modération rejet, etc.)

Idem aManDe — message d'erreur inline dans la zone visuel + bouton « Réessayer » ou « Annuler ».

## 5. Architecture proposée (additive)

### Nouveaux fichiers cara_dev2 (zéro modif de l'existant) :

```
js/sucrerie-bridge/
  index.js              # entry point — expose mountSucrerieButton(modalRoot)
  config.js             # kill switch + endpoints + flag i18n
  ui/
    button.js           # injection du bouton dans le footer modale
    welcome-screen.js   # écran d'accueil + email
    deposit-flow.js     # appels enrich + publish, suggestions
    success-screen.js   # confirmation + lien magic
  i18n/                 # 9 fichiers (fr/en/es/it/de/nl/pt/el/zh) — clés sucrerie_*
css/components/
  sucrerie-bridge.css   # bouton rosé + zone d'écran (réutilise variables Caramel)
```

### Hook de branchement

Le module exporte une fonction `mountSucrerieButton(modalElement)` appelée par le code existant de la modale **via un seul point d'extension** (à identifier au début du dev). Si le kill switch est `false`, la fonction est un no-op.

Si aucun point d'extension naturel n'existe, on s'autorise **un seul endroit** dans le code existant (probablement la fonction qui ouvre la modale de visualisation) pour appeler `mountSucrerieButton`. Diff minimal de 1-2 lignes.

### Kill switch

Dans `js/sucrerie-bridge/config.js` :

```js
export const SUCRERIE_BRIDGE = Object.freeze({
  enabled: true,                        // ← bascule
  endpoints: {
    enrich:  'https://n8n.<host>/webhook/sucrerie-enrich',
    publish: 'https://n8n.<host>/webhook/sucrerie-publish'
  },
  emailDomainPattern: /@(ac-[a-z]+\.fr|education\.gouv\.fr|...)$/i
});
```

Activation/désactivation = changer `enabled` → push. Pas de variable d'env.

## 6. Open questions (à trancher avant implé)

| # | Question | Options |
|---|---|---|
| Q1 | **Niveau du kill switch** | A) const local dans `config.js` (push pour désactiver) — B) via attribut HTML / dataset sur la modale (configurable par config Caramel à la build) — C) via fetch d'un endpoint santé (overkill ?) |
| Q2 | **Langues à couvrir** | A) FR seulement (déploiement progressif) — B) les 9 langues cara_dev2 (fr/en/es/it/de/nl/pt/el/zh) dès la v1 |
| Q3 | **État « Déjà partagé »** | A) persister en sessionStorage (bouton désactivé jusqu'au reload) — B) persister en localStorage avec public_id du share — C) ne pas désactiver (l'utilisateur peut re-partager s'il veut) |
| Q4 | **Token magic link non validé** | Si l'utilisateur saisit un email, reçoit le mail mais ne clique pas le lien : que voit-il s'il refait l'opération ? Idem aManDe : on relance le flow magic link à zéro ? |
| Q5 | **Email pré-rempli** | Si Caramel connaît déjà l'email de session (vue Mes activités, etc.) : pré-remplir ? localStorage Caramel a-t-il une clé équivalente à `sucrerie.session.email` ? |
| Q6 | **Activité non sauvegardée** | Cas : l'utilisateur a édité l'activité dans Caramel sans encore la sauvegarder (binaire en mémoire). On partage cette version éditée ou la dernière sauvegardée ? |
| Q7 | **Type / activity_type** | Pour les Quizset H5P, on s'aligne sur la détection automatique côté Sucrerie (`H5P.QuestionSet` / `QCM` / `VF` via `detectQuestionSetVariant`) — code à dupliquer côté Caramel ou laisser Sucrerie redétecter au backend ? |
| Q8 | **Tracking** | Faut-il un event Matomo « clic Sucrerie » et « partage réussi » ? aManDe le fait ? |
| Q9 | **i18n source** | Les clés `sucrerie_bridge_*` Caramel doivent-elles refléter les clés `deposit_*` Sucrerie ? Ou être autonomes ? |

## 7. Hors scope volontaire

- Édition de l'activité côté Sucrerie depuis Caramel (ce flow existe déjà : on partage depuis Caramel → l'utilisateur reçoit le lien magic → édite dans Sucrerie via l'iframe Caramel distante… qui revient sur Caramel cara_dev2. Boucle déjà fermée.)
- Suppression de l'activité partagée depuis Caramel — ça se fait depuis l'interface Sucrerie via le lien magic.
- Push automatique d'une mise à jour : si l'utilisateur ré-édite ensuite côté Caramel, la version Sucrerie ne change PAS automatiquement. Re-share manuel s'il le souhaite (créera un doublon — comportement à raffiner en v2).
- Modification de l'existant cara_dev2 au-delà du seul point d'appel `mountSucrerieButton`.

## 8. Phasage proposé

| Phase | Livrable | Action user |
|---|---|---|
| 0 | **Audit aManDe** + réponses aux Q1-Q9 + trace du point d'extension dans la modale Caramel | Validation des choix |
| 1 | Squelette `sucrerie-bridge/` (button + kill switch + i18n FR seulement) — bouton visible, no-op au clic | Test visuel |
| 2 | Écran d'accueil + email + appel enrich | Test e2e local avec n8n dev |
| 3 | Suggestions + publish + écran de succès | Test e2e local |
| 4 | Gestion erreurs + état « déjà partagé » | Test des cas dégradés |
| 5 | i18n des 8 autres langues + tests unitaires (kill switch, validation email) + doc cara_dev2 | Tests passent + wiki à jour |

## 9. Vérifications backend (avant phase 1)

- [ ] **`/sucrerie-publish` accepte-t-il `provenance: 'caramel'`** ? Vérifier dans `sucrerie.forge.apps.education.fr/Partage unifié - multi-site (PROD) - PostgreSQL.json`. La mémoire indique que le champ existe au niveau du workflow Grist de modération (`caramel` | `amande` | `sucrerie` | `direct`), mais à confirmer côté webhook publish.
- [ ] **CORS** : le webhook `/sucrerie-publish` doit autoriser l'origine `https://caramel.forge.apps.education.fr` (ainsi que `/bas` et `/cara_dev2` pour les sandbox). Idem `/sucrerie-enrich`.
- [ ] **Domaines email académiques acceptés** : la regex côté backend doit être identique à la regex frontend Caramel pour éviter un faux refus côté UI.

## 10. Références techniques

- Sucrerie webhook publish : voir `Webhook Sucrerie Publish` dans le JSON workflow (`Partage unifié - multi-site (PROD) - PostgreSQL.json`).
- Sucrerie flow dépôt frontend : `assets/js/ui/upload.js` (pattern à imiter pour le state machine).
- Sucrerie détection variantes Quizset : `assets/js/h5p/h5p-reader.js > detectQuestionSetVariant` (à utiliser côté Caramel ou à laisser Sucrerie redétecter).
- Caramel modale visualisation : à localiser au début du dev (probablement `js/ui/preview-modal.js` ou équivalent).
- Caramel locales : `js/locales/{fr,en,es,it,de,nl,pt,el,zh}.json`.
- Mémoire : règle absolue « ne pas modifier l'existant cara_dev2 » → respect strict.
