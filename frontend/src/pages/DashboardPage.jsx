import { useEffect, useRef, useState } from "react";
import { getAuth, postAuth } from "../api";
import { getStoredUser, saveUser } from "../authStorage";
import TopNav from "../components/TopNav";

const createEmptyFoodEntry = () => ({ meal_type: "Breakfast", food_item_name: "", quantity: "", unit: "grams" });
const createFoodDay = (dayNumber) => ({
  day_number: dayNumber,
  entries: [createEmptyFoodEntry()],
});

const initialForm = {
  height: "",
  weight: "",
  age: "",
  gender: "",
  activity_level: "",
  sleep_hours: "",
  hydration_liters: "2.0",
  food_days: [createFoodDay(1), createFoodDay(2)],
};

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"];
function createServingOption(unit, label, gramsPerUnit) {
  return { unit, label, grams_per_unit: gramsPerUnit };
}

function createFallbackFoodOption(name, calories, defaultUnit, gramsPerUnit, servingOptions) {
  return {
    name,
    calories_per_100g: calories,
    default_unit: defaultUnit,
    grams_per_unit: gramsPerUnit,
    serving_options: servingOptions,
  };
}

const COMMON_MEASUREMENT_OPTIONS = [
  createServingOption("grams", "Grams", 1),
  createServingOption("kg", "Kilograms (kg)", 1000),
  createServingOption("ml", "Milliliters (ml)", 1),
  createServingOption("liters", "Liters (L)", 1000),
  createServingOption("teaspoon", "1 teaspoon", 5),
  createServingOption("tablespoon", "1 tablespoon", 15),
  createServingOption("cup", "1 cup", 240),
  createServingOption("glass", "1 glass", 240),
  createServingOption("bowl", "1 bowl", 150),
  createServingOption("plate", "1 plate", 250),
  createServingOption("piece", "1 piece", 50),
  createServingOption("slice", "1 slice", 100),
  createServingOption("handful", "1 handful", 30),
  createServingOption("packet", "1 packet", 50),
  createServingOption("can", "1 can", 330),
  createServingOption("bottle", "1 bottle", 500),
  createServingOption("small", "Small serving", 100),
  createServingOption("medium", "Medium serving", 180),
  createServingOption("regular", "Regular serving", 180),
  createServingOption("large", "Large serving", 260),
  createServingOption("serving", "1 serving", 100),
];

