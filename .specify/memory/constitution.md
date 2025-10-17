<!--
SYNC IMPACT REPORT
==================
Version change: INITIAL → 1.0.0
Modified principles: N/A (initial version)
Added sections:
  - Core Principles (7 principles)
  - Development Standards
  - Quality Gates
  - Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md (Constitution Check section aligned)
  ✅ .specify/templates/spec-template.md (user story prioritization aligned)
  ✅ .specify/templates/tasks-template.md (task organization aligned)
Follow-up TODOs: None
-->

# Spec-Driven Development Constitution

## Core Principles

### I. Specification First (NON-NEGOTIABLE)

Every feature MUST begin with a complete specification before any design or implementation work.

**Requirements**:
- Specifications MUST capture user scenarios with prioritized user stories (P1, P2, P3, etc.)
- Each user story MUST be independently testable and deliverable as an MVP increment
- Functional requirements MUST be enumerated (FR-001, FR-002, etc.) with clear acceptance criteria
- Edge cases and error scenarios MUST be explicitly documented
- Ambiguities MUST be marked with "NEEDS CLARIFICATION" rather than assumed

**Rationale**: Specifications prevent scope creep, ensure stakeholder alignment, and provide a
single source of truth for all downstream work. Independent user stories enable incremental
delivery and parallel development.

### II. Architecture Before Implementation (NON-NEGOTIABLE)

Every feature MUST have a documented implementation plan before any code is written.

**Requirements**:
- Plans MUST define technical context (language, dependencies, platform, constraints)
- Plans MUST include a Constitution Check that validates compliance with all principles
- Plans MUST document project structure with concrete paths, not options
- Plans MUST justify any complexity violations in a Complexity Tracking table
- Plans MUST include phase-based implementation with clear checkpoints

**Rationale**: Architectural planning surfaces technical risks early, ensures consistent patterns,
and enables reviewers to validate design decisions before implementation effort is expended.

### III. Test-Driven Development (NON-NEGOTIABLE)

TDD MUST be followed for all implementation work: Write tests → Verify tests fail → Implement
→ Verify tests pass → Refactor.

**Requirements**:
- Tests MUST be written and verified to fail BEFORE implementation begins
- Contract tests MUST be written for all public APIs and inter-service boundaries
- Integration tests MUST cover complete user journeys for each user story
- Tests MUST be runnable independently per user story to enable incremental validation
- Red-Green-Refactor cycle MUST be strictly enforced

**Rationale**: TDD ensures code meets requirements, prevents regressions, and provides living
documentation. Writing failing tests first proves the test is valid and prevents false positives.

### IV. Small, Independent Changes

All changes MUST be minimal, focused, and independently deployable.

**Requirements**:
- Each user story MUST be implementable and testable independently
- Tasks MUST be organized by user story with clear [Story] labels (e.g., [US1], [US2])
- Parallel tasks MUST be marked with [P] and target different files to avoid conflicts
- Commits MUST be small and atomic, ideally one per completed task
- Unrelated refactoring or "drive-by fixes" are PROHIBITED unless explicitly scoped

**Rationale**: Small changes reduce review burden, minimize merge conflicts, enable faster
feedback loops, and make rollbacks safer. Independent user stories support incremental delivery
and parallel team workflows.

### V. Documentation as Code

All design artifacts, decisions, and prompts MUST be captured in version-controlled Markdown
files alongside source code.

**Requirements**:
- Prompt History Records (PHRs) MUST be created for every user interaction after work completes
- PHRs MUST capture verbatim user input and concise assistant response
- PHRs MUST route to `docs/prompts/` (pre-feature) or `specs/<feature>/prompts/` (feature work)
- Architectural Decision Records (ADRs) MUST be suggested (not auto-created) when significant
  decisions meet all three criteria: long-term impact, multiple alternatives considered,
  cross-cutting scope
- ADRs MUST document context, decision, consequences, and alternatives rejected

**Rationale**: Documentation as code ensures design rationale is preserved, discoverable, and
evolves with the codebase. PHRs provide a learning corpus and traceability trail. ADRs prevent
knowledge loss and enable future maintainers to understand why decisions were made.

### VI. Explicit Over Implicit

All assumptions, constraints, and decisions MUST be explicitly stated and justified.

**Requirements**:
- Templates with placeholders (e.g., `[PROJECT_NAME]`) MUST be filled with concrete values
- Any placeholder left unfilled MUST include `TODO(<FIELD_NAME>): explanation`
- Technical constraints MUST be specified with measurable limits (e.g., "<200ms p95", "1000 req/s")
- Vague language ("should", "might", "probably") MUST be replaced with precise requirements
- Invented APIs, data formats, or contracts are PROHIBITED; ask clarifying questions instead

**Rationale**: Explicit documentation eliminates ambiguity, enables automated validation, and
ensures all stakeholders share the same understanding. Measurable constraints enable objective
verification of compliance.

### VII. Versioning and Governance

