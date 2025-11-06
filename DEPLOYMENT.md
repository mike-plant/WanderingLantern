# Deployment Guide

This document explains how to deploy The Wandering Lantern website to GitHub Pages.

## Recommended: GitHub Actions (Automated)

**Pros:**
- ✅ Automatic builds on every push
- ✅ No need to commit `_site/` directory
- ✅ Clean git history
- ✅ Always uses latest Eleventy build

**Setup Steps:**

### 1. Configure GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to **Pages** (in the sidebar)
3. Under **Source**, select:
   - Source: **GitHub Actions** (not "Deploy from a branch")

### 2. Push the Workflow File

The workflow file is already created at `.github/workflows/deploy.yml`

Just commit and push it:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push
```

### 3. Verify Deployment

1. Go to your repository's **Actions** tab on GitHub
2. You should see the "Build and Deploy to GitHub Pages" workflow running
3. Once complete (usually 1-2 minutes), your site will be live!

### 4. Future Deployments

Just push changes to `main`:

```bash
git add .
git commit -m "Update content"
git push
```

GitHub Actions will automatically:
- Install dependencies
- Run `npm run build`
- Deploy `_site/` to GitHub Pages

---

## Alternative: Manual Deployment

**Pros:**
- ✅ Simple, no GitHub Actions needed
- ✅ You control exactly when site updates

**Cons:**
- ❌ Must commit `_site/` directory (messy)
- ❌ Manual build step required

**Setup Steps:**

### 1. Update .gitignore

Remove `_site/` from `.gitignore` to commit the built site:

```bash
# Edit .gitignore and remove the line:
# _site/
```

### 2. Build Locally

```bash
npm run build
```

### 3. Commit and Push

```bash
git add _site/
git add .
git commit -m "Deploy site"
git push
```

### 4. Configure GitHub Pages

1. Go to repository settings → **Pages**
2. Under **Source**, select:
   - Branch: **main**
   - Folder: **/_site**
3. Save

### 5. Future Deployments

```bash
npm run build
git add _site/
git commit -m "Update site"
git push
```

---

## Alternative: Deploy from Separate Branch

**Pros:**
- ✅ Keeps main branch clean
- ✅ Separates source from built files

**Setup:**

### 1. Create gh-pages branch

```bash
npm run build
cd _site
git init
git add .
git commit -m "Deploy site"
git branch -M gh-pages
git remote add origin https://github.com/YOUR-USERNAME/WanderingLantern.git
git push -f origin gh-pages
cd ..
```

### 2. Configure GitHub Pages

- Source: **gh-pages branch**
- Folder: **/ (root)**

### 3. Future Deployments

```bash
npm run build
cd _site
git add .
git commit -m "Deploy site"
git push -f origin gh-pages
cd ..
```

---

## Troubleshooting

### Build Fails in GitHub Actions

**Check the Actions log:**
1. Go to **Actions** tab in GitHub
2. Click on the failed workflow
3. Expand the failed step to see error details

**Common issues:**
- Missing dependencies: Check `package.json` is committed
- Build errors: Test locally with `npm run build`
- Node version: Workflow uses Node 20, test locally with same version

### Site Not Updating

1. **Check Actions tab** - Did the workflow complete successfully?
2. **Check Pages settings** - Is source set to "GitHub Actions"?
3. **Clear cache** - GitHub Pages can take 1-2 minutes to update
4. **Hard refresh** - Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### 404 Errors

- **Homepage works but other pages don't:**
  - Check that `_site/` contains all expected folders
  - Run `npm run build` locally and verify `_site/` structure

- **CSS/JS not loading:**
  - Check paths in templates use `/` (not relative paths)
  - Verify files exist in `_site/assets/`

### Custom Domain Issues

If using a custom domain (thewanderinglantern.com):

1. Add `CNAME` file to `src/root-files/`:
   ```
   thewanderinglantern.com
   ```

2. The file will be copied to `_site/CNAME` during build

3. Configure DNS with your domain provider:
   - Add A records pointing to GitHub Pages IPs
   - Or add CNAME record pointing to `YOUR-USERNAME.github.io`

---

## Recommended Workflow

We recommend **GitHub Actions** for the following reasons:

1. **Automatic deployments** - Push and forget
2. **Clean repository** - No built files in git history
3. **Consistent builds** - Always uses same Node/npm versions
4. **Free** - GitHub provides unlimited Actions minutes for public repos
5. **Professional** - Industry standard approach

## Quick Start (GitHub Actions)

```bash
# 1. Ensure workflow file exists
ls .github/workflows/deploy.yml

# 2. Push to GitHub
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment"
git push

# 3. Configure GitHub Pages
# Go to Settings → Pages → Source: GitHub Actions

# 4. Done! Future pushes auto-deploy.
```

## Migration from Old Setup

If you previously deployed `index.html` directly:

1. The old files are in `archive/` - safe to keep
2. Configure GitHub Pages to use **GitHub Actions**
3. Push the workflow file
4. Your site will rebuild with the new Eleventy structure

The workflow will automatically:
- Build `src/` → `_site/`
- Deploy `_site/` to GitHub Pages
- Keep your main branch clean

---

## Need Help?

- **Eleventy docs:** https://www.11ty.dev/docs/
- **GitHub Pages docs:** https://docs.github.com/en/pages
- **GitHub Actions docs:** https://docs.github.com/en/actions

For site-specific issues, check the Actions log or test builds locally with `npm run build`.
