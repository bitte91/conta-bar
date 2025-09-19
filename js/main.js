// File: js/main.js
// Ponto de entrada e orquestrador principal da aplicação
// Conecta eventos da UI com lógica de dados e atualizações da interface

// Importar módulos
import * as Store from './store.js';
import * as UI from './ui.js';
import { formatCurrency, validateName, validatePrice, validatePhone } from './utils.js';

/* ==========================================================================
   ESTADO DA APLICAÇÃO
   ========================================================================== */

// Cache local para dados frequentemente usados
let appState = {
    clients: [],
    products: [],
    currentClient: null,
    isLoading: false
};

/* ==========================================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ========================================================================== */

/**
 * Função principal de inicialização
 */
async function init() {
    try {
        console.log('🚀 Iniciando aplicação Meu Bar - PWA');
        
        // Registrar Service Worker
        await registerServiceWorker();
        
        // Configurar navegação
        setupNavigation();
        
        // Configurar formulários
        setupForms();
        
        // Carregar dados iniciais
        await loadInitialData();
        
        // Renderizar tela inicial (lançamento)
        UI.renderLaunchScreen(appState.clients, appState.products);
        
        // Mostrar informações do banco
        const dbInfo = await Store.getDatabaseInfo();
        console.log('📊 Banco de dados:', dbInfo);
        
        UI.showToast('Aplicação iniciada com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        UI.showToast('Erro ao inicializar aplicação', 'error');
    }
}

/**
 * Registra o Service Worker para funcionamento offline
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registrado:', registration.scope);
            
            // Escutar atualizações
            registration.addEventListener('updatefound', () => {
                console.log('🔄 Nova versão disponível');
                UI.showToast('Nova versão disponível. Recarregue a página.', 'warning');
            });
            
        } catch (error) {
            console.error('❌ Erro ao registrar Service Worker:', error);
        }
    } else {
        console.warn('⚠️ Service Worker não suportado');
    }
}

/**
 * Carrega dados iniciais do banco
 */
async function loadInitialData() {
    try {
        setLoading(true);
        
        console.log('📥 Carregando dados iniciais...');
        
        // Carregar clientes e produtos em paralelo
        const [clients, products] = await Promise.all([
            Store.getAllClients(),
            Store.getAllProducts()
        ]);
        
        // Atualizar estado da aplicação
        appState.clients = clients;
        appState.products = products;
        
        console.log(`✅ Dados carregados: ${clients.length} clientes, ${products.length} produtos`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
        UI.showToast('Erro ao carregar dados', 'error');
    } finally {
        setLoading(false);
    }
}

/* ==========================================================================
   NAVEGAÇÃO
   ========================================================================== */

/**
 * Configura sistema de navegação entre páginas
 */
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const pageId = e.currentTarget.dataset.page;
            
            if (pageId) {
                await handlePageNavigation(pageId);
            }
        });
    });
    
    console.log('🧭 Navegação configurada');
}

/**
 * Manipula navegação entre páginas com carregamento de dados específicos
 * @param {string} pageId - ID da página de destino
 */
async function handlePageNavigation(pageId) {
    try {
        setLoading(true);
        
        switch (pageId) {
            case 'page-lancamento':
                // Recarregar dados para lançamento
                await loadInitialData();
                UI.renderLaunchScreen(appState.clients, appState.products);
                break;
                
            case 'page-clientes':
                // Carregar e renderizar lista de clientes
                appState.clients = await Store.getAllClients();
                UI.renderClientList(appState.clients);
                break;
                
            case 'page-produtos':
                // Carregar e renderizar lista de produtos
                appState.products = await Store.getAllProducts();
                UI.renderProductList(appState.products);
                break;
        }
        
        // Mudar página
        UI.showPage(pageId);
        
    } catch (error) {
        console.error('❌ Erro na navegação:', error);
        UI.showToast('Erro ao carregar página', 'error');
    } finally {
        setLoading(false);
    }
}

/* ==========================================================================
   FORMULÁRIOS
   ========================================================================== */

/**
 * Configura todos os formulários da aplicação
 */
function setupForms() {
    setupClientForm();
    setupProductForm();
    setupLaunchForm();
    
    console.log('📝 Formulários configurados');
}

/**
 * Configura formulário de clientes
 */
function setupClientForm() {
    const clientForm = document.getElementById('add-client-form');
    
    if (clientForm) {
        clientForm.addEventListener('submit', handleClientSubmit);
    }
}

/**
 * Configura formulário de produtos
 */
function setupProductForm() {
    const productForm = document.getElementById('add-product-form');
    
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
}

/**
 * Configura formulário de lançamento
 */
function setupLaunchForm() {
    const confirmBtn = document.getElementById('confirm-launch-btn');
    const cancelBtn = document.getElementById('cancel-launch-btn');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleLaunchConfirm);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleLaunchCancel);
    }
}

