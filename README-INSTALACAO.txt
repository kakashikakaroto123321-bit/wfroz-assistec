WFROZ + FIREBASE — PACOTE UNIFICADO

ANTES DE USAR: este pacote já inclui a interface original, estilos, logo, login Google e sincronização básica de ordens/clientes/técnicos em um documento Firestore. Você ainda precisa colocar a configuração do SEU projeto Firebase. Não há como eu criar isso sem acesso à sua conta Google/Firebase.

1) Crie um projeto em https://console.firebase.google.com/ e registre um app Web.
2) Ative Authentication > Sign-in method > Google.
3) Crie o Firestore Database.
4) Copie firebase-config.example.js para firebase-config.js e preencha apiKey, authDomain, projectId e appId com a configuração real exibida no Firebase.
5) Publique firestore.rules em Firestore > Rules.
6) Sirva a pasta por HTTP (não abra index.html com file://). Exemplo: abra terminal na pasta e execute: python -m http.server 8000. Acesse http://localhost:8000.
7) Para criar o primeiro administrador: entre uma vez com Google em auth-demo não é necessário; use a aplicação, copie o UID pelo Authentication > Users no Console Firebase. Crie manualmente Firestore: businesses/minha-assistencia (campo name = Minha assistência) e subcoleção members/{UID} com role=admin, active=true, displayName e email.
8) Saia/entre novamente no app. Funcionários também precisam entrar com Google e ter documento members/{UID} com role=employee e active=true.

IMPORTANTE: a configuração Firebase web não é uma chave privada. Nunca publique service account/private keys.

LIMITAÇÕES DESTA PRIMEIRA INTEGRAÇÃO:
- O app mantém backup local e grava uma cópia sincronizada na nuvem ao salvar; o carregamento da nuvem ocorre ao conectar. Não é sincronização em tempo real entre telas abertas.
- A base de dados atual é um documento único appData/main. Como o financeiro é calculado a partir dos valores das ordens, funcionários com acesso aos dados operacionais também podem ter acesso a esses valores. Antes de usar com funcionários/dados reais, o ideal é migrar para coleções separadas com regras por papel e adicionar testes.
- Não importe dados reais sem exportar primeiro o backup JSON.
- Se aparecer erro de configuração, revise firebase-config.js, domínio autorizado e Rules.
