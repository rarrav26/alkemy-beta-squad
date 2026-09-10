# 🛒 ReactCommerce

ReactCommerce es una aplicación web de comercio electrónico desarrollada con **React**.  
La aplicación permite consultar un catálogo de productos, buscar productos por nombre, acceder al detalle de cada uno y alternar entre modo claro y oscuro.

Los productos son obtenidos dinámicamente desde la API pública de **DummyJSON**.

---

## 🚀 Tecnologías utilizadas

El proyecto fue desarrollado utilizando:

- **React**
- **Vite**
- **JavaScript**
- **Material UI (MUI)**
- **React Router**
- **Context API**
- **Fetch API**
- **DummyJSON API**
- **Vercel** para el despliegue

---

## ⚛️ React

La interfaz fue construida mediante componentes de React.

La aplicación se dividió en diferentes componentes con responsabilidades específicas, permitiendo mantener el código organizado y reutilizable.

Entre los principales componentes se encuentran:

- `Header`
- `SearchBar`
- `ChangeTheme`
- `ProductList`
- `ProductGrid`
- `ProductCard`
- `ProductDetailID`
- `Footer`
- `ScrollTopButton`

---

## 🎨 Material UI

Para la construcción de la interfaz se utilizó **Material UI (MUI)**.

Esta biblioteca proporciona componentes visuales reutilizables y permite trabajar fácilmente con diseños responsive.

Entre los componentes utilizados se encuentran:

- `AppBar`
- `Toolbar`
- `Grid`
- `Card`
- `CardMedia`
- `CardContent`
- `CardActions`
- `Button`
- `IconButton`
- `TextField`
- `Typography`
- `Paper`
- `Rating`
- `Chip`
- `LinearProgress`

También se utilizaron diferentes íconos de **Material Icons**.

---

## 📦 Cards de productos

Cada producto del catálogo se representa mediante un componente `ProductCard`.

Las cards muestran la información principal del producto:

- Imagen
- Nombre
- Precio
- Botón para acceder al detalle

Cada card recibe el producto mediante **props**, permitiendo reutilizar el mismo componente para todos los elementos del catálogo.

```jsx
<ProductCard product={product} />
```

El botón **Show Detail** utiliza React Router para navegar hacia la página correspondiente al producto.

```jsx
<Button component={Link} to={`/product/${product.id}`}>
  Show Detail
</Button>
```

---

## 🔲 Grilla de productos

Los productos son organizados mediante el sistema de grillas de Material UI.

El componente `ProductGrid` recibe el listado de productos mediante props y utiliza `map()` para generar una card por cada producto.

```jsx
{
  products.map(product => <ProductCard key={product.id} product={product} />)
}
```

Se utiliza `product.id` como **key estable** para identificar cada elemento renderizado.

La grilla también es responsive, adaptando la cantidad y tamaño de las cards según el ancho disponible en la pantalla.

---

## 🔍 SearchBar

La aplicación incluye un componente `SearchBar` que permite buscar productos por su título.

El valor ingresado en el buscador se almacena en un estado global y posteriormente `ProductList` filtra los productos utilizando `filter()`.

```jsx
const filteredProducts = products.filter(product =>
  product.title.toLowerCase().includes(search.toLowerCase())
)
```

En dispositivos móviles, el buscador permanece reducido mostrando principalmente el ícono de búsqueda. Al tocarlo, el campo se expande y recibe automáticamente el foco.

Para este comportamiento se utilizaron:

- `useState`
- `useRef`
- eventos `onFocus` y `onBlur`
- estilos responsive de Material UI

---

## 🌙 Modo claro y oscuro

La aplicación permite cambiar entre **Dark Mode** y **Light Mode**.

Esta funcionalidad se encuentra encapsulada en el componente `ChangeTheme`.

El estado del tema se administra mediante Context API:

```jsx
const [darkMode, setDarkMode] = useState(true)
```

A partir de este valor se genera dinámicamente el tema de Material UI:

```jsx
const theme = createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light'
  }
})
```

De esta manera, los componentes de Material UI pueden adaptar automáticamente sus colores al tema seleccionado.

---

## 🌐 Context API

Se utilizó **Context API** para compartir información entre diferentes componentes sin tener que pasarla manualmente por toda la jerarquía mediante props.

El contexto `ElementosGlobales` administra información como:

- Productos
- Estado de carga
- Errores
- Texto ingresado en el buscador
- Tema claro/oscuro

Esto permite, por ejemplo, que `SearchBar` modifique el texto de búsqueda y que `ProductList` pueda utilizar inmediatamente ese valor para filtrar los productos.

---

## 🔗 React Router

La navegación de la aplicación se realiza utilizando **React Router**.

Las principales rutas son:

```jsx
<Route path='/' element={<Home />} />

<Route
  path='/product/:id'
  element={<ProductDetailID />}
/>
```

La ruta `/` muestra el catálogo general.

La ruta `/product/:id` utiliza un parámetro dinámico para identificar el producto seleccionado.

Por ejemplo:

```text
/product/1
```

permite acceder al detalle del producto con ID `1`.

---

## 📄 Detalle del producto

Al seleccionar **Show Detail**, la aplicación navega al componente `ProductDetailID`.

El ID se obtiene mediante `useParams()`:

```jsx
const { id } = useParams()
```

Luego se realiza una nueva petición a la API para obtener la información completa del producto:

```jsx
fetch(`https://dummyjson.com/products/${id}`)
```

En esta pantalla se muestra información adicional como:

- Imagen
- Nombre
- Precio
- Categoría
- Descripción
- Rating
- Stock
- Disponibilidad
- Opiniones de usuarios

También se incluye un botón **Home** para regresar al catálogo.

---

## 📡 Consumo de API

Los datos utilizados por ReactCommerce provienen de la API de DummyJSON.

El catálogo inicial se obtiene mediante:

```text
https://dummyjson.com/products
```

Las solicitudes se realizan utilizando `fetch()` junto con `async/await`.

También se implementó manejo de errores mediante:

```jsx
try {
  // solicitud
} catch (error) {
  // manejo del error
} finally {
  // finalización de la carga
}
```

Durante la carga de los productos se muestra un indicador visual utilizando `LinearProgress`.

---

## 📱 Diseño responsive

La interfaz fue diseñada para adaptarse a diferentes tamaños de pantalla.

Se utilizaron los breakpoints de Material UI y media queries para modificar la distribución de los componentes en:

- Computadoras
- Tablets
- Smartphones

El `Header`, el buscador y la grilla de productos modifican su comportamiento según el espacio disponible.

En pantallas pequeñas, por ejemplo, el menú principal se transforma en un menú hamburguesa y el buscador puede expandirse al seleccionarlo.

---

## ⬆️ Scroll to Top

La aplicación incorpora un botón flotante para regresar rápidamente al inicio de la página.

El botón utiliza:

```css
position: fixed;
```

y ejecuta:

```jsx
window.scrollTo({
  top: 0,
  behavior: 'smooth'
})
```

Esto permite realizar un desplazamiento suave hacia la parte superior del sitio.

---

## ☁️ Deploy

La aplicación se encuentra desplegada utilizando **Vercel**.

Debido al uso de React Router, se configuró Vercel para redirigir las rutas de la SPA hacia `index.html`, permitiendo acceder directamente a rutas como:

```text
/product/1
```

sin obtener un error `404`.

---

## 👨‍💻 Autor

**Martín Lobos**

Proyecto desarrollado como práctica de React, utilizando componentes, props, hooks, Context API, consumo de APIs, routing y Material UI.
