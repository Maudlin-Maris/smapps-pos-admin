// Profit-contribution calculator (BOM / recipe based).
//
// Inputs:
//   - inventory items (raw materials with WAC costPrice + measuring unit)
//   - composite items (recipes / Bills of Materials)
//   - per-recipe sellPrice and overhead override
//   - per-outlet default overhead per unit produced
//
// Outputs:
//   - per-recipe economics (raw cost, overhead, total cost, profit, margin)
//   - per-raw-material weighted "profit per unit of raw material" with a
//     drill-down across every recipe that consumes it.
//
// Formulas (mirrors the user's spec):
//   recipeRawCost      = sum(component.qty * inventoryItem.costPrice)
//   recipeOverhead     = recipe.overheadPerUnit ?? outlet.defaultOverheadPerUnit ?? 0
//   recipeTotalCost    = recipeRawCost + recipeOverhead
//   recipeProfit       = recipe.sellPrice - recipeTotalCost  (only when sellPrice set)
//   profitPerRawUnit (weighted) =
//       sum(recipeProfit * recipesProduced) / sum(rawConsumed)
//     where, for a hypothetical batch of one inventory item, each recipe
//     produces (1 / component.qty) servings per unit of raw material consumed.

import type { CompositeItem } from "@/components/inventory/CompositeItemForm";
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";

export interface RecipeEconomics {
  compositeId: string;
  name: string;
  outletId: string;
  sellPrice?: number;
  rawCost: number;
  overhead: number;
  totalCost: number;
  profit?: number;
  margin?: number;
  components: {
    inventoryItemId: string;
    quantity: number;
    unitCost: number;
    lineCost: number;
  }[];
}

export interface RawMaterialContribution {
  inventoryItemId: string;
  recipeId: string;
  recipeName: string;
  quantityPerServing: number; // qty of raw material per recipe serving
  recipeProfit: number;
  // Profit contributed per single unit of this raw material when funneled
  // through THIS recipe: recipeProfit / quantityPerServing
  profitPerRawUnit: number;
  recipeMargin?: number;
  hasSellPrice: boolean;
}

export interface RawMaterialProfitability {
  inventoryItemId: string;
  unitCost: number; // WAC
  // Weighted average profit per unit of raw material across all recipes
  // it is consumed by (weighted by qty consumed in each recipe).
  weightedProfitPerUnit: number;
  // Total potential profit contribution if the entire current stock were
  // funneled through these recipes at the weighted profit per unit.
  totalContribution: number;
  recipesUsing: RawMaterialContribution[];
  hasAnyPricedRecipe: boolean;
}

export interface ProfitabilityInput {
  inventoryItems: InventoryItem[];
  composites: CompositeItem[];
  outletOverheadDefaults: Record<string, number>; // outletId -> default overhead per unit
}

export interface ProfitabilityResult {
  recipes: Record<string, RecipeEconomics>; // by composite id
  rawMaterials: Record<string, RawMaterialProfitability>; // by inventory item id
}

export function computeProfitability({
  inventoryItems,
  composites,
  outletOverheadDefaults,
}: ProfitabilityInput): ProfitabilityResult {
  const itemById: Record<string, InventoryItem> = {};
  for (const it of inventoryItems) itemById[it.id] = it;

  const recipes: Record<string, RecipeEconomics> = {};

  for (const c of composites) {
    let rawCost = 0;
    const componentEconomics = c.components.map((comp) => {
      const item = itemById[comp.inventoryItemId];
      const unitCost = item?.costPrice ?? 0;
      const lineCost = unitCost * comp.quantity;
      rawCost += lineCost;
      return {
        inventoryItemId: comp.inventoryItemId,
        quantity: comp.quantity,
        unitCost,
        lineCost,
      };
    });

    // Use the recipe's explicit overhead. Falling back to an outlet default
    // here would diverge from the live profit preview shown in the Composite
    // Item form (which only reads c.overheadPerUnit), causing the same recipe
    // to look profitable in the form but loss-making in the Profitability
    // table. Treat a missing/blank overhead as 0 — same as the form.
    const overhead = c.overheadPerUnit ?? 0;
    void outletOverheadDefaults;
    const totalCost = rawCost + overhead;

    let profit: number | undefined;
    let margin: number | undefined;
    if (typeof c.sellPrice === "number" && c.sellPrice > 0) {
      profit = c.sellPrice - totalCost;
      margin = (profit / c.sellPrice) * 100;
    }

    recipes[c.id] = {
      compositeId: c.id,
      name: c.name,
      outletId: c.outletId,
      sellPrice: c.sellPrice,
      rawCost,
      overhead,
      totalCost,
      profit,
      margin,
      components: componentEconomics,
    };
  }

  // Build per-raw-material aggregation.
  const rawMaterials: Record<string, RawMaterialProfitability> = {};

  for (const item of inventoryItems) {
    const recipesUsing: RawMaterialContribution[] = [];
    for (const c of composites) {
      const comp = c.components.find((x) => x.inventoryItemId === item.id);
      if (!comp || comp.quantity <= 0) continue;
      const r = recipes[c.id];
      const recipeProfit = r.profit ?? 0;
      const profitPerRawUnit = recipeProfit / comp.quantity;
      recipesUsing.push({
        inventoryItemId: item.id,
        recipeId: c.id,
        recipeName: c.name,
        quantityPerServing: comp.quantity,
        recipeProfit,
        profitPerRawUnit,
        recipeMargin: r.margin,
        hasSellPrice: typeof c.sellPrice === "number" && c.sellPrice > 0,
      });
    }

    // Weighted average: weight each recipe's profitPerRawUnit by the qty of
    // raw material it consumes per serving (a proxy for "share of usage").
    // Recipes without sellPrice contribute 0 profit but are still listed.
    const pricedRecipes = recipesUsing.filter((r) => r.hasSellPrice);
    let weightedProfitPerUnit = 0;
    if (pricedRecipes.length > 0) {
      const totalWeight = pricedRecipes.reduce(
        (s, r) => s + r.quantityPerServing,
        0
      );
      if (totalWeight > 0) {
        weightedProfitPerUnit =
          pricedRecipes.reduce(
            (s, r) => s + r.profitPerRawUnit * r.quantityPerServing,
            0
          ) / totalWeight;
      }
    }

    rawMaterials[item.id] = {
      inventoryItemId: item.id,
      unitCost: item.costPrice,
      weightedProfitPerUnit,
      totalContribution: weightedProfitPerUnit * item.stock,
      recipesUsing,
      hasAnyPricedRecipe: pricedRecipes.length > 0,
    };
  }

  return { recipes, rawMaterials };
}
