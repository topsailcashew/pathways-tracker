# Security Policy

## Current Security Status

This application is a **frontend prototype** and has several security limitations that must be addressed before production deployment.

## Known Security Issues

### 🔴 Critical Issues (Must Fix Before Production)

1. **API Key Exposure**
   - **Issue**: Google Gemini API key is exposed in the frontend code
   - **Risk**: Anyone can extract the API key from browser DevTools
   - **Solution**: Move all AI API calls to a backend server/proxy
   - **Status**: ⚠️ Not production-ready

2. **No Real Authentication**
   - **Issue**: Login is simulated; any credentials work
   - **Risk**: No access control, anyone can access all data
   - **Solution**: Implement proper authentication (OAuth, JWT, etc.)
   - **Status**: ⚠️ Not production-ready

3. **No Data Persistence**
   - **Issue**: All data stored in browser memory (React state)
   - **Risk**: Data loss on page refresh
   - **Solution**: Connect to a real database (Firebase, PostgreSQL, etc.)
   - **Status**: ⚠️ Not production-ready

### 🟡 Medium Priority Issues

4. **Input Validation**
   - **Status**: ✅ Client-side validation implemented
   - **Note**: Server-side validation still needed when backend is added

5. **CORS Configuration**
   - **Issue**: Google Sheets integration may fail due to CORS
   - **Solution**: Use Google Sheets API with proper OAuth
   - **Status**: ⚠️ Feature disabled until backend is implemented

6. **XSS Protection**
   - **Status**: ✅ Basic sanitization implemented
   - **Note**: Consider adding DOMPurify library for production

### 🟢 Security Measures Implemented

- ✅ Content Security Policy (CSP) headers configured
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Input validation utilities
- ✅ HTML sanitization for user inputs
- ✅ TypeScript strict mode enabled
- ✅ Error boundary to prevent information leakage
- ✅ .env files properly gitignored
- ✅ Rate limiting utilities (client-side)

## Security Best Practices

### For Developers

1. **Never commit sensitive data**
   - API keys, passwords, tokens should be in `.env` files
   - `.env` files are gitignored

2. **Validate all user inputs**
   - Use the validation utilities in `utils/validation.ts`
   - Sanitize HTML content before displaying

3. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Run security checks before deployment**
   ```bash
   npm run validate
   ```

### For Production Deployment

1. **Backend Requirements**
   - Set up a backend API server (Node.js, Python, etc.)
   - Move `services/geminiService.ts` to the backend
   - Implement proper authentication (JWT, OAuth, etc.)
   - Add rate limiting on the server

2. **Database Security**
   - Use prepared statements/parameterized queries
   - Implement row-level security
   - Enable encryption at rest
   - Regular backups

3. **Environment Variables**
   - Store secrets in platform environment variables (Vercel, Netlify, etc.)
   - Never set `GEMINI_API_KEY` in frontend code
   - Use different keys for development and production

4. **HTTPS**
   - Always use HTTPS in production
   - Enable HSTS headers
   - Use SSL/TLS for database connections

5. **Monitoring**
   - Set up error tracking (Sentry, LogRocket, etc.)
   - Monitor API usage and rate limits
   - Set up alerts for suspicious activity

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email: security@yourchurch.org

**Please do not:**
- Open public GitHub issues for security vulnerabilities
- Share vulnerabilities publicly before they are fixed

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Checklist for Production

- [ ] API keys moved to backend
- [ ] Real authentication implemented
- [ ] Database connected and secured
- [ ] Server-side validation implemented
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CSP policy tested and working
- [ ] Error tracking set up
- [ ] Backups configured
- [ ] Security audit performed
- [ ] Penetration testing completed

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)
- [Vite Security](https://vitejs.dev/guide/env-and-mode.html#env-files)
- [Google Gemini API Security](https://ai.google.dev/gemini-api/docs/api-key)
