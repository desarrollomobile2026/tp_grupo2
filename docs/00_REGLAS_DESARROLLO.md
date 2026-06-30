# Moniarquía — Reglas de Desarrollo

> Referencia permanente de metodología de trabajo.
> Aplicar en toda sesión de desarrollo, sin excepción.

---

## 1. Objetivo del proyecto

**Moniarquía** es una PWA de gestión operativa para un showroom de ropa — TP integrador de Desarrollos para Dispositivos Móviles, UNPAZ, Comisión C1, 2026.

Para el estado actual del proyecto, módulos implementados y próximas etapas, consultar `docs/MONIARQUIA.md`.

---

## 2. Rama de trabajo

Siempre sobre la rama:

```
oscar
```

- No crear nuevas ramas.
- No modificar `main`.
- Todo cambio se desarrolla y prueba en `oscar`.

---

## 3. Antes de modificar código

Para cada cambio presentar:

1. **Archivos a modificar**
2. **Resumen breve de los cambios**
3. **Riesgos potenciales**

Luego **esperar confirmación** antes de escribir cualquier línea de código.

---

## 4. Durante el desarrollo

- Mantener el proyecto siempre funcional entre cambios.
- Mantener Firebase (Firestore) activo — no desconectar los `onSnapshot` sin reemplazarlos.
- Reutilizar componentes y estilos existentes antes de crear nuevos.
- Respetar el Design System: consultar `docs/MONIARQUIA_DESIGN_SYSTEM.md`.
- Implementar únicamente lo aprobado en la sesión actual.
- Trabajar por iteraciones pequeñas: un módulo completo antes de pasar al siguiente.

---

## 5. Documentación de referencia

| Archivo | Consultar cuando... |
|---|---|
| `docs/MONIARQUIA.md` | Iniciás una nueva sesión — estado completo del proyecto |
| `docs/MONIARQUIA_FIREBASE.md` | Tocás colecciones, campos o reglas de Firestore |
| `docs/MONIARQUIA_Flujos.md` | Implementás un flujo nuevo o modificás navegación |
| `docs/MONIARQUIA_DESIGN_SYSTEM.md` | Creás nuevas pantallas o componentes |
| `docs/MONIARQUIA_ROADMAP.md` | Decidís qué implementar a continuación |

---

## 6. Entregables al finalizar cada etapa

Informar:
- Archivos modificados
- Funcionalidades agregadas
- Pruebas manuales recomendadas

No generar documentación extensa ni informes innecesarios.

---

## 7. Regla de detención ante cambios riesgosos

Si una implementación puede romper funcionalidades existentes:

1. Detener el desarrollo.
2. Describir el riesgo.
3. Proponer una alternativa.
4. Esperar confirmación.

Esta regla tiene prioridad sobre cualquier otra instrucción de avance.

---

*Actualizado: Julio 2026.*
