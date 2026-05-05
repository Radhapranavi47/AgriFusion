# AgriFusion Connectivity Guide

If you see **"Could not reach server"** when registering or logging in, follow these steps.

## Quick checklist

1. **Backend is running**
   ```powershell
   cd backend
   npm run dev
   ```
   You should see: `Server running on port 5000` (and MongoDB connected).

2. **Correct IP in mobile app**
   - On the computer running the backend, open PowerShell and run: `ipconfig`
   - Find **IPv4 Address** under your Wi-Fi adapter (e.g. `192.168.1.17`)
   - **Must match the network your phone uses** (not an old hotspot IP like `10.x.x.x` unless the phone is on that hotspot).
   - Copy that IP into `mobile-app/.env`:
     ```
     EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:5000
     ```
   - Optional legacy alias: `EXPO_PUBLIC_API_URL` with the same value.

3. **Restart Expo after changing .env**
   ```powershell
   cd mobile-app
   npx expo start --clear
   ```

4. **Phone and computer on same WiFi**
   - Disable mobile data on the phone
   - Ensure both use the same network (not guest WiFi vs main)

5. **Windows Firewall**
   - If still timing out, run (elevated PowerShell) from `backend/scripts`:
     ```powershell
     netsh advfirewall firewall add rule name="NodeJS5000" dir=in action=allow protocol=TCP localport=5000
     ```
   - Or: Windows Security → Firewall → allow Node.js or TCP port 5000 inbound.

## Test backend from a browser

On your **PC** or **phone**, open:

- `http://YOUR_IP:5000/health` → should return `{"status":"ok"}`
- `http://YOUR_IP:5000/api/test` → `{"message":"Backend is reachable from mobile"}`

If that fails, fix IP, Wi-Fi, or firewall before debugging the app.
