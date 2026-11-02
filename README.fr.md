# Model Slots for Claude

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md) | [Русский](README.ru.md)

Une extension Claude Desktop (`.mcpb`) qui conserve Claude officiel comme modèle principal tout en vous permettant d'appeler des modèles tiers — DeepSeek, GLM, GPT, Gemini et autres — via une **passerelle locale compatible avec OpenAI** (par défaut : [Magpie](https://github.com/yetone/magpie) à l'adresse `http://127.0.0.1:3425/v1`). Cela donne l'impression d'ajouter quelques « emplacements de modèles » supplémentaires à Claude, et l'extension est conçue pour économiser les tokens de Claude.

> **Non officielle.** Non affiliée à Anthropic ou au projet Magpie, et ni approuvée ni prise en charge par ceux-ci. « Claude » est une marque déposée d'Anthropic.

## Ce que vous obtenez

| Fonctionnalité | Fonctionnement |
|---|---|
| **Emplacements de modèles @alias** | Commencez un message par `@ds`, `@gpt`, `@glm`… et Claude le transmet à ce modèle. L'historique des échanges est conservé pour chaque conversation Claude, enregistré sur le disque et préservé après les redémarrages. `@ds @gpt …` permet d'interroger plusieurs modèles à la fois. |
| **Routage des tâches** | `general / code / reasoning / writing / translate / quick` correspondent chacun à une liste de modèles ; en cas d'échec, le suivant est essayé, et les modèles qui viennent d'échouer sont repoussés à la fin pendant 10 minutes. |
| **Comparaison multi-modèles** | Posez la même question à 2 à 5 modèles en parallèle ; les échecs partiels n'empêchent pas le retour des réponses réussies. |
| **Mode fichier (économise des tokens)** | L'extension lit les fichiers texte locaux et écrit les résultats dans des fichiers, afin que les documents longs ne passent jamais par la conversation. Les documents longs sont découpés en segments (3 en parallèle) et les segments ayant échoué peuvent être repris. |
| **Rappel** | Récupérez le texte intégral d'une réponse précédente (y compris les longues réponses enregistrées dans des fichiers) afin que Claude puisse l'examiner. |
| **Configuration en direct** | Ajoutez ou supprimez des alias, modifiez les routes ou le mode d'affichage depuis le chat (`magpie_config`) — aucun redémarrage nécessaire. |
| **Statistiques d'utilisation** | `magpie_status` affiche, pour les 7 derniers jours, les appels, les échecs, la latence moyenne et le nombre de tokens par modèle. |
| **Rechargement à chaud** | Le code principal se trouve dans `Documents/Magpie Chat/core/core.mjs` ; les modifications prennent effet au prochain appel sans réinstallation. Si le nouveau code ne se charge pas, la dernière version fonctionnelle continue de s'exécuter. |

Outils : `magpie_chat`, `magpie_ask`, `magpie_compare`, `magpie_recall`, `magpie_config`, `magpie_list_models`, `magpie_status`. (Le préfixe `magpie_` est historique ; toute passerelle compatible avec OpenAI fonctionne.)

## Prérequis

- Claude Desktop (Windows ou macOS) avec les extensions activées. L'extension s'exécute avec le Node.js fourni avec Claude Desktop.
- Une passerelle locale compatible avec OpenAI qui fournit `/v1/chat/completions` et `/v1/models`, par exemple Magpie.
- L'utilisation de services tiers est facturée par les fournisseurs utilisés par votre passerelle, et non par votre forfait Claude.

## Installation

1. Téléchargez le dernier fichier `magpie-chat-<version>.mcpb` depuis le dossier [`dist/`](dist/) (cliquez sur le fichier, puis sur **Download raw file**), ou depuis les [Versions](../../releases) si elles sont disponibles.
2. Double-cliquez dessus (ou faites-le glisser dans Claude Desktop → Settings → Extensions).
3. Vérifiez les paramètres : modèle par défaut, modèles par tâche, alias (par exemple `ds=auto/deepseek-v4.1-flash, gpt=auto/gpt-6.1-sol`) et **dossiers autorisés** pour le mode fichier. Les ID de modèles par défaut suivent la nomenclature de Magpie — remplacez-les par les ID répertoriés par votre passerelle.
4. Quittez complètement Claude depuis la zone de notification système, puis rouvrez-le.
5. Dans une conversation **nouvelle**, demandez à Claude d'exécuter `magpie_status`, puis essayez `@ds hello`.

