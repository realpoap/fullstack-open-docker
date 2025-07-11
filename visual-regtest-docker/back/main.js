const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Get the absolute path to .env.local
const envPath = path.resolve(process.cwd(), '.env.local');

// Check if the file exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found at:', envPath);
} else {
  console.log('✅ .env.local file found');

  // Read and log the file content (without sensitive data)
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('File content (sanitized):', envContent.split('\n').map(line => {
    if (line.includes('SLACK_WEBHOOK_URL')) {
      return 'SLACK_WEBHOOK_URL=***';
    }
    return line;
  }).join('\n'));
}

// Try to load the .env.local file
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env.local:', result.error);
} else {
  console.log('✅ Successfully loaded .env.local');
}

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { createFolders, getFolders, getFilePath } = require('./utils/path');
const { compare } = require('odiff-bin');
const { dirToJSON } = require('./utils/dirToJson');
const { scroll } = require('./utils/page');
const { IncomingWebhook } = require('@slack/webhook');

const app = express();
const port = 3000;

// Initialize Slack webhook if URL is provided
console.log('Slack Webhook URL:', process.env.SLACK_WEBHOOK_URL ? 'Configured' : 'Not configured');
const slackWebhook = process.env.SLACK_WEBHOOK_URL ? new IncomingWebhook(process.env.SLACK_WEBHOOK_URL) : null;
const diffTreshold = process.env.DIFF_TRESHOLD || 0;
console.log('Diff Threshold:', diffTreshold);

app.use(cors());
app.use(express.json());

// Serve static files from the snapshots directory
app.use('/snapshots', express.static(path.join(__dirname, 'snapshots')));
app.use('/diff', express.static(path.join(__dirname, 'diff')));

app.get('/api/capture/list', async (_req, res) => {
  try {
    const results = await dirToJSON(path.join(__dirname, 'snapshots'));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/capture', async (req, res) => {
  // folder and file definition
  const url = req.body.url;
  const creds = req.body.creds;
  const delay = req.body.delay
  const folderName = 'snapshots'  // TODO: diff folder name could be put in a config file
  const { date, hostname, path } = createFolders(url, folderName);
  // const browser = await puppeteer.launch();
  const browser = await puppeteer.launch({ // with path to Chrome installed via Dockerfile Chrome installation
    headless: true,
    defaultViewport: null,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: false
  });
  if (creds) {
    await page.authenticate({ username: creds.username, password: creds.password });
  }

  await page.goto(url, {
    waitUntil: 'load', //will wait until there is no more call and content is loaded
  }).then(async () => {
    await new Promise(resolve => setTimeout(resolve, delay)); //additional delay if needed
  });
  await scroll(page);
  await page.screenshot({
    path: path,
    fullPage: true,
  })
  await browser.close();

  const object = {
    url: url,
    hostname: hostname,
    date: date,
    path: path,
  }
  res.json(object);
});

app.post('/api/compare', async (req, res) => {
  const url = req.body.url;
  const date = req.body.date;
  const latestDate = req.body.latestDate;
  console.log('from request body:', url, date, latestDate)

  const { latest, toCompare } = getFolders(url, date, latestDate);

  if (!latest || !toCompare) {
    return res.status(404).json({
      error: "❌ Not enough snapshots available for comparison",
      latest: latest ? true : false,
      secondLatest: toCompare ? true : false
    });
  }
  console.log("latest: ", latest, "toCompare: ", toCompare);
  // running odiff compare
  const folderName = 'diff'  // TODO: diff folder name could be put in a config file
  const { path } = createFolders(url, folderName); //TODO: should not create folder if no diff
  console.log("diffPath: ", `${path}`);
  const { latestSnapshotPath, toComparePath } = getFilePath(url, latest, toCompare);
  try {
    const result = await compare(latestSnapshotPath, toComparePath, path);
    console.log("✅ compare result:", result);

    // Debug logging for notification conditions
    console.log('Notification conditions:', {
      hasWebhook: !!slackWebhook,
      isMatch: result.match,
      diffPercentage: result.diffPercentage,
      threshold: diffTreshold,
      shouldNotify: !result.match && result.diffPercentage > diffTreshold && !!slackWebhook
    });

    // Send Slack notification if there's a difference and webhook is configured
    if (!result.match && result.diffPercentage > diffTreshold && slackWebhook) {
      const hostname = url.split('/')[2].replace(/^www\./, '');
      const message = {
        text: `🔍 Visual Regression Test Alert`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Visual Regression Test Alert*\nA difference of ${result.diffPercentage.toFixed(1)}% was found in the comparison.`
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Website:*\n${hostname}`
              },
              {
                type: "mrkdwn",
                text: `*Compared Dates:*\n${date} vs ${latestDate}`
              }
            ]
          }
        ]
      };

      try {
        console.log('Attempting to send Slack notification...');
        await slackWebhook.send(message);
        console.log('✅ Slack notification sent successfully');
      } catch (slackError) {
        console.error('❌ Failed to send Slack notification:', slackError);
        console.error('Error details:', {
          message: slackError.message,
          code: slackError.code,
          statusCode: slackError.statusCode
        });
      }
    }

    res.json({
      match: result.match,
      diffPath: path,
      reason: result.reason || null,
      diffCOunt: result.diffCount || null,
      diffPercentage: result.diffPercentage || null
    });
  } catch (error) {
    console.error("❌ odiff comparison error:", error);
    res.status(500).json({
      error: "Failed to compare images",
      message: error.message,
      diffPath: null
    });
  }
})

// Add a test endpoint to verify server is running
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.send('Puppeter+Odiff Backend');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});