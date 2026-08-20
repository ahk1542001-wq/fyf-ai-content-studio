"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/frontend/context/WorkspaceContext";

type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error";

type StyleExample = {
  id: string;
  workspaceId: string;
  topic: string;
  content: string;
};

type StyleExamplesPayload = {
  styleExamples: StyleExample[];
};

function isVicReference(example: StyleExample) {
  return /vic ai|vic\.ai/i.test(`${example.topic}\n${example.content}`);
}

export default function ReferencesPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "ws-fyf";

  const [status, setStatus] = useState<SaveStatus>("loading");
  const [message, setMessage] = useState("Loading approved references.");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [references, setReferences] = useState<StyleExample[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const visibleReferences = useMemo(() => references.filter((example) => !isVicReference(example)), [references]);
  const hiddenVicCount = references.length - visibleReferences.length;

  async function loadReferences() {
    setStatus("loading");
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/style-examples`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load references.");
      const data = (await response.json()) as StyleExamplesPayload;
      setReferences(data.styleExamples);
      setExpandedIds(new Set());
      setStatus("saved");
      setMessage("Reference library loaded.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not load references.");
    }
  }

  useEffect(() => {
    loadReferences();
  }, [workspaceId]);

  async function saveReference() {
    if (!topic.trim() || !content.trim()) {
      setStatus("error");
      setMessage("Topic and raw content are required before saving a reference.");
      return;
    }

    setStatus("saving");
    setMessage("Saving approved reference.");

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/style-examples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, content }),
      });

      if (!response.ok) throw new Error("Could not save reference.");

      const data = (await response.json()) as StyleExamplesPayload;
      setReferences(data.styleExamples);
      setExpandedIds(new Set());
      setTopic("");
      setContent("");
      setStatus("saved");
      setMessage("Saved as an approved FYF reference. Generated posts still will not auto-enter this library.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save reference.");
    }
  }

  async function deleteReference(id: string) {
    setStatus("saving");
    setMessage("Removing reference.");

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/style-examples?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Could not remove reference.");

      const data = (await response.json()) as StyleExamplesPayload;
      setReferences(data.styleExamples);
      setExpandedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setStatus("saved");
      setMessage("Reference removed.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not remove reference.");
    }
  }

  return (
    <section className="page-container wide">
      <div className="page-heading">
        <p className="eyebrow">Separate memory</p>
        <h1>References</h1>
        <p className="page-subtitle">
          Save only raw examples a human operator approves as reusable style guidance. This is not Page Data and not the generated Content library.
        </p>
      </div>

      <div className="flow-map" aria-label="Reference rules">
        <span>Page data stays in Brand</span>
        <span className="active">Raw examples live here</span>
        <span>Generated drafts stay in Content</span>
      </div>

      <section className="workspace-panel">
        <div className="panel-header">
          <div>
            <h2>Add raw reference</h2>
            <p>Paste a caption, reel text, or approved style example. AI can analyze later, but saving is manual.</p>
          </div>
          <span className={`status-indicator ${status}`}>{status === "idle" ? "Not saved" : status}</span>
        </div>

        <div className="details-grid">
          <div className="details-wide">
            <label className="field-label" htmlFor="topic">
              Raw topic / source label
            </label>
            <input
              id="topic"
              className="input-field"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Example: FYF Page reel — AI voice receptionist"
            />
          </div>
          <div className="details-wide">
            <label className="field-label" htmlFor="content">
              Raw content
            </label>
            <textarea
              id="content"
              className="input-field"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste the original caption or notes here. Keep it raw; analysis comes later."
              rows={7}
            />
          </div>
        </div>

        <div className="action-row">
          <button className="primary-button" type="button" onClick={saveReference} disabled={status === "saving"}>
            Save reference
          </button>
          <span className="helper-text">Manual approval gate: nothing is imported from Facebook automatically.</span>
        </div>
      </section>

      <section className="workspace-panel">
        <div className="panel-header">
          <div>
            <h2>Approved reference library</h2>
            <p>Use 3 to 5 relevant references per draft. More references can make the AI less focused.</p>
          </div>
          <span className="status-indicator saved">{visibleReferences.length} saved</span>
        </div>

        <div className="messaging">
          <strong>Manual gate:</strong> generated posts do not become references automatically. A human operator chooses what teaches the AI.
          {hiddenVicCount > 0 ? ` ${hiddenVicCount} Vic AI item(s) are hidden from this FYF library.` : ""}
        </div>

        {visibleReferences.length === 0 ? (
          <div className="empty-state">
            <strong>No approved FYF references yet</strong>
            <p>Add a Facebook Page post, reel caption, or approved visual reference after the Page review.</p>
          </div>
        ) : (
          <div className="reference-list">
            {visibleReferences.map((reference) => (
              <article key={reference.id} className={`reference-item ${expandedIds.has(reference.id) ? "expanded" : ""}`}>
                <div>
                  <h3>{reference.topic}</h3>
                  <p>{reference.content}</p>
                  {reference.content.length > 260 ? (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        setExpandedIds((current) => {
                          const next = new Set(current);
                          if (next.has(reference.id)) {
                            next.delete(reference.id);
                          } else {
                            next.add(reference.id);
                          }
                          return next;
                        })
                      }
                    >
                      {expandedIds.has(reference.id) ? "Show less" : "Show more"}
                    </button>
                  ) : null}
                </div>
                <button className="text-button danger-text" type="button" onClick={() => deleteReference(reference.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className={`form-message ${status}`}>{message}</p>
    </section>
  );
}
