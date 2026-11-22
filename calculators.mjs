/**
 * packages/healthstylz-mcp/calculators.mjs
 * Pure clinical, metabolic, and circadian calculation engine for HealthStylz MCP.
 * Grounded in peer-reviewed physiological literature (Mifflin, Katch-McArdle, Brzycki, Tanaka, IOM).
 */

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const toKg = (w, u) => (u === "lb" ? w * KG_PER_LB : w);
export const toCm = (h, u) => (u === "in" ? h * CM_PER_IN : h);
export const round = (v, d = 0) => {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
};

// 1. TDEE
const PAL = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export function calcTdee(input) {
  const w = toKg(input.weight, input.weight_unit);
  const h = toCm(input.height, input.height_unit);
  const pal = PAL[input.activity_level] || 1.2;
  let bmr;
  let formula = "mifflin_st_jeor";

  if (typeof input.body_fat_pct === "number" && input.body_fat_pct >= 3 && input.body_fat_pct <= 60) {
    bmr = 370 + 21.6 * (w * (1 - input.body_fat_pct / 100));
    formula = "katch_mcardle";
  } else {
    bmr = input.sex === "male" ? 10 * w + 6.25 * h - 5 * input.age + 5 : 10 * w + 6.25 * h - 5 * input.age - 161;
  }

  const bmrKcal = round(bmr);
  const tdeeKcal = round(bmr * pal);
  const floor = input.sex === "male" ? 1500 : 1200;

  return {
    bmr_kcal: bmrKcal,
    tdee_kcal: tdeeKcal,
    activity_multiplier: pal,
    formula_used: formula,
    goals: {
      maintenance: tdeeKcal,
      mild_loss: Math.max(floor, tdeeKcal - 250),
      moderate_loss: Math.max(floor, tdeeKcal - 500),
      mild_gain: tdeeKcal + 250,
      moderate_gain: tdeeKcal + 500,
    },
    macros: {
      protein_g: round((tdeeKcal * 0.3) / 4),
      carbs_g: round((tdeeKcal * 0.4) / 4),
      fat_g: round((tdeeKcal * 0.3) / 9),
    },
    clinical_note: `Calculated via ${formula === "katch_mcardle" ? "Katch-McArdle" : "Mifflin-St Jeor"}. Floor is ${floor} kcal/day.`,
  };
}

// 2. BMR
export function calcBmr(input) {
  const w = toKg(input.weight, input.weight_unit);
  const h = toCm(input.height, input.height_unit);
  const isMale = input.sex === "male";

  const mifflin = isMale ? 10 * w + 6.25 * h - 5 * input.age + 5 : 10 * w + 6.25 * h - 5 * input.age - 161;
  const harris = isMale
    ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * input.age
    : 447.593 + 9.247 * w + 3.098 * h - 4.33 * input.age;

  let katch;
  if (typeof input.body_fat_pct === "number" && input.body_fat_pct >= 3 && input.body_fat_pct <= 60) {
    katch = round(370 + 21.6 * (w * (1 - input.body_fat_pct / 100)));
  }

  const schofield = isMale
    ? input.age < 30 ? 15.057 * w + 679 : input.age < 60 ? 11.6 * w + 879 : 13.5 * w + 487
    : input.age < 30 ? 14.723 * w + 496 : input.age < 60 ? 8.7 * w + 829 : 10.5 * w + 596;

  const primary = round(mifflin);

  return {
    bmr_mifflin: primary,
    bmr_harris_benedict: round(harris),
    bmr_katch_mcardle: katch,
    bmr_schofield: round(schofield),
    activity_levels: {
      sedentary: round(primary * 1.2),
      light: round(primary * 1.375),
      moderate: round(primary * 1.55),
      very_active: round(primary * 1.725),
      extra_active: round(primary * 1.9),
    },
    clinical_note: "Mifflin-St Jeor is the Academy of Nutrition and Dietetics gold standard for non-obese and obese adults.",
  };
}

