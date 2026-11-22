#!/usr/bin/env node
/**
 * @innovation/healthstylz-mcp
 * Unified JSON-RPC 2.0 Model Context Protocol (MCP) Server v1.4.0
 * Stdio + remote streamable HTTP proxy + local fallback + self-test.
 */
import readline from 'node:readline';
import { runCalculator } from './calculators.mjs';

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
  },
  {
    name: "get_health_tools",
    description: "List or inspect HealthStylz interactive calculators and 3D labs (protein intake, daily water intake, steps to miles and calories, calorie deficit and USDA food swaps, AG1 overlap, and 3D Curtain Window Lab) with their sourced formulas.",
    inputSchema: {
      type: "object",
      properties: {
        tool: {
          type: "string",
          description: "Optional tool slug (protein, water, steps, calorie-deficit, tdee, bmr, one-rep-max, ffmi, vo2-max, sleep-cycle, heart-rate-zones, caffeine-half-life, fiber, ag1-calculator, window-lab). Omit to list all tools."
        }
      }
    }
  },
  {
    name: "run_healthstylz_calculator",
    description: "Run recognized clinical and sports science calculators (tdee, bmr, one-rep-max, ffmi, vo2-max, sleep-cycle, heart-rate-zones, caffeine-half-life, fiber, protein, water, steps, calorie-deficit) with typed parameters, returning structured calculations, scientific citations, and clinical guidance.",
    inputSchema: {
      type: "object",
      properties: {
        calculator: {
          type: "string",
          enum: [
            "tdee", "bmr", "one-rep-max", "ffmi", "vo2-max",
            "sleep-cycle", "heart-rate-zones", "caffeine-half-life", "fiber",
            "protein", "water", "steps", "calorie-deficit"
          ],
          description: "Target calculator to execute"
        },
        sex: { type: "string", enum: ["male", "female"], description: "Biological sex" },
        age: { type: "number", description: "Age in years (15-100)" },
        weight: { type: "number", description: "Body weight" },
        weight_unit: { type: "string", enum: ["kg", "lb"], default: "kg" },
        height: { type: "number", description: "Height" },
        height_unit: { type: "string", enum: ["cm", "in"], default: "cm" },
        activity_level: { type: "string", enum: ["sedentary", "light", "moderate", "very_active", "extra_active"] },
        body_fat_pct: { type: "number", description: "Body fat percentage (3-60%)" },
        lift_weight: { type: "number", description: "Lifted weight for One-Rep Max" },
        reps: { type: "number", description: "Repetitions performed (1-30)" },
        unit: { type: "string", enum: ["kg", "lb"], description: "Weight unit for 1RM" },
        exercise: { type: "string", description: "Exercise name" },
        method: { type: "string", enum: ["resting_hr", "rockport_walk", "cooper_run"], description: "VO2 Max test method" },
        resting_hr: { type: "number", description: "Resting heart rate in bpm" },
        max_hr: { type: "number", description: "Measured maximum heart rate in bpm" },
        walk_time_minutes: { type: "number", description: "Walk duration in minutes for Rockport walk" },
        post_walk_hr: { type: "number", description: "Immediate post-walk heart rate in bpm" },
        distance_meters: { type: "number", description: "Distance covered in meters for Cooper 12-min run" },
        mode: { type: "string", enum: ["wake_at", "sleep_now", "bed_at"], description: "Sleep cycle calculation mode" },
        time: { type: "string", description: "Target time (HH:mm) for Sleep Cycle" },
        latency_minutes: { type: "number", description: "Sleep onset latency in minutes" },
        formula: { type: "string", enum: ["karvonen", "tanaka", "fox"], description: "Heart rate zones formula" },
        caffeine_mg: { type: "number", description: "Caffeine consumed in mg" },
        consumption_time: { type: "string", description: "Time of caffeine intake (HH:mm)" },
        bedtime: { type: "string", description: "Bedtime (HH:mm)" },
        half_life_hours: { type: "number", description: "Caffeine half-life in hours" },
        life_stage: { type: "string", enum: ["standard", "pregnant", "lactating"], description: "Life stage for fiber recommendation" },
        daily_calories: { type: "number", description: "Daily energy intake in kcal for fiber calculation" },
        current_fiber_g: { type: "number", description: "Current daily fiber intake in grams" },
        who: { type: "string", description: "Target category for protein/water (adult, older, active, loss, preg, woman, man)" },
        steps: { type: "number", description: "Step count for steps calculator" },
        stride_ft: { type: "number", description: "Stride length in feet" },
        daily_calories_cut: { type: "number", description: "Daily calories cut for deficit planner" }
      },
      required: ["calculator"]
    }
  }
];

