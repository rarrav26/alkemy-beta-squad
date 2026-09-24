namespace DigitalArs.Api.Helpers.Domain;

// Los tipos de evento que se registran en la bitácora de una tarjeta.
//
// Son los mismos cuatro valores del CHECK CK_TarjetaEventos_Tipo, así que un typo acá se
// convierte en un error al insertar. Están como constantes por el mismo motivo que
// EstadoDeTarjeta: para que nadie escriba el literal suelto en cada llamada.
//
// OJO, no confundir con EstadoDeTarjeta: ahí los valores son ESTADOS (dónde está la tarjeta
// ahora) y acá son EVENTOS (qué le pasó). Se parecen porque tres de los cuatro eventos son
// justamente "entró en tal estado", pero DESCONGELADA no tiene estado propio —la tarjeta vuelve
// a ACTIVA— y por eso las dos listas no coinciden y no se pueden unificar.
public static class TipoDeEventoDeTarjeta
{
    public const string Generada = "GENERADA";
    public const string Congelada = "CONGELADA";
    public const string Descongelada = "DESCONGELADA";
    public const string DadaDeBaja = "DADA_DE_BAJA";
}
