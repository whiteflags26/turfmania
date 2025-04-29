import { JSX } from 'react';
import { TooltipProps } from 'recharts';

export function CustomTooltip({
  payload,
  label,
}: TooltipProps<number, string>): JSX.Element | null {
  // Use optional chaining to check if payload exists and has length
  if (!payload?.length) return null;

  return (
    <div className="text-sm">
      <p className="font-medium text-slate-700">{label} Stars</p>
      <p className="text-slate-600">{payload[0]?.value ?? 0} Reviews</p>
    </div>
  );
}
