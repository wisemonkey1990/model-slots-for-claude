# Model Slots for Claude

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md) | [Русский](README.ru.md)

Una extensión de Claude Desktop (`.mcpb`) que mantiene el Claude oficial como tu modelo principal y te permite llamar a modelos de terceros — DeepSeek, GLM, GPT, Gemini y otros — mediante un **gateway local compatible con OpenAI** (predeterminado: [Magpie](https://github.com/yetone/magpie) en `http://127.0.0.1:3425/v1`). Es como añadir algunos "espacios de modelo" adicionales a Claude, y está diseñada para ahorrar tokens de Claude.

> **No oficial.** No está afiliada a Anthropic ni al proyecto Magpie, ni cuenta con su respaldo o soporte. "Claude" es una marca comercial de Anthropic.

## Qué obtienes

| Función | Cómo funciona |
|---|---|
| **Espacios de modelo @alias** | Comienza un mensaje con `@ds`, `@gpt`, `@glm`… y Claude lo reenvía a ese modelo. El historial de varios turnos se conserva por conversación de Claude, se guarda en el disco y sobrevive a los reinicios. `@ds @gpt …` solicita varios modelos a la vez. |
| **Enrutamiento de tareas** | `general / code / reasoning / writing / translate / quick` se asignan cada uno a una lista de modelos; si falla uno, se prueba el siguiente, y los modelos que acaban de fallar se envían al final durante 10 minutos. |
| **Comparación de varios modelos** | La misma pregunta a entre 2 y 5 modelos en paralelo; los fallos parciales aún devuelven las respuestas correctas. |
| **Modo de archivos (ahorra tokens)** | La extensión lee archivos de texto locales y escribe los resultados de vuelta en archivos, de modo que los documentos extensos nunca pasan por la conversación. Los documentos largos se dividen en fragmentos (3 en paralelo) y los fragmentos fallidos se pueden reanudar. |
| **Recuperación** | Obtén el texto completo de una respuesta anterior (incluidas las respuestas largas guardadas en archivos) para que Claude pueda revisarla. |
| **Configuración en vivo** | Añade o elimina alias, cambia rutas o el modo de visualización desde el chat (`magpie_config`), sin necesidad de reiniciar. |
| **Estadísticas de uso** | `magpie_status` muestra las llamadas, los fallos, la latencia media y los tokens por modelo de los últimos 7 días. |
| **Recarga en caliente** | El código principal se encuentra en `Documents/Magpie Chat/core/core.mjs`; los cambios se aplican en la siguiente llamada sin reinstalar. Si no se puede cargar el código nuevo, la última versión funcional sigue ejecutándose. |

Herramientas: `magpie_chat`, `magpie_ask`, `magpie_compare`, `magpie_recall`, `magpie_config`, `magpie_list_models`, `magpie_status`. (El prefijo `magpie_` es histórico; cualquier gateway compatible con OpenAI funciona.)

## Requisitos

- Claude Desktop (Windows o macOS) con las extensiones habilitadas. La extensión se ejecuta en el Node.js incluido con Claude Desktop.
- Un gateway local compatible con OpenAI que proporcione `/v1/chat/completions` y `/v1/models`, como Magpie.
- El uso de servicios de terceros se factura según los proveedores que utilice tu gateway, no según tu plan de Claude.

## Instalación

1. Descarga el archivo `magpie-chat-<version>.mcpb` más reciente de la carpeta [`dist/`](dist/) (haz clic en el archivo y luego en **Descargar archivo sin procesar**), o desde [Versiones](../../releases) si está disponible.
2. Haz doble clic en él (o arrástralo a Claude Desktop → Configuración → Extensiones).
3. Revisa la configuración: modelo predeterminado, modelos por tarea, alias (por ejemplo, `ds=auto/deepseek-v4.1-flash, gpt=auto/gpt-6.1-sol`) y **carpetas permitidas** para el modo de archivos. Los ID de modelo predeterminados siguen la nomenclatura de Magpie; cámbialos por los ID que indique tu gateway.
4. Cierra Claude por completo desde la bandeja del sistema y vuelve a abrirlo.
5. En una conversación **nueva**, pide a Claude que ejecute `magpie_status` y luego prueba `@ds hello`.

## Recomendado: la skill complementaria

`skill/magpie-collab/SKILL.md` enseña a Claude a usar bien las herramientas: reenviar literalmente los mensajes `@alias`, pasar el contexto mediante `context`, seguir las instrucciones de visualización, usar los comandos abreviados (`#审` revisar, `#译` traducir, `#比` comparar, `#稿` borrador→revisión→finalización), saber cuándo activar automáticamente una revisión cruzada y tratar los resultados de terceros como no confiables. Añádela a Claude como una skill (o pégala en las instrucciones de un proyecto).

## Comprobación de la realidad de los tokens

- Si una respuesta de terceros se muestra en el chat, Claude tiene que volver a generarla, lo que cuesta aproximadamente lo mismo que si Claude respondiera por sí mismo.
- La revisión cruzada **aumenta** el uso de Claude; aporta calidad, no ahorro.
- El ahorro real proviene del **modo de archivos**: las entradas y salidas largas permanecen en el disco.
- Las respuestas largas de `@alias` se escriben en archivos y se abren automáticamente (el umbral se puede configurar).

## Seguridad y privacidad

- El modo de archivos solo lee y escribe dentro de las carpetas que permitas. Las rutas se resuelven con `realpath` antes de comprobarlas, lo que bloquea `..` y los escapes mediante enlaces simbólicos; se rechazan los archivos binarios y los archivos de más de 5 MB; los archivos existentes nunca se sobrescriben a menos que tú lo indiques.
- Los resultados de los modelos de terceros se tratan como datos no confiables; la skill indica a Claude que nunca siga las instrucciones que encuentre en ellos.
- **La recarga en caliente ejecuta `core/core.mjs`.** Cualquier elemento que pueda escribir en esa carpeta puede ejecutar código a través de esta extensión. No compartas ni sincronices esa carpeta con terceros no confiables.
- Tu gateway puede enrutar el tráfico a través de retransmisores de terceros. Piensa antes de enviar material no publicado o confidencial.
- Los datos permanecen locales: las respuestas, sesiones, registros y la configuración se guardan en `Documents/Magpie Chat` (subcarpeta `.state`).

## Limitaciones conocidas

- Los mensajes del entorno de ejecución de la extensión y la skill complementaria están escritos en chino simplificado; Claude seguirá respondiéndote en tu propio idioma.
- El selector de modelos de Claude Desktop no puede mostrar modelos de terceros y el cuadro de entrada no puede autocompletar `@`. Esta extensión funciona mediante herramientas y una skill.
- Las respuestas no pueden transmitirse gradualmente al chat.
- Solo para equipos de escritorio (necesita que el gateway local esté en el mismo equipo).
- Las descripciones de las herramientas se almacenan en caché por conversación; abre una conversación nueva después de las actualizaciones que añadan herramientas.

## Desarrollo

```bash
node tests/selftest.mjs          # 27 checks against a mock gateway, in a temp dir
npm i -g @anthropic-ai/mcpb
mcpb validate manifest.json
mcpb pack . magpie-chat.mcpb
```

`server/index.mjs` es un cargador ligero (MCP mediante stdio + recarga en caliente); `server/core.mjs` contiene todas las funciones. Sin dependencias, Node ≥ 18.

## Crea tu propia extensión con Claude

Un prompt que puedes dar a tu propio Claude para crear una extensión equivalente desde cero, incluidos los problemas que encontramos: [English](docs/PROMPT.en.md) · [简体中文](docs/PROMPT.zh-CN.md) · [繁體中文](docs/PROMPT.zh-TW.md) · [日本語](docs/PROMPT.ja.md) · [한국어](docs/PROMPT.ko.md) · [Español](docs/PROMPT.es.md) · [Français](docs/PROMPT.fr.md) · [Deutsch](docs/PROMPT.de.md) · [Português (Brasil)](docs/PROMPT.pt-BR.md) · [Русский](docs/PROMPT.ru.md)

## Licencia

[MIT](LICENSE)