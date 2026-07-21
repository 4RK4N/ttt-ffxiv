import { describe, expect, it } from "vitest";
import {
  hasPublishableField,
  isBooleanField,
  isBooleanSubField,
  isMultiField,
  isMultiSubField,
  isObjectListField,
  isOptionListSubField,
  parseWebPlugin,
} from "../web-admin/src/plugins.js";
import type {
  WebPlugin,
  WebPluginField,
  WebPluginSubField,
} from "../web-admin/src/plugin-types.js";

describe("parseWebPlugin", () => {
  it("parses a valid editorConfig", () => {
    const plugin = parseWebPlugin("demo", {
      title: "Demo",
      fields: [
        {
          key: "channelId",
          label: "Channel",
          type: "channel",
          store: "config",
        },
        { key: "greeting", type: "text" },
      ],
    });
    expect(plugin).not.toBeNull();
    expect(plugin?.title).toBe("Demo");
    expect(plugin?.fields).toHaveLength(2);
    expect(plugin?.fields[0]?.store).toBe("config");
    expect(plugin?.fields[1]?.store).toBe("texts");
    expect(plugin?.fields[1]?.type).toBe("text");
  });

  it("skips fields with invalid type instead of coercing to text", () => {
    const plugin = parseWebPlugin("demo", {
      title: "Demo",
      fields: [
        { key: "ok", type: "text", store: "texts" },
        { key: "bad", type: "not-a-type", store: "texts" },
      ],
    });
    expect(plugin?.fields.map((f) => f.key)).toEqual(["ok"]);
  });

  it("skips fields with invalid store instead of coercing", () => {
    const plugin = parseWebPlugin("demo", {
      title: "Demo",
      fields: [
        { key: "ok", type: "text", store: "texts" },
        { key: "bad", type: "text", store: "secrets" },
      ],
    });
    expect(plugin?.fields.map((f) => f.key)).toEqual(["ok"]);
  });

  it("skips invalid object-list itemFields", () => {
    const plugin = parseWebPlugin("demo", {
      title: "Demo",
      fields: [
        {
          key: "panels",
          type: "object-list",
          store: "config",
          itemFields: [
            { key: "title", type: "text", store: "texts" },
            { key: "broken", type: "widget", store: "config" },
            { key: "alsoBroken", type: "text", store: "nope" },
          ],
        },
      ],
    });
    expect(plugin?.fields[0]?.itemFields?.map((f) => f.key)).toEqual(["title"]);
  });

  it("classifies field helper predicates", () => {
    const text: WebPluginField = {
      key: "t",
      label: "T",
      type: "text",
      store: "texts",
    };
    const multi: WebPluginField = {
      key: "m",
      label: "M",
      type: "channel-multi",
      store: "config",
    };
    const list: WebPluginField = {
      key: "l",
      label: "L",
      type: "object-list",
      store: "config",
      publishable: true,
      itemFields: [],
    };
    const boolSub: WebPluginSubField = {
      key: "b",
      label: "B",
      type: "boolean",
      store: "config",
    };
    const optSub: WebPluginSubField = {
      key: "o",
      label: "O",
      type: "option-list",
      store: "config",
    };
    const roleMultiSub: WebPluginSubField = {
      key: "r",
      label: "R",
      type: "role-multi",
      store: "config",
    };

    expect(isBooleanField({ ...text, type: "boolean" })).toBe(true);
    expect(isMultiField(multi)).toBe(true);
    expect(isObjectListField(list)).toBe(true);
    expect(isBooleanSubField(boolSub)).toBe(true);
    expect(isOptionListSubField(optSub)).toBe(true);
    expect(isMultiSubField(roleMultiSub)).toBe(true);

    const plugin: WebPlugin = {
      namespace: "demo",
      title: "Demo",
      fields: [list],
    };
    expect(hasPublishableField(plugin)).toBe(true);
    expect(hasPublishableField({ ...plugin, fields: [text] })).toBe(false);
  });
});
