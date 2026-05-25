/**
 * session-header.js - Versión Definitiva con Detalles de Pedido
 */
(function () {
  'use strict';

  function decodeSafe(raw) {
    if (!raw) return '';
    try { return decodeURIComponent(raw.replace(/\+/g, ' ')); } catch { return raw; }
  }

  function syncSession() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'true') {
      const email = params.get('email');
      const nombre = params.get('nombre');
      const rol = params.get('rol');
      if (email) localStorage.setItem('usuarioEmail', decodeSafe(email));
      if (nombre) {
        const dNombre = decodeSafe(nombre);
        localStorage.setItem('nombreUsuario', dNombre);
        localStorage.setItem('usuarioNombre', dNombre);
      }
      if (rol) localStorage.setItem('usuarioRol', decodeSafe(rol));
      localStorage.setItem('sesionIniciada', 'true');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function isSessionActive() {
    const nombre = localStorage.getItem('nombreUsuario') || localStorage.getItem('usuarioNombre');
    const email = localStorage.getItem('usuarioEmail');
    if (nombre && email) {
      localStorage.setItem('sesionIniciada', 'true');
      return true;
    }
    return false;
  }

  function applyUserMenu() {
    const btnLogin = document.getElementById('btn-login');
    if (!btnLogin || !isSessionActive()) return;

    const nombre = localStorage.getItem('nombreUsuario') || 'Usuario';
    const rol = localStorage.getItem('usuarioRol') || 'comprador';
    const userMenu = document.createElement('div');
    userMenu.id = 'session-user-wrap';
    userMenu.style.cssText = 'position: relative; display: inline-block; z-index: 1001;';
    
    // Si es vendedor, el link de perfil va directo al dashboard
    const perfilLink = rol === 'vendedor' 
      ? '/pages/Perfil-vendedor/vendedor-dashboard.html' 
      : '#'; // O el link que corresponda para comprador
    const perfilTexto = rol === 'vendedor' ? 'Panel de Vendedor' : 'Mi Perfil';

    userMenu.innerHTML = `
      <button type="button" id="btn-user-menu" style="background: #16a34a; border: none; cursor: pointer; color: white; display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <i class="fa-regular fa-user"></i> <span>${nombre}</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.8em;"></i>
      </button>
      <div id="dropdown-menu" style="display: none; position: absolute; top: 110%; right: 0; background: white; min-width: 200px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
        <a href="${perfilLink}" style="padding: 14px 20px; text-decoration: none; color: #333; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f5f5f5; transition: background 0.2s;">
          <i class="fa-solid ${rol === 'vendedor' ? 'fa-chart-line' : 'fa-user'}" style="color: #16a34a;"></i> <b>${perfilTexto}</b>
        </a>
        ${rol === 'comprador' ? `
        <a href="#" id="btn-mis-pedidos" style="padding: 14px 20px; text-decoration: none; color: #333; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f5f5f5; transition: background 0.2s;">
          <i class="fa-solid fa-truck-fast" style="color: #16a34a;"></i> <b>Mis Pedidos</b>
        </a>` : ''}
        <a href="#" id="btn-logout" style="padding: 14px 20px; text-decoration: none; color: #dc2626; display: flex; align-items: center; gap: 12px; font-weight: bold; transition: background 0.2s;">
          <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
        </a>
      </div>
    `;

    btnLogin.replaceWith(userMenu);

    const menuBtn = userMenu.querySelector('#btn-user-menu');
    const menu = userMenu.querySelector('#dropdown-menu');
    
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    };

    userMenu.querySelector('#btn-mis-pedidos').onclick = (e) => {
      e.preventDefault();
      menu.style.display = 'none';
      checkOrders(true);
    };

    userMenu.querySelector('#btn-logout').onclick = (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = '/Index.html';
    };

    document.onclick = () => menu.style.display = 'none';
  }

  async function checkOrders(force = false) {
    const email = localStorage.getItem('usuarioEmail');
    if (!email) return;

    try {
      const res = await fetch(`/mis-pedidos/${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.success && data.pedidos && data.pedidos.length > 0) {
        const activos = data.pedidos.filter(p => p.estado !== 'entregado' && p.estado !== 'cancelado');
        if (activos.length > 0) {
          showBar(activos[0], false);
        } else if (force) {
          showBar(data.pedidos[0], true);
        }
      } else if (force) {
        alert("No tienes pedidos registrados aún.");
      }
    } catch (err) {
      console.error("Error al obtener pedidos:", err);
    }
  }

  function showBar(pedido, hist) {
    let bar = document.getElementById('tracking-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'tracking-bar';
      const header = document.querySelector('header');
      if (header) header.after(bar);
      else document.body.prepend(bar);
    }

    const estados = {
      'pendiente': { c: '#f59e0b', bg: '#fffbeb', i: 'fa-clock', t: 'Pendiente' },
      'confirmado': { c: '#10b981', bg: '#ecfdf5', i: 'fa-check-circle', t: 'Confirmado' },
      'enviado': { c: '#3b82f6', bg: '#eff6ff', i: 'fa-truck', t: 'En Camino' },
      'entregado': { c: '#059669', bg: '#f0fdf4', i: 'fa-box-open', t: 'Entregado' },
      'cancelado': { c: '#ef4444', bg: '#fef2f2', i: 'fa-times-circle', t: 'Cancelado' }
    };
    const st = estados[pedido.estado] || { c: '#666', bg: '#f5f5f5', i: 'fa-box', t: pedido.estado };

    // Resumen de productos si existe
    const productosTxt = pedido.resumen_productos ? 
      `<div style="font-size: 0.8em; color: #666; margin-top: 4px; border-top: 1px dashed #ccc; padding-top: 4px;">
        ${pedido.resumen_productos}
      </div>` : '';

    bar.innerHTML = `
      <div style="background: ${st.bg}; border-bottom: 3px solid ${st.c}; padding: 12px 25px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 1000; animation: slideIn 0.4s; box-shadow: 0 2px 10px rgba(0,0,0,0.05); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap; flex: 1;">
          <span style="font-weight: bold; color: #16a34a; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-leaf"></i> Agro-Seguimiento
          </span>
          <div style="display: flex; flex-direction: column;">
            <span style="background: white; padding: 4px 12px; border-radius: 20px; border: 1px solid ${st.c}; color: ${st.c}; font-weight: bold; font-size: 0.85em; display: flex; align-items: center; gap: 8px; width: fit-content;">
              <i class="fa-solid ${st.i}"></i> ${hist ? 'ÚLTIMO' : st.t.toUpperCase()}: #${pedido.id_pedido}
            </span>
            ${productosTxt}
          </div>
          <span style="color: #444; font-size: 0.95em;">Total: <b>$${parseFloat(pedido.total).toLocaleString()}</b></span>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: #eee; border: none; cursor: pointer; color: #666; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; margin-left: 15px;">&times;</button>
      </div>
      <style>@keyframes slideIn { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
    `;
  }

  syncSession();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { applyUserMenu(); checkOrders(false); });
  } else {
    applyUserMenu();
    checkOrders(false);
  }
})();
