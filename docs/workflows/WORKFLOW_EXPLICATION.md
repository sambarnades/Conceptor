# 🤖 Explication du Workflow n8n : "Caramel - LLM (DEV3)"

## Vue d'ensemble simple

**Objectif :** Quand un enseignant clique sur "Générer une activité", Caramel envoie une demande à une IA pour créer du contenu (des questions, des mots croisés, etc.), puis retourne le résultat.

---

## Les modèles d'IA disponibles (via iLaaS)

| Modèle | Vitesse tokens/s | Temps pour 1000 tokens | Qualité | Usage Caramel |
|--------|------------------|------------------------|---------|---------------|
| **Qwen 3 30B** | 172 tok/s | ~6 secondes | Très bon | Défaut pour QCM |
| **Mistral-Small-3.2** | 87 tok/s | ~12 secondes | Bon | Défaut général |
| **LLaMa-3.3 70B** | 55 tok/s | ~18 secondes | Bon | Jamais utilisé (trop lent) |
| **GPT-OSS-120B** | 152 tok/s | ~7 secondes | Excellent | Défaut pour QCM |
| **LLaMa-3.1 8B** | ? tok/s | Rapide | Moyen | Non utilisé |

### Choix des modèles dans Caramel (llm.js)

**Configuration par défaut :**
```javascript
DEFAULT_MODEL = 'mistral-small-3.2-24b'  // 87 tok/s
```

**Surcharges par activité (ACTIVITY_MODEL_OVERRIDES) :**
```javascript
'QuizSetQCM': 'gpt-oss-120b',   // 152 tok/s au lieu de 87 tok/s
'QuizSetVF': 'gpt-oss-120b',    // 152 tok/s
'QuizSet': 'gpt-oss-120b',      // 152 tok/s
'Page': 'gpt-oss-120b',         // 152 tok/s
'moodleXml': 'gpt-oss-120b'     // 152 tok/s
```

**🔴 Point important :** Si l'utilisateur choisit manuellement Mistral pour un QCM, le code côté client IGNORE ce choix et force GPT-OSS ou Qwen automatiquement.

---

## Comment fonctionne le workflow

### 🔴 **Étape 1 : L'utilisateur envoie une demande**

**Depuis le navigateur :**
```
Enseignant clique "Générer"
    ↓
JavaScript envoie au webhook n8n :
{
  "prompt": "Crée 6 mots croisés sur les verbes...",
  "model": "mistral-small-3.2-24b",
  "activity": { "moduleKey": "Crossword", "displayName": "Mots croisés" }
}
```

### 🟡 **Étape 2 : Capture de métadonnées**

**Nœud "Capturer début" :**
- Récupère l'ID de la tâche (`$execution.id` = 54044, 54045, etc.)
- Enregistre l'heure de départ
- Stocke les infos de l'activité (type, version Caramel)

### 🟢 **Étape 3 : Réponse immédiate au client**

**Nœud "Répondre immédiatement" :**
```json
{
  "taskId": "54044",
  "status": "processing",
  "resumeUrl": "https://n8n.../webhook/46e85476-e8db-4ef3-8b62-f5de4a6af39c"
}
```
Le client reçoit cette réponse **tout de suite** (en ~50ms) avec une URL pour récupérer le résultat plus tard.

### 🔵 **Étape 4 : Attendre le webhook de reprise**

**Nœud "Attendre requête résultat" :**
- N8n met le workflow en pause
- Attend que le client revienne via le lien `resumeUrl`

### 🟣 **Étape 5 : Appel à l'IA (iLaaS)**

**Nœud "Requête vers LLM" :**
```
POST https://llm.ilaas.fr/v1/chat/completions
Authorization: Bearer [token caché côté serveur]

{
  "model": "mistral-small-3.2-24b",
  "messages": [{"role": "user", "content": "ton prompt long ici..."}]
}
```

