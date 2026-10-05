const API_PRODUCTOS = "http://localhost:8080/api/productos";
const grillaProductos = document.querySelector(".productos-grid");
const estadoCatalogo = document.querySelector("#productos-api-status");

const imagenesProductos = [
    { palabras: ["factura", "medialuna"], archivo: "facturas.jpg", detalle: "productos/facturas.html" },
    { palabras: ["semita"], archivo: "semitas.jpg", detalle: "productos/semitas.html" },
    { palabras: ["torta"], archivo: "tortas.jpg", detalle: "productos/tortas.html" },
    { palabras: ["galleta", "cookie"], archivo: "galletas.jpg", detalle: "productos/galletas.html" }
];

function crearElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) {
        elemento.className = clase;
    }
    if (texto) {
        elemento.textContent = texto;
    }
    return elemento;
}

function obtenerImagen(titulo) {
    const normalizado = titulo.toLocaleLowerCase("es");
    return imagenesProductos.find((producto) =>
        producto.palabras.some((palabra) => normalizado.includes(palabra))
    );
}

function crearTarjeta(producto) {
    const tarjeta = crearElemento("article", "producto-card");
    const contenedorImagen = crearElemento("div", "producto-imagen");
    const imagen = obtenerImagen(producto.titulo);

    if (imagen) {
        const elementoImagen = crearElemento("img");
        elementoImagen.src = `img.productos/${imagen.archivo}`;
        elementoImagen.alt = producto.titulo;
        contenedorImagen.append(elementoImagen);
    } else {
        contenedorImagen.classList.add("producto-imagen-placeholder");
        contenedorImagen.textContent = "🧁";
        contenedorImagen.setAttribute("aria-label", "Producto artesanal");
    }

    const informacion = crearElemento("div", "producto-info");
    const estadoTexto = {
        DISPONIBLE: "● Disponible",
        POCAS_UNIDADES: "● Pocas unidades",
        AGOTADO: "● Agotado"
    }[producto.estado] ?? "● Estado sin especificar";
    const estado = crearElemento("span", "disponible", estadoTexto);
    if (producto.estado === "AGOTADO") {
        estado.classList.add("disponible--agotado");
    }
    informacion.append(estado);
    informacion.append(crearElemento("h3", "", producto.titulo));
    informacion.append(crearElemento("p", "", producto.descripcion || "Producto artesanal."));

    if (producto.emprendimiento) {
        informacion.append(crearElemento("p", "producto-emprendimiento", producto.emprendimiento));
    }

    const pie = crearElemento("div", "producto-footer");
    const precio = producto.precioReferencia == null
        ? "Consultar"
        : new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 2
        }).format(producto.precioReferencia);
    pie.append(crearElemento("strong", "", precio));

    const estaAgotado = producto.estado === "AGOTADO";
    const boton = crearElemento(
        estaAgotado ? "span" : "a",
        estaAgotado ? "producto-agotado" : "",
        estaAgotado ? "Agotado" : imagen?.detalle ? "Ver más" : "Contactar"
    );
    if (estaAgotado) {
        boton.setAttribute("role", "status");
    } else if (imagen?.detalle) {
        boton.href = imagen.detalle;
    } else if (producto.whatsappNumber) {
        boton.href = `https://wa.me/${String(producto.whatsappNumber).replace(/\D/g, "")}`;
        boton.target = "_blank";
        boton.rel = "noopener noreferrer";
    } else {
        boton.href = "ayuda_cliente/publicar_productos.html";
        boton.textContent = "Consultar";
    }

    pie.append(boton);
    informacion.append(pie);
    tarjeta.append(contenedorImagen, informacion);
    return tarjeta;
}

async function cargarProductos() {
    try {
        const respuesta = await fetch(API_PRODUCTOS, { cache: "no-store" });
        if (!respuesta.ok) {
            throw new Error(`El servidor respondió con el estado ${respuesta.status}.`);
        }

        const productos = await respuesta.json();
        if (!Array.isArray(productos)) {
            throw new Error("La respuesta del catálogo no tiene el formato esperado.");
        }

        grillaProductos.replaceChildren(...productos.map(crearTarjeta));
        estadoCatalogo.textContent = "Catálogo actualizado con los productos publicados.";
        estadoCatalogo.className = "api-status api-status--success";
    } catch (error) {
        console.error("No se pudo cargar el catálogo:", error);
        estadoCatalogo.textContent = "No se pudo conectar con el catálogo. Iniciá el backend Spring en el puerto 8080 para ver las publicaciones actualizadas.";
        estadoCatalogo.className = "api-status api-status--error";
    }
}

cargarProductos();
