// File: js/utils.js
// Módulo para funções utilitárias puras e reutilizáveis
// Todas as funções aqui são stateless e não dependem do DOM ou estado da aplicação

/* ==========================================================================
   FORMATAÇÃO DE MOEDA
   ========================================================================== */

/**
 * Formata um número para o padrão de moeda brasileiro (R$)
 * @param {number} value - Valor numérico a ser formatado
 * @returns {string} Valor formatado no padrão brasileiro (R$ 0,00)
 */
export function formatCurrency(value) {
    // Validar entrada
    if (typeof value !== 'number' || isNaN(value)) {
        console.warn('formatCurrency: valor inválido:', value);
        return 'R$ 0,00';
    }
    
    // Usar Intl.NumberFormat para formatação precisa
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(value);
}

/**
 * Converte uma string de moeda brasileira para número
 * @param {string} currencyString - String no formato "R$ 0,00" ou "0,00"
 * @returns {number} Valor numérico ou 0 se inválido
 */
export function parseCurrency(currencyString) {
    if (typeof currencyString !== 'string') {
        return 0;
    }
    
    // Remover símbolos e converter vírgula para ponto
    const numericString = currencyString
        .replace(/[R$\s]/g, '')  // Remove R$ e espaços
        .replace(/\./g, '')      // Remove pontos (milhares)
        .replace(',', '.');      // Converte vírgula decimal para ponto
    
    const value = parseFloat(numericString);
    return isNaN(value) ? 0 : value;
}

/* ==========================================================================
   FORMATAÇÃO DE DATA E HORA
   ========================================================================== */

/**
 * Formata um timestamp para uma data/hora legível no padrão brasileiro
 * @param {number} timestamp - Timestamp em milissegundos
 * @returns {string} Data/hora formatada (DD/MM/YYYY HH:mm)
 */
export function formatTimestamp(timestamp) {
    // Validar entrada
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
        console.warn('formatTimestamp: timestamp inválido:', timestamp);
        return 'Data inválida';
    }
    
    const date = new Date(timestamp);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
        console.warn('formatTimestamp: não foi possível criar data válida:', timestamp);
        return 'Data inválida';
    }
    
    // Usar Intl.DateTimeFormat para formatação consistente
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    return formatter.format(date);
}

/**
 * Formata um timestamp para apenas a data (DD/MM/YYYY)
 * @param {number} timestamp - Timestamp em milissegundos
 * @returns {string} Data formatada (DD/MM/YYYY)
 */
export function formatDate(timestamp) {
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
        return 'Data inválida';
    }
    
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
        return 'Data inválida';
    }
    
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    return formatter.format(date);
}

/**
 * Formata um timestamp para apenas o horário (HH:mm)
 * @param {number} timestamp - Timestamp em milissegundos
 * @returns {string} Horário formatado (HH:mm)
 */
export function formatTime(timestamp) {
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
        return 'Horário inválido';
    }
    
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
        return 'Horário inválido';
    }
    
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    return formatter.format(date);
}

/**
 * Retorna uma descrição relativa do tempo (ex: "há 2 horas", "ontem")
 * @param {number} timestamp - Timestamp em milissegundos
 * @returns {string} Descrição relativa do tempo
 */
