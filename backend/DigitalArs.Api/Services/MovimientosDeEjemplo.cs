using DigitalArs.Api.DTOs;

namespace DigitalArs.Api.Services;

// TODO HU-011: borrar este archivo cuando el historial consulte la tabla Movimientos.
//
// Datos inventados para que el front pueda integrar el historial antes de que
// exista la consulta real. Es el único lugar del proyecto con datos falsos: la
// lógica de filtrar y paginar vive aparte, en HistorialSimuladoService.
//
// La lista ya viene ordenada de más reciente a más vieja, que es el mismo orden
// que va a devolver la consulta real (fecha DESC, id DESC).
public static class MovimientosDeEjemplo
{
    private const string Deposito = "DEPOSITO";
    private const string TransferenciaEnviada = "TRANSFERENCIA_ENVIADA";
    private const string TransferenciaRecibida = "TRANSFERENCIA_RECIBIDA";

    public static IReadOnlyList<MovimientoResponse> Todos { get; } =
    [
        Credito(18, Deposito, "2026-09-14 10:05:22", 1500.00m),
        Debito(17, TransferenciaEnviada, "2026-09-13 18:41:07", 320.50m),
        Credito(16, TransferenciaRecibida, "2026-09-12 09:15:00", 7800.00m),
        Credito(15, Deposito, "2026-09-11 21:03:44", 250.75m),
        Debito(14, TransferenciaEnviada, "2026-09-10 14:22:10", 1200.00m),
        Credito(13, TransferenciaRecibida, "2026-09-09 08:47:31", 45.90m),
        Credito(12, Deposito, "2026-09-08 16:30:05", 10000.00m),
        Debito(11, TransferenciaEnviada, "2026-09-06 11:12:58", 89.99m),
        Debito(10, TransferenciaEnviada, "2026-09-05 19:55:20", 2500.00m),
        Credito(9, Deposito, "2026-09-04 07:20:13", 630.00m),
        Credito(8, TransferenciaRecibida, "2026-09-02 13:08:47", 15250.40m),
        Debito(7, TransferenciaEnviada, "2026-09-01 10:00:00", 400.00m),
        Credito(6, Deposito, "2026-08-30 22:17:36", 75.25m),
        Credito(5, TransferenciaRecibida, "2026-08-28 12:45:09", 3300.00m),
        Debito(4, TransferenciaEnviada, "2026-08-27 17:33:52", 950.10m),
        Credito(3, Deposito, "2026-08-25 09:05:41", 5000.00m),
        Debito(2, TransferenciaEnviada, "2026-08-23 15:28:19", 180.00m),
        Credito(1, Deposito, "2026-08-21 11:40:00", 2000.00m)
    ];

    private static MovimientoResponse Credito(
        int id,
        string tipo,
        string fecha,
        decimal importe) =>
        new(id, EnHoraArgentina(fecha), tipo, SignoDeMovimiento.Credito, importe);

    private static MovimientoResponse Debito(
        int id,
        string tipo,
        string fecha,
        decimal importe) =>
        new(id, EnHoraArgentina(fecha), tipo, SignoDeMovimiento.Debito, importe);

    private static DateTimeOffset EnHoraArgentina(string fecha)
    {
        var sinHuso = DateTime.ParseExact(
            fecha,
            "yyyy-MM-dd HH:mm:ss",
            System.Globalization.CultureInfo.InvariantCulture);

        return new DateTimeOffset(sinHuso, HoraDeArgentina.Huso);
    }
}
