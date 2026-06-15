import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export const getAnalytics = () => axios.get(`${API_URL}/analytics`);
export const getCustomers = () => axios.get(`${API_URL}/customers`);
export const addCustomer = (data) => axios.post(`${API_URL}/customers`, data);
export const updateCustomer = (id, data) => axios.put(`${API_URL}/customers/${id}`, data);
export const deleteCustomer = (id) => axios.delete(`${API_URL}/customers/${id}`);
export const getCampaigns = () => axios.get(`${API_URL}/campaigns`);
export const getCampaignStats = (id) => axios.get(`${API_URL}/campaigns/${id}/stats`);
export const deleteCampaign = (id) => axios.delete(`${API_URL}/campaigns/${id}`);

export const buildSegment = (prompt) => axios.post(`${API_URL}/segments/build`, { prompt });
export const generateCampaignContent = (goal) => axios.post(`${API_URL}/campaigns/generate`, { goal });
export const launchCampaign = (campaignData) => axios.post(`${API_URL}/campaigns/launch`, campaignData);

export const generateDemoData = () => axios.post(`${API_URL}/demo/generate`, null, { timeout: 120000 });
export const clearAnalyticsCache = () => axios.delete(`${API_URL}/analytics/cache`);
