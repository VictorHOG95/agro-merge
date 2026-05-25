class FiltroProductos {
    constructor() {
        this.productos = [];
        this.productosFiltrados = [];
        this.inicializar();
    }

    inicializar() {
        // Capturar todos los productos del DOM
        this.capturaProductos();
        
        // Configurar event listeners
        this.configurarEventos();
    }

    capturaProductos() {
        // Obtener todas las tarjetas de producto
        const tarjetas = document.querySelectorAll('.producto-card');
        
        this.productos = Array.from(tarjetas).map((tarjeta) => {
            const nombre = tarjeta.querySelector('h3')?.textContent?.trim() || '';
            const precio = parseInt(
                tarjeta.querySelector('.valor')?.textContent?.replace(/[^0-9]/g, '') || 0
            );
            const mercado = tarjeta.querySelector('.ubicacion span')?.textContent?.trim() || '';
            
            return {
                elemento: tarjeta,
                nombre: nombre.toLowerCase(),
                nombreOriginal: nombre,
                precio: precio,
                mercado: mercado
            };
        });
        
        console.log('✓ Productos capturados:', this.productos.length);
    }

    configurarEventos() {
        // Input de búsqueda
        const inputBuscar = document.getElementById('buscar-producto');
        if (inputBuscar) {
            inputBuscar.addEventListener('input', () => this.aplicarFiltros());
        }

        // Radio buttons de mercado
        const radioBotones = document.querySelectorAll('input[name="mercado"]');
        radioBotones.forEach(radio => {
            radio.addEventListener('change', () => this.aplicarFiltros());
        });

        // Inputs de precio
        const precioMin = document.getElementById('precio-min');
        const precioMax = document.getElementById('precio-max');
        const priceSlider = document.getElementById('price-slider');

        if (precioMin) {
            precioMin.addEventListener('input', () => this.aplicarFiltros());
        }
        if (precioMax) {
            precioMax.addEventListener('input', () => this.aplicarFiltros());
        }
        if (priceSlider) {
            priceSlider.addEventListener('input', (e) => {
                document.getElementById('precio-display').textContent = 
                    this.formatearPrecio(e.target.value);
                this.aplicarFiltros();
            });
        }

        // Botón limpiar filtros
        const btnLimpiar = document.getElementById('btn-limpiar-filtros');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => this.limpiarFiltros());
        }
    }

    aplicarFiltros() {
        // Obtener valores de filtros
        const textoBusqueda = (document.getElementById('buscar-producto')?.value || '').toLowerCase();
        
        const mercadoSeleccionado = Array.from(document.querySelectorAll('input[name="mercado"]'))
            .find(radio => radio.checked)?.value || '';
        
        const precioMin = parseInt(document.getElementById('precio-min')?.value || 0);
        const precioMax = parseInt(document.getElementById('precio-max')?.value || 30000000);
        const precioSlider = parseInt(document.getElementById('price-slider')?.value || 30000000);

        // Usar el menor del slider y el input max
        const maxFinal = Math.min(precioMax, precioSlider);

        // Filtrar productos
        this.productosFiltrados = this.productos.filter(producto => {
            // Filtro de búsqueda
            if (textoBusqueda && !producto.nombre.includes(textoBusqueda)) {
                return false;
            }

            // Filtro de mercado
            if (mercadoSeleccionado && producto.mercado !== mercadoSeleccionado) {
                return false;
            }

            // Filtro de precio
            if (producto.precio < precioMin || producto.precio > maxFinal) {
                return false;
            }

            return true;
        });

        // Actualizar visualización
        this.mostrarProductos();
        
        console.log('✓ Productos que coinciden:', this.productosFiltrados.length);
    }

    mostrarProductos() {
        // Ocultar todos los productos inicialmente
        this.productos.forEach(p => {
            p.elemento.style.display = 'none';
        });

        // Mostrar solo los filtrados
        if (this.productosFiltrados.length === 0) {
            // Mostrar mensaje de no hay resultados
            const catalogo = document.querySelector('.catalogo-productos');
            if (catalogo) {
                let mensajeNoResultados = document.getElementById('no-resultados');
                if (!mensajeNoResultados) {
                    mensajeNoResultados = document.createElement('div');
                    mensajeNoResultados.id = 'no-resultados';
                    mensajeNoResultados.style.cssText = `
                        grid-column: 1 / -1;
                        text-align: center;
                        padding: 40px;
                        color: #999;
                        font-size: 18px;
                    `;
                    catalogo.appendChild(mensajeNoResultados);
                }
                mensajeNoResultados.textContent = '❌ No se encontraron productos que coincidan con tus filtros';
            }
        } else {
            // Remover mensaje de no resultados si existe
            const mensajeNoResultados = document.getElementById('no-resultados');
            if (mensajeNoResultados) {
                mensajeNoResultados.remove();
            }

            // Mostrar productos filtrados
            this.productosFiltrados.forEach(p => {
                p.elemento.style.display = 'block';
            });
        }
    }

    limpiarFiltros() {
        // Limpiar inputs
        const inputBuscar = document.getElementById('buscar-producto');
        if (inputBuscar) inputBuscar.value = '';

        // Desseleccionar radios
        const radioBotones = document.querySelectorAll('input[name="mercado"]');
        radioBotones.forEach(radio => radio.checked = false);

        // Resetear precios
        const precioMin = document.getElementById('precio-min');
        const precioMax = document.getElementById('precio-max');
        const priceSlider = document.getElementById('price-slider');

        if (precioMin) precioMin.value = '0';
        if (precioMax) precioMax.value = '30000000';
        if (priceSlider) priceSlider.value = '30000000';

        // Actualizar display de precio
        const precioDisplay = document.getElementById('precio-display');
        if (precioDisplay) precioDisplay.textContent = this.formatearPrecio('30000000');

        // Aplicar filtros (mostrar todos)
        this.aplicarFiltros();
        
        console.log('✓ Filtros limpiados');
    }

    formatearPrecio(valor) {
        return parseInt(valor).toLocaleString('es-CO');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new FiltroProductos();
});
