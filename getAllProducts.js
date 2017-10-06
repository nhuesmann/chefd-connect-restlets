function getAllProducts (datain) {
  var helper = new ChefdConnectHelper();

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
    'shopify_product_id',
    'master_variant_num_of_servings',
    'master_variant_price',
    'master_variant_netsuite_id',
    'master_variant_shopify_variant_id',
    'other_variant_sku',
    'other_variant_num_of_servings',
    'other_variant_price',
    'other_variant_netsuite_id',
    'other_variant_shopify_variant_id',
  ];

  var productSearchId = nlapiGetContext().getSetting('SCRIPT', 'custscript_get_products_saved_search');
  var productResults = getAllSearchResults('item', productSearchId);
  var productColumns = productResults[0].getAllColumns();

  var imageSearchId = nlapiGetContext().getSetting('SCRIPT', 'custscript_all_images_saved_search');
  var imageResults = getAllSearchResults('customrecord_product_image', imageSearchId);
  var imageColumns = imageResults[0].getAllColumns();
  var images = imageResults.map(function(image) {
    image = helper.convertToSimpleObject(image, imageColumns);
    image.type = image.type.replace(/[^A-Za-z]/g, '');
    return image;
  });

  var imageMap = createImageMap(images);

  var products = productResults.map(function(product) {
    product = helper.convertToSimpleObject(product, productColumns);
    for (var prop in imageMap[product.product_sku]) {
      if (imageMap[product.product_sku].hasOwnProperty(prop)) {
        product[prop] = imageMap[product.product_sku][prop];
      }
    }

    product.ingredients = helper.cleanHtmlList(product.ingredients);
    product = helper.commaSeparatedStringToArray(product, fieldsToMakeArrays);

    product.variants = [
      {
        'variant_sku': product.product_sku,
        'num_of_servings': product.master_variant_num_of_servings,
        'variant_title': product.type_of_meal[0] + ' for ' + product.master_variant_num_of_servings,
        'price': product.master_variant_price,
        'netsuite_id': product.master_variant_netsuite_id,
        'shopify_product_id': product.shopify_product_id,
        'shopify_variant_id': product.master_variant_shopify_variant_id
      }
    ];

    if (product.other_variant_sku) {
      product.variants.push({
        'variant_sku': product.other_variant_sku,
        'num_of_servings': product.other_variant_num_of_servings,
        'variant_title': product.type_of_meal[0] + ' for ' + product.other_variant_num_of_servings,
        'price': product.other_variant_price,
        'netsuite_id': product.other_variant_netsuite_id,
        'shopify_product_id': product.shopify_product_id,
        'shopify_variant_id': product.other_variant_shopify_variant_id
      });
    }

    product.product_sku = product.product_sku.replace(/[.]\d$/g, '');

    propsToDelete.forEach(function(prop) {
      delete product[prop];
    });

    return product;
  });

  var responseObj = {
    error: false,
    products: products
  };

  return responseObj;
}

function createImageMap(images) {
  var imageMap = {};

  images.forEach(function(image) {
    if (!imageMap[image.product_sku]) {
      imageMap[image.product_sku] = {};
    }

    switch(image.type) {
      case 'Hero':
        imageMap[image.product_sku].image = image.url;
        break;
      case 'Nutritional':
        imageMap[image.product_sku].nutritional_facts = image.url;
        break;
      case 'Partner':
        imageMap[image.product_sku].partner_image = image.url;
        break;
      case 'Action':
        if (image.description === 'hi_res') {
          imageMap[image.product_sku].hi_res_image = image.url;
        } else {
          !imageMap[image.product_sku].action_images
            ? imageMap[image.product_sku].action_images = [image.url]
            : imageMap[image.product_sku].action_images.push(image.url);
        }
        break;
    }
  });

  return imageMap;
}

function getAllSearchResults(type, id) {
  var search = nlapiLoadSearch(type, id);
  var resultsSet = search.runSearch();
  var results = [];
  var start, end, slice;
  do {
    start = results.length;
    end = results.length + 1000;
    slice = resultsSet.getResults(start, end);
    results = results.concat(slice);
  } while (slice.length == 1000);

  return results;
}
