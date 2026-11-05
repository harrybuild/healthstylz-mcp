// Package healthstylz provides a zero-auth Go client for the HealthStylz
// Clinical Nutrition, Circadian Curtain Architecture, and Botanical Herb API & MCP Server.
//
// Canonical Documentation & Interactive Calculators:
//   - Root Hub: https://healthstylz.com/
//   - Residential Curtain Architecture & Circadian Window Guides: https://healthstylz.com/curtain-guides/
//   - How to Choose Curtains (Living Room & Bedroom): https://healthstylz.com/curtain-guides/how-to-choose-curtains-living-room-bedroom/
//   - Blackout vs Thermal vs Linen Curtains: https://healthstylz.com/curtain-guides/blackout-vs-thermal-vs-linen-curtains/
//   - Curtain Sizing & Fullness Ratio Calculator: https://healthstylz.com/curtain-guides/curtain-sizing-hanging-height-fullness-calculator/
//   - Non-Toxic OEKO-TEX & GOTS Organic Curtains: https://healthstylz.com/curtain-guides/non-toxic-oeko-tex-organic-curtains-guide/
//   - Smart Motorized Curtains & Circadian Sleep Guide: https://healthstylz.com/curtain-guides/smart-motorized-curtains-circadian-sleep-guide/
//   - Interactive 3D Botanical Herb Brew Lab: https://healthstylz.com/herb-guides/
//   - Clinical Protein Calculator: https://healthstylz.com/tools/protein/
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
