import { WBSGeneratorAgent } from '../ai-agents/WBSGeneratorAgent';
import { ArtifactAnalyzerAgent } from '../ai-agents/ArtifactAnalyzerAgent';
import { RiskAssessorAgent } from '../ai-agents/RiskAssessorAgent';
import { TaskQueue, TaskStatus } from './TaskQueue';
import { InitiativeService } from './InitiativeService';
import { getAdminDb } from '../lib/firebaseAdmin';

const MAX_CONCURRENT_TASKS = 5;
const RETRY_DELAY_MS = 5_000;

export class TaskWorker {
  private wbsAgent = new WBSGeneratorAgent();
  private analyzerAgent = new ArtifactAnalyzerAgent();
  private riskAgent = new RiskAssessorAgent();
  private initiativeService = new InitiativeService();

  /** Number of AI agents currently running */
  private activeCount = 0;
  /** Tasks waiting for a free slot */
  private pending: Array<{ taskId: string; task: any }> = [];

  start() {
    console.log(`TaskWorker started (max ${MAX_CONCURRENT_TASKS} concurrent jobs)...`);

    getAdminDb().collection('task_queue')
      .where('status', '==', TaskStatus.PENDING)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const task = change.doc.data();
            const taskId = change.doc.id;
            this.enqueue(taskId, task);
          }
        });
      }, (error) => {
        console.error('TaskWorker snapshot error:', error);
        setTimeout(() => this.start(), RETRY_DELAY_MS);
      });
  }

  private enqueue(taskId: string, task: any) {
    if (this.activeCount < MAX_CONCURRENT_TASKS) {
      this.run(taskId, task);
    } else {
      this.pending.push({ taskId, task });
    }
  }

  private drain() {
    if (this.pending.length > 0 && this.activeCount < MAX_CONCURRENT_TASKS) {
      const next = this.pending.shift()!;
      this.run(next.taskId, next.task);
    }
  }

  private run(taskId: string, task: any) {
    this.activeCount++;
    this.processTask(taskId, task).finally(() => {
      this.activeCount--;
      this.drain();
    });
  }

  private async processTask(taskId: string, task: any) {
    try {
      await TaskQueue.updateTaskStatus(taskId, TaskStatus.PROCESSING);
      
      let result;
      switch (task.type) {
        case 'GENERATE_WBS':
          result = await this.wbsAgent.generateWBS(task.payload.initiative);
          await this.initiativeService.updateInitiative(
            task.payload.initiative.id, 
            { wbs: result }, 
            task.orgId, 
            'SYSTEM_AI'
          );
          break;
        
        case 'ANALYZE_ARTIFACT':
          result = await this.analyzerAgent.analyzeArtifact(task.payload.content, task.payload.artifactType);
          break;

        case 'ASSESS_RISKS':
          result = await this.riskAgent.assessRisks(task.payload.initiative, task.payload.wbs);
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      await TaskQueue.updateTaskStatus(taskId, TaskStatus.COMPLETED, result);
    } catch (error) {
      console.error(`Task ${taskId} failed:`, error);
      await TaskQueue.updateTaskStatus(taskId, TaskStatus.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
