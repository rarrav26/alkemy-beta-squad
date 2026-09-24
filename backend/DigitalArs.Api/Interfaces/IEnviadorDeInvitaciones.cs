namespace DigitalArs.Api.Interfaces;

// Le hace llegar la invitación a la persona. El token viaja solo por este canal: la API ya no
// se lo devuelve al administrador, que así nunca conoce un secreto del usuario.
public interface IEnviadorDeInvitaciones
{
    // False si el correo no se pudo entregar. No lanza: el alta ya quedó guardada y el
    // administrador puede reenviar la invitación.
    Task<bool> EnviarAsync(string email, string nombre, string invitationToken, CancellationToken cancellationToken = default);
}
