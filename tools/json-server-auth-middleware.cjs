const fs = require('fs');
const path = require('path');

function readDb() {
  const dbPath = path.join(__dirname, '..', 'db.json');
  const raw = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(raw);
}

function matchesPath(reqPath, candidates) {
  return candidates.includes(reqPath);
}

function setMockRefreshCookie(res) {
  // Best-effort: aligns with the "HttpOnly refresh cookie" architecture, even though this is a mock.
  // Using a non-secure cookie so it works on http://localhost.
  res.setHeader('Set-Cookie', 'refreshToken=mock; HttpOnly; Path=/; SameSite=Lax');
}

module.exports = (req, res, next) => {
  const reqPath = req.path;

  // Support both the original /auth/* paths and the rewritten /auth_* paths.
  const isMe = matchesPath(reqPath, ['/auth/me', '/auth_me']);
  const isRefresh = matchesPath(reqPath, ['/auth/refresh', '/auth_refresh']);
  const isLogin = matchesPath(reqPath, ['/auth/login', '/auth_login']);
  const isLogout = matchesPath(reqPath, ['/auth/logout', '/auth_logout']);

  if (isMe && req.method === 'GET') {
    const db = readDb();
    if (!db.auth_me) {
      return res.status(404).json({ message: 'Missing auth_me in db.json' });
    }
    return res.status(200).json(db.auth_me);
  }

  if (isRefresh && req.method === 'POST') {
    const db = readDb();
    if (!db.auth_refresh) {
      return res.status(404).json({ message: 'Missing auth_refresh in db.json' });
    }
    setMockRefreshCookie(res);
    return res.status(200).json(db.auth_refresh);
  }

  if (isLogin && req.method === 'POST') {
    const db = readDb();
    const { username, password } = req.body || {};
    console.log(`Login attempt for user: ${username}`);
    const matchedUser = Array.isArray(db.users)
      ? db.users.find(u => u.email === username && u.password === password)
      : undefined;

    if (!matchedUser) {
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' });
    }

    const baseResp = db.auth_login || db.auth_refresh;
    if (!baseResp) {
      return res.status(404).json({ message: 'Missing auth_login/auth_refresh in db.json' });
    }

    setMockRefreshCookie(res);
    return res.status(200).json({
      ...baseResp,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        displayName: matchedUser.displayName,
        email: matchedUser.email,
        roles: matchedUser.roles,
        permissions: matchedUser.permissions
      }
    });
  }

  if (isLogout && req.method === 'POST') {
    // Clear cookie (best-effort)
    res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    return res.status(204).end();
  }

  return next();
};
