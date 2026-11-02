# Model Slots for Claude

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md) | [Русский](README.ru.md)

공식 Claude를 기본 모델로 유지하면서 **로컬 OpenAI 호환 게이트웨이**(기본값: `http://127.0.0.1:3425/v1`의 [Magpie](https://github.com/yetone/magpie))를 통해 DeepSeek, GLM, GPT, Gemini 등의 타사 모델을 호출할 수 있도록 하는 Claude Desktop 확장 프로그램(`.mcpb`)입니다. Claude에 몇 개의 추가 "모델 슬롯"을 더하는 것처럼 작동하며, Claude 토큰을 절약하도록 설계되었습니다.

> **비공식입니다.** Anthropic 또는 Magpie 프로젝트와 제휴하거나, 이들의 보증 또는 지원을 받지 않습니다. "Claude"는 Anthropic의 상표입니다.

## 제공되는 기능

| 기능 | 작동 방식 |
|---|---|
| **@alias 모델 슬롯** | `@ds`, `@gpt`, `@glm`…으로 메시지를 시작하면 Claude가 해당 모델로 전달합니다. 각 Claude 대화별 멀티턴 기록이 유지되어 디스크에 저장되며, 재시작 후에도 남아 있습니다. `@ds @gpt …`를 사용하면 여러 모델에 동시에 요청합니다. |
| **작업 라우팅** | `general / code / reasoning / writing / translate / quick`은 각각 모델 목록에 매핑됩니다. 실패하면 다음 모델을 시도하며, 방금 실패한 모델은 10분 동안 목록의 뒤로 이동합니다. |
| **멀티 모델 비교** | 동일한 질문을 2~5개 모델에 병렬로 보냅니다. 일부 요청이 실패해도 성공한 답변은 반환됩니다. |
| **파일 모드(토큰 절약)** | 확장 프로그램이 로컬 텍스트 파일을 읽고 결과를 다시 파일에 기록하므로, 긴 문서가 대화를 거치지 않습니다. 긴 문서는 청크로 나누어 처리되며(3개 병렬), 실패한 청크는 재개할 수 있습니다. |
| **이전 답변 불러오기** | Claude가 검토할 수 있도록 이전 답변의 전체 텍스트(파일에 저장된 긴 답변 포함)를 가져옵니다. |
| **실시간 설정** | 채팅에서(`magpie_config`) 별칭을 추가/삭제하고, 라우트 또는 표시 모드를 변경할 수 있으며 재시작이 필요하지 않습니다. |
| **사용 통계** | `magpie_status`에서 최근 7일 동안 모델별 호출 수, 실패 수, 평균 지연 시간 및 토큰을 표시합니다. |
| **핫 리로드** | 핵심 코드는 `Documents/Magpie Chat/core/core.mjs`에 있으며, 다시 설치하지 않아도 다음 호출부터 편집 내용이 적용됩니다. 새 코드 로드에 실패하면 마지막으로 작동한 버전이 계속 실행됩니다. |

도구: `magpie_chat`, `magpie_ask`, `magpie_compare`, `magpie_recall`, `magpie_config`, `magpie_list_models`, `magpie_status`. (`magpie_` 접두사는 역사적으로 사용된 것이며, 모든 OpenAI 호환 게이트웨이에서 작동합니다.)

## 요구 사항

- 확장 프로그램이 활성화된 Claude Desktop(Windows 또는 macOS)이 필요합니다. 확장 프로그램은 Claude Desktop에 포함된 Node.js에서 실행됩니다.
- `/v1/chat/completions` 및 `/v1/models`를 제공하는 로컬 OpenAI 호환 게이트웨이가 필요합니다. 예를 들면 Magpie가 있습니다.
- 타사 사용 요금은 Claude 요금제가 아니라 게이트웨이에서 사용하는 제공업체에 따라 청구됩니다.

## 설치

1. [`dist/`](dist/) 폴더에서 최신 `magpie-chat-<version>.mcpb`를 다운로드합니다(파일을 클릭한 다음 **원시 파일 다운로드** 선택). 사용 가능한 경우 [릴리스](../../releases)에서 다운로드할 수도 있습니다.
2. 파일을 두 번 클릭하거나 Claude Desktop → 설정 → 확장 프로그램으로 드래그합니다.
3. 설정을 검토합니다. 기본 모델, 작업별 모델, 별칭(예: `ds=auto/deepseek-v4.1-flash, gpt=auto/gpt-6.1-sol`) 및 파일 모드에 **허용된 폴더**를 확인합니다. 기본 모델 ID는 Magpie의 명명 규칙을 따르므로, 게이트웨이에 표시되는 ID로 변경해야 합니다.
4. 시스템 트레이에서 Claude를 완전히 종료한 다음 다시 엽니다.
5. **새** 대화에서 Claude에게 `magpie_status`를 실행하도록 요청한 다음 `@ds hello`를 시도합니다.

## 권장 사항: 함께 사용하는 스킬

`skill/magpie-collab/SKILL.md`는 도구를 효과적으로 사용하는 방법을 Claude에 가르칩니다. `@alias` 메시지를 있는 그대로 전달하고, `context`를 통해 배경 정보를 전달하며, 표시 지침과 단축 명령(`#审` 검토, `#译` 번역, `#比` 비교, `#稿` 초안→검토→완성)을 따르고, 교차 검토를 자동으로 시작할 시점을 판단하며, 타사 출력을 신뢰할 수 없는 데이터로 취급하도록 합니다. 이를 Claude에 스킬로 추가하거나 프로젝트의 지침에 붙여 넣습니다.

## 토큰 사용 현실 점검

- 타사 답변이 채팅에 표시되면 Claude가 이를 다시 출력해야 하므로, Claude가 직접 답변하는 것과 비슷한 비용이 발생합니다.
- 교차 검토는 Claude 사용량을 **늘리며**, 품질을 높여 주지만 비용을 절약해 주지는 않습니다.
- 실제 절약은 **파일 모드**에서 발생합니다. 긴 입력과 출력이 디스크에 유지됩니다.
- 긴 `@alias` 답변은 파일에 기록되고 자동으로 열립니다(임계값 설정 가능).

## 보안 및 개인정보 보호

- 파일 모드는 사용자가 허용한 폴더 내부만 읽고 씁니다. 확인 전에 경로를 `realpath`로 확인하여 `..` 및 심볼릭 링크를 통한 탈출을 차단합니다. 바이너리 파일과 5MB를 초과하는 파일은 거부하며, 기존 파일은 사용자가 명시적으로 허용하지 않는 한 덮어쓰지 않습니다.
- 타사 모델의 출력은 신뢰할 수 없는 데이터로 취급되며, 스킬은 Claude가 그 안에서 발견한 지침을 절대 따르지 않도록 합니다.
- **핫 리로드는 `core/core.mjs`를 실행합니다.** 해당 폴더에 쓸 수 있는 모든 항목이 이 확장 프로그램을 통해 코드를 실행할 수 있습니다. 이 폴더를 신뢰할 수 없는 사람과 공유하거나 동기화하지 마십시오.
- 게이트웨이가 타사 릴레이를 통해 라우팅할 수 있습니다. 공개되지 않은 자료나 민감한 자료를 보내기 전에 신중하게 판단하십시오.
- 데이터는 로컬에 유지됩니다. 답변, 세션, 로그 및 설정은 `Documents/Magpie Chat`(`.state` 하위 폴더)에 저장됩니다.

## 알려진 제한 사항

- 확장 프로그램의 런타임 메시지와 함께 사용하는 스킬은 중국어 간체로 작성되어 있지만, Claude는 사용자의 언어로 계속 답변합니다.
- Claude Desktop의 모델 선택기에는 타사 모델이 표시되지 않으며, 입력 상자에서는 `@` 자동 완성을 지원하지 않습니다. 대신 이 확장 프로그램은 도구와 스킬을 통해 작동합니다.
- 답변을 채팅으로 스트리밍할 수 없습니다.
- 데스크톱에서만 사용할 수 있습니다(동일한 컴퓨터에 로컬 게이트웨이가 필요합니다).
- 대화별로 도구 설명이 캐시되므로, 도구를 추가하는 업데이트 후에는 새 대화를 시작해야 합니다.

## 개발

```bash
node tests/selftest.mjs          # 27 checks against a mock gateway, in a temp dir
npm i -g @anthropic-ai/mcpb
mcpb validate manifest.json
mcpb pack . magpie-chat.mcpb
```

`server/index.mjs`는 얇은 로더(MCP over stdio + 핫 리로드)이며, `server/core.mjs`에 모든 기능이 들어 있습니다. 종속성이 없으며 Node ≥ 18이 필요합니다.

## Claude로 직접 만들기

직접 사용하는 Claude에 제공하여 처음부터 동등한 확장 프로그램을 만들 수 있는 프롬프트입니다. 여기에는 개발 과정에서 발견한 문제점도 포함되어 있습니다: [English](docs/PROMPT.en.md) · [简体中文](docs/PROMPT.zh-CN.md) · [繁體中文](docs/PROMPT.zh-TW.md) · [日本語](docs/PROMPT.ja.md) · [한국어](docs/PROMPT.ko.md) · [Español](docs/PROMPT.es.md) · [Français](docs/PROMPT.fr.md) · [Deutsch](docs/PROMPT.de.md) · [Português (Brasil)](docs/PROMPT.pt-BR.md) · [Русский](docs/PROMPT.ru.md)

## 라이선스

[MIT](LICENSE)