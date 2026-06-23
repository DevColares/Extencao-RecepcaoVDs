const fs = require('fs');
const path = require('path');

// 1. Setup Mock DOM and Browser APIs
global.window = global;
global.document = {
    getElementById: (id) => ({
        id: id,
        innerText: "",
        innerHTML: "",
        className: "",
        disabled: false,
        style: {}
    }),
    querySelector: (selector) => {
        // Simulando que o cupom aparece após a tentativa 3
        if (mockTentativasAtual >= 3) {
            return { classList: ['cupom-aplicado'] };
        }
        return null;
    },
    body: {
        innerText: ""
    }
};

global.sessionStorage = {
    store: {
        "vd_nome_cliente": "Maria Teste",
        "vd_codigo_cliente": "123456",
        "vd_em_andamento": "true"
    },
    getItem: function(key) { return this.store[key] || null; },
    setItem: function(key, value) { this.store[key] = value.toString(); },
    removeItem: function(key) { delete this.store[key]; }
};

global.alert = (msg) => console.log(`[ALERT]: ${msg}`);
global.fetch = async (url, options) => {
    console.log(`\n[FETCH] POST enviado para ${url}`);
    console.log(`[FETCH] Dados: ${options.body}`);
    return { status: 200 };
};

// 2. Setup SGI Namespace Mocks
global.window.SGI = {
    state: { configCaixaAtivo: "Operador Teste" },
    helpers: {
        getUrlRecicla: () => "https://exemplo-webhook.com",
        vdStatus: (msg, color) => console.log(`[SGI.helpers.vdStatus] ${msg}`)
    }
};

let mockTentativasAtual = 0;

// 3. Carregar o arquivo caixa.js
const caixaJsPath = path.join(__dirname, 'src', 'features', 'caixa.js');
const caixaJsCode = fs.readFileSync(caixaJsPath, 'utf8');

// Executar o código do caixa.js no nosso ambiente global
eval(caixaJsCode);

// 4. Sobrescrever funções do caixa.js que dependem de DOM complexo
window.SGI.caixa.isPaginaPagamento = () => true; 
window.SGI.caixa.verificarNFEmitida = () => mockTentativasAtual >= 5;
window.SGI.caixa.verificarReciclaCaixa = (nome, cod) => console.log(`[SGI.caixa.verificarReciclaCaixa] Chamado para ${nome}`);

// Sobrescrever setInterval para controlar as tentativas no nosso mock
const originalSetInterval = global.setInterval;
global.setInterval = (fn, delay) => {
    return originalSetInterval(() => {
        mockTentativasAtual++;
        console.log(`\n--- Tentativa ${mockTentativasAtual} ---`);
        fn();
    }, 500); // rodando mais rápido para o teste (500ms)
};

// Sobrescrever setTimeout
const originalSetTimeout = global.setTimeout;
global.setTimeout = (fn, delay) => {
    console.log(`[TIMEOUT] Agendado para daqui a ${delay}ms`);
    return originalSetTimeout(() => {
        fn();
        console.log("FIM DO TESTE.");
        process.exit(0);
    }, 500); // Acelerado
};


// 5. Iniciar Teste
console.log("=== INICIANDO TESTE DO CAIXA.JS ===");
window.SGI.caixa.iniciarVerificacaoFinal();
