"use client";

import Instructions from "@/components/Instructions";
import MeasurementInputGroup from "@/components/MeasurementInputGroup";
import ResultsDisplay from "@/components/ResultsDisplay";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	BFPResults,
	Gender,
	MeasurementAverages,
	MeasurementInputs,
	MeasurementTuple,
} from "@/types/types";
import {
	calculateAdjustedBFP,
	calculateAverage,
	calculateFFMI,
	calculateJacksonPollockBFP,
	calculateMilitaryBFP,
	calculateNavyBFP,
} from "@/utils/bodyFatCalculations";
import { Label } from "@radix-ui/react-label";
import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const initialMeasurements: MeasurementInputs = {
	height: ["", "", ""],
	neck: ["", "", ""],
	waist: ["", "", ""],
	hip: ["", "", ""],
	pectoral: ["", "", ""],
	abdominal: ["", "", ""],
	thigh: ["", "", ""],
	triceps: ["", "", ""],
	suprailiac: ["", "", ""],
	age: "",
	weight: "",
};

const initialResults: BFPResults = {
	military: null,
	navy: null,
	jacksonPollock: null,
	adjusted: null,
	ffmi: null,
	adjustedFfmi: null,
};

const initialAverages: MeasurementAverages = {
	height: null,
	neck: null,
	waist: null,
	hip: null,
	pectoral: null,
	abdominal: null,
	thigh: null,
	triceps: null,
	suprailiac: null,
	age: null,
	weight: null,
};

const LOCAL_STORAGE_KEY = "bodyCompCalculatorData";

