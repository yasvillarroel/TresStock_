// TITULO 1 CONFIGURACION GENERAL DE USUARIOS

const URL_API_USUARIOS = 'http://127.0.0.1:3000/api/usuarios';
let usuariosCargados = [];
let modoFormularioUsuario = 'nuevo';
let idUsuarioEditado = null;
let guardandoUsuario = false;
let cambiandoEstadoUsuario = false;
let resolverAlertaUsuarios = null;
let focoAnteriorAlertaUsuarios = null;
const selectoresUsuarios = {};


// TITULO 2 MODALES DE MENSAJES Y CONFIRMACIONES

function configurarAlertasUsuarios() {
    const fondo = document.getElementById('contenedor_alerta_usuarios');
    const aceptar = document.getElementById('boton_aceptar_alerta_usuarios');
    const cancelar = document.getElementById('boton_cancelar_alerta_usuarios');
    if (!fondo || !aceptar || !cancelar || fondo.dataset.configurado === 'si') return;
    fondo.dataset.configurado = 'si';

    aceptar.addEventListener('click', () => cerrarAlertaUsuarios(true));
    cancelar.addEventListener('click', () => cerrarAlertaUsuarios(false));
    fondo.addEventListener('click', evento => {
        if (evento.target === fondo) cerrarAlertaUsuarios(false);
    });
    fondo.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            evento.preventDefault();
            cerrarAlertaUsuarios(false);
            return;
        }
        if (evento.key !== 'Tab') return;
        const botones = [cancelar, aceptar].filter(b => !b.hidden);
        if (evento.shiftKey && document.activeElement === botones[0]) {
            evento.preventDefault();
            botones[botones.length - 1].focus();
        } else if (!evento.shiftKey && document.activeElement === botones[botones.length - 1]) {
            evento.preventDefault();
            botones[0].focus();
        }
    });
}

function abrirAlertaUsuarios({ titulo, mensaje, tipo = 'informacion', confirmar = false,
    textoAceptar = 'Aceptar' }) {
    const fondo = document.getElementById('contenedor_alerta_usuarios');
    const ventana = fondo?.querySelector('.modal_alerta_usuarios');
    const tituloElemento = document.getElementById('titulo_alerta_usuarios');
    const mensajeElemento = document.getElementById('mensaje_alerta_usuarios');
    const icono = document.getElementById('icono_alerta_usuarios');
    const aceptar = document.getElementById('boton_aceptar_alerta_usuarios');
    const cancelar = document.getElementById('boton_cancelar_alerta_usuarios');
    if (!fondo || !ventana || !tituloElemento || !mensajeElemento || !icono || !aceptar || !cancelar) {
        console.error('No se encontró el modal de avisos de Usuarios.');
        return Promise.resolve(false);
    }
    if (resolverAlertaUsuarios) return Promise.resolve(false);
    configurarAlertasUsuarios();
    const tipoValido = ['correcto', 'error', 'advertencia', 'informacion'].includes(tipo)
        ? tipo : 'informacion';
    ventana.dataset.tipo = tipoValido;
    tituloElemento.textContent = String(titulo || 'Aviso');
    mensajeElemento.textContent = String(mensaje || '');
    icono.textContent = { correcto: '✓', error: '×', advertencia: '!', informacion: 'i' }[tipoValido];
    cancelar.hidden = !confirmar;
    aceptar.textContent = textoAceptar;
    focoAnteriorAlertaUsuarios = document.activeElement;
    return new Promise(resolve => {
        resolverAlertaUsuarios = resolve;
        fondo.hidden = false;
        (confirmar ? cancelar : aceptar).focus();
    });
}

function cerrarAlertaUsuarios(resultado) {
    const fondo = document.getElementById('contenedor_alerta_usuarios');
    if (!fondo || !resolverAlertaUsuarios) return;
    fondo.hidden = true;
    const resolver = resolverAlertaUsuarios;
    resolverAlertaUsuarios = null;
    if (focoAnteriorAlertaUsuarios?.isConnected) focoAnteriorAlertaUsuarios.focus();
    resolver(Boolean(resultado));
}

