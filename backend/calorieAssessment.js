// ==================== CALORIE ASSESSMENT ====================
// Calculates daily calorie intake from food entries and classifies diet pattern.

function createServing(unit, label, gramsPerUnit) {
    return {
        unit,
        label,
        grams_per_unit: gramsPerUnit
    };
}

const COMMON_MEASUREMENT_OPTIONS = [
    createServing('grams', 'Grams', 1),
    createServing('kg', 'Kilograms (kg)', 1000),
    createServing('ml', 'Milliliters (ml)', 1),
    createServing('liters', 'Liters (L)', 1000),
    createServing('teaspoon', '1 teaspoon', 5),
    createServing('tablespoon', '1 tablespoon', 15),
    createServing('cup', '1 cup', 240),
    createServing('glass', '1 glass', 240),
    createServing('bowl', '1 bowl', 150),
    createServing('plate', '1 plate', 250),
    createServing('piece', '1 piece', 50),
    createServing('slice', '1 slice', 100),
    createServing('handful', '1 handful', 30),
    createServing('packet', '1 packet', 50),
    createServing('can', '1 can', 330),
    createServing('bottle', '1 bottle', 500),
    createServing('small', 'Small serving', 100),
    createServing('medium', 'Medium serving', 180),
    createServing('regular', 'Regular serving', 180),
    createServing('large', 'Large serving', 260),
    createServing('serving', '1 serving', 100)
];

function createFoodNutritionEntry(label, caloriesPer100g, proteinG, fatG, sugarG, gramsPerUnit, defaultUnit, servingOptions, aliases = []) {
    return {
        label,
        calories_per_100g: caloriesPer100g,
        protein_g: proteinG,
        fat_g: fatG,
        sugar_g: sugarG,
        grams_per_unit: gramsPerUnit,
        default_unit: defaultUnit,
        serving_options: servingOptions,
        aliases
    };
}

