const repositoryFactory = require('../repositories/factory');

class TenantProfileController {
  constructor() {
    this.tenantProfileRepo = repositoryFactory.getTenantProfileRepository();
    console.log('👤 TenantProfileController initialized');
  }

  getProfile = async (req, res) => {
    try {
      // Debug logging
      console.log('🔍 getProfile - req.user:', req.user);
      console.log('🔍 getProfile - req.user.id:', req.user?.id);
      
      if (!req.user || !req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'User ID not found in request',
          debug: { user: req.user }
        });
      }

      const profile = await this.tenantProfileRepo.findByUserId(req.user.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('❌ getProfile error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  updateProfile = async (req, res) => {
    try {
      // Debug logging
      console.log('🔍 updateProfile - req.user:', req.user);
      console.log('🔍 updateProfile - req.user.id:', req.user?.id);
      console.log('🔍 updateProfile - req.body:', req.body);
      
      if (!req.user || !req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'User ID not found in request',
          debug: { user: req.user }
        });
      }

      const profile = await this.tenantProfileRepo.upsert(req.user.id, req.body);
      res.json({ 
        success: true, 
        data: profile,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('❌ updateProfile error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new TenantProfileController();