import { SimulatorState, PersonProfile, CalculationResult, ZoneType, MatrixCellData, LifetimeYearlyRecord } from './types';
import { WALL_THRESHOLDS } from './constants';

/**
 * 年金受給開始年齢による増減率を計算
 * 基準65歳。
 * 繰上げ: 60〜64歳 (月あたり-0.4% → 60歳で -24.0%)
 * 繰下げ: 66〜75歳 (月あたり+0.7% → 70歳で +42.0%, 75歳で +84.0%)
 */
export function calculatePensionRate(startAge: number): number {
  if (startAge < 65) {
    const monthsEarly = (65 - startAge) * 12;
    return Math.max(0.76, 1 - monthsEarly * 0.004);
  } else if (startAge > 65) {
    const monthsLate = (startAge - 65) * 12;
    return 1 + monthsLate * 0.007;
  }
  return 1.0;
}

/**
 * 検証対象年齢における就労月給（額面）を判定
 */
export function getMonthlySalaryAtAge(profile: PersonProfile, age: number, salaryScale: number = 1.0): number {
  let baseSalary = 0;
  if (age < profile.careerRetireAge) {
    baseSalary = profile.careerMonthlySalary;
  } else if (age < profile.rehireRetireAge) {
    baseSalary = profile.rehireMonthlySalary;
  } else {
    baseSalary = 0;
  }
  return Math.max(0, baseSalary * salaryScale);
}

/**
 * 総合判定エンジンの単体計算
 */
