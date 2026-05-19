import posthog from "posthog-js";

export function captureAnalyticsEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  posthog.capture(event, properties);
}
