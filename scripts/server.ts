import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const certPath = process.env.TLS_CERT_PATH || './certs/cert.pem';
const keyPath = process.env.TLS_KEY_PATH || './certs/key.pem';

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const tlsOptions = {
    cert: fs.readFileSync(path.resolve(certPath)),
    key: fs.readFileSync(path.resolve(keyPath)),
  };

  const server = https.createServer(tlsOptions, (req, res) => {
    handle(req, res);
  });

  server.listen(port, hostname, () => {
    console.log(`> HTTPS server ready on https://${hostname}:${port}`);
    console.log(`> Access via https://localhost:${port}`);
    const os = require('node:os');
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`> LAN: https://${net.address}:${port}`);
        }
      }
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
