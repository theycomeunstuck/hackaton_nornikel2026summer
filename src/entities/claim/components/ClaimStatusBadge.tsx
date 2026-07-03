import type { ClaimStatus } from "../../../shared/lib/claimStats";
import { StatusBadge } from "../../../shared/ui/StatusBadge";

type ClaimStatusBadgeProps = {
  status: ClaimStatus;
};

const statusLabel: Record<ClaimStatus, string> = {
  confirmed: "confirmed",
  weakly_supported: "weak support",
  conflicting: "conflicting",
  new: "new",
  needs_review: "needs review",
};

export function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  if (status === "confirmed") {
    return <StatusBadge label={statusLabel[status]} tone="success" />;
  }

  if (status === "conflicting") {
    return <StatusBadge label={statusLabel[status]} tone="danger" />;
  }

  if (status === "needs_review" || status === "weakly_supported") {
    return <StatusBadge label={statusLabel[status]} tone="warning" />;
  }

  return <StatusBadge label={statusLabel[status]} tone="info" />;
}
