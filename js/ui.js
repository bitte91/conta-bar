// File: js/ui.js
// Módulo de manipulação da interface do usuário (DOM)
// Todas as funções de renderização e atualização visual são centralizadas aqui

import { formatCurrency, formatTimestamp } from './utils.js';

/* ==========================================================================
   NAVEGAÇÃO ENTRE PÁGINAS
   ========================================================================== */

/**
 * Gerencia a exibição das páginas (seções) do aplicativo
 * @param {string} pageId - ID da página a ser exibida
 */
export function showPage(pageId) {
    // Remover classe 'active' de todas as páginas
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => page.classList.remove('active'));
    
    // Remover classe 'active' de todos os botões de navegação
    const allNavBtns = document.querySelectorAll('.nav-btn');
    allNavBtns.forEach(btn => btn.classList.remove('active'));
    
    // Ativar a página solicitada
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Ativar o botão de navegação correspondente
        const targetNavBtn = document.querySelector(`[data-page="${pageId}"]`);
        if (targetNavBtn) {
            targetNavBtn.classList.add('active');
        }
        
        console.log(`Página ativa: ${pageId}`);
    } else {
        console.error(`Página não encontrada: ${pageId}`);
    }
}

/* ==========================================================================
   RENDERIZAÇÃO DE LISTAS DE CLIENTES
   ========================================================================== */

/**
 * Renderiza a lista de clientes na página de clientes
 * @param {Array} clients - Array de objetos cliente
 */
export function renderClientList(clients) {
    const clientList = document.getElementById('client-list');
    
    if (!clientList) {
        console.error('Elemento client-list não encontrado');
        return;
    }
    
    // Limpar lista existente
    clientList.innerHTML = '';
    
    // Verificar se há clientes
    if (!clients || clients.length === 0) {
        clientList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">Nenhum cliente cadastrado</div>
                <div class="empty-state-subtext">Adicione o primeiro cliente usando o formulário acima</div>
            </div>
        `;
        return;
    }
    
    // Renderizar cada cliente
    clients.forEach(client => {
        const clientItem = document.createElement('li');
        clientItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${escapeHtml(client.name)}</div>
                <div class="item-meta">
                    ${client.phone ? `📞 ${escapeHtml(client.phone)}` : ''}
                    ${client.phone ? ' • ' : ''}
                    Cadastrado em ${formatTimestamp(client.createdAt).split(' ')[0]}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-primary btn-small" onclick="viewClientStatement(${client.id})">
                    Ver Extrato
                </button>
                <button class="btn btn-danger btn-small" onclick="confirmDeleteClient(${client.id}, '${escapeHtml(client.name)}')">
                    Excluir
                </button>
            </div>
        `;
        
        clientList.appendChild(clientItem);
    });
    
    console.log(`Renderizados ${clients.length} clientes`);
}

/**
 * Popula o seletor de clientes na página de lançamento
 * @param {Array} clients - Array de objetos cliente
 */
export function populateClientSelector(clients) {
    const selectClient = document.getElementById('select-client');
    
    if (!selectClient) {
        console.error('Elemento select-client não encontrado');
        return;
    }
    
    // Limpar opções existentes (mantendo a primeira opção)
    selectClient.innerHTML = '<option value="">Selecione um cliente...</option>';
    
    // Adicionar cada cliente como opção
    if (clients && clients.length > 0) {
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            selectClient.appendChild(option);
        });
    }
    
    console.log(`Seletor de clientes populado com ${clients ? clients.length : 0} opções`);
}

/* ==========================================================================
   RENDERIZAÇÃO DE LISTAS DE PRODUTOS
   ========================================================================== */

/**
 * Renderiza a lista de produtos na página de produtos
 * @param {Array} products - Array de objetos produto
 */
export function renderProductList(products) {
    const productList = document.getElementById('product-list');
    
    if (!productList) {
        console.error('Elemento product-list não encontrado');
        return;
    }
    
    // Limpar lista existente
    productList.innerHTML = '';
    
    // Verificar se há produtos
    if (!products || products.length === 0) {
        productList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🍻</div>
                <div class="empty-state-text">Nenhum produto cadastrado</div>
                <div class="empty-state-subtext">Adicione o primeiro produto usando o formulário acima</div>
            </div>
        `;
        return;
    }
    
    // Renderizar cada produto
    products.forEach(product => {
        const productItem = document.createElement('li');
        productItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${escapeHtml(product.name)}</div>
                <div class="item-meta">
                    Preço: ${formatCurrency(product.price)}
                    • Cadastrado em ${formatTimestamp(product.createdAt).split(' ')[0]}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-danger btn-small" onclick="confirmDeleteProduct(${product.id}, '${escapeHtml(product.name)}')">
                    Excluir
                </button>
            </div>
        `;
        
        productList.appendChild(productItem);
    });
    
    console.log(`Renderizados ${products.length} produtos`);
}

