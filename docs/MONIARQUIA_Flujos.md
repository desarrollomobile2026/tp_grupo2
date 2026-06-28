# Moniarquía — Flujos y navegación entre pantallas

> Versión: 2.0 — Actualizado: Junio 2026.
> Incluye todos los flujos implementados en la app actual (52 vistas, rama `oscar`).

---

## 1. Flujo de acceso

| Origen                 | Acción                   | Destino                |
| ---------------------- | ------------------------ | ---------------------- |
| Inicio / Splash        | Iniciar sesión           | Iniciar sesión         |
| Inicio / Splash        | Registrarse              | Registrarse            |
| Registrarse            | Registrarme              | Perfil creado          |
| Perfil creado          | Iniciar sesión           | Iniciar sesión         |
| Iniciar sesión         | Ingresar                 | Página de inicio       |
| Iniciar sesión         | Recuperar contraseña     | Recuperar contraseña   |
| Recuperar contraseña   | Enviar correo            | Correo enviado         |
| Correo enviado         | Ir a crear contraseña    | Crear nueva contraseña |
| Crear nueva contraseña | Guardar nueva contraseña | Contraseña actualizada |
| Contraseña actualizada | Iniciar sesión           | Iniciar sesión         |

---

## 2. Flujo principal desde Inicio

| Origen                 | Acción                       | Destino                |
| ---------------------- | ---------------------------- | ---------------------- |
| Página de inicio       | Iniciar venta                | Escanear producto      |
| Página de inicio       | Consultar stock / Inventario | Inventario             |
| Menú hamburguesa       | Inicio                       | Página de inicio       |
| Menú hamburguesa       | Inventario                   | Inventario             |
| Menú hamburguesa       | Clientes                     | Lista de clientes      |
| Menú hamburguesa       | Cambios y devoluciones       | Cambios y devoluciones |
| Menú hamburguesa       | Configuración                | Configuración          |
| Menú hamburguesa       | Cerrar sesión                | Modal confirmar cierre |
| Modal confirmar cierre | Confirmar                    | Sesión cerrada         |
| Sesión cerrada         | Iniciar sesión               | Iniciar sesión         |

---

## 3. Flujo de venta

| Origen                             | Acción             | Destino                             |
| ---------------------------------- | ------------------ | ----------------------------------- |
| Página de inicio                   | Iniciar venta      | Escanear producto                   |
| Escanear producto                  | Escaneo exitoso    | Producto escaneado                  |
| Producto escaneado                 | Agregar al carrito | Carrito                             |
| Producto escaneado                 | Escanear otro      | Escanear producto                   |
| Carrito                            | Escanear otro      | Escanear producto                   |
| Carrito                            | Editar producto    | Editar producto del carrito         |
| Editar producto del carrito        | Guardar cambios    | Carrito                             |
| Carrito                            | Eliminar producto  | Confirmar eliminación del producto  |
| Confirmar eliminación del producto | Cancelar           | Carrito                             |
| Confirmar eliminación del producto | Eliminar           | Carrito actualizado / Carrito vacío |
| Carrito                            | Siguiente          | Confirmar compra                    |
| Confirmar compra                   | Confirmar compra   | ¿Desea asociar cliente?             |

---

## 4. Flujo de asociación de cliente en venta

| Origen                  | Acción                        | Destino             |
| ----------------------- | ----------------------------- | ------------------- |
| ¿Desea asociar cliente? | Sí                            | Seleccionar cliente |
| ¿Desea asociar cliente? | No                            | Método de pago      |
| Seleccionar cliente     | Seleccionar cliente existente | Método de pago      |
| Seleccionar cliente     | Registrar nuevo cliente       | Agregar cliente     |
| Agregar cliente         | Agregar                       | Cliente agregado    |
| Cliente agregado        | Continuar                     | Método de pago      |
| Método de pago          | Cambiar cliente               | Seleccionar cliente |

---

## 5. Flujo de pago en efectivo

