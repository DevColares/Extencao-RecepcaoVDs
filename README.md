# SGI Boticário - Extensão de Alocação, Recicla e Supervisor (Manifest V3)

Esta é a versão oficial da sua ferramenta para o SGI Boticário, agora empacotada como uma **Extensão de Navegador Nativa (Chrome e Edge)**!

Desenvolvida com a tecnologia moderna **Manifest V3**, esta extensão oferece maior confiabilidade nas integrações, armazenamento de dados 100% seguro (que não some se você limpar os dados do site) e uma interface **Premium com Glassmorphism** (efeito de vidro fosco, cantos arredondados e transições suaves).

---

## 🚀 Como Instalar a Extensão no seu Navegador

Siga estes passos simples para carregar a extensão no Google Chrome ou no Microsoft Edge:

### No Google Chrome:
1. Abra o Chrome e acesse o endereço: `chrome://extensions/`
2. No canto superior direito, ative a chave **"Modo do desenvolvedor"**.
3. No canto superior esquerdo, clique no botão **"Carregar sem compactação"** (ou "Load unpacked").
4. Selecione a pasta onde os arquivos desta extensão estão salvos:
   `c:\Users\Andelison Colares\Documents\Extenção`
5. Pronto! A extensão aparecerá na lista e já estará ativa.

### No Microsoft Edge:
1. Abra o Edge e acesse o endereço: `edge://extensions/`
2. No menu lateral esquerdo, ative a chave **"Modo do desenvolvedor"** (Developer mode).
3. Clique no botão **"Carregar descompactada"** (Load unpacked) que aparecerá no topo da tela.
4. Selecione a pasta da extensão:
   `c:\Users\Andelison Colares\Documents\Extenção`
5. Pronto!

---

## 🔒 Painel Administrativo Privado (Configurações Ocultas)

Para garantir segurança máxima, total privacidade e controle operacional sobre as automações, todas as configurações sensíveis da extensão foram **removidas do frontend do site** e movidas para o **Painel Administrativo Privado da Extensão** (acessado clicando no ícone do Boticário na barra de ferramentas do seu navegador, no canto superior direito).

### O que você configura no Popup Privado:

1. **🔧 Recursos Ativos (Ativar/Desativar Funções)**:
   - **Mapeamento de Supervisor**: Ativa ou desativa completamente o display do supervisor e as notificações Toast estilo Windows na tela.
   - **Consulta Automática de Retirada**: Se ativado, a consulta ocorre de forma automática sempre que você mudar de revendedor na tela. Se desativado, o painel economiza requisições da sua planilha, e você poderá fazer a consulta de retirada clicando manualmente no botão a hora que quiser!
   - **Lançamento de Recicla (Botão)**: Mostra ou oculta o botão de "Lançar Recicla" no painel.
   - *Nota: As configurações são salvas e aplicadas instantaneamente! Basta recarregar a página da web para ver o efeito.*

2. **📊 Integração Google Sheets**:
   - Insira a **URL Lançamento Recicla** (seu Apps Script de gravação).
   - Insira a **URL Consulta Retirada** (seu Apps Script de checagem).
   - Clique em **"Salvar Planilhas"**.

3. **🌐 URLs de Ativação (Onde ela deve aparecer)**:
   - Por padrão, a extensão só se ativa em páginas que contêm o caminho: `/Paginas/GestaoRede/`.
   - Você pode digitar qualquer outro caminho de URL de teste (como `google.com` ou portais de homologação) e clicar em **"Adicionar"**.
   - A extensão rodará de forma 100% silenciosa na aba e só injetará a interface e os monitores se a URL atual corresponder a algum dos caminhos cadastrados por você no popup.

---

## ⚙️ Como Configurar Mapeamentos e Usuários no Painel In-Page

Na página autorizada (Ex: página do SGI Boticário), você verá o painel flutuante elegante no canto inferior direito.

1. Clique no ícone de engrenagem (**⚙️**).
2. **Mapeamento de Supervisores**:
   - Cadastre a estrutura (Ex: `Setor 1`) e o respectivo supervisor.
   - Clique em **"Adicionar Mapeamento"**.
3. **Cadastro de Usuários**:
   - Cadastre os nomes dos usuários que farão lançamentos no painel inferior.
   - Selecione o usuário ativo no menu suspenso.
4. Ajuste o **Tamanho do Painel** (zoom de 70% a 120%) se desejar e clique novamente na engrenagem (**⚙️**) para ocultar o menu.

---

## 🎨 Principais Recursos e Diferenciais

* **Proteção Total contra Perda de Dados**: Usamos a API nativa `chrome.storage.local`. Seus cadastros de supervisores, usuários e URLs de planilhas ficam salvos de forma independente no navegador e nunca são limpos juntamente com os cookies do site.
* **Bypass de CORS Integrado**: A extensão faz as consultas e os lançamentos em segundo plano através de um *Service Worker*, eliminando erros de requisições bloqueadas pelo site ou navegador.
* **Notificação Premium Estilo Windows 11**: O alerta do supervisor foi desenhado para se parecer com as notificações nativas do sistema, com direito a efeitos de foco e botão direto para enviar a mensagem formatada no WhatsApp.
* **Botão "Consultar Retirada" Inteligente**: Muda de cor dinamicamente (Verde elegante se estiver sem retirada, Vermelho brilhante e aviso visual chamativo se houver retirada disponível).
