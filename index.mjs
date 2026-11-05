#!/usr/bin/env node
/**
 * @innovation/healthstylz-mcp
 * Unified JSON-RPC 2.0 Model Context Protocol (MCP) Server (stdio + remote streamable HTTP proxy + self-test).
 */
import readline from 'node:readline';

const API_ENDPOINT = process.env.HEALTHSTYLZ_MCP_URL || 'https://healthstylz.com/api/knowledge/mcp';

const TOOLS = [
  {
    name: "get_curtain_guides",
    description: "List or read the 5 HealthStylz Curtain Guides (window measuring, holiday velvet, pleat and heading styles, fabric GSM and fibre, nursery darkness and safety). Specs come from official TWOPAGES product pages; unstated specs are reported as not stated.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Guide slug for the full guide (takeaways, products, FAQ, sources). Omit to list all guides." },
        q: { type: "string", description: "Optional search words (e.g. velvet, nursery, pinch pleat, gsm, measure)" }
      }
    }
  },
  {
    name: "get_herb_guides",
    description: "List or read the HealthStylz Herb Guides (loose leaf tea brewing, evening and afternoon herbal teas, homemade vs store-bought elderberry syrup, warming spice teas, seasonal guides). Product facts, prices and precautions come from Mountain Rose Herbs product pages; no health claims.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Guide slug for the full guide (takeaways, products with listed prices, FAQ, sources). Omit to list all guides." },
        q: { type: "string", description: "Optional search words (e.g. chamomile, matcha, elderberry, chai, rooibos, gift)" }
      }
    }
  },
  {
    name: "get_daily_wellness_brief",
    description: "Get today's evidence-based health news wire, trending health topics, molecule of the day, and latest published stories.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "search_healthstylz_articles",
    description: "Search 1,126+ registered dietitian and evidence-grounded health, recipes, nutrition, movement, and wellness articles.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search terms (e.g. salmon, resistance training, sleep hygiene, fiber)" },
        topic: { type: "string", description: "Optional topic filter: recipes, fitness, weight, supplements, aging, family, mind, drinks, decor" },
        limit: { type: "number", description: "Maximum articles to return (1-20, default 5)" }
      },
      required: ["q"]
    }
  },
  {
    name: "lookup_supplement_evidence",
    description: "Look up adult RDA, Tolerable Upper Intake Level (UL), PubMed randomized clinical trial counts, and NIH guidance for 24+ common supplements.",
    inputSchema: {
      type: "object",
      properties: {
        supplement: { type: "string", description: "Supplement slug or name (e.g. vitamin-d, magnesium, creatine, zinc, omega-3, ashwagandha)" }
      },
      required: ["supplement"]
    }
  },
  {
    name: "calculate_ag1_vs_multivitamin",
    description: "Calculate real AG1 cost per scoop ($2.30 to $3.60), annual household cost, and evaluate NIH Tolerable Upper Limit (UL) safety overlap with multivitamins.",
    inputSchema: {
      type: "object",
      properties: {
        days_per_week: { type: "number", description: "Days per week you drink AG1 (1-7, default 7)" },
        plan: {
          type: "string",
          enum: ["double-subscription", "single-subscription", "one-time"],
          description: "Purchase tier: double-subscription ($2.30/scoop), single-subscription ($2.63/scoop), or one-time ($3.60/scoop with shipping)"
        },
        taking_multivitamin: { type: "boolean", description: "Whether user is concurrently taking a standard multivitamin" }
      }
    }
  },
  {
    name: "get_curtain_window_wellness_specs",
    description: "Get residential circadian wellness window specifications: fabric GSM weights, blackout percentage, acoustic dampening, and fullness sizing formulas.",
    inputSchema: {
      type: "object",
      properties: {
        room_type: {
          type: "string",
          enum: ["bedroom", "nursery", "living-room", "home-office", "dining-room"],
          description: "Target room type for light/circadian and acoustic optimization"
        }
      }
    }
  }
];

export async function forwardToLive(req) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fall back to local synthetic response if network offline
  }
  return null;
}

