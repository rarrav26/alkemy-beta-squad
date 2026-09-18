using System.Text.RegularExpressions;

namespace DigitalArs.Api.Helpers.Domain;

// Arma los datos autogenerados de una cuenta nueva. Es lógica pura, sin base de datos:
// comprobar que el alias sorteado esté libre le toca a AccountService.
public static class DatosDeCuenta
{
    // Palabras simples para armar el alias autogenerado (ejemplo: auto.perro.gato).
    private static readonly string[] Palabras =
    [
        "auto", "perro", "gato", "sol", "luna", "mar", "rio", "arbol",
        "flor", "nube", "pan", "queso", "libro", "silla", "mesa", "puerta",
        "campo", "monte", "cielo", "tierra", "fuego", "agua", "viento", "nieve"
    ];

    // Los primeros 10 dígitos identifican a la entidad; los 12 restantes son el número de cuenta.
    private const string PrefijoCvu = "0000003100";

    // Un CVU válido tiene el prefijo (10) más el número de cuenta (12) = 22 dígitos.
    private const int LargoCvu = 22;

    // Formato de destino de una transferencia. Se define acá, al lado de los generadores,
    // para que validación y generación no se desincronicen nunca.
    // Alias: 3 palabras simples (minúsculas) separadas por punto -> auto.perro.gato
    private static readonly Regex FormatoAlias =
        new(@"^[a-z]+\.[a-z]+\.[a-z]+$", RegexOptions.Compiled);

    // CVU: exactamente 22 dígitos -> 0000003100000012345678
    private static readonly Regex FormatoCvu =
        new($@"^\d{{{LargoCvu}}}$", RegexOptions.Compiled);

    public static string SortearAlias()
    {
        var primera = PalabraAlAzar();
        var segunda = PalabraAlAzar();
        var tercera = PalabraAlAzar();
        return primera + "." + segunda + "." + tercera;
    }

    // El id del usuario ya es único, así que sirve como número de cuenta sin repetir ni sortear.
    public static string CvuPara(int usuarioId) => PrefijoCvu + usuarioId.ToString("D12");

    public static bool EsAliasValido(string? destino) =>
        destino is not null && FormatoAlias.IsMatch(destino);

    public static bool EsCvuValido(string? destino) =>
        destino is not null && FormatoCvu.IsMatch(destino);

    public static bool EsDestinoValido(string? destino) =>
        EsAliasValido(destino) || EsCvuValido(destino);

    private static string PalabraAlAzar() => Palabras[Random.Shared.Next(Palabras.Length)];
}
