# NEGOCIO.md - Plataforma de Venta de Productos con Memes Trending

## 1. Visión del Negocio

### 1.1 Concepto
Plataforma e-commerce que detecta tendencias de memes en redes sociales, genera o adapta dichos memes y los serigrafía en productos físicos (camisetas, sudaderas, tazas, cojines, carcasas de móvil, cromos) para su venta online.

### 1.2 Propuesta de valor
- **Actualidad**: Productos basados en memes trending del momento
- **Rapidez**: Modelo print-on-demand que permite lanzar productos en tiempo récord
- **Originalidad**: Catálogo vivo y en constante renovación
- **Edición limitada implícita**: Los memes tienen ciclo de vida corto, generando urgencia de compra

### 1.3 Modelo de producción
- **Tipo**: Print-on-demand (serigrafía bajo demanda)
- **Proveedor**: Printful (integración vía API)
- **Ventajas**: Sin stock inicial, sin riesgo de inventario, escalabilidad automática

### 1.4 Mercado objetivo
- **Fase inicial**: España
- **Expansión prevista**: Europa (según resultados)

### 1.5 Métricas de éxito
| Métrica | Descripción |
|---------|-------------|
| **Tasa de conversión** | Porcentaje de visitantes que completan una compra |
| **Número de ventas** | Volumen total de pedidos completados |
| **Ticket medio** | Valor promedio por pedido |
| **Tasa de abandono de carrito** | Porcentaje de carritos no finalizados |

---

## 2. Tipos de Usuario y Roles

### 2.1 Usuario Target (Cliente)
Persona que accede a la web para visualizar y comprar productos.

**Capacidades**:
- Navegar el catálogo de productos
- Ver detalle de productos
- Comprar como invitado o como usuario registrado
- Acceder al histórico de pedidos (si está registrado)
- Consultar estado de un pedido
- Suscribirse a la newsletter
- Contactar con el equipo de ventas

### 2.2 Usuario Gestor
Persona encargada de la operativa diaria del catálogo y los pedidos.

**Capacidades**:
- Aprobar o rechazar memes propuestos
- Crear y configurar productos (imagen, precio, título, descripción, tallas, colores)
- Solicitar generación de imágenes con IA
- Solicitar generación de reviews con IA
- Activar/desactivar productos
- Verificar correcta publicación de productos
- Gestionar pedidos entrantes
- Coordinar serigrafía y envíos con Printful
- Acceso opcional a funcionalidades de marketing

### 2.3 Usuario Administrador
Persona con control total sobre el sistema.

**Capacidades**:
- Todas las capacidades del gestor
- Crear, editar y eliminar usuarios gestores
- Acceso completo a la API con credenciales
- Gestión de configuración del sistema

### 2.4 Usuario Marketing
Persona encargada de la captación de tráfico y conversión.

**Capacidades**:
- Crear y gestionar campañas de marketing
- Crear y administrar códigos promocionales/descuento
- Acceso a métricas de conversión y ventas

---

## 3. Flujos de Usuario

### 3.1 Flujo del Usuario Target

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE COMPRA                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Descubre producto (RRSS, publicidad, email, orgánico)       │
│                           ↓                                      │
│  2. Llega a landing o ficha de producto                         │
│                           ↓                                      │
│  3. Navega catálogo / Ve detalle de producto                    │
│                           ↓                                      │
│  4. Añade al carrito                                            │
│                           ↓                                      │
│  5. [Opcional] Se le ofrece venta cruzada                       │
│                           ↓                                      │
│  6. Inicia checkout (como invitado o registrado)                │
│                           ↓                                      │
│  7. Introduce datos de envío y pago (Stripe)                    │
│                           ↓                                      │
│  8. Confirmación de compra + número de pedido                   │
│                           ↓                                      │
│  9. Recibe email de confirmación                                │
│                           ↓                                      │
│ 10. Puede consultar estado del pedido                           │
│                           ↓                                      │
│ 11. Recibe el producto                                          │
│                           ↓                                      │
│ 12. [Días después] Recibe email de valoración + descuento       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo del Usuario Gestor

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUJO DE CREACIÓN DE PRODUCTO                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Recibe notificación (Telegram/WhatsApp) con meme candidato  │
│     - Ver fuente(s)                                             │
│     - Aprobar                                                   │
│     - Rechazar                                                  │
│                           ↓                                      │
│  2. Si aprueba → Accede a página de configuración de producto   │
│                           ↓                                      │
│  3. Configura producto:                                         │
│     - Tipo de producto                                          │
│     - Imagen del meme (subir / generar con IA)                  │
│     - Precio                                                    │
│     - Título y descripción                                      │
│     - Tallas disponibles (si aplica)                            │
│     - Color (por defecto: blanco)                               │
│     - Reviews (generar con IA)                                  │
│                           ↓                                      │
│  4. Crea el producto → Se guarda en BD + se sube imagen         │
│                           ↓                                      │
│  5. Verifica producto en la web (vista de usuario target)       │
│                           ↓                                      │
│  6. Realiza compra de prueba (opcional)                         │
│                           ↓                                      │
│  7. Producto publicado y disponible                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  FLUJO DE GESTIÓN DE PEDIDOS                     │
├─────────────────────────────────────────────────────────────────┤
│  1. Recibe notificación de nueva venta                          │
│                           ↓                                      │
│  2. Revisa detalles del pedido                                  │
│                           ↓                                      │
│  3. Coordina producción con Printful (automático vía API)       │
│                           ↓                                      │
│  4. Monitoriza estado del envío                                 │
│                           ↓                                      │
│  5. Gestiona incidencias si las hay                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Flujo del Usuario Administrador

