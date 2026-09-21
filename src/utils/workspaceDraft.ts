import { MaterialInclusionFlags } from "../types/pricing";

export interface WorkspaceDraft {
  customPaintingUrl: string | null;
  customPaintingFile: string;
  widthInput: string;
  heightInput: string;
  customFrameUrl: string | null;
  customFrameFile: string;
  frameWidthInput: string;
  matWidthInput: string;
  customOuterFrameUrl: string | null;
  customOuterFrameFile: string;
  outerFrameWidthInput: string;
  outerFrameLayoutMode: string;
  middleMatWidthInput: string;
  innerMatColor: string;
  outerMatColor: string;
  deliveryMethod: "store" | "shipping";
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  selectedInnerProfileId: string;
  selectedOuterProfileId: string;
  inclusionFlags: MaterialInclusionFlags;
  orderNumber: string;
  activeOrderId: string | null;
  customOverridePrice: number | null;
  timestamp: number;
}

const DRAFT_KEY = "nakka_active_workspace_draft";

export function loadWorkspaceDraft(): WorkspaceDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as WorkspaceDraft;
  } catch (err) {
    console.warn("Could not load workspace draft:", err);
    return null;
  }
}

export function saveWorkspaceDraft(draft: WorkspaceDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
}

export function clearWorkspaceDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
