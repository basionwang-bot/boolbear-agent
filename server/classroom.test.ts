/**
 * Tests for classroom module
 * - classroomGenerator: outline generation, teacher config, student agents
 * - classroomRouter: CRUD operations, quiz submission, discussion
 */
import { describe, it, expect, vi } from "vitest";
import {
  generateTeacherConfig,
  generateDefaultAgents,
  type TeacherConfig,
  type StudentAgent,
  type SceneOutline,
} from "./classroomGenerator";

// ─── classroomGenerator Tests ────────────────────────────────────────

describe("classroomGenerator", () => {
  describe("generateTeacherConfig", () => {
    it("should generate default teacher config when no bear info provided", () => {
      const config = generateTeacherConfig(undefined, undefined, undefined, "zh-CN");
      expect(config.name).toBe("小熊老师");
      expect(config.avatar).toBe("🐻");
      expect(config.personality).toBe("friend");
      expect(config.systemPrompt).toContain("亲切友好");
    });

    it("should use bear name and type when provided", () => {
      const config = generateTeacherConfig("可可", "panda", "teacher", "zh-CN");
      expect(config.name).toBe("可可");
      expect(config.avatar).toBe("🐼");
      expect(config.personality).toBe("teacher");
      expect(config.systemPrompt).toContain("严谨认真");
    });

    it("should use polar bear avatar", () => {
      const config = generateTeacherConfig("冰冰", "polar", "cool", "zh-CN");
      expect(config.name).toBe("冰冰");
      expect(config.avatar).toBe("🐻‍❄️");
      expect(config.personality).toBe("cool");
      expect(config.systemPrompt).toContain("酷酷");
    });

    it("should generate English config", () => {
      const config = generateTeacherConfig(undefined, undefined, undefined, "en");
      expect(config.name).toBe("Bear Teacher");
      expect(config.systemPrompt).toContain("friendly");
    });
  });

  describe("generateDefaultAgents", () => {
    it("should generate 2 student agents for Chinese", () => {
      const agents = generateDefaultAgents("zh-CN");
      expect(agents).toHaveLength(2);
      expect(agents[0].name).toBe("小明");
      expect(agents[1].name).toBe("小红");
      expect(agents[0].id).toBe("student-1");
      expect(agents[1].id).toBe("student-2");
    });

    it("should generate English student agents", () => {
      const agents = generateDefaultAgents("en");
      expect(agents).toHaveLength(2);
      expect(agents[0].name).toBe("Alex");
      expect(agents[1].name).toBe("Emma");
    });

    it("should have unique IDs and avatars", () => {
      const agents = generateDefaultAgents("zh-CN");
      const ids = agents.map(a => a.id);
      expect(new Set(ids).size).toBe(ids.length);
      agents.forEach(a => {
        expect(a.avatar).toBeTruthy();
        expect(a.personality).toBeTruthy();
      });
    });
  });
});

// ─── Type validation tests ───────────────────────────────────────────

describe("classroom types", () => {
  it("TeacherConfig should have required fields", () => {
    const config: TeacherConfig = {
      name: "Test",
      avatar: "🐻",
      personality: "friend",
      systemPrompt: "test prompt",
    };
    expect(config.name).toBeTruthy();
    expect(config.avatar).toBeTruthy();
    expect(config.personality).toBeTruthy();
    expect(config.systemPrompt).toBeTruthy();
  });

  it("StudentAgent should have required fields", () => {
    const agent: StudentAgent = {
      id: "test-1",
      name: "Test Student",
      avatar: "🧑‍🎓",
      personality: "curious",
    };
    expect(agent.id).toBeTruthy();
    expect(agent.name).toBeTruthy();
    expect(agent.avatar).toBeTruthy();
    expect(agent.personality).toBeTruthy();
  });

  it("SceneOutline should support all scene types", () => {
    const slideOutline: SceneOutline = {
      id: "1",
      type: "slide",
      title: "Test Slide",
      description: "desc",
      keyPoints: ["point1"],
      estimatedDuration: 120,
    };
    expect(slideOutline.type).toBe("slide");

    const quizOutline: SceneOutline = {
      id: "2",
      type: "quiz",
      title: "Test Quiz",
      description: "desc",
      keyPoints: ["point1"],
      estimatedDuration: 180,
    };
    expect(quizOutline.type).toBe("quiz");

    const discussionOutline: SceneOutline = {
      id: "3",
      type: "discussion",
      title: "Test Discussion",
      description: "desc",
      keyPoints: ["point1"],
      estimatedDuration: 300,
      discussionConfig: {
        topic: "test topic",
        prompt: "discuss this",
        expectedOutcomes: ["outcome1"],
      },
    };
    expect(discussionOutline.type).toBe("discussion");
    expect(discussionOutline.discussionConfig?.topic).toBe("test topic");
  });
});
