export interface WelcomeCardOptions {
    avatarUrl: string;
    displayName: string;
}
/**
 * Renders a MEE6-style welcome card: the supplied background, the member's
 * avatar in a circle near the top, then a name line and subtitle in Dancing
 * Script. Returns a PNG buffer.
 */
export declare function renderWelcomeCard({ avatarUrl, displayName, }: WelcomeCardOptions): Promise<Buffer>;
//# sourceMappingURL=card.d.ts.map