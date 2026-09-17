using DigitalArs.Api.Services;

/* Verificaciones del historial de movimientos. Mismo patron que AuthenticationChecks: una
   consola que lanza si algo no se cumple. No hace falta base de datos ni framework de tests
   porque SignoDeMovimiento y TextoDeBusqueda son estaticas puras. */

// --- Normalizacion del texto ---
Check(TextoDeBusqueda.Normalizar("Depósito") == "deposito",
    "Normalizar saca acentos y mayusculas");
Check(TextoDeBusqueda.Normalizar("  transferencia  ") == "transferencia",
    "Normalizar recorta los espacios");
Check(TextoDeBusqueda.Normalizar(null) == "",
    "Normalizar tolera null");
Check(TextoDeBusqueda.Normalizar("   ") == "",
    "Normalizar tolera un texto en blanco");

// --- Busqueda por nombre de tipo ---
// El usuario escribe lo que ve en pantalla. La base guarda DEPOSITO y en pantalla dice
// "Depósito", asi que las dos formas tienen que encontrar lo mismo.
Check(Coincide("depósito", "DEPOSITO"),
    "Encuentra el deposito escrito con acento");
Check(Coincide("deposito", "DEPOSITO"),
    "Encuentra el deposito escrito sin acento");
Check(Coincide("DEPÓSITO", "DEPOSITO"),
    "La busqueda ignora las mayusculas");
Check(Coincide("transferencia enviada", "TRANSFERENCIA_ENVIADA"),
    "El espacio que escribe el usuario encuentra el guion bajo de la base");
Check(Coincide("transferencia env", "TRANSFERENCIA_ENVIADA"),
    "Encuentra escribiendo solo una parte del nombre");
Check(SignoDeMovimiento.TiposQueCoincidenCon("transferencia").Count == 2,
    "'transferencia' encuentra la enviada y la recibida");

// Este es el que no puede fallar: sin coincidencias la lista queda vacia, y el repositorio
// la traduce a cero resultados en vez de devolver el historial completo.
Check(SignoDeMovimiento.TiposQueCoincidenCon("zzz").Count == 0,
    "Un texto sin coincidencias no devuelve ningun tipo");

// --- Signo de cada tipo ---
Check(SignoDeMovimiento.DeTipo("DEPOSITO") == SignoDeMovimiento.Credito,
    "El deposito es un credito");
Check(SignoDeMovimiento.DeTipo("TRANSFERENCIA_RECIBIDA") == SignoDeMovimiento.Credito,
    "La transferencia recibida es un credito");
Check(SignoDeMovimiento.DeTipo("TRANSFERENCIA_ENVIADA") == SignoDeMovimiento.Debito,
    "La transferencia enviada es un debito");
Check(SignoDeMovimiento.DeTipo("PAGO_SERVICIO") == SignoDeMovimiento.Desconocido,
    "Un tipo no declarado devuelve Desconocido en vez de lanzar");

Console.WriteLine("Todas las verificaciones pasaron.");

bool Coincide(string busqueda, string tipoEsperado) =>
    SignoDeMovimiento.TiposQueCoincidenCon(busqueda).Contains(tipoEsperado);

void Check(bool condition, string name)
{
    if (!condition) throw new Exception(name);
    Console.WriteLine("PASS: " + name);
}
