#!/bin/bash
set -e

echo "Installing Zenterai Agent..."

# Create user
useradd -r -s /bin/false zenterai || true

# Create directories
mkdir -p /opt/zenterai
mkdir -p /etc/zenterai
mkdir -p /var/log/zenterai

# Copy binary
cp zenterai-agent /usr/local/bin/
chmod +x /usr/local/bin/zenterai-agent

# Copy systemd service
cp zenterai-agent.service /etc/systemd/system/
systemctl daemon-reload

# Create config template
cat > /etc/zenterai/config.json <<EOF
{
  "api_endpoint": "https://api.zenterai.com",
  "access_token": "YOUR_TOKEN_HERE",
  "local_path": "/var/zenterai/sync",
  "remote_path": "/",
  "org_id": "YOUR_ORG_ID",
  "sync_interval_seconds": 300,
  "watch_enabled": true
}
EOF

chmod 600 /etc/zenterai/config.json
chown zenterai:zenterai /etc/zenterai/config.json

echo "Installation complete!"
echo "1. Edit /etc/zenterai/config.json with your settings"
echo "2. Start service: systemctl start zenterai-agent"
echo "3. Enable on boot: systemctl enable zenterai-agent"

