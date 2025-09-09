const activeIntervals = new Map();

/**
 * Start a named interval with try/catch and jitter
 * @param {string} name - Unique name for the interval
 * @param {Function} fn - Function to execute
 * @param {number} ms - Base interval in milliseconds
 * @param {number} jitterPercent - Jitter percentage (0-100), default 10%
 */
function startInterval(name, fn, ms, jitterPercent = 10) {
  if (activeIntervals.has(name)) {
    console.log(`⚠️ Interval '${name}' already running`);
    return;
  }

  const executeWithJitter = async () => {
    try {
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * (ms * jitterPercent / 100);
      const delay = ms + (Math.random() > 0.5 ? jitter : -jitter);
      
      await fn();
      
      // Schedule next execution with jitter
      const timeout = setTimeout(executeWithJitter, delay);
      activeIntervals.set(name, { type: 'timeout', ref: timeout });
      
    } catch (error) {
      console.error(`❌ Error in interval '${name}':`, error);
      
      // Continue running even if there's an error
      const timeout = setTimeout(executeWithJitter, ms + Math.random() * 5000);
      activeIntervals.set(name, { type: 'timeout', ref: timeout });
    }
  };

  // Start immediately
  executeWithJitter();
  
  console.log(`✅ Started interval '${name}' with ${ms}ms base interval`);
  
  return {
    stop: () => stopInterval(name),
    name
  };
}

/**
 * Stop a named interval
 * @param {string} name - Name of the interval to stop
 */
function stopInterval(name) {
  const interval = activeIntervals.get(name);
  if (interval) {
    if (interval.type === 'timeout') {
      clearTimeout(interval.ref);
    } else {
      clearInterval(interval.ref);
    }
    activeIntervals.delete(name);
    console.log(`✅ Stopped interval '${name}'`);
    return true;
  }
  return false;
}

/**
 * Stop all active intervals
 */
function stopAllIntervals() {
  for (const [name] of activeIntervals) {
    stopInterval(name);
  }
  console.log('✅ Stopped all intervals');
}

/**
 * Get list of active interval names
 */
function getActiveIntervals() {
  return Array.from(activeIntervals.keys());
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Graceful shutdown: stopping all intervals...');
  stopAllIntervals();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Graceful shutdown: stopping all intervals...');
  stopAllIntervals();
  process.exit(0);
});

module.exports = {
  startInterval,
  stopInterval,
  stopAllIntervals,
  getActiveIntervals
};