// 3. One Rep Max (1RM)
export function calcOneRepMax(input) {
  const w = input.lift_weight;
  const r = input.reps;
  const unit = input.unit || "lb";

  if (r <= 1) {
    const est = round(w);
    return {
      estimated_1rm: est,
      unit,
      formulas: { brzycki: est, epley: est, lander: est, lombardi: est, mayhew: est, oconner: est, wathan: est },
      percentages: { "100%": est, "95%": round(est * 0.95), "90%": round(est * 0.9), "85%": round(est * 0.85), "80%": round(est * 0.8), "75%": round(est * 0.75), "70%": round(est * 0.7), "65%": round(est * 0.65), "60%": round(est * 0.6) },
      reps_table: Array.from({ length: 12 }, (_, i) => ({ reps: i + 1, weight: round(est * (1 - i * 0.025)) })),
      warning: "Actual 1RM performed directly.",
    };
  }

  const brzycki = round(w / (1.0278 - 0.0278 * r));
  const epley = round(w * (1 + 0.0333 * r));
  const lander = round((100 * w) / (101.3 - 2.67123 * r));
  const lombardi = round(w * Math.pow(r, 0.1));
  const mayhew = round((100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)));
  const oconner = round(w * (1 + 0.025 * r));
  const wathan = round((100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)));

  const avg = round((brzycki + epley + lander + lombardi + mayhew + oconner + wathan) / 7);

  return {
    estimated_1rm: avg,
    unit,
    formulas: { brzycki, epley, lander, lombardi, mayhew, oconner, wathan },
    percentages: {
      "100%": avg,
      "95%": round(avg * 0.95),
      "90%": round(avg * 0.9),
      "85%": round(avg * 0.85),
      "80%": round(avg * 0.8),
      "75%": round(avg * 0.75),
      "70%": round(avg * 0.7),
      "65%": round(avg * 0.65),
      "60%": round(avg * 0.6),
    },
    reps_table: Array.from({ length: 12 }, (_, i) => ({
      reps: i + 1,
      weight: round(avg * (1 - i * 0.025)),
    })),
    warning: r > 10 ? "Accuracy decreases when repetitions exceed 10." : undefined,
  };
}

// 4. FFMI
export function calcFfmi(input) {
  const w = toKg(input.weight, input.weight_unit);
  const hM = toCm(input.height, input.height_unit) / 100;
  const bf = input.body_fat_pct / 100;

  const ffmKg = round(w * (1 - bf), 1);
  const fatKg = round(w * bf, 1);
  const ffmi = round(ffmKg / (hM * hM), 2);
  const normFfmi = round(ffmi + 6.1 * (1.8 - hM), 2);

  let cat = "Average";
  if (input.sex === "male") {
    if (normFfmi < 18) cat = "Below Average";
    else if (normFfmi < 20) cat = "Average";
    else if (normFfmi < 22) cat = "Above Average";
    else if (normFfmi < 23) cat = "Excellent / Highly Muscular";
    else if (normFfmi < 26) cat = "Superior / Near Natural Genetic Limit";
    else cat = "Suspiciously High (Above Natural Limit)";
  } else {
    if (normFfmi < 15) cat = "Below Average";
    else if (normFfmi < 17) cat = "Average";
    else if (normFfmi < 19) cat = "Above Average";
    else if (normFfmi < 22) cat = "Superior / Advanced Athlete";
    else cat = "Suspiciously High (Above Natural Limit)";
  }

  return {
    ffmi,
    normalized_ffmi: normFfmi,
    fat_free_mass_kg: ffmKg,
    fat_mass_kg: fatKg,
    category: cat,
    natural_ceiling: input.sex === "male" ? 25.0 : 21.0,
    interpretation: `Your normalized FFMI is ${normFfmi} kg/m2 (${cat}).`,
  };
}

// 5. VO2 Max
export function calcVo2Max(input) {
  const method = input.method || "resting_hr";
  let vo2 = 0;
  let formula = "";

  if (method === "rockport_walk") {
    const wLb = input.weight ? (input.weight_unit === "kg" ? input.weight / KG_PER_LB : input.weight) : 150;
    const time = input.walk_time_minutes || 15;
    const hr = input.post_walk_hr || 120;
    const genderCoeff = input.sex === "male" ? 6.318 : 0;
    vo2 = 132.853 - 0.0769 * wLb - 0.3877 * input.age + genderCoeff - 3.2649 * time - 0.1565 * hr;
    formula = "Rockport 1-Mile Walk Test (Kline et al., 1987)";
  } else if (method === "cooper_run") {
    const dist = input.distance_meters || 2400;
    vo2 = (dist - 504.9) / 44.73;
    formula = "Cooper 12-Minute Run Test (Cooper, 1968)";
  } else {
    const maxHr = input.max_hr || 208 - 0.7 * input.age;
    const rhr = input.resting_hr || 60;
    vo2 = 15.3 * (maxHr / rhr);
    formula = "Heart Rate Ratio Method (Uth et al., 2004)";
  }

  const score = round(Math.max(10, vo2), 1);
  let rating = "Good";
  if (score < 30) rating = "Poor";
  else if (score < 38) rating = "Fair";
  else if (score < 45) rating = "Good";
  else if (score < 52) rating = "Excellent";
  else rating = "Superior";

  return {
    vo2_max: score,
    fitness_category: rating,
    method_used: formula,
    clinical_significance: "VO2 max is an established independent predictor of all-cause mortality and cardiorespiratory health.",
  };
}

