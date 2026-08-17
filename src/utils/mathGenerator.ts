import { Question, OperationType, DifficultyLevel } from '../types';

export function generateQuestions(
  operation: OperationType,
  difficulty: DifficultyLevel,
  count: number = 10
): Question[] {
  const questions: Question[] = [];

  for (let i = 1; i <= count; i++) {
    questions.push(generateSingleQuestion(i, operation, difficulty));
  }

  return questions;
}

function getRandomInteger(min: number, max: number, avoidZero: boolean = true): number {
  let val = 0;
  while (val === 0 && avoidZero) {
    val = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return val;
}

function generateSingleQuestion(
  id: number,
  operation: OperationType,
  difficulty: DifficultyLevel
): Question {
  // If puzzle mode
  if (operation === 'puzzle') {
    return generatePuzzleQuestion(id, difficulty);
  }

  // If hard difficulty with parentheses
  if (difficulty === 'hard') {
    return generateHardBracketQuestion(id, operation);
  }

  // Determine actual operation type if mixed
  let currentOp: 'multiplication' | 'division' = 'multiplication';
  if (operation === 'multiplication') {
    currentOp = 'multiplication';
  } else if (operation === 'division') {
    currentOp = 'division';
  } else {
    currentOp = Math.random() > 0.5 ? 'multiplication' : 'division';
  }

  const maxVal = difficulty === 'easy' ? 10 : 25;
  const minVal = difficulty === 'easy' ? -10 : -25;

  if (currentOp === 'multiplication') {
    let num1 = getRandomInteger(minVal, maxVal, true);
    let num2 = getRandomInteger(minVal, maxVal, true);
    // Ensure numbers are not all positive (at least one negative number)
    while (num1 > 0 && num2 > 0) {
      num1 = getRandomInteger(minVal, maxVal, true);
      num2 = getRandomInteger(minVal, maxVal, true);
    }
    const ans = num1 * num2;

    const str1 = num1 < 0 ? `(${num1})` : `${num1}`;
    const str2 = num2 < 0 ? `(${num2})` : `${num2}`;
    const exprDisplay = `${str1} × ${str2}`;

    const signRule = getMultiplicationSignRuleText(num1, num2);
    const explanation = [
      `โจทย์: ${exprDisplay}`,
      `พิจารณาเครื่องหมาย: ${signRule}`,
      `คิดคำนวณตัวเลข: ${Math.abs(num1)} × ${Math.abs(num2)} = ${Math.abs(ans)}`,
      `สรุปคำตอบ: ${exprDisplay} = ${ans}`,
    ];

    return {
      id,
      num1,
      num2,
      operationSymbol: '×',
      operationType: 'multiplication',
      expressionDisplay: exprDisplay,
      correctAnswer: ans,
      explanationSteps: explanation,
    };
  } else {
    // Division: ensure exact integer result and at least one negative operand
    let divisor = getRandomInteger(difficulty === 'easy' ? -8 : -15, difficulty === 'easy' ? 8 : 15, true);
    let quotient = getRandomInteger(minVal, maxVal, true);
    let dividend = divisor * quotient;
    while (dividend > 0 && divisor > 0) {
      divisor = getRandomInteger(difficulty === 'easy' ? -8 : -15, difficulty === 'easy' ? 8 : 15, true);
      quotient = getRandomInteger(minVal, maxVal, true);
      dividend = divisor * quotient;
    }

    const str1 = dividend < 0 ? `(${dividend})` : `${dividend}`;
    const str2 = divisor < 0 ? `(${divisor})` : `${divisor}`;
    const exprDisplay = `${str1} ÷ ${str2}`;

    const signRule = getDivisionSignRuleText(dividend, divisor);
    const explanation = [
      `โจทย์: ${exprDisplay}`,
      `พิจารณาเครื่องหมาย: ${signRule}`,
      `คิดคำนวณตัวเลข: ${Math.abs(dividend)} ÷ ${Math.abs(divisor)} = ${Math.abs(quotient)}`,
      `สรุปคำตอบ: ${exprDisplay} = ${quotient}`,
    ];

    return {
      id,
      num1: dividend,
      num2: divisor,
      operationSymbol: '÷',
      operationType: 'division',
      expressionDisplay: exprDisplay,
      correctAnswer: quotient,
      explanationSteps: explanation,
    };
  }
}

function generateHardBracketQuestion(id: number, operation: OperationType): Question {
  // Generate expressions with brackets like [(-12) + 4] × (-3) or [(-48) ÷ 6] × (-2)
  const patternType = Math.floor(Math.random() * 3);

  if (patternType === 0) {
    // [a + b] × c
    let a = getRandomInteger(-12, 12, true);
    let b = getRandomInteger(-12, 12, true);
    let c = getRandomInteger(-8, 8, true);
    while (a > 0 && b > 0 && c > 0) {
      a = getRandomInteger(-12, 12, true);
      b = getRandomInteger(-12, 12, true);
      c = getRandomInteger(-8, 8, true);
    }
    const innerSum = a + b;
    const ans = innerSum * c;

    const strA = a < 0 ? `(${a})` : `${a}`;
    const strB = b < 0 ? `(${b})` : `${b}`;
    const strC = c < 0 ? `(${c})` : `${c}`;

    const exprDisplay = `[${strA} + ${strB}] × ${strC}`;
    const innerSign = innerSum < 0 ? `(${innerSum})` : `${innerSum}`;

    const explanation = [
      `โจทย์: ${exprDisplay}`,
      `ขั้นที่ 1: คำนวณในวงเล็บใหญ่ [${strA} + ${strB}] ได้คำตอบเป็น ${innerSum}`,
      `ขั้นที่ 2: นำผลลัพธ์มาคูณกับตัวหลัง: ${innerSign} × ${strC}`,
      `พิจารณาเครื่องหมาย: ${getMultiplicationSignRuleText(innerSum, c)}`,
      `คำนวณ: ${Math.abs(innerSum)} × ${Math.abs(c)} = ${Math.abs(ans)}`,
      `สรุปคำตอบ: ${exprDisplay} = ${ans}`,
    ];

    return {
      id,
      num1: innerSum,
      num2: c,
      operationSymbol: '×',
      operationType: 'multiplication',
      expressionDisplay: exprDisplay,
      correctAnswer: ans,
      explanationSteps: explanation,
    };
  } else if (patternType === 1) {
    // [a × b] ÷ c
    let b = getRandomInteger(-6, 6, true);
    let c = getRandomInteger(-6, 6, true);
    let targetQuotient = getRandomInteger(-10, 10, true);
    while (b > 0 && c > 0 && targetQuotient > 0) {
      b = getRandomInteger(-6, 6, true);
      c = getRandomInteger(-6, 6, true);
      targetQuotient = getRandomInteger(-10, 10, true);
    }

    const innerProd = c * targetQuotient;
    // a * b = innerProd -> a = innerProd / b if divisible
    const a = innerProd;
    const innerRes = a * b;
    const ans = innerRes / c;

    const strA = a < 0 ? `(${a})` : `${a}`;
    const strB = b < 0 ? `(${b})` : `${b}`;
    const strC = c < 0 ? `(${c})` : `${c}`;

    const exprDisplay = `[${strA} × ${strB}] ÷ ${strC}`;
    const innerStr = innerRes < 0 ? `(${innerRes})` : `${innerRes}`;

    const explanation = [
      `โจทย์: ${exprDisplay}`,
      `ขั้นที่ 1: คำนวณในวงเล็บใหญ่ [${strA} × ${strB}] = ${innerRes}`,
      `ขั้นที่ 2: นำผลลัพธ์มาหารด้วยตัวหลัง: ${innerStr} ÷ ${strC}`,
      `พิจารณาเครื่องหมาย: ${getDivisionSignRuleText(innerRes, c)}`,
      `คำนวณ: ${Math.abs(innerRes)} ÷ ${Math.abs(c)} = ${Math.abs(ans)}`,
      `สรุปคำตอบ: ${exprDisplay} = ${ans}`,
    ];

    return {
      id,
      num1: innerRes,
      num2: c,
      operationSymbol: '÷',
      operationType: 'division',
      expressionDisplay: exprDisplay,
      correctAnswer: ans,
      explanationSteps: explanation,
    };
  } else {
    // a × [b - c]
    let a = getRandomInteger(-8, 8, true);
    let b = getRandomInteger(-10, 10, true);
    let c = getRandomInteger(-10, 10, true);
    while (a > 0 && b > 0 && c > 0) {
      a = getRandomInteger(-8, 8, true);
      b = getRandomInteger(-10, 10, true);
      c = getRandomInteger(-10, 10, true);
    }
    const innerDiff = b - c;
    const ans = a * innerDiff;

    const strA = a < 0 ? `(${a})` : `${a}`;
    const strB = b < 0 ? `(${b})` : `${b}`;
    const strC = c < 0 ? `(${c})` : `${c}`;

    const exprDisplay = `${strA} × [${strB} - ${strC}]`;
    const innerStr = innerDiff < 0 ? `(${innerDiff})` : `${innerDiff}`;

    const explanation = [
      `โจทย์: ${exprDisplay}`,
      `ขั้นที่ 1: คำนวณในวงเล็บใหญ่ [${strB} - ${strC}] = ${innerDiff}`,
      `ขั้นที่ 2: นำตัวหน้าคูณกับผลลัพธ์ในวงเล็บ: ${strA} × ${innerStr}`,
      `พิจารณาเครื่องหมาย: ${getMultiplicationSignRuleText(a, innerDiff)}`,
      `คำนวณ: ${Math.abs(a)} × ${Math.abs(innerDiff)} = ${Math.abs(ans)}`,
      `สรุปคำตอบ: ${exprDisplay} = ${ans}`,
    ];

    return {
      id,
      num1: a,
      num2: innerDiff,
      operationSymbol: '×',
      operationType: 'multiplication',
      expressionDisplay: exprDisplay,
      correctAnswer: ans,
      explanationSteps: explanation,
    };
  }
}

function generatePuzzleQuestion(id: number, difficulty: DifficultyLevel): Question {
  const puzzleType = Math.floor(Math.random() * 3);

  if (puzzleType === 0) {
    // Product puzzle
    let a = getRandomInteger(-12, 12, true);
    let b = getRandomInteger(-12, 12, true);
    while (a > 0 && b > 0) {
      a = getRandomInteger(-12, 12, true);
      b = getRandomInteger(-12, 12, true);
    }
    const p = a * b;

    const strA = a < 0 ? `(${a})` : `${a}`;
    const exprDisplay = `ผลคูณของสองจำนวนเต็มเท่ากับ ${p} ถ้าจำนวนหนึ่งคือ ${strA} อีกจำนวนหนึ่งมีค่าเท่าใด?`;

    const explanation = [
      `โจทย์ทาย: ${exprDisplay}`,
      `จากความสัมพันธ์: (จำนวนที่หนึ่ง) × (จำนวนที่สอง) = ผลคูณ`,
      `แทนค่า: ${strA} × (x) = ${p}`,
      `ย้ายข้างเพื่อหาค่า x: x = ${p} ÷ ${strA}`,
      `พิจารณาเครื่องหมาย: ${getDivisionSignRuleText(p, a)}`,
      `สรุปคำตอบ: จำนวนนั้นคือ ${b}`,
    ];

    return {
      id,
      num1: p,
      num2: a,
      operationSymbol: '÷',
      operationType: 'division',
      expressionDisplay: exprDisplay,
      correctAnswer: b,
      explanationSteps: explanation,
    };
  } else if (puzzleType === 1) {
    // Division puzzle
    let divisor = getRandomInteger(-10, 10, true);
    let quotient = getRandomInteger(-12, 12, true);
    while (divisor > 0 && quotient > 0) {
      divisor = getRandomInteger(-10, 10, true);
      quotient = getRandomInteger(-12, 12, true);
    }
    const dividend = divisor * quotient;

    const strDivisor = divisor < 0 ? `(${divisor})` : `${divisor}`;
    const strQuotient = quotient < 0 ? `(${quotient})` : `${quotient}`;

    const exprDisplay = `ผลหารของจำนวนเต็ม x ด้วย ${strDivisor} เท่ากับ ${strQuotient} จงหาค่าของ x`;

    const explanation = [
      `โจทย์ทาย: ${exprDisplay}`,
      `จากความสัมพันธ์: x ÷ ${strDivisor} = ${strQuotient}`,
      `ย้ายข้างเพื่อหาค่า x: x = ${strQuotient} × ${strDivisor}`,
      `พิจารณาเครื่องหมาย: ${getMultiplicationSignRuleText(quotient, divisor)}`,
      `คำนวณ: ${Math.abs(quotient)} × ${Math.abs(divisor)} = ${Math.abs(dividend)}`,
      `สรุปคำตอบ: x = ${dividend}`,
    ];

    return {
      id,
      num1: quotient,
      num2: divisor,
      operationSymbol: '×',
      operationType: 'multiplication',
      expressionDisplay: exprDisplay,
      correctAnswer: dividend,
      explanationSteps: explanation,
    };
  } else {
    // Expression value puzzle
    let a = getRandomInteger(-9, 9, true);
    let b = getRandomInteger(-9, 9, true);
    let c = getRandomInteger(-15, 15, true);
    while (a > 0 && b > 0 && c > 0) {
      a = getRandomInteger(-9, 9, true);
      b = getRandomInteger(-9, 9, true);
      c = getRandomInteger(-15, 15, true);
    }

    const prod = a * b;
    const ans = prod - c;

    const strA = a < 0 ? `(${a})` : `${a}`;
    const strB = b < 0 ? `(${b})` : `${b}`;
    const strC = c < 0 ? `(${c})` : `${c}`;

    const exprDisplay = `กำหนดให้ a = ${strA}, b = ${strB} จงหาค่าของ (a × b) - ${strC}`;

    const explanation = [
      `โจทย์ทาย: ${exprDisplay}`,
      `ขั้นที่ 1: หาค่าของ a × b ➔ ${strA} × ${strB} = ${prod}`,
      `ขั้นที่ 2: นำมาลบด้วย ${strC} ➔ ${prod} - ${strC}`,
      `การลบจำนวนเต็ม: เปลี่ยนเป็นบวกด้วยจำนวนตรงข้าม ➔ ${prod} + (${-c})`,
      `คำนวณผลลัพธ์สุดท้าย: ${ans}`,
      `สรุปคำตอบ: ${ans}`,
    ];

    return {
      id,
      num1: a,
      num2: b,
      operationSymbol: '×',
      operationType: 'multiplication',
      expressionDisplay: exprDisplay,
      correctAnswer: ans,
      explanationSteps: explanation,
    };
  }
}

export function getMultiplicationSignRuleText(n1: number, n2: number): string {
  if (n1 > 0 && n2 > 0) return 'จำนวนบวก × จำนวนบวก = ได้ผลลัพธ์เป็นจำนวนบวก (+)';
  if (n1 < 0 && n2 < 0) return 'จำนวนลบ × จำนวนลบ = ได้ผลลัพธ์เป็นจำนวนบวก (+) (ลบคูณลบเป็นบวก)';
  if (n1 < 0 && n2 > 0) return 'จำนวนลบ × จำนวนบวก = ได้ผลลัพธ์เป็นจำนวนลบ (-)';
  if (n1 > 0 && n2 < 0) return 'จำนวนบวก × จำนวนลบ = ได้ผลลัพธ์เป็นจำนวนลบ (-)';
  return 'ศูนย์คูณจำนวนใดๆ ได้ศูนย์ (0)';
}

export function getDivisionSignRuleText(dividend: number, divisor: number): string {
  if (dividend > 0 && divisor > 0) return 'จำนวนบวก ÷ จำนวนบวก = ได้ผลลัพธ์เป็นจำนวนบวก (+)';
  if (dividend < 0 && divisor < 0) return 'จำนวนลบ ÷ จำนวนลบ = ได้ผลลัพธ์เป็นจำนวนบวก (+) (ลบหารลบเป็นบวก)';
  if (dividend < 0 && divisor > 0) return 'จำนวนลบ ÷ จำนวนบวก = ได้ผลลัพธ์เป็นจำนวนลบ (-)';
  if (dividend > 0 && divisor < 0) return 'จำนวนบวก ÷ จำนวนลบ = ได้ผลลัพธ์เป็นจำนวนลบ (-)';
  return 'ศูนย์หารด้วยจำนวนใดๆ (ที่ไม่ใช่ 0) ได้ศูนย์ (0)';
}