function mostrarMensajeUsuarios(titulo, mensaje, tipo = 'informacion') {
    return abrirAlertaUsuarios({ titulo, mensaje, tipo });
}

function confirmarAccionUsuarios(titulo, mensaje, textoAceptar = 'Confirmar') {
    return abrirAlertaUsuarios({ titulo, mensaje, tipo: 'advertencia', confirmar: true, textoAceptar });
}


// TITULO 3 SELECTORES PERSONALIZADOS

function configurarSelectorUsuario(clave, opciones, alSeleccionar) {
    const base = {
        filtroRol: ['filtro_rol_usuarios', 'select_rol_usuarios', 'Todos los roles'],
        filtroEstado: ['filtro_estado_usuarios', 'select_estado_usuarios', 'Todos los estados'],
        formularioRol: ['formulario_rol_usuario', 'select_rol_usuario', 'Seleccionar rol']
    }[clave];
    if (!base) return;
    const [sufijo, idValor, textoInicial] = base;
    const entrada = document.getElementById(idValor);
    const boton = document.getElementById('boton_' + sufijo);
    const panel = document.getElementById('panel_' + sufijo);
    const lista = document.getElementById('opciones_' + sufijo);
    const texto = document.getElementById('texto_' + sufijo);
    if (!entrada || !boton || !panel || !lista || !texto) return;

    const cerrar = () => {
        panel.hidden = true;
        boton.setAttribute('aria-expanded', 'false');
    };
    const dibujar = () => {
        lista.replaceChildren();
        opciones.forEach(opcion => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'opcion_selector_usuarios';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(entrada.value === opcion.valor));
            item.textContent = opcion.texto;
            item.addEventListener('click', () => {
                entrada.value = opcion.valor;
                texto.textContent = opcion.texto;
                cerrar();
                boton.focus();
                if (alSeleccionar) alSeleccionar();
            });
            lista.appendChild(item);
        });
    };
    const actualizar = () => {
        const seleccion = opciones.find(opcion => opcion.valor === entrada.value);
        texto.textContent = seleccion?.texto || textoInicial;
        dibujar();
    };
    selectoresUsuarios[clave] = { entrada, boton, panel, actualizar, cerrar };
    if (boton.dataset.configurado === 'si') { actualizar(); return; }
    boton.dataset.configurado = 'si';
    boton.addEventListener('click', () => {
        if (boton.disabled) return;
        const estabaAbierto = !panel.hidden;
        Object.values(selectoresUsuarios).forEach(selector => selector.cerrar());
        if (!estabaAbierto) {
            actualizar();
            panel.hidden = false;
            boton.setAttribute('aria-expanded', 'true');
        }
    });
    actualizar();
}

function configurarSelectoresUsuarios() {
    configurarSelectorUsuario('filtroRol', [
        { valor: '', texto: 'Todos los roles' },
        { valor: 'Administrador', texto: 'Administrador' },
        { valor: 'Usuario', texto: 'Usuario' }
    ], filtrarUsuarios);
    configurarSelectorUsuario('filtroEstado', [
        { valor: '', texto: 'Todos los estados' },
        { valor: 'activo', texto: 'Activos' },
        { valor: 'inactivo', texto: 'Inactivos' }
    ], filtrarUsuarios);
    configurarSelectorUsuario('formularioRol', [
        { valor: '', texto: 'Seleccionar rol' },
        { valor: 'Administrador', texto: 'Administrador' },
        { valor: 'Usuario', texto: 'Usuario' }
    ]);
    if (!document.documentElement.dataset.selectorUsuariosEventos) {
        document.documentElement.dataset.selectorUsuariosEventos = 'si';
        document.addEventListener('click', evento => {
            Object.values(selectoresUsuarios).forEach(selector => {
                if (!selector.boton.closest('.selector_personalizado_usuarios')?.contains(evento.target)) {
                    selector.cerrar();
                }
            });
        });
        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape') {
                Object.values(selectoresUsuarios).forEach(selector => selector.cerrar());
            }
        });
    }
}

