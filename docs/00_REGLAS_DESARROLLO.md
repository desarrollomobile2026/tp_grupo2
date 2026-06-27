# Moniarquía — Reglas de Desarrollo

> Referencia permanente de metodología de trabajo para este proyecto.
> Aplicar en toda sesión de desarrollo, sin excepción.

---

## 1. Objetivo general del proyecto

Adaptar el proyecto web existente para que represente a **Moniarquía**, una aplicación móvil para la gestión de un local de indumentaria (showroom de ropa).

La adaptación debe mantener coherencia visual con el prototipo de Figma y permitir operar las funcionalidades principales con Firebase (Firestore + Auth).

El proyecto es un TP integrador de la materia **Desarrollos para Dispositivos Móviles** — UNPAZ, Comisión C1, 2026.

---

## 2. Documentación de referencia

Consultar siempre antes de modificar código:

| Archivo | Contenido |
|---|---|
| `docs/MONIARQUIA.md` | Documento maestro: design system, paleta, tipografía, componentes, modelo de datos, pantallas |
| `docs/MONIARQUIA_Flujos.md` | Flujos de navegación entre pantallas (15 flujos, 53+ pantallas) |
| `docs/referencias-ui/*.png` | Capturas del prototipo Figma como referencia visual por pantalla |
| `docs/images/*` | Logo oficial y productos de ejemplo (Buzo, Campera frizada, Remeras) |

---

## 3. Rama de trabajo

Todo el desarrollo se realizará sobre la rama:

`oscar`

Reglas:
- No crear nuevas ramas.
- No modificar `main`.
- Todo cambio debe realizarse y probarse en `oscar`.

---

## 4. Metodología de trabajo por etapas

Trabajo incremental y verificable. Cada etapa representa un módulo o funcionalidad completa y funcional.

No hacer:
- Mini desarrollos demasiado pequeños
- Desarrollar toda la aplicación de una sola vez
- Refactors masivos sin necesidad
- Reescribir archivos completos cuando alcanza con editar

---

## 5. Etapas del plan de implementación

| Etapa | Módulo | Estado |
|---|---|---|
| 1 | Home + navegación | ✅ Completo — historial de navegación incluido |
| 2 | Inventario | ✅ Completo — talles dinámicos por categoría (S/M/L/XL vs 36–44) |
| 3 | Flujo de venta | ✅ Completo — cámara simulada, carrito, pagos conectados a Firestore |
| 4 | Clientes y ventas | ✅ Completo — Efectivo, Mercado Pago, Cuenta corriente con stock |
| 5 | Cuenta corriente | ✅ Completo — detalle de cliente, movimientos, pagos parciales |
| 6 | Cambios y devoluciones | ✅ Parcial — solo cambio de talle; cambio por otro producto pendiente |
| 7 | Autenticación | ❌ Revertido — implementado pero desactivado por falta de Firebase Auth habilitado |

### Próximos módulos

| Módulo | Prioridad |
|---|---|
| Autenticación (splash, login, registro) | Alta — pilar del TP |
| Diagramas UML (actividad + secuencia, 3+ CU) | Alta — pilar del TP |
| Prototipo Figma (coherencia visual) | Alta — pilar del TP |
| Configuración de usuarios | Baja |

---

## 6. Reglas antes de modificar código

Para cada etapa presentar únicamente:

1. **Qué archivos se van a modificar**
2. **Resumen breve de los cambios**
3. **Riesgos potenciales**

Luego **esperar confirmación** antes de escribir cualquier línea de código.

---

## 7. Reglas durante el desarrollo

- Mantener el proyecto siempre funcional entre cambios.
- Mantener Firebase (Firestore) funcionando en todo momento.
- No romper las conexiones existentes con Firestore.
- Reutilizar componentes y estilos existentes siempre que sea posible.
- Respetar el Design System definido en `docs/MONIARQUIA.md`.
- Respetar las capturas de referencia en `docs/referencias-ui/`.
- Implementar únicamente la etapa actual aprobada.
- No avanzar a la siguiente etapa sin aprobación explícita.

### Design System a respetar

| Token | Valor | Uso |
|---|---|---|
| `--rojo-moniarquia` | `#FF6677` | Botón primario, precios, activos |
| `--rosa-base` | `#FFDFDF` | Fondo de app, cards |
| `--rosa-viejo` | `#FF8C98` | Acciones secundarias |
| `--verde-ok` | `#41EC58` | Confirmaciones de éxito |
| `--negro-pleno` | `#000000` | Bordes, íconos |
| `--gris` | `#5A5A5A` | Textos secundarios, placeholders |
| `--blanco` | `#FFFFFF` | Fondos de cards, nav |
| Fuente principal | `Inter` | Toda la interfaz |
| Fuente logo | `Mr Dafoe` | Solo el logotipo |
| Íconos | `Lucide Icons` | Toda la iconografía |

---

## 8. Entregables al finalizar cada etapa

Informar únicamente:

- Archivos modificados
- Funcionalidades agregadas
- Pruebas manuales recomendadas
- Próximos pasos sugeridos

No generar documentación extensa ni informes innecesarios.

---

## 9. Regla de detención ante cambios riesgosos

Si una implementación puede romper funcionalidades existentes:

1. **Detener el desarrollo**
2. **Describir el riesgo detectado**
3. **Proponer una alternativa** antes de modificar el código
4. **Esperar confirmación** del usuario

Esta regla tiene prioridad sobre cualquier otra instrucción de avance.

---

*Documento creado: Junio 2026. Aplicar en toda sesión de este proyecto.*
