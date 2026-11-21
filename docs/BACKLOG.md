# Product Backlog – Flores de Acho

Estimación con **Planning Poker** (serie Fibonacci: 1, 2, 3, 5, 8) y priorización **MoSCoW** (Must / Should / Could).
Total del backlog: **24 historias de usuario y 98 story points** en 6 épicas.

Archivo importable a Jira: [`jira-backlog.csv`](jira-backlog.csv) (ver instrucciones al final).

## Épicas

| Épica | Nombre | Descripción | Objetivo de negocio |
|---|---|---|---|
| E1 | Catálogo digital de flores | Publicar en línea los puestos y productos del mercado, con búsqueda y filtros por tipo, ocasión y precio. | Dar presencia digital a los comerciantes y que los clientes encuentren qué comprar sin ir a Acho. |
| E2 | Carrito y pedidos en línea | Permitir armar un carrito con productos de varios puestos, aplicar precio mayorista y confirmar el pedido validando el stock. | Captar las ventas de clientes que hoy no pueden acudir al mercado y reducir pedidos fallidos por falta de stock. |
| E3 | Pagos digitales | Cobrar con Yape, Plin, tarjeta o contra entrega mediante una pasarela desacoplada (simulada en esta entrega). | Eliminar la dependencia del efectivo y habilitar la compra a distancia. |
| E4 | Recojo y delivery | Ofrecer recojo en el mercado o delivery por distrito con tarifa y seguimiento del estado del pedido. | Llegar a clientes de otros distritos y reducir llamadas de "¿dónde está mi pedido?". |
| E5 | Panel del comerciante | Dar a cada comerciante un panel para publicar productos, actualizar precio y stock, atender pedidos y ver sus ventas. | Que los comerciantes gestionen su negocio en línea sin conocimientos técnicos, sobre todo en fechas pico. |
| E6 | Cuentas y seguridad | Registro e inicio de sesión con roles (cliente/comerciante), control de acceso y protección contra abuso. | Generar confianza y proteger los datos de clientes y comerciantes. |

## E1 · Catálogo digital de flores

### HU-01 · Ver el catálogo de flores

**Como** cliente, **quiero** ver el catálogo de productos con precio y disponibilidad, **para** decidir qué comprar sin ir al mercado.

- Story points: **3** · Prioridad: **Must** · Sprint: **1**
- Criterios de aceptación:
  - **Dado** que que entro al sitio sin iniciar sesión, **cuando** abro el Catálogo, **entonces** veo las flores con puesto, precio y estado de stock.

### HU-02 · Buscar y filtrar productos

**Como** cliente, **quiero** buscar por texto y filtrar por tipo, ocasión, puesto, precio y stock, **para** encontrar rápido lo que necesito.

- Story points: **5** · Prioridad: **Must** · Sprint: **2**
- Criterios de aceptación:
  - **Dado** que que existen rosas y coronas en el catálogo, **cuando** filtro por tipo "Rosas", **entonces** solo veo rosas.
  - **Dado** que que escribo "orquidea" sin tilde, **cuando** busco, **entonces** aparece la Orquídea phalaenopsis.

### HU-03 · Ver el detalle de un producto

**Como** cliente, **quiero** ver el detalle con precio minorista y mayorista, **para** comparar y decidir la cantidad.

- Story points: **3** · Prioridad: **Must** · Sprint: **1**
- Criterios de aceptación:
  - **Dado** que que elijo un producto, **cuando** abro su detalle, **entonces** veo descripción, ocasiones, precio minorista, precio mayorista y cantidad mínima.

### HU-04 · Conocer los puestos del mercado

**Como** cliente, **quiero** ver el directorio de puestos con su número y cantidad de productos, **para** comprar a un comerciante en particular.

- Story points: **3** · Prioridad: **Should** · Sprint: **1**
- Criterios de aceptación:
  - **Dado** que que hay puestos registrados, **cuando** abro "Puestos", **entonces** veo nombre, número de puesto y productos, y puedo ver solo sus productos.

### HU-05 · Destacar fechas de mayor demanda

**Como** cliente, **quiero** acceder con un clic a los productos de San Valentín, Día de la Madre y Todos los Santos, **para** comprar para la fecha sin buscar.

- Story points: **3** · Prioridad: **Should** · Sprint: **2**
- Criterios de aceptación:
  - **Dado** que que elijo "Día de la Madre", **cuando** pulso la tarjeta, **entonces** el catálogo muestra solo productos de esa ocasión.

## E2 · Carrito y pedidos en línea

### HU-06 · Agregar productos al carrito

**Como** cliente, **quiero** agregar productos de distintos puestos a un carrito, **para** comprar todo en un solo pedido.

- Story points: **5** · Prioridad: **Must** · Sprint: **2**
- Criterios de aceptación:
  - **Dado** que que un producto tiene stock, **cuando** lo agrego, **entonces** el carrito cuenta la cantidad.
  - **Dado** que que pido más unidades que el stock, **cuando** intento agregarlas, **entonces** el sistema me avisa cuántas hay.

