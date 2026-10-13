export type UsageWindow = { kind: string; percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'router': { limits: UsageWindow[]; warning: UsageWindow | null; dismissed: string[] }
  }
}
