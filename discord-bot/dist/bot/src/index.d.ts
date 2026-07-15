import { Client } from "discord.js";
export interface BotRuntime {
    client: Client;
    destroy: () => Promise<void>;
}
export declare function startBot(): Promise<BotRuntime>;
//# sourceMappingURL=index.d.ts.map