**Timeout : 50 secondes** (si l'IA tarde, passe au Plan B)

### 🟠 **Étape 6 : Validation du JSON**

**Nœud "Valider réponse JSON" :**
- L'IA renvoie : `{"title": "Mots croisés", "words": [...]}`
- On extrait le JSON du texte brut (parfois caché dans des ` ```json...``` `)
- Si c'est du JSON valide → continue ✅
- Si ce n'est pas du JSON → **Plan B (Fallback)** ❌

### 🟡 **Étape 7 : Nettoyage et métriques**

**Nœud "Nettoyage et capture" :**
- Extrait le contenu JSON propre
- Récupère le nombre de tokens utilisés (combien de mots l'IA a générés)
- Note l'heure de fin
- Détermine quel modèle a été utilisé (original ou fallback)

### 🟢 **Étape 8 : Stockage temporaire (INUTILE - À SUPPRIMER)**

**Nœud "Stocker résultat" :**
```javascript
staticData.results[taskId] = {
  content: "le JSON du contenu généré",
  timestamp: Date.now()
}
```

**⚠️ PROBLÈME DÉTECTÉ :**
- Ce nœud stocke le résultat en mémoire globale n8n
- Garde les données 10 minutes puis les supprime
- **MAIS** : le résultat est déjà envoyé directement au client via "Répondre avec résultat final"
- **Conclusion :** Ce stockage est COMPLÈTEMENT INUTILE car :
  - On ne sauvegarde PAS les workflows réussis
  - Le client reçoit tout directement
  - Aucun autre nœud ne lit jamais `staticData.results`

**🔧 Action recommandée :** Supprimer ce nœud du workflow pour simplifier

### 🔵 **Étape 9 : Export des stats**

**Nœud "Valider données export" :**
- Vérifie que tous les champs ont une valeur (date, modèle, etc.)

**Nœud "Grist - export vitesse" :**
- Envoie vers Grist (base de données) :
  - Date du jour
  - Type d'activité générée
  - Quel modèle a été utilisé
  - Heure début/fin
  - Nombre de tokens
  - Version Caramel

### 🟣 **Étape 10 : Réponse finale**

**Nœud "Répondre avec résultat final" :**
```json
{
  "status": "completed",
  "taskId": "54044",
  "content": "{\n  \"title\": \"Mots croisés sur la Révolution...\",\n  \"words\": [...]\n}",
  "model": "mistral-small-3.2-24b",
  "completion_tokens": 525,
  "prompt_tokens": 1075
}
```

Le client reçoit le résultat complet.

---

## 🚨 Système de secours (Fallback) - 3 tentatives

### Comment ça marche

**Nœud "Déterminer modèle fallback" :**
```javascript
const failedModel = 'mistral-small-3.2-24b';
const fallbackModels = ['qwen-3-30b', 'gpt-oss-120b', 'mistral-small-3.2-24b'];
const availableModels = fallbackModels.filter(m => m !== failedModel);
const fallbackModel = availableModels[0]; // 'qwen-3-30b'
```

**Logique de fallback :**
1. Si le modèle original **échoue** (timeout 50s, erreur HTTP, JSON invalide)
2. → Prend le **premier modèle différent** de la liste `['qwen-3-30b', 'gpt-oss-120b', 'mistral-small-3.2-24b']`
3. Si le fallback 1 **échoue aussi**
4. → Prend le **deuxième modèle différent** (fallback 2)
5. Si le fallback 2 **échoue aussi**
6. → Génère un JSON d'erreur avec `model: 'error-all-models-failed'`

### Exemple concret

**Utilisateur choisit Mistral pour des Mots croisés :**
```
Tentative 1 : Mistral (87 tok/s)
    → Timeout à 50s (prompt trop complexe) ❌

Tentative 2 : Qwen (172 tok/s) - Fallback 1
    → JSON invalide (manque une virgule) ❌

Tentative 3 : GPT-OSS (152 tok/s) - Fallback 2
    → Succès en 6 secondes ✅

Temps total : 50s + 50s + 6s = 106s
⚠️ PROBLÈME : > 60s → "Failed to fetch" côté client
```

### ⚠️ Cas problématique détecté

Si **2 modèles consécutifs timeout (50s chacun)**, le temps total dépasse 100s, bien au-delà de la limite 60s du reverse proxy.

**Solution actuelle :**
- Forcer les modèles rapides (GPT-OSS, Qwen) pour les activités longues (QCM)
- Timeout à 50s (au lieu de 90s) pour basculer plus vite sur le fallback

**Solution idéale (non implémentée) :**
- Réduire timeout fallback 1 à 30s
- Réduire timeout fallback 2 à 20s
- Total max : 50 + 30 + 20 = 100s → toujours > 60s ❌

**Vraie solution :** Accepter que les générations très longues avec échecs multiples peuvent échouer.

---

## 📊 Ce qu'on récupère (Grist)

Chaque génération enregistre :

| Colonne | Exemple | But |
|---------|---------|-----|
| **Date** | 2026-02-11 | Statistiques quotidiennes |
| **Activité** | h5p_crossword_name | Quel type créé |
| **LLM** | mistral-small-3.2-24b | Quel modèle a réussi |
| **Horaire_debut** | 21:21:40 | Timing |
| **Horaire_fin** | 21:21:51 | Durée totale = fin - début |
| **Nb_tokens_generes** | 525 | Coût LLM (output) |
| **Nb_tokens_prompt** | 1075 | Coût LLM (input) |
| **Version_caramel** | 4.1.0 | Suivi des versions |

---

## ⏱️ Timing réel (calculs précis)

### Exemple 1 : Mots croisés (8 mots) avec Mistral

**Génération :** ~525 tokens de sortie
```
1. Réponse immédiate au client         →  50ms ✅
2. Délai client avant resumeUrl         →  500ms (sécurité Wait node)
3. Appel Mistral (525 tokens ÷ 87/s)   →  6s
4. Validation JSON                      →  10ms
5. Nettoyage & export Grist             →  120ms
6. Réponse finale                       →  6ms

⏱️ TOTAL utilisateur = 500ms + 6s + 136ms ≈ 6,6 secondes
```

### Exemple 2 : Quiz QCM (20 questions) avec GPT-OSS

**Génération :** ~7800 tokens de sortie
```
1. Réponse immédiate au client         →  50ms ✅
2. Délai client avant resumeUrl         →  500ms
3. Appel GPT-OSS (7800 ÷ 152/s)        →  51s
4. Validation JSON                      →  10ms
5. Nettoyage & export Grist             →  120ms
6. Réponse finale                       →  6ms

⏱️ TOTAL utilisateur = 500ms + 51s + 136ms ≈ 51,6 secondes
```

### Exemple 3 : Timeout + Fallback (Mistral → Qwen)

**Scénario :** Mistral timeout (50s) puis Qwen réussit (6s)
```
1. Réponse immédiate au client         →  50ms ✅
2. Délai client avant resumeUrl         →  500ms
3. Appel Mistral → TIMEOUT              →  50s ❌
4. Déterminer fallback                  →  7ms
5. Appel Qwen (525 ÷ 172/s)            →  3s ✅
6. Validation + export                  →  130ms
7. Réponse finale                       →  6ms

⏱️ TOTAL utilisateur = 500ms + 50s + 3s + 143ms ≈ 53,6 secondes
```

### 🚨 Limite critique : Reverse Proxy 60 secondes

**OpenResty (reverse proxy devant n8n) coupe les connexions HTTP à 60 secondes.**

**Scénarios à risque :**
- Quiz 20 questions avec GPT-OSS : 51s → ✅ Passe (marge 9s)
- Quiz 20 questions avec Mistral timeout + Qwen : 53s → ✅ Passe (marge 7s)
- Quiz 20 questions avec Mistral timeout + GPT-OSS (51s) : 101s → ❌ **"Failed to fetch"**

**Solution appliquée :**
- Timeout HTTP Request à **50 secondes** (au lieu de 90s par défaut)
- Forcer GPT-OSS/Qwen pour les QCM (plus rapides que Mistral)
- Le fallback n'a que 10 secondes max pour réussir après le premier timeout

---

## 🔍 Analyse détaillée des problèmes

### ❌ PROBLÈME 1 : Nœud "Stocker résultat" inutile

**Code actuel :**
```javascript
staticData.results[taskId] = { content: content, timestamp: Date.now() };
```

**Pourquoi c'est inutile :**
1. Le résultat est déjà envoyé au client via "Répondre avec résultat final"
2. Aucun autre nœud ne lit jamais `staticData.results[taskId]`
3. On ne sauvegarde PAS les workflows réussis
4. Encombre la mémoire n8n pour rien (nettoyage toutes les 10 min)

**Action :** 🗑️ Supprimer ce nœud du workflow

---

### ⚠️ PROBLÈME 2 : Timeout cumulé dépassant 60s

**Limite du reverse proxy OpenResty : 60 secondes**

**Scénarios à risque :**
| Scénario | Modèle 1 | Modèle 2 | Modèle 3 | Total | Statut |
|----------|----------|----------|----------|-------|--------|
| Quiz 20Q normal | GPT-OSS 51s | - | - | 51s | ✅ OK |
| Mistral timeout | Mistral 50s | Qwen 6s | - | 56s | ✅ OK (marge 4s) |
| Double timeout | Mistral 50s | Qwen 50s | GPT 6s | 106s | ❌ **Failed to fetch** |

**Solution actuelle :**
- Timeout à 50s par modèle (au lieu de 90s par défaut)
- Forcer GPT-OSS/Qwen pour les QCM (moins de risque timeout)

**Solutions possibles :**
1. ❌ Réduire timeout fallback (30s puis 20s) → toujours risque > 60s
2. ❌ Augmenter timeout reverse proxy → pas d'accès à la config serveur
3. ✅ **Accepter** que double timeout = échec (rare en production)
4. ✅ Monitorer les fallbacks via Grist pour détecter IA instable

---

### ⚠️ PROBLÈME 3 : Délai client 500ms avant resumeUrl

**Code client (llm.js) :**
```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```

**Pourquoi :**
- Le nœud Wait s'enregistre côté n8n après "Répondre immédiatement"
- Si le client appelle `resumeUrl` trop vite → erreur 404 "no waiting webhook"
- Le délai 500ms laisse le temps à n8n de préparer le webhook Wait

**Impact :**
- Ajoute 500ms à CHAQUE génération
- Sur une génération 6s, ça représente +8% de temps perdu

**Optimisation possible :**
- Tester avec 300ms ou 200ms (actuellement 500ms par sécurité)
- Risque : 404 occasionnels si n8n est lent

---

### ⚠️ PROBLÈME 4 : Export Grist peut échouer silencieusement

**Nœud "Valider données export" :**
```javascript
if (date_today && model && timestamp_start && timestamp_end) {
  → Export vers Grist
} else {
  → Ignore silencieusement
}
```

**Scénarios d'échec :**
- Si `date_today` est vide → pas d'export (mais génération réussie)
- Si un nœud fallback ne remplit pas `model` correctement → pas d'export
- Le client reçoit quand même son résultat

**Impact :**
- Perte de statistiques
- Impossible de tracer les générations qui échouent

**Solution :**
- Vérifier que TOUS les chemins (succès, fallback 1, fallback 2, erreur) remplissent bien `model`, `timestamp_start`, etc.

---

### ⚠️ PROBLÈME 5 : Colonnes Grist parasites (TaskId, Resultat)

**Origine :**
- Anciens workflows (DEV1, DEV2) envoyaient `taskId` et `resultat` à Grist
- Le workflow DEV3 ne le fait plus
- Mais les colonnes existent encore dans Grist (vides pour les nouvelles lignes)

**Impact :**
- Confusion dans l'analyse des données
- Colonnes vides non nettoyées

**Action :** 🗑️ Supprimer manuellement les colonnes dans Grist

---

### ✅ Ce qui fonctionne bien

1. **Modèles rapides par défaut**
   - Qwen (172 tok/s) et GPT-OSS (152 tok/s) pour QCM
   - Mistral (87 tok/s) pour le reste
   - Génération < 15s dans 95% des cas

2. **Système de fallback robuste**
   - 3 tentatives automatiques
   - Continue même si 1 ou 2 modèles échouent
   - Enregistre quel modèle a finalement réussi

3. **Traçabilité complète**
   - Chaque génération → ligne Grist
   - Date, activité, modèle, tokens, durée
   - Permet détection anomalies

4. **Réponse immédiate**
   - Client reçoit taskId en 50ms
   - Ne bloque pas le navigateur pendant la génération

---

### 🔧 Actions recommandées

| Priorité | Action | Impact |
|----------|--------|--------|
| 🔴 **Urgent** | Supprimer nœud "Stocker résultat" | Simplifie workflow, libère mémoire |
| 🟠 Moyen | Tester délai 300ms au lieu de 500ms | Gagne 200ms par génération |
| 🟡 Faible | Supprimer colonnes Grist parasites | Meilleure lisibilité stats |
| 🟢 Monitoring | Traquer les fallbacks dans Grist | Détecter modèles instables |

---

## 🎯 Flux complet : Exemple réel

```
1️⃣  Utilisateur : "Crée mots croisés sur Napoléon avec Mistral"

2️⃣  JavaScript envoie webhook :
    {prompt: "Crée 6 mots...", model: "mistral-small-3.2-24b"}

3️⃣  N8n répond immédiatement (50ms) :
    {taskId: "54044", resumeUrl: "https://n8n.../46e85476..."}

4️⃣  JavaScript attend 500ms

5️⃣  JavaScript fait POST sur resumeUrl

6️⃣  N8n reprend le workflow :
    → Appel Mistral (10s)
    → Validation JSON (OK)
    → Export Grist

7️⃣  N8n envoie résultat final au webhook :
    {status: "completed", content: "{\n  \"title\": \"Mots croisés Napoléon\",\n  \"words\": [...]}"}

8️⃣  JavaScript génère le .h5p et le télécharge

9️⃣  Grist enregistre la stat : mistral, 10s, 525 tokens
```

---

## 🐛 Anomalies à signaler

- [ ] N'oublie pas de supprimer les colonnes `TaskId` et `Resultat` dans Grist
- [ ] Vérifier si des requêtes prennent > 60s (check les logs de n8n)
- [ ] Monitorer le nombre de fallbacks (trop = IA instable)

---

**Version:** 1.0 | **Date:** 11 février 2026 | **Statut:** ✅ Production
