"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import type {
  CreatedCustomer,
  InstallConfirmationData,
} from "@/lib/insApi";
import { updateCustomerInstallConfirmation } from "@/lib/insApi";
import { formatPhoneInput } from "@/lib/formatPhone";

const CONSTRUCTION_METHODS = ["TVI전용", "동축", "UTP", "기타"] as const;

const CONFIRMATION_ITEMS = [
  "고객님과 카메라 설치위치, 방향을 확인하였습니다.",
  "설치 후 카메라 동작, 활용방법에 대해 충분히 설명하였습니다.",
  "인터넷,공유기,모뎀등의 변경 및 파손으로 장비고장,설치사실을 변경하시면 A/S를 받으실수 없습니다.",
  "천재지변,소비자과실은 A/S는 유상입니다.",
  "설치후 1년간은 무상 A/S를 받으실 수 있습니다. (단, 소비자 과실등은 유상입니다.)",
  "토, 일요일, 공휴일은 A/S 서비스를 제공하지 않습니다.",
  "A/S 접수시 원격지원을 1차적으로 진행합니다.",
  "공유기/인터넷/전원플러그를 확인해야 하는 경우는 유상으로 출장합니다.",
];

interface ProductRow {
  item: string;
  model: string;
  requested: string;
  installed: string;
}

function formatDisplayPhone(value: string | null | undefined) {
  if (!value?.trim()) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 9) return formatPhoneInput(digits);
  return value.trim();
}

function displayContractorName(customer: CreatedCustomer) {
  if (customer.userType === "individual") return customer.name || "";
  if (customer.companyName && customer.name)
    return `${customer.companyName} (${customer.name})`;
  return customer.companyName || customer.name || "";
}

function formatInstallAddress(customer: CreatedCustomer) {
  const zip = customer.zipCode ? `(${customer.zipCode}) ` : "";
  const parts = [customer.address, customer.addressDetail].filter(Boolean);
  return zip + parts.join(" ");
}

function buildProductRows(customer: CreatedCustomer): ProductRow[] {
  const rows: ProductRow[] = [];

  if (customer.recorderCount) {
    const channelLabel = customer.recorderChannels
      ? `${customer.recorderChannels}CH `
      : "2MP ";
    rows.push({
      item: `${channelLabel}녹화기`,
      model: "",
      requested: String(customer.recorderCount),
      installed: "",
    });
  }
  if (customer.cctvCount) {
    rows.push({
      item: "CCTV 카메라",
      model: "",
      requested: String(customer.cctvCount),
      installed: "",
    });
  }
  if (customer.parkingBarrierCount) {
    rows.push({
      item: "주차 차단기",
      model: "",
      requested: String(customer.parkingBarrierCount),
      installed: "",
    });
  }
  if (customer.tableOrderCount) {
    rows.push({
      item: "테이블 오더",
      model: "",
      requested: String(customer.tableOrderCount),
      installed: "",
    });
  }
  if (customer.kioskCount) {
    rows.push({
      item: "키오스크",
      model: "",
      requested: String(customer.kioskCount),
      installed: "",
    });
  }

  if (rows.length === 0) {
    rows.push({ item: "", model: "", requested: "", installed: "" });
  }

  return rows;
}

function formatProductSummary(rows: ProductRow[]) {
  return rows
    .filter((row) => row.item.trim())
    .map((row) => {
      const qty = row.requested.trim();
      return qty ? `${row.item} ${qty}` : row.item;
    })
    .join(" · ");
}

type DiagramMarkerType =
  | "dvr"
  | "indoor"
  | "outdoor"
  | "monitor"
  | "router"
  | "barrier"
  | "kiosk";

interface DiagramMarker {
  id: string;
  type: DiagramMarkerType;
  x: number;
  y: number;
}

const DIAGRAM_MARKER_DRAG_TYPE = "application/x-install-diagram-marker";

