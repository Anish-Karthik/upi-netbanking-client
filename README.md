# Vite React SWC Template with Tailwind and Shadcn/ui

This template provides a streamlined setup for rapid frontend prototyping using React, TypeScript, and Vite. It includes several enhancements over the basic Vite template to accelerate development.

## Features

- [Vite](https://vitejs.dev/) with [SWC](https://swc.rs/) for fast builds and Hot Module Replacement (HMR)
- [React](https://react.dev/) for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Biome](https://biomejs.dev/) for code formatting and linting (config based on [Viem](https://viem.sh/))
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful and customizable UI components
- [pnpm](https://pnpm.io/) for efficient package management

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

## Scripts

- `pnpm dev`: Start the development server
- `pnpm build`: Build for production
- `pnpm lint`: Run Biome linter
- `pnpm preview`: Preview the production build locally

## Customization

### Tailwind CSS

Tailwind CSS is pre-configured. Customize the `tailwind.config.js` file to adjust your design system.

### Shadcn/ui

Shadcn/ui components are available for use. Add new components using the Shadcn CLI:

```bash
pnpm dlx shadcn-ui@latest add [component-name]
```

### Biome

Biome is configured for code formatting and linting. Adjust the `biome.json` file to customize rules.

## Expanding the Configuration

For production applications, consider the following enhancements:

1. Set up a testing framework (e.g., Vitest, Jest)
2. Implement CI/CD pipelines
3. Add pre-commit hooks for code quality checks
4. Configure environment variables for different deployment environments

## Learn More

- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/learn)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Biome Documentation](https://biomejs.dev/guides/getting-started/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