### HU-07 · Aplicar precio mayorista automático

**Como** cliente, **quiero** que el precio mayorista se aplique al alcanzar la cantidad mínima, **para** pagar menos al comprar en volumen.

- Story points: **3** · Prioridad: **Must** · Sprint: **2**
- Criterios de aceptación:
  - **Dado** que que rosas rojas son S/ 45 y S/ 36 desde 10 docenas, **cuando** agrego 10 docenas, **entonces** el total de la línea es S/ 360.

### HU-08 · Confirmar el pedido validando stock

**Como** cliente, **quiero** confirmar mi carrito y que se genere un pedido por puesto, **para** recibir mi compra de cada comerciante.

- Story points: **8** · Prioridad: **Must** · Sprint: **3**
- Criterios de aceptación:
  - **Dado** que que tengo productos de 2 puestos, **cuando** confirmo, **entonces** se crean 2 pedidos y el stock se descuenta.
  - **Dado** que que otro cliente agotó el stock, **cuando** confirmo, **entonces** recibo un error 409 y mi inventario no cambia.

### HU-09 · Ver mis pedidos

**Como** cliente, **quiero** ver la lista de mis pedidos con su detalle, **para** dar seguimiento a mis compras.

- Story points: **5** · Prioridad: **Must** · Sprint: **3**
- Criterios de aceptación:
  - **Dado** que que hice pedidos, **cuando** abro "Mis pedidos", **entonces** veo solo mis pedidos con total, pago y estado.

### HU-10 · Cancelar un pedido pendiente

**Como** cliente, **quiero** cancelar mi pedido mientras esté pendiente, **para** corregir un error sin perder dinero.

- Story points: **2** · Prioridad: **Could** · Sprint: **4**
- Criterios de aceptación:
  - **Dado** que que mi pedido está pendiente, **cuando** lo cancelo, **entonces** se repone el stock y el pago queda reembolsado.
  - **Dado** que que el pedido ya está en preparación, **cuando** intento cancelar, **entonces** el sistema lo impide (409).

## E3 · Pagos digitales

### HU-11 · Pagar con Yape o Plin

**Como** cliente, **quiero** pagar con mi celular Yape o Plin, **para** pagar sin efectivo.

- Story points: **5** · Prioridad: **Must** · Sprint: **3**
- Criterios de aceptación:
  - **Dado** que que elijo Yape e ingreso mi celular, **cuando** confirmo, **entonces** el pago queda "Pagado" con una referencia de operación.

### HU-12 · Pagar con tarjeta

**Como** cliente, **quiero** pagar con tarjeta de crédito o débito, **para** tener otra forma de pago digital.

- Story points: **5** · Prioridad: **Should** · Sprint: **3**
- Criterios de aceptación:
  - **Dado** que que ingreso una tarjeta válida, **cuando** confirmo, **entonces** el pago se aprueba y no se guarda el número de tarjeta.
  - **Dado** que que la tarjeta es rechazada, **cuando** confirmo, **entonces** veo el error 402 y el stock se repone.

### HU-13 · Pagar contra entrega

**Como** cliente, **quiero** pagar en efectivo al recibir, **para** comprar sin medios digitales.

- Story points: **2** · Prioridad: **Could** · Sprint: **3**
- Criterios de aceptación:
  - **Dado** que que elijo contra entrega, **cuando** confirmo, **entonces** el pago queda pendiente hasta que se entrega el pedido.

### HU-14 · Recibir confirmación del pago

**Como** cliente, **quiero** ver una confirmación con el total y la referencia de la operación, **para** tener constancia de mi compra.

- Story points: **3** · Prioridad: **Could** · Sprint: **3**
- Criterios de aceptación:
  - **Dado** que que mi pago fue aprobado, **cuando** termina el checkout, **entonces** veo la confirmación con el monto y el código de operación.

## E4 · Recojo y delivery

### HU-15 · Elegir recojo o delivery

**Como** cliente, **quiero** elegir recoger en el mercado o recibir en mi dirección, **para** recibir mis flores como me convenga.

- Story points: **3** · Prioridad: **Must** · Sprint: **2**
- Criterios de aceptación:
  - **Dado** que que elijo delivery, **cuando** no ingreso distrito o dirección, **entonces** el sistema no me deja confirmar.

### HU-16 · Conocer el costo de delivery por distrito

**Como** cliente, **quiero** ver la tarifa y el tiempo estimado según mi distrito, **para** saber el total antes de pagar.

- Story points: **3** · Prioridad: **Must** · Sprint: **2**
- Criterios de aceptación:
  - **Dado** que que elijo Miraflores, **cuando** veo el resumen, **entonces** el delivery cuesta S/ 15 por puesto y se suma al total.

### HU-17 · Seguir el estado de mi pedido

**Como** cliente, **quiero** ver la línea de tiempo del pedido (pendiente, preparando, en camino o listo, entregado), **para** saber cuándo llegará.

