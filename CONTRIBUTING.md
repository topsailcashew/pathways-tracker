# Contributing to Pathway Tracker

Thank you for your interest in contributing to Pathway Tracker! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- A code editor (VS Code recommended)

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/pathways-tracker.git
   cd pathways-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

Example: `feature/add-email-notifications`

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic

3. **Validate your changes**
   ```bash
   # Type check
   npm run type-check

   # Lint
   npm run lint

   # Format
   npm run format

   # Or run all validations
   npm run validate
   ```

4. **Test your changes**
   - Test all affected features manually
   - Ensure no console errors
   - Test on different screen sizes

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add email notification feature"
   ```

### Commit Message Format

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add email notification system
fix: resolve member search issue
docs: update deployment guide
refactor: simplify authentication logic
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new files
- Enable strict mode (already configured)
- Avoid `any` type - use proper types
- Export types for reusability

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component names
- Add prop types for all props

Example:
```typescript
interface UserCardProps {
  name: string;
  email: string;
  onEdit: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ name, email, onEdit }) => {
  // Component logic
};
```

### File Organization

```
components/       - React components
services/         - Business logic and API calls
utils/            - Utility functions
types.ts          - TypeScript type definitions
constants.ts      - Application constants
```

### CSS/Styling

- Use Tailwind CSS classes
- Avoid inline styles
- Keep class names organized
- Use custom CSS only when necessary

### Error Handling

- Use try-catch for async operations
- Use the logger utility (`utils/logger.ts`)
- Provide user-friendly error messages
- Never expose sensitive information in errors

Example:
```typescript
import { logger } from '../utils/logger';

try {
  const result = await someAsyncOperation();
  logger.info('Operation successful', { result });
} catch (error) {
  logger.error('Operation failed', error as Error);
  // Show user-friendly message
}
```

## Security Guidelines

⚠️ **Critical**: Never commit sensitive data!

- Keep API keys in `.env` files
- Use validation utilities for user inputs
- Sanitize HTML content
- Follow the guidelines in `SECURITY.md`

## Testing

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors or warnings
- [ ] Responsive on mobile, tablet, and desktop
- [ ] Error states handled gracefully
- [ ] Loading states shown appropriately
- [ ] Forms validate user input
- [ ] Data persists correctly (within current limitations)

### Future: Automated Tests

When the testing framework is added:

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Pull Request Process

1. **Update documentation**
   - Update README.md if needed
   - Add JSDoc comments to new functions
   - Update API.md for API changes

2. **Self-review your code**
   - Check for console.logs
   - Remove commented code
   - Ensure proper error handling
   - Verify types are correct

3. **Create a pull request**
   - Use a descriptive title
   - Reference any related issues
   - Describe what changed and why
   - Add screenshots for UI changes

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   How was this tested?

   ## Screenshots (if applicable)

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-reviewed the code
   - [ ] Commented complex code
   - [ ] Updated documentation
   - [ ] No new warnings
   - [ ] Tested on multiple devices
   ```

## Areas Needing Contribution

### High Priority

1. **Backend Development**
   - Set up Express/Node.js backend
   - Implement authentication
   - Database integration

2. **Testing**
   - Unit tests for utilities
   - Component tests
   - E2E tests

3. **Security**
   - Security audit
   - Backend proxy for API calls
   - Rate limiting

### Medium Priority

4. **Features**
   - Bulk email/SMS sending
   - Calendar integrations
   - Advanced reporting

5. **UX Improvements**
   - Accessibility (a11y)
   - Keyboard navigation
   - Loading skeletons

6. **Documentation**
   - Video tutorials
   - API documentation
   - User guides

## Questions?

- Open a GitHub issue for bugs
- Start a discussion for feature ideas
- Check existing issues before creating new ones

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to Pathway Tracker! 🙏