export function evaluatePersonSituation(
  profile: PersonProfile,
  ageInMonthsTotal: number, // 判定時の月齢
  otherProfile: PersonProfile | null,
  otherAgeMonthsTotal: number | null,
  isSingleOrBereaved: boolean,
  pensionAgeOverride?: number,
  salaryScaleModifier: number = 1.0
): CalculationResult {
  const currentAgeYears = Math.floor(ageInMonthsTotal / 12);
  const currentAgeMonths = ageInMonthsTotal % 12;

  // 1. 年金計算
  const actualStartAge = pensionAgeOverride !== undefined ? pensionAgeOverride : profile.pensionStartAge;
  const pensionRate = calculatePensionRate(actualStartAge);

  let pensionGrossMonthly = 0;
  if (currentAgeYears >= actualStartAge) {
    pensionGrossMonthly = profile.pensionAge65Monthly * pensionRate;
  }
  const pensionGrossAnnual = pensionGrossMonthly * 12;
  const pensionNetMonthly = Math.round(pensionGrossMonthly * 0.85 * 10) / 10; // 税・社保控除後の手取り概算（約85%）

  // 2. 就労給与計算
  const salaryGrossMonthly = getMonthlySalaryAtAge(profile, currentAgeYears, salaryScaleModifier);
  const salaryGrossAnnual = salaryGrossMonthly * 12;

  // 3. 個人判定年収
  const totalGrossIncomeAnnual = pensionGrossAnnual + salaryGrossAnnual;

  // 4. 世帯合算年収 & 配偶者手取り計算
  let householdGrossAnnual = totalGrossIncomeAnnual;
  let spouseNetMonthly = 0;

  if (!isSingleOrBereaved && otherProfile && otherAgeMonthsTotal !== null) {
    const otherAgeYears = Math.floor(otherAgeMonthsTotal / 12);
    const otherPensionRate = calculatePensionRate(otherProfile.pensionStartAge);
    const otherPensionMonthly = otherAgeYears >= otherProfile.pensionStartAge ? otherProfile.pensionAge65Monthly * otherPensionRate : 0;
    const otherSalaryMonthly = getMonthlySalaryAtAge(otherProfile, otherAgeYears, 1.0);
    householdGrossAnnual += (otherPensionMonthly + otherSalaryMonthly) * 12;

    const otherPensionNet = Math.round(otherPensionMonthly * 0.85 * 10) / 10;
    const otherSalaryNet = Math.round(otherSalaryMonthly * 0.8 * 10) / 10;
    spouseNetMonthly = otherPensionNet + otherSalaryNet + otherProfile.nisaMonthlyDrawdown;
  }

  // 5. 住民税非課税判定
  // 65歳以上単身は155万円以下、夫婦世帯は211万円以下が一般目安
  const taxFreeThreshold = isSingleOrBereaved ? WALL_THRESHOLDS.TAX_FREE_SINGLE : WALL_THRESHOLDS.TAX_FREE_COUPLE;
  const isTaxFree = householdGrossAnnual <= taxFreeThreshold;

  // 6. 介護保険自己負担割合（65歳以上の第1号被保険者）
  let careInsuranceRate: 1 | 2 | 3 = 1;
  const care20Limit = isSingleOrBereaved ? WALL_THRESHOLDS.CARE_20_SINGLE : WALL_THRESHOLDS.CARE_20_COUPLE;
  const care30Limit = isSingleOrBereaved ? WALL_THRESHOLDS.CARE_30_SINGLE : 463; // 夫婦3割目安
  if (householdGrossAnnual >= care30Limit) {
    careInsuranceRate = 3;
  } else if (householdGrossAnnual >= care20Limit) {
    careInsuranceRate = 2;
  } else {
    careInsuranceRate = 1;
  }

  // 7. 医療費窓口負担割合
  let medicalInsuranceRate: 1 | 2 | 3 = 1;
  const medical30Limit = isSingleOrBereaved ? WALL_THRESHOLDS.MEDICAL_30_SINGLE : WALL_THRESHOLDS.MEDICAL_30_COUPLE;
  const medical20LateLimit = isSingleOrBereaved ? WALL_THRESHOLDS.MEDICAL_20_LATE_SINGLE : WALL_THRESHOLDS.MEDICAL_20_LATE_COUPLE;

  if (currentAgeYears < 70) {
    medicalInsuranceRate = 3; // 70歳未満は義務教育後〜69歳まで3割
  } else if (currentAgeYears >= 70 && currentAgeYears < 75) {
    if (householdGrossAnnual >= medical30Limit) {
      medicalInsuranceRate = 3;
    } else {
      medicalInsuranceRate = 2; // 前期高齢者は原則2割（法制本則）
    }
  } else {
    // 75歳以上 後期高齢者
    if (householdGrossAnnual >= medical30Limit) {
      medicalInsuranceRate = 3;
    } else if (householdGrossAnnual >= medical20LateLimit && !isTaxFree) {
      medicalInsuranceRate = 2;
    } else {
      medicalInsuranceRate = 1;
    }
  }

  // 8. 高額介護サービス費上限月額 & 特養補足給付
  let highCostCareLimitMonthly = 44400; // 一般標準
  let hasNursingHomeFoodSubsidy = false;

  if (isTaxFree) {
    highCostCareLimitMonthly = 24600; // 非課税世帯は24,600円
    hasNursingHomeFoodSubsidy = true; // 非課税世帯のみ食費・居住費補助対象
  } else if (careInsuranceRate === 3) {
    highCostCareLimitMonthly = 93000; // 現役並み所得者
  } else {
    highCostCareLimitMonthly = 44400; // 一般所得世帯
  }

  // 9. 高額療養費（医療費）上限月額
  let highCostMedicalLimitMonthly = 57600; // 70歳以上一般
  if (currentAgeYears >= 70) {
    if (isTaxFree) {
      highCostMedicalLimitMonthly = 24600; // 低所得者II (24,600円、外来8,000円)
    } else if (householdGrossAnnual >= medical30Limit) {
      highCostMedicalLimitMonthly = 80100; // 現役並み区分
    } else {
      highCostMedicalLimitMonthly = 57600; // 一般区分
    }
  } else {
    // 70歳未満
    if (householdGrossAnnual < 370) {
      highCostMedicalLimitMonthly = 57600;
    } else if (householdGrossAnnual < 770) {
      highCostMedicalLimitMonthly = 80100;
    } else {
      highCostMedicalLimitMonthly = 167400;
    }
  }

  // 10. ゾーン判定
  let zone: ZoneType = 'B';
  if (isTaxFree) {
    zone = 'A'; // 非課税・最大恩恵ゾーン
  } else if (careInsuranceRate >= 2 || medicalInsuranceRate === 3 || householdGrossAnnual >= care20Limit) {
    zone = 'C'; // 負担増（2〜3割）・高額上限跳ね上がりゾーン
  } else {
    zone = 'B'; // 一般所得（1〜2割負担・中庸ゾーン）
  }

  // 11. 手取り生活費の合算概算
  const salaryNetMonthly = Math.round(salaryGrossMonthly * 0.8 * 10) / 10;
  const netDisposableIncomeMonthly =
    Math.round((pensionNetMonthly + salaryNetMonthly + profile.nisaMonthlyDrawdown) * 10) / 10;

  // 世帯合計手取り生活費概算
  const householdNetDisposableIncomeMonthly = isSingleOrBereaved
    ? netDisposableIncomeMonthly
    : Math.round((netDisposableIncomeMonthly + spouseNetMonthly) * 10) / 10;

  // 12. 壁までのマージン（万円、正なら余裕、負なら超過）
  const taxFreeWallMargin = Math.round((taxFreeThreshold - householdGrossAnnual) * 10) / 10;
  const care20WallMargin = Math.round((care20Limit - householdGrossAnnual) * 10) / 10;
  const medical30WallMargin = Math.round((medical30Limit - householdGrossAnnual) * 10) / 10;

  return {
    personAge: currentAgeYears,
    personAgeMonths: currentAgeMonths,
    pensionGrossAnnual: Math.round(pensionGrossAnnual * 10) / 10,
    pensionGrossMonthly: Math.round(pensionGrossMonthly * 10) / 10,
    pensionNetMonthly,
    salaryGrossAnnual: Math.round(salaryGrossAnnual * 10) / 10,
    salaryGrossMonthly: Math.round(salaryGrossMonthly * 10) / 10,
    nisaMonthly: profile.nisaMonthlyDrawdown,
    totalGrossIncomeAnnual: Math.round(totalGrossIncomeAnnual * 10) / 10,
    householdGrossAnnual: Math.round(householdGrossAnnual * 10) / 10,
    netDisposableIncomeMonthly,
    householdNetDisposableIncomeMonthly,
    isTaxFree,
    careInsuranceRate,
    medicalInsuranceRate,
    highCostCareLimitMonthly,
    highCostMedicalLimitMonthly,
    hasNursingHomeFoodSubsidy,
    zone,
    taxFreeWallMargin,
    care20WallMargin,
    medical30WallMargin,
  };
}

