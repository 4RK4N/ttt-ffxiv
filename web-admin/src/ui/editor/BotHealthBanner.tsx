import type { EditorContext } from "./context.js";

export function BotHealthBanner({ ctx }: { ctx: EditorContext }) {
  if (!ctx.botHealthError) return null;
  return (
    <div class="alert alert-danger mb-3" role="alert">
      {ctx.botHealthError}
    </div>
  );
}
