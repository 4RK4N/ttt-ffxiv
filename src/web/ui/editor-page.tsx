import type { SessionUser } from '../auth.js';
import type { WebPlugin } from '../plugin-types.js';
import { readEnabled } from '../store.js';
import type { WebConfig } from '../config.js';
import { buildEditorModule, loadEditorContext } from './editor/data.js';
import { EditorBody, EditorLayout } from './editor/layout.js';
import { ModulePanel } from './editor/ModulePanel.js';

export async function EditorPage({
  cfg,
  user,
  csrfToken,
  tablerCssUrl,
  plugins,
  activeNamespace,
}: {
  cfg: WebConfig;
  user: SessionUser;
  csrfToken: string;
  tablerCssUrl: string;
  plugins: WebPlugin[];
  activeNamespace?: string;
}) {
  const ctx = await loadEditorContext(cfg, csrfToken);
  const activePlugin =
    plugins.find((p) => p.namespace === (activeNamespace ?? plugins[0]?.namespace)) ?? plugins[0];
  const mod = activePlugin ? buildEditorModule(activePlugin) : null;

  const pluginList = plugins.map((p) => ({
    namespace: p.namespace,
    title: p.title,
    enabled: readEnabled(p.namespace),
  }));

  const panel = mod ? <ModulePanel mod={mod} ctx={ctx} expanded={[]} /> : null;

  return (
    <EditorLayout
      title={`${cfg.botName} Admin Interface`}
      username={user.username}
      csrfToken={csrfToken}
      tablerCssUrl={tablerCssUrl}
    >
      <EditorBody
        plugins={pluginList}
        activeNamespace={activePlugin?.namespace ?? ''}
        panel={panel}
      />
    </EditorLayout>
  );
}
