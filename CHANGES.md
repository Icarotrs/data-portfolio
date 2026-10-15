# Mudanças — Fase 1: correções de honestidade (outubro de 2026)

Regra aplicada em todo o site, capas, imagens OG e textos do Upwork: só entra número medido ou calculado com a premissa escrita ao lado.

## Status dos projetos
- Novo campo `status` em `project.json`: `built` ou `in-progress`. O build falha se faltar.
- Só o 01 (n8n) é `built`. De 02 a 06 é `in-progress`, com o selo "In progress" / "Em andamento" / "En curso" no card da home, na página do projeto, na capa do Upwork e na imagem OG.
- O build também falha se o título da segunda seção não bater com o status: "What I built" só para `built`, "How I'd build it" para `in-progress`, nas três línguas.

## Cenário em vez de cliente
- "Problem" virou "The scenario" / "O cenário" / "El escenario", no presente, como situação típica e não como cliente atendido.
- Projetos 02 a 06: "What I built" virou "How I'd build it" / "Como eu construiria" / "Cómo lo construiría", com verbos no futuro.
- Projeto 01: acrescentado o que foi de fato testado ("importado no n8n e rodado de ponta a ponta com os três pedidos de teste, com a chamada à API da Claude simulada").

## Números
| # | Antes | Agora | Selo |
|---|---|---|---|
| 01 | ~5h economizadas por semana | ~5h por semana, estimadas para 40 pedidos/dia × ~1 min × 7 dias (≈ 4,7 h) | Estimado |
| 02 | ~3h economizadas por semana | ~3h por semana, estimadas para 20 respostas/dia × ~2 min × 5 dias (≈ 3,3 h) | Estimado |
| 03 | 1–3 semanas de aviso | +7 dias além do prazo do fornecedor: o alerta dispara quando o estoque não cobre mais os dois | Regra do projeto |
| 04 | 3 min para 5.214 avaliações; 94% de concordância | 80%: limite de confiança abaixo do qual a linha vai para uma pessoa | Regra do projeto |
| 05 | ~4h economizadas por semana; "em segundos" | ~4h por semana, estimadas para 5 arquivos/semana × ~45 min (≈ 3,8 h); "em segundos" removido | Estimado |
| 06 | 312 produtos com prejuízo; 61% do gasto abaixo de 3× | ~99 mil pedidos no dataset público da Olist (marketplace brasileiro, valores em R$) | Dado público |

- Novos selos: "Regra do projeto" (configuração da solução) e "Dado público" (fato sobre um dataset público), além de Estimado e Simulado.
- Os selos agora aparecem também nos cards da home.
- 01: removido "classificado em cerca de um minuto", que nunca foi medido.

## Promessas
- 01: "risky orders reach the team before they ship" → "Orders flagged as high risk, rush or VIP are sent to the team for review before fulfillment. A second check, not a replacement for Shopify's own fraud analysis."
- 01: "so the store can run and change it without me" → "so the team can run it day to day."
- Textos do Upwork: "Saves about X hours" → "Designed to save about X hours a week (estimate based on …)". Os projetos 02 a 06 começam com "Demo project, build in progress."
- 05: "detects … on its own" → "handles different delimiters, encodings and multi-row headers, with a mapping file for each new supplier format." Removidos "in seconds", o agendamento semanal e o menu do Apps Script, que não fazem parte do plano do projeto 05.
- Serviço de IA: "A person still checks what matters" → "Low-confidence results go to a person to check."

## Outros
- Home: novo subtítulo da seção de projetos, nas três línguas.
- OpenAI removida da descrição de metadados, das ferramentas do topo e do serviço de IA.
- 06: "public dataset from a Brazilian marketplace (values in BRL)" no texto e na nota de dados.
- Telas e vídeos simulados: removidos "300 random reviews were checked by hand: 94% agreement", "spot-checked by hand", "Meta and TikTok spend 61% of the budget…" e a legenda "312 products were selling at a loss". As telas e os vídeos dos projetos 04 e 06 foram gerados de novo.
- Capas 1600×1200, imagens OG e textos do Upwork gerados de novo.
- Scripts de geração (`scripts/*.mjs`) corrigidos para rodar no Windows.

# Mudanças — Fases 2 e 3: código real dos projetos (outubro de 2026)

Todos os projetos de 02 a 06 continuam com `status: in-progress` no site. Só mude para `built` depois de rodar e confirmar (veja a tabela "Project code" no README).

No site: a OpenAI voltou às ferramentas do topo e ao serviço de IA, porque o projeto 04 agora aceita os dois provedores; e cada projeto ganhou o botão "Code", que leva à pasta do código no GitHub.

| # | Pasta | O que foi entregue | Testes |
|---|---|---|---|
| 02 | `integrations/apps-script/form-to-sheet-automation/` | Gatilho onFormSubmit com limpeza, gravação só nas colunas de entrada (as colunas de fórmula são ARRAYFORMULA), LockService, aba de resumo por QUERY, PDF semanal por e-mail, aba Settings, `setupDemo()` que cria a planilha e o formulário, `seedDemoData()` com pedidos fictícios | 17 (Node) |
| 03 | `integrations/apps-script/low-stock-alerts/` | Importação do CSV da Shopify, venda média, dias de cobertura, ponto de reposição (prazo + 7 dias), pedido sugerido para 45 dias, status com ícone e rótulo, gatilho diário às 7h com e-mail, abas Reorder log e Settings, gerador de loja fictícia | 9 (Node) |
| 04 | `integrations/apps-script/ai-review-classifier/` | Menu e gatilho noturno, lotes de 25, saída JSON com schema (Claude ou OpenAI), validação, sinalização abaixo de 80%, execução em partes que retoma por gatilho, aba Runs com o tempo real de cada execução, conferência manual às cegas de 300 avaliações com cálculo de concordância, chave nas Script Properties, 1.000 avaliações fictícias | 11 (Node) |
| 05 | `integrations/python/messy-data-extractor/` | Leitura de CSV/Excel/PDF, mapeamento por fornecedor em JSON, limpeza (decimal europeu, moeda, datas mistas, nomes, SKUs, colunas divididas e unidas, duplicatas), saída em Google Sheets ou .xlsx com abas de dados, resumo e log, 4 arquivos fictícios com cada problema | 53 (pytest) |
| 06 | `integrations/powerbi/ecommerce-profit-roas/` | Script que limpa as 8 tabelas da Olist e gera custo, taxas, atribuição e gasto em anúncios simulados (`is_simulated = TRUE`), totais de referência para conferir o relatório, `measures.dax` comentado, guia das quatro páginas com a formatação de margem negativa | 12 (pytest) |

## O que falta do seu lado
- 02 e 03: rodar o `setupDemo()` numa conta Google e confirmar que funciona.
- 04: rodar com uma chave de API, ler o tempo na aba Runs, fazer a conferência manual das 300 avaliações e calcular a concordância. Só esses dois números podem voltar ao site.
- 05: rodar `python -m extractor --year 2026` (ou com `--sheet-id`) e confirmar.
- 06: baixar a Olist, rodar `prepare_data.py`, montar o relatório pelo REPORT-GUIDE.md e conferir com os totais de referência.
