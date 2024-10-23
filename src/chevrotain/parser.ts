import { CstParser } from 'chevrotain';

import { allTokens, Arrow, Identifier } from './lexer';

class ElkParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  flowchart = this.RULE('flowchart', () => {
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
  });

  statement = this.RULE('statement', () => {
    this.SUBRULE(this.connection);
  });

  connection = this.RULE('connection', () => {
    this.CONSUME(Identifier, { LABEL: 'from' });
    this.CONSUME(Arrow);
    this.CONSUME2(Identifier, { LABEL: 'to' });
  });
}

const parser = new ElkParser();

export default parser;
