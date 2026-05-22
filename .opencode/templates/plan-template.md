# Plan de implementación

## Control del plan
- Estado: {{status}}
- Fecha: {{date}}
- Versión: {{version}}
- Owner: {{owner}}

## Contexto
- Proyecto: {{project}}
- Módulo/componente: {{scope}}
- Objetivo: {{objective}}
- Resumen del contexto: {{context_summary}}

## Alcance
- Dentro del alcance: {{in_scope}}
- Fuera del alcance: {{out_of_scope}}
- Restricciones: {{constraints}}

## Criterios de éxito
- {{success_criteria_1}}
- {{success_criteria_2}}

## Definición de listo
- {{definition_of_ready_1}}
- {{definition_of_ready_2}}

## Definición de hecho
- {{definition_of_done_1}}
- {{definition_of_done_2}}

## Supuestos
- {{assumption_1}}
- {{assumption_2}}

## Dependencias
- Bloqueos previos: {{prerequisites}}
- Dependencias internas/externas: {{dependencies}}
- Riesgo de cambio: {{change_risk}}

## Handoff
- Entrada requerida: {{handoff_input}}
- Salida esperada: {{handoff_output}}
- Agente responsable: {{handoff_owner}}

## Orden de análisis
1. Base de datos
2. Backend
3. Frontend
4. CI/CD

## Base de datos
- Motor: {{db_engine}}
- Impacto: {{db_impact}}
- Cambios requeridos: {{db_changes}}
- Script/migración:
```sql
{{db_script}}
```
- Validación previa: {{db_validation}}
- Rollback: {{db_rollback}}

## Backend
- Tecnologías/arquitectura: {{backend_stack}}
- Áreas afectadas: {{backend_scope}}
- Cambios requeridos: {{backend_changes}}
- Tareas atómicas:
{{backend_tasks}}
- Criterios de aceptación: {{backend_acceptance}}

## Integración backend/frontend
- Puntos de integración: {{integration_points}}
- Contratos/APIs afectados: {{contracts}}
- Compatibilidad hacia atrás: {{backward_compatibility}}

## Frontend
- Tecnologías/arquitectura: {{frontend_stack}}
- Áreas afectadas: {{frontend_scope}}
- Cambios requeridos: {{frontend_changes}}
- Tareas atómicas:
{{frontend_tasks}}
- Criterios de aceptación: {{frontend_acceptance}}

## CI/CD
- Flujos/reglas: {{cicd_rules}}
- Impacto: {{cicd_impact}}
- Cambios requeridos: {{cicd_changes}}
- Tareas atómicas:
{{cicd_tasks}}

## Pruebas
- Estrategia: {{test_strategy}}
- Casos críticos: {{critical_tests}}
- Validación manual: {{manual_validation}}
- Automatización: {{automation}}

## Despliegue y rollback
- Plan de despliegue: {{deployment_plan}}
- Ventana/orden de release: {{release_order}}
- Rollback: {{rollback_plan}}
- Señales de verificación post-deploy: {{post_deploy_checks}}

## Arquitectura / diagramas
{{diagrams}}

## Plan de ejecución
{{execution_plan}}

## Secuencia de trabajo
{{work_sequence}}

## Priorización
- Prioridad general: {{priority}}
- Urgencia: {{urgency}}
- Estimación: {{effort_estimate}}

## Responsables / subagentes
- {{subagent_1}}
- {{subagent_2}}
- {{subagent_3}}

## Riesgos y bloqueos
{{risks}}

## Validaciones
{{validations}}

## Estado por bloque
- Base de datos: {{db_status}}
- Backend: {{backend_status}}
- Frontend: {{frontend_status}}
- CI/CD: {{cicd_status}}

## Observabilidad
- Métricas/señales: {{metrics}}
- Logs/eventos a revisar: {{logs}}
- Alertas esperadas: {{alerts}}

## Preguntas pendientes
{{pending_questions}}

## Checklist de ejecución
- [ ] Contexto validado
- [ ] Dependencias revisadas
- [ ] Scripts/listos para aplicar
- [ ] Pruebas definidas
- [ ] Despliegue aprobado
- [ ] Rollback preparado

## Entregables
- {{deliverable_1}}
- {{deliverable_2}}

_Completar con la salida generada por `plan-builder` antes de ejecutar el plan._
