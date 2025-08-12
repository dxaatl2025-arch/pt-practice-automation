// scripts/shared/migrationUtils.ts
import * as fs from 'fs';
import * as path from 'path';

export interface MigrationReport {
  scriptName: string;
  startTime: Date;
  endTime?: Date;
  totalRecords: number;
  migratedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  errors: Array<{
    record: any;
    error: string;
    timestamp: Date;
  }>;
}

export class MigrationLogger {
  private report: MigrationReport;
  private csvRows: string[] = [];

  constructor(scriptName: string) {
    this.report = {
      scriptName,
      startTime: new Date(),
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: []
    };
    
    console.log(`🚀 Starting migration: ${scriptName}`);
    this.csvRows.push('Status,LegacyId,NewId,Error,Timestamp');
  }

  public logProgress(current: number, total: number): void {
    const percent = Math.round((current / total) * 100);
    console.log(`📊 Progress: ${current}/${total} (${percent}%)`);
  }

  public logSuccess(legacyId: string, newId: string): void {
    this.report.migratedRecords++;
    this.csvRows.push(`SUCCESS,${legacyId},${newId},,${new Date().toISOString()}`);
  }

  public logSkip(legacyId: string, reason: string = 'Already exists'): void {
    this.report.skippedRecords++;
    this.csvRows.push(`SKIPPED,${legacyId},,${reason},${new Date().toISOString()}`);
  }

  public logError(record: any, error: string): void {
    this.report.errorRecords++;
    this.report.errors.push({
      record,
      error,
      timestamp: new Date()
    });
    const recordId = record && record._id ? record._id.toString() : 'unknown';
    const cleanError = error.replace(/,/g, ';');
    this.csvRows.push(`ERROR,${recordId},,${cleanError},${new Date().toISOString()}`);
    console.error(`❌ Error migrating record ${recordId}:`, error);
  }

  public async finish(): Promise<MigrationReport> {
    this.report.endTime = new Date();
    const duration = this.report.endTime.getTime() - this.report.startTime.getTime();
    
    console.log(`\n✅ Migration completed: ${this.report.scriptName}`);
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📈 Total: ${this.report.totalRecords}`);
    console.log(`✅ Migrated: ${this.report.migratedRecords}`);
    console.log(`⏭️  Skipped: ${this.report.skippedRecords}`);
    console.log(`❌ Errors: ${this.report.errorRecords}`);

    // Write CSV report
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const csvPath = path.join(reportsDir, `${this.report.scriptName}_${timestamp}.csv`);
    fs.writeFileSync(csvPath, this.csvRows.join('\n'));
    console.log(`📄 Report saved: ${csvPath}`);

    // Write JSON summary
    const jsonPath = path.join(reportsDir, `${this.report.scriptName}_summary_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
    console.log(`📋 Summary saved: ${jsonPath}`);

    return this.report;
  }

  public setTotal(total: number): void {
    this.report.totalRecords = total;
  }
}

export interface IdMapInterface {
  set: (mongoId: string, prismaId: string) => void;
  get: (mongoId: string) => string | undefined;
  has: (mongoId: string) => boolean;
  size: () => number;
  entries: () => [string, string][];
}

export function createIdMap(): IdMapInterface {
  const map = new Map<string, string>();
  return {
    set: (mongoId: string, prismaId: string) => map.set(mongoId, prismaId),
    get: (mongoId: string) => map.get(mongoId),
    has: (mongoId: string) => map.has(mongoId),
    size: () => map.size,
    entries: () => Array.from(map.entries())
  };
}

// Helper function to save ID mappings to JSON file
export function saveIdMapping(filename: string, idMap: IdMapInterface): void {
  try {
    const mapData = Object.fromEntries(idMap.entries());
    const filePath = path.join(process.cwd(), 'scripts', filename);
    fs.writeFileSync(filePath, JSON.stringify(mapData, null, 2));
    console.log(`💾 ${filename} saved (${idMap.size()} entries)`);
  } catch (error) {
    console.error(`❌ Failed to save ID mapping ${filename}:`, error);
    throw error;
  }
}