export interface SubscriptionQrMenu {
  outletId: string;
  outletName: string;
  menuUrl: string;
  qrImageUrl: string;
}

export interface SubscriptionQrMenuResponse {
  data: SubscriptionQrMenu;
}