- Story points: **5** · Prioridad: **Should** · Sprint: **4**
- Criterios de aceptación:
  - **Dado** que que el comerciante avanza el estado, **cuando** actualizo mis pedidos, **entonces** veo el nuevo estado con su hora.

## E5 · Panel del comerciante

### HU-18 · Publicar mis productos

**Como** comerciante, **quiero** registrar mi puesto y publicar productos con precio minorista y mayorista, **para** vender en línea.

- Story points: **8** · Prioridad: **Must** · Sprint: **4**
- Criterios de aceptación:
  - **Dado** que que soy comerciante con puesto, **cuando** publico un producto, **entonces** aparece en el catálogo público.
  - **Dado** que que el mayorista supera al minorista, **cuando** intento publicar, **entonces** el sistema lo rechaza.

### HU-19 · Actualizar precio y stock

**Como** comerciante, **quiero** editar precio, stock y visibilidad de mis productos, **para** mantener el catálogo al día en fechas pico.

- Story points: **3** · Prioridad: **Must** · Sprint: **4**
- Criterios de aceptación:
  - **Dado** que que tengo un producto mío, **cuando** cambio el stock, **entonces** el catálogo muestra el nuevo stock.
  - **Dado** que que el producto es de otro puesto, **cuando** intento editarlo, **entonces** recibo 403.

### HU-20 · Gestionar los pedidos recibidos

**Como** comerciante, **quiero** ver los pedidos de mi puesto y avanzar su estado, **para** atender a mis clientes ordenadamente.

- Story points: **5** · Prioridad: **Must** · Sprint: **4**
- Criterios de aceptación:
  - **Dado** que que recibí un pedido, **cuando** lo marco "Preparando", **entonces** el cliente ve el cambio de estado.
  - **Dado** que que el pedido es de otro puesto, **cuando** intento avanzarlo, **entonces** recibo 403.

### HU-21 · Ver el resumen de mis ventas

**Como** comerciante, **quiero** ver cuántos pedidos, pendientes, entregados e ingresos tengo, **para** evaluar cómo me va.

- Story points: **5** · Prioridad: **Could** · Sprint: **4**
- Criterios de aceptación:
  - **Dado** que que tengo pedidos, **cuando** abro "Mi puesto", **entonces** veo pedidos, por atender, entregados y ventas en soles.

## E6 · Cuentas y seguridad

### HU-22 · Registrarme e iniciar sesión con un rol

**Como** usuario, **quiero** crear una cuenta de cliente o de comerciante e iniciar sesión, **para** acceder a las funciones de mi rol.

- Story points: **5** · Prioridad: **Must** · Sprint: **1**
- Criterios de aceptación:
  - **Dado** que que me registro como comerciante, **cuando** indico nombre y número de puesto, **entonces** se crea mi puesto y recibo una sesión de 2 horas.
  - **Dado** que que ingreso mal mi clave, **cuando** intento entrar, **entonces** veo "Credenciales inválidas" sin revelar si el correo existe.

### HU-23 · Controlar el acceso según el rol

**Como** administrador del sistema, **quiero** que cada endpoint exija sesión y el rol correcto, **para** impedir que un cliente use el panel del comerciante.

- Story points: **3** · Prioridad: **Must** · Sprint: **1**
- Criterios de aceptación:
  - **Dado** que que soy cliente, **cuando** llamo al panel del comerciante, **entonces** recibo 403.
  - **Dado** que que no tengo sesión, **cuando** pido mis pedidos, **entonces** recibo 401.

### HU-24 · Protegerme del abuso y de datos maliciosos

**Como** administrador del sistema, **quiero** validar y sanear toda entrada y limitar las solicitudes por IP, **para** evitar spam, XSS e inyecciones.

- Story points: **3** · Prioridad: **Should** · Sprint: **1**
- Criterios de aceptación:
  - **Dado** que que envío texto con <script>, **cuando** guardo un producto, **entonces** las etiquetas se neutralizan.
  - **Dado** que que hago más de 10 intentos de login por minuto, **cuando** sigo intentando, **entonces** recibo 429.

## Resumen de priorización

| Prioridad MoSCoW | Historias | Story points |
|---|---|---|
| Must | 15 | 67 |
| Should | 5 | 19 |
| Could | 4 | 12 |

## Cómo importar a Jira

1. En el proyecto: **⚙ Configuración del espacio → Importar** (o *Configuración de Jira → Sistema → Importación externa → CSV*).
2. Sube `jira-backlog.csv` (codificación UTF-8, delimitador coma).
3. Mapea: `Issue Id` → *Issue Id*, `Issue Type` → *Issue Type*, `Summary`, `Description`, `Priority`, `Story point estimate` → *Story point estimate*, `Parent` → *Parent* (enlaza cada historia a su épica) y `Labels` → *Labels*.
4. Verifica que las 6 épicas y 24 historias aparecen en el backlog. Si tu Jira no acepta `Parent`, usa el campo *Epic Link* para el mismo mapeo.
5. Crea los 4 sprints y arrastra cada historia al sprint indicado en la columna *Sprint* de este documento (también quedó como etiqueta `Sprint-N`).
