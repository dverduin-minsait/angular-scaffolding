import fs from 'node:fs';
import path from 'node:path';

const reportPath = path.resolve(process.cwd(), 'vitest-report.json');
if (!fs.existsSync(reportPath)) {
  console.error(`vitest report not found at ${reportPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(reportPath, 'utf8');
if (!raw.trim()) {
  console.error('vitest report is empty');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(raw);
} catch (e) {
  console.error('failed to parse vitest-report.json');
  console.error(e);
  process.exit(1);
}

const testResults = Array.isArray(report.testResults) ? report.testResults : [];
const failedResults = testResults.filter((r) => r?.status === 'failed');

const filterArg = process.argv.slice(2).join(' ').trim();
if (filterArg) {
  const matches = failedResults.filter((r) => String(r?.name ?? '').includes(filterArg));
  console.log(`Matched failed files: ${matches.length} (filter: ${filterArg})`);
  for (const r of matches) {
    console.log(`\nFILE: ${r.name}`);
    if (r.message) console.log(`FILE-ERROR: ${String(r.message).split('\n')[0]}`);
    const assertions = Array.isArray(r.assertionResults) ? r.assertionResults : [];
    const failures = assertions.filter((a) => a?.status === 'failed');
    console.log(`Failed tests: ${failures.length}`);
    for (const a of failures.slice(0, 50)) {
      const title = a.fullName || a.title || 'unknown-test';
      const msg = String((a.failureMessages?.[0] ?? '')).split('\n').slice(0, 4).join('\n');
      console.log(`- ${title}`);
      if (msg) console.log(msg);
    }
  }
  process.exit(0);
}

const byFile = new Map();
for (const r of failedResults) {
  const filePath = r.name || r.file || r.testFilePath || 'unknown-file';
  const assertions = Array.isArray(r.assertionResults) ? r.assertionResults : [];
  const failures = assertions
    .filter((a) => a?.status === 'failed')
    .map((a) => ({
      fullName: a.fullName || a.title || 'unknown-test',
      firstMessageLine: String((a.failureMessages?.[0] ?? '')).split('\n')[0]
    }));

  const unhandled = Array.isArray(r.unhandledErrors) ? r.unhandledErrors : [];
  const unhandledLines = unhandled
    .map((u) => String(u?.message ?? u?.stack ?? u ?? ''))
    .filter(Boolean)
    .map((s) => s.split('\n')[0]);

  const fileMessageLine = String(r.message ?? '').split('\n')[0];
  byFile.set(filePath, { failures, unhandledLines, fileMessageLine });
}

console.log(`Failed files: ${byFile.size}`);

for (const [filePath, { failures, unhandledLines, fileMessageLine }] of byFile.entries()) {
  const firstFailure = failures[0];
  const firstMessageLine = firstFailure?.firstMessageLine ?? '';
  const firstTestName = firstFailure?.fullName ?? '';
  const unhandledCount = unhandledLines.length;

  const parts = [
    filePath,
    `fails=${failures.length}`,
    `unhandled=${unhandledCount}`
  ];

  const maxInline = 180;
  const inlineFirst = firstTestName ? `first=${firstTestName}` : '';
  const inlineMsg = firstMessageLine ? `msg=${firstMessageLine}` : '';
  const inlineFileMsg = !inlineMsg && fileMessageLine ? `fileMsg=${fileMessageLine}` : '';
  const tail = [inlineFirst, inlineMsg].filter(Boolean).join(' | ');
  const base = `- ${parts.join(' | ')}`;

  const fullTail = [tail, inlineFileMsg].filter(Boolean).join(' | ');
  const line = fullTail ? `${base} | ${fullTail}` : base;
  console.log(line.length > maxInline ? `${line.slice(0, maxInline - 1)}…` : line);
}

if (failedResults.length === 0) {
  console.log('No failed results found in report.');
}
