// ==================== CALORIE ASSESSMENT ====================
// Calculates daily calorie intake from food entries and classifies diet pattern.

const FOOD_NUTRITION_DATA = {
    oats: { label: 'Oats', calories_per_100g: 389, protein_g: 16.9, fat_g: 6.9, sugar_g: 0.9, grams_per_unit: 40 },
    rice: { label: 'Cooked Rice', calories_per_100g: 130, protein_g: 2.7, fat_g: 0.3, sugar_g: 0.1, grams_per_unit: 150 },
    roti: { label: 'Roti', calories_per_100g: 297, protein_g: 9.6, fat_g: 7.5, sugar_g: 1.2, grams_per_unit: 35 },
    dal: { label: 'Dal', calories_per_100g: 116, protein_g: 9.0, fat_g: 0.4, sugar_g: 1.8, grams_per_unit: 150 },
    paneer: { label: 'Paneer', calories_per_100g: 265, protein_g: 18.3, fat_g: 20.8, sugar_g: 1.2, grams_per_unit: 80 },
    tofu: { label: 'Tofu', calories_per_100g: 144, protein_g: 15.7, fat_g: 8.0, sugar_g: 0.6, grams_per_unit: 80 },
    egg: { label: 'Egg', calories_per_100g: 155, protein_g: 13.0, fat_g: 11.0, sugar_g: 1.1, grams_per_unit: 50 },
    chicken: { label: 'Chicken Breast', calories_per_100g: 165, protein_g: 31.0, fat_g: 3.6, sugar_g: 0.0, grams_per_unit: 120 },
    fish: { label: 'Fish', calories_per_100g: 206, protein_g: 22.0, fat_g: 12.0, sugar_g: 0.0, grams_per_unit: 120 },
    mixed_vegetables: { label: 'Mixed Vegetables', calories_per_100g: 65, protein_g: 2.2, fat_g: 0.5, sugar_g: 3.3, grams_per_unit: 100 },
    salad: { label: 'Salad', calories_per_100g: 35, protein_g: 1.7, fat_g: 0.2, sugar_g: 2.7, grams_per_unit: 80 },
    milk: { label: 'Milk', calories_per_100g: 61, protein_g: 3.2, fat_g: 3.3, sugar_g: 5.0, grams_per_unit: 240 },
    curd: { label: 'Curd', calories_per_100g: 98, protein_g: 11.0, fat_g: 4.3, sugar_g: 4.7, grams_per_unit: 100 },
    banana: { label: 'Banana', calories_per_100g: 89, protein_g: 1.1, fat_g: 0.3, sugar_g: 12.2, grams_per_unit: 118 },
    apple: { label: 'Apple', calories_per_100g: 52, protein_g: 0.3, fat_g: 0.2, sugar_g: 10.4, grams_per_unit: 182 },
    nuts: { label: 'Mixed Nuts', calories_per_100g: 607, protein_g: 20.0, fat_g: 54.0, sugar_g: 4.2, grams_per_unit: 30 },
    chips: { label: 'Chips', calories_per_100g: 536, protein_g: 7.0, fat_g: 35.0, sugar_g: 0.3, grams_per_unit: 30 },
    sweets: { label: 'Sweets', calories_per_100g: 400, protein_g: 4.0, fat_g: 12.0, sugar_g: 52.0, grams_per_unit: 30 },
    soft_drink: { label: 'Soft Drink', calories_per_100g: 41, protein_g: 0.0, fat_g: 0.0, sugar_g: 10.6, grams_per_unit: 330 },
    burger: { label: 'Burger', calories_per_100g: 295, protein_g: 12.0, fat_g: 14.0, sugar_g: 5.5, grams_per_unit: 180 },
    pizza: { label: 'Pizza', calories_per_100g: 266, protein_g: 11.0, fat_g: 10.0, sugar_g: 3.8, grams_per_unit: 120 },
    fries: { label: 'Fries', calories_per_100g: 312, protein_g: 3.4, fat_g: 15.0, sugar_g: 0.3, grams_per_unit: 117 },
    biscuits: { label: 'Biscuits', calories_per_100g: 502, protein_g: 6.0, fat_g: 24.0, sugar_g: 24.0, grams_per_unit: 15 }
};

const ACTIVITY_FACTORS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    high: 1.725,
    very_active: 1.9
};

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

function normalizeKey(value) {
    return String(value || '').toLowerCase().trim().replace(/\s+/g, '_');
}

function normalizeGender(gender) {
    const value = String(gender || '').toLowerCase().trim();
    if (value === 'male' || value === 'm') return 'male';
    if (value === 'female' || value === 'f') return 'female';
    return 'male';
}

function normalizeMealType(mealType) {
    const value = String(mealType || '').toLowerCase().trim();
    if (value === 'breakfast') return 'Breakfast';
    if (value === 'lunch') return 'Lunch';
    if (value === 'dinner') return 'Dinner';
    return 'Snacks';
}

