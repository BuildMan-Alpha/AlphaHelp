# Helper::GoogleSheets Class

---

## Get Data By Sheet and optional range

### GetSheetRaw as C(sheetname  as C[, range  as C]) 

Get the raw JSON array of arrays for the sheet and optional range.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.GetSheetRaw("customers")
= [
    [
      "firstname",
      "lastname",
    ],
    [
      "john",
      "public"
    ],
    [
      "sam",
      "spade"
    ],
  ]
```

### GetSheetJson as C(sheetname  as C[, columnNames  as C[, range  as C]])  

Get the JSON array of objects for the sheet and optional range - if column names are not supplied, then the first row of the range is assumed to contain the column names.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.GetSheetJSON("customers","A2:C2")
= [
    {
        "firstname": "john",
        "lastname": "public"
    },
    {
        "firstname": "sam",
        "lastname": "spade"
    }
]
```

### GetSheetText as C(sheetname  as C[, separator  as C[, range  as C]])

Get range as crlf delimited lines of delimited text defaulting to comma separated if to separator specified.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
?  gs.GetSheetText("customers","","") 
firstname,lastname
john,public
sam,spade

```

---

## Get Data By Named Range

### GetNamedRangeRaw as C(namedrange  as C) 

Get Spreadsheet cells using a named range.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
?  gs.GetNamedRangeRaw("HISCORE")
= [
    [
      400
    ]
  ]

```

### GetNamedRangeJson as C(namedrange  as C[, columnNames  as C])  

Get the JSON array of objects for named range - if column names are not supplied, then the first row of the range is assumed to contain the column names.	

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
?  gs.GetNamedRangeJson("HISCORE","score")
= [{"score" : 400}]
```

### GetNamedRangeText as C(namedrange  as C[, separator  as C])  

Get named range as crlf delimited lines of delimited text defaulting to comma separated if to separator specified.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
?  gs.GetNamedRangeText("HISCORE")
= 400
```

---

## Update Sheet Cell Values

### UpdateSheetRaw as L(sheetname  as C,values  as C[, range  as C])

Update a sheet using a raw JSON Array or arrays (at optional range / default to A1 if unspecified)

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.UpdateSheetRaw("customers",<<%JSON%
[
    [
      "jane",
      "doe"
    ]
  ]
%JSON%,"B1:B1")
```

### UpdateSheetJSON as L(sheetname  as C,values  as C[, columnNames  as C[, range  as C]])  

Update a sheet using JSON array of objects, arranged using the supplied columnnames.  If column names are not supplied, then the first record is used to generate the column names.
```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.UpdateSheetRaw("customers",<<%JSON%
[
    {
     "firstname" : "jane",
     "lastname" : "doe"
    }
  ]
%JSON%,"firstname,lastname","B1:B1")
```

### UpdateSheetText as L(sheetname  as C,values  as C[, separator  as C[, range  as C]])  

Update a sheet using a delimited text and an optional range.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.UpdateSheetRaw("customers","jane|doe", "|","B1:B1")
```

---

### GetNamedRanges as C([ details  as L])

Get Named Ranges defined for SpreadSheet, setitng details to .t. returns the current range associated with the name

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.GetNamedRanges()
HISCORE
FIELD_HEADINGS
```

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.GetNamedRanges(.t.)
HISCORE=scoreboard!B9
FIELD_HEADINGS=Orders!A1:E2
```