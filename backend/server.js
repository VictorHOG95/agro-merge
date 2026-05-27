    const express = require('express');
    const mysql = require('mysql2');
    const cors = require('cors');
    const path = require('path');
    const nodemailer = require('nodemailer');

    // ===============================================
    // Importación del servicio desacoplado de pagos
    // ===============================================
    const paymentService = require('./payments/paymentService');

    const app = express();

    // Configuración de Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'agromerge@gmail.com',
            pass: 'codr ubjv pjvg sbxy' // Recuerda que esta es una App Password de Google
        }
    });

    // Middlewares
    app.use(cors());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // Conexión a la Base de Datos
    const conexion = mysql.createConnection({
        host: '127.0.0.1',
        port: 3306, // Usamos el puerto libre para evitar el "Shutdown"
        user: 'root',
        password: '1234',
        database: 'agro_merge_db'
    });

    conexion.connect((error) => {
        if (error) {
            console.error('❌ Error conectando a la base de datos:', error);
        } else {
            console.log('✅ ¡Conectado exitosamente a la base de datos!');
        }
    });

    // --- RUTA: REGISTRO ---
    app.post('/registro', (req, res) => {
        const nombre = req.body.nombre_usuario;
        const email = req.body.correo_usuario;
        const contrasena = req.body.clave_usuario;
        const codigoVerificacion = Math.floor(1000 + Math.random() * 9000);

        const sql = 'INSERT INTO usuarios (nombre, email, contrasena, estado, codigo_verificacion) VALUES (?, ?, ?, "inactivo", ?)';

        conexion.query(sql, [nombre, email, contrasena, codigoVerificacion], (error, resultados) => {
            if (error) {
                console.error('Error en MySQL:', error);
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.send('<h1>Error</h1><p>Este correo ya está registrado.</p><a href="javascript:history.back()">Volver</a>');
                }
                return res.status(500).send('Error al registrar en la base de datos.');
            }

            const opcionesCorreo = {
                from: '"Agro-Merge 🌿" <agromerge@gmail.com>',
                to: email,
                subject: 'Tu código de verificación - Agro-Merge',
                html: `
                    <div style="text-align: center; font-family: sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #16a34a;">¡Hola ${nombre}!</h2>
                        <p>Gracias por unirte a Agro-Merge. Usa el siguiente código para activar tu cuenta:</p>
                        <h1 style="background: #f0fdf4; display: inline-block; padding: 10px 20px; border-radius: 5px; color: #16a34a; letter-spacing: 5px;">${codigoVerificacion}</h1>
                        <p style="font-size: 0.8em; color: #666;">Si no solicitaste este código, ignora este correo.</p>
                    </div>
                `
            };

            transporter.sendMail(opcionesCorreo, (err, info) => {
                if (err) {
                    console.error('Error de Nodemailer:', err);
                    // Redirigimos igual para que el usuario intente validar, o puedes mostrar un error
                    return res.redirect('/pages/Confirmar-codigo/confirmar-codigo.html');
                }
                console.log('✅ Correo enviado con éxito a:', email);
                return res.redirect('/pages/Confirmar-codigo/confirmar-codigo.html');
            });
        });
    });

    // --- RUTA: LOGIN (CORREGIDA) ---
    app.post('/login', (req, res) => {
        const email = req.body.correo_usuario;
        const contrasena = req.body.clave_usuario;

        const sql = 'SELECT * FROM usuarios WHERE email = ? AND contrasena = ?';

        conexion.query(sql, [email, contrasena], (error, resultados) => {
            if (error) {
                console.error('Error en el login:', error);
                return res.status(500).send('Hubo un error al procesar tu solicitud.');
            }

            if (resultados.length > 0) {
                const usuario = resultados[0];
                
                if (usuario.estado === 'inactivo') {
                    return res.send('<h1>Cuenta inactiva</h1><p>Debes verificar tu código de 4 dígitos.</p><a href="/pages/Confirmar-codigo/confirmar-codigo.html">Ir a verificar ahora</a>');
                }

                console.log('✅ Login exitoso:', usuario.nombre);
                
                // Unimos todos los parámetros en una sola URL para evitar el error de doble redirect
                const nombreSeguro = encodeURIComponent(usuario.nombre);
                const emailSeguro = encodeURIComponent(usuario.email);
                const rolSeguro = encodeURIComponent(usuario.rol);
                
                let redirectUrl = `/Index.html?login=true&nombre=${nombreSeguro}&email=${emailSeguro}&rol=${rolSeguro}`;
                
                if (usuario.rol === 'vendedor') {
                    redirectUrl = `/pages/Perfil-vendedor/vendedor-dashboard.html?login=true&nombre=${nombreSeguro}&email=${emailSeguro}&rol=${rolSeguro}`;
                }
                
                return res.redirect(redirectUrl);
            } else {
                return res.send('<h1>Error</h1><p>Correo o contraseña incorrectos.</p><a href="javascript:history.back()">Volver a intentar</a>');
            }
        });
    });

    // --- RUTA: VERIFICAR CÓDIGO ---
    app.post('/verificar-codigo', (req, res) => {
        const { d1, d2, d3, d4, correo_usuario } = req.body;
        const codigoIngresado = `${d1}${d2}${d3}${d4}`;

        const sql = 'SELECT * FROM usuarios WHERE email = ? AND codigo_verificacion = ?';

        conexion.query(sql, [correo_usuario, codigoIngresado], (error, resultados) => {
            if (error) {
                return res.status(500).send("Error en la base de datos.");
            }

            if (resultados.length > 0) {
                const updateSql = 'UPDATE usuarios SET estado = "activo" WHERE email = ?';
                conexion.query(updateSql, [correo_usuario], (err) => {
                    if (err) return res.status(500).send("Error al activar cuenta.");
                    return res.redirect('/pages/Correo-verificado/correo.verificado.html');
                });
            } else {
                return res.send(`
                    <h1>Código incorrecto</h1>
                    <p>El código ${codigoIngresado} no es válido.</p>
                    <a href="javascript:history.back()">Intentar de nuevo</a>
                `);
            }
        });
    });

    // --- RUTAS DEL CARRITO ---
    app.post('/carrito/obtener', (req, res) => {
        const { usuarioEmail } = req.body;
        // Nota: Aquí faltaría configurar express-session si planeas usar req.session
        res.json({ success: true, carrito: [], total: 0 });
    });

    app.post('/carrito/agregar', (req, res) => {
        const { productId, nombre, precio } = req.body;
        if (!productId || !nombre) return res.status(400).json({ success: false });
        res.json({ success: true, message: 'Agregado' });
    });

    // --- RUTA: CHECKOUT (Lógica de Agro-Merge) ---
    app.post('/checkout', async (req, res) => {
        // Recibimos los datos del CURL
        const { usuarioEmail, total, items, direccion, ciudad, departamento } = req.body;
        const direccionCompleta = `${direccion}, ${ciudad}, ${departamento}`;

        // 1. Buscamos el ID del usuario en la tabla 'usuarios'
        // En tu captura de 'usuarios' la columna es 'id_usuario'
        conexion.query('SELECT id_usuario FROM usuarios WHERE email = ?', [usuarioEmail], async (err, users) => {
            if (err) return res.status(500).json({ success: false, error: 'Error al buscar usuario' });
            
            if (users.length === 0) {
                return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            }

            const idRealDelUsuario = users[0].id_usuario;

            // 2. Insertamos en 'pedidos' 
            // USAMOS: 'id_comprador' porque así aparece en tu captura de phpMyAdmin
            const sqlPedido = `
                INSERT INTO pedidos (id_comprador, estado, total, direccion_entrega, fecha_pedido) 
                VALUES (?, 'pendiente', ?, ?, NOW())
            `;

            conexion.query(sqlPedido, [idRealDelUsuario, total, direccionCompleta], async (errP, resP) => {
                if (errP) {
                    console.error("❌ Error de MySQL:", errP.sqlMessage);
                    return res.status(500).json({ success: false, error: errP.sqlMessage });
                }

                const idPedidoNuevo = resP.insertId;
                // console.log(`✅ Pedido ${idPedidoNuevo} creado para id_comprador: ${idRealDelUsuario}`);

                // 3. Respuesta de éxito
                // return res.json({
                //     success: true,
                //     message: '¡Compra procesada con éxito!',
                //     pedidoId: idPedidoNuevo
                // });


                // ===============================================
                // Registrar pago pendiente en la base de datos
                // ===============================================
                //
                // El pago inicialmente se crea como:
                // estado_pago = pendiente
                //
                // Luego Mercado Pago actualizará este estado.
                // ===============================================
                const sqlPago = `
                    INSERT INTO pagos (
                        id_pedido,
                        metodo_pago,
                        estado_pago,
                        monto,
                        fecha_pago,
                        proveedor_pago
                    )
                    VALUES (?, ?, 'pendiente', ?, NOW(), ?)
                `;

                // Método de pago temporal
                const metodoPago = 'mercado_pago';

                // Proveedor de pago
                const proveedorPago = 'mercado_pago';

                // Guardar pago
                conexion.query(
                    sqlPago,
                    [
                        idPedidoNuevo,
                        metodoPago,
                        total,
                        proveedorPago
                    ],
                    async (errPago, resPago) => {

                        // Error guardando pago
                        if (errPago) {

                            console.error(
                                '❌ Error creando pago:',
                                errPago.sqlMessage
                            );

                            return res.status(500).json({
                                success: false,
                                error: errPago.sqlMessage
                            });
                        }

                        console.log(
                            `✅ Pago registrado para pedido ${idPedidoNuevo}`
                        );

                        // =======================================
                        // Crear pago usando PaymentService
                        // =======================================
                        const payment =
                            await paymentService.createPayment({

                                pedidoId: idPedidoNuevo,
                                total,
                                items

                            });

                        // =======================================
                        // Respuesta final al frontend
                        // =======================================
                        return res.json({

                            success: true,
                            pedidoId: idPedidoNuevo,
                            // URL de pago generada
                            paymentUrl: payment.paymentUrl

                        });

                    }
                );

            });
        });
    });

    // ===============================================
    // Simulación de confirmación de pago exitoso
    // ===============================================
    //
    // Este endpoint simula la confirmación que
    // posteriormente enviará Mercado Pago.
    //
    // Temporalmente se usará para actualizar:
    // - pagos
    // - pedidos
    // ===============================================
    app.get('/pago-exitoso/:pedidoId', (req, res) => {

        const pedidoId = req.params.pedidoId;

        // ===========================================
        // Actualizar tabla pagos
        // ===========================================
        const sqlPago = `
            UPDATE pagos
            SET estado_pago = 'pagado'
            WHERE id_pedido = ?
        `;

        conexion.query(sqlPago, [pedidoId], (errPago) => {

            if (errPago) {

                return res.status(500).json({
                    success: false,
                    error: errPago.sqlMessage
                });
            }

            // =======================================
            // Actualizar tabla pedidos
            // =======================================
            const sqlPedido = `
                UPDATE pedidos
                SET estado = 'pagado'
                WHERE id_pedido = ?
            `;

            conexion.query(sqlPedido, [pedidoId], (errPedido) => {

                if (errPedido) {

                    return res.status(500).json({
                        success: false,
                        error: errPedido.sqlMessage
                    });
                }

                console.log(
                    `✅ Pedido ${pedidoId} marcado como PAGADO`
                );

                res.json({
                    success: true
                });

            });

        });

    });

    app.get('/mis-pedidos/:email', (req, res) => {
        const email = req.params.email;

        const sql = `
            SELECT p.id_pedido, p.fecha_pedido, p.total, p.estado, p.direccion_entrega,
                GROUP_CONCAT(CONCAT(dp.cantidad, 'x ', prod.nombre) SEPARATOR ', ') as resumen_productos
            FROM pedidos p
            JOIN usuarios u ON p.id_comprador = u.id_usuario
            LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            LEFT JOIN productos prod ON dp.id_producto = prod.id_producto
            WHERE u.email = ?
            GROUP BY p.id_pedido
            ORDER BY p.fecha_pedido DESC
        `;

        conexion.query(sql, [email], (err, resultados) => {
            if (err) {
                console.error("❌ Error al obtener pedidos:", err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, pedidos: resultados });
        });
    });

    app.get('/detalle-pedido/:id', (req, res) => {
        const pedidoId = req.params.id;
        const sql = `
            SELECT dp.*, p.nombre as producto_nombre, p.imagen
            FROM detalle_pedido dp
            JOIN productos p ON dp.id_producto = p.id_producto
            WHERE dp.id_pedido = ?
        `;
        conexion.query(sql, [pedidoId], (err, resultados) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, detalles: resultados });
        });
    });
    // Archivos estáticos y encendido
    app.use(express.static(path.join(__dirname, '../Interfaz')));

    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor Agro-Merge corriendo en http://localhost:${PORT}`);
    });