function getProductInventory(datain) {
  var helper = new ChefdConnectHelper();
  var sku = datain.sku;

  if (!sku) return helper.apiError('Missing sku query parameter. Please provide a sku.');

  var variant_inventory = nlapiSearchRecord('kititem', null, [
    [ 'type', 'anyof', 'Kit' ],
    'AND',
    [ 'custitem_chefd_item_type', 'anyof', '1' ],
    'AND',
    ['name', 'is', sku]
  ], [
    new nlobjSearchColumn('custrecord_item_loc_location', 'CUSTRECORD_ITEM_LOC_ITEM').setLabel('location'),
    new nlobjSearchColumn('custrecord_item_loc_recipe_qoh', 'CUSTRECORD_ITEM_LOC_ITEM').setLabel('quantity_on_hand')
  ]);

  if (!variant_inventory) return helper.apiError('No results for provided sku. Please ensure you typed the sku correctly.');

  variant_inventory = variant_inventory.map(function(location) {
    return helper.convertToSimpleObject(location, location.getAllColumns());
  });

  var responseObj = {
    error: false,
    variant_inventory: variant_inventory
  };

  return responseObj;
}
