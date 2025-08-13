import { MeasurementInputs, MeasurementTuple } from "@/types/types";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";

interface MeasurementGroupProps {
	label: string;
	field: keyof Omit<MeasurementInputs, "age">;
	unit?: string;
	values: MeasurementTuple;
	average: number | null;
	updateMeasurement: (
		field: keyof Omit<MeasurementInputs, "age">,
		index: number,
		value: string
	) => void;
}

const MeasurementInputGroup: React.FC<MeasurementGroupProps> = ({
	label,
	field,
	unit = "in",
	values,
	average,
	updateMeasurement,
}) => (
	<fieldset className="space-y-2">
		<legend className="text-sm font-medium">
			{label} ({unit})
		</legend>
		<div className="grid grid-cols-3 gap-x-4 gap-y-2 pt-2">
			{values.map((value, index) => {
				const inputId = `${field}-${index}`;
				return (
					// ACCESSIBILITY: Each input now has its own div containing a label and the input.
					<div key={inputId} className="flex flex-col space-y-1">
						<Label htmlFor={inputId} className="text-xs text-muted-foreground">
							{`Reading ${index + 1}`}
						</Label>
						<Input
							id={inputId}
							type="number"
							step="0.1"
							placeholder="0.0"
							aria-label={`${label} Reading ${index + 1}`}
							value={value}
							onChange={(e) => updateMeasurement(field, index, e.target.value)}
							className="text-sm"
						/>
					</div>
				);
			})}
		</div>
		{average !== null && (
			// ACCESSIBILITY: Using aria-live lets screen readers announce the average when it's calculated.
			<p className="text-xs text-muted-foreground pt-1" aria-live="polite">
				Average: {average.toFixed(1)} {unit}
			</p>
		)}
	</fieldset>
);

export default MeasurementInputGroup;
