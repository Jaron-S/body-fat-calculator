"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface MeasurementInputs {
  height: [string, string, string]
  neck: [string, string, string]
  waist: [string, string, string]
  hip: [string, string, string]
  pectoral: [string, string, string]
  abdominal: [string, string, string]
  thigh: [string, string, string]
  age: string
}

interface Results {
  military: number | null
  navy: number | null
  jacksonPollock: number | null
  adjusted: number | null
  averages: {
    height: number | null
    neck: number | null
    waist: number | null
    hip: number | null
    pectoral: number | null
    abdominal: number | null
    thigh: number | null
  }
}

export default function BodyFatCalculator() {
  const [gender, setGender] = useState<"male" | "female">("male")
  const [measurements, setMeasurements] = useState<MeasurementInputs>({
    height: ["", "", ""],
    neck: ["", "", ""],
    waist: ["", "", ""],
    hip: ["", "", ""],
    pectoral: ["", "", ""],
    abdominal: ["", "", ""],
    thigh: ["", "", ""],
    age: "",
  })
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
    },
  })
  const [errors, setErrors] = useState<string[]>([])

  const calculateAverage = (values: [string, string, string]): number | null => {
    const nums = values.map((v) => Number.parseFloat(v)).filter((n) => !isNaN(n))
    if (nums.length === 0) return null
    return nums.reduce((sum, n) => sum + n, 0) / nums.length
  }

  const calculateBodyFat = () => {
    const newErrors: string[] = []

    // Calculate averages
    const avgHeight = calculateAverage(measurements.height)
    const avgNeck = calculateAverage(measurements.neck)
    const avgWaist = calculateAverage(measurements.waist)
    const avgHip = calculateAverage(measurements.hip)
    const avgPectoral = calculateAverage(measurements.pectoral)
    const avgAbdominal = calculateAverage(measurements.abdominal)
    const avgThigh = calculateAverage(measurements.thigh)
    const age = Number.parseFloat(measurements.age)

    const newAverages = {
      height: avgHeight,
      neck: avgNeck,
      waist: avgWaist,
      hip: avgHip,
      pectoral: avgPectoral,
      abdominal: avgAbdominal,
      thigh: avgThigh,
    }

    let military: number | null = null
    let navy: number | null = null
    let jacksonPollock: number | null = null

    // Military Method
    if (avgWaist && avgNeck && avgHeight) {
      const waistMinusNeck = avgWaist - avgNeck
      if (waistMinusNeck <= 0) {
        newErrors.push("Waist measurement must be greater than neck measurement for Military method")
      } else {
        military = 86.01 * Math.log10(waistMinusNeck) - 70.041 * Math.log10(avgHeight) + 36.76
      }
    } else {
      newErrors.push("Height, neck, and waist measurements required for Military method")
    }

    // Navy Method
    if (gender === "male") {
      if (avgWaist && avgNeck && avgHeight) {
        const waistMinusNeck = avgWaist - avgNeck
        if (waistMinusNeck <= 0) {
          newErrors.push("Waist measurement must be greater than neck measurement for Navy method")
        } else {
          navy = 495 / (1.0324 - 0.19077 * Math.log10(waistMinusNeck) + 0.15456 * Math.log10(avgHeight)) - 450
        }
      } else {
        newErrors.push("Height, neck, and waist measurements required for Navy method (Male)")
      }
    } else {
      if (avgWaist && avgHip && avgNeck && avgHeight) {
        const waistPlusHipMinusNeck = avgWaist + avgHip - avgNeck
        if (waistPlusHipMinusNeck <= 0) {
          newErrors.push("Waist + Hip must be greater than neck measurement for Navy method")
        } else {
          navy = 495 / (1.29579 - 0.35004 * Math.log10(waistPlusHipMinusNeck) + 0.221 * Math.log10(avgHeight)) - 450
        }
      } else {
        newErrors.push("Height, neck, waist, and hip measurements required for Navy method (Female)")
      }
    }

    // Jackson & Pollock 3-Site (Male only as specified)
    if (gender === "male") {
      if (avgPectoral && avgAbdominal && avgThigh && !isNaN(age)) {
        const sumOfSkinfolds = avgPectoral + avgAbdominal + avgThigh
        const db = 1.112 - 0.00043499 * sumOfSkinfolds + 0.00000055 * Math.pow(sumOfSkinfolds, 2) - 0.00028826 * age
        if (db <= 0) {
          newErrors.push("Invalid density calculation for Jackson & Pollock method")
        } else {
          jacksonPollock = 495 / db - 450
        }
      } else {
        newErrors.push("Pectoral, abdominal, thigh skinfolds and age required for Jackson & Pollock method")
      }
    }

    // Calculate adjusted body fat percentage
    let adjusted: number | null = null
    if (military !== null && navy !== null && jacksonPollock !== null) {
      adjusted = ((navy + military) / 2 + jacksonPollock) / 2
    }

    setResults({
      military,
      navy,
      jacksonPollock,
      adjusted,
      averages: newAverages,
    })
    setErrors(newErrors)
  }

  const updateMeasurement = (field: keyof MeasurementInputs, index: number, value: string) => {
    if (field === "age") {
      setMeasurements((prev) => ({ ...prev, age: value }))
    } else {
      setMeasurements((prev) => ({
        ...prev,
        [field]: prev[field].map((v, i) => (i === index ? value : v)) as [string, string, string],
      }))
    }
  }

  const MeasurementGroup = ({
    label,
    field,
    unit = "in",
    show = true,
  }: {
    label: string
    field: keyof Omit<MeasurementInputs, "age">
    unit?: string
    show?: boolean
  }) => {
    if (!show) return null

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {label} ({unit})
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <Input
                type="number"
                step="0.1"
                placeholder={`${label} ${index + 1}`}
                value={measurements[field][index]}
                onChange={(e) => updateMeasurement(field, index, e.target.value)}
                className="text-sm"
              />
            </div>
          ))}
        </div>
        {results.averages[field] && (
          <p className="text-xs text-muted-foreground">
            Average: {results.averages[field]?.toFixed(1)} {unit}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Body Fat Calculator</h1>
          <p className="text-muted-foreground">
            Calculate body fat percentage using Military, Navy, and Jackson & Pollock methods
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Select your gender to show relevant measurement fields</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={gender} onValueChange={(value) => setGender(value as "male" | "female")}>
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
              <CardDescription>Enter three measurements for each site (will be averaged)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MeasurementGroup label="Height" field="height" />
              <MeasurementGroup label="Neck" field="neck" />
              <MeasurementGroup label="Waist" field="waist" />
              <MeasurementGroup label="Hip" field="hip" show={gender === "female"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skinfold Measurements</CardTitle>
              <CardDescription>
                {gender === "male" ? "Required for Jackson & Pollock method" : "Not used for female calculations"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gender === "male" && (
                <>
                  <MeasurementGroup label="Pectoral" field="pectoral" unit="mm" />
                  <MeasurementGroup label="Abdominal" field="abdominal" unit="mm" />
                  <MeasurementGroup label="Thigh" field="thigh" unit="mm" />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Age (years)</Label>
                    <Input
                      type="number"
                      placeholder="Enter age"
                      value={measurements.age}
                      onChange={(e) => updateMeasurement("age", 0, e.target.value)}
                    />
                  </div>
                </>
              )}
              {gender === "female" && (
                <p className="text-sm text-muted-foreground">
                  Jackson & Pollock method is only available for males in this calculator.
                </p>
              )}
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

        {(results.military !== null || results.navy !== null || results.jacksonPollock !== null) && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Body fat percentage calculations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.military !== null && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold text-sm">Military Method</h3>
                    <p className="text-2xl font-bold text-primary">{results.military.toFixed(1)}%</p>
                  </div>
                )}

                {results.navy !== null && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold text-sm">Navy Method</h3>
                    <p className="text-2xl font-bold text-primary">{results.navy.toFixed(1)}%</p>
                  </div>
                )}

                {results.jacksonPollock !== null && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold text-sm">Jackson & Pollock</h3>
                    <p className="text-2xl font-bold text-primary">{results.jacksonPollock.toFixed(1)}%</p>
                  </div>
                )}

                {results.adjusted !== null && (
                  <div className="text-center p-4 bg-primary text-primary-foreground rounded-lg">
                    <h3 className="font-semibold text-sm">Adjusted Average</h3>
                    <p className="text-2xl font-bold">{results.adjusted.toFixed(1)}%</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Measurement Averages</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {Object.entries(results.averages).map(([key, value]) => {
                    if (value === null) return null
                    const unit = ["pectoral", "abdominal", "thigh"].includes(key) ? "mm" : "in"
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key}:</span>
                        <span>
                          {value.toFixed(1)} {unit}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
