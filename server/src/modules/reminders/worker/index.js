// reminders worker (minimal controller pattern)
const RemindersService = require('../service/remindersService');

let __cronJob = null;

async function _tickOnce({ prisma, now = new Date() }) {
  // EXISTING business logic for: find due ReminderSchedule, enqueue/send reminders,
  // write ReminderLog, update nextRunAt, etc. Use provided `prisma` instead of importing a global singleton if feasible.
  try {
    console.log('🔔 Processing due reminders...');
    
    const remindersService = new RemindersService();
    const dueReminders = await remindersService.selectDueReminders(now);
    
    if (dueReminders.length === 0) {
      console.log('✅ No reminders due at this time');
      return;
    }

    console.log(`📧 Found ${dueReminders.length} due reminders`);

    const results = await remindersService.dispatchEmails(dueReminders);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`✅ Processed ${results.length} reminders: ${successCount} sent, ${failureCount} failed`);

    if (failureCount > 0) {
      const failed = results.filter(r => !r.success);
      console.log('❌ Failed reminders:', failed.map(f => ({ id: f.id, error: f.error })));
    }

  } catch (error) {
    console.error('❌ Error processing reminders:', error);
  }
}

function startReminders({ cron = process.env.REMINDERS_CRON || '*/5 * * * *' } = {}) {
  if (__cronJob) return __cronJob; // already started
  // If using node-cron:
  const cronLib = require('node-cron');
  __cronJob = cronLib.schedule(cron, () => {
    _tickOnce({}); // use default prisma/global
  });
  __cronJob.start?.();
  console.log('✅ Reminders worker started with cron:', cron);
  return __cronJob;
}

async function stopReminders() {
  if (__cronJob && __cronJob.stop) __cronJob.stop();
  __cronJob = null;
  console.log('🛑 Reminders worker stopped');
}

// Auto-start in prod/dev only (NEVER in tests)
if (process.env.NODE_ENV !== 'test' && String(process.env.REMINDERS_ENABLED).trim() === 'true') {
  startReminders({});
}

// Legacy exports for compatibility
const RemindersWorker = class {
  constructor() {
    this.remindersService = new RemindersService();
    this.isRunning = false;
  }

  start() {
    return startReminders();
  }

  stop() {
    return stopReminders();
  }

  async processReminders() {
    return _tickOnce({});
  }
};

function startRemindersWorker() {
  return startReminders();
}

function stopRemindersWorker() {
  return stopReminders();
}

module.exports = { 
  startReminders, 
  stopReminders, 
  _tickOnce,
  // Legacy exports for backward compatibility
  RemindersWorker,
  startRemindersWorker,
  stopRemindersWorker
};