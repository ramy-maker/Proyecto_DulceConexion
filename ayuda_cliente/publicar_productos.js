const API_PRODUCTOS = "https://backend-a9wp.onrender.com/api/productos";

const formulario = document.querySelector("#formulario-producto");
const mensaje = document.querySelector("#estado-formulario");
const botonPublicar = document.querySelector("#boton-publicar");
const botonCancelarEdicion = document.querySelector("#boton-cancelar-edicion");
const enlaceCatalogo = document.querySelector("#enlace-catalogo");
const listaProductos = document.querySelector("#lista-productos");
const estadoGestion = document.querySelector("#estado-gestion");
let productoEditandoId = null;

function mostrarMensaje(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = tipo ? `mensaje mensaje--${tipo}` : "mensaje";
}

async function leerRespuesta(respuesta) {
    if (!respuesta.ok) {
        throw new Error(`El servidor respondió con el estado ${respuesta.status}.`);
    }
    return respuesta.status === 204 ? null : respuesta.json();
}

function formatearPrecio(precio) {
    if (precio == null) {
        return "Precio a consultar";
    }
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2
    }).format(precio);
}

function crearFilaProducto(producto) {
    const fila = document.createElement("article");
    fila.className = "producto-admin";

    const informacion = document.createElement("div");
    informacion.className = "producto-admin-info";

    const titulo = document.createElement("h3");
    titulo.textContent = producto.titulo;

    const detalle = document.createElement("p");
    detalle.textContent = `${formatearPrecio(producto.precioReferencia)} · ${producto.emprendimiento || "Emprendimiento sin nombre"}`;

    const estado = document.createElement("p");
    estado.className = producto.estado === "AGOTADO"
        ? "producto-admin-estado producto-admin-estado--agotado"
        : "producto-admin-estado";
    estado.textContent = {
        DISPONIBLE: "Disponible",
        POCAS_UNIDADES: "Pocas unidades",
        AGOTADO: "Agotado"
    }[producto.estado] ?? "Estado sin especificar";

    informacion.append(titulo, detalle, estado);

    const acciones = document.createElement("div");
    acciones.className = "producto-admin-acciones";

    const botonEditar = document.createElement("button");
    botonEditar.type = "button";
    botonEditar.dataset.accion = "editar";
    botonEditar.textContent = "Editar";
    botonEditar.addEventListener("click", () => iniciarEdicion(producto));

    const botonEstado = document.createElement("button");
    botonEstado.type = "button";
    botonEstado.dataset.accion = "estado";
    botonEstado.textContent = producto.estado === "AGOTADO" ? "Marcar disponible" : "Marcar agotado";
    botonEstado.addEventListener("click", () => cambiarEstado(producto));

    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.dataset.accion = "eliminar";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.setAttribute("aria-label", `Eliminar ${producto.titulo}`);
    botonEliminar.addEventListener("click", () => eliminarProducto(producto));

    acciones.append(botonEditar, botonEstado, botonEliminar);
    fila.append(informacion, acciones);
    return fila;
}

async function cargarProductos() {
    try {
        const respuesta = await fetch(API_PRODUCTOS, { cache: "no-store" });
        const productos = await leerRespuesta(respuesta);
        if (!Array.isArray(productos)) {
            throw new Error("La respuesta del catálogo no tiene el formato esperado.");
        }

        listaProductos.replaceChildren(...productos.map(crearFilaProducto));
        mostrarMensaje(estadoGestion, `${productos.length} producto(s) guardado(s).`, null);
        return true;
    } catch (error) {
        console.error("No se pudieron cargar los productos para editar:", error);
        listaProductos.replaceChildren();
        mostrarMensaje(estadoGestion, "No se pudieron cargar tus productos. Verificá que el backend esté activo.", "error");
        return false;
    }
}

function iniciarEdicion(producto) {
    productoEditandoId = producto.id;
    formulario.elements.namedItem("titulo").value = producto.titulo ?? "";
    formulario.elements.namedItem("descripcion").value = producto.descripcion ?? "";
    formulario.elements.namedItem("precioReferencia").value = producto.precioReferencia ?? "";
    formulario.elements.namedItem("estado").value = producto.estado ?? "DISPONIBLE";
    formulario.elements.namedItem("emprendimiento").value = producto.emprendimiento ?? "";
    formulario.elements.namedItem("whatsappNumber").value = producto.whatsappNumber ?? "";
    botonPublicar.textContent = "Guardar cambios";
    botonCancelarEdicion.hidden = false;
    mostrarMensaje(mensaje, `Editando “${producto.titulo}”.`, null);
    formulario.elements.namedItem("titulo").focus();
}

