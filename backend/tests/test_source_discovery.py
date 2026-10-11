"""Focused tests for ATS target discovery and candidate probing."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
import pytest

from app.services.jobs import source_discovery


@pytest.mark.asyncio
async def test_discover_ats_targets_probes_using_last_attempt_at(monkeypatch):
    """Ensure discovery queries and updates candidates via last_attempt_at without failing on missing last_discovery_probe_at."""
    mock_jobs_data = [
        {"url": "https://boards.greenhouse.io/acme/jobs/1"},
        {"url": "https://jobs.ashbyhq.com/beta/job/2"},
    ]

    upserted_rows = []
    selected_filters = []
    updated_records = []

    class MockTable:
        def __init__(self, name: str):
            self.name = name
            self.not_ = self

        def select(self, *args, **kwargs):
            return self

        def is_(self, *args, **kwargs):
            return self

        def limit(self, *args, **kwargs):
            return self

        def upsert(self, data, **kwargs):
            upserted_rows.append(data)
            return self

        def eq(self, column, val):
            selected_filters.append((column, val))
            return self

        def or_(self, expr):
            selected_filters.append(("or", expr))
            return self

        def update(self, values):
            updated_records.append(values)
            return self

        def execute(self):
            if self.name == "jobs":
                return MagicMock(data=mock_jobs_data)
            elif self.name == "crawl_targets":
                return MagicMock(data=[
                    {"source": "greenhouse", "slug": "acme"},
                    {"source": "ashby", "slug": "beta"},
                ])
            return MagicMock(data=[])

    class MockClient:
        def table(self, name: str):
            return MockTable(name)

    monkeypatch.setattr(source_discovery, "get_service_client", lambda: MockClient())
    monkeypatch.setattr(source_discovery, "_probe", AsyncMock(return_value="active"))

    result = await source_discovery.discover_ats_targets({})

    assert result == {"discovered": 2, "probed": 2}
    # Verify candidate selection uses last_attempt_at (NOT last_discovery_probe_at)
    or_filters = [expr for col, expr in selected_filters if col == "or"]
    assert any("last_attempt_at" in expr for expr in or_filters), f"Expected last_attempt_at in filter, got: {or_filters}"
    assert not any("last_discovery_probe_at" in expr for expr in or_filters), f"Did not expect last_discovery_probe_at in filter: {or_filters}"

    # Verify update writes last_attempt_at, status='active', and next_run_at
    assert len(updated_records) == 2
    for rec in updated_records:
        assert "last_attempt_at" in rec
        assert rec["status"] == "active"
        assert "next_run_at" in rec
        assert "last_discovery_probe_at" not in rec
