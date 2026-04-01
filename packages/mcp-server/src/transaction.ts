import { VersionControl } from "./version-control.js";

export interface TransactionOperation {
  type: string;
  description: string;
  timestamp: number;
}

export interface TransactionInfo {
  label: string;
  operations: TransactionOperation[];
  startedAt: number;
}

export interface TransactionManagerOptions {
  autoSave?: boolean;
  versionControl?: VersionControl;
}

export class TransactionManager {
  private current: TransactionInfo | null = null;
  private autoSave: boolean;
  private versionControl: VersionControl | null;

  constructor(options: TransactionManagerOptions = {}) {
    this.autoSave = options.autoSave ?? false;
    this.versionControl = options.versionControl ?? null;
  }

  setAutoSave(enabled: boolean): void {
    this.autoSave = enabled;
  }

  setVersionControl(vc: VersionControl): void {
    this.versionControl = vc;
  }

  begin(label: string): TransactionInfo {
    if (this.current !== null) {
      throw new Error(
        `A transaction is already in progress: "${this.current.label}". ` +
          "Nested transactions are not supported. Commit or rollback first.",
      );
    }

    this.current = {
      label,
      operations: [],
      startedAt: Date.now(),
    };

    return { ...this.current };
  }

  addOperation(type: string, description: string): void {
    if (this.current === null) {
      throw new Error("No active transaction. Call begin() first.");
    }

    this.current.operations.push({
      type,
      description,
      timestamp: Date.now(),
    });
  }

  async commit(): Promise<{
    label: string;
    operationCount: number;
    saved: boolean;
    saveId?: string;
  }> {
    if (this.current === null) {
      throw new Error("No active transaction to commit.");
    }

    const label = this.current.label;
    const operationCount = this.current.operations.length;
    this.current = null;

    let saved = false;
    let saveId: string | undefined;

    if (this.autoSave && this.versionControl) {
      try {
        const saveInfo = await this.versionControl.save(`Transaction: ${label}`);
        saved = true;
        saveId = saveInfo.id;
      } catch {
        // Auto-save failed (e.g., no changes), that is acceptable
      }
    }

    return { label, operationCount, saved, saveId };
  }

  rollback(): {
    label: string;
    operationsRolledBack: number;
    operations: TransactionOperation[];
  } {
    if (this.current === null) {
      throw new Error("No active transaction to rollback.");
    }

    const label = this.current.label;
    const operations = [...this.current.operations];
    this.current = null;

    return {
      label,
      operationsRolledBack: operations.length,
      operations,
    };
  }

  isActive(): boolean {
    return this.current !== null;
  }

  getTransaction(): TransactionInfo | null {
    if (this.current === null) {
      return null;
    }
    return { ...this.current, operations: [...this.current.operations] };
  }
}
