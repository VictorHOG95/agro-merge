// ===============================================
// Fake Payment Provider
// Simulación de pagos para desarrollo/testing
// ===============================================

// ===============================================
// Crear pago falso
// ===============================================
async function createPayment(data) {

    try {

        console.log(
            '🟡 Simulando pago fake'
        );

        // =======================================
        // Simular estados aleatorios
        // =======================================
        const estados = [

            'approved',
            'pending',
            'rejected'

        ];

        // =======================================
        // Estado aleatorio
        // =======================================
        const estado =
            estados[
                Math.floor(
                    Math.random() * estados.length
                )
            ];

        console.log(
            `🧪 Estado fake generado: ${estado}`
        );

        // =======================================
        // URL fake según resultado
        // =======================================
        let paymentUrl = '';

        // Pago aprobado
        if (estado === 'approved') {

            paymentUrl =
                `http://localhost:3000/pago-exitoso/${data.pedidoId}`;

        }

        // Pago pendiente
        else if (estado === 'pending') {

            paymentUrl =
                `http://localhost:3000/pago-pendiente/${data.pedidoId}`;

        }

        // Pago rechazado
        else {

            paymentUrl =
                `http://localhost:3000/pago-fallido/${data.pedidoId}`;

        }

        // =======================================
        // Respuesta normalizada
        // =======================================
        return {

            success: true,

            status: estado,

            paymentUrl,

            reference:
                `FAKE-${Date.now()}`

        };

    } catch (error) {

        console.error(
            '❌ Error Fake Provider:',
            error
        );

        throw error;

    }

}

// ===============================================
// Exportaciones
// ===============================================
module.exports = {
    createPayment
};