// server/scripts/monitor-cutover.js
const axios = require('axios');

class WindowsCutoverMonitor {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.stats = {
      checks: 0,
      passed: 0,
      failed: 0
    };
  }

  async healthCheck() {
    console.log('🔍 PropertyPulse Health Check');
    console.log('Time:', new Date().toLocaleString());
    
    try {
      // Basic health check
      const health = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      console.log('✅ Health Status:', health.data.status);
      
      if (health.data.database) {
        console.log('📊 Current Database:', health.data.database.current);
      }
      
      // Test Properties API
      const properties = await axios.get(`${this.baseUrl}/api/properties`, { timeout: 5000 });
      const propertyCount = properties.data.data ? properties.data.data.length : 0;
      console.log('✅ Properties API:', propertyCount, 'properties returned');
      
      // Test Users API
      const users = await axios.get(`${this.baseUrl}/api/users`, { timeout: 5000 });
      const userCount = users.data.data ? users.data.data.length : 0;
      console.log('✅ Users API:', userCount, 'users returned');
      
      this.stats.checks++;
      this.stats.passed++;
      
      return {
        healthy: true,
        database: health.data.database?.current,
        properties: propertyCount,
        users: userCount
      };
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.stats.checks++;
      this.stats.failed++;
      
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  async switchDatabase(target) {
    console.log(`🔄 Switching database to: ${target}`);
    
    try {
      const response = await axios.post(`${this.baseUrl}/health/switch-database`, {
        target: target
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      console.log('✅ Database switch successful');
      return true;
    } catch (error) {
      console.error('❌ Database switch failed:', error.message);
      return false;
    }
  }

  async runMonitoring(duration = 5) {
    console.log(`🚀 Starting ${duration}-minute monitoring session`);
    console.log('Platform: Windows');
    console.log('Started:', new Date().toLocaleString());
    console.log('=' .repeat(50));
    
    const startTime = Date.now();
    const endTime = startTime + (duration * 60 * 1000);
    let checkCount = 0;
    
    while (Date.now() < endTime) {
      checkCount++;
      console.log(`\\n--- Check #${checkCount} ---`);
      
      const result = await this.healthCheck();
      
      if (!result.healthy) {
        console.log('🚨 HEALTH CHECK FAILED!');
        if (this.stats.failed >= 3) {
          console.log('💥 Multiple failures detected - recommend rollback');
          console.log('To rollback: npm run cutover:rollback');
          break;
        }
      }
      
      // Wait 30 seconds before next check (except last check)
      if (Date.now() < endTime - 30000) {
        console.log('⏱️ Waiting 30 seconds...');
        await this.sleep(30000);
      }
    }
    
    this.printSummary();
    return this.stats.failed === 0;
  }

  printSummary() {
    console.log('\\n' + '=' .repeat(50));
    console.log('📊 MONITORING SUMMARY');
    console.log('=' .repeat(50));
    console.log('Total Checks:', this.stats.checks);
    console.log('Passed:', this.stats.passed);
    console.log('Failed:', this.stats.failed);
    console.log('Success Rate:', this.stats.checks ? Math.round((this.stats.passed / this.stats.checks) * 100) : 0, '%');
    console.log('Completed:', new Date().toLocaleString());
    
    if (this.stats.failed === 0) {
      console.log('\\n🎉 ALL CHECKS PASSED - CUTOVER SUCCESSFUL!');
    } else {
      console.log('\\n⚠️ Some failures detected - review above');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'health';
  
  const monitor = new WindowsCutoverMonitor();
  
  switch (command) {
    case 'health':
      await monitor.healthCheck();
      break;
      
    case 'monitor':
      const duration = parseInt(args[1]) || 5;
      await monitor.runMonitoring(duration);
      break;
      
    case 'switch-prisma':
      await monitor.switchDatabase('prisma');
      break;
      
    case 'switch-mongo':
      await monitor.switchDatabase('mongo');
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/monitor-cutover.js health');
      console.log('  node scripts/monitor-cutover.js monitor [minutes]');
      console.log('  node scripts/monitor-cutover.js switch-prisma');
      console.log('  node scripts/monitor-cutover.js switch-mongo');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = WindowsCutoverMonitor;