const FOOD_NUTRITION_DATA = {
    oats: createFoodNutritionEntry('Oats', 389, 16.9, 6.9, 0.9, 40, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 40), createServing('cup', '1 cup', 80)]),
    rice: createFoodNutritionEntry('Cooked Rice', 130, 2.7, 0.3, 0.1, 150, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 150), createServing('cup', '1 cup', 180)], ['rice']),
    brown_rice: createFoodNutritionEntry('Brown Rice', 111, 2.6, 0.9, 0.4, 150, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 150), createServing('cup', '1 cup', 195)]),
    quinoa: createFoodNutritionEntry('Quinoa', 120, 4.4, 1.9, 0.9, 150, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 150), createServing('cup', '1 cup', 185)]),
    poha: createFoodNutritionEntry('Poha', 130, 2.6, 3.2, 1.8, 150, 'plate', [createServing('grams', 'Grams', 1), createServing('plate', '1 plate', 150), createServing('bowl', '1 bowl', 120)]),
    upma: createFoodNutritionEntry('Upma', 156, 4.0, 5.5, 2.3, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180), createServing('plate', '1 plate', 220)]),
    idli: createFoodNutritionEntry('Idli', 146, 4.5, 0.7, 1.0, 50, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 idli', 50)], ['idlis']),
    medu_vada: createFoodNutritionEntry('Medu Vada', 286, 6.0, 18.0, 1.6, 55, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 medu vada', 55)], ['vada', 'ulundu vadai']),
    dosa: createFoodNutritionEntry('Dosa', 184, 4.4, 6.0, 1.2, 100, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 dosa', 100)]),
    masala_dosa: createFoodNutritionEntry('Masala Dosa', 230, 5.5, 8.5, 2.3, 150, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 masala dosa', 150)]),
    rava_dosa: createFoodNutritionEntry('Rava Dosa', 190, 4.0, 6.5, 1.8, 110, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 rava dosa', 110)]),
    set_dosa: createFoodNutritionEntry('Set Dosa', 175, 4.2, 4.8, 1.7, 90, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 set dosa', 90)]),
    pesarattu: createFoodNutritionEntry('Pesarattu', 170, 7.8, 3.2, 1.5, 110, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 pesarattu', 110)]),
    uttapam: createFoodNutritionEntry('Uttapam', 180, 4.8, 4.7, 2.4, 120, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 uttapam', 120)]),
    appam: createFoodNutritionEntry('Appam', 150, 2.8, 2.4, 1.8, 90, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 appam', 90)]),
    puttu: createFoodNutritionEntry('Puttu', 165, 3.2, 2.4, 1.5, 140, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 puttu roll', 140)]),
    pongal: createFoodNutritionEntry('Ven Pongal', 170, 4.7, 5.9, 1.4, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180)], ['pongal']),
    curd_rice: createFoodNutritionEntry('Curd Rice', 130, 3.4, 3.0, 2.7, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180)]),
    lemon_rice: createFoodNutritionEntry('Lemon Rice', 181, 3.0, 5.8, 1.1, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180)]),
    tamarind_rice: createFoodNutritionEntry('Tamarind Rice', 190, 3.3, 6.0, 2.0, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180)], ['puliyodarai']),
    coconut_rice: createFoodNutritionEntry('Coconut Rice', 198, 3.2, 7.4, 1.6, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180)]),
    paratha: createFoodNutritionEntry('Paratha', 300, 7.0, 12.0, 2.0, 80, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 paratha', 80)]),
    roti: createFoodNutritionEntry('Roti', 297, 9.6, 7.5, 1.2, 35, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 piece', 35)], ['chapati', 'chappati']),
    chapati: createFoodNutritionEntry('Chapati', 297, 9.6, 7.5, 1.2, 35, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 piece', 35)], ['roti', 'chappati']),
    naan: createFoodNutritionEntry('Naan', 310, 9.0, 7.5, 3.0, 90, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 naan', 90)]),
    bread: createFoodNutritionEntry('Bread', 265, 9.0, 3.2, 5.0, 30, 'slice', [createServing('grams', 'Grams', 1), createServing('slice', '1 slice', 30)]),
    whole_wheat_bread: createFoodNutritionEntry('Whole Wheat Bread', 247, 13.0, 4.2, 5.0, 30, 'slice', [createServing('grams', 'Grams', 1), createServing('slice', '1 slice', 30)]),
    pasta: createFoodNutritionEntry('Pasta', 131, 5.0, 1.1, 0.8, 140, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 140), createServing('cup', '1 cup', 140)]),
    noodles: createFoodNutritionEntry('Noodles', 138, 4.5, 2.1, 0.8, 150, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 150)]),
    cornflakes: createFoodNutritionEntry('Cornflakes', 357, 7.5, 0.4, 8.0, 30, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 30), createServing('cup', '1 cup', 28)]),
    muesli: createFoodNutritionEntry('Muesli', 360, 10.0, 5.5, 16.0, 45, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 45)]),
    dal: createFoodNutritionEntry('Dal', 116, 9.0, 0.4, 1.8, 150, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 150), createServing('cup', '1 cup', 200)], ['lentils']),
    rajma: createFoodNutritionEntry('Rajma', 127, 8.7, 0.5, 0.3, 150, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 150)], ['kidney beans']),
    chole: createFoodNutritionEntry('Chole', 164, 8.9, 2.6, 4.8, 150, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 150)], ['chickpeas', 'chana masala']),
    sambar: createFoodNutritionEntry('Sambar', 65, 2.6, 2.0, 2.5, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180), createServing('cup', '1 cup', 200)]),
    rasam: createFoodNutritionEntry('Rasam', 28, 0.9, 0.8, 1.8, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180), createServing('cup', '1 cup', 200)]),
    coconut_chutney: createFoodNutritionEntry('Coconut Chutney', 220, 2.6, 21.0, 3.4, 30, 'tablespoon', [createServing('grams', 'Grams', 1), createServing('tablespoon', '1 tablespoon', 30)], ['chutney']),
    tomato_chutney: createFoodNutritionEntry('Tomato Chutney', 85, 1.4, 5.0, 4.0, 30, 'tablespoon', [createServing('grams', 'Grams', 1), createServing('tablespoon', '1 tablespoon', 30)]),
    peanut_chutney: createFoodNutritionEntry('Peanut Chutney', 180, 6.5, 14.0, 2.3, 30, 'tablespoon', [createServing('grams', 'Grams', 1), createServing('tablespoon', '1 tablespoon', 30)]),
    khichdi: createFoodNutritionEntry('Khichdi', 140, 4.5, 3.0, 1.2, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180)]),
    paneer: createFoodNutritionEntry('Paneer', 265, 18.3, 20.8, 1.2, 80, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 piece', 80), createServing('small', 'Small serving', 60), createServing('large', 'Large serving', 120)]),
    tofu: createFoodNutritionEntry('Tofu', 144, 15.7, 8.0, 0.6, 80, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 piece', 80), createServing('small', 'Small serving', 60), createServing('large', 'Large serving', 120)]),
    soy_chunks: createFoodNutritionEntry('Soy Chunks', 345, 52.0, 0.5, 8.0, 60, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 60)]),
    egg: createFoodNutritionEntry('Egg', 155, 13.0, 11.0, 1.1, 50, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 egg', 50)]),
    omelette: createFoodNutritionEntry('Omelette', 154, 10.0, 12.0, 1.3, 90, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 omelette', 90)]),
    chicken: createFoodNutritionEntry('Chicken Breast', 165, 31.0, 3.6, 0.0, 120, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 piece', 120), createServing('small', 'Small serving', 90), createServing('large', 'Large serving', 180)], ['chicken']),
    chicken_curry: createFoodNutritionEntry('Chicken Curry', 190, 18.0, 11.0, 2.0, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180)]),
    mutton_curry: createFoodNutritionEntry('Mutton Curry', 250, 17.0, 18.0, 1.5, 180, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 180)]),
    fish: createFoodNutritionEntry('Fish', 206, 22.0, 12.0, 0.0, 120, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 piece', 120), createServing('small', 'Small serving', 90), createServing('large', 'Large serving', 180)]),
    salmon: createFoodNutritionEntry('Salmon', 208, 20.0, 13.0, 0.0, 120, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 fillet', 120)]),
    tuna: createFoodNutritionEntry('Tuna', 132, 28.0, 1.3, 0.0, 120, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 fillet', 120)]),
    prawns: createFoodNutritionEntry('Prawns', 99, 24.0, 0.3, 0.2, 100, 'serving', [createServing('grams', 'Grams', 1), createServing('serving', '1 serving', 100)], ['shrimp']),
    mixed_vegetables: createFoodNutritionEntry('Mixed Vegetables', 65, 2.2, 0.5, 3.3, 100, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 100), createServing('cup', '1 cup', 120)]),
    salad: createFoodNutritionEntry('Salad', 35, 1.7, 0.2, 2.7, 80, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 80), createServing('cup', '1 cup', 100)]),
    broccoli: createFoodNutritionEntry('Broccoli', 34, 2.8, 0.4, 1.7, 90, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 90)]),
    spinach: createFoodNutritionEntry('Spinach', 23, 2.9, 0.4, 0.4, 60, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 60)]),
    cauliflower: createFoodNutritionEntry('Cauliflower', 25, 1.9, 0.3, 1.9, 100, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 100)]),
    potato: createFoodNutritionEntry('Potato', 77, 2.0, 0.1, 0.8, 150, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 potato', 150)]),
    sweet_potato: createFoodNutritionEntry('Sweet Potato', 86, 1.6, 0.1, 4.2, 130, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 sweet potato', 130)]),
    tomato: createFoodNutritionEntry('Tomato', 18, 0.9, 0.2, 2.6, 100, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 tomato', 100)]),
    cucumber: createFoodNutritionEntry('Cucumber', 15, 0.7, 0.1, 1.7, 100, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 cucumber', 100)]),
    carrot: createFoodNutritionEntry('Carrot', 41, 0.9, 0.2, 4.7, 60, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 carrot', 60)]),
    peas: createFoodNutritionEntry('Green Peas', 81, 5.4, 0.4, 5.7, 80, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 80)]),
    corn: createFoodNutritionEntry('Corn', 86, 3.3, 1.4, 6.3, 100, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 100)]),
    milk: createFoodNutritionEntry('Milk', 61, 3.2, 3.3, 5.0, 240, 'ml', [createServing('ml', 'Milliliters (ml)', 1), createServing('liters', 'Liters (L)', 1000), createServing('glass', '1 glass', 240), createServing('cup', '1 cup', 240)]),
    curd: createFoodNutritionEntry('Curd', 98, 11.0, 4.3, 4.7, 100, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 100), createServing('cup', '1 cup', 150)], ['yogurt', 'yoghurt']),
    greek_yogurt: createFoodNutritionEntry('Greek Yogurt', 59, 10.0, 0.4, 3.6, 100, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 170)]),
    cheese: createFoodNutritionEntry('Cheese', 402, 25.0, 33.0, 1.3, 28, 'slice', [createServing('grams', 'Grams', 1), createServing('slice', '1 slice', 28)]),
    butter: createFoodNutritionEntry('Butter', 717, 0.9, 81.0, 0.1, 14, 'tablespoon', [createServing('grams', 'Grams', 1), createServing('tablespoon', '1 tablespoon', 14)]),
    banana: createFoodNutritionEntry('Banana', 89, 1.1, 0.3, 12.2, 118, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 banana', 118), createServing('small', 'Small banana', 90), createServing('large', 'Large banana', 135)]),
    apple: createFoodNutritionEntry('Apple', 52, 0.3, 0.2, 10.4, 182, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 apple', 182), createServing('small', 'Small apple', 150), createServing('large', 'Large apple', 220)]),
    orange: createFoodNutritionEntry('Orange', 47, 0.9, 0.1, 9.4, 130, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 orange', 130)]),
    mango: createFoodNutritionEntry('Mango', 60, 0.8, 0.4, 13.7, 165, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 mango', 165)]),
    grapes: createFoodNutritionEntry('Grapes', 69, 0.7, 0.2, 15.5, 92, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 92)]),
    watermelon: createFoodNutritionEntry('Watermelon', 30, 0.6, 0.2, 6.2, 150, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 150)]),
    papaya: createFoodNutritionEntry('Papaya', 43, 0.5, 0.3, 7.8, 140, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 140)]),
    pineapple: createFoodNutritionEntry('Pineapple', 50, 0.5, 0.1, 9.9, 140, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 140)]),
    strawberries: createFoodNutritionEntry('Strawberries', 32, 0.7, 0.3, 4.9, 100, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 100)]),
    avocado: createFoodNutritionEntry('Avocado', 160, 2.0, 14.7, 0.7, 100, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 avocado', 100)]),
    nuts: createFoodNutritionEntry('Mixed Nuts', 607, 20.0, 54.0, 4.2, 30, 'handful', [createServing('grams', 'Grams', 1), createServing('handful', '1 handful', 30), createServing('small', 'Small serving', 20), createServing('large', 'Large serving', 45)]),
    almonds: createFoodNutritionEntry('Almonds', 579, 21.0, 50.0, 4.4, 28, 'handful', [createServing('grams', 'Grams', 1), createServing('handful', '1 handful', 28)]),
    peanuts: createFoodNutritionEntry('Peanuts', 567, 26.0, 49.0, 4.7, 28, 'handful', [createServing('grams', 'Grams', 1), createServing('handful', '1 handful', 28)]),
    walnuts: createFoodNutritionEntry('Walnuts', 654, 15.0, 65.0, 2.6, 28, 'handful', [createServing('grams', 'Grams', 1), createServing('handful', '1 handful', 28)]),
    cashews: createFoodNutritionEntry('Cashews', 553, 18.0, 44.0, 5.9, 28, 'handful', [createServing('grams', 'Grams', 1), createServing('handful', '1 handful', 28)]),
    seeds: createFoodNutritionEntry('Mixed Seeds', 560, 21.0, 45.0, 1.5, 20, 'tablespoon', [createServing('grams', 'Grams', 1), createServing('tablespoon', '1 tablespoon', 20)]),
    chips: createFoodNutritionEntry('Chips', 536, 7.0, 35.0, 0.3, 30, 'packet', [createServing('grams', 'Grams', 1), createServing('packet', '1 packet', 30), createServing('small', 'Small packet', 20), createServing('large', 'Large packet', 50)]),
    popcorn: createFoodNutritionEntry('Popcorn', 387, 13.0, 4.5, 0.9, 20, 'cup', [createServing('grams', 'Grams', 1), createServing('cup', '1 cup', 20)]),
    biscuits: createFoodNutritionEntry('Biscuits', 502, 6.0, 24.0, 24.0, 15, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 biscuit', 15), createServing('small', 'Small serving', 15), createServing('large', 'Large serving', 30)], ['cookies']),
    cake: createFoodNutritionEntry('Cake', 350, 4.5, 15.0, 35.0, 80, 'slice', [createServing('grams', 'Grams', 1), createServing('slice', '1 slice', 80)]),
    chocolate: createFoodNutritionEntry('Chocolate', 546, 4.9, 31.0, 48.0, 25, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 piece', 25)]),
    ice_cream: createFoodNutritionEntry('Ice Cream', 207, 3.5, 11.0, 21.0, 66, 'scoop', [createServing('grams', 'Grams', 1), createServing('serving', '1 scoop', 66)]),
    sweets: createFoodNutritionEntry('Sweets', 400, 4.0, 12.0, 52.0, 30, 'piece', [createServing('grams', 'Grams', 1), createServing('piece', '1 piece', 30), createServing('small', 'Small piece', 20), createServing('large', 'Large piece', 45)], ['dessert']),
    burger: createFoodNutritionEntry('Burger', 295, 12.0, 14.0, 5.5, 180, 'regular', [createServing('grams', 'Grams', 1), createServing('small', 'Small burger', 130), createServing('regular', 'Regular burger', 180), createServing('large', 'Large burger', 250)]),
    pizza: createFoodNutritionEntry('Pizza', 266, 11.0, 10.0, 3.8, 120, 'slice', [createServing('grams', 'Grams', 1), createServing('slice', '1 slice', 120), createServing('small', 'Small pizza', 400), createServing('medium', 'Medium pizza', 700), createServing('large', 'Large pizza', 950)]),
    fries: createFoodNutritionEntry('Fries', 312, 3.4, 15.0, 0.3, 117, 'medium', [createServing('grams', 'Grams', 1), createServing('small', 'Small fries', 80), createServing('medium', 'Medium fries', 117), createServing('large', 'Large fries', 150)]),
    sandwich: createFoodNutritionEntry('Sandwich', 250, 11.0, 8.0, 5.0, 180, 'serving', [createServing('grams', 'Grams', 1), createServing('serving', '1 sandwich', 180)]),
    wrap: createFoodNutritionEntry('Wrap', 230, 10.0, 7.0, 3.5, 180, 'serving', [createServing('grams', 'Grams', 1), createServing('serving', '1 wrap', 180)]),
    momos: createFoodNutritionEntry('Momos', 230, 9.0, 8.0, 2.5, 120, 'plate', [createServing('grams', 'Grams', 1), createServing('plate', '1 plate', 120)]),
    biryani: createFoodNutritionEntry('Biryani', 290, 9.5, 9.0, 2.2, 250, 'plate', [createServing('grams', 'Grams', 1), createServing('plate', '1 plate', 250), createServing('bowl', '1 bowl', 180)]),
    fried_rice: createFoodNutritionEntry('Fried Rice', 174, 4.1, 4.0, 1.3, 180, 'plate', [createServing('grams', 'Grams', 1), createServing('plate', '1 plate', 180)]),
    soup: createFoodNutritionEntry('Soup', 48, 2.0, 1.6, 2.5, 240, 'bowl', [createServing('grams', 'Grams', 1), createServing('bowl', '1 bowl', 240), createServing('cup', '1 cup', 240)]),
    tea: createFoodNutritionEntry('Tea', 30, 0.4, 0.8, 5.0, 150, 'cup', [createServing('ml', 'Milliliters (ml)', 1), createServing('cup', '1 cup', 150), createServing('glass', '1 glass', 240)]),
    coffee: createFoodNutritionEntry('Coffee', 25, 0.3, 1.0, 3.0, 150, 'cup', [createServing('ml', 'Milliliters (ml)', 1), createServing('cup', '1 cup', 150), createServing('glass', '1 glass', 240)]),
    juice: createFoodNutritionEntry('Fruit Juice', 45, 0.5, 0.1, 9.8, 250, 'glass', [createServing('ml', 'Milliliters (ml)', 1), createServing('glass', '1 glass', 250), createServing('bottle', '1 bottle', 500)]),
    smoothie: createFoodNutritionEntry('Smoothie', 85, 2.5, 1.5, 12.0, 300, 'glass', [createServing('ml', 'Milliliters (ml)', 1), createServing('glass', '1 glass', 300)]),
    protein_shake: createFoodNutritionEntry('Protein Shake', 110, 20.0, 2.0, 4.0, 300, 'glass', [createServing('ml', 'Milliliters (ml)', 1), createServing('glass', '1 glass', 300)]),
    soft_drink: createFoodNutritionEntry('Soft Drink', 41, 0.0, 0.0, 10.6, 330, 'ml', [createServing('ml', 'Milliliters (ml)', 1), createServing('liters', 'Liters (L)', 1000), createServing('can', '1 can', 330), createServing('bottle', '1 bottle', 500)], ['soda', 'cola'])
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
            || (Array.isArray(item.aliases) && item.aliases.some((alias) => normalizeKey(alias) === normalizedLabel))
    );
    return matchedByLabel || null;
}

function normalizeUnit(unit) {
    const value = String(unit || '').toLowerCase().trim();
    if (value === 'g' || value === 'gram' || value === 'grams') return 'grams';
    if (value === 'kilogram' || value === 'kilograms' || value === 'kgs') return 'kg';
    if (value === 'unit' || value === 'units' || value === 'piece' || value === 'pieces') return 'piece';
    if (value === 'tsp' || value === 'tea spoon') return 'teaspoon';
    if (value === 'tbsp' || value === 'table spoon') return 'tablespoon';
    if (value === 'ltr' || value === 'ltrs' || value === 'liter' || value === 'litre' || value === 'liters' || value === 'litres' || value === 'l') return 'liters';
    return value;
}

function getServingOption(nutrition, unit) {
    const normalizedUnit = normalizeUnit(unit);
    const options = Array.isArray(nutrition?.serving_options) ? nutrition.serving_options : [];
    return options.find((option) => normalizeUnit(option.unit) === normalizedUnit)
        || COMMON_MEASUREMENT_OPTIONS.find((option) => normalizeUnit(option.unit) === normalizedUnit)
        || null;
}

function resolveQuantityInGrams(nutrition, quantity, unit) {
    const normalizedUnit = normalizeUnit(unit);
    const servingOption = getServingOption(nutrition, normalizedUnit);

    if (servingOption) {
        return quantity * Number(servingOption.grams_per_unit || 1);
    }

    if (normalizedUnit === 'kg') return quantity * 1000;
    if (normalizedUnit === 'liters') return quantity * 1000;
    if (normalizedUnit === 'ml') return quantity;
    if (normalizedUnit === 'grams') return quantity;

    const gramsPerUnit = nutrition.grams_per_unit || 100;
    return quantity * gramsPerUnit;
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
        const mealType = normalizeMealType(entry?.meal_type);
        const dayNumber = resolveDayNumber(entry?.day_number ?? entry?.day ?? entry?.day_label);

        if (!foodItemName || !Number.isFinite(quantity) || quantity <= 0) continue;

        const nutrition = getFoodNutrition(foodItemName);
        if (!nutrition) continue;
        const unit = normalizeUnit(entry?.unit || nutrition.default_unit || 'grams');

        if (!daySummaries.has(dayNumber)) {
            daySummaries.set(dayNumber, createDaySummary());
        }
        const daySummary = daySummaries.get(dayNumber);

        const quantityInGrams = resolveQuantityInGrams(nutrition, quantity, unit);
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
            unit,
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
        default_unit: food.default_unit || 'grams',
        grams_per_unit: food.grams_per_unit,
        aliases: Array.isArray(food.aliases) ? food.aliases : [],
        serving_options: Array.isArray(food.serving_options) && food.serving_options.length > 0
            ? [...food.serving_options, ...COMMON_MEASUREMENT_OPTIONS.filter((commonOption) => !food.serving_options.some((foodOption) => normalizeUnit(foodOption.unit) === normalizeUnit(commonOption.unit)))]
            : COMMON_MEASUREMENT_OPTIONS
    }));
}

module.exports = {
    MEAL_TYPES,
    getFoodNutritionOptions,
    assessDietPattern
};
