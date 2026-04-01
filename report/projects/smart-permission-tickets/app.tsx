import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { marked } from "marked";
import { briefs, digest, methodology, taxonomy } from "../../src/data";
import type { Brief, FilterAxis } from "../../src/types";
import { FILTER_AXES } from "../../src/types";
import "./styles.css";

const AXIS_LABELS: Record<FilterAxis, string> = {
  archetype: "Role",
  stance: "Stance",
  use_cases: "Use Case",
  spec_topics: "Topic",
  concerns: "Concern",
  frameworks_referenced: "Framework",
};

function formatLabel(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Ehr /g, "EHR ")
    .replace(/Iam /g, "IAM ")
    .replace(/Cms /g, "CMS ")
    .replace(/Ds4P/gi, "DS4P")
    .replace(/Cds /g, "CDS ")
    .replace(/Udap/g, "UDAP")
    .replace(/Ocap/g, "OCAP")
    .replace(/Hl7V2/gi, "HL7v2")
    .replace(/Hl7v2/g, "HL7v2")
    .replace(/\bCda\b/g, "CDA")
    .replace(/\bIhe\b/g, "IHE")
    .replace(/\bHipaa\b/g, "HIPAA")
    .replace(/42Cfr/g, "42CFR")
    .replace(/Us Core/g, "US Core");
}

function getTaxonomyValues(axis: string): string[] {
  const ax = (taxonomy as Record<string, any>)[axis];
  if (!ax?.values) return [];
  if (Array.isArray(ax.values)) return ax.values;
  return Object.keys(ax.values);
}

