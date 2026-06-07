<div align="center">
  <img src="icon.png" alt="SGI Boticário Extension Logo" width="128">

  # SGI Boticário - Extensão de Alocação, Recicla e Supervisor

  **Uma extensão nativa (Manifest V3) para otimização, automação e gestão inteligente de revendedores e supervisores no SGI Boticário.**
</div>

---

## 📖 Sobre o Projeto

Esta extensão foi desenvolvida para aprimorar a experiência no sistema SGI Boticário, trazendo recursos de automação de processos, alertas visuais inteligentes e integração nativa com o WhatsApp e Google Sheets. Construída sob a arquitetura moderna do **Manifest V3**, a ferramenta garante maior segurança, estabilidade e armazenamento persistente de dados no navegador.

A interface foi projetada com design **Premium** utilizando **Glassmorphism** (efeito de vidro fosco, sombras suaves e cantos arredondados), proporcionando um visual moderno e não intrusivo.

---

## ✨ Principais Funcionalidades

- **Mapeamento de Supervisores**: Identifica automaticamente a qual supervisor um revendedor pertence e exibe notificações toast (estilo Windows 11) diretamente na tela.
- **Integração Rápida com WhatsApp**: Botões de ação rápida nas notificações para enviar mensagens formatadas e automáticas diretamente para os supervisores via WhatsApp Web.
- **Consulta Inteligente de Retirada**: Verifica dados diretamente de uma planilha do Google Sheets vinculada. O botão de consulta muda de cor dinamicamente (Verde para sem pendências, Vermelho e alerta visual quando há produtos para retirar).
- **Lançamento de Recicla**: Facilita o preenchimento e envio de dados de reciclagem diretamente do SGI para a sua base de dados (Google Sheets) com um único clique.
- **Bypass de CORS Integrado**: Utiliza *Service Workers* em background para garantir que as requisições para o Google Sheets nunca sejam bloqueadas pelo navegador.
- **Armazenamento Seguro**: Configurações sensíveis (URLs de planilhas, mapeamentos, usuários) são armazenadas localmente usando a API `chrome.storage.local`. Dados não são perdidos caso o usuário limpe o cache ou os cookies do site.

---

## 🛠️ Como Funciona?

A extensão é dividida em três partes principais:

1. **Painel Administrativo Privado (Popup do Navegador)**: Onde você configura as conexões sistêmicas, como as URLs dos webhooks do Google Sheets e ativa/desativa os recursos principais da extensão de forma segura.
2. **Background Service Worker**: Roda de forma invisível no navegador para interceptar eventos, fazer chamadas em APIs externas (planilhas) ignorando bloqueios de CORS e gerenciar o fluxo de dados entre abas.
3. **Painel In-Page (Frontend)**: A interface flutuante (estilo "Glassmorphism") injetada dentro das páginas permitidas do SGI Boticário. É por ele que o usuário interage, mapeia supervisores e faz os lançamentos operacionais.

---

## 🚀 Como Instalar

Siga o passo a passo abaixo para instalar a extensão manualmente em seu navegador:

### No Google Chrome:
1. Faça o download ou clone este repositório para o seu computador.
2. Abra o Chrome e acesse na barra de endereços: `chrome://extensions/`
3. No canto superior direito, ative a chave **"Modo do desenvolvedor"**.
4. No canto superior esquerdo, clique no botão **"Carregar sem compactação"** (ou "Load unpacked").
5. Selecione a pasta raiz da extensão (onde encontra-se o arquivo `manifest.json`).
6. A extensão aparecerá na sua lista e já estará pronta para uso! Fixe-a na barra de ferramentas para acesso rápido.

### No Microsoft Edge:
1. Faça o download ou clone este repositório.
2. Abra o Edge e acesse: `edge://extensions/`
3. No menu lateral esquerdo, ative a chave **"Modo do desenvolvedor"**.
4. Clique no botão **"Carregar descompactada"** no topo da tela.
5. Selecione a pasta da extensão.
6. Pronto!

---

## ⚙️ Como Utilizar e Configurar

### 1. Configurações de Integração (Popup)
Clique no ícone da extensão no canto superior direito do seu navegador para abrir o painel privado:

<div align="center">
  <img src="popup_config.png" alt="Painel Administrativo Privado" width="300">
</div>

* **Recursos Ativos**: Você pode ligar/desligar o Mapeamento de Supervisor, o botão de "Lançar Recicla", ou definir se a Consulta de Retirada deve ser manual ou automática.
* **Integração Google Sheets**: Insira a URL do seu App Script (Lançamento de Recicla) e a URL do Script de Consulta (Checagem de Retirada). Clique em "Salvar Planilhas".
* **URLs de Ativação**: A extensão, por padrão, é injetada nas páginas do SGI (`/Paginas/GestaoRede/`). Aqui você pode adicionar outros caminhos de teste caso necessário.

### 2. Configurações da Interface (In-Page SGI)
Acesse a página do SGI Boticário permitida. Um painel flutuante aparecerá no canto inferior direito.

<div align="center">
  <img src="painel_config.png" alt="Configurações In-Page" width="300">
</div>

* Clique no **ícone de engrenagem (⚙️)** para abrir as configurações.
* **Mapeamento de Supervisores**: Insira o nome do Setor/Equipe e o nome do Supervisor responsável. Isso habilitará os alertas ao acessar os dados de um revendedor.
* **Cadastro de Usuários**: Adicione o nome dos colaboradores que utilizarão a ferramenta para assinar os lançamentos na planilha.
* Você também pode ajustar o zoom do painel para melhor adaptação visual.

### 3. Operação no Dia a Dia
* Ao abrir o cadastro de um revendedor, a extensão lerá automaticamente os dados da tela.
* Se configurado, a **notificação do Supervisor** aparecerá no canto da tela informando quem é o responsável por aquele revendedor, com um botão direto para iniciar a conversa no WhatsApp.
* Use os botões do painel flutuante para **Consultar Retiradas** ou registrar uma nova **Recicla**.

---

## 💻 Tecnologias Utilizadas

* **HTML5, CSS3 (Vanilla)** e **JavaScript** puro (sem dependências pesadas).
* **Manifest V3 API**: `chrome.storage`, `chrome.runtime`, `chrome.scripting`, `chrome.action`.
* Design Baseado em **Glassmorphism** e **Modern UI/UX**.

---

## 🔒 Privacidade e Segurança
Todos os dados cadastrados (nomes, URLs de planilhas, mapeamentos) permanecem armazenados **exclusivamente no navegador do usuário local (Local Storage da Extensão)** e nunca são enviados para servidores de terceiros ou monitorados. Apenas ocorre comunicação direta entre a sua máquina e os endpoints do Google Sheets fornecidos por você.
