using DigitalArs.Api.Helpers.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace DigitalArs.Api.Hubs;

// El extremo del WebSocket al que se conecta la app del usuario para recibir los avisos en el
// momento. Vive en Hubs/ y no en Controllers/ porque no es un controller: no atiende requests
// HTTP sueltos, mantiene una conexión abierta.
//
// ESTÁ VACÍO A PROPÓSITO, por dos motivos:
//
// 1. La comunicación es solo servidor -> cliente. El cliente nunca le pide nada al hub: se
//    conecta y espera. Un método público acá sería una puerta de entrada que nadie usa.
//
// 2. No hace falta revisar si el usuario está activo. La conexión al hub pasa por la misma
//    validación de token que el resto de la API, y OnTokenValidated (Program.cs, sección 7) ya
//    contrasta el token contra la base en cada petición: un usuario desactivado no llega acá.
//
// El atributo sí importa: sin él, cualquiera con un token válido se conectaría, incluido el
// administrador, que no tiene billetera ni campana.
[Authorize(Roles = RolPrincipal.Usuario)]
public class NotificacionesHub : Hub
{
}
