// tests/hooks/skill-inject-core.test.mjs — Unit tests for skill-inject-core.mjs
// Covers: buildSkillInjectionOutput (skill name resolution for Skill() calls)
import { describe, it, expect } from "vitest";
import { buildSkillInjectionOutput } from "../../plugin/cloudbase/hooks/skill-inject-core.mjs";

describe("buildSkillInjectionOutput", () => {
  it("uses skill.name (frontmatter name) for Skill() tool call when it differs from directory key", () => {
    const skillMap = {
      "legacy-dir": {
        name: "branded-skill-name",
        description: "Synthetic mismatch for name resolution",
        metadata: { priority: 8 },
      },
    };
    const result = buildSkillInjectionOutput(["legacy-dir"], skillMap, "UserPromptSubmit");
    expect(result.additionalContext).toContain("Skill(branded-skill-name)");
    expect(result.additionalContext).not.toContain("Skill(legacy-dir)");
  });

  it("uses Skill() with directory id when name matches directory (Agent Skills Spec)", () => {
    const skillMap = {
      "auth-tool-cloudbase": {
        name: "auth-tool-cloudbase",
        description: "Auth tool skill",
        metadata: { priority: 8 },
      },
    };
    const result = buildSkillInjectionOutput(["auth-tool-cloudbase"], skillMap, "UserPromptSubmit");
    expect(result.additionalContext).toContain("Skill(auth-tool-cloudbase)");
  });

  it("uses searchKnowledgeBase with directory name (skillMap key)", () => {
    const skillMap = {
      "auth-tool-cloudbase": {
        name: "auth-tool-cloudbase",
        description: "Auth tool skill",
        metadata: { priority: 8 },
      },
    };
    const result = buildSkillInjectionOutput(["auth-tool-cloudbase"], skillMap, "UserPromptSubmit");
    expect(result.additionalContext).toContain(
      'searchKnowledgeBase(mode=skill, skillName="auth-tool-cloudbase")',
    );
  });

  it("falls back to skillName when skill.name is absent", () => {
    const skillMap = {
      "web-development": {
        description: "Web dev skill",
        metadata: { priority: 8 },
      },
    };
    const result = buildSkillInjectionOutput(["web-development"], skillMap, "UserPromptSubmit");
    expect(result.additionalContext).toContain("Skill(web-development)");
  });

  it("handles cloudbase main entry skill id", () => {
    const skillMap = {
      cloudbase: {
        name: "cloudbase",
        description: "Main entry skill",
        metadata: { priority: 8 },
      },
    };
    const result = buildSkillInjectionOutput(["cloudbase"], skillMap, "UserPromptSubmit");
    expect(result.additionalContext).toContain("Skill(cloudbase)");
  });

  it("returns null additionalContext for empty injectedSkills", () => {
    const result = buildSkillInjectionOutput([], {}, "UserPromptSubmit");
    expect(result.additionalContext).toBeNull();
  });

  it("includes docs block when metadata.docs present", () => {
    const skillMap = {
      "web-development": {
        name: "web-development",
        description: "Web dev",
        metadata: {
          priority: 8,
          docs: ["https://docs.example.com/web"],
        },
      },
    };
    const result = buildSkillInjectionOutput(["web-development"], skillMap, "UserPromptSubmit");
    expect(result.additionalContext).toContain("Official docs:");
    expect(result.additionalContext).toContain("https://docs.example.com/web");
  });
});
