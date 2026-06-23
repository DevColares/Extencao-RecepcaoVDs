// ==UserScript==
// @name        Radar Botirecicla + Auto Cupom (Nativo SGI com Ícones e Notificações)
// @namespace   Violentmonkey Scripts
// @match       https://sgi.e-boticario.com.br/Paginas/Boticario/B1/PDV/RealizarPedidoPDV.aspx*
// @match       https://sgi.e-boticario.com.br/Paginas/Boticario/B1/PDV/PagamentoRetiradaPDV.aspx*
// @match       https://sgi.e-boticario.com.br/Paginas/Boticario/B1/PDV/PlanoPagamentoPDV.aspx*
// @grant       none
// @version     3.5.0
// @description Otimizado: debounce, cache agressivo, fetch apenas quando necessário.
// ==/UserScript==

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwAJDyqmp24uEn0t6W-_15WkBlKTvpeAefbpVZE3n6lshrHLqMZ-W2l85FX6qeRKnub/exec";

let ultimoNomeVerificado = "";
let verificadorDeTela = null;
let debounceTimer = null; // ✅ NOVO: evita fetch duplicado no setInterval 500ms

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────

const isPaginaPagamento = () =>
    window.location.href.includes("PagamentoRetiradaPDV") ||
    window.location.href.includes("PlanoPagamentoPDV");

function verificarCupomNaTela() {
    for (const chip of document.querySelectorAll(".chip")) {
        if (chip.innerText.includes("BOTIRECICLA5")) return true;
    }
    return false;
}

function verificarNFEmitida() {
    for (const td of document.querySelectorAll("td.td-pedido")) {
        if (td.querySelector("img[src*='bullet-10-verde']") && td.innerText.includes("NF Emitida"))
            return true;
    }
    return false;
}

function pararVerificador() {
    if (verificadorDeTela) { clearInterval(verificadorDeTela); verificadorDeTela = null; }
}

function limparMemoria() {
    pararVerificador();
    ["vd_em_andamento", "vd_cache_status", "vd_cache_nome",
        "vd_cupom_detectado", "vd_usuario_ativo", "vd_notificacao_enviada"]
        .forEach(k => sessionStorage.removeItem(k));
}

function resetarBadge() {
    const badge = document.getElementById("vd-badge");
    const btn = document.getElementById("vd-btn-lancar");
    if (!badge) return;
    badge.innerText = "⏳ AGUARDANDO...";
    badge.className = "vd-padrao";
    if (btn) { btn.innerHTML = "➡️ LANÇAR"; btn.disabled = true; }
}

// ─── NOTIFICAÇÃO ──────────────────────────────────────────────────────────────

function notificarBotiRecicla(nome) {
    if (sessionStorage.getItem("vd_notificacao_enviada") === "true") return;
    if (!("Notification" in window)) return;
    const disparar = () => {
        new Notification("♻️ Boti Recicla Encontrado!", {
            body: `Atenção: ${nome} TEM BOTI RECICLA disponível!`,
            icon: "https://www.boticario.com.br/favicon.ico"
        });
        sessionStorage.setItem("vd_notificacao_enviada", "true");
    };
    if (Notification.permission === "granted") disparar();
    else if (Notification.permission !== "denied")
        Notification.requestPermission().then(p => { if (p === "granted") disparar(); });
}

// ─── SUBSTITUIÇÃO VISUAL ──────────────────────────────────────────────────────

function destacarCupomDisponivelNaTela() {
    let encontrou = false;
    // ✅ Seletor mais restrito: apenas td e span folha (sem filhos)
    for (const el of document.querySelectorAll("td, span")) {
        if (el.children.length > 0 || !el.innerText) continue;
        const txt = el.innerText.toUpperCase();
        if (txt.includes("BOTI RECICLA DISPONÍVEL!")) { encontrou = true; break; }
        if (txt.includes("CUPOM N") && txt.includes("APLICADO")) {
            el.innerText = "✅ BOTI RECICLA DISPONÍVEL!";
            Object.assign(el.style, {
                color: "white", backgroundColor: "#2e7d32",
                padding: "4px 8px", fontWeight: "bold",
                display: "inline-block", borderRadius: "3px"
            });
            encontrou = true;
        }
    }
    return encontrou;
}

// ─── PAINEL ───────────────────────────────────────────────────────────────────