| Origen           | Acción         | Destino           |
| ---------------- | -------------- | ----------------- |
| Método de pago   | Efectivo       | Pago en efectivo  |
| Pago en efectivo | Confirmar pago | Pago registrado   |
| Pago registrado  | Nueva venta    | Escanear producto |
| Pago registrado  | Ir al inicio   | Página de inicio  |

---

## 6. Flujo de pago con Mercado Pago

Moniarquía no procesa el pago dentro de la app. La transacción se realiza por fuera, mediante Mercado Pago. La app solo registra que el pago fue recibido.

| Origen                      | Acción                  | Destino                           |
| --------------------------- | ----------------------- | --------------------------------- |
| Método de pago              | Mercado Pago            | Registrar pago Mercado Pago       |
| Registrar pago Mercado Pago | Confirmar pago recibido | Pago registrado                   |
| Registrar pago Mercado Pago | Cancelar venta          | Método de pago / Confirmar compra |
| Pago registrado             | Nueva venta             | Escanear producto                 |
| Pago registrado             | Ir al inicio            | Página de inicio                  |

---

## 7. Flujo de cuenta corriente en venta

Este flujo se usa cuando el cliente se lleva el producto sin pagar o realiza un pago parcial. El saldo restante se suma a su deuda total.

| Origen                         | Acción                 | Destino                           |
| ------------------------------ | ---------------------- | --------------------------------- |
| Método de pago                 | Cuenta corriente       | Registrar deuda de venta          |
| Registrar deuda de venta       | Ingresar monto abonado | Registrar deuda de venta          |
| Registrar deuda de venta       | Registrar deuda        | Deuda registrada correctamente    |
| Registrar deuda de venta       | Cancelar venta         | Método de pago / Confirmar compra |
| Deuda registrada correctamente | Finalizar venta        | Página de inicio                  |
| Deuda registrada correctamente | Nueva venta            | Escanear producto                 |

**Reglas:**
- Si abona $0 → toda la compra se suma a la deuda.
- Si abona una parte → solo el saldo restante se suma a la deuda.
- Si abona el total → usar efectivo o Mercado Pago, no cuenta corriente.

---

## 8. Flujo de clientes y cuenta corriente

| Origen                      | Acción                   | Destino                             |
| --------------------------- | ------------------------ | ----------------------------------- |
| Menú hamburguesa            | Clientes                 | Lista de clientes                   |
| Lista de clientes           | Seleccionar cliente      | Detalle de cliente                  |
| Detalle de cliente          | Ver historial de compras | Historial de compras                |
| Historial de compras        | Volver                   | Detalle de cliente                  |
| Detalle de cliente          | Registrar pago           | Registrar pago                      |
| Registrar pago              | Confirmar pago completo  | Pago registrado / Saldo actualizado |
| Detalle de cliente          | Registrar pago parcial   | Registrar pago parcial              |
| Registrar pago parcial      | Confirmar pago parcial   | Saldo pendiente actualizado         |
| Saldo pendiente actualizado | Volver al cliente        | Detalle de cliente                  |
| Saldo pendiente actualizado | Ir al inicio             | Página de inicio                    |

---

## 9. Flujo de inventario

| Origen                           | Acción                 | Destino                         |
| -------------------------------- | ---------------------- | ------------------------------- |
| Página de inicio / Menú          | Inventario             | Inventario                      |
| Inventario                       | Buscar producto        | Resultado de búsqueda           |
| Resultado de búsqueda            | Seleccionar producto   | Detalle de producto             |
| Inventario                       | Botón agregar producto | Agregar producto                |
| Agregar producto                 | Guardar producto       | Producto agregado correctamente |
| Producto agregado correctamente  | Volver al inventario   | Inventario                      |
| Detalle de producto / Inventario | Editar producto        | Editar producto                 |
| Editar producto                  | Guardar cambios        | Producto actualizado            |
| Producto actualizado             | Volver al inventario   | Inventario                      |
| Producto actualizado             | Ir al inicio           | Página de inicio                |
| Editar producto                  | Eliminar producto      | Eliminar producto               |
| Eliminar producto                | Cancelar               | Editar producto                 |
| Eliminar producto                | Sí, eliminar producto  | Producto eliminado              |
| Producto eliminado               | Volver al inventario   | Inventario                      |
| Producto eliminado               | Ir al inicio           | Página de inicio                |

