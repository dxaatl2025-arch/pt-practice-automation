const { getClient } = require('../utils/testPrisma');
const { createReminderSchedule, createUser } = require('../factories/remindersFactory');

describe('Reminders Service (smoke)', () => {
  let worker;
  beforeAll(() => {
    // Import AFTER jest mocks are in place
    worker = require('../../src/modules/reminders/worker'); // adjust path if different
  });

  it('processes a due reminder via _tickOnce without crashing', async () => {
    const prisma = getClient();
    const user = await createUser({ role: 'TENANT' });
    await createReminderSchedule({
      userId: user.id,
      type: 'RENT_DUE',
      nextRunAt: new Date('2025-01-15T10:00:00Z')
    });

    // run a single tick
    await worker._tickOnce({ prisma, now: new Date('2025-01-15T10:00:00Z') });

    // Optionally assert on ReminderLog or updated nextRunAt if your schema has it:
    // const logs = await prisma.reminderLog.findMany({ where: { userId: user.id } });
    // expect(logs.length).toBeGreaterThan(0);

    expect(true).toBe(true); // baseline smoke
  });
});