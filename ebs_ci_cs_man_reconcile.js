/**
 * Client Script for the custom record.
 */
define([], function () {

  /**
   * Field Change event for the custpage_ebs_ci_rma field.
   */
  function fieldChangeScript(context) {
    try {
      var currentRecord = context.currentRecord;
      var rmaValue = currentRecord.getValue({
        fieldId: 'custpage_ebs_ci_rma'
      });

      // Execute search to obtain all info for serials and RMA details
      var searchFilters = [
        ['createdfrom', 'anyof', rmaValue]
      ];

      var searchColumns = [
        'custpage_ebs_ci_rma',
        'custpage_ebs_ci_customer',
        'custpage_ebs_ci_subsidiary',
        'custpage_ebs_ci_location',
        'custpage_ebs_ci_trandate',
        'custpage_ebs_ci_sln',
        'custpage_ebs_ci_item',
        'custpage_ebs_ci_quantity',
        'custpage_ebs_ci_rate'
      ];

      var searchResults = performSearch('customrecord_search_result', searchFilters, searchColumns);

      // Input returned data onto the Suitelet with the specified mappings
      if (searchResults && searchResults.length > 0) {
        var sublist = currentRecord.getSublist({
          sublistId: 'serial_lot_number_sublist'
        });

        for (var i = 0; i < searchResults.length; i++) {
          var searchResult = searchResults[i];

          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_rma',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_rma')
          });
          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_customer',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_customer')
          });
          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_subsidiary',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_subsidiary')
          });
          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_location',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_location')
          });
          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_trandate',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_trandate')
          });
          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_sln',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_sln')
          });
          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_item',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_item')
          });
          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_quantity',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_quantity')
          });
          sublist.setSublistValue({
            sublistId: 'serial_lot_number_sublist',
            fieldId: 'custpage_ebs_ci_rate',
            line: i,
            value: searchResult.getValue('custpage_ebs_ci_rate')
          });
        }
      }
    } catch (e) {
      // Handle the error
      console.error('An error occurred:', e.message);
    }
  }

  // Helper function to perform search (replace with your own implementation)
  function performSearch(recordType, filters, columns) {
    // Perform the search and return the results
    return [];
  }

  // Return the field change handler
  return {
    fieldChanged: fieldChangeScript
  };
});