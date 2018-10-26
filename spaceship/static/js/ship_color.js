function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


window.onload = function() {
    if (typeof window.shipColors === 'undefined'){
        result = hexToRgb(CSSToken.numberToColor(window.color));
        changeColor("capa-1", result.r, result.g, result.b);
    } else {
        for (var key in window.shipColors) {
            result = hexToRgb(CSSToken.numberToColor(window.shipColors[key]));
            changeColor(key.toString(), result.r, result.g, result.b);
        }
    }
}


/*
 * Handler para el Evento de cambio de color
 */
function changeColor(canvasId, r, g, b) {

    var image = new Image();
    var canvas = document.getElementById(canvasId);
    image.crossOrigin = "Anonymous";
    image.src = window.layer_1;
    image.onload = function() {
        compose(image, canvas, r, g, b);
    }
}

function compose(image, canvas, r, g, b) {
    var ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < id.data.length; i += 4) {
        /*
         * ¿Que estoy haciendo aca? El PNG es una imagen con trasparencia.
         * entonces todo lo que no es transparencia hay que cambiarle el color
         */
        if (id.data[i + 3] != 0) {
            id.data[i] = r;
            id.data[i + 1] = g;
            id.data[i + 2] = b;
        }
    }
    /*
     * Dibujo la nueva imagen
     */
    ctx.putImageData(id, 0, 0);
}   
