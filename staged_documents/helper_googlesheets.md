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

```
?  gs.GetNamedRangeText("HISCORE")
= 400
```

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