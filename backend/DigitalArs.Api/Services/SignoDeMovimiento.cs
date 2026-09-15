namespace DigitalArs.Api.Services;

/* Traduce entre lo que manda el front en ?tipo=, los tipos de movimiento que hay en la base y el signo con el que sale cada movimiento en la respuesta. La usan el DTO para validar la entrada y el servicio para armar la consulta y la respuesta, así la lista de valores aceptados vive en un solo lugar.*/
public static class SignoDeMovimiento
{
    public const string Credito = "CREDITO";
    public const string Debito = "DEBITO";

    // Se tienen que escribir igual que la columna descripcion de Tipo_Movimiento: la consulta filtra por ese texto.
    private const string TipoDeposito = "DEPOSITO";
    private const string TipoTransferenciaEnviada = "TRANSFERENCIA_ENVIADA";
    private const string TipoTransferenciaRecibida = "TRANSFERENCIA_RECIBIDA";

    private const string FiltroCredito = "credito";
    private const string FiltroDebito = "debito";
    private const string FiltroTodas = "todas";

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
            return [TipoDeposito, TipoTransferenciaRecibida];

        if (EsIgual(tipo, FiltroDebito))
            return [TipoTransferenciaEnviada];

        return [];
    }

    // Devuelve el signo correspondiente a un tipo de movimiento. Lanza si el tipo no tiene signo definido.
    public static string DeTipo(string tipoDeMovimiento) => tipoDeMovimiento switch
    {
        TipoDeposito => Credito,
        TipoTransferenciaRecibida => Credito,
        TipoTransferenciaEnviada => Debito,
        _ => throw new InvalidOperationException(
            $"El tipo de movimiento '{tipoDeMovimiento}' no tiene signo definido.")
    };

    // Comprueba si un tipo de movimiento tiene signo definido.
    private static bool EsIgual(string? tipo, string valorEsperado) =>
        string.Equals(tipo, valorEsperado, StringComparison.OrdinalIgnoreCase);
}
