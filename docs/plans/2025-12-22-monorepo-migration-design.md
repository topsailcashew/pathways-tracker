# Monorepo Migration Design

**Date:** 2025-12-22
**Purpose:** Migrate pathways-tracker frontend and pathways-api backend into a unified monorepo structure

## Target Structure

```
pathways-tracker/
├── apps/
│   ├── web/          # Frontend (React + Vite)
│   └── api/          # Backend (Express + Prisma)
├── package.json      # Root workspace configuration
├── .gitignore        # Combined gitignore
└── .git/             # Single git repository
```

## Migration Strategy

### 1. Directory Structure
- Create `apps/` directory at root
- Move current frontend code into `apps/web/`
- Copy backend code from `/Users/nathaniel/Projects/pathways-api/backend/` into `apps/api/`
- Set up npm workspaces in root `package.json`

### 2. Git History
- **Frontend**: Preserve all git history (use git mv commands)
- **Backend**: Fresh start (backend has no commits yet, all files staged)
- Single unified git repository

### 3. Workspace Configuration

**Root package.json:**
```json
{
  "name": "pathways-tracker-monorepo",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=apps/web",
    "dev:api": "npm run dev --workspace=apps/api",
    "dev:all": "npm run dev --workspace=apps/api & npm run dev --workspace=apps/web",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "clean": "npm run clean --workspaces"
  }
}
```

### 4. Path Updates

**Frontend (apps/web/):**
- Update any absolute imports if they exist
- Update vite.config.ts if needed
- Keep existing package.json scripts

**Backend (apps/api/):**
- Already self-contained
- No path updates needed
- Keep existing package.json scripts

### 5. Environment Configuration

**Backend:**
- `.env` stays in `apps/api/`
- Already configured

**Frontend:**
- Create `apps/web/.env.local` for local development
- Example: `VITE_API_URL=http://localhost:3000`

### 6. Gitignore Updates

Combine gitignore rules:
```
# Dependencies
node_modules/
apps/*/node_modules/

# Build outputs
dist/
apps/*/dist/

# Environment files
.env
.env.local
apps/*/.env
apps/*/.env.local

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
```

## Development Workflow

### Running Apps
```bash
# Frontend only
npm run dev

# Backend only
npm run dev:api

# Both simultaneously
npm run dev:all
```

### Local Integration
- Frontend: `http://localhost:5173` (Vite default)
- Backend: `http://localhost:3000` (or configured port)
- Frontend makes API calls to backend's localhost URL

### Benefits
- Single git repository for coordinated changes
- Unified dependency management
- Make breaking changes across frontend/backend in single commits
- Future: Share TypeScript types via `packages/shared-types`
- Single PR can update both API and UI

## Migration Steps

1. Create `apps/` directory
2. Use `git mv` to move frontend files to `apps/web/`
3. Copy backend files to `apps/api/`
4. Create root `package.json` with workspace configuration
5. Update `.gitignore`
6. Install dependencies: `npm install`
7. Test both apps independently
8. Verify git history preserved for frontend

## Safety Measures

- Frontend git history fully preserved
- Both apps remain independently functional
- Can test each app before integration
- No data loss from backend (fresh copy of all staged files)

## Post-Migration

- Commit monorepo structure
- Update README with new development instructions
- Update CI/CD if applicable
- Remove old `/Users/nathaniel/Projects/pathways-api/` directory after verification
