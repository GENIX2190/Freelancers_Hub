# 📘 Git & GitHub Guide - Complete Setup

## What to do first (in order)

| Order | You (project owner) | Your friends |
| --- | --- | --- |
| **1** | **Configure the repository** — install Git, create the empty repo on GitHub, connect your PC, push your code | Nothing yet |
| **2** | **Invite your friends** — add them as collaborators on GitHub | They get an email |
| **3** | Share the repo URL + this file | They **accept** the invite, **clone** the project, then work daily with `pull` / `push` |

---

## Phase 1 — Configure the repository (do this first)

You only do this once to connect your local project to GitHub.

### Step 1: Configure Git (First Time Only)
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/dashboard/YASSIN
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 2: Add Files and Commit
```bash
git status
git add .
git commit -m "Initial commit: Freelance Hub Dashboard"
```

### Step 3: Create GitHub Repository
1. Go to **https://github.com**
2. Click **"+"** (top-right) → **"New repository"**
3. Repository name: **YASSIN-Dashboard**
4. Choose: **Private** (recommended)
5. **DON'T** check "Initialize with README"
6. Click **"Create repository"**

### Step 4: Push to GitHub
```bash
# Replace YOUR-USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR-USERNAME/YASSIN-Dashboard.git
git branch -M main
git push -u origin main
```

**Password**: Use **Personal Access Token**, not your password!

#### Create Personal Access Token:
1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Tokens (classic)"**
3. Name: **"YASSIN Dashboard"**
4. Check: **"repo"** (all checkboxes)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)
7. Use this token as password when pushing

**When Phase 1 is done:** your code is on GitHub. Now go to **Phase 2** to invite friends.

---

## Phase 2 — Invite your friends (after the repo is on GitHub)

Do this **after** you have pushed at least once. Without an existing repo, there is nothing to invite people to.

### How to invite (GitHub)

1. Open your repository: `https://github.com/YOUR-USERNAME/YASSIN-Dashboard`
2. Open the **"Settings"** tab (only visible to you, the owner)
3. In the left sidebar, click **"Collaborators and teams"** (or **"Collaborators"**)
4. Click **"Add people"** / **"Invite a collaborator"**
5. Type your friend’s **GitHub username** or the **email** linked to their GitHub account
6. Choose role: **"Write"** (they can clone, push, and pull) — or **"Read"** if they should only view
7. Click **"Add"** / **"Invite"**
8. They receive an **email** — they must **Accept** the invitation

**If your friend has no GitHub account yet:** they should sign up at [https://github.com/signup](https://github.com/signup) first, then you invite them with their new username.

### What to send your friends (copy and paste)

Send them:

1. **The invitation** (GitHub already emails them; remind them to check spam)
2. **The repository URL** (so they can open it in the browser after accepting):

```
https://github.com/YOUR-USERNAME/YASSIN-Dashboard
```

3. **The clone command** (after they accepted the invite):

```bash
git clone https://github.com/YOUR-USERNAME/YASSIN-Dashboard.git
cd YASSIN-Dashboard
```

You can also send them **this file** (`GIT_GUIDE.md`) so they can follow **“Phase 3”** below.

---

## Phase 3 — For your friends (after they accept the invite)

### Step 1: Install Git
Download from: **https://git-scm.com/downloads**

### Step 2: Configure Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Accept Invitation
- Check email
- Click "View invitation"
- Click "Accept invitation"

### Step 4: Clone Project
```bash
# Navigate to where you want the project
cd ~/Desktop

# Clone (use the URL your team lead gave you)
git clone https://github.com/YOUR-USERNAME/YASSIN-Dashboard.git

# Enter project
cd YASSIN-Dashboard
```

### Step 5: Setup Database
1. Create MySQL database: `yassin_dashboard`
2. Import database file (if provided)
3. Copy `.env.example` to `.env` (if exists)
4. Update database settings

### Step 6: Test
Open: `http://localhost/dashboard/YASSIN/`

---

## Daily workflow (everyone)

### Every Morning - Get Latest Code
```bash
git pull origin main
```

### During Work - Save Your Changes
```bash
# Check what you changed
git status

# Add all changes
git add .

# Commit with message
git commit -m "What you did (e.g., Fixed login bug)"

# Push to GitHub
git push origin main
```

### That's it! Repeat every day.

---

## Common commands

```bash
git status              # See what changed
git pull origin main    # Get latest code
git add .               # Stage all changes
git commit -m "message" # Save changes
git push origin main    # Upload to GitHub
git log --oneline       # See history
```

---

## Fixing common problems

### Problem: Merge Conflict
```bash
git pull origin main
# Open conflicted files
# Look for <<<<<<< and >>>>>>>
# Fix manually, remove markers
git add .
git commit -m "Fixed conflicts"
git push origin main
```

### Problem: Want to Undo Changes
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard ALL local changes (⚠️ careful!)
git reset --hard origin/main
```

### Problem: Password Not Working
- GitHub doesn't accept passwords anymore
- Use **Personal Access Token** instead
- Create at: https://github.com/settings/tokens

### Problem: Can't Push
```bash
# Make sure you're added as collaborator
# Pull first
git pull origin main
# Then push
git push origin main
```

---

## Best practices

### ✅ DO:
- Pull before starting work: `git pull origin main`
- Commit frequently with clear messages
- Test before pushing
- Ask if unsure

### ❌ DON'T:
- Never commit passwords or `.env` files
- Don't push broken code
- Don't commit large files (videos, large databases)
- Don't use `git reset --hard` unless you're sure

---

## Commit message examples

**Good Messages:**
```bash
git commit -m "Add post creation feature to front office"
git commit -m "Fix validation error in experience controller"
git commit -m "Update button styling to match design"
```

**Bad Messages:**
```bash
git commit -m "update"
git commit -m "changes"
git commit -m "fixed stuff"
```

---

## Quick Reference Card

```bash
# Morning
git pull origin main

# During work
git status
git add .
git commit -m "Clear message"
git push origin main

# Evening
git push origin main

# Emergency: Discard everything
git reset --hard origin/main  # ⚠️ Loses all work!
```

---

## Need Help?

**Git Documentation:** https://git-scm.com/doc  
**GitHub Guides:** https://guides.github.com  
**Interactive Tutorial:** https://learngitbranching.js.org

---

## Project Info

**Repository:** https://github.com/YOUR-USERNAME/YASSIN-Dashboard  
**Local Path:** /Applications/XAMPP/xamppfiles/htdocs/dashboard/YASSIN  
**Database:** yassin_dashboard  
**Main URL:** http://localhost/dashboard/YASSIN/

---

**That's everything you need! 🚀**

Share this guide with your team!
