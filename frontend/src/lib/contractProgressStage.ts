export const CONTRACT_PROGRESS_STAGES = [
  { code: "doc_wait", label: "서류접수대기" },
  { code: "doc_request", label: "서류접수요청" },
  { code: "credit_approved", label: "신용승인완료" },
  { code: "installment_denied", label: "할부불가" },
  { code: "install_wait", label: "설치대기" },
  { code: "install_hold", label: "설치보류" },
  { code: "installing", label: "설치중" },
  { code: "activation_wait", label: "개통대기" },
  { code: "activation_complete", label: "개통완료" },
  { code: "cancel_after_activation", label: "개통후취소" },
  { code: "cancel_before_activation", label: "개통전취소" },
  { code: "customer_cancel", label: "고객취소" },
] as const;

export type ContractProgressStageCode = (typeof CONTRACT_PROGRESS_STAGES)[number]["code"];

const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  CONTRACT_PROGRESS_STAGES.map((stage) => [stage.code, stage.label])
);

const LEGACY_STAGE_LABELS: Record<string, string> = {
  consult: "서류접수대기",
};

export const ALL_CONTRACT_PROGRESS_STAGE_CODES = CONTRACT_PROGRESS_STAGES.map((stage) => stage.code);

export function contractProgressStageLabel(code: string | null | undefined): string {
  if (!code) return "-";
  return STAGE_LABELS[code] ?? LEGACY_STAGE_LABELS[code] ?? code;
}

export function normalizeProgressStageCode(code: string | null | undefined): string {
  if (!code || code === "consult") return "doc_wait";
  return code;
}
