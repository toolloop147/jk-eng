"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { CreatedCustomer, getCustomers } from "@/lib/insApi";
import { contractProgressStageLabel } from "@/lib/contractProgressStage";
import { formatPhoneInput } from "@/lib/formatPhone";
import { PageHeader } from "../PageHeader";
import { InstallConfirmationForm } from "./InstallConfirmationForm";
import { CompletionConfirmationForm } from "./CompletionConfirmationForm";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDisplayPhone(value: string | null | undefined) {
  if (!value?.trim()) return "-";
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 9) return formatPhoneInput(digits);
  return value.trim();
}

function displayCustomerName(customer: CreatedCustomer) {
  if (customer.userType === "individual") return customer.name || "-";
  const company = customer.companyName || "-";
  const name = customer.name;
  return name ? `${company} (${name})` : company;
}

function displayAddress(customer: CreatedCustomer) {
  const parts = [customer.address, customer.addressDetail].filter(Boolean);
  return parts.length ? parts.join(" ") : "-";
}

function useConstructionMobileView() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

interface ConstructionManageMobileCardProps {
  customer: CreatedCustomer;
  isConstructionOpen: boolean;
  isCompletionOpen: boolean;
  savedMessage?: string;
  onToggleConstruction: (customerId: string) => void;
  onToggleCompletion: (customerId: string) => void;
  onConstructionSaved: () => void;
  onCompletionSaved: () => void;
  onCustomerUpdated: (customer: CreatedCustomer) => void;
}

function ConstructionManageMobileCard({
  customer,
  isConstructionOpen,
  isCompletionOpen,
  savedMessage,
  onToggleConstruction,
  onToggleCompletion,
  onConstructionSaved,
  onCompletionSaved,
  onCustomerUpdated,
}: ConstructionManageMobileCardProps) {
  return (
    <article className={`contractor-info-mobile-card${savedMessage ? " is-saved" : ""}`}>
      <div className="contractor-info-mobile-card-header">
        <p className="contractor-info-mobile-card-no">
          <span className="contractor-info-mobile-card-no-label">설치번호</span>
          <span>{customer.installNo || "-"}</span>
        </p>
        {savedMessage ? (
          <span className="contractor-info-mobile-card-saved">{savedMessage}</span>
        ) : null}
      </div>

      <dl className="contractor-info-mobile-card-fields">
        <div className="contractor-info-mobile-field">
          <dt>고객번호</dt>
          <dd>{customer.customerNo}</dd>
        </div>
        <div className="contractor-info-mobile-field">
          <dt>고객명</dt>
          <dd>{displayCustomerName(customer)}</dd>
        </div>
        <div className="contractor-info-mobile-field">
          <dt>연락처</dt>
          <dd>{formatDisplayPhone(customer.mobile || customer.phone)}</dd>
        </div>
        <div className="contractor-info-mobile-field">
          <dt>주소</dt>
          <dd>{displayAddress(customer)}</dd>
        </div>
      </dl>

      <div className="install-manage-mobile-actions">
        <span className="tl-badge install-manage-mobile-stage-badge">
          {contractProgressStageLabel(customer.progressStageCode)}
        </span>
        <button
          type="button"
          className={`install-manage-pill-btn install-manage-pill-btn--start${isConstructionOpen ? " is-active" : ""}`}
          onClick={() => onToggleConstruction(customer.id)}
        >
          {isConstructionOpen ? "닫기" : "시공"}
        </button>
        <button
          type="button"
          className={`install-manage-pill-btn install-manage-pill-btn--complete${isCompletionOpen ? " is-active" : ""}`}
          onClick={() => onToggleCompletion(customer.id)}
        >
          {isCompletionOpen ? "닫기" : "준공"}
        </button>
      </div>

      {isConstructionOpen && (
        <div className="contractor-info-mobile-edit">
          <InstallConfirmationForm
            customer={customer}
            onSave={onConstructionSaved}
            onCustomerUpdated={onCustomerUpdated}
          />
        </div>
      )}

      {isCompletionOpen && (
        <div className="contractor-info-mobile-edit">
          <CompletionConfirmationForm
            customer={customer}
            onSave={onCompletionSaved}
            onCustomerUpdated={onCustomerUpdated}
          />
        </div>
      )}
    </article>
  );
}

export function ConstructionManagePage() {
  const isMobileView = useConstructionMobileView();
  const [customers, setCustomers] = useState<CreatedCustomer[]>([]);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedConstructionId, setExpandedConstructionId] = useState<string | null>(null);
  const [expandedCompletionId, setExpandedCompletionId] = useState<string | null>(null);
  const [mobileSavedState, setMobileSavedState] = useState<{
    customerId: string;
    kind: "construction" | "completion";
  } | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCustomers({
        q: searchQuery.trim() || undefined,
      });
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시공 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!mobileSavedState) return;
    const timer = window.setTimeout(() => setMobileSavedState(null), 2000);
    return () => window.clearTimeout(timer);
  }, [mobileSavedState]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSearchQuery(query);
  }

  function toggleConstructionForm(customerId: string) {
    setExpandedCompletionId(null);
    setExpandedConstructionId((current) => (current === customerId ? null : customerId));
  }

  function toggleCompletionForm(customerId: string) {
    setExpandedConstructionId(null);
    setExpandedCompletionId((current) => (current === customerId ? null : customerId));
  }

  function renderConstructionFormRow(customer: CreatedCustomer, key: string) {
    const isConstructionOpen = expandedConstructionId === customer.id;
    const isCompletionOpen = expandedCompletionId === customer.id;

    return (
      <Fragment key={key}>
        <tr className="contractor-info-data-row border-b border-slate-100">
          <td className="install-manage-col-install-no font-medium text-slate-800">
            {customer.installNo || "-"}
          </td>
          <td className="contractor-info-col-no text-slate-600">{customer.customerNo}</td>
          <td className="contractor-info-col-name text-slate-600">
            {displayCustomerName(customer)}
          </td>
          <td className="contractor-info-col-service text-slate-600">
            {customer.serviceType || "-"}
          </td>
          <td className="contractor-info-col-mobile text-slate-600">
            {formatDisplayPhone(customer.mobile || customer.phone)}
          </td>
          <td className="contractor-info-col-address">
            <span className="contractor-info-address-text text-slate-600">
              {displayAddress(customer)}
            </span>
          </td>
          <td className="contractor-info-col-date text-slate-500">
            {formatDate(customer.createdAt)}
          </td>
          <td className="contract-manage-col-stage text-slate-600">
            <div className="install-manage-col-btn-wrap">
              <span className="tl-badge">
                {contractProgressStageLabel(customer.progressStageCode)}
              </span>
            </div>
          </td>
          <td className="install-manage-col-start text-slate-600">
            <div className="install-manage-col-btn-wrap">
              <button
                type="button"
                className={`install-manage-pill-btn install-manage-pill-btn--start${isConstructionOpen ? " is-active" : ""}`}
                onClick={() => toggleConstructionForm(customer.id)}
              >
                {isConstructionOpen ? "닫기" : "시공"}
              </button>
            </div>
          </td>
          <td className="install-manage-col-complete text-slate-600">
            <div className="install-manage-col-btn-wrap">
              <button
                type="button"
                className={`install-manage-pill-btn install-manage-pill-btn--complete${isCompletionOpen ? " is-active" : ""}`}
                onClick={() => toggleCompletionForm(customer.id)}
              >
                {isCompletionOpen ? "닫기" : "준공"}
              </button>
            </div>
          </td>
        </tr>
        {isConstructionOpen && (
          <tr className="contractor-info-edit-row">
            <td colSpan={10}>
              <InstallConfirmationForm
                customer={customer}
                onSave={() => setExpandedConstructionId(null)}
                onCustomerUpdated={(updated) =>
                  setCustomers((current) =>
                    current.map((item) =>
                      item.id === updated.id ? updated : item,
                    ),
                  )
                }
              />
            </td>
          </tr>
        )}
        {isCompletionOpen && (
          <tr className="contractor-info-edit-row">
            <td colSpan={10}>
              <CompletionConfirmationForm
                customer={customer}
                onSave={() => setExpandedCompletionId(null)}
                onCustomerUpdated={(updated) =>
                  setCustomers((current) =>
                    current.map((item) =>
                      item.id === updated.id ? updated : item,
                    ),
                  )
                }
              />
            </td>
          </tr>
        )}
      </Fragment>
    );
  }

  return (
    <>
      <PageHeader groupLabel="계약 · 설치 관리" title="설치 관리" />

      <div className="contractor-info-page contractor-info-page--construction-manage flex min-w-0 max-w-full flex-col gap-4">
        <div className="contractor-info-panel min-w-0">
          <form onSubmit={handleSearchSubmit} className="contractor-info-search">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="설치번호, 고객번호, 이름, 상호, 연락처 검색"
              className="contractor-info-search-input"
            />
            <button type="submit" className="contractor-info-search-btn">
              검색
            </button>
            {searchQuery && (
              <button
                type="button"
                className="contractor-info-search-btn contractor-info-search-btn--muted"
                onClick={() => {
                  setQuery("");
                  setSearchQuery("");
                }}
              >
                초기화
              </button>
            )}
          </form>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="contractor-info-panel min-w-0">
          {loading ? (
            <p className="px-3 py-10 text-center text-sm text-slate-500">불러오는 중...</p>
          ) : customers.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-slate-500">
              조회된 시공 건이 없습니다.
            </p>
          ) : isMobileView ? (
            <div className="contractor-info-mobile-list flex flex-col gap-3">
              {customers.map((customer) => (
                <ConstructionManageMobileCard
                  key={customer.id}
                  customer={customer}
                  isConstructionOpen={expandedConstructionId === customer.id}
                  isCompletionOpen={expandedCompletionId === customer.id}
                  savedMessage={
                    mobileSavedState?.customerId === customer.id
                      ? mobileSavedState.kind === "construction"
                        ? "시공 저장 완료"
                        : "준공 저장 완료"
                      : undefined
                  }
                  onToggleConstruction={toggleConstructionForm}
                  onToggleCompletion={toggleCompletionForm}
                  onConstructionSaved={() => {
                    setExpandedConstructionId(null);
                    setMobileSavedState({ customerId: customer.id, kind: "construction" });
                  }}
                  onCompletionSaved={() => {
                    setExpandedCompletionId(null);
                    setMobileSavedState({ customerId: customer.id, kind: "completion" });
                  }}
                  onCustomerUpdated={(updated) =>
                    setCustomers((current) =>
                      current.map((item) => (item.id === updated.id ? updated : item)),
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="contractor-info-table-wrap overflow-x-auto">
              <table className="tl-member-table contractor-info-table contractor-info-table--construction-manage text-sm">
                <colgroup>
                  <col className="install-manage-col-install-no-col" />
                  <col className="contractor-info-col-no-col" />
                  <col className="contractor-info-col-name-col" />
                  <col className="contractor-info-col-service-col" />
                  <col className="contractor-info-col-mobile-col" />
                  <col />
                  <col className="contractor-info-col-date-col" />
                  <col className="install-manage-col-stage-col" />
                  <col className="install-manage-col-start-col" />
                  <col className="install-manage-col-complete-col" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#d4ebe9] text-slate-600">
                    <th className="install-manage-col-install-no">설치번호</th>
                    <th className="contractor-info-col-no">고객번호</th>
                    <th className="contractor-info-col-name">고객명/상호</th>
                    <th className="contractor-info-col-service">서비스구분</th>
                    <th className="contractor-info-col-mobile">연락처</th>
                    <th className="contractor-info-col-address">주소</th>
                    <th className="contractor-info-col-date">접수일</th>
                    <th className="contract-manage-col-stage">진행단계</th>
                    <th className="install-manage-col-start">시공</th>
                    <th className="install-manage-col-complete">준공</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => renderConstructionFormRow(customer, customer.id))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-sm text-slate-600">
            총 {customers.length.toLocaleString("ko-KR")}건
          </div>
        </div>
      </div>
    </>
  );
}
