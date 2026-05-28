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
// SDK oficial de Mercado Pago
// ===============================================
const {
    MercadoPagoConfig,
    Preference
} = require('mercadopago');

// ===============================================
// Configuración cliente Mercado Pago
// ===============================================
const client = new MercadoPagoConfig({

    accessToken: 'APP_USR-3078148543034322-052714-340b6b90e1a2e14719a429459cae851b-3429822527'

});


// ===============================================
// Función para crear un pago
// ===============================================
//
// Esta función:
// 1. Recibe datos del checkout
// 2. Crea una preferencia de Mercado Pago
// 3. Devuelve la URL de pago
// ===============================================
async function createPayment(data) {

    try {

        console.log(
            '🟢 Creando preferencia Mercado Pago'
        );

        // =======================================
        // Instancia Preference
        // =======================================
        const preference = new Preference(client);

        // =======================================
        // Crear preferencia
        // =======================================
        console.log(
            JSON.stringify({
                items: data.items
            }, null, 2)
        );
        const response = await preference.create({

            body: {

                items: data.items.map(item => ({

                    title: item.nombre,

                    quantity: Number(item.cantidad),

                    unit_price: Number(item.precio),

                    currency_id: 'COP'

                })),

                // ===================================
                // URLs retorno
                // ===================================
                back_urls: {

                    success:
                        `http://localhost:3000/pago-exitoso/${data.pedidoId}`,

                    failure:
                        `http://localhost:3000/pago-fallido/${data.pedidoId}`,

                    pending:
                        `http://localhost:3000/pago-pendiente/${data.pedidoId}`

                },

                //Genera fallos
                //auto_return: 'approved',

                // ===================================
                // Referencia interna
                // ===================================
                external_reference:
                    String(data.pedidoId)

            }


        });

        console.log(
            '✅ Preferencia creada'
        );

        // =======================================
        // Retorno normalizado
        // =======================================
        return {

            success: true,

            paymentUrl: response.sandbox_init_point,

            reference: response.id

        };

    } catch (error) {

        console.error(
            '❌ Error Mercado Pago:',
            error
        );

        throw error;

    }

}

// Exportamos las funciones del proveedor
module.exports = {
    createPayment
};