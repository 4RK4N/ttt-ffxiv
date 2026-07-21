import { describe, expect, it } from "vitest";
import { mergeObjectListRow } from "../web-admin/src/store.js";
import { validateEmbedPanelRow } from "../shared/modules/custom-embeds/validate.js";
import { validateRolePanelRow } from "../shared/modules/reaction-roles/validate.js";
import { validateTicketTypeRow } from "../shared/modules/tickets/validate.js";
import type { WebPluginSubField } from "../web-admin/src/plugin-types.js";

function splitRow(
  row: Record<string, unknown>,
  itemFields: WebPluginSubField[],
): { configRow: Record<string, unknown>; textRow: Record<string, unknown> } {
  const configRow: Record<string, unknown> = { id: row.id };
  const textRow: Record<string, unknown> = {};
  for (const sub of itemFields) {
    const store = sub.store ?? "config";
    if (store === "texts") textRow[sub.key] = row[sub.key];
    else configRow[sub.key] = row[sub.key];
  }
  return { configRow, textRow };
}

const ticketItemFields: WebPluginSubField[] = [
  { key: "emoji", label: "Emoji", type: "text", store: "config" },
  { key: "channelId", label: "Channel", type: "channel", store: "config" },
  { key: "staffRoleId", label: "Staff role", type: "role", store: "config" },
  {
    key: "deniedRoleIds",
    label: "Denied roles",
    type: "role-multi",
    store: "config",
  },
  {
    key: "roleActionRoleId",
    label: "Role action role",
    type: "role",
    store: "config",
  },
  { key: "openButtonLabel", label: "Open", type: "text", store: "texts" },
  { key: "panelTitle", label: "Title", type: "text", store: "texts" },
  {
    key: "panelDescription",
    label: "Description",
    type: "textarea",
    store: "texts",
  },
  {
    key: "ticketWelcome",
    label: "Welcome",
    type: "textarea",
    store: "texts",
    maxLength: 4096,
  },
  { key: "closeButtonLabel", label: "Close", type: "text", store: "texts" },
  {
    key: "roleActionButtonLabel",
    label: "Role action label",
    type: "text",
    store: "texts",
  },
  {
    key: "roleActionConfirmation",
    label: "Role action confirm",
    type: "textarea",
    store: "texts",
  },
  {
    key: "confirmClosePrompt",
    label: "Close prompt",
    type: "textarea",
    store: "texts",
  },
  { key: "confirmCloseYes", label: "Yes", type: "text", store: "texts" },
  { key: "confirmCloseNo", label: "No", type: "text", store: "texts" },
  { key: "ticketClosed", label: "Closed", type: "textarea", store: "texts" },
  { key: "deleteButtonLabel", label: "Delete", type: "text", store: "texts" },
  {
    key: "confirmDeletePrompt",
    label: "Delete prompt",
    type: "textarea",
    store: "texts",
  },
  {
    key: "confirmDeleteYes",
    label: "Delete yes",
    type: "text",
    store: "texts",
  },
  { key: "confirmDeleteNo", label: "Delete no", type: "text", store: "texts" },
  { key: "ticketDeleted", label: "Deleted", type: "textarea", store: "texts" },
  {
    key: "alreadyOpen",
    label: "Already open",
    type: "textarea",
    store: "texts",
  },
  {
    key: "openSuccess",
    label: "Open success",
    type: "textarea",
    store: "texts",
  },
  { key: "roleDenied", label: "Role denied", type: "textarea", store: "texts" },
];

const embedItemFields: WebPluginSubField[] = [
  { key: "channelId", label: "Channel", type: "channel", store: "config" },
  {
    key: "showTimestamp",
    label: "Timestamp",
    type: "boolean",
    store: "config",
  },
  { key: "panelTitle", label: "Title", type: "text", store: "texts" },
  {
    key: "panelDescription",
    label: "Description",
    type: "textarea",
    store: "texts",
  },
  { key: "authorName", label: "Author", type: "text", store: "texts" },
  { key: "authorIconUrl", label: "Icon", type: "text", store: "texts" },
  { key: "footer", label: "Footer", type: "text", store: "texts" },
];

const rolePanelItemFields: WebPluginSubField[] = [
  { key: "channelId", label: "Channel", type: "channel", store: "config" },
  {
    key: "reactionType",
    label: "Type",
    type: "select",
    store: "config",
  },
  { key: "toggleable", label: "Toggle", type: "boolean", store: "config" },
  { key: "panelTitle", label: "Title", type: "text", store: "texts" },
  {
    key: "panelDescription",
    label: "Description",
    type: "textarea",
    store: "texts",
  },
  {
    key: "ephemeralMessage",
    label: "Ephemeral",
    type: "textarea",
    store: "texts",
  },
  {
    key: "roleOptions",
    label: "Options",
    type: "option-list",
    store: "config",
  },
  {
    key: "emojiHelp",
    label: "Emoji help",
    type: "text",
    store: "texts",
    visibleWhen: { reactionType: ["emoji"] },
  },
];

