Guía de Uso: Development Workflow Skill                                                                                             
                                                                                                                                      
  Comandos Principales                                                                                                                
  ┌──────────────────────┬───────────────────────────────────────┐                                                                    
  │       Comando        │             Cuándo Usarlo             │                                                                    
  ├──────────────────────┼───────────────────────────────────────┤                                                                    
  │ start task B0.1      │ Comenzar una tarea específica         │                                                                    
  ├──────────────────────┼───────────────────────────────────────┤                                                                    
  │ next task            │ Comenzar la siguiente tarea pendiente │                                                                    
  ├──────────────────────┼───────────────────────────────────────┤                                                                    
  │ pause task           │ Pausar el trabajo actual              │                                                                    
  ├──────────────────────┼───────────────────────────────────────┤                                                                    
  │ resume task          │ Continuar tarea pausada               │                                                                    
  ├──────────────────────┼───────────────────────────────────────┤                                                                    
  │ workflow status      │ Ver estado actual                     │                                                                    
  ├──────────────────────┼───────────────────────────────────────┤                                                                    
  │ show sprint progress │ Ver progreso del sprint               │                                                                    
  ├──────────────────────┼───────────────────────────────────────┤                                                                    
  │ init sprint N        │ Inicializar un nuevo sprint           │                                                                    
  └──────────────────────┴───────────────────────────────────────┘                                                                    
  ---                                                                                                                                 
  Flujo Completo: Ejemplo Práctico                                                                                                    
                                                                                                                                      
  1. Iniciar una Tarea                                                                                                                
                                                                                                                                      
  Tú: start task B0.1                                                                                                                 
                                                                                                                                      
  Lo que sucede automáticamente:                                                                                                      
  1. Verifico que no hay otra tarea activa                                                                                            
  2. Leo B0.1 de PLAN_DESARROLLO.md                                                                                                   
  3. Reviso decisions.md y bugs.md por contexto                                                                                       
  4. Creo rama: feature/sprint0-B0.1-express-setup                                                                                    
  5. Actualizo current-task.md con estado "In Progress"                                                                               
  6. Actualizo sprint-0-tracker.md con 🔄                                                                                             
                                                                                                                                      
  ---                                                                                                                                 
  2. Generar Ticket                                                                                                                   
                                                                                                                                      
  Tú: /plan-backend-ticket B0.1                                                                                                       
                                                                                                                                      
  Resultado: Ticket detallado con:                                                                                                    
  - Descripción y criterios de aceptación                                                                                             
  - Tests a escribir (TDD)                                                                                                            
  - Archivos a crear/modificar                                                                                                        
                                                                                                                                      
  ---                                                                                                                                 
  3. Desarrollar (TDD)                                                                                                                
                                                                                                                                      
  Tú: /develop-backend                                                                                                                
                                                                                                                                      
  El proceso sigue TDD:                                                                                                               
  1. Escribo test (RED)     → Test falla                                                                                              
  2. Implemento (GREEN)     → Test pasa                                                                                               
  3. Refactorizo            → Código limpio                                                                                           
  4. Repito                 → Siguiente test                                                                                          
                                                                                                                                      
  Si necesito ayuda específica:                                                                                                       
  - Base de datos → Uso database-architect                                                                                            
  - Lógica compleja → Uso backend-developer                                                                                           
                                                                                                                                      
  ---                                                                                                                                 
  4. Validar Código                                                                                                                   
                                                                                                                                      
  Tú: Valida el código antes de commit                                                                                                
                                                                                                                                      
  Ejecuto production-code-validator:                                                                                                  
  - ❌ console.log → Eliminar                                                                                                         
  - ❌ TODO/FIXME → Completar                                                                                                         
  - ❌ Hardcoded secrets → Usar env vars                                                                                              
  - ✅ Todo limpio → Continuar                                                                                                        
                                                                                                                                      
  ---                                                                                                                                 
  5. Documentación (si aplica)                                                                                                        
                                                                                                                                      
  Tú: /update-docs                                                                                                                    
                                                                                                                                      
  Solo si hay cambios en:                                                                                                             
  - APIs → api-spec.yaml                                                                                                              
  - Base de datos → data-model.md                                                                                                     
  - Configuración → .env.example                                                                                                      
                                                                                                                                      
  ---                                                                                                                                 
  6. Commit                                                                                                                           
                                                                                                                                      
  Tú: Genera el commit                                                                                                                
                                                                                                                                      
  Resultado:                                                                                                                          
  feat(backend): initialize Express + TypeScript project                                                                              
                                                                                                                                      
  - Setup Express server with TypeScript                                                                                              
  - Add health check endpoint                                                                                                         
  - Configure Jest for testing                                                                                                        
                                                                                                                                      
  Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>                                                                             
                                                                                                                                      
  ---                                                                                                                                 
  7. PR y Merge                                                                                                                       
                                                                                                                                      
  Tú: Crea el PR                                                                                                                      
                                                                                                                                      
  Acciones:                                                                                                                           
  1. Push a origin                                                                                                                    
  2. Creo PR con template                                                                                                             
  3. Si es complejo → code-review-specialist                                                                                          
  4. Merge cuando aprobado                                                                                                            
  5. Limpio rama local                                                                                                                
                                                                                                                                      
  ---                                                                                                                                 
  8. Completar Tarea                                                                                                                  
                                                                                                                                      
  Tú: complete task                                                                                                                   
                                                                                                                                      
  Actualizo automáticamente:                                                                                                          
  - current-task.md → Limpio y añado a historial                                                                                      
  - issues.md → Marca como "Completed"                                                                                                
  - sprint-0-tracker.md → Marca ✅                                                                                                    
  - Calculo métricas de tiempo                                                                                                        
                                                                                                                                      
  ---                                                                                                                                 
  Comandos Útiles Durante el Trabajo                                                                                                  
                                                                                                                                      
  Ver Estado Actual                                                                                                                   
                                                                                                                                      
  Tú: workflow status                                                                                                                 
  → Muestra current-task.md con tarea activa, paso actual, tiempo                                                                     
                                                                                                                                      
  Pausar Trabajo                                                                                                                      
                                                                                                                                      
  Tú: pause task                                                                                                                      
  → Guarda estado, notas de dónde quedaste, puedes continuar después                                                                  
                                                                                                                                      
  Continuar Trabajo                                                                                                                   
                                                                                                                                      
  Tú: resume task                                                                                                                     
  → Lee contexto guardado y continúa desde donde pausaste                                                                             
                                                                                                                                      
  Ver Progreso Sprint                                                                                                                 
                                                                                                                                      
  Tú: show sprint progress                                                                                                            
  → Muestra tareas completadas, en progreso, pendientes, bloqueadas                                                                   
                                                                                                                                      
  ---                                                                                                                                 
  Archivos que se Actualizan Automáticamente                                                                                          
  ┌─────────────────────┬────────────────────────────────────┐                                                                        
  │       Archivo       │        Se Actualiza Cuando         │                                                                        
  ├─────────────────────┼────────────────────────────────────┤                                                                        
  │ current-task.md     │ Cada cambio de paso, pausa, resume │                                                                        
  ├─────────────────────┼────────────────────────────────────┤                                                                        
  │ sprint-0-tracker.md │ Inicio/fin de tarea                │                                                                        
  ├─────────────────────┼────────────────────────────────────┤                                                                        
  │ issues.md           │ Tarea iniciada/completada          │                                                                        
  ├─────────────────────┼────────────────────────────────────┤                                                                        
  │ bugs.md             │ Bug encontrado y resuelto          │                                                                        
  ├─────────────────────┼────────────────────────────────────┤                                                                        
  │ decisions.md        │ Decisión arquitectónica tomada     │                                                                        
  └─────────────────────┴────────────────────────────────────┘                                                                        
  ---                                                                                                                                 
  Ejemplo de Sesión Completa                                                                                                          
                                                                                                                                      
  Tú: start task B0.1                                                                                                                 
                                                                                                                                      
  Claude: ✅ Tarea validada                                                                                                           
          - Task: B0.1 - Initialize Express + TypeScript project                                                                      
          - Branch: feature/sprint0-B0.1-express-setup                                                                                
          - Step: 1/8 (Validate) ✓                                                                                                    
                                                                                                                                      
          ¿Genero el ticket con /plan-backend-ticket?                                                                                 
                                                                                                                                      
  Tú: si                                                                                                                              
                                                                                                                                      
  Claude: [Genera ticket detallado con tests]                                                                                         
          Step: 3/8 (Ticket) ✓                                                                                                        
                                                                                                                                      
          ¿Empezamos el desarrollo?                                                                                                   
                                                                                                                                      
  Tú: si                                                                                                                              
                                                                                                                                      
  Claude: [TDD: escribe tests, implementa, refactoriza]                                                                               
          Step: 4/8 (Develop) ✓                                                                                                       
                                                                                                                                      
          Código listo. ¿Valido para producción?                                                                                      
                                                                                                                                      
  Tú: si                                                                                                                              
                                                                                                                                      
  Claude: [Ejecuta production-code-validator]                                                                                         
          ✅ Sin issues encontrados                                                                                                   
          Step: 5/8 (Validate) ✓                                                                                                      
                                                                                                                                      
          No hay cambios de API. ¿Generamos commit?                                                                                   
                                                                                                                                      
  Tú: si                                                                                                                              
                                                                                                                                      
  Claude: [Genera commit message]                                                                                                     
          Step: 7/8 (Commit) ✓                                                                                                        
                                                                                                                                      
          ¿Creo PR?                                                                                                                   
                                                                                                                                      
  Tú: si                                                                                                                              
                                                                                                                                      
  Claude: [Crea PR, muestra URL]                                                                                                      
          Step: 8/8 (PR) ✓                                                                                                            
                                                                                                                                      
          PR creado: https://github.com/...                                                                                           
                                                                                                                                      
          ¿Marco tarea como completada?                                                                                               
                                                                                                                                      
  Tú: si                                                                                                                              
                                                                                                                                      
  Claude: ✅ B0.1 completada                                                                                                          
          - Tiempo: 2h 15m                                                                                                            
          - Siguiente tarea: B0.2                                                                                                     
                                                                                                                                      
  ---                                                                                                                                 
  Manejo de Problemas                                                                                                                 
                                                                                                                                      
  Si hay un bloqueo:                                                                                                                  
                                                                                                                                      
  Tú: La tarea está bloqueada por B0.2                                                                                                
  → Marco como 🚫 Blocked, documento la razón, sugiero alternativas                                                                   
                                                                                                                                      
  Si encuentro un bug:                                                                                                                
                                                                                                                                      
  Tú: Encontré un bug en el código existente                                                                                          
  → Lo documento en bugs.md, decido si arreglar ahora o crear ticket                                                                  
                                                                                                                                      
  Si necesito abandonar:                                                                                                              
                                                                                                                                      
  Tú: Abandona esta tarea, cambió el enfoque                                                                                          
  → Documento razón, guardo trabajo útil, limpio estado    