---

## 10. Flujo de configuración y usuarios

| Origen                           | Acción                  | Destino                          |
| -------------------------------- | ----------------------- | -------------------------------- |
| Menú hamburguesa                 | Configuración           | Configuración                    |
| Configuración                    | Gestión de usuarios     | Lista de usuarios                |
| Lista de usuarios                | Crear usuario           | Crear usuario                    |
| Crear usuario                    | Guardar usuario         | Usuario creado                   |
| Usuario creado                   | Volver a usuarios       | Lista de usuarios                |
| Lista de usuarios                | Editar usuario          | Editar usuario                   |
| Editar usuario                   | Guardar cambios         | Lista de usuarios                |
| Lista de usuarios                | Cambiar rol             | Cambiar rol                      |
| Cambiar rol                      | Confirmar cambio de rol | Lista de usuarios                |
| Lista de usuarios                | Activar usuario         | Activar usuario                  |
| Activar usuario                  | Confirmar               | Lista de usuarios                |
| Lista de usuarios                | Desactivar usuario      | Desactivar usuario               |
| Desactivar usuario               | Confirmar               | Lista de usuarios                |
| Lista de usuarios                | Eliminar usuario        | Confirmar eliminación de usuario |
| Confirmar eliminación de usuario | Cancelar                | Lista de usuarios                |
| Confirmar eliminación de usuario | Eliminar usuario        | Lista de usuarios                |

---

## 11. Flujo de cambios y devoluciones

El acceso principal vive en el menú hamburguesa porque es una acción secundaria y menos frecuente que vender, consultar stock o gestionar clientes.

| Origen                        | Acción                           | Destino                       |
| ----------------------------- | -------------------------------- | ----------------------------- |
| Menú hamburguesa              | Cambios y devoluciones           | Cambios y devoluciones        |
| Cambios y devoluciones        | Buscar ticket / cliente / código | Seleccionar producto de venta |
| Cambios y devoluciones        | Seleccionar venta reciente       | Seleccionar producto de venta |
| Seleccionar producto de venta | Seleccionar prenda comprada      | Cambio o devolución           |
| Cambio o devolución           | Cambiar por otro talle           | Seleccionar nuevo talle       |
| Cambio o devolución           | Cambiar por otro producto        | Buscar nuevo producto         |
| Seleccionar nuevo talle       | Confirmar cambio                 | Confirmar cambio              |
| Buscar nuevo producto         | Seleccionar producto             | Confirmar cambio              |
| Confirmar cambio              | Confirmar cambio                 | Cambio realizado              |
| Cambio realizado              | Volver al inicio                 | Página de inicio              |
| Cambio realizado              | Ver detalle de venta             | Detalle de venta              |

---

## 12. Caso específico: cambio por otro talle

**Caso:** Sofía Almada trae una campera frisada color terracota talle M y desea cambiarla por la misma campera en otro talle.

| Origen                        | Acción                      | Destino                       |
| ----------------------------- | --------------------------- | ----------------------------- |
| Cambios y devoluciones        | Buscar ticket #000124       | Seleccionar producto de venta |
| Seleccionar producto de venta | Seleccionar Campera frisada | Cambio o devolución           |
| Cambio o devolución           | Cambiar por otro talle      | Seleccionar nuevo talle       |
| Seleccionar nuevo talle       | Elegir talle L              | Confirmar cambio              |
| Confirmar cambio              | Confirmar cambio            | Cambio realizado              |
| Cambio realizado              | Volver al inicio            | Página de inicio              |

