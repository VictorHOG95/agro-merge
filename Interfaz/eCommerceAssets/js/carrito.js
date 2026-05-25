// ==================== CARRITO DE COMPRAS ====================

class Carrito {
    constructor() {
        this.items = [];
        this.cargarDesdeStorage();
        this.inicializar();
    }

    inicializar() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.configurarEventos();
                this.agregarListenersProductos();
                this.actualizarVisual();
            });
        } else {
            this.configurarEventos();
            this.agregarListenersProductos();
            this.actualizarVisual();
        }
    }

    configurarEventos() {
        const btnCarrito = document.getElementById('btn-carrito');
        const carritoPanel = document.getElementById('carrito-panel');
        const carritoOverlay = document.getElementById('carrito-overlay');
        const btnCerrarCarrito = document.getElementById('btn-cerrar-carrito');
        const btnContinuar = document.getElementById('btn-continuar');
        const btnFinalizar = document.getElementById('btn-finalizar');

        if (!btnCarrito || !carritoPanel) {
            console.error('Elementos del carrito no encontrados');
            return;
        }

        // Abrir carrito
        btnCarrito.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            carritoPanel.classList.add('abierto');
            carritoOverlay.classList.add('abierto');
        });

        // Cerrar carrito con botón X
        if (btnCerrarCarrito) {
            btnCerrarCarrito.addEventListener('click', () => {
                carritoPanel.classList.remove('abierto');
                carritoOverlay.classList.remove('abierto');
            });
        }

        // Cerrar carrito con overlay
        if (carritoOverlay) {
            carritoOverlay.addEventListener('click', () => {
                carritoPanel.classList.remove('abierto');
                carritoOverlay.classList.remove('abierto');
            });
        }

        // Continuar comprando
        if (btnContinuar) {
            btnContinuar.addEventListener('click', () => {
                carritoPanel.classList.remove('abierto');
                carritoOverlay.classList.remove('abierto');
            });
        }

        // Finalizar compra
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => {
                this.finalizarCompra();
            });
        }
    }

    // Cargar carrito desde localStorage
    cargarDesdeStorage() {
        try {
            const data = localStorage.getItem('carrito');
            this.items = data ? JSON.parse(data) : [];
        } catch (e) {
            this.items = [];
        }
    }

    // Guardar carrito en localStorage
    guardarEnStorage() {
        localStorage.setItem('carrito', JSON.stringify(this.items));
    }

    // Agregar producto al carrito
    agregarProducto(producto) {
        const itemExistente = this.items.find(item => item.id === producto.id);
        
        if (itemExistente) {
            itemExistente.cantidad += producto.cantidad || 1;
        } else {
            this.items.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
                cantidad: producto.cantidad || 1,
                ubicacion: producto.ubicacion || 'Mercado Central'
            });
        }
        
        this.guardarEnStorage();
        this.actualizarVisual();
        this.mostrarNotificacion('Producto agregado al carrito');
    }

    // Eliminar producto del carrito
    eliminarProducto(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.guardarEnStorage();
        this.actualizarVisual();
    }

    // Actualizar cantidad de un producto
    actualizarCantidad(id, cantidad) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.cantidad = Math.max(1, parseInt(cantidad));
            this.guardarEnStorage();
            this.actualizarVisual();
        }
    }

    // Calcular subtotal
    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }

    // Calcular envío
    getEnvio() {
        return this.items.length > 0 ? 7900 : 0;
    }

    // Calcular total
    getTotal() {
        return this.getSubtotal() + this.getEnvio();
    }

    // Actualizar visual del carrito
    actualizarVisual() {
        const carritoCount = document.getElementById('carrito-count');
        const carritoItems = document.getElementById('carrito-items');
        const carritoResumen = document.getElementById('carrito-resumen');

        // Actualizar contador
        const totalItems = this.items.reduce((total, item) => total + item.cantidad, 0);
        if (carritoCount) {
            carritoCount.textContent = totalItems;
            carritoCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        // Actualizar items
        if (carritoItems) {
            if (this.items.length === 0) {
                carritoItems.innerHTML = `
                    <div class="carrito-vacio">
                        <i class="fa-solid fa-shopping-cart"></i>
                        <p>Tu carrito está vacío</p>
                    </div>
                `;
                if (carritoResumen) carritoResumen.style.display = 'none';
            } else {
                carritoItems.innerHTML = this.items.map(item => `
                    <div class="carrito-item">
                        <img src="${item.imagen}" alt="${item.nombre}" class="item-imagen">
                        <div class="item-detalles">
                            <h4>${item.nombre}</h4>
                            <p class="item-ubicacion"><i class="fa-solid fa-location-dot"></i> ${item.ubicacion}</p>
                            <p class="item-precio">COP$ ${this.formatearPrecio(item.precio)}</p>
                        </div>
                        <div class="item-cantidad">
                            <input type="number" min="1" value="${item.cantidad}" class="cantidad-input" data-id="${item.id}">
                        </div>
                        <div class="item-total">
                            <p class="item-subtotal">COP$ ${this.formatearPrecio(item.precio * item.cantidad)}</p>
                        </div>
                        <button class="btn-eliminar" data-id="${item.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `).join('');

                // Agregar event listeners a inputs de cantidad y botones eliminar
                this.agregarListenersItems();

                // Actualizar resumen
                if (carritoResumen) {
                    carritoResumen.style.display = 'block';
                    document.getElementById('subtotal').textContent = 'COP$ ' + this.formatearPrecio(this.getSubtotal());
                    document.getElementById('envio').textContent = 'COP$ ' + this.formatearPrecio(this.getEnvio());
                    document.getElementById('total').textContent = 'COP$ ' + this.formatearPrecio(this.getTotal());
                }
            }
        }
    }

    // Agregar listeners a items del carrito
    agregarListenersItems() {
        // Listeners para cantidad
        document.querySelectorAll('.cantidad-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.actualizarCantidad(e.target.dataset.id, e.target.value);
            });
        });

        // Listeners para eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.eliminarProducto(btn.dataset.id);
                this.mostrarNotificacion('Producto eliminado del carrito');
            });
        });
    }

    // Agregar listeners a botones de productos
    agregarListenersProductos() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-agregar-carrito')) {
                const btn = e.target.closest('.btn-agregar-carrito');
                const productoCard = btn.closest('.producto-card');
                
                if (productoCard) {
                    const producto = {
                        id: productoCard.dataset.productId || 'producto-' + Date.now(),
                        nombre: productoCard.querySelector('h3')?.textContent || 'Producto',
                        precio: parseInt(productoCard.querySelector('.valor')?.textContent?.replace(/[^0-9]/g, '') || 0),
                        imagen: productoCard.querySelector('img')?.src || '',
                        ubicacion: productoCard.querySelector('.ubicacion span')?.textContent || 'Mercado Central'
                    };
                    
                    if (producto.precio > 0) {
                        this.agregarProducto(producto);
                    }
                }
            }
        });
    }

    // Formatear precio
    formatearPrecio(precio) {
        return precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Mostrar notificación
    mostrarNotificacion(mensaje) {
        const notif = document.createElement('div');
        notif.className = 'notificacion';
        notif.textContent = mensaje;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.classList.add('mostrar');
        }, 10);
        
        setTimeout(() => {
            notif.classList.remove('mostrar');
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    // Finalizar compra
    finalizarCompra() {
        if (this.items.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }

        // ✅ VERIFICAR SI EL USUARIO ESTÁ REGISTRADO
        const sesionIniciada = localStorage.getItem('sesionIniciada');
        
        if (sesionIniciada !== 'true') {
            // Usuario NO está registrado
            const respuesta = confirm(
                '⚠️ Debes iniciar sesión para realizar una compra.\n\n' +
                '¿Deseas ir a la página de Login?\n\n' +
                'Aceptar = Ir a Login\nCancelar = Continuar comprando'
            );
            
            if (respuesta) {
                // Guardar la intención de compra para después del login
                const pedido = {
                    items: this.items,
                    subtotal: this.getSubtotal(),
                    envio: this.getEnvio(),
                    total: this.getTotal(),
                    fecha: new Date().toISOString()
                };
                localStorage.setItem('pedido_pendiente', JSON.stringify(pedido));
                
                // Redirigir a login
                window.location.href = '/pages/Login/login.html';
            }
            return;
        }

        // Usuario SÍ está registrado - proceder con la compra
        const pedido = {
            items: this.items,
            subtotal: this.getSubtotal(),
            envio: this.getEnvio(),
            total: this.getTotal(),
            fecha: new Date().toISOString()
        };

        localStorage.setItem('pedido_actual', JSON.stringify(pedido));
        window.location.href = '/pages/Checkout/checkout.html';
    }

    // Limpiar carrito
    limpiar() {
        this.items = [];
        this.guardarEnStorage();
        this.actualizarVisual();
    }
}

// Instanciar carrito global
const carrito = new Carrito();
