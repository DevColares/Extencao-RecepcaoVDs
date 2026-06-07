// Service Worker da Extensão - SGI Boticário
// Responsável por contornar problemas de CORS fazendo as requisições em segundo plano.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetch") {
    const { url, options } = request;

    // Configurações padrão de segurança do fetch na extensão
    const fetchOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
      ...options
    };

    fetch(url, fetchOptions)
      .then(async (response) => {
        const responseText = await response.text();
        sendResponse({
          success: true,
          status: response.status,
          statusText: response.statusText,
          text: responseText
        });
      })
      .catch((error) => {
        console.error("Erro na requisição em background:", error);
        sendResponse({
          success: false,
          error: error.message || "Erro de conexão ou rede"
        });
      });

    return true; // Mantém a porta de comunicação aberta para envio assíncrono
  }
});
