const repositoryFactory = require('../repositories/factory');

class PropertyMatchProfileController {
  constructor() {
    this.propertyMatchProfileRepo = repositoryFactory.getPropertyMatchProfileRepository();
    this.propertyRepo = repositoryFactory.getPropertyRepository();
    console.log('🏠 PropertyMatchProfileController initialized');
  }

  getProfile = async (req, res) => {
    try {
      const { propertyId } = req.params;
      
      // Verify property ownership
      const property = await this.propertyRepo.findById(propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      const profile = await this.propertyMatchProfileRepo.findByPropertyId(propertyId);
      res.json({ success: true, data: profile });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  updateProfile = async (req, res) => {
    try {
      const { propertyId } = req.params;
      
      // Verify property ownership
      const property = await this.propertyRepo.findById(propertyId);
      if (!property || property.landlordId !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      const profile = await this.propertyMatchProfileRepo.upsert(propertyId, req.body);
      res.json({ 
        success: true, 
        data: profile,
        message: 'Match profile updated successfully'
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PropertyMatchProfileController();