function countForValue(
  allBriefs: Brief[],
  axis: FilterAxis,
  value: string,
  filters: Record<FilterAxis, Set<string>>,
  searchQuery: string
): number {
  return allBriefs.filter((b) => {
    const bValues =
      axis === "archetype" || axis === "stance"
        ? [b.frontmatter[axis]]
        : (b.frontmatter[axis] as string[]);
    if (!bValues.includes(value)) return false;
    for (const otherAxis of FILTER_AXES) {
      if (otherAxis === axis) continue;
      const active = filters[otherAxis];
      if (active.size === 0) continue;
      const bOtherValues =
        otherAxis === "archetype" || otherAxis === "stance"
          ? [b.frontmatter[otherAxis]]
          : (b.frontmatter[otherAxis] as string[]);
      if (!bOtherValues.some((v) => active.has(v))) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchable =
        `${b.frontmatter.role} ${b.frontmatter.org_type} ${b.body} ${b.frontmatter.key_terms.join(" ")}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  }).length;
}

type View = "briefs" | "digest" | "methodology";

function App() {
  const [filters, setFilters] = useState<Record<FilterAxis, Set<string>>>(
    () => {
      const init: Record<string, Set<string>> = {};
      for (const axis of FILTER_AXES) init[axis] = new Set();
      return init as Record<FilterAxis, Set<string>>;
    }
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedBriefs, setCollapsedBriefs] = useState<Set<string>>(
    new Set()
  );
  const [view, setView] = useState<View>("briefs");

  const toggleFilter = useCallback((axis: FilterAxis, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      const s = new Set(prev[axis]);
      if (s.has(value)) s.delete(value);
      else s.add(value);
      next[axis] = s;
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    const init: Record<string, Set<string>> = {};
    for (const axis of FILTER_AXES) init[axis] = new Set();
    setFilters(init as Record<FilterAxis, Set<string>>);
    setSearchQuery("");
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      FILTER_AXES.some((a) => filters[a].size > 0) || searchQuery.length > 0,
    [filters, searchQuery]
  );

  const filteredBriefs = useMemo(() => {
    return briefs.filter((b) => {
      for (const axis of FILTER_AXES) {
        const active = filters[axis];
        if (active.size === 0) continue;
        const bValues =
          axis === "archetype" || axis === "stance"
            ? [b.frontmatter[axis]]
            : (b.frontmatter[axis] as string[]);
        if (!bValues.some((v) => active.has(v))) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable =
          `${b.frontmatter.role} ${b.frontmatter.org_type} ${b.body} ${b.frontmatter.key_terms.join(" ")}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [filters, searchQuery]);

  const toggleBrief = useCallback((id: string) => {
    setCollapsedBriefs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedBriefs(
      new Set(filteredBriefs.map((b) => b.frontmatter.id))
    );
  }, [filteredBriefs]);

  const expandAll = useCallback(() => {
    setCollapsedBriefs(new Set());
  }, []);

  const [copyLabel, setCopyLabel] = useState("Copy for LLM");
  const copyForLlm = useCallback(() => {
    const parts: string[] = [];
    parts.push("# SMART Permission Tickets — Stakeholder Interview Briefs\n");
    parts.push(`${filteredBriefs.length} of ${briefs.length} briefs${hasActiveFilters ? " (filtered)" : ""}.\n`);
    parts.push("---\n");
    parts.push(digest);
    parts.push("\n---\n");
    for (const b of filteredBriefs) {
      const fm = b.frontmatter;
      parts.push(`\n${b.body}\n`);
      parts.push(`> Archetype: ${fm.archetype} | Stance: ${fm.stance} | Use cases: ${fm.use_cases.join(", ")} | Key terms: ${fm.key_terms.join(", ")}\n`);
      parts.push("\n---\n");
    }
    navigator.clipboard.writeText(parts.join("\n")).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy for LLM"), 2000);
    });
  }, [filteredBriefs, hasActiveFilters]);

  return (
    <div className="app">
      <header className="header">
        <h1>SMART Permission Tickets — Stakeholder Interview Report</h1>
        <p>
          {briefs.length} AI-mediated stakeholder discovery interviews,
          distilled into analytical briefs for the Argonaut Project.
        </p>
        <div className="header-actions">
          <button
            className={`btn ${view === "briefs" ? "active" : ""}`}
            onClick={() => setView("briefs")}
          >
            Briefs
          </button>
          <button
            className={`btn ${view === "digest" ? "active" : ""}`}
            onClick={() => setView("digest")}
          >
            Cross-Cutting Themes
          </button>
          <button
            className={`btn ${view === "methodology" ? "active" : ""}`}
            onClick={() => setView("methodology")}
          >
            Methodology
          </button>
        </div>
      </header>

      <div className="main">
        {view === "briefs" && (
          <>
            <aside className="sidebar">
              <input
                type="text"
                className="search-input"
                placeholder="Search briefs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {hasActiveFilters && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <button className="btn-clear" onClick={clearFilters}>
                    Clear all filters
                  </button>
                </div>
              )}
              {FILTER_AXES.map((axis) => {
                const values = getTaxonomyValues(axis);
                const activeCount = filters[axis].size;
                return (
                  <div className="filter-section" key={axis}>
                    <div className="filter-section-header">
                      <span>{formatLabel(axis)}</span>
                      {activeCount > 0 && (
                        <span className="count">{activeCount}</span>
                      )}
                    </div>
                    <div className="filter-tags">
                      {values.map((v) => {
                        const count = countForValue(
                          briefs,
                          axis,
                          v,
                          filters,
                          searchQuery
                        );
                        return (
                          <button
                            key={v}
                            className={`tag ${filters[axis].has(v) ? "active" : ""}`}
                            onClick={() => toggleFilter(axis, v)}
                          >
                            {formatLabel(v)}
                            <span className="tag-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </aside>

            <main className="content">
              <div className="results-count">
                {filteredBriefs.length} of {briefs.length} briefs
                {hasActiveFilters && " (filtered)"}
                <span
                  style={{ float: "right", display: "flex", gap: "0.5rem" }}
                >
                  <button className="btn-clear" onClick={expandAll}>
                    Expand all
                  </button>
                  <button className="btn-clear" onClick={collapseAll}>
                    Collapse all
                  </button>
                  <button className="btn" onClick={copyForLlm}>
                    {copyLabel}
                  </button>
                </span>
              </div>
              {filteredBriefs.map((brief) => (
                <BriefCard
                  key={brief.frontmatter.id}
                  brief={brief}
                  collapsed={collapsedBriefs.has(brief.frontmatter.id)}
                  onToggle={() => toggleBrief(brief.frontmatter.id)}
                  onTagClick={toggleFilter}
                />
              ))}
            </main>
          </>
        )}

        {view === "digest" && (
          <main className="content">
            <div className="doc-view">
              <span className="back-link" onClick={() => setView("briefs")}>
                &larr; Back to briefs
              </span>
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: marked(digest) as string }}
              />
            </div>
          </main>
        )}

        {view === "methodology" && (
          <main className="content">
            <div className="doc-view">
              <span className="back-link" onClick={() => setView("briefs")}>
                &larr; Back to briefs
              </span>
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{
                  __html: marked(methodology) as string,
                }}
              />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

function BriefCard({
  brief,
  collapsed,
  onToggle,
  onTagClick,
}: {
  brief: Brief;
  collapsed: boolean;
  onToggle: () => void;
  onTagClick: (axis: FilterAxis, value: string) => void;
}) {
  const fm = brief.frontmatter;
  return (
    <div className="brief-card">
      <div className="brief-card-header" onClick={onToggle}>
        <span className="brief-id">{fm.id.toUpperCase()}</span>
        <div className="brief-card-title">
          <h3>{fm.role}</h3>
          <span className="org-type">{fm.org_type}</span>
        </div>
        <div className="brief-card-meta">
          <span className={`archetype-badge ${fm.archetype}`}>
            {formatLabel(fm.archetype)}
          </span>
          <span className={`stance-badge ${fm.stance}`}>{fm.stance}</span>
        </div>
        <span className={`chevron ${collapsed ? "" : "open"}`}>&#9654;</span>
      </div>
      {!collapsed && (
        <div className="brief-card-body">
          <div className="frontmatter-tags">
            {fm.use_cases.length > 0 && (
              <TagGroup
                label="Use Cases"
                values={fm.use_cases}
                axis="use_cases"
                onTagClick={onTagClick}
              />
            )}
            {fm.spec_topics.length > 0 && (
              <TagGroup
                label="Topics"
                values={fm.spec_topics}
                axis="spec_topics"
                onTagClick={onTagClick}
              />
            )}
            {fm.concerns.length > 0 && (
              <TagGroup
                label="Concerns"
                values={fm.concerns}
                axis="concerns"
                onTagClick={onTagClick}
              />
            )}
            {fm.frameworks_referenced.length > 0 && (
              <TagGroup
                label="Frameworks"
                values={fm.frameworks_referenced}
                axis="frameworks_referenced"
                onTagClick={onTagClick}
                raw
              />
            )}
            {fm.key_terms.length > 0 && (
              <div className="tag-group">
                <span className="tag-group-label">Key Terms</span>
                {fm.key_terms.map((v) => (
                  <span key={v} className="key-term-tag">
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: marked(brief.body) as string }}
          />
        </div>
      )}
    </div>
  );
}

function TagGroup({
  label,
  values,
  axis,
  onTagClick,
  raw,
}: {
  label: string;
  values: string[];
  axis: FilterAxis;
  onTagClick: (axis: FilterAxis, value: string) => void;
  raw?: boolean;
}) {
  return (
    <div className="tag-group">
      <span className="tag-group-label">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          className="tag"
          onClick={(e) => {
            e.stopPropagation();
            onTagClick(axis, v);
          }}
        >
          {raw ? v : formatLabel(v)}
        </button>
      ))}
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
