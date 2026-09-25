using System.Globalization;

namespace DigitalArs.Api.Helpers.Domain;

// El texto que le queda guardado al usuario cuando pasa algo en su cuenta.
//
// Está acá y no en Services/ porque es una regla pura: no depende de la base, no recibe nada
// por constructor y la usan dos servicios distintos (depósito y transferencia). Si viviera en
// uno de ellos, el otro tendría que depender de un servicio para armar una frase.
//
// Los mensajes se arman UNA vez, al crear la notificación, y quedan guardados resueltos. No se
// recalculan al leerlos: el aviso tiene que decir lo mismo dentro de seis meses, aunque quien
// transfirió se haya cambiado el nombre desde entonces.
public static class MensajesDeNotificacion
{
    public const string TituloDeposito = "Ingreso de dinero";
    public const string TituloTransferenciaEnviada = "Transferencia enviada";
    public const string TituloTransferenciaRecibida = "Transferencia recibida";

    // --- Tarjetas ---
    // Estos avisos NO nacen de un movimiento: no mueven dinero. Por eso la notificación se
    // guarda con movimiento_id en null (ver database/Notificaciones(v.002).sql).
    public const string TituloTarjetaGenerada = "Tarjeta generada";
    public const string TituloTarjetaCongelada = "Tarjeta congelada";
    public const string TituloTarjetaDescongelada = "Tarjeta activa";
    public const string TituloTarjetaDadaDeBaja = "Tarjeta dada de baja";

    // Un pago SI es un movimiento de dinero, así que su aviso se guarda con el movimiento
    // asociado, igual que un depósito o una transferencia.
    public const string TituloPagoConTarjeta = "Pago con tarjeta";
    public const string TituloPagoRecibido = "Pago recibido";

    // La cultura se fija acá en vez de heredar la del servidor. Sin esto, el mismo importe
    // sale "$ 15.000,00" en una máquina y "$15,000.00" en otra, según cómo esté configurado
    // el sistema operativo donde corra la API.
    private static readonly CultureInfo Argentina = CultureInfo.GetCultureInfo("es-AR");

    public static string Deposito(decimal importe) =>
        $"Ingresaste {ComoPesos(importe)} a tu cuenta";

    public static string TransferenciaEnviada(decimal importe, string titularDestino) =>
        $"Enviaste {ComoPesos(importe)} a {titularDestino}";

    public static string TransferenciaRecibida(decimal importe, string titularOrigen) =>
        $"Recibiste {ComoPesos(importe)} de {titularOrigen}";

    // Los mensajes de tarjeta reciben los últimos cuatro dígitos y NUNCA el número completo ni
    // el código de seguridad: una notificación queda guardada para siempre y se manda por
    // WebSocket, así que es el último lugar donde deberían aparecer esos datos.
    public static string TarjetaGenerada(string ultimosCuatro) =>
        $"Generaste tu tarjeta virtual terminada en {ultimosCuatro}";

    public static string TarjetaCongelada(string ultimosCuatro) =>
        $"Congelaste tu tarjeta terminada en {ultimosCuatro}. No permite operaciones " +
        "hasta que la descongeles.";

    public static string TarjetaDescongelada(string ultimosCuatro) =>
        $"Descongelaste tu tarjeta terminada en {ultimosCuatro}. Ya vuelve a operar con normalidad.";

    public static string TarjetaDadaDeBaja(string ultimosCuatro) =>
        $"Diste de baja tu tarjeta terminada en {ultimosCuatro}. Podés generar una nueva cuando " +
        "quieras.";

    // El concepto se incorpora al mensaje cuando viene, y NO se descarta: el mensaje de la
    // notificación se guarda en la base, así que es lo que hace que el concepto persista.
    // Sin esto el concepto sería puro adorno: viajaría en la respuesta del pago y se perdería.
    public static string PagoConTarjeta(
        decimal importe, string titularDestino, string ultimosCuatro, string? concepto = null) =>
        $"Pagaste {ComoPesos(importe)} a {titularDestino} con tu tarjeta terminada en {ultimosCuatro}"
        + SufijoDeConcepto(concepto);

    // El que recibe el pago también se entera, igual que en una transferencia recibida. No se le
    // dice con qué tarjeta le pagaron: los últimos cuatro son dato del pagador, no del cobrador.
    // El concepto sí, porque es lo que le dice de qué fue el pago.
    public static string PagoRecibido(decimal importe, string titularOrigen, string? concepto = null) =>
        $"Recibiste un pago de {ComoPesos(importe)} de {titularOrigen}"
        + SufijoDeConcepto(concepto);

    // El mensaje es NVARCHAR(300) en la base y el concepto está limitado a 100 por el DTO, así
    // que la suma entra sin riesgo de truncarse.
    private static string SufijoDeConcepto(string? concepto) =>
        string.IsNullOrWhiteSpace(concepto) ? "" : $" — {concepto.Trim()}";

    private static string ComoPesos(decimal importe) =>
        importe.ToString("C", Argentina);
}
