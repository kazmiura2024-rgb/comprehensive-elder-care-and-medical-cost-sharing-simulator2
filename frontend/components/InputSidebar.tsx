import React from 'react';
import { SimulatorState, PersonProfile, HouseholdType, ActivePerspective } from '../types';
import { User, Users, HeartHandshake, ShieldAlert, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';

interface InputSidebarProps {
  state: SimulatorState;
  onChange: (updater: (prev: SimulatorState) => SimulatorState) => void;
}

export const InputSidebar: React.FC<InputSidebarProps> = ({ state, onChange }) => {
  const isCouple = state.householdType === 'couple';
  const isBereaved = state.householdType === 'bereaved';

  // 視点対象のプロファイル
  const currentProfile =
    state.householdType === 'single'
      ? state.primary
      : state.householdType === 'bereaved'
      ? state.bereavedSurvivor === 'primary'
        ? state.primary
        : state.spouse
      : state.perspective === 'primary'
      ? state.primary
      : state.spouse;

  const currentRoleKey: 'primary' | 'spouse' =
    state.householdType === 'single'
      ? 'primary'
      : state.householdType === 'bereaved'
      ? state.bereavedSurvivor
      : state.perspective;

  const handleProfileFieldChange = <K extends keyof PersonProfile>(key: K, value: PersonProfile[K]) => {
    onChange((prev) => ({
      ...prev,
      [currentRoleKey]: {
        ...prev[currentRoleKey],
        [key]: value,
      },
    }));
  };

  // 夫婦の月齢差を算出
  const diffMonths =
    state.spouse.ageYears * 12 + state.spouse.ageMonths - (state.primary.ageYears * 12 + state.primary.ageMonths);
  const diffYearsFormatted =
    diffMonths === 0
      ? '同い年'
      : diffMonths > 0
      ? `妻が ${Math.floor(diffMonths / 12)}歳${Math.abs(diffMonths % 12)}ヶ月 年上`
      : `夫が ${Math.floor(Math.abs(diffMonths) / 12)}歳${Math.abs(diffMonths % 12)}ヶ月 年上`;

  return (
    <div className="bg-white border-r border-slate-200 h-full overflow-y-auto p-4 sm:p-5 flex flex-col gap-6 text-sm">
      {/* 1. 世帯構成の切替 */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          1. 世帯構成を選択
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, householdType: 'single', perspective: 'primary' }))}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              state.householdType === 'single'
                ? 'border-sky-500 bg-sky-50 text-sky-800 font-bold shadow-sm'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs">単身世帯</span>
          </button>
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, householdType: 'couple' }))}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              state.householdType === 'couple'
                ? 'border-sky-500 bg-sky-50 text-sky-800 font-bold shadow-sm'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-xs">夫婦世帯</span>
          </button>
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, householdType: 'bereaved' }))}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              state.householdType === 'bereaved'
                ? 'border-rose-400 bg-rose-50 text-rose-800 font-bold shadow-sm'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <HeartHandshake className="w-5 h-5 mb-1" />
            <span className="text-xs">死別想定</span>
          </button>
        </div>

        {/* 夫婦の場合: 視点切替タブ */}
        {isCouple && (
          <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-600">入力・マトリクスの判定視点:</span>
              <span className="text-[11px] text-sky-600 font-medium">{diffYearsFormatted}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, perspective: 'primary' }))}
                className={`py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition ${
                  state.perspective === 'primary' ? 'bg-white shadow text-sky-700 border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>👨 夫の立場で判定</span>
              </button>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, perspective: 'spouse' }))}
                className={`py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition ${
                  state.perspective === 'spouse' ? 'bg-white shadow text-sky-700 border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>👩 妻の立場で判定</span>
              </button>
            </div>
          </div>
        )}

        {/* 死別想定の場合: どちらが生存者か */}
        {isBereaved && (
          <div className="mt-3 p-2.5 bg-rose-50 rounded-lg border border-rose-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>残されたご家族（遺族）の選択:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, bereavedSurvivor: 'spouse' }))}
                className={`py-1.5 px-2 rounded text-xs font-medium border ${
                  state.bereavedSurvivor === 'spouse'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-rose-900 border-rose-200'
                }`}
              >
                夫先立ち（妻が遺族）
              </button>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, bereavedSurvivor: 'primary' }))}
                className={`py-1.5 px-2 rounded text-xs font-medium border ${
                  state.bereavedSurvivor === 'primary'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-rose-900 border-rose-200'
                }`}
              >
                妻先立ち（夫が遺族）
              </button>
            </div>
            <p className="text-[11px] text-rose-700 mt-2 leading-relaxed">
              ⚠️ 夫婦合算211万円から単身155万円の非課税枠へ大幅縮小。介護・医療費が急激に跳ね上がる「単身155万円の崖」を検証します。
            </p>
          </div>
        )}
      </div>

      {/* 2. 検証ターゲット年齢スライダー */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-bold text-slate-700 text-xs">
            シミュレーション検証年齢
          </label>
          <span className="text-base font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
            {state.targetAgeYears} 歳
          </span>
        </div>
        <input
          type="range"
          min={60}
          max={85}
          step={1}
          value={state.targetAgeYears}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            onChange((prev) => ({ ...prev, targetAgeYears: val }));
          }}
          className="w-full accent-sky-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>60歳</span>
          <span className="text-sky-600 font-bold">65歳(年金)</span>
          <span className="text-emerald-600 font-bold">70歳(前期)</span>
          <span className="text-rose-600 font-bold">75歳(後期)</span>
          <span>85歳</span>
        </div>
        {isCouple && (
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-200 pt-1.5 flex justify-between">
            <span>夫基準 {state.targetAgeYears}歳時点:</span>
            <span className="font-semibold text-slate-700">
              妻は {Math.floor((state.targetAgeYears * 12 + state.spouse.ageYears * 12 + state.spouse.ageMonths - (state.primary.ageYears * 12 + state.primary.ageMonths)) / 12)}歳
              {Math.abs((state.targetAgeYears * 12 + state.spouse.ageYears * 12 + state.spouse.ageMonths - (state.primary.ageYears * 12 + state.primary.ageMonths)) % 12)}ヶ月
            </span>
          </div>
        )}
      </div>

      {/* 3. 夫婦の生年月・年齢精密入力 (夫婦の場合のみ) */}
      {isCouple && (
        <div className="border border-slate-200 rounded-xl p-3 bg-white">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
            <span>夫婦の現在年齢（満年齢＋月数）</span>
            <span className="text-[10px] text-slate-400">制度ズレの精密計算用</span>
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">夫の現在年齢:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={state.primary.ageYears}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      primary: { ...prev.primary, ageYears: parseInt(e.target.value) || 65 },
                    }))
                  }
                  className="w-14 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono"
                />
                <span>歳</span>
                <input
                  type="number"
                  min={0}
                  max={11}
                  value={state.primary.ageMonths}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      primary: { ...prev.primary, ageMonths: parseInt(e.target.value) || 0 },
                    }))
                  }
                  className="w-12 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono"
                />
                <span>ヶ月</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">妻の現在年齢:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={state.spouse.ageYears}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      spouse: { ...prev.spouse, ageYears: parseInt(e.target.value) || 62 },
                    }))
                  }
                  className="w-14 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono"
                />
                <span>歳</span>
                <input
                  type="number"
                  min={0}
                  max={11}
                  value={state.spouse.ageMonths}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      spouse: { ...prev.spouse, ageMonths: parseInt(e.target.value) || 0 },
                    }))
                  }
                  className="w-12 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono"
                />
                <span>ヶ月</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 対象者の詳細条件入力（額面・手取りを明記） */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-1">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            {currentProfile.name} の設定
          </span>
          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            ※公的判定は【額面】で行われます
          </span>
        </div>

        {/* 公的年金定期便見込額 */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              公的年金定期便見込額 <span className="text-sky-700 font-bold">【額面】</span>
            </label>
            <span className="text-xs font-bold text-slate-800 font-mono">
              {currentProfile.pensionAge65Monthly} 万円/月
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-1.5">※65歳から受給開始した場合の総支給月額</p>
          <input
            type="range"
            min={3}
            max={35}
            step={0.5}
            value={currentProfile.pensionAge65Monthly}
            onChange={(e) => handleProfileFieldChange('pensionAge65Monthly', parseFloat(e.target.value))}
            className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded"
          />
        </div>

        {/* 年金受給開始年齢 */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">受給開始年齢（繰上げ・繰下げ）</label>
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono">
              {currentProfile.pensionStartAge} 歳
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
            <span>
              {currentProfile.pensionStartAge < 65
                ? `繰上げ: -${(65 - currentProfile.pensionStartAge) * 12 * 0.4}% 減額`
                : currentProfile.pensionStartAge > 65
                ? `繰下げ: +${(currentProfile.pensionStartAge - 65) * 12 * 0.7}% 増額`
                : '標準受給（増減なし）'}
            </span>
            <span className="text-slate-700 font-medium font-mono">
              手取目安: 約{Math.round(currentProfile.pensionAge65Monthly * (currentProfile.pensionStartAge < 65 ? 1 - (65 - currentProfile.pensionStartAge) * 0.048 : 1 + (currentProfile.pensionStartAge - 65) * 0.084) * 0.85 * 10) / 10}万/月
            </span>
          </div>
          <input
            type="range"
            min={60}
            max={75}
            step={1}
            value={currentProfile.pensionStartAge}
            onChange={(e) => handleProfileFieldChange('pensionStartAge', parseInt(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded mt-2"
          />
        </div>

        {/* 2段階の就労リタイア設定 */}
        <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>💼 2段階の就労リタイア計画</span>
          </span>

          {/* ① 正職 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">① 正職リタイア年齢:</span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min={55}
                  max={70}
                  value={currentProfile.careerRetireAge}
                  onChange={(e) => handleProfileFieldChange('careerRetireAge', parseInt(e.target.value) || 60)}
                  className="w-12 border border-slate-300 rounded px-1 text-right text-xs"
                />
                <span>歳</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">
                正職月給 <span className="text-sky-700 font-bold">【額面・賞与込】</span>:
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min={0}
                  max={150}
                  value={currentProfile.careerMonthlySalary}
                  onChange={(e) => handleProfileFieldChange('careerMonthlySalary', parseInt(e.target.value) || 0)}
                  className="w-14 border border-slate-300 rounded px-1 text-right text-xs"
                />
                <span>万円/月</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">② 再雇用・パート引退年齢:</span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min={60}
                  max={80}
                  value={currentProfile.rehireRetireAge}
                  onChange={(e) => handleProfileFieldChange('rehireRetireAge', parseInt(e.target.value) || 65)}
                  className="w-12 border border-slate-300 rounded px-1 text-right text-xs"
                />
                <span>歳</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">
                再雇用月給 <span className="text-sky-700 font-bold">【額面・賞与割込】</span>:
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={currentProfile.rehireMonthlySalary}
                  onChange={(e) => handleProfileFieldChange('rehireMonthlySalary', parseInt(e.target.value) || 0)}
                  className="w-14 border border-slate-300 rounded px-1 text-right text-xs"
                />
                <span>万円/月</span>
              </div>
            </div>
          </div>
        </div>

        {/* NISA等の非課税取り崩し */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-emerald-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              NISA等の非課税取り崩し
            </label>
            <span className="text-xs font-bold text-emerald-800 font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
              {currentProfile.nisaMonthlyDrawdown} 万円/月 【手取り】
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 leading-snug">
            💡 所得判定から完全除外されるため、非課税や1割負担の壁を突破せずに手取り生活費を増やせます。
          </p>
          <input
            type="range"
            min={0}
            max={20}
            step={0.5}
            value={currentProfile.nisaMonthlyDrawdown}
            onChange={(e) => handleProfileFieldChange('nisaMonthlyDrawdown', parseFloat(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-emerald-200 rounded mt-2"
          />
        </div>
      </div>
    </div>
  );
};
