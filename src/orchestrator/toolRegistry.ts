/**
 * StockTrace — Secure Tool Registry & Permission Enforcement
 * 
 * Enforces least-privilege access:
 * - Read tools for structured data and vector SOP retrieval.
 * - Controlled write tools for task creation and audit logging.
 * - Explicit blocking of dangerous tools (arbitrary SQL, inventory modification, audit deletion).
 */

import { RegisteredTool, OrchestrationContext } from './types';
import {
  matchDispatchOrder,
  getOrCreateInvestigationTaskId,
  WAREHOUSE_DISPATCH_ORDERS,
  DispatchOrder,
} from '../services/dispatch/dispatchService';
import { SCANNER_TRANSACTIONS } from '../data/mockData';
import { RawScannerInput, RawCameraInput } from '../harness';
import { sopService } from '../services/sop/sop_service';

export class ToolSecurityError extends Error {
  public toolName: string;
  public reason: string;

  constructor(toolName: string, reason: string) {
    super(`Security Violation on Tool '${toolName}': ${reason}`);
    this.name = 'ToolSecurityError';
    this.toolName = toolName;
    this.reason = reason;
  }
}

/**
 * Prompt injection sanitizer: strips malicious system prompt overriding tokens.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<\/?system>/gi, '')
    .replace(/ignore\s+all\s+(?:previous|prior)\s+instructions/gi, '[FILTERED_INJECTION_ATTEMPT]')
    .replace(/drop\s+table/gi, '[FILTERED_SQL_KEYWORD]')
    .trim();
}

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  public registerTool(tool: RegisteredTool): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Securely executes a tool with role permission checks, call limits, and sanitization.
   */
  public async executeTool<TInput = any, TOutput = any>(
    toolName: string,
    input: TInput,
    context: OrchestrationContext
  ): Promise<TOutput> {
    // 1. Check max tool call limits
    if (context.toolCallCount >= context.maxToolCalls) {
      throw new ToolSecurityError(
        toolName,
        `Exceeded maximum tool call limit (${context.maxToolCalls}) for trace ${context.traceId}.`
      );
    }

    // 2. Check tool existence and security status
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new ToolSecurityError(toolName, `Tool '${toolName}' is not registered in the security registry.`);
    }

    if (tool.accessType === 'BLOCKED_DANGEROUS') {
      throw new ToolSecurityError(
        toolName,
        `Access to dangerous tool '${toolName}' is strictly prohibited by security guardrails.`
      );
    }

    // 3. Check role authorization
    if (tool.requiredRole && tool.requiredRole !== context.operatorRole && context.operatorRole !== 'SYSTEM') {
      throw new ToolSecurityError(
        toolName,
        `Insufficient role permissions. Tool requires '${tool.requiredRole}', but context is '${context.operatorRole}'.`
      );
    }

    // 4. Track invocation
    context.toolCallCount += 1;
    context.logs.push({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event: `TOOL_INVOKED: ${toolName}`,
      data: { toolName, accessType: tool.accessType },
    });

    try {
      const result = await tool.execute(input, context);
      return result;
    } catch (err: any) {
      context.logs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        event: `TOOL_FAILED: ${toolName}`,
        data: { error: err.message },
      });
      throw err;
    }
  }

  private registerDefaultTools(): void {
    // -----------------------------------------------------------------------
    // READ TOOLS
    // -----------------------------------------------------------------------
    this.registerTool({
      name: 'find_dispatch_order',
      description: 'Finds matching warehouse dispatch order from natural-language report or SKU/bin.',
      accessType: 'READ_ONLY',
      execute: (input: { query: string; scenarioId?: string }) => {
        const cleanQuery = sanitizeInput(input.query);
        return matchDispatchOrder(cleanQuery, input.scenarioId);
      },
    });

    this.registerTool({
      name: 'get_inventory_record',
      description: 'Queries warehouse WMS system of record for exact SKU and expected bin.',
      accessType: 'READ_ONLY',
      execute: (input: { sku: string }) => {
        const order = WAREHOUSE_DISPATCH_ORDERS.find((o) => o.sku === input.sku);
        if (!order) {
          return { found: false, sku: input.sku };
        }
        return {
          found: true,
          sku: order.sku,
          itemName: order.itemName,
          expectedBin: order.expectedBin,
          requiredQuantity: order.requiredQuantity,
          locationDescription: order.locationDescription,
          itemValue: order.itemValue,
        };
      },
    });

    this.registerTool({
      name: 'query_scanner_events',
      description: 'Queries handheld barcode scanner movement events for SKU.',
      accessType: 'READ_ONLY',
      execute: (input: { sku: string }) => {
        const events = SCANNER_TRANSACTIONS[input.sku] || [];
        return {
          sku: input.sku,
          count: events.length,
          events: events.map((e) => ({
            time: e.time,
            fromLocation: e.fromLocation,
            toLocation: e.toLocation,
            qty: e.qty,
            scannerId: e.scannerId,
            type: e.type,
          })),
        };
      },
    });

    this.registerTool({
      name: 'get_camera_metadata',
      description: 'Retrieves targeted CCTV camera observation events for aisle and totes.',
      accessType: 'READ_ONLY',
      execute: (input: { sku: string; aisleOrBin: string }) => {
        return {
          sku: input.sku,
          status: 'AVAILABLE',
          camerasAvailable: 8,
          timestamp: new Date().toISOString(),
        };
      },
    });

    this.registerTool({
      name: 'search_sop_vector',
      description: 'Performs semantic retrieval against approved warehouse SOPs and landmark documentation.',
      accessType: 'READ_ONLY',
      execute: (input: { query: string }) => {
        const cleanQuery = sanitizeInput(input.query);
        return sopService.querySop(cleanQuery);
      },
    });

    // -----------------------------------------------------------------------
    // CONTROLLED WRITE TOOLS
    // -----------------------------------------------------------------------
    this.registerTool({
      name: 'create_investigation_task',
      description: 'Creates or assigns an investigation task idempotently associated with a dispatch order.',
      accessType: 'CONTROLLED_WRITE',
      execute: (input: { orderId: string; sku: string }) => {
        const taskId = getOrCreateInvestigationTaskId(input.orderId);
        return {
          taskId,
          orderId: input.orderId,
          sku: input.sku,
          assignedAt: new Date().toISOString(),
          status: 'TASK_ASSIGNED',
        };
      },
    });

    this.registerTool({
      name: 'append_audit_event',
      description: 'Appends an immutable audit trail record for case lifecycle events.',
      accessType: 'CONTROLLED_WRITE',
      execute: (input: { caseId: string; actor: string; action: string; details: string }) => {
        return {
          eventId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          caseId: input.caseId,
          actor: input.actor,
          action: input.action,
          details: input.details,
          persisted: true,
        };
      },
    });

    // -----------------------------------------------------------------------
    // BLOCKED / DANGEROUS TOOLS (EXPLICIT GUARDRAILS)
    // -----------------------------------------------------------------------
    this.registerTool({
      name: 'adjust_stock_quantity',
      description: 'Directly changes inventory balance without human verification (PROHIBITED).',
      accessType: 'BLOCKED_DANGEROUS',
      execute: () => {
        throw new ToolSecurityError(
          'adjust_stock_quantity',
          'Autonomous inventory modification is prohibited. Humans must verify physical stock.'
        );
      },
    });

    this.registerTool({
      name: 'direct_sql_query',
      description: 'Executes arbitrary SQL strings against the database (PROHIBITED).',
      accessType: 'BLOCKED_DANGEROUS',
      execute: () => {
        throw new ToolSecurityError('direct_sql_query', 'Arbitrary SQL execution by agent is prohibited.');
      },
    });

    this.registerTool({
      name: 'delete_audit_trail',
      description: 'Deletes or alters audit history (PROHIBITED).',
      accessType: 'BLOCKED_DANGEROUS',
      execute: () => {
        throw new ToolSecurityError('delete_audit_trail', 'Audit history is strictly append-only.');
      },
    });
  }
}

export const toolRegistry = new ToolRegistry();
