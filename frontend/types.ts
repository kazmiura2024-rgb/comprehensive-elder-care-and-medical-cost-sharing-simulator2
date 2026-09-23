export type HouseholdType = 'single' | 'couple' | 'bereaved';
export type ActivePerspective = 'primary' | 'spouse';
export type BereavedWhoPassed = 'spouse' | 'primary'; // If spouse passed, primary is survivor; if primary passed, spouse is survivor

export type AppViewMode = 'matrix' | 'timeline'; // 3x3マトリクス vs 100歳生涯推移グラフモード

export interface PersonProfile {
  name: string;
  ageYears: number;
  ageMonths: number;
  pensionAge65Monthly: number; // 65歳基準年金月額 (万円/月, 額面)
  pensionStartAge: number; // 60〜75歳
  careerRetireAge: number; // 正職引退年齢
  careerMonthlySalary: number; // 正職月額給与（賞与年額÷12含む, 額面万円）
  rehireRetireAge: number; // 再雇用・パート引退年齢
  rehireMonthlySalary: number; // 再雇用月給（賞与月割含む, 額面万円）
  nisaMonthlyDrawdown: number; // NISA等非課税取崩し（万円/月, 手取り）
}

export interface SimulatorState {
  version: number;
  householdType: HouseholdType;
  perspective: ActivePerspective;
  bereavedSurvivor: 'primary' | 'spouse'; // 残された生存者
  targetAgeYears: number; // 検証ターゲット年齢 (primary基準の満年齢)
  primary: PersonProfile;
  spouse: PersonProfile;
}

export type ZoneType = 'A' | 'B' | 'C';

export interface CalculationResult {
  personAge: number; // 計算対象者の満年齢
  personAgeMonths: number;
  pensionGrossAnnual: number; // 年金年額（額面万円）
  pensionGrossMonthly: number; // 年金月額（額面万円）
  pensionNetMonthly: number; // 年金手取り概算（万円）
  salaryGrossAnnual: number; // 就労給与年額（額面万円）
  salaryGrossMonthly: number; // 就労給与月額（額面万円）
  nisaMonthly: number; // NISA非課税（万円）
  totalGrossIncomeAnnual: number; // 個人判定基準年収（額面万円）
  householdGrossAnnual: number; // 世帯合計年収（額面万円）
  netDisposableIncomeMonthly: number; // 個人実質手取り生活費概算（万円/月）
  householdNetDisposableIncomeMonthly: number; // 世帯合計手取り生活費概算（万円/月）

  isTaxFree: boolean; // 住民税非課税判定
  careInsuranceRate: 1 | 2 | 3; // 介護負担割合 (1, 2, 3割)
  medicalInsuranceRate: 1 | 2 | 3; // 医療窓口負担割合 (1, 2, 3割)
  highCostCareLimitMonthly: number; // 高額介護上限 (円/月)
  highCostMedicalLimitMonthly: number; // 高額療養費上限 (円/月)
  hasNursingHomeFoodSubsidy: boolean; // 特養食費・居住費減免（補足給付）
  zone: ZoneType; // A: 非課税, B: 一般(1-2割), C: 現役並み(2-3割/高負担)

  // 制度の壁までのマージン（万円単位、正: 余裕、負: 超過）
  taxFreeWallMargin: number; // 住民税非課税の壁までの余裕
  care20WallMargin: number; // 介護2割の壁までの余裕
  medical30WallMargin: number; // 医療現役3割の壁までの余裕
}

export interface MatrixCellData {
  rowOffset: number; // 縦軸: 給与調整 (-1: 0円完全引退, 0: 設定値, +1: +50%増収)
  colOffset: number; // 横軸: 年金受給開始年齢 (-1: -2歳繰上げ, 0: 設定値, +1: +2歳繰下げ)
  pensionStartAge: number;
  salaryModifierLabel: string;
  pensionModifierLabel: string;
  result: CalculationResult;
}

// 60歳〜100歳までの各歳推移レコード
export interface LifetimeYearlyRecord {
  age: number; // primaryの年齢
  spouseAge: number | null; // 夫婦時の配偶者年齢
  householdGrossAnnual: number; // 世帯年収【額面】
  pensionGrossAnnual: number; // 年金年額【額面】
  salaryGrossAnnual: number; // 就労給与年額【額面】
  nisaAnnual: number; // NISA取崩し【手取り】
  netDisposableIncomeMonthly: number; // 個人手取り生活費概算（万円/月）
  householdNetDisposableIncomeMonthly: number; // 世帯合計手取り生活費概算（万円/月）
  isTaxFree: boolean; // 住民税非課税判定
  zone: ZoneType; // ゾーン A / B / C
  careRate: 1 | 2 | 3; // 介護負担割合
  medicalRate: 1 | 2 | 3; // 医療負担割合
  hasNursingHomeFoodSubsidy: boolean; // 特養補足給付
  highCostCareLimitMonthly: number; // 高額介護上限
  highCostMedicalLimitMonthly: number; // 高額療養上限
  keyMilestone?: string; // 65歳(年金開始/第1号被保険者)、70歳(前期高齢者)、75歳(後期高齢者)など
}
