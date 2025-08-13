export type Gender = "male" | "female";

// Defines the structure for the three repeated measurements for each body part.
export type MeasurementTuple = [string, string, string];

// Defines the complete set of input fields for the calculator.
export interface MeasurementInputs {
	height: MeasurementTuple;
	neck: MeasurementTuple;
	waist: MeasurementTuple;
	hip: MeasurementTuple; // Primarily for females, but included for all.
	pectoral: MeasurementTuple; // Male skinfold
	abdominal: MeasurementTuple; // Male skinfold
	thigh: MeasurementTuple; // Used by both male and female skinfold
	triceps: MeasurementTuple; // Female skinfold
	suprailiac: MeasurementTuple; // Female skinfold
	age: string;
	weight: string;
}

// Defines the structure for the calculated average of each measurement.
export interface MeasurementAverages {
	height: number | null;
	neck: number | null;
	waist: number | null;
	hip: number | null;
	pectoral: number | null;
	abdominal: number | null;
	thigh: number | null;
	triceps: number | null;
	suprailiac: number | null;
	age: number | null;
	weight: number | null;
}

// Defines the structure for the final body fat percentage results.
export interface BFPResults {
	military: number | null;
	navy: number | null;
	jacksonPollock: number | null;
	adjusted: number | null;
	ffmi: number | null;
	adjustedFfmi: number | null;
}
