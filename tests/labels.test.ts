import { describe, expect, it } from "vitest";
import { activityText, describeApproval, groupFindings, providerName, ruleName, taskStatusName } from "../src/lib/labels";

describe("plain-language labels", () => {
  it("describes a Figma approval as a sentence, and says plainly that a real file is edited", () => {
    const action = JSON.stringify({ operation: "apply_in_figma_plugin", payload: { changes: [{ property: "colour", from: "#164B9B", to: "#2457F5", count: 6 }, { property: "typeface", from: "Inter", to: "Geist", count: 5 }, { property: "radius", from: "4px", to: "8px", count: 1 }] } });
    const v = describeApproval(action, "Document", "figma-plugin:Document");
    expect(v.kind).toBe("figma"); expect(v.summary).toBe("Change 6 colours from #164B9B to #2457F5, 5 fonts from Inter to Geist and 1 corner radius from 4px to 8px."); expect(v.whatHappens).toContain("real Figma file"); expect(v.whatHappens).not.toContain("simulat");
    expect(JSON.stringify(v)).not.toContain("apply_in_figma_plugin"); // no raw operation names or JSON leak to people
  });
  it("tells the truth for each kind of target", () => {
    expect(describeApproval(JSON.stringify({ operation: "apply_in_canva_mcp", payload: { changes: [] } }), "Poster", "canva-mcp:Poster").whatHappens).toContain("real Canva design");
    const gh = describeApproval(JSON.stringify({ operation: "replace_tokens", payload: {} }), "jo/site", "gh:jo/site"); expect(gh.kind).toBe("github"); expect(gh.whatHappens).toContain("never merges");
    const sample = describeApproval(JSON.stringify({ operation: "replace_tokens", payload: {} }), "Nexa web fixture", "nexa-web"); expect(sample.kind).toBe("sample"); expect(sample.whatHappens).toContain("simulated");
    expect(describeApproval("not json", "x").kind).toBe("other");
  });
  it("groups repeated issues into one card with a list of places", () => {
    const row = (id: string, ev: string, extra = {}) => ({ id, provider: "figma", resource_name: "Document", rule_id: "primary-colour", detected_value: "#164B9B", expected_value: "#2457F5", severity: "high", confidence: 1, evidence: ev, recommended_action: "x", classification: "confirmed", ...extra });
    const groups = groupFindings([row("1", "Orb: #164B9B"), row("2", "Logo: #164B9B"), row("3", "Orb: #164B9B"), row("4", "Copy: 2.6:1", { rule_id: "text-contrast", classification: "needs_review", detected_value: "2.6:1" })]);
    expect(groups).toHaveLength(2); expect(groups[0].count).toBe(3); expect(groups[0].places).toEqual(["Orb", "Logo"]); expect(groups[1].classification).toBe("needs_review");
  });
  it("never shows raw enums", () => {
    expect(providerName("canva")).toBe("Canva"); expect(ruleName("primary-colour")).toBe("Brand colour"); expect(taskStatusName("AWAITING_APPROVAL")).toBe("Waiting for approval");
    expect(activityText("task_transition", "AWAITING_APPROVAL")).toBe("moved the task to “Waiting for approval”"); expect(activityText("room_message", "posted in room")).toBe("replied in the chat room");
    expect(activityText("approval_decision", "APPROVED (by chat reply, relayed by Brand Director; not login-verified)")).toBe("Approved (by chat reply)");
  });
});
