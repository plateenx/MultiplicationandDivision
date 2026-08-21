import React, { useState } from 'react';
import {
  Sparkles,
  Shuffle,
  CheckCircle2,
  Calculator,
  Delete,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import {
  getMultiplicationSignRuleText,
  getDivisionSignRuleText,
} from '../utils/mathGenerator';
import { soundFx } from '../services/sound';

function getGcd(x: number, y: number): number {
  let a = Math.abs(x);
  let b = Math.abs(y);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

interface FractionResult {
  isDivisible: boolean;
  quotient: number;
  isNegative: boolean;
  simplifiedNum: number;
  simplifiedDen: number;
  wholeNumber: number;
  remainder: number;
  fractionStr: string;
  mixedNumberStr?: string;
  decimalStr: string;
}

function calculateFractionInfo(a: number, b: number): FractionResult {
  if (b === 0) {
    return {
      isDivisible: false,
      quotient: 0,
      isNegative: false,
      simplifiedNum: 0,
      simplifiedDen: 1,
      wholeNumber: 0,
      remainder: 0,
      fractionStr: 'หาค่าไม่ได้ (ตัวหารเป็น 0)',
      decimalStr: 'undefined',
    };
  }

  const isNeg = (a < 0 && b > 0) || (a > 0 && b < 0);
  const absA = Math.abs(a);
  const absB = Math.abs(b);

  if (absA % absB === 0) {
    const q = absA / absB;
    const finalQ = isNeg ? -q : q;
    return {
      isDivisible: true,
      quotient: finalQ,
      isNegative: isNeg,
      simplifiedNum: q,
      simplifiedDen: 1,
      wholeNumber: q,
      remainder: 0,
      fractionStr: `${finalQ}`,
      decimalStr: `${finalQ}`,
    };
  }

  const gcd = getGcd(absA, absB);
  const simpNum = absA / gcd;
  const simpDen = absB / gcd;
  const whole = Math.floor(simpNum / simpDen);
  const rem = simpNum % simpDen;

  const signPrefix = isNeg ? '-' : '';
  const fractionStr = `${signPrefix}${simpNum}/${simpDen}`;
  const mixedNumberStr = whole > 0 ? `${signPrefix}${whole} ${rem}/${simpDen}` : undefined;
  const decVal = absA / absB;
  const decimalStr = `${signPrefix}${parseFloat(decVal.toFixed(4))}`;

  return {
    isDivisible: false,
    quotient: 0,
    isNegative: isNeg,
    simplifiedNum: simpNum,
    simplifiedDen: simpDen,
    wholeNumber: whole,
    remainder: rem,
    fractionStr,
    mixedNumberStr,
    decimalStr,
  };
}

export const InteractiveLearning: React.FC = () => {
  const [numA, setNumA] = useState<number>(-8);
  const [numB, setNumB] = useState<number>(-5);
  const [operation, setOperation] = useState<'multiplication' | 'division'>('multiplication');

  // Input text states for fluid typing & keypad input
  const [inputA, setInputA] = useState<string>('-8');
  const [inputB, setInputB] = useState<string>('-5');

  // Active target field for Digital Keypad ('A' = ตัวตั้ง, 'B' = ตัวคูณ/หาร)
  const [activeTarget, setActiveTarget] = useState<'A' | 'B'>('A');

  const handleApplyNumbers = (aStr: string, bStr: string, op: 'multiplication' | 'division') => {
    soundFx.playClick();
    setInputA(aStr);
    setInputB(bStr);
    setOperation(op);

    let valA = parseInt(aStr, 10);
    let valB = parseInt(bStr, 10);

    if (isNaN(valA)) valA = 1;
    if (isNaN(valB)) valB = 1;
    if (op === 'division' && valB === 0) valB = 1;

    setNumA(valA);
    setNumB(valB);
  };

  // Randomize a new math problem (Guarantees exact division in division mode)
  const handleRandomProblem = () => {
    soundFx.playClick();
    const getRandomSign = () => (Math.random() < 0.5 ? -1 : 1);

    let a = 1;
    let b = 1;

    if (operation === 'multiplication') {
      const magA = Math.floor(Math.random() * 12) + 2; // 2 to 13
      const magB = Math.floor(Math.random() * 12) + 2; // 2 to 13
      a = magA * getRandomSign();
      b = magB * getRandomSign();
    } else {
      // Division: generate clean integer division without remainder
      const magB = Math.floor(Math.random() * 11) + 2; // Divisor 2 to 12
      const magQuotient = Math.floor(Math.random() * 12) + 1; // Quotient 1 to 12
      b = magB * getRandomSign();
      const quotient = magQuotient * getRandomSign();
      a = b * quotient; // Dividend guarantees exact integer division
    }

    const strValA = String(a);
    const strValB = String(b);

    setInputA(strValA);
    setInputB(strValB);
    setNumA(a);
    setNumB(b);
  };

  // Digital Keypad Handler
  const handleKeypadPress = (key: string) => {
    soundFx.playClick();
    const currentVal = activeTarget === 'A' ? inputA : inputB;
    const setVal = activeTarget === 'A' ? setInputA : setInputB;
    const setNum = activeTarget === 'A' ? setNumA : setNumB;

    let newVal = currentVal;

    if (key === 'C') {
      newVal = '0';
    } else if (key === 'DEL') {
      if (currentVal.length <= 1 || (currentVal.length === 2 && currentVal.startsWith('-'))) {
        newVal = '0';
      } else {
        newVal = currentVal.slice(0, -1);
      }
    } else if (key === '+/-') {
      if (currentVal.startsWith('-')) {
        newVal = currentVal.substring(1) || '0';
      } else {
        newVal = currentVal === '0' ? '-0' : '-' + currentVal;
      }
    } else {
      // Digits 0-9
      if (currentVal === '0') {
        newVal = key;
      } else if (currentVal === '-0') {
        newVal = '-' + key;
      } else if (currentVal.replace('-', '').length < 4) {
        newVal = currentVal + key;
      }
    }

    setVal(newVal);

    let parsed = parseInt(newVal, 10);
    if (isNaN(parsed)) parsed = 0;

    if (activeTarget === 'B' && operation === 'division' && parsed === 0) {
      setNumB(1);
    } else {
      setNum(parsed);
    }
  };

  // Calculation outputs
  const fractionInfo = calculateFractionInfo(numA, numB);
  const isDivisible = operation === 'multiplication' ? true : fractionInfo.isDivisible;

  const resultValue =
    operation === 'multiplication'
      ? numA * numB
      : fractionInfo.quotient;

  const strA = numA < 0 ? `(${numA})` : `${numA}`;
  const strB = numB < 0 ? `(${numB})` : `${numB}`;
  const expressionText = `${strA} ${operation === 'multiplication' ? '×' : '÷'} ${strB}`;

  const signRuleExplanation =
    operation === 'multiplication'
      ? getMultiplicationSignRuleText(numA, numB)
      : getDivisionSignRuleText(numA, numB);

  return (
    <div className="space-y-3 max-w-4xl mx-auto pb-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 text-white shadow-md relative overflow-hidden flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-100">
              สื่อการเรียนรู้แบบโต้ตอบ
            </span>
          </div>
          <h2 className="text-base sm:text-2xl font-extrabold tracking-tight">
            ทดลองการคูณ-หารจำนวนเต็ม
          </h2>
        </div>
        <div className="hidden sm:block text-right text-xs text-emerald-100 max-w-xs">
          ป้อนตัวเลขด้วยแป้นดิจิทัลเพื่อดูการวิเคราะห์พิจารณาเครื่องหมายและขั้นตอนการคิดแบบเรียลไทม์
        </div>
      </div>

      {/* Preset Quick Test Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-1">
          <Calculator className="w-3.5 h-3.5 text-indigo-500" /> ตัวอย่าง:
        </span>
        <button
          onClick={() => handleApplyNumbers('-8', '-5', 'multiplication')}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold whitespace-nowrap transition shrink-0"
        >
          (-8) × (-5)
        </button>
        <button
          onClick={() => handleApplyNumbers('24', '-6', 'division')}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold whitespace-nowrap transition shrink-0"
        >
          24 ÷ (-6)
        </button>
        <button
          onClick={() => handleApplyNumbers('99', '8', 'division')}
          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold whitespace-nowrap transition shrink-0"
        >
          99 ÷ 8 (เศษส่วน)
        </button>
        <button
          onClick={() => handleApplyNumbers('-15', '4', 'multiplication')}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold whitespace-nowrap transition shrink-0"
        >
          (-15) × 4
        </button>
        <button
          onClick={() => handleApplyNumbers('-36', '-9', 'division')}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold whitespace-nowrap transition shrink-0"
        >
          (-36) ÷ (-9)
        </button>
      </div>

      {/* Main Interactive Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Left Control Panel (Ordered 1.ตัวตั้ง 2.ตัวคูณ/หาร 3.ปุ่มสุ่มโจทย์) */}
        <div className="md:col-span-5 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          {/* Operation Selector */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              เลือกตัวดำเนินการ:
            </span>
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold w-36">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setOperation('multiplication');
                }}
                className={`py-1 rounded text-center transition ${
                  operation === 'multiplication'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                คูณ (×)
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setOperation('division');
                  if (numB === 0) {
                    setNumB(1);
                    setInputB('1');
                  }
                }}
                className={`py-1 rounded text-center transition ${
                  operation === 'division'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                หาร (÷)
              </button>
            </div>
          </div>

          {/* 1. ตัวตั้ง (A), 2. ตัวคูณ/ตัวหาร (B), 3. ปุ่มสุ่มโจทย์ อยู่ในบรรทัดเดียวกัน ขนาดเท่ากัน */}
          <div className="grid grid-cols-3 gap-2 items-end">
            {/* 1. ตัวตั้ง (A) */}
            <div>
              <label className="block text-center text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
                ตัวตั้ง
              </label>
              <div
                onClick={() => {
                  soundFx.playClick();
                  setActiveTarget('A');
                }}
                className={`h-[42px] px-2 sm:px-2.5 rounded-xl border cursor-pointer transition flex items-center justify-center ${
                  activeTarget === 'A'
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate text-center">
                  {inputA || '0'}
                </span>
              </div>
            </div>

            {/* 2. ตัวคูณ / ตัวหาร (B) */}
            <div>
              <label className="block text-center text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
                {operation === 'multiplication' ? 'ตัวคูณ' : 'ตัวหาร'}
              </label>
              <div
                onClick={() => {
                  soundFx.playClick();
                  setActiveTarget('B');
                }}
                className={`h-[42px] px-2 sm:px-2.5 rounded-xl border cursor-pointer transition flex items-center justify-center ${
                  activeTarget === 'B'
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate text-center">
                  {inputB || '0'}
                </span>
              </div>
            </div>

            {/* 3. ปุ่มสุ่มโจทย์ */}
            <div>
              <button
                type="button"
                onClick={handleRandomProblem}
                className="w-full h-[42px] px-1 sm:px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition active:scale-98 shadow-2xs whitespace-nowrap"
                title="สุ่มโจทย์คณิตศาสตร์ใหม่"
              >
                <Shuffle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="whitespace-nowrap font-bold">สุ่มโจทย์</span>
              </button>
            </div>
          </div>

          {/* Embedded Digital Keypad for activeTarget */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between px-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>
                แป้นพิมพ์ ({activeTarget === 'A' ? 'ตัวตั้ง A' : operation === 'multiplication' ? 'ตัวคูณ B' : 'ตัวหาร B'}):
              </span>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTarget(activeTarget === 'A' ? 'B' : 'A');
                }}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                <ArrowRightLeft className="w-3 h-3" />
                สลับช่อง ({activeTarget === 'A' ? 'ไปช่อง B' : 'ไปช่อง A'})
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {['7', '8', '9', 'C'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`py-2 rounded-lg font-extrabold text-sm transition shadow-2xs ${
                    k === 'C'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 hover:bg-rose-200'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {k}
                </button>
              ))}

              {['4', '5', '6', 'DEL'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`py-2 rounded-lg font-extrabold text-sm transition shadow-2xs flex items-center justify-center ${
                    k === 'DEL'
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {k === 'DEL' ? <Delete className="w-4 h-4" /> : k}
                </button>
              ))}

              {['1', '2', '3', '+/-'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`py-2 rounded-lg font-extrabold text-sm transition shadow-2xs ${
                    k === '+/-'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {k}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="col-span-4 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600 rounded-lg font-extrabold text-sm shadow-2xs transition"
              >
                0
              </button>
            </div>
          </div>

          {operation === 'division' && numB === 0 && (
            <p className="text-[10px] text-rose-500 font-bold">
              ⚠️ ตัวหารต้องไม่เป็นศูนย์ (0)
            </p>
          )}
        </div>

        {/* Right Output & Live Breakdown Panel */}
        <div className="md:col-span-7 p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          {/* Header Expression */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              ขั้นตอนคำนวณเรียลไทม์:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-200/50 dark:border-indigo-800/50">
              {expressionText}
            </span>
          </div>

          {/* Step 1 & Step 2 Stacked compactly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Step 1 */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                1. เครื่องหมาย:
              </span>
              <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug text-xs">
                {signRuleExplanation}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                2. คิดเฉพาะตัวเลข:
              </span>
              {operation === 'multiplication' ? (
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-1">
                  {Math.abs(numA)} × {Math.abs(numB)} = {Math.abs(resultValue)}
                </p>
              ) : isDivisible ? (
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-1">
                  {Math.abs(numA)} ÷ {Math.abs(numB)} = {Math.abs(fractionInfo.quotient)}
                </p>
              ) : (
                <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>{Math.abs(numA)} ÷ {Math.abs(numB)} =</span>
                  <div className="inline-flex items-center">
                    <span className="inline-flex flex-col items-center leading-none text-center">
                      <span className="border-b border-indigo-400 pb-0.5 px-0.5 text-[11px]">{fractionInfo.simplifiedNum}</span>
                      <span className="pt-0.5 px-0.5 text-[11px]">{fractionInfo.simplifiedDen}</span>
                    </span>
                  </div>
                  {fractionInfo.mixedNumberStr && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                      (หรือ {fractionInfo.wholeNumber} {fractionInfo.remainder}/{fractionInfo.simplifiedDen})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Final Answer Badge */}
          <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="space-y-1 overflow-hidden">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">
                คำตอบสุดท้าย:
              </span>

              {operation === 'multiplication' || isDivisible ? (
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 block truncate">
                  {expressionText} = {resultValue}
                </span>
              ) : (
                /* Non-divisible Division: Display as simplified fraction and mixed number */
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-mono">
                  <span className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {expressionText} =
                  </span>

                  <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-lg sm:text-2xl">
                    {fractionInfo.isNegative && <span className="mr-0.5">-</span>}
                    <div className="inline-flex flex-col items-center justify-center text-center leading-none">
                      <span className="border-b-2 border-emerald-600 dark:border-emerald-400 px-1 pb-0.5 text-base sm:text-xl font-bold">
                        {fractionInfo.simplifiedNum}
                      </span>
                      <span className="px-1 pt-0.5 text-base sm:text-xl font-bold">
                        {fractionInfo.simplifiedDen}
                      </span>
                    </div>
                  </div>

                  {fractionInfo.mixedNumberStr && (
                    <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 font-sans bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-300/60 dark:border-emerald-700/60">
                      หรือ {fractionInfo.isNegative ? '-' : ''}{fractionInfo.wholeNumber}
                      <span className="inline-flex flex-col items-center justify-center text-[10px] sm:text-xs leading-none mx-1 align-middle">
                        <span className="border-b border-emerald-600 dark:border-emerald-400 px-0.5">{fractionInfo.remainder}</span>
                        <span className="px-0.5">{fractionInfo.simplifiedDen}</span>
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Context Note */}
          {operation === 'division' && (
            isDivisible ? (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> การหารลงตัว (ไม่มีเศษ)
              </p>
            ) : (
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200 font-medium flex items-start gap-1.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">การหารไม่ลงตัว:</span> นำ {Math.abs(numA)} หารด้วย {Math.abs(numB)} มีเศษเหลือ {fractionInfo.remainder} จึงแสดงผลลัพธ์ในรูปเศษส่วนอย่างต่ำ <strong className="font-mono">{fractionInfo.fractionStr}</strong> {fractionInfo.mixedNumberStr ? `(จำนวนคละ: ${fractionInfo.mixedNumberStr})` : ''}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};



