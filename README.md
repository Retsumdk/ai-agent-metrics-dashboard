# AI Agent Metrics Dashboard

**Category:** Agents

## Description

Dashboard for tracking AI agent performance, costs, and reliability metrics. Provides real-time monitoring, cost analysis, and reliability scoring for multi-agent systems.

## Features

- **Agent Performance Tracking**
  - Response times
  - Token usage
  - Success rate
- **Cost Analysis**
  - Cost per request
  - Daily/weekly cost rollout
- **Reliability Scoring**
  - Error rate
  - Downtime frequency
  - Agent healthchecks
- **Dashboard Views**
  - Overall system benchmark
  - Individual agent status
  - Cost trend
  - Reliability trends

## Installation

```bash
npm install ai-agent-metrics-dashboard
```

## Usage

### Importing and initializing

```typescript
import { AgentMetrics, MetricsConfig } from './src/index';

for (const agentId in ['agent-1', 'agent-2', 'agent-3']) {
  const metrics = new AgentMetrics(agentId, {
    maxResponseTime: 5000,
    successRate: 0.95,
  });
  // Recording metrics over time
  metrics.recordResponse(123, 0.08);
  metrics.recordCost(0.015);
  metrics.recordError();
}

const dash = new Dashboard(metrics);
const report = dash.generateReport();
console.log(report);
```

### Getting All Metrics

```typescript
// Get all metrics for all agents
const allMetrics = dash.getAllMetrics();

// Get average cost over time
const avgCost = dash.getAverageCost('daily');

// Get reliability score for an agent
const health = dash.getAgentHealthcheck('agent-1');
console.log(health);
```

## License

MIT Licensed
