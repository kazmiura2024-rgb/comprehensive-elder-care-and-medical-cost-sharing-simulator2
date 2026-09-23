import React, { useState, useEffect, useMemo } from 'react';
import { SimulatorState, MatrixCellData, HouseholdType, AppViewMode } from './types';
import { DEFAULT_STATE, CURRENT_STATE_VERSION } from './constants';
import { buildMatrix } from './calculator';
import { InputSidebar } from './components/InputSidebar';
import { MatrixView } from './components/MatrixView';
import { LifetimeTimelineView } from './components/LifetimeTimelineView';
import { DetailDiagnosisModal } from './components/DetailDiagnosisModal';
import { AdviceReports } from './components/AdviceReports';
import { ManualModal } from './components/ManualModal';
import { SystemExplanationModal } from './components/SystemExplanationModal';
import {
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  Layers,
  Check,
  LayoutGrid,
  TrendingUp
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'senior_wall_simulator_state_v2';

export const App: React.FC = () => {
  // 1. LocalStorage復元初期化
  const [state, setState] = useState<SimulatorState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_STATE,
            ...parsed,
            primary: { ...DEFAULT_STATE.primary, ...(parsed.primary || {}) },
            spouse: { ...DEFAULT_STATE.spouse, ...(parsed.spouse || {}) },
            version: CURRENT_STATE_VERSION,
          };
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error', e);
    }
    return DEFAULT_STATE;
  });

  // LocalStorage自動保存
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [state]);

  // ビューモード（3x3マトリクス vs 100歳推移グラフ・表）
  const [viewMode, setViewMode] = useState<AppViewMode>('matrix');

  // モーダル状態管理
  const [selectedCell, setSelectedCell] = useState<MatrixCellData | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 3x3 マトリクスの計算（状態変更時に自動メモ化）
  const matrix = useMemo(() => {
    return buildMatrix(state);
  }, [state]);

  // 中央セルの最新結果（現在値）
  const centerResult = matrix[1][1].result;

  // 条件の全体適用ハンドラ
  const handleApplyConditions = (cell: MatrixCellData) => {
    const roleKey =
      state.householdType === 'single'
        ? 'primary'
        : state.householdType === 'bereaved'
        ? state.bereavedSurvivor
        : state.perspective;

    setState((prev) => {
      const targetProfile = prev[roleKey];
      let newRehireSalary = targetProfile.rehireMonthlySalary;

      if (cell.rowOffset === 1) {
        newRehireSalary = Math.round(newRehireSalary * 1.5 * 10) / 10;
      } else if (cell.rowOffset === -1) {
        newRehireSalary = 0;
      }

      return {
        ...prev,
        [roleKey]: {
          ...targetProfile,
          pensionStartAge: cell.pensionStartAge,
          rehireMonthlySalary: newRehireSalary,
        },
      };
    });

    showToast(`年金開始 ${cell.pensionStartAge}歳・就労条件を適用しました`);
  };

  // 詳細モーダルからの全体適用
  const handleApplyFromModal = (pensionAge: number, rehireSalaryDelta: number) => {
    const roleKey =
      state.householdType === 'single'
        ? 'primary'
        : state.householdType === 'bereaved'
        ? state.bereavedSurvivor
        : state.perspective;

    setState((prev) => {
      const targetProfile = prev[roleKey];
      return {
        ...prev,
        [roleKey]: {
          ...targetProfile,
          pensionStartAge: pensionAge,
          rehireMonthlySalary: Math.max(0, targetProfile.rehireMonthlySalary + rehireSalaryDelta),
        },
      };
    });
    showToast('微調整内容をシミュレーション全体へ反映しました');
  };

  // 初期値リセット
  const handleReset = () => {
    if (window.confirm('すべての設定を初期値にリセットしますか？')) {
      setState(DEFAULT_STATE);
      showToast('初期値にリセットしました');
    }
  };

  // JSONエクスポート
  const handleExport = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `senior_wall_simulation_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('設定データをJSONファイルとして保存しました');
    } catch (e) {
      alert('エクスポートに失敗しました');
    }
  };

  // JSONインポート
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === 'object') {
            setState({
              ...DEFAULT_STATE,
              ...parsed,
              primary: { ...DEFAULT_STATE.primary, ...(parsed.primary || {}) },
              spouse: { ...DEFAULT_STATE.spouse, ...(parsed.spouse || {}) },
              version: CURRENT_STATE_VERSION,
            });
            showToast('設定データを正常に読み込みました');
          }
        } catch (err) {
          alert('ファイルの形式が正しくありません');
        }
      };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* グローバルヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm font-bold text-lg">
              🛡️
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                老後のお金・医療・介護の壁 統合シミュレーター
              </h1>
              <p className="text-[11px] text-slate-500">
                住民税非課税・介護自己負担・医療窓口・高額療養費上限をワンストップ診断
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* モード切替タブボタン */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  viewMode === 'matrix'
                    ? 'bg-white shadow text-sky-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>3×3 マトリクス</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  viewMode === 'timeline'
                    ? 'bg-white shadow text-sky-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>100歳推移グラフ・表</span>
              </button>
            </div>

            <button
              onClick={() => setIsManualOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">使い方マニュアル</span>
            </button>
            <button
              onClick={() => setIsSystemOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition shadow-2xs"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">制度解説</span>
            </button>

            {/* エクスポート・インポート・リセット */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={handleExport}
                title="設定データをダウンロード保存"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              >
                <Download className="w-4 h-4" />
              </button>
              <label
                title="設定データを読み込み復元"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer transition"
              >
                <Upload className="w-4 h-4" />
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              <button
                onClick={handleReset}
                title="初期値にリセット"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインレイアウト: 左側 約33% / 右側 約67% */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row overflow-hidden">
        {/* 左側カラム: 約33% 設定入力 */}
        <aside className="w-full md:w-[34%] lg:w-[32%] shrink-0">
          <InputSidebar state={state} onChange={setState} />
        </aside>

        {/* 右側カラム: 約67% マトリクス or 100歳推移グラフ ＆ 詳細・助言レポート */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-6">
          {/* 現在の主要判定バナー */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xs ${
              centerResult.zone === 'A'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : centerResult.zone === 'B'
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    centerResult.zone === 'A'
                      ? 'bg-emerald-600 text-white'
                      : centerResult.zone === 'B'
                      ? 'bg-blue-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  現在判定: ゾーン{centerResult.zone}
                </span>
                <span className="font-extrabold text-base">
                  世帯年収 {centerResult.householdGrossAnnual}万円【額面】
                </span>
              </div>
              <div className="text-xs mt-1 text-slate-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  {state.householdType === 'couple'
                    ? `検証年齢 ${state.targetAgeYears}歳時点（${state.perspective === 'primary' ? '夫' : '妻'}の視点）`
                    : state.householdType === 'bereaved'
                    ? `死別単身生活（${state.bereavedSurvivor === 'primary' ? '夫' : '妻'}単身）`
                    : `単身世帯 ${state.targetAgeYears}歳時点`}
                </span>
                <span>/</span>
                {state.householdType === 'couple' ? (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span>
                      個人手取り目安:{' '}
                      <strong className="font-mono text-slate-900 font-bold">
                        {centerResult.netDisposableIncomeMonthly} 万円/月
                      </strong>
                    </span>
                    <span className="bg-white/90 border border-slate-300 px-2 py-0.5 rounded-md font-bold text-sky-800 font-mono shadow-2xs">
                      世帯合計手取り目安: {centerResult.householdNetDisposableIncomeMonthly} 万円/月
                    </span>
                  </span>
                ) : (
                  <span>
                    実質手取り生活費目安:{' '}
                    <strong className="font-mono text-slate-900 font-bold">
                      {centerResult.netDisposableIncomeMonthly} 万円/月
                    </strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-sans mr-1">介護:</span>
                <span>{centerResult.careInsuranceRate}割</span>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-sans mr-1">医療窓口:</span>
                <span>{centerResult.medicalInsuranceRate}割</span>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-sans mr-1">高額介護上限:</span>
                <span>{centerResult.highCostCareLimitMonthly.toLocaleString()}円</span>
              </div>
            </div>
          </div>

          {/* ビュー切り替えレンダリング */}
          {viewMode === 'matrix' ? (
            <MatrixView
              matrix={matrix}
              householdType={state.householdType}
              selectedCell={selectedCell}
              onSelectCell={(cell) => setSelectedCell(cell)}
              onApplyConditions={handleApplyConditions}
            />
          ) : (
            <LifetimeTimelineView state={state} onChange={setState} />
          )}

          {/* 制度助言・リスク分析レポート */}
          <AdviceReports currentResult={centerResult} householdType={state.householdType} />
        </main>
      </div>

      {/* 詳細診断・微調整モーダル（マス選択時） */}
      {selectedCell && (
        <DetailDiagnosisModal
          cell={selectedCell}
          state={state}
          onClose={() => setSelectedCell(null)}
          onApplyGlobal={handleApplyFromModal}
          onHouseholdChange={(type) => {
            setState((prev) => ({ ...prev, householdType: type }));
          }}
        />
      )}

      {/* 使い方マニュアルモーダル */}
      <ManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />

      {/* 制度解説モーダル */}
      <SystemExplanationModal isOpen={isSystemOpen} onClose={() => setIsSystemOpen(false)} />

      {/* トースト通知 */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
