import { assertSlugId } from "../../../../shared/core/discordIds.js";
import type { Context } from "hono";
import type { WebConfig } from "../../config.js";
import { ensureCsrfToken } from "../../auth.js";
import type { WebPlugin } from "../../plugin-types.js";
import type { SessionUser } from "../../auth.js";
import { hasPublishableField } from "../../plugins.js";
import {
  DataReadError,
  readValues,
  ValidationError,
  writeEnabled,
  writeValues,
} from "../../store.js";
import { publishPanel, resolveBotActionError, unpublishPanel } from "../../botClient.js";
import { buildEditorModule, loadEditorContext, parseExpanded } from "./data.js";
import { formBodyToValues } from "./form-parse.js";
import {
  defaultObjectItem,
  defaultOptionItem,
  findObjectListField,
  getObjectListItems,
  getOptionListItems,
  mergeRowFromForm,
  rowKeyForItem,
  toggleExpanded,
} from "./htmx-handlers.js";
import { EnabledToggleResponse } from "./enabled-ui.js";
import { ModulePanel } from "./ModulePanel.js";
import { ObjectListRow } from "./Field.js";
import { ObjectListRowsOnly } from "./fields/ObjectListField.js";
import { OptionListRowsOnly } from "./fields/OptionListField.js";
import type { EditorContext } from "./context.js";

type Env = { Variables: { user: SessionUser } };
type HonoCtx = Context<Env>;

export interface HtmxDeps {
  cfg: WebConfig;
  byNamespace: Map<string, WebPlugin>;
}

async function ctxAndMod(c: HonoCtx, deps: HtmxDeps, namespace: string) {
  const plugin = deps.byNamespace.get(namespace);
  if (!plugin) return null;
  const csrfToken = await ensureCsrfToken(c, deps.cfg);
  const ctx = await loadEditorContext(deps.cfg, csrfToken);
  const mod = buildEditorModule(plugin);
  return { plugin, ctx, mod };
}

function panelProps(
  mod: ReturnType<typeof buildEditorModule>,
  ctx: EditorContext,
  expanded: string[],
  status?: { ok: boolean; message: string },
) {
  return { mod, ctx, expanded, status };
}

function publishItemIdError(itemId: string): string | null {
  try {
    assertSlugId(itemId, "Panel id");
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Invalid panel id.";
  }
}

export async function renderPanel(
  c: HonoCtx,
  deps: HtmxDeps,
  namespace: string,
  expanded: string[],
  status?: { ok: boolean; message: string },
) {
  const data = await ctxAndMod(c, deps, namespace);
  if (!data) return c.text(`Unknown module "${namespace}".`, 404);
  return c.html(
    <ModulePanel {...panelProps(data.mod, data.ctx, expanded, status)} />,
  );
}

