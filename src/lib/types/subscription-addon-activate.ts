export interface ActivateAddonResponse {
  data: {
    key: string;
    active: boolean;
    bundled: boolean;
    billedFrom: string;
  };
}
