# WFROZ — versão personalizada

## O que mudou
- Tema escuro/preto com azul saturado no menu.
- Botão para ocultar/mostrar o menu principal.
- Botão de tela cheia.
- Campos de prazo e condições de garantia nas novas ordens.
- Ações na lista de ordens para editar prazo/termos/observações e imprimir relatório + termo de garantia.

## Login Google e acesso compartilhado
O projeto original é estático e salva tudo no `localStorage`, portanto os dados não são compartilhados entre dispositivos. Para login Google real e acesso simultâneo por outras pessoas, é necessário configurar um backend, por exemplo Firebase Authentication (provedor Google) + Cloud Firestore, e definir regras de segurança. Na tela Configurações, o botão “Configurar login Google” explica o passo inicial; ele não ativa o login automaticamente. Não publique dados reais de clientes até configurar autenticação, banco de dados e regras adequadas.

## Publicar
Envie `index.html`, `style.css` e `script.js` para o seu repositório GitHub Pages.
