# Conserta — painel demonstrativo de assistência técnica

Projeto front-end em HTML, CSS e JavaScript, inspirado em um painel de gestão de assistência técnica.

## Arquivos
- `index.html`: estrutura da interface
- `style.css`: estilos responsivos
- `script.js`: navegação, cadastros e armazenamento local

## Como testar
Abra `index.html` no navegador. Para publicar, envie os três arquivos para a raiz de um repositório público no GitHub.

## Publicar no GitHub Pages
1. Crie um repositório público.
2. Envie `index.html`, `style.css` e `script.js` para a raiz.
3. Abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/(root)`, depois clique em **Save**.

## Limitações
Este é um protótipo estático. Os dados ficam no `localStorage` do navegador atual, não em uma base de dados compartilhada. Não use para guardar dados pessoais sensíveis nem como sistema de produção sem backend, autenticação, backups e controles de acesso.

O GitHub Pages é voltado a sites estáticos e tem limitações para serviços comerciais/SaaS. Verifique os termos do serviço antes de usá-lo para operar um sistema de negócio.

## Nota de independência
Projeto demonstrativo independente, sem afiliação com o site original. A implementação foi escrita para este projeto e não é o código-fonte original.
