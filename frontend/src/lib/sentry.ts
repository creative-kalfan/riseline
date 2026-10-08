import * as Sentry from "@sentry/react";
import { browserTracingIntegration } from "@sentry/react";
import { isPerformanceTelemetrySafe } from "./performance-shield";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || "development";

  if (!dsn || dsn === "your-sentry-dsn-here") {
    console.info("No Sentry DSN configured, skipping Sentry initialization");
    return;
  }

  const beforeSend = (event: Sentry.ErrorEvent) => {
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        const data = breadcrumb.data;
        if (data) {
          const sensitiveFields = ["password", "api_key", "token", "jwt", "access_token"];
          sensitiveFields.forEach((field) => {
            if (data[field]) {
              data[field] = "[REDACTED]";
            }
          });
        }
        return breadcrumb;
      });
    }

    if (event.request) {
      const headers = event.request.headers;
      if (headers) {
        const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
        sensitiveHeaders.forEach((header) => {
          if (headers[header]) {
            headers[header] = "[REDACTED]";
          }
        });
      }

      if (event.request.url) {
        const sensitiveParams = ["api_key", "token", "jwt", "access_token"];
        let url = event.request.url;
        sensitiveParams.forEach((param) => {
          url = url.replace(new RegExp(`${param}=[^&]+`), `${param}=[REDACTED]`);
        });
        event.request.url = url;
      }
    }

    return event;
  };

  try {
    // browserTracingIntegration drives PerformanceObservers. In locked-down
    // contexts (incognito) entry reads can resolve undefined and crash on
    // `entry.startTime`, so only enable tracing when the environment proves
    // compliant. Error reporting stays on either way.
    const integrations = isPerformanceTelemetrySafe() ? [browserTracingIntegration()] : [];
    if (integrations.length === 0) {
      console.warn("Web-vitals monitoring disabled due to environment mismatch");
    }

    Sentry.init({
      dsn,
      environment,
      integrations,
      tracesSampleRate: 1.0,
      beforeSend,
    });

    console.info(`Sentry initialized for environment: ${environment}`);
  } catch (err) {
    console.warn("Sentry initialization failed; continuing without telemetry", err);
  }
}
