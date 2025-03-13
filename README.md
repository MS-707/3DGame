# Urban Tank Warfare

A 3D multiplayer tank combat game set in a destructible city environment.

## Game Concept
Players control customizable tanks in an urban battlefield, competing in various game modes like capture points or team deathmatch. The city environment features destructible elements and strategic positions.

## Key Features
- 3D tank movement and physics
- Urban environment with buildings and obstacles
- Multiplayer networking for online battles
- Different tank types with customization options
- Destructible environment elements
- Power-ups and special abilities

## Technology
This project follows a progressive development approach:
1. **Web-Based Prototype**: Initially implementing core gameplay using Three.js and WebSockets
2. **Potential UE5 Migration**: Future migration path to Unreal Engine 5 once core mechanics are established

## Development Methodology
This project is being developed using the Symbiotic Intellection Framework (SIF), a multi-agent AI collaboration approach:

- **Multi-Model Orchestration**: Leveraging specialized capabilities of different AI models
  - Claude 3.7 Sonnet: Architecture, planning, review, and integration
  - Qwen2.5-Coder-32B-Instruct: Implementation and code generation
  
- **Boundary Object Creation**: Using specialized prompts as knowledge transfer mechanisms between models

- **Trust-Based Delegation**: Distributing tasks based on cognitive specialization

The development process is documented in journal entries that track progress, analyze the effectiveness of the SIF approach, and document technical decisions.

## Repository Structure
- `/docs`: Documentation, design documents, and implementation plans
  - `/docs/journal`: Development journal entries tracking progress and SIF implementation
  - `/docs/QWEN_PROMPTS.md`: Specialized prompts designed for Qwen2.5-Coder-32B-Instruct
- `/src`: Source code for the game
  - `/src/client`: Client-side game code
  - `/src/server`: Server code for multiplayer functionality
  - `/src/shared`: Code shared between client and server
- `/public`: Public assets and client-side files

## Development Status
Currently in early implementation stage, using the web-based approach to establish core game mechanics before potential migration to a more advanced engine.

## Contributors
- MarkStarrPro (Project Lead)
- Claude 3.7 Sonnet (Architecture & Planning)
- Qwen2.5-Coder-32B-Instruct (Implementation)