"use client";

import { FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useEnumLabel } from "./bits";

type EnumSelectProps = {
  group: string;
  values: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

/** A Select over a backend enum, with translated labels. Use inside a FormItem. */
export function EnumSelect({ group, values, value, onChange }: EnumSelectProps) {
  const label = useEnumLabel();
  return (
    <Select value={value} onValueChange={onChange}>
      <FormControl>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </FormControl>
      <SelectContent className="max-h-72">
        {values.map((v) => (
          <SelectItem key={v} value={v}>
            {label(group, v)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
