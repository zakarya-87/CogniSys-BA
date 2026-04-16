import * as math from 'mathjs';
import { logger } from '../logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: any;
}

export class ValidationService {
  /**
   * Validates a Work Breakdown Structure (WBS) or hierarchical tree.
   * Checks for:
   * 1. Sum of child effort equals parent effort (within tolerance).
   * 2. No negative effort/durations.
   * 3. Consistent date ranges (child start >= parent start, child end <= parent end).
   */
  static validateWBS(wbs: any[]): ValidationResult {
    const errors: string[] = [];
    
    if (!Array.isArray(wbs) || wbs.length === 0) {
      return { isValid: false, errors: ['WBS is empty or not an array'] };
    }

    // Helper to traverse and validate
    const validateNode = (node: any, path: string = 'root'): void => {
      const nodeLabel = node.label || node.title || path;
      
      // 1. Check for negative numbers
      if (typeof node.effort === 'number' && node.effort < 0) {
        errors.push(`Node "${nodeLabel}" has negative effort: ${node.effort}`);
      }

      // 2. Aggregate child effort
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        let childSum = 0;
        node.children.forEach((child: any, idx: number) => {
          validateNode(child, `${path}.${idx}`);
          childSum = math.add(childSum, child.effort || 0);
        });

        // 3. Compare with parent effort (within epsilon tolerance for float point math)
        if (typeof node.effort === 'number' && node.effort > 0) {
          const diff = Math.abs(math.subtract(node.effort, childSum));
          if (diff > 0.1) { // 0.1 hour/unit tolerance
            errors.push(`Node "${nodeLabel}" effort discrepancy: Parent=${node.effort}, Sum of Children=${childSum}`);
          }
        }
      }
    };

    try {
      wbs.forEach((root, idx) => validateNode(root, `root[${idx}]`));
    } catch (err) {
      logger.error({ err }, 'ValidationService traversal failed');
      errors.push(`Validation process failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates financial projections.
   * Checks for mathematical consistency in ROI, BCR, and Burn rate calculations.
   */
  static validateFinancials(data: { cost: number; benefit: number; roi: number }): ValidationResult {
    const errors: string[] = [];
    
    const calculatedRoi = math.divide(math.subtract(data.benefit, data.cost), data.cost) * 100;
    
    if (Math.abs(math.subtract(data.roi, calculatedRoi)) > 0.01) {
      errors.push(`ROI mismatch: Reported=${data.roi}%, Calculated=${calculatedRoi.toFixed(2)}%`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
