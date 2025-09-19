// File: js/store.js
// Módulo de gerenciamento de dados usando IndexedDB via Dexie.js
// Todas as operações de persistência de dados são centralizadas aqui

// Instância do banco de dados Dexie
export const db = new Dexie('MeuBarDB');

// Definição do schema do banco de dados - Versão 1
db.version(1).stores({
    // Tabela de clientes: ID auto-incremento, nome indexado
    clients: '++id, name',
    
    // Tabela de produtos: ID auto-incremento, nome indexado
    products: '++id, name, price',
    
    // Tabela de transações: ID auto-incremento, clientId indexado para consultas rápidas
    transactions: '++id, clientId, productId, qty, timestamp, type'
});

/* ==========================================================================
   OPERAÇÕES DE CLIENTES
   ========================================================================== */

/**
 * Adiciona um novo cliente ao banco de dados
 * @param {Object} clientData - Dados do cliente
 * @param {string} clientData.name - Nome do cliente
 * @param {string} [clientData.phone] - Telefone do cliente (opcional)
 * @returns {Promise<number>} ID do cliente criado
 */
export async function addClient(clientData) {
    try {
        const clientId = await db.clients.add({
            name: clientData.name.trim(),
            phone: clientData.phone ? clientData.phone.trim() : '',
            createdAt: Date.now()
        });
        
        console.log(`Cliente adicionado: ${clientData.name} (ID: ${clientId})`);
        return clientId;
    } catch (error) {
        console.error('Erro ao adicionar cliente:', error);
        throw new Error('Falha ao adicionar cliente');
    }
}

/**
 * Busca todos os clientes ordenados por nome
 * @returns {Promise<Array>} Lista de clientes
 */
export async function getAllClients() {
    try {
        const clients = await db.clients
            .orderBy('name')
            .toArray();
        
        console.log(`${clients.length} clientes encontrados`);
        return clients;
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        throw new Error('Falha ao buscar clientes');
    }
}

/**
 * Busca um cliente específico por ID
 * @param {number} clientId - ID do cliente
 * @returns {Promise<Object|null>} Dados do cliente ou null se não encontrado
 */
export async function getClientById(clientId) {
    try {
        const client = await db.clients.get(clientId);
        
        if (!client) {
            console.warn(`Cliente não encontrado: ID ${clientId}`);
            return null;
        }
        
        return client;
    } catch (error) {
        console.error('Erro ao buscar cliente por ID:', error);
        throw new Error('Falha ao buscar cliente');
    }
}

/**
 * Remove um cliente e todas as suas transações
 * @param {number} clientId - ID do cliente a ser removido
 * @returns {Promise<boolean>} true se removido com sucesso
 */
export async function deleteClient(clientId) {
    try {
        // Usar transação para garantir atomicidade
        await db.transaction('rw', db.clients, db.transactions, async () => {
            // Remover todas as transações do cliente
            await db.transactions.where('clientId').equals(clientId).delete();
            
            // Remover o cliente
            await db.clients.delete(clientId);
        });
        
        console.log(`Cliente removido: ID ${clientId}`);
        return true;
    } catch (error) {
        console.error('Erro ao remover cliente:', error);
        throw new Error('Falha ao remover cliente');
    }
}

/* ==========================================================================
   OPERAÇÕES DE PRODUTOS
   ========================================================================== */

/**
 * Adiciona um novo produto ao banco de dados
 * @param {Object} productData - Dados do produto
 * @param {string} productData.name - Nome do produto
 * @param {number} productData.price - Preço do produto
 * @returns {Promise<number>} ID do produto criado
 */
export async function addProduct(productData) {
    try {
        const productId = await db.products.add({
            name: productData.name.trim(),
            price: parseFloat(productData.price),
            createdAt: Date.now()
        });
        
        console.log(`Produto adicionado: ${productData.name} (ID: ${productId})`);
        return productId;
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        throw new Error('Falha ao adicionar produto');
    }
}

/**
 * Busca todos os produtos ordenados por nome
 * @returns {Promise<Array>} Lista de produtos
 */
export async function getAllProducts() {
    try {
        const products = await db.products
            .orderBy('name')
            .toArray();
        
        console.log(`${products.length} produtos encontrados`);
        return products;
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw new Error('Falha ao buscar produtos');
    }
}

/**
 * Remove um produto do banco de dados
 * Nota: Não remove as transações relacionadas para manter histórico
 * @param {number} productId - ID do produto a ser removido
 * @returns {Promise<boolean>} true se removido com sucesso
 */
export async function deleteProduct(productId) {
    try {
        const result = await db.products.delete(productId);
        
        if (result) {
            console.log(`Produto removido: ID ${productId}`);
            return true;
        } else {
            console.warn(`Produto não encontrado: ID ${productId}`);
            return false;
        }
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        throw new Error('Falha ao remover produto');
    }
}

/* ==========================================================================
   OPERAÇÕES DE TRANSAÇÕES
   ========================================================================== */

/**
 * Adiciona uma nova transação (consumo ou pagamento)
 * @param {Object} transactionData - Dados da transação
 * @param {number} transactionData.clientId - ID do cliente
 * @param {number} transactionData.productId - ID do produto
 * @param {number} transactionData.qty - Quantidade
 * @param {string} [transactionData.type='debit'] - Tipo: 'debit' ou 'credit'
 * @param {number} [transactionData.timestamp] - Timestamp (padrão: agora)
 * @returns {Promise<number>} ID da transação criada
 */
