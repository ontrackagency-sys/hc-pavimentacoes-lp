# HC Pavimentação — LP de anúncios (Google Ads)

LP estática: `index.html` + `assets/`. Sem build para publicar. Objetivo: o visitante pede orçamento de **bloquete, meio-fio e calçada** no DF e cai no WhatsApp do Caio, (61) 98288-7450, com a mensagem pronta (nome, serviço, região, metragem). Também tem botão de ligar.

## Rodar local
    python3 -m http.server 8777    # abrir http://localhost:8777

## Como foi feita
- `tools/index.template.html` + figura isométrica (kit Anatomy) → `index.html`
- Para regenerar: `node tools/figure.mjs && node tools/build.mjs` (a figura usa o kit em `~/.agents/skills/anatomy`)
- Não edite o `index.html` à mão: ele é gerado. Edite o template (ou `tools/figure.mjs` para a figura).

## Rastreamento (tudo em `CONFIG`, no fim do `index.html`/template)
Campos vazios = nenhuma tag carrega. Preencher: `AW_ID`, `AW_LABEL_WHATSAPP`, `AW_LABEL_FONE`, `AW_LABEL_FORM`, `GA4_ID`, `META_PIXEL_ID`.
Conversões: clique no WhatsApp, clique em ligar e formulário enviado (cada um com seu rótulo).

## Fotos
Salvar `assets/obra-1.jpg` … `obra-6.jpg`; a seção "Obras da HC" aparece sozinha. Prompts do ChatGPT em `PROMPTS-CHATGPT.md`.

## Pendências (precisam do cliente)
1. Conta/ID do Google Ads, rótulos de conversão, GA4 e domínio.
2. Fotos reais de obras (trocar as de IA).
3. CNPJ e endereço/área de atuação para o rodapé (opcional, mas ajuda a confiança no anúncio).
4. Confirmar com o Caio: pode ou não prometer "orçamento sem compromisso", prazo de resposta, visita técnica? (a página não promete nada disso).
5. Se publicar na Vercel: Root Directory = esta pasta.