function resolveDayNumber(rawValue) {
    const numeric = Number(rawValue);
    if (Number.isFinite(numeric) && numeric >= 1) {
        return Math.max(1, Math.floor(numeric));
    }

    const fromLabel = String(rawValue || '').match(/\d+/);
    if (fromLabel) {
        return Math.max(1, Number(fromLabel[0]));
    }

    return 1;
}

function getFoodNutrition(foodItemName) {
    const key = normalizeKey(foodItemName);
    if (FOOD_NUTRITION_DATA[key]) return FOOD_NUTRITION_DATA[key];
    const normalizedLabel = key;
    const matchedByLabel = Object.values(FOOD_NUTRITION_DATA).find(
        (item) => normalizeKey(item.label) === normalizedLabel
    );
    return matchedByLabel || null;
}

function calculateBmr({ weight, height, age, gender }) {
    const normalizedGender = normalizeGender(gender);
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return normalizedGender === 'female' ? base - 161 : base + 5;
}

function calculateRequiredCalories({ weight, height, age, gender, activityLevel }) {
    const bmr = calculateBmr({ weight, height, age, gender });
    const factor = ACTIVITY_FACTORS[normalizeKey(activityLevel)] || 1.55;
    return {
        bmr,
        activity_factor: factor,
        required_calories: bmr * factor
    };
}

function createDaySummary() {
    return {
        total_calories: 0,
        sugar_grams: 0,
        fat_grams: 0,
        protein_grams: 0,
        meal_presence: {
            Breakfast: false,
            Lunch: false,
            Dinner: false,
            Snacks: false
        },
        entries: []
    };
}

function calculateDailyFoodIntake(dailyFoodIntake) {
    const items = Array.isArray(dailyFoodIntake) ? dailyFoodIntake : [];
    const daySummaries = new Map();
    const normalizedEntries = [];

    for (const entry of items) {
        const foodItemName = String(entry?.food_item_name || '').trim();
        const quantity = Number(entry?.quantity || 0);
        const unit = String(entry?.unit || 'grams').toLowerCase().trim();
        const mealType = normalizeMealType(entry?.meal_type);
        const dayNumber = resolveDayNumber(entry?.day_number ?? entry?.day ?? entry?.day_label);

        if (!foodItemName || !Number.isFinite(quantity) || quantity <= 0) continue;

        const nutrition = getFoodNutrition(foodItemName);
        if (!nutrition) continue;

        if (!daySummaries.has(dayNumber)) {
            daySummaries.set(dayNumber, createDaySummary());
        }
        const daySummary = daySummaries.get(dayNumber);

        const gramsPerUnit = nutrition.grams_per_unit || 100;
        const quantityInGrams = unit === 'units' ? quantity * gramsPerUnit : quantity;
        const multiplier = quantityInGrams / 100;

        const calories = multiplier * nutrition.calories_per_100g;
        const sugar = multiplier * nutrition.sugar_g;
        const fat = multiplier * nutrition.fat_g;
        const protein = multiplier * nutrition.protein_g;

        daySummary.total_calories += calories;
        daySummary.sugar_grams += sugar;
        daySummary.fat_grams += fat;
        daySummary.protein_grams += protein;
        daySummary.meal_presence[mealType] = true;

        const normalizedEntry = {
            day_number: dayNumber,
            day_label: `Day ${dayNumber}`,
            meal_type: mealType,
            food_item_name: nutrition.label,
            quantity,
            unit: unit === 'units' ? 'units' : 'grams',
            quantity_grams: parseFloat(quantityInGrams.toFixed(2)),
            calories: parseFloat(calories.toFixed(2))
        };

        daySummary.entries.push(normalizedEntry);
        normalizedEntries.push(normalizedEntry);
    }

    const sortedDayNumbers = Array.from(daySummaries.keys()).sort((a, b) => a - b);
    const trackedDays = sortedDayNumbers.length;

    let totalCaloriesAllDays = 0;
    let totalSugarAllDays = 0;
    let totalFatAllDays = 0;
    let totalProteinAllDays = 0;

    for (const dayNumber of sortedDayNumbers) {
        const daySummary = daySummaries.get(dayNumber);
        totalCaloriesAllDays += daySummary.total_calories;
        totalSugarAllDays += daySummary.sugar_grams;
        totalFatAllDays += daySummary.fat_grams;
        totalProteinAllDays += daySummary.protein_grams;
    }

    const divisor = trackedDays > 0 ? trackedDays : 1;

    const averageMealPresence = {
        Breakfast: trackedDays > 0 ? sortedDayNumbers.every((dayNumber) => daySummaries.get(dayNumber).meal_presence.Breakfast) : false,
        Lunch: trackedDays > 0 ? sortedDayNumbers.every((dayNumber) => daySummaries.get(dayNumber).meal_presence.Lunch) : false,
        Dinner: trackedDays > 0 ? sortedDayNumbers.every((dayNumber) => daySummaries.get(dayNumber).meal_presence.Dinner) : false,
        Snacks: trackedDays > 0 ? sortedDayNumbers.every((dayNumber) => daySummaries.get(dayNumber).meal_presence.Snacks) : false
    };

    return {
        entries: normalizedEntries,
        day_summaries: sortedDayNumbers.map((dayNumber) => {
            const summary = daySummaries.get(dayNumber);
            return {
                day_number: dayNumber,
                day_label: `Day ${dayNumber}`,
                total_calories: parseFloat(summary.total_calories.toFixed(2)),
                sugar_grams: parseFloat(summary.sugar_grams.toFixed(2)),
                fat_grams: parseFloat(summary.fat_grams.toFixed(2)),
                protein_grams: parseFloat(summary.protein_grams.toFixed(2)),
                meal_presence: summary.meal_presence,
                entries: summary.entries
            };
        }),
        tracked_days: trackedDays,
        total_calories_all_days: parseFloat(totalCaloriesAllDays.toFixed(2)),
        total_calories: parseFloat((totalCaloriesAllDays / divisor).toFixed(2)),
        avg_calories_per_day: parseFloat((totalCaloriesAllDays / divisor).toFixed(2)),
        sugar_grams: parseFloat((totalSugarAllDays / divisor).toFixed(2)),
        fat_grams: parseFloat((totalFatAllDays / divisor).toFixed(2)),
        protein_grams: parseFloat((totalProteinAllDays / divisor).toFixed(2)),
        meal_presence: averageMealPresence
    };
}

