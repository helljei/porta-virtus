#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

const RED = "\x1b[31m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m", NC = "\x1b[0m";
const ok = (m) => console.log(`${GREEN}[OK]${NC} ${m}`);
const warn = (m) => console.log(`${YELLOW}[WARN]${NC} ${m}`);
const fail = (m) => console.log(`${RED}[FAIL]${NC} ${m}`);

let exitCode = 0;

console.log("── 1. Verificando entorno ─");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const node = spawnSync("node", ["--version"], { encoding: "utf8" });
const npm = spawnSync(npmCmd, ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
if (node.status === 0) ok(`node ${node.stdout.trim()}`); else { fail("node no disponible"); exitCode = 1; }
if (npm.status === 0) ok(`npm ${npm.stdout.trim()}`); else { fail("npm no disponible"); exitCode = 1; }

console.log("── 2. Archivos base del arnés ─");
const baseFiles = [
  "AGENTS.md",
  "feature_list.json",
  "progress/current.md",
  "progress/history.md",
  "docs/architecture.md",
  "docs/conventions.md",
  "docs/verification.md",
  "CHECKPOINTS.md",
  ".claude/agents/leader.md",
  ".claude/agents/implementer.md",
  ".claude/agents/reviewer.md",
  ".claude/agents/explorer.md",
  ".claude/settings.json",
];
for (const f of baseFiles) {
  if (existsSync(resolve(__dirname, f))) ok(`Existe ${f}`);
  else { fail(`Falta ${f}`); exitCode = 1; }
}

console.log("── 3. Validar feature_list.json ─");
try {
  const data = JSON.parse(readFileSync(resolve(__dirname, "feature_list.json"), "utf8"));
  const valid = new Set(data.rules.valid_status);
  const inProgress = data.features.filter((f) => f.status === "in_progress");
  if (inProgress.length > 1) { fail(`${inProgress.length} features in_progress (max 1)`); exitCode = 1; }
  for (const f of data.features) {
    if (!valid.has(f.status)) { fail(`Estado inválido feature ${f.id}: ${f.status}`); exitCode = 1; }
  }
  ok(`feature_list.json válido (${data.features.length} features)`);
} catch (err) {
  fail(`feature_list.json inválido: ${err.message}`);
  exitCode = 1;
}

console.log("── 4. Verificación del producto ─");
if (existsSync(resolve(__dirname, "package.json"))) {
  const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"));
  const scripts = pkg.scripts || {};
  const spawnOpts = { encoding: "utf8", stdio: "inherit", shell: process.platform === "win32" };

  if (scripts.typecheck) {
    const r = spawnSync(npmCmd, ["run", "typecheck", "--silent"], spawnOpts);
    if (r.status === 0) ok("typecheck pasa"); else { fail("typecheck falla"); exitCode = 1; }
  } else {
    warn("script typecheck no definido (esperado en feature 1)");
  }

  if (scripts.test) {
    const r = spawnSync(npmCmd, ["test", "--silent", "--", "--run"], spawnOpts);
    if (r.status === 0) ok("tests pasan"); else { fail("tests fallan"); exitCode = 1; }
  } else {
    warn("script test no definido (esperado en feature 1)");
  }
} else {
  warn("package.json aún no existe (esperado antes de feature scaffold_vite)");
}

console.log("── 5. Resumen ─");
if (exitCode === 0) ok("Entorno listo");
else fail("Resuelve errores antes de avanzar");
process.exit(exitCode);
