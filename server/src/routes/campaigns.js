const express = require('express');
const router = express.Router();
const { getCampaigns, getCampaignStats, deleteCampaign, generateCampaign, saveAndLaunchCampaign } = require('../controllers/campaignController');

router.get('/', getCampaigns);
router.get('/:id/stats', getCampaignStats);
router.delete('/:id', deleteCampaign);
router.post('/generate', generateCampaign);
router.post('/launch', saveAndLaunchCampaign);

module.exports = router;
