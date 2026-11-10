# @innovation/healthstylz-mcp

Unified Model Context Protocol (MCP) server for HealthStylz clinical wellness, dietitian nutrition archives, PubMed/NIH supplement evidence, AG1 cost-nutrient calculator, and residential circadian window curtain specifications.

## Canonical Endpoints & Interactive Guides

- **HealthStylz Evidence Hub**: [https://healthstylz.com/](https://healthstylz.com/)
- **Live Streamable HTTP MCP**: [https://healthstylz.com/api/knowledge/mcp](https://healthstylz.com/api/knowledge/mcp)
- **MCP Discovery Manifest**: [https://healthstylz.com/.well-known/mcp.json](https://healthstylz.com/.well-known/mcp.json)
- **Canonical llms.txt**: [https://healthstylz.com/llms.txt](https://healthstylz.com/llms.txt)
- **Residential Curtain Architecture & Circadian Window Hub**: [https://healthstylz.com/curtain-guides/](https://healthstylz.com/curtain-guides/)
  - [Interactive 3D Curtain Window Lab](https://healthstylz.com/curtain-guides/window-lab/)
  - [Measure Windows Before Black Friday: 10-Minute Sizing Checklist](https://healthstylz.com/curtain-guides/measure-windows-before-black-friday-ten-minute-checklist/)
  - [Velvet Curtains for Holiday Dining & Living Rooms](https://healthstylz.com/curtain-guides/velvet-curtains-for-holiday-dining-and-living-rooms/)
  - [Curtain Pleat & Heading Styles Explained](https://healthstylz.com/curtain-guides/pleat-and-heading-styles-explained-pinch-pleat-and-beyond/)
  - [Curtain Fabric Weight: 90 GSM to 500 GSM](https://healthstylz.com/curtain-guides/curtain-fabric-weight-gsm-and-fibre-in-plain-words/)
  - [Nursery & Kids' Room Curtains: 100% Blackout & CPSC Safety](https://healthstylz.com/curtain-guides/nursery-and-kids-room-curtains-sleep-darkness-and-safety/)
- **Interactive 3D Botanical Herb Brew Lab**: [https://healthstylz.com/herb-guides/](https://healthstylz.com/herb-guides/)
- **Clinical Calculators**: [Tools Hub](https://healthstylz.com/tools/) · [Protein Intake](https://healthstylz.com/tools/protein/) · [Hydration](https://healthstylz.com/tools/water/) · [Daily Steps](https://healthstylz.com/tools/steps/) · [Calorie Deficit](https://healthstylz.com/tools/calorie-deficit/) · [AG1 Cost & Overlap Calculator](https://healthstylz.com/tools/ag1-calculator/)

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
