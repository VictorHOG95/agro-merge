// ===============================================
// Proveedor Mercado Pago
// ===============================================
//
// Este archivo contendrá toda la lógica específica
// de Mercado Pago.
//
// La idea es evitar mezclar:
// - lógica ecommerce
// - lógica de pagos
//
// De esta forma, si se cambia de proveedor,
// solo se modifica este archivo.
// ===============================================

// ===============================================
// Función para crear un pago
// ===============================================
//
// Actualmente es una simulación temporal.
//
// Más adelante aquí se integrará:
// - SDK Mercado Pago
// - creación de preferencias
// - links de pago reales
// ===============================================
async function createPayment(data) {

    console.log('🟢 Creando pago con Mercado Pago');

    // Simulación temporal de respuesta
    return {
        success: true,

        // URL 
        paymentUrl: `http://localhost:3000/pago-exitoso/${data.pedidoId}`,

        // Referencia externa simulada
        externalReference: 'TEST-123'
    };

}

// Exportamos las funciones del proveedor
module.exports = {
    createPayment
};