# Model Slots for Claude

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md) | [Русский](README.ru.md)

Uma extensão do Claude Desktop (`.mcpb`) que mantém o Claude oficial como seu modelo principal, enquanto permite que você chame modelos de terceiros — DeepSeek, GLM, GPT, Gemini e outros — por meio de um **gateway local compatível com OpenAI** (padrão: [Magpie](https://github.com/yetone/magpie) em `http://127.0.0.1:3425/v1`). É como adicionar alguns "slots de modelo" extras ao Claude, e a extensão foi projetada para economizar tokens do Claude.

> **Não oficial.** Não é afiliada, endossada nem recebe suporte da Anthropic ou do projeto Magpie. "Claude" é uma marca registrada da Anthropic.

## O que você obtém

| Recurso | Como funciona |
|---|---|
| **Slots de modelo @alias** | Comece uma mensagem com `@ds`, `@gpt`, `@glm`… e o Claude a encaminhará para esse modelo. O histórico de várias interações é mantido por conversa do Claude, salvo em disco e preservado após reinicializações. `@ds @gpt …` consulta vários modelos de uma vez. |
| **Roteamento de tarefas** | `general / code / reasoning / writing / translate / quick` mapeiam cada um para uma lista de modelos; em caso de falha, o próximo é testado, e os modelos que acabaram de falhar são enviados para o final da fila por 10 minutos. |
| **Comparação de vários modelos** | A mesma pergunta é enviada a 2–5 modelos em paralelo; falhas parciais ainda retornam as respostas bem-sucedidas. |
| **Modo de arquivo (economiza tokens)** | A extensão lê arquivos de texto locais e grava os resultados de volta em arquivos, para que documentos longos nunca passem pela conversa. Documentos longos são divididos em partes (3 em paralelo), e as partes que falharem podem ser retomadas. |
| **Recuperação** | Busca o texto completo de uma resposta anterior (incluindo respostas longas salvas em arquivos) para que o Claude possa revisá-la. |
| **Configuração ao vivo** | Adicione/remova aliases, altere rotas ou o modo de exibição pelo chat (`magpie_config`) — sem necessidade de reinicialização. |
| **Estatísticas de uso** | `magpie_status` mostra chamadas, falhas, latência média e tokens por modelo nos últimos 7 dias. |
| **Recarga automática** | O código principal fica em `Documents/Magpie Chat/core/core.mjs`; as edições entram em vigor na próxima chamada sem reinstalação. Se o novo código não carregar, a última versão funcional continua em execução. |

Ferramentas: `magpie_chat`, `magpie_ask`, `magpie_compare`, `magpie_recall`, `magpie_config`, `magpie_list_models`, `magpie_status`. (O prefixo `magpie_` é histórico; qualquer gateway compatível com OpenAI funciona.)

## Requisitos

- Claude Desktop (Windows ou macOS) com extensões habilitadas. A extensão é executada no Node.js incluído no Claude Desktop.
- Um gateway local compatível com OpenAI que disponibilize `/v1/chat/completions` e `/v1/models`, como o Magpie.
- O uso de terceiros é cobrado pelos provedores utilizados pelo seu gateway, e não pelo seu plano do Claude.

## Instalação

1. Baixe o `magpie-chat-<version>.mcpb` mais recente da pasta [`dist/`](dist/) (clique no arquivo e depois em **Download raw file**) ou em [Lançamentos](../../releases), se disponível.
2. Clique duas vezes nele (ou arraste-o para Claude Desktop → Settings → Extensions).
3. Revise as configurações: modelo padrão, modelos por tarefa, aliases (por exemplo, `ds=auto/deepseek-v4.1-flash, gpt=auto/gpt-6.1-sol`) e as **pastas permitidas** para o modo de arquivo. Os IDs de modelo padrão seguem a nomenclatura do Magpie — altere-os para os IDs listados pelo seu gateway.
4. Encerre completamente o Claude pela bandeja do sistema e abra-o novamente.
5. Em uma conversa **nova**, peça ao Claude para executar `magpie_status` e depois tente `@ds hello`.

## Recomendado: a skill complementar

`skill/magpie-collab/SKILL.md` ensina o Claude a usar bem as ferramentas: encaminhar mensagens `@alias` literalmente, passar o contexto por meio de `context`, seguir as instruções de exibição, usar comandos de atalho (`#审` revisão, `#译` tradução, `#比` comparação, `#稿` rascunho→revisão→finalização), saber quando iniciar automaticamente uma revisão cruzada e tratar as respostas de terceiros como não confiáveis. Adicione-a ao Claude como uma skill (ou cole-a nas instruções de um Project).

## Verificação da realidade dos tokens

- Se uma resposta de terceiros for exibida no chat, o Claude precisará emiti-la novamente — isso custa aproximadamente o mesmo que o Claude responder por conta própria.
- A revisão cruzada **aumenta** o uso do Claude; ela proporciona qualidade, não economia.
- A economia real vem do **modo de arquivo**: entradas e saídas longas permanecem no disco.
- Respostas longas de `@alias` são gravadas em arquivos e abertas automaticamente (limiar configurável).

## Segurança e privacidade

- O modo de arquivo só lê/grava dentro das pastas que você permitir. Os caminhos são resolvidos com `realpath` antes da verificação, bloqueando `..` e escapes por links simbólicos; arquivos binários e arquivos com mais de 5 MB são rejeitados; arquivos existentes nunca são sobrescritos sem a sua autorização.
- As respostas dos modelos de terceiros são tratadas como dados não confiáveis; a skill instrui o Claude a nunca seguir instruções encontradas nelas.
- **A recarga automática executa `core/core.mjs`.** Qualquer coisa que possa gravar nessa pasta pode executar código por meio desta extensão. Não compartilhe nem sincronize essa pasta com terceiros não confiáveis.
- Seu gateway pode encaminhar dados por relays de terceiros. Pense antes de enviar material não publicado ou confidencial.
- Os dados permanecem locais: respostas, sessões, logs e configurações ficam em `Documents/Magpie Chat` (subpasta `.state`).

## Limitações conhecidas

- As mensagens de execução da extensão e a skill complementar são escritas em chinês simplificado; o Claude ainda responderá a você no seu próprio idioma.
- O seletor de modelos do Claude Desktop não consegue listar modelos de terceiros, e a caixa de entrada não pode autocompletar `@`. Em vez disso, esta extensão funciona por meio de ferramentas e uma skill.
- As respostas não podem ser transmitidas progressivamente para o chat.
- Apenas para Desktop (precisa do gateway local na mesma máquina).
- As descrições das ferramentas são armazenadas em cache por conversa — abra uma conversa nova depois de atualizações que adicionem ferramentas.

## Desenvolvimento

```bash
node tests/selftest.mjs          # 27 checks against a mock gateway, in a temp dir
npm i -g @anthropic-ai/mcpb
mcpb validate manifest.json
mcpb pack . magpie-chat.mcpb
```

`server/index.mjs` é um carregador simples (MCP via stdio + recarga automática); `server/core.mjs` contém todos os recursos. Zero dependências, Node ≥ 18.

## Crie o seu próprio com Claude

Um prompt que você pode fornecer ao seu próprio Claude para criar uma extensão equivalente do zero, incluindo as armadilhas que encontramos: [English](docs/PROMPT.en.md) · [简体中文](docs/PROMPT.zh-CN.md) · [繁體中文](docs/PROMPT.zh-TW.md) · [日本語](docs/PROMPT.ja.md) · [한국어](docs/PROMPT.ko.md) · [Español](docs/PROMPT.es.md) · [Français](docs/PROMPT.fr.md) · [Deutsch](docs/PROMPT.de.md) · [Português (Brasil)](docs/PROMPT.pt-BR.md) · [Русский](docs/PROMPT.ru.md)

## Licença

[MIT](LICENSE)