The constitution and all design artifacts MUST be versioned using semantic versioning (MAJOR.MINOR.PATCH).

**Requirements**:
- Constitution version MUST increment on every amendment:
  - MAJOR: Backward-incompatible principle removals or redefinitions
  - MINOR: New principles or materially expanded guidance
  - PATCH: Clarifications, wording fixes, non-semantic refinements
- Ratification date MUST record original adoption (YYYY-MM-DD format)
- Last amended date MUST update to current date when changes are made
- All amendments MUST include a Sync Impact Report documenting changed principles and affected templates

**Rationale**: Semantic versioning communicates the impact of changes, enables teams to assess
migration effort, and provides a historical record of governance evolution.

## Development Standards

### Coding Standards

- Code MUST follow language-specific style guides (e.g., PEP 8 for Python, Swift API Design Guidelines)
- Linting and formatting MUST be automated and enforced via pre-commit hooks or CI
- Public APIs MUST include docstrings or inline documentation
- Magic numbers and hardcoded values MUST be replaced with named constants
- Secrets, tokens, and credentials MUST be externalized to `.env` files and NEVER committed

### Testing Standards

- Test files MUST mirror source structure (e.g., `src/models/user.py` → `tests/unit/models/test_user.py`)
- Tests MUST use descriptive names: `test_<scenario>_<expected_outcome>`
- Test coverage MUST be measured; uncovered code paths MUST be justified
- Flaky tests are PROHIBITED; intermittent failures MUST be investigated and fixed immediately
- Integration tests MUST be isolated and repeatable (no shared state, no external service dependencies unless mocked)

### Performance Standards

- Performance constraints MUST be defined in the implementation plan (e.g., p95 latency, throughput)
- Performance-sensitive code MUST include inline comments explaining optimization choices
- Premature optimization is PROHIBITED unless constraints are violated
- Performance regressions MUST be detected via benchmarks or profiling in CI

### Security Standards

- Authentication and authorization MUST use established libraries and frameworks (no homegrown crypto)
- User input MUST be validated and sanitized at all entry points
- SQL injection, XSS, and CSRF protections MUST be applied where relevant
- Dependency vulnerabilities MUST be scanned via automated tools (e.g., `npm audit`, `safety`, `cargo audit`)
- Security-sensitive decisions MUST be documented in ADRs

## Quality Gates

All work MUST pass the following gates before merging:

### Gate 1: Constitution Check (Plan Phase)

The implementation plan MUST verify compliance with all principles:

- Is a complete specification present? (Principle I)
- Are user stories prioritized and independently testable? (Principles I, IV)
- Is technical context complete with no `NEEDS CLARIFICATION` markers? (Principle VI)
- Are project structure paths concrete, not options? (Principle II)
- Are complexity violations documented in the Complexity Tracking table? (Principle II)

### Gate 2: Test-First Verification (Implementation Phase)

Before implementation begins:

- Are all tests written and committed?
- Do all tests fail with expected failure messages?
- Are contract tests present for all public APIs? (Principle III)
- Are integration tests present for all user stories? (Principle III)

### Gate 3: Incremental Validation (Implementation Phase)

After each user story implementation:

- Can the user story be tested independently without other stories present?
- Do all tests for the user story now pass?
- Is the user story deliverable as a standalone MVP increment? (Principle IV)

### Gate 4: Documentation Completeness (Post-Implementation)

After work completes:

- Is a PHR created with verbatim user input and concise response? (Principle V)
- If significant decisions were made, was an ADR suggestion surfaced? (Principle V)
- Are all placeholders in artifacts resolved or marked with `TODO(<FIELD>)`? (Principle VI)

## Governance

### Amendment Procedure

1. Proposed amendments MUST be documented with rationale and impact analysis
2. Amendments MUST be reviewed by project maintainers or designated approvers
3. Amendments MUST include a Sync Impact Report identifying affected templates and files
4. Amendments MUST increment the constitution version according to semantic versioning rules
5. Dependent templates MUST be updated to maintain consistency with amended principles

### Compliance Review

- All pull requests MUST verify compliance with constitution principles during code review
- Violations MUST be documented and justified in the plan's Complexity Tracking table
- Repeated violations MUST trigger constitution amendment discussions
- Automation (linters, CI checks, pre-commit hooks) SHOULD enforce principles where possible

### Conflict Resolution

- When principles appear to conflict, the NON-NEGOTIABLE principles (I, II, III) take precedence
- When interpretation is ambiguous, prefer the most restrictive interpretation that enforces quality
- When a principle cannot be followed due to external constraints, document the exception in an ADR

### Documentation and Guidance

- This constitution is the authoritative source for project governance
- Runtime guidance for agents and developers is provided in `CLAUDE.md` and `AGENTS.md`
- Template files in `.specify/templates/` provide concrete structure for workflows
- When guidance conflicts, the constitution supersedes all other documentation

**Version**: 1.0.0 | **Ratified**: 2025-10-15 | **Last Amended**: 2025-10-15