function actualizarSelectorUsuarios(clave, valor) {
    const selector = selectoresUsuarios[clave];
    if (!selector) return;
    selector.entrada.value = valor;
    selector.actualizar();
    selector.cerrar();
}


// TITULO 4 FORMULARIO NUEVO, VER Y EDITAR

function limpiarFormularioUsuario() {
    ['input_nombre_usuario', 'input_email_usuario', 'input_password_usuario',
        'input_confirmar_password_usuario'].forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.value = '';
    });
    actualizarSelectorUsuarios('formularioRol', '');
}

function configurarModoFormularioUsuario() {
    const viendo = modoFormularioUsuario === 'ver';
    const editando = modoFormularioUsuario === 'editar';
    const titulo = document.getElementById('titulo_formulario_usuario');
    const guardar = document.getElementById('boton_guardar_usuario');
    const campoPassword = document.querySelector('.campo_password_usuario');
    const campoConfirmar = document.querySelector('.campo_confirmar_password_usuario');
    const textoPassword = document.querySelector('.texto_campo_password_usuario');
    const textoConfirmar = document.querySelector('.texto_campo_confirmar_password_usuario');
    if (titulo) titulo.textContent = viendo ? 'Detalle del usuario' :
        editando ? 'Editar usuario' : 'Nuevo usuario';
    if (guardar) {
        guardar.hidden = viendo;
        guardar.textContent = editando ? 'Guardar cambios' : 'Guardar usuario';
    }
    if (campoPassword) campoPassword.hidden = viendo;
    if (campoConfirmar) campoConfirmar.hidden = viendo;
    if (textoPassword) textoPassword.textContent = editando ? 'Nueva contraseña (opcional)' : 'Contraseña';
    if (textoConfirmar) textoConfirmar.textContent = editando ? 'Confirmar nueva contraseña' : 'Confirmar contraseña';
    ['input_nombre_usuario', 'input_email_usuario', 'input_password_usuario',
        'input_confirmar_password_usuario'].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.disabled = viendo;
    });
    const botonRol = document.getElementById('boton_formulario_rol_usuario');
    if (botonRol) botonRol.disabled = viendo;
    Object.values(selectoresUsuarios).forEach(selector => selector.cerrar());
}

function abrirFormularioUsuario() {
    if (guardandoUsuario) return;
    modoFormularioUsuario = 'nuevo';
    idUsuarioEditado = null;
    limpiarFormularioUsuario();
    configurarModoFormularioUsuario();
    document.getElementById('contenedor_formulario_usuario')?.classList.remove('contenedor_formulario_usuario_oculto');
    document.getElementById('input_nombre_usuario')?.focus();
}

function cerrarFormularioUsuario() {
    if (guardandoUsuario) return;
    document.getElementById('contenedor_formulario_usuario')?.classList.add('contenedor_formulario_usuario_oculto');
    Object.values(selectoresUsuarios).forEach(selector => selector.cerrar());
}

async function abrirDetalleUsuario(id, modo) {
    const usuario = usuariosCargados.find(item => Number(item.id_usuario) === Number(id));
    if (!usuario) {
        await mostrarMensajeUsuarios('Usuario no encontrado', 'No se encontró el usuario seleccionado.', 'error');
        return;
    }
    modoFormularioUsuario = modo;
    idUsuarioEditado = Number(usuario.id_usuario);
    limpiarFormularioUsuario();
    document.getElementById('input_nombre_usuario').value = usuario.nombre || '';
    document.getElementById('input_email_usuario').value = usuario.email || '';
    actualizarSelectorUsuarios('formularioRol', obtenerNombreRolUsuario(usuario));
    configurarModoFormularioUsuario();
    document.getElementById('contenedor_formulario_usuario')?.classList.remove('contenedor_formulario_usuario_oculto');
    document.getElementById('input_nombre_usuario')?.focus();
}


// TITULO 5 OBTENER Y MOSTRAR USUARIOS

function escaparTextoUsuario(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[caracter]));
}

function obtenerNombreRolUsuario(usuario) {
    if (usuario.rol || usuario.nombre_rol) return String(usuario.rol || usuario.nombre_rol);
    if (Number(usuario.id_rol) === 1) return 'Administrador';
    if (Number(usuario.id_rol) === 2) return 'Usuario';
    return '-';
}

