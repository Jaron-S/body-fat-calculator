import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

const Instructions: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);

	const InstructionSection = ({
		title,
		items,
	}: {
		title: string;
		items: { term: string; def: string }[];
	}) => (
		<div>
			<h4 className="font-semibold mb-2">{title}</h4>
			<ul className="text-sm space-y-2 text-muted-foreground">
				{items.map((item) => (
					<li key={item.term}>
						<strong>{item.term}:</strong> {item.def}
					</li>
				))}
			</ul>
		</div>
	);

	const generalRule =
		"For all measurements, use a flexible tape measure for circumferences and skinfold calipers for skinfolds. Take all measurements on the right side of the body. Take three readings at each site, without letting go of the skinfold, and use the average. Ensure the tape is snug but not compressing the skin.";

	const maleCircumference = [
		{
			term: "Neck",
			def: "Measure just below the larynx (Adam's apple), keeping the tape level.",
		},
		{
			term: "Waist",
			def: "Measure horizontally at the navel level, at the end of a normal exhale.",
		},
		{
			term: "Height",
			def: "Measure without shoes, standing straight against a wall.",
		},
	];
	const maleSkinfolds = [
		{
			term: "Pectoral (Chest)",
			def: "Take a diagonal fold halfway between the nipple and the anterior axillary line (front of the armpit).",
		},
		{
			term: "Abdominal",
			def: "Take a vertical fold 2 cm (about 1 inch) to the right of the navel.",
		},
		{
			term: "Thigh",
			def: "Take a vertical fold on the front of the thigh, midway between the hip and the top of the kneecap.",
		},
	];
	const femaleCircumference = [
		...maleCircumference.slice(0, 1), // Neck
		{
			term: "Waist",
			def: "Measure at the narrowest point of the abdomen, at the end of a normal exhale.",
		},
		{
			term: "Hips",
			def: "Measure at the widest part of your hips/buttocks, keeping the tape level.",
		},
		...maleCircumference.slice(2), // Height
	];
	const femaleSkinfolds = [
		{
			term: "Triceps",
			def: "Take a vertical fold on the back of the upper arm, halfway between the shoulder and the elbow.",
		},
		{
			term: "Suprailiac",
			def: "Take a diagonal fold just above the front-top of the hip bone (iliac crest).",
		},
		{
			term: "Thigh",
			def: "Take a vertical fold on the front of the thigh, midway between the hip and the top of the kneecap.",
		},
	];

	return (
		<Card>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<CardHeader className="cursor-pointer flex flex-row items-center justify-between">
						<div className="flex items-center gap-3">
							<Info className="h-6 w-6 text-primary" />
							<div>
								<CardTitle>Measurement Instructions</CardTitle>
								<CardDescription>
									Click to view detailed guidelines for accurate results.
								</CardDescription>
							</div>
						</div>
						{isOpen ? (
							<ChevronDown className="h-5 w-5" />
						) : (
							<ChevronRight className="h-5 w-5" />
						)}
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent className="pt-4 space-y-6">
						<Alert>
							<AlertDescription>{generalRule}</AlertDescription>
						</Alert>
						<div className="grid md:grid-cols-2 gap-6">
							<Card className="bg-muted/40">
								<CardHeader>
									<CardTitle className="text-lg">Male Instructions</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<InstructionSection
										title="Circumference (inches)"
										items={maleCircumference}
									/>
									<InstructionSection
										title="Skinfolds (millimeters)"
										items={maleSkinfolds}
									/>
								</CardContent>
							</Card>
							<Card className="bg-muted/40">
								<CardHeader>
									<CardTitle className="text-lg">Female Instructions</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<InstructionSection
										title="Circumference (inches)"
										items={femaleCircumference}
									/>
									<InstructionSection
										title="Skinfolds (millimeters)"
										items={femaleSkinfolds}
									/>
								</CardContent>
							</Card>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
};

export default Instructions;
