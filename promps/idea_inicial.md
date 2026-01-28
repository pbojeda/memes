# Empresa
Empresa que detecta tendencias de memes en redes sociales u otras fuentes, utiliza o genera un meme basado en la tendencia que ha detectado, lo serigrafía en distintos tipos de productos (camisetas, camisetas, tazas, sudaderas, cojines, carcasas de móvil, cromos) y los vende online.

# Tipos de usuario
Existen 4 tipos de roles:
1. Usuario target: usuario que accederá a una web y realizará una compra
2. Gestor: usuario que decide si un meme es válido o no es válido, confirma los campos del producto que se va a vender, verifica que se genera una nueva sección en la web con el nuevo producto, recibe y gestiona envios. También puede tener acceso a la parte de marketing.
3. Administrador: usuario que puede ver/crear/editar/eliminar productos a través de una api con credenciales de acceso o a través de una interfaz web también con credenciales de acceso
4. Marketing: usuario que se encarga de una parte fundamental como son las campañas de marketing para atraer tráfico a la página de venta de producto.

# Flujo de interacción más frecuente por tipo de usuario

## Usuario target
1. Se entera de uno de nuestros productos a través de redes sociales, publicidad, emailing u otros.
2. Llega a la landing de producto
3. Realiza la compra.
4. ve página de compra correcta con detalles de la compra
5. Recibe email de pedido
6. Puede acceder a página de detalles de su pedido.
7. Recibe el pedido en la dirección que ha indicado
8. Pasado un intervalo de tiempo, recibe un email de valoración + descuento próxima compra

## Usuario gestor
1. IA envia mensaje a telegram/whatsapp con meme real y con 3 opciones:
- Botón/es ver fuente/s
- Aprobar
- Rechazar => pasa al siguiente meme + descarta el actual
2. En función de la respuesta puede haber tres caminos:
- Camino 1 (Ver fuentes): Si le da a ver fuentes, irá al enlace correspondiente que envie el bot
- Camino 2 (Aprobar): le llevará a una web para terminar de configurar el producto
- Camino 3 (Rechazar): descartará el meme y pasará al siguiente.
3. Página web para gestores/adminsitradores con la funcionalidad de crear producto con la información precargada del producto que se va a vender y que aún no se ha creado en la base de datos. En esta página se elegirá:
- Tipo de producto
- seleccion de imagen del meme
- seleccion de precio
- seleccion de título
- seleccion de descripcion
- tallas disponibles: S, M, L, XL o no aplica (solo aplica si es ropa)
- color: por defecto blanco.
- valoración + reviews: se pueden generar valoraciones y reviews fake.
4. En la página web del punto 3 para gestores/adminsitradores con la funcionalidad de crear producto, y en relación a la imagen del meme, ocurren varias cosas:
- que genere/regenere una o varias opciones con IA
- que permita seleccionar una opcion de un fichero/foto
- que genere reviews automaticamente para el producto."
5. una vez finzalizado el punto 3 y el punto 4, y con el producto configurado, se pulsará el botón de crear, y lo que hará será crear el producto en base de datos y subir el meme a una url.
6. Verifica que el producto se ha creado correctamente entrando a la web del detalle de dicho producto con la vista de un usuario target.
7. Verifica que puede hacer una compra
8. Pasado el tiempo, cuando un usuario target realice una compra, el gestor se enterará de que ha habido una nueva venta
9. Gestionará la serigrafía del producto, la venta y el envio del producto.

Es importante mencionar que la pasarela de pago será stripe, por lo que habrá que integrar su widget.

## Usuario administrador
1. Iniar sesión como administrador en un interfaz web o en una consola 
2. Puede ver/crear/editar/eliminar un producto o también puede pausar un producto. La funcionalidad de pausar un producto implica que para un usuario target no aparecerá en la landing web de todos los productos ni en la web de detalle de un producto.
3. Puede crear, activar y desactiva a usuarios gestores.

## Usuario de marketing
1. Crea y gestiona campañas de marketing
2. Crea códigos promocionales para productos

# Objetivos principales de este proyecto
- Ser la web donde los usuarios target podrán ver un listado de productos y hacer búsquedas, ver el detalle de un producto y comprar un producto.
- Ser la web donde los gestores y administradores puedan ver, crear, editar y eliminar productos así como activarlos y desactivarlos.
- No es objetivo de este proyecto la parte de detección automática de memes ni el chat de telegram.