**Reglas:**
- Si el producto es el mismo y solo cambia el talle, el monto suele ser el mismo → diferencia $0.
- El stock debe actualizarse: vuelve el talle devuelto y sale el nuevo talle.

---

## 13. Caso alternativo: cambio por otro producto

| Origen                | Acción                        | Destino               |
| --------------------- | ----------------------------- | --------------------- |
| Cambio o devolución   | Cambiar por otro producto     | Buscar nuevo producto |
| Buscar nuevo producto | Seleccionar producto distinto | Confirmar cambio      |
| Confirmar cambio      | Confirmar cambio              | Cambio realizado      |

**Reglas:**
- Si el nuevo producto cuesta más → el cliente paga la diferencia.
- Si el nuevo producto cuesta menos → queda diferencia a favor del cliente.
- Si ambos cuestan lo mismo → diferencia $0.

---

## 14. Pantallas de estado y confirmación

| Situación              | Pantalla                        |
| ---------------------- | ------------------------------- |
| Usuario registrado     | Perfil creado                   |
| Contraseña actualizada | Contraseña actualizada          |
| Cliente agregado       | Cliente agregado                |
| Pago recibido          | Pago registrado                 |
| Deuda generada         | Deuda registrada correctamente  |
| Producto agregado      | Producto agregado correctamente |
| Producto actualizado   | Producto actualizado            |
| Producto eliminado     | Producto eliminado              |
| Cambio finalizado      | Cambio realizado                |
| Sesión cerrada         | Sesión cerrada                  |

---

## 15. Reglas generales de navegación

- Toda pantalla debe tener opción de volver.
- Las acciones principales usan botón primario rosa (`#FF6677`).
- Las acciones secundarias usan botón outline.
- Las acciones destructivas deben tener confirmación previa.
- No eliminar datos sin pantalla de confirmación.
- Los flujos de venta deben terminar en Inicio o Nueva venta.
- Los flujos de inventario deben terminar en Inventario o Inicio.
- Los flujos de clientes deben volver a Detalle de cliente o Inicio.
- Los flujos de cambios y devoluciones terminan en Cambio realizado → Inicio.
- Mercado Pago no se integra dentro de la app: solo se registra el pago confirmado externamente.
- Cuenta corriente registra deuda o pago parcial, no procesa pagos externos.

---

## 16. Pantallas principales a desarrollar

### Acceso
- Inicio / Splash
- Iniciar sesión
- Registrarse
- Perfil creado
- Recuperar contraseña
- Correo enviado
- Crear nueva contraseña
- Contraseña actualizada

### Home
- Página de inicio
- Menú hamburguesa

### Venta
- Escanear producto
- Producto escaneado
- Carrito
- Confirmar compra
- ¿Desea asociar cliente?
- Seleccionar cliente
- Método de pago
- Pago en efectivo
- Registrar pago Mercado Pago
- Pago registrado
- Registrar deuda de venta
- Deuda registrada correctamente

### Clientes
- Lista de clientes
- Detalle de cliente
- Historial de compras
- Registrar pago
- Registrar pago parcial
- Saldo pendiente actualizado

### Inventario
- Inventario
- Resultado de búsqueda
- Detalle de producto
- Agregar producto
- Producto agregado correctamente
- Editar producto
- Producto actualizado
- Eliminar producto
- Producto eliminado

### Configuración
- Configuración
- Lista de usuarios
- Crear usuario
- Usuario creado
- Editar usuario
- Cambiar rol
- Activar usuario
- Desactivar usuario
- Confirmar eliminación de usuario

### Cambios y devoluciones
- Cambios y devoluciones
- Seleccionar producto de venta
- Cambio o devolución
- Seleccionar nuevo talle
- Buscar nuevo producto
- Confirmar cambio
- Cambio realizado

---

## 17. Flujo QR — Generar y descargar etiqueta

**Estado:** ✅ Implementado

