using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DigitlaArs.Api.DTOs;

namespace DigitlaArs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
	[HttpPost("register")]
	public IActionResult Register([FromBody] RegisterDto dto)
	{
		if (!ModelState.IsValid)
			return BadRequest(ModelState);

		return Ok(new
		{
			message = "Usuario registrado exitosamente (mock)",
			email = dto.Email
		});
	}

	[HttpPost("login")]
	public IActionResult Login([FromBody] LoginDto dto)
	{
		if (!ModelState.IsValid)
			return BadRequest(ModelState);

		// Mock provisional para destrabar al front mientras configuramos la lógica de JWT e Identity
		if (dto.Email == "admin@digitalars.com" && dto.Password == "Admin123*")
		{
			return Ok(new
			{
				token = "token-jwt-de-prueba-para-frontend",
				role = "Administrador"
			});
		}

		return Unauthorized(new { message = "Credenciales incorrectas" });
	}

	// Endpoint de prueba que pide el criterio de aceptación de la HU-004
	[HttpGet("test-protegido")]
	[Authorize]
	public IActionResult TestProtegido()
	{
		return Ok(new { message = "Acceso autorizado con éxito a la API." });
	}
}