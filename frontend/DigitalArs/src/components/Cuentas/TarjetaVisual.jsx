import { Box, Stack, Typography } from "@mui/material";
import AcUnitIcon from "@mui/icons-material/AcUnit";

// Proporción de una tarjeta real (ISO/IEC 7810 ID-1): 85.6 x 53.98 mm.
const PROPORCION = "1.586 / 1";

// Ancho máximo. La tarjeta se encoge en pantallas chicas pero no crece más que esto en
// pantallas grandes, porque una tarjeta gigante se ve mal.
const ANCHO_MAXIMO = 380;

const DURACION_DEL_GIRO = "600ms";

/**
 * La tarjeta dibujada, con giro 3D para ver el dorso.
 *
 * Es un componente de presentación: no llama a la API ni decide nada. Recibe los datos y el
 * secreto ya revelado (o null) y los muestra.
 *
 * GIRAR Y REVELAR SON DOS COSAS DISTINTAS, a propósito:
 *   - girar   es una acción de ver, libre y sin contraseña (el dorso oculto no expone nada)
 *   - revelar es una acción de seguridad, y desbloquea los datos de LAS DOS caras a la vez
 * Atarlas hacía que ver el código escondiera el número, porque están en caras opuestas.
 *
 * El giro es CSS puro y no necesita ninguna dependencia: el contenedor aporta la perspectiva,
 * la cara interior rota en Y, y backface-visibility esconde la cara que queda de espaldas.
 */
export default function TarjetaVisual({
  tarjeta,
  secreto = null,
  girada = false,
  onGirar,
}) {
  const congelada = tarjeta.estado === "CONGELADA";
  const dadaDeBaja = tarjeta.estado === "DADA_DE_BAJA";
  const inactiva = congelada || dadaDeBaja;

  // Cuando el secreto está revelado se muestra el número completo, agrupado de 4 en 4 como en
  // una tarjeta real. Si no, solo los últimos 4.
  const numeroMostrado = secreto
    ? secreto.numero.replace(/(.{4})/g, "$1 ").trim()
    : `•••• •••• •••• ${tarjeta.ultimosCuatro}`;

  return (
    <Box
      // component="button" y no un div con onClick: así el giro se opera con teclado (Tab y
      // luego Enter o Espacio) sin escribir nada a mano, y un lector de pantalla lo anuncia
      // como algo accionable. Los estilos propios del botón se anulan abajo.
      component="button"
      type="button"
      onClick={onGirar}
      aria-label={girada ? "Ver el frente de la tarjeta" : "Ver el dorso de la tarjeta"}
      sx={{
        // Reset de los estilos que trae un button.
        appearance: "none",
        border: 0,
        p: 0,
        background: "none",
        font: "inherit",
        color: "inherit",
        textAlign: "inherit",
        display: "block",
        cursor: "pointer",

        width: "100%",
        maxWidth: ANCHO_MAXIMO,
        // Centrada en su contenedor.
        mx: "auto",
        aspectRatio: PROPORCION,

        // La perspectiva tiene que estar en el CONTENEDOR, no en el elemento que rota: es lo
        // que hace que el giro se vea en 3D y no como un achatamiento plano.
        perspective: "1200px",

        // Anillo de foco visible: sin esto, quien navega con teclado no sabe dónde está.
        borderRadius: 3,
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 3,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          // preserve-3d es lo que permite que las caras hijas existan en el espacio 3D. Sin
          // esto, el dorso no se esconde y se ve espejado encima del frente.
          transformStyle: "preserve-3d",
          transition: `transform ${DURACION_DEL_GIRO} cubic-bezier(0.4, 0.2, 0.2, 1)`,
          transform: girada ? "rotateY(180deg)" : "rotateY(0deg)",

          // Accesibilidad: una animación 3D es justo el tipo de movimiento que marea a
          // personas con sensibilidad vestibular. Quien pidió menos movimiento en su sistema
          // operativo ve el cambio instantáneo, sin perder la funcionalidad.
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        <Cara>
          <Frente
            tarjeta={tarjeta}
            numeroMostrado={numeroMostrado}
            inactiva={inactiva}
            congelada={congelada}
            dadaDeBaja={dadaDeBaja}
          />
        </Cara>

        {/* El dorso ya está rotado 180°, así que cuando el contenedor gira queda de frente. */}
        <Cara rotada>
          <Dorso secreto={secreto} inactiva={inactiva} />
        </Cara>
      </Box>
    </Box>
  );
}

// Las dos caras se apilan en el mismo lugar y cada una esconde su reverso.
function Cara({ children, rotada = false }) {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        // Sin esto se ve la cara de atrás espejada a través de la de adelante.
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: rotada ? "rotateY(180deg)" : "none",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: 6,
      }}
    >
      {children}
    </Box>
  );
}