// 6. Sleep Cycle
export function calcSleepCycle(input) {
  const latency = input.latency_minutes ?? 14;
  const [hStr, mStr] = input.time.split(":");
  const targetH = parseInt(hStr, 10);
  const targetM = parseInt(mStr, 10);

  const baseMinutes = targetH * 60 + targetM;
  const mode = input.mode;
  const cycles = [6, 5, 4, 3, 2, 1];
  const suggestedTimes = [];

  for (const c of cycles) {
    const totalMinutes = c * 90;
    let netMinutes;
    if (mode === "wake_at") {
      netMinutes = (baseMinutes - totalMinutes - latency + 1440) % 1440;
    } else {
      netMinutes = (baseMinutes + totalMinutes + latency) % 1440;
    }

    const resH = Math.floor(netMinutes / 60);
    const resM = netMinutes % 60;
    const timeFormatted = `${String(resH).padStart(2, "0")}:${String(resM).padStart(2, "0")}`;

    suggestedTimes.push({
      cycles: c,
      sleep_duration_hours: round((c * 90) / 60, 1),
      calculated_time: timeFormatted,
      recommended: c === 5 || c === 6,
    });
  }

  return {
    mode,
    target_time: input.time,
    latency_minutes: latency,
    cycles: suggestedTimes,
    recommendation: "Aim for 5 to 6 cycles (7.5 - 9.0 hours) to complete physical and cognitive restorative REM stages.",
  };
}

// 7. Heart Rate Zones
export function calcHeartRateZones(input) {
  const age = input.age;
  const formula = input.formula || "tanaka";
  let maxHr = input.max_hr;

  if (!maxHr) {
    if (formula === "fox") maxHr = 220 - age;
    else maxHr = round(208 - 0.7 * age);
  }

  const rhr = input.resting_hr;
  const zonesDef = [
    { zone: 1, name: "Active Recovery", minPct: 0.5, maxPct: 0.6, benefit: "Warm-up, cooldown, active regeneration" },
    { zone: 2, name: "Aerobic Base", minPct: 0.6, maxPct: 0.7, benefit: "Mitochondrial biogenesis, fat oxidation, endurance foundation" },
    { zone: 3, name: "Tempo / Aerobic Power", minPct: 0.7, maxPct: 0.8, benefit: "Cardiovascular efficiency, sustained pace tolerance" },
    { zone: 4, name: "Lactate Threshold", minPct: 0.8, maxPct: 0.9, benefit: "Lactate clearance capacity, anaerobic threshold enhancement" },
    { zone: 5, name: "Neuromuscular / VO2 Max", minPct: 0.9, maxPct: 1.0, benefit: "Peak aerobic capacity, maximal power development" },
  ];

  const zones = zonesDef.map((z) => {
    let lowBpm, highBpm;
    if (rhr && formula === "karvonen") {
      const hrr = maxHr - rhr;
      lowBpm = round(rhr + hrr * z.minPct);
      highBpm = round(rhr + hrr * z.maxPct);
    } else {
      lowBpm = round(maxHr * z.minPct);
      highBpm = round(maxHr * z.maxPct);
    }
    return {
      zone: z.zone,
      name: z.name,
      min_bpm: lowBpm,
      max_bpm: highBpm,
      intensity_range: `${Math.round(z.minPct * 100)}-${Math.round(z.maxPct * 100)}%`,
      benefit: z.benefit,
    };
  });

  return {
    age,
    max_heart_rate: maxHr,
    resting_heart_rate: rhr,
    formula_used: formula === "karvonen" && rhr ? "Karvonen (Heart Rate Reserve)" : formula === "fox" ? "Fox (220 - Age)" : "Tanaka (208 - 0.7 × Age)",
    zones,
  };
}

