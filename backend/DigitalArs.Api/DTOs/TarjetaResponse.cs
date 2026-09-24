namespace DigitalArs.Api.DTOs;

// La tarjeta como se muestra normalmente: SIN el número completo y SIN el código de seguridad.
// Esos dos datos salen únicamente por el endpoint de revelado, que pide la contraseña.
//
// Que este record no tenga campos para el número completo ni el código es deliberado: así no
// hay forma de filtrarlos por descuido al agregar un endpoint nuevo, porque el tipo no los
// puede transportar.
/// <param name="Id">Id de la tarjeta.</param>
/// <param name="UltimosCuatro">Los últimos 4 dígitos (ejemplo: 3333). El enmascarado visual lo arma el front.</param>
/// <param name="Titular">Nombre del titular, como va impreso en una tarjeta (ejemplo: MARIA GONZALEZ).</param>
/// <param name="Vencimiento">Mes y año de vencimiento (ejemplo: 09/29).</param>
/// <param name="Estado">ACTIVA, CONGELADA o DADA_DE_BAJA.</param>
/// <param name="PuedeCongelarse">Si la transición a CONGELADA está permitida ahora.</param>
/// <param name="PuedeDescongelarse">Si la transición a ACTIVA está permitida ahora.</param>
/// <param name="PuedeRevelarseElCodigo">Si el código de seguridad se puede pedir ahora.</param>
/// <param name="EstaVencida">Si la fecha de vencimiento ya pasó.</param>
public record TarjetaResponse(
    int Id,
    string UltimosCuatro,
    string Titular,
    string Vencimiento,
    string Estado,

    // Los tres permisos los calcula el backend en vez de que el front deduzca la máquina de
    // estados por su cuenta. Si mañana cambia una regla, cambia en un solo lugar y el front
    // se acomoda solo.
    bool PuedeCongelarse,
    bool PuedeDescongelarse,
    bool PuedeRevelarseElCodigo,

    bool EstaVencida
);
