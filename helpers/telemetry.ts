import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

export type TelemetryEvent = {
  event: string;
  timestamp: number;
  nodeVersion: string;
  os: string;
  errorCode?: string;
};

function getTelemetryConfig(): boolean {
  try {
    const configPath = path.join(os.homedir(), ".config", "create-trpc-app", "config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (typeof config.telemetry === "boolean") return config.telemetry;
    }
  } catch {}
  return false;
}

export function shouldSendTelemetry(opts?: { telemetry?: boolean; noTelemetry?: boolean }): boolean {
  if (opts?.noTelemetry) return false;
  if (opts?.telemetry) return true;
  return getTelemetryConfig();
}

export async function sendTelemetry(event: TelemetryEvent): Promise<void> {
  if (!shouldSendTelemetry()) return;
  try {
    // Minimal, anonymous payload
    const payload = {
      ...event,
      hash: crypto.createHash("sha256").update(event.nodeVersion + event.os).digest("hex"),
    };
    // Replace with your telemetry endpoint
    await fetch("https://telemetry.example.com/cta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}
}