```
┌─────────────────────────────────────────────────────────────────┐
│               FLUJO DE ADMINISTRACIÓN                            │
├─────────────────────────────────────────────────────────────────┤
│  1. Inicia sesión (interfaz web o consola)                      │
│                           ↓                                      │
│  2. Gestiona productos:                                         │
│     - Ver listado                                               │
│     - Crear / Editar / Eliminar                                 │
│     - Activar / Desactivar / Pausar                             │
│                           ↓                                      │
│  3. Gestiona usuarios:                                          │
│     - Crear gestores                                            │
│     - Activar / Desactivar gestores                             │
│                           ↓                                      │
│  4. Accede a configuración del sistema                          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Flujo del Usuario Marketing

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUJO DE MARKETING                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Accede al panel de marketing                                │
│                           ↓                                      │
│  2. Crea/gestiona campañas de marketing                         │
│                           ↓                                      │
│  3. Crea códigos promocionales:                                 │
│     - Porcentaje de descuento                                   │
│     - Fecha de validez                                          │
│     - Límite de usos                                            │
│     - Productos aplicables                                      │
│                           ↓                                      │
│  4. Monitoriza métricas de conversión                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Componentes del Sistema

### 4.1 Frontend Web - Usuarios Target
**Propósito**: Tienda online para clientes finales.

**Páginas principales**:
- Home / Landing con productos destacados y trending
- Catálogo de productos con filtros y ordenación
- Ficha de producto con detalle, reviews y productos relacionados
- Carrito de compra
- Checkout (invitado / registrado)
- Confirmación de pedido
- Consulta de estado de pedido
- Registro / Login / Recuperar contraseña
- Mi cuenta / Histórico de pedidos (usuarios registrados)
- Formulario de contacto
- Páginas legales (privacidad, términos, cookies, devoluciones)

### 4.2 Frontend Web - Gestores/Administradores
**Propósito**: Panel de administración del negocio.

**Funcionalidades**:
- Dashboard con métricas clave
- Gestión de productos (CRUD + activar/desactivar)
- Generación de imágenes con IA
- Generación de reviews con IA
- Gestión de pedidos
- Gestión de usuarios (solo admin)
- Gestión de códigos promocionales
- Configuración del sistema

### 4.3 Backend - API REST
**Propósito**: Lógica de negocio y persistencia.

**Responsabilidades**:
- Endpoints para ambos frontales
- Autenticación y autorización
- Integración con Stripe (pagos)
- Integración con Printful (producción y envíos)
- Integración con servicio de email
- Integración con IA para generación de imágenes y textos
- Comunicación con base de datos PostgreSQL

### 4.4 Base de Datos
**Propósito**: Almacenamiento persistente.

**Motor**: PostgreSQL

**Entidades principales**:
- Usuarios (target, gestores, admins, marketing)
- Productos
- Categorías/Tipos de producto
- Pedidos
- Líneas de pedido
- Reviews
- Códigos promocionales
- Suscriptores newsletter

### 4.5 Integraciones Externas

| Servicio | Propósito |
|----------|-----------|
| **Stripe** | Pasarela de pagos |
| **Printful** | Producción y envíos (print-on-demand) |
| **Servicio de email** | Transaccionales y marketing |
| **IA (imágenes)** | Generación/edición de memes |
| **IA (texto)** | Generación de reviews |
| **SaaS externo** | Gestión de stock, envíos y facturación |
| **Google Analytics 4** | Analítica web y e-commerce |

---

## 5. Requisitos Funcionales

### 5.1 Usuarios Target (Clientes)

| ID | Requisito |
|----|-----------|
| RF-T01 | Ver listado de productos con paginación |
| RF-T02 | Filtrar productos por tipo, precio y otros criterios |
| RF-T03 | Ordenar productos por precio, popularidad, novedad |
| RF-T04 | Ver detalle de un producto con imágenes, descripción, precio, tallas y reviews |
| RF-T05 | Ver productos "calientes" (trending/más vendidos) |
| RF-T06 | Ver sección "Te puede interesar" con productos relacionados |
| RF-T07 | Añadir productos al carrito |
| RF-T08 | Carrito persistente (se mantiene al cerrar navegador) |
| RF-T09 | Modificar cantidades y eliminar productos del carrito |
| RF-T10 | Ver oferta de venta cruzada antes de finalizar compra |
| RF-T11 | Aplicar código de descuento en el carrito |
| RF-T12 | Realizar compra como invitado |
| RF-T13 | Registrarse como usuario |
| RF-T14 | Iniciar y cerrar sesión |
| RF-T15 | Recuperar contraseña |
| RF-T16 | Completar checkout con datos de envío y pago (Stripe) |
| RF-T17 | Ver confirmación de compra con número de pedido y detalles |
| RF-T18 | Recibir email de confirmación de compra |
| RF-T19 | Consultar estado de un pedido (verificando email o teléfono) |
| RF-T20 | Ver histórico de pedidos (usuarios registrados) |
| RF-T21 | Suscribirse a la newsletter |
| RF-T22 | Contactar con el equipo mediante formulario |
| RF-T23 | Compartir productos en redes sociales |
| RF-T24 | Solicitar devolución (según política legal) |

### 5.2 Usuarios Gestores/Administradores

| ID | Requisito |
|----|-----------|
| RF-G01 | Iniciar y cerrar sesión con credenciales |
| RF-G02 | Cambiar contraseña |
| RF-G03 | Ver listado de productos con búsqueda |
| RF-G04 | Crear nuevo producto con: tipo, imagen, precio, título, descripción, tallas, color |
| RF-G05 | Editar producto existente |
| RF-G06 | Eliminar producto |
| RF-G07 | Activar/desactivar (pausar) producto |
| RF-G08 | Solicitar generación de imágenes de memes con IA (con texto, imagen o ambos) |
| RF-G09 | Solicitar generación de reviews con IA (positivas, 50-100 palabras) |
| RF-G10 | Previsualizar producto con mockup (vía Printful) |
| RF-G11 | Ver histórico de pedidos recibidos |
| RF-G12 | Ver detalle de un pedido |
| RF-G13 | Gestionar envíos (coordinación con Printful) |

### 5.3 Usuarios Administradores (adicionales)

| ID | Requisito |
|----|-----------|
| RF-A01 | Crear usuarios gestores |
| RF-A02 | Activar/desactivar usuarios gestores |
| RF-A03 | Acceso a la API mediante credenciales |

### 5.4 Usuarios Marketing

| ID | Requisito |
|----|-----------|
| RF-M01 | Crear campañas de marketing |
| RF-M02 | Gestionar campañas existentes |
| RF-M03 | Crear códigos promocionales (%, validez, límite de usos, productos) |
| RF-M04 | Editar y desactivar códigos promocionales |
| RF-M05 | Ver métricas de conversión |

### 5.5 Sistema General

| ID | Requisito |
|----|-----------|
| RF-S01 | Integración con Stripe para procesamiento de pagos |
| RF-S02 | Integración con Printful para producción y envíos |
| RF-S03 | Envío automático de email de confirmación de compra |
| RF-S04 | Envío de email de seguimiento post-compra (valoración + descuento) |
| RF-S05 | Mostrar productos "calientes" basados en ventas recientes |
| RF-S06 | Sistema de venta cruzada con productos relacionados |
| RF-S07 | Validación y aplicación de códigos de descuento |
| RF-S08 | Gestión de devoluciones (14 días, coste a cargo del cliente) |

---

## 6. Requisitos No Funcionales

### 6.1 Rendimiento

| ID | Requisito |
|----|-----------|
| RNF-01 | Tiempo de carga de páginas < 2 segundos |
| RNF-02 | Largest Contentful Paint (LCP) < 2.5 segundos |
| RNF-03 | Uso de CDN para servir imágenes de productos |
| RNF-04 | Estrategia de caché para productos y catálogo |

### 6.2 Usabilidad

| ID | Requisito |
|----|-----------|
| RNF-05 | Diseño responsive (móvil, tablet, desktop) |
| RNF-06 | Interfaz orientada a conversión para usuarios target |
| RNF-07 | Interfaz funcional y eficiente para gestores/admins |
| RNF-08 | Accesibilidad WCAG 2.1 nivel A mínimo |

### 6.3 SEO

| ID | Requisito |
|----|-----------|
| RNF-09 | Renderizado del lado del servidor (SSR) o generación estática (SSG) |
| RNF-10 | URLs amigables y semánticas |
| RNF-11 | Metadatos optimizados (title, description, Open Graph) |
| RNF-12 | Sitemap XML generado automáticamente |
| RNF-13 | Archivo robots.txt configurado |
| RNF-14 | Datos estructurados schema.org para productos |

### 6.4 Internacionalización

| ID | Requisito |
|----|-----------|
| RNF-15 | Sistema multiidioma (español inicial, preparado para más) |
| RNF-16 | Soporte para múltiples monedas (EUR inicial) |

### 6.5 Seguridad

| ID | Requisito |
|----|-----------|
| RNF-17 | HTTPS obligatorio en toda la aplicación |
| RNF-18 | Autenticación segura con tokens |
| RNF-19 | Rate limiting en la API para prevenir abuso |
| RNF-20 | Protección contra OWASP Top 10 |
| RNF-21 | Datos de pago gestionados exclusivamente por Stripe (PCI compliance) |

### 6.6 Cumplimiento Legal

| ID | Requisito |
|----|-----------|
| RNF-22 | Cumplimiento GDPR/LOPD |
| RNF-23 | Banner de consentimiento de cookies |
| RNF-24 | Política de privacidad accesible |
| RNF-25 | Términos y condiciones de venta |
| RNF-26 | Política de devoluciones (14 días por ley) |
| RNF-27 | Precios mostrados con IVA incluido |

### 6.7 Monitorización

| ID | Requisito |
|----|-----------|
| RNF-28 | Monitorización de errores (ej: Sentry) |
| RNF-29 | Monitorización de disponibilidad (uptime) |
| RNF-30 | Backups automáticos de base de datos |

---

## 7. Analytics y Métricas

### 7.1 Funnel de Conversión (GA4 Enhanced Ecommerce)

| Evento | Descripción |
|--------|-------------|
| `page_view` | Visita a cualquier página |
| `view_item_list` | Vista del catálogo de productos |
| `view_item` | Vista del detalle de un producto |
| `add_to_cart` | Producto añadido al carrito |
| `remove_from_cart` | Producto eliminado del carrito |
| `begin_checkout` | Inicio del proceso de checkout |
| `add_shipping_info` | Datos de envío introducidos |
| `add_payment_info` | Datos de pago introducidos |
| `purchase` | Compra completada |
| `refund` | Devolución procesada |

### 7.2 Métricas Clave (KPIs)

| Métrica | Fórmula |
|---------|---------|
| **Tasa de conversión** | (Compras / Visitas) × 100 |
| **Tasa de abandono de carrito** | (Carritos abandonados / Carritos iniciados) × 100 |
| **Ticket medio** | Ingresos totales / Número de pedidos |
| **Valor del cliente (LTV)** | Ingresos por cliente a lo largo del tiempo |
| **Coste de adquisición (CAC)** | Gasto en marketing / Nuevos clientes |

### 7.3 Atribución

- Seguimiento de fuente de tráfico por venta
- UTM parameters para campañas
- Identificación de canales más rentables

---

## 8. Stack Tecnológico

### 8.1 Frontend

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Framework | **Next.js** | SSR/SSG para SEO, excelente DX, optimización automática |
| Lenguaje | TypeScript | Tipado estático, mejor mantenibilidad |
| Estilos | Tailwind CSS / CSS Modules | Productividad y consistencia |
| Estado | React Context / Zustand | Simplicidad para el alcance del proyecto |

### 8.2 Backend

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Runtime | **Node.js** | Ecosistema amplio, mismo lenguaje que frontend |
| Framework | **Express** | Maduro, flexible, gran comunidad |
| Lenguaje | TypeScript | Consistencia con frontend |
| ORM | **Prisma** | DX excelente, migraciones, type-safety |

### 8.3 Base de Datos

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Motor | **PostgreSQL** | Robusto, escalable, soporte JSON |

### 8.4 Infraestructura

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Contenedores | **Docker** | Consistencia entre entornos |
| Control de versiones | **Git** | Estándar de la industria |
| CI/CD | GitHub Actions / Similar | Automatización de despliegues |

### 8.5 Testing

| Tipo | Tecnología |
|------|------------|
| Unitarios | **Jest** |
| End-to-end | **Cypress** |

### 8.6 Integraciones

| Servicio | Uso |
|----------|-----|
| **Stripe** | Pagos |
| **Printful API** | Producción, mockups, envíos |
| **SendGrid / Resend** | Emails transaccionales |
| **OpenAI / Similar** | Generación de imágenes y textos |
| **Google Analytics 4** | Analytics |
| **Sentry** | Monitorización de errores |

---

## 9. Consideraciones sobre Propiedad Intelectual

### 9.1 Estrategia para Memes

| Tipo | Estrategia |
|------|------------|
| **Memes sin copyright** | Uso libre |
| **Memes propios** | Creación original basada en tendencias |
| **Memes con copyright** | Versiones editadas/parodia (consultar asesoría legal) |

### 9.2 Recomendaciones

- Mantener registro de la fuente de cada meme
- Documentar proceso de creación/modificación
- Consultar con abogado especializado en propiedad intelectual
- Tener proceso de retirada ante reclamaciones (DMCA)

---

## 10. Roadmap: Funcionalidades Post-MVP

Las siguientes funcionalidades han sido identificadas como valiosas pero se posponen para después del MVP:

### 10.1 Prioridad Alta (v1.1)

| Funcionalidad | Descripción | Beneficio |
|---------------|-------------|-----------|
| **Wishlist / Favoritos** | Usuarios registrados pueden guardar productos para después | Aumenta engagement y facilita remarketing |
| **Notificación de stock** | "Avísame cuando vuelva" para productos retirados | Captura leads y mide demanda latente |

### 10.2 Prioridad Media (v1.2)

| Funcionalidad | Descripción | Beneficio |
|---------------|-------------|-----------|
| **Bundles de productos** | Packs con descuento (ej: camiseta + taza) | Aumenta ticket medio |
| **Temporizador de escasez** | Contador de tiempo disponible del meme | Genera urgencia de compra |
| **Programa de referidos** | Descuentos por traer amigos | Adquisición orgánica |

### 10.3 Prioridad Técnica (v1.x)

| Funcionalidad | Descripción | Beneficio |
|---------------|-------------|-----------|
| **Redis para caché** | Almacén en memoria para sesiones y datos frecuentes | Mejora rendimiento |
| **Cola de mensajes** | Procesamiento asíncrono de emails y webhooks | Mayor resiliencia |
| **Sistema de notificaciones push** | Preparación para futura app móvil | Engagement |

---

## 11. Fuera de Alcance del MVP

Los siguientes elementos NO forman parte del desarrollo actual:

- Sistema de detección automática de memes trending
- Bot de Telegram/WhatsApp para propuesta de memes
- Aplicación móvil nativa
- Marketplace de diseñadores externos
- Sistema de suscripción mensual
- Personalización de productos por el cliente

---

## 12. Próximos Pasos

1. ~~Generar documento NEGOCIO.md~~ ✅
2. Generar modelo de datos con diagramas Mermaid
3. Generar casos de uso detallados
4. Generar especificación de API con OpenAPI
5. Generar documento técnico con la estructura de carpetas, las tecnologías usadas, la arquitectura de backend y frontend, todos los pasos para levantar el entorno (incluida la base de datos) y todo lo que consideremos oportuno.
6. Generar plan de desarrollo con sprints

---

*Documento generado como parte del proceso de definición del negocio.*
*Versión: 1.0*
*Fecha: Enero 2026*
