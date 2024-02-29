/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record'],

function(search, record) {
  function getInputData() {
    // Retrieve the Saved Search ID from the script parameter
    var searchId = runtime.getCurrentScript().getParameter({
      name: 'custscript_ebs_ci_rtr_search'
    });

    // Load the Saved Search
    var savedSearch = search.load({
      id: searchId
    });

    // Execute the Saved Search and return the results
    return savedSearch.run();
  }

  function map(context) {
    // Retrieve the search result record
    var searchResult = JSON.parse(context.value);

    // Extract the necessary data from the search result
    var rma = searchResult.getValue({
      name: 'rma'
    });
    var vendor = searchResult.getValue({
      name: 'vendor',
      join: 'item'
    });
    var item = searchResult.getValue({
      name: 'item',
      join: 'item'
    });
    var quantity = searchResult.getValue({
      name: 'quantity',
      join: 'item'
    });
    var rate = searchResult.getValue({
      name: 'rate',
      join: 'item'
    });
    var location = searchResult.getValue({
      name: 'location',
      join: 'item'
    });
    var serialNumber = searchResult.getValue({
      name: 'receiptinventorynumber',
      join: 'inventorydetail'
    });

    // Create a Vendor Credit record
    var vendorCredit = record.create({
      type: record.Type.VENDOR_CREDIT
    });

    // Set the field values on the Vendor Credit record
    vendorCredit.setValue({
      fieldId: 'entity',
      value: vendor
    });
    vendorCredit.setValue({
      fieldId: 'trandate',
      value: new Date()
    });
    vendorCredit.selectNewLine({
      sublistId: 'item'
    });
    vendorCredit.setCurrentSublistValue({
      sublistId: 'item',
      fieldId: 'item',
      value: item
    });
    vendorCredit.setCurrentSublistValue({
      sublistId: 'item',
      fieldId: 'quantity',
      value: quantity
    });
    vendorCredit.setCurrentSublistValue({
      sublistId: 'item',
      fieldId: 'rate',
      value: rate
    });
    vendorCredit.setCurrentSublistValue({
      sublistId: 'item',
      fieldId: 'location',
      value: location
    });
    vendorCredit.commitLine({
      sublistId: 'item'
    });

    // Save the Vendor Credit record
    var vendorCreditId = vendorCredit.save();

    // Emit the RMA and Vendor Credit ID as the key-value pair
    context.write({
      key: rma,
      value: vendorCreditId
    });
  }

  function reduce(context) {
    // Retrieve the RMA and Vendor Credit ID from the key-value pair
    var rma = context.key;
    var vendorCreditId = context.values[0];

    // Load the Vendor Credit record
    var vendorCredit = record.load({
      type: record.Type.VENDOR_CREDIT,
      id: vendorCreditId
    });

    // Create an Inventory Adjustment record
    var inventoryAdjustment = record.create({
      type: record.Type.INVENTORY_ADJUSTMENT
    });

    // Set the field values on the Inventory Adjustment record
    inventoryAdjustment.setValue({
      fieldId: 'subsidiary',
      value: vendorCredit.getValue('subsidiary')
    });
    inventoryAdjustment.setValue({
      fieldId: 'account',
      value: runtime.getCurrentScript().getParameter({
        name: 'custscript_ebs_ci_ia_account'
      })
    });
    inventoryAdjustment.selectNewLine({
      sublistId: 'inventory'
    });
    inventoryAdjustment.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'item',
      value: vendorCredit.getCurrentSublistValue('item')
    });
    inventoryAdjustment.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'quantity',
      value: vendorCredit.getCurrentSublistValue('quantity')
    });
    inventoryAdjustment.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'rate',
      value: vendorCredit.getCurrentSublistValue('rate')
    });
    inventoryAdjustment.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'location',
      value: vendorCredit.getCurrentSublistValue('location')
    });
    inventoryAdjustment.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'receiptinventorynumber',
value: vendorCredit.getCurrentSublistValue('receiptinventorynumber')
    });
    inventoryAdjustment.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'adjustqtyby',
      value: 1
    });
    inventoryAdjustment.commitLine({
      sublistId: 'inventory'
    });

    // Save the Inventory Adjustment record
    var inventoryAdjustmentId = inventoryAdjustment.save();

    // Mark the Returned Reconciliation Complete field as TRUE on each inventory number
    var inventoryDetail = vendorCredit.getSublistSubrecord({
      sublistId: 'item',
      fieldId: 'inventorydetail',
      line: 0
    });
    var numLines = inventoryDetail.getLineCount({
      sublistId: 'inventoryassignment'
    });
    for (var i = 0; i < numLines; i++) {
      inventoryDetail.setSublistValue({
        sublistId: 'inventoryassignment',
        fieldId: 'custitemnumber_ebs_ci_returned_recon_complet',
        line: i,
        value: true
      });
    }
    inventoryDetail.save();

    // Emit the RMA and Inventory Adjustment ID as the key-value pair
    context.write({
      key: rma,
      value: inventoryAdjustmentId
    });
  }

  function summarize(summary) {
    // Log the number of key-value pairs processed
    log.audit({
      title: 'Summary',
      details: 'Processed ' + summary.mapSummary.count + ' key-value pairs.'
    });
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
  };
});