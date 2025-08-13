import {
	BFPResults,
	Gender,
	MeasurementAverages,
	MeasurementTuple,
	PartialBFPResults,
} from "@/types/types";

/**
 * Calculates the average of a tuple of string numbers.
 * @param values - An array of 1-3 string values representing measurements.
 * @returns The average number, or null if no valid numbers are provided.
 */
export const calculateAverage = (values: MeasurementTuple): number | null => {
	const nums = values.map((v) => parseFloat(v)).filter((n) => !isNaN(n));
	if (nums.length === 0) return null;
	return nums.reduce((sum, n) => sum + n, 0) / nums.length;
};

/**
 * **FORMULA CORRECTED**
 * Calculates Body Fat Percentage using the U.S. Military (DoD) formula.
 * The original code only had the male formula. I've added the female formula.
 * @param averages - The averaged measurement values.
 * @param gender - The user's gender.
 * @returns The calculated BFP, or null if inputs are missing.
 */
export const calculateMilitaryBFP = (
	averages: MeasurementAverages,
	gender: Gender
): number | null => {
	const { height, neck, waist, hip } = averages;
	if (!height || !neck || !waist) return null;

	if (gender === "male") {
		if (waist <= neck) return null; // Constraint for the formula
		return (
			86.01 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76
		);
	} else {
		// female
		if (!hip || waist + hip <= neck) return null; // Constraint for the formula
		return (
			163.205 * Math.log10(waist + hip - neck) -
			97.684 * Math.log10(height) -
			78.387
		);
	}
};

/**
 * Calculates Body Fat Percentage using the U.S. Navy (Hodgdon & Beckett) formula.
 * @param averages - The averaged measurement values.
 * @param gender - The user's gender.
 * @returns The calculated BFP, or null if inputs are missing.
 */
export const calculateNavyBFP = (
	averages: MeasurementAverages,
	gender: Gender
): number | null => {
	const { height, neck, waist, hip } = averages;
	if (!height || !neck || !waist) return null;

	if (gender === "male") {
		if (waist <= neck) return null;
		return (
			495 /
				(1.0324 -
					0.19077 * Math.log10(waist - neck) +
					0.15456 * Math.log10(height)) -
			450
		);
	} else {
		// female
		if (!hip || waist + hip <= neck) return null;
		return (
			495 /
				(1.29579 -
					0.35004 * Math.log10(waist + hip - neck) +
					0.221 * Math.log10(height)) -
			450
		);
	}
};

/**
 * Calculates Body Fat Percentage using the Jackson & Pollock 3-Site Skinfold method.
 * The original code used incorrect formulas. I have replaced them with the standard
 * 3-site formulas for both males and females.
 * @param averages - The averaged measurement values.
 * @param gender - The user's gender.
 * @returns The calculated BFP, or null if inputs are missing.
 */
export const calculateJacksonPollockBFP = (
	averages: MeasurementAverages,
	gender: Gender
): number | null => {
	const { age } = averages;
	if (!age) return null;

	let sumOfSkinfolds: number;
	let bodyDensity: number;

	if (gender === "male") {
		const { pectoral, abdominal, thigh } = averages;
		if (!pectoral || !abdominal || !thigh) return null;
		sumOfSkinfolds = pectoral + abdominal + thigh;
		// Corrected 3-Site formula for males
		bodyDensity =
			1.10938 -
			0.0008267 * sumOfSkinfolds +
			0.0000016 * Math.pow(sumOfSkinfolds, 2) -
			0.0002574 * age;
	} else {
		// female
		const { triceps, suprailiac, thigh } = averages;
		if (!triceps || !suprailiac || !thigh) return null;
		sumOfSkinfolds = triceps + suprailiac + thigh;
		// Corrected 3-Site formula for females
		bodyDensity =
			1.0994921 -
			0.0009929 * sumOfSkinfolds +
			0.0000023 * Math.pow(sumOfSkinfolds, 2) -
			0.0001392 * age;
	}

	if (bodyDensity <= 0) return null;

	// Siri equation to convert body density to body fat percentage
	return 495 / bodyDensity - 450;
};

/**
 * Calculates an adjusted BFP by removing outliers.
 * If 3 results are available, it finds the two closest values and averages them.
 * This prevents a single skewed measurement from affecting the final average.
 * @param results - The results from the other calculation methods.
 * @returns The adjusted average BFP, or null if inputs are missing.
 */
export const calculateAdjustedBFP = (
	results: PartialBFPResults
): number | null => {
	const { military, navy, jacksonPollock } = results;
	const validResults = [military, navy, jacksonPollock].filter(
		(r) => r !== null && r > 0
	) as number[];

	// If there are less than 3 results, outlier detection isn't possible, so we just average them.
	if (validResults.length < 3) {
		if (validResults.length === 0) return null;
		const sum = validResults.reduce((acc, val) => acc + val, 0);
		return sum / validResults.length;
	}

	// With exactly 3 results, find the two that are closest together and average them.
	// This effectively discards the single most significant outlier.
	const [v1, v2, v3] = validResults;
	const diff12 = Math.abs(v1 - v2);
	const diff13 = Math.abs(v1 - v3);
	const diff23 = Math.abs(v2 - v3);

	if (diff12 <= diff13 && diff12 <= diff23) {
		// v1 and v2 are the closest
		return (v1 + v2) / 2;
	} else if (diff13 <= diff12 && diff13 <= diff23) {
		// v1 and v3 are the closest
		return (v1 + v3) / 2;
	} else {
		// v2 and v3 are the closest
		return (v2 + v3) / 2;
	}
};

/**
 * Calculates the Fat-Free Mass Index (FFMI).
 * @param bfp - The body fat percentage.
 * @param weightInLbs - The user's weight in pounds.
 * @param heightInInches - The user's height in inches.
 * @returns An object containing the FFMI and adjusted FFMI, or nulls if inputs are missing.
 */
export const calculateFFMI = (
	bfp: number | null,
	weightInLbs: number | null,
	heightInInches: number | null
): { ffmi: number | null; adjustedFfmi: number | null } => {
	if (
		bfp === null ||
		weightInLbs === null ||
		heightInInches === null ||
		bfp < 0 ||
		weightInLbs <= 0 ||
		heightInInches <= 0
	) {
		return { ffmi: null, adjustedFfmi: null };
	}

	// Convert units to metric
	const weightInKg = weightInLbs * 0.453592;
	const heightInM = heightInInches * 0.0254;

	// Calculate Lean Body Mass (LBM)
	const fatMass = weightInKg * (bfp / 100);
	const leanBodyMass = weightInKg - fatMass;

	// Calculate FFMI
	const ffmi = leanBodyMass / Math.pow(heightInM, 2);

	// Calculate Adjusted FFMI (normalized to a height of 1.8m)
	const adjustedFfmi = ffmi + 6.1 * (1.8 - heightInM);

	return { ffmi, adjustedFfmi };
};
