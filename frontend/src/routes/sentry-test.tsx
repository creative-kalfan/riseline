import { createFileRoute } from "@tanstack/react-router";
import * as Sentry from "@sentry/react";
import { initSentry } from "../lib/sentry";

export const Route = createFileRoute("/sentry-test")({
  head: () => ({
    meta: [
      { title: "CareerOS — Sentry Test" },
      {
        name: "description",
        content: "Sentry error reporting test page",
      },
    ],
  }),
  component: SentryTestPage,
});

function SentryTestPage() {
  const triggerTestException = () => {
    try {
      throw new Error("This is a test exception for Sentry verification");
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Sentry Test Page</h1>
        <p className="text-gray-600 mb-6">
          This page is for testing Sentry error reporting in the frontend. Click the button below to
          trigger a test exception.
        </p>

        <button
          onClick={triggerTestException}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Trigger Test Exception
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-800 mb-2">What to expect:</h2>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Clicking the button will throw an exception</li>
            <li>The exception should appear in your Sentry dashboard</li>
            <li>Sensitive data will be filtered according to our configuration</li>
            <li>The page should continue to work normally after the exception</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