function cancelarEdicion() {
    productoEditandoId = null;
    formulario.reset();
    botonPublicar.disabled = false;
    botonPublicar.textContent = "Publicar producto";
    botonCancelarEdicion.hidden = true;
    mostrarMensaje(mensaje, "", null);
}

async function cambiarEstado(producto) {
    const nuevoEstado = producto.estado === "AGOTADO" ? "DISPONIBLE" : "AGOTADO";
    try {
        const respuesta = await fetch(`${API_PRODUCTOS}/${producto.id}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nuevoEstado })
        });
        await leerRespuesta(respuesta);
        const productosCargados = await cargarProductos();
        if (productosCargados) {
            mostrarMensaje(estadoGestion, `“${producto.titulo}” ahora figura como ${nuevoEstado === "AGOTADO" ? "agotado" : "disponible"}.`, "exito");
        }
    } catch (error) {
        console.error("No se pudo cambiar la disponibilidad:", error);
        mostrarMensaje(estadoGestion, "No se pudo actualizar la disponibilidad. Intentá nuevamente.", "error");
    }
}

async function eliminarProducto(producto) {
    if (!window.confirm(`¿Querés eliminar “${producto.titulo}”? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_PRODUCTOS}/${producto.id}`, { method: "DELETE" });
        await leerRespuesta(respuesta);
        if (productoEditandoId === producto.id) {
            cancelarEdicion();
        }

        const productosCargados = await cargarProductos();
        if (productosCargados) {
            mostrarMensaje(estadoGestion, `“${producto.titulo}” se eliminó correctamente.`, "exito");
        }
    } catch (error) {
        console.error("No se pudo eliminar el producto:", error);
        mostrarMensaje(estadoGestion, "No se pudo eliminar el producto. Intentá nuevamente.", "error");
    }
}

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!formulario.reportValidity()) {
        return;
    }

    const datos = new FormData(formulario);
    const precio = datos.get("precioReferencia");
    const whatsappInput = formulario.elements.namedItem("whatsappNumber");
    const whatsappNumber = String(datos.get("whatsappNumber")).replace(/\D/g, "");
    if (whatsappNumber.length < 8 || whatsappNumber.length > 15) {
        whatsappInput.setCustomValidity("Ingresá un número con código de país y entre 8 y 15 dígitos.");
        whatsappInput.reportValidity();
        whatsappInput.setCustomValidity("");
        return;
    }

    const producto = {
        titulo: String(datos.get("titulo")).trim(),
        descripcion: String(datos.get("descripcion")).trim(),
        precioReferencia: precio === "" ? null : Number(precio),
        estado: datos.get("estado"),
        emprendimiento: String(datos.get("emprendimiento")).trim(),
        whatsappNumber
    };

    botonPublicar.disabled = true;
    botonPublicar.textContent = productoEditandoId == null ? "Publicando..." : "Guardando cambios...";
    mostrarMensaje(mensaje, "", null);
    enlaceCatalogo.hidden = true;

    try {
        const estabaEditando = productoEditandoId != null;
        const url = estabaEditando ? `${API_PRODUCTOS}/${productoEditandoId}` : API_PRODUCTOS;
        const respuesta = await fetch(url, {
            method: estabaEditando ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(producto)
        });
        const productoGuardado = await leerRespuesta(respuesta);
        cancelarEdicion();
        mostrarMensaje(
            mensaje,
            estabaEditando
                ? `Los cambios de “${productoGuardado.titulo}” se guardaron correctamente.`
                : `“${productoGuardado.titulo}” se publicó y quedó guardado.`,
            "exito"
        );
        enlaceCatalogo.hidden = false;
        await cargarProductos();
    } catch (error) {
        console.error("No se pudo guardar el producto:", error);
        mostrarMensaje(
            mensaje,
            "No se pudo guardar el producto. Verificá que el backend esté activo y volvé a intentar.",
            "error"
        );
    } finally {
        botonPublicar.disabled = false;
        botonPublicar.textContent = productoEditandoId == null ? "Publicar producto" : "Guardar cambios";
    }
});

botonCancelarEdicion.addEventListener("click", cancelarEdicion);

cargarProductos();