**Objetivo:** Crear y descargar la etiqueta QR de un producto para pegar en la prenda física.

```
Inventario
↓ Tocar ícono editar (admin)
↓ Formulario de edición del producto
↓ Sección "Código QR del producto" (visible al editar)
↓ Canvas con el QR generado por QRious
↓ Texto: MONIARQUIA_PRODUCTO_<idFirestore>
↓ Botón "Descargar QR"
↓ Descarga PNG 300px — archivo: qr-<nombre>.png
```

**Datos involucrados:**
- `codigoQR` guardado en `/productos/{id}.codigoQR`
- Se genera automáticamente al crear el producto (usando el ID de Firestore)
- Al editar: si no tiene `codigoQR`, se genera con su ID actual

**Funciones:** `renderizarQRProducto(codigoQR)`, `descargarQRProducto(codigoQR, nombre)`, `guardarProducto(e)`

---

## 18. Flujo QR — Escanear y abrir producto

**Estado:** ⚠️ Implementado, no funcional en iPhone (ver `docs/MONIARQUIA_QR.md`)

**Objetivo:** Escanear el QR de una prenda para abrir directamente su pantalla de selección.

```
Home → "Iniciar venta"        ← abrirEscaneo()
  O
Carrito → "Escanear otro"     ← abrirEscaneo('carrito')
↓
#vista-escanear
  - Video de cámara
  - Panel de estado (CAM / LOOP / FRAMES / QR / DB / ERR)
  - Botón: Reintentar escaneo
  - Botón: Buscar manualmente
  - Botón: Volver al carrito (solo desde carrito)
↓ jsQR detecta: MONIARQUIA_PRODUCTO_<id>
↓ procesarCodigoQR(texto)
↓ Buscar en listaPrendasGlobal (memoria)
  → Si existe: abrirProducto(id)
  → Si no: buscar en Firestore → abrirProducto(id)
↓ #vista-producto (seleccionar color, talle, cantidad)
↓ Agregar al carrito
↓ #vista-carrito-venta
```

**Funciones:** `abrirEscaneo(origen)`, `iniciarCamara()`, `iniciarEscaneoLoop()`, `procesarCodigoQR(texto)`, `reintentarEscaneo()`, `buscarManualmente()`, `volverAlCarritoDesdeEscaneo()`

---

## 19. Flujo de Configuración

**Estado:** ✅ Implementado

```
Menú hamburguesa → Configuración
↓
#vista-configuracion
  ├── Mi perfil → #vista-mi-perfil
  │     └── Editar perfil → #vista-editar-perfil → éxito
  ├── Gestión de usuarios → #vista-gestion-usuarios
  │     ├── Crear usuario → #vista-crear-usuario → éxito
  │     ├── Editar usuario → #vista-editar-usuario → éxito
  │     ├── Cambiar rol → #vista-cambiar-rol → éxito
  │     ├── Confirmar activar/desactivar/eliminar → #vista-confirmar-usuario → éxito
  │     └── #vista-exito-usuario
  ├── Gestión de clientes → #vista-clientes (módulo existente)
  ├── Cambiar contraseña → #vista-cambiar-password → éxito
  └── Cerrar sesión → Limpia sesión → #vista-splash
```

**Restricciones por rol:**
- "Gestión de usuarios" oculto para empleados (CSS `.solo-admin` + `irAGestionUsuarios()` con check)

---

## 20. Flujo de Gestión de usuarios

**Estado:** ⚠️ Visual completo, datos en memoria (no Firestore)

```
Configuración → Gestión de usuarios
↓
Lista de usuarios (con badges: rol + estado)
  Acciones por usuario: editar / cambiar rol / activar-desactivar / eliminar
↓ Crear usuario
  ↓ Formulario: nombre, correo, rol
  ↓ Guardar → agrega a usuariosLocales[] (no Firestore aún)
  ↓ Éxito
↓ Editar usuario
  ↓ Formulario precargado
  ↓ Guardar → actualiza usuariosLocales[]
  ↓ Éxito
↓ Cambiar rol
  ↓ Selector de rol
  ↓ Confirmar → actualiza usuariosLocales[]
  ↓ Éxito
↓ Activar/Desactivar/Eliminar
  ↓ Pantalla de confirmación dinámica
  ↓ Confirmar → actualiza usuariosLocales[]
  ↓ Éxito
```

