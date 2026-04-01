export interface OperationEntry {
  tool: string;
  target: string;
  params?: Record<string, unknown>;
  success: boolean;
  error?: string;
  timestamp: number;
  duration: number;
}

export class OperationLog {
  private entries: OperationEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  log(entry: OperationEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(this.entries.length - this.maxEntries);
    }
  }

  getRecent(limit: number = 20): OperationEntry[] {
    const start = Math.max(0, this.entries.length - limit);
    return this.entries.slice(start);
  }

  clear(): void {
    this.entries = [];
  }

  getStats(): { total: number; successful: number; failed: number; averageDuration: number } {
    const total = this.entries.length;
    const successful = this.entries.filter((e) => e.success).length;
    const failed = total - successful;
    const averageDuration =
      total > 0
        ? this.entries.reduce((sum, e) => sum + e.duration, 0) / total
        : 0;

    return { total, successful, failed, averageDuration };
  }
}
