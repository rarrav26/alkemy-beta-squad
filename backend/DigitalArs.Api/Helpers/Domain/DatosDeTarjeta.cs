namespace DigitalArs.Api.Helpers.Domain;

// Arma los datos simulados de una tarjeta nueva. Es lógica pura, sin base de datos:
// comprobar que el número sorteado esté libre le toca a TarjetaService, igual que con el
// alias en DatosDeCuenta.
public static class DatosDeTarjeta
{
    // Los primeros dígitos identifican al emisor. Empieza con 4, así que las interfaces que
    // detectan la marca por el número la muestran como Visa, que es lo que se busca para el
    // diseño del front. Se puede cambiar sin migrar nada: las tarjetas ya generadas conservan
    // su número porque está guardado, y solo las nuevas saldrían con el prefijo nuevo.
    public const string PrefijoEmisor = "4000";

    public const int LargoNumero = 16;

    // Años de vigencia desde la generación.
    private const int AniosDeVigencia = 3;

    // Cuántos dígitos se muestran sin enmascarar. Cuatro es la convención universal.
    private const int DigitosVisibles = 4;

    // --------------------------------------------------------------------------------------
    // NÚMERO
    //
    // Se sortea al azar y NO se deriva de la cuenta (como sí hace CvuPara con el id del
    // usuario). Motivo: un número derivado de la cuenta sería siempre el mismo, y al dar de
    // baja una tarjeta y generar otra el número nuevo chocaría con el de la vieja, que sigue
    // en la tabla por la baja lógica y está protegido por UQ_Tarjetas_Numero.
    // Al ser aleatorio puede repetirse, así que quien lo llama reintenta: el mismo patrón que
    // AccountService usa con SortearAlias.
    //
    // El último dígito es un verificador de Luhn, el mismo algoritmo que usan las tarjetas
    // reales. Sirve para que cualquier validador de tarjetas (el del front, el de un
    // formulario de pago de prueba) acepte estos números en vez de rechazarlos como
    // inválidos.
    // --------------------------------------------------------------------------------------

    public static string SortearNumero()
    {
        // El prefijo, más dígitos al azar, más el verificador = LargoNumero.
        var cantidadAlAzar = LargoNumero - PrefijoEmisor.Length - 1;

        var cuerpo = new char[PrefijoEmisor.Length + cantidadAlAzar];
        PrefijoEmisor.CopyTo(cuerpo);

        for (var i = 0; i < cantidadAlAzar; i++)
            cuerpo[PrefijoEmisor.Length + i] = (char)('0' + Random.Shared.Next(10));

        var sinVerificador = new string(cuerpo);
        return sinVerificador + DigitoVerificador(sinVerificador);
    }

    // El dígito que hay que agregar al final para que el número completo pase Luhn.
    //
    // Cómo funciona: se recorre de derecha a izquierda duplicando cada segundo dígito; si al
    // duplicar se pasa de 9 se le resta 9 (equivale a sumar sus dos cifras). El verificador es
    // lo que falta para que el total sea múltiplo de 10.
    //
    // Acá se arranca duplicando el dígito más a la derecha, porque el verificador todavía no
    // está puesto y va a correr las posiciones un lugar.
    public static int DigitoVerificador(string numeroSinVerificador)
    {
        var suma = SumaDeLuhn(numeroSinVerificador, duplicarElUltimo: true);
        return (10 - (suma % 10)) % 10;
    }

    // Valida el número completo, verificador incluido. Un número bien formado suma múltiplo
    // de 10. Acá NO se duplica el último dígito, porque el último es el verificador.
    public static bool EsNumeroValido(string? numero)
    {
        if (numero is null || numero.Length != LargoNumero)
            return false;

        foreach (var caracter in numero)
            if (!char.IsAsciiDigit(caracter))
                return false;

        return SumaDeLuhn(numero, duplicarElUltimo: false) % 10 == 0;
    }

    private static int SumaDeLuhn(string digitos, bool duplicarElUltimo)
    {
        var suma = 0;
        var duplicar = duplicarElUltimo;

        for (var i = digitos.Length - 1; i >= 0; i--)
        {
            var valor = digitos[i] - '0';

            if (duplicar)
            {
                valor *= 2;
                if (valor > 9)
                    valor -= 9;
            }

            suma += valor;
            duplicar = !duplicar;
        }

        return suma;
    }

    // --------------------------------------------------------------------------------------
    // VENCIMIENTO
    // --------------------------------------------------------------------------------------

    // Se guarda el ÚLTIMO día del mes porque una tarjeta que vence en 09/2029 sigue siendo
    // válida todo septiembre. Guardar el día 1 la haría vencer un mes antes de lo que dice.
    //
    // Recibe la fecha en vez de leer el reloj para que se pueda verificar con una fecha fija.
    public static DateOnly VencimientoDesde(DateOnly hoy)
    {
        var conAnios = hoy.AddYears(AniosDeVigencia);
        var ultimoDia = DateTime.DaysInMonth(conAnios.Year, conAnios.Month);
        return new DateOnly(conAnios.Year, conAnios.Month, ultimoDia);
    }

    public static DateOnly SortearVencimiento() =>
        VencimientoDesde(DateOnly.FromDateTime(DateTime.UtcNow));

    public static bool EstaVencida(DateOnly vencimiento, DateOnly hoy) =>
        hoy > vencimiento;

    // --------------------------------------------------------------------------------------
    // CÓDIGO DE SEGURIDAD
    // --------------------------------------------------------------------------------------

    // Tres dígitos, con los ceros adelante incluidos: 007 es un código válido y perder el
    // cero lo convertiría en uno de dos dígitos, que la columna CHAR(3) rechaza.
    public static string SortearCodigoDeSeguridad() =>
        Random.Shared.Next(0, 1000).ToString("D3");

    // --------------------------------------------------------------------------------------
    // NÚMERO DE OPERACIÓN
    // --------------------------------------------------------------------------------------

    // El identificador que un banco imprime en el comprobante. Se arma con la fecha más el id
    // del movimiento, así que es único sin necesidad de sortear nada ni consultar la base:
    // el id del movimiento ya es único, y la fecha adelante lo hace legible y ordenable.
    //
    // Ejemplo: 20260924-000042
    public static string NumeroDeOperacion(DateTime fechaUtc, int movimientoId) =>
        $"{fechaUtc:yyyyMMdd}-{movimientoId:D6}";

    // --------------------------------------------------------------------------------------
    // PRESENTACIÓN
    // --------------------------------------------------------------------------------------

    // Los últimos cuatro dígitos, que es lo único del número que la API devuelve sin exigir
    // contraseña. El enmascarado visual (los puntitos) lo arma el front.
    public static string UltimosCuatro(string numero) =>
        numero.Length <= DigitosVisibles
            ? numero
            : numero[^DigitosVisibles..];
}
