namespace DigitalArs.Api.Services;

// Traduce entre lo que manda el front en ?tipo= y el signo con el que sale cada
// movimiento en la respuesta. La usan el DTO para validar la entrada y el
// servicio para filtrar, así la lista de valores aceptados vive en un solo lugar.
public static class SignoDeMovimiento
{
    public const string Credito = "CREDITO";
    public const string Debito = "DEBITO";

    private const string FiltroCredito = "credito";
    private const string FiltroDebito = "debito";
    private const string FiltroTodas = "todas";

    public static string ValoresAceptados =>
        $"{FiltroCredito}, {FiltroDebito} o {FiltroTodas}";

    // No mandar el parámetro es lo mismo que mandar "todas".
    public static bool EsFiltroValido(string? tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo))
            return true;

        if (EsIgual(tipo, FiltroTodas))
            return true;

        return DesdeFiltro(tipo) is not null;
    }

    // Devuelve el signo por el que hay que filtrar, o null si no hay que filtrar nada.
    public static string? DesdeFiltro(string? tipo)
    {
        if (EsIgual(tipo, FiltroCredito))
            return Credito;

        if (EsIgual(tipo, FiltroDebito))
            return Debito;

        return null;
    }

    private static bool EsIgual(string? tipo, string valorEsperado) =>
        string.Equals(tipo, valorEsperado, StringComparison.OrdinalIgnoreCase);
}
