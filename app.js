const express = require('express');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const app = express();
const port = process.env.PORT || 3000;

// Opcjonalny Basic Auth (wyłączony jeśli brak envów)
if (process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASS) {
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.set('WWW-Authenticate', 'Basic realm="QR"').status(401).send('Auth required');
    const creds = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    if (creds[0] === process.env.BASIC_AUTH_USER && creds[1] === process.env.BASIC_AUTH_PASS) return next();
    return res.set('WWW-Authenticate', 'Basic realm="QR"').status(401).send('Invalid credentials');
  });
}

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>QR / Barcode Generator</title>
  <style>
    :root { --bg:#0b1020; --card:#121a33; --muted:#9fb0d0; --txt:#eaf0ff; --acc:#5aa2ff; }
    *{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,Arial;background:linear-gradient(180deg,#0b1020,#0f1730);color:var(--txt)}
    .wrap{max-width:900px;margin:40px auto;padding:0 16px}
    .card{background:var(--card);border:1px solid #22305d;border-radius:16px;padding:18px;margin-bottom:16px}
    h1{margin:0 0 6px;font-size:28px} p{color:var(--muted)}
    .row{display:flex;gap:10px;flex-wrap:wrap}
    input,select,button{border-radius:10px;border:1px solid #314274;background:#0f1730;color:var(--txt);padding:10px 12px}
    input,select{min-width:220px;flex:1}
    button{background:var(--acc);border:none;color:#08142c;font-weight:700;cursor:pointer}
    button:hover{filter:brightness(1.05)}
    .imgbox{margin-top:14px;min-height:120px;display:flex;align-items:center;justify-content:center;border:1px dashed #314274;border-radius:12px;padding:10px}
    img{max-width:100%;height:auto}
    .muted{color:var(--muted);font-size:13px}
    .footer{margin-top:8px}
    a{color:#9ec5ff}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>QR / Barcode Generator</h1>
    </div>

    <div class="card">
      <h3>QR Code</h3>
      <div class="row">
        <input id="qrData" placeholder="np. https://twoja-strona.pl" />
        <button onclick="genQR()">Generuj QR</button>
      </div>
      <div class="imgbox"><img id="qrImg" alt="QR" /></div>
      <div class="footer muted">API: <code>/qr?data=...</code></div>
    </div>

    <div class="card">
      <h3>Barcode</h3>
      <div class="row">
        <input id="bcText" placeholder="np. 5901234123457" />
        <select id="bcType">
          <option value="code128">code128</option>
          <option value="ean13">ean13</option>
          <option value="ean8">ean8</option>
          <option value="upca">upca</option>
        </select>
        <button onclick="genBarcode()">Generuj Barcode</button>
      </div>
      <div class="imgbox"><img id="bcImg" alt="Barcode" /></div>
      <div class="footer muted">API: <code>/barcode?text=...&type=code128</code></div>
    </div>
  </div>

<script>
  function genQR() {
    const v = document.getElementById('qrData').value.trim();
    if (!v) return alert('Wpisz dane do QR');
    document.getElementById('qrImg').src = '/qr?data=' + encodeURIComponent(v);
  }
  function genBarcode() {
    const t = document.getElementById('bcText').value.trim();
    const type = document.getElementById('bcType').value;
    if (!t) return alert('Wpisz tekst do barcode');
    document.getElementById('bcImg').src = '/barcode?text=' + encodeURIComponent(t) + '&type=' + encodeURIComponent(type);
  }
</script>
</body>
</html>`);
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/qr', async (req, res) => {
  const data = req.query.data;
  if (!data) return res.status(400).send('Missing data param');
  try {
    const png = await QRCode.toBuffer(decodeURIComponent(data), { type: 'png', width: 400 });
    res.type('png').send(png);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.get('/barcode', async (req, res) => {
  const text = req.query.text;
  const bctype = req.query.type || 'code128';
  if (!text) return res.status(400).send('Missing text param');
  try {
    const png = await bwipjs.toBuffer({
      bcid: bctype,
      text: decodeURIComponent(text),
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
    res.type('png').send(png);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('QR/Barcode service listening on ' + port);
});