const DIAGRAM_TOOLS: { type: DiagramMarkerType; label: string }[] = [
  { type: "dvr", label: "녹화기" },
  { type: "indoor", label: "실내IR" },
  { type: "outdoor", label: "실외IR" },
  { type: "monitor", label: "모니터" },
  { type: "router", label: "공유기" },
  { type: "barrier", label: "차단기" },
  { type: "kiosk", label: "키오스크" },
];

const VALID_DIAGRAM_MARKER_TYPES = new Set(
  DIAGRAM_TOOLS.map((tool) => tool.type),
);

function isDiagramMarkerType(value: string): value is DiagramMarkerType {
  return VALID_DIAGRAM_MARKER_TYPES.has(value as DiagramMarkerType);
}

interface InstallFormState {
  constructionMethod: string;
  deliveryNotes: string;
  ddns: string;
  models: string[];
  installedQtys: string[];
  termsConfirmed: boolean;
  designerName: string;
  designerPhone: string;
  salesDealerName: string;
  contractorSign: string;
  installerName: string;
  diagramMarkers: DiagramMarker[];
}

function mergeProductField(
  productRows: ProductRow[],
  savedProducts: InstallConfirmationData["products"] | undefined,
  field: "model" | "installed",
) {
  return productRows.map((row, index) => {
    const byIndex = savedProducts?.[index];
    if (byIndex && byIndex.item === row.item) {
      return field === "model" ? byIndex.model : byIndex.installed;
    }
    const byItem = savedProducts?.find((product) => product.item === row.item);
    return field === "model" ? (byItem?.model ?? "") : (byItem?.installed ?? "");
  });
}

function loadDiagramMarkersFromSaved(
  saved: InstallConfirmationData | null | undefined,
): DiagramMarker[] {
  if (!saved?.diagramMarkers?.length) return [];
  return saved.diagramMarkers.filter(
    (marker): marker is DiagramMarker =>
      Boolean(marker) &&
      typeof marker.id === "string" &&
      isDiagramMarkerType(marker.type) &&
      typeof marker.x === "number" &&
      typeof marker.y === "number",
  );
}

function buildFormStateFromCustomer(
  customer: CreatedCustomer,
  productRows: ProductRow[],
): InstallFormState {
  const saved = customer.installConfirmation;
  if (!saved) {
    return {
      constructionMethod: "",
      deliveryNotes: customer.memo ?? "",
      ddns: "",
      models: productRows.map(() => ""),
      installedQtys: productRows.map(() => ""),
      termsConfirmed: false,
      designerName: "",
      designerPhone: "",
      salesDealerName: customer.salesDealerName ?? "",
      contractorSign: "",
      installerName: "",
      diagramMarkers: [],
    };
  }

  return {
    constructionMethod: saved.constructionMethod ?? "",
    deliveryNotes: saved.deliveryNotes ?? customer.memo ?? "",
    ddns: saved.ddns ?? "",
    models: mergeProductField(productRows, saved.products, "model"),
    installedQtys: mergeProductField(productRows, saved.products, "installed"),
    termsConfirmed: saved.termsConfirmed ?? false,
    designerName: saved.designerName ?? "",
    designerPhone: saved.designerPhone ?? "",
    salesDealerName: saved.salesDealerName ?? customer.salesDealerName ?? "",
    contractorSign: saved.contractorSign ?? "",
    installerName: saved.installerName ?? "",
    diagramMarkers: loadDiagramMarkersFromSaved(saved),
  };
}

function clampDiagramPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function createDiagramMarker(
  type: DiagramMarkerType,
  x: number,
  y: number,
): DiagramMarker {
  return {
    id: crypto.randomUUID(),
    type,
    x: clampDiagramPercent(x),
    y: clampDiagramPercent(y),
  };
}

function DiagramMarkerIcon({ type }: { type: DiagramMarkerType }) {
  const className = `install-confirmation-diagram-icon install-confirmation-diagram-icon--${type}`;
  if (type === "dvr") {
    return <span className={className}>DVR</span>;
  }
  if (type === "monitor") {
    return <span className={className}>MON</span>;
  }
  if (type === "router") {
    return <span className={className}>AP</span>;
  }
  if (type === "kiosk") {
    return <span className={className}>K</span>;
  }
  return <span className={className} />;
}

