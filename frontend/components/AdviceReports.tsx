import React from 'react';
import { CalculationResult, HouseholdType } from '../types';
import { AlertTriangle, Users, Sparkles, TrendingDown, ArrowUpRight } from 'lucide-react';

interface AdviceReportsProps {
  currentResult: CalculationResult;
  householdType: HouseholdType;
}

export const AdviceReports: React.FC<AdviceReportsProps> = ({ currentResult, householdType }) => {
  const isTaxFree = currentResult.isTaxFree;
  const isCloseToCareWall = currentResult.care20WallMargin > 0 && currentResult.care20WallMargin <= 30;
  const isCloseToTaxFreeWall = currentResult.taxFreeWallMargin > 0 && currentResult.taxFreeWallMargin <= 20;

  return (
    <div className="space-y-3">
      <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
        <span>パーソナライズ制度助言＆リスク分析レポート</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* レポート①: 逆進性（働き損）のリスク */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>① 逆進性（働き損）リスク</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              {isTaxFree ? (
                <>
                  現在、世帯年収 {currentResult.householdGrossAnnual}万円で非課税ゾーンAを維持しています。
                  もし年収があと少し増えて課税になると、高額療養費の上限が月24,600円から57,600円へ倍増し、特養の補足給付（年間約30〜50万円）も剥奪されるため、数万円の労働給与増よりも手取りが減る「逆進性の崖」に直面します。
                </>
              ) : (
                <>
                  現在、課税ゾーン（B/C）に位置しています。高額介護サービス費や医療費窓口負担はすでに一般/現役水準（上限44,400円〜）です。中途半端に働くよりも、健康が許す限りしっかり稼いで資産形成するか、繰上げで手取りを最大化する戦略が有効です。
                </>
              )}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-200/60 text-[11px] text-amber-800 font-medium">
            💡 対策: 年金受給開始を繰り下げすぎず、労働給与の調整を推奨
          </div>
        </div>

        {/* レポート②: 世帯別リスク分析 */}
        <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>
                {householdType === 'couple'
                  ? '② 夫婦の年の差ギャップ'
                  : householdType === 'bereaved'
                  ? '② 死別時の単身155万の崖'
                  : '② 単身者の特養補足給付の壁'}
              </span>
            </div>
            <p className="text-xs text-blue-950 leading-relaxed">
              {householdType === 'couple' && (
                <>
                  夫婦間に年の差がある場合、夫が75歳で後期高齢者（1〜2割負担）になっても、妻は前期高齢者（原則2割）や現役（3割）の時期が続きます。世帯合算限度額の判定時期にズレが生じるため、高年収側の退職時期に合わせた医療費支出の平準化が必要です。
                </>
              )}
              {householdType === 'bereaved' && (
                <>
                  配偶者先立ち後は、世帯非課税基準が211万円から単身155万円へ急落します。遺族年金自体は非課税ですが、ご本人の老齢年金受給額が155万円を超えていると即座に課税世帯となり、介護保険料・介護サービス費が一気に跳ね上がります。
                </>
              )}
              {householdType === 'single' && (
                <>
                  単身世帯は年収155万円を超えると特養ホームでの食費・居住費負担限度額（第3段階まで）が受けられなくなり、月額自己負担が平均6〜8万円跳ね上がります。預貯金要件（単身1,000万円以下）と併せて年収管理が極めて重要です。
                </>
              )}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-blue-200/60 text-[11px] text-blue-800 font-medium">
            💡 対策: 生存配偶者の基礎控除枠とNISA移管を事前に検討
          </div>
        </div>

        {/* レポート③: NISAを活用した所得抑制術 */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>③ NISAを活用した黄金ルール</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              公的年金や給与は1円でも増えると「合計所得金額」に加算され、医療・介護の自己負担率を引き上げるトリガーになります。しかし、NISAや特定口座の源泉徴収あり（申告不要）での取崩しは公的所得判定から完全除外されます。
              年金を繰り下げて額面を増やすよりも、年金は65歳標準で受給し、不足する生活費をNISA取崩しで補う方が総合的な手取り・公的優遇を最大化できます。
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-medium">
            💡 黄金ルール: 「年金は増やしすぎず、生活費はNISAで補完」
          </div>
        </div>
      </div>
    </div>
  );
};
