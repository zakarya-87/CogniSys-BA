import { WBSGeneratorAgent } from '../ai-agents/WBSGeneratorAgent';
import { ArtifactAnalyzerAgent } from '../ai-agents/ArtifactAnalyzerAgent';
import { RiskAssessorAgent } from '../ai-agents/RiskAssessorAgent';
import { TaskQueue, TaskStatus } from './TaskQueue';
import { InitiativeService } from './InitiativeService';
import { getAdminDb } from '../lib/firebaseAdmin';

export class TaskWorker {
  private wbsAgent = new WBSGeneratorAgent();
  private analyzerAgent = new ArtifactAnalyzerAgent();
  private riskAgent = new RiskAssessorAgent();
  private initiativeService = new InitiativeService();

  start() {
    console.log('TaskWorker started with Firebase Admin SDK...');
    
    getAdminDb().collection('task_queue')
      .where('status', '==', TaskStatus.PENDING)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const task = change.doc.data();
            const taskId = change.doc.id;
            await this.processTask(taskId, task);
          }
        });
      }, (error) => {
        console.error('TaskWorker snapshot error:', error);
        // Attempt to restart after a delay if it fails
        setTimeout(() => this.start(), 5000);
      });
  }

  private async processTask(taskId: string, task: any) {
    try {
      await TaskQueue.updateTaskStatus(taskId, TaskStatus.PROCESSING);
      
      let result;
      switch (task.type) {
        case 'GENERATE_WBS':
          result = await this.wbsAgent.generateWBS(task.payload.initiative);
          // Update initiative with new WBS
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
      await TaskQueue.updateTaskStatus(taskId, TaskStatus.FAILED, { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}
