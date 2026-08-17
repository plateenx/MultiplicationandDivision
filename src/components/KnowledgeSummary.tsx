import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';

export const KnowledgeSummary: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Title Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
            <BookOpen className="w-6 h-6 text-amber-300" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
            สรุปบทเรียนสำคัญ (Summary & Techniques)
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          การคูณและการหารจำนวนเต็ม
        </h2>
        <p className="mt-2 text-indigo-100 text-sm max-w-2xl leading-relaxed">
          รวมกฎพื้นฐาน เครื่องหมายสำคัญ เทคนิคการจำ และตัวอย่างการคิดคำนวณอย่างถูกต้องรวดเร็วต่อเนื่องทุกหัวข้อ
        </p>
      </div>

      {/* 1. การคูณจำนวนเต็ม */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            1. การคูณจำนวนเต็ม
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rule Card 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5" />
              <span>เครื่องหมายเหมือนกัน ➔ ได้ผลบวก (+)</span>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex justify-between items-center">
                <span>(+) × (+) = (+)</span>
                <span className="text-xs font-sans text-slate-600 dark:text-slate-400">7 × 8 = +56</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex justify-between items-center">
                <span>(-) × (-) = (+)</span>
                <span className="text-xs font-sans text-slate-600 dark:text-slate-400">(-6) × (-9) = +54</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              💡 <strong>เทคนิคจำ:</strong> "เหมือนกันเจอกัน ย่อมกลายเป็นบวก" เช่น ลบคูณลบ ได้เป็นบวกเสมอ
            </p>
          </div>

          {/* Rule Card 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-rose-600 dark:text-rose-400 font-bold text-base">
              <HelpCircle className="w-5 h-5" />
              <span>เครื่องหมายต่างกัน ➔ ได้ผลลบ (-)</span>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex justify-between items-center">
                <span>(-) × (+) = (-)</span>
                <span className="text-xs font-sans text-slate-600 dark:text-slate-400">(-5) × 4 = -20</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex justify-between items-center">
                <span>(+) × (-) = (-)</span>
                <span className="text-xs font-sans text-slate-600 dark:text-slate-400">12 × (-3) = -36</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              💡 <strong>เทคนิคจำ:</strong> "ต่างขั้วเจอกัน ย่อมกลายเป็นลบ" นำผลคูณตัวเลขธรรมดามาติดเครื่องหมายลบด้านหน้า
            </p>
          </div>
        </div>
      </section>

      {/* 2. การหารจำนวนเต็ม */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            2. การหารจำนวนเต็ม
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Division Card 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2 text-base">
              <ChevronRight className="w-5 h-5" /> การหารด้วยเครื่องหมายเหมือนกัน
            </h4>
            <div className="space-y-3 font-mono text-sm">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex justify-between items-center">
                <span>(+) ÷ (+) = (+)</span>
                <span className="text-xs font-sans text-slate-600 dark:text-slate-400">36 ÷ 6 = +6</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex justify-between items-center">
                <span>(-) ÷ (-) = (+)</span>
                <span className="text-xs font-sans text-slate-600 dark:text-slate-400">(-48) ÷ (-8) = +6</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              การหารใช้หลักการเกี่ยวกับเครื่องหมายเหมือนกับการคูณทุกประการ!
            </p>
          </div>

          {/* Division Card 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2 text-base">
              <ChevronRight className="w-5 h-5" /> การหารด้วยเครื่องหมายต่างกัน
            </h4>
            <div className="space-y-3 font-mono text-sm">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex justify-between items-center">
                <span>(-) ÷ (+) = (-)</span>
                <span className="text-xs font-sans text-slate-600 dark:text-slate-400">(-63) ÷ 9 = -7</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex justify-between items-center">
                <span>(+) ÷ (-) = (-)</span>
                <span className="text-xs font-sans text-slate-600 dark:text-slate-400">80 ÷ (-10) = -8</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ตัวตั้งกับตัวหารเครื่องหมายต่างกัน ผลหารติดลบเสมอ
            </p>
          </div>
        </div>
      </section>

      {/* 3. ลำดับขั้นตอนการคิดโจทย์ที่มีวงเล็บ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            3. ลำดับวงเล็บ [ ] ( )
          </h3>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li>
              <strong>ทำในวงเล็บย่อยสุด หรือ วงเล็บใหญ่ $[ ]$ ก่อนเสมอ</strong>
            </li>
            <li>
              หากมีทั้งการคูณและการหาร เรียงจาก <strong>ซ้ายไปขวา</strong>
            </li>
            <li>
              คำนวณผลลัพธ์บวก/ลบในขั้นตอนสุดท้าย
            </li>
          </ol>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              ตัวอย่างโจทย์แบบฝึกหัดยาก:
            </h4>
            <div className="font-mono text-sm space-y-1 text-indigo-600 dark:text-indigo-400">
              <p>โจทย์: [(-15) + 3] × (-4)</p>
              <p className="text-slate-600 dark:text-slate-300">ขั้นที่ 1: คำนวณในวงเล็บใหญ่ [(-15) + 3] = -12</p>
              <p className="text-slate-600 dark:text-slate-300">ขั้นที่ 2: นำ (-12) × (-4)</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">คำตอบ: +48 (เพราะลบคูณลบเป็นบวก)</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. สมบัติของ 0 และ 1 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            4. สมบัติของ 0 และ 1
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-500" /> สมบัติของศูนย์ (0)
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 font-mono">
              <li className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">a × 0 = 0 (เช่น -15 × 0 = 0)</li>
              <li className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">0 ÷ a = 0 (เช่น 0 ÷ (-9) = 0)</li>
              <li className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-sans text-xs">
                ⚠️ <strong>ข้อควรระวัง:</strong> ห้ามนำ 0 เป็นตัวหาร (a ÷ 0 ไม่มีความหมายทางคณิตศาสตร์)
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" /> สมบัติของหนึ่ง (1) และ (-1)
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 font-mono">
              <li className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">a × 1 = a (เช่น -24 × 1 = -24)</li>
              <li className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">a × (-1) = -a (เปลี่ยนเครื่องหมายตรงข้าม)</li>
              <li className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">a ÷ 1 = a (เช่น -50 ÷ 1 = -50)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