/* ==========================================================================
   MANIPULADORES DE EVENTOS DE FORMULÁRIOS
   ========================================================================== */

/**
 * Manipula submissão do formulário de cliente
 */
async function handleClientSubmit(e) {
    e.preventDefault();
    
    try {
        setLoading(true);
        
        // Obter dados do formulário
        const nameInput = document.getElementById('client-name');
        const phoneInput = document.getElementById('client-phone');
        
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        
        // Validar dados
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) {
            UI.showToast(nameValidation.message, 'error');
            nameInput.focus();
            return;
        }
        
        if (phone) {
            const phoneValidation = validatePhone(phone);
            if (!phoneValidation.isValid) {
                UI.showToast(phoneValidation.message, 'error');
                phoneInput.focus();
                return;
            }
        }
        
        // Adicionar cliente
        const clientId = await Store.addClient({ name, phone });
        
        // Atualizar estado e UI
        appState.clients = await Store.getAllClients();
        UI.renderClientList(appState.clients);
        
        // Limpar formulário
        nameInput.value = '';
        phoneInput.value = '';
        
        UI.showToast(`Cliente "${name}" adicionado com sucesso!`, 'success');
        
        console.log(`✅ Cliente adicionado: ${name} (ID: ${clientId})`);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar cliente:', error);
        UI.showToast('Erro ao adicionar cliente', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Manipula submissão do formulário de produto
 */
async function handleProductSubmit(e) {
    e.preventDefault();
    
    try {
        setLoading(true);
        
        // Obter dados do formulário
        const nameInput = document.getElementById('product-name');
        const priceInput = document.getElementById('product-price');
        
        const name = nameInput.value.trim();
        const price = priceInput.value;
        
        // Validar dados
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) {
            UI.showToast(nameValidation.message, 'error');
            nameInput.focus();
            return;
        }
        
        const priceValidation = validatePrice(price);
        if (!priceValidation.isValid) {
            UI.showToast(priceValidation.message, 'error');
            priceInput.focus();
            return;
        }
        
        // Adicionar produto
        const productId = await Store.addProduct({ 
            name, 
            price: priceValidation.value 
        });
        
        // Atualizar estado e UI
        appState.products = await Store.getAllProducts();
        UI.renderProductList(appState.products);
        
        // Limpar formulário
        nameInput.value = '';
        priceInput.value = '';
        
        UI.showToast(`Produto "${name}" adicionado com sucesso!`, 'success');
        
        console.log(`✅ Produto adicionado: ${name} - ${formatCurrency(priceValidation.value)} (ID: ${productId})`);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar produto:', error);
        UI.showToast('Erro ao adicionar produto', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Manipula confirmação do lançamento
 */
async function handleLaunchConfirm() {
    try {
        setLoading(true);
        
        // Obter dados do lançamento
        const launchData = UI.getLaunchData();
        
        if (!launchData) {
            UI.showToast('Selecione um cliente e pelo menos um produto', 'warning');
            return;
        }
        
        // Processar lançamento
        await Store.addBatchTransaction(launchData);
        
        // Obter nome do cliente
        const client = appState.clients.find(c => c.id === launchData.clientId);
        const clientName = client ? client.name : 'Cliente';
        
        // Calcular total
        let total = 0;
        launchData.items.forEach(item => {
            const product = appState.products.find(p => p.id === item.productId);
            if (product) {
                total += product.price * item.qty;
            }
        });
        
        // Limpar seleção
        UI.clearProductSelection();
        
        // Reset seletor de cliente
        const selectClient = document.getElementById('select-client');
        if (selectClient) {
            selectClient.value = '';
        }
        
        UI.showToast(
            `Lançamento registrado para ${clientName}: ${formatCurrency(total)}`, 
            'success'
        );
        
        console.log(`✅ Lançamento confirmado para cliente ${clientName}: ${launchData.items.length} itens`);
        
    } catch (error) {
        console.error('❌ Erro ao confirmar lançamento:', error);
        UI.showToast('Erro ao processar lançamento', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Manipula cancelamento do lançamento
 */
function handleLaunchCancel() {
    UI.clearProductSelection();
    
    const selectClient = document.getElementById('select-client');
    if (selectClient) {
        selectClient.value = '';
    }
    
    UI.showToast('Lançamento cancelado', 'warning');
    console.log('❌ Lançamento cancelado pelo usuário');
}

/* ==========================================================================
   OPERAÇÕES DE EXTRATO E CLIENTES
   ========================================================================== */

/**
 * Exibe o extrato de um cliente
 * @param {number} clientId - ID do cliente
 */
async function viewClientStatement(clientId) {
    try {
        setLoading(true);
        
        console.log(`📋 Carregando extrato do cliente ${clientId}`);
        
        // Buscar dados do cliente
        const [client, transactions, balance] = await Promise.all([
            Store.getClientById(clientId),
            Store.getTransactionsByClientId(clientId),
            Store.getClientBalance(clientId)
        ]);
        
        if (!client) {
            UI.showToast('Cliente não encontrado', 'error');
            return;
        }
        
        // Armazenar cliente atual
        appState.currentClient = client;
        
        // Renderizar extrato
        UI.renderClientStatement(client, transactions, appState.products, balance);
        
        // Navegar para página de extrato
        UI.showPage('page-extrato');
        
        console.log(`✅ Extrato carregado: ${client.name} - Saldo: ${formatCurrency(balance)}`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar extrato:', error);
        UI.showToast('Erro ao carregar extrato do cliente', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Exclui um cliente
 * @param {number} clientId - ID do cliente
 */
async function deleteClient(clientId) {
    try {
        setLoading(true);
        
        // Buscar nome do cliente para confirmação
        const client = await Store.getClientById(clientId);
        const clientName = client ? client.name : 'Cliente';
        
        // Excluir cliente
        await Store.deleteClient(clientId);
        
        // Atualizar estado e UI
        appState.clients = await Store.getAllClients();
        UI.renderClientList(appState.clients);
        
        UI.showToast(`Cliente "${clientName}" excluído com sucesso`, 'success');
        
        console.log(`✅ Cliente excluído: ${clientName} (ID: ${clientId})`);
        
    } catch (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        UI.showToast('Erro ao excluir cliente', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Exclui um produto
 * @param {number} productId - ID do produto
 */
async function deleteProduct(productId) {
    try {
        setLoading(true);
        
        // Buscar nome do produto
        const product = appState.products.find(p => p.id === productId);
        const productName = product ? product.name : 'Produto';
        
        // Excluir produto
        await Store.deleteProduct(productId);
        
        // Atualizar estado e UI
        appState.products = await Store.getAllProducts();
        UI.renderProductList(appState.products);
        
        UI.showToast(`Produto "${productName}" excluído com sucesso`, 'success');
        
        console.log(`✅ Produto excluído: ${productName} (ID: ${productId})`);
        
    } catch (error) {
        console.error('❌ Erro ao excluir produto:', error);
        UI.showToast('Erro ao excluir produto', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Registra um pagamento
 * @param {number} clientId - ID do cliente
 * @param {number} amount - Valor do pagamento
 */
async function registerPayment(clientId, amount) {
    try {
        setLoading(true);
        
        // Buscar cliente
        const client = await Store.getClientById(clientId);
        if (!client) {
            UI.showToast('Cliente não encontrado', 'error');
            return;
        }
        
        // Registrar pagamento
        await Store.addPayment({ clientId, amount });
        
        // Recarregar extrato
        const [transactions, balance] = await Promise.all([
            Store.getTransactionsByClientId(clientId),
            Store.getClientBalance(clientId)
        ]);
        
        // Atualizar UI
        UI.renderClientStatement(client, transactions, appState.products, balance);
        
        UI.showToast(
            `Pagamento de ${formatCurrency(amount)} registrado para ${client.name}`, 
            'success'
        );
        
        console.log(`✅ Pagamento registrado: ${client.console.log(`✅ Pagamento registrado: ${client.name} - ${formatCurrency(amount)}`);
        
    } catch (error) {
        console.error('❌ Erro ao registrar pagamento:', error);
        UI.showToast('Erro ao registrar pagamento', 'error');
    } finally {
        setLoading(false);
    }
}

/* ==========================================================================
   UTILITÁRIOS DA APLICAÇÃO
   ========================================================================== */

/**
 * Controla estado de loading da aplicação
 * @param {boolean} loading - Se deve mostrar loading
 */
function setLoading(loading) {
    appState.isLoading = loading;
    
    // Aqui poderíamos adicionar indicadores visuais de loading
    // Por exemplo, desabilitar botões ou mostrar spinners
    
    if (loading) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

/* ==========================================================================
   FUNÇÕES GLOBAIS PARA USO EM EVENT HANDLERS INLINE
   ========================================================================== */

// Expor funções necessárias globalmente para uso em event handlers do HTML
window.viewClientStatement = viewClientStatement;
window.deleteClient = deleteClient;
window.deleteProduct = deleteProduct;
window.registerPayment = registerPayment;

/* ==========================================================================
   INICIALIZAÇÃO QUANDO DOM ESTIVER PRONTO
   ========================================================================== */

// Iniciar aplicação quando DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM já está carregado
    init();
}

// Log final
console.log('📱 Main.js carregado - Aplicação Meu Bar PWA pronta!');
