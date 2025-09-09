# Contributing to Ready Wallet Paymaster Demo

Thank you for your interest in contributing! We welcome contributions from the community.

## How to Contribute

### Reporting Issues

Before creating an issue, please check if it already exists. When creating a new issue, provide:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)

### Pull Request Process

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style and conventions
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   - API: `cd api && npm install && npm run dev` (TypeScript via tsx watch)
   - Client: `cd client && npm install && npm run dev`

4. **Commit your changes**
   - Use clear and meaningful commit messages
   - Follow conventional commits format: `type(scope): description`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description of changes
   - Wait for review and address feedback

### Code Standards

- API uses TypeScript. New files under `api/src/**` should be `.ts`.
- Follow existing formatting; keep functions small and focused.
- Handle errors with clear messages returned to the client.

### Security

- Never commit sensitive data (API keys, passwords)
- Review dependencies for vulnerabilities
- Follow security best practices for StarkNet integration

### Development Setup

1. Clone the repository
2. Install dependencies in each app: `cd api && npm install && cd ../client && npm install`
3. Configure env files
   - API: copy `api/.env.example` to `api/.env.local` (or `.env`) and fill values
   - Client: copy `client/.env.example` to `client/.env.local` and fill values
4. Run the apps
   - API: `cd api && npm run dev`
   - Client: `cd client && npm run dev`

### Testing

- Test your changes locally before submitting PR
- Verify wallet creation works correctly
- Check error handling scenarios
- Test with different configurations

### Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
