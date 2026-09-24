import assert from "node:assert/strict";
import test from "node:test";
import { answerFromMemory } from "../lib/ask-memory.ts";
import { memories, people } from "../data/demo.ts";

const context = (patch = {}) => ({ memories, people, handled: [], dismissed: [], ...patch });

test("explains an inference with its original evidence and confidence", () => {
  const answer = answerFromMemory("Why do you think Mike likes golf?", context());
  assert.match(answer.text, /inferred/i);
  assert.match(answer.text, /three sample conversations/i);
  assert.match(answer.sources[0], /76%/);
});

test("does not reveal private or removed facts", () => {
  const privateMemories = memories.map(memory => memory.id === "m-mike-golf" ? { ...memory, privacy: "private" } : memory);
  assert.match(answerFromMemory("Why do you think Mike likes golf?", context({ memories: privateMemories })).text, /don't know/i);
  assert.match(answerFromMemory("Why do you think Mike likes golf?", context({ memories: memories.filter(memory => memory.id !== "m-mike-golf") })).text, /don't know/i);
});

test("uses edited values instead of stale sample answers", () => {
  const edited = memories.map(memory => memory.id === "m-mike-birthday" ? { ...memory, value: "December 5" } : memory);
  const answer = answerFromMemory("When is Mike's birthday?", context({ memories: edited }));
  assert.match(answer.text, /December 5/);
  assert.doesNotMatch(answer.text, /October 2/);
  const changedInterest = memories.map(memory => memory.id === "m-mike-golf" ? { ...memory, value: "Pickleball", label: "Possibly likes pickleball" } : memory);
  const interestAnswer = answerFromMemory("What does Mike like?", context({ memories: changedInterest }));
  assert.match(interestAnswer.text, /Pickleball/);
  assert.doesNotMatch(interestAnswer.text, /golf/i);
});

test("does not answer Sarah's birthday with Mike's date", () => {
  const answer = answerFromMemory("When is Sarah's birthday?", context());
  assert.match(answer.text, /don't know Sarah Thompson's birthday/i);
  assert.equal(answer.sources.length, 0);
});

test("does not present disputed information as fact", () => {
  const disputed = memories.map(memory => memory.id === "m-mike-golf" ? { ...memory, status: "disputed" } : memory);
  assert.match(answerFromMemory("Why do you think Mike likes golf?", context({ memories: disputed })).text, /needs review/i);
});

test("respects handled commitments and unknown facts", () => {
  assert.match(answerFromMemory("What open loops do I have?", context({ handled: ["steve"] })).text, /don't have an unresolved commitment/i);
  const unknown = answerFromMemory("What don't you know yet?", context());
  assert.match(unknown.text, /anniversary/i);
  assert.doesNotMatch(unknown.text, /TikTok/i);
});

test("answers the demo prompts from available memory", () => {
  const aboutMe = answerFromMemory("What do you remember about me?", context());
  assert.match(aboutMe.text, /live music/i);
  assert.doesNotMatch(aboutMe.text, /late evenings|Screen Time/i);
  assert.match(answerFromMemory("Who should I catch up with?", context()).text, /Chris Reed/);
  assert.match(answerFromMemory("What should I make time for?", context()).text, /outdoor concerts/i);
  assert.match(answerFromMemory("Who changed jobs recently?", context()).text, /Northstar Health/i);
});