function injetarPainel() {
    if (document.getElementById("painelVD-completo")) return;
    const painel = document.createElement("div");
    painel.id = "painelVD-completo";
    painel.innerHTML = `
  <style>
    #painelVD-completo{position:fixed;bottom:24px;right:24px;z-index:10000;font-family:Arial,Helvetica,sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:8px;transition:transform .2s ease-out}
    #vd-row{display:flex;align-items:center;gap:8px}
    .vd-padrao{height:38px;display:flex;align-items:center;justify-content:center;gap:6px;background:#fff;color:#1a47d4;border:1px solid #1a47d4;box-sizing:border-box;font-weight:bold;font-size:13px;text-transform:uppercase;padding:0 15px;cursor:pointer;transition:background-color .2s;box-shadow:0 2px 4px rgba(0,0,0,.05)}
    .vd-padrao:hover:not(:disabled):not(#vd-badge){background:#f2f5ff}
    .vd-padrao:disabled{border-color:#ccc;color:#999;background:#f9f9f9;cursor:not-allowed}
    .vd-btn-icone{padding:0 10px;font-size:16px}
    #vd-badge{cursor:default}
    #vd-config{background:#fff;border:1px solid #ccc;padding:12px;width:250px;display:none;flex-direction:column;gap:8px;box-shadow:0 4px 10px rgba(0,0,0,.15)}
    #vd-config label{color:#333;font-size:11px;font-weight:bold;text-transform:uppercase}
    #vd-config input,#vd-config select{background:#fff;border:1px solid #ccc;color:#333;font-size:12px;padding:6px;outline:none}
    #vd-config input:focus,#vd-config select:focus{border-color:#1a47d4}
    #vd-config button.btn-sgi{background:#fff;color:#1a47d4;border:1px solid #1a47d4;font-size:14px;padding:4px 10px;cursor:pointer;font-weight:bold;transition:.2s}
    #vd-config button.btn-sgi:hover{background:#f2f5ff}
    #vd-del-user{background:#fff;color:#d32f2f;border:1px solid #d32f2f;font-size:12px;padding:4px 8px;cursor:pointer;font-weight:bold;transition:.2s}
    #vd-del-user:hover{background:#ffebee}
    .vd-alerta{border-color:#e65100!important;color:#e65100!important}
    .vd-bloqueado{border-color:#c62828!important;color:#c62828!important}
    .vd-cupom{border-color:#1565c0!important;color:#1565c0!important}
    .vd-livre{border-color:#2e7d32!important;color:#2e7d32!important}
  </style>
  <div id="vd-config">
    <label>LANÇADO POR:</label>
    <div style="display:flex;gap:6px;margin-bottom:2px">
      <select id="vd-usuario-select" style="flex:1"></select>
      <button id="vd-del-user" title="Excluir nome">🗑️</button>
    </div>
    <div style="display:flex;gap:6px">
      <input type="text" id="vd-novo-user" placeholder="Novo nome..." style="flex:1">
      <button id="vd-add-user" class="btn-sgi" title="Adicionar">➕</button>
    </div>
    <div style="height:1px;background:#eee;margin:6px 0"></div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <label style="margin:0">ESCALA:</label>
      <div style="display:flex;gap:6px;align-items:center">
        <button id="vd-zoom-out" class="btn-sgi" style="padding:2px 8px">-</button>
        <span id="vd-zoom-level" style="color:#333;font-size:12px;font-weight:bold;width:35px;text-align:center">100%</span>
        <button id="vd-zoom-in" class="btn-sgi" style="padding:2px 8px">+</button>
      </div>
    </div>
  </div>
  <div id="vd-row">
    <button id="vd-btn-refresh" class="vd-padrao vd-btn-icone" title="Atualizar">🔄</button>
    <button id="vd-gear"        class="vd-padrao vd-btn-icone" title="Configurações">⚙️</button>
    <div    id="vd-badge"       class="vd-padrao">⏳ AGUARDANDO...</div>
    <button id="vd-btn-lancar"  class="vd-padrao" title="Lançar na Planilha" disabled>➡️ LANÇAR</button>
  </div>`;
    document.body.appendChild(painel);

    let currentScale = parseFloat(localStorage.getItem("vd_scale")) || 1.0;
    const updateScale = () => {
        painel.style.transform = `scale(${currentScale})`;
        painel.style.transformOrigin = "bottom right";
        document.getElementById("vd-zoom-level").innerText = Math.round(currentScale * 100) + "%";
    };

    document.getElementById("vd-zoom-in").addEventListener("click", () => {
        currentScale = Math.min(currentScale + 0.1, 2.0);
        localStorage.setItem("vd_scale", currentScale);
        updateScale();
    });
    document.getElementById("vd-zoom-out").addEventListener("click", () => {
        currentScale = Math.max(currentScale - 0.1, 0.5);
        localStorage.setItem("vd_scale", currentScale);
        updateScale();
    });
    updateScale();

    document.getElementById("vd-gear").addEventListener("click", () => {
        const cfg = document.getElementById("vd-config");
        cfg.style.display = cfg.style.display === "flex" ? "none" : "flex";
    });
    document.getElementById("vd-btn-refresh").addEventListener("click", () => {
        const nome = obterNomeRevendedor();
        if (!nome) { alert("⚠️ Nenhum revendedor carregado na tela."); return; }
        sessionStorage.removeItem("vd_cache_status");
        sessionStorage.removeItem("vd_notificacao_enviada");
        vdVerificar(nome, true);
    });
    document.getElementById("vd-add-user").addEventListener("click", vdSalvarUsuario);
    document.getElementById("vd-del-user").addEventListener("click", vdExcluirUsuario);
    document.getElementById("vd-btn-lancar").addEventListener("click", vdLancarDados);

    vdCarregarUsuarios();
}

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────