export function formatRelativeTime(timestamp) {
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
        return 'Data inválida';
    }
    
    const now = Date.now();
    const diffMs = now - timestamp;
    
    // Se o timestamp for no futuro
    if (diffMs < 0) {
        return formatTimestamp(timestamp);
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
        return 'Agora';
    } else if (diffMinutes < 60) {
        return `Há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays === 1) {
        return 'Ontem';
    } else if (diffDays < 7) {
        return `Há ${diffDays} dias`;
    } else {
        // Para períodos mais longos, mostrar data completa
        return formatDate(timestamp);
    }
}

/* ==========================================================================
   VALIDAÇÃO DE DADOS
   ========================================================================== */

/**
 * Valida se um nome é válido (não vazio, tamanho adequado)
 * @param {string} name - Nome a ser validado
 * @returns {Object} {isValid: boolean, message: string}
 */
export function validateName(name) {
    if (typeof name !== 'string') {
        return {
            isValid: false,
            message: 'Nome deve ser um texto'
        };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
        return {
            isValid: false,
            message: 'Nome é obrigatório'
        };
    }
    
    if (trimmedName.length < 2) {
        return {
            isValid: false,
            message: 'Nome deve ter pelo menos 2 caracteres'
        };
    }
    
    if (trimmedName.length > 100) {
        return {
            isValid: false,
            message: 'Nome deve ter no máximo 100 caracteres'
        };
    }
    
    return {
        isValid: true,
        message: ''
    };
}

/**
 * Valida se um preço é válido (numérico, positivo)
 * @param {string|number} price - Preço a ser validado
 * @returns {Object} {isValid: boolean, value: number, message: string}
 */
export function validatePrice(price) {
    let numPrice;
    
    if (typeof price === 'string') {
        numPrice = parseFloat(price.replace(',', '.'));
    } else if (typeof price === 'number') {
        numPrice = price;
    } else {
        return {
            isValid: false,
            value: 0,
            message: 'Preço deve ser um número'
        };
    }
    
    if (isNaN(numPrice)) {
        return {
            isValid: false,
            value: 0,
            message: 'Preço deve ser um número válido'
        };
    }
    
    if (numPrice < 0) {
        return {
            isValid: false,
            value: numPrice,
            message: 'Preço não pode ser negativo'
        };
    }
    
    if (numPrice > 999999.99) {
        return {
            isValid: false,
            value: numPrice,
            message: 'Preço muito alto (máximo R$ 999.999,99)'
        };
    }
    
    // Arredondar para 2 casas decimais
    const roundedPrice = Math.round(numPrice * 100) / 100;
    
    return {
        isValid: true,
        value: roundedPrice,
        message: ''
    };
}

/**
 * Valida formato de telefone brasileiro
 * @param {string} phone - Telefone a ser validado
 * @returns {Object} {isValid: boolean, formatted: string, message: string}
 */
export function validatePhone(phone) {
    if (typeof phone !== 'string') {
        return {
            isValid: false,
            formatted: '',
            message: 'Telefone deve ser um texto'
        };
    }
    
    const trimmedPhone = phone.trim();
    
    // Se estiver vazio, é válido (campo opcional)
    if (trimmedPhone.length === 0) {
        return {
            isValid: true,
            formatted: '',
            message: ''
        };
    }
    
    // Remover todos os caracteres não numéricos
    const numbersOnly = trimmedPhone.replace(/\D/g, '');
    
    // Validar tamanho (10 ou 11 dígitos para Brasil)
    if (numbersOnly.length < 10 || numbersOnly.length > 11) {
        return {
            isValid: false,
            formatted: trimmedPhone,
            message: 'Telefone deve ter 10 ou 11 dígitos'
        };
    }
    
    // Formatar para exibição
    let formatted;
    if (numbersOnly.length === 10) {
        // (XX) XXXX-XXXX
        formatted = `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2, 6)}-${numbersOnly.slice(6)}`;
    } else {
        // (XX) XXXXX-XXXX
        formatted = `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2, 7)}-${numbersOnly.slice(7)}`;
    }
    
    return {
        isValid: true,
        formatted: formatted,
        message: ''
    };
}

/* ==========================================================================
   UTILITÁRIOS DIVERSOS
   ========================================================================== */

/**
 * Gera um ID único baseado em timestamp e random
 * @returns {string} ID único
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce para limitar frequência de chamadas de função
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em milissegundos
 * @returns {Function} Função com debounce aplicado
 */
export function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para limitar frequência máxima de execução
 * @param {Function} func - Função a ser executada
 * @param {number} limit - Intervalo mínimo em milissegundos
 * @returns {Function} Função com throttle aplicado
 */
export function throttle(func, limit) {
    let inThrottle;
    
    return function() {
        const args = arguments;
        const context = this;
        
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Sanitiza string removendo caracteres perigosos
 * @param {string} str - String a ser sanitizada
 * @returns {string} String sanitizada
 */
export function sanitizeString(str) {
    if (typeof str !== 'string') {
        return '';
    }
    
    return str
        .trim()
        .replace(/[<>'"&]/g, '') // Remove caracteres potencialmente perigosos
        .slice(0, 1000); // Limita tamanho máximo
}

/**
 * Calcula porcentagem
 * @param {number} part - Parte
 * @param {number} total - Total
 * @returns {number} Porcentagem (0-100)
 */
export function calculatePercentage(part, total) {
    if (typeof part !== 'number' || typeof total !== 'number' || total === 0) {
        return 0;
    }
    
    return Math.round((part / total) * 100);
}

/**
 * Formata um número com separadores de milhares
 * @param {number} num - Número a ser formatado
 * @returns {string} Número formatado
 */
export function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    
    return new Intl.NumberFormat('pt-BR').format(num);
}

/* ==========================================================================
   CONSTANTES ÚTEIS
   ========================================================================== */

// Expressões regulares comuns
export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_BR: /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/,
    NUMBERS_ONLY: /^\d+$/,
    CURRENCY_BR: /^R\$\s?\d{1,3}(\.\d{3})*,\d{2}$/
};

// Constantes de tempo
export const TIME = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000
};

// Mensagens padrão
export const MESSAGES = {
    LOADING: 'Carregando...',
    ERROR_GENERIC: 'Ocorreu um erro inesperado',
    ERROR_NETWORK: 'Erro de conexão',
    SUCCESS_SAVE: 'Dados salvos com sucesso',
    SUCCESS_DELETE: 'Item removido com sucesso',
    CONFIRM_DELETE: 'Tem certeza que deseja excluir este item?'
};

console.log('Utils.js inicializado - Funções utilitárias carregadas');
