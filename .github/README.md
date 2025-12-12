# Instructions and Agents Documentation

## Overview

This directory contains comprehensive documentation for AI agents (GitHub Copilot, Cursor, Claude) and developers working on the Angular 20 Architecture Blueprint project.

## 📁 Structure

```
.github/
├── instructions/          # Detailed implementation guidelines
│   ├── general.instructions.md   # Core patterns and conventions
│   ├── testing.instructions.md   # Jest testing patterns
│   ├── styles.instructions.md    # SCSS and theming
│   └── fixes.instructions.md     # Common issues and solutions
│
└── agents/                # Specialized agent contexts
    ├── architecture-agent.md     # Project structure and patterns
    ├── testing-agent.md          # Testing expertise
    ├── styling-agent.md          # Styling and theming
    └── api-agent.md              # API and state management
```

## 📋 Instructions Files

### general.instructions.md
**Quick reference for core patterns**
- Component, service, and test templates
- Zoneless + signals + standalone patterns
- SSR-safe coding
- Accessibility requirements
- i18n with ngx-translate

### testing.instructions.md
**Complete Jest testing guide**
- Jest vs Jasmine differences
- Component, service, directive, pipe tests
- EntityStore testing
- Accessibility testing with jest-axe
- Mock services and dependencies
- Translation testing utilities

### styles.instructions.md
**Styling system documentation**
- CSS custom properties (design tokens)
- 4-theme system (light, dark, light2, dark2)
- BEM naming conventions
- Responsive design patterns
- Button directive styling
- Modal theming
- AG Grid integration
- WCAG AA accessibility

### fixes.instructions.md
**Common problems and solutions**
- Zoneless change detection issues
- Signal patterns and anti-patterns
- RxJS subscription management
- SSR compatibility fixes
- EntityStore usage
- Testing with Jest
- Accessibility fixes
- i18n issues

## 🤖 Agent Files

### architecture-agent.md
**Project structure expert**
- Feature-first architecture
- Core/Features/Shared organization
- AbstractApiClient and EntityStore patterns
- Routing and lazy loading
- ADR documentation
- Bundle size monitoring
- Architecture decision processes

### testing-agent.md
**Testing specialist**
- Jest configuration and patterns
- Test templates for all types
- EntityStore testing
- Mock services and HTTP
- Accessibility testing
- Coverage requirements
- SSR-safe testing

### styling-agent.md
**Styling expert**
- Theme system architecture
- CSS custom properties
- BEM methodology
- Responsive design
- Accessibility styling
- Modal and component patterns
- ThemeService integration
- Performance optimization

### api-agent.md
**API and state management specialist**
- AbstractApiClient extension
- EntityStore implementation
- HTTP best practices
- Error handling
- Mock API development
- RxJS patterns
- Type safety
- Testing API services

## 🎯 Usage Guidelines

### For AI Agents (Copilot, Cursor, Claude)

1. **Read AGENTS.md first** - High-level project context
2. **Check relevant instructions** - Before generating code
3. **Follow agent specializations** - Use the appropriate agent context
4. **Reference fixes.instructions.md** - When encountering issues

### For Developers

1. **Start with AGENTS.md** - Understand the overall architecture
2. **Use instructions as reference** - While implementing features
3. **Check fixes when stuck** - Common problems have documented solutions
4. **Maintain documentation** - Update when patterns change

## 🔄 When to Update

Update these files when:
- ✅ Core architectural patterns change
- ✅ New major features are added (EntityStore, ModalService, etc.)
- ✅ Testing patterns evolve
- ✅ Styling conventions change
- ✅ Common issues are discovered
- ✅ New ADRs are created

Do NOT update for:
- ❌ Minor feature additions
- ❌ Bug fixes that don't change patterns
- ❌ Dependency version updates (unless API changes)
- ❌ Content/data changes

## 📚 Related Documentation

- **[AGENTS.md](../../AGENTS.md)** - Main project context for AI agents
- **[README.md](../../README.md)** - Project setup and commands
- **[features.md](../../features.md)** - Feature documentation
- **[docs/adr/](../../docs/adr/)** - Architecture Decision Records

## 🎓 Learning Path

### New to the Project

1. Read [AGENTS.md](../../AGENTS.md) - Project overview
2. Read [general.instructions.md](instructions/general.instructions.md) - Core patterns
3. Skim [architecture-agent.md](agents/architecture-agent.md) - Structure understanding
4. Review [fixes.instructions.md](instructions/fixes.instructions.md) - Common pitfalls

### Implementing a Feature

1. Check [architecture-agent.md](agents/architecture-agent.md) - Where to put code
2. Follow [general.instructions.md](instructions/general.instructions.md) - Coding patterns
3. Reference [styles.instructions.md](instructions/styles.instructions.md) - Styling
4. Use [api-agent.md](agents/api-agent.md) - If working with APIs

### Writing Tests

1. Read [testing.instructions.md](instructions/testing.instructions.md) - Jest patterns
2. Follow [testing-agent.md](agents/testing-agent.md) - Test templates
3. Check [fixes.instructions.md](instructions/fixes.instructions.md) - Test issues

### Styling Components

1. Read [styles.instructions.md](instructions/styles.instructions.md) - CSS patterns
2. Follow [styling-agent.md](agents/styling-agent.md) - Theme integration
3. Check theme files in `src/app/themes/` - Available variables

## 🔍 Quick Reference

| Need | File |
|------|------|
| Component template | general.instructions.md |
| Test template | testing.instructions.md |
| API service pattern | api-agent.md |
| Styling pattern | styles.instructions.md |
| Fix zoneless issue | fixes.instructions.md |
| Project structure | architecture-agent.md |
| EntityStore usage | api-agent.md |
| Theme variables | styling-agent.md |
| Jest vs Jasmine | testing.instructions.md |
| Accessibility | styles.instructions.md + fixes.instructions.md |

## 💡 Best Practices

### For AI Agents

- Reference specific files when answering questions
- Follow patterns exactly as documented
- Point to ADRs for architectural decisions
- Suggest checking fixes.instructions.md for common issues

### For Developers

- Keep these files open while coding
- Update when discovering new patterns
- Add solutions to fixes.instructions.md
- Reference in code reviews

## 📝 Maintenance

**Last Updated:** December 12, 2025

**Maintainers:** Development team + AI agents

**Review Frequency:** After major architectural changes or every quarter

---

**Note:** These files are designed to work together. AGENTS.md provides the overview, instructions/ provide the details, and agents/ provide specialized contexts. Keep them consistent and up-to-date for maximum effectiveness.
