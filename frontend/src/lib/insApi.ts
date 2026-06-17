import { API_URL, INS_API_URL } from "./config";
import { getToken } from "./auth";

const INS_API_BASE = `${API_URL}/api/ins`;

export interface InstallConfirmationProduct {
  item: string;
  model: string;
  requested: string;
  installed: string;
}

export interface InstallConfirmationDiagramMarker {
  id: string;
  type: string;
  x: number;
  y: number;
}

export interface InstallConfirmationData {
  constructionMethod: string | null;
  ddns: string | null;
  deliveryNotes: string | null;
  installDesiredAt1?: string | null;
  installDesiredAt2?: string | null;
  installDesiredAt3?: string | null;
  products: InstallConfirmationProduct[];
  diagramMarkers: InstallConfirmationDiagramMarker[];
  termsConfirmed: boolean;
  salesDealerName: string | null;
  designerName: string | null;
  designerPhone: string | null;
  contractorSign: string | null;
  installerName: string | null;
}

export interface CompletionPhoto {
  id: string;
  fileName: string;
  storedPath: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedAt: string;
}

export interface InstallCompletionData {
  completionDate: string | null;
  completionNotes: string | null;
  constructionCompany: string | null;
  constructionWorker: string | null;
  salesDealerName: string | null;
  products: InstallConfirmationProduct[];
  termsConfirmed: boolean;
  contractorSign: string | null;
  inspectorSign: string | null;
  completionPhotos?: CompletionPhoto[];
}

export interface CreatedCustomer {
  id: string;
  customerNo: string;
  installNo?: string;
  userType: string;
  serviceType: string | null;
  name: string | null;
  phone: string | null;
  mobile: string | null;
  companyName: string | null;
  zipCode?: string | null;
  address?: string | null;
  addressDetail?: string | null;
  recorderChannels?: number;
  recorderCount?: number;
  cctvCount?: number;
  parkingBarrierCount?: number;
  tableOrderCount?: number;
  kioskCount?: number;
  memo?: string | null;
  salesDealerName?: string | null;
  installConfirmation?: InstallConfirmationData | null;
  installCompletion?: InstallCompletionData | null;
  progressStageCode?: string;
  createdAt: string;
}

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) return {} as { error?: string } & Record<string, unknown>;

  try {
    return JSON.parse(text) as { error?: string } & Record<string, unknown>;
  } catch {
    const hint =
      text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")
        ? " JK-INS API 서버(기본 4000) 실행 여부를 확인하세요."
        : "";
    throw new Error(`서버 응답을 해석할 수 없습니다.${hint}`);
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getCustomers(params?: { q?: string }) {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  const query = search.toString();

  const res = await fetch(
    `${INS_API_BASE}/customers/list${query ? `?${query}` : ""}`,
    { headers: authHeaders() },
  );
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error ?? "시공 목록을 불러올 수 없습니다.");
  return (data.customers as CreatedCustomer[]) ?? [];
}

export async function updateCustomerInstallConfirmation(
  id: string,
  installConfirmation: InstallConfirmationData,
) {
  const res = await fetch(`${INS_API_BASE}/customers/${id}/install-confirmation`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(installConfirmation),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error ?? "설치확인서 저장에 실패했습니다.");
  return data.customer as CreatedCustomer;
}

export async function updateCustomerInstallCompletion(
  id: string,
  installCompletion: InstallCompletionData,
) {
  const res = await fetch(`${INS_API_BASE}/customers/${id}/install-completion`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(installCompletion),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error ?? "준공확인서 저장에 실패했습니다.");
  return data.customer as CreatedCustomer;
}

export async function uploadCustomerCompletionPhoto(
  customerId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();

  const res = await fetch(
    `${INS_API_URL}/api/customers/${customerId}/install-completion/photos`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error ?? "준공사진 업로드에 실패했습니다.");
  return data.customer as CreatedCustomer;
}

export async function deleteCustomerCompletionPhoto(
  customerId: string,
  photoId: string,
) {
  const res = await fetch(
    `${INS_API_BASE}/customers/${customerId}/install-completion/photos/${photoId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
  );
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error ?? "준공사진 삭제에 실패했습니다.");
  return data.customer as CreatedCustomer;
}

export async function fetchCustomerCompletionPhoto(
  customerId: string,
  photoId: string,
) {
  const token = getToken();
  const res = await fetch(
    `${INS_API_URL}/api/customers/${customerId}/install-completion/photos/${photoId}/file?disposition=inline`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (!res.ok) {
    const data = await parseJson(res);
    throw new Error(data.error ?? "준공사진을 불러올 수 없습니다.");
  }
  return res.blob();
}
