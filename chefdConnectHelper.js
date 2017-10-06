function ChefdConnectHelper () {
  var self = this;

  // Error handler
  this.apiError = function (message) {
    var errorObject = {
      error: true,
      message: message
    };
    return errorObject;
  };

  // Converts a NetSuite object to a simple JavaScript object
  this.convertToSimpleObject = function (nsObject, columns) {
    return columns.reduce(function(obj, col) {
      obj[col.getLabel()] = nsObject.getText(col) ? nsObject.getText(col) : nsObject.getValue(col);
      return obj;
    }, {});
  };

  this.commaSeparatedStringToArray = function (object, fields) {
    fields.forEach(function(field) {
      if (object[field]) {
        object[field] = object[field].split(',');
      }
    });
    return object;
  };

  // Removes markup from a HTML list. Returns comma separated string of the list items.
  this.cleanHtmlList = function (string) {
    string = string.replace(/\<\/li\>/g, '').replace(/\<li\>/g, ',');
    if (string[0] === ',') {
      string = string.slice(1, string.length);
    }
    return string;
  };

  // Finds product images and adds them to the variant object. Returns amended variant object.
  this.getProductImages = function (variant) {
    var imageId = variant.master_variant_id ? variant.master_variant_id : variant.netsuite_id;

    // Get the images
    var images = nlapiSearchRecord("customrecord_product_image", null, [
      ["custrecord_image_product", "is", imageId]
    ], [
      new nlobjSearchColumn('custrecord_image_sort').setLabel('type').setSort(false),
      new nlobjSearchColumn('custrecord_image_url').setLabel('url'),
      new nlobjSearchColumn('custrecord_image_alt_text').setLabel('description')
    ]);

    // Transform images to objects and clean up the "type" attribute
    images = images.map(function(image) {
      return self.convertToSimpleObject(image, image.getAllColumns());
    }).map(function(image) {
      image.type = image.type.replace(/[^A-Za-z]/g, '');
      return image;
    });

    // Add image properties to the variant object
    images.forEach(function(image) {
      switch(image.type) {
        case 'Hero':
          variant.image = image.url;
          break;
        case 'Nutritional':
          variant.nutritional_facts = image.url;
          break;
        case 'Partner':
          variant.partner_image = image.url;
          break;
        case 'Action':
          if (image.description === 'hi_res') {
            variant.hi_res_image = image.url;
          } else {
            !variant.action_images
              ? variant.action_images = [image.url]
              : variant.action_images.push(image.url);
          }
          break;
      }
    });

    return variant;
  }
}