## Recommandé : la compétence complémentaire

`skill/magpie-collab/SKILL.md` apprend à Claude à utiliser correctement les outils : transmettre les messages `@alias` tels quels, fournir le contexte via `context`, suivre les instructions d'affichage, utiliser les raccourcis (`#审` révision, `#译` traduction, `#比` comparaison, `#稿` brouillon→révision→finalisation), déterminer quand déclencher automatiquement une révision croisée et traiter les résultats de tiers comme non fiables. Ajoutez-la à Claude en tant que compétence (ou collez-la dans les instructions d'un projet).

## Vérification de la réalité des tokens

- Si une réponse d'un modèle tiers est affichée dans le chat, Claude doit la générer à nouveau — cela coûte à peu près autant que si Claude répondait lui-même.
- La révision croisée **augmente** l'utilisation de Claude ; elle améliore la qualité, mais n'économise pas de tokens.
- Les véritables économies viennent du **mode fichier** : les entrées et sorties longues restent sur le disque.
- Les longues réponses `@alias` sont écrites dans des fichiers et ouvertes automatiquement (seuil configurable).

## Sécurité et confidentialité

- Le mode fichier ne lit et n'écrit que dans les dossiers que vous autorisez. Les chemins sont résolus avec `realpath` avant la vérification, ce qui bloque `..` et les échappements par lien symbolique ; les fichiers binaires et les fichiers de plus de 5 Mo sont refusés ; les fichiers existants ne sont jamais écrasés sans votre accord.
- Les sorties des modèles tiers sont traitées comme des données non fiables ; la compétence indique à Claude de ne jamais suivre les instructions qu'elles contiennent.
- **Le rechargement à chaud exécute `core/core.mjs`.** Tout ce qui peut écrire dans ce dossier peut exécuter du code via cette extension. Ne partagez pas ce dossier et ne le synchronisez pas avec des tiers non fiables.
- Votre passerelle peut acheminer les données par l'intermédiaire de relais tiers. Réfléchissez avant d'envoyer des documents non publiés ou sensibles.
- Les données restent locales : les réponses, sessions, journaux et paramètres sont stockés dans `Documents/Magpie Chat` (sous-dossier `.state`).

## Limites connues

- Les messages d'exécution de l'extension et la compétence complémentaire sont rédigés en chinois simplifié ; Claude continuera de vous répondre dans votre langue.
- Le sélecteur de modèles de Claude Desktop ne peut pas répertorier les modèles tiers, et la zone de saisie ne peut pas compléter automatiquement `@`. Cette extension fonctionne donc avec des outils et une compétence.
- Les réponses ne peuvent pas être diffusées progressivement dans le chat.
- Ordinateur de bureau uniquement (la passerelle locale doit être installée sur la même machine).
- Les descriptions des outils sont mises en cache pour chaque conversation — ouvrez une nouvelle conversation après les mises à jour qui ajoutent des outils.

## Développement

```bash
node tests/selftest.mjs          # 27 checks against a mock gateway, in a temp dir
npm i -g @anthropic-ai/mcpb
mcpb validate manifest.json
mcpb pack . magpie-chat.mcpb
```

`server/index.mjs` est un chargeur léger (MCP via stdio + rechargement à chaud) ; `server/core.mjs` contient toutes les fonctionnalités. Aucune dépendance, Node ≥ 18.

## Créez votre propre extension avec Claude

Voici un prompt que vous pouvez donner à votre propre Claude pour créer une extension équivalente à partir de zéro, y compris les difficultés rencontrées : [English](docs/PROMPT.en.md) · [简体中文](docs/PROMPT.zh-CN.md) · [繁體中文](docs/PROMPT.zh-TW.md) · [日本語](docs/PROMPT.ja.md) · [한국어](docs/PROMPT.ko.md) · [Español](docs/PROMPT.es.md) · [Français](docs/PROMPT.fr.md) · [Deutsch](docs/PROMPT.de.md) · [Português (Brasil)](docs/PROMPT.pt-BR.md) · [Русский](docs/PROMPT.ru.md)

## Licence

[MIT](LICENSE)