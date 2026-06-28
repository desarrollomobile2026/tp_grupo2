# Moniarquía — Hoja de ruta

> Actualizado: Junio 2026.
> Ordenado por prioridad de impacto en el flujo real de negocio.

---

## 🔴 Alta prioridad

### 1. ~~Resolver escaneo QR en iPhone~~ ✅ Completado

**Estado:** Sistema QR completo y funcional — generación, descarga y escaneo operativos.

**Causa raíz resuelta:** El QR solo era accesible desde "Editar producto". La reubicación hacia el inventario (modal desde la card) resolvió el problema. jsQR y la cámara funcionan correctamente.

**Ver:** `docs/MONIARQUIA_QR.md` sección 12 para el detalle completo.

---

### 2. Activar Firebase Authentication real

**Impacto:** Crítico — sin auth real, la app no es segura para producción.
**Esfuerzo estimado:** 4–6 horas.
**Dependencias:** Acceso a Firebase Console para habilitar Email/Password.
**Estado:** Implementación simulada funcional. Código tiene comentarios `// TODO:`.

**Pasos:**
1. Firebase Console → Authentication → Sign-in method → Email/Password → Habilitar
2. Reemplazar `loginSimulado()` → `firebase.auth().signInWithEmailAndPassword()`
3. Reemplazar `registroSimulado()` → `createUserWithEmailAndPassword()` + escritura en `/usuarios`
4. Reemplazar `iniciarApp()` → `firebase.auth().onAuthStateChanged()`
5. Reemplazar `cerrarSesionLocal()` → `firebase.auth().signOut()`
6. Agregar `firebase-auth-compat.js` al `index.html`

---

### 3. Configurar reglas de seguridad en Firestore

**Impacto:** Crítico para producción — actualmente toda la base está abierta.
**Esfuerzo estimado:** 2 horas.
**Dependencias:** Firebase Auth activo (Ítem 2).
**Estado:** Pendiente.

Ver `docs/MONIARQUIA_FIREBASE.md` sección 6 para las reglas recomendadas.

---

## 🟡 Prioridad media

### 4. Conectar gestión de usuarios a Firestore

**Impacto:** Alto — actualmente los usuarios creados en la app no persisten.
**Esfuerzo estimado:** 3–4 horas.
**Dependencias:** Firebase Auth activo (Ítem 2).
**Estado:** Flujo visual completo con datos mock.

**Pasos:**
1. Activar Firebase Auth
2. Reemplazar `usuariosLocales[]` por `db.collection('usuarios').onSnapshot()`
3. Reemplazar `guardarNuevoUsuario()` por `firebase.auth().createUserWithEmailAndPassword()` + escritura en `/usuarios`
4. Actualizar `guardarEdicionUsuario()` para escribir en Firestore
5. Actualizar `ejecutarAccionUsuario()` (activar/desactivar/eliminar) para escribir en Firestore

---

### 5. Recuperación de contraseña funcional

**Impacto:** Medio — los usuarios pierden acceso si olvidan su contraseña.
**Esfuerzo estimado:** 1 hora.
**Dependencias:** Firebase Auth activo (Ítem 2).
**Estado:** Flujo visual completo. Función tiene comentario `// TODO:`.

```js
// TODO en recuperarPasswordSimulado():
firebase.auth().sendPasswordResetEmail(correo)
    .then(() => navegarA('vista-correo-enviado', { silencioso: true }))
    .catch(err => alert(mensajeErrorAuth(err.code)));
```

---

### 6. Paginación de listas

**Impacto:** Medio — a escala, cargar todos los documentos degrada el rendimiento.
**Esfuerzo estimado:** 4–6 horas.
**Dependencias:** Ninguna (mejora incremental).
**Estado:** Todas las listas cargan sin límite actualmente.

Aplicar en: `/productos`, `/clientes`, `/ventas`, `/cuentaCorriente`.

---

## 🟢 Baja prioridad

### 7. Cambio por otro producto en C&D

**Impacto:** Bajo — el caso más común es cambio de talle del mismo producto.
**Esfuerzo estimado:** 4–6 horas.
**Dependencias:** Ninguna.
**Estado:** Solo está implementado el cambio de talle.

**Flujo a implementar:**
```
Cambio o devolución
    ↓ "Cambiar por otro producto"
    ↓ Buscar nuevo producto en inventario
    ↓ Confirmar cambio
    ↓ Calcular diferencia de precio
    ↓ Actualizar stock de ambos productos
```

---

### 8. Notificaciones de stock bajo

**Impacto:** Bajo — mejora la operación del showroom.
**Esfuerzo estimado:** 2–3 horas.
**Dependencias:** Ninguna.
**Estado:** No implementado.

Mostrar alerta visual cuando un talle tiene stock ≤ 2 al actualizar inventario.

---

### 9. Historial de cambios por producto

**Impacto:** Bajo — auditoría de qué se vendió y cuándo.
**Esfuerzo estimado:** 3–4 horas.
**Dependencias:** `/ventas` ya tiene los datos.
**Estado:** No implementado.

---

### 10. Modo offline / PWA completo

**Impacto:** Bajo a medio — permite operar sin conexión.
**Esfuerzo estimado:** Alto (8+ horas).
**Dependencias:** Service Worker, Firestore persistence.
**Estado:** No implementado.

---

### 11. Exportar reporte de ventas

**Impacto:** Medio para el negocio.
**Esfuerzo estimado:** 3–4 horas.
**Dependencias:** Ninguna (leer `/ventas` y formatear).
**Estado:** No implementado.

Posible implementación: generar CSV o tabla HTML imprimible por fecha/período.

---

### 12. Foto de producto desde galería / Storage

**Impacto:** Bajo — las imágenes por URL manual funcionan.
**Esfuerzo estimado:** 4–6 horas.
**Dependencias:** Firebase Storage activado y configurado.
**Estado:** Intentado y revertido (problemas de permisos en Storage). Ver historial.

**Nota:** Si se reimplementa, usar `ref.put(archivo).then(() => ref.getDownloadURL())` con manejo de errores robusto y timeout.

---

## Resumen visual

```
🔴 CRÍTICO
├── ~~Escaneo QR en iPhone~~ ✅
├── Firebase Auth real
└── Reglas Firestore

🟡 MEDIO PLAZO
├── Gestión usuarios → Firestore
├── Recuperación de contraseña
└── Paginación de listas

🟢 MEJORAS FUTURAS
├── Cambio por otro producto
├── Stock bajo → alertas
├── Historial por producto
├── Offline / PWA
└── Exportar reportes
```

---

*Roadmap — Junio 2026.*
