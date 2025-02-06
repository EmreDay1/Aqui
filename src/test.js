import { LogicalLexer, LogicalParser } from './logical_lexer_and_parser.mjs';
import { Interpreter } from './interpreter.mjs';

const input = `
if circle.radius > 10 and circle.radius < 20:
    rectangle box1
        width: 100
        height: 50
else:
    circle small_circle
        radius: 5
`;

const lexer = new LogicalLexer(input);
const parser = new LogicalParser(lexer);
const ast = parser.parse();

const interpreter = new Interpreter();
const result = interpreter.interpret(ast);

console.log('\nResult:');
console.log(result);
