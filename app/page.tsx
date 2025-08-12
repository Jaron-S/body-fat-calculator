"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useCallback, useState } from "react"; // Import useCallback

interface MeasurementInputs {
	height: [string, string, string];
	neck: [string, string, string];
	waist: [string, string, string];
	hip: [string, string, string];
	pectoral: [string, string, string];
	abdominal: [string, string, string];
	thigh: [string, string, string];
	triceps: [string, string, string];
	suprailiac: [string, string, string];
	age: string;
}

interface Results {
	military: number | null;
	navy: number | null;
	jacksonPollock: number | null;
	adjusted: number | null;
	averages: {
		height: number | null;
		neck: number | null;
		waist: number | null;
		hip: number | null;
		pectoral: number | null;
		abdominal: number | null;
		thigh: number | null;
		triceps: number | null;
		suprailiac: number | null;
	};
}

// --- FIX START: Moved MeasurementGroup outside the main component ---
const MeasurementGroup = ({
	label,
	field,
	unit = "in",
	show = true,
	values,
	average,
	updateMeasurement,
}: {
	label: string;
	field: keyof Omit<MeasurementInputs, "age">;
	unit?: string;
	show?: boolean;
	values: [string, string, string];
	average: number | null;
	updateMeasurement: (
		field: keyof MeasurementInputs,
		index: number,
		value: string
	) => void;
}) => {
	if (!show) return null;

	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium">
				{label} ({unit})
			</Label>
			<div className="grid grid-cols-3 gap-2">
				{[0, 1, 2].map((index) => (
					// A more stable key is also a good practice
					<div key={`${field}-${index}`}>
						<Input
							type="number"
							step="0.1"
							placeholder={`${label} ${index + 1}`}
							value={values[index]}
							onChange={(e) => updateMeasurement(field, index, e.target.value)}
							className="text-sm"
						/>
					</div>
				))}
			</div>
			{average !== null && (
				<p className="text-xs text-muted-foreground">
					Average: {average.toFixed(1)} {unit}
				</p>
			)}
		</div>
	);
};
// --- FIX END ---

