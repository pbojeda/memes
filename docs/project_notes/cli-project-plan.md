# CLI Project Plan: AI Development Methodology

> **NOTA IMPORTANTE**: Este documento sirve como punto de partida. El proyecto MemeStore seguirá evolucionando su metodología. Al retomar este CLI, **comparar con los cambios realizados en**:
> - `CLAUDE.md` (ai-specs/specs/base-standards.mdc)
> - `.claude/skills/` (especialmente development-workflow)
> - `.claude/agents/`
> - `ai-specs/specs/*.mdc`

---

## 1. Visión del Proyecto

CLI interactivo que configura la metodología de desarrollo AI en cualquier proyecto, soportando múltiples herramientas (Claude, Cursor, Copilot) y siendo adaptable a diferentes tech stacks.

---

## 2. Nombre (pendiente de decidir)

Opciones:
- `devflow` / `pb-devflow`
- `ai-workflow` / `pb-workflow`
- `methodic` / `pb-methodic`

---

## 3. Funcionalidades MVP (Fase 1)

```bash
npx <nombre> init
```

### 3.1 Preguntas iniciales

1. **Nombre del proyecto**
2. **¿Proyecto nuevo o existente?**
   - Si existente: detectar tech stack automáticamente
3. **Tech stack** (si no detectado o nuevo)
   - Backend: Node/Express, Python/FastAPI, Go, None
   - Frontend: React/Next.js, Vue, Angular, None
   - Database: PostgreSQL, MySQL, MongoDB, None
   - Testing: Jest, Vitest, Pytest, None
4. **Herramientas AI** (multi-select)
   - Claude Code
   - Cursor
   - GitHub Copilot
   - Gemini
5. **Metodología** (multi-select con defaults)
   - [x] TDD obligatorio
   - [x] Code review con AI antes de merge
   - [x] Sprint tracking
   - [ ] DDD estricto (solo backend)
   - [x] Conventional commits

### 3.2 Ficheros generados (Claude Code)

```
proyecto/
├── CLAUDE.md                          # Symlink o fichero
├── .claude/
│   ├── skills/
│   │   ├── development-workflow/
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   ├── bug-workflow/
│   │   └── project-memory/
│   └── agents/
│       ├── production-code-validator.md
│       ├── code-review-specialist.md
│       ├── database-architect.md
│       ├── backend-developer.md       # Si tiene backend
│       └── frontend-developer.md      # Si tiene frontend
├── ai-specs/
│   └── specs/
│       ├── base-standards.mdc
│       ├── backend-standards.mdc      # Si tiene backend
│       ├── frontend-standards.mdc     # Si tiene frontend
│       └── documentation-standards.mdc
└── docs/
    └── project_notes/
        ├── sprint-0-tracker.md        # Template inicial
        ├── bugs.md
        ├── decisions.md
        └── key_facts.md
```

### 3.3 Ficheros generados (Cursor)

```
proyecto/
├── .cursorrules                       # Equivalente a CLAUDE.md
└── .cursor/
    └── rules/
        └── *.mdc                      # Standards adaptados
```

### 3.4 Ficheros generados (Copilot)

```
proyecto/
└── .github/
    └── copilot-instructions.md        # Instrucciones para Copilot
```

---

## 4. Fases de desarrollo

### Fase 1: MVP (~1 semana)
- [ ] Setup proyecto Node.js/TypeScript
- [ ] CLI con `commander` o `inquirer`
- [ ] Preguntas básicas
- [ ] Generación de ficheros para Claude Code
- [ ] Templates estáticos (sin personalización de contenido)
- [ ] README con instrucciones

### Fase 2: Detección automática (~3 días)
- [ ] Detectar package.json → Node
- [ ] Detectar requirements.txt/pyproject.toml → Python
- [ ] Detectar go.mod → Go
- [ ] Detectar framework específico (Next.js, Express, etc.)
- [ ] Detectar testing framework

### Fase 3: Multi-tool (~3 días)
- [ ] Generar .cursorrules
- [ ] Generar .github/copilot-instructions.md
- [ ] Adaptar contenido a formato de cada herramienta

### Fase 4: Update command (~2 días)
- [ ] `npx <nombre> update` - sincronizar con última versión
- [ ] Preservar configuración del usuario
- [ ] Merge inteligente de cambios

### Fase 5: Configuración avanzada (~2 días)
- [ ] Fichero `.devflowrc.json` con configuración
- [ ] Personalización de templates
- [ ] Soporte para monorepos

---

## 5. Estructura del repo CLI

```
<nombre>/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Entry point CLI
│   ├── commands/
│   │   ├── init.ts
│   │   └── update.ts
│   ├── prompts/
│   │   └── questions.ts
│   ├── generators/
│   │   ├── claude.ts
│   │   ├── cursor.ts
│   │   └── copilot.ts
│   ├── detectors/
│   │   └── project.ts
│   └── templates/
│       ├── claude/
│       │   ├── CLAUDE.md.hbs
│       │   ├── skills/
│       │   └── agents/
│       ├── cursor/
│       └── copilot/
├── tests/
└── README.md
```

---

## 6. Dependencias principales

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "inquirer": "^9.0.0",
    "handlebars": "^4.7.0",
    "chalk": "^5.0.0",
    "fs-extra": "^11.0.0",
    "glob": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 7. Templates a extraer de MemeStore

### De CLAUDE.md (base-standards.mdc)
- Core Principles (generalizar)
- Language Standards
- Monorepo Directory Rules (hacer condicional)
- Pre-Commit Checklist
- Quality Gates
- Project Memory System
- Anti-Patterns

### De .claude/skills/
- development-workflow (limpiar referencias MemeStore)
- bug-workflow
- project-memory

### De .claude/agents/
- production-code-validator (genérico)
- code-review-specialist (genérico)
- database-architect (si tiene DB)
- backend-developer (si tiene backend)
- frontend-developer (si tiene frontend)

### De ai-specs/specs/
- backend-standards.mdc (adaptar a stack elegido)
- frontend-standards.mdc (adaptar a stack elegido)
- documentation-standards.mdc (genérico)

---

## 8. Variables de template (Handlebars)

```handlebars
{{projectName}}
{{hasBackend}}
{{hasFrontend}}
{{hasDatabase}}
{{backendStack}}     // "node-express" | "python-fastapi" | "go"
{{frontendStack}}    // "react-nextjs" | "vue" | "angular"
{{databaseType}}     // "postgresql" | "mysql" | "mongodb"
{{testingFramework}} // "jest" | "vitest" | "pytest"
{{useTDD}}
{{useCodeReview}}
{{useSprintTracking}}
{{useDDD}}
{{useConventionalCommits}}
{{aiTools}}          // ["claude", "cursor", "copilot"]
```

---

## 9. Próximos pasos al retomar

1. **Comparar** este plan con el estado actual de MemeStore
2. **Crear** el repo: `github.com/pbojeda/<nombre>`
3. **Inicializar** proyecto Node.js/TypeScript
4. **Copiar** templates desde MemeStore (limpiando referencias específicas)
5. **Implementar** Fase 1 (MVP)

---

## 10. Referencias

- MemeStore repo: Fuente de templates actualizados
- Branch `refactor/improve-development-workflow`: Últimas mejoras del workflow

---

*Documento creado: 2026-02-04*
*Última actualización: 2026-02-04*
