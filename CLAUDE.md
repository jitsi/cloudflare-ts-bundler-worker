# Cloudflare Worker Development Environment

## Environment Configuration

### Development Environment
- **Account**: Jitsi (development) - **SHARED ACCOUNT**
- **Deployment Tool**: wrangler CLI
- **Usage**: Direct deployment by Claude for development/testing
- **Resource Naming**: All resources (secrets, KV stores, etc.) must be prefixed with project name to avoid collisions

### Staging Environment  
- **Account**: 8x8_Non-Production
- **Zone**: stage.8x8.vc
- **Deployment**: Github Actions workflow

### Production Environment
- **Account**: 8x8_Inc.
- **Zone**: 8x8.vc  
- **Deployment**: Github Actions workflow

## Development Workflow

### Git Branch Strategy
- **ALWAYS** work on feature branches when making changes
- Never make changes directly to main/master branch
- Branch naming: `feature/description` or `fix/description`

### Development Process
1. **Create Feature Branch**: Start all development work on a new git branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Development Deployments**:
   - Use `wrangler` CLI to deploy directly to Jitsi account
   - Account ID lookup required for wrangler.toml configuration
   - Only use wrangler for development environment

3. **Deployment Commits**: 
   - **ALWAYS** make a git commit after deploying to Cloudflare
   - Commit message must include:
     - That a deployment occurred
     - Reason for the deployment
     - Example: `deploy: Update API endpoint for user authentication testing`

4. **Feature Completion**:
   - When feature is ready, create a pull request to main branch
   - Include description of changes and testing performed
   - Ensure all tests pass before requesting review

### GitHub Actions Workflow Requirements
When a GitHub Actions workflow is missing, Claude should create `.github/workflows/deploy.yml` with the following specifications:

**Deployment Strategy**:
- Use `wrangler deploy` for all environments (dev, staging, production)
- Each environment targets a different Cloudflare account with appropriate credentials
- Support both automatic and manual deployments

**Automatic Deployments**:
- `main` branch → Staging environment (8x8_Non-Production account)
- `production` branch → Production environment (8x8_Inc. account)
- Feature branches → No automatic deployment

**Manual Deployments**:
- Workflow dispatch with environment selection dropdown (dev/staging/production)
- Allow manual deployment of any branch/tag to any environment
- Useful for hotfixes or testing specific commits

**Required Secrets Configuration**:
- `DEV_WRANGLER_API_TOKEN` - Cloudflare API token for Jitsi account
- `STAGING_WRANGLER_API_TOKEN` - Cloudflare API token for 8x8_Non-Production account
- `PRODUCTION_WRANGLER_API_TOKEN` - Cloudflare API token for 8x8_Inc. account
- Note: Account IDs and environment names should be configured in `wrangler.toml` with named environments

**Workflow Jobs**:
1. **Build & Test** - Run `npm test`, `npm run type-check`, `npm run lint`
2. **Deploy** - Use `wrangler deploy --env <environment>` with environment-specific API tokens
3. **Post-Deploy** - Optional verification or notification steps

**Environment-Specific Configuration**:
- Development: Deploy to Jitsi account, use project-prefixed naming
- Staging: Deploy to 8x8_Non-Production account, use stage.8x8.vc zone
- Production: Deploy to 8x8_Inc. account, use 8x8.vc zone

### For Staging/Production
1. Follow Github Actions workflow described above
2. Do not use wrangler for staging/production deployments

## Commands

### Development
- `wrangler dev` - Local development server
- `wrangler deploy` - Deploy to development environment (Jitsi account)
- `wrangler tail` - View logs from deployed worker

### Testing
- `npm test` - Run unit tests
- `npm run type-check` - TypeScript type checking
- `npm run lint` - Code linting

## Resource Naming Convention

### Development Environment (Jitsi Account)
Since the Jitsi account is shared across multiple projects, **ALL** resources must follow this naming pattern:

- **Worker Name**: `{project-name}-{environment}`
  - Example: `vo-meetings-dev`
- **Secrets**: `{PROJECT_NAME}_{SECRET_NAME}`
  - Example: `VO_MEETINGS_API_KEY`, `VO_MEETINGS_DATABASE_URL`
- **KV Namespaces**: `{project-name}-{purpose}-{environment}`
  - Example: `vo-meetings-cache-dev`, `vo-meetings-sessions-dev`
- **Durable Objects**: `{ProjectName}{Purpose}`
  - Example: `VoMeetingsRoom`, `VoMeetingsUser`

### Important Notes
- Use consistent casing: kebab-case for worker names, SCREAMING_SNAKE_CASE for secrets
- Always include project identifier to prevent resource conflicts
- Test resource names before deployment to ensure uniqueness

## Notes
- Always verify account configuration before deployment
- Staging and production changes must go through GitOps workflow
- Reference ../infra8_common_workspaces_cloudflare for infrastructure management
- **CRITICAL**: Never create resources without project-specific naming in the shared Jitsi account
