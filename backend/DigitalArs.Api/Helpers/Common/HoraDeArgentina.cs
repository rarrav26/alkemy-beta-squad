namespace DigitalArs.Api.Helpers.Common;

// Traduce entre las dos formas en las que vive una fecha en este proyecto: en la
// base siempre se guarda en UTC (DepositoService escribe DateTime.UtcNow) y el
// front siempre habla en hora de Argentina.
//
// Argentina no aplica horario de verano, así que el huso es siempre -03:00 y
// alcanza con un desplazamiento fijo. No se usa TimeZoneInfo a propósito: en un
// contenedor sin la base de husos instalada (una imagen Linux mínima, por
// ejemplo) buscar la zona por nombre falla recién en runtime, y un offset fijo
// no puede fallar.
public static class HoraDeArgentina
{
    public static readonly TimeSpan Huso = TimeSpan.FromHours(-3);

    // ?desde=2026-09-14 quiere decir "desde las 00:00 del 14 en Argentina", que
    // en la base es 2026-09-14T03:00 UTC. Restar un huso negativo es sumar: por
    // eso la resta corre la hora hacia adelante.
    public static DateTime? ComienzoDelDiaEnUtc(DateTime? diaArgentino)
    {
        if (diaArgentino is not DateTime dia)
            return null;

        return dia.Date - Huso;
    }

    // ?hasta=2026-09-14 incluye todo el día 14. En vez de buscar el último
    // instante del día (23:59:59.999, que deja afuera los milisegundos
    // siguientes) se devuelve el comienzo del 15: la consulta compara con < y el
    // rango queda exacto sin truncar la columna fecha con un CAST por fila.
    public static DateTime? ComienzoDelDiaSiguienteEnUtc(DateTime? diaArgentino)
    {
        
        if (diaArgentino is not DateTime dia)
            return null;
        if (dia.Date >= DateTime.MaxValue.Date)
            return null;

        return dia.Date.AddDays(1) - Huso;
    }

    // La base devuelve la fecha sin marca de huso. Hay que declararle que es UTC
    // antes de moverla: si no, .NET asume la hora local de la máquina y el
    // resultado cambiaría según dónde corra la API.
    public static DateTimeOffset DesdeUtc(DateTime fechaUtc)
    {
        var enUtc = DateTime.SpecifyKind(fechaUtc, DateTimeKind.Utc);

        return new DateTimeOffset(enUtc).ToOffset(Huso);
    }
}
