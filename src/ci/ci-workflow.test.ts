import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";

// Load YAML files as text (no parsing library used, per spec's "no new deps" requirement)
let workflowContent: string;
let actionContent: string;

beforeAll(() => {
  const projectRoot = process.cwd();
  workflowContent = readFileSync(
    join(projectRoot, ".github/workflows/ci.yml"),
    "utf-8",
  );
  actionContent = readFileSync(
    join(projectRoot, ".github/actions/setup-deps/action.yml"),
    "utf-8",
  );
});

describe("CI Workflow — Happy path", () => {
  it("workflow file exists and is non-empty", () => {
    expect(workflowContent.length).toBeGreaterThan(0);
  });

  it("action file exists and is non-empty", () => {
    expect(actionContent.length).toBeGreaterThan(0);
  });

  it("workflow defines all four jobs", () => {
    expect(workflowContent).toContain("install:");
    expect(workflowContent).toContain("typecheck:");
    expect(workflowContent).toContain("unittest:");
    expect(workflowContent).toContain("trivy:");
  });

  it("workflow name is 'CI'", () => {
    expect(workflowContent).toContain("name: CI");
  });

  it("action name is 'Setup dependencies'", () => {
    expect(actionContent).toContain("name: Setup dependencies");
  });
});

describe("CI Workflow — PR trigger (⚠️ edge case)", () => {
  it("triggers on pull_request to master branch", () => {
    expect(workflowContent).toMatch(
      /on:\s*pull_request:\s*branches:\s*\[master\]/,
    );
  });
});

describe("CI Workflow — Least-privilege permissions (⚠️ edge case)", () => {
  it("permissions restrict to contents: read", () => {
    expect(workflowContent).toContain("permissions:");
    expect(workflowContent).toContain("contents: read");
  });
});

