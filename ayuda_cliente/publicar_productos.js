const API_PRODUCTOS = "http://localhost:8080/api/productos";

const formulario = document.querySelector("#formulario-producto");
const mensaje = document.querySelector("#estado-formulario");
const botonPublicar = document.querySelector("#boton-publicar");
const enlaceCatalogo = document.querySelector("#enlace-catalogo");

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
    botonPublicar.textContent = "Publicando...";
    mensaje.textContent = "";
    mensaje.className = "mensaje";
    enlaceCatalogo.hidden = true;

    try {
        const respuesta = await fetch(API_PRODUCTOS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(producto)
        });

        if (!respuesta.ok) {
            throw new Error(`El servidor respondió con el estado ${respuesta.status}.`);
        }

        const productoCreado = await respuesta.json();
        formulario.reset();
        mensaje.textContent = `“${productoCreado.titulo}” se publicó correctamente. Ya está guardado en el catálogo.`;
        mensaje.classList.add("mensaje--exito");
        enlaceCatalogo.hidden = false;
    } catch (error) {
        console.error("No se pudo publicar el producto:", error);
        mensaje.textContent = "No se pudo conectar con el catálogo. Iniciá el backend Spring en el puerto 8080 y volvé a intentar.";
        mensaje.classList.add("mensaje--error");
    } finally {
        botonPublicar.disabled = false;
        botonPublicar.textContent = "Publicar producto";
    }
});
