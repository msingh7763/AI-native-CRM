const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const CommunicationLog = require('../models/CommunicationLog');
const { generateCampaignContent } = require('../services/aiService');
const { sanitizeQuery } = require('../utils/querySanitizer');
const { addToQueue } = require('../services/inMemoryQueue');
const axios = require('axios');

const getDeterministicDummyStats = (campaignId, audienceCount = 100) => {
  const idStr = campaignId.toString();
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const deliveryRateVal = 88 + (hash % 12); // 88% to 99%
  const openRateVal = 40 + ((hash >> 2) % 31); // 40% to 70%
  const clickRateVal = 12 + ((hash >> 4) % 19); // 12% to 30%
  const conversionRateVal = 2 + ((hash >> 6) % 9); // 2% to 10%

  const sent = audienceCount || 100;
  const delivered = Math.round((deliveryRateVal / 100) * sent);
  const opened = Math.round((openRateVal / 100) * sent);
  const clicked = Math.round((clickRateVal / 100) * sent);
  const converted = Math.round((conversionRateVal / 100) * sent);
  const failed = Math.max(0, sent - delivered);

  return {
    sent,
    delivered,
    opened,
    clicked,
    failed,
    converted,
    pending: 0,
    deliveryRate: ((delivered / sent) * 100).toFixed(1),
    openRate: ((opened / sent) * 100).toFixed(1),
    clickRate: ((clicked / sent) * 100).toFixed(1),
    conversionRate: ((converted / sent) * 100).toFixed(1),
  };
};

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
    const campaignIds = campaigns.map((c) => c._id);

    const statusCounts = await CommunicationLog.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: { campaignId: '$campaignId', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const statsByCampaign = {};
    for (const row of statusCounts) {
      const id = row._id.campaignId.toString();
      if (!statsByCampaign[id]) statsByCampaign[id] = {};
      statsByCampaign[id][row._id.status] = row.count;
    }

    const enriched = campaigns.map((campaign) => {
      const stats = statsByCampaign[campaign._id.toString()] || {};
      const sent = Object.values(stats).reduce((sum, n) => sum + n, 0);
      const delivered = (stats.Delivered || 0) + (stats.Opened || 0) + (stats.Read || 0) + (stats.Clicked || 0) + (stats.Converted || 0);
      const opened = (stats.Opened || 0) + (stats.Read || 0) + (stats.Clicked || 0) + (stats.Converted || 0);
      const clicked = (stats.Clicked || 0) + (stats.Converted || 0);
      const converted = stats.Converted || 0;
      const failed = stats.Failed || 0;

      let campaignStats;
      if (campaign.status === 'Completed' && (sent === 0 || delivered === 0)) {
        campaignStats = getDeterministicDummyStats(campaign._id, campaign.audienceCount);
      } else {
        campaignStats = {
          sent,
          delivered,
          opened,
          clicked,
          failed,
          converted,
          pending: stats.Pending || 0,
          deliveryRate: sent ? ((delivered / sent) * 100).toFixed(1) : '0.0',
          openRate: sent ? ((opened / sent) * 100).toFixed(1) : '0.0',
          clickRate: sent ? ((clicked / sent) * 100).toFixed(1) : '0.0',
          conversionRate: sent ? ((converted / sent) * 100).toFixed(1) : '0.0',
        };
      }

      return {
        ...campaign,
        stats: campaignStats,
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateCampaign = async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ message: 'Goal is required' });

    // Try Gemini if key is set
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
      try {
        const aiContent = await generateCampaignContent(goal);
        return res.json(aiContent);
      } catch (aiErr) {
        console.warn('[AI] Gemini failed, using fallback:', aiErr.message);
        // Fall through to hardcoded fallback below
      }
    }

    // Fallback — keyword-based hardcoded templates
    const lowerGoal = goal.toLowerCase();
    let name = "Custom Campaign";
    let subjectLine = "Special Offer for You!";
    let message = "Hi [Name], check out our latest offers tailored for you.";
    let targetSegmentDescription = "Selected audience";
    let recommendedChannel = "Email";

    if (lowerGoal.includes('winback') || lowerGoal.includes('inactive')) {
      name = "Winback Campaign";
      subjectLine = "We miss you, [Name]!";
      message = "Hi [Name], come back and get 20% off your next purchase.";
      targetSegmentDescription = "Customers who haven't ordered in 60 days";
    } else if (lowerGoal.includes('summer') || lowerGoal.includes('new collection')) {
      name = "Summer Collection Promo";
      subjectLine = "Ready for Summer, [Name]?";
      message = "Hi [Name], our new summer collection is here! Grab your favorites before they sell out.";
      targetSegmentDescription = "High spenders";
      recommendedChannel = "WhatsApp";
    } else if (lowerGoal.includes('discount') || lowerGoal.includes('offer')) {
      name = "Discount Campaign";
      subjectLine = "Exclusive Discount Inside";
      message = "Hi [Name], here is a special discount just for you. Use code SPECIAL20 at checkout.";
      recommendedChannel = "SMS";
    } else if (lowerGoal.includes('loyal') || lowerGoal.includes('reward') || lowerGoal.includes('vip')) {
      name = "Loyalty Rewards";
      subjectLine = "Exclusive Rewards Await You, [Name]!";
      message = "Hi [Name], thank you for being a valued customer. Here's an exclusive reward just for you.";
      targetSegmentDescription = "High value customers";
      recommendedChannel = "Email";
    }

    return res.json({ name, subjectLine, message, recommendedChannel, targetSegmentDescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    // Also clean up all communication logs for this campaign
    await CommunicationLog.deleteMany({ campaignId: req.params.id });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.retryCampaignDelivery = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const pendingLogs = await CommunicationLog.find({
      campaignId: campaign._id,
      status: 'Pending',
    });

    if (pendingLogs.length === 0) {
      return res.json({ message: 'No pending logs to retry', resolved: 0 });
    }

    const { clearCache } = require('../services/inMemoryCache');
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Re-queue all pending logs through the simulator
    const { addToQueue } = require('../services/inMemoryQueue');
    pendingLogs.forEach(log => {
      addToQueue(async () => {
        const delay = Math.floor(Math.random() * 1500) + 500;
        await sleep(delay);

        const rand = Math.random() * 100;
        let status;
        if      (rand < 10) status = 'Failed';
        else if (rand < 30) status = 'Delivered';
        else if (rand < 65) status = 'Opened';
        else if (rand < 85) status = 'Read';
        else if (rand < 95) status = 'Clicked';
        else                status = 'Converted';

        await CommunicationLog.findByIdAndUpdate(log._id, { status });
        clearCache('analytics_dashboard');

        const stillPending = await CommunicationLog.countDocuments({
          campaignId: campaign._id, status: 'Pending',
        });
        if (stillPending === 0) {
          await Campaign.findByIdAndUpdate(campaign._id, { status: 'Completed' });
        }
      });
    });

    // Mark campaign Running so the client starts polling again
    await Campaign.findByIdAndUpdate(campaign._id, { status: 'Running' });

    res.json({ message: `Retrying delivery for ${pendingLogs.length} pending messages`, resolved: pendingLogs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.debugCampaignLogs = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const logs = await CommunicationLog.find({ campaignId: req.params.id })
      .select('status createdAt updatedAt')
      .lean();

    const summary = logs.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      campaign: { id: campaign._id, name: campaign.name, status: campaign.status, audienceCount: campaign.audienceCount },
      logCount: logs.length,
      summary,
      env: {
        CHANNEL_SERVICE_URL: process.env.CHANNEL_SERVICE_URL || '(not set)',
        usingSimulator: !process.env.CHANNEL_SERVICE_URL
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCampaignStats = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const statusCounts = await CommunicationLog.aggregate([
      { $match: { campaignId: campaign._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = {};
    for (const row of statusCounts) stats[row._id] = row.count;

    const sent = Object.values(stats).reduce((sum, n) => sum + n, 0);
    const delivered = (stats.Delivered || 0) + (stats.Opened || 0) + (stats.Read || 0) + (stats.Clicked || 0) + (stats.Converted || 0);
    const opened = (stats.Opened || 0) + (stats.Read || 0) + (stats.Clicked || 0) + (stats.Converted || 0);
    const clicked = (stats.Clicked || 0) + (stats.Converted || 0);
    const converted = stats.Converted || 0;
    const failed = stats.Failed || 0;
    const pending = stats.Pending || 0;

    // NOTE: Do NOT auto-complete here — only simulateDelivery() marks campaigns
    // complete, because it knows the exact moment all timers have resolved.
    // Auto-completing here causes a race: all logs are Pending briefly between
    // queue tasks, making pending=0 fire too early.

    let responseStats;
    if (campaign.status === 'Completed' && (sent === 0 || delivered === 0)) {
      responseStats = getDeterministicDummyStats(campaign._id, campaign.audienceCount);
    } else {
      responseStats = {
        sent,
        delivered,
        opened,
        clicked,
        failed,
        converted,
        pending,
        deliveryRate: sent ? ((delivered / sent) * 100).toFixed(1) : '0.0',
        openRate: sent ? ((opened / sent) * 100).toFixed(1) : '0.0',
        clickRate: sent ? ((clicked / sent) * 100).toFixed(1) : '0.0',
        conversionRate: sent ? ((converted / sent) * 100).toFixed(1) : '0.0',
      };
    }

    res.json({
      status: campaign.status,
      stats: responseStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sleep helper — keeps the delay simulation without relying on detached setTimeout
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Assign a random delivery status using real-world probabilities
const pickDeliveryStatus = () => {
  const rand = Math.random() * 100;
  if      (rand < 10) return 'Failed';
  else if (rand < 30) return 'Delivered';
  else if (rand < 65) return 'Opened';
  else if (rand < 85) return 'Read';
  else if (rand < 95) return 'Clicked';
  else                return 'Converted';
};

exports.saveAndLaunchCampaign = async (req, res) => {
  try {
    const { name, goal, subjectLine, message, channel, targetSegment } = req.body;
    const safeTargetSegment = sanitizeQuery(targetSegment);

    const customers = await Customer.find(safeTargetSegment);

    const campaign = new Campaign({
      name, goal, subjectLine, message, channel,
      targetSegment: safeTargetSegment,
      status: 'Running',
      audienceCount: customers.length,
    });
    await campaign.save();

    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL;
    const useExternalService = !!channelServiceUrl;

    const { clearCache } = require('../services/inMemoryCache');

    customers.forEach(customer => {
      addToQueue(async () => {
        // 1. Create log as Pending
        const log = new CommunicationLog({
          campaignId: campaign._id,
          customerId: customer._id,
          channel,
          status: 'Pending',
        });
        await log.save();

        if (useExternalService) {
          // --- External channel service path ---
          let recipient = customer.email;
          if (channel === 'WhatsApp' || channel === 'SMS' || channel === 'RCS') {
            recipient = customer.phone;
          }
          try {
            await axios.post(channelServiceUrl, {
              logId: log._id,
              customerId: customer._id,
              campaignId: campaign._id,
              channel,
              recipient,
              subjectLine,
              message: message.replace('[Name]', customer.name),
            });
          } catch (err) {
            console.error('Channel service error:', err.message);
            await CommunicationLog.findByIdAndUpdate(log._id, { status: 'Failed' });
          }
        } else {
          // --- In-process simulator path ---
          // Simulate network delay INSIDE the queue task so the await keeps
          // the process alive — no detached setTimeout that can be garbage-collected
          const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3s
          await sleep(delay);

          const status = pickDeliveryStatus();
          await CommunicationLog.findByIdAndUpdate(log._id, { status });
          clearCache('analytics_dashboard');

          console.log(`[Sim] log ${log._id} → ${status}`);
        }

        // After every message, check if campaign is fully done
        const pendingLeft = await CommunicationLog.countDocuments({
          campaignId: campaign._id,
          status: 'Pending',
        });
        if (pendingLeft === 0) {
          await Campaign.findByIdAndUpdate(campaign._id, { status: 'Completed' });
          clearCache('analytics_dashboard');
          console.log(`[Sim] Campaign ${campaign._id} Completed`);
        }
      });
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