export async function addTransaction(transactionData) {
    try {
        const transaction = {
            clientId: parseInt(transactionData.clientId),
            productId: parseInt(transactionData.productId),
            qty: parseInt(transactionData.qty),
            type: transactionData.type || 'debit',
            timestamp: transactionData.timestamp || Date.now()
        };
        
        const transactionId = await db.transactions.add(transaction);
        
        console.log(`Transação adicionada: Cliente ${transaction.clientId}, Produto ${transaction.productId}, Qty ${transaction.qty} (ID: ${transactionId})`);
        return transactionId;
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        throw new Error('Falha ao adicionar transação');
    }
}

/**
 * Busca todas as transações de um cliente específico
 * @param {number} clientId - ID do cliente
 * @returns {Promise<Array>} Lista de transações ordenadas por data (mais recente primeiro)
 */
export async function getTransactionsByClientId(clientId) {
    try {
        const transactions = await db.transactions
            .where('clientId')
            .equals(parseInt(clientId))
            .orderBy('timestamp')
            .reverse()
            .toArray();
        
        console.log(`${transactions.length} transações encontradas para cliente ${clientId}`);
        return transactions;
    } catch (error) {
        console.error('Erro ao buscar transações do cliente:', error);
        throw new Error('Falha ao buscar transações');
    }
}

/**
 * Adiciona um lançamento em lote (múltiplos produtos para um cliente)
 * @param {Object} launchData - Dados do lançamento
 * @param {number} launchData.clientId - ID do cliente
 * @param {Array} launchData.items - Lista de itens: [{productId, qty}, ...]
 * @returns {Promise<Array>} Lista de IDs das transações criadas
 */
export async function addBatchTransaction(launchData) {
    try {
        const { clientId, items } = launchData;
        const timestamp = Date.now();
        const transactionIds = [];
        
        // Usar transação do banco para garantir atomicidade
        await db.transaction('rw', db.transactions, async () => {
            for (const item of items) {
                const transactionId = await db.transactions.add({
                    clientId: parseInt(clientId),
                    productId: parseInt(item.productId),
                    qty: parseInt(item.qty),
                    type: 'debit',
                    timestamp: timestamp
                });
                
                transactionIds.push(transactionId);
            }
        });
        
        console.log(`Lançamento em lote adicionado: ${items.length} itens para cliente ${clientId}`);
        return transactionIds;
    } catch (error) {
        console.error('Erro ao adicionar lançamento em lote:', error);
        throw new Error('Falha ao processar lançamento');
    }
}

/* ==========================================================================
   OPERAÇÕES DE RELATÓRIOS E CÁLCULOS
   ========================================================================== */

/**
 * Calcula o saldo devedor de um cliente
 * @param {number} clientId - ID do cliente
 * @returns {Promise<number>} Valor total em dívida
 */
export async function getClientBalance(clientId) {
    try {
        // Buscar todas as transações do cliente
        const transactions = await getTransactionsByClientId(clientId);
        
        // Buscar informações dos produtos para calcular valores
        const products = await getAllProducts();
        const productsMap = products.reduce((acc, product) => {
            acc[product.id] = product.price;
            return acc;
        }, {});
        
        // Calcular saldo
        let balance = 0;
        
        for (const transaction of transactions) {
            const productPrice = productsMap[transaction.productId] || 0;
            const amount = productPrice * transaction.qty;
            
            if (transaction.type === 'debit') {
                balance += amount; // Adiciona à dívida
            } else if (transaction.type === 'credit') {
                balance -= amount; // Remove da dívida (pagamento)
            }
        }
        
        return balance;
    } catch (error) {
        console.error('Erro ao calcular saldo do cliente:', error);
        throw new Error('Falha ao calcular saldo');
    }
}

/**
 * Registra um pagamento de cliente
 * @param {Object} paymentData - Dados do pagamento
 * @param {number} paymentData.clientId - ID do cliente
 * @param {number} paymentData.amount - Valor do pagamento
 * @returns {Promise<number>} ID da transação de pagamento criada
 */
export async function addPayment(paymentData) {
    try {
        // Criar uma transação especial de pagamento
        // Usamos productId = 0 para identificar pagamentos
        const paymentId = await db.transactions.add({
            clientId: parseInt(paymentData.clientId),
            productId: 0, // ID especial para pagamentos
            qty: paymentData.amount, // Quantidade armazena o valor do pagamento
            type: 'credit',
            timestamp: Date.now()
        });
        
        console.log(`Pagamento registrado: Cliente ${paymentData.clientId}, Valor R$ ${paymentData.amount} (ID: ${paymentId})`);
        return paymentId;
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        throw new Error('Falha ao registrar pagamento');
    }
}

/* ==========================================================================
   UTILITÁRIOS E MANUTENÇÃO
   ========================================================================== */

/**
 * Limpa todos os dados do banco (use com cuidado!)
 * @returns {Promise<boolean>} true se limpeza foi bem-sucedida
 */
export async function clearAllData() {
    try {
        await db.transaction('rw', db.clients, db.products, db.transactions, async () => {
            await db.clients.clear();
            await db.products.clear();
            await db.transactions.clear();
        });
        
        console.log('Todos os dados foram limpos do banco');
        return true;
    } catch (error) {
        console.error('Erro ao limpar dados:', error);
        throw new Error('Falha ao limpar dados');
    }
}

/**
 * Verifica o status da conexão com o banco de dados
 * @returns {Promise<Object>} Informações sobre o banco
 */
export async function getDatabaseInfo() {
    try {
        const clientsCount = await db.clients.count();
        const productsCount = await db.products.count();
        const transactionsCount = await db.transactions.count();
        
        return {
            clients: clientsCount,
            products: productsCount,
            transactions: transactionsCount,
            dbName: db.name,
            version: db.verno
        };
    } catch (error) {
        console.error('Erro ao obter informações do banco:', error);
        throw new Error('Falha ao acessar banco de dados');
    }
}

// Log de inicialização do módulo
console.log('Store.js inicializado - Dexie.js conectado ao banco MeuBarDB');
