// File: js/ocr-service.js
// Módulo para lidar com a funcionalidade de OCR (Optical Character Recognition)
// usando Tesseract.js.

// Certificar-se de que o Tesseract está disponível globalmente a partir do CDN
const { Tesseract } = window;

// Idiomas a serem usados para reconhecimento. 'por' para português.
const OCR_LANGUAGES = 'por+eng';

/**
 * Inicializa o Tesseract Worker para realizar o OCR.
 * @param {Function} progressCallback - Função para ser chamada com o progresso (0 a 1).
 * @returns {Promise<Tesseract.Worker>} Instância do worker do Tesseract.
 */
async function createOcrWorker(progressCallback) {
    try {
        const worker = await Tesseract.createWorker(OCR_LANGUAGES, 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    progressCallback(m.progress);
                }
                console.log('[OCR]', m);
            },
        });
        return worker;
    } catch (error) {
        console.error('Erro ao criar o worker do Tesseract:', error);
        throw new Error('Não foi possível iniciar o serviço de OCR.');
    }
}

/**
 * Processa uma imagem e extrai o texto usando OCR.
 * @param {File} imageFile - O arquivo de imagem a ser processado.
 *param {Function} onProgress - Callback para atualizar o progresso (recebe um valor de 0 a 1).
 * @returns {Promise<string>} O texto reconhecido da imagem.
 */
export async function recognizeText(imageFile, onProgress) {
    let worker;
    try {
        // Mostrar uma mensagem inicial no progresso
        onProgress({ status: 'iniciando', progress: 0 });

        // Criar o worker
        worker = await createOcrWorker(progress => {
            onProgress({ status: 'reconhecendo', progress });
        });

        // Reconhecer o texto da imagem
        const { data: { text } } = await worker.recognize(imageFile);

        // Progresso final
        onProgress({ status: 'concluido', progress: 1 });

        console.log('Texto reconhecido:', text);
        return text;

    } catch (error) {
        console.error('Erro durante o reconhecimento de texto:', error);
        // Notificar sobre o erro
        onProgress({ status: 'erro', progress: 0, message: error.message });
        throw new Error('Falha ao reconhecer o texto da imagem.');

    } finally {
        // Encerrar o worker para liberar recursos, se ele foi criado
        if (worker) {
            await worker.terminate();
            console.log('Worker do Tesseract finalizado.');
        }
    }
}

console.log('OCR Service Module (ocr-service.js) carregado.');