describe("mergeObjectListRow", () => {
  it("keeps other ticket fields when form posts previous values and updates ticketWelcome", () => {
    const prev: Record<string, unknown> = {
      id: "nsfw-yes",
      channelId: "123456789012345678",
      staffRoleId: "111111111111111111",
      deniedRoleIds: [],
      openButtonLabel: "Open ticket",
      panelTitle: "Support",
      ticketWelcome: "Hi {mention}",
      closeButtonLabel: "Close ticket",
      confirmClosePrompt: "Close?",
      confirmCloseYes: "Yes",
      confirmCloseNo: "No",
      deleteButtonLabel: "DELETE",
      confirmDeletePrompt: "Delete?",
      confirmDeleteYes: "Yes",
      confirmDeleteNo: "No",
      ticketClosed: "Closed.",
      ticketDeleted: "Deleted.",
      alreadyOpen: "Already open.",
      openSuccess: "Created {thread}",
      roleDenied: "Denied.",
      roleActionButtonLabel: "Grant",
      roleActionConfirmation: "Done.",
    };
    const incoming = {
      ...prev,
      ticketWelcome: "Updated welcome {mention}",
    };

    const merged = mergeObjectListRow(incoming, prev, ticketItemFields);

    expect(merged.ticketWelcome).toBe("Updated welcome {mention}");
    expect(merged.openButtonLabel).toBe("Open ticket");

    const { configRow, textRow } = splitRow(merged, ticketItemFields);
    expect(() => validateTicketTypeRow(configRow, textRow)).not.toThrow();
  });

  it("preserves long ticketWelcome when form updates another field with prior values", () => {
    const longWelcome = "w".repeat(2500);
    const prev: Record<string, unknown> = {
      id: "nsfw-yes",
      channelId: "123456789012345678",
      staffRoleId: "111111111111111111",
      deniedRoleIds: [],
      openButtonLabel: "Open ticket",
      panelTitle: "Support",
      ticketWelcome: longWelcome,
      closeButtonLabel: "Close ticket",
      confirmClosePrompt: "Close?",
      confirmCloseYes: "Yes",
      confirmCloseNo: "No",
      deleteButtonLabel: "DELETE",
      confirmDeletePrompt: "Delete?",
      confirmDeleteYes: "Yes",
      confirmDeleteNo: "No",
      ticketClosed: "Closed.",
      ticketDeleted: "Deleted.",
      alreadyOpen: "Already open.",
      openSuccess: "Created {thread}",
      roleDenied: "Denied.",
      roleActionButtonLabel: "Grant",
      roleActionConfirmation: "Done.",
    };
    const incoming = {
      ...prev,
      openButtonLabel: "Updated label",
    };

    const merged = mergeObjectListRow(incoming, prev, ticketItemFields);

    expect(merged.ticketWelcome).toBe(longWelcome);
    const { configRow, textRow } = splitRow(merged, ticketItemFields);
    expect(() => validateTicketTypeRow(configRow, textRow)).not.toThrow();
  });

  it("keeps other embed fields when form updates panelDescription", () => {
    const prev: Record<string, unknown> = {
      id: "rules",
      channelId: "123456789012345678",
      showTimestamp: false,
      panelTitle: "Rules",
      panelDescription: "Original description",
      authorName: "",
      authorIconUrl: "",
      footer: "",
    };
    const incoming = {
      ...prev,
      panelDescription: "Updated description",
    };

    const merged = mergeObjectListRow(incoming, prev, embedItemFields);

    expect(merged.panelDescription).toBe("Updated description");
    expect(merged.panelTitle).toBe("Rules");
    expect(merged.channelId).toBe("123456789012345678");

    const { configRow, textRow } = splitRow(merged, embedItemFields);
    expect(() => validateEmbedPanelRow(configRow, textRow)).not.toThrow();
  });

  it("clears a visible optional embed field when submitted blank", () => {
    const prev: Record<string, unknown> = {
      id: "rules",
      channelId: "123456789012345678",
      showTimestamp: false,
      panelTitle: "Rules",
      panelDescription: "Body",
      authorName: "Author",
      authorIconUrl: "https://example.com/icon.png",
      footer: "Footer text",
    };
    const incoming = {
      ...prev,
      footer: "",
      authorName: "",
    };

    const merged = mergeObjectListRow(incoming, prev, embedItemFields);

    expect(merged.footer).toBe("");
    expect(merged.authorName).toBe("");
    expect(merged.panelTitle).toBe("Rules");
  });

  it("preserves a hidden field when submitted blank", () => {
    const prev: Record<string, unknown> = {
      id: "roles",
      channelId: "123456789012345678",
      reactionType: "button",
      toggleable: true,
      panelTitle: "Pick roles",
      panelDescription: "Choose below",
      ephemeralMessage: "",
      emojiHelp: "Only for emoji mode",
      roleOptions: [
        {
          id: "opt1",
          roleId: "222222222222222222",
          emoji: "",
          label: "Member",
        },
      ],
    };
    const incoming = {
      ...prev,
      panelTitle: "Updated title",
      emojiHelp: "",
    };

    const merged = mergeObjectListRow(incoming, prev, rolePanelItemFields);

    expect(merged.panelTitle).toBe("Updated title");
    expect(merged.emojiHelp).toBe("Only for emoji mode");
    expect(merged.roleOptions).toEqual(prev.roleOptions);

    const { configRow, textRow } = splitRow(merged, rolePanelItemFields);
    expect(() => validateRolePanelRow(configRow, textRow)).not.toThrow();
  });

  it("preserves stored role panel fields when form updates panelTitle", () => {
    const prev: Record<string, unknown> = {
      id: "roles",
      channelId: "123456789012345678",
      reactionType: "button",
      toggleable: true,
      panelTitle: "Pick roles",
      panelDescription: "Choose below",
      ephemeralMessage: "",
      roleOptions: [
        {
          id: "opt1",
          roleId: "222222222222222222",
          emoji: "",
          label: "Member",
        },
      ],
    };
    const incoming = {
      ...prev,
      panelTitle: "Updated title",
    };

    const merged = mergeObjectListRow(incoming, prev, rolePanelItemFields);

    expect(merged.panelTitle).toBe("Updated title");
    expect(merged.panelDescription).toBe("Choose below");
    expect(merged.roleOptions).toEqual(prev.roleOptions);

    const { configRow, textRow } = splitRow(merged, rolePanelItemFields);
    expect(() => validateRolePanelRow(configRow, textRow)).not.toThrow();
  });
});
