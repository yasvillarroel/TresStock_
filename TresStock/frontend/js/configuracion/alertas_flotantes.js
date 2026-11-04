// Guarda el identificador del temporizador para poder cancelarlo.
let temporizadorAlerta;

// Define la función que muestra una alerta temporal en la parte superior.
function mostrarAlertaSuperior(mensaje) {
    // Busca el elemento de la alerta.
    const alerta = document.getElementById('alerta_superior');
    // Define el texto que se mostrará en la alerta.
    alerta.textContent = mensaje;
    // Agrega la clase que hace visible la alerta.
    alerta.classList.add('visible');

    // Cancela el temporizador anterior si la alerta se mostró previamente.
    clearTimeout(temporizadorAlerta);
    // Programa que la alerta se oculte después de 3,5 segundos.
    temporizadorAlerta = setTimeout(() => alerta.classList.remove('visible'), 3500);
}