/**
 * 3x3 判定マトリクスの生成
 */
export function buildMatrix(state: SimulatorState): MatrixCellData[][] {
  const isBereaved = state.householdType === 'bereaved';
  const isSingle = state.householdType === 'single';

  // 視点対象のプロファイルを決定
  let subject: PersonProfile;
  let other: PersonProfile | null = null;

  if (isSingle) {
    subject = state.primary;
  } else if (isBereaved) {
    subject = state.bereavedSurvivor === 'primary' ? state.primary : state.spouse;
  } else {
    subject = state.perspective === 'primary' ? state.primary : state.spouse;
    other = state.perspective === 'primary' ? state.spouse : state.primary;
  }

  const primaryTotalMonthsNow = state.primary.ageYears * 12 + state.primary.ageMonths;
  const spouseTotalMonthsNow = state.spouse.ageYears * 12 + state.spouse.ageMonths;
  const monthsDiff = spouseTotalMonthsNow - primaryTotalMonthsNow;

  let subjectAgeMonthsTotal = 0;
  let otherAgeMonthsTotal: number | null = null;

  if (isSingle) {
    subjectAgeMonthsTotal = state.targetAgeYears * 12 + subject.ageMonths;
  } else if (isBereaved) {
    if (state.bereavedSurvivor === 'primary') {
      subjectAgeMonthsTotal = state.targetAgeYears * 12 + state.primary.ageMonths;
    } else {
      subjectAgeMonthsTotal = state.targetAgeYears * 12 + state.primary.ageMonths + monthsDiff;
    }
  } else {
    const primaryTargetMonths = state.targetAgeYears * 12 + state.primary.ageMonths;
    const spouseTargetMonths = primaryTargetMonths + monthsDiff;

    if (state.perspective === 'primary') {
      subjectAgeMonthsTotal = primaryTargetMonths;
      otherAgeMonthsTotal = spouseTargetMonths;
    } else {
      subjectAgeMonthsTotal = spouseTargetMonths;
      otherAgeMonthsTotal = primaryTargetMonths;
    }
  }

  const salaryRowModifiers = [
    { scale: 1.5, label: '+50%増収・延長' },
    { scale: 1.0, label: '現在設定どおり' },
    { scale: 0.0, label: '給与0円・完全引退' },
  ];

  const pensionColOffsets = [
    { offset: -2, label: '-2歳 繰上げ' },
    { offset: 0, label: '現在受給年齢' },
    { offset: 2, label: '+2歳 繰下げ' },
  ];

  const matrix: MatrixCellData[][] = [];

  for (let r = 0; r < 3; r++) {
    const row: MatrixCellData[] = [];
    const rowMod = salaryRowModifiers[r];

    for (let c = 0; c < 3; c++) {
      const colMod = pensionColOffsets[c];
      const targetPensionAge = Math.min(75, Math.max(60, subject.pensionStartAge + colMod.offset));

      const calc = evaluatePersonSituation(
        subject,
        subjectAgeMonthsTotal,
        other,
        otherAgeMonthsTotal,
        isSingle || isBereaved,
        targetPensionAge,
        rowMod.scale
      );

      row.push({
        rowOffset: r === 0 ? 1 : r === 1 ? 0 : -1,
        colOffset: colMod.offset,
        pensionStartAge: targetPensionAge,
        salaryModifierLabel: rowMod.label,
        pensionModifierLabel: colMod.label,
        result: calc,
      });
    }
    matrix.push(row);
  }

  return matrix;
}

