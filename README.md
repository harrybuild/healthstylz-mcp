# @innovation/healthstylz-mcp

Unified Model Context Protocol (MCP) server for HealthStylz clinical wellness, dietitian nutrition archives, PubMed/NIH supplement evidence, AG1 cost-nutrient calculator, and residential circadian window curtain specifications.

## Endpoints

- **Live Streamable HTTP MCP**: `https://healthstylz.com/api/knowledge/mcp`
- **MCP Discovery Manifest**: `https://healthstylz.com/.well-known/mcp.json`
- **Canonical llms.txt**: `https://healthstylz.com/llms.txt`

## Tools Provided

1. `get_daily_wellness_brief`: Today's wire headlines, attention trends, molecule of the day, and latest published stories.
2. `search_healthstylz_articles`: Query 1,126+ dietitian and evidence-grounded health articles with topic filters.
3. `lookup_supplement_evidence`: Adult RDA, Tolerable Upper Intake Level (UL), PubMed randomized trial count, and NIH guidance for 24+ supplements.
4. `calculate_ag1_vs_multivitamin`: Real cost per scoop ($2.30 to $3.60), annual cost, and NIH Tolerable Upper Limit (UL) safety overlap with multivitamins.
5. `get_herb_guides`: List or read the Herb Guides (loose leaf tea, herbal teas, elderberry syrup, spice teas, seasonal guides) with listed prices and precautions from Mountain Rose Herbs product pages.
6. `get_curtain_window_wellness_specs`: Circadian window wellness specifications, fabric GSM weights, blackout percentages, and fullness formulas.

## Installation & Usage

### Claude Desktop
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "healthstylz": {
      "command": "node",
      "args": ["/Users/harryliu/Documents/Innovation/packages/healthstylz-mcp/index.mjs"]
    }
  }
}
```

### Self-Test
```bash
node index.mjs --self-test
```
