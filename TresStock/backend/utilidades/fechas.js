const obtenerFechaActualChile = () => {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());
    const valores = Object.fromEntries(partes.map(({type, value}) => [type, value]));

    return `${valores.year}-${valores.month}-${valores.day}`;
};

module.exports = { obtenerFechaActualChile };
