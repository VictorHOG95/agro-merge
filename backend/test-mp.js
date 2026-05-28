const {
    MercadoPagoConfig,
    Preference
} = require('mercadopago');

const client = new MercadoPagoConfig({

    accessToken: 'APP_USR-3078148543034322-052714-340b6b90e1a2e14719a429459cae851b-3429822527'

});

async function test() {

    try {

        const preference = new Preference(client);

        const response =
            await preference.create({

                body: {

                    items: [

                        {
                            title: 'Test',
                            quantity: 1,
                            unit_price: 10
                        }

                    ]

                }

            });

        console.log(response);

    } catch (error) {

        console.error(error);

    }

}

test();