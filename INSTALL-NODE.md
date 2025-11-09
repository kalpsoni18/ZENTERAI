# Installing Node.js

## Quick Install Options

### Option 1: Download from Official Website (Recommended)
1. Go to: https://nodejs.org/
2. Download the LTS (Long Term Support) version for macOS
3. Run the installer
4. Restart your terminal
5. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Option 2: Install via Homebrew
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

### Option 3: Install via nvm (Node Version Manager)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.zshrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify installation
node --version
npm --version
```

## After Installation

Once Node.js is installed, you can run:
```bash
./test-no-docker.sh
```

## Verify Installation

Run these commands to verify:
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

## Troubleshooting

### Command not found after installation
- Close and reopen your terminal
- Or run: `source ~/.zshrc`

### Still not working?
- Check your PATH: `echo $PATH`
- Make sure Node.js is in your PATH
- Try restarting your computer

