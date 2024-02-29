/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/record'], function(serverWidget, record) {

    function onRequest(context) {
      if (context.request.method === 'GET') {
        // Create a custom form
        var form = serverWidget.createForm({
          title: 'Automatic Return Reconciliation',
          hideNavBar: true
        });
  
        // Add buttons, header fields, and sublist fields to the form
        form.addSubmitButton({ label: 'Submit' });
        form.addButton({
          id: 'custpage_reset',
          label: 'Reset',
          functionName: 'resetForm'
        });
  
        form.addField({
          id: 'custpage_ebs_ci_rma',
          type: serverWidget.FieldType.SELECT,
          label: 'RMA',
          source: 'transaction'
        });
  
        form.addField({
          id: 'custpage_ebs_ci_customer',
          type: serverWidget.FieldType.SELECT,
          label: 'Customer',
          source: 'customer',
          displayType: serverWidget.FieldDisplayType.TEXT
        });
  
        form.addField({
          id: 'custpage_ebs_ci_subsidiary',
          type: serverWidget.FieldType.SELECT,
          label: 'Subsidiary',
          source: 'subsidiary',
          displayType: serverWidget.FieldDisplayType.TEXT
        });
  
        form.addField({
          id: 'custpage_ebs_ci_location',
          type: serverWidget.FieldType.SELECT,
          label: 'Location',
          source: 'location',
          displayType: serverWidget.FieldDisplayType.TEXT
        });
  
        form.addField({
          id: 'custpage_ebs_ci_trandate',
          type: serverWidget.FieldType.DATE,
          label: 'Transaction Date',
          displayType: serverWidget.FieldDisplayType.TEXT
        });
  
        var reconcileSublist = form.addSublist({
          id: 'custpage_ebs_ci_reconcile_sublist',
          type: serverWidget.SublistType.INLINEEDITOR,
          label: 'Serial/Lot Number Sublist'
        });
  
        reconcileSublist.addField({
          id: 'custpage_ebs_ci_recon',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'Reconcile'
        });
  
        reconcileSublist.addField({
          id: 'custpage_ebs_ci_sln',
          type: serverWidget.FieldType.SELECT,
          label: 'Serial/Lot Number',
          source: 'inventorynumber'
        });
  
        reconcileSublist.addField({
          id: 'custpage_ebs_ci_item',
          type: serverWidget.FieldType.SELECT,
          label: 'Item',
          source: 'item',
          displayType: serverWidget.FieldDisplayType.INLINE
        });
  
        reconcileSublist.addField({
          id: 'custpage_ebs_ci_quantity',
          type: serverWidget.FieldType.INTEGER,
          label: 'Quantity',
          displayType: serverWidget.FieldDisplayType.INLINE
        });
  
        reconcileSublist.addField({
          id: 'custpage_ebs_ci_rate',
          type: serverWidget.FieldType.CURRENCY,
          label: 'Rate',
          displayType: serverWidget.FieldDisplayType.NORMAL
        });
  
        context.response.writePage(form);
      } else if (context.request.method === 'POST') {
        // Process the form submission
  
        // Retrieve the submitted form data
        var rma = context.request.parameters.custpage_ebs_ci_rma;
        var subsidiary = context.request.parameters.custpage_ebs_ci_subsidiary;
        var iaAccount = context.request.parameters.custscript_ebs_ci_ia_account_man;
  
        // Create Vendor Bill for selected reconciled items
        var vendorBill = record.create({
          type: record.Type.VENDOR_BILL
        });
  
        // Set field values for the Vendor Bill
        vendorBill.setValue({
          fieldId: 'entity',
          value: 'VENDOR_ID' // Replace with the actual vendor ID
        });
  
        vendorBill.setValue({
          fieldId: 'trandate',
          value: new Date()
        });
  
        // Loop through the sublist to create line items
        var reconcileSublistData = context.request.parameters.custpage_ebs_ci_reconcile_sublist;
        for (var i = 0; i < reconcileSublistData.length; i++) {
          var reconcileLine = reconcileSublistData[i];
  
          // Add line items to the Vendor Bill
          vendorBill.selectNewLine({
            sublistId: 'item'
          });
  
          // Set field values for the line item
          vendorBill.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: reconcileLine.custpage_ebs_ciApologies, 
          });
  
          vendorBill.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: reconcileLine.custpage_ebs_ci_quantity
          });
  
          vendorBill.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: reconcileLine.custpage_ebs_ci_rate
          });
  
          vendorBill.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'location',
            value: reconcileLine.custpage_ebs_ci_location
          });
  
          vendorBill.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'receiptinventorynumber',
            value: reconcileLine.custpage_ebs_ci_sln
          });
  
          vendorBill.commitLine({
            sublistId: 'item'
          });
        }
  
        // Save the Vendor Bill record
        var vendorBillId = vendorBill.save();
  
        // Create Vendor Credit Record
        var vendorCredit = record.create({
          type: record.Type.VENDOR_CREDIT
        });
  
        // Set field values for the Vendor Credit
        vendorCredit.setValue({
          fieldId: 'custbody_ebs_ci_vendor_bill',
          value: vendorBillId
        });
  
        // Save the Vendor Credit record
        var vendorCreditId = vendorCredit.save();
  
        // Create Inventory Adjustment
        var inventoryAdjustment = record.create({
          type: record.Type.INVENTORY_ADJUSTMENT
        });
  
        // Set field values for the Inventory Adjustment
        inventoryAdjustment.setValue({
          fieldId: 'subsidiary',
          value: subsidiary
        });
  
        inventoryAdjustment.setValue({
          fieldId: 'account',
          value: iaAccount
        });
  
        // Loop through the sublist to create line items
        for (var i = 0; i < reconcileSublistData.length; i++) {
          var reconcileLine = reconcileSublistData[i];
  
          // Add line items to the Inventory Adjustment
          inventoryAdjustment.selectNewLine({
            sublistId: 'item'
          });
  
          // Set field values for the line item
          inventoryAdjustment.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: reconcileLine.custpage_ebs_ci_item
          });
  
          inventoryAdjustment.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: reconcileLine.custpage_ebs_ci_quantity
          });
  
          inventoryAdjustment.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: reconcileLine.custpage_ebs_ci_rate
          });
  
          inventoryAdjustment.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'location',
            value: reconcileLine.custpage_ebs_ci_location
          });
  
          inventoryAdjustment.setCurrentSublistValue({
            sublistId: 'inventorydetail',
            fieldId: 'receiptinventorynumber',
            value: reconcileLine.custpage_ebs_ci_sln
          });
  
          inventoryAdjustment.setCurrentSublistValue({
            sublistId: 'inventorydetail',
            fieldId: 'quantity',
            value: 1 // Set quantity to 1 for serial or total quantity for lot
          });
  
          inventoryAdjustment.commitLine({
            sublistId: 'item'
          });
        }
  
        // Save the Inventory Adjustment record
        var inventoryAdjustmentId = inventoryAdjustment.save();
  
        // Update the Returned Reconciliation Complete field for each inventory number
        for (var i = 0; i < reconcileSublistData.length; i++) {
          var reconcileLine = reconcileSublistData[i];
          var inventoryNumberId = reconcileLine.custpage_ebs_ci_sln;
  
          // Update the Returned Reconciliation Complete field
          record.submitFields({
            type: 'inventorynumber',
            id: inventoryNumberId,
            values: {
              custitem_ebs_ci_returned_recon_complet: true
            }
          });
        }
  
        // Redirect to a success page or display a success message
        context.response.write('Reconciliation process completed successfully.');
      }
    }
  
    return {
      onRequest: onRequest
    };
  
  });