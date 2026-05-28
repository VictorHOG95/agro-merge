// ===============================================
// Servicio de pagos desacoplado
// ===============================================
//
// Este archivo actúa como una capa intermedia
// entre el sistema de ecommerce y el proveedor
// de pagos.
//
// Objetivo:
// Permitir cambiar fácilmente entre:
// - Mercado Pago
// - Stripe
// - Wompi
// - ePayco
//
// sin modificar la lógica del checkout.
// ===============================================

// Importamos el proveedor actual de pagos
const mercadoPagoProvider = require('./mercadoPagoProvider');
const fakeProvider = require('./providers/fakeProvider');


// Definimos el proveedor activo.
// Se cambia segun el proveedor
const provider = fakeProvider;
//const provider = mercadoPagoProvider;

// ===============================================
// Función genérica para crear pagos
// ===============================================
//
// El checkout NO debe conocer detalles del
// proveedor.
//
// Solo debe llamar esta función.
// ===============================================
async function createPayment(data) {

    return provider.createPayment(data);

}

// Exportamos el servicio
module.exports = {
    createPayment
};