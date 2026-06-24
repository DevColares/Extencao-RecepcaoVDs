function doPost(e) {
  try {
    const spreadsheetId = "1MpRgyC5PzHrKdjcf4cxCcsN9Kf4yy0AO3CLZMLjcHx8";
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();

    const contents      = JSON.parse(e.postData.contents);
    const nome          = contents.nome || "";
    const usuario       = contents.usuario;
    const codRevendedor = contents.codigo || "";
    const origem        = contents.origem || "recepcao";
    const dataAtual     = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

    const INICIAL     = 4;
    const ultimaLinha = Math.max(sheet.getLastRow(), INICIAL);
    const totalLinhas = ultimaLinha - INICIAL + 1;

    const dados = sheet.getRange(INICIAL, 2, totalLinhas, 4).getValues();

    // Normaliza o codigo removendo pontos e espacos para comparacao segura
    const codEnviado = codRevendedor.toString().replace(/\./g, "").replace(/\s/g, "").trim();

    let linhaDestino  = -1;
    let jaExiste      = false;
    let primeiraVazia = -1;

    for (let i = 0; i < dados.length; i++) {
      if (primeiraVazia === -1 && dados[i][0].toString().trim() === "") {
        primeiraVazia = i + INICIAL;
      }

      // Busca exclusivamentre por nome
      const nomeLimpo    = nome.toString().trim().toUpperCase();
      const nomePlanilha = dados[i][2].toString().trim().toUpperCase();
      const bateNome     = nomeLimpo && nomeLimpo !== "CAIXA AVULSO" && nomePlanilha === nomeLimpo;

      if (bateNome) {
        linhaDestino = i + INICIAL;
        jaExiste = true;
        break;
      }
    }

    if (jaExiste) {
      // recepcao -> coluna E (RECEBIDO POR) | caixa -> coluna F (LANCADO POR)
      const coluna = (origem === "caixa") ? 6 : 5;
      const cell = sheet.getRange(linhaDestino, coluna);
      cell.setValue(usuario);
      cell.setHorizontalAlignment("center").setVerticalAlignment("middle");

    } else if (origem !== "caixa") {
      // Caixa NUNCA cria linha nova - so atualiza linha existente da recepcao.
      // Recepcao pode inserir linha nova se o revendedor ainda nao consta.
      linhaDestino = primeiraVazia !== -1 ? primeiraVazia : ultimaLinha + 1;

      const nomeLimpo = nome.toString().trim().toUpperCase();
      const range = sheet.getRange(linhaDestino, 2, 1, 4);
      range.setValues([[dataAtual, codRevendedor, nomeLimpo, usuario]]);
      range.setHorizontalAlignment("center").setVerticalAlignment("middle");

    } else {
      // Caixa não encontrou o revendedor pelo nome — retorna aviso sem alterar planilha
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "nao_encontrado",
          message: "Revendedor com nome '" + nome + "' não encontrado na planilha."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    SpreadsheetApp.flush();

    return ContentService
      .createTextOutput(JSON.stringify({ status: jaExiste ? "atualizado" : "inserido", linha: linhaDestino }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


function doGet(e) {
  try {
    const nomeBuscado = e.parameter.nome;
    if (!nomeBuscado) {
      return ContentService
        .createTextOutput(JSON.stringify({ encontrado: false, utilizado: false }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const nomeLimpo = nomeBuscado.toString().trim().toUpperCase();

    const spreadsheetId  = "1MpRgyC5PzHrKdjcf4cxCcsN9Kf4yy0AO3CLZMLjcHx8";
    const sheetPrincipal = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    const INICIAL        = 4;
    const ultimaLinha    = sheetPrincipal.getLastRow();

    let encontrado = false;
    let utilizado  = false;

    if (ultimaLinha >= INICIAL) {
      // Leitura de 3 colunas: D (Nome), E (Recebido Por), F (Lancado Por)
      const valores = sheetPrincipal
        .getRange(INICIAL, 4, ultimaLinha - INICIAL + 1, 3)
        .getValues();

      for (let i = 0; i < valores.length; i++) {
        const nomePlanilha = valores[i][0].toString().trim().toUpperCase(); // Coluna D (indice 0)

        if (nomePlanilha === nomeLimpo && nomePlanilha !== "") {
          encontrado = true;
          // Coluna F (indice 2) - preenchida pelo caixa apos o lancamento
          const lancadoPor = valores[i][2].toString().trim().toUpperCase();

          if (lancadoPor !== "" &&
              lancadoPor !== "CUPOM NAO APLICADO" &&
              lancadoPor !== "NAO LANCADO") {
            utilizado = true;
          }
          break;
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ encontrado, utilizado }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ erro: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
