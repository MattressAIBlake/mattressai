import express from 'express';
import { auth, db, validateFirebaseIdToken, validateMerchant, validateAdmin } from '../../config/firebase-admin';
import { collections } from '../../config/firebase-admin';

const router = express.Router();

// Merchant Management
router.post('/merchants', validateFirebaseIdToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const merchantData = req.body;
    
    await collections.merchants.doc(uid).set({
      ...merchantData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    await auth.setCustomUserClaims(uid, { role: 'merchant' });
    
    res.status(201).json({ message: 'Merchant created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create merchant' });
  }
});

// Chatbot Configuration
router.post('/merchants/:merchantId/chatbot-config', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const configData = req.body;
    
    await collections.chatbotConfigs.doc(merchantId).set({
      ...configData,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({ message: 'Chatbot config updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chatbot config' });
  }
});

// Leads Management
router.get('/merchants/:merchantId/leads', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const leadsSnapshot = await collections.leads
      .where('merchantId', '==', merchantId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Analytics
router.get('/merchants/:merchantId/analytics', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query;
    
    const analyticsSnapshot = await collections.analytics
      .where('merchantId', '==', merchantId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
    
    const analytics = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Conversations
router.get('/merchants/:merchantId/conversations', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const conversationsSnapshot = await collections.conversations
      .where('merchantId', '==', merchantId)
      .orderBy('lastMessageAt', 'desc')
      .limit(50)
      .get();
    
    const conversations = conversationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Admin Routes
router.get('/admin/merchants', validateFirebaseIdToken, validateAdmin, async (req, res) => {
  try {
    const merchantsSnapshot = await collections.merchants.get();
    const merchants = merchantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(merchants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

router.post('/admin/merchants/:merchantId/status', validateFirebaseIdToken, validateAdmin, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { status } = req.body;
    
    await collections.merchants.doc(merchantId).update({
      status,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({ message: 'Merchant status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update merchant status' });
  }
});

// Merchant Configuration
router.get('/merchant-config', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { uid } = req.user;
    const configDoc = await collections.merchantConfig.doc(uid).get();
    
    if (!configDoc.exists) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }
    
    res.status(200).json(configDoc.data());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch merchant configuration' });
  }
});

router.put('/merchant-config', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { uid } = req.user;
    const configData = req.body;
    
    await collections.merchantConfig.doc(uid).set({
      ...configData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    res.status(200).json({ message: 'Configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

router.put('/merchant-config/branding', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { uid } = req.user;
    const brandingData = req.body;
    
    await collections.merchantConfig.doc(uid).set({
      branding: brandingData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    res.status(200).json({ message: 'Branding updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update branding' });
  }
});

router.put('/merchant-config/chat', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { uid } = req.user;
    const chatConfig = req.body;
    
    await collections.merchantConfig.doc(uid).set({
      chatConfig,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    res.status(200).json({ message: 'Chat configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chat configuration' });
  }
});

router.post('/merchant-config/chat/test', validateFirebaseIdToken, validateMerchant, async (req, res) => {
  try {
    const { uid } = req.user;
    const { message } = req.body;
    
    const configDoc = await collections.merchantConfig.doc(uid).get();
    if (!configDoc.exists) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }
    
    const config = configDoc.data();
    // Here you would implement the actual chat test logic with your AI provider
    // This is a placeholder response
    res.status(200).json({
      success: true,
      response: "Test response from AI",
      metrics: {
        responseTime: 500,
        tokenUsage: 150
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to test chat configuration' });
  }
});

export default router; 