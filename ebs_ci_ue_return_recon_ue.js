/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record'], function(search, record) {

    // Declare properties
    var properties = {
      inventoryassignment: 'inventoryassignment',
      issueinventorynumber: 'issueinventorynumber',
      manual_recon: 'manual_recon',
      auto_recon: 'auto_recon',
      rate: 'rate',
      custbody_ci_rma: 'custbody_ci_rma',
      custitemnumber_ebs_ci_man_recon: 'custitemnumber_ebs_ci_man_recon',
      custitemnumber_ebs_ci_auto_recon: 'custitemnumber_ebs_ci_auto_recon',
      custitemnumber_ebs_ci_return_cost: 'custitemnumber_ebs_ci_return_cost',
      custitemnumber_ebs_ci_rma: 'custitemnumber_ebs_ci_rma'
    };
  
    /**
     * Executes after a record is submitted or saved.
     * @param {Object} context - Object containing the current record and script context.
     * @param {string} context.type - The context in which the script is executed.
     * @param {Record} context.newRecord - The new record being saved.
     */
    function afterSubmit(context) {
      if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
        return;
      }
  
      var currentRecord = context.newRecord;
      var inventoryDetailSublist = currentRecord.getSublist({ sublistId: properties.inventoryassignment });
  
      for (var i = 0; i < inventoryDetailSublist.getLineCount(); i++) {
        var serialNumber = inventoryDetailSublist.getSublistValue({
          sublistId: properties.inventoryassignment,
          fieldId: properties.issueinventorynumber,
          line: i
        });
  
        if (!serialNumber) {
          continue;
        }
  
        var searchFilters = [
          search.createFilter({
            name: 'inventorynumber',
            operator: search.Operator.IS,
            values: serialNumber
          })
        ];
  
        var searchResult = search.create({
          type: 'inventorynumber',
          filters: searchFilters
        }).run().getRange({ start: 0, end: 1 });
  
        if (searchResult.length === 1) {
          var inventoryNumberRecordId = searchResult[0].id;
  
          var manualRecon = inventoryDetailSublist.getSublistValue({
            sublistId: properties.inventoryassignment,
            fieldId: properties.manual_recon,
            line: i
          });
  
          var autoRecon = inventoryDetailSublist.getSublistValue({
            sublistId: properties.inventoryassignment,
            fieldId: properties.auto_recon,
            line: i
          });
  
          record.submitFields({
            type: record.Type.INVENTORY_NUMBER,
            id: inventoryNumberRecordId,
            values: {
              [properties.custitemnumber_ebs_ci_man_recon]: manualRecon,
              [properties.custitemnumber_ebs_ci_auto_recon]: autoRecon,
              [properties.custitemnumber_ebs_ci_return_cost]: currentRecord.getValue(properties.rate),
              [properties.custitemnumber_ebs_ci_rma]: currentRecord.getValue(properties.custbody_ci_rma)
            }
          });
        }
      }
    }
  
    return {
      afterSubmit: afterSubmit
    };
  });