function classifyDietPattern({ totalCalories, requiredCalories, sugarGrams, fatGrams, proteinGrams, weightKg, mealPresence }) {
    const calorieDifference = totalCalories - requiredCalories;
    const deviation = requiredCalories > 0 ? calorieDifference / requiredCalories : 0;

    const sugarThreshold = 50; // grams/day
    const fatThreshold = 75; // grams/day
    const proteinThreshold = Math.max(45, 0.8 * weightKg); // grams/day
    const skippedMeals = ['Breakfast', 'Lunch', 'Dinner'].filter((meal) => !mealPresence[meal]);

    const detectedPatterns = [];
    if (skippedMeals.length > 0) detectedPatterns.push('Irregular Meals');
    if (proteinGrams < proteinThreshold) detectedPatterns.push('Low Protein');
    if (sugarGrams > sugarThreshold) detectedPatterns.push('High Sugar');
    if (fatGrams > fatThreshold) detectedPatterns.push('High Fat');
    if (deviation > 0.2) detectedPatterns.push('High Calorie Diet');
    if (deviation < -0.2) detectedPatterns.push('Low Calorie Diet');
    if (detectedPatterns.length === 0 && Math.abs(deviation) <= 0.1) detectedPatterns.push('Balanced');
    if (detectedPatterns.length === 0) detectedPatterns.push('Slightly Imbalanced');

    return {
        detected_diet_pattern: detectedPatterns[0],
        detected_patterns: detectedPatterns,
        calorie_difference: parseFloat(calorieDifference.toFixed(2)),
        calorie_deviation_percent: parseFloat((deviation * 100).toFixed(2)),
        skipped_meals: skippedMeals
    };
}

function assessDietPattern(payload) {
    const { height, weight, age, gender, activity_level, daily_food_intake } = payload;

    const required = calculateRequiredCalories({
        weight: Number(weight),
        height: Number(height),
        age: Number(age),
        gender,
        activityLevel: activity_level
    });

    const intake = calculateDailyFoodIntake(daily_food_intake);
    const classification = classifyDietPattern({
        totalCalories: intake.avg_calories_per_day,
        requiredCalories: required.required_calories,
        sugarGrams: intake.sugar_grams,
        fatGrams: intake.fat_grams,
        proteinGrams: intake.protein_grams,
        weightKg: Number(weight),
        mealPresence: intake.meal_presence
    });

    return {
        tracked_days: intake.tracked_days,
        total_calories_all_days: intake.total_calories_all_days,
        total_calories: intake.avg_calories_per_day,
        avg_calories_per_day: intake.avg_calories_per_day,
        required_calories: parseFloat(required.required_calories.toFixed(2)),
        bmr: parseFloat(required.bmr.toFixed(2)),
        activity_factor: required.activity_factor,
        calorie_difference: classification.calorie_difference,
        calorie_deviation_percent: classification.calorie_deviation_percent,
        detected_diet_pattern: classification.detected_diet_pattern,
        detected_patterns: classification.detected_patterns,
        skipped_meals: classification.skipped_meals,
        sugar_grams: intake.sugar_grams,
        fat_grams: intake.fat_grams,
        protein_grams: intake.protein_grams,
        day_summaries: intake.day_summaries,
        intake_entries: intake.entries
    };
}

function getFoodNutritionOptions() {
    return Object.values(FOOD_NUTRITION_DATA).map((food) => ({
        name: food.label,
        calories_per_100g: food.calories_per_100g,
        default_unit: 'grams',
        grams_per_unit: food.grams_per_unit
    }));
}

module.exports = {
    MEAL_TYPES,
    getFoodNutritionOptions,
    assessDietPattern
};