# Componentes principales
## Aplicación frontend web para usuarios target
Una web donde los usuarios podrán acceder a una landing con un listado de productos, el detalle de un producto y realizar la compra del producto. 
También podrán suscribirse a una newsletter. 
También podrán acceder a ver el detalle de uno de sus pedidos.

## Aplicación frontend web para gestores/administradores
Una web dónde tras introducir datos de autenticación los usuarios con rol de gestor o de administrador podrán ver un listado de productos y también crear/editar/eliminar productos así como desactivar un producto.

## Aplicación backend
Una API Rest que ofrece endpoints a los frontales para que se puedan llevar a cabo las funcionalidades. También se comunica con una base de datos progressSQL.
Además, se integra con stripe para la gestión de pagos.
En un futuro puede que también se integre con algún SaaS de gestión de stock, productos y envios.

## Base de datos
Almacenamiento persistente de los datos de la aplicación.

# Requisitos funcionales
## Usuarios gestores/administradores
- deben poder ver un listado de productos y ralizar búsquedas sobre ellos. La web también mostrará productos "calientes"
- deben poder crear/editar/eliminar un producto
- deben poder solicitar que el sistema genere imágenes de memes con IA en la sección de crear/editar producto. La creación de imágenes con IA puede ser introduciendo una imagen y un texto para que la cree, pero también solo con una imagen o solo con un texto.
- deben poder solicitar que el sistema genere comentarios y reviews con IA en la sección de crear/editar producto. La creación de comentarios y reviews debe ser siempre de comentarios positivos relacionados con la calidad del producto, la calidad del servicio o la rapidez del envio y siempre en tono positivo, con textos que tengan entre 50 y 100 palabras.
- deben poder activar/desactivar productos
- deben poder iniciar y cerrar sesión
- deben poder cambiar su contraseña
- deben poder ver un histórico de pedidos recibidos de la api de stripe

## Usuarios target
- deben poder ver un listado de productos
- deben poder ver el detalle de un producto
- deben poder comprar un producto
- deben ver que han comprado un producto correctamente, así como su número de pedido y los detalles de la compra
- deben poder acceder al detalle de su compra. Para ello, se solicitará previamente que introduzcan o el número de teléfono o el email con el que realizaron la compra.
- deben recibir un email de confirmación de compra
- deben poder contactar con el equipo de ventas (usuarios gestores) a través de un formulario de contacto.

## Generales
- el sistema debe integrarse con stripe, que será la pasarela de pago
- tras una venta, el sistema debe enviar un email de confirmación con los detalles de la venta y con un enlace para que el usuario pueda acceder a ver dichos detalles así como el estado del pedido. Para poder acceder a visualizar todos los detalles previamente el usuario deberá introducir el número de teléfono o el email con el que ha realizado la compra
- se mostrarán productos "calientes"
- se tratará siempre de realizar venta cruzada, es decir, en la página del detalle de un producto habrá una sección de: tal vez te pueda interesar.
- Antes de finalizar la venta, mostrar al usuario una ventana que le ofrezca añadir algún otro producto que esté relacionado.

# Requisitos no funcionales
- debe tener un diseño responsive
- debe prestar atención al posicionamiento SEO
- debe tener tiempos de carga lo más cortos posible
- debe ser multiidioma
- productos "calientes"

# UI/UX
- Responsive
- sencilla
- para el usuario target debe estar orientada a la venta de producto
- para el usuario gestor/administrador debe ser funcional

# Tecnologías
- Node.js y express para la API Rest Backend
- React o Next para el frontend
- Base de datos progress sql
- Prisma como manejador de la base de datos
- generación de imágenes Docker
- control de versiones con git
- Jest para test unitarios
- Cypress para test end 2 end


# Próximos pasos
1. generar fichero NEGOCIO.md del negocio. Para ello falta:
- [] Búsqueda de nuevas funcionalidades
- [] Búsqueda de nuevos requisitos funcionales
- [] Búsqueda de nuevas requisitos no funcionales
- [] Verificar la elección de las tecnologías
2. Generar fichero de modelo de datos con diagramas mermaid
3. Generar casos de uso
4. Generar primera versión de la API utilizando openAPI
5. Generar plan de desarrollo