function getDiagramPositionFromPointer(
  canvas: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return { x: 50, y: 50 };
  return {
    x: clampDiagramPercent(((clientX - rect.left) / rect.width) * 100),
    y: clampDiagramPercent(((clientY - rect.top) / rect.height) * 100),
  };
}

function syncClonedFormState(source: HTMLElement, clone: HTMLElement) {
  const sourceFields = source.querySelectorAll("input, textarea, select");
  const cloneFields = clone.querySelectorAll("input, textarea, select");

  cloneFields.forEach((cloneField, index) => {
    const sourceField = sourceFields[index];
    if (!sourceField) return;

    if (
      sourceField instanceof HTMLTextAreaElement &&
      cloneField instanceof HTMLTextAreaElement
    ) {
      cloneField.value = sourceField.value;
      return;
    }

    if (
      sourceField instanceof HTMLInputElement &&
      cloneField instanceof HTMLInputElement
    ) {
      cloneField.checked = sourceField.checked;
      cloneField.value = sourceField.value;
    }
  });
}

const DOWNLOAD_CARD_ORDER = [
  ".install-confirmation-card--info",
  ".install-confirmation-card--delivery",
  ".install-confirmation-card--product",
  ".install-confirmation-card--diagram",
  ".install-confirmation-card--terms",
] as const;

function flattenInstallConfirmationLayoutForDownload(form: HTMLElement) {
  const layout = form.querySelector(".install-confirmation-layout");
  if (!layout) return;

  DOWNLOAD_CARD_ORDER.forEach((selector) => {
    const card = form.querySelector(selector);
    if (card) layout.appendChild(card);
  });

  layout.querySelectorAll(".install-confirmation-column").forEach((column) => {
    column.remove();
  });
}

function prepareInstallConfirmationDownloadClone(
  source: HTMLDivElement,
): HTMLDivElement {
  const clone = source.cloneNode(true) as HTMLDivElement;
  clone.querySelectorAll(".install-confirmation-no-print").forEach((element) => {
    element.remove();
  });
  syncClonedFormState(source, clone);
  flattenInstallConfirmationLayoutForDownload(clone);
  return clone;
}

interface InstallConfirmationFormProps {
  customer: CreatedCustomer;
  onSave: () => void;
  onCustomerUpdated?: (customer: CreatedCustomer) => void;
}

