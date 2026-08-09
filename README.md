# Image to Celebration GIF

Turn any image into a shareable confetti celebration GIF right in your browser.

This is a single-page app built with [TanStack Start](https://tanstack.com/start), [React](https://react.dev), and [Tailwind CSS](https://tailwindcss.com). All processing happens client-side, so your images never leave your machine.

## Usage

1. Run the development server:

```bash
pnpm install
pnpm dev
```

2. Open the app in your browser and upload a PNG, JPEG, WebP, or GIF image.
3. Click **Generate Celebration GIF** to add a confetti explosion on top of your image.
4. Download the generated GIF when it is ready.

## Building For Production

To build this application for production:

```bash
pnpm build
```

## Deployment

Pushes to `main` are automatically built and deployed to GitHub Pages by the [deploy workflow](.github/workflows/deploy.yml).

The live site is available at the GitHub Pages URL configured for this repository.

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

```bash
pnpm lint
pnpm format
pnpm check
```

## Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