// 8. Caffeine Decay
export function calcCaffeineDecay(input) {
  const mg = input.caffeine_mg;
  const halfLife = input.half_life_hours || 5.0;

  const [cH, cM] = input.consumption_time.split(":");
  const [bH, bM] = input.bedtime.split(":");

  const cMinutes = parseInt(cH, 10) * 60 + parseInt(cM, 10);
  let bMinutes = parseInt(bH, 10) * 60 + parseInt(bM, 10);
  if (bMinutes <= cMinutes) bMinutes += 1440;

  const hoursToBed = (bMinutes - cMinutes) / 60;
  const decayRate = Math.LN2 / halfLife;
  const residualAtBed = round(mg * Math.exp(-decayRate * hoursToBed), 1);

  const trajectory = [];
  const maxHours = Math.min(24, Math.ceil(hoursToBed) + 4);
  for (let t = 0; t <= maxHours; t += 2) {
    const curMinutes = (cMinutes + t * 60) % 1440;
    const curH = Math.floor(curMinutes / 60);
    const curM = curMinutes % 60;
    trajectory.push({
      hours_elapsed: t,
      time: `${String(curH).padStart(2, "0")}:${String(curM).padStart(2, "0")}`,
      remaining_mg: round(mg * Math.exp(-decayRate * t), 1),
    });
  }

  let status = "Optimal (< 25 mg)";
  if (residualAtBed > 50) status = "Disruptive to Deep Sleep (> 50 mg)";
  else if (residualAtBed > 25) status = "Moderate Sleep Latency Impact (25-50 mg)";

  return {
    initial_caffeine_mg: mg,
    half_life_hours: halfLife,
    hours_until_bedtime: round(hoursToBed, 1),
    residual_at_bedtime_mg: residualAtBed,
    sleep_impact_assessment: status,
    hourly_decay: trajectory,
    clinical_guideline: "Adenosine receptor antagonism remains biologically active when residual caffeine exceeds 25-50 mg.",
  };
}

// 9. Fiber
const FIBER_SWAPS = [
  { food: "Cooked Black Beans", serving: "1 cup (172g)", fiber_g: 15 },
  { food: "Chia Seeds", serving: "2 tbsp (28g)", fiber_g: 10 },
  { food: "Fresh Raspberries", serving: "1 cup (123g)", fiber_g: 8 },
  { food: "Cooked Lentils", serving: "1/2 cup (99g)", fiber_g: 8 },
  { food: "Fresh Pear", serving: "1 medium (178g)", fiber_g: 5.5 },
  { food: "Cooked Rolled Oats", serving: "1 cup (234g)", fiber_g: 4 },
];

export function calcFiber(input) {
  const isMale = input.sex === "male";
  const stage = input.life_stage || "standard";
  const baseline = stage === "pregnant" ? 28 : stage === "lactating" ? 29 : isMale ? (input.age > 50 ? 30 : 38) : (input.age > 50 ? 21 : 25);
  const calAdj = typeof input.daily_calories === "number" && input.daily_calories > 800 ? round((14 * input.daily_calories) / 1000) : undefined;
  const target = calAdj ? Math.max(baseline, calAdj) : baseline;
  const current = typeof input.current_fiber_g === "number" ? Math.max(0, input.current_fiber_g) : 12;
  const gap = Math.max(0, target - current);

  const ramp = [];
  const weeks = Math.max(1, Math.ceil(gap / 4));
  for (let w = 1; w <= weeks; w++) ramp.push({ week: w, daily_fiber_g: Math.min(target, round(current + w * 4)) });

  return {
    target_fiber_g: target,
    calorie_adjusted_target_g: calAdj,
    soluble_fiber_g: round(target * 0.25, 1),
    insoluble_fiber_g: round(target * 0.75, 1),
    ramp_up_weeks: ramp,
    extra_water_oz: round(gap * 1.6),
    high_fiber_food_swaps: FIBER_SWAPS,
    safety_advisory: "Increase fiber intake progressively (+4g/week) with water to prevent digestive cramping.",
  };
}

// Backward Compatibility Dispatchers
export function calcProtein(args) {
  const w = toKg(Number(args.weight || 150), args.weight_unit);
  const who = String(args.who || "adult");
  if (who === "preg") return { target_g: 71, range: [71, 71], note: "RDA for pregnancy is 71 g/day." };
  const rates = { adult: [0.8, 0.8], older: [1.0, 1.2], active: [1.4, 2.0], loss: [0.8, 1.6] };
  const r = rates[who] || rates.adult;
  const minG = round(r[0] * w);
  const maxG = round(r[1] * w);
  return { min_g: minG, max_g: maxG, per_meal_g: round(maxG / 3) };
}

export function calcWater(args) {
  const who = String(args.who || "woman");
  const totalL = { woman: 2.7, man: 3.7, preg: 3.0, nursing: 3.8 };
  const l = totalL[who] || 2.7;
  const drinkL = round(l * 0.8, 1);
  const oz = round(drinkL * 33.814);
  return { total_liters: l, drinks_liters: drinkL, drinks_oz: oz, cups: round(oz / 8, 1) };
}

export function calcSteps(args) {
  const steps = Number(args.steps || 10000);
  const miles = round((steps * Number(args.stride_ft || 2.5)) / 5280, 2);
  return { steps, miles, km: round(miles * 1.609344, 2), estimated_calories_burned: round(miles * 80) };
}

