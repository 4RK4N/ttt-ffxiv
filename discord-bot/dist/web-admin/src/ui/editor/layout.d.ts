export declare function EditorLayout({ title, username, csrfToken, cspNonce, plugins, activeNamespace, panel, }: {
    title: string;
    username: string;
    csrfToken: string;
    cspNonce: string;
    plugins: Array<{
        namespace: string;
        title: string;
        enabled?: boolean;
    }>;
    activeNamespace: string;
    panel: unknown;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
//# sourceMappingURL=layout.d.ts.map