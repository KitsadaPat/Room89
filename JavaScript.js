function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.customerName,
    data.contact,
    data.items,
    data.total,
    data.note
  ]);

  return ContentService.createTextOutput("Success");
}