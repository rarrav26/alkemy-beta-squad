using System.Text.RegularExpressions;

namespace DigitalArs.Api.Services;

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

    // ---------------------------------------------------------------------------------------
    // El alias tiene DOS formatos válidos, y no hay que confundirlos:
    //
    //   1. AUTOGENERADO: 3 palabras separadas por punto (auto.perro.gato). Es lo que produce
    //      SortearAlias() al crear la cuenta. No es una regla de validación de entrada: nadie
    //      tipea un alias con este formato.
    //   2. PERSONALIZADO: solo letras (mariagonzalez). Es lo único que el usuario puede elegir
    //      al editar su alias.
    //
    // Como DESTINO de una transferencia hay que aceptar los dos, porque en la base conviven:
    // quien nunca editó su alias conserva el autogenerado con puntos. Validar el destino con
    // un solo formato deja inalcanzable por alias a la mitad de las cuentas.
    // ---------------------------------------------------------------------------------------

    // Son const para poder usarse en los atributos de validación de los DTOs, que exigen una
    // constante de compilación. La variante que no distingue mayúsculas es la que va en el
    // DTO: el servicio normaliza a minúsculas antes de validar, así escribir "MariaGonzalez"
    // se acepta y se guarda como "mariagonzalez".
    public const string PatronAliasGenerado = @"^[a-z]+\.[a-z]+\.[a-z]+$";
    public const string PatronAliasPersonalizado = @"^[a-z]+$";
    public const string PatronAliasPersonalizadoSinDistinguirMayusculas = @"^[A-Za-z]+$";

    // Largo del alias personalizado. El máximo lo impone la columna alias (varchar(50)).
    public const int LargoMinimoAlias = 3;
    public const int LargoMaximoAlias = 50;

    private static readonly Regex FormatoAliasGenerado =
        new(PatronAliasGenerado, RegexOptions.Compiled);

    private static readonly Regex FormatoAliasPersonalizado =
        new(PatronAliasPersonalizado, RegexOptions.Compiled);

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

    // El que puede elegir el usuario al editar: solo letras, dentro del largo permitido.
    public static bool EsAliasPersonalizadoValido(string? alias) =>
        alias is not null &&
        alias.Length >= LargoMinimoAlias &&
        alias.Length <= LargoMaximoAlias &&
        FormatoAliasPersonalizado.IsMatch(alias);

    // El que produce SortearAlias(). Se valida aparte porque sigue existiendo en la base para
    // toda cuenta cuyo dueño nunca editó su alias.
    public static bool EsAliasGeneradoValido(string? alias) =>
        alias is not null && FormatoAliasGenerado.IsMatch(alias);

    // Como destino de una transferencia sirven LOS DOS formatos.
    public static bool EsAliasValidoComoDestino(string? alias) =>
        EsAliasGeneradoValido(alias) || EsAliasPersonalizadoValido(alias);

    // Deja el alias en la forma en que se guarda: sin espacios alrededor y en minúsculas.
    // Guardar siempre en minúsculas mantiene simple la unicidad: si se conservara lo tipeado,
    // "Maria" y "maria" serían dos alias distintos de dos cuentas distintas.
    public static string NormalizarAlias(string? alias) =>
        (alias ?? "").Trim().ToLowerInvariant();

    public static bool EsCvuValido(string? destino) =>
        destino is not null && FormatoCvu.IsMatch(destino);

    public static bool EsDestinoValido(string? destino) =>
        EsAliasValidoComoDestino(destino) || EsCvuValido(destino);

    private static string PalabraAlAzar() => Palabras[Random.Shared.Next(Palabras.Length)];
}
