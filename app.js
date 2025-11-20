const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SNUC Pro Portal made with love by Shajan Se</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #0d0d0d;
      color: #eaeaea;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      position: relative;
      margin: 0;
      padding: 0;
    }

    .container {
      width: 90%;
      max-width: 850px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 0 40px rgba(255, 255, 255, 0.05);
    }

    h1 {
      text-align: center;
      font-size: 2.6rem;
      color: #fff;
      margin-bottom: 1rem;
    }

    .subtitle {
      text-align: center;
      color: #bbb;
      font-size: 1.1rem;
      margin-bottom: 2rem;
      line-height: 1.5;
    }

    .location {
      text-align: center;
      background: rgba(255,255,255,0.08);
      border-radius: 30px;
      display: inline-block;
      padding: 0.6rem 1.3rem;
      margin-bottom: 1.8rem;
      font-weight: 500;
      color: #fff;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 1.2rem;
      text-align: center;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #fff;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #aaa;
      text-transform: uppercase;
      margin-top: 0.3rem;
    }

    .cta-button {
      display: inline-block;
      margin: 2rem auto 0;
      background: #fff;
      color: #000;
      padding: 0.9rem 2.2rem;
      border-radius: 40px;
      text-decoration: none;
      font-weight: 600;
    }

    .footer {
      text-align: center;
      margin-top: 2.5rem;
      color: #aaa;
      font-size: 0.95rem;
    }

    .signature {
      display: block;
      font-weight: 700;
      color: #fff;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="location">Chennai, India</div>
    <h1>Welcome to the SNUC Pro Portal</h1>
    <p class="subtitle">
      A refined digital space crafted for precision, strategy, and mastery.
      Stay ahead — every millisecond matters in the art of trading.
    </p>

    <div style="text-align:center;">
      <a href="/health" class="cta-button">Check System Health</a>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">99.99%</div>
        <div class="stat-label">Uptime</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">&lt;40ms</div>
        <div class="stat-label">Latency</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">24/7</div>
        <div class="stat-label">Live Access</div>
      </div>
    </div>

    <div class="footer">
      "Discipline outlasts luck. Precision beats emotion."
      
    </div>
  </div>

</body>
</html>
    `);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
  console.log("SNUC Pro Portal running on port " + PORT);
});




