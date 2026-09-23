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

    private static string ComoPesos(decimal importe) =>
        importe.ToString("C", Argentina);
}