// Fondo común a las dos caras, para que el frente y el dorso sean la misma tarjeta.
function fondo(inactiva) {
  return inactiva
    ? // Congelada o dada de baja: se apaga a gris. El color es lo que comunica el estado de
      // un vistazo, antes de leer cualquier texto.
      "linear-gradient(135deg, #4a4f57 0%, #2e3238 100%)"
    : "linear-gradient(135deg, #7b2ff7 0%, #4a1fb8 55%, #2d1275 100%)";
}

function Frente({ tarjeta, numeroMostrado, inactiva, congelada, dadaDeBaja }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background: fondo(inactiva),
        color: "#fff",
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // Se atenúa además del cambio de color: el color solo no alcanza para quien no lo
        // distingue bien.
        opacity: inactiva ? 0.75 : 1,
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <Typography sx={{ fontWeight: 700, letterSpacing: 1 }}>DigitalArs</Typography>

        {congelada && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <AcUnitIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              CONGELADA
            </Typography>
          </Stack>
        )}

        {dadaDeBaja && (
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            DADA DE BAJA
          </Typography>
        )}
      </Stack>

      {/* El chip. Es decorativo, así que no lleva texto alternativo. */}
      <Box
        aria-hidden="true"
        sx={{
          width: 42,
          height: 32,
          borderRadius: 1,
          background: "linear-gradient(135deg, #e8c86a 0%, #b98f2e 100%)",
        }}
      />

      <Typography
        sx={{
          // Tipografía monoespaciada para que los dígitos no bailen al cambiar entre el
          // número enmascarado y el completo.
          fontFamily: "monospace",
          fontSize: { xs: "1.05rem", sm: "1.25rem" },
          letterSpacing: 1.5,
        }}
      >
        {numeroMostrado}
      </Typography>

      {/* OJO: en MUI v9 justifyContent y alignItems NO funcionan como props de Stack, tienen
          que ir en sx. Pasados como props se ignoran en silencio y todo queda amontonado a la
          izquierda. */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: "flex-end" }}
      >
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
            TITULAR
          </Typography>
          <Typography
            sx={{
              fontSize: "0.85rem",
              fontWeight: 600,
              // Un nombre largo no puede desarmar la tarjeta.
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tarjeta.titular}
          </Typography>
        </Box>

        {/* flexShrink 0 para que el vencimiento no se comprima cuando el nombre es largo: el
            nombre se recorta con puntos suspensivos, la fecha nunca. */}
        <Box sx={{ flexShrink: 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
            VENCE
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: "monospace" }}>
            {tarjeta.vencimiento}
          </Typography>
        </Box>

        {/* El logo de la marca, dibujado en vez de traído de una librería: el prefijo del
            número lo fija el backend y siempre es el mismo, así que no hay nada que detectar. */}
        <Typography
          sx={{
            flexShrink: 0,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: "1.25rem",
            letterSpacing: 0.5,
            // Alinea la base del logo con la de los textos de al lado.
            lineHeight: 1,
          }}
        >
          VISA
        </Typography>
      </Stack>
    </Box>
  );
}

function Dorso({ secreto, inactiva }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background: fondo(inactiva),
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        opacity: inactiva ? 0.75 : 1,
      }}
    >
      {/* La banda magnética, como en una tarjeta real. */}
      <Box aria-hidden="true" sx={{ height: 44, mt: 2.5, background: "#1a1a1a" }} />

      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-end" }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
              CÓDIGO DE SEGURIDAD
            </Typography>

            {/* La franja blanca donde va impreso el código en una tarjeta real. */}
            <Box
              sx={{
                mt: 0.5,
                background: "#fff",
                color: "#111",
                borderRadius: 0.5,
                px: 1.5,
                py: 0.75,
                display: "inline-block",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "1.15rem",
                letterSpacing: 3,
              }}
            >
              {secreto ? secreto.codigoDeSeguridad : "•••"}
            </Box>
          </Box>
        </Stack>

        <Typography variant="caption" sx={{ opacity: 0.7, mt: "auto" }}>
          Tarjeta simulada de DigitalArs. No es válida para comercios reales.
        </Typography>
      </Box>
    </Box>
  );
}
