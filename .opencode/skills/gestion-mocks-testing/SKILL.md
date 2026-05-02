---
name: gestion-mocks-testing
description: Facilita la creación, gestión y auditoría de mocks para dependencias y entornos en tests unitarios. Recomienda qué y cómo mockear, y cómo integrar mocks (__mocks__, librerías, etc.) en la fase de testing.
license: MIT
compatibility: opencode
---
# Gestión de Mocks en Testing

## Propósito
Aporta instrucciones y buenas prácticas para crear, mantener y auditar mocks de dependencias y entornos en pruebas unitarias. Ayuda a decidir qué debe ser mockeado y cómo integrarlo correctamente en el flujo de testing.

## Cuándo usarlo
- Al escribir o actualizar tests unitarios que dependen de servicios externos, módulos complejos o APIs.
- Cuando se requiere aislar el código bajo prueba de su entorno real.
- Para auditar la cobertura y pertinencia de los mocks existentes.

## Alcance
- Cubre la creación de archivos `__mocks__`, uso de librerías de mocking (como jest, sinon, etc.) y recomendaciones de integración.
- No cubre la implementación de dobles de prueba para integración/end-to-end ni la configuración avanzada de entornos de CI.

## Patrón principal
```js
// Ejemplo con Jest
// __mocks__/miDependencia.js
module.exports = {
  funcionMock: jest.fn(() => 'valor simulado'),
};

// En el test
jest.mock('../miDependencia');
const { funcionMock } = require('../miDependencia');
```

## Restricciones/cláusulas
- No mockear funciones puras o lógica interna simple.
- Evitar mocks innecesarios que compliquen el mantenimiento.
- Mantener los mocks sincronizados con la API real de las dependencias.
