import { BFPResults, MeasurementAverages } from "@/types/types";
import { Separator } from "@radix-ui/react-separator";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

interface ResultsDisplayProps {
	results: BFPResults;
	averages: MeasurementAverages;
	errors: string[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
	results,
	averages,
	errors,
}) => {
	const hasResults = Object.values(results).some((r) => r !== null);
	if (!hasResults && errors.length === 0) return null;

	const ResultCard = ({
		title,
		value,
		isPrimary = false,
		unit = "%",
	}: {
		title: string;
		value: number | null;
		isPrimary?: boolean;
		unit?: string;
	}) => {
		if (value === null) return null;
		const cardClasses = isPrimary
			? "bg-primary text-primary-foreground"
			: "bg-muted";
		return (
			<div className={`text-center p-4 rounded-lg ${cardClasses}`}>
				<h3 className="font-semibold text-sm">{title}</h3>
				<p className="text-2xl font-bold">
					{value.toFixed(1)}
					{unit}
				</p>
			</div>
		);
	};

	const hasAverages = Object.values(averages).some((a) => a !== null);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Results</CardTitle>
				<CardDescription>
					Body composition calculations based on your measurements.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
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
				{hasResults && (
					<>
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
							<ResultCard
								title="Adjusted BFP"
								value={results.adjusted}
								isPrimary
							/>
							<ResultCard title="Navy BFP" value={results.navy} />
							<ResultCard title="Military BFP" value={results.military} />
							<ResultCard
								title="Jackson/Pollock"
								value={results.jacksonPollock}
							/>
						</div>
						{(results.ffmi !== null || results.adjustedFfmi !== null) && (
							<>
								<Separator />
								<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
									<ResultCard
										title="Adjusted FFMI"
										value={results.adjustedFfmi}
										isPrimary
										unit=""
									/>
									<ResultCard title="FFMI" value={results.ffmi} unit="" />
								</div>
								<Alert variant="default" className="mt-4">
									<Info className="h-4 w-4" />
									<AlertDescription className="text-xs">
										FFMI (Fat-Free Mass Index) indicates muscle mass relative to
										height. Adjusted FFMI normalizes this for a height of 1.8m
										(5'11"). An adjusted FFMI over 25 is difficult to achieve
										naturally.
									</AlertDescription>
								</Alert>
							</>
						)}
					</>
				)}

				{hasResults && hasAverages && <Separator />}

				{hasAverages && (
					<div>
						<h4 className="font-semibold mb-2">Your Measurement Averages</h4>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm text-muted-foreground">
							{Object.entries(averages).map(([key, value]) => {
								if (value === null) return null;
								const isSkinfold = [
									"pectoral",
									"abdominal",
									"thigh",
									"triceps",
									"suprailiac",
								].includes(key);
								let unit = isSkinfold ? "mm" : "in";
								if (key === "weight") unit = "lbs";
								if (key === "age") unit = "yrs";

								return (
									<div
										key={key}
										className="flex justify-between border-b border-dashed"
									>
										<span className="capitalize">{key}:</span>
										<span className="font-medium text-foreground">
											{value.toFixed(key === "age" || key === "weight" ? 0 : 1)}{" "}
											{unit}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default ResultsDisplay;
