import { Page, Locator, expect } from '@playwright/test';

export class CatalogPage {
  readonly page: Page;
  readonly navCatalog: Locator;
  readonly addCategoryButton: Locator;
  readonly categoryNameInput: Locator;
  readonly saveCategoryButton: Locator;
  readonly closeCategorySheetButton: Locator;
  readonly confirmDeleteCategoryButton: Locator;
  readonly addItemButton: Locator;
  readonly outletFilterTrigger: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navCatalog = page.getByTestId('nav-catalog');
    this.addCategoryButton = page.getByTestId('add-category-button');
    this.categoryNameInput = page.getByTestId('category-name-input');
    this.saveCategoryButton = page.getByTestId('save-category-button');
    this.closeCategorySheetButton = page.getByRole('button', { name: 'Close' });
    this.confirmDeleteCategoryButton = page.getByTestId('confirm-delete-category-button');
    this.addItemButton = page.getByTestId('add-item-button');
    this.outletFilterTrigger = page.getByTestId('outlet-filter-trigger');
    this.searchInput = page.getByPlaceholder('Search by name, SKU, category, or scan barcode...');
  }

  async waitForLoadingToFinish() {
    // Wait for the SWR load state to be gone
    const loader = this.page.getByText('Loading catalog items and categories...');
    if (await loader.isVisible()) {
      await loader.waitFor({ state: 'hidden', timeout: 15000 });
    }
  }

  async locateCategoryRow(name: string): Promise<Locator> {
    const row = this.page.locator('div.group').filter({ hasText: name }).first();
    const loadMoreButton = this.page.getByRole('button', { name: 'Load More Categories' });
    let limit = 5;
    while (limit > 0 && !(await row.isVisible())) {
      if (await loadMoreButton.isVisible()) {
        await loadMoreButton.click();
        await this.waitForLoadingToFinish();
        await this.page.waitForTimeout(500); // stability delay
      } else {
        break;
      }
      limit--;
    }
    return row;
  }

  async navigateTo() {
    await this.navCatalog.click();
    await expect(this.page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible();
    await this.waitForLoadingToFinish();
  }

  async createCategory(name: string) {
    await this.addCategoryButton.click();
    await this.categoryNameInput.fill(name);
    await this.saveCategoryButton.click();
    // Wait for Sheet to close to prevent overlay backdrop pointer-interception
    await this.page.getByRole('heading', { name: 'Add Category' }).waitFor({ state: 'hidden' });
    await this.waitForLoadingToFinish();
  }

  async openEditCategory(oldName: string) {
    const categoryRow = await this.locateCategoryRow(oldName);
    const editBtn = categoryRow.getByTestId(`edit-category-${oldName.toLowerCase().replace(/\s+/g, '-')}`).first();
    await editBtn.dispatchEvent('click');
  }

  async editCategory(oldName: string, newName: string) {
    await this.openEditCategory(oldName);
    await this.categoryNameInput.click();
    await this.categoryNameInput.fill(newName);
    await this.saveCategoryButton.click();
    // Wait for Sheet to close
    await this.page.getByRole('heading', { name: 'Edit Category' }).waitFor({ state: 'hidden' });
    await this.waitForLoadingToFinish();
  }

  async closeCategorySheet() {
    await this.closeCategorySheetButton.click();
    await this.page.getByRole('heading', { name: 'Edit Category' }).waitFor({ state: 'hidden' });
  }

  async deleteCategory(name: string) {
    const categoryRow = await this.locateCategoryRow(name);
    const deleteBtn = categoryRow.getByTestId(`delete-category-${name.toLowerCase().replace(/\s+/g, '-')}`).first();
    await deleteBtn.dispatchEvent('click');
    await this.confirmDeleteCategoryButton.click();
    // Wait for Confirmation Dialog to close
    await this.page.getByRole('heading', { name: 'Confirm Delete' }).waitFor({ state: 'hidden' });
    await this.waitForLoadingToFinish();
  }

  async openAddItemForm() {
    await this.waitForLoadingToFinish();
    await this.addItemButton.click();
  }

  async filterByOutlet(outletName: string) {
    await this.outletFilterTrigger.click();
    await this.page.getByRole('option', { name: outletName }).click();
    await this.waitForLoadingToFinish();
  }

  async searchFor(query: string) {
    await this.searchInput.click();
    await this.searchInput.fill(query);
  }

  getItemRow(name: string): Locator {
    return this.page.locator('tr').filter({ hasText: name }).first();
  }

  async editItem(name: string) {
    const row = this.getItemRow(name);
    await row.getByTitle('Edit').click();
  }

  async cloneItem(name: string) {
    const row = this.getItemRow(name);
    await row.getByTitle('Clone').click();
  }

  async deleteItem(name: string) {
    const row = this.getItemRow(name);
    await row.getByTitle('Delete').click();
    
    // Click Delete in the confirmation dialog
    const confirmDialog = this.page.getByRole('dialog').filter({ hasText: 'Delete Menu Item' });
    await confirmDialog.getByRole('button', { name: 'Delete' }).click();
    await confirmDialog.waitFor({ state: 'hidden' });
    await this.waitForLoadingToFinish();
  }

  async expectToast(message: string) {
    await expect(this.page.locator('li[data-sonner-toast]').filter({ hasText: message }).first()).toBeVisible();
  }
}
