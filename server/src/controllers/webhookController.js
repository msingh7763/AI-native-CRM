const CommunicationLog = require('../models/CommunicationLog');
const Campaign = require('../models/Campaign');
const { clearCache } = require('../services/inMemoryCache');

let clients = [];

exports.streamUpdates = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
};

const notifyClients = (log) => {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(log)}\n\n`);
  });
};

exports.handleReceipt = async (req, res) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const incomingSecret = req.headers['x-webhook-token'];

    if (webhookSecret && incomingSecret !== webhookSecret) {
      return res.status(401).json({ message: 'Unauthorized webhook request' });
    }

    const { logId, status } = req.body;
    if (!logId || !status) {
      return res.status(400).json({ message: 'logId and status are required' });
    }

    const log = await CommunicationLog.findByIdAndUpdate(logId, { status }, { returnDocument: 'after' });
    
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    const pendingCount = await CommunicationLog.countDocuments({
      campaignId: log.campaignId,
      status: 'Pending',
    });
    if (pendingCount === 0) {
      await Campaign.findByIdAndUpdate(log.campaignId, { status: 'Completed' });
    }

    clearCache('analytics_dashboard');
    notifyClients(log);

    res.status(200).json({ message: 'Log updated successfully', log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
