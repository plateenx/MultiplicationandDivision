import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Calculator,
  Delete,
  ArrowRightLeft,
} from 'lucide-react';
import {
  getMultiplicationSignRuleText,
  getDivisionSignRuleText,
} from '../utils/mathGenerator';
import { soundFx } from '../services/sound';

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
  const resultValue =
    operation === 'multiplication'
      ? numA * numB
      : Math.floor(numA / numB);

  const isDivisible = operation === 'division' ? numA % numB === 0 : true;

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
        {/* Left Control Panel (Ordered 1.ตัวตั้ง 2.ตัวคูณ/หาร 3.ปุ่มรีเซ็ต) */}
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

          {/* 1. ตัวตั้ง (A), 2. ตัวคูณ/ตัวหาร (B), 3. ปุ่มรีเซ็ตค่าเริ่มต้น อยู่ในบรรทัดเดียวกัน ขนาดเท่ากัน */}
          <div className="grid grid-cols-3 gap-2 items-end">
            {/* 1. ตัวตั้ง (A) */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
                ตัวตั้ง
              </label>
              <div
                onClick={() => {
                  soundFx.playClick();
                  setActiveTarget('A');
                }}
                className={`h-[42px] px-2 sm:px-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  activeTarget === 'A'
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                  {inputA || '0'}
                </span>
                <span
                  className={`text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded shrink-0 ${
                    activeTarget === 'A'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {activeTarget === 'A' ? 'เลือกอยู่' : 'เลือก'}
                </span>
              </div>
            </div>

            {/* 2. ตัวคูณ / ตัวหาร (B) */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
                {operation === 'multiplication' ? 'ตัวคูณ' : 'ตัวหาร'}
              </label>
              <div
                onClick={() => {
                  soundFx.playClick();
                  setActiveTarget('B');
                }}
                className={`h-[42px] px-2 sm:px-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  activeTarget === 'B'
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                  {inputB || '0'}
                </span>
                <span
                  className={`text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded shrink-0 ${
                    activeTarget === 'B'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {activeTarget === 'B' ? 'เลือกอยู่' : 'เลือก'}
                </span>
              </div>
            </div>

            {/* 3. ปุ่มรีเซ็ตค่าเริ่มต้น */}
            <div>
              <button
                type="button"
                onClick={() => handleApplyNumbers('1', '1', operation)}
                className="w-full h-[42px] px-2 sm:px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition active:scale-98"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">รีเซ็ต (1, 1)</span>
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
              <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-1">
                {Math.abs(numA)} {operation === 'multiplication' ? '×' : '÷'} {Math.abs(numB)} = {Math.abs(resultValue)}
              </p>
            </div>
          </div>

          {/* Final Answer Badge */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">
                คำตอบสุดท้าย:
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {expressionText} = {resultValue}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {!isDivisible && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              * การหารลงตัวแบบไม่มีเศษ
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


