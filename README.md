# Studio Athleisure — Tema Shopify (OS 2.0)

Tema Shopify original inspirado en la arquitectura y experiencia de compra de las tiendas premium de athleisure (mega-menú, hero, carruseles de best sellers, mosaicos de categorías/colores, editoriales y newsletter). Todo el contenido (textos, imágenes, colores, tipografía) se edita desde el **editor de temas de Shopify** sin tocar código.

## Estructura

```
layout/theme.liquid        Layout base (fuentes, variables CSS, grupos de secciones)
config/                    settings_schema.json + settings_data.json
locales/es.default.json    Textos del tema en español
templates/*.json           Plantillas OS 2.0 (index, product, collection, cart, search, page, 404, list-collections)
sections/                  Secciones editables (header con mega-menú, hero, colección destacada, mosaico, editorial, newsletter, footer…)
snippets/                  product-card, price, cart-drawer, icon, meta-tags
assets/                    base.css + global.js (custom elements, sin dependencias)
```

## Características

- **Online Store 2.0**: plantillas JSON, grupos de secciones (`header-group`, `footer-group`), bloques y presets en todas las secciones.
- **Carrito AJAX**: cart drawer con Section Rendering API (`sections=cart-drawer,cart-icon-bubble`), cambio de cantidades y eliminación sin recargar.
- **Productos relacionados**: sección con la Product Recommendations API, cargada de forma diferida con `IntersectionObserver`.
- **Observers**: animaciones de aparición al hacer scroll (`IntersectionObserver`) con respeto a `prefers-reduced-motion`.
- **Selector de variantes** accesible (radios) que actualiza precio, URL y disponibilidad sin recargar.
- **Mega-menú** de 3 niveles a partir del menú principal de navegación + menú drawer móvil.
- **Placeholders**: si no hay imagen o colección seleccionada, se muestran `placeholder_svg_tag` de Shopify — reemplázalos desde el editor de temas.
- **Rendimiento**: imágenes responsivas (`image_url` + `srcset`/`sizes`), lazy loading, JS diferido, cero dependencias externas.
- **Accesibilidad**: skip link, roles ARIA, focus visible, textos alternativos.

## Instalación

1. Comprime la carpeta del tema en un `.zip` (el contenido, con `layout/`, `config/`, etc. en la raíz).
2. En el admin de Shopify: **Tienda online → Temas → Agregar tema → Subir archivo zip**.
3. O con Shopify CLI:
   ```bash
   shopify theme push --store TU-TIENDA.myshopify.com
   ```

## Configuración inicial recomendada

1. **Navegación**: crea el menú `main-menu` con tres niveles (p. ej. Mujer → Categorías → Leggings) para activar el mega-menú.
2. **Colecciones**: asigna colecciones a las secciones "Novedades" y "Best sellers" y a los mosaicos de actividad/color.
3. **Imágenes**: sube el hero (3000×1600 px), mosaicos (900×1200 px) y editoriales (1200×1500 px) desde el editor.
4. **Logo y favicon**: en la sección Encabezado y en Configuración del tema.

## Nota legal

Este tema es un desarrollo original. No incluye textos, imágenes, logotipos ni ninguna otra propiedad intelectual de terceros; todo el contenido de ejemplo es placeholder para ser reemplazado por el contenido propio de la tienda.