export default function BodyFatCalculator() {
	const [gender, setGender] = useState<"male" | "female">("male");
	const [measurements, setMeasurements] = useState<MeasurementInputs>({
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
	});
	const [results, setResults] = useState<Results>({
		military: null,
		navy: null,
		jacksonPollock: null,
		adjusted: null,
		averages: {
			height: null,
			neck: null,
			waist: null,
			hip: null,
			pectoral: null,
			abdominal: null,
			thigh: null,
			triceps: null,
			suprailiac: null,
		},
	});
	const [errors, setErrors] = useState<string[]>([]);
	const [instructionsOpen, setInstructionsOpen] = useState(false);
	const [maleInstructionsOpen, setMaleInstructionsOpen] = useState(false);
	const [femaleInstructionsOpen, setFemaleInstructionsOpen] = useState(false);

	const calculateAverage = (
		values: [string, string, string]
	): number | null => {
		const nums = values
			.map((v) => Number.parseFloat(v))
			.filter((n) => !isNaN(n));
		if (nums.length === 0) return null;
		return nums.reduce((sum, n) => sum + n, 0) / nums.length;
	};

	// --- FIX START: Wrapped updateMeasurement in useCallback ---
	const updateMeasurement = useCallback(
		(field: keyof MeasurementInputs, index: number, value: string) => {
			if (field === "age") {
				setMeasurements((prev) => ({ ...prev, age: value }));
			} else {
				setMeasurements((prev) => ({
					...prev,
					[field]: prev[field].map((v, i) => (i === index ? value : v)) as [
						string,
						string,
						string
					],
				}));
			}
		},
		[]
	);
	// --- FIX END ---

	const calculateBodyFat = () => {
		const newErrors: string[] = [];

		// Calculate averages
		const avgHeight = calculateAverage(measurements.height);
		const avgNeck = calculateAverage(measurements.neck);
		const avgWaist = calculateAverage(measurements.waist);
		const avgHip = calculateAverage(measurements.hip);
		const avgPectoral = calculateAverage(measurements.pectoral);
		const avgAbdominal = calculateAverage(measurements.abdominal);
		const avgThigh = calculateAverage(measurements.thigh);
		const avgTriceps = calculateAverage(measurements.triceps);
		const avgSuprailiac = calculateAverage(measurements.suprailiac);
		const age = Number.parseFloat(measurements.age);

		const newAverages = {
			height: avgHeight,
			neck: avgNeck,
			waist: avgWaist,
			hip: avgHip,
			pectoral: avgPectoral,
			abdominal: avgAbdominal,
			thigh: avgThigh,
			triceps: avgTriceps,
			suprailiac: avgSuprailiac,
		};

		let military: number | null = null;
		let navy: number | null = null;
		let jacksonPollock: number | null = null;

		// Military Method
		if (avgWaist && avgNeck && avgHeight) {
			const waistMinusNeck = avgWaist - avgNeck;
			if (waistMinusNeck <= 0) {
				newErrors.push(
					"Waist measurement must be greater than neck measurement for Military method"
				);
			} else {
				military =
					86.01 * Math.log10(waistMinusNeck) -
					70.041 * Math.log10(avgHeight) +
					36.76;
			}
		} else {
			newErrors.push(
				"Height, neck, and waist measurements required for Military method"
			);
		}

		// Navy Method
		if (gender === "male") {
			if (avgWaist && avgNeck && avgHeight) {
				const waistMinusNeck = avgWaist - avgNeck;
				if (waistMinusNeck <= 0) {
					newErrors.push(
						"Waist measurement must be greater than neck measurement for Navy method"
					);
				} else {
					navy =
						495 /
							(1.0324 -
								0.19077 * Math.log10(waistMinusNeck) +
								0.15456 * Math.log10(avgHeight)) -
						450;
				}
			} else {
				newErrors.push(
					"Height, neck, and waist measurements required for Navy method (Male)"
				);
			}
		} else {
			if (avgWaist && avgHip && avgNeck && avgHeight) {
				const waistPlusHipMinusNeck = avgWaist + avgHip - avgNeck;
				if (waistPlusHipMinusNeck <= 0) {
					newErrors.push(
						"Waist + Hip must be greater than neck measurement for Navy method"
					);
				} else {
					navy =
						495 /
							(1.29579 -
								0.35004 * Math.log10(waistPlusHipMinusNeck) +
								0.221 * Math.log10(avgHeight)) -
						450;
				}
			} else {
				newErrors.push(
					"Height, neck, waist, and hip measurements required for Navy method (Female)"
				);
			}
		}

		if (gender === "male") {
			if (avgPectoral && avgAbdominal && avgThigh && !isNaN(age)) {
				const sumOfSkinfolds = avgPectoral + avgAbdominal + avgThigh;
				const db =
					1.112 -
					0.00043499 * sumOfSkinfolds +
					0.00000055 * Math.pow(sumOfSkinfolds, 2) -
					0.00028826 * age;
				if (db <= 0) {
					newErrors.push(
						"Invalid density calculation for Jackson & Pollock method"
					);
				} else {
					jacksonPollock = 495 / db - 450;
				}
			} else {
				newErrors.push(
					"Pectoral, abdominal, thigh skinfolds and age required for Jackson & Pollock method"
				);
			}
		} else {
			// Female Jackson & Pollock 3-Site Method
			if (avgTriceps && avgSuprailiac && avgThigh && !isNaN(age)) {
				const sumOfSkinfolds = avgTriceps + avgSuprailiac + avgThigh;
				const db =
					1.10938 -
					0.0008267 * sumOfSkinfolds +
					0.0000016 * Math.pow(sumOfSkinfolds, 2) -
					0.0002574 * age;
				if (db <= 0) {
					newErrors.push(
						"Invalid density calculation for Jackson & Pollock method"
					);
				} else {
					jacksonPollock = 495 / db - 450;
				}
			} else {
				newErrors.push(
					"Triceps, suprailiac, thigh skinfolds and age required for Jackson & Pollock method (Female)"
				);
			}
		}

		// Calculate adjusted body fat percentage
		let adjusted: number | null = null;
		if (military !== null && navy !== null && jacksonPollock !== null) {
			adjusted = ((navy + military) / 2 + jacksonPollock) / 2;
		}

		setResults({
			military,
			navy,
			jacksonPollock,
			adjusted,
			averages: newAverages,
		});
		setErrors(newErrors);
	};

	return (
		<div className="min-h-screen bg-background p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold">Body Fat Calculator</h1>
					<p className="text-muted-foreground">
						Calculate body fat percentage using Military, Navy, and Jackson &
						Pollock methods
					</p>
				</div>

				<Card>
					<Collapsible
						open={instructionsOpen}
						onOpenChange={setInstructionsOpen}
					>
						<CollapsibleTrigger asChild>
							<CardHeader className="cursor-pointer">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Info className="h-5 w-5 text-primary" />
										<CardTitle>Measurement Instructions</CardTitle>
									</div>
									{instructionsOpen ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
								</div>
								<CardDescription>
									Click to view detailed measurement guidelines
								</CardDescription>
							</CardHeader>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<CardContent className="space-y-4 mt-4">
								<div className="grid md:grid-cols-2 gap-6">
									<Card>
										<Collapsible
											open={maleInstructionsOpen}
											onOpenChange={setMaleInstructionsOpen}
										>
											<CollapsibleTrigger asChild>
												<CardHeader className="cursor-pointer">
													<div className="flex items-center justify-between">
														<CardTitle className="text-lg">
															Male Instructions
														</CardTitle>
														{maleInstructionsOpen ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
													</div>
												</CardHeader>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<CardContent className="space-y-4">
													<div>
														<h4 className="font-semibold mb-2">
															General Rules
														</h4>
														<p className="text-sm text-muted-foreground">
															For all measurements, ensure you are in minimal
															clothing. Take three readings at each site and use
															the average. Take all measurements on the right
															side of the body.
														</p>
													</div>

													<div>
														<h4 className="font-semibold mb-2">
															Circumference Measurements (inches)
														</h4>
														<ul className="text-sm space-y-1 text-muted-foreground">
															<li>
																<strong>Neck:</strong> Measure circumference
																just below the larynx, keeping the tape level.
															</li>
															<li>
																<strong>Waist:</strong> Measure circumference
																horizontally at the navel at the end of a normal
																exhale.
															</li>
															<li>
																<strong>Height:</strong> Stand with your back
																against a wall, heels together, and look
																straight ahead. Measure from the floor to the
																top of your head without shoes.
															</li>
														</ul>
													</div>

													<div>
														<h4 className="font-semibold mb-2">
															Skinfold Measurements (millimeters)
														</h4>
														<ul className="text-sm space-y-1 text-muted-foreground">
															<li>
																<strong>Pectoral:</strong> Using a pincher grip,
																take a diagonal fold halfway between the
																anterior axillary line and the nipple.
															</li>
															<li>
																<strong>Abdominal:</strong> Using a pincher
																grip, take a vertical fold 2 cm to the right of
																the navel.
															</li>
															<li>
																<strong>Thigh:</strong> Using a pincher grip,
																take a vertical fold on the front of the thigh,
																at the midpoint between the top of the thigh and
																the top of the kneecap.
															</li>
														</ul>
													</div>
												</CardContent>
											</CollapsibleContent>
										</Collapsible>
									</Card>

									<Card>
										<Collapsible
											open={femaleInstructionsOpen}
											onOpenChange={setFemaleInstructionsOpen}
										>
											<CollapsibleTrigger asChild>
												<CardHeader className="cursor-pointer">
													<div className="flex items-center justify-between">
														<CardTitle className="text-lg">
															Female Instructions
														</CardTitle>
														{femaleInstructionsOpen ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
													</div>
												</CardHeader>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<CardContent className="space-y-4">
													<div>
														<h4 className="font-semibold mb-2">
															General Rules
														</h4>
														<p className="text-sm text-muted-foreground">
															For all measurements, ensure you are in minimal
															clothing. Take three readings at each site and use
															the average. Take all measurements on the right
															side of the body.
														</p>
													</div>

													<div>
														<h4 className="font-semibold mb-2">
															Circumference Measurements (inches)
														</h4>
														<ul className="text-sm space-y-1 text-muted-foreground">
															<li>
																<strong>Neck:</strong> Measure circumference
																just below the larynx, keeping the tape level.
															</li>
															<li>
																<strong>Waist:</strong> Measure circumference at
																the narrowest point of your abdomen at the end
																of a normal exhale.
															</li>
															<li>
																<strong>Hips:</strong> Measure circumference at
																the widest part of your hips/buttocks.
															</li>
															<li>
																<strong>Height:</strong> Stand with your back
																against a wall, heels together, and look
																straight ahead. Measure from the floor to the
																top of your head without shoes.
															</li>
														</ul>
													</div>

													<div>
														<h4 className="font-semibold mb-2">
															Skinfold Measurements (millimeters)
														</h4>
														<ul className="text-sm space-y-1 text-muted-foreground">
															<li>
																<strong>Triceps:</strong> Using a pincher grip,
																take a vertical fold on the back of the upper
																arm, halfway between the shoulder and the elbow.
															</li>
															<li>
																<strong>Suprailiac:</strong> Using a pincher
																grip, take a diagonal fold just above the hip
																bone.
															</li>
															<li>
																<strong>Thigh:</strong> Using a pincher grip,
																take a vertical fold on the front of the thigh,
																at the midpoint between the top of the thigh and
																the top of the kneecap.
															</li>
														</ul>
													</div>
												</CardContent>
											</CollapsibleContent>
										</Collapsible>
									</Card>
								</div>
							</CardContent>
						</CollapsibleContent>
					</Collapsible>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
						<CardDescription>
							Select your gender to show relevant measurement fields
						</CardDescription>
					</CardHeader>
					<CardContent>
						<RadioGroup
							value={gender}
							onValueChange={(value) => setGender(value as "male" | "female")}
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
					</CardContent>
				</Card>

				<div className="grid md:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Circumference Measurements</CardTitle>
							<CardDescription>
								Enter three measurements for each site (will be averaged)
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* --- FIX START: Pass props to MeasurementGroup --- */}
							<MeasurementGroup
								label="Height"
								field="height"
								values={measurements.height}
								average={results.averages.height}
								updateMeasurement={updateMeasurement}
							/>
							<MeasurementGroup
								label="Neck"
								field="neck"
								values={measurements.neck}
								average={results.averages.neck}
								updateMeasurement={updateMeasurement}
							/>
							<MeasurementGroup
								label="Waist"
								field="waist"
								values={measurements.waist}
								average={results.averages.waist}
								updateMeasurement={updateMeasurement}
							/>
							<MeasurementGroup
								label="Hip"
								field="hip"
								show={gender === "female"}
								values={measurements.hip}
								average={results.averages.hip}
								updateMeasurement={updateMeasurement}
							/>
							{/* --- FIX END --- */}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Skinfold Measurements</CardTitle>
							<CardDescription>
								Enter three measurements for each site (will be averaged)
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* --- FIX START: Pass props to MeasurementGroup --- */}
							{gender === "male" && (
								<>
									<MeasurementGroup
										label="Pectoral"
										field="pectoral"
										unit="mm"
										values={measurements.pectoral}
										average={results.averages.pectoral}
										updateMeasurement={updateMeasurement}
									/>
									<MeasurementGroup
										label="Abdominal"
										field="abdominal"
										unit="mm"
										values={measurements.abdominal}
										average={results.averages.abdominal}
										updateMeasurement={updateMeasurement}
									/>
									<MeasurementGroup
										label="Thigh"
										field="thigh"
										unit="mm"
										values={measurements.thigh}
										average={results.averages.thigh}
										updateMeasurement={updateMeasurement}
									/>
								</>
							)}
							{gender === "female" && (
								<>
									<MeasurementGroup
										label="Triceps"
										field="triceps"
										unit="mm"
										values={measurements.triceps}
										average={results.averages.triceps}
										updateMeasurement={updateMeasurement}
									/>
									<MeasurementGroup
										label="Suprailiac"
										field="suprailiac"
										unit="mm"
										values={measurements.suprailiac}
										average={results.averages.suprailiac}
										updateMeasurement={updateMeasurement}
									/>
									<MeasurementGroup
										label="Thigh"
										field="thigh"
										unit="mm"
										values={measurements.thigh}
										average={results.averages.thigh}
										updateMeasurement={updateMeasurement}
									/>
								</>
							)}
							{/* --- FIX END --- */}
							<div className="space-y-2">
								<Label className="text-sm font-medium">Age (years)</Label>
								<Input
									type="number"
									placeholder="Enter age"
									value={measurements.age}
									onChange={(e) => updateMeasurement("age", 0, e.target.value)}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex justify-center">
					<Button onClick={calculateBodyFat} size="lg" className="px-8">
						Calculate Body Fat Percentage
					</Button>
				</div>

				{errors.length > 0 && (
					<Alert variant="destructive">
						<AlertDescription>
							<ul className="list-disc list-inside space-y-1">
								{errors.map((error, index) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</AlertDescription>
					</Alert>
				)}

				{(results.military !== null ||
					results.navy !== null ||
					results.jacksonPollock !== null) && (
					<Card>
						<CardHeader>
							<CardTitle>Results</CardTitle>
							<CardDescription>
								Body fat percentage calculations
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
								{results.military !== null && (
									<div className="text-center p-4 bg-muted rounded-lg">
										<h3 className="font-semibold text-sm">Military Method</h3>
										<p className="text-2xl font-bold text-primary">
											{results.military.toFixed(1)}%
										</p>
									</div>
								)}

								{results.navy !== null && (
									<div className="text-center p-4 bg-muted rounded-lg">
										<h3 className="font-semibold text-sm">Navy Method</h3>
										<p className="text-2xl font-bold text-primary">
											{results.navy.toFixed(1)}%
										</p>
									</div>
								)}

								{results.jacksonPollock !== null && (
									<div className="text-center p-4 bg-muted rounded-lg">
										<h3 className="font-semibold text-sm">Jackson & Pollock</h3>
										<p className="text-2xl font-bold text-primary">
											{results.jacksonPollock.toFixed(1)}%
										</p>
									</div>
								)}

								{results.adjusted !== null && (
									<div className="text-center p-4 bg-primary text-primary-foreground rounded-lg">
										<h3 className="font-semibold text-sm">Adjusted Average</h3>
										<p className="text-2xl font-bold">
											{results.adjusted.toFixed(1)}%
										</p>
									</div>
								)}
							</div>

							<Separator />

							<div>
								<h4 className="font-semibold mb-2">Measurement Averages</h4>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
									{Object.entries(results.averages).map(([key, value]) => {
										if (value === null) return null;
										const unit = [
											"pectoral",
											"abdominal",
											"thigh",
											"triceps",
											"suprailiac",
										].includes(key)
											? "mm"
											: "in";
										return (
											<div key={key} className="flex justify-between">
												<span className="capitalize">{key}:</span>
												<span>
													{value.toFixed(1)} {unit}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
