// Database migrations are applied separately; Vercel build must only build the application.
// Running migrations during the build can fail because database credentials are runtime-scoped.
console.log('Skipping database migrations during Vercel build.');
