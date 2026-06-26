import { Page, Locator } from '@playwright/test';

export class MenuItemFormPage {
  readonly page: Page;
  readonly outletSelectTrigger: Locator;
  readonly itemNameInput: Locator;
  readonly categorySelectTrigger: Locator;
  readonly unitSelectTrigger: Locator;
  readonly linkInventoryTrigger: Locator;
  readonly pricingStrategyVariantButton: Locator;
  readonly pricingStrategyBaseButton: Locator;
  readonly addonsAccordionTrigger: Locator;
  readonly attachModifierGroupButton: Locator;
  readonly searchModifierGroupsInput: Locator;
  readonly submitItemButton: Locator;
  readonly priceInput: Locator;
  readonly quantityInput: Locator;
  readonly skuInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.outletSelectTrigger = page.getByTestId('outlet-select-trigger');
    this.itemNameInput = page.getByTestId('item-name-input');
    this.categorySelectTrigger = page.getByTestId('category-select-trigger');
    this.unitSelectTrigger = page.getByTestId('unit-select-trigger');
    this.linkInventoryTrigger = page.getByTestId('link-inventory-trigger');
    this.pricingStrategyVariantButton = page.getByTestId('pricing-strategy-variant');
    this.pricingStrategyBaseButton = page.getByTestId('pricing-strategy-base');
    this.addonsAccordionTrigger = page.getByTestId('addons-accordion-trigger');
    this.attachModifierGroupButton = page.getByTestId('attach-modifier-group-button');
    this.searchModifierGroupsInput = page.getByTestId('search-modifier-groups-input');
    this.submitItemButton = page.getByTestId('submit-item-button');
    
    // Inputs based on placeholder/labels
    this.priceInput = page.getByTestId('sell-price-input');
    this.quantityInput = page.getByTestId('quantity-input');
    this.skuInput = page.getByTestId('sku-input');
  }

  async selectOutlet(outletName: string) {
    await this.outletSelectTrigger.click();
    await this.page.getByRole('option', { name: outletName }).first().click();
  }

  async setItemType(type: 'simple' | 'composite' | 'service') {
    await this.page.getByRole('button', { name: new RegExp(type, 'i') }).click();
  }

  async fillItemName(name: string) {
    await this.itemNameInput.click();
    await this.itemNameInput.fill(name);
  }

  async fillPrice(price: string) {
    await this.priceInput.click();
    await this.priceInput.fill(price);
  }

  async fillSku(sku: string) {
    await this.skuInput.click();
    await this.skuInput.fill(sku);
  }

  async fillQuantity(qty: string) {
    await this.quantityInput.click();
    await this.quantityInput.fill(qty);
  }

  async selectCategory(categoryName: string) {
    await this.categorySelectTrigger.click();
    await this.page.getByRole('option', { name: categoryName }).first().click();
  }

  async selectSellingUnit(unitName: string) {
    await this.unitSelectTrigger.click();
    await this.page.getByRole('option', { name: unitName }).first().click();
  }

  async linkInventoryItem(itemName: string) {
    await this.linkInventoryTrigger.click();
    // Click the inventory item by its name / trigger text in the popover list
    await this.page.getByRole('button', { name: new RegExp(itemName, 'i') }).click();
  }

  async selectPricingStrategy(strategy: 'base' | 'variant' | 'open') {
    await this.page.getByTestId(`pricing-strategy-${strategy}`).click();
  }

  async addVariant() {
    await this.page.getByRole('button', { name: /Add Variant/i }).click();
  }

  async fillVariant(index: number, name: string, price: string) {
    const nameLocator = this.page.getByTestId(`variant-name-input-${index}`);
    const priceLocator = this.page.getByTestId(`variant-price-input-${index}`);

    await nameLocator.click();
    await nameLocator.fill(name);
    await priceLocator.click();
    await priceLocator.fill(price);
  }

  async expandAddons() {
    await this.addonsAccordionTrigger.click();
  }

  async openAttachModifierGroup() {
    await this.attachModifierGroupButton.click();
  }

  async focusModifierSearch() {
    await this.searchModifierGroupsInput.click();
  }

  async closeModifierGroupPopover() {
    // Robust close by pressing Escape key to dismiss the Radix popover
    await this.page.keyboard.press('Escape');
  }

  async save() {
    await this.submitItemButton.click();
    // Wait for the entire Dialog to be hidden
    await this.page.locator('[role="dialog"]').filter({ hasText: /Add Catalog Item|Edit Catalog Item|Clone Catalog Item/i }).waitFor({ state: 'hidden', timeout: 15000 });
    // Stable delay for slide-out animation to complete and backdrop overlay to detach
    await this.page.waitForTimeout(1000);
  }
}
