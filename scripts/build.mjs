// Local development configuration must never select React's development bundle for releases.
process.env.NODE_ENV = 'production';
const { build } = await import('vite');
await build();
