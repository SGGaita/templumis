import EditNoteIcon from "@mui/icons-material/EditNote";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CancelIcon from "@mui/icons-material/Cancel";
import GavelIcon from "@mui/icons-material/Gavel";
import { ST } from "@/lib/staffTheme";

const AWARD_STAGES = {
  proposed: "Awaiting final approval",
  approved: "Approved — preparing offer",
  offer_sent: "Offer received — action required",
  offer_accepted: "Offer accepted",
  offer_declined: "Offer declined",
  offer_expired: "Offer expired",
  credited: "Applied to tuition",
};

export function workflowLabel(app) {
  if (app?.workflow_label) return app.workflow_label;
  if (app?.award_stage && AWARD_STAGES[app.award_stage]) return AWARD_STAGES[app.award_stage];
  return app?.status || "Under review";
}

export function workflowChipStyle(app) {
  const stage = app?.award_stage;
  const status = String(app?.status || "").toLowerCase();

  if (stage === "credited" || status === "awarded") {
    return { bg: ST.colors.successLight, color: ST.colors.success, icon: AccountBalanceIcon };
  }
  if (stage === "offer_sent") {
    return { bg: ST.colors.warningLight, color: ST.colors.warning, icon: MailOutlineIcon };
  }
  if (stage === "offer_accepted") {
    return { bg: ST.colors.infoLight, color: ST.colors.info, icon: CheckCircleIcon };
  }
  if (stage === "offer_declined" || stage === "offer_expired") {
    return { bg: ST.colors.errorLight, color: ST.colors.error, icon: CancelIcon };
  }
  if (stage === "proposed" || stage === "approved") {
    return { bg: ST.colors.infoLight, color: ST.colors.info, icon: GavelIcon };
  }
  if (status === "draft") {
    return { bg: ST.colors.infoLight, color: ST.colors.info, icon: EditNoteIcon };
  }
  if (status === "submitted for review") {
    return { bg: ST.colors.warningLight, color: ST.colors.warning, icon: HourglassEmptyIcon };
  }
  return { bg: ST.colors.bg, color: ST.colors.textSecondary, icon: HourglassEmptyIcon };
}

export function staffAwardChipStyle(label) {
  const l = String(label || "").toLowerCase();
  if (l.includes("credited")) return { bg: ST.colors.successLight, color: ST.colors.success };
  if (l.includes("offer sent") || l.includes("accepted")) return { bg: ST.colors.infoLight, color: ST.colors.info };
  if (l === "proposed") return { bg: ST.colors.warningLight, color: ST.colors.warning };
  if (l.includes("declined") || l.includes("expired") || l.includes("over budget")) {
    return { bg: ST.colors.errorLight, color: ST.colors.error };
  }
  return { bg: ST.colors.bg, color: ST.colors.textSecondary };
}
