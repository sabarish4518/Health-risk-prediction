// ==================== MODEL.JS ====================
// Health risk prediction model module

class HealthRiskPredictor {
    constructor() {
        this.riskScore = 0;
        this.factors = {};
    }
    
    /**
     * Calculate BMI (Body Mass Index)
     * Formula: weight(kg) / (height(m))^2
     */
    calculateBmi(heightCm, weightKg) {
        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        return parseFloat(bmi.toFixed(2));
    }
    
    /**
     * Evaluate risk based on BMI
     */
    evaluateBmiRisk(bmi) {
        if (bmi < 18.5) {
            return 30; // Underweight risk
        } else if (bmi >= 18.5 && bmi < 25) {
            return 10; // Healthy range
        } else if (bmi >= 25 && bmi < 30) {
            return 40; // Overweight risk
        } else {
            return 60; // Obese risk
        }
    }
    
    /**
     * Evaluate risk based on sleep hours
     * Optimal: 7-9 hours
     */
    evaluateSleepRisk(sleepHours) {
        if (sleepHours >= 7 && sleepHours <= 9) {
            return 10; // Good sleep
        } else if ((sleepHours >= 6 && sleepHours < 7) || (sleepHours > 9 && sleepHours <= 10)) {
            return 30; // Slightly below/above optimal
        } else if ((sleepHours >= 5 && sleepHours < 6) || (sleepHours > 10 && sleepHours <= 11)) {
            return 50; // Poor sleep
        } else {
            return 70; // Very poor sleep
        }
    }
    
    /**
     * Evaluate risk based on physical activity level
     */
    evaluateActivityRisk(activityLevel) {
        const activityRisk = {
            'Sedentary': 60,
            'Light': 35,
            'Moderate': 15,
            'Active': 8,
            'High': 5,
            'Very Active': 4
        };
        return activityRisk[activityLevel] || 40;
    }
    
    /**
     * Evaluate risk based on hydration level (1-10 scale)
     */
    evaluateHydrationRisk(hydrationLevel) {
        if (hydrationLevel >= 8) {
            return 10; // Well hydrated
        } else if (hydrationLevel >= 6 && hydrationLevel <= 7) {
            return 30; // Moderately hydrated
        } else if (hydrationLevel >= 4 && hydrationLevel <= 5) {
            return 50; // Low hydration
        } else {
            return 70; // Very low hydration
        }
    }
    
    /**
     * Evaluate risk based on diet type
     */
    evaluateDietRisk(dietType) {
        const dietRisk = {
            'Balanced': 15,
            'Slightly Imbalanced': 28,
            'High Calorie Diet': 52,
            'Low Calorie Diet': 45,
            'High Sugar': 55,
            'High Fat': 50,
            'Low Protein': 42,
            'Irregular Meals': 45,
            'Vegetarian': 12
        };
        return dietRisk[dietType] || 40;
    }
    
    /**
     * Predict overall health risk level
     * Uses weighted factor analysis
     */
    predictRiskLevel(healthData) {
        // Calculate BMI
        const bmi = this.calculateBmi(healthData.height, healthData.weight);
        
        // Evaluate each factor
        const bmiRisk = this.evaluateBmiRisk(bmi);
        const sleepRisk = this.evaluateSleepRisk(healthData.sleep_hours);
        const activityRisk = this.evaluateActivityRisk(healthData.activity_level);
        const hydrationRisk = this.evaluateHydrationRisk(healthData.hydration_level);
        const dietRisk = this.evaluateDietRisk(healthData.diet_type);
        
        // Store factors for reference
        this.factors = {
            bmi,
            bmi_risk: bmiRisk,
            sleep_risk: sleepRisk,
            activity_risk: activityRisk,
            hydration_risk: hydrationRisk,
            diet_risk: dietRisk
        };
        
        // Calculate weighted base score
        // Weights: BMI(25%), Sleep(20%), Activity(20%), Hydration(20%), Diet(15%)
        const baseRisk = (
            (bmiRisk * 0.25) +
            (sleepRisk * 0.20) +
            (activityRisk * 0.20) +
            (hydrationRisk * 0.20) +
            (dietRisk * 0.15)
        );

        // Add compounding penalties when multiple factors are poor.
        // This prevents "always medium" outcomes when several risky habits coexist.
        let poorFactorCount = 0;
        let penalty = 0;

        if (bmiRisk >= 40) {
            penalty += 8;
            poorFactorCount += 1;
        }
        if (sleepRisk >= 50) {
            penalty += 8;
            poorFactorCount += 1;
        }
        if (activityRisk >= 35) {
            penalty += 7;
            poorFactorCount += 1;
        }
        if (hydrationRisk >= 50) {
            penalty += 8;
            poorFactorCount += 1;
        }
        if (dietRisk >= 50) {
            penalty += 7;
            poorFactorCount += 1;
        }

        if (poorFactorCount >= 3) penalty += 10;
        if (poorFactorCount >= 4) penalty += 6;

        // Reward strong overall lifestyle profile.
        let goodFactorCount = 0;
        if (bmiRisk <= 15) goodFactorCount += 1;
        if (sleepRisk <= 15) goodFactorCount += 1;
        if (activityRisk <= 15) goodFactorCount += 1;
        if (hydrationRisk <= 15) goodFactorCount += 1;
        if (dietRisk <= 15) goodFactorCount += 1;

        const bonus = goodFactorCount >= 4 ? 6 : 0;
        const totalRisk = Math.max(0, Math.min(100, baseRisk + penalty - bonus));

        this.riskScore = parseFloat(totalRisk.toFixed(2));

        // Classify risk level
        let riskLevel = 'Low Risk';
        if (this.riskScore >= 55) {
            riskLevel = 'High Risk';
        } else if (this.riskScore >= 30) {
            riskLevel = 'Medium Risk';
        }
        
        return {
            risk_level: riskLevel,
            risk_score: this.riskScore,
            bmi,
            factors: this.factors
        };
    }
    
    /**
     * Get simple recommendation based on risk level
     */
    getSimpleRecommendation(riskLevel) {
        if (riskLevel === 'Low Risk') {
            return 'Excellent! Maintain your current healthy lifestyle.';
        } else if (riskLevel === 'Medium Risk') {
            return 'Good, but continue improving. Focus on areas with higher risk scores.';
        } else {
            return 'High risk detected. Consider consulting healthcare professionals and making lifestyle changes.';
        }
    }
}

module.exports = HealthRiskPredictor;
