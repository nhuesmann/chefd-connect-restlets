function getProductDetail(datain) {
  var helper = new ChefdConnectHelper();
  var sku = datain.sku;

  if (!sku) return helper.apiError('Missing sku query parameter. Please provide a sku.');

  var fieldsToMakeArrays = [
    'recipe_category',
    'equipment',
    'allergens',
    'wine_pairings',
    'beer_pairings',
    'from_your_pantry',
    'ingredients',
    'type_of_meal'
  ];

  var propsToDelete = [
    'master_variant_id'
  ];

  // Run the search
  var variant = nlapiSearchRecord("kititem", null, [
    [ "type", "anyof", "Kit" ],
    "AND",
    [ "custitem_chefd_item_type", "anyof", "1" ],
    "AND",
    ["name", "is", sku]
  ], [
    new nlobjSearchColumn("internalid").setLabel('netsuite_id'),
    new nlobjSearchColumn("custitem_shopify_product_id").setLabel('shopify_product_id'),
    new nlobjSearchColumn("custitem_shopify_variant_id").setLabel('shopify_variant_id'),
    new nlobjSearchColumn("itemid").setLabel('variant_sku'),
    new nlobjSearchColumn("custitem_recipe_name").setLabel('title'),
    new nlobjSearchColumn("custitem_recipe_subtitle").setLabel('subtitle'),
    new nlobjSearchColumn("salesdescription").setLabel('description'),
    new nlobjSearchColumn("custitem_type_of_meal").setLabel('type_of_meal'),
    new nlobjSearchColumn("custitem_cuisine").setLabel('cuisine'),
    new nlobjSearchColumn("custitem_number_of_servings").setLabel('num_of_servings'),
    new nlobjSearchColumn("custitem_calories_per_serving").setLabel('calories_per_serving'),
    new nlobjSearchColumn("custitem_cooking_time").setLabel('cook_time_in_minutes'),
    new nlobjSearchColumn("custitem_skill_level").setLabel('skill_level'),
    new nlobjSearchColumn("custitem_spice_level").setLabel('spice_level'),
    new nlobjSearchColumn("custitem_proteins").setLabel('proteins'),
    new nlobjSearchColumn("custitem_allergens").setLabel('allergens'),
    new nlobjSearchColumn("custitem_wine_pairings").setLabel('wine_pairings'),
    new nlobjSearchColumn("custitem_beer_pairings").setLabel('beer_pairings'),
    new nlobjSearchColumn("custitem_customer_ingredient_list").setLabel('ingredients'),
    new nlobjSearchColumn("custitem_equipment").setLabel('equipment'),
    new nlobjSearchColumn("custitem_extra_ingredients_needed").setLabel('from_your_pantry'),
    new nlobjSearchColumn("custitem_recipe_category").setLabel('recipe_category'),
    new nlobjSearchColumn("custitem_shopify_preorder_start_date").setLabel('preorder_start'),
    new nlobjSearchColumn("custitem_shopify_preorder_end_date").setLabel('preorder_end'),
    new nlobjSearchColumn("internalid", "CUSTITEM_MASTER_VARIANT").setLabel('master_variant_id')
  ]);

  if (!variant) return helper.apiError('No results for provided sku. Please ensure you typed the sku correctly.');

  variant = helper.convertToSimpleObject(variant[0], variant[0].getAllColumns());
  variant = helper.getProductImages(variant);

  // Get rid of HTML tags in the ingredients list
  variant.ingredients = helper.cleanHtmlList(variant.ingredients);

  variant = helper.commaSeparatedStringToArray(variant, fieldsToMakeArrays);

  propsToDelete.forEach(function(prop) {
    delete variant[prop];
  });

  var responseObj = {
    error: false,
    variant: variant
  };

  return responseObj;
}