export default function BodyFatCalculator() {
	const [gender, setGender] = useState<Gender>("male");
	const [measurements, setMeasurements] =
		useState<MeasurementInputs>(initialMeasurements);
	const [results, setResults] = useState<BFPResults>(initialResults);
	const [averages, setAverages] =
		useState<MeasurementAverages>(initialAverages);
	const [errors, setErrors] = useState<string[]>([]);

	// Load state from local storage on initial render
	useEffect(() => {
		try {
			const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (savedData) {
				const parsedData = JSON.parse(savedData);
				// Validate parsed data before setting state to prevent errors
				if (parsedData.measurements) setMeasurements(parsedData.measurements);
				if (parsedData.results) setResults(parsedData.results);
				if (parsedData.averages) setAverages(parsedData.averages);
				if (parsedData.gender) setGender(parsedData.gender);
			}
		} catch (error) {
			console.error("Failed to load data from local storage:", error);
		}
	}, []);

	// Save state to local storage whenever it changes
	useEffect(() => {
		try {
			const dataToSave = {
				gender,
				measurements,
				results,
				averages,
			};
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
		} catch (error) {
			console.error("Failed to save data to local storage:", error);
		}
	}, [gender, measurements, results, averages]);

	const updateMeasurement = useCallback(
		(field: keyof MeasurementInputs, index: number, value: string) => {
			if (field === "age" || field === "weight") {
				setMeasurements((prev) => ({ ...prev, [field]: value }));
			} else {
				setMeasurements((prev) => ({
					...prev,
					[field]: prev[field].map((v, i) =>
						i === index ? value : v
					) as MeasurementTuple,
				}));
			}
		},
		[]
	);

	const handleCalculate = () => {
		const newErrors: string[] = [];

		const calculatedAverages: MeasurementAverages = {
			height: calculateAverage(measurements.height),
			neck: calculateAverage(measurements.neck),
			waist: calculateAverage(measurements.waist),
			hip: calculateAverage(measurements.hip),
			pectoral: calculateAverage(measurements.pectoral),
			abdominal: calculateAverage(measurements.abdominal),
			thigh: calculateAverage(measurements.thigh),
			triceps: calculateAverage(measurements.triceps),
			suprailiac: calculateAverage(measurements.suprailiac),
			age: measurements.age ? parseFloat(measurements.age) : null,
			weight: measurements.weight ? parseFloat(measurements.weight) : null,
		};
		setAverages(calculatedAverages);

		const military = calculateMilitaryBFP(calculatedAverages, gender);
		if (military === null)
			newErrors.push(
				"Could not calculate Military BFP. Check required fields: Height, Neck, Waist (and Hip for females)."
			);

		const navy = calculateNavyBFP(calculatedAverages, gender);
		if (navy === null)
			newErrors.push(
				"Could not calculate Navy BFP. Check required fields: Height, Neck, Waist (and Hip for females)."
			);

		const jacksonPollock = calculateJacksonPollockBFP(
			calculatedAverages,
			gender
		);
		if (jacksonPollock === null) {
			const requiredFields =
				gender === "male"
					? "Pectoral, Abdominal, Thigh, Age"
					: "Triceps, Suprailiac, Thigh, Age";
			newErrors.push(
				`Could not calculate Jackson & Pollock BFP. Check required fields: ${requiredFields}.`
			);
		}

		const adjusted = calculateAdjustedBFP({ military, navy, jacksonPollock });

		const { ffmi, adjustedFfmi } = calculateFFMI(
			adjusted,
			calculatedAverages.weight,
			calculatedAverages.height
		);
		if (adjusted !== null && ffmi === null) {
			newErrors.push(
				"Could not calculate FFMI. Check required fields: Weight, Height, and all fields for at least one BFP method."
			);
		}

		const bfpResults: BFPResults = {
			military,
			navy,
			jacksonPollock,
			adjusted,
			ffmi,
			adjustedFfmi,
		};

		setResults(bfpResults);
		setErrors(newErrors);
	};

	const handleReset = () => {
		try {
			localStorage.removeItem(LOCAL_STORAGE_KEY);
		} catch (error) {
			console.error("Failed to clear local storage:", error);
		}
		setGender("male");
		setMeasurements(initialMeasurements);
		setResults(initialResults);
		setAverages(initialAverages);
		setErrors([]);
	};

	// Memoize input groups to prevent re-rendering when other state changes
	const CircumferenceInputs = useMemo(
		() => (
			<Card>
				<CardHeader>
					<CardTitle>Circumference Measurements</CardTitle>
					<CardDescription>
						Enter three measurements for each site.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<MeasurementInputGroup
						label="Height"
						field="height"
						values={measurements.height}
						average={averages.height}
						updateMeasurement={updateMeasurement}
					/>
					<MeasurementInputGroup
						label="Neck"
						field="neck"
						values={measurements.neck}
						average={averages.neck}
						updateMeasurement={updateMeasurement}
					/>
					<MeasurementInputGroup
						label="Waist"
						field="waist"
						values={measurements.waist}
						average={averages.waist}
						updateMeasurement={updateMeasurement}
					/>
					{gender === "female" && (
						<MeasurementInputGroup
							label="Hip"
							field="hip"
							values={measurements.hip}
							average={averages.hip}
							updateMeasurement={updateMeasurement}
						/>
					)}
				</CardContent>
			</Card>
		),
		[measurements, averages, gender, updateMeasurement]
	);

	const SkinfoldInputs = useMemo(
		() => (
			<Card>
				<CardHeader>
					<CardTitle>Skinfold Measurements</CardTitle>
					<CardDescription>
						Enter three measurements for each site.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{gender === "male" ? (
						<>
							<MeasurementInputGroup
								label="Pectoral"
								field="pectoral"
								unit="mm"
								values={measurements.pectoral}
								average={averages.pectoral}
								updateMeasurement={updateMeasurement}
							/>
							<MeasurementInputGroup
								label="Abdominal"
								field="abdominal"
								unit="mm"
								values={measurements.abdominal}
								average={averages.abdominal}
								updateMeasurement={updateMeasurement}
							/>
							<MeasurementInputGroup
								label="Thigh"
								field="thigh"
								unit="mm"
								values={measurements.thigh}
								average={averages.thigh}
								updateMeasurement={updateMeasurement}
							/>
						</>
					) : (
						<>
							<MeasurementInputGroup
								label="Triceps"
								field="triceps"
								unit="mm"
								values={measurements.triceps}
								average={averages.triceps}
								updateMeasurement={updateMeasurement}
							/>
							<MeasurementInputGroup
								label="Suprailiac"
								field="suprailiac"
								unit="mm"
								values={measurements.suprailiac}
								average={averages.suprailiac}
								updateMeasurement={updateMeasurement}
							/>
							<MeasurementInputGroup
								label="Thigh"
								field="thigh"
								unit="mm"
								values={measurements.thigh}
								average={averages.thigh}
								updateMeasurement={updateMeasurement}
							/>
						</>
					)}
				</CardContent>
			</Card>
		),
		[measurements, averages, gender, updateMeasurement]
	);

	return (
		<div className="min-h-screen bg-background p-4 md:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold tracking-tight">
						Body Composition Calculator
					</h1>
					<p className="text-muted-foreground">
						Calculate Body Fat Percentage and Fat-Free Mass Index (FFMI).
					</p>
				</div>

				<Instructions />

				<Card>
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
						<CardDescription>
							Enter your basic information. Weight is required for FFMI.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid sm:grid-cols-3 gap-6">
						<fieldset className="space-y-2 sm:col-span-1">
							<legend className="text-sm font-medium">Gender</legend>
							<RadioGroup
								value={gender}
								onValueChange={(value) => setGender(value as Gender)}
								className="flex space-x-4 pt-2"
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="male" id="male" />
									<Label htmlFor="male">Male</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="female" id="female" />
									<Label htmlFor="female">Female</Label>
								</div>
							</RadioGroup>
						</fieldset>
						<div className="space-y-2">
							<Label htmlFor="age">Age (years)</Label>
							<Input
								id="age"
								type="number"
								placeholder="Enter age"
								value={measurements.age}
								onChange={(e) => updateMeasurement("age", 0, e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="weight">Weight (lbs)</Label>
							<Input
								id="weight"
								type="number"
								placeholder="Enter weight"
								value={measurements.weight}
								onChange={(e) => updateMeasurement("weight", 0, e.target.value)}
							/>
						</div>
					</CardContent>
				</Card>

				<div className="grid md:grid-cols-2 gap-6">
					{CircumferenceInputs}
					{SkinfoldInputs}
				</div>

				<div className="flex flex-col sm:flex-row justify-center items-center gap-4">
					<Button
						onClick={handleCalculate}
						size="lg"
						className="px-8 w-full sm:w-auto"
					>
						Calculate Body Composition
					</Button>
					<Button
						onClick={handleReset}
						variant="outline"
						size="lg"
						className="w-full sm:w-auto"
					>
						<RotateCcw className="mr-2 h-4 w-4" />
						Reset Form
					</Button>
				</div>

				<ResultsDisplay results={results} averages={averages} errors={errors} />
			</div>
		</div>
	);
}