function obtenerEstadoUsuario(usuario) {
    return usuario.activo === true || usuario.activo === 'true' ||
        usuario.activo === 1 || usuario.activo === '1';
}

function formatearFechaUsuario(fecha) {
    if (!fecha) return '-';
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return '-';
    return valor.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function cargarUsuarios() {
    try {
        const respuesta = await fetchConCsrf(URL_API_USUARIOS, { method: 'GET', credentials: 'include' });
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudieron cargar los usuarios.');
        usuariosCargados = Array.isArray(resultado) ? resultado :
            Array.isArray(resultado.usuarios) ? resultado.usuarios : [];
        filtrarUsuarios();
        actualizarIndicadoresUsuarios(usuariosCargados);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        await mostrarMensajeUsuarios('Error de conexión', error.message, 'error');
    }
}

function mostrarUsuarios(usuarios) {
    const cuerpo = document.getElementById('cuerpo_tabla_usuarios');
    if (!cuerpo) return;
    cuerpo.replaceChildren();
    if (usuarios.length === 0) {
        const fila = document.createElement('tr');
        fila.className = 'fila_sin_usuarios';
        const celda = document.createElement('td');
        celda.className = 'dato_sin_usuarios';
        celda.colSpan = 6;
        celda.textContent = usuariosCargados.length
            ? 'No se encontraron usuarios con los filtros seleccionados.'
            : 'No hay usuarios registrados para mostrar.';
        fila.appendChild(celda);
        cuerpo.appendChild(fila);
        return;
    }
    const ojo = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
        <circle cx="12" cy="12" r="3"/></svg>`;
    const lapiz = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/>
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg>`;
    const prohibido = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/>
        <path d="M5.6 5.6 18.4 18.4"/></svg>`;
    const activar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/>
        <path d="m7.5 12 3.2 3.2 6-6.4"/></svg>`;

    usuarios.forEach(usuario => {
        const activo = obtenerEstadoUsuario(usuario);
        const fila = document.createElement('tr');
        fila.className = activo ? 'fila_usuario' : 'fila_usuario fila_usuario_inactivo';
        fila.dataset.idUsuario = String(usuario.id_usuario);
        fila.innerHTML = `
            <td class="dato_nombre_usuarios">${escaparTextoUsuario(usuario.nombre || '-')}</td>
            <td class="dato_email_usuarios" title="${escaparTextoUsuario(usuario.email || '')}">
                ${escaparTextoUsuario(usuario.email || '-')}</td>
            <td class="dato_rol_usuarios">${escaparTextoUsuario(obtenerNombreRolUsuario(usuario))}</td>
            <td class="dato_estado_usuarios"><span class="${activo ? 'estado_usuario_activo' : 'estado_usuario_inactivo'}">
                ${activo ? 'Activo' : 'Inactivo'}</span></td>
            <td class="dato_fecha_creacion_usuarios">${escaparTextoUsuario(formatearFechaUsuario(usuario.fecha_creacion))}</td>
            <td class="dato_acciones_usuarios"><div class="contenedor_acciones_usuario">
                <button class="boton_accion_usuario boton_ver_usuario" type="button" title="Ver usuario"
                    aria-label="Ver usuario">${ojo}</button>
                <button class="boton_accion_usuario boton_editar_usuario" type="button" title="Editar usuario"
                    aria-label="Editar usuario">${lapiz}</button>
                <button class="boton_accion_usuario ${activo ? 'boton_desactivar_usuario' : 'boton_activar_usuario'}"
                    type="button" title="${activo ? 'Desactivar' : 'Activar'} usuario"
                    aria-label="${activo ? 'Desactivar' : 'Activar'} usuario">${activo ? prohibido : activar}</button>
            </div></td>`;
        cuerpo.appendChild(fila);
    });
}

function actualizarIndicadoresUsuarios(usuarios) {
    const asignar = (id, valor) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = Number(valor).toLocaleString('es-CL');
    };
    asignar('valor_total_usuarios', usuarios.length);
    asignar('valor_usuarios_activos', usuarios.filter(obtenerEstadoUsuario).length);
    asignar('valor_usuarios_inactivos', usuarios.filter(u => !obtenerEstadoUsuario(u)).length);
    asignar('valor_administradores_usuarios', usuarios.filter(u =>
        obtenerNombreRolUsuario(u).toLowerCase() === 'administrador').length);
}