function vdCarregarUsuarios() {
    const users = JSON.parse(localStorage.getItem("vd_users") || "[]");
    const select = document.getElementById("vd-usuario-select");
    select.innerHTML = "";
    if (!users.length) {
        const opt = Object.assign(document.createElement("option"), { value: "", text: "Cadastre um nome...", disabled: true, selected: true });
        select.appendChild(opt);
    } else {
        users.forEach(u => select.appendChild(Object.assign(document.createElement("option"), { value: u, text: u })));
    }
}

function vdSalvarUsuario() {
    const input = document.getElementById("vd-novo-user");
    const nome = input.value.trim().toUpperCase();
    if (!nome) return;
    const users = JSON.parse(localStorage.getItem("vd_users") || "[]");
    if (!users.includes(nome)) { users.push(nome); localStorage.setItem("vd_users", JSON.stringify(users)); }
    input.value = "";
    vdCarregarUsuarios();
}

function vdExcluirUsuario() {
    const select = document.getElementById("vd-usuario-select");
    const nome = select.value;
    if (!nome || !confirm(`Excluir "${nome}"?`)) return;
    const users = JSON.parse(localStorage.getItem("vd_users") || "[]").filter(u => u !== nome);
    localStorage.setItem("vd_users", JSON.stringify(users));
    vdCarregarUsuarios();
}

// ─── REVENDEDOR ───────────────────────────────────────────────────────────────

function obterNomeRevendedor() {
    const el1 = document.getElementById("content_textNomePessoa");
    if (el1?.innerText.trim()) return el1.innerText.trim();

    const el2 = document.querySelector(".client-name");
    if (el2) {
        const linhas = el2.innerText.trim().split("\n");
        return linhas[linhas.length - 1].trim();
    }

    return isPaginaPagamento() ? (sessionStorage.getItem("vd_cache_nome") || "") : "";
}

// ─── VERIFICAÇÃO PRINCIPAL ────────────────────────────────────────────────────

