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

    public static string SortearAlias()
    {
        var primera = PalabraAlAzar();
        var segunda = PalabraAlAzar();
        var tercera = PalabraAlAzar();
        return primera + "." + segunda + "." + tercera;
    }

    // El id del usuario ya es único, así que sirve como número de cuenta sin repetir ni sortear.
    public static string CvuPara(int usuarioId) => PrefijoCvu + usuarioId.ToString("D12");

    private static string PalabraAlAzar() => Palabras[Random.Shared.Next(Palabras.Length)];
}
