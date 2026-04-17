import type { PayrollStatus } from '../../types/payroll';

interface PayrollStatusBadgeProps {
  status: PayrollStatus;
}

export default function PayrollStatusBadge({ status }: PayrollStatusBadgeProps) {
  let badgeClasses = 'px-2 py-1 text-xs font-medium rounded-full ';
  let label = '';

  switch (status) {
    case 'DRAFT':
      badgeClasses += 'bg-gray-100 text-gray-800 border border-gray-200';
      label = 'Nháp';
      break;
    case 'CALCULATED':
      badgeClasses += 'bg-blue-100 text-blue-800 border border-blue-200';
      label = 'Đã chốt';
      break;
    case 'APPROVED':
      badgeClasses += 'bg-green-100 text-green-800 border border-green-200';
      label = 'Đã duyệt';
      break;
    default:
      badgeClasses += 'bg-gray-100 text-gray-800';
      label = status;
  }

  return (
    <span className={badgeClasses}>
      {label}
    </span>
  );
}