async function vdVerificar(nomeCompleto, forcarConsulta = false) {
    const badge = document.getElementById("vd-badge");
    const btnLancar = document.getElementById("vd-btn-lancar");
    const btnRefresh = document.getElementById("vd-btn-refresh");
    const primeiroNome = nomeCompleto.split(" ")[0] || "REVENDEDOR";

    // ✅ Limpa memória se mudou de revendedor
    if (sessionStorage.getItem("vd_cache_nome") !== nomeCompleto) limparMemoria();
    sessionStorage.setItem("vd_cache_nome", nomeCompleto);

    if (sessionStorage.getItem("vd_em_andamento") === "true") {
        iniciarVerificacaoFinal(nomeCompleto); return;
    }
    if (sessionStorage.getItem("vd_cupom_detectado") === "true") {
        badge.innerText = "🎟️ CUPOM LANÇADO"; badge.className = "vd-padrao vd-cupom";
        btnLancar.disabled = true; return;
    }

    const cacheStatus = sessionStorage.getItem("vd_cache_status");
    if (!forcarConsulta && cacheStatus) {
        aplicarStatusCache(cacheStatus, primeiroNome, btnLancar, badge); return;
    }

    badge.innerText = "⏳ VERIFICANDO..."; badge.className = "vd-padrao";
    btnLancar.disabled = true; btnRefresh.disabled = true;

    try {
        // ✅ Sem 'codigo' no GET — Apps Script não usa
        const resp = await fetch(`${WEBHOOK_URL}?nome=${encodeURIComponent(nomeCompleto)}`);
        const dados = await resp.json();

        if (dados.utilizado) {
            sessionStorage.setItem("vd_cache_status", "BLOQUEADO");
            badge.innerText = "🚫 JÁ UTILIZOU NESTE CICLO"; badge.className = "vd-padrao vd-bloqueado";
            btnLancar.disabled = true;
        } else if (dados.encontrado) {
            sessionStorage.setItem("vd_cache_status", "ALERTA");
            badge.innerText = `⚠️ ${primeiroNome} TEM BOTI`; badge.className = "vd-padrao vd-alerta";
            btnLancar.disabled = false;
            notificarBotiRecicla(primeiroNome);
        } else {
            sessionStorage.setItem("vd_cache_status", "LIVRE");
            badge.innerText = `✅ ${primeiroNome} NÃO TEM BOTI`; badge.className = "vd-padrao vd-livre";
            btnLancar.disabled = true;
        }

        // ✅ NOVO: checa retirada pendente e exibe aviso extra no badge
        if (dados.temRetirada) {
            badge.innerText += " · 📦 RETIRADA";
        }

    } catch (_) {
        badge.innerText = "❌ ERRO DE CONEXÃO"; badge.className = "vd-padrao vd-bloqueado";
    } finally {
        btnRefresh.disabled = false;
    }
}

function aplicarStatusCache(status, primeiroNome, btnLancar, badge) {
    const map = {
        BLOQUEADO: ["🚫 JÁ UTILIZOU NESTE CICLO", "vd-bloqueado", true],
        ALERTA: [`⚠️ ${primeiroNome} TEM BOTI`, "vd-alerta", false],
        LIVRE: [`✅ ${primeiroNome} NÃO TEM BOTI`, "vd-livre", true],
    };
    const [txt, cls, disabled] = map[status] || map.LIVRE;
    badge.innerText = txt; badge.className = `vd-padrao ${cls}`;
    btnLancar.disabled = disabled;
    if (status === "ALERTA") notificarBotiRecicla(primeiroNome);
}

// ─── LANÇAR CUPOM ─────────────────────────────────────────────────────────────

async function vdLancarDados() {
    const usuario = document.getElementById("vd-usuario-select").value;
    if (!usuario) {
        alert("⚙️ Selecione ou cadastre quem está lançando o cupom.");
        document.getElementById("vd-config").style.display = "flex";
        return;
    }

    const campoTexto = document.getElementById("content_txtCupomDesconto_Tb1");
    const botaoValidar = document.getElementById("I3");
    if (!campoTexto || !botaoValidar) {
        alert("⚠️ Campo de cupom não encontrado. Vá para a aba de itens do pedido.");
        return;
    }

    const nome = obterNomeRevendedor();
    sessionStorage.setItem("vd_em_andamento", "true");
    sessionStorage.setItem("vd_usuario_ativo", usuario);

    campoTexto.value = "BOTIRECICLA5";
    campoTexto.dispatchEvent(new Event("input", { bubbles: true }));
    campoTexto.dispatchEvent(new Event("change", { bubbles: true }));
    botaoValidar.click();

    iniciarVerificacaoFinal(nome);
}

// ─── VERIFICAÇÃO FINAL ────────────────────────────────────────────────────────

