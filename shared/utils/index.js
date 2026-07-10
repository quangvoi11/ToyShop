"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.generateOrderCode = generateOrderCode;
exports.formatCurrency = formatCurrency;
exports.calculateDiscount = calculateDiscount;
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function generateOrderCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TS${timestamp}${random}`;
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}
function calculateDiscount(basePrice, salePrice) {
    if (basePrice <= 0)
        return 0;
    return Math.round(((basePrice - salePrice) / basePrice) * 100);
}
//# sourceMappingURL=index.js.map