/**
 * Renderiza a grade de produtos na página de lançamento
 * @param {Array} products - Array de objetos produto
 */
export function renderProductsGrid(products) {
    const productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) {
        console.error('Elemento products-grid não encontrado');
        return;
    }
    
    // Limpar grade existente
    productsGrid.innerHTML = '';
    
    // Verificar se há produtos
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">🍻</div>
                <div class="empty-state-text">Nenhum produto disponível</div>
                <div class="empty-state-subtext">Cadastre produtos na aba "Produtos" primeiro</div>
            </div>
        `;
        return;
    }
    
    // Renderizar cada produto como um card
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.productId = product.id;
        productCard.dataset.productName = product.name;
        productCard.dataset.productPrice = product.price;
        
        productCard.innerHTML = `
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-price">${formatCurrency(product.price)}</div>
            <div class="product-quantity" style="display: none;">0</div>
        `;
        
        // Adicionar evento de clique para seleção
        productCard.addEventListener('click', () => handleProductSelection(product.id));
        
        productsGrid.appendChild(productCard);
    });
    
    console.log(`Grade de produtos renderizada com ${products.length} itens`);
}

/* ==========================================================================
   PÁGINA DE LANÇAMENTO
   ========================================================================== */

/**
 * Renderiza a tela de lançamento com clientes e produtos
 * @param {Array} clients - Array de clientes
 * @param {Array} products - Array de produtos
 */
export function renderLaunchScreen(clients, products) {
    populateClientSelector(clients);
    renderProductsGrid(products);
    
    // Resetar formulário de lançamento
    const selectClient = document.getElementById('select-client');
    if (selectClient) {
        selectClient.value = '';
    }
    
    // Ocultar resumo
    hideLaunchSummary();
    
    console.log('Tela de lançamento renderizada');
}

/**
 * Manipula a seleção/desseleção de produtos
 * @param {number} productId - ID do produto selecionado
 */
function handleProductSelection(productId) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;
    
    const quantityEl = productCard.querySelector('.product-quantity');
    let currentQty = parseInt(quantityEl.textContent) || 0;
    
    // Incrementar quantidade
    currentQty += 1;
    
    // Atualizar visual
    quantityEl.textContent = currentQty;
    quantityEl.style.display = currentQty > 0 ? 'flex' : 'none';
    
    if (currentQty > 0) {
        productCard.classList.add('selected');
    } else {
        productCard.classList.remove('selected');
    }
    
    // Atualizar resumo
    updateLaunchSummary();
    
    console.log(`Produto ${productId} selecionado: qty ${currentQty}`);
}

// Tornar a função global para uso nos event listeners
window.handleProductSelection = handleProductSelection;

/**
 * Atualiza o resumo do lançamento
 */
function updateLaunchSummary() {
    const selectedProducts = getSelectedProducts();
    const launchSummary = document.getElementById('launch-summary');
    const summaryContent = document.getElementById('summary-content');
    
    if (!launchSummary || !summaryContent) return;
    
    if (selectedProducts.length === 0) {
        hideLaunchSummary();
        return;
    }
    
    // Calcular totais
    let totalItems = 0;
    let totalValue = 0;
    let summaryHTML = '';
    
    selectedProducts.forEach(product => {
        const itemTotal = product.price * product.qty;
        totalItems += product.qty;
        totalValue += itemTotal;
        
        summaryHTML += `
            <div class="summary-item">
                <span>${product.qty}x ${escapeHtml(product.name)}</span>
                <span>${formatCurrency(itemTotal)}</span>
            </div>
        `;
    });
    
    // Adicionar totais
    summaryHTML += `
        <div class="summary-item">
            <span><strong>Total (${totalItems} itens)</strong></span>
            <span><strong>${formatCurrency(totalValue)}</strong></span>
        </div>
    `;
    
    summaryContent.innerHTML = summaryHTML;
    launchSummary.style.display = 'block';
    
    console.log(`Resumo atualizado: ${totalItems} itens, ${formatCurrency(totalValue)}`);
}

/**
 * Oculta o resumo do lançamento
 */
function hideLaunchSummary() {
    const launchSummary = document.getElementById('launch-summary');
    if (launchSummary) {
        launchSummary.style.display = 'none';
    }
}

/**
 * Obtém os produtos selecionados na grade
 * @returns {Array} Array de objetos com productId, name, price, qty
 */
function getSelectedProducts() {
    const selectedProducts = [];
    const productCards = document.querySelectorAll('.product-card.selected');
    
    productCards.forEach(card => {
        const productId = parseInt(card.dataset.productId);
        const productName = card.dataset.productName;
        const productPrice = parseFloat(card.dataset.productPrice);
        const qty = parseInt(card.querySelector('.product-quantity').textContent);
        
        if (qty > 0) {
            selectedProducts.push({
                productId,
                name: productName,
                price: productPrice,
                qty
            });
        }
    });
    
    return selectedProducts;
}

/**
 * Limpa a seleção de produtos
 */
export function clearProductSelection() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.classList.remove('selected');
        const quantityEl = card.querySelector('.product-quantity');
        quantityEl.textContent = '0';
        quantityEl.style.display = 'none';
    });
    
    hideLaunchSummary();
    console.log('Seleção de produtos limpa');
}

/**
 * Obtém os dados do lançamento atual
 * @returns {Object|null} Dados do lançamento ou null se inválido
 */
export function setProductQuantity(productId, newQty) {
    const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
    if (!productCard) return;

    const quantityEl = productCard.querySelector('.product-quantity');
    const currentQty = parseInt(quantityEl.textContent) || 0;

    if (newQty <= 0) {
        quantityEl.textContent = '0';
        quantityEl.style.display = 'none';
        productCard.classList.remove('selected');
    } else {
        quantityEl.textContent = newQty;
        quantityEl.style.display = 'flex';
        productCard.classList.add('selected');
    }
}

/**
 * Seleciona um cliente no dropdown de lançamento.
 * @param {number} clientId - O ID do cliente a ser selecionado.
 */
export function selectClient(clientId) {
    const selectClient = document.getElementById('select-client');
    if (selectClient) {
        selectClient.value = clientId;
    }
}

/**
 * Obtém os dados do lançamento atual
 * @returns {Object|null} Dados do lançamento ou null se inválido
 */
export function getLaunchData() {
    const selectClient = document.getElementById('select-client');
    const selectedProducts = getSelectedProducts();
    
    if (!selectClient || !selectClient.value) {
        return null;
    }
    
    if (selectedProducts.length === 0) {
        return null;
    }
    
    return {
        clientId: parseInt(selectClient.value),
        items: selectedProducts.map(product => ({
            productId: product.productId,
            qty: product.qty
        }))
    };
}

/* ==========================================================================
   EXTRATO DE CLIENTE
   ========================================================================== */

/**
 * Renderiza o extrato detalhado de um cliente
 * @param {Object} client - Dados do cliente
 * @param {Array} transactions - Lista de transações
 * @param {Array} products - Lista de produtos (para nomes e preços)
 * @param {number} balance - Saldo devedor atual
 */
export function renderClientStatement(client, transactions, products, balance) {
    const statementContent = document.getElementById('client-statement-content');
    
    if (!statementContent) {
        console.error('Elemento client-statement-content não encontrado');
        return;
    }
    
    // Criar mapa de produtos para lookup rápido
    const productsMap = products.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
    }, {});
    
    // Cabeçalho do cliente
    let html = `
        <div class="client-header">
            <h3>${escapeHtml(client.name)}</h3>
            <div class="client-balance">
                Saldo: ${formatCurrency(balance)}
            </div>
            <div style="margin-top: 1rem;">
                <button class="btn btn-success" onclick="promptPayment(${client.id})">
                    Registrar Pagamento
                </button>
                <button class="btn btn-secondary" onclick="showPage('page-clientes')">
                    Voltar
                </button>
            </div>
        </div>
    `;
    
    // Lista de transações
    if (transactions && transactions.length > 0) {
        html += `
            <div class="transactions-list">
                <h3>Histórico de Transações</h3>
        `;
        
        transactions.forEach(transaction => {
            let transactionHTML = '';
            
            if (transaction.type === 'credit' && transaction.productId === 0) {
                // Pagamento
                transactionHTML = `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-product">💰 Pagamento</div>
                            <div class="transaction-date">${formatTimestamp(transaction.timestamp)}</div>
                        </div>
                        <div class="transaction-value" style="color: var(--success-color);">
                            -${formatCurrency(transaction.qty)}
                        </div>
                    </div>
                `;
            } else {
                // Consumo normal
                const product = productsMap[transaction.productId];
                const productName = product ? product.name : 'Produto não encontrado';
                const productPrice = product ? product.price : 0;
                const totalValue = productPrice * transaction.qty;
                
                transactionHTML = `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-product">
                                ${transaction.qty}x ${escapeHtml(productName)}
                            </div>
                            <div class="transaction-date">${formatTimestamp(transaction.timestamp)}</div>
                        </div>
                        <div class="transaction-value">
                            +${formatCurrency(totalValue)}
                        </div>
                    </div>
                `;
            }
            
            html += transactionHTML;
        });
        
        html += '</div>';
    } else {
        html += `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">Nenhuma transação encontrada</div>
                <div class="empty-state-subtext">As transações aparecerão aqui conforme forem lançadas</div>
            </div>
        `;
    }
    
    statementContent.innerHTML = html;
    
    console.log(`Extrato renderizado para ${client.name}: ${transactions?.length || 0} transações, saldo ${formatCurrency(balance)}`);
}

/* ==========================================================================
   OCR MODAL
   ========================================================================== */

/**
 * Mostra ou esconde o modal de status do OCR.
 * @param {boolean} visible - Se o modal deve ser exibido.
 */
export function showOcrStatus(visible) {
    const modal = document.getElementById('ocr-status-modal');
    if (modal) {
        modal.style.display = visible ? 'flex' : 'none';
        if (visible) {
            // Resetar o progresso ao mostrar
            updateOcrProgress({ status: 'iniciando', progress: 0 });
        }
    }
}

/**
 * Atualiza o conteúdo e a barra de progresso do modal de OCR.
 * @param {Object} data - Dados do progresso.
 * @param {string} data.status - O status atual (ex: 'reconhecendo').
 * @param {number} data.progress - O progresso de 0 a 1.
 * @param {string} [data.message] - Uma mensagem opcional.
 */
export function updateOcrProgress(data) {
    const messageEl = document.getElementById('ocr-status-message');
    const progressEl = document.getElementById('ocr-progress');

    if (!messageEl || !progressEl) return;

    let message = '';
    switch (data.status) {
        case 'iniciando':
            message = 'Iniciando o motor de OCR...';
            break;
        case 'reconhecendo':
            message = `Reconhecendo texto... (${Math.round(data.progress * 100)}%)`;
            break;
        case 'concluido':
            message = 'Processo finalizado com sucesso!';
            break;
        case 'erro':
            message = `Erro: ${data.message || 'Falha no processo.'}`;
            break;
        default:
            message = 'Aguarde...';
    }

    messageEl.textContent = message;
    progressEl.style.width = `${data.progress * 100}%`;

    // Mudar a cor da barra em caso de erro
    if (data.status === 'erro') {
        progressEl.style.backgroundColor = 'var(--danger-color)';
    } else {
        progressEl.style.backgroundColor = 'var(--primary-color)';
    }
}


/* ==========================================================================
   MENSAGENS E NOTIFICAÇÕES
   ========================================================================== */

/**
 * Exibe uma mensagem toast
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da mensagem: 'success', 'error', 'warning'
 */
export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    
    if (!toast) {
        console.error('Elemento toast não encontrado');
        return;
    }
    
    // Definir conteúdo e classes
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    // Mostrar toast
    toast.classList.add('show');
    
    // Ocultar automaticamente após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
    
    console.log(`Toast exibido: ${message} (${type})`);
}

/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Tornar funções necessárias globais para uso em event handlers inline
window.viewClientStatement = async function(clientId) {
    // Esta função será implementada no main.js
    console.log(`Solicitado extrato do cliente ${clientId}`);
};

window.confirmDeleteClient = function(clientId, clientName) {
    if (confirm(`Tem certeza que deseja excluir o cliente "${clientName}"?\n\nEsta ação também removerá todas as transações do cliente e não pode ser desfeita.`)) {
        // Esta função será implementada no main.js
        window.deleteClient(clientId);
    }
};

window.confirmDeleteProduct = function(productId, productName) {
    if (confirm(`Tem certeza que deseja excluir o produto "${productName}"?\n\nEsta ação não pode ser desfeita.`)) {
        // Esta função será implementada no main.js
        window.deleteProduct(productId);
    }
};

window.promptPayment = function(clientId) {
    const amount = prompt('Digite o valor do pagamento (R$):');
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        // Esta função será implementada no main.js
        window.registerPayment(clientId, parseFloat(amount));
    }
};

console.log('UI.js inicializado - Funções de interface carregadas');