export function registerHtmxRoutes(
  htmx: import("hono").Hono<Env>,
  deps: HtmxDeps,
): void {
  htmx.get("/modules/:namespace/panel", async (c) => {
    const namespace = c.req.param("namespace");
    const expanded = parseExpanded(c.req.query("expanded"));
    return renderPanel(c, deps, namespace, expanded);
  });

  htmx.put("/modules/:namespace", async (c) => {
    const namespace = c.req.param("namespace");
    const plugin = deps.byNamespace.get(namespace);
    if (!plugin) return c.text(`Unknown module "${namespace}".`, 404);

    const body = await c.req.parseBody();
    const expanded = parseExpanded(c.req.query("expanded"));
    const values = formBodyToValues(plugin, body);

    try {
      const saved = await writeValues(plugin, values);
      console.log(
        `[web] ${c.get("user").username} updated "${namespace}" via HTMX.`,
      );
      const csrfToken = await ensureCsrfToken(c, deps.cfg);
      const ctx = await loadEditorContext(deps.cfg, csrfToken);
      const mod = buildEditorModule(plugin);
      mod.values = saved;
      return c.html(
        <ModulePanel
          {...panelProps(mod, ctx, expanded, { ok: true, message: "Saved" })}
        />,
      );
    } catch (err) {
      const message =
        err instanceof ValidationError || err instanceof DataReadError
          ? err.message
          : "Failed to save changes.";
      const csrfToken = await ensureCsrfToken(c, deps.cfg);
      const ctx = await loadEditorContext(deps.cfg, csrfToken);
      const mod = buildEditorModule(plugin);
      return c.html(
        <ModulePanel
          {...panelProps(mod, ctx, expanded, { ok: false, message })}
        />,
        400,
      );
    }
  });

  htmx.put("/modules/:namespace/enabled", async (c) => {
    const namespace = c.req.param("namespace");
    if (!deps.byNamespace.has(namespace)) {
      return c.text(`Unknown module "${namespace}".`, 404);
    }

    let enabled = false;
    const contentType = c.req.header("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await c.req.json()) as { enabled?: unknown };
      enabled = body.enabled === true;
    } else {
      const body = await c.req.parseBody();
      enabled = body.enabled === "true";
    }

    try {
      await writeEnabled(namespace, enabled);
      console.log(
        `[web] ${c.get("user").username} ${enabled ? "enabled" : "disabled"} module "${namespace}".`,
      );
      return c.html(
        <EnabledToggleResponse namespace={namespace} enabled={enabled} />,
      );
    } catch (err) {
      console.error(`[web] Failed to set enabled for "${namespace}":`, err);
      return c.text("Failed to save changes.", 500);
    }
  });

  htmx.post("/modules/:namespace/list/:fieldKey/add", async (c) => {
    const namespace = c.req.param("namespace");
    const fieldKey = c.req.param("fieldKey");
    const plugin = deps.byNamespace.get(namespace);
    const field = plugin ? findObjectListField(plugin, fieldKey) : null;
    if (!plugin || !field) return c.text("Not found", 404);

    const body = await c.req.parseBody();
    const expanded = parseExpanded(c.req.query("expanded"));
    const items = getObjectListItems(plugin, body, fieldKey);
    items.push(defaultObjectItem(field));

    const csrfToken = await ensureCsrfToken(c, deps.cfg);
    const ctx = await loadEditorContext(deps.cfg, csrfToken);

    return c.html(
      <ObjectListRowsOnly
        field={field}
        items={items}
        ctx={ctx}
        namespace={namespace}
        expanded={expanded}
      />,
    );
  });

  htmx.post("/modules/:namespace/list/:fieldKey/remove/:index", async (c) => {
    const namespace = c.req.param("namespace");
    const fieldKey = c.req.param("fieldKey");
    const index = Number(c.req.param("index"));
    const plugin = deps.byNamespace.get(namespace);
    const field = plugin ? findObjectListField(plugin, fieldKey) : null;
    if (!plugin || !field || !Number.isFinite(index))
      return c.text("Not found", 404);

    const body = await c.req.parseBody();
    const expanded = parseExpanded(c.req.query("expanded"));
    const items = getObjectListItems(plugin, body, fieldKey);
    items.splice(index, 1);

    const csrfToken = await ensureCsrfToken(c, deps.cfg);
    const ctx = await loadEditorContext(deps.cfg, csrfToken);

    return c.html(
      <ObjectListRowsOnly
        field={field}
        items={items}
        ctx={ctx}
        namespace={namespace}
        expanded={expanded}
      />,
    );
  });

  htmx.post("/modules/:namespace/row/:fieldKey/:index/toggle", async (c) => {
    const namespace = c.req.param("namespace");
    const fieldKey = c.req.param("fieldKey");
    const index = Number(c.req.param("index"));
    const plugin = deps.byNamespace.get(namespace);
    const field = plugin ? findObjectListField(plugin, fieldKey) : null;
    if (!plugin || !field || !Number.isFinite(index))
      return c.text("Not found", 404);

    const body = await c.req.parseBody();
    let expanded = parseExpanded(c.req.query("expanded"));
    const items = getObjectListItems(plugin, body, fieldKey);
    const row = items[index];
    if (row) {
      const key = rowKeyForItem(row, index);
      expanded = toggleExpanded(expanded, key);
    }

    const csrfToken = await ensureCsrfToken(c, deps.cfg);
    const ctx = await loadEditorContext(deps.cfg, csrfToken);

    return c.html(
      <ObjectListRow
        field={field}
        row={row ?? {}}
        rowIndex={index}
        ctx={ctx}
        namespace={namespace}
        expanded={expanded}
      />,
    );
  });

  htmx.post("/modules/:namespace/row/:fieldKey/:index/refresh", async (c) => {
    const namespace = c.req.param("namespace");
    const fieldKey = c.req.param("fieldKey");
    const index = Number(c.req.param("index"));
    const plugin = deps.byNamespace.get(namespace);
    const field = plugin ? findObjectListField(plugin, fieldKey) : null;
    if (!plugin || !field || !Number.isFinite(index))
      return c.text("Not found", 404);

    const body = await c.req.parseBody();
    const expanded = parseExpanded(c.req.query("expanded"));
    const items = formBodyToValues(plugin, body);
    const listRaw = items[fieldKey];
    const listItems = Array.isArray(listRaw)
      ? (listRaw as Record<string, unknown>[])
      : getObjectListItems(plugin, body, fieldKey);
    const row =
      listItems[index] ?? mergeRowFromForm(plugin, body, fieldKey, index);

    const csrfToken = await ensureCsrfToken(c, deps.cfg);
    const ctx = await loadEditorContext(deps.cfg, csrfToken);

    return c.html(
      <ObjectListRow
        field={field}
        row={row}
        rowIndex={index}
        ctx={ctx}
        namespace={namespace}
        expanded={expanded}
      />,
    );
  });

  htmx.post(
    "/modules/:namespace/list/:fieldKey/option/:optionKey/add/:rowIndex",
    async (c) => {
      const namespace = c.req.param("namespace");
      const fieldKey = c.req.param("fieldKey");
      const optionKey = c.req.param("optionKey");
      const rowIndex = Number(c.req.param("rowIndex"));
      const plugin = deps.byNamespace.get(namespace);
      const field = plugin ? findObjectListField(plugin, fieldKey) : null;
      const sub = field?.itemFields?.find(
        (s) => s.key === optionKey && s.type === "option-list",
      );
      if (!plugin || !field || !sub || !Number.isFinite(rowIndex))
        return c.text("Not found", 404);

      const body = await c.req.parseBody();
      const items = getObjectListItems(plugin, body, fieldKey);
      const row = items[rowIndex] ?? {};
      const opts = getOptionListItems(row, optionKey);
      opts.push(defaultOptionItem());
      row[optionKey] = opts;
      items[rowIndex] = row;

      const csrfToken = await ensureCsrfToken(c, deps.cfg);
      const ctx = await loadEditorContext(deps.cfg, csrfToken);
      const name = `${fieldKey}[${rowIndex}].${optionKey}`;

      return c.html(
        <OptionListRowsOnly
          f={sub}
          name={name}
          items={opts}
          ctx={ctx}
          namespace={namespace}
          fieldKey={fieldKey}
          rowIndex={rowIndex}
        />,
      );
    },
  );

  htmx.post(
    "/modules/:namespace/list/:fieldKey/option/:optionKey/remove/:rowIndex/:optIndex",
    async (c) => {
      const namespace = c.req.param("namespace");
      const fieldKey = c.req.param("fieldKey");
      const optionKey = c.req.param("optionKey");
      const rowIndex = Number(c.req.param("rowIndex"));
      const optIndex = Number(c.req.param("optIndex"));
      const plugin = deps.byNamespace.get(namespace);
      const field = plugin ? findObjectListField(plugin, fieldKey) : null;
      const sub = field?.itemFields?.find(
        (s) => s.key === optionKey && s.type === "option-list",
      );
      if (
        !plugin ||
        !field ||
        !sub ||
        !Number.isFinite(rowIndex) ||
        !Number.isFinite(optIndex)
      ) {
        return c.text("Not found", 404);
      }

      const body = await c.req.parseBody();
      const items = getObjectListItems(plugin, body, fieldKey);
      const row = items[rowIndex] ?? {};
      const opts = getOptionListItems(row, optionKey);
      opts.splice(optIndex, 1);
      row[optionKey] = opts;
      items[rowIndex] = row;

      const csrfToken = await ensureCsrfToken(c, deps.cfg);
      const ctx = await loadEditorContext(deps.cfg, csrfToken);
      const name = `${fieldKey}[${rowIndex}].${optionKey}`;

      return c.html(
        <OptionListRowsOnly
          f={sub}
          name={name}
          items={opts}
          ctx={ctx}
          namespace={namespace}
          fieldKey={fieldKey}
          rowIndex={rowIndex}
        />,
      );
    },
  );

  htmx.post("/modules/:namespace/publish/:itemId", async (c) => {
    const namespace = c.req.param("namespace");
    const itemId = c.req.param("itemId");
    const idError = publishItemIdError(itemId);
    if (idError) return c.text(idError, 400);
    const plugin = deps.byNamespace.get(namespace);
    if (!plugin || !hasPublishableField(plugin)) {
      return c.text(`Module "${namespace}" does not support publishing.`, 404);
    }

    const body = await c.req.parseBody();
    const expanded = parseExpanded(c.req.query("expanded"));
    try {
      const values = formBodyToValues(plugin, body);
      await writeValues(plugin, values);
      await publishPanel(deps.cfg, namespace, itemId);
      console.log(
        `[web] ${c.get("user").username} published ${namespace} panel "${itemId}".`,
      );
      const csrfToken = await ensureCsrfToken(c, deps.cfg);
      const ctx = await loadEditorContext(deps.cfg, csrfToken);
      const mod = buildEditorModule(plugin);
      mod.values = readValues(plugin);
      return c.html(
        <ModulePanel
          {...panelProps(mod, ctx, expanded, {
            ok: true,
            message: "Published",
          })}
        />,
      );
    } catch (err) {
      const csrfToken = await ensureCsrfToken(c, deps.cfg);
      const ctx = await loadEditorContext(deps.cfg, csrfToken);
      const mod = buildEditorModule(plugin);
      const message = resolveBotActionError(
        ctx,
        err,
        "Failed to publish panel.",
      );
      return c.html(
        <ModulePanel
          {...panelProps(mod, ctx, expanded, { ok: false, message })}
        />,
        400,
      );
    }
  });

  htmx.post("/modules/:namespace/unpublish/:itemId", async (c) => {
    const namespace = c.req.param("namespace");
    const itemId = c.req.param("itemId");
    const idError = publishItemIdError(itemId);
    if (idError) return c.text(idError, 400);
    const plugin = deps.byNamespace.get(namespace);
    if (!plugin || !hasPublishableField(plugin)) {
      return c.text(
        `Module "${namespace}" does not support unpublishing.`,
        404,
      );
    }

    const expanded = parseExpanded(c.req.query("expanded"));
    try {
      await unpublishPanel(deps.cfg, namespace, itemId);
      console.log(
        `[web] ${c.get("user").username} unpublished ${namespace} panel "${itemId}".`,
      );
      const csrfToken = await ensureCsrfToken(c, deps.cfg);
      const ctx = await loadEditorContext(deps.cfg, csrfToken);
      const mod = buildEditorModule(plugin);
      mod.values = readValues(plugin);
      return c.html(
        <ModulePanel
          {...panelProps(mod, ctx, expanded, {
            ok: true,
            message: "Unpublished",
          })}
        />,
      );
    } catch (err) {
      const csrfToken = await ensureCsrfToken(c, deps.cfg);
      const ctx = await loadEditorContext(deps.cfg, csrfToken);
      const mod = buildEditorModule(plugin);
      const message = resolveBotActionError(
        ctx,
        err,
        "Failed to unpublish panel.",
      );
      return c.html(
        <ModulePanel
          {...panelProps(mod, ctx, expanded, { ok: false, message })}
        />,
        400,
      );
    }
  });
}
