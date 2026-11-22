# healthstylz-mcp (v1.4.0)

Free, zero-auth Model Context Protocol (MCP) server and Go SDK for [HealthStylz](https://healthstylz.com/): clinical nutrition archives, PubMed/NIH supplement evidence, 13 physiological and sports science calculators, AG1 cost-nutrient overlap analysis, and residential circadian window specifications.

## Interactive Playground & Discovery Endpoints

- **Live Browser Playground**: [https://healthstylz.com/mcp](https://healthstylz.com/mcp)
- **Streamable HTTP MCP Endpoint**: [https://healthstylz.com/api/knowledge/mcp](https://healthstylz.com/api/knowledge/mcp)
- **Scoped Endpoint Profiles**: `/api/knowledge/mcp/calculators` · `/api/knowledge/mcp/supplements` · `/api/knowledge/mcp/guides`
- **MCP Discovery Manifest (`2025-12-11`)**: [https://healthstylz.com/.well-known/mcp.json](https://healthstylz.com/.well-known/mcp.json)
- **Server Card (`W3C WebMCP 1.0`)**: [https://healthstylz.com/.well-known/mcp/server-card.json](https://healthstylz.com/.well-known/mcp/server-card.json)
- **OAuth Resource Notice (Zero Auth / RFC 9728)**: [https://healthstylz.com/.well-known/oauth-protected-resource](https://healthstylz.com/.well-known/oauth-protected-resource)
- **Canonical llms.txt**: [https://healthstylz.com/llms.txt](https://healthstylz.com/llms.txt)

## Interactive Web Calculators & Guides

- **Clinical & Sports Calculators**: [Tools Hub](https://healthstylz.com/tools/) · [TDEE](https://healthstylz.com/tools/tdee/) · [BMR](https://healthstylz.com/tools/bmr/) · [One-Rep Max](https://healthstylz.com/tools/one-rep-max/) · [FFMI](https://healthstylz.com/tools/ffmi/) · [VO2 Max](https://healthstylz.com/tools/vo2-max/) · [Sleep Cycle](https://healthstylz.com/tools/sleep-cycle/) · [Heart Rate Zones](https://healthstylz.com/tools/heart-rate-zones/) · [Caffeine Half-Life](https://healthstylz.com/tools/caffeine-half-life/) · [Dietary Fiber](https://healthstylz.com/tools/fiber/) · [Protein](https://healthstylz.com/tools/protein/) · [Hydration](https://healthstylz.com/tools/water/) · [Daily Steps](https://healthstylz.com/tools/steps/) · [Calorie Deficit](https://healthstylz.com/tools/calorie-deficit/) · [AG1 Overlap](https://healthstylz.com/tools/ag1-calculator/)
- **Interactive 3D Window & Botanical Labs**: [3D Curtain Window Lab](https://healthstylz.com/curtain-guides/window-lab/) · [Curtain Guides](https://healthstylz.com/curtain-guides/) · [Herb Guides](https://healthstylz.com/herb-guides/)

## Tools, Prompts & Resources

Every tool call returns `structuredContent` plus `provenance` (`as_of`, `canonical_url`, `interactive_web_tool`, and NIH/PubMed/USDA `sources`). Supports `initialize` (`2024-11-05` to `2025-11-25`), `ping`, `tools/list`, `tools/call`, `prompts/list`, `prompts/get`, `resources/list`, and `resources/read`.

1. `run_healthstylz_calculator`: Execute all 13 clinical and sports science calculators (`tdee`, `bmr`, `one-rep-max`, `ffmi`, `vo2-max`, `sleep-cycle`, `heart-rate-zones`, `caffeine-half-life`, `fiber`, `protein`, `water`, `steps`, `calorie-deficit`).
2. `get_health_tools`: List calculator specs and formulas.
3. `lookup_supplement_evidence`: Adult RDA, NIH Tolerable Upper Intake Level (UL), and PubMed randomized controlled trial counts for 24+ supplements.
4. `calculate_ag1_vs_multivitamin`: Per-scoop cost ($2.30 to $3.60) and NIH UL safety overlap evaluation.
5. `search_healthstylz_articles`: Query 1,100+ registered dietitian and clinical wellness articles.
6. `get_daily_wellness_brief`: Daily news wire headlines, molecule of the day, and 30-day reader attention trends.
7. `get_curtain_guides`: Circadian window darkness specs, GSM weights, and CPSC safety guides.
8. `get_herb_guides`: Evidence-first loose leaf and herbal tea brewing guides.
9. `get_curtain_window_wellness_specs`: Bedroom, nursery, office, and living room window lighting specs.

## Connect in Claude, Cursor, or VS Code

Add the remote Streamable HTTP endpoint (zero auth, no key required):

```json
{
  "mcpServers": {
    "healthstylz": {
      "type": "streamable-http",
      "url": "https://healthstylz.com/api/knowledge/mcp"
    }
  }
}
```

### Local Self-Test (Stdio / Node.js)

```bash
git clone https://github.com/harrybuild/healthstylz-mcp.git
cd healthstylz-mcp
node index.mjs --self-test
```