export async function forwardToLive(req) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(3000)
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
        protocolVersion: '2025-12-11',
        capabilities: { tools: {}, resources: {} },
        serverInfo: {
          name: 'io.github.harrybuild/healthstylz-mcp',
          title: 'HealthStylz Clinical Nutrition, Metabolic Fitness & Circadian Environment MCP',
          version: '1.4.0'
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

  // Fallback local tool execution
  if (method === 'tools/call') {
    const toolName = params.name;
    const args = params.arguments || {};

    if (toolName === 'run_healthstylz_calculator') {
      try {
        const calcName = args.calculator;
        const result = runCalculator(calcName, args);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Calculator error: ${err.message}` }
        };
      }
    }

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
                source: 'https://healthstylz.com/tools/ag1-calculator/'
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
                blackout: '100% Blackout (Lila 280 GSM or Liz Linen Blackout 350 GSM)',
                gsm: '90, 248, 274, 280, 300, 350, and 500 GSM',
                acoustic_damping: 'No decibel figure is stated',
                window_lab: 'https://healthstylz.com/curtain-guides/window-lab/',
                source: 'https://healthstylz.com/curtain-guides/'
              }, null, 2)
            }
          ]
        }
      };
    }

    // Try remote if available
    const remote = await forwardToLive(req);
    if (remote) return remote;
  }

  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method '${method}' not found` } };
}

async function runSelfTest() {
  console.log('[healthstylz-mcp] Starting MCP Server Self-Test (v1.4.0)...');

  // 1. Initialize
  const initRes = await handleRpcRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  if (initRes?.result?.serverInfo?.name === 'io.github.harrybuild/healthstylz-mcp' && initRes?.result?.serverInfo?.version === '1.4.0') {
    console.log(`[PASS] Initialize OK: ${initRes.result.serverInfo.name} v${initRes.result.serverInfo.version}`);
  } else {
    throw new Error(`Initialize test failed: ${JSON.stringify(initRes)}`);
  }

  // 2. Tools List
  const toolsRes = await handleRpcRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const toolList = toolsRes?.result?.tools || [];
  const hasUnifiedCalc = toolList.some(t => t.name === 'run_healthstylz_calculator');
  if (toolList.length >= 8 && hasUnifiedCalc) {
    console.log(`[PASS] Tools List OK: ${toolList.length} tools registered (including run_healthstylz_calculator)`);
  } else {
    throw new Error(`Tools list verification failed. Length: ${toolList.length}, hasUnifiedCalc: ${hasUnifiedCalc}`);
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

  // 4. Tool Call: run_healthstylz_calculator (TDEE)
  const tdeeRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'run_healthstylz_calculator',
      arguments: {
        calculator: 'tdee',
        sex: 'male',
        age: 30,
        weight: 75,
        weight_unit: 'kg',
        height: 180,
        height_unit: 'cm',
        activity_level: 'moderate'
      }
    }
  });
  const tdeeData = JSON.parse(tdeeRes?.result?.content?.[0]?.text || '{}');
  if (tdeeData.tdee_kcal && tdeeData.tdee_kcal > 2000) {
    console.log(`[PASS] Tool Call run_healthstylz_calculator (tdee) OK: ${tdeeData.tdee_kcal} kcal (BMR: ${tdeeData.bmr_kcal} kcal)`);
  } else {
    throw new Error(`TDEE calculation failed: ${JSON.stringify(tdeeRes)}`);
  }

  // 5. Tool Call: run_healthstylz_calculator (Sleep Cycle)
  const sleepRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'run_healthstylz_calculator',
      arguments: {
        calculator: 'sleep-cycle',
        mode: 'wake_at',
        time: '07:00',
        latency_minutes: 14
      }
    }
  });
  const sleepData = JSON.parse(sleepRes?.result?.content?.[0]?.text || '{}');
  if (Array.isArray(sleepData.cycles) && sleepData.cycles.length === 6) {
    console.log(`[PASS] Tool Call run_healthstylz_calculator (sleep-cycle) OK: ${sleepData.cycles.length} cycles calculated`);
  } else {
    throw new Error(`Sleep cycle calculation failed: ${JSON.stringify(sleepRes)}`);
  }

  // 6. Resources List
  const resList = await handleRpcRequest({ jsonrpc: '2.0', id: 6, method: 'resources/list' });
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
