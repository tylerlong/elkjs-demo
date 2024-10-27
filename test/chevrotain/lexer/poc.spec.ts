import { createToken, Lexer } from 'chevrotain';
import { describe, expect, test } from 'vitest';

const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});
const LCurly = createToken({ name: 'LCurly', pattern: /\{/ });
const PropKey = createToken({ name: 'PropKey', pattern: /\w+/ });
const Colon = createToken({
  name: 'Colon',
  pattern: /:/,
  push_mode: 'value_mode',
});
const PropValue = createToken({
  name: 'PropValue',
  pattern: /(?:[^{};\\]|\\.)+/,
  pop_mode: true,
});
const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
const RCurly = createToken({ name: 'RCurly', pattern: /\}/ });

export const multiModeLexerDefinition = {
  modes: {
    props_mode: [WhiteSpace, LCurly, PropKey, Semicolon, Colon, RCurly],
    value_mode: [WhiteSpace, PropValue],
  },
  defaultMode: 'props_mode',
};

const lexer = new Lexer(multiModeLexerDefinition);

describe('poc lexer', () => {
  test('simple', () => {
    const r = lexer.tokenize('{prop3: c; prop4: d}');
    expect(r.errors.length).toBe(0);
    const tokens = r.tokens.map((t) => `${t.tokenType.name}: ${t.image}`);
    expect(tokens).toEqual([
      'LCurly: {',
      'PropKey: prop3',
      'Colon: :',
      'PropValue: c',
      'Semicolon: ;',
      'PropKey: prop4',
      'Colon: :',
      'PropValue: d',
      'RCurly: }',
    ]);
  });
});