export function InstallConfirmationForm({
  customer,
  onSave,
  onCustomerUpdated,
}: InstallConfirmationFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const diagramCanvasRef = useRef<HTMLDivElement>(null);
  const draggingMarkerIdRef = useRef<string | null>(null);
  const productRows = useMemo(() => buildProductRows(customer), [customer]);
  const productSummary = useMemo(
    () => formatProductSummary(productRows),
    [productRows],
  );
  const initialFormState = useMemo(
    () => buildFormStateFromCustomer(customer, productRows),
    [customer, productRows],
  );
  const [constructionMethod, setConstructionMethod] = useState(
    initialFormState.constructionMethod,
  );
  const [deliveryNotes, setDeliveryNotes] = useState(
    initialFormState.deliveryNotes,
  );
  const [ddns, setDdns] = useState(initialFormState.ddns);
  const [installedQtys, setInstalledQtys] = useState(
    initialFormState.installedQtys,
  );
  const [models, setModels] = useState(initialFormState.models);
  const [termsConfirmed, setTermsConfirmed] = useState(
    initialFormState.termsConfirmed,
  );
  const [designerName, setDesignerName] = useState(initialFormState.designerName);
  const [designerPhone, setDesignerPhone] = useState(initialFormState.designerPhone);
  const [salesDealerName, setSalesDealerName] = useState(
    initialFormState.salesDealerName,
  );
  const [contractorSign, setContractorSign] = useState(
    initialFormState.contractorSign,
  );
  const [installerName, setInstallerName] = useState(
    initialFormState.installerName,
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [diagramMarkers, setDiagramMarkers] = useState(
    initialFormState.diagramMarkers,
  );
  const [isDiagramDragOver, setIsDiagramDragOver] = useState(false);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);

  useEffect(() => {
    const nextState = buildFormStateFromCustomer(customer, productRows);
    setConstructionMethod(nextState.constructionMethod);
    setDeliveryNotes(nextState.deliveryNotes);
    setDdns(nextState.ddns);
    setInstalledQtys(nextState.installedQtys);
    setModels(nextState.models);
    setTermsConfirmed(nextState.termsConfirmed);
    setDesignerName(nextState.designerName);
    setDesignerPhone(nextState.designerPhone);
    setSalesDealerName(nextState.salesDealerName);
    setContractorSign(nextState.contractorSign);
    setInstallerName(nextState.installerName);
    setDiagramMarkers(nextState.diagramMarkers);
  }, [customer, productRows]);

  function buildInstallConfirmationPayload(): InstallConfirmationData {
    return {
      constructionMethod: constructionMethod || null,
      ddns: ddns || null,
      deliveryNotes: deliveryNotes || null,
      products: productRows.map((row, index) => ({
        item: row.item,
        model: models[index] ?? "",
        requested: row.requested,
        installed: installedQtys[index] ?? "",
      })),
      diagramMarkers,
      termsConfirmed,
      salesDealerName: salesDealerName || null,
      designerName: designerName || null,
      designerPhone: designerPhone || null,
      contractorSign: contractorSign || null,
      installerName: installerName || null,
    };
  }

  async function persistInstallConfirmation() {
    const updated = await updateCustomerInstallConfirmation(
      customer.id,
      buildInstallConfirmationPayload(),
    );
    onCustomerUpdated?.(updated);
    return updated;
  }

  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await persistInstallConfirmation();
      onSave();
    } catch (error) {
      console.error("Failed to save install confirmation", error);
      window.alert("설치확인서 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function addDiagramMarker(type: DiagramMarkerType, clientX: number, clientY: number) {
    const canvas = diagramCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getDiagramPositionFromPointer(canvas, clientX, clientY);
    setDiagramMarkers((current) => [...current, createDiagramMarker(type, x, y)]);
  }

  function moveDiagramMarker(id: string, clientX: number, clientY: number) {
    const canvas = diagramCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getDiagramPositionFromPointer(canvas, clientX, clientY);
    setDiagramMarkers((current) =>
      current.map((marker) =>
        marker.id === id ? { ...marker, x, y } : marker,
      ),
    );
  }

  function handleDiagramToolDragStart(
    event: React.DragEvent<HTMLDivElement>,
    type: DiagramMarkerType,
  ) {
    event.dataTransfer.setData(DIAGRAM_MARKER_DRAG_TYPE, type);
    event.dataTransfer.effectAllowed = "copy";
  }

  function handleDiagramCanvasDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDiagramDragOver(true);
  }

  function handleDiagramCanvasDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDiagramDragOver(false);
  }

  function handleDiagramCanvasDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDiagramDragOver(false);
    const type = event.dataTransfer.getData(DIAGRAM_MARKER_DRAG_TYPE);
    if (!isDiagramMarkerType(type)) return;
    addDiagramMarker(type, event.clientX, event.clientY);
  }

  function handleDiagramMarkerDelete(
    event: React.MouseEvent<HTMLButtonElement>,
    markerId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();
    removeDiagramMarker(markerId);
  }

  function handleDiagramMarkerPointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    markerId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingMarkerIdRef.current = markerId;
    setDraggingMarkerId(markerId);
  }

  function handleDiagramMarkerPointerMove(
    event: React.PointerEvent<HTMLButtonElement>,
    markerId: string,
  ) {
    if (draggingMarkerIdRef.current !== markerId) return;
    moveDiagramMarker(markerId, event.clientX, event.clientY);
  }

  function handleDiagramMarkerPointerUp(
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    draggingMarkerIdRef.current = null;
    setDraggingMarkerId(null);
  }

  function removeDiagramMarker(markerId: string) {
    setDiagramMarkers((current) =>
      current.filter((marker) => marker.id !== markerId),
    );
  }

  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  async function handlePrint() {
    if (!formRef.current || isSaving) return;

    setIsSaving(true);
    try {
      await persistInstallConfirmation();

      const portal = document.createElement("div");
      portal.className = "install-confirmation-print-portal";
      portal.setAttribute("aria-hidden", "true");

      const shell = document.createElement("div");
      shell.className = "install-confirmation-print-shell";

      const clone = formRef.current.cloneNode(true) as HTMLDivElement;
      clone
        .querySelectorAll(".install-confirmation-no-print")
        .forEach((element) => {
          element.remove();
        });

      shell.appendChild(clone);
      portal.appendChild(shell);
      document.body.appendChild(portal);
      document.body.classList.add("is-printing-install-confirm");

      const cleanup = () => {
        document.body.classList.remove("is-printing-install-confirm");
        portal.remove();
      };

      const prepareAndPrint = () => {
        window.print();
      };

      window.addEventListener("afterprint", cleanup, { once: true });
      requestAnimationFrame(() => requestAnimationFrame(prepareAndPrint));
    } catch (error) {
      console.error("Failed to print install confirmation", error);
      window.alert("출력 전 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadImage() {
    if (!formRef.current || isDownloading || isSaving) return;

    setIsDownloading(true);
    let portal: HTMLDivElement | null = null;
    try {
      await persistInstallConfirmation();

      portal = document.createElement("div");
      portal.className = "install-confirmation-capture-portal";
      portal.setAttribute("aria-hidden", "true");

      const clone = prepareInstallConfirmationDownloadClone(formRef.current);
      portal.appendChild(clone);
      document.body.appendChild(portal);
      document.body.classList.add("is-downloading-install-confirm");

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const canvas = await html2canvas(clone, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const filename = `설치확인서_${customer.installNo || customer.customerNo || customer.id}.png`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download install confirmation image", error);
      window.alert("이미지 다운로드에 실패했습니다.");
    } finally {
      portal?.remove();
      document.body.classList.remove("is-downloading-install-confirm");
      setIsDownloading(false);
    }
  }

  return (
    <div className="install-confirmation-print-shell">
      <div ref={formRef} className="install-confirmation-form">
        <div className="install-confirmation-form-header">
          <h3 className="install-confirmation-form-title">설치확인서</h3>
          <div className="install-confirmation-form-actions install-confirmation-no-print">
            <button
              type="button"
              className="contractor-info-action-btn"
              onClick={handleDownloadImage}
              disabled={isDownloading || isSaving}
            >
              {isDownloading ? "다운로드 중..." : "다운로드"}
            </button>
            <button
              type="button"
              className="contractor-info-action-btn"
              onClick={handlePrint}
              disabled={isSaving || isDownloading}
            >
              {isSaving ? "저장 중..." : "출력"}
            </button>
            <button
              type="button"
              className="contractor-info-action-btn"
              onClick={handleSave}
              disabled={isSaving || isDownloading}
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        <div className="install-confirmation-layout">
          <div className="install-confirmation-column install-confirmation-column--left">
            <section className="install-confirmation-card install-confirmation-card--info">
              <table className="install-confirmation-table install-confirmation-info-table">
                <tbody>
                  <tr>
                    <th scope="row">계약자명</th>
                    <td colSpan={2}>{displayContractorName(customer)}</td>
                    <th scope="row">설치희망일1</th>
                    <td className="install-confirmation-date-cell">
                      (일자/시간)
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">휴대전화</th>
                    <td colSpan={2}>{formatDisplayPhone(customer.mobile)}</td>
                    <th scope="row">설치희망일2</th>
                    <td className="install-confirmation-date-cell">
                      (일자/시간)
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">일반전화</th>
                    <td colSpan={2}>{formatDisplayPhone(customer.phone)}</td>
                    <th scope="row">설치희망일3</th>
                    <td className="install-confirmation-date-cell">
                      (일자/시간)
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">설치주소</th>
                    <td colSpan={4}>{formatInstallAddress(customer)}</td>
                  </tr>
                  <tr>
                    <th scope="row">시공방식</th>
                    <td colSpan={4}>
                      <div className="install-confirmation-method-options">
                        {CONSTRUCTION_METHODS.map((method) => (
                          <label
                            key={method}
                            className="install-confirmation-method-option"
                          >
                            <input
                              type="radio"
                              name={`construction-method-${customer.id}`}
                              value={method}
                              checked={constructionMethod === method}
                              onChange={() => setConstructionMethod(method)}
                            />
                            <span>{method}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">DDNS</th>
                    <td colSpan={4}>
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--full"
                        value={ddns}
                        onChange={(event) => setDdns(event.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="install-confirmation-card install-confirmation-card--delivery">
              <h4 className="install-confirmation-section-title">◆전달사항</h4>
              <textarea
                className="install-confirmation-textarea"
                rows={3}
                value={deliveryNotes}
                onChange={(event) => setDeliveryNotes(event.target.value)}
              />
            </section>

            <section className="install-confirmation-card install-confirmation-card--terms">
              <h4 className="install-confirmation-section-title">◆확인사항</h4>
              <div className="install-confirmation-terms">
                <ol className="install-confirmation-terms-list">
                  {CONFIRMATION_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
                <label className="install-confirmation-terms-confirm">
                  <span>위 모든 사항을 확인하였습니다.</span>
                  <span className="install-confirmation-terms-check">
                    (
                    <input
                      type="checkbox"
                      className="install-confirmation-checkbox"
                      checked={termsConfirmed}
                      onChange={(event) =>
                        setTermsConfirmed(event.target.checked)
                      }
                    />
                    )
                  </span>
                </label>
                <p className="install-confirmation-terms-footer">
                  본인은 위 내용을 확인하고 이해 하였으며 설치공사를 하였음을
                  확인합니다.
                </p>
              </div>

              <table className="install-confirmation-table install-confirmation-sign-table">
                <colgroup>
                  <col className="install-confirmation-sign-col-label" />
                  <col className="install-confirmation-sign-col-dealer" />
                  <col className="install-confirmation-sign-col-label" />
                  <col className="install-confirmation-sign-col-designer" />
                  <col className="install-confirmation-sign-col-label" />
                  <col className="install-confirmation-sign-col-phone" />
                </colgroup>
                <tbody>
                  <tr>
                    <th scope="row">영업/총판점</th>
                    <td className="install-confirmation-dealer-cell">
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--sign"
                        value={salesDealerName}
                        onChange={(event) =>
                          setSalesDealerName(event.target.value)
                        }
                        placeholder="영업/총판점 입력"
                      />
                    </td>
                    <th scope="row">설계사</th>
                    <td>
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--sign"
                        value={designerName}
                        onChange={(event) =>
                          setDesignerName(event.target.value)
                        }
                        placeholder="설계사명 입력"
                      />
                    </td>
                    <th scope="row">설계사HP</th>
                    <td>
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--sign"
                        value={designerPhone}
                        onChange={(event) =>
                          setDesignerPhone(event.target.value)
                        }
                        placeholder="설계사 연락처 입력"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">계약자</th>
                    <td colSpan={2} className="install-confirmation-sign-cell">
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--sign"
                        value={contractorSign}
                        onChange={(event) =>
                          setContractorSign(event.target.value)
                        }
                        placeholder="서명 / 인"
                      />
                    </td>
                    <th scope="row">설치자</th>
                    <td colSpan={2} className="install-confirmation-sign-cell">
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--sign"
                        value={installerName}
                        onChange={(event) =>
                          setInstallerName(event.target.value)
                        }
                        placeholder="서명 / 인"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="install-confirmation-supplier-line">
                {todayYear}년 {todayMonth}월 {todayDay}일&nbsp;&nbsp;공급사
                ckurity
              </p>
            </section>
          </div>

          <div className="install-confirmation-column install-confirmation-column--right">
            <section className="install-confirmation-card install-confirmation-card--product">
              <h4 className="install-confirmation-section-title">◆상품구성</h4>
              <p className="install-confirmation-product-summary">
                {productSummary || "—"}
              </p>
              <table className="install-confirmation-table install-confirmation-product-table">
                <thead>
                  <tr>
                    <th>품목</th>
                    <th>모델</th>
                    <th>의뢰 수량</th>
                    <th>설치 수량</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row, index) => (
                    <tr key={`${row.item}-${index}`}>
                      <td>{row.item}</td>
                      <td>
                        <input
                          type="text"
                          className="install-confirmation-input"
                          value={models[index] ?? ""}
                          onChange={(event) => {
                            const next = [...models];
                            next[index] = event.target.value;
                            setModels(next);
                          }}
                        />
                      </td>
                      <td className="install-confirmation-qty-cell">
                        {row.requested}
                      </td>
                      <td>
                        <input
                          type="text"
                          className="install-confirmation-input install-confirmation-input--qty"
                          value={installedQtys[index] ?? ""}
                          onChange={(event) => {
                            const next = [...installedQtys];
                            next[index] = event.target.value;
                            setInstalledQtys(next);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="install-confirmation-card install-confirmation-card--diagram">
              <h4 className="install-confirmation-section-title">◆설치도면</h4>
              <p className="install-confirmation-diagram-help install-confirmation-no-print">
                오른쪽 도형을 도면에 끌어 놓으세요. 삭제는 도형의 × 버튼 또는
                더블클릭입니다.
              </p>
              <div className="install-confirmation-diagram">
                <div
                  ref={diagramCanvasRef}
                  className={`install-confirmation-diagram-canvas${isDiagramDragOver ? " is-drag-over" : ""}`}
                  aria-label="설치도면"
                  onDragOver={handleDiagramCanvasDragOver}
                  onDragLeave={handleDiagramCanvasDragLeave}
                  onDrop={handleDiagramCanvasDrop}
                >
                  {diagramMarkers.length === 0 && (
                    <p className="install-confirmation-diagram-placeholder">
                      설치 위치를 표시하세요
                    </p>
                  )}
                  {diagramMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      className={`install-confirmation-diagram-marker${draggingMarkerId === marker.id ? " is-dragging" : ""}`}
                      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    >
                      <button
                        type="button"
                        className="install-confirmation-diagram-marker-body"
                        title="드래그로 이동"
                        onPointerDown={(event) =>
                          handleDiagramMarkerPointerDown(event, marker.id)
                        }
                        onPointerMove={(event) =>
                          handleDiagramMarkerPointerMove(event, marker.id)
                        }
                        onPointerUp={handleDiagramMarkerPointerUp}
                        onPointerCancel={handleDiagramMarkerPointerUp}
                        onDoubleClick={() => removeDiagramMarker(marker.id)}
                      >
                        <DiagramMarkerIcon type={marker.type} />
                      </button>
                      <button
                        type="button"
                        className="install-confirmation-diagram-marker-delete install-confirmation-no-print"
                        aria-label={`${DIAGRAM_TOOLS.find((tool) => tool.type === marker.type)?.label ?? "도형"} 삭제`}
                        title="삭제"
                        onClick={(event) =>
                          handleDiagramMarkerDelete(event, marker.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="install-confirmation-diagram-tools install-confirmation-no-print">
                  {DIAGRAM_TOOLS.map((tool) => (
                    <div
                      key={tool.type}
                      className="install-confirmation-diagram-tool install-confirmation-diagram-tool--draggable"
                      draggable
                      onDragStart={(event) =>
                        handleDiagramToolDragStart(event, tool.type)
                      }
                    >
                      <DiagramMarkerIcon type={tool.type} />
                      <span>{tool.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
