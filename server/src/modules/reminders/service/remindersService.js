const prisma = require('../../../config/prisma');
const { sendEmail } = require('../../../utils/email');

class RemindersService {

  /**
   * Select reminders that are due to run
   */
  async selectDueReminders(now = new Date()) {
    return await prisma.reminderSchedule.findMany({
      where: {
        nextRunAt: {
          lte: now
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        nextRunAt: 'asc'
      },
      take: 50 // Process in batches
    });
  }

  /**
   * Dispatch reminder emails
   */
  async dispatchEmails(reminders) {
    const results = [];
    
    for (const reminder of reminders) {
      try {
        let emailSent = false;
        
        switch (reminder.type) {
          case 'RENT_DUE':
            emailSent = await this.sendRentDueReminder(reminder);
            break;
          case 'RENT_LATE':
            emailSent = await this.sendRentLateReminder(reminder);
            break;
          case 'PAYMENT_RECEIPT':
            emailSent = await this.sendPaymentReceipt(reminder);
            break;
          case 'LEASE_RENEWAL':
            emailSent = await this.sendLeaseRenewalReminder(reminder);
            break;
          default:
            console.log(`⚠️ Unknown reminder type: ${reminder.type}`);
        }
        
        if (emailSent) {
          // Schedule next occurrence or mark as complete
          await this.scheduleNext(reminder);
        }
        
        results.push({ id: reminder.id, success: emailSent });
        
      } catch (error) {
        console.error(`❌ Failed to process reminder ${reminder.id}:`, error);
        results.push({ id: reminder.id, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Send rent due reminder email
   */
  async sendRentDueReminder(reminder) {
    const { leaseId, amount, dueDate } = reminder.meta || {};
    
    if (!leaseId) {
      console.log('⚠️ Rent due reminder missing lease info');
      return false;
    }

    // Get lease details
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          select: { title: true, addressStreet: true }
        }
      }
    });

    if (!lease) {
      console.log('⚠️ Lease not found for reminder');
      return false;
    }

    const subject = `Rent Due: ${lease.property.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Rent Payment Due</h2>
        <p>Dear ${reminder.user.firstName},</p>
        
        <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Property:</strong> ${lease.property.title}</p>
          <p><strong>Address:</strong> ${lease.property.addressStreet}</p>
          <p><strong>Amount Due:</strong> $${(amount || lease.monthlyRent).toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${new Date(dueDate || Date.now()).toLocaleDateString()}</p>
        </div>
        
        <p>Please ensure your rent payment is submitted by the due date to avoid late fees.</p>
        <p>Log in to your PropertyPulse account to make a payment or contact your landlord.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>PropertyPulse - Rental Management Made Simple</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: reminder.user.email,
      subject,
      html
    });

    console.log(`✅ Sent rent due reminder to ${reminder.user.email}`);
    return true;
  }

  /**
   * Send rent late reminder email
   */
  async sendRentLateReminder(reminder) {
    const { leaseId, amount, dueDate } = reminder.meta || {};

    // Similar structure to rent due but with late notice styling
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          select: { title: true, addressStreet: true }
        }
      }
    });

    if (!lease) return false;

    const subject = `OVERDUE: Rent Payment - ${lease.property.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Overdue Rent Payment</h2>
        <p>Dear ${reminder.user.firstName},</p>
        
        <div style="background: #fef2f2; border: 1px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>NOTICE:</strong> Your rent payment is now overdue.</p>
          <p><strong>Property:</strong> ${lease.property.title}</p>
          <p><strong>Amount Due:</strong> $${(amount || lease.monthlyRent).toLocaleString()}</p>
          <p><strong>Original Due Date:</strong> ${new Date(dueDate || Date.now()).toLocaleDateString()}</p>
        </div>
        
        <p>Please submit your payment immediately to avoid additional late fees and potential legal action.</p>
        <p>Contact your landlord immediately if you have any questions.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>PropertyPulse - Rental Management Made Simple</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: reminder.user.email,
      subject,
      html
    });

    console.log(`✅ Sent rent late reminder to ${reminder.user.email}`);
    return true;
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(reminder) {
    const { paymentId } = reminder.meta || {};

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: {
            property: {
              select: { title: true, addressStreet: true }
            }
          }
        }
      }
    });

    if (!payment) return false;

    const subject = `Payment Receipt - ${payment.lease.property.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Received</h2>
        <p>Dear ${reminder.user.firstName},</p>
        
        <div style="background: #ecfdf5; border: 1px solid #059669; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Thank you!</strong> Your payment has been received.</p>
          <p><strong>Property:</strong> ${payment.lease.property.title}</p>
          <p><strong>Amount:</strong> $${payment.amount.toLocaleString()}</p>
          <p><strong>Payment Date:</strong> ${payment.paidDate.toLocaleDateString()}</p>
          <p><strong>Reference:</strong> ${payment.id}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>PropertyPulse - Rental Management Made Simple</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: reminder.user.email,
      subject,
      html
    });

    console.log(`✅ Sent payment receipt to ${reminder.user.email}`);
    return true;
  }

  /**
   * Send lease renewal reminder (placeholder)
   */
  async sendLeaseRenewalReminder(reminder) {
    // TODO: Implement lease renewal logic
    console.log(`📝 TODO: Lease renewal reminder for ${reminder.user.email}`);
    return true;
  }

  /**
   * Schedule next reminder or mark complete
   */
  async scheduleNext(reminder) {
    switch (reminder.kind) {
      case 'RENT_DUE':
        // Schedule for next month
        const nextMonth = new Date(reminder.nextRunAt);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        await prisma.reminderSchedule.update({
          where: { id: reminder.id },
          data: { nextRunAt: nextMonth }
        });
        break;

      case 'RENT_LATE':
        // Schedule for next week (escalation)
        const nextWeek = new Date(reminder.nextRunAt);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        await prisma.reminderSchedule.update({
          where: { id: reminder.id },
          data: { nextRunAt: nextWeek }
        });
        break;

      case 'PAYMENT_RECEIPT':
      case 'LEASE_RENEWAL':
        // One-time reminders - delete after sending
        await prisma.reminderSchedule.delete({
          where: { id: reminder.id }
        });
        break;
    }
  }

  /**
   * Create a new reminder schedule
   */
  async createReminder(userId, kind, nextRunAt, meta = {}) {
    return await prisma.reminderSchedule.create({
      data: {
        userId,
        kind,
        nextRunAt: new Date(nextRunAt),
        meta
      }
    });
  }
}

module.exports = RemindersService;