function iniciarVerificacaoFinal(nomeRevendedor) {
    if (verificadorDeTela) return;
    const badge = document.getElementById("vd-badge");
    const btn = document.getElementById("vd-btn-lancar");
    let tentativas = 0;

    const cupomJaSalvo = sessionStorage.getItem("vd_cupom_detectado") === "true";
    badge.innerText = cupomJaSalvo
        ? (isPaginaPagamento() ? "🎟️ CUPOM OK - AGUARDANDO NF" : "🎟️ CUPOM LANÇADO")
        : "⏳ AGUARDANDO CUPOM...";
    badge.className = `vd-padrao ${cupomJaSalvo ? "vd-cupom" : "vd-alerta"}`;
    btn.innerHTML = "⏳ PROCESSANDO";
    btn.disabled = true;

    verificadorDeTela = setInterval(async () => {
        tentativas++;
        const cupomNaTela = verificarCupomNaTela();
        const cupomSalvo = sessionStorage.getItem("vd_cupom_detectado") === "true";

        if (!cupomNaTela && !cupomSalvo && tentativas > 15) {
            alert("⏱️ Tempo esgotado: cupom não detectado. Destravando painel.");
            limparMemoria();
            vdVerificar(nomeRevendedor, true);
            return;
        }

        if (cupomNaTela && !cupomSalvo) {
            sessionStorage.setItem("vd_cupom_detectado", "true");
            badge.className = "vd-padrao vd-cupom";
            badge.innerText = isPaginaPagamento() ? "🎟️ CUPOM OK - AGUARDANDO NF" : "🎟️ CUPOM LANÇADO";
        }

        if (!isPaginaPagamento()) return;

        if ((cupomNaTela || cupomSalvo) && verificarNFEmitida()) {
            clearInterval(verificadorDeTela); verificadorDeTela = null;
            badge.innerText = "✅ ENVIANDO P/ PLANILHA"; badge.className = "vd-padrao vd-livre";

            const usuarioMemoria = sessionStorage.getItem("vd_usuario_ativo") || "DESCONHECIDO";
            try {
                // ✅ POST envia apenas nome + usuario (codigo removido — Apps Script não usa)
                await fetch(WEBHOOK_URL, {
                    method: "POST", mode: "no-cors",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ nome: nomeRevendedor, usuario: usuarioMemoria })
                });

                sessionStorage.removeItem("vd_em_andamento");
                sessionStorage.removeItem("vd_cupom_detectado");
                sessionStorage.setItem("vd_cache_status", "BLOQUEADO");

                btn.innerHTML = "✅ SUCESSO!";
                setTimeout(() => { btn.innerHTML = "➡️ LANÇAR"; vdVerificar(nomeRevendedor, true); }, 2000);

            } catch (_) {
                alert("❌ Erro ao enviar para a planilha.");
                sessionStorage.removeItem("vd_em_andamento");
                btn.innerHTML = "➡️ LANÇAR"; btn.disabled = false;
                vdVerificar(nomeRevendedor, true);
            }
        }
    }, 1000);
}

// ─── OLHEIRO PRINCIPAL (com debounce) ────────────────────────────────────────

injetarPainel();

setInterval(() => {
    const cupomSGI = destacarCupomDisponivelNaTela();
    const nomeAtual = obterNomeRevendedor();
    const painel = document.getElementById("painelVD-completo");

    if (painel) {
        const status = sessionStorage.getItem("vd_cache_status");
        const emAndamento = sessionStorage.getItem("vd_em_andamento") === "true";
        const cupomLancado = sessionStorage.getItem("vd_cupom_detectado") === "true";
        const scale = parseFloat(localStorage.getItem("vd_scale")) || 1.0;

        // ✅ Esconde painel apenas quando realmente desnecessário
        painel.style.transform = (isPaginaPagamento() && !emAndamento &&
            (status === "LIVRE" || status === "BLOQUEADO") && !cupomSGI)
            ? "scale(0)" : `scale(${scale})`;

        const badge = document.getElementById("vd-badge");
        const btnLancar = document.getElementById("vd-btn-lancar");
        if (cupomSGI && !emAndamento && !cupomLancado && badge?.innerText !== "✅ CUPOM DISPONÍVEL NA TELA!") {
            badge.innerText = "✅ CUPOM DISPONÍVEL NA TELA!";
            badge.className = "vd-padrao vd-livre";
            if (btnLancar) btnLancar.disabled = false;
        }
    }

    if (!nomeAtual && ultimoNomeVerificado) {
        limparMemoria(); ultimoNomeVerificado = ""; resetarBadge(); return;
    }

    if (nomeAtual && !isPaginaPagamento()) {
        const cupomNaTela = verificarCupomNaTela();
        const cupomNaMemoria = sessionStorage.getItem("vd_cupom_detectado") === "true";
        if (cupomNaMemoria && !cupomNaTela) {
            pararVerificador();
            sessionStorage.removeItem("vd_em_andamento");
            sessionStorage.removeItem("vd_cupom_detectado");
            ultimoNomeVerificado = "";
        }
    }

    // ✅ DEBOUNCE: só dispara vdVerificar se nome mudou e nenhum timer pendente
    if (nomeAtual && nomeAtual !== ultimoNomeVerificado) {
        ultimoNomeVerificado = nomeAtual;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => vdVerificar(nomeAtual), 300);
    }
}, 500);