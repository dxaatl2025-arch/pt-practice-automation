// Reminders Service Tests
const RemindersService = require('../../src/modules/reminders/service/remindersService');
const bcrypt = require('bcrypt');

describe('Reminders Service', () => {
  let remindersService;
  let landlord, tenant, property, lease;

  beforeEach(async () => {
    remindersService = new RemindersService();
    
    // Clear mocks
    testUtils.getEmailMock().clearSentEmails();
    
    // Create test data
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    landlord = await testPrisma.user.create({
      data: testUtils.generateUser({
        email: 'landlord@test.com',
        password: hashedPassword,
        role: 'LANDLORD'
      })
    });

    tenant = await testPrisma.user.create({
      data: testUtils.generateUser({
        email: 'tenant@test.com',
        password: hashedPassword,
        role: 'TENANT'
      })
    });

    property = await testPrisma.property.create({
      data: testUtils.generateProperty(landlord.id, {
        title: 'Test Rental Property'
      })
    });

    lease = await testPrisma.lease.create({
      data: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        monthlyRent: 1200,
        securityDeposit: 1200,
        status: 'ACTIVE',
        propertyId: property.id,
        tenantId: tenant.id
      }
    });
  });

  describe('selectDueReminders()', () => {
    it('should return reminders that are due', async () => {
      // Create a reminder due 1 hour ago
      const pastTime = testUtils.addHours(new Date(), -1);
      await testPrisma.reminderSchedule.create({
        data: {
          userId: tenant.id,
          kind: 'RENT_DUE',
          nextRunAt: pastTime,
          meta: {
            leaseId: lease.id,
            amount: 1200,
            dueDate: '2024-04-01'
          }
        }
      });

      // Create a reminder due in the future
      const futureTime = testUtils.addHours(new Date(), 1);
      await testPrisma.reminderSchedule.create({
        data: {
          userId: tenant.id,
          kind: 'RENT_DUE',
          nextRunAt: futureTime,
          meta: {
            leaseId: lease.id,
            amount: 1200,
            dueDate: '2024-05-01'
          }
        }
      });

      const dueReminders = await remindersService.selectDueReminders(new Date());
      
      expect(dueReminders).toHaveLength(1);
      expect(dueReminders[0].kind).toBe('RENT_DUE');
      expect(dueReminders[0].nextRunAt.getTime()).toBeLessThan(Date.now());
    });

    it('should include user information', async () => {
      const pastTime = testUtils.addHours(new Date(), -1);
      await testPrisma.reminderSchedule.create({
        data: {
          userId: tenant.id,
          kind: 'RENT_DUE',
          nextRunAt: pastTime,
          meta: { leaseId: lease.id, amount: 1200 }
        }
      });

      const dueReminders = await remindersService.selectDueReminders(new Date());
      
      expect(dueReminders[0].user).toBeDefined();
      expect(dueReminders[0].user.email).toBe(tenant.email);
      expect(dueReminders[0].user.firstName).toBe(tenant.firstName);
    });
  });

  describe('dispatchEmails()', () => {
    it('should send rent due reminder email', async () => {
      const reminder = {
        id: 'reminder123',
        kind: 'RENT_DUE',
        user: {
          id: tenant.id,
          email: tenant.email,
          firstName: tenant.firstName
        },
        meta: {
          leaseId: lease.id,
          amount: 1200,
          dueDate: '2024-04-01'
        }
      };

      const results = await remindersService.dispatchEmails([reminder]);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);

      // Verify email was sent
      const emailMock = testUtils.getEmailMock();
      expect(emailMock.getEmailCount()).toBe(1);
      
      const sentEmail = emailMock.getLastEmail();
      expect(sentEmail.to).toBe(tenant.email);
      expect(sentEmail.subject).toContain('Rent Due');
      expect(sentEmail.html).toContain('Test Rental Property');
      expect(sentEmail.html).toContain('$1,200');
    });

    it('should send rent late reminder email', async () => {
      const reminder = {
        id: 'reminder123',
        kind: 'RENT_LATE',
        user: {
          id: tenant.id,
          email: tenant.email,
          firstName: tenant.firstName
        },
        meta: {
          leaseId: lease.id,
          amount: 1200,
          dueDate: '2024-03-01'
        }
      };

      const results = await remindersService.dispatchEmails([reminder]);
      
      expect(results[0].success).toBe(true);

      const sentEmail = testUtils.getEmailMock().getLastEmail();
      expect(sentEmail.subject).toContain('OVERDUE');
      expect(sentEmail.html).toContain('overdue');
    });

    it('should send payment receipt email', async () => {
      // Create a payment first
      const payment = await testPrisma.payment.create({
        data: {
          amount: 1200,
          dueDate: new Date('2024-03-01'),
          paidDate: new Date('2024-02-28'),
          status: 'PAID',
          type: 'RENT',
          leaseId: lease.id,
          tenantId: tenant.id
        }
      });

      const reminder = {
        id: 'reminder123',
        kind: 'PAYMENT_RECEIPT',
        user: {
          id: tenant.id,
          email: tenant.email,
          firstName: tenant.firstName
        },
        meta: {
          paymentId: payment.id
        }
      };

      const results = await remindersService.dispatchEmails([reminder]);
      
      expect(results[0].success).toBe(true);

      const sentEmail = testUtils.getEmailMock().getLastEmail();
      expect(sentEmail.subject).toContain('Payment Receipt');
      expect(sentEmail.html).toContain('Payment Received');
      expect(sentEmail.html).toContain('$1,200');
    });

    it('should handle email failures gracefully', async () => {
      // Make email service fail
      testUtils.getEmailMock().setShouldFail(true, 'Mock email error');

      const reminder = {
        id: 'reminder123',
        kind: 'RENT_DUE',
        user: {
          id: tenant.id,
          email: tenant.email,
          firstName: tenant.firstName
        },
        meta: {
          leaseId: lease.id,
          amount: 1200
        }
      };

      const results = await remindersService.dispatchEmails([reminder]);
      
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Mock email error');

      // Reset mock
      testUtils.getEmailMock().setShouldFail(false);
    });
  });

  describe('scheduleNext()', () => {
    it('should schedule next monthly rent reminder', async () => {
      const now = new Date('2024-03-15T10:00:00Z');
      const reminder = await testPrisma.reminderSchedule.create({
        data: {
          userId: tenant.id,
          kind: 'RENT_DUE',
          nextRunAt: now,
          meta: { leaseId: lease.id, amount: 1200 }
        }
      });

      await remindersService.scheduleNext(reminder);

      const updatedReminder = await testPrisma.reminderSchedule.findUnique({
        where: { id: reminder.id }
      });

      expect(updatedReminder.nextRunAt.getMonth()).toBe(now.getMonth() + 1);
    });

    it('should schedule next weekly late rent reminder', async () => {
      const now = new Date('2024-03-15T10:00:00Z');
      const reminder = await testPrisma.reminderSchedule.create({
        data: {
          userId: tenant.id,
          kind: 'RENT_LATE',
          nextRunAt: now,
          meta: { leaseId: lease.id, amount: 1200 }
        }
      });

      await remindersService.scheduleNext(reminder);

      const updatedReminder = await testPrisma.reminderSchedule.findUnique({
        where: { id: reminder.id }
      });

      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 7);
      
      expect(updatedReminder.nextRunAt.getDate()).toBe(expectedDate.getDate());
    });

    it('should delete one-time reminders', async () => {
      const reminder = await testPrisma.reminderSchedule.create({
        data: {
          userId: tenant.id,
          kind: 'PAYMENT_RECEIPT',
          nextRunAt: new Date(),
          meta: { paymentId: 'payment123' }
        }
      });

      await remindersService.scheduleNext(reminder);

      const deletedReminder = await testPrisma.reminderSchedule.findUnique({
        where: { id: reminder.id }
      });

      expect(deletedReminder).toBeNull();
    });
  });

  describe('createReminder()', () => {
    it('should create new reminder', async () => {
      const nextRunAt = testUtils.addDays(new Date(), 1);
      const meta = { leaseId: lease.id, amount: 1200 };

      const reminder = await remindersService.createReminder(
        tenant.id,
        'RENT_DUE',
        nextRunAt,
        meta
      );

      expect(reminder.userId).toBe(tenant.id);
      expect(reminder.kind).toBe('RENT_DUE');
      expect(reminder.meta).toEqual(meta);
      expect(reminder.nextRunAt.getTime()).toBe(nextRunAt.getTime());

      // Verify it was saved to database
      const dbReminder = await testPrisma.reminderSchedule.findUnique({
        where: { id: reminder.id }
      });
      expect(dbReminder).toBeTruthy();
    });
  });

  describe('Integration Test - Full Flow', () => {
    it('should process complete reminder workflow', async () => {
      // Create a due reminder
      const pastTime = testUtils.addHours(new Date(), -1);
      const reminder = await testPrisma.reminderSchedule.create({
        data: {
          userId: tenant.id,
          kind: 'RENT_DUE',
          nextRunAt: pastTime,
          meta: {
            leaseId: lease.id,
            amount: 1200,
            dueDate: '2024-04-01'
          }
        }
      });

      // Select due reminders
      const dueReminders = await remindersService.selectDueReminders(new Date());
      expect(dueReminders).toHaveLength(1);

      // Dispatch emails
      const results = await remindersService.dispatchEmails(dueReminders);
      expect(results[0].success).toBe(true);

      // Verify email was sent
      const emailMock = testUtils.getEmailMock();
      expect(emailMock.getEmailCount()).toBe(1);
      expect(emailMock.getLastEmail().to).toBe(tenant.email);

      // Verify next reminder was scheduled
      const updatedReminder = await testPrisma.reminderSchedule.findUnique({
        where: { id: reminder.id }
      });
      expect(updatedReminder.nextRunAt.getTime()).toBeGreaterThan(Date.now());
    });
  });
});