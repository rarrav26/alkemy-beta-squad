import { Box, Stack, Typography } from "@mui/material";
import AcUnitIcon from "@mui/icons-material/AcUnit";

import useInclinacionConElMouse, {
  VARIABLE_BRILLO_X,
  VARIABLE_BRILLO_Y,
  VARIABLE_INCLINACION_X,
  VARIABLE_INCLINACION_Y,
} from "../../hooks/useInclinacionConElMouse";

// Proporción de una tarjeta real (ISO/IEC 7810 ID-1): 85.6 x 53.98 mm.
const PROPORCION = "1.586 / 1";

// Ancho máximo. La tarjeta se encoge en pantallas chicas pero no crece más que esto en
// pantallas grandes, porque una tarjeta gigante se ve mal.
const ANCHO_MAXIMO = 380;

const DURACION_DEL_GIRO = "600ms";

// Cuánto tarda la inclinación en acomodarse. Corta a propósito: con más, la tarjeta queda
// "flotando" atrás del puntero y se siente pesada; con 0 el regreso al reposo es un golpe seco.
const DURACION_DE_LA_INCLINACION = "120ms";

// Cuánto crece al pasar el puntero por encima. Apenas: lo suficiente para que se sienta que
// reacciona, no tanto como para que empuje al contenido de al lado.
const ESCALA_AL_PASAR_POR_ENCIMA = 1.02;

// Clase del brillo. Hace falta un nombre para que el contenedor pueda encenderlo al pasar el
// puntero: el brillo vive dos niveles más abajo y no hay selector de "padre" en CSS.
const CLASE_DEL_BRILLO = "brillo-de-la-tarjeta";

// Los colores del plástico. Son la ÚNICA excepción a "los colores salen del tema": la tarjeta
// es un producto con identidad propia (como el plástico de un banco), y tiene que verse igual
// en modo día y en modo noche. Congelada o dada de baja pasa a gris.
const COLORES_DEL_PLASTICO = {
  activa: "linear-gradient(135deg, #7b2ff7 0%, #4a1fb8 55%, #2d1275 100%)",
  inactiva: "linear-gradient(135deg, #4a4f57 0%, #2e3238 100%)",
  chip: "linear-gradient(135deg, #e8c86a 0%, #b98f2e 100%)",
  texto: "#fff",
  bandaMagnetica: "#1a1a1a",
  franjaDelCodigo: "#fff",
  textoDelCodigo: "#111",
};

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
 *
 * La INCLINACIÓN que sigue al puntero va en una capa aparte, entre el contenedor y la que gira.
 * No podían compartir elemento: un solo `transform` no puede llevar a la vez el giro con su
 * transición de 600ms y una inclinación que tiene que seguir al mouse al instante, y el que se
 * escribiera último pisaría al otro.
 */
export default function TarjetaVisual({
  tarjeta,
  secreto = null,
  girada = false,
  onGirar,
}) {
  const { referencia, manejadores } = useInclinacionConElMouse();

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
      ref={referencia}
      {...manejadores}
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

        // El crecimiento y el brillo son solo para quien tiene puntero: en una pantalla táctil
        // el navegador deja el estado :hover pegado después de tocar, y la tarjeta quedaría
        // agrandada y brillando hasta que el usuario toque otra cosa.
        "@media (hover: hover)": {
          "&:hover": {
            "--escala-de-la-tarjeta": ESCALA_AL_PASAR_POR_ENCIMA,
          },
          [`&:hover .${CLASE_DEL_BRILLO}`]: { opacity: 1 },
        },
      }}
    >
      {/* Capa de la inclinación. Lleva preserve-3d para que el giro de su hija siga existiendo
          en el espacio 3D: sin eso, la cara de atrás se aplana y se ve encima de la de adelante. */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateX(var(${VARIABLE_INCLINACION_X}, 0deg)) rotateY(var(${VARIABLE_INCLINACION_Y}, 0deg)) scale(var(--escala-de-la-tarjeta, 1))`,
          transition: `transform ${DURACION_DE_LA_INCLINACION} ease-out`,

          // A propósito SIN `will-change: transform`. Sería la forma habitual de pedirle al
          // navegador que promueva esta capa, pero acá convive con `transform-style: preserve-3d`,
          // y varias propiedades que crean contexto de apilado obligan a `transform-style: flat` —
          // lo que aplanaría el giro de la hija y dejaría el dorso espejado encima del frente. El
          // giro ya funciona; no vale arriesgarlo por una optimización que no puedo comprobar acá.

          // El hook ya no escribe las variables cuando el sistema pide menos movimiento, pero la
          // transición y el crecimiento del hover son CSS y hay que apagarlos acá.
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            transform: "none",
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

      {/* El brillo que sigue al puntero, como el reflejo sobre el plástico. Va ENCIMA del
          contenido y no lo tapa (pointerEvents: none), o se comería el click que gira la tarjeta.
          Su posición sale de las variables que escribe el hook; sin puntero encima queda en 0 y no
          se dibuja. El blanco semitransparente funciona sobre el violeta y sobre el gris de la
          tarjeta inactiva, así que no hace falta un color por estado. */}
      <Box
        aria-hidden="true"
        className={CLASE_DEL_BRILLO}
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 200ms ease-out",
          background: `radial-gradient(circle at var(${VARIABLE_BRILLO_X}, 50%) var(${VARIABLE_BRILLO_Y}, 50%), rgba(255,255,255,0.3), rgba(255,255,255,0) 55%)`,
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      />
    </Box>
  );
}

// Fondo común a las dos caras, para que el frente y el dorso sean la misma tarjeta.
function fondo(inactiva) {
  // Congelada o dada de baja: se apaga a gris. El color es lo que comunica el estado de un
  // vistazo, antes de leer cualquier texto.
  if (inactiva) return COLORES_DEL_PLASTICO.inactiva;
  return COLORES_DEL_PLASTICO.activa;
}

function Frente({ tarjeta, numeroMostrado, inactiva, congelada, dadaDeBaja }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background: fondo(inactiva),
        color: COLORES_DEL_PLASTICO.texto,
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
          background: COLORES_DEL_PLASTICO.chip,
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
        color: COLORES_DEL_PLASTICO.texto,
        display: "flex",
        flexDirection: "column",
        opacity: inactiva ? 0.75 : 1,
      }}
    >
      {/* La banda magnética, como en una tarjeta real. */}
      <Box aria-hidden="true" sx={{ height: 44, mt: 2.5, background: COLORES_DEL_PLASTICO.bandaMagnetica }} />

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
                background: COLORES_DEL_PLASTICO.franjaDelCodigo,
                color: COLORES_DEL_PLASTICO.textoDelCodigo,
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
