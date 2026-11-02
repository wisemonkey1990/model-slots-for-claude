# Model Slots for Claude

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md) | [Русский](README.ru.md)

Eine Claude Desktop-Erweiterung (`.mcpb`), die das offizielle Claude als dein Hauptmodell beibehält und dir ermöglicht, Modelle von Drittanbietern – DeepSeek, GLM, GPT, Gemini und weitere – über ein **lokales OpenAI-kompatibles Gateway** aufzurufen (Standard: [Magpie](https://github.com/yetone/magpie) unter `http://127.0.0.1:3425/v1`). Es fühlt sich an, als würdest du Claude einige zusätzliche „Modell-Slots“ hinzufügen, und die Erweiterung wurde entwickelt, um Claude-Tokens zu sparen.

> **Inoffiziell.** Nicht mit Anthropic oder dem Magpie-Projekt verbunden, von ihnen unterstützt oder empfohlen. „Claude“ ist eine Marke von Anthropic.

## Was du bekommst

| Funktion | So funktioniert es |
|---|---|
| **@alias-Modell-Slots** | Beginne eine Nachricht mit `@ds`, `@gpt`, `@glm` … und Claude leitet sie an dieses Modell weiter. Der Verlauf über mehrere Nachrichten wird pro Claude-Konversation beibehalten, auf der Festplatte gespeichert und bleibt auch nach Neustarts erhalten. Mit `@ds @gpt …` fragst du mehrere Modelle gleichzeitig. |
| **Aufgaben-Routing** | `general / code / reasoning / writing / translate / quick` werden jeweils einer Liste von Modellen zugeordnet; bei einem Fehler wird das nächste Modell ausprobiert, und Modelle, bei denen gerade ein Fehler aufgetreten ist, werden für 10 Minuten ans Ende verschoben. |
| **Vergleich mehrerer Modelle** | Dieselbe Frage wird parallel an 2–5 Modelle gestellt; auch bei einzelnen Fehlern werden die erfolgreichen Antworten zurückgegeben. |
| **Dateimodus (spart Tokens)** | Die Erweiterung liest lokale Textdateien und schreibt Ergebnisse zurück in Dateien, sodass lange Dokumente nie durch die Konversation übertragen werden. Lange Dokumente werden in Abschnitte aufgeteilt (3 parallel), und fehlgeschlagene Abschnitte können fortgesetzt werden. |
| **Abruf** | Ruft den vollständigen Text einer früheren Antwort ab (einschließlich langer, in Dateien gespeicherter Antworten), damit Claude sie überprüfen kann. |
| **Live-Konfiguration** | Füge Aliase hinzu oder entferne sie und ändere Routen oder den Anzeigemodus direkt im Chat (`magpie_config`) – ein Neustart ist nicht erforderlich. |
| **Nutzungsstatistiken** | `magpie_status` zeigt für die letzten 7 Tage Aufrufe, Fehler, durchschnittliche Latenz und Tokens pro Modell an. |
| **Hot Reload** | Der Kerncode befindet sich in `Documents/Magpie Chat/core/core.mjs`; Änderungen werden beim nächsten Aufruf wirksam, ohne dass eine Neuinstallation erforderlich ist. Wenn neuer Code nicht geladen werden kann, läuft die letzte funktionierende Version weiter. |

Tools: `magpie_chat`, `magpie_ask`, `magpie_compare`, `magpie_recall`, `magpie_config`, `magpie_list_models`, `magpie_status`. (Das Präfix `magpie_` ist historisch bedingt; jedes OpenAI-kompatible Gateway funktioniert.)

## Voraussetzungen

- Claude Desktop (Windows oder macOS) mit aktivierten Erweiterungen. Die Erweiterung läuft mit dem gebündelten Node.js von Claude Desktop.
- Ein lokales OpenAI-kompatibles Gateway, das `/v1/chat/completions` und `/v1/models` bereitstellt, z. B. Magpie.
- Die Nutzung von Drittanbietern wird von den jeweiligen Providern deines Gateways abgerechnet, nicht über deinen Claude-Tarif.

## Installation

1. Lade die neueste `magpie-chat-<version>.mcpb` aus dem Ordner [`dist/`](dist/) herunter (klicke auf die Datei und dann auf **Rohdatei herunterladen**) oder, falls verfügbar, aus den [Releases](../../releases).
2. Doppelklicke darauf (oder ziehe sie in Claude Desktop → Einstellungen → Erweiterungen).
3. Überprüfe die Einstellungen: Standardmodell, Modelle pro Aufgabe, Aliase (z. B. `ds=auto/deepseek-v4.1-flash, gpt=auto/gpt-6.1-sol`) und **zugelassene Ordner** für den Dateimodus. Die standardmäßigen Modell-IDs folgen der Benennung von Magpie – ändere sie in IDs, die dein Gateway auflistet.
4. Beende Claude vollständig über die Taskleiste bzw. Menüleiste und öffne es erneut.
5. Bitte Claude in einer **neuen** Konversation, `magpie_status` auszuführen, und probiere anschließend `@ds hello` aus.

## Empfohlen: die begleitende Skill-Datei

`skill/magpie-collab/SKILL.md` bringt Claude bei, die Tools sinnvoll zu verwenden: `@alias`-Nachrichten unverändert weiterzuleiten, Hintergrundinformationen über `context` zu übergeben, Anzeigeanweisungen zu befolgen, Kurzbefehle (`#审` review, `#译` translate, `#比` compare, `#稿` draft→review→finalize) zu verwenden, bei Bedarf automatisch eine Gegenprüfung auszulösen und Ausgaben von Drittanbietern als nicht vertrauenswürdig zu behandeln. Füge sie Claude als Skill hinzu (oder füge sie in die Anweisungen eines Projekts ein).

## Realitätscheck zu Tokens

- Wenn eine Antwort eines Drittanbieters im Chat angezeigt wird, muss Claude sie erneut ausgeben – das kostet ungefähr so viel, wie wenn Claude selbst antworten würde.
- Eine Gegenprüfung **erhöht** die Claude-Nutzung; sie verbessert die Qualität, spart aber keine Tokens.
- Die tatsächlichen Einsparungen entstehen durch den **Dateimodus**: Lange Eingaben und Ausgaben bleiben auf der Festplatte.
- Lange `@alias`-Antworten werden in Dateien geschrieben und automatisch geöffnet (der Schwellenwert ist konfigurierbar).

## Sicherheit und Datenschutz

- Der Dateimodus liest und schreibt nur innerhalb der von dir erlaubten Ordner. Pfade werden vor der Prüfung mit `realpath` aufgelöst, wodurch `..` und Ausbrüche über symbolische Links blockiert werden; Binärdateien und Dateien über 5 MB werden abgelehnt; vorhandene Dateien werden nie überschrieben, außer du stimmst dem zu.
- Ausgaben von Drittanbietermodellen werden als nicht vertrauenswürdige Daten behandelt; der Skill weist Claude an, niemals darin enthaltenen Anweisungen zu folgen.
- **Hot Reload führt `core/core.mjs` aus.** Alles, was in diesen Ordner schreiben kann, kann über diese Erweiterung Code ausführen. Gib diesen Ordner nicht an nicht vertrauenswürdige Personen weiter und synchronisiere ihn nicht mit ihnen.
- Dein Gateway kann den Datenverkehr über Relays von Drittanbietern leiten. Überlege genau, bevor du unveröffentlichte oder vertrauliche Inhalte sendest.
- Die Daten bleiben lokal: Antworten, Sitzungen, Protokolle und Konfiguration befinden sich in `Documents/Magpie Chat` (Unterordner `.state`).

## Bekannte Einschränkungen

- Die Laufzeitmeldungen der Erweiterung und der begleitende Skill sind auf vereinfachtes Chinesisch verfasst; Claude antwortet dir weiterhin in deiner eigenen Sprache.
- Die Modellauswahl von Claude Desktop kann keine Modelle von Drittanbietern auflisten, und das Eingabefeld kann `@` nicht automatisch vervollständigen. Diese Erweiterung funktioniert stattdessen über Tools und einen Skill.
- Antworten können nicht in den Chat gestreamt werden.
- Nur Desktop (das lokale Gateway muss auf demselben Computer laufen).
- Tool-Beschreibungen werden pro Konversation zwischengespeichert – öffne nach Aktualisierungen, durch die Tools hinzugefügt werden, eine neue Konversation.

## Entwicklung

```bash
node tests/selftest.mjs          # 27 checks against a mock gateway, in a temp dir
npm i -g @anthropic-ai/mcpb
mcpb validate manifest.json
mcpb pack . magpie-chat.mcpb
```

`server/index.mjs` ist ein schlanker Loader (MCP über stdio + Hot Reload); `server/core.mjs` enthält alle Funktionen. Keine Abhängigkeiten, Node ≥ 18.

## Erstelle deine eigene Erweiterung mit Claude

Ein Prompt, den du deinem eigenen Claude geben kannst, um eine gleichwertige Erweiterung von Grund auf zu erstellen, einschließlich der aufgetretenen Probleme: [Englisch](docs/PROMPT.en.md) · [简体中文](docs/PROMPT.zh-CN.md) · [繁體中文](docs/PROMPT.zh-TW.md) · [日本語](docs/PROMPT.ja.md) · [한국어](docs/PROMPT.ko.md) · [Español](docs/PROMPT.es.md) · [Français](docs/PROMPT.fr.md) · [Deutsch](docs/PROMPT.de.md) · [Português (Brasil)](docs/PROMPT.pt-BR.md) · [Русский](docs/PROMPT.ru.md)

## Lizenz

[MIT](LICENSE)