**TODO:** Reemplazar `usuariosLocales[]` por `db.collection('usuarios')` cuando Firebase Auth esté activo.

---

## 21. Flujo Mi perfil

**Estado:** ⚠️ Visual completo, datos en `usuarioActual` (no Firebase Auth)

```
Configuración → Mi perfil
↓
#vista-mi-perfil
  - Avatar con inicial
  - Nombre, correo, rol, estado
  - Botón "Editar perfil" (al fondo, thumb zone)
↓ Editar perfil
  ↓ Formulario: nombre, correo
  ↓ Guardar → actualiza usuarioActual + avatar del Home
  ↓ Éxito → "Volver a Mi perfil" | "Ir a Configuración"
```

---

## 22. Flujo de autenticación (simulado)

**Estado:** ⚠️ Funcional con datos mock, no conectado a Firebase Auth

```
Splash
  ├── Iniciar sesión
  │     ↓ Email + contraseña
  │     ↓ Validar contra USUARIOS_MOCK
  │     ↓ OK → guardar en localStorage → Home
  │     ↓ Error → "Usuario o contraseña incorrectos"
  └── Registrarse
        ↓ Nombre + email + contraseña × 2
        ↓ Validar campos + longitud
        ↓ OK → Perfil creado (solo visual)
        ↓ Botones: Iniciar sesión | Volver al inicio

Recuperar contraseña
  ↓ Email
  ↓ OK → Correo enviado (solo visual)
  ↓ Crear nueva contraseña → Contraseña actualizada (solo visual)

Cerrar sesión
  ↓ Limpia carritoVenta, clienteSeleccionado, historialNavegación
  ↓ Borra localStorage (moniarquia_session)
  ↓ Navega al Splash
```

---

## Mapa de vistas completo (52 vistas)

### Autenticación
`vista-splash` → `vista-login` → `vista-registro` → `vista-perfil-creado`
`vista-recuperar-password` → `vista-correo-enviado` → `vista-nueva-password` → `vista-password-actualizada`

### Principal
`vista-home`

### Inventario
`vista-inventario` → `vista-form-producto` → `vista-confirmar-eliminar`
`vista-gestionar-stock` (empleados)

### Flujo de venta
`vista-escanear` → `vista-seleccionar-producto` → `vista-producto`
`vista-carrito-venta` → `vista-asociar-cliente` → `vista-seleccionar-cliente`
`vista-agregar-cliente` → `vista-cliente-agregado`
`vista-metodo-pago` → `vista-confirmar-pago` | `vista-registrar-deuda`
`vista-pago-registrado` | `vista-deuda-registrada`

### Clientes
`vista-clientes` → `vista-editar-cliente` → `vista-confirmar-eliminar-cliente`
`vista-detalle-cliente` → `vista-historial-cliente` | `vista-historial-compras`
`vista-registrar-pago` → `vista-pago-cliente-ok`

### Cambios y devoluciones
`vista-cambios` → `vista-items-venta` → `vista-seleccionar-talle` → `vista-confirmar-cambio` → `vista-cambio-realizado`

### Configuración
`vista-configuracion`
`vista-mi-perfil` → `vista-editar-perfil` → `vista-exito-perfil`
`vista-cambiar-password` → `vista-exito-password`
`vista-gestion-usuarios` → `vista-crear-usuario` | `vista-editar-usuario` | `vista-cambiar-rol` | `vista-confirmar-usuario` → `vista-exito-usuario`

### Legacy (en DOM, sin acceso visual)
`vista-carrito` (código base original)

---

*Flujos — Junio 2026.*
