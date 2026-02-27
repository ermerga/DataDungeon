# DataDungeon — Windows Setup Guide

This guide walks a Windows teammate through everything from a fresh machine to a running local copy of the project. Follow every step in order.

---

## Step 1 — Install the Right Terminal

Windows has several terminal options. For this project use **Windows Terminal** running **Git Bash**. It gives you the same Unix-style commands (`cp`, `ssh-keygen`, etc.) that the rest of the team uses on Mac and Linux — so every command in `notes.md` will work identically for you.

**1. Install Windows Terminal**
Open the Microsoft Store, search for **Windows Terminal**, and install it. It is free and made by Microsoft.

**2. Install Git for Windows**
Go to [git-scm.com/download/win](https://git-scm.com/download/win) and run the installer.

During installation, accept all defaults **except** for these two settings:
- **Default editor:** change from Vim to Visual Studio Code (or whatever you prefer)
- **Line ending conversions:** select **"Checkout as-is, commit Unix-style line endings"**

This installs Git **and** Git Bash — the terminal you will use.

**3. Open Windows Terminal with Git Bash**
- Open Windows Terminal
- Click the dropdown arrow next to the `+` tab button
- Select **Git Bash**

> From this point forward, every terminal command in this guide should be run inside Git Bash, not PowerShell or Command Prompt.

---

## Step 2 — Install VS Code

Go to [code.visualstudio.com](https://code.visualstudio.com) and install it.

During installation, check both boxes:
- **Add "Open with Code" action to Windows Explorer file context menu**
- **Add to PATH**

The PATH option lets you type `code .` in the terminal to open any folder in VS Code.

---

## Step 3 — Enable WSL2 (Required for Docker)

Docker Desktop on Windows uses WSL2 (Windows Subsystem for Linux) as its backend. You need to enable it before installing Docker.

**1. Open PowerShell as Administrator**
Press `Win + S`, type `PowerShell`, right-click it, and select **Run as administrator**.

**2. Run this command**
```powershell
wsl --install
```

**3. Restart your machine**
WSL2 will not be active until you restart.

> If you get an error saying WSL is already installed, you are fine — skip to the next step.

---

## Step 4 — Install Docker Desktop

Go to [docker.com/products/docker-desktop](https://docker.com/products/docker-desktop) and download the **Windows** installer.

During installation:
- Make sure **Use WSL2 instead of Hyper-V** is checked (it should be by default)
- Let it install the WSL2 components if prompted

After installation, launch Docker Desktop. Wait for it to show **"Engine running"** in the bottom left before continuing. This can take 1–2 minutes on first launch.

**Verify Docker is working** — open Git Bash and run:
```bash
docker --version
docker compose version
```

Both should print version numbers. If they do, Docker is ready.

---

## Step 5 — Set Up SSH for GitHub

SSH lets you clone and push to GitHub without typing your password every time. Skip this section if you already have an SSH key set up with GitHub.

**1. Generate a new SSH key**

In Git Bash, run:
```bash
ssh-keygen -t ed25519 -C "your_github_email@example.com"
```

When prompted:
- **File location:** press Enter to accept the default (`~/.ssh/id_ed25519`)
- **Passphrase:** you can set one or leave it blank — press Enter either way

**2. Start the SSH agent and add your key**
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

**3. Copy your public key**
```bash
cat ~/.ssh/id_ed25519.pub
```

This prints your public key to the terminal. Copy the entire output — it starts with `ssh-ed25519` and ends with your email.

**4. Add the key to GitHub**
- Go to [github.com/settings/keys](https://github.com/settings/keys)
- Click **New SSH key**
- Give it a name (e.g., "My Windows Laptop")
- Paste your public key into the Key field
- Click **Add SSH key**

**5. Test the connection**
```bash
ssh -T git@github.com
```

You should see: `Hi your-username! You've successfully authenticated...`

---

## Step 6 — Configure Git

Tell Git who you are so your commits are labeled correctly:

```bash
git config --global user.name "Your Name"
git config --global user.email "your_github_email@example.com"
git config --global core.autocrlf input
```

The last line (`core.autocrlf input`) prevents Windows from converting line endings in files, which can cause problems when teammates are on Mac or Linux.

---

## Step 7 — Clone the Repo

```bash
git clone git@github.com:<org>/DataDungeon.git
cd DataDungeon
```

If you are not sure of the exact repo URL, go to the GitHub repo page, click the green **Code** button, select **SSH**, and copy the URL shown.

Open the project in VS Code:
```bash
code .
```

---

## Step 8 — Create Your `.env` Files

**Backend**
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` in VS Code and fill in:
```
ANTHROPIC_API_KEY=your_key_here
DATABASE_URL=postgresql://datadungeon:datadungeon@postgres:5432/datadungeon
```

Ask the team lead for the shared `ANTHROPIC_API_KEY`.

**Frontend**
```bash
cp frontend/.env.example frontend/.env
```
Open `frontend/.env` in VS Code and fill in:
```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

Get your Mapbox token at [mapbox.com](https://mapbox.com) — create a free account and copy the default public token from your account page.

---

## Step 9 — Start the Project

Make sure Docker Desktop is open and the engine is running, then run:

```bash
docker compose up --build
```

The first build takes 3–5 minutes. You will see logs scrolling from all three services (postgres, backend, frontend). When you see both of these lines, you are ready:

```
backend   | Application startup complete.
frontend  | Local:   http://localhost:5173/
```

Open your browser and go to:
- **Frontend:** http://localhost:5173
- **Backend API docs:** http://localhost:8000/docs

---

## Troubleshooting

**"docker: command not found" in Git Bash**
Docker Desktop may not have added itself to the Git Bash PATH. Close and reopen Git Bash, then try again. If it still fails, open Docker Desktop → Settings → General and make sure **Add the \*.exe proxy to PATH** is enabled.

**Docker Desktop won't start / WSL2 error**
Open PowerShell as Administrator and run:
```powershell
wsl --update
wsl --set-default-version 2
```
Then restart Docker Desktop.

**Port already in use (5173 or 8000)**
Something else on your machine is using that port. Run:
```bash
docker compose down
docker compose up --build
```
If it still fails, restart Docker Desktop.

**Line ending warnings in Git**
If Git warns you about CRLF line endings when you commit, make sure you ran `git config --global core.autocrlf input` from Step 6.

**SSH: Permission denied (publickey)**
Your SSH key is not loaded. Run:
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```
Then try again.

---

## Daily Workflow (Windows)

Everything is the same as Mac — run all commands in Git Bash:

```bash
# Start the project
docker compose up

# Stop the project
docker compose down

# Rebuild after changing requirements.txt or package.json
docker compose up --build

# View logs
docker compose logs backend
docker compose logs frontend
```

---

*DataDungeon — USU Sandbox Hackathon 2026*