export function calcCalorieDeficit(args) {
  const saves = Number(args.daily_calories_cut || 300);
  const eventual = round(saves / 10, 1);
  return { daily_calories_cut: saves, year_1_loss_lb: round(eventual / 2, 1), eventual_loss_lb: eventual };
}

// Master Dispatcher
export function runCalculator(name, args = {}) {
  const key = String(name || "").toLowerCase().trim().replace(/_/g, "-");
  switch (key) {
    case "tdee":
      return calcTdee({
        sex: args.sex || "male",
        age: Number(args.age || 30),
        weight: Number(args.weight || 70),
        weight_unit: args.weight_unit || "kg",
        height: Number(args.height || 175),
        height_unit: args.height_unit || "cm",
        activity_level: args.activity_level || "sedentary",
        body_fat_pct: args.body_fat_pct !== undefined ? Number(args.body_fat_pct) : undefined,
      });
    case "bmr":
      return calcBmr({
        sex: args.sex || "male",
        age: Number(args.age || 30),
        weight: Number(args.weight || 70),
        weight_unit: args.weight_unit || "kg",
        height: Number(args.height || 175),
        height_unit: args.height_unit || "cm",
        body_fat_pct: args.body_fat_pct !== undefined ? Number(args.body_fat_pct) : undefined,
      });
    case "one-rep-max":
    case "1rm":
      return calcOneRepMax({
        lift_weight: Number(args.lift_weight || args.weight || 135),
        reps: Number(args.reps || 5),
        unit: args.unit || args.weight_unit || "lb",
        exercise: args.exercise,
      });
    case "ffmi":
      return calcFfmi({
        weight: Number(args.weight || 75),
        weight_unit: args.weight_unit || "kg",
        height: Number(args.height || 178),
        height_unit: args.height_unit || "cm",
        body_fat_pct: Number(args.body_fat_pct || 15),
        sex: args.sex || "male",
      });
    case "vo2-max":
      return calcVo2Max({
        method: args.method,
        age: Number(args.age || 35),
        sex: args.sex || "male",
        resting_hr: args.resting_hr !== undefined ? Number(args.resting_hr) : undefined,
        weight: args.weight !== undefined ? Number(args.weight) : undefined,
        weight_unit: args.weight_unit,
        walk_time_minutes: args.walk_time_minutes !== undefined ? Number(args.walk_time_minutes) : undefined,
        post_walk_hr: args.post_walk_hr !== undefined ? Number(args.post_walk_hr) : undefined,
        distance_meters: args.distance_meters !== undefined ? Number(args.distance_meters) : undefined,
      });
    case "sleep-cycle":
      return calcSleepCycle({
        mode: args.mode || args.sleep_mode || "wake_at",
        time: args.time || args.target_time || "07:00",
        latency_minutes: args.latency_minutes !== undefined ? Number(args.latency_minutes) : undefined,
      });
    case "heart-rate-zones":
    case "hr-zones":
      return calcHeartRateZones({
        age: Number(args.age || 35),
        resting_hr: args.resting_hr !== undefined ? Number(args.resting_hr) : undefined,
        max_hr: args.max_hr !== undefined ? Number(args.max_hr) : undefined,
        formula: args.formula,
      });
    case "caffeine-half-life":
    case "caffeine":
    case "caffeine-decay":
      return calcCaffeineDecay({
        caffeine_mg: Number(args.caffeine_mg || 150),
        consumption_time: args.consumption_time || "08:00",
        bedtime: args.bedtime || "22:00",
        half_life_hours: args.half_life_hours !== undefined ? Number(args.half_life_hours) : undefined,
      });
    case "fiber":
    case "dietary-fiber":
      return calcFiber({
        sex: args.sex || "female",
        age: Number(args.age || 35),
        life_stage: args.life_stage,
        daily_calories: args.daily_calories !== undefined ? Number(args.daily_calories) : undefined,
        current_fiber_g: args.current_fiber_g !== undefined ? Number(args.current_fiber_g) : undefined,
      });
    case "protein":
      return calcProtein(args);
    case "water":
      return calcWater(args);
    case "steps":
      return calcSteps(args);
    case "calorie-deficit":
      return calcCalorieDeficit(args);
    default:
      throw new Error(`Unknown calculator: '${name}'. Available: tdee, bmr, one-rep-max, ffmi, vo2-max, sleep-cycle, heart-rate-zones, caffeine-half-life, fiber, protein, water, steps, calorie-deficit.`);
  }
}
