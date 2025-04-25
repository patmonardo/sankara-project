import { Command } from "./types";

/**
 * Simple command creation helper that aligns with your filter.cmd.ts expectations
 */
export function createCommand<TOutput = any>(options: {
  name: string;
  description: string;
  handler: () => TOutput | Promise<TOutput>;
}): Command<TOutput> {
  return {
    name: options.name,
    description: options.description,
    execute: async (context) => {
      try {
        return await options.handler();
      } catch (error) {
        console.error(`Error executing command "${options.name}":`, error);
        throw error;
      }
    }
  };
}