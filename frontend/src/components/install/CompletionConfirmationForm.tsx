"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import html2canvas from "html2canvas";
import type {
  CompletionPhoto,
  CreatedCustomer,
  InstallCompletionData,
} from "@/lib/insApi";
import {
  deleteCustomerCompletionPhoto,
  fetchCustomerCompletionPhoto,
  updateCustomerInstallCompletion,
  uploadCustomerCompletionPhoto,
} from "@/lib/insApi";
import { formatPhoneInput } from "@/lib/formatPhone";

const COMPLETION_ITEMS = [
  "계약된 장비가 모두 설치 완료되었음을 확인하였습니다.",
  "설치 장비의 정상 동작을 확인하였습니다.",
  "고객에게 사용방법을 충분히 설명하였습니다.",
  "설치 현장을 정리·정돈하였습니다.",
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

function formatUploadedAt(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CompletionPhotoPreview({
  customerId,
  photo,
}: {
  customerId: string;
  photo: CompletionPhoto;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    fetchCustomerCompletionPhoto(customerId, photo.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [customerId, photo.id]);

  if (!src) {
    return <span className="install-confirmation-photo-thumb-placeholder">—</span>;
  }

  return (
    <a
      className="install-confirmation-photo-thumb-link"
      href={src}
      target="_blank"
      rel="noreferrer"
    >
      <img
        src={src}
        alt={photo.fileName}
        className="install-confirmation-photo-thumb"
      />
    </a>
  );
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
      const qty = row.installed.trim() || row.requested.trim();
      return qty ? `${row.item} ${qty}` : row.item;
    })
    .join(" · ");
}

function todayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

interface CompletionFormState {
  completionDate: string;
  completionNotes: string;
  constructionCompany: string;
  constructionWorker: string;
  salesDealerName: string;
  models: string[];
  installedQtys: string[];
  termsConfirmed: boolean;
  contractorSign: string;
  inspectorSign: string;
}

function mergeProductField(
  productRows: ProductRow[],
  savedProducts: InstallCompletionData["products"] | undefined,
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

function mergeProductFieldFromInstall(
  productRows: ProductRow[],
  installProducts:
    | Array<{
        item: string;
        model: string;
        requested: string;
        installed: string;
      }>
    | undefined,
  field: "model" | "installed",
) {
  if (!installProducts?.length) {
    return productRows.map(() => "");
  }
  return productRows.map((row) => {
    const match = installProducts.find((product) => product.item === row.item);
    if (!match) return "";
    return field === "model" ? match.model : match.installed;
  });
}

function buildFormStateFromCustomer(
  customer: CreatedCustomer,
  productRows: ProductRow[],
): CompletionFormState {
  const saved = customer.installCompletion;
  const installSaved = customer.installConfirmation;

  if (!saved) {
    const installModels = mergeProductFieldFromInstall(
      productRows,
      installSaved?.products,
      "model",
    );
    const installInstalled = mergeProductFieldFromInstall(
      productRows,
      installSaved?.products,
      "installed",
    );

    return {
      completionDate: todayInputValue(),
      completionNotes: "",
      constructionCompany: "",
      constructionWorker: installSaved?.installerName ?? "",
      salesDealerName: customer.salesDealerName ?? "",
      models: installModels,
      installedQtys: installInstalled,
      termsConfirmed: false,
      contractorSign: installSaved?.contractorSign ?? "",
      inspectorSign: "",
    };
  }

  return {
    completionDate: saved.completionDate ?? todayInputValue(),
    completionNotes: saved.completionNotes ?? "",
    constructionCompany: saved.constructionCompany ?? "",
    constructionWorker: saved.constructionWorker ?? "",
    salesDealerName: saved.salesDealerName ?? customer.salesDealerName ?? "",
    models: mergeProductField(productRows, saved.products, "model"),
    installedQtys: mergeProductField(productRows, saved.products, "installed"),
    termsConfirmed: saved.termsConfirmed ?? false,
    contractorSign: saved.contractorSign ?? "",
    inspectorSign: saved.inspectorSign ?? "",
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
  ".install-confirmation-card--product",
  ".install-confirmation-card--delivery",
  ".install-confirmation-card--photos",
  ".install-confirmation-card--construction",
  ".install-confirmation-card--terms",
] as const;

function flattenCompletionLayoutForDownload(form: HTMLElement) {
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

function prepareCompletionDownloadClone(source: HTMLDivElement): HTMLDivElement {
  const clone = source.cloneNode(true) as HTMLDivElement;
  clone.querySelectorAll(".install-confirmation-no-print").forEach((element) => {
    element.remove();
  });
  syncClonedFormState(source, clone);
  flattenCompletionLayoutForDownload(clone);
  return clone;
}

interface CompletionConfirmationFormProps {
  customer: CreatedCustomer;
  onSave: () => void;
  onCustomerUpdated?: (customer: CreatedCustomer) => void;
}

export function CompletionConfirmationForm({
  customer,
  onSave,
  onCustomerUpdated,
}: CompletionConfirmationFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const productRows = useMemo(() => buildProductRows(customer), [customer]);
  const initialFormState = useMemo(
    () => buildFormStateFromCustomer(customer, productRows),
    [customer, productRows],
  );
  const [completionDate, setCompletionDate] = useState(
    initialFormState.completionDate,
  );
  const [completionNotes, setCompletionNotes] = useState(
    initialFormState.completionNotes,
  );
  const [constructionCompany, setConstructionCompany] = useState(
    initialFormState.constructionCompany,
  );
  const [constructionWorker, setConstructionWorker] = useState(
    initialFormState.constructionWorker,
  );
  const [salesDealerName, setSalesDealerName] = useState(
    initialFormState.salesDealerName,
  );
  const [models, setModels] = useState(initialFormState.models);
  const [installedQtys, setInstalledQtys] = useState(
    initialFormState.installedQtys,
  );
  const [termsConfirmed, setTermsConfirmed] = useState(
    initialFormState.termsConfirmed,
  );
  const [contractorSign, setContractorSign] = useState(
    initialFormState.contractorSign,
  );
  const [inspectorSign, setInspectorSign] = useState(
    initialFormState.inspectorSign,
  );
  const [completionPhotos, setCompletionPhotos] = useState<CompletionPhoto[]>(
    customer.installCompletion?.completionPhotos ?? [],
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  useEffect(() => {
    const nextState = buildFormStateFromCustomer(customer, productRows);
    setCompletionDate(nextState.completionDate);
    setCompletionNotes(nextState.completionNotes);
    setConstructionCompany(nextState.constructionCompany);
    setConstructionWorker(nextState.constructionWorker);
    setSalesDealerName(nextState.salesDealerName);
    setModels(nextState.models);
    setInstalledQtys(nextState.installedQtys);
    setTermsConfirmed(nextState.termsConfirmed);
    setContractorSign(nextState.contractorSign);
    setInspectorSign(nextState.inspectorSign);
    setCompletionPhotos(customer.installCompletion?.completionPhotos ?? []);
  }, [customer, productRows]);

  const displayProductSummary = useMemo(
    () =>
      formatProductSummary(
        productRows.map((row, index) => ({
          ...row,
          installed: installedQtys[index] ?? "",
        })),
      ),
    [productRows, installedQtys],
  );

  function buildCompletionPayload(): InstallCompletionData {
    return {
      completionDate: completionDate || null,
      completionNotes: completionNotes || null,
      constructionCompany: constructionCompany || null,
      constructionWorker: constructionWorker || null,
      salesDealerName: salesDealerName || null,
      products: productRows.map((row, index) => ({
        item: row.item,
        model: models[index] ?? "",
        requested: row.requested,
        installed: installedQtys[index] ?? "",
      })),
      termsConfirmed,
      contractorSign: contractorSign || null,
      inspectorSign: inspectorSign || null,
      completionPhotos,
    };
  }

  async function persistCompletion() {
    const updated = await updateCustomerInstallCompletion(
      customer.id,
      buildCompletionPayload(),
    );
    onCustomerUpdated?.(updated);
    return updated;
  }

  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await persistCompletion();
      onSave();
    } catch (error) {
      console.error("Failed to save completion confirmation", error);
      window.alert("준공확인서 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length || isUploadingPhotos) return;

    setIsUploadingPhotos(true);
    try {
      let latestCustomer = customer;
      for (const file of Array.from(files)) {
        latestCustomer = await uploadCustomerCompletionPhoto(customer.id, file);
      }
      onCustomerUpdated?.(latestCustomer);
    } catch (error) {
      console.error("Failed to upload completion photos", error);
      window.alert("준공사진 업로드에 실패했습니다.");
    } finally {
      setIsUploadingPhotos(false);
      event.target.value = "";
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (isUploadingPhotos || isSaving) return;
    if (!window.confirm("선택한 준공사진을 삭제하시겠습니까?")) return;

    setIsUploadingPhotos(true);
    try {
      const updated = await deleteCustomerCompletionPhoto(customer.id, photoId);
      onCustomerUpdated?.(updated);
    } catch (error) {
      console.error("Failed to delete completion photo", error);
      window.alert("준공사진 삭제에 실패했습니다.");
    } finally {
      setIsUploadingPhotos(false);
    }
  }

  async function handlePrint() {
    if (!formRef.current || isSaving) return;

    setIsSaving(true);
    try {
      await persistCompletion();

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

      window.addEventListener("afterprint", cleanup, { once: true });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          window.print();
        }),
      );
    } catch (error) {
      console.error("Failed to print completion confirmation", error);
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
      await persistCompletion();

      portal = document.createElement("div");
      portal.className = "install-confirmation-capture-portal";
      portal.setAttribute("aria-hidden", "true");

      const clone = prepareCompletionDownloadClone(formRef.current);
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
      const filename = `준공확인서_${customer.installNo || customer.customerNo || customer.id}.png`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download completion confirmation image", error);
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
          <h3 className="install-confirmation-form-title">준공확인서</h3>
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
              <dl className="install-confirmation-info-mobile-fields">
                <div className="contractor-info-mobile-field">
                  <dt>계약자명</dt>
                  <dd>{displayContractorName(customer)}</dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>설치번호</dt>
                  <dd>{customer.installNo || "-"}</dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>휴대전화</dt>
                  <dd>{formatDisplayPhone(customer.mobile) || "-"}</dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>서비스구분</dt>
                  <dd>{customer.serviceType || "-"}</dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>일반전화</dt>
                  <dd>{formatDisplayPhone(customer.phone) || "-"}</dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>준공일</dt>
                  <dd>
                    <input
                      type="date"
                      className="install-confirmation-input install-confirmation-input--date"
                      value={completionDate}
                      onChange={(event) => setCompletionDate(event.target.value)}
                    />
                  </dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>설치주소</dt>
                  <dd>{formatInstallAddress(customer)}</dd>
                </div>
              </dl>

              <table className="install-confirmation-table install-confirmation-info-table">
                <tbody>
                  <tr>
                    <th scope="row">계약자명</th>
                    <td colSpan={2}>{displayContractorName(customer)}</td>
                    <th scope="row">설치번호</th>
                    <td>{customer.installNo || "-"}</td>
                  </tr>
                  <tr>
                    <th scope="row">휴대전화</th>
                    <td colSpan={2}>{formatDisplayPhone(customer.mobile)}</td>
                    <th scope="row">서비스구분</th>
                    <td>{customer.serviceType || "-"}</td>
                  </tr>
                  <tr>
                    <th scope="row">일반전화</th>
                    <td colSpan={2}>{formatDisplayPhone(customer.phone)}</td>
                    <th scope="row">준공일</th>
                    <td>
                      <input
                        type="date"
                        className="install-confirmation-input install-confirmation-input--date"
                        value={completionDate}
                        onChange={(event) => setCompletionDate(event.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">설치주소</th>
                    <td colSpan={4}>{formatInstallAddress(customer)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="install-confirmation-card install-confirmation-card--product">
              <h4 className="install-confirmation-section-title">◆준공상품구성</h4>
              <p className="install-confirmation-product-summary">
                {displayProductSummary || "—"}
              </p>
              <table className="install-confirmation-table install-confirmation-product-table install-confirmation-product-table--completion">
                <thead>
                  <tr>
                    <th>품목</th>
                    <th>모델</th>
                    <th>의뢰 수량</th>
                    <th>준공 수량</th>
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

            <section className="install-confirmation-card install-confirmation-card--terms">
              <h4 className="install-confirmation-section-title">◆확인사항</h4>
              <div className="install-confirmation-terms">
                <ol className="install-confirmation-terms-list">
                  {COMPLETION_ITEMS.map((item) => (
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
                  본인은 위 내용을 확인하고 준공하였음을 확인합니다.
                </p>
              </div>

              <dl className="install-confirmation-sign-mobile-fields">
                <div className="contractor-info-mobile-field">
                  <dt>영업/총판점</dt>
                  <dd>
                    <input
                      type="text"
                      className="install-confirmation-input install-confirmation-input--sign"
                      value={salesDealerName}
                      onChange={(event) => setSalesDealerName(event.target.value)}
                      placeholder="영업/총판점 입력"
                    />
                  </dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>계약자</dt>
                  <dd>
                    <input
                      type="text"
                      className="install-confirmation-input install-confirmation-input--sign"
                      value={contractorSign}
                      onChange={(event) => setContractorSign(event.target.value)}
                      placeholder="서명 / 인"
                    />
                  </dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>확인자</dt>
                  <dd>
                    <input
                      type="text"
                      className="install-confirmation-input install-confirmation-input--sign"
                      value={inspectorSign}
                      onChange={(event) => setInspectorSign(event.target.value)}
                      placeholder="서명 / 인"
                    />
                  </dd>
                </div>
              </dl>

              <table className="install-confirmation-table install-confirmation-sign-table">
                <colgroup>
                  <col className="install-confirmation-sign-col-label" />
                  <col className="install-confirmation-sign-col-dealer" />
                  <col className="install-confirmation-sign-col-label" />
                  <col />
                  <col className="install-confirmation-sign-col-label" />
                  <col />
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
                    <th scope="row">계약자</th>
                    <td colSpan={3} className="install-confirmation-sign-cell">
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
                  </tr>
                  <tr>
                    <th scope="row">확인자</th>
                    <td colSpan={5} className="install-confirmation-sign-cell">
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--sign"
                        value={inspectorSign}
                        onChange={(event) =>
                          setInspectorSign(event.target.value)
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
            <section className="install-confirmation-card install-confirmation-card--delivery">
              <h4 className="install-confirmation-section-title">◆준공내용</h4>
              <textarea
                className="install-confirmation-textarea"
                rows={4}
                value={completionNotes}
                onChange={(event) => setCompletionNotes(event.target.value)}
                placeholder="준공 내용 및 특이사항을 입력하세요"
              />
            </section>

            <section className="install-confirmation-card install-confirmation-card--photos">
              <div className="install-confirmation-photo-header">
                <h4 className="install-confirmation-section-title">◆준공사진</h4>
                <div className="install-confirmation-photo-upload install-confirmation-no-print">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="install-confirmation-photo-input"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhotos || isSaving}
                  />
                  <button
                    type="button"
                    className="contractor-info-action-btn"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhotos || isSaving}
                  >
                    {isUploadingPhotos ? "업로드 중..." : "사진 업로드"}
                  </button>
                </div>
              </div>
              <table className="install-confirmation-table install-confirmation-photo-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>미리보기</th>
                    <th>파일명</th>
                    <th>업로드일</th>
                    <th className="install-confirmation-no-print">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {completionPhotos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="install-confirmation-photo-empty">
                        등록된 준공사진이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    completionPhotos.map((photo, index) => (
                      <tr key={photo.id}>
                        <td className="install-confirmation-photo-no">{index + 1}</td>
                        <td>
                          <CompletionPhotoPreview
                            customerId={customer.id}
                            photo={photo}
                          />
                        </td>
                        <td className="install-confirmation-photo-name">
                          {photo.fileName}
                        </td>
                        <td className="install-confirmation-photo-date">
                          {formatUploadedAt(photo.uploadedAt)}
                        </td>
                        <td className="install-confirmation-no-print">
                          <button
                            type="button"
                            className="contractor-info-action-btn install-confirmation-photo-delete-btn"
                            onClick={() => handleDeletePhoto(photo.id)}
                            disabled={isUploadingPhotos || isSaving}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>

            <section className="install-confirmation-card install-confirmation-card--construction">
              <h4 className="install-confirmation-section-title">◆시공정보</h4>
              <dl className="install-confirmation-info-mobile-fields">
                <div className="contractor-info-mobile-field">
                  <dt>시공업체</dt>
                  <dd>
                    <input
                      type="text"
                      className="install-confirmation-input install-confirmation-input--full"
                      value={constructionCompany}
                      onChange={(event) =>
                        setConstructionCompany(event.target.value)
                      }
                      placeholder="시공업체명 입력"
                    />
                  </dd>
                </div>
                <div className="contractor-info-mobile-field">
                  <dt>시공자</dt>
                  <dd>
                    <input
                      type="text"
                      className="install-confirmation-input install-confirmation-input--full"
                      value={constructionWorker}
                      onChange={(event) =>
                        setConstructionWorker(event.target.value)
                      }
                      placeholder="시공자명 입력"
                    />
                  </dd>
                </div>
              </dl>
              <table className="install-confirmation-table install-confirmation-info-table">
                <tbody>
                  <tr>
                    <th scope="row">시공업체</th>
                    <td>
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--full"
                        value={constructionCompany}
                        onChange={(event) =>
                          setConstructionCompany(event.target.value)
                        }
                        placeholder="시공업체명 입력"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">시공자</th>
                    <td>
                      <input
                        type="text"
                        className="install-confirmation-input install-confirmation-input--full"
                        value={constructionWorker}
                        onChange={(event) =>
                          setConstructionWorker(event.target.value)
                        }
                        placeholder="시공자명 입력"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
