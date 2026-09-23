using DigitalArs.Api.Helpers.Common;

namespace DigitalArs.Api.Helpers.Domain;

/* Traduce entre lo que manda el front en ?tipo=, los tipos de movimiento que hay en la base y el signo con el que sale cada movimiento en la respuesta. La usan el DTO para validar la entrada y el servicio para armar la consulta y la respuesta, así la lista de valores aceptados vive en un solo lugar.*/
public static class SignoDeMovimiento
{
    public const string Credito = "CREDITO";
    public const string Debito = "DEBITO";

    // Tercer valor: un tipo que existe en la base pero que este archivo todavía no
    // clasifica. Es un string y no null para que MovimientoResponse.Signo siga siendo
    // no-nullable, y el front lo muestra sin signo en vez de inventar uno.
    public const string Desconocido = "DESCONOCIDO";

    // Se tienen que escribir igual que la columna descripcion de Tipo_Movimiento: la consulta filtra por ese texto.
    public const string TipoDeposito = "DEPOSITO";
    // Se tienen que escribir igual que la columna descripcion de Tipo_Movimiento: la consulta filtra por ese texto.
    public const string TipoTransferenciaEnviada = "TRANSFERENCIA_ENVIADA";
    public const string TipoTransferenciaRecibida = "TRANSFERENCIA_RECIBIDA";

    private const string FiltroCredito = "credito";
    private const string FiltroDebito = "debito";
    private const string FiltroTodas = "todas";

    // El signo de cada tipo de movimiento, en un solo lugar: de acá salen tanto el signo
    // con el que se muestra una fila como los tipos que entran en cada filtro. Antes el
    // criterio estaba escrito dos veces y nada garantizaba que dijeran lo mismo.
    // Agregar un tipo nuevo a la base es agregar una línea acá y nada más.
    //
    // Ignora mayúsculas porque la consulta contra SQL Server tampoco las distingue: un
    // 'Deposito' cargado así en la base entra igual en el filtro de créditos, y tiene que
    // salir con el mismo signo que el filtro le asignó.
    private static readonly Dictionary<string, string> SignoPorTipo =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [TipoDeposito] = Credito,
            [TipoTransferenciaRecibida] = Credito,
            [TipoTransferenciaEnviada] = Debito,
        };

    public static string ValoresAceptados =>
        $"{FiltroCredito}, {FiltroDebito} o {FiltroTodas}";

    public static bool EsFiltroValido(string? tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo))
            return true;

        if (EsIgual(tipo, FiltroTodas))
            return true;

        return TiposDelFiltro(tipo).Count > 0;
    }

    // Los tipos de movimiento que entran en cada filtro. 
    public static IReadOnlyList<string> TiposDelFiltro(string? tipo)
    {
        if (EsIgual(tipo, FiltroCredito))
            return TiposConSigno(Credito);

        if (EsIgual(tipo, FiltroDebito))
            return TiposConSigno(Debito);

        return [];
    }

    // Los tipos cuyo nombre contiene lo que el usuario escribió en el buscador. Sale del
    // mismo diccionario que el signo, así que un tipo nuevo se vuelve buscable con solo
    // agregarlo ahí.
    //
    // Se llama únicamente con un texto que tiene contenido: quien consulta decide antes si
    // hubo búsqueda o no. Devolver la lista vacía significa que ningún tipo coincide.
    public static IReadOnlyList<string> TiposQueCoincidenCon(string busqueda)
    {
        var textoBuscado = TextoDeBusqueda.Normalizar(busqueda);

        return SignoPorTipo.Keys
            .Where(tipo => NombreBuscable(tipo).Contains(textoBuscado))
            .ToArray();
    }

    // El nombre tal como lo lee el usuario, para poder compararlo con lo que escribe: en la
    // base dice TRANSFERENCIA_ENVIADA y en pantalla dice "Transferencia enviada", así que el
    // guion bajo pasa a ser un espacio antes de comparar.
    private static string NombreBuscable(string tipoDeMovimiento) =>
        TextoDeBusqueda.Normalizar(tipoDeMovimiento.Replace('_', ' '));

    // Un tipo que no está en la tabla devuelve Desconocido en vez de lanzar: un tipo nuevo
    // cargado en la base no puede llevarse puesto el historial entero del usuario.
    public static string DeTipo(string tipoDeMovimiento) =>
        SignoPorTipo.GetValueOrDefault(tipoDeMovimiento, Desconocido);

    // Se arma en cada llamada en vez de guardarse en dos campos estáticos: son tres
    // entradas una vez por request, y un static readonly que depende de otro static
    // readonly arrastra problemas de orden de inicialización que no valen la pena acá.
    private static IReadOnlyList<string> TiposConSigno(string signo) =>
        SignoPorTipo
            .Where(par => par.Value == signo)
            .Select(par => par.Key)
            .ToArray();

    // Compara sin distinguir mayúsculas: ?tipo=CREDITO y ?tipo=credito son lo mismo.
    private static bool EsIgual(string? tipo, string valorEsperado) =>
        string.Equals(tipo, valorEsperado, StringComparison.OrdinalIgnoreCase);
}
