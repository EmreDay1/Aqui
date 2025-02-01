// test.js
import { Lexer, Parser } from './lexer_and_parser.mjs';
import { Interpreter } from './interpreter.mjs';

const testCode = `
param width 200
param height 150
param radius width * 0.2

shape rectangle main {
    width: param.width
    height: param.height
    position: [0 0]
}

shape circle center {
    radius: param.radius
    position: [param.width/2 param.height/2]
}
`;

console.log("Testing AQUI Program\n");
console.log("Input Program:");
console.log(testCode);

try {
    // Parse
    const lexer = new Lexer(testCode);
    const parser = new Parser(lexer);
    const ast = parser.parse();
    
    console.log("\nAST:");
    console.log(JSON.stringify(ast, null, 2));

    // Interpret
    const interpreter = new Interpreter();
    const result = interpreter.interpret(ast);
    
    console.log("\nFinal Environment:");
    console.log("Parameters:", Object.fromEntries(result.parameters));
    console.log("Shapes:", Object.fromEntries(result.shapes));
    console.log("Layers:", Object.fromEntries(result.layers));

} catch (error) {
    console.error("\nError:", error.message);
    console.error("\nStack trace:", error.stack);
}