describe("CI Workflow — needs-graph linear chain (⚠️ edge case)", () => {
  it("typecheck needs install", () => {
    // Match the typecheck job and verify it has needs: install
    const typecheckSection = workflowContent.match(
      /typecheck:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    expect(typecheckSection).toBeDefined();
    expect(typecheckSection).toContain("needs: install");
  });

  it("unittest needs typecheck", () => {
    const unittestSection = workflowContent.match(
      /unittest:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    expect(unittestSection).toBeDefined();
    expect(unittestSection).toContain("needs: typecheck");
  });

  it("trivy needs unittest", () => {
    const trivySection = workflowContent.match(
      /trivy:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    expect(trivySection).toBeDefined();
    expect(trivySection).toContain("needs: unittest");
  });
});

describe("CI Workflow — Composite cache key correctness (⚠️ edge case)", () => {
  it("cache key includes hashFiles('pnpm-lock.yaml')", () => {
    expect(actionContent).toContain("hashFiles('pnpm-lock.yaml')");
  });

  it("cache path is node_modules", () => {
    expect(actionContent).toMatch(/path:\s*node_modules/);
  });

  it("cache key includes runner.os", () => {
    expect(actionContent).toContain("${{ runner.os }}");
  });
});

describe("CI Workflow — pnpm setup ordering (⚠️ edge case)", () => {
  it("pnpm/action-setup appears before actions/setup-node", () => {
    const pnpmIndex = actionContent.indexOf("pnpm/action-setup");
    const nodeIndex = actionContent.indexOf("actions/setup-node");
    expect(pnpmIndex).toBeLessThan(nodeIndex);
    expect(pnpmIndex).toBeGreaterThan(-1);
  });

  it("pnpm/action-setup step has no version input", () => {
    const pnpmStep = actionContent.match(
      /- name: Install pnpm[\s\S]*?uses: pnpm\/action-setup@v4[\s\S]*?(?=\n    - name:|$)/,
    )?.[0];
    expect(pnpmStep).toBeDefined();
    // Verify no "version:" key in the step configuration (not counting comments)
    // Extract just the configuration lines (not comment lines starting with #)
    const configLines = pnpmStep
      ?.split("\n")
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    expect(configLines).not.toMatch(/^\s+version:/m);
  });
});

describe("CI Workflow — Composite shell declaration (⚠️ edge case)", () => {
  it("fallback install step declares shell: bash", () => {
    expect(actionContent).toContain(
      "if: steps.cache.outputs.cache-hit != 'true'",
    );
    // Find the install step and verify it has shell: bash
    const installStep = actionContent.match(
      /- name: Install dependencies[\s\S]*?(?=\n    - name:|$)/,
    )?.[0];
    expect(installStep).toBeDefined();
    expect(installStep).toContain("shell: bash");
  });
});

describe("CI Workflow — Cross-job cache miss fallback (⚠️ edge case)", () => {
  it("install command uses --frozen-lockfile", () => {
    expect(actionContent).toContain("--frozen-lockfile");
  });

  it("install is guarded by cache-hit check", () => {
    expect(actionContent).toContain(
      "if: steps.cache.outputs.cache-hit != 'true'",
    );
    // Verify the condition and command are in the same step
    const fallbackSection = actionContent.match(
      /if: steps\.cache\.outputs\.cache-hit[\s\S]*?run:[\s\S]*?--frozen-lockfile/,
    )?.[0];
    expect(fallbackSection).toBeDefined();
  });
});

describe("CI Workflow — Commands match package.json scripts (⚠️ edge case)", () => {
  it("typecheck job runs 'pnpm typecheck'", () => {
    // Extract typecheck job
    const typecheckJob = workflowContent.match(
      /typecheck:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    expect(typecheckJob).toBeDefined();
    expect(typecheckJob).toContain("run: pnpm typecheck");
  });

  it("unittest job runs 'pnpm test'", () => {
    const unittestJob = workflowContent.match(
      /unittest:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    expect(unittestJob).toBeDefined();
    expect(unittestJob).toContain("run: pnpm test");
  });
});

describe("CI Workflow — Trivy policy (⚠️ edge case)", () => {
  it("Trivy scan-type is fs (filesystem)", () => {
    expect(workflowContent).toContain("scan-type: fs");
  });

  it("Trivy scan-ref is . (root)", () => {
    expect(workflowContent).toContain("scan-ref: .");
  });

  it("Trivy severity includes CRITICAL and HIGH", () => {
    expect(workflowContent).toContain("severity: CRITICAL,HIGH");
  });

  it("Trivy exit-code is '1' (string)", () => {
    // Match the exact string exit-code: "1"
    expect(workflowContent).toMatch(/exit-code:\s*"1"/);
  });

  it("Trivy includes vulnerability scanner", () => {
    expect(workflowContent).toContain("scanners: vuln,secret,misconfig");
  });

  it("Trivy ignores unfixed vulnerabilities", () => {
    expect(workflowContent).toContain("ignore-unfixed: true");
  });
});

describe("CI Workflow — Action version pinning (⚠️ edge case)", () => {
  it("actions/checkout is pinned to v4 in workflow", () => {
    expect(workflowContent).toContain("actions/checkout@v4");
  });

  it("pnpm/action-setup is pinned to v4 in composite action", () => {
    expect(actionContent).toContain("pnpm/action-setup@v4");
  });

  it("actions/setup-node is pinned to v4 in composite action", () => {
    expect(actionContent).toContain("actions/setup-node@v4");
  });

  it("actions/cache is pinned to v4 in composite action", () => {
    expect(actionContent).toContain("actions/cache@v4");
  });

  it("trivy-action is pinned to 0.28.0 in workflow", () => {
    expect(workflowContent).toContain("aquasecurity/trivy-action@0.28.0");
  });

  it("no actions in workflow use @main or @master refs", () => {
    expect(workflowContent).not.toMatch(/@main\s*$/m);
    expect(workflowContent).not.toMatch(/@master\s*$/m);
  });

  it("no actions in composite action use @main or @master refs", () => {
    expect(actionContent).not.toMatch(/@main\s*$/m);
    expect(actionContent).not.toMatch(/@master\s*$/m);
  });
});

describe("CI Workflow — Node version (⚠️ edge case)", () => {
  it("Node version is exactly 20.19.0", () => {
    expect(actionContent).toContain('node-version: "20.19.0"');
  });
});

describe("CI Workflow — All jobs run on ubuntu-latest", () => {
  it("install job runs on ubuntu-latest", () => {
    const installJob = workflowContent.match(
      /install:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    expect(installJob).toContain("runs-on: ubuntu-latest");
  });

  it("typecheck job runs on ubuntu-latest", () => {
    const typecheckJob = workflowContent.match(
      /typecheck:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    expect(typecheckJob).toContain("runs-on: ubuntu-latest");
  });

  it("unittest job runs on ubuntu-latest", () => {
    const unittestJob = workflowContent.match(
      /unittest:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    expect(unittestJob).toContain("runs-on: ubuntu-latest");
  });

  it("trivy job runs on ubuntu-latest", () => {
    const trivyJob = workflowContent.match(/trivy:[\s\S]*?(?=\n  \w+:|$)/)?.[0];
    expect(trivyJob).toContain("runs-on: ubuntu-latest");
  });
});

describe("CI Workflow — Concurrency (⚠️ edge case)", () => {
  it("concurrency is set with cancel-in-progress", () => {
    expect(workflowContent).toContain("concurrency:");
    expect(workflowContent).toContain(
      "group: ci-${{ github.workflow }}-${{ github.ref }}",
    );
    expect(workflowContent).toContain("cancel-in-progress: true");
  });
});

describe("CI Workflow — Composite action references", () => {
  it("all jobs reference ./.github/actions/setup-deps", () => {
    // All three dependency jobs should reference the action
    const installJob = workflowContent.match(
      /install:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    const typecheckJob = workflowContent.match(
      /typecheck:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];
    const unittestJob = workflowContent.match(
      /unittest:[\s\S]*?(?=\n  \w+:|$)/,
    )?.[0];

    expect(installJob).toContain("./.github/actions/setup-deps");
    expect(typecheckJob).toContain("./.github/actions/setup-deps");
    expect(unittestJob).toContain("./.github/actions/setup-deps");
  });

  it("trivy job does not reference setup-deps", () => {
    const trivyJob = workflowContent.match(/trivy:[\s\S]*?(?=\n  \w+:|$)/)?.[0];
    expect(trivyJob).not.toContain("./.github/actions/setup-deps");
  });
});

describe("YAML Structure — Basic validity", () => {
  it("workflow file starts with 'name:' key (valid YAML)", () => {
    expect(workflowContent.trim()).toMatch(/^name:/);
  });

  it("action file starts with 'name:' key (valid YAML)", () => {
    expect(actionContent.trim()).toMatch(/^name:/);
  });

  it("workflow has consistent indentation (2 spaces)", () => {
    // Check that there are no tabs mixed in and basic indentation is consistent
    expect(workflowContent).not.toContain("\t");
    // Spot-check a few expected indentation patterns
    expect(workflowContent).toMatch(/^jobs:/m);
    expect(workflowContent).toMatch(/^  install:/m);
    expect(workflowContent).toMatch(/^    runs-on:/m);
  });

  it("action has consistent indentation (2 spaces)", () => {
    expect(actionContent).not.toContain("\t");
    expect(actionContent).toMatch(/^runs:/m);
    expect(actionContent).toMatch(/^  steps:/m);
    expect(actionContent).toMatch(/^    - name:/m);
  });
});
