namespace DigitalArs.Api.Interfaces;

// El titular de la otra cuenta de una transferencia: a quién se le envió o quién la mandó.
// Llega en dos partes, como está en la base; el servicio arma el nombre para mostrar.
public record ContraparteLeida(
    string Nombre,
    string Apellido
);
