const express = require('express');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const app = express();
const port = process.env.PORT || 3000;

// PROSTE BASIC AUTH z .env (opcjonalne)
if (process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASS) {
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.set('WWW-Authenticate', 'Basic realm="QR"').status(401).send('Auth required');
    const creds = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    if (creds[0] === process.env.BASIC_AUTH_USER && creds[1] === process.env.BASIC_AUTH_PASS) return next();
    res.set('WWW-Authenticate', 'Basic realm="QR"').status(401).send('Invalid credentials');
  });
}

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

app.listen(port, ()=> console.log(`QR/Barcode service listening on ${port}`));
