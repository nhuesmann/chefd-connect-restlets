function getIdsBySku (datain) {
  var helper = new ChefdConnectHelper();
  var skus = datain.skus;

  if (!skus) return helper.apiError('Missing skus query parameter. Please provide at least one sku.');

  var skuFilter = [];
  skus.split(',').forEach(function(sku, index) {
    if (index !== 0) {
      skuFilter.push('OR');
    }
    skuFilter.push(['name', 'is', sku]);
  });

  var filters = [
    ['type', 'anyof', 'Kit'],
    'AND',
    ['custitem_chefd_item_type', 'anyof', '1'],
    'AND',
    skuFilter
  ];

  var columns = [
    new nlobjSearchColumn('itemid'),
    new nlobjSearchColumn('custitem_shopify_product_id'),
    new nlobjSearchColumn('custitem_shopify_variant_id')
  ];

  var results = nlapiSearchRecord('item', null, filters, columns);

  if (!results) return helper.apiError('No results for provided sku(s). Please ensure you typed the sku(s) correctly.');

  var responseObj = {};
  responseObj.products = results.map(function(result) {
    return {
      sku: result.getValue('itemid'),
      internalId: result.getId(),
      shopifyProductId: result.getValue('custitem_shopify_product_id'),
      shopifyVariantId: result.getValue('custitem_shopify_variant_id')
    };
  });

  return responseObj;
}
