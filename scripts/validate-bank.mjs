import fs from 'node:fs';
import assert from 'node:assert/strict';
const data = JSON.parse(fs.readFileSync(new URL('../src/data/questions.json', import.meta.url), 'utf8'));
assert.ok(data.length >= 200, 'Bank must contain at least 200 questions');
const idSet = new Set();
const textSet = new Set();
const topicCounts = new Map();
for (const q of data) {
  assert.equal(typeof q.id, 'string');
  assert.ok(!idSet.has(q.id), `Duplicate question ID: ${q.id}`);
  idSet.add(q.id);
  assert.ok(!textSet.has(q.question), `Duplicate question text: ${q.id}`);
  textSet.add(q.question);
  topicCounts.set(q.topicId, (topicCounts.get(q.topicId) ?? 0) + 1);
  assert.ok(Array.isArray(q.options) && q.options.length === 4, `Wrong option count: ${q.id}`);
  assert.equal(new Set(q.options.map(s => s.trim().toLocaleLowerCase('lv'))).size, 4, `Repeated option: ${q.id}`);
  assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3, `Bad answer key: ${q.id}`);
  assert.ok(q.theory.length >= 80 && q.takeaway.length >= 10 && q.source.length > 0, `Missing theory: ${q.id}`);
}
assert.equal(topicCounts.size, 15, 'Expected exactly 15 topics');
for (const count of topicCounts.values()) assert.equal(count, 15, 'Expected 15 questions for each topic');
console.log(`✓ Validated ${data.length} unique questions in ${topicCounts.size} topics, 4 distinct answers each.`);
