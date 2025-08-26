const repositoryFactory = require('../repositories/factory');

class FeedbackController {
  constructor() {
    this.feedbackRepo = repositoryFactory.getFeedbackRepository();
    console.log('👍 FeedbackController initialized');
  }

  createFeedback = async (req, res) => {
    try {
      const feedback = await this.feedbackRepo.create({
        fromUserId: req.user.id,
        ...req.body
      });
      res.status(201).json({ 
        success: true, 
        data: feedback,
        message: 'Feedback submitted successfully'
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  getFeedback = async (req, res) => {
    try {
      const { userId = req.user.id, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const result = await this.feedbackRepo.findByUserId(userId, { skip, limit });
      res.json({ 
        success: true, 
        data: result.feedback, 
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new FeedbackController();