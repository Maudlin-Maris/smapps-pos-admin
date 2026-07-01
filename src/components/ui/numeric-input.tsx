import * as React from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { Input } from "./input";

export interface NumericInputProps extends Omit<
  NumericFormatProps,
  "customInput" | "onChange"
> {
  min?: number;
  max?: number;
  precision?: number;
  onChange?: (value: number | null, stringValue: string) => void;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, min, max, precision, onChange, ...props }, ref) => {
    const isAllowed = React.useCallback(
      (values: any) => {
        const { floatValue } = values;
        if (floatValue === undefined) return true;
        if (min !== undefined && floatValue < min) return false;
        if (max !== undefined && floatValue > max) return false;
        return true;
      },
      [min, max],
    );

    return (
      <NumericFormat
        getInputRef={ref}
        customInput={Input}
        className={className}
        decimalScale={precision}
        thousandSeparator
        allowNegative={min === undefined ? true : min >= 0 ? false : true}
        isAllowed={props.isAllowed || isAllowed}
        onValueChange={(values) => {
          if (onChange) {
            onChange(values.floatValue ?? null, values.value);
          }
        }}
        {...props}
      />
    );
  },
);

NumericInput.displayName = "NumericInput";

export { NumericInput };