// TITULO 6 BUSQUEDA Y FILTROS

function normalizarBusquedaUsuario(valor) {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim().replace(/\s+/g, ' ');
}

function filtrarUsuarios() {
    const texto = normalizarBusquedaUsuario(document.getElementById('input_busqueda_usuarios')?.value);
    const palabras = texto ? texto.split(' ') : [];
    const rol = document.getElementById('select_rol_usuarios')?.value || '';
    const estado = document.getElementById('select_estado_usuarios')?.value || '';
    const resultado = usuariosCargados.filter(usuario => {
        const nombre = normalizarBusquedaUsuario(usuario.nombre);
        const email = normalizarBusquedaUsuario(usuario.email);
        const coincideBusqueda = [nombre, email].some(campo => palabras.every(palabra => campo.includes(palabra)));
        const coincideRol = !rol || obtenerNombreRolUsuario(usuario) === rol;
        const coincideEstado = !estado || (estado === 'activo') === obtenerEstadoUsuario(usuario);
        return coincideBusqueda && coincideRol && coincideEstado;
    });
    mostrarUsuarios(resultado);
}

function limpiarFiltrosUsuarios() {
    const buscador = document.getElementById('input_busqueda_usuarios');
    if (buscador) buscador.value = '';
    actualizarSelectorUsuarios('filtroRol', '');
    actualizarSelectorUsuarios('filtroEstado', '');
    filtrarUsuarios();
}

function configurarFiltrosUsuarios() {
    const input = document.getElementById('input_busqueda_usuarios');
    const limpiar = document.getElementById('boton_limpiar_filtros_usuarios');
    if (input && input.dataset.configurado !== 'si') {
        input.dataset.configurado = 'si';
        input.addEventListener('input', filtrarUsuarios);
    }
    if (limpiar && limpiar.dataset.configurado !== 'si') {
        limpiar.dataset.configurado = 'si';
        limpiar.addEventListener('click', limpiarFiltrosUsuarios);
    }
}


// TITULO 7 CREAR Y EDITAR USUARIO

