import React from 'react';
import { MatrixCellData, ZoneType, HouseholdType } from '../types';
import { ShieldCheck, Flame, CheckCircle2 } from 'lucide-react';

interface MatrixViewProps {
  matrix: MatrixCellData[][];
  householdType: HouseholdType;
  onSelectCell: (cell: MatrixCellData) => void;
  onApplyConditions: (cell: MatrixCellData) => void;
  selectedCell: MatrixCellData | null;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  matrix,
  householdType,
  onSelectCell,
  onApplyConditions,
  selectedCell,
}) => {
  const isCouple = householdType === 'couple';

  const getZoneBadge = (zone: ZoneType) => {
    switch (zone) {
      case 'A':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ゾーンA (非課税)
          </span>
        );
      case 'B':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> ゾーンB (一般1〜2割)
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-rose-600" /> ゾーンC (高負担2〜3割)
          </span>
        );
    }
  };

  const getBorderColor = (zone: ZoneType, isCenter: boolean, isSelected: boolean) => {
    if (isSelected) return 'ring-2 ring-indigo-600 border-indigo-600 shadow-md scale-[1.01] bg-white';
    if (isCenter) return 'border-2 border-slate-700 bg-white shadow-sm ring-1 ring-slate-900/10';
    switch (zone) {
      case 'A':
        return 'border-emerald-200/90 hover:border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/50';
      case 'B':
        return 'border-blue-200/90 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/50';
      case 'C':
        return 'border-rose-200/90 hover:border-rose-400 bg-rose-50/30 hover:bg-rose-50/50';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <span>3×3 判定マトリクス</span>
            <span className="text-xs font-normal text-slate-500">
              （中央のマスが現在のシミュレーション値。マスをクリックすると詳細診断が開きます）
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>A: 非課税
          </span>
          <span className="flex items-center gap-1 text-blue-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>B: 一般
          </span>
          <span className="flex items-center gap-1 text-rose-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>C: 負担増
          </span>
        </div>
      </div>

      {/* マトリクス本体ラッパー */}
      <div className="relative border border-slate-300 rounded-2xl bg-white shadow-sm overflow-x-auto p-3 sm:p-4">
        <div className="min-w-[660px]">
          {/* 列ヘッダー（年金受給開始年齢の増減） */}
          <div className="grid grid-cols-[76px_1fr_1fr_1fr] sm:grid-cols-[88px_1fr_1fr_1fr] gap-2.5 mb-2.5 text-center text-xs font-bold text-slate-600">
            <div className="flex items-center justify-center p-1 text-[10px] text-slate-400 font-medium leading-tight">
              就労給与 ＼ 年金
            </div>
            <div className="bg-slate-100 py-2 px-1 rounded-xl text-slate-700 font-bold border border-slate-200">
              ◀ -2歳 繰上げ
            </div>
            <div className="bg-slate-800 py-2 px-1 rounded-xl text-white font-extrabold shadow-xs">
              ★ 現在受給年齢
            </div>
            <div className="bg-slate-100 py-2 px-1 rounded-xl text-slate-700 font-bold border border-slate-200">
              +2歳 繰下げ ▶
            </div>
          </div>

          {/* 行ループ */}
          <div className="space-y-2.5">
            {matrix.map((row, rIndex) => (
              <div
                key={rIndex}
                className="grid grid-cols-[76px_1fr_1fr_1fr] sm:grid-cols-[88px_1fr_1fr_1fr] gap-2.5"
              >
                {/* 行ヘッダー（就労給与調整） */}
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/90 rounded-xl px-1.5 py-2 text-center select-none shadow-2xs">
                  <span
                    className={`text-[11px] font-black leading-tight ${
                      rIndex === 0
                        ? 'text-indigo-700'
                        : rIndex === 1
                        ? 'text-slate-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {rIndex === 0 && '▲ +50%'}
                    {rIndex === 1 && '★ 現在値'}
                    {rIndex === 2 && '▼ 給与0円'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 leading-tight">
                    {rIndex === 0 && '就労延長'}
                    {rIndex === 1 && '基準設定'}
                    {rIndex === 2 && '年金のみ'}
                  </span>
                </div>

                {/* メインの3マス */}
                {row.map((cell, cIndex) => {
                  const isCenter = rIndex === 1 && cIndex === 1;
                  const isSelected =
                    selectedCell?.rowOffset === cell.rowOffset &&
                    selectedCell?.colOffset === cell.colOffset;

                  return (
                    <div
                      key={cIndex}
                      onClick={() => onSelectCell(cell)}
                      className={`relative rounded-xl p-3 sm:p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${getBorderColor(
                        cell.result.zone,
                        isCenter,
                        isSelected
                      )}`}
                    >
                      {/* 中央バッジ */}
                      {isCenter && (
                        <span className="absolute -top-2.5 right-3 bg-slate-800 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow tracking-wide">
                          現在設定値
                        </span>
                      )}

                      {/* 上部: ゾーン＆判定年収 */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          {getZoneBadge(cell.result.zone)}
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                            {cell.pensionStartAge}歳受給
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-xs text-slate-500 font-medium">世帯年収【額面】</span>
                          <span className="font-black text-base sm:text-lg text-slate-900 font-mono tracking-tight">
                            {cell.result.householdGrossAnnual}
                            <span className="text-xs font-bold text-slate-600 ml-0.5">万円</span>
                          </span>
                        </div>
                      </div>

                      {/* 中部: 各制度の壁・負担割合 */}
                      <div className="my-2 py-2 border-y border-slate-200/70 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">住民税:</span>
                          <span
                            className={`font-black ${
                              cell.result.isTaxFree ? 'text-emerald-700 font-bold' : 'text-slate-700'
                            }`}
                          >
                            {cell.result.isTaxFree ? '◎ 非課税' : '課税'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">介護割合:</span>
                          <span
                            className={`font-black font-mono ${
                              cell.result.careInsuranceRate >= 2
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            {cell.result.careInsuranceRate}割
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">医療窓口:</span>
                          <span
                            className={`font-black font-mono ${
                              cell.result.medicalInsuranceRate >= 2
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            {cell.result.medicalInsuranceRate}割
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">特養補足:</span>
                          <span
                            className={`font-black ${
                              cell.result.hasNursingHomeFoodSubsidy
                                ? 'text-emerald-700'
                                : 'text-slate-400 font-normal'
                            }`}
                          >
                            {cell.result.hasNursingHomeFoodSubsidy ? '有 (減額)' : '無'}
                          </span>
                        </div>
                      </div>

                      {/* 下部: 月額上限 & 適用ボタン & 手取り生活費（個人＋世帯両方表示） */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>高額介護上限:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {cell.result.highCostCareLimitMonthly.toLocaleString()}円/月
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>高額療養上限:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {cell.result.highCostMedicalLimitMonthly.toLocaleString()}円/月
                          </span>
                        </div>

                        {/* 手取り生活費：夫婦世帯時は個人と世帯の両方を併記 */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                          {isCouple ? (
                            <div className="flex items-center justify-between text-[11px] font-mono leading-tight bg-slate-50/80 p-1.5 rounded-lg border border-slate-200/80">
                              <span className="text-slate-600">
                                個人手取: <strong className="text-slate-900">{cell.result.netDisposableIncomeMonthly}万</strong>
                              </span>
                              <span className="text-sky-800 font-bold bg-sky-100/80 px-1.5 py-0.2 rounded border border-sky-200">
                                世帯計: {cell.result.householdNetDisposableIncomeMonthly}万/月
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-600 font-mono">
                              手取生活費:{' '}
                              <strong className="text-slate-800">
                                {cell.result.netDisposableIncomeMonthly}万/月
                              </strong>
                            </div>
                          )}

                          <div className="flex items-center justify-end pt-0.5">
                            {!isCenter && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApplyConditions(cell);
                                }}
                                className="text-[10px] font-extrabold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded transition shadow-2xs"
                              >
                                条件適用
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
