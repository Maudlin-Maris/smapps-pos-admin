export type VoidCodeType = "item" | "order";

export interface VoidCodesResponse {
  global: Record<VoidCodeType, string>;
  byOutlet: Record<string, Partial<Record<VoidCodeType, string>>>;
  overrideCounts: Record<string, number>;
}

export interface UpdateVoidCodePayload {
  type: VoidCodeType;
  code: string;
  outletId?: string | null;
}

export interface UpdateVoidCodeResponse {
  type: VoidCodeType;
  scope: "global" | "outlet";
  outletId?: string | null;
  message: string;
  effective: {
    code: string;
  };
}

export interface DeleteVoidCodeOverrideResponse {
  type: VoidCodeType;
  outletId: string;
  scope: string;
  message: string;
}