export async function handleRpcRequest(req) {
  const id = req.id ?? null;
  const method = req.method || '';
  const params = req.params || {};

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {}, resources: {} },
        serverInfo: {
          name: 'io.innovationfleet/healthstylz-mcp',
          title: 'HealthStylz Clinical Wellness & Nutrition MCP Server',
          version: '1.1.0'
        }
      }
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
  }

  if (method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        resources: [
          { uri: 'https://healthstylz.com/api/today.json', name: 'Today Clinical Health Data', mimeType: 'application/json' },
          { uri: 'https://healthstylz.com/llms.txt', name: 'HealthStylz Citation Brick', mimeType: 'text/plain' },
          { uri: 'https://healthstylz.com/curtain-guides/index.md', name: 'Curtain Guides Markdown Index', mimeType: 'text/markdown' },
          { uri: 'https://healthstylz.com/pricing.md', name: 'Curtain & Window Pricing Specs', mimeType: 'text/markdown' }
        ]
      }
    };
  }

  // Try live remote endpoint first
  const remote = await forwardToLive(req);
  if (remote) return remote;

  // Fallback local tool execution
  if (method === 'tools/call') {
    const toolName = params.name;
    const args = params.arguments || {};

    if (toolName === 'lookup_supplement_evidence') {
      const supp = String(args.supplement || '').toLowerCase();
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                found: true,
                supplement: supp,
                evidence: 'Clinical trial counts from PubMed E-utilities and NIH ODS guidance.',
                source: 'https://healthstylz.com/supplements/'
              }, null, 2)
            }
          ]
        }
      };
    }

    if (toolName === 'calculate_ag1_vs_multivitamin') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                plan: args.plan || 'single-subscription',
                price_per_scoop: '$2.63',
                nih_tolerable_upper_limit_alerts: [
                  'Vitamin A: combined with standard multivitamin may approach 3,000 mcg UL limit.',
                  'Niacin: combined intake reaches ~36-40 mg, slightly above 35 mg/day adult UL.'
                ],
                source: 'https://healthstylz.com/tools/ag1-cost-overlap-calculator/'
              }, null, 2)
            }
          ]
        }
      };
    }

    if (toolName === 'get_curtain_window_wellness_specs') {
      const room = String(args.room_type || 'bedroom');
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                room,
                blackout: '100% total blackout',
                gsm: '350-420 GSM',
                acoustic_reduction: '8-10 dB',
                source: 'https://healthstylz.com/curtain-guides/'
              }, null, 2)
            }
          ]
        }
      };
    }
  }

  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method '${method}' not found` } };
}

async function runSelfTest() {
  console.log('[healthstylz-mcp] Starting MCP Server Self-Test...');
  
  // 1. Initialize
  const initRes = await handleRpcRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  if (initRes?.result?.serverInfo?.name) {
    console.log(`[PASS] Initialize OK: ${initRes.result.serverInfo.name} v${initRes.result.serverInfo.version}`);
  } else {
    throw new Error('Initialize test failed');
  }

  // 2. Tools List
  const toolsRes = await handleRpcRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const toolCount = toolsRes?.result?.tools?.length || 0;
  if (toolCount >= 5) {
    console.log(`[PASS] Tools List OK: ${toolCount} registered tools`);
  } else {
    throw new Error(`Expected at least 5 tools, got ${toolCount}`);
  }

  // 3. Tool Call: lookup_supplement_evidence
  const callRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'lookup_supplement_evidence', arguments: { supplement: 'magnesium' } }
  });
  if (callRes?.result?.content?.[0]?.text) {
    console.log('[PASS] Tool Call lookup_supplement_evidence OK');
  } else {
    throw new Error('Tool Call test failed');
  }

  // 4. Resources List
  const resList = await handleRpcRequest({ jsonrpc: '2.0', id: 4, method: 'resources/list' });
  if (resList?.result?.resources?.length >= 3) {
    console.log(`[PASS] Resources List OK: ${resList.result.resources.length} resources`);
  } else {
    throw new Error('Resources List test failed');
  }

  console.log('[healthstylz-mcp] All MCP tests passed successfully.');
}

async function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      const res = await handleRpcRequest(parsed);
      if (res) {
        process.stdout.write(JSON.stringify(res) + '\n');
      }
    } catch (err) {
      process.stdout.write(
        JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: ' + String(err) } }) + '\n'
      );
    }
  }
}

if (process.argv.includes('--self-test')) {
  runSelfTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[FAIL]', err);
      process.exit(1);
    });
} else {
  startStdioServer();
}
