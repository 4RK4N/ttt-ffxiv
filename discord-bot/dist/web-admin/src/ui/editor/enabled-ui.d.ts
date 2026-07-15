/** Matches store readEnabled: only explicit false is off. */
export declare function isModuleEnabled(enabled: boolean | undefined): boolean;
export declare function StatusDot({ namespace, enabled, oob, }: {
    namespace: string;
    enabled: boolean | undefined;
    oob?: boolean;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function EnabledToggle({ namespace, enabled, }: {
    namespace: string;
    enabled: boolean | undefined;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
/** HTMX response fragment: re-render toggle + OOB sidebar status dot. */
export declare function EnabledToggleResponse({ namespace, enabled, }: {
    namespace: string;
    enabled: boolean;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
//# sourceMappingURL=enabled-ui.d.ts.map