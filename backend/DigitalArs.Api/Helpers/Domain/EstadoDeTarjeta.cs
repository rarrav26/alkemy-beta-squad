namespace DigitalArs.Api.Helpers.Domain;

// Los estados de una tarjeta y las transiciones permitidas entre ellos, en un solo lugar.
// El servicio pregunta acá en vez de comparar strings sueltos, así la regla no queda escrita
// en varios lados con la posibilidad de que digan cosas distintas.
//
//      ACTIVA  <-->  CONGELADA  -->  DADA_DE_BAJA   (terminal)
//
public static class EstadoDeTarjeta
{
    // Se tienen que escribir igual que los valores del CHECK CK_Tarjetas_Estado: la base
    // rechaza cualquier otra cosa, así que un typo acá se convierte en un error de INSERT.
    public const string Activa = "ACTIVA";
    public const string Congelada = "CONGELADA";
    public const string DadaDeBaja = "DADA_DE_BAJA";

    public static bool EsEstadoConocido(string? estado) =>
        estado is Activa or Congelada or DadaDeBaja;

    // "Vigente" = la tarjeta le sigue perteneciendo al usuario, esté operativa o congelada.
    //
    // IMPORTANTE: esta definición tiene que coincidir con el filtro del índice
    // UQ_Tarjetas_CuentaVigente (WHERE estado IN ('ACTIVA','CONGELADA')). Es la misma regla
    // en dos lugares porque la base la necesita para garantizar la unicidad y el código la
    // necesita para decidir si puede generar otra. Si algún día cambia, cambian las dos.
    public static bool EsVigente(string? estado) =>
        estado is Activa or Congelada;

    // El código de seguridad se revela ÚNICAMENTE con la tarjeta activa. Congelada no:
    // si el usuario la congeló porque sospecha uso indebido, mostrar el código iría en
    // contra del motivo por el que la congeló.
    public static bool PuedeRevelarseElCodigo(string? estado) =>
        estado == Activa;

    public static bool PuedeCongelarse(string? estado) =>
        estado == Activa;

    public static bool PuedeDescongelarse(string? estado) =>
        estado == Congelada;

    // Se puede dar de baja cualquier tarjeta que todavía sea del usuario, incluida una
    // congelada: el caso real es perderla, congelarla, y después decidir matarla del todo.
    // Se define como EsVigente y no repitiendo la lista para que no puedan desincronizarse.
    public static bool PuedeDarseDeBaja(string? estado) =>
        EsVigente(estado);
}
