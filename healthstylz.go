// Package healthstylz provides a zero-auth Go client for the HealthStylz
// Clinical Nutrition, Circadian Curtain Architecture, and Botanical Herb API & MCP Server.
//
// Canonical Documentation & Interactive Calculators:
//   - Root Hub: https://healthstylz.com/
//   - Residential Curtain Architecture & Circadian Window Guides: https://healthstylz.com/curtain-guides/
//   - Interactive 3D Curtain Window Lab: https://healthstylz.com/curtain-guides/window-lab/
//   - Measure Windows Before Black Friday (10-Minute Checklist): https://healthstylz.com/curtain-guides/measure-windows-before-black-friday-ten-minute-checklist/
//   - Velvet Curtains for Holiday Dining & Living Rooms: https://healthstylz.com/curtain-guides/velvet-curtains-for-holiday-dining-and-living-rooms/
//   - Curtain Fabric Weight (GSM) & Fibre Guide: https://healthstylz.com/curtain-guides/curtain-fabric-weight-gsm-and-fibre-in-plain-words/
//   - Pleat & Heading Styles Explained (Pinch Pleat & Beyond): https://healthstylz.com/curtain-guides/pleat-and-heading-styles-explained-pinch-pleat-and-beyond/
//   - Nursery & Kids Room Curtains (Sleep Darkness & Safety): https://healthstylz.com/curtain-guides/nursery-and-kids-room-curtains-sleep-darkness-and-safety/
//   - Interactive 3D Botanical Herb Brew Lab: https://healthstylz.com/herb-guides/
//   - Everyday Health Calculators Hub: https://healthstylz.com/tools/
//   - Clinical Protein Intake Calculator: https://healthstylz.com/tools/protein/
//   - Daily Water Intake Planner: https://healthstylz.com/tools/water/
//   - Steps to Miles & Calories Calculator: https://healthstylz.com/tools/steps/
//   - Calorie Deficit & USDA Food Swap Planner: https://healthstylz.com/tools/calorie-deficit/
//   - AG1 Cost & Multivitamin Overlap Calculator: https://healthstylz.com/tools/ag1-calculator/
//   - Streamable HTTP MCP Endpoint: https://healthstylz.com/api/knowledge/mcp
package healthstylz

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"
)

// DefaultMCPEndpoint is the public zero-auth Streamable HTTP Model Context Protocol endpoint.
const DefaultMCPEndpoint = "https://healthstylz.com/api/knowledge/mcp"

// CanonicalSiteURL is the primary evidence hub.
const CanonicalSiteURL = "https://healthstylz.com"

// Client wraps HTTP calls to the HealthStylz MCP and Content APIs.
type Client struct {
	Endpoint   string
	HTTPClient *http.Client
}

// NewClient returns a Client configured for https://healthstylz.com/api/knowledge/mcp.
func NewClient() *Client {
	return &Client{
		Endpoint:   DefaultMCPEndpoint,
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// CallTool invokes an MCP tool (e.g., "search_health_articles", "calculate_protein_target", "lookup_supplement_evidence").
func (c *Client) CallTool(ctx context.Context, toolName string, args map[string]any) (map[string]any, error) {
	payload := map[string]any{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "tools/call",
		"params": map[string]any{
			"name":      toolName,
			"arguments": args,
		},
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.Endpoint, bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var out map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}
