
import { Member, Task, AutomationRule } from '../types';

/**
 * Checks if a member's stage change triggers any automation rules.
 * Returns a list of new tasks to be created.
 */
export const checkAutomationRules = (
    member: Member, 
    rules: AutomationRule[], 
    assigneeId: string
): Task[] => {
    // Find rules that match the new stage
    const matchingRules = rules.filter(r => r.enabled && r.stageId === member.currentStageId);
    
    if (matchingRules.length === 0) return [];

    return matchingRules.map(rule => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + rule.daysDue);
        
        return {
            id: `auto-task-${Date.now()}-${rule.id}-${Math.random().toString(36).substr(2, 5)}`,
            memberId: member.id,
            description: rule.taskDescription,
            dueDate: dueDate.toISOString().split('T')[0],
            priority: rule.priority,
            completed: false,
            assignedToId: assigneeId
        };
    });
};
