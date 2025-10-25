# 🔧 WEBSOCKET 503 ERROR - SOLUTION

## ❌ **PROBLEM IDENTIFIED**

You're getting **503 errors** because you're running the **WRONG SERVER**!

```
Error: GET /api/socket/io?EIO=4&transport=polling 503
Error: WebSocket connection failed
```

---

## 🎯 **ROOT CAUSE**

### What You're Running:
```powershell
npm run dev  # ❌ Next.js dev server (NO Socket.io)
```

### What You NEED to Run:
```powershell
npm run dev:custom  # ✅ Custom server WITH Socket.io
```

---

## 🔴 **WHY IT FAILS**

| Server Type | Command | Has Socket.io? | Result |
|-------------|---------|----------------|--------|
| Next.js Dev | `npm run dev` | ❌ NO | 503 errors |
| Custom Server | `npm run dev:custom` | ✅ YES | Works! |

**The Next.js dev server doesn't include your custom `server.js` file, which has all the Socket.io configuration!**

---

## ✅ **SOLUTION - Step by Step**

### Step 1: Stop Current Server
In the terminal running your server:
1. Press **Ctrl+C** to stop it
2. Wait for it to fully stop

### Step 2: Start Custom Server
```powershell
npm run dev:custom
```

### Step 3: Wait for Success Messages
You should see:
```
🚀 Starting server in DEVELOPMENT mode
📍 Server will run at: http://localhost:3000
✓ Ready in X.XXs
```

### Step 4: Test WebSocket
Visit: **http://localhost:3000/socket-test**

Expected result:
- ✅ Badge shows **"Connected"** (green)
- ✅ No 503 errors in console
- ✅ Real-time messaging works

---

## 📊 **COMPARISON**

### npm run dev (WRONG) ❌
```
Start: next dev
Server: Next.js development server
Socket.io: NOT LOADED
Endpoint /api/socket/io: DOES NOT EXIST
Result: 503 Service Unavailable
```

### npm run dev:custom (CORRECT) ✅
```
Start: node server.js
Server: Custom Node.js + Next.js + Socket.io
Socket.io: LOADED AND CONFIGURED
Endpoint /api/socket/io: EXISTS AND WORKING
Result: WebSocket connected successfully!
```

---

## 🔍 **HOW TO VERIFY YOU'RE USING THE RIGHT SERVER**

### Check #1: Terminal Output
If you see **"Starting server in DEVELOPMENT mode"**, you're good! ✅

### Check #2: Browser Console
After visiting any page:
- ❌ If you see: `Socket.io disabled - real-time features unavailable`
  - You're NOT authenticated yet (login first)
- ✅ If you see: `🔌 Connected to messaging server`
  - Perfect! It's working!

### Check #3: Network Tab
In browser DevTools → Network tab:
- ❌ Status 503 on `/api/socket/io` → Wrong server
- ✅ Status 101 (WebSocket) or 200 (polling) → Correct server!

---

## 📝 **WHAT EACH SCRIPT DOES**

From `package.json`:

### Development Scripts:
```json
{
  "dev": "next dev",                    // ❌ Standard Next.js (no Socket.io)
  "dev:custom": "node server.js",       // ✅ Custom server (has Socket.io)
  "dev:next": "next dev"                // ❌ Same as "dev"
}
```

### Production Scripts:
```json
{
  "start": "node server.js",            // ✅ Production (has Socket.io)
  "start:next": "next start"            // ❌ Standard Next.js (no Socket.io)
}
```

**Always use the "custom" or base "start" commands for Socket.io!**

---

## 🚀 **QUICK FIX CHECKLIST**

- [ ] Stop current server (Ctrl+C)
- [ ] Run `npm run dev:custom`
- [ ] Wait for "Ready in" message
- [ ] Visit http://localhost:3000/socket-test
- [ ] Check badge shows "Connected"
- [ ] Verify no 503 errors in console
- [ ] Test sending a message

---

## 💡 **WHY THIS HAPPENED**

1. Socket.io was disabled in the hooks (we just fixed that ✅)
2. But you also need the **server** to have Socket.io running
3. The custom `server.js` file has Socket.io configured
4. Next.js dev server doesn't load custom servers automatically
5. That's why we have `npm run dev:custom` - it runs server.js!

---

## 🎯 **EXPECTED BEHAVIOR AFTER FIX**

### Browser Console (Clean):
```
🔌 Connected to messaging server
Socket connected: abc123xyz
```

### Network Tab:
```
GET /api/socket/io?EIO=4&transport=polling
Status: 200 OK ✅

WS ws://localhost:3000/api/socket/io/?EIO=4&transport=websocket
Status: 101 Switching Protocols ✅
```

### Socket Test Page:
```
Badge: Connected (green) ✅
Can select channels ✅
Can send messages ✅
Real-time updates work ✅
```

---

## 🔄 **FOR FUTURE REFERENCE**

### When to use each command:

**Use `npm run dev:custom` when:**
- ✅ You need Socket.io / WebSocket features
- ✅ You need real-time messaging
- ✅ You're testing /socket-test page
- ✅ You're working on team communication features

**Use `npm run dev` when:**
- ✅ You're just working on UI components
- ✅ You don't need real-time features
- ✅ You want faster hot-reload (slightly faster)

**For production, ALWAYS use:**
```powershell
npm run start  # Uses server.js with Socket.io
```

---

## 📚 **RELATED FILES**

- **server.js** - Custom server with Socket.io configuration
- **hooks/useSocket.ts** - Socket.io React hook
- **hooks/use-socket.ts** - Alternative Socket.io hook
- **hooks/use-socket-messaging.ts** - Messaging-specific hook
- **app/socket-test/page.tsx** - Socket.io test page

---

## ✅ **VERIFICATION**

After running `npm run dev:custom`, test these:

1. **Connection Test:**
   - Visit: http://localhost:3000/socket-test
   - Expected: "Connected" badge

2. **Console Test:**
   - Open browser console
   - Expected: "🔌 Connected to messaging server"

3. **Network Test:**
   - DevTools → Network → WS tab
   - Expected: Active WebSocket connection

4. **Messaging Test:**
   - Select a channel on socket-test page
   - Send a message
   - Expected: Message appears instantly

---

## 🎉 **FINAL SOLUTION**

```powershell
# In your terminal:
Ctrl+C  # Stop current server
npm run dev:custom  # Start custom server with Socket.io
# Wait for "Ready in X.XXs"
# Visit: http://localhost:3000/socket-test
# Should see "Connected" ✅
```

**That's it! Socket.io will now work perfectly! 🚀**

---

**Created:** October 26, 2025  
**Issue:** WebSocket 503 errors  
**Solution:** Use `npm run dev:custom` instead of `npm run dev`  
**Status:** ✅ RESOLVED
