# Reflection on AI-Assisted Development

This short reflection summarizes my experience using AI agents while implementing the FuelEU Maritime compliance dashboard and backend.

What I learned using AI agents

- AI agents excel at generating boilerplate (project scaffolding, config files, repetitive components) and accelerating routine tasks. They are especially useful for creating typed interfaces, initial component layouts, and simple utility functions.
- Agents are less reliable with complex business logic or regulation-specific rules. For core domain algorithms (CB calculation, pooling allocation, banking validation) I used AI for suggestions and relied on manual design and verification.
- Prompt specificity matters: including units, desired return types, and edge-case requirements in prompts dramatically improved the quality of generated output.

Efficiency gains vs manual coding

- Overall time savings were noticeable (~50–60% on scaffolding and component generation). Repetitive tasks and tests were produced much faster with AI assistance.
- Time spent validating, testing, and correcting hallucinated or incomplete outputs reduced some gains; however, net developer hours saved were significant.
- The workflow shifted toward verification and integration rather than rote implementation.

Improvements for next time

- Better prompt templates that include domain constraints (units, expected ranges, invariants) to reduce hallucinations.
- Use AI to generate more comprehensive tests (edge cases, property-based tests) and integrate them into CI.
- Incrementally generate smaller, testable units and run unit tests automatically after each generation step.
- Maintain a prompt-and-output changelog to make agent-driven commits traceable.

Conclusion

AI agents are powerful productivity multipliers when used as assistants rather than authorities. For regulated domain logic, combine agent output with strict unit tests, type checks, and manual review. This hybrid approach produced a working, well-structured implementation while preserving correctness through verification.
