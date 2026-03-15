export interface MetricsConfig {
  maxResponseTime: number;
  successRate: number;
}

export interface AgentMetricsData {
  agentId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  responseTimes: number[];
  errors: string[];
}

export class AgentMetrics {
  private agentId: string;
  private config: MetricsConfig;
  private data: AgentMetricsData;

  constructor(agentId: string, config: MetricsConfig) {
    this.agentId = agentId;
    this.config = config;
    this.data = {
      agentId,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      responseTimes: [],
      errors: [],
    };
  }

  recordResponse(tokens: number, cost: number): void {
    this.data.totalRequests++;
    this.data.successfulRequests++;
    this.data.totalTokens += tokens;
    this.data.totalCost += cost;
    this.data.responseTimes.push(tokens);
  }

  recordCost(cost: number): void {
    this.data.totalCost += cost;
  }

  recordError(errorMessage?: string): void {
    this.data.totalRequests++;
    this.data.failedRequests++;
    if (errorMessage) {
      this.data.errors.push(errorMessage);
    }
  }

  getData(): AgentMetricsData {
    return this.data;
  }

  getSuccessRate(): number {
    if (this.data.totalRequests === 0) return 1;
    return this.data.successfulRequests / this.data.totalRequests;
  }

  getAverageResponseTime(): number {
    if (this.data.responseTimes.length === 0) return 0;
    return this.data.responseTimes.reduce((a, b) => a + b, 0) / this.data.responseTimes.length;
  }

  getReliabilityScore(): number {
    const successRate = this.getSuccessRate();
    const avgResponseTime = this.getAverageResponseTime();
    const timeScore = avgResponseTime <= this.config.maxResponseTime ? 1 : 0.5;
    return (successRate * 0.7 + timeScore * 0.3) * 100;
  }

  isHealthy(): boolean {
    return this.getSuccessRate() >= this.config.successRate;
  }
}

export class Dashboard {
  private agentMetrics: Map<string, AgentMetrics>;

  constructor(metricsList: AgentMetrics[]) {
    this.agentMetrics = new Map();
    for (const m of metricsList) {
      this.agentMetrics.set(m.getData().agentId, m);
    }
  }

  generateReport(): string {
    let report = '=== AI Agent Metrics Dashboard ===\n\n';
    let totalCost = 0;
    let totalRequests = 0;

    for (const [agentId, metrics] of this.agentMetrics) {
      const data = metrics.getData();
      totalCost += data.totalCost;
      totalRequests += data.totalRequests;

      report += `Agent: ${agentId}\n`;
      report += `  Requests: ${data.totalRequests}\n`;
      report += `  Success Rate: ${(metrics.getSuccessRate() * 100).toFixed(1)}%\n`;
      report += `  Reliability: ${metrics.getReliabilityScore().toFixed(1)}/100\n`;
      report += `  Total Cost: $${data.totalCost.toFixed(4)}\n`;
      report += `  Health: ${metrics.isHealthy() ? '✓ HEALTHY' : '✗ UNHEALTHY'}\n\n`;
    }

    report += `=== System Totals ===\n`;
    report += `Total Requests: ${totalRequests}\n`;
    report += `Total Cost: $${totalCost.toFixed(4)}\n`;
    report += `Healthy Agents: ${this.getHealthyCount()}/${this.agentMetrics.size}\n`;

    return report;
  }

  getAllMetrics(): Map<string, AgentMetricsData> {
    const result = new Map<string, AgentMetricsData>();
    for (const [id, metrics] of this.agentMetrics) {
      result.set(id, metrics.getData());
    }
    return result;
  }

  getAverageCost(period: 'daily' | 'weekly' = 'daily'): number {
    let total = 0;
    for (const [, metrics] of this.agentMetrics) {
      total += metrics.getData().totalCost;
    }
    return period === 'weekly' ? total * 7 : total;
  }

  getAgentHealthcheck(agentId: string): { healthy: boolean; score: number } | null {
    const metrics = this.agentMetrics.get(agentId);
    if (!metrics) return null;
    return {
      healthy: metrics.isHealthy(),
      score: metrics.getReliabilityScore(),
    };
  }

  getHealthyCount(): number {
    let count = 0;
    for (const [, metrics] of this.agentMetrics) {
      if (metrics.isHealthy()) count++;
    }
    return count;
  }
}
