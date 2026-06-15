const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const CommunicationLog = require('../models/CommunicationLog');
const { generateCampaignContent } = require('../services/aiService');
const { sanitizeQuery } = require('../utils/querySanitizer');
const { addToQueue } = require('../services/inMemoryQueue');
const axios = require('axios');

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

      return {
        ...campaign,
        stats: {
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
        },
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
        usingSimulator: !process.env.CHANNEL_SERVICE_URL || 
          process.env.CHANNEL_SERVICE_URL.includes('localhost') || 
          process.env.CHANNEL_SERVICE_URL.includes('127.0.0.1')
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

    res.json({
      status: campaign.status,
      stats: {
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Simulate delivery locally — same probability logic as the channel service
// Used as fallback when CHANNEL_SERVICE_URL is not set (avoids localhost calls in production)
const simulateDelivery = (logId) => {
  const delay = Math.floor(Math.random() * 3000) + 2000;

  setTimeout(async () => {
    const rand = Math.random() * 100;
    let status;
    if      (rand < 10) status = 'Failed';
    else if (rand < 30) status = 'Delivered';
    else if (rand < 65) status = 'Opened';
    else if (rand < 85) status = 'Read';
    else if (rand < 95) status = 'Clicked';
    else                status = 'Converted';

    try {
      // Update this log's status
      const updatedLog = await CommunicationLog.findByIdAndUpdate(
        logId,
        { status },
        { returnDocument: 'after' }
      );

      if (!updatedLog) return;

      // Clear analytics cache so dashboard reflects new data
      const { clearCache } = require('../services/inMemoryCache');
      clearCache('analytics_dashboard');

      // Check if all logs for this campaign are resolved (no more Pending)
      const pendingCount = await CommunicationLog.countDocuments({
        campaignId: updatedLog.campaignId,
        status: 'Pending',
      });

      if (pendingCount === 0) {
        await Campaign.findByIdAndUpdate(updatedLog.campaignId, { status: 'Completed' });
        console.log(`[Simulator] Campaign ${updatedLog.campaignId} marked Completed`);
      }
    } catch (err) {
      console.error('[Simulator] Failed to update log:', err.message);
    }
  }, delay);
};

exports.saveAndLaunchCampaign = async (req, res) => {
  try {
    const { name, goal, subjectLine, message, channel, targetSegment } = req.body;
    const safeTargetSegment = sanitizeQuery(targetSegment);
    
    // Find audience
    const customers = await Customer.find(safeTargetSegment);

    const campaign = new Campaign({
      name, goal, subjectLine, message, channel, targetSegment: safeTargetSegment,
      status: 'Running', audienceCount: customers.length
    });
    await campaign.save();

    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL;
    // Only use external channel service if URL is set AND doesn't point to localhost
    const useExternalService = channelServiceUrl && 
      !channelServiceUrl.includes('localhost') && 
      !channelServiceUrl.includes('127.0.0.1');

    // Offload to background queue
    customers.forEach(customer => {
      addToQueue(async () => {
        const log = new CommunicationLog({
          campaignId: campaign._id,
          customerId: customer._id,
          channel,
          status: 'Pending'
        });
        await log.save();

        let recipient = customer.email;
        if (channel === 'WhatsApp' || channel === 'SMS' || channel === 'RCS') {
          recipient = customer.phone;
        }

        if (useExternalService) {
          // External channel service is configured — use it
          try {
            await axios.post(channelServiceUrl, {
              logId: log._id,
              customerId: customer._id,
              campaignId: campaign._id,
              channel,
              recipient,
              subjectLine,
              message: message.replace('[Name]', customer.name)
            });
          } catch (err) {
            await CommunicationLog.findByIdAndUpdate(log._id, { status: 'Failed' });
            console.error('Failed to send to channel service:', err.message);
          }
        } else {
          // No external channel service — simulate delivery in-process
          simulateDelivery(log._id);
        }
      });
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