async function guardarUsuario() {
    if (guardandoUsuario || modoFormularioUsuario === 'ver') return;
    const nombre = document.getElementById('input_nombre_usuario').value.trim();
    const email = document.getElementById('input_email_usuario').value.trim().toLowerCase();
    const password = document.getElementById('input_password_usuario').value;
    const confirmar_password = document.getElementById('input_confirmar_password_usuario').value;
    const rol = document.getElementById('select_rol_usuario').value;
    const nuevo = modoFormularioUsuario === 'nuevo';

    if (nombre.length < 2 || nombre.length > 100) {
        await mostrarMensajeUsuarios('Datos incompletos', 'El nombre debe tener entre 2 y 100 caracteres.', 'advertencia');
        return;
    }
    if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        await mostrarMensajeUsuarios('Correo no válido', 'Ingresa un correo electrónico válido.', 'advertencia');
        return;
    }
    if (!rol) {
        await mostrarMensajeUsuarios('Falta seleccionar rol', 'Selecciona un rol para el usuario.', 'advertencia');
        return;
    }
    if ((nuevo || password || confirmar_password) && password.length < 8) {
        await mostrarMensajeUsuarios('Contraseña no válida', 'La contraseña debe tener al menos 8 caracteres.', 'advertencia');
        return;
    }
    if ((nuevo || password || confirmar_password) && password !== confirmar_password) {
        await mostrarMensajeUsuarios('Contraseñas diferentes', 'Las contraseñas no coinciden.', 'advertencia');
        return;
    }

    const datos = { nombre, email, rol };
    if (nuevo || password) {
        datos.password = password;
        datos.confirmar_password = confirmar_password;
    }
    guardandoUsuario = true;
    const boton = document.getElementById('boton_guardar_usuario');
    if (boton) boton.disabled = true;
    try {
        const url = nuevo ? URL_API_USUARIOS : URL_API_USUARIOS + '/' + encodeURIComponent(idUsuarioEditado);
        const respuesta = await fetchConCsrf(url, {
            method: nuevo ? 'POST' : 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo guardar el usuario.');
        guardandoUsuario = false;
        cerrarFormularioUsuario();
        await cargarUsuarios();
        await mostrarMensajeUsuarios(nuevo ? 'Usuario creado' : 'Usuario actualizado',
            nuevo ? 'El usuario se registró correctamente.' : 'Los datos del usuario se actualizaron correctamente.',
            'correcto');
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        await mostrarMensajeUsuarios('No se pudo guardar', error.message, 'error');
    } finally {
        guardandoUsuario = false;
        if (boton) boton.disabled = false;
    }
}


// TITULO 8 ACTIVAR Y DESACTIVAR USUARIOS

async function cambiarEstadoUsuario(idUsuario) {
    if (cambiandoEstadoUsuario) return;
    const usuario = usuariosCargados.find(item => Number(item.id_usuario) === Number(idUsuario));
    if (!usuario) return;
    const nuevoEstado = !obtenerEstadoUsuario(usuario);
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const confirmado = await confirmarAccionUsuarios(
        (nuevoEstado ? 'Activar' : 'Desactivar') + ' usuario',
        '¿Estás seguro de ' + accion + ' a ' + usuario.nombre + '?\n\nSu información se conservará.',
        nuevoEstado ? 'Activar' : 'Desactivar'
    );
    if (!confirmado) return;
    cambiandoEstadoUsuario = true;
    try {
        const respuesta = await fetchConCsrf(URL_API_USUARIOS + '/' + encodeURIComponent(idUsuario) + '/estado', {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: nuevoEstado })
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo cambiar el estado del usuario.');
        await cargarUsuarios();
        await mostrarMensajeUsuarios('Estado actualizado',
            'El usuario se ' + (nuevoEstado ? 'activó' : 'desactivó') + ' correctamente.', 'correcto');
    } catch (error) {
        await mostrarMensajeUsuarios('No se pudo cambiar el estado', error.message, 'error');
    } finally {
        cambiandoEstadoUsuario = false;
    }
}

function configurarAccionesTablaUsuarios() {
    const cuerpo = document.getElementById('cuerpo_tabla_usuarios');
    if (!cuerpo || cuerpo.dataset.configurado === 'si') return;
    cuerpo.dataset.configurado = 'si';
    cuerpo.addEventListener('click', evento => {
        const boton = evento.target.closest('button.boton_accion_usuario');
        if (!boton || !cuerpo.contains(boton)) return;
        const id = Number(boton.closest('tr')?.dataset.idUsuario);
        if (!Number.isSafeInteger(id) || id <= 0) return;
        if (boton.classList.contains('boton_ver_usuario')) abrirDetalleUsuario(id, 'ver');
        else if (boton.classList.contains('boton_editar_usuario')) abrirDetalleUsuario(id, 'editar');
        else if (boton.classList.contains('boton_desactivar_usuario') ||
            boton.classList.contains('boton_activar_usuario')) cambiarEstadoUsuario(id);
    });
}


// TITULO 9 INICIALIZACION USUARIOS

async function inicializarUsuarios() {
    configurarAlertasUsuarios();
    configurarSelectoresUsuarios();
    configurarFiltrosUsuarios();
    configurarAccionesTablaUsuarios();
    const guardar = document.getElementById('boton_guardar_usuario');
    if (guardar && guardar.dataset.configurado !== 'si') {
        guardar.dataset.configurado = 'si';
        guardar.addEventListener('click', guardarUsuario);
    }
    const nuevo = document.getElementById('boton_nuevo_usuario');
    if (nuevo && nuevo.dataset.teclado !== 'si') {
        nuevo.dataset.teclado = 'si';
        nuevo.addEventListener('keydown', evento => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                abrirFormularioUsuario();
            }
        });
    }
    await cargarUsuarios();
}
