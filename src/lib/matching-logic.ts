export interface Requirement {
  id: string;
  optional: boolean;
}

export function isRecipeEligible(
  requiredIngredients: Requirement[],
  requiredUtensils: Requirement[],
  pantryIds: Set<string>,
  utensilIds: Set<string>
) {
  const missingIngredients = requiredIngredients.filter(
    (item) => !item.optional && !pantryIds.has(item.id)
  );
  const missingUtensils = requiredUtensils.filter(
    (item) => !item.optional && !utensilIds.has(item.id)
  );

  return {
    eligible: missingIngredients.length === 0 && missingUtensils.length === 0,
    missingIngredients,
    missingUtensils
  };
}