/**
 * 現在年齢（または60歳）から100歳までの生涯推移タイムラインを生成
 */
export function buildLifetimeTimeline(state: SimulatorState): LifetimeYearlyRecord[] {
  const isSingle = state.householdType === 'single';
  const isBereaved = state.householdType === 'bereaved';

  let subject: PersonProfile;
  let other: PersonProfile | null = null;

  if (isSingle) {
    subject = state.primary;
  } else if (isBereaved) {
    subject = state.bereavedSurvivor === 'primary' ? state.primary : state.spouse;
  } else {
    subject = state.perspective === 'primary' ? state.primary : state.spouse;
    other = state.perspective === 'primary' ? state.spouse : state.primary;
  }

  const primaryTotalMonthsNow = state.primary.ageYears * 12 + state.primary.ageMonths;
  const spouseTotalMonthsNow = state.spouse.ageYears * 12 + state.spouse.ageMonths;
  const monthsDiff = spouseTotalMonthsNow - primaryTotalMonthsNow;

  const startAge = Math.min(60, Math.floor(primaryTotalMonthsNow / 12));
  const endAge = 100;
  const timeline: LifetimeYearlyRecord[] = [];

  for (let age = startAge; age <= endAge; age++) {
    let subjectAgeMonthsTotal = 0;
    let otherAgeMonthsTotal: number | null = null;
    let spouseAgeNumber: number | null = null;

    if (isSingle) {
      subjectAgeMonthsTotal = age * 12 + subject.ageMonths;
    } else if (isBereaved) {
      if (state.bereavedSurvivor === 'primary') {
        subjectAgeMonthsTotal = age * 12 + state.primary.ageMonths;
      } else {
        subjectAgeMonthsTotal = age * 12 + state.primary.ageMonths + monthsDiff;
      }
    } else {
      const primaryTargetMonths = age * 12 + state.primary.ageMonths;
      const spouseTargetMonths = primaryTargetMonths + monthsDiff;
      spouseAgeNumber = Math.floor(spouseTargetMonths / 12);

      if (state.perspective === 'primary') {
        subjectAgeMonthsTotal = primaryTargetMonths;
        otherAgeMonthsTotal = spouseTargetMonths;
      } else {
        subjectAgeMonthsTotal = spouseTargetMonths;
        otherAgeMonthsTotal = primaryTargetMonths;
      }
    }

    const calc = evaluatePersonSituation(
      subject,
      subjectAgeMonthsTotal,
      other,
      otherAgeMonthsTotal,
      isSingle || isBereaved
    );

    let milestone: string | undefined = undefined;
    if (age === 65) milestone = '65歳：年金受給本番 & 介護第1号被保険者化';
    else if (age === 70) milestone = '70歳：前期高齢者入り（窓口原則2割）';
    else if (age === 75) milestone = '75歳：後期高齢者医療へ移行（原則1割・上限2.46万化）';
    else if (age === subject.rehireRetireAge) milestone = `${age}歳：完全リタイア（就労給与ゼロへ）`;

    timeline.push({
      age,
      spouseAge: spouseAgeNumber,
      householdGrossAnnual: calc.householdGrossAnnual,
      pensionGrossAnnual: calc.pensionGrossAnnual,
      salaryGrossAnnual: calc.salaryGrossAnnual,
      nisaAnnual: calc.nisaMonthly * 12,
      netDisposableIncomeMonthly: calc.netDisposableIncomeMonthly,
      householdNetDisposableIncomeMonthly: calc.householdNetDisposableIncomeMonthly,
      isTaxFree: calc.isTaxFree,
      zone: calc.zone,
      careRate: calc.careInsuranceRate,
      medicalRate: calc.medicalInsuranceRate,
      hasNursingHomeFoodSubsidy: calc.hasNursingHomeFoodSubsidy,
      highCostCareLimitMonthly: calc.highCostCareLimitMonthly,
      highCostMedicalLimitMonthly: calc.highCostMedicalLimitMonthly,
      keyMilestone: milestone,
    });
  }

  return timeline;
}
