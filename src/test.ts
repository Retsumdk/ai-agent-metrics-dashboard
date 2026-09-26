import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { AgentMetrics, Dashboard } from "./index";

describe("AgentMetrics", () => {
  test("tracks requests, tokens and cost", () => {
    const m = new AgentMetrics("agent-1", { maxResponseTime: 1000, successRate: 0.9 });
    m.recordResponse(120, 0.02);
    m.recordResponse(80, 0.01);
    m.recordError("timeout");
    const data = m.getData();
    assert.equal(data.totalRequests, 3);
    assert.equal(data.successfulRequests, 2);
    assert.equal(data.failedRequests, 1);
    assert.equal(data.totalTokens, 200);
    assert.equal(data.totalCost, 0.03);
  });

  test("success rate is 1 with no requests and drops with errors", () => {
    const m = new AgentMetrics("agent-1", { maxResponseTime: 1000, successRate: 0.9 });
    assert.equal(m.getSuccessRate(), 1);
    m.recordResponse(50, 0.01);
    m.recordError();
    assert.equal(m.getSuccessRate(), 0.5);
  });

  test("average response time is the mean of recorded times", () => {
    const m = new AgentMetrics("agent-1", { maxResponseTime: 1000, successRate: 0.9 });
    assert.equal(m.getAverageResponseTime(), 0);
    m.recordResponse(100, 0.01);
    m.recordResponse(300, 0.01);
    assert.equal(m.getAverageResponseTime(), 200);
  });

  test("reliability score blends success rate and latency budget", () => {
    const fast = new AgentMetrics("fast", { maxResponseTime: 1000, successRate: 0.9 });
    fast.recordResponse(100, 0.01);
    assert.equal(fast.getReliabilityScore(), 100);

    const slow = new AgentMetrics("slow", { maxResponseTime: 100, successRate: 0.9 });
    slow.recordResponse(1000, 0.01);
    assert.equal(slow.getReliabilityScore(), 85);
  });

  test("isHealthy respects the configured success rate", () => {
    const m = new AgentMetrics("agent-1", { maxResponseTime: 1000, successRate: 0.9 });
    assert.ok(m.isHealthy());
    m.recordError();
    assert.ok(!m.isHealthy());
  });
});

describe("Dashboard", () => {
  test("generateReport includes per-agent and system totals", () => {
    const a = new AgentMetrics("alpha", { maxResponseTime: 1000, successRate: 0.9 });
    a.recordResponse(100, 0.5);
    const b = new AgentMetrics("beta", { maxResponseTime: 100, successRate: 0.9 });
    b.recordError();
    const dash = new Dashboard([a, b]);
    const report = dash.generateReport();
    assert.ok(report.includes("Agent: alpha"));
    assert.ok(report.includes("Agent: beta"));
    assert.ok(report.includes("Total Cost: $0.5000"));
    assert.ok(report.includes("Healthy Agents: 1/2"));
  });

  test("getAgentHealthcheck returns null for unknown agents", () => {
    const dash = new Dashboard([]);
    assert.equal(dash.getAgentHealthcheck("ghost"), null);
  });

  test("getAverageCost supports daily and weekly periods", () => {
    const a = new AgentMetrics("alpha", { maxResponseTime: 1000, successRate: 0.9 });
    a.recordResponse(1, 2);
    const dash = new Dashboard([a]);
    assert.equal(dash.getAverageCost(), 2);
    assert.equal(dash.getAverageCost("weekly"), 14);
  });
});