const FALLBACK_FOOD_OPTIONS = [
  createFallbackFoodOption("Oats", 389, "bowl", 40, [createServingOption("grams", "Grams", 1), createServingOption("bowl", "1 bowl", 40), createServingOption("cup", "1 cup", 80)]),
  createFallbackFoodOption("Cooked Rice", 130, "bowl", 150, [createServingOption("grams", "Grams", 1), createServingOption("bowl", "1 bowl", 150), createServingOption("cup", "1 cup", 180)]),
  createFallbackFoodOption("Roti", 297, "piece", 35, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 piece", 35)]),
  createFallbackFoodOption("Dal", 116, "bowl", 150, [createServingOption("grams", "Grams", 1), createServingOption("bowl", "1 bowl", 150), createServingOption("cup", "1 cup", 200)]),
  createFallbackFoodOption("Paneer", 265, "piece", 80, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 piece", 80), createServingOption("small", "Small serving", 60), createServingOption("large", "Large serving", 120)]),
  createFallbackFoodOption("Tofu", 144, "piece", 80, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 piece", 80), createServingOption("small", "Small serving", 60), createServingOption("large", "Large serving", 120)]),
  createFallbackFoodOption("Egg", 155, "piece", 50, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 egg", 50)]),
  createFallbackFoodOption("Chicken Breast", 165, "piece", 120, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 piece", 120), createServingOption("small", "Small serving", 90), createServingOption("large", "Large serving", 180)]),
  createFallbackFoodOption("Fish", 206, "piece", 120, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 piece", 120), createServingOption("small", "Small serving", 90), createServingOption("large", "Large serving", 180)]),
  createFallbackFoodOption("Mixed Vegetables", 65, "bowl", 100, [createServingOption("grams", "Grams", 1), createServingOption("bowl", "1 bowl", 100), createServingOption("cup", "1 cup", 120)]),
  createFallbackFoodOption("Salad", 35, "bowl", 80, [createServingOption("grams", "Grams", 1), createServingOption("bowl", "1 bowl", 80), createServingOption("cup", "1 cup", 100)]),
  createFallbackFoodOption("Milk", 61, "ml", 240, [createServingOption("ml", "Milliliters (ml)", 1), createServingOption("liters", "Liters (L)", 1000), createServingOption("glass", "1 glass", 240), createServingOption("cup", "1 cup", 240)]),
  createFallbackFoodOption("Curd", 98, "bowl", 100, [createServingOption("grams", "Grams", 1), createServingOption("bowl", "1 bowl", 100), createServingOption("cup", "1 cup", 150)]),
  createFallbackFoodOption("Banana", 89, "piece", 118, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 banana", 118), createServingOption("small", "Small banana", 90), createServingOption("large", "Large banana", 135)]),
  createFallbackFoodOption("Apple", 52, "piece", 182, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 apple", 182), createServingOption("small", "Small apple", 150), createServingOption("large", "Large apple", 220)]),
  createFallbackFoodOption("Mixed Nuts", 607, "handful", 30, [createServingOption("grams", "Grams", 1), createServingOption("handful", "1 handful", 30), createServingOption("small", "Small serving", 20), createServingOption("large", "Large serving", 45)]),
  createFallbackFoodOption("Chips", 536, "packet", 30, [createServingOption("grams", "Grams", 1), createServingOption("packet", "1 packet", 30), createServingOption("small", "Small packet", 20), createServingOption("large", "Large packet", 50)]),
  createFallbackFoodOption("Sweets", 400, "piece", 30, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 piece", 30), createServingOption("small", "Small piece", 20), createServingOption("large", "Large piece", 45)]),
  createFallbackFoodOption("Soft Drink", 41, "ml", 330, [createServingOption("ml", "Milliliters (ml)", 1), createServingOption("liters", "Liters (L)", 1000), createServingOption("can", "1 can", 330), createServingOption("bottle", "1 bottle", 500)]),
  createFallbackFoodOption("Burger", 295, "regular", 180, [createServingOption("grams", "Grams", 1), createServingOption("small", "Small burger", 130), createServingOption("regular", "Regular burger", 180), createServingOption("large", "Large burger", 250)]),
  createFallbackFoodOption("Pizza", 266, "slice", 120, [createServingOption("grams", "Grams", 1), createServingOption("slice", "1 slice", 120), createServingOption("small", "Small pizza", 400), createServingOption("medium", "Medium pizza", 700), createServingOption("large", "Large pizza", 950)]),
  createFallbackFoodOption("Fries", 312, "medium", 117, [createServingOption("grams", "Grams", 1), createServingOption("small", "Small fries", 80), createServingOption("medium", "Medium fries", 117), createServingOption("large", "Large fries", 150)]),
  createFallbackFoodOption("Biscuits", 502, "piece", 15, [createServingOption("grams", "Grams", 1), createServingOption("piece", "1 biscuit", 15), createServingOption("small", "Small serving", 15), createServingOption("large", "Large serving", 30)]),
];

function normalizeFoodKey(value) {
  return String(value || "").toLowerCase().trim();
}

function buildGenericFoodOption(name, calories = 120) {
  const normalized = normalizeFoodKey(name);
  const isLiquid = ["drink", "juice", "milk", "tea", "coffee", "shake", "smoothie", "water", "soda"].some((token) => normalized.includes(token));

  if (isLiquid) {
    return createFallbackFoodOption(name, calories, "ml", 250, [
      createServingOption("ml", "Milliliters (ml)", 1),
      createServingOption("liters", "Liters (L)", 1000),
      createServingOption("glass", "1 glass", 250),
      createServingOption("bottle", "1 bottle", 500),
    ]);
  }

  return createFallbackFoodOption(name, calories, "grams", 100, [
    createServingOption("grams", "Grams", 1),
    createServingOption("small", "Small serving", 100),
    createServingOption("medium", "Medium serving", 180),
    createServingOption("large", "Large serving", 260),
  ]);
}

function getFoodOptionByName(foodOptions, foodName) {
  const normalized = normalizeFoodKey(foodName);
  return foodOptions.find((food) => (
    normalizeFoodKey(food?.name) === normalized
    || (Array.isArray(food?.aliases) && food.aliases.some((alias) => normalizeFoodKey(alias) === normalized))
  )) || null;
}

function getServingOptionsForFood(foodOptions, foodName) {
  const selectedFood = getFoodOptionByName(foodOptions, foodName);
  const sourceOptions = selectedFood?.serving_options?.length
    ? selectedFood.serving_options
    : foodName
      ? buildGenericFoodOption(foodName).serving_options
      : COMMON_MEASUREMENT_OPTIONS;

  const mergedOptions = new Map();
  [...sourceOptions, ...COMMON_MEASUREMENT_OPTIONS].forEach((option) => {
    const key = String(option?.unit || "").toLowerCase().trim();
    if (!key || mergedOptions.has(key)) return;
    mergedOptions.set(key, option);
  });
  return Array.from(mergedOptions.values());
}

function getDefaultUnitForFood(foodOptions, foodName) {
  const selectedFood = getFoodOptionByName(foodOptions, foodName);
  if (selectedFood?.default_unit) return selectedFood.default_unit;
  if (foodName) return buildGenericFoodOption(foodName).default_unit;
  return "grams";
}

const DIET_CLASSIFICATIONS = [
  {
    value: "Balanced",
    label: "Balanced",
    description: "Calorie intake is near your daily requirement (within ±10%).",
    riskScore: 4,
  },
  {
    value: "Slightly Imbalanced",
    label: "Slightly Imbalanced",
    description: "Intake is not optimal but not in high-risk calorie range.",
    riskScore: 8,
  },
  {
    value: "High Calorie Diet",
    label: "High Calorie Diet",
    description: "Daily intake is significantly above required calories (>20%).",
    riskScore: 13,
  },
  {
    value: "Low Calorie Diet",
    label: "Low Calorie Diet",
    description: "Daily intake is significantly below required calories (<-20%).",
    riskScore: 11,
  },
  {
    value: "High Sugar",
    label: "High Sugar",
    description: "Sugar-heavy foods exceed healthy daily threshold.",
    riskScore: 14,
  },
  {
    value: "High Fat",
    label: "High Fat",
    description: "Fat-heavy foods exceed healthy daily threshold.",
    riskScore: 12,
  },
  {
    value: "Low Protein",
    label: "Low Protein",
    description: "Protein intake is below daily requirement for body weight.",
    riskScore: 10,
  },
  {
    value: "Irregular Meals",
    label: "Irregular Meals",
    description: "Core meals (breakfast/lunch/dinner) are skipped or highly inconsistent.",
    riskScore: 11,
  },
];

const DIET_TYPE_LOOKUP = DIET_CLASSIFICATIONS.reduce((acc, item) => {
  acc[item.value.toLowerCase()] = item;
  return acc;
}, {});

function normalizeDietType(dietType) {
  return String(dietType || "").toLowerCase().trim();
}

function getDietTypeInfo(dietType) {
  const normalized = normalizeDietType(dietType);
  return (
    DIET_TYPE_LOOKUP[normalized] || {
      value: "Unknown",
      label: "General",
      description: "General mixed pattern. Prefer whole foods, fiber, and adequate protein.",
      riskScore: 8,
    }
  );
}

function getLiveBmi(height, weight) {
  const heightCm = Number(height || 0);
  const weightKg = Number(weight || 0);
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  if (!heightM) return null;
  const bmi = weightKg / (heightM * heightM);
  return Number.isFinite(bmi) ? bmi : null;
}

function litersToHydrationLevel(liters) {
  const value = Number(liters || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(1, Math.min(10, Math.round((value / 3) * 10)));
}

function hydrationLevelToLiters(level) {
  const value = Number(level || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Number(((value / 10) * 3).toFixed(1));
}

function getMissingFieldSummary(form) {
  const missing = [];
  if (!Number(form.height)) missing.push("Height");
  if (!Number(form.weight)) missing.push("Weight");
  if (!form.activity_level) missing.push("Activity Level");
  if (!Number(form.age)) missing.push("Age");
  if (!form.gender) missing.push("Gender");
  if (!Number(form.sleep_hours)) missing.push("Sleep Hours");
  if (!Number(form.hydration_liters) || Number(form.hydration_liters) <= 0) missing.push("Water Intake (L/day)");

  const validDays = (form.food_days || []).filter((day) =>
    (day.entries || []).some((item) => item.food_item_name && Number(item.quantity) > 0),
  ).length;
  const incompleteFoodRows = (form.food_days || []).reduce((count, day, dayIndex) => {
    const rows = day.entries || [];
    const dayHasAnyInput = rows.some((item) => item.food_item_name || Number(item.quantity) > 0);
    const shouldValidateDay = dayIndex < 2 || dayHasAnyInput;
    if (!shouldValidateDay) return count;
    return count + rows.filter((item) => !item.food_item_name || !Number(item.quantity) || Number(item.quantity) <= 0).length;
  }, 0);
  if (validDays < 2) {
    missing.push("Food intake for Day 1 and Day 2 (minimum)");
  }
  if (incompleteFoodRows > 0) {
    missing.push(`Food rows (${incompleteFoodRows} incomplete)`);
  }

  return missing;
}

function getRiskClassName(riskLevel) {
  const normalized = String(riskLevel || "").toLowerCase().trim();
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium")) return "medium";
  if (normalized.includes("low")) return "low";
  return "medium";
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function getActivityScore(activityLevel) {
  const value = String(activityLevel || "").toLowerCase();
  if (value === "sedentary") return 16;
  if (value === "light") return 10;
  if (value === "moderate") return 5;
  if (value === "active") return 3;
  if (value === "very active") return 2;
  if (value === "high") return 2;
  return 8;
}

function getDietScore(dietType) {
  return getDietTypeInfo(dietType).riskScore;
}

function getDietInterpretation(dietType) {
  const normalized = normalizeDietType(dietType);
  if (normalized === "balanced") return "Intake aligns with requirement and supports stable metabolic health";
  if (normalized === "slightly imbalanced") return "Mild mismatch between required and consumed calories";
  if (normalized === "high calorie diet") return "Higher risk of weight gain and metabolic strain";
  if (normalized === "low calorie diet") return "Higher risk of fatigue, poor recovery, and nutrient deficit";
  if (normalized === "high sugar") return "Higher metabolic risk from sugar spikes and low satiety foods";
  if (normalized === "high fat") return "Higher cardio-metabolic risk due to fat-heavy food choices";
  if (normalized === "low protein") return "Recovery and muscle-maintenance risk due to protein gap";
  if (normalized === "irregular meals") return "Energy and appetite instability due to inconsistent meal timing";
  return "Moderate dietary risk pattern";
}

function getRiskBadgeClass(riskLevel) {
  const normalized = String(riskLevel || "").toLowerCase();
  if (normalized.includes("high")) return "badge danger";
  if (normalized.includes("low")) return "badge success";
  return "badge warning";
}

function getDietBadgeClass(dietType) {
  const normalized = normalizeDietType(dietType);
  if (normalized === "balanced") return "badge success";
  if (normalized === "high calorie diet" || normalized === "high sugar" || normalized === "high fat") return "badge danger";
  return "badge warning";
}

function getCalorieDeltaBadgeClass(delta) {
  const value = Number(delta || 0);
  if (value > 250) return "badge danger";
  if (value < -250) return "badge warning";
  return "badge success";
}

function getAssessmentInsights(assessment) {
  if (!assessment) return null;

  const bmi = Number(assessment.bmi || 0);
  const sleepHours = Number(assessment.sleep_hours || 0);
  const hydrationLevel = Number(assessment.hydration_level || 0);
  const riskLevel = String(assessment.risk_level || "").toLowerCase();

  const baseRiskScore = riskLevel.includes("high") ? 60 : riskLevel.includes("medium") ? 40 : 20;
  const bmiRiskScore = bmi >= 30 || bmi < 18.5 ? 15 : bmi >= 25 ? 8 : 2;
  const sleepRiskScore = sleepHours < 5 ? 14 : sleepHours < 7 ? 8 : sleepHours <= 9 ? 3 : 9;
  const hydrationRiskScore = hydrationLevel < 4 ? 12 : hydrationLevel < 6 ? 6 : hydrationLevel < 8 ? 3 : 1;
  const activityRiskScore = getActivityScore(assessment.activity_level);
  const dietRiskScore = getDietScore(assessment.detected_diet_pattern || assessment.diet_type);

  const totalRisk = Math.min(
    95,
    Math.round(baseRiskScore + bmiRiskScore + sleepRiskScore + hydrationRiskScore + activityRiskScore + dietRiskScore),
  );

  const severeOutcomeRisk = Math.min(40, Math.max(3, Math.round(totalRisk * 0.35)));
  const healthyShare = Math.max(0, 100 - totalRisk);

  return {
    bmiCategory: getBmiCategory(bmi),
    totalRisk,
    severeOutcomeRisk,
    healthyShare,
  };
}

function getDietPlan(assessment, insights) {
  if (!assessment || !insights) return null;

  const hydrationLevel = Number(assessment.hydration_level || 0);
  const sleepHours = Number(assessment.sleep_hours || 0);
  const bmi = Number(assessment.bmi || 0);
  const activity = String(assessment.activity_level || "");
  const currentDiet = String(assessment.detected_diet_pattern || assessment.diet_type || "");
  const currentDietNormalized = normalizeDietType(currentDiet);
  const isBalanced = currentDietNormalized === "balanced";
  const isHighCalorie = currentDietNormalized === "high calorie diet";
  const isLowCalorie = currentDietNormalized === "low calorie diet";
  const isHighSugar = currentDietNormalized === "high sugar";
  const isHighFat = currentDietNormalized === "high fat";
  const isLowProtein = currentDietNormalized === "low protein";
  const isIrregularMeals = currentDietNormalized === "irregular meals";

  const focus = [];
  if (bmi < 18.5 || isLowCalorie) focus.push("Increase healthy calorie intake with protein-rich meals.");
  if (bmi >= 25 || isHighCalorie) focus.push("Create a mild calorie deficit and increase fiber intake.");
  if (hydrationLevel < 6) focus.push("Increase water intake and include hydrating foods like cucumber and watermelon.");
  if (sleepHours < 7) focus.push("Avoid heavy dinner and caffeine at night to improve sleep quality.");
  if (activity === "Sedentary") focus.push("Prefer lower sugar snacks and increase hydration throughout the day.");
  if (isHighSugar) focus.push("Shift from sugary foods to low-GI carbs, fruit, and high-fiber snacks.");
  if (isHighFat) focus.push("Reduce fried foods and prioritize healthy fats from nuts, seeds, and fish.");
  if (isLowProtein) focus.push("Target protein in every meal from dal, curd, eggs, paneer, tofu, fish, or chicken.");
  if (isIrregularMeals) focus.push("Set fixed meal windows and avoid skipping breakfast/lunch.");
  if (isBalanced) focus.push("Maintain current intake quality and keep meal timings consistent.");
  if (focus.length === 0) focus.push("Maintain a balanced macro split with consistent meal timings.");

  const avoid = [];
  if (isHighSugar) avoid.push("Sugary drinks, sweets, and refined flour snacks.");
  if (isHighFat) avoid.push("Deep-fried foods and processed high-fat meals.");
  if (isLowProtein) avoid.push("Carb-only meals without a protein source.");
  if (isIrregularMeals) avoid.push("Skipping meals followed by overeating late at night.");
  if (isHighCalorie) avoid.push("Large portion sizes, calorie-dense snacks, and repeated late-night eating.");
  if (isLowCalorie) avoid.push("Long fasting gaps and low-volume meals with poor nutrient density.");
  if (hydrationLevel < 6) avoid.push("Excess caffeine and diuretic drinks that can dehydrate.");
  if (sleepHours < 7) avoid.push("Late-night heavy meals.");
  if (avoid.length === 0) avoid.push("Highly processed packaged foods.");

  const mealPlan = [
    {
      meal: "Breakfast",
      plan:
        isIrregularMeals
          ? "Quick fixed breakfast: overnight oats + nuts + fruit (eat within 1 hour of waking)."
          : isLowProtein
            ? "Protein breakfast: moong chilla/eggs + curd + fruit."
            : bmi >= 25
              ? "Oats with chia seeds, 1 boiled egg or sprouts, and 1 fruit."
              : "Peanut butter toast, milk/curd, mixed nuts, and 1 fruit.",
    },
    {
      meal: "Mid-Morning",
      plan:
        isHighSugar || isHighCalorie
          ? "Unsweetened buttermilk/green tea with roasted chana or almonds."
          : "Coconut water or buttermilk with roasted chana or almonds.",
    },
    {
      meal: "Lunch",
      plan:
        isLowProtein
          ? "2 whole-grain rotis, dal + paneer/tofu/chicken, mixed salad, curd."
          : "2 whole-grain rotis, grilled chicken/fish or dal, vegetables, curd.",
    },
    {
      meal: "Evening Snack",
      plan:
        isHighSugar
          ? "Apple/guava + nuts + unsweetened tea (skip biscuits and sweets)."
          : hydrationLevel < 6
            ? "Cucumber slices + watermelon + herbal tea."
            : "Fruit + nuts or paneer cubes.",
    },
    {
      meal: "Dinner",
      plan:
        sleepHours < 7 || isIrregularMeals
          ? "Light dinner: soup + sauteed vegetables + protein (paneer/tofu/chicken)."
          : isLowCalorie
            ? "Energy-support dinner: quinoa/brown rice + dal/protein + vegetables + curd."
            : "Balanced dinner: quinoa/brown rice + vegetables + protein.",
    },
  ];

  return { focus, avoid, mealPlan };
}

function getFutureOutlook(assessment, insights) {
  if (!assessment || !insights) return null;

  const bmi = Number(assessment.bmi || 0);
  const hydration = Number(assessment.hydration_level || 0);
  const sleep = Number(assessment.sleep_hours || 0);
  const activity = String(assessment.activity_level || "");
  const diet = normalizeDietType(assessment.detected_diet_pattern || assessment.diet_type);

  const drawbackSignals = [
    {
      label: "Metabolic risk",
      score: Math.min(
        100,
        Math.round(insights.totalRisk * 0.9 + (diet === "high sugar" || diet === "high calorie diet" ? 10 : 0)),
      ),
    },
    {
      label: "Weight instability",
      score: Math.min(100, Math.round((bmi >= 25 || bmi < 18.5 ? 65 : 35) + (activity === "Sedentary" ? 20 : 0))),
    },
    {
      label: "Sleep and recovery issue",
      score: Math.min(100, Math.round((sleep < 7 ? 65 : 30) + (hydration < 6 ? 20 : 5) + (diet === "irregular meals" ? 8 : 0))),
    },
    {
      label: "Dehydration risk",
      score: Math.min(100, Math.round((10 - hydration) * 8 + (sleep < 7 ? 10 : 0))),
    },
    {
      label: "Cardio strain",
      score: Math.min(
        100,
        Math.round(((diet === "high fat" || diet === "high calorie diet") ? 60 : 35) + (activity === "Sedentary" ? 20 : 0)),
      ),
    },
  ];

  const avgDrawback = Math.round(drawbackSignals.reduce((acc, item) => acc + item.score, 0) / drawbackSignals.length);
  const projected6Month = Math.min(100, Math.round(insights.totalRisk + avgDrawback * 0.12));
  const projected12Month = Math.min(100, Math.round(insights.totalRisk + avgDrawback * 0.22));

  const timeline = [
    {
      period: "Next 1-3 months",
      message:
        avgDrawback >= 60
          ? "Energy dips, cravings, and hydration-related fatigue may increase."
          : "Mild fatigue and inconsistent recovery can start if habits stay unchanged.",
    },
    {
      period: "Next 3-6 months",
      message:
        avgDrawback >= 60
          ? "Weight, blood sugar trend, and concentration issues may become more visible."
          : "You may see gradual increase in risk markers and hydration issues.",
    },
    {
      period: "Next 6-12 months",
      message:
        avgDrawback >= 60
          ? "Sustained lifestyle imbalance may raise chronic-risk trajectory."
          : "Current risk can drift upward if diet and recovery are not improved.",
    },
  ];

  return { drawbackSignals, projected6Month, projected12Month, timeline };
}

function getRiskPieSegments(insights) {
  if (!insights) {
    return {
      riskWithoutSevere: 0,
      severeWithinRisk: 0,
      healthy: 100,
    };
  }

  const totalRisk = Math.max(0, Math.min(100, Number(insights.totalRisk || 0)));
  const severe = Math.max(0, Math.min(100, Number(insights.severeOutcomeRisk || 0)));
  const severeWithinRisk = Math.min(totalRisk, severe);
  const riskWithoutSevere = Math.max(0, totalRisk - severeWithinRisk);
  const healthy = Math.max(0, 100 - totalRisk);

  return { riskWithoutSevere, severeWithinRisk, healthy };
}

export default function DashboardPage() {
  const [active, setActive] = useState("health-form");
  const [form, setForm] = useState(initialForm);
  const [foodOptions, setFoodOptions] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pieHoverInfo, setPieHoverInfo] = useState(null);
  const [feedbackNotifications, setFeedbackNotifications] = useState([]);
  const [foodSearchLoading, setFoodSearchLoading] = useState(false);
  const [searchFocusedKey, setSearchFocusedKey] = useState("");
  const searchDebounceRef = useRef(null);
  const user = getStoredUser();
  const insights = getAssessmentInsights(assessment);
  const riskPie = getRiskPieSegments(insights);
  const dietPlan = getDietPlan(assessment, insights);
  const futureOutlook = getFutureOutlook(assessment, insights);
  const liveBmi = getLiveBmi(form.height, form.weight);
  const liveBmiCategory = liveBmi ? getBmiCategory(liveBmi) : "Enter height and weight";

  function getPieSegmentFromEvent(event) {
    if (!insights) return null;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const point = "touches" in event && event.touches?.[0] ? event.touches[0] : event;
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const outerRadius = rect.width / 2;
    const innerRadius = outerRadius * 0.56;

    if (distance < innerRadius || distance > outerRadius) return null;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    const anglePercent = (angle / 360) * 100;

    const totalRiskEnd = riskPie.riskWithoutSevere;
    const severeEnd = Math.min(100, riskPie.riskWithoutSevere + riskPie.severeWithinRisk);

    let segment = {
      label: "Healthy Share",
      value: insights.healthyShare,
      colorClass: "dot-healthy",
      description: "Lower current risk region.",
    };

    if (anglePercent <= totalRiskEnd) {
      segment = {
        label: "Overall Risk",
        value: insights.totalRisk,
        colorClass: "dot-risk",
        description: "Current total health-risk intensity.",
      };
    } else if (anglePercent <= severeEnd) {
      segment = {
        label: "Severe Outcome Indicator",
        value: insights.severeOutcomeRisk,
        colorClass: "dot-severe",
        description: "Estimated severe outcome signal.",
      };
    }

    return {
      ...segment,
      x,
      y,
    };
  }

  function handlePiePointerMove(event) {
    const segment = getPieSegmentFromEvent(event);
    setPieHoverInfo(segment);
  }

  async function loadResults() {
    try {
      const data = await getAuth("/get-health-data");
      setAssessment(data.assessment || null);
    } catch {
      setAssessment(null);
    }
  }

  async function loadHistory() {
    try {
      const data = await getAuth("/get-history");
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  }

  async function loadFoodOptions() {
    try {
      const data = await getAuth("/food-options");
      const foods = Array.isArray(data.foods) && data.foods.length > 0 ? data.foods : FALLBACK_FOOD_OPTIONS;
      setFoodOptions(foods);
    } catch {
      setFoodOptions(FALLBACK_FOOD_OPTIONS);
    }
  }

  async function loadFeedbackNotifications() {
    try {
      const data = await getAuth("/my-feedback");
      const feedback = Array.isArray(data.feedback) ? data.feedback : [];
      setFeedbackNotifications(feedback);
      const unreadCount = Number(data.unread_count || 0);
      if (user?.token) {
        saveUser({ ...user, unreadFeedbackCount: unreadCount });
      }
    } catch {
      setFeedbackNotifications([]);
    }
  }

  async function markFeedbackRead(feedbackId) {
    try {
      await postAuth(`/my-feedback/${feedbackId}/read`, {});
      await loadFeedbackNotifications();
    } catch {
      // ignore read errors silently in UI
    }
  }

  function updateFoodEntry(dayIndex, entryIndex, key, value) {
    setForm((prev) => ({
      ...prev,
      food_days: prev.food_days.map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;
        return {
          ...day,
          entries: day.entries.map((item, eIdx) => {
            if (eIdx !== entryIndex) return item;
            if (key === "meal_type") {
              return { ...item, meal_type: value, food_item_name: "", unit: "grams" };
            }
            if (key === "food_item_name") {
              const servingOptions = getServingOptionsForFood(foodOptions, value);
              const nextUnit = servingOptions.some((option) => option.unit === item.unit)
                ? item.unit
                : getDefaultUnitForFood(foodOptions, value);
              return { ...item, food_item_name: value, unit: nextUnit };
            }
            return { ...item, [key]: value };
          }),
        };
      }),
    }));
  }

  function addFoodEntry(dayIndex) {
    setForm((prev) => ({
      ...prev,
      food_days: prev.food_days.map((day, dIdx) => (
        dIdx === dayIndex ? { ...day, entries: [...day.entries, createEmptyFoodEntry()] } : day
      )),
    }));
  }

  function removeFoodEntry(dayIndex, entryIndex) {
    setForm((prev) => ({
      ...prev,
      food_days: prev.food_days.map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;
        if (day.entries.length <= 1) return { ...day, entries: [createEmptyFoodEntry()] };
        return { ...day, entries: day.entries.filter((_, eIdx) => eIdx !== entryIndex) };
      }),
    }));
  }

  function addFoodDay() {
    setForm((prev) => ({
      ...prev,
      food_days: [...prev.food_days, createFoodDay(prev.food_days.length + 1)],
    }));
  }

  function removeFoodDay(dayIndex) {
    setForm((prev) => {
      if (prev.food_days.length <= 2) return prev;
      const updated = prev.food_days.filter((_, idx) => idx !== dayIndex)
        .map((day, idx) => ({ ...day, day_number: idx + 1 }));
      return { ...prev, food_days: updated };
    });
  }

  function mergeFoodOptions(newFoods) {
    if (!Array.isArray(newFoods) || newFoods.length === 0) return;
    setFoodOptions((prev) => {
      const merged = new Map(prev.map((food) => [String(food.name || "").toLowerCase(), food]));
      newFoods.forEach((food) => {
        const key = String(food?.name || "").toLowerCase().trim();
        if (!key) return;
        merged.set(key, {
          ...buildGenericFoodOption(food.name, Number(food.calories_per_100g || 120)),
          ...food,
          calories_per_100g: Number(food.calories_per_100g || 120),
          aliases: Array.isArray(food.aliases) ? food.aliases : [],
        });
      });
      return Array.from(merged.values());
    });
  }

  async function searchFoodCatalog(query) {
    const trimmed = String(query || "").trim();
    if (trimmed.length < 2) return;

    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setFoodSearchLoading(true);
      try {
        const data = await getAuth(`/food-search?q=${encodeURIComponent(trimmed)}`);
        mergeFoodOptions(data.foods || []);
      } catch {
        // Ignore search API failures and keep local food options.
      } finally {
        setFoodSearchLoading(false);
      }
    }, 250);
  }

  function getFoodSuggestions(query) {
    const search = String(query || "").toLowerCase().trim();
    const source = search
      ? foodOptions.filter((food) => (
        String(food.name || "").toLowerCase().includes(search)
        || (Array.isArray(food.aliases) && food.aliases.some((alias) => String(alias || "").toLowerCase().includes(search)))
      ))
      : foodOptions;
    return source.slice(0, 120);
  }

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      age: user?.age ? String(user.age) : prev.age,
      gender: user?.gender || prev.gender,
    }));
    loadResults();
    loadHistory();
    loadFoodOptions();
    loadFeedbackNotifications();
  }, []);

  useEffect(() => () => {
    clearTimeout(searchDebounceRef.current);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    setMessage("Processing your assessment...");
    try {
      const missingFields = getMissingFieldSummary(form);
      if (missingFields.length > 0) {
        throw new Error(`Please fill required fields: ${missingFields.join(", ")}`);
      }

      const normalizedFoodIntake = (form.food_days || [])
        .flatMap((day) => (day.entries || []).map((item) => ({
          day_number: Number(day.day_number),
          meal_type: item.meal_type,
          food_item_name: item.food_item_name,
          quantity: Number(item.quantity),
          unit: item.unit,
        })))
        .filter((item) => item.food_item_name && Number.isFinite(item.quantity) && item.quantity > 0);

      if (normalizedFoodIntake.length === 0) {
        throw new Error("Add at least one valid food intake entry.");
      }

      const validDayCount = new Set(normalizedFoodIntake.map((item) => item.day_number)).size;
      if (validDayCount < 2) {
        throw new Error("Adding Day 1 and Day 2 is mandatory. Please add valid food entries for at least 2 days.");
      }

      const data = await postAuth("/submit-health-data", {
        height: Number(form.height),
        weight: Number(form.weight),
        age: Number(form.age),
        gender: form.gender,
        activity_level: form.activity_level,
        sleep_hours: Number(form.sleep_hours),
        hydration_level: litersToHydrationLevel(form.hydration_liters),
        hydration_liters: Number(form.hydration_liters),
        // Backward compatibility for older backend versions that still require diet_type.
        diet_type: "Balanced",
        daily_food_intake: normalizedFoodIntake,
      });
      setMessage("Assessment submitted successfully!");
      setAssessment(data.assessment);
      await loadHistory();
      setActive("results");
    } catch (err) {
      setError(true);
      if (String(err.message || "").trim().toLowerCase() === "missing required fields") {
        const missingFields = getMissingFieldSummary(form);
        setMessage(
          `Please fill required fields: ${missingFields.join(", ") || "Check all inputs"}`
          + `${missingFields.length === 0 ? " (If fields are filled, restart backend to load new diet-tracker API.)" : ""}`,
        );
      } else {
        setMessage(err.message || "Failed to submit health data");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <TopNav dashboardPath="/dashboard" />
      <div className="dashboard-container">
        <div className="sidebar">
          <h3>Welcome, {user?.fullName?.split(" ")[0] || user?.username || ""}</h3>
          <div className="menu">
            <button className={`menu-item ${active === "health-form" ? "active" : ""}`} onClick={() => setActive("health-form")}>
              Enter Health Data
            </button>
            <button className={`menu-item ${active === "results" ? "active" : ""}`} onClick={() => setActive("results")}>
              My Results
            </button>
            <button className={`menu-item ${active === "history" ? "active" : ""}`} onClick={() => setActive("history")}>
              Health History
            </button>
          </div>
        </div>

        <div className="main-content">
          {active === "health-form" ? (
            <div className="section active">
              <h2>Health & Lifestyle Assessment</h2>
              {feedbackNotifications.length > 0 ? (
                <div className="future-impact-display">
                  <h3>Admin Feedback Notifications</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>From</th>
                        <th>Feedback</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackNotifications.slice(0, 5).map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.created_at).toLocaleString()}</td>
                          <td>{item.admin_name || "Admin"}</td>
                          <td>{item.feedback_text}</td>
                          <td>{Number(item.is_read) === 1 ? "Read" : "Unread"}</td>
                          <td>
                            {Number(item.is_read) === 1 ? "-" : (
                              <button className="btn btn-outline" type="button" onClick={() => markFeedbackRead(item.id)}>
                                Mark Read
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <form onSubmit={onSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Height (cm):</label>
                    <input type="number" min="100" max="250" step="0.1" required value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg):</label>
                    <input type="number" min="30" max="200" step="0.1" required value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Physical Activity Level:</label>
                    <select required value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })}>
                      <option value="">Select Activity Level</option>
                      <option value="Sedentary">Sedentary (No exercise)</option>
                      <option value="Light">Light (1-3 days/week)</option>
                      <option value="Moderate">Moderate (3-5 days/week)</option>
                      <option value="High">Active (6-7 days/week)</option>
                      <option value="Very Active">Very Active (Physical job + exercise)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Age (years):</label>
                    <input type="number" min="10" max="100" required value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Gender:</label>
                    <select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <small className="input-helper">
                      Used for BMR-based required calorie calculation.
                    </small>
                  </div>
                  <div className="form-group">
                    <label>BMI Preview:</label>
                    <input
                      type="text"
                      value={liveBmi ? `${liveBmi.toFixed(1)} (${liveBmiCategory})` : ""}
                      placeholder="Auto-calculated from height and weight"
                      readOnly
                    />
                    <small className="input-helper">
                      Updates automatically as you enter height and weight.
                    </small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Average Sleep Hours (per night):</label>
                    <input type="number" min="2" max="12" step="0.5" required value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Water Intake (Liters/Day):</label>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      required
                      value={form.hydration_liters}
                      onChange={(e) => setForm({ ...form, hydration_liters: e.target.value })}
                    />
                    <small className="input-helper">Enter daily water intake in liters (example: 2.5)</small>
                  </div>
                </div>

                <div className="food-intake-block">
                  <h3>Daily Food Intake Tracker</h3>
                  <p className="diet-summary">
                    Add all meals for Day 1 and Day 2 (minimum required). Search and enter foods with quantity.
                  </p>
                  {form.food_days.map((day, dayIdx) => (
                    <div className="food-day-block" key={`food-day-${day.day_number}`}>
                      <div className="food-day-header">
                        <h4>{`Day ${day.day_number}`}</h4>
                        <div className="food-day-actions">
                          <button className="btn btn-secondary" type="button" onClick={() => addFoodEntry(dayIdx)}>
                            + Add Food Item
                          </button>
                          {day.day_number > 2 ? (
                            <button
                              className="btn btn-danger"
                              type="button"
                              onClick={() => removeFoodDay(dayIdx)}
                            >
                              Remove Day
                            </button>
                          ) : (
                            <small className="input-helper">Day 1 and Day 2 are required</small>
                          )}
                        </div>
                      </div>
                      <div className="food-intake-head">
                        <span>Meal</span>
                        <span>Food Item</span>
                        <span>Quantity</span>
                        <span>Unit</span>
                        <span>Action</span>
                      </div>
                      {day.entries.map((item, idx) => {
                        const rowKey = `${dayIdx}-${idx}`;
                        const suggestions = getFoodSuggestions(item.food_item_name);
                        const unitOptions = getServingOptionsForFood(foodOptions, item.food_item_name);
                        return (
                          <div className="food-intake-row" key={`food-entry-${day.day_number}-${idx}`}>
                            <select value={item.meal_type} onChange={(e) => updateFoodEntry(dayIdx, idx, "meal_type", e.target.value)} aria-label={`Meal type for day ${day.day_number} row ${idx + 1}`}>
                              {MEAL_TYPES.map((mealType) => (
                                <option key={mealType} value={mealType}>
                                  {mealType}
                                </option>
                              ))}
                            </select>
                            <div className="food-search-wrap">
                              <input
                                type="search"
                                list={`food-search-list-${rowKey}`}
                                value={item.food_item_name}
                                onFocus={() => setSearchFocusedKey(rowKey)}
                                onBlur={() => setSearchFocusedKey("")}
                                onChange={(e) => {
                                  updateFoodEntry(dayIdx, idx, "food_item_name", e.target.value);
                                  searchFoodCatalog(e.target.value);
                                }}
                                placeholder="Search food (global) and select"
                                aria-label={`Food item for day ${day.day_number} row ${idx + 1}`}
                              />
                              <datalist id={`food-search-list-${rowKey}`}>
                                {suggestions.map((food) => (
                                  <option key={`${rowKey}-${food.name}`} value={food.name}>
                                    {`${food.name} (${food.calories_per_100g} kcal/100g, ${food.default_unit || "grams"})`}
                                  </option>
                                ))}
                              </datalist>
                              {searchFocusedKey === rowKey && foodSearchLoading ? <small>Searching more foods...</small> : null}
                            </div>
                            <input
                              type="number"
                              min="1"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => updateFoodEntry(dayIdx, idx, "quantity", e.target.value)}
                              placeholder="Qty"
                              aria-label={`Food quantity for day ${day.day_number} row ${idx + 1}`}
                            />
                            <select value={item.unit} onChange={(e) => updateFoodEntry(dayIdx, idx, "unit", e.target.value)} aria-label={`Food unit for day ${day.day_number} row ${idx + 1}`}>
                              {unitOptions.map((unitOption) => (
                                <option key={unitOption.unit} value={unitOption.unit}>
                                  {unitOption.label}
                                </option>
                              ))}
                            </select>
                            <button className="btn btn-danger" type="button" onClick={() => removeFoodEntry(dayIdx, idx)} aria-label={`Remove food row ${idx + 1} for day ${day.day_number}`}>
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <button className="btn btn-secondary add-food-btn" type="button" onClick={addFoodDay}>
                    + Add Another Day
                  </button>
                </div>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : "Submit & Get Risk Assessment"}
                </button>
                {message ? <div className={`message ${error ? "error" : "success"}`}>{message}</div> : null}
              </form>
            </div>
          ) : null}

          {active === "results" ? (
            <div className="section active">
              <h2>Your Health Risk Assessment</h2>
              {!assessment ? (
                <div id="noResultMessage" className="message">
                  No assessment results yet. Submit your health data first.
                </div>
              ) : (
                <div className="result-container">
                  <div className="risk-result">
                    <div className={`risk-level ${getRiskClassName(assessment.risk_level)}`}>{assessment.risk_level}</div>
                    <div className="risk-score-chip">
                      Risk Score: {typeof assessment.risk_score === "number" ? assessment.risk_score.toFixed(2) : `${insights.totalRisk.toFixed(2)} (estimated)`}
                    </div>
                  </div>
                  <div className="kpi-grid">
                    <article className="kpi-card">
                      <span>Required Calories</span>
                      <strong>{Number(assessment.required_calories || 0).toFixed(0)} kcal</strong>
                    </article>
                    <article className="kpi-card">
                      <span>Avg Intake / Day</span>
                      <strong>{Number(assessment.avg_calories_per_day || assessment.total_calories || 0).toFixed(0)} kcal</strong>
                    </article>
                    <article className="kpi-card">
                      <span>Calorie Difference</span>
                      <strong>
                        {Number(assessment.calorie_difference || 0) > 0 ? "+" : ""}
                        {Number(assessment.calorie_difference || 0).toFixed(0)} kcal
                      </strong>
                    </article>
                    <article className="kpi-card">
                      <span>Diet Classification</span>
                      <strong>{assessment.detected_diet_pattern || assessment.diet_type}</strong>
                    </article>
                  </div>
                  <div className="risk-visualization">
                    <h3>Risk & Outcome Prediction</h3>
                    <div className="risk-chart-wrap">
                      <div
                        className="risk-pie"
                        style={{
                          background: `conic-gradient(
                            #ef4444 0% ${riskPie.riskWithoutSevere}%,
                            #f97316 ${riskPie.riskWithoutSevere}% ${Math.min(100, riskPie.riskWithoutSevere + riskPie.severeWithinRisk)}%,
                            #22c55e ${Math.min(100, riskPie.riskWithoutSevere + riskPie.severeWithinRisk)}% 100%
                          )`,
                        }}
                        aria-label="Risk and outcome pie chart"
                        onMouseMove={handlePiePointerMove}
                        onMouseLeave={() => setPieHoverInfo(null)}
                        onTouchStart={handlePiePointerMove}
                        onTouchMove={handlePiePointerMove}
                        onTouchEnd={() => setPieHoverInfo(null)}
                      >
                        <div className="risk-pie-center">
                          <div className="risk-pie-value">{insights.totalRisk}%</div>
                          <div className="risk-pie-label">Risk Index</div>
                        </div>
                        {pieHoverInfo ? (
                          <div
                            className="pie-tooltip"
                            style={{
                              left: `${pieHoverInfo.x}px`,
                              top: `${pieHoverInfo.y}px`,
                            }}
                          >
                            <div className="pie-tooltip-title">
                              <span className={`dot ${pieHoverInfo.colorClass}`} />
                              {pieHoverInfo.label}
                            </div>
                            <div className="pie-tooltip-value">{pieHoverInfo.value}%</div>
                            <div className="pie-tooltip-desc">{pieHoverInfo.description}</div>
                          </div>
                        ) : null}
                      </div>
                      <div className="risk-legend">
                        <div><span className="dot dot-risk" /> Overall Risk: {insights.totalRisk}%</div>
                        <div><span className="dot dot-severe" /> Severe Outcome Indicator: {insights.severeOutcomeRisk}%</div>
                        <div><span className="dot dot-healthy" /> Healthy Share: {insights.healthyShare}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="metrics-display">
                    <h3>Detailed Assessment Table</h3>
                    <table className="metrics-table detailed-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>User Data</th>
                          <th>Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>BMI</td>
                          <td>{Number(assessment.bmi).toFixed(2)}</td>
                          <td>{insights.bmiCategory}</td>
                        </tr>
                        <tr>
                          <td>Sleep Hours</td>
                          <td>{assessment.sleep_hours}</td>
                          <td>{Number(assessment.sleep_hours) < 7 ? "Below ideal range" : "Within preferred range"}</td>
                        </tr>
                        <tr>
                          <td>Water Intake</td>
                          <td>{Number(assessment.hydration_liters || hydrationLevelToLiters(assessment.hydration_level)).toFixed(1)} L/day</td>
                          <td>{Number(assessment.hydration_level) < 6 ? "Low hydration risk" : "Adequate hydration"}</td>
                        </tr>
                        <tr>
                          <td>Activity</td>
                          <td>{assessment.activity_level}</td>
                          <td>{assessment.activity_level === "Sedentary" ? "Low movement pattern" : "Active movement pattern"}</td>
                        </tr>
                        <tr>
                          <td>Diet Classification</td>
                          <td>
                            <span className={getDietBadgeClass(assessment.detected_diet_pattern || assessment.diet_type)}>
                              {assessment.detected_diet_pattern || assessment.diet_type}
                            </span>
                          </td>
                          <td>{getDietInterpretation(assessment.detected_diet_pattern || assessment.diet_type)}</td>
                        </tr>
                        <tr>
                          <td>Required Calories</td>
                          <td>{Number(assessment.required_calories || 0).toFixed(0)} kcal/day</td>
                          <td>Estimated using BMR + activity factor</td>
                        </tr>
                        <tr>
                          <td>Actual Intake</td>
                          <td>{Number(assessment.avg_calories_per_day || assessment.total_calories || 0).toFixed(0)} kcal/day</td>
                          <td>Average intake calculated across all entered days</td>
                        </tr>
                        <tr>
                          <td>Calorie Difference</td>
                          <td>
                            <span className={getCalorieDeltaBadgeClass(assessment.calorie_difference)}>
                              {Number(assessment.calorie_difference || 0) > 0 ? "+" : ""}
                              {Number(assessment.calorie_difference || 0).toFixed(0)} kcal/day
                            </span>
                          </td>
                          <td>Positive means excess intake, negative means deficit</td>
                        </tr>
                        <tr>
                          <td>Health Risk Impact</td>
                          <td>{getDietInterpretation(assessment.detected_diet_pattern || assessment.diet_type)}</td>
                          <td>Diet pattern contribution to current risk score</td>
                        </tr>
                        <tr>
                          <td>Final Risk Level</td>
                          <td><span className={getRiskBadgeClass(assessment.risk_level)}>{assessment.risk_level}</span></td>
                          <td>Model prediction</td>
                        </tr>
                        <tr>
                          <td>Risk Score</td>
                          <td>
                            {typeof assessment.risk_score === "number" ? assessment.risk_score.toFixed(2) : insights.totalRisk.toFixed(2)}
                          </td>
                          <td>Numerical model score (0-100)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="future-impact-display">
                    <h3>If You Continue Current Diet & Lifestyle</h3>
                    <p className="future-impact-summary">
                      This projection shows likely drawbacks over time if current habits remain unchanged.
                    </p>

                    <div className="future-projection-grid">
                      <div className="future-projection-card">
                        <span>Current Risk Index</span>
                        <strong>{insights.totalRisk}%</strong>
                      </div>
                      <div className="future-projection-card warning">
                        <span>Projected Risk (6 months)</span>
                        <strong>{futureOutlook.projected6Month}%</strong>
                      </div>
                      <div className="future-projection-card danger">
                        <span>Projected Risk (12 months)</span>
                        <strong>{futureOutlook.projected12Month}%</strong>
                      </div>
                    </div>

                    <div className="future-timeline">
                      {futureOutlook.timeline.map((item, idx) => (
                        <div className="future-timeline-item" key={`timeline-${idx}`}>
                          <h4>{item.period}</h4>
                          <p>{item.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className="drawback-bars">
                      <h4>Potential Drawbacks (Future)</h4>
                      {futureOutlook.drawbackSignals.map((item, idx) => (
                        <div className="drawback-row" key={`drawback-${idx}`}>
                          <div className="drawback-head">
                            <span>{item.label}</span>
                            <span>{item.score}%</span>
                          </div>
                          <div className="drawback-track">
                            <div className="drawback-fill" style={{ width: `${item.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="diet-plan-display">
                    <h3>Recommended Diet Plan</h3>
                    <p className="diet-summary">
                      Designed from your current inputs: BMI {Number(assessment.bmi).toFixed(2)}, {assessment.activity_level} activity,
                      {` ${assessment.sleep_hours}`} hours sleep, water intake {Number(assessment.hydration_liters || hydrationLevelToLiters(assessment.hydration_level)).toFixed(1)} L/day, and detected pattern {assessment.detected_diet_pattern || assessment.diet_type}.
                      {` `}({getDietTypeInfo(assessment.detected_diet_pattern || assessment.diet_type).description})
                    </p>
                    <div className="diet-grid">
                      <div className="diet-card">
                        <h4>Focus Areas</h4>
                        <ul>
                          {dietPlan.focus.map((item, idx) => (
                            <li key={`focus-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="diet-card">
                        <h4>Limit / Avoid</h4>
                        <ul>
                          {dietPlan.avoid.map((item, idx) => (
                            <li key={`avoid-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <table className="metrics-table meal-plan-table">
                      <thead>
                        <tr>
                          <th>Meal Time</th>
                          <th>Suggested Plan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dietPlan.mealPlan.map((item, idx) => (
                          <tr key={`meal-${idx}`}>
                            <td>{item.meal}</td>
                            <td>{item.plan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {active === "history" ? (
            <div className="section active">
              <h2>Health Assessment History</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Risk Level</th>
                    <th>BMI</th>
                    <th>Diet Class</th>
                    <th>Calories (Act/Req)</th>
                    <th>Sleep Hours</th>
                    <th>Water Intake</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No history available yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((entry, idx) => (
                      <tr key={`${entry.date}-${idx}`}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td><span className={getRiskBadgeClass(entry.risk_level)}>{entry.risk_level}</span></td>
                        <td>{Number(entry.bmi).toFixed(2)}</td>
                        <td><span className={getDietBadgeClass(entry.detected_diet_pattern || entry.diet_type)}>{entry.detected_diet_pattern || entry.diet_type}</span></td>
                        <td>
                          {Number(entry.total_calories || 0).toFixed(0)}/{Number(entry.required_calories || 0).toFixed(0)}
                        </td>
                        <td>{entry.sleep_hours}</td>
                        <td>{Number(entry.hydration_liters || hydrationLevelToLiters(entry.hydration_level)).toFixed(1)} L/day</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
      <footer>
        <p>&copy; 2026 Student Health Risk Prediction System. All rights reserved.</p>
      </footer>
    </div>
  );
}
