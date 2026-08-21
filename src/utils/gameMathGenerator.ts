/**
 * Game Math Generator for Integer Multiplication & Division
 */

export interface GameMathProblem {
  id: string;
  num1: number;
  num2: number;
  op: '×' | '÷';
  expression: string;
  answer: number;
  sign: '+' | '-' | '0';
  options: number[];
  explanation: string;
}

export function getRandomInt(min: number, max: number, excludeZero: boolean = true): number {
  let val = Math.floor(Math.random() * (max - min + 1)) + min;
  if (excludeZero && val === 0) {
    val = Math.random() > 0.5 ? 1 : -1;
  }
  return val;
}

export function formatInteger(n: number): string {
  return n < 0 ? `(${n})` : `${n}`;
}

export function generateIntegerProblem(
  type: 'multiplication' | 'division' | 'mixed' = 'mixed',
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): GameMathProblem {
  let op: '×' | '÷';
  if (type === 'multiplication') {
    op = '×';
  } else if (type === 'division') {
    op = '÷';
  } else {
    op = Math.random() > 0.5 ? '×' : '÷';
  }

  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  // Range setup
  const range =
    difficulty === 'easy'
      ? { min: -9, max: 9 }
      : difficulty === 'medium'
      ? { min: -12, max: 12 }
      : { min: -20, max: 20 };

  if (op === '×') {
    // Generate multiplication: num1 × num2 = answer
    num1 = getRandomInt(range.min, range.max, false);
    num2 = getRandomInt(range.min, range.max, false);

    // Make sure we have a good mix of negative numbers
    if (Math.random() < 0.35 && num1 > 0) num1 = -num1;
    if (Math.random() < 0.35 && num2 > 0) num2 = -num2;

    answer = num1 * num2;
  } else {
    // Generate exact integer division: answer × num2 = num1  => num1 ÷ num2 = answer
    num2 = getRandomInt(range.min, range.max, true); // divisor cannot be 0
    answer = getRandomInt(range.min, range.max, false);

    if (Math.random() < 0.35 && num2 > 0) num2 = -num2;
    if (Math.random() < 0.35 && answer > 0) answer = -answer;

    num1 = answer * num2;
  }

  const sign: '+' | '-' | '0' = answer > 0 ? '+' : answer < 0 ? '-' : '0';
  const expression = `${formatInteger(num1)} ${op} ${formatInteger(num2)}`;

  // Generate 4 distinct options (including the correct answer)
  const optionSet = new Set<number>();
  optionSet.add(answer);

  // Common plausible distractors
  if (answer !== 0) {
    optionSet.add(-answer); // Opposite sign
  }

  if (op === '×') {
    optionSet.add(num1 + num2); // Confused with addition
    optionSet.add(-(num1 + num2));
    optionSet.add(answer + (Math.random() > 0.5 ? num2 : -num2));
  } else {
    optionSet.add(num1 - num2);
    optionSet.add(answer + (Math.random() > 0.5 ? 1 : -1) * Math.abs(num2));
  }

  // Ensure we have exactly 4 unique options
  let safety = 0;
  while (optionSet.size < 4 && safety < 40) {
    safety++;
    const delta = getRandomInt(-6, 6, true);
    const candidate = answer + delta;
    if (candidate !== answer) {
      optionSet.add(candidate);
    }
  }

  // Ensure options always has exactly 4 items
  let finalOptionList = Array.from(optionSet);
  if (finalOptionList.length > 4) {
    // Keep answer and pick 3 other distractors
    const otherOptions = finalOptionList.filter((x) => x !== answer).slice(0, 3);
    finalOptionList = [answer, ...otherOptions];
  }
  const options = finalOptionList.sort(() => Math.random() - 0.5);

  let explanation = '';
  if (op === '×') {
    if (num1 === 0 || num2 === 0) {
      explanation = `จำนวนใดๆ คูณกับ 0 จะได้ผลลัพธ์เป็น 0 เสมอ`;
    } else if ((num1 > 0 && num2 > 0) || (num1 < 0 && num2 < 0)) {
      explanation = `เครื่องหมายเหมือนกัน (${num1 < 0 ? 'ลบ × ลบ' : 'บวก × บวก'}) ผลลัพธ์เป็นบวก (+) => ${Math.abs(num1)} × ${Math.abs(num2)} = ${answer}`;
    } else {
      explanation = `เครื่องหมายต่างกัน (บวก × ลบ หรือ ลบ × บวก) ผลลัพธ์เป็นลบ (-) => -(${Math.abs(num1)} × ${Math.abs(num2)}) = ${answer}`;
    }
  } else {
    if (num1 === 0) {
      explanation = `0 หารด้วยจำนวนใดๆ (ที่ไม่ใช่ 0) ได้ 0 เสมอ`;
    } else if ((num1 > 0 && num2 > 0) || (num1 < 0 && num2 < 0)) {
      explanation = `เครื่องหมายเหมือนกัน (${num1 < 0 ? 'ลบ ÷ ลบ' : 'บวก ÷ บวก'}) ผลลัพธ์เป็นบวก (+) => ${Math.abs(num1)} ÷ ${Math.abs(num2)} = ${answer}`;
    } else {
      explanation = `เครื่องหมายต่างกัน (บวก ÷ ลบ หรือ ลบ ÷ บวก) ผลลัพธ์เป็นลบ (-) => -(${Math.abs(num1)} ÷ ${Math.abs(num2)}) = ${answer}`;
    }
  }

  return {
    id: `prob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    num1,
    num2,
    op,
    expression,
    answer,
    sign,
    options,